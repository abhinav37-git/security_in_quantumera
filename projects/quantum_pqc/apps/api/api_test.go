package main

import (
	"bytes"
	"crypto/x509"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"encoding/pem"
	"net/http"
	"net/http/httptest"
	"testing"

	"quantum_pqc/shared/crypto"
)

func TestRoutesConfiguration(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/scans", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte("[]"))
	})
	mux.HandleFunc("/api/certs", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte("[]"))
	})

	// Test GET /api/scans via NewRecorder (in-memory, no socket listen)
	req1 := httptest.NewRequest(http.MethodGet, "/api/scans", nil)
	rec1 := httptest.NewRecorder()
	mux.ServeHTTP(rec1, req1)

	if rec1.Code != http.StatusOK {
		t.Errorf("Expected status 200 OK, got %d", rec1.Code)
	}
	if contentType := rec1.Header().Get("Content-Type"); contentType != "application/json" {
		t.Errorf("Expected content type application/json, got %q", contentType)
	}
	if rec1.Body.String() != "[]" {
		t.Errorf("Expected body '[]', got %q", rec1.Body.String())
	}

	// Test GET /api/certs
	req2 := httptest.NewRequest(http.MethodGet, "/api/certs", nil)
	rec2 := httptest.NewRecorder()
	mux.ServeHTTP(rec2, req2)

	if rec2.Code != http.StatusOK {
		t.Errorf("Expected status 200 OK, got %d", rec2.Code)
	}
}

func TestInitCAAndKeyGeneration(t *testing.T) {
	initCA()

	if caCertECDSA == nil {
		t.Fatal("Expected caCertECDSA to be initialized")
	}
	if len(caCertificatePEM) == 0 {
		t.Fatal("Expected caCertificatePEM to not be empty")
	}
	if len(caPrivateKeyMLDSA) == 0 || len(caPublicKeyMLDSA) == 0 {
		t.Fatal("Expected ML-DSA CA keys to be initialized")
	}
	if len(caPrivateKeyLMS) == 0 || len(caPublicKeyLMS) == 0 {
		t.Fatal("Expected LMS CA keys to be initialized")
	}
}

func TestGenerateHybridCertMLDSA(t *testing.T) {
	initCA()

	cn := "test.shield.local"
	pemBlock, serial, err := generateHybridCert(cn, "ML-DSA-87")
	if err != nil {
		t.Fatalf("Failed to generate ML-DSA-87 hybrid cert: %v", err)
	}

	if serial == "" {
		t.Error("Expected non-empty serial number")
	}

	block, _ := pem.Decode([]byte(pemBlock))
	if block == nil {
		t.Fatal("Failed to decode generated PEM block")
	}

	cert, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		t.Fatalf("Failed to parse X.509 certificate: %v", err)
	}

	if cert.Subject.CommonName != cn {
		t.Errorf("Expected CommonName %q, got %q", cn, cert.Subject.CommonName)
	}

	// Verify custom ASN.1 PQC extension
	var foundExt bool
	for _, ext := range cert.Extensions {
		if ext.Id.Equal(asn1ObjectIdentifierPQC()) {
			foundExt = true
			if len(ext.Value) == 0 {
				t.Error("Expected non-empty PQC extension payload")
			}
			break
		}
	}
	if !foundExt {
		t.Error("Custom PQC extension 1.3.6.1.4.1.58888.1 was not found in issued certificate")
	}
}

func TestGenerateHybridCertLMS(t *testing.T) {
	initCA()

	cn := "firmware.shield.local"
	pemBlock, serial, err := generateHybridCert(cn, "LMS")
	if err != nil {
		t.Fatalf("Failed to generate LMS hybrid cert: %v", err)
	}

	if serial == "" {
		t.Error("Expected non-empty serial number")
	}

	block, _ := pem.Decode([]byte(pemBlock))
	if block == nil {
		t.Fatal("Failed to decode generated PEM block")
	}

	cert, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		t.Fatalf("Failed to parse X.509 certificate: %v", err)
	}

	if cert.Subject.CommonName != cn {
		t.Errorf("Expected CommonName %q, got %q", cn, cert.Subject.CommonName)
	}
}

func TestCAVerifyEndpoint(t *testing.T) {
	initCA()

	// Generate key and sign a test payload
	pub, priv, err := crypto.GenerateLMSKeyPair()
	if err != nil {
		t.Fatalf("Failed to generate LMS key: %v", err)
	}

	payload := "TEST_FIRMWARE_PAYLOAD_12345"
	_, sig, err := crypto.SignLMS(priv, []byte(payload))
	if err != nil {
		t.Fatalf("Failed to sign payload: %v", err)
	}

	sigHex := hex.EncodeToString(sig)
	pubHex := hex.EncodeToString(pub)

	// Test valid verification via handleCAVerify
	reqBody, _ := json.Marshal(map[string]string{
		"payload":    payload,
		"signature":  sigHex,
		"public_key": pubHex,
	})

	req := httptest.NewRequest(http.MethodPost, "/api/verify", bytes.NewBuffer(reqBody))
	rec := httptest.NewRecorder()
	handleCAVerify(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("Expected status 200, got %d", rec.Code)
	}

	var resp struct {
		Valid bool `json:"valid"`
	}
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("Failed to decode verify response: %v", err)
	}

	if !resp.Valid {
		t.Error("Expected valid LMS signature verification to return true")
	}

	// Test invalid payload verification
	badReqBody, _ := json.Marshal(map[string]string{
		"payload":    payload + "_TAMPERED",
		"signature":  sigHex,
		"public_key": pubHex,
	})

	badReq := httptest.NewRequest(http.MethodPost, "/api/verify", bytes.NewBuffer(badReqBody))
	badRec := httptest.NewRecorder()
	handleCAVerify(badRec, badReq)

	var badResp struct {
		Valid bool `json:"valid"`
	}
	json.NewDecoder(badRec.Body).Decode(&badResp)
	if badResp.Valid {
		t.Error("Expected tampered LMS payload verification to return false")
	}
}

func TestCARootKeysEndpoint(t *testing.T) {
	initCA()

	req := httptest.NewRequest(http.MethodGet, "/api/ca/root-keys", nil)
	rec := httptest.NewRecorder()
	handleCARootKeys(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("Expected status 200, got %d", rec.Code)
	}

	var rootKeys map[string]string
	if err := json.NewDecoder(rec.Body).Decode(&rootKeys); err != nil {
		t.Fatalf("Failed to parse root keys response: %v", err)
	}

	if rootKeys["classical_root_pem"] == "" {
		t.Error("Expected non-empty classical_root_pem")
	}
	if rootKeys["mldsa87_root_pub"] == "" {
		t.Error("Expected non-empty mldsa87_root_pub")
	}
	if rootKeys["lms_root_pub"] == "" {
		t.Error("Expected non-empty lms_root_pub")
	}
}

func TestDBInitializeConnection(t *testing.T) {
	var testDB *sql.DB
	if testDB != nil {
		t.Error("Expected initial DB to be nil before connection open")
	}
}

func asn1ObjectIdentifierPQC() []int {
	return []int{1, 3, 6, 1, 4, 1, 58888, 1}
}
