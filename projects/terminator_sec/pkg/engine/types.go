package engine

import (
	"time"
)

// ThreatAction defines the enforcement decision taken by the engine.
type ThreatAction string

const (
	ActionAllow     ThreatAction = "ALLOW"      // Low risk (1-3): Allow and log to audit trail
	ActionQueueUser ThreatAction = "QUEUE_USER" // Medium risk (4-7): Hold & prompt user popup (Allow once/Block/Trust)
	ActionAutoBlock ThreatAction = "AUTO_BLOCK" // High risk (8-10): Immediate drop/NXDOMAIN/freeze & notify
)

// UserChoice defines the response when a prompt is answered.
type UserChoice string

const (
	ChoiceAllowOnce   UserChoice = "ALLOW_ONCE"
	ChoiceAlwaysBlock UserChoice = "ALWAYS_BLOCK"
	ChoiceTrustSource UserChoice = "TRUST_SOURCE"
	ChoicePending     UserChoice = "PENDING"
)

// ThreatCategory classifies the detected threat.
type ThreatCategory string

const (
	CategoryPhishing       ThreatCategory = "PHISHING"
	CategoryC2Server       ThreatCategory = "C2_SERVER"
	CategoryRansomware     ThreatCategory = "RANSOMWARE"
	CategoryDGA            ThreatCategory = "DGA_ANOMALY"
	CategoryMalwareHash    ThreatCategory = "MALWARE_HASH"
	CategoryCryptominer    ThreatCategory = "CRYPTOMINER"
	CategorySuspiciousProc ThreatCategory = "SUSPICIOUS_PROCESS"
	CategoryPortScan       ThreatCategory = "PORT_SCAN"
	CategoryKnownBadIP     ThreatCategory = "BAD_REPUTATION_IP"
	CategoryBenign         ThreatCategory = "BENIGN"
)

// ThreatVerdict is the output of the multi-tier analysis engine.
type ThreatVerdict struct {
	Target       string         `json:"target"`        // Domain, IP, File Path, or Process Name
	TargetType   string         `json:"target_type"`   // "domain", "ip", "file_hash", "process"
	Severity     int            `json:"severity"`      // 1 to 10
	Action       ThreatAction   `json:"action"`        // ALLOW, QUEUE_USER, AUTO_BLOCK
	Category     ThreatCategory `json:"category"`      // Threat category
	ThreatName   string         `json:"threat_name"`   // Human-readable title
	Reason       string         `json:"reason"`        // Detailed explanation
	MatchedTier  int            `json:"matched_tier"`  // 1: Radix/Bloom, 2: Heuristic/ML, 3: Signature DB
	Entropy      float64        `json:"entropy"`       // Calculated entropy (if applicable)
	Confidence   float64        `json:"confidence"`    // 0.0 to 1.0
	Timestamp    time.Time      `json:"timestamp"`
	ProcessID    int            `json:"pid,omitempty"`
	ProcessName  string         `json:"process_name,omitempty"`
	SourcePort   int            `json:"src_port,omitempty"`
	Destination  string         `json:"destination,omitempty"`
}

// ThreatEvent represents a recorded event in the local and central audit trail.
type ThreatEvent struct {
	ID          string        `json:"id"`
	DeviceID    string        `json:"device_id"`
	DeviceName  string        `json:"device_name"`
	OS          string        `json:"os"`
	Verdict     ThreatVerdict `json:"verdict"`
	UserChoice  UserChoice    `json:"user_choice,omitempty"`
	ResolvedAt  time.Time     `json:"resolved_at"`
	LatencyMs   float64       `json:"latency_ms"`
}
