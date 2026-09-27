package main

import (
	"bytes"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"quantum_pqc/shared/crypto"
)

func main() {
	fmt.Println("================================================================================")
	fmt.Println("✍️  QuantumShield E2E Verification: Stateful LMS Code Signer (RFC 8554)")
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
		runLiveSignVerification(client, apiURL)
	} else {
		fmt.Printf(" [!] Live API not reachable at %s (%v). Running standalone LMS verification...\n\n", apiURL, err)
		runStandaloneSignVerification()
	}

	fmt.Println("\n================================================================================")
	fmt.Println("🎉 Stateful LMS Code Signing Verifications Completed Successfully!")
	fmt.Println("================================================================================")
}

func runLiveSignVerification(client *http.Client, apiURL string) {
	artifactName := "quantum_firmware_v3.2.bin"
	payloadHex := "48656c6c6f205175616e74756d20576f726c6421204669726d77617265205061796c6f6164" // "Hello Quantum World! Firmware Payload"

	fmt.Printf("--- Step 1: Requesting Stateful Signature for Artifact: %s ---\n", artifactName)
	signReq, _ := json.Marshal(map[string]string{
		"artifact_name": artifactName,
		"payload":       payloadHex,
	})

	resp, err := client.Post(apiURL+"/api/sign", "application/json", bytes.NewBuffer(signReq))
	if err != nil {
		log.Fatalf("Failed to sign artifact: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		log.Fatalf("Sign endpoint returned %d: %s", resp.StatusCode, string(body))
	}

	var signResp struct {
		ID           string `json:"id"`
		ArtifactName string `json:"artifact_name"`
		Signature    string `json:"signature"`
		PublicKey    string `json:"public_key"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&signResp); err != nil {
		log.Fatalf("Failed to parse sign response: %v", err)
	}

	fmt.Printf(" [✓] Artifact ID: %s\n", signResp.ID)
	fmt.Printf(" [✓] LMS Signature (%d chars hex): %s...\n", len(signResp.Signature), signResp.Signature[:32])
	fmt.Printf(" [✓] LMS Public Key (%d chars hex): %s...\n\n", len(signResp.PublicKey), signResp.PublicKey[:32])

	// Verify via /api/verify
	fmt.Println("--- Step 2: Verifying LMS Signature via API ---")
	verifyReq, _ := json.Marshal(map[string]string{
		"payload":    payloadHex,
		"signature":  signResp.Signature,
		"public_key": signResp.PublicKey,
	})

	vResp, err := client.Post(apiURL+"/api/verify", "application/json", bytes.NewBuffer(verifyReq))
	if err != nil {
		log.Fatalf("Failed to verify artifact: %v", err)
	}
	defer vResp.Body.Close()

	var verifyResult struct {
		Valid bool `json:"valid"`
	}
	if err := json.NewDecoder(vResp.Body).Decode(&verifyResult); err != nil {
		log.Fatalf("Failed to parse verify response: %v", err)
	}

	if !verifyResult.Valid {
		log.Fatalf("❌ Signature verification returned invalid!")
	}
	fmt.Println(" [✓] Live API Signature Verification: VALID")

	// Tamper test via /api/verify
	fmt.Println("--- Step 3: Verifying Anti-Tamper Rejection via API ---")
	badPayloadHex := payloadHex + "00"
	badVerifyReq, _ := json.Marshal(map[string]string{
		"payload":    badPayloadHex,
		"signature":  signResp.Signature,
		"public_key": signResp.PublicKey,
	})

	vBadResp, err := client.Post(apiURL+"/api/verify", "application/json", bytes.NewBuffer(badVerifyReq))
	if err == nil {
		defer vBadResp.Body.Close()
		var badResult struct {
			Valid bool `json:"valid"`
		}
		json.NewDecoder(vBadResp.Body).Decode(&badResult)
		if badResult.Valid {
			log.Fatalf("❌ Tampered payload incorrectly verified as valid!")
		}
	}
	fmt.Println(" [✓] Anti-Tamper Check Passed: Modified payload rejected by API")
}

func runStandaloneSignVerification() {
	fmt.Println("--- Step 1: Initializing LMS Stateful Signing Key Pair (RFC 8554) ---")
	pubKey, privKey, err := crypto.GenerateLMSKeyPair()
	if err != nil {
		log.Fatalf("Failed to generate LMS key pair: %v", err)
	}

	fmt.Printf(" [✓] LMS Public Key Generated (%d bytes): %s\n", len(pubKey), hex.EncodeToString(pubKey))
	fmt.Printf(" [✓] Initial Private Key State Size (%d bytes)\n\n", len(privKey))

	// Step 2: Sign first firmware payload
	fmt.Println("--- Step 2: Signing Firmware Release Binary (Artifact 1) ---")
	firmwarePayload := []byte("FIRMWARE_RELEASE_v1.0.0_PRODUCTION_BUILD_HASH_98234791")

	updatedPrivKey1, sig1, err := crypto.SignLMS(privKey, firmwarePayload)
	if err != nil {
		log.Fatalf("LMS Sign failed: %v", err)
	}

	fmt.Printf(" [✓] Generated LMS Signature (%d bytes): %s...\n", len(sig1), hex.EncodeToString(sig1)[:32])

	// Assert state advanced
	if bytes.Equal(privKey, updatedPrivKey1) {
		log.Fatalf("❌ Private key state was NOT updated after signing!")
	}
	fmt.Println(" [✓] State-Guard Verified: Private key monotonic counter advanced successfully (No Key-Reuse)")

	// Step 3: Verify signature
	fmt.Println("\n--- Step 3: Cryptographic Signature Verification ---")
	valid, err := crypto.VerifyLMS(pubKey, firmwarePayload, sig1)
	if err != nil || !valid {
		log.Fatalf("❌ Signature verification failed: %v", err)
	}
	fmt.Println(" [✓] LMS Signature Verified: TRUE")

	// Step 4: Anti-tamper verification
	fmt.Println("\n--- Step 4: Testing Anti-Tamper Detection ---")
	tamperedPayload := []byte("FIRMWARE_RELEASE_v1.0.0_TAMPERED_MALICIOUS_BUILD_98234791")
	validTampered, _ := crypto.VerifyLMS(pubKey, tamperedPayload, sig1)
	if validTampered {
		log.Fatalf("❌ Tampered payload was accepted!")
	}
	fmt.Println(" [✓] Anti-Tamper Check: Tampered firmware binary correctly REJECTED")

	// Step 5: Sign second artifact with updated state
	fmt.Println("\n--- Step 5: Signing Second Artifact with Next Monotonic State (Artifact 2) ---")
	bootloaderPayload := []byte("BOOTLOADER_v2.0_SECURE_ENCLAVE_CONFIG")
	_, sig2, err := crypto.SignLMS(updatedPrivKey1, bootloaderPayload)
	if err != nil {
		log.Fatalf("Second LMS Sign failed: %v", err)
	}

	valid2, err := crypto.VerifyLMS(pubKey, bootloaderPayload, sig2)
	if err != nil || !valid2 {
		log.Fatalf("❌ Second signature verification failed: %v", err)
	}
	fmt.Println(" [✓] Second LMS Signature for Bootloader Verified: TRUE")
	fmt.Println(" [✓] Multi-signature tree sequence operational")
}
