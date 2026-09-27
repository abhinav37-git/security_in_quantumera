package main

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/x509"
	"crypto/x509/pkix"
	"database/sql"
	"encoding/asn1"
	"encoding/json"
	"encoding/pem"
	"encoding/hex"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	_ "github.com/lib/pq"
	"quantum_pqc/shared/crypto"
)

type ScanJob struct {
	ID          string     `json:"id"`
	TargetType  string     `json:"target_type"`
	TargetURL   string     `json:"target_url"`
	Status      string     `json:"status"`
	CreatedAt   time.Time  `json:"created_at"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`
}

type Finding struct {
	ID          string `json:"id"`
	ScanID      string `json:"scan_id"`
	Severity    string `json:"severity"`
	RuleID      string `json:"rule_id"`
	FilePath    string `json:"file_path"`
	LineNo      int    `json:"line_no"`
	Algorithm   string `json:"algorithm"`
	Description string `json:"description"`
	Remediation string `json:"remediation"`
}

type Certificate struct {
	ID            string     `json:"id"`
	ScanID        string     `json:"scan_id"`
	Endpoint      string     `json:"endpoint"`
	Subject       string     `json:"subject"`
	Issuer        string     `json:"issuer"`
	Algorithm     string     `json:"algorithm"`
	KeyBits       int        `json:"key_bits"`
	Expiry        *time.Time `json:"expiry"`
	PQHybrid      bool       `json:"pq_hybrid"`
	CNSACompliant bool       `json:"cnsa_compliant"`
}

type IssuedCertificate struct {
	ID                 string    `json:"id"`
	CommonName         string    `json:"common_name"`
	SerialNumber       string    `json:"serial_number"`
	Issuer             string    `json:"issuer"`
	SignatureAlgorithm string    `json:"signature_algorithm"`
	Revoked            bool      `json:"revoked"`
	PEMBlock           string    `json:"pem_block"`
	CreatedAt          time.Time `json:"created_at"`
}

type SignedArtifact struct {
	ID           string    `json:"id"`
	ArtifactName string    `json:"artifact_name"`
	Signature    string    `json:"signature"`
	PublicKey    string    `json:"public_key"`
	Status       string    `json:"status"`
	CreatedAt    time.Time `json:"created_at"`
}

var (
	db *sql.DB
	mu sync.Mutex

	caPrivateKeyECDSA *ecdsa.PrivateKey
	caCertificatePEM  []byte
	caCertECDSA       *x509.Certificate

	// ML-DSA CA
	caPrivateKeyMLDSA []byte
	caPublicKeyMLDSA  []byte

	// LMS CA
	caPrivateKeyLMS []byte
	caPublicKeyLMS  []byte

	caInitOnce sync.Once
)

