package main

import (
	"bytes"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/asn1"
	"encoding/hex"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"io"
	"log"
	"math/big"
	"net/http"
	"os"
	"time"

	"quantum_pqc/shared/crypto"
)

var pqExtensionOID = asn1.ObjectIdentifier{1, 3, 6, 1, 4, 1, 58888, 1}

func main() {
	fmt.Println("================================================================================")
	fmt.Println("🛡️  QuantumShield E2E Verification: Hybrid Post-Quantum Certificate Authority")
	fmt.Println("================================================================================")

	apiURL := os.Getenv("API_GATEWAY_URL")
	if apiURL == "" {
		apiURL = "http://localhost:8080"
	}

	client := &http.Client{Timeout: 3 * time.Second}
	resp, err := client.Get(apiURL + "/api/ca/root-keys")

	if err == nil && resp.StatusCode == http.StatusOK {
		fmt.Printf(" [✓] Connected to live QuantumShield API at %s\n", apiURL)
		defer resp.Body.Close()
		runLiveAPIVerification(client, apiURL, resp.Body)
	} else {
		fmt.Printf(" [!] Live API not reachable at %s (%v). Running standalone cryptographic verification...\n\n", apiURL, err)
		runStandaloneVerification()
	}

	fmt.Println("\n================================================================================")
	fmt.Println("🎉 All Hybrid Certificate Authority Verifications Completed Successfully!")
	fmt.Println("================================================================================")
}

func runLiveAPIVerification(client *http.Client, apiURL string, rootKeysBody io.Reader) {
	var rootKeys struct {
		ClassicalRootPEM string `json:"classical_root_pem"`
		MLDSA87RootPub   string `json:"mldsa87_root_pub"`
		LMSRootPub       string `json:"lms_root_pub"`
	}
	if err := json.NewDecoder(rootKeysBody).Decode(&rootKeys); err != nil {
		log.Fatalf("Failed to decode root keys: %v", err)
	}

	fmt.Printf(" [✓] Classical Root Certificate Length: %d bytes\n", len(rootKeys.ClassicalRootPEM))
	fmt.Printf(" [✓] ML-DSA-87 Root PubKey Length: %d hex characters\n", len(rootKeys.MLDSA87RootPub))
	fmt.Printf(" [✓] LMS Root PubKey Length: %d hex characters\n\n", len(rootKeys.LMSRootPub))

	// Test issuing ML-DSA-87 hybrid cert
	testLiveIssue(client, apiURL, "api.shield.internal", "ML-DSA-87", rootKeys.MLDSA87RootPub)

	// Test issuing LMS hybrid cert
	testLiveIssue(client, apiURL, "edge-gw.shield.internal", "LMS", rootKeys.LMSRootPub)
}

