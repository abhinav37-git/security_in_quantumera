package monitor

import (
	"fmt"
	"sync"
	"time"

	"github.com/terminator-sec/terminator/pkg/audit"
	"github.com/terminator-sec/terminator/pkg/engine"
	"github.com/terminator-sec/terminator/pkg/ipc"
	"github.com/terminator-sec/terminator/pkg/platform"
)

// ProcessWatcher continuously inspects running processes for malicious execution patterns.
type ProcessWatcher struct {
	mu          sync.Mutex
	platform    platform.PlatformManager
	analyzer    *engine.ThreatAnalyzer
	logger      *audit.AuditLogger
	ipcServer   *ipc.Server
	seenPIDs    map[int]bool
	stopChan    chan struct{}
	pollInterval time.Duration
}

// NewProcessWatcher creates a new process monitoring guard.
func NewProcessWatcher(pm platform.PlatformManager, analyzer *engine.ThreatAnalyzer, logger *audit.AuditLogger, ipcServer *ipc.Server) *ProcessWatcher {
	return &ProcessWatcher{
		platform:     pm,
		analyzer:     analyzer,
		logger:       logger,
		ipcServer:    ipcServer,
		seenPIDs:     make(map[int]bool),
		stopChan:     make(chan struct{}),
		pollInterval: 2 * time.Second,
	}
}

// Start begins the background process inspection loop.
func (pw *ProcessWatcher) Start() {
	go pw.loop()
}

func (pw *ProcessWatcher) loop() {
	ticker := time.NewTicker(pw.pollInterval)
	defer ticker.Stop()

	for {
		select {
		case <-pw.stopChan:
			return
		case <-ticker.C:
			pw.scanProcesses()
		}
	}
}

func (pw *ProcessWatcher) scanProcesses() {
	procs, err := pw.platform.GetRunningProcesses()
	if err != nil {
		return
	}

	pw.mu.Lock()
	defer pw.mu.Unlock()

	currentPIDs := make(map[int]bool)
	for _, proc := range procs {
		currentPIDs[proc.PID] = true

		// If this is a newly spawned process
		if !pw.seenPIDs[proc.PID] {
			pw.seenPIDs[proc.PID] = true

			verdict := pw.analyzer.AnalyzeProcess(proc.PID, proc.Name, proc.CommandLine)
			if verdict.Severity >= 4 {
				event := engine.ThreatEvent{
					ID:         fmt.Sprintf("proc_%d_%d", time.Now().UnixNano(), proc.PID),
					DeviceName: "Local Endpoint",
					OS:         pw.platform.GetPlatformName(),
					Verdict:    verdict,
					ResolvedAt: time.Now(),
					LatencyMs:  0.5,
				}

				pw.logger.LogEvent(event)
				if pw.ipcServer != nil {
					pw.ipcServer.BroadcastAlert(event)
				}
			}
		}
	}

	// Cleanup old terminated PIDs
	for pid := range pw.seenPIDs {
		if !currentPIDs[pid] {
			delete(pw.seenPIDs, pid)
		}
	}
}

// Stop terminates the process watcher.
func (pw *ProcessWatcher) Stop() {
	close(pw.stopChan)
}