func main() {
	// 1. Connection string
	dbHost := os.Getenv("DB_HOST")
	if dbHost == "" {
		dbHost = "localhost"
	}
	dbUser := os.Getenv("DB_USER")
	if dbUser == "" {
		dbUser = "quantumshield"
	}
	dbPass := os.Getenv("DB_PASSWORD")
	if dbPass == "" {
		dbPass = "password123"
	}
	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "quantumshield"
	}

	connStr := fmt.Sprintf("host=%s port=5432 user=%s password=%s dbname=%s sslmode=disable",
		dbHost, dbUser, dbPass, dbName)

	var err error
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Error opening database: %v", err)
	}
	defer db.Close()

	// Wait for DB to be ready
	for i := 0; i < 5; i++ {
		err = db.Ping()
		if err == nil {
			break
		}
		log.Printf("Waiting for database connection... (%d/5)", i+1)
		time.Sleep(2 * time.Second)
	}
	if err != nil {
		log.Fatalf("Could not connect to database: %v", err)
	}

	log.Println("Connected to PostgreSQL successfully.")

	// Auto run schema migrations
	runMigrations()
	initCA()

	// 2. Set up routing
	mux := http.NewServeMux()
	mux.HandleFunc("/api/scan", handleScan)
	mux.HandleFunc("/api/scan/endpoint", handleScanEndpoint)
	mux.HandleFunc("/api/scans", handleGetScans)
	mux.HandleFunc("/api/scan/", handleGetScanDetails) // /api/scan/{id} and /api/scan/{id}/cbom
	mux.HandleFunc("/api/certs", handleGetCerts)
	mux.HandleFunc("/api/proxy/telemetry", handleProxyTelemetry)
	mux.HandleFunc("/api/ca/issue", handleCAIssue)
	mux.HandleFunc("/api/ca/certs", handleCAGetCerts)
	mux.HandleFunc("/api/ca/root-keys", handleCARootKeys)
	mux.HandleFunc("/api/sign", handleCASign)
	mux.HandleFunc("/api/verify", handleCAVerify)
	mux.HandleFunc("/api/signatures", handleCAGetSignatures)

	// Add CORS headers wrapper
	corsHandler := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			if r.Method == "OPTIONS" {
				return
			}
			next.ServeHTTP(w, r)
		})
	}

	port := "8080"
	log.Printf("Starting QuantumShield API on port %s...\n", port)
	if err := http.ListenAndServe(":"+port, corsHandler(mux)); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

func runMigrations() {
	schemaPath := "apps/api/schema.sql"
	// Check if file exists, try relative to root or parent directories
	if _, err := os.Stat(schemaPath); os.IsNotExist(err) {
		schemaPath = "../api/schema.sql" // fallback when running from apps/api
	}

	content, err := os.ReadFile(schemaPath)
	if err != nil {
		log.Printf("Could not read schema migration file: %v. Skipping migration.", err)
		return
	}

	queries := strings.Split(string(content), ";")
	for _, q := range queries {
		q = strings.TrimSpace(q)
		if q == "" {
			continue
		}
		_, err := db.Exec(q)
		if err != nil {
			log.Printf("Migration query failed: %q, error: %v", q, err)
		}
	}
	log.Println("Database schemas initialized.")
}

func handleScan(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Path string `json:"path"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	if req.Path == "" {
		http.Error(w, "Path parameter is required", http.StatusBadRequest)
		return
	}

	job := ScanJob{
		ID:         uuid.New().String(),
		TargetType: "directory",
		TargetURL:  req.Path,
		Status:     "scanning",
		CreatedAt:  time.Now(),
	}

	_, err := db.Exec("INSERT INTO scans (id, target_type, target_url, status, created_at) VALUES ($1, $2, $3, $4, $5)",
		job.ID, job.TargetType, job.TargetURL, job.Status, job.CreatedAt)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Trigger async scanning execution
	go runDirectoryScan(job.ID, req.Path)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(job)
}

func handleScanEndpoint(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Host string `json:"host"`
		Port int    `json:"port"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	if req.Host == "" {
		http.Error(w, "Host parameter is required", http.StatusBadRequest)
		return
	}
	if req.Port == 0 {
		req.Port = 443
	}

	job := ScanJob{
		ID:         uuid.New().String(),
		TargetType: "endpoint",
		TargetURL:  fmt.Sprintf("%s:%d", req.Host, req.Port),
		Status:     "scanning",
		CreatedAt:  time.Now(),
	}

	_, err := db.Exec("INSERT INTO scans (id, target_type, target_url, status, created_at) VALUES ($1, $2, $3, $4, $5)",
		job.ID, job.TargetType, job.TargetURL, job.Status, job.CreatedAt)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Trigger async endpoint scanning
	go runEndpointScan(job.ID, req.Host, req.Port)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(job)
}

