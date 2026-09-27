package crypto

import (
	"bytes"
	"testing"
)

func TestMLKEMRoundTrip(t *testing.T) {
	levels := []MLKEMLevel{MLKEM512, MLKEM768, MLKEM1024}

	for _, level := range levels {
		t.Run(t.Name(), func(t *testing.T) {
			// 1. Generate Key Pair
			keyPair, err := GenerateMLKEMKeyPair(level)
			if err != nil {
				t.Fatalf("Failed to generate key pair for level %d: %v", level, err)
			}

			// 2. Encapsulate
			ct, ssEnc, err := EncapsulateMLKEM(level, keyPair.PublicKey)
			if err != nil {
				t.Fatalf("Failed to encapsulate for level %d: %v", level, err)
			}

			// 3. Decapsulate
			ssDec, err := DecapsulateMLKEM(level, keyPair.PrivateKey, ct)
			if err != nil {
				t.Fatalf("Failed to decapsulate for level %d: %v", level, err)
			}

			// 4. Verify match
			if !bytes.Equal(ssEnc, ssDec) {
				t.Errorf("Shared secrets do not match. Enc: %x, Dec: %x", ssEnc, ssDec)
			}
		})
	}
}

func TestMLDSARoundTrip(t *testing.T) {
	levels := []MLDSALevel{MLDSA44, MLDSA65, MLDSA87}
	msg := []byte("Testing post-quantum digital signatures FIPS 204")
	ctx := []byte("test-context")

	for _, level := range levels {
		t.Run(t.Name(), func(t *testing.T) {
			// 1. Generate Key Pair
			keyPair, err := GenerateMLDSAKeyPair(level)
			if err != nil {
				t.Fatalf("Failed to generate key pair for level %d: %v", level, err)
			}

			// 2. Sign
			sig, err := SignMLDSA(level, keyPair.PrivateKey, msg, ctx)
			if err != nil {
				t.Fatalf("Failed to sign message: %v", err)
			}

			// 3. Verify
			valid, err := VerifyMLDSA(level, keyPair.PublicKey, msg, sig, ctx)
			if err != nil {
				t.Fatalf("Failed to verify signature: %v", err)
			}

			if !valid {
				t.Errorf("Signature verification failed for level %d", level)
			}

			// 4. Verify invalid message fails
			badMsg := []byte("Tampered message content")
			validBad, _ := VerifyMLDSA(level, keyPair.PublicKey, badMsg, sig, ctx)
			if validBad {
				t.Errorf("Signature verification should have failed for tampered message")
			}
		})
	}
}

func TestHybridRoundTrip(t *testing.T) {
	// 1. Generate Hybrid Key Pair
	keyPair, err := GenerateHybridKeyPair()
	if err != nil {
		t.Fatalf("Failed to generate hybrid key pair: %v", err)
	}

	// 2. Encapsulate
	ct, ssEnc, err := EncapsulateHybrid(keyPair.PublicKey)
	if err != nil {
		t.Fatalf("Failed to encapsulate: %v", err)
	}

	// 3. Decapsulate
	ssDec, err := DecapsulateHybrid(keyPair.PrivateKey, ct)
	if err != nil {
		t.Fatalf("Failed to decapsulate: %v", err)
	}

	// 4. Verify Match
	if !bytes.Equal(ssEnc, ssDec) {
		t.Errorf("Hybrid shared secrets do not match. Enc: %x, Dec: %x", ssEnc, ssDec)
	}
}

func TestLMSRoundTrip(t *testing.T) {
	pub, priv, err := GenerateLMSKeyPair()
	if err != nil {
		t.Fatalf("Failed to generate LMS key: %v", err)
	}

	msg := []byte("Post-Quantum code signing test")

	updatedPriv, sig, err := SignLMS(priv, msg)
	if err != nil {
		t.Fatalf("Failed to sign message: %v", err)
	}

	// Verify updatedPriv is changed (due to state update)
	if bytes.Equal(priv, updatedPriv) {
		t.Error("Private key state was not updated after signing")
	}

	valid, err := VerifyLMS(pub, msg, sig)
	if err != nil {
		t.Fatalf("Failed to verify: %v", err)
	}
	if !valid {
		t.Error("LMS signature verification failed")
	}
}
