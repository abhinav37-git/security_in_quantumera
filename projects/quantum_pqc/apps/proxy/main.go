package main

import (
	"bytes"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"sync"
	"time"

	"gopkg.in/yaml.v3"
)

type TLSConfig struct {
	Curves []string `yaml:"curves"`
}

type ProxyConfig struct {
	ListenPort string    `yaml:"listen_port"`
	Upstream   string    `yaml:"upstream"`
	TLS        TLSConfig `yaml:"tls"`
}

type ConfigWrapper struct {
	Proxy ProxyConfig `yaml:"proxy"`
}

var (
	config       ConfigWrapper
	configMutex  sync.RWMutex
	apiEndpoint  string
	connCurves   = make(map[string]string)
	connCurvesMu sync.Mutex
	serverCert   tls.Certificate
)

func main() {
	apiEndpoint = os.Getenv("API_GATEWAY_URL")
	if apiEndpoint == "" {
		apiEndpoint = "http://localhost:8080"
	}

	// 1. Load config
	if err := loadConfig(); err != nil {
		log.Printf("Warning: Failed to load config, using defaults: %v\n", err)
		config.Proxy.ListenPort = "8443"
		config.Proxy.Upstream = "http://localhost:3000" // Default to Next.js dev server
		config.Proxy.TLS.Curves = []string{"X25519MLKEM768", "X25519", "P256"}
	}

	// 2. Setup TLS keys (self-signed certs generator)
	certFile := "cert.pem"
	keyFile := "key.pem"
	if _, err := os.Stat(certFile); os.IsNotExist(err) {
		log.Println("Generating self-signed certificate for TLS...")
		if err := generateSelfSignedCert(certFile, keyFile); err != nil {
			log.Fatalf("Failed to generate cert: %v", err)
		}
	}

	// Load certificate explicitly
	var loadErr error
	serverCert, loadErr = tls.LoadX509KeyPair(certFile, keyFile)
	if loadErr != nil {
		log.Fatalf("Failed to load key pair: %v", loadErr)
	}

	// 3. Set up the dynamic TLS configuration
	tlsConfig := &tls.Config{
		GetConfigForClient: func(clientHello *tls.ClientHelloInfo) (*tls.Config, error) {
			configMutex.RLock()
			defer configMutex.RUnlock()

			curveIDs := []tls.CurveID{}
			for _, c := range config.Proxy.TLS.Curves {
				switch c {
				case "X25519MLKEM768":
					curveIDs = append(curveIDs, tls.CurveID(4588)) // IANA code point for X25519MLKEM768
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

			if len(curveIDs) == 0 {
				curveIDs = []tls.CurveID{tls.CurveID(4588), tls.X25519, tls.CurveP256}
			}

			clientIP := clientHello.Conn.RemoteAddr().String()
			selectedCurve := "X25519"
			hasPQ := false
			for _, id := range clientHello.SupportedCurves {
				if id == tls.CurveID(4588) {
					hasPQ = true
					break
				}
			}
			if hasPQ {
				selectedCurve = "X25519MLKEM768"
			} else if len(clientHello.SupportedCurves) > 0 {
				switch clientHello.SupportedCurves[0] {
				case tls.X25519:
					selectedCurve = "X25519"
				case tls.CurveP256:
					selectedCurve = "P-256"
				case tls.CurveP384:
					selectedCurve = "P-384"
				case tls.CurveP521:
					selectedCurve = "P-521"
				default:
					selectedCurve = fmt.Sprintf("Classical (%d)", clientHello.SupportedCurves[0])
				}
			}

			connCurvesMu.Lock()
			connCurves[clientIP] = selectedCurve
			connCurvesMu.Unlock()

			return &tls.Config{
				Certificates:     []tls.Certificate{serverCert},
				CurvePreferences: curveIDs,
			}, nil
		},
	}

	// 4. Reverse proxy setup
	upstreamURL, err := url.Parse(config.Proxy.Upstream)
	if err != nil {
		log.Fatalf("Invalid upstream URL: %v", err)
	}

	reverseProxy := httputil.NewSingleHostReverseProxy(upstreamURL)

	// Custom Director to preserve headers
	originalDirector := reverseProxy.Director
	reverseProxy.Director = func(req *http.Request) {
		originalDirector(req)
		req.Header.Set("X-Forwarded-Host", req.Header.Get("Host"))
		req.Header.Set("X-Forwarded-Proto", "https")
	}

	// HTTP handler capturing handshake curves
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		startTime := time.Now()

		// Record negotiated Curve / TLS State
		var curveName = "none"
		var handshakeTimeMs int64 = 0

		if r.TLS != nil {
			handshakeTimeMs = time.Since(startTime).Milliseconds() // basic heuristic
			clientIP := r.RemoteAddr
			connCurvesMu.Lock()
			if name, ok := connCurves[clientIP]; ok {
				curveName = name
				delete(connCurves, clientIP)
			} else {
				curveName = "X25519"
			}
			connCurvesMu.Unlock()

			// Post telemetry in goroutine
			go recordTelemetry(curveName, handshakeTimeMs, r.RemoteAddr)
		}

		reverseProxy.ServeHTTP(w, r)
	})

	server := &http.Server{
		Addr:      ":" + config.Proxy.ListenPort,
		Handler:   handler,
		TLSConfig: tlsConfig,
	}

	// Watch config file for changes asynchronously
	go watchConfigFile()

	log.Printf("QuantumShield Reverse Proxy listening on HTTPS port %s (forwarding to %s)...\n",
		config.Proxy.ListenPort, config.Proxy.Upstream)
	log.Fatalf("Proxy server failed: %v", server.ListenAndServeTLS(certFile, keyFile))
}

