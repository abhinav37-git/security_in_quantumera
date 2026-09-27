import { ScanJob, Finding, CBOMComponent, Certificate, IssuedCertificate, ProxyHandshake, SignedArtifact, ServiceHealth } from './types';

export const INITIAL_SCANS: ScanJob[] = [
  {
    id: 'scan-8f2a1b90',
    target_type: 'codebase',
    target_url: '/Users/x/Personal/vscode/quantum_pqc',
    status: 'completed',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    completed_at: new Date(Date.now() - 3600000 * 1.9).toISOString(),
  },
  {
    id: 'scan-3c91d4e2',
    target_type: 'endpoint',
    target_url: 'api.quantumshield.internal:443',
    status: 'completed',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    completed_at: new Date(Date.now() - 3600000 * 11.9).toISOString(),
  },
  {
    id: 'scan-7e10a563',
    target_type: 'codebase',
    target_url: 'https://github.com/enterprise/core-auth-service',
    status: 'completed',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    completed_at: new Date(Date.now() - 3600000 * 23.8).toISOString(),
  }
];

export const INITIAL_FINDINGS: Finding[] = [
  {
    id: 'f-101',
    scan_id: 'scan-8f2a1b90',
    severity: 'HIGH',
    rule_id: 'PQC-L001-RSA',
    file_path: 'apps/legacy_gateway/tls_config.go',
    line_no: 42,
    algorithm: 'RSA-2048',
    description: 'Vulnerable RSA-2048 asymmetric key exchange detected. Vulnerable to Shor\'s algorithm.',
    remediation: 'Migrate TLS configuration to X25519_MLKEM768 hybrid key exchange (FIPS 203).',
  },
  {
    id: 'f-102',
    scan_id: 'scan-8f2a1b90',
    severity: 'CRITICAL',
    rule_id: 'PQC-L002-SHA1',
    file_path: 'shared/legacy_hash/md5_sha1.go',
    line_no: 118,
    algorithm: 'SHA-1',
    description: 'Legacy collision-prone digest algorithm SHA-1 used for digital signature hash prefix.',
    remediation: 'Replace SHA-1 with SHA-384 or SHA-512 in accordance with CNSA 2.0 policy.',
  },
  {
    id: 'f-103',
    scan_id: 'scan-8f2a1b90',
    severity: 'MEDIUM',
    rule_id: 'PQC-L003-ECDSA',
    file_path: 'apps/api/auth/token_verifier.go',
    line_no: 87,
    algorithm: 'ECDSA P-256',
    description: 'Elliptic curve digital signature algorithm without post-quantum signature encapsulation.',
    remediation: 'Upgrade signature verification to dual-signed X.509 with ML-DSA-87 (FIPS 204).',
  },
  {
    id: 'f-104',
    scan_id: 'scan-8f2a1b90',
    severity: 'LOW',
    rule_id: 'PQC-L004-AES128',
    file_path: 'config/cipher_suite.yaml',
    line_no: 14,
    algorithm: 'AES-128-GCM',
    description: 'Symmetric cipher key size < 256 bits reduces post-quantum security margin under Grover\'s algorithm.',
    remediation: 'Enforce AES-256-GCM across all ingress and egress internal microservice proxies.',
  }
];

