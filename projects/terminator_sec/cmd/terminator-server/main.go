package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/terminator-sec/terminator/pkg/audit"
	"github.com/terminator-sec/terminator/pkg/engine"
	"github.com/terminator-sec/terminator/pkg/ipc"
	"golang.org/x/net/websocket"
)

type CentralServer struct {
	mu          sync.RWMutex
	analyzer    *engine.ThreatAnalyzer
	logger      *audit.AuditLogger
	wsClients   map[*websocket.Conn]bool
	startTime   time.Time
	fleet       []DeviceInfo
	pendingUser map[string]engine.ThreatEvent
}

type DeviceInfo struct {
	ID        string    `json:"id"`
	Hostname  string    `json:"hostname"`
	OS        string    `json:"os"`
	Version   string    `json:"version"`
	IP        string    `json:"ip"`
	Status    string    `json:"status"` // "Protected", "Warning", "Offline"
	LastSeen  time.Time `json:"last_seen"`
	CPUUsage  float64   `json:"cpu_usage"`
}

func main() {
	port := flag.Int("port", 8080, "Port for Central Admin API & Dashboard")
	flag.Parse()

	analyzer := engine.NewThreatAnalyzer()
	home, _ := os.UserHomeDir()
	logPath := fmt.Sprintf("%s/.terminator/server_audit.jsonl", home)
	logger, _ := audit.NewAuditLogger(logPath, 1000)

	server := &CentralServer{
		analyzer:    analyzer,
		logger:      logger,
		wsClients:   make(map[*websocket.Conn]bool),
		startTime:   time.Now(),
		pendingUser: make(map[string]engine.ThreatEvent),
		fleet: []DeviceInfo{
			{
				ID:       "dev_mac_arm01",
				Hostname: "MacBook-Pro-M-Series",
				OS:       "macOS 15.0 Sequoia (Darwin arm64)",
				Version:  "1.0.0-gold",
				IP:       "192.168.1.105",
				Status:   "Protected",
				LastSeen: time.Now(),
				CPUUsage: 0.18,
			},
			{
				ID:       "dev_win_vm02",
				Hostname: "WIN11-VM-UTM-NODE",
				OS:       "Windows 11 Pro (amd64)",
				Version:  "1.0.0-gold",
				IP:       "192.168.64.12",
				Status:   "Protected",
				LastSeen: time.Now().Add(-2 * time.Minute),
				CPUUsage: 0.24,
			},
			{
				ID:       "dev_linux_srv03",
				Hostname: "prod-gateway-ebpf",
				OS:       "Ubuntu 24.04 LTS (eBPF)",
				Version:  "1.0.0-gold",
				IP:       "10.0.0.45",
				Status:   "Protected",
				LastSeen: time.Now().Add(-5 * time.Minute),
				CPUUsage: 0.12,
			},
		},
	}

	// Seed with initial realistic events
	server.seedInitialEvents()

	// Setup HTTP Handlers
	mux := http.NewServeMux()
	mux.HandleFunc("/api/status", server.handleStatus)
	mux.HandleFunc("/api/events", server.handleEvents)
	mux.HandleFunc("/api/events/ingest", server.handleIngest)
	mux.HandleFunc("/api/fleet", server.handleFleet)
	mux.HandleFunc("/api/fleet/heartbeat", server.handleHeartbeat)
	mux.HandleFunc("/api/analytics", server.handleAnalytics)
	mux.HandleFunc("/api/policies/decision", server.handleDecision)
	mux.HandleFunc("/api/threats/simulate", server.handleSimulate)
	mux.Handle("/ws/threats", websocket.Handler(server.handleWS))

	// Static dashboard files
	distDir := "apps/dashboard/dist"
	if _, err := os.Stat(distDir); err == nil {
		fs := http.FileServer(http.Dir(distDir))
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			path := distDir + r.URL.Path
			if _, err := os.Stat(path); os.IsNotExist(err) {
				http.ServeFile(w, r, distDir+"/index.html")
				return
			}
			fs.ServeHTTP(w, r)
		})
	}

	// CORS wrapper
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		mux.ServeHTTP(w, r)
	})

	addr := fmt.Sprintf("0.0.0.0:%d", *port)
	fmt.Println("=========================================================")
	fmt.Printf("   TERMINATOR SEC - Cloud Admin & Telemetry Server\n")
	fmt.Printf("   Dashboard & API: http://localhost:%d\n", *port)
	fmt.Println("=========================================================")

	log.Fatal(http.ListenAndServe(addr, handler))
}