func loadConfig() error {
	configMutex.Lock()
	defer configMutex.Unlock()

	configPath := "apps/proxy/proxy.yaml"
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		configPath = "proxy.yaml" // fallback
	}

	data, err := os.ReadFile(configPath)
	if err != nil {
		return err
	}

	var parsed ConfigWrapper
	if err := yaml.Unmarshal(data, &parsed); err != nil {
		return err
	}

	config = parsed
	if upstreamEnv := os.Getenv("PROXY_UPSTREAM"); upstreamEnv != "" {
		config.Proxy.Upstream = upstreamEnv
	}
	if portEnv := os.Getenv("PROXY_PORT"); portEnv != "" {
		config.Proxy.ListenPort = portEnv
	}
	return nil
}

func watchConfigFile() {
	configPath := "apps/proxy/proxy.yaml"
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		configPath = "proxy.yaml"
	}

	var lastSize int64
	for {
		time.Sleep(5 * time.Second)
		fi, err := os.Stat(configPath)
		if err != nil {
			continue
		}
		if fi.Size() != lastSize {
			lastSize = fi.Size()
			log.Println("Config file changed. Reloading proxy settings...")
			if err := loadConfig(); err != nil {
				log.Printf("Error reloading proxy config: %v\n", err)
			}
		}
	}
}

func recordTelemetry(curve string, handshakeTimeMs int64, clientIP string) {
	data := map[string]interface{}{
		"key_exchange": curve,
		"handshake_ms": handshakeTimeMs,
		"client_ip":    clientIP,
	}

	payload, err := json.Marshal(data)
	if err != nil {
		return
	}

	resp, err := http.Post(apiEndpoint+"/api/proxy/telemetry", "application/json", bytes.NewBuffer(payload))
	if err != nil {
		log.Printf("Failed to submit proxy telemetry: %v\n", err)
		return
	}
	defer resp.Body.Close()
}

func generateSelfSignedCert(certFile, keyFile string) error {
	priv, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		return err
	}

	notBefore := time.Now()
	notAfter := notBefore.Add(365 * 24 * time.Hour)

	serialNumberLimit := new(big.Int).Lsh(big.NewInt(1), 128)
	serialNumber, err := rand.Int(rand.Reader, serialNumberLimit)
	if err != nil {
		return err
	}

	template := x509.Certificate{
		SerialNumber: serialNumber,
		Subject: pkix.Name{
			Organization: []string{"QuantumShield"},
			CommonName:   "localhost",
		},
		NotBefore:             notBefore,
		NotAfter:              notAfter,
		KeyUsage:              x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		BasicConstraintsValid: true,
	}

	derBytes, err := x509.CreateCertificate(rand.Reader, &template, &template, &priv.PublicKey, priv)
	if err != nil {
		return err
	}

	certOut, err := os.Create(certFile)
	if err != nil {
		return err
	}
	defer certOut.Close()
	pem.Encode(certOut, &pem.Block{Type: "CERTIFICATE", Bytes: derBytes})

	keyOut, err := os.OpenFile(keyFile, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0600)
	if err != nil {
		return err
	}
	defer keyOut.Close()

	privBytes, err := x509.MarshalECPrivateKey(priv)
	if err != nil {
		return err
	}
	pem.Encode(keyOut, &pem.Block{Type: "EC PRIVATE KEY", Bytes: privBytes})

	return nil
}