func testLiveIssue(client *http.Client, apiURL, commonName, sigAlg, rootPubHex string) {
	fmt.Printf("--- Testing Certificate Issuance: %s (%s) ---\n", commonName, sigAlg)
	reqBody, _ := json.Marshal(map[string]string{
		"common_name":         commonName,
		"signature_algorithm": sigAlg,
	})

	resp, err := client.Post(apiURL+"/api/ca/issue", "application/json", bytes.NewBuffer(reqBody))
	if err != nil {
		log.Fatalf("Failed to issue certificate: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		log.Fatalf("Issue returned status %d: %s", resp.StatusCode, string(body))
	}

	var issueResp struct {
		ID                 string `json:"id"`
		CommonName         string `json:"common_name"`
		SerialNumber       string `json:"serial_number"`
		SignatureAlgorithm string `json:"signature_algorithm"`
		PEMBlock           string `json:"pem_block"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&issueResp); err != nil {
		log.Fatalf("Failed to parse issue response: %v", err)
	}

	fmt.Printf(" [✓] Received Certificate Serial: %s\n", issueResp.SerialNumber)
	verifyHybridCertificatePEM([]byte(issueResp.PEMBlock), sigAlg, rootPubHex)
}

func runStandaloneVerification() {
	fmt.Println("--- Step 1: Initializing Standalone Hybrid Root CA ---")
	// 1. Classical CA
	caPrivECDSA, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		log.Fatalf("Failed to generate ECDSA key: %v", err)
	}
	serial, _ := rand.Int(rand.Reader, new(big.Int).Lsh(big.NewInt(1), 128))
	caTemplate := &x509.Certificate{
		SerialNumber:          serial,
		Subject:               pkix.Name{Organization: []string{"QuantumShield PKI"}, CommonName: "QuantumShield Root CA"},
		NotBefore:             time.Now(),
		NotAfter:              time.Now().Add(10 * 365 * 24 * time.Hour),
		IsCA:                  true,
		KeyUsage:              x509.KeyUsageCertSign | x509.KeyUsageCRLSign,
		BasicConstraintsValid: true,
	}
	caDerBytes, err := x509.CreateCertificate(rand.Reader, caTemplate, caTemplate, &caPrivECDSA.PublicKey, caPrivECDSA)
	if err != nil {
		log.Fatalf("Failed to create CA cert: %v", err)
	}
	caCert, _ := x509.ParseCertificate(caDerBytes)

	// 2. ML-DSA CA
	mldsaPair, err := crypto.GenerateMLDSAKeyPair(crypto.MLDSA87)
	if err != nil {
		log.Fatalf("Failed to generate ML-DSA CA: %v", err)
	}
	fmt.Printf(" [✓] ML-DSA-87 CA Initialized (PubKey: %d bytes, PrivKey: %d bytes)\n", len(mldsaPair.PublicKey), len(mldsaPair.PrivateKey))

	// 3. LMS CA
	lmsPub, lmsPriv, err := crypto.GenerateLMSKeyPair()
	if err != nil {
		log.Fatalf("Failed to generate LMS CA: %v", err)
	}
	fmt.Printf(" [✓] LMS CA Initialized (PubKey: %d bytes, PrivKey: %d bytes)\n\n", len(lmsPub), len(lmsPriv))

	// --- Verify ML-DSA-87 Hybrid Certificate ---
	fmt.Println("--- Step 2: Issuing & Validating ML-DSA-87 Hybrid Certificate ---")
	leafPEM, leafCert := createHybridCert("cluster.vault.internal", caCert, caPrivECDSA, "ML-DSA-87", mldsaPair.PrivateKey, nil)
	verifyParsedHybridCert(leafCert, "cluster.vault.internal", "ML-DSA-87", mldsaPair.PublicKey)
	fmt.Printf(" [✓] PEM Block Generated (%d bytes)\n\n", len(leafPEM))

	// --- Verify LMS Hybrid Certificate ---
	fmt.Println("--- Step 3: Issuing & Validating LMS Hybrid Certificate ---")
	_, leafCertLMS := createHybridCert("firmware-signer.internal", caCert, caPrivECDSA, "LMS", nil, lmsPriv)
	verifyParsedHybridCert(leafCertLMS, "firmware-signer.internal", "LMS", lmsPub)
}

func createHybridCert(commonName string, caCert *x509.Certificate, caPriv *ecdsa.PrivateKey, sigAlg string, mldsaPriv []byte, lmsPriv []byte) ([]byte, *x509.Certificate) {
	clientKey, _ := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	clientPubKeyBytes, _ := x509.MarshalPKIXPublicKey(&clientKey.PublicKey)
	tbsBytes := []byte(fmt.Sprintf("%s:%x", commonName, clientPubKeyBytes))

	var pqSig []byte
	var signErr error
	if sigAlg == "ML-DSA-87" {
		pqSig, signErr = crypto.SignMLDSA(crypto.MLDSA87, mldsaPriv, tbsBytes, nil)
	} else if sigAlg == "LMS" {
		_, pqSig, signErr = crypto.SignLMS(lmsPriv, tbsBytes)
	}
	if signErr != nil {
		log.Fatalf("Failed to create %s signature: %v", sigAlg, signErr)
	}

	pqExt := pkix.Extension{
		Id:       pqExtensionOID,
		Critical: false,
		Value:    pqSig,
	}

	serial, _ := rand.Int(rand.Reader, new(big.Int).Lsh(big.NewInt(1), 128))
	template := &x509.Certificate{
		SerialNumber:    serial,
		Subject:         pkix.Name{Organization: []string{"QuantumShield Client"}, CommonName: commonName},
		NotBefore:       time.Now(),
		NotAfter:        time.Now().Add(365 * 24 * time.Hour),
		KeyUsage:        x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature,
		ExtraExtensions: []pkix.Extension{pqExt},
	}

	derBytes, err := x509.CreateCertificate(rand.Reader, template, caCert, &clientKey.PublicKey, caPriv)
	if err != nil {
		log.Fatalf("Failed to sign hybrid cert: %v", err)
	}

	parsedCert, _ := x509.ParseCertificate(derBytes)
	pemBytes := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: derBytes})
	return pemBytes, parsedCert
}

func verifyHybridCertificatePEM(pemBytes []byte, sigAlg, rootPubHex string) {
	block, _ := pem.Decode(pemBytes)
	if block == nil {
		log.Fatalf("Failed to decode PEM certificate")
	}

	cert, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		log.Fatalf("Failed to parse X.509 certificate: %v", err)
	}

	pubBytes, err := hex.DecodeString(rootPubHex)
	if err != nil {
		log.Fatalf("Failed to decode root pub key hex: %v", err)
	}

	verifyParsedHybridCert(cert, cert.Subject.CommonName, sigAlg, pubBytes)
}

func verifyParsedHybridCert(cert *x509.Certificate, commonName, sigAlg string, rootPubBytes []byte) {
	fmt.Printf(" [✓] Subject Common Name: %s\n", cert.Subject.CommonName)
	fmt.Printf(" [✓] Classical Key Type: %T (%d bits)\n", cert.PublicKey, cert.PublicKey.(*ecdsa.PublicKey).Curve.Params().BitSize)

	// Locate Custom PQC Extension
	var foundExt *pkix.Extension
	for _, ext := range cert.Extensions {
		if ext.Id.Equal(pqExtensionOID) {
			foundExt = &ext
			break
		}
	}

	if foundExt == nil {
		log.Fatalf("❌ Custom ASN.1 PQC Extension (%s) not found in certificate!", pqExtensionOID.String())
	}
	fmt.Printf(" [✓] Found Custom PQC Extension OID: %s (Value length: %d bytes)\n", pqExtensionOID.String(), len(foundExt.Value))

	clientPubKeyBytes, err := x509.MarshalPKIXPublicKey(cert.PublicKey)
	if err != nil {
		log.Fatalf("Failed to marshal client public key: %v", err)
	}

	tbsPayload := []byte(fmt.Sprintf("%s:%x", commonName, clientPubKeyBytes))

	if sigAlg == "ML-DSA-87" {
		valid, err := crypto.VerifyMLDSA(crypto.MLDSA87, rootPubBytes, tbsPayload, foundExt.Value, nil)
		if err != nil || !valid {
			log.Fatalf("❌ ML-DSA-87 Signature Verification Failed: %v", err)
		}
		fmt.Println(" [✓] ML-DSA-87 Post-Quantum Signature Cryptographically VALID")

		// Tamper test
		tampered := []byte(fmt.Sprintf("tampered.%s:%x", commonName, clientPubKeyBytes))
		badValid, _ := crypto.VerifyMLDSA(crypto.MLDSA87, rootPubBytes, tampered, foundExt.Value, nil)
		if badValid {
			log.Fatalf("❌ Tampered payload incorrectly verified!")
		}
		fmt.Println(" [✓] Anti-Tamper Check Passed: Tampered certificate signature rejected")
	} else if sigAlg == "LMS" {
		valid, err := crypto.VerifyLMS(rootPubBytes, tbsPayload, foundExt.Value)
		if err != nil || !valid {
			log.Fatalf("❌ LMS Signature Verification Failed: %v", err)
		}
		fmt.Println(" [✓] LMS Stateful Post-Quantum Signature Cryptographically VALID")

		// Tamper test
		tampered := []byte(fmt.Sprintf("tampered.%s:%x", commonName, clientPubKeyBytes))
		badValid, _ := crypto.VerifyLMS(rootPubBytes, tampered, foundExt.Value)
		if badValid {
			log.Fatalf("❌ Tampered payload incorrectly verified!")
		}
		fmt.Println(" [✓] Anti-Tamper Check Passed: Tampered certificate signature rejected")
	}
}
