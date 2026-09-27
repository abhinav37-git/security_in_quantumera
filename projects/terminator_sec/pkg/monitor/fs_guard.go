package monitor

import (
	"fmt"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/terminator-sec/terminator/pkg/audit"
	"github.com/terminator-sec/terminator/pkg/engine"
	"github.com/terminator-sec/terminator/pkg/ipc"
)

// FileSystemGuard detects rapid file modifications, ransomware extensions, and high entropy writes.
type FileSystemGuard struct {
	mu           sync.Mutex
	analyzer     *engine.ThreatAnalyzer
	logger       *audit.AuditLogger
	ipcServer    *ipc.Server
	recentWrites map[string]int // path -> modification count in window
	stopChan     chan struct{}
}

// NewFileSystemGuard initializes the filesystem tripwire.
func NewFileSystemGuard(analyzer *engine.ThreatAnalyzer, logger *audit.AuditLogger, ipcServer *ipc.Server) *FileSystemGuard {
	return &FileSystemGuard{
		analyzer:     analyzer,
		logger:       logger,
		ipcServer:    ipcServer,
		recentWrites: make(map[string]int),
		stopChan:     make(chan struct{}),
	}
}

// InspectFileEvent evaluates a filesystem event (created/renamed/written).
func (fsg *FileSystemGuard) InspectFileEvent(filePath string, entropy float64, isBulk bool) {
	fsg.mu.Lock()
	defer fsg.mu.Unlock()

	ext := strings.ToLower(filepath.Ext(filePath))
	if ransomwareName, found := engine.KnownRansomwareExtensions[ext]; found {
		verdict := engine.ThreatVerdict{
			Target:      filePath,
			TargetType:  "file_path",
			Severity:    10,
			Action:      engine.ActionAutoBlock,
			Category:    engine.CategoryRansomware,
			ThreatName:  fmt.Sprintf("Ransomware Extension: %s", ransomwareName),
			Reason:      fmt.Sprintf("Detected known ransomware extension '%s' applied to file", ext),
			MatchedTier: 1,
			Confidence:  0.99,
			Timestamp:   time.Now(),
		}

		event := engine.ThreatEvent{
			ID:         fmt.Sprintf("fs_%d", time.Now().UnixNano()),
			DeviceName: "Local Endpoint",
			OS:         "Host",
			Verdict:    verdict,
			ResolvedAt: time.Now(),
			LatencyMs:  0.1,
		}

		fsg.logger.LogEvent(event)
		if fsg.ipcServer != nil {
			fsg.ipcServer.BroadcastAlert(event)
		}
		return
	}

	// High entropy bulk write check (Ransomware encryption heuristic)
	if entropy >= 7.8 && isBulk {
		verdict := engine.ThreatVerdict{
			Target:      filePath,
			TargetType:  "file_path",
			Severity:    9,
			Action:      engine.ActionAutoBlock,
			Category:    engine.CategoryRansomware,
			ThreatName:  "Ransomware Bulk Encryption Heuristic",
			Reason:      fmt.Sprintf("Extreme Shannon entropy (%.2f/8.0) detected across rapid bulk file write operations", entropy),
			MatchedTier: 2,
			Entropy:     entropy,
			Confidence:  0.95,
			Timestamp:   time.Now(),
		}

		event := engine.ThreatEvent{
			ID:         fmt.Sprintf("fs_%d", time.Now().UnixNano()),
			DeviceName: "Local Endpoint",
			OS:         "Host",
			Verdict:    verdict,
			ResolvedAt: time.Now(),
			LatencyMs:  0.2,
		}

		fsg.logger.LogEvent(event)
		if fsg.ipcServer != nil {
			fsg.ipcServer.BroadcastAlert(event)
		}
	}
}
