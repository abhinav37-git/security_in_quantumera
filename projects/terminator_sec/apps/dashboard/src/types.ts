export type ThreatAction = 'ALLOW' | 'QUEUE_USER' | 'AUTO_BLOCK';
export type UserChoice = 'ALLOW_ONCE' | 'ALWAYS_BLOCK' | 'TRUST_SOURCE' | 'PENDING';
export type ThreatCategory = 
  | 'PHISHING'
  | 'C2_SERVER'
  | 'RANSOMWARE'
  | 'DGA_ANOMALY'
  | 'MALWARE_HASH'
  | 'CRYPTOMINER'
  | 'SUSPICIOUS_PROCESS'
  | 'PORT_SCAN'
  | 'BAD_REPUTATION_IP'
  | 'BENIGN';

export interface ThreatVerdict {
  target: string;
  target_type: string;
  severity: number;
  action: ThreatAction;
  category: ThreatCategory;
  threat_name: string;
  reason: string;
  matched_tier: number;
  entropy?: number;
  confidence: number;
  timestamp: string;
  pid?: number;
  process_name?: string;
}

export interface ThreatEvent {
  id: string;
  device_id?: string;
  device_name: string;
  os: string;
  verdict: ThreatVerdict;
  user_choice?: UserChoice;
  resolved_at: string;
  latency_ms: number;
}

export interface AgentStatus {
  agent_version: string;
  platform: string;
  is_admin: boolean;
  dns_proxy_port: number;
  dns_proxy_active: boolean;
  process_watch_active: boolean;
  fs_guard_active: boolean;
  total_queries: number;
  threats_blocked: number;
  threats_queued: number;
  uptime_seconds: number;
  cpu_usage_pct: number;
}

export interface DeviceInfo {
  id: string;
  hostname: string;
  os: string;
  version: string;
  ip: string;
  status: 'Protected' | 'Warning' | 'Offline';
  last_seen: string;
  cpu_usage: number;
}
