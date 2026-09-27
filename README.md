# Security in Quantum Era 🛡️⚛️

A unified monorepo housing cutting-edge cybersecurity, post-quantum cryptography (PQC), defensive endpoint monitoring, and engineer portfolio showcase.

🌐 **Live Portfolio Website**: [https://velithsoftware.vercel.app](https://velithsoftware.vercel.app)

---

## 📁 Repository Structure
```
security_in_quantumera/
├── portfolio/                   # Interactive Personal Portfolio & Showcase (Live at https://velithsoftware.vercel.app)
│   ├── index.html
│   ├── styles.css
│   ├── site.js
│   └── ...
├── projects/
│   ├── quantum_pqc/             # Post-Quantum Cryptography & Quantum-Resistant Protocol Suite
│   │   ├── apps/                # Web dashboard and analytics
│   │   ├── docker/              # Containerization & orchestration
│   │   ├── shared/              # Shared cryptographic libraries and primitives
│   │   ├── proxy-swift/         # Swift-based proxy integrations
│   │   └── README.md
│   │
│   └── terminator_sec/          # Zero-Trust Endpoint Protection & Defensive Agent
│       ├── apps/                # Threat dashboard & telemetry visualization
│       ├── cmd/                 # Agent CLI & Server daemons
│       ├── pkg/                 # Core engine, heuristics, interceptor & audit
│       ├── agent-swift/         # Native swift agent integration
│       └── README.md
├── docker-compose.yml           # Unified orchestration for development & testing
└── README.md
```

---

## 🚀 Projects Overview

### 1. [Quantum PQC](./projects/quantum_pqc)
- **Focus**: Post-Quantum Cryptography (PQC) migration, Kyber/Dilithium hybrid handshakes, and quantum-safe communications.
- **Tech Stack**: Go, TypeScript/Vite, Docker, Swift.
- **Key Features**:
  - Benchmark suite for post-quantum key exchange algorithms.
  - Hybrid TLS proxy simulating quantum-resistant connections.
  - Real-time performance comparisons (handshake latency, payload overhead).

### 2. [Terminator Sec](./projects/terminator_sec)
- **Focus**: High-performance, cross-platform defensive agent & threat analytics engine.
- **Tech Stack**: Go, TypeScript/React, Platform-native system hooks (macOS / Linux / Windows).
- **Key Features**:
  - Heuristic-based process, filesystem, and network event monitoring.
  - Low-overhead Bloom filters & Radix trees for fast signature detection.
  - Fleet management and live threat simulation dashboard.

### 3. [Portfolio Showcase](./portfolio) — 🌐 [Live Site](https://velithsoftware.vercel.app)
- **Live URL**: [https://velithsoftware.vercel.app](https://velithsoftware.vercel.app)
- **Focus**: Interactive web application featuring live security project demos, architecture deep dives, and technical achievements.
- **Tech Stack**: HTML5, Modern Vanilla CSS, JavaScript, Vercel Serverless.

---

## 🛠️ Quick Start

### Running Portfolio Locally
```bash
cd portfolio
# Start any static HTTP server (e.g. Python or Node)
python3 -m http.server 3000
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Quantum PQC Dashboard
```bash
cd projects/quantum_pqc/apps/dashboard
npm install
npm run dev
```

### Running Terminator Sec Agent & Dashboard
```bash
# Agent build
cd projects/terminator_sec
make build   # or go build ./cmd/terminator-agent

# Threat Dashboard
cd apps/dashboard
npm install
npm run dev
```

---

## 🚢 Deployment Guide

- **Portfolio**: Deployed via [Vercel](https://vercel.com) with root directory set to `portfolio/`.
- **Services & Dashboards**: Can be containerized and deployed using standard Docker Compose or Kubernetes manifests.

---

## 📜 License
MIT License
