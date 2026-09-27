-- QuantumShield database schema

CREATE TABLE IF NOT EXISTS scans (
    id VARCHAR(36) PRIMARY KEY,
    target_type VARCHAR(50) NOT NULL, -- 'repo', 'directory', 'zip', 'endpoint'
    target_url VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'pending', 'scanning', 'completed', 'failed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS findings (
    id VARCHAR(36) PRIMARY KEY,
    scan_id VARCHAR(36) REFERENCES scans(id) ON DELETE CASCADE,
    severity VARCHAR(20) NOT NULL, -- 'Critical', 'High', 'Medium', 'Low'
    rule_id VARCHAR(100) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    line_no INTEGER NOT NULL,
    algorithm VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    remediation TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cbom_components (
    id VARCHAR(36) PRIMARY KEY,
    scan_id VARCHAR(36) REFERENCES scans(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50),
    crypto_asset_type VARCHAR(50) NOT NULL, -- 'algorithm', 'library', 'certificate'
    algorithm VARCHAR(100),
    key_length VARCHAR(50),
    quantum_safe BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS certificates (
    id VARCHAR(36) PRIMARY KEY,
    scan_id VARCHAR(36) REFERENCES scans(id) ON DELETE CASCADE,
    endpoint VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    issuer VARCHAR(255) NOT NULL,
    algorithm VARCHAR(50) NOT NULL,
    key_bits INTEGER DEFAULT 0,
    expiry TIMESTAMP,
    pq_hybrid BOOLEAN DEFAULT FALSE,
    cnsa_compliant BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS handshakes (
    id VARCHAR(36) PRIMARY KEY,
    key_exchange VARCHAR(50) NOT NULL, -- e.g., 'X25519MLKEM768'
    handshake_ms INTEGER NOT NULL,
    client_ip VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS issued_certificates (
    id VARCHAR(36) PRIMARY KEY,
    common_name VARCHAR(255) NOT NULL,
    serial_number VARCHAR(100) NOT NULL,
    issuer VARCHAR(255) NOT NULL,
    signature_algorithm VARCHAR(50) NOT NULL, -- 'ML-DSA-87', 'LMS'
    revoked BOOLEAN DEFAULT FALSE,
    pem_block TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS signed_artifacts (
    id VARCHAR(36) PRIMARY KEY,
    artifact_name VARCHAR(255) NOT NULL,
    signature TEXT NOT NULL,
    public_key TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'valid', -- 'valid', 'revoked'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