export const INITIAL_COMPONENTS: CBOMComponent[] = [
  {
    name: 'X25519_MLKEM768',
    version: 'NIST FIPS 203',
    crypto_asset_type: 'KEM',
    algorithm: 'ML-KEM-768 / Kyber',
    key_length: '1184-byte pubkey',
    quantum_safe: true,
  },
  {
    name: 'ML-DSA-87',
    version: 'NIST FIPS 204',
    crypto_asset_type: 'Signature',
    algorithm: 'ML-DSA-87 (Dilithium5)',
    key_length: '2592-byte pubkey',
    quantum_safe: true,
  },
  {
    name: 'LMS-H10/W4',
    version: 'RFC 8554',
    crypto_asset_type: 'Signature',
    algorithm: 'Leighton-Micali Stateful Hash Signature',
    key_length: 'H=10, W=4',
    quantum_safe: true,
  },
  {
    name: 'RSA-2048',
    version: 'PKCS#1 v1.5',
    crypto_asset_type: 'Cipher',
    algorithm: 'RSA-2048',
    key_length: '2048 bits',
    quantum_safe: false,
  },
  {
    name: 'ECDSA_P256',
    version: 'SECG secp256r1',
    crypto_asset_type: 'Signature',
    algorithm: 'ECDSA P-256',
    key_length: '256 bits',
    quantum_safe: false,
  },
  {
    name: 'AES-256-GCM',
    version: 'NIST SP 800-38D',
    crypto_asset_type: 'Cipher',
    algorithm: 'AES-256-GCM',
    key_length: '256 bits',
    quantum_safe: true,
  }
];

export const INITIAL_CERTS: Certificate[] = [
  {
    id: 'cert-101',
    scan_id: 'scan-3c91d4e2',
    endpoint: 'api.quantumshield.internal:8080',
    subject: 'CN=api.quantumshield.internal, O=QuantumShield Enterprise, C=US',
    issuer: 'CN=QuantumShield Root CA G1 (ML-DSA-87 Hybrid)',
    algorithm: 'ML-DSA-87 + ECDSA P-384 Dual Signature',
    key_bits: 384,
    expiry: new Date(Date.now() + 365 * 86400000).toISOString(),
    pq_hybrid: true,
    cnsa_compliant: true,
  },
  {
    id: 'cert-102',
    scan_id: 'scan-3c91d4e2',
    endpoint: 'proxy.quantumshield.internal:8443',
    subject: 'CN=proxy.quantumshield.internal, O=QuantumShield Edge, C=US',
    issuer: 'CN=QuantumShield Intermediate CA (ML-DSA-87)',
    algorithm: 'ML-DSA-87',
    key_bits: 3072,
    expiry: new Date(Date.now() + 180 * 86400000).toISOString(),
    pq_hybrid: true,
    cnsa_compliant: true,
  },
  {
    id: 'cert-103',
    scan_id: 'scan-3c91d4e2',
    endpoint: 'legacy-vault.internal:443',
    subject: 'CN=legacy-vault.internal, O=Legacy Infrastructure, C=US',
    issuer: 'CN=DigiCert Global Root CA (Classical RSA)',
    algorithm: 'RSA-2048 with SHA-256',
    key_bits: 2048,
    expiry: new Date(Date.now() + 30 * 86400000).toISOString(),
    pq_hybrid: false,
    cnsa_compliant: false,
  }
];

export const INITIAL_ISSUED_CERTS: IssuedCertificate[] = [
  {
    id: 'issued-9901',
    common_name: 'shield-gateway.internal',
    serial_number: '7F9A2B4109C84E3F21',
    issuer: 'QuantumShield PQC CA (ML-DSA-87)',
    signature_algorithm: 'ML-DSA-87',
    revoked: false,
    pem_block: '-----BEGIN CERTIFICATE-----\nMIICqDCCAj2gAwIBAgITB3+aK0EJyE4/ITANBgkqhkiG9w0BAQsFADBLMRMwEQYD\nVQQDEwpPcGVuU1NMIENBMRUwEwYDVQQKEwxRdWFudHVtU2hpZWxkMQswCQYDVQQG\nEwJVUzAeFw0yNTA3MjYwMDAwMDBaFw0yNjA3MjYwMDAwMDBaMD0xGzAZBgNVBAMM\nEnNoaWVsZC1nYXRld2F5LmludGVybmFsMRUwEwYDVQQKEwxRdWFudHVtU2hpZWxk\n-----END CERTIFICATE-----',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'issued-9902',
    common_name: 'payment-router.finance.internal',
    serial_number: '12A3B4C5D6E7F8091A',
    issuer: 'QuantumShield PQC CA (ML-DSA-87)',
    signature_algorithm: 'ML-DSA-87 + ECDSA-P384',
    revoked: false,
    pem_block: '-----BEGIN CERTIFICATE-----\nMIIEtTCCAp2gAwIBAgITANCzvEXX+J81LzAIBgkqhkiG9w0BAQsFADBLMRMwEQYD\nVQQDEwpPcGVuU1NMIENBMRUwEwYDVQQKEwxRdWFudHVtU2hpZWxkMQswCQYDVQQG\nEwJVUzAeFw0yNTA3MjYwMDAwMDBaFw0yNjA3MjYwMDAwMDBaMD0xGzAZBgNVBAMM\nEnBheW1lbnQtcm91dGVyLmludGVybmFs\n-----END CERTIFICATE-----',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  }
];

