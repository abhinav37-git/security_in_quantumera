package monitor

import (
	"fmt"
	"sync"
	"time"

	"github.com/terminator-sec/terminator/pkg/audit"
	"github.com/terminator-sec/terminator/pkg/engine"
	"github.com/terminator-sec/terminator/pkg/ipc"
)

// NetworkMonitor tracks outbound connections, suspicious IP interactions, and port scan activity.
type NetworkMonitor struct {
	mu           sync.Mutex
	analyzer     *engine.ThreatAnalyzer
	logger       *audit.AuditLogger
	ipcServer    *ipc.Server
	portActivity map[string][]int // srcIP -> target ports contacted in window
	stopChan     chan struct{}
}

// NewNetworkMonitor creates a network monitor instance.
func NewNetworkMonitor(analyzer *engine.ThreatAnalyzer, logger *audit.AuditLogger, ipcServer *ipc.Server) *NetworkMonitor {
	return &NetworkMonitor{
		analyzer:     analyzer,
		logger:       logger,
		ipcServer:    ipcServer,
		portActivity: make(map[string][]int),
		stopChan:     make(chan struct{}),
	}
}

// InspectConnection evaluates an outbound or inbound network connection.
func (nm *NetworkMonitor) InspectConnection(srcIP string, srcPort int, dstIP string, dstPort int) {
	nm.mu.Lock()
	defer nm.mu.Unlock()

	// 1. IP Threat Intelligence check
	verdict := nm.analyzer.AnalyzeIP(dstIP)
	if verdict.Severity >= 8 {
		verdict.SourcePort = srcPort
		verdict.Destination = fmt.Sprintf("%s:%d", dstIP, dstPort)

		event := engine.ThreatEvent{
			ID:         fmt.Sprintf("net_%d", time.Now().UnixNano()),
			DeviceName: "Local Endpoint",
			OS:         "Host",
			Verdict:    verdict,
			ResolvedAt: time.Now(),
			LatencyMs:  0.2,
		}

		nm.logger.LogEvent(event)
		if nm.ipcServer != nil {
			nm.ipcServer.BroadcastAlert(event)
		}
		return
	}

	// 2. Port scan heuristic: Track distinct target ports in window
	ports := nm.portActivity[srcIP]
	ports = append(ports, dstPort)
	if len(ports) > 20 {
		ports = ports[len(ports)-20:]
	}
	nm.portActivity[srcIP] = ports

	distinctPorts := make(map[int]bool)
	for _, p := range ports {
		distinctPorts[p] = true
	}

	if len(distinctPorts) >= 15 {
		scanVerdict := engine.ThreatVerdict{
			Target:      fmt.Sprintf("%s (Scanning Local Network)", srcIP),
			TargetType:  "ip",
			Severity:    8,
			Action:      engine.ActionAutoBlock,
			Category:    engine.CategoryPortScan,
			ThreatName:  "Port Scanning / Reconnaissance Detected",
			Reason:      fmt.Sprintf("Host probed %d distinct ports in short interval", len(distinctPorts)),
			MatchedTier: 2,
			Confidence:  0.95,
			Timestamp:   time.Now(),
		}

		event := engine.ThreatEvent{
			ID:         fmt.Sprintf("net_scan_%d", time.Now().UnixNano()),
			DeviceName: "Local Endpoint",
			OS:         "Host",
			Verdict:    scanVerdict,
			ResolvedAt: time.Now(),
			LatencyMs:  0.1,
		}

		nm.logger.LogEvent(event)
		if nm.ipcServer != nil {
			nm.ipcServer.BroadcastAlert(event)
		}
	}
}