func handleGetScans(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, target_type, target_url, status, created_at, completed_at FROM scans ORDER BY created_at DESC")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	scans := []ScanJob{}
	for rows.Next() {
		var job ScanJob
		var completed sql.NullTime
		err := rows.Scan(&job.ID, &job.TargetType, &job.TargetURL, &job.Status, &job.CreatedAt, &completed)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if completed.Valid {
			job.CompletedAt = &completed.Time
		}
		scans = append(scans, job)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(scans)
}

func handleGetScanDetails(w http.ResponseWriter, r *http.Request) {
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 4 {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}

	scanID := pathParts[3]
	isCBOMRequest := len(pathParts) > 4 && pathParts[4] == "cbom"

	// Fetch scan details
	var job ScanJob
	var completed sql.NullTime
	err := db.QueryRow("SELECT id, target_type, target_url, status, created_at, completed_at FROM scans WHERE id = $1", scanID).
		Scan(&job.ID, &job.TargetType, &job.TargetURL, &job.Status, &job.CreatedAt, &completed)
	if err == sql.ErrNoRows {
		http.Error(w, "Scan not found", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if completed.Valid {
		job.CompletedAt = &completed.Time
	}

	// Fetch findings
	findingsRows, err := db.Query("SELECT id, scan_id, severity, rule_id, file_path, line_no, algorithm, description, remediation FROM findings WHERE scan_id = $1", scanID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer findingsRows.Close()

	findings := []Finding{}
	for findingsRows.Next() {
		var f Finding
		err := findingsRows.Scan(&f.ID, &f.ScanID, &f.Severity, &f.RuleID, &f.FilePath, &f.LineNo, &f.Algorithm, &f.Description, &f.Remediation)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		findings = append(findings, f)
	}

	// Fetch CBOM components
	componentsRows, err := db.Query("SELECT name, version, crypto_asset_type, algorithm, key_length, quantum_safe FROM cbom_components WHERE scan_id = $1", scanID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer componentsRows.Close()

	type CBOMComp struct {
		Name            string `json:"name"`
		Version         string `json:"version"`
		CryptoAssetType string `json:"crypto_asset_type"`
		Algorithm       string `json:"algorithm"`
		KeyLength       string `json:"key_length"`
		QuantumSafe     bool   `json:"quantum_safe"`
	}

	components := []CBOMComp{}
	for componentsRows.Next() {
		var c CBOMComp
		err := componentsRows.Scan(&c.Name, &c.Version, &c.CryptoAssetType, &c.Algorithm, &c.KeyLength, &c.QuantumSafe)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		components = append(components, c)
	}

	w.Header().Set("Content-Type", "application/json")
	if isCBOMRequest {
		// Output raw CycloneDX CBOM
		// We format it standard CycloneDX compliant using components gathered
		type Prop struct {
			Name  string `json:"name"`
			Value string `json:"value"`
		}
		type CDXComponent struct {
			Type             string `json:"type"`
			Name             string `json:"name"`
			Version          string `json:"version,omitempty"`
			Description      string `json:"description,omitempty"`
			CryptoProperties *struct {
				AssetType           string `json:"assetType"`
				AlgorithmProperties struct {
					ParameterSet string `json:"parameterSet"`
				} `json:"algorithmProperties"`
			} `json:"cryptoProperties,omitempty"`
			Properties []Prop `json:"properties"`
		}
		type CDXReport struct {
			BomFormat    string         `json:"bomFormat"`
			SpecVersion  string         `json:"specVersion"`
			SerialNumber string         `json:"serialNumber"`
			Version      int            `json:"version"`
			Components   []CDXComponent `json:"components"`
		}

		report := CDXReport{
			BomFormat:    "CycloneDX",
			SpecVersion:  "1.7",
			SerialNumber: fmt.Sprintf("urn:uuid:%s", uuid.New().String()),
			Version:      1,
			Components:   []CDXComponent{},
		}

		for _, comp := range components {
			cdxComp := CDXComponent{
				Type:    comp.CryptoAssetType,
				Name:    comp.Name,
				Version: comp.Version,
				Properties: []Prop{
					{Name: "quantumshield:quantum_safe", Value: fmt.Sprintf("%v", comp.QuantumSafe)},
				},
			}
			if comp.CryptoAssetType == "cryptographic-asset" {
				cdxComp.CryptoProperties = &struct {
					AssetType           string `json:"assetType"`
					AlgorithmProperties struct {
						ParameterSet string `json:"parameterSet"`
					} `json:"algorithmProperties"`
				}{
					AssetType: "algorithm",
				}
				cdxComp.CryptoProperties.AlgorithmProperties.ParameterSet = comp.KeyLength
			}
			report.Components = append(report.Components, cdxComp)
		}
		json.NewEncoder(w).Encode(report)
	} else {
		// Return standard API scan details structure
		json.NewEncoder(w).Encode(map[string]interface{}{
			"scan":       job,
			"findings":   findings,
			"components": components,
		})
	}
}

func handleGetCerts(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, scan_id, endpoint, subject, issuer, algorithm, key_bits, expiry, pq_hybrid, cnsa_compliant FROM certificates ORDER BY created_at DESC")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	certs := []Certificate{}
	for rows.Next() {
		var c Certificate
		var exp sql.NullTime
		err := rows.Scan(&c.ID, &c.ScanID, &c.Endpoint, &c.Subject, &c.Issuer, &c.Algorithm, &c.KeyBits, &exp, &c.PQHybrid, &c.CNSACompliant)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if exp.Valid {
			c.Expiry = &exp.Time
		}
		certs = append(certs, c)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(certs)
}

func runDirectoryScan(scanID, path string) {
	tmpFile := filepath.Join(os.TempDir(), fmt.Sprintf("scan-%s.json", scanID))
	defer os.Remove(tmpFile)

	// Path to scanner.py
	scannerScript := "apps/scan/scanner.py"
	if _, err := os.Stat(scannerScript); os.IsNotExist(err) {
		scannerScript = "../scan/scanner.py" // relative fallback
	}

	cmd := exec.Command("python3", scannerScript, "--path", path, "--output", tmpFile)
	outputBytes, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("Scan command failed: %v. Output: %s", err, string(outputBytes))
		db.Exec("UPDATE scans SET status = 'failed', completed_at = $1 WHERE id = $2", time.Now(), scanID)
		return
	}

	// Read CBOM output file
	content, err := os.ReadFile(tmpFile)
	if err != nil {
		log.Printf("Failed to read output file %s: %v", tmpFile, err)
		db.Exec("UPDATE scans SET status = 'failed', completed_at = $1 WHERE id = $2", time.Now(), scanID)
		return
	}

	var cbom struct {
		Components []struct {
			Type             string `json:"type"`
			Name             string `json:"name"`
			Version          string `json:"version"`
			Description      string `json:"description"`
			CryptoProperties *struct {
				AssetType           string `json:"assetType"`
				AlgorithmProperties struct {
					ParameterSet string `json:"parameterSet"`
				} `json:"algorithmProperties"`
			} `json:"cryptoProperties"`
			Properties []struct {
				Name  string `json:"name"`
				Value string `json:"value"`
			} `json:"properties"`
		} `json:"components"`
	}

	if err := json.Unmarshal(content, &cbom); err != nil {
		log.Printf("Failed to parse CBOM json: %v", err)
		db.Exec("UPDATE scans SET status = 'failed', completed_at = $1 WHERE id = $2", time.Now(), scanID)
		return
	}

	// Begin transaction to store findings
	tx, err := db.Begin()
	if err != nil {
		log.Printf("Failed to start transaction: %v", err)
		return
	}
	defer tx.Rollback()

	for _, comp := range cbom.Components {
		var severity, filePath, lineNoStr, remediation, isQSVal string
		for _, prop := range comp.Properties {
			switch prop.Name {
			case "quantumshield:severity":
				severity = prop.Value
			case "quantumshield:file_path":
				filePath = prop.Value
			case "quantumshield:line_no":
				lineNoStr = prop.Value
			case "quantumshield:remediation":
				remediation = prop.Value
			case "quantumshield:quantum_safe":
				isQSVal = prop.Value
			}
		}

		isQS := isQSVal == "true"

		// Save component representation
		var algo, keyLen string
		if comp.CryptoProperties != nil {
			algo = comp.Name
			keyLen = comp.CryptoProperties.AlgorithmProperties.ParameterSet
		}

		compId := uuid.New().String()
		_, err = tx.Exec(`INSERT INTO cbom_components (id, scan_id, name, version, crypto_asset_type, algorithm, key_length, quantum_safe) 
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
			compId, scanID, comp.Name, comp.Version, comp.Type, algo, keyLen, isQS)
		if err != nil {
			log.Printf("Failed to save cbom component: %v", err)
			return
		}

		// Save findings for cryptographic issues
		if comp.Type == "cryptographic-asset" {
			var lineNo int
			fmt.Sscanf(lineNoStr, "%d", &lineNo)

			findingId := uuid.New().String()
			_, err = tx.Exec(`INSERT INTO findings (id, scan_id, severity, rule_id, file_path, line_no, algorithm, description, remediation) 
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
				findingId, scanID, severity, "rule-"+comp.Name, filePath, lineNo, comp.Name, comp.Description, remediation)
			if err != nil {
				log.Printf("Failed to save finding: %v", err)
				return
			}
		}
	}

	err = tx.Commit()
	if err != nil {
		log.Printf("Transaction commit failed: %v", err)
		db.Exec("UPDATE scans SET status = 'failed', completed_at = $1 WHERE id = $2", time.Now(), scanID)
		return
	}

	db.Exec("UPDATE scans SET status = 'completed', completed_at = $1 WHERE id = $2", time.Now(), scanID)
	log.Printf("[Scan %s] Completed successfully.", scanID)
}

func runEndpointScan(scanID, host string, port int) {
	// Path to scanner.py
	scannerScript := "apps/scan/scanner.py"
	if _, err := os.Stat(scannerScript); os.IsNotExist(err) {
		scannerScript = "../scan/scanner.py" // relative fallback
	}

	cmd := exec.Command("python3", scannerScript, "--host", host, "--port", fmt.Sprintf("%d", port))
	outputBytes, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("Cert scan failed: %v. Output: %s", err, string(outputBytes))
		db.Exec("UPDATE scans SET status = 'failed', completed_at = $1 WHERE id = $2", time.Now(), scanID)
		return
	}

	// Parse JSON stdout from the scanner script
	// Output starts after the log line "[*] Probing TLS endpoint..."
	stdoutStr := string(outputBytes)
	jsonIdx := strings.Index(stdoutStr, "{")
	if jsonIdx == -1 {
		log.Printf("No JSON found in scanner output: %s", stdoutStr)
		db.Exec("UPDATE scans SET status = 'failed', completed_at = $1 WHERE id = $2", time.Now(), scanID)
		return
	}
	jsonStr := stdoutStr[jsonIdx:]

	var certInfo struct {
		Endpoint      string   `json:"endpoint"`
		Subject       string   `json:"subject"`
		Issuer        string   `json:"issuer"`
		Algorithm     string   `json:"algorithm"`
		KeyBits       int      `json:"key_bits"`
		ExpiryDate    string   `json:"expiry_date"`
		PQHybrid      bool     `json:"pq_hybrid"`
		CNSACompliant bool     `json:"cnsa_compliant"`
		Warnings      []string `json:"warnings"`
	}

	if err := json.Unmarshal([]byte(jsonStr), &certInfo); err != nil {
		log.Printf("Failed to unmarshal cert scanner JSON: %v", err)
		db.Exec("UPDATE scans SET status = 'failed', completed_at = $1 WHERE id = $2", time.Now(), scanID)
		return
	}

	var expiryTime time.Time
	if certInfo.ExpiryDate != "" {
		expiryTime, _ = time.Parse("2006-01-02", certInfo.ExpiryDate)
	}

	certID := uuid.New().String()
	_, err = db.Exec(`INSERT INTO certificates (id, scan_id, endpoint, subject, issuer, algorithm, key_bits, expiry, pq_hybrid, cnsa_compliant) 
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
		certID, scanID, certInfo.Endpoint, certInfo.Subject, certInfo.Issuer, certInfo.Algorithm, certInfo.KeyBits, expiryTime, certInfo.PQHybrid, certInfo.CNSACompliant)
	if err != nil {
		log.Printf("Failed to save certificate record: %v", err)
		db.Exec("UPDATE scans SET status = 'failed', completed_at = $1 WHERE id = $2", time.Now(), scanID)
		return
	}

	db.Exec("UPDATE scans SET status = 'completed', completed_at = $1 WHERE id = $2", time.Now(), scanID)
	log.Printf("[Endpoint Scan %s] Completed successfully.", scanID)
}

type Handshake struct {
	ID          string    `json:"id"`
	KeyExchange string    `json:"key_exchange"`
	HandshakeMs int       `json:"handshake_ms"`
	ClientIP    string    `json:"client_ip"`
	CreatedAt   time.Time `json:"created_at"`
}

func handleProxyTelemetry(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		var req struct {
			KeyExchange string `json:"key_exchange"`
			HandshakeMs int    `json:"handshake_ms"`
			ClientIP    string `json:"client_ip"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Bad request", http.StatusBadRequest)
			return
		}

		id := uuid.New().String()
		_, err := db.Exec("INSERT INTO handshakes (id, key_exchange, handshake_ms, client_ip) VALUES ($1, $2, $3, $4)",
			id, req.KeyExchange, req.HandshakeMs, req.ClientIP)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"recorded"}`))
		return
	} else if r.Method == http.MethodGet {
		rows, err := db.Query("SELECT id, key_exchange, handshake_ms, client_ip, created_at FROM handshakes ORDER BY created_at DESC LIMIT 100")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		handshakes := []Handshake{}
		for rows.Next() {
			var h Handshake
			err := rows.Scan(&h.ID, &h.KeyExchange, &h.HandshakeMs, &h.ClientIP, &h.CreatedAt)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			handshakes = append(handshakes, h)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(handshakes)
		return
	}
	http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
}

func initCA() {
	caInitOnce.Do(func() {
		var err error
		// 1. Generate Classical ECDSA Key
		caPrivateKeyECDSA, err = ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
		if err != nil {
			log.Fatalf("Failed to generate Root CA ECDSA key: %v", err)
		}

		serialNumberLimit := new(big.Int).Lsh(big.NewInt(1), 128)
		serialNumber, _ := rand.Int(rand.Reader, serialNumberLimit)

		caTemplate := &x509.Certificate{
			SerialNumber: serialNumber,
			Subject: pkix.Name{
				Organization: []string{"QuantumShield PKI Suite"},
				CommonName:   "QuantumShield Classical+PQ Root Authority",
			},
			NotBefore:             time.Now(),
			NotAfter:              time.Now().AddDate(10, 0, 0),
			IsCA:                  true,
			KeyUsage:              x509.KeyUsageCertSign | x509.KeyUsageCRLSign,
			BasicConstraintsValid: true,
		}

		derBytes, err := x509.CreateCertificate(rand.Reader, caTemplate, caTemplate, &caPrivateKeyECDSA.PublicKey, caPrivateKeyECDSA)
		if err != nil {
			log.Fatalf("Failed to create Root CA Certificate DER: %v", err)
		}

		caCertECDSA, err = x509.ParseCertificate(derBytes)
		if err != nil {
			log.Fatalf("Failed to parse Root CA Certificate: %v", err)
		}

		caCertificatePEM = pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: derBytes})

		// 2. Generate ML-DSA CA Key
		pair, err := crypto.GenerateMLDSAKeyPair(crypto.MLDSA87)
		if err != nil {
			log.Fatalf("Failed to generate Root CA ML-DSA key: %v", err)
		}
		caPrivateKeyMLDSA = pair.PrivateKey
		caPublicKeyMLDSA = pair.PublicKey

		// 3. Generate LMS CA Key
		pubLMS, privLMS, err := crypto.GenerateLMSKeyPair()
		if err != nil {
			log.Fatalf("Failed to generate Root CA LMS key: %v", err)
		}
		caPrivateKeyLMS = privLMS
		caPublicKeyLMS = pubLMS

		log.Println("Post-Quantum Certificate Authority initialized successfully.")
	})
}

func generateHybridCert(commonName string, signatureAlg string) (string, string, error) {
	// Generate Classical End-entity Key
	clientKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		return "", "", err
	}

	serialNumberLimit := new(big.Int).Lsh(big.NewInt(1), 128)
	serialNumber, _ := rand.Int(rand.Reader, serialNumberLimit)

	clientPubKeyBytes, err := x509.MarshalPKIXPublicKey(&clientKey.PublicKey)
	if err != nil {
		return "", "", err
	}

	// Sign a summary of client key + CN to create the PQ signature
	tbsBytes := []byte(fmt.Sprintf("%s:%x", commonName, clientPubKeyBytes))
	var pqSigBytes []byte
	var signErr error

	if signatureAlg == "ML-DSA-87" {
		pqSigBytes, signErr = crypto.SignMLDSA(crypto.MLDSA87, caPrivateKeyMLDSA, tbsBytes, nil)
		if signErr != nil {
			return "", "", fmt.Errorf("ML-DSA sign error: %w", signErr)
		}
	} else if signatureAlg == "LMS" {
		mu.Lock()
		caPrivateKeyLMS, pqSigBytes, signErr = crypto.SignLMS(caPrivateKeyLMS, tbsBytes)
		mu.Unlock()
		if signErr != nil {
			return "", "", fmt.Errorf("LMS sign error: %w", signErr)
		}
	} else {
		return "", "", fmt.Errorf("unsupported signature algorithm: %s", signatureAlg)
	}

	// Pack PQ Signature in custom ASN.1 Extension
	// OID: 1.3.6.1.4.1.58888.1
	pqExtension := pkix.Extension{
		Id:       asn1.ObjectIdentifier{1, 3, 6, 1, 4, 1, 58888, 1},
		Critical: false,
		Value:    pqSigBytes,
	}

	clientTemplate := &x509.Certificate{
		SerialNumber: serialNumber,
		Subject: pkix.Name{
			Organization: []string{"QuantumShield Issued"},
			CommonName:   commonName,
		},
		NotBefore:       time.Now(),
		NotAfter:        time.Now().AddDate(1, 0, 0),
		KeyUsage:        x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature,
		ExtraExtensions: []pkix.Extension{pqExtension},
	}

	// Sign leaf with CA classical key
	derBytes, err := x509.CreateCertificate(rand.Reader, clientTemplate, caCertECDSA, &clientKey.PublicKey, caPrivateKeyECDSA)
	if err != nil {
		return "", "", err
	}

	pemBlock := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: derBytes})
	return string(pemBlock), serialNumber.String(), nil
}

func handleCAIssue(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		CommonName         string `json:"common_name"`
		SignatureAlgorithm string `json:"signature_algorithm"` // "ML-DSA-87" or "LMS"
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	if req.CommonName == "" || (req.SignatureAlgorithm != "ML-DSA-87" && req.SignatureAlgorithm != "LMS") {
		http.Error(w, "Invalid parameters", http.StatusBadRequest)
		return
	}

	pemBlock, serialNumber, err := generateHybridCert(req.CommonName, req.SignatureAlgorithm)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to generate cert: %v", err), http.StatusInternalServerError)
		return
	}

	id := uuid.New().String()
	_, err = db.Exec(`INSERT INTO issued_certificates (id, common_name, serial_number, issuer, signature_algorithm, pem_block) 
		VALUES ($1, $2, $3, $4, $5, $6)`,
		id, req.CommonName, serialNumber, "QuantumShield Hybrid Root CA", req.SignatureAlgorithm, pemBlock)
	if err != nil {
		http.Error(w, fmt.Sprintf("Database save error: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"id":                  id,
		"common_name":         req.CommonName,
		"serial_number":       serialNumber,
		"signature_algorithm": req.SignatureAlgorithm,
		"pem_block":           pemBlock,
	})
}

func handleCAGetCerts(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	rows, err := db.Query("SELECT id, common_name, serial_number, issuer, signature_algorithm, revoked, pem_block, created_at FROM issued_certificates ORDER BY created_at DESC")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	certs := []IssuedCertificate{}
	for rows.Next() {
		var c IssuedCertificate
		err := rows.Scan(&c.ID, &c.CommonName, &c.SerialNumber, &c.Issuer, &c.SignatureAlgorithm, &c.Revoked, &c.PEMBlock, &c.CreatedAt)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		certs = append(certs, c)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(certs)
}

func handleCARootKeys(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"classical_root_pem": string(caCertificatePEM),
		"mldsa87_root_pub":   fmt.Sprintf("%x", caPublicKeyMLDSA),
		"lms_root_pub":       fmt.Sprintf("%x", caPublicKeyLMS),
	})
}

func handleCASign(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		ArtifactName string `json:"artifact_name"`
		Payload      string `json:"payload"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	if req.ArtifactName == "" || req.Payload == "" {
		http.Error(w, "Invalid parameters", http.StatusBadRequest)
		return
	}

	var signErr error
	var sigBytes []byte
	mu.Lock()
	caPrivateKeyLMS, sigBytes, signErr = crypto.SignLMS(caPrivateKeyLMS, []byte(req.Payload))
	mu.Unlock()

	if signErr != nil {
		http.Error(w, fmt.Sprintf("Signing error: %v", signErr), http.StatusInternalServerError)
		return
	}

	sigHex := fmt.Sprintf("%x", sigBytes)
	pubHex := fmt.Sprintf("%x", caPublicKeyLMS)

	id := uuid.New().String()
	_, err := db.Exec("INSERT INTO signed_artifacts (id, artifact_name, signature, public_key) VALUES ($1, $2, $3, $4)",
		id, req.ArtifactName, sigHex, pubHex)
	if err != nil {
		http.Error(w, fmt.Sprintf("Database save error: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"id":            id,
		"artifact_name": req.ArtifactName,
		"signature":     sigHex,
		"public_key":    pubHex,
	})
}

func handleCAVerify(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Payload   string `json:"payload"`
		Signature string `json:"signature"`
		PublicKey string `json:"public_key"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	sigBytes, err := hex.DecodeString(req.Signature)
	if err != nil {
		http.Error(w, "Invalid signature hex format", http.StatusBadRequest)
		return
	}

	pubBytes, err := hex.DecodeString(req.PublicKey)
	if err != nil {
		http.Error(w, "Invalid public key hex format", http.StatusBadRequest)
		return
	}

	valid, verifyErr := crypto.VerifyLMS(pubBytes, []byte(req.Payload), sigBytes)
	isValid := valid && (verifyErr == nil)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"valid": isValid,
	})
}

func handleCAGetSignatures(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	rows, err := db.Query("SELECT id, artifact_name, signature, public_key, status, created_at FROM signed_artifacts ORDER BY created_at DESC")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	artifacts := []SignedArtifact{}
	for rows.Next() {
		var sa SignedArtifact
		err := rows.Scan(&sa.ID, &sa.ArtifactName, &sa.Signature, &sa.PublicKey, &sa.Status, &sa.CreatedAt)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		artifacts = append(artifacts, sa)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(artifacts)
}


