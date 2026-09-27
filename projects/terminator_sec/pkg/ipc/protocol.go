package ipc

import (
	"github.com/terminator-sec/terminator/pkg/engine"
)

// MessageType indicates the purpose of an IPC frame.
type MessageType string

const (
	MsgTypeThreatAlert     MessageType = "THREAT_ALERT"     // Daemon -> UI: Threat detected
	MsgTypePromptUser      MessageType = "PROMPT_USER"      // Daemon -> UI: Medium threat needs decision
	MsgTypeUserDecision    MessageType = "USER_DECISION"    // UI -> Daemon: User responded to prompt
	MsgTypeGetStatus       MessageType = "GET_STATUS"       // UI/CLI -> Daemon: Query agent status
	MsgTypeStatusResponse  MessageType = "STATUS_RESPONSE"  // Daemon -> UI/CLI: Agent status response
	MsgTypeGetAuditEvents  MessageType = "GET_AUDIT_EVENTS" // UI/CLI -> Daemon: Fetch historical events
	MsgTypeAuditResponse   MessageType = "AUDIT_RESPONSE"   // Daemon -> UI/CLI: Historical events
	MsgTypePolicyUpdate    MessageType = "POLICY_UPDATE"    // UI/Admin -> Daemon: Trust/Block update
)

// Message is the standard JSON frame for local IPC communication.
type Message struct {
	Type        MessageType         `json:"type"`
	EventID     string              `json:"event_id,omitempty"`
	Event       *engine.ThreatEvent `json:"event,omitempty"`
	UserChoice  engine.UserChoice   `json:"user_choice,omitempty"`
	Target      string              `json:"target,omitempty"`
	Status      *AgentStatus        `json:"status,omitempty"`
	Events      []engine.ThreatEvent`json:"events,omitempty"`
	Error       string              `json:"error,omitempty"`
}

// AgentStatus represents the real-time operational status of Terminator Sec.
type AgentStatus struct {
	AgentVersion     string  `json:"agent_version"`
	Platform         string  `json:"platform"`
	IsAdmin          bool    `json:"is_admin"`
	DNSProxyPort     int     `json:"dns_proxy_port"`
	DNSProxyActive   bool    `json:"dns_proxy_active"`
	ProcessWatchActive bool  `json:"process_watch_active"`
	FSGuardActive    bool    `json:"fs_guard_active"`
	TotalQueries     uint64  `json:"total_queries"`
	ThreatsBlocked   uint64  `json:"threats_blocked"`
	ThreatsQueued    uint64  `json:"threats_queued"`
	UptimeSeconds    float64 `json:"uptime_seconds"`
	CPUUsagePct      float64 `json:"cpu_usage_pct"`
}
