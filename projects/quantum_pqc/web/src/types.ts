export interface ScanJob {
  id: string;
  target_type: string;
  target_url: string;
  status: 'pending' | 'scanning' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
}

export interface Finding {
  id: string;
  scan_id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  rule_id: string;
  file_path: string;
  line_no: number;
  algorithm: string;
  description: string;
  remediation: string;
}

export interface CBOMComponent {
  name: string;
  version: string;
  crypto_asset_type: 'Cipher' | 'Signature' | 'KEM' | 'Hash' | 'Key Exchange';
  algorithm: string;
  key_length: string;
  quantum_safe: boolean;
}

export interface Certificate {
  id: string;
  scan_id: string;
  endpoint: string;
  subject: string;
  issuer: string;
  algorithm: string;
  key_bits: number;
  expiry: string;
  pq_hybrid: boolean;
  cnsa_compliant: boolean;
}

export interface IssuedCertificate {
  id: string;
  common_name: string;
  serial_number: string;
  issuer: string;
  signature_algorithm: string;
  revoked: boolean;
  pem_block: string;
  created_at: string;
}

export interface ProxyHandshake {
  id: string;
  timestamp: string;
  client_ip: string;
  cipher_suite: string;
  tls_version: string;
  pq_hybrid: boolean;
  latency_ms: number;
  backend_target: string;
}

export interface SignedArtifact {
  id: string;
  artifact_name: string;
  signature: string;
  public_key: string;
  status: 'VALID' | 'REVOKED' | 'EXPIRED';
  lms_tree_index: number;
  created_at: string;
}

export type TabType = 
  | 'home' 
  | 'dashboard' 
  | 'scan_new' 
  | 'scan_detail' 
  | 'certs' 
  | 'proxy' 
  | 'ca' 
  | 'sign' 
  | 'standards';

export type ThemeMode = 'dark' | 'light';

export interface ServiceHealth {
  name: string;
  status: 'online' | 'degraded' | 'offline';
  latency: string;
  port: string;
  description: string;
}
