package audit

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/terminator-sec/terminator/pkg/engine"
)

// AuditLogger manages local audit trails and real-time event broadcasting.
type AuditLogger struct {
	mu          sync.RWMutex
	events      []engine.ThreatEvent
	maxMemory   int
	logFilePath string
	file        *os.File
	subscribers map[chan engine.ThreatEvent]bool
}

// NewAuditLogger initializes the audit logger.
func NewAuditLogger(logFilePath string, maxMemoryEvents int) (*AuditLogger, error) {
	if maxMemoryEvents <= 0 {
		maxMemoryEvents = 1000
	}

	var file *os.File
	if logFilePath != "" {
		_ = os.MkdirAll(filepath.Dir(logFilePath), 0755)
		var err error
		file, err = os.OpenFile(logFilePath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
		if err != nil {
			return nil, fmt.Errorf("failed to open audit log file: %w", err)
		}
	}

	return &AuditLogger{
		events:      make([]engine.ThreatEvent, 0, maxMemoryEvents),
		maxMemory:   maxMemoryEvents,
		logFilePath: logFilePath,
		file:        file,
		subscribers: make(map[chan engine.ThreatEvent]bool),
	}, nil
}

// LogEvent records a new threat or resolution event.
func (al *AuditLogger) LogEvent(event engine.ThreatEvent) {
	al.mu.Lock()
	defer al.mu.Unlock()

	if event.ID == "" {
		event.ID = fmt.Sprintf("evt_%d_%d", time.Now().UnixNano(), len(al.events))
	}
	if event.ResolvedAt.IsZero() {
		event.ResolvedAt = time.Now()
	}

	// Keep memory ring buffer within bounds
	if len(al.events) >= al.maxMemory {
		al.events = al.events[1:]
	}
	al.events = append(al.events, event)

	// Write to JSONL file
	if al.file != nil {
		data, err := json.Marshal(event)
		if err == nil {
			_, _ = al.file.Write(append(data, '\n'))
		}
	}

	// Broadcast to active subscribers (non-blocking)
	for ch := range al.subscribers {
		select {
		case ch <- event:
		default:
			// Subscriber slow, drop to prevent lockup
		}
	}
}

// GetEvents returns a snapshot of stored events.
func (al *AuditLogger) GetEvents(limit int) []engine.ThreatEvent {
	al.mu.RLock()
	defer al.mu.RUnlock()

	if limit <= 0 || limit > len(al.events) {
		limit = len(al.events)
	}

	start := len(al.events) - limit
	result := make([]engine.ThreatEvent, limit)
	copy(result, al.events[start:])
	return result
}

// Subscribe returns a channel receiving real-time events.
func (al *AuditLogger) Subscribe() chan engine.ThreatEvent {
	al.mu.Lock()
	defer al.mu.Unlock()

	ch := make(chan engine.ThreatEvent, 100)
	al.subscribers[ch] = true
	return ch
}

// Unsubscribe removes a channel subscriber.
func (al *AuditLogger) Unsubscribe(ch chan engine.ThreatEvent) {
	al.mu.Lock()
	defer al.mu.Unlock()

	delete(al.subscribers, ch)
	close(ch)
}

// Close flushes and closes log file.
func (al *AuditLogger) Close() error {
	al.mu.Lock()
	defer al.mu.Unlock()

	if al.file != nil {
		return al.file.Close()
	}
	return nil
}
