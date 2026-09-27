# TERMINATOR SEC

> Ultra-lightweight endpoint security. Sub-10ms threat interception. Zero telemetry.

```
DNS Query → Intercept → Analyze → Block / Allow / Prompt  (< 10ms)
```

---

## What it does

Terminator Sec sits at the OS boundary and intercepts **DNS lookups, process spawns, and filesystem events** in real time. Threats are scored through a multi-tier engine and either auto-blocked, sinkholes, or surfaced to the user as an interactive prompt — all in under 10ms.

| Tier | Method | Latency |
|------|--------|---------|
| 1 | Radix Trie + Bloom Filter blocklists | `< 0.1ms` |
| 2 | Heuristic DGA / lexical entropy scorer | `~0.01ms` |
| 3 | SHA-256 malware hash signatures | `< 0.01ms` |

**Severity 8–10** → Auto-block (NXDOMAIN / TCP drop)  
**Severity 4–7** → User prompt (Allow / Block / Trust)  
**Severity 1–3** → Allow + audit log

---

## Stack

| Layer | Tech |
|-------|------|
| Agent / Engine / Server | Go 1.25 |
| DNS Interception | `miekg/dns` — UDP + TCP + DoH |
| Dashboard | React + Vite + Tailwind |
| IPC | Unix Domain Socket (macOS/Linux) · TCP loopback (Windows) |
| CI/CD | Azure Pipelines |

---

## Architecture

```
Browser / App / OS
        │
   DNS Proxy (:5353 / :53)          ← Stage 1: Intercept
        │
   Threat Engine (pkg/engine)       ← Stage 2: Analyze  <10ms
   ├─ Radix Trie + Bloom Filter
   ├─ Heuristics + DGA Scorer
   └─ Signature + Hash DB
        │
   Decision Engine                  ← Stage 3: Act
   ├─ AUTO_BLOCK  → NXDOMAIN
   ├─ QUEUE_USER  → Desktop Prompt
   └─ ALLOW       → Upstream DNS
        │
   Audit Logger + IPC Server        ← Stage 4: Report
        │
   Central Admin Dashboard          ← Stage 5: Observe
```

---

## Binaries

| Binary | Role |
|--------|------|
| `terminator-agent` | Background daemon — DNS proxy + monitors |
| `terminator-cli` | Diagnostic CLI — test domains, view audit logs |
| `terminator-server` | Cloud admin API + dashboard server |

---

## Quick Start

**Prerequisites:** Go 1.25+, Node 20+

```bash
# Clone
git clone https://DFORGEAI@dev.azure.com/DFORGEAI/TRSEC/_git/TRSEC
cd TRSEC

# Build all binaries (macOS)
make build-macos

# Run agent daemon
./bin/terminator-agent -dns-port 5353

# Test threat engine
./bin/terminator-cli test-domain emotet-c2.net
./bin/terminator-cli test-domain google.com

# Run admin server + dashboard
./bin/terminator-server -port 8080
# → open http://localhost:8080

# Run tests
make test
```

---

## Branching & CI

| Branch | Purpose |
|--------|---------|
| `main` | Stable source of truth — no direct commits |
| `users/abhinav/<feature>` | Feature development → CI only |
| `release/abhinav/<feature>` | Release candidate → CI + deploy to SIT + auto PR |
| `trsec_sit` | SIT integration branch — merge via PR only |

**New feature workflow:**
```bash
git checkout -b users/abhinav/my-feature
# ... develop, commit ...
git push origin users/abhinav/my-feature
# CI triggers automatically

# Ready for SIT?
git checkout -b release/abhinav/my-feature
git push origin release/abhinav/my-feature
# → Deploys to SIT VM, runs smoke tests, creates PR to trsec_sit
```

---

## Project Layout

```
cmd/
├── terminator-agent/    # Daemon entry point
├── terminator-cli/      # CLI diagnostic tool
└── terminator-server/   # Admin API + dashboard server

pkg/
├── engine/              # Threat analysis (radix, bloom, heuristics, scorer)
├── interceptor/         # DNS proxy (UDP/TCP/DoH)
├── monitor/             # FS guard, net monitor, process watcher
├── ipc/                 # Unix socket / TCP IPC server + client
├── audit/               # JSONL audit logger
└── platform/            # macOS / Windows / Linux OS abstractions

apps/dashboard/          # React + Vite SOC admin dashboard
scripts/                 # macOS + Windows packaging scripts
```

---

## For New Developers

1. **Read the engine first** — start with [`pkg/engine/analyzer.go`](pkg/engine/analyzer.go) to understand the threat scoring pipeline.
2. **Run the tests** — `make test` covers the full engine with benchmarks. All tests must pass before committing.
3. **Pick a task** — import [`azure-devops-terminator-sec-tasks.csv`](azure-devops-terminator-sec-tasks.csv) into Azure Boards for the backlog.
4. **Branch naming matters** — use `users/abhinav/<feature>` or the team will name it for you.
5. **Never push directly to `main` or `trsec_sit`** — all changes go through CI + SIT smoke tests first.
6. **Check [`azure-pipelines.yml`](azure-pipelines.yml)** before adding new build steps — the pipeline handles cross-platform builds for macOS arm64, Windows amd64, and Linux amd64.