export const INITIAL_HANDSHAKES: ProxyHandshake[] = [
  {
    id: 'hs-1',
    timestamp: new Date(Date.now() - 1000 * 12).toISOString(),
    client_ip: '10.0.4.12',
    cipher_suite: 'TLS_AES_256_GCM_SHA384 (X25519_MLKEM768)',
    tls_version: 'TLS 1.3 PQC',
    pq_hybrid: true,
    latency_ms: 1.62,
    backend_target: 'http://backend-api.internal:8080',
  },
  {
    id: 'hs-2',
    timestamp: new Date(Date.now() - 1000 * 35).toISOString(),
    client_ip: '10.0.4.44',
    cipher_suite: 'TLS_AES_256_GCM_SHA384 (Kyber768)',
    tls_version: 'TLS 1.3 PQC',
    pq_hybrid: true,
    latency_ms: 1.84,
    backend_target: 'http://auth-service.internal:8081',
  },
  {
    id: 'hs-3',
    timestamp: new Date(Date.now() - 1000 * 95).toISOString(),
    client_ip: '192.168.1.105',
    cipher_suite: 'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384',
    tls_version: 'TLS 1.2 Classical',
    pq_hybrid: false,
    latency_ms: 3.10,
    backend_target: 'http://legacy-db.internal:5432',
  }
];

export const INITIAL_SIGNATURES: SignedArtifact[] = [
  {
    id: 'sig-801',
    artifact_name: 'firmware-v4.2.1-arm64.bin',
    signature: 'lms_sig_00000001_8a91c0e3f4b5a6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1',
    public_key: 'lms_pubkey_h10_w4_99201f8273b45c6d',
    status: 'VALID',
    lms_tree_index: 1,
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'sig-802',
    artifact_name: 'quantumshield-agent-v2.0.0-linux.tar.gz',
    signature: 'lms_sig_00000002_7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e',
    public_key: 'lms_pubkey_h10_w4_99201f8273b45c6d',
    status: 'VALID',
    lms_tree_index: 2,
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
  }
];

export const SERVICES_HEALTH: ServiceHealth[] = [
  {
    name: 'API Gateway & CA Engine',
    status: 'online',
    latency: '1.2ms',
    port: '8080',
    description: 'Go REST API serving certs, signing calls, and CBOM reports.',
  },
  {
    name: 'Shield Proxy Gateway',
    status: 'online',
    latency: '1.8ms',
    port: '8443',
    description: 'High-throughput crypto-agile TLS reverse proxy (X25519_MLKEM768).',
  },
  {
    name: 'CBOM Scanner Daemon',
    status: 'online',
    latency: '14.5ms',
    port: 'Subprocess',
    description: 'Python CBOM discovery engine targeting repositories & TLS endpoints.',
  },
  {
    name: 'Stateful LMS Signer',
    status: 'online',
    latency: '0.9ms',
    port: 'In-Memory/DB',
    description: 'RFC 8554 state-guard Leighton-Micali signature key tracker.',
  },
  {
    name: 'PostgreSQL Trust Ledger',
    status: 'online',
    latency: '2.1ms',
    port: '5432',
    description: 'Persisted certificate, CBOM scan, and signature state DB.',
  }
];
