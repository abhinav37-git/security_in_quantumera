# Contributing to Security in Quantum Era 🛡️⚛️

Thank you for your interest in contributing to **Security in Quantum Era**! We welcome open-source contributions from developers, cryptographers, security researchers, and designers of all skill levels.

Whether you're fixing a bug, adding support for a new post-quantum cryptographic algorithm, improving benchmark coverage, or refining the UI/UX, we're thrilled to have your support.

---

## 🧭 Code of Conduct

We are committed to fostering an inclusive, welcoming, and harassment-free community. Please treat all contributors and community members with respect, empathy, and professional curiosity.

---

## 🗂️ Monorepo Overview

This repository is organized into three core pillars:

- **`projects/quantum_pqc/`**: Post-quantum cryptographic migration toolkit, hybrid TLS proxies (ML-KEM/Kyber), CBOM (Cryptography Bill of Materials) scanner, and LMS/ML-DSA trust services. (Go, Python, Next.js, Swift)
- **`projects/terminator_sec/`**: Sub-10ms defensive endpoint agent, DNS and process monitor, Trie & Bloom filter threat engines, and fleet analytics dashboard. (Go, React/Vite, Swift)
- **`portfolio/`**: Interactive security showcase web platform. (HTML5, Modern CSS, Three.js, Vercel Serverless)

---

## 🚀 How to Contribute

### 1. Finding Something to Work On
- Browse our open [GitHub Issues](https://github.com/abhinav37-git/security_in_quantumera/issues).
- Look for tags like:
  - `good first issue` — Great for newcomers.
  - `help wanted` — High-priority community tasks.
  - `security` / `pqc` / `kernel` — Technical domain-specific challenges.

### 2. Fork and Branch Workflow
1. Fork the repository on GitHub:
   ```bash
   git clone https://github.com/<your-username>/security_in_quantumera.git
   cd security_in_quantumera
   ```
2. Create a new descriptive topic branch:
   ```bash
   git checkout -b feat/add-falcon-signature-support
   # or
   git checkout -b fix/terminator-bloom-filter-edge-case
   ```
3. Commit your changes with clear, structured messages:
   ```bash
   git commit -m "feat(pqc): integrate ML-DSA parameter sets into CA pipeline"
   ```
4. Push to your fork:
   ```bash
   git push origin feat/add-falcon-signature-support
   ```
5. Open a **Pull Request (PR)** against the `main` branch of `abhinav37-git/security_in_quantumera`.

---

## 🧪 Local Setup & Development

### Working with Quantum PQC
```bash
cd projects/quantum_pqc

# Run Go crypto unit tests
go test -v ./shared/crypto/...

# Run Python CBOM scanner tests
cd apps/scan
python3 -m unittest discover

# Run Web Dashboard
cd ../../web
npm install
npm run dev
```

### Working with Terminator Sec
```bash
cd projects/terminator_sec

# Run Go unit & engine tests
go test -v ./pkg/engine/...

# Build CLI and Agent binaries
make build

# Run Dashboard
cd apps/dashboard
npm install
npm run dev
```

### Working with Portfolio
```bash
cd portfolio
python3 -m http.server 3000
```

---

## 📝 Commit & PR Guidelines

- **Atomic Commits**: Keep changes focused on a single topic or bug.
- **Testing**: Whenever possible, include unit tests covering any new behavior or bug fix.
- **Documentation**: If your feature modifies public APIs, configuration keys, or environment variables, update the corresponding `README.md` or architecture documents.
- **PR Description**: Provide a concise summary of what was changed, why, and how you validated it (screenshots/test outputs are appreciated).

---

## 🔐 Security Vulnerability Reporting

If you identify a security vulnerability (especially in cryptographic primitives, handshake negotiations, or endpoint interception rules), please **do not** report it in a public issue.

Instead, please send an encrypted or direct disclosure email to the maintainers or report via GitHub's **Private Vulnerability Reporting** tab.

---

## 💬 Questions & Community

Feel free to open a [GitHub Discussion](https://github.com/abhinav37-git/security_in_quantumera/discussions) or reach out via the [Portfolio Contact Form](https://velithsoftware.vercel.app/#contact).