func (s *CentralServer) seedInitialEvents() {
	sampleTargets := []string{
		"google.com",
		"appleid-login-support.tk",
		"github.com",
		"sub.paypal-security-verification.com",
		"xk9qz7w4lm2p0a.xyz",
		"emotet-c2.net",
		"cloudflare.com",
		"c2-sync-payload.top",
	}

	for i, target := range sampleTargets {
		v := s.analyzer.AnalyzeDomain(target)
		evt := engine.ThreatEvent{
			ID:         fmt.Sprintf("seed_%d", i+1),
			DeviceID:   "dev_mac_arm01",
			DeviceName: "MacBook-Pro-M-Series",
			OS:         "macOS",
			Verdict:    v,
			ResolvedAt: time.Now().Add(-time.Duration(len(sampleTargets)-i) * 30 * time.Second),
			LatencyMs:  0.42,
		}
		s.logger.LogEvent(evt)
	}
}

func (s *CentralServer) handleStatus(w http.ResponseWriter, r *http.Request) {
	events := s.logger.GetEvents(1000)
	var blocked, queued, total uint64
	total = uint64(len(events))
	for _, e := range events {
		if e.Verdict.Action == engine.ActionAutoBlock {
			blocked++
		} else if e.Verdict.Action == engine.ActionQueueUser {
			queued++
		}
	}

	status := ipc.AgentStatus{
		AgentVersion:       "1.0.0-gold",
		Platform:           "Cross-Platform Hybrid (macOS + Windows VM)",
		IsAdmin:            true,
		DNSProxyPort:       53,
		DNSProxyActive:     true,
		ProcessWatchActive: true,
		FSGuardActive:      true,
		TotalQueries:       total,
		ThreatsBlocked:     blocked,
		ThreatsQueued:      queued,
		UptimeSeconds:      time.Since(s.startTime).Seconds(),
		CPUUsagePct:        0.18,
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(status)
}

func (s *CentralServer) handleEvents(w http.ResponseWriter, r *http.Request) {
	events := s.logger.GetEvents(100)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(events)
}

// handleIngest accepts a batch of ThreatEvents from a remote agent.
func (s *CentralServer) handleIngest(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var events []engine.ThreatEvent
	if err := json.NewDecoder(r.Body).Decode(&events); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	for _, evt := range events {
		s.logger.LogEvent(evt)
		// Broadcast each ingested event to connected dashboard clients
		s.broadcastWS(map[string]interface{}{
			"type":  "THREAT_EVENT",
			"event": evt,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"status":   "ok",
		"ingested": len(events),
	})
}

// handleHeartbeat accepts a live status heartbeat from a remote agent
// and dynamically updates the fleet registry.
func (s *CentralServer) handleHeartbeat(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var hb struct {
		AgentID        string    `json:"agent_id"`
		Hostname       string    `json:"hostname"`
		OS             string    `json:"os"`
		Version        string    `json:"agent_version"`
		CPUUsagePct    float64   `json:"cpu_usage_pct"`
		TotalQueries   uint64    `json:"total_queries"`
		ThreatsBlocked uint64    `json:"threats_blocked"`
		Timestamp      time.Time `json:"timestamp"`
	}
	if err := json.NewDecoder(r.Body).Decode(&hb); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	status := "Protected"
	if hb.ThreatsBlocked > 50 {
		status = "Warning"
	}

	s.mu.Lock()
	updated := false
	for i, d := range s.fleet {
		if d.ID == hb.AgentID || d.Hostname == hb.Hostname {
			s.fleet[i].LastSeen = time.Now()
			s.fleet[i].CPUUsage = hb.CPUUsagePct
			s.fleet[i].Status = status
			s.fleet[i].Version = hb.Version
			updated = true
			break
		}
	}
	if !updated {
		// Register new agent dynamically
		s.fleet = append(s.fleet, DeviceInfo{
			ID:       hb.AgentID,
			Hostname: hb.Hostname,
			OS:       hb.OS,
			Version:  hb.Version,
			IP:       r.RemoteAddr,
			Status:   status,
			LastSeen: time.Now(),
			CPUUsage: hb.CPUUsagePct,
		})
	}
	s.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func (s *CentralServer) handleFleet(w http.ResponseWriter, r *http.Request) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(s.fleet)
}


func (s *CentralServer) handleAnalytics(w http.ResponseWriter, r *http.Request) {
	events := s.logger.GetEvents(500)
	categoryCounts := make(map[string]int)
	severityBuckets := map[string]int{
		"Low (1-3)":    0,
		"Medium (4-7)": 0,
		"High (8-10)":  0,
	}

	var totalLatency float64
	for _, e := range events {
		categoryCounts[string(e.Verdict.Category)]++
		switch {
		case e.Verdict.Severity >= 8:
			severityBuckets["High (8-10)"]++
		case e.Verdict.Severity >= 4:
			severityBuckets["Medium (4-7)"]++
		default:
			severityBuckets["Low (1-3)"]++
		}
		totalLatency += e.LatencyMs
	}

	avgLatency := 0.35
	if len(events) > 0 {
		avgLatency = totalLatency / float64(len(events))
	}

	resp := map[string]interface{}{
		"categories":       categoryCounts,
		"severity_buckets": severityBuckets,
		"average_latency_ms": avgLatency,
		"total_events":     len(events),
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(resp)
}

func (s *CentralServer) handleDecision(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		EventID string            `json:"event_id"`
		Target  string            `json:"target"`
		Choice  engine.UserChoice `json:"choice"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	switch req.Choice {
	case engine.ChoiceTrustSource:
		s.analyzer.TrustSource(req.Target)
	case engine.ChoiceAlwaysBlock:
		s.analyzer.BlockSource(req.Target)
	}

	// Broadcast update to websocket clients
	s.broadcastWS(map[string]interface{}{
		"type":     "DECISION_CONFIRMED",
		"event_id": req.EventID,
		"target":   req.Target,
		"choice":   req.Choice,
	})

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func (s *CentralServer) handleSimulate(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Target     string `json:"target"`
		ThreatType string `json:"threat_type"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	if req.Target == "" {
		switch req.ThreatType {
		case "ransomware":
			req.Target = "lockbit-leak.onion.to"
		case "phish":
			req.Target = "paypal-security-verification.com"
		case "dga":
			req.Target = "q8v9zx1am29kp0.xyz"
		default:
			req.Target = "emotet-c2.net"
		}
	}

	start := time.Now()
	verdict := s.analyzer.AnalyzeDomain(req.Target)
	latency := float64(time.Since(start).Microseconds()) / 1000.0

	event := engine.ThreatEvent{
		ID:         fmt.Sprintf("sim_%d", time.Now().UnixNano()),
		DeviceID:   "dev_mac_arm01",
		DeviceName: "MacBook-Pro-M-Series",
		OS:         "macOS 15.0",
		Verdict:    verdict,
		ResolvedAt: time.Now(),
		LatencyMs:  latency,
	}

	s.logger.LogEvent(event)
	s.broadcastWS(map[string]interface{}{
		"type":  "THREAT_EVENT",
		"event": event,
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(event)
}

func (s *CentralServer) handleWS(ws *websocket.Conn) {
	s.mu.Lock()
	s.wsClients[ws] = true
	s.mu.Unlock()

	defer func() {
		s.mu.Lock()
		delete(s.wsClients, ws)
		s.mu.Unlock()
		_ = ws.Close()
	}()

	// Send initial greeting
	_ = websocket.JSON.Send(ws, map[string]string{"status": "connected", "server": "Terminator Sec Central"})

	// Keep alive / read loop
	for {
		var msg map[string]interface{}
		if err := websocket.JSON.Receive(ws, &msg); err != nil {
			break
		}
	}
}

func (s *CentralServer) broadcastWS(payload interface{}) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for ws := range s.wsClients {
		_ = websocket.JSON.Send(ws, payload)
	}
}
