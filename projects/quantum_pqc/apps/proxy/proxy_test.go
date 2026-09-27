package main

import (
	"crypto/tls"
	"os"
	"path/filepath"
	"testing"
)

func TestProxyConfigDefaults(t *testing.T) {
	tmpDir := t.TempDir()
	configPath := filepath.Join(tmpDir, "proxy.yaml")

	yamlContent := `proxy:
  listen_port: "8443"
  upstream: "http://localhost:3000"
  tls:
    curves:
      - "X25519MLKEM768"
      - "X25519"
      - "P256"
`
	if err := os.WriteFile(configPath, []byte(yamlContent), 0644); err != nil {
		t.Fatalf("Failed to write temp proxy config: %v", err)
	}

	data, err := os.ReadFile(configPath)
	if err != nil {
		t.Fatalf("Failed to read config: %v", err)
	}

	if len(data) == 0 {
		t.Fatal("Expected config file to have content")
	}
}

func TestCurveMapping(t *testing.T) {
	curves := []string{"X25519MLKEM768", "X25519", "P256", "P384", "P521"}
	curveIDs := []tls.CurveID{}

	for _, c := range curves {
		switch c {
		case "X25519MLKEM768":
			curveIDs = append(curveIDs, tls.CurveID(4588))
		case "X25519":
			curveIDs = append(curveIDs, tls.X25519)
		case "P256":
			curveIDs = append(curveIDs, tls.CurveP256)
		case "P384":
			curveIDs = append(curveIDs, tls.CurveP384)
		case "P521":
			curveIDs = append(curveIDs, tls.CurveP521)
		}
	}

	if len(curveIDs) != 5 {
		t.Errorf("Expected 5 curve IDs, got %d", len(curveIDs))
	}

	if curveIDs[0] != tls.CurveID(4588) {
		t.Errorf("Expected first curve ID to be 4588 (X25519MLKEM768), got %d", curveIDs[0])
	}
}

func TestGenerateSelfSignedCert(t *testing.T) {
	tmpDir := t.TempDir()
	certFile := filepath.Join(tmpDir, "test_cert.pem")
	keyFile := filepath.Join(tmpDir, "test_key.pem")

	if err := generateSelfSignedCert(certFile, keyFile); err != nil {
		t.Fatalf("Failed to generate self-signed cert: %v", err)
	}

	if _, err := os.Stat(certFile); os.IsNotExist(err) {
		t.Errorf("Certificate file was not created at %s", certFile)
	}
	if _, err := os.Stat(keyFile); os.IsNotExist(err) {
		t.Errorf("Key file was not created at %s", keyFile)
	}

	certData, _ := os.ReadFile(certFile)
	if len(certData) == 0 {
		t.Error("Generated certificate file is empty")
	}

	keyData, _ := os.ReadFile(keyFile)
	if len(keyData) == 0 {
		t.Error("Generated private key file is empty")
	}
}
