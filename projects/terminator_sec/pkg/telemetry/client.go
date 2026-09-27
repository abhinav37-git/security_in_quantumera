package telemetry

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"os"
	"runtime"
	"sync"
	"time"

	"github.com/terminator-sec/terminator/pkg/engine"
	"github.com/terminator-sec/terminator/pkg/ipc"
)

// HeartbeatPayload is the agent status payload sent to the central server.
type HeartbeatPayload struct {
	AgentID        string    `json:"agent_id"`
	Hostname       string    `json:"hostname"`
	OS             string    `json:"os"`
	Version        string    `json:"agent_version"`
	IPCPath        string    `json:"ipc_path"`
	UptimeSeconds  float64   `json:"uptime_seconds"`
	CPUUsagePct    float64   `json:"cpu_usage_pct"`
	MemUsageMB     float64   `json:"mem_usage_mb"`
	TotalQueries   uint64    `json:"total_queries"`
	ThreatsBlocked uint64    `json:"threats_blocked"`
	ThreatsQueued  uint64    `json:"threats_queued"`
	DNSProxyPort   int       `json:"dns_proxy_port"`
	DNSProxyActive bool      `json:"dns_proxy_active"`
	Timestamp      time.Time `json:"timestamp"`
}

// Client is the background telemetry forwarder that pushes heartbeats
// and batched audit events to the central terminator-server.
type Client struct {
	mu            sync.Mutex
	serverURL     string
	agentID       string
	hostname      string
	startTime     time.Time
	dnsProxyPort  int
	getStats      func() (total, blocked, queued uint64)
	getEvents     func(limit int) []engine.ThreatEvent
	lastFlushedID string
	httpClient    *http.Client
	stopChan      chan struct{}
}

// NewClient creates a telemetry client. Call Start() to begin background workers.
func NewClient(
	serverURL string,
	dnsProxyPort int,
	getStats func() (uint64, uint64, uint64),
	getEvents func(int) []engine.ThreatEvent,
	status func() *ipc.AgentStatus,
) *Client {
	hostname, _ := getHostname()
	return &Client{
		serverURL:    serverURL,
		agentID:      fmt.Sprintf("agent-%s-%d", hostname, time.Now().Unix()),
		hostname:     hostname,
		startTime:    time.Now(),
		dnsProxyPort: dnsProxyPort,
		getStats:     getStats,
		getEvents:    getEvents,
		httpClient: &http.Client{
			Timeout: 8 * time.Second,
		},
		stopChan: make(chan struct{}),
	}
}

// Start launches the heartbeat and event flush goroutines.
func (c *Client) Start() {
	log.Printf("[TELEMETRY] Starting telemetry forwarder → %s\n", c.serverURL)
	go c.heartbeatLoop()
	go c.eventFlushLoop()
}

// Stop gracefully shuts down the telemetry client.
func (c *Client) Stop() {
	close(c.stopChan)
}

// heartbeatLoop sends a status heartbeat every 10 seconds with exponential backoff on failure.
func (c *Client) heartbeatLoop() {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	// Send first heartbeat immediately
	c.sendHeartbeat()

	retryDelay := time.Duration(0)
	for {
		select {
		case <-c.stopChan:
			return
		case <-ticker.C:
			if retryDelay > 0 {
				time.Sleep(retryDelay)
			}
			if err := c.sendHeartbeat(); err != nil {
				retryDelay = backoff(retryDelay)
				log.Printf("[TELEMETRY] Heartbeat failed (retry in %s): %v\n", retryDelay, err)
			} else {
				retryDelay = 0
			}
		}
	}
}

// eventFlushLoop drains new audit events every 5 seconds.
func (c *Client) eventFlushLoop() {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	retryDelay := time.Duration(0)
	for {
		select {
		case <-c.stopChan:
			return
		case <-ticker.C:
			if retryDelay > 0 {
				time.Sleep(retryDelay)
			}
			if err := c.flushEvents(); err != nil {
				retryDelay = backoff(retryDelay)
				log.Printf("[TELEMETRY] Event flush failed (retry in %s): %v\n", retryDelay, err)
			} else {
				retryDelay = 0
			}
		}
	}
}

func (c *Client) sendHeartbeat() error {
	total, blocked, queued := c.getStats()

	var memStats runtime.MemStats
	runtime.ReadMemStats(&memStats)
	memMB := float64(memStats.Alloc) / 1024 / 1024

	payload := HeartbeatPayload{
		AgentID:        c.agentID,
		Hostname:       c.hostname,
		OS:             runtime.GOOS,
		Version:        "1.0.0-gold",
		UptimeSeconds:  time.Since(c.startTime).Seconds(),
		CPUUsagePct:    0.18, // Placeholder — replace with real sampler if needed
		MemUsageMB:     memMB,
		TotalQueries:   total,
		ThreatsBlocked: blocked,
		ThreatsQueued:  queued,
		DNSProxyPort:   c.dnsProxyPort,
		DNSProxyActive: true,
		Timestamp:      time.Now(),
	}

	return c.postJSON("/api/fleet/heartbeat", payload)
}

func (c *Client) flushEvents() error {
	if c.getEvents == nil {
		return nil
	}

	// Fetch latest 100 events from audit logger
	events := c.getEvents(100)
	if len(events) == 0 {
		return nil
	}

	// Find only events newer than the last flushed ID
	c.mu.Lock()
	lastID := c.lastFlushedID
	c.mu.Unlock()

	var newEvents []engine.ThreatEvent
	found := lastID == ""
	for _, e := range events {
		if found {
			newEvents = append(newEvents, e)
		}
		if e.ID == lastID {
			found = true
		}
	}

	if len(newEvents) == 0 {
		return nil
	}

	if err := c.postJSON("/api/events/ingest", newEvents); err != nil {
		return err
	}

	c.mu.Lock()
	c.lastFlushedID = newEvents[len(newEvents)-1].ID
	c.mu.Unlock()

	log.Printf("[TELEMETRY] Flushed %d events to server\n", len(newEvents))
	return nil
}

func (c *Client) postJSON(path string, payload interface{}) error {
	data, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal error: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, c.serverURL+path, bytes.NewReader(data))
	if err != nil {
		return fmt.Errorf("request error: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Agent-ID", c.agentID)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("http error: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("server returned %d for %s", resp.StatusCode, path)
	}
	return nil
}

// backoff returns an exponential backoff capped at 5 minutes.
func backoff(prev time.Duration) time.Duration {
	if prev == 0 {
		return 5 * time.Second
	}
	next := time.Duration(float64(prev) * math.Phi)
	if next > 5*time.Minute {
		return 5 * time.Minute
	}
	return next
}

func getHostname() (string, error) {
	return os.Hostname()
}
