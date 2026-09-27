# Terminator Sec — System Architecture & Developer Guide

> **Ultra-lightweight endpoint threat interception platform.**  
> Target latency: **Sub-10ms** · Zero telemetry overhead · Cross-platform (Darwin / Windows / Linux)

---

## 1. High-Level Architecture

```
                                 ┌──────────────────────────────────────────────────────────┐
                                 │                   CENTRAL SERVER (SOC)                   │
                                 │                  (cmd/terminator-server)                 │
                                 │                                                          │
                                 │  /api/fleet/heartbeat     /api/events/ingest    /ws/threats│
                                 └────────▲─────────────────────────▲───────────────────▲───┘
                                          │ (Heartbeat 10s)         │ (Flush 5s)        │
                                          │ [TS-104]                │ [TS-103]          │
┌─────────────────────────────────────────┼─────────────────────────┼───────────────────┼──┐
│ LOCAL AGENT DAEMON (cmd/terminator-agent)│                         │                   │  │
│                                         │                         │                   │  │
│  ┌──────────────────────────────────────┴─────────────────────────┴─────────┐         │  │
│  │                    pkg/telemetry: Client [TS-101 / TS-102]              │         │  │
│  └──────────────────────────────────────▲─────────────────────────▲────────┘         │  │
│                                         │                         │                  │  │
│  ┌──────────────────────────────────────┼─────────────────────────┴────────┐         │  │
│  │                    pkg/audit: AuditLogger                               │         │  │
│  └──────────────────────────────────────▲──────────────────────────────────┘         │  │
│                                         │ (ThreatEvents)                             │  │
│  ┌──────────────────────────────────────┴──────────────────────────────────┐         │  │
│  │                    pkg/engine: ThreatAnalyzer (<10ms)                   │         │  │
│  │  Tier 1: Radix Trie + Bloom Filter  (known malicious/whitelists)        │         │  │
│  │  Tier 2: Lexical & Shannon Entropy  (DGA / algorithmic anomalies)       │         │  │
│  │  Tier 3: Signature & Hash DB        (SHA-256 binary malware hashes)     │         │  │
│  └──────▲───────────────────────────────▲──────────────────────────▲───────┘         │  │
│         │ (DNS Queries)                 │ (File I/O)               │ (Sockets/PIDs)  │  │
│  ┌──────┴──────────────┐      ┌─────────┴──────────┐     ┌─────────┴──────────┐      │  │
│  │   pkg/interceptor   │      │    pkg/monitor     │     │    pkg/monitor     │      │  │
│  │   (DNS Proxy :53)   │      │ (FileSystemGuard)  │     │  (NetworkMonitor)  │      │  │
│  └─────────────────────┘      └────────────────────┘     └────────────────────┘      │  │
│                                                                                      │  │
│  ┌─────────────────────────────────────────────────────────────────────────┐         │  │
│  │                     pkg/ipc: Local IPC Server                           │         │  │
│  │            (Unix Socket / Windows Named Pipe for Desktop UI & CLI)      │         │  │
│  └─────────────────────────────────────────────────────────────────────────┘         │  │
└──────────────────────────────────────────────────────────────────────────────────────┘──┘
```

---

## 2. Core Subsystems

### 2.1 Threat Analysis Engine (`pkg/engine`)
The engine operates entirely **in-memory with zero heap allocation per lookup** to guarantee sub-millisecond evaluation.

| Tier | Mechanism | Latency | Target Threats |
|---|---|---|---|
| **Tier 1** | **Radix Trie & Bloom Filter** | `< 0.1ms` | Known C2 domains (`*.emotet-c2.net`), Phishing farms (`*.appleid-login-support.tk`), and verified allowlists (`google.com`). |
| **Tier 2** | **Lexical & Shannon Entropy** | `~0.01ms` | DGA Botnets (Shannon entropy > 3.6), high-risk TLD zones (`.xyz`, `.top`, `.tk`), homoglyph spoofing. |
| **Tier 3** | **Malware Hash Database** | `< 0.01ms` | SHA-256 binary hashes for ransomware binaries and dropper executables. |

#### Verdict Categories & Severity Matrix
- **`AUTO_BLOCK` (Severity 8–10)**: Instant termination or `NXDOMAIN` response.
- **`QUEUE_USER` (Severity 4–7)**: Dispatches IPC prompt to desktop user for Allow Once / Block Always decision.
- **`ALLOW` (Severity 1–3)**: Transparently allowed and logged to local audit ring buffer.

---

### 2.2 DNS & Traffic Interceptor (`pkg/interceptor`)
- Implemented in [`pkg/interceptor/dns_proxy.go`](pkg/interceptor/dns_proxy.go) using `github.com/miekg/dns`.
- Listens simultaneously on **UDP** and **TCP** (`127.0.0.1:5353` for dev, `:53` for production).
- When a threat is detected:
  - Responds immediately with `NXDOMAIN` (or sinkhole IP `0.0.0.0`) in **under 2ms**.
  - Emits a structured `ThreatEvent` to `pkg/audit.AuditLogger`.

---

### 2.3 System Monitors (`pkg/monitor`)
1. **FileSystemGuard ([`pkg/monitor/fs_guard.go`](pkg/monitor/fs_guard.go))**:
   - Watches sensitive directories (`~/Downloads`, `~/Desktop`, `~/Documents`).
   - Identifies rapid extension mutations (`.locky`, `.wanacry`, `.crypt`) and encrypted high-entropy write bursts.
2. **NetworkMonitor ([`pkg/monitor/net_monitor.go`](pkg/monitor/net_monitor.go))**:
   - Analyzes socket endpoints and polling connection rates to identify lateral port sweeps and unauthorized outbound C2 tunnels.

---

### 2.4 Local IPC Subsystem (`pkg/ipc`)
- Unix Domain Sockets on macOS/Linux (`/var/run/terminator.sock` or `~/.terminator/agent.sock`).
- Loopback TCP on Windows (`127.0.0.1:5354`).
- Enables decoupled interaction with [`terminator-cli`](cmd/terminator-cli) and native desktop prompt dialogues without interrupting the agent daemon.

---

### 2.5 Audit Logger (`pkg/audit`)
- **Zero-Allocation Ring Buffer**: Retains the latest 1,000 events in memory for instant queries.
- **Persistence**: Writes append-only structured records to `events.jsonl`.
- **Pub/Sub**: Distributes live events to local IPC subscribers and telemetry queues.

---

## 3. Telemetry & Fleet Synchronization Layer (Tasks TS-101 – TS-104)

```
                       TERMINATOR AGENT                                TERMINATOR SERVER
               ┌───────────────────────────────┐               ┌───────────────────────────────┐
               │ pkg/telemetry/client.go       │               │ cmd/terminator-server/main.go │
               │                               │               │                               │
Heartbeat Loop │ Ticker (10s)                  │  HTTP POST    │ POST /api/fleet/heartbeat     │
   [TS-101]    │ Collects:                     ├──────────────►│                               │ [TS-104]
               │ - CPU % & Memory MB           │               │ Updates:                      │
               │ - Query & Block counters      │               │ - In-memory fleet registry    │
               │ - OS, Version, Hostname       │               │ - Status: Protected / Warning │
               │                               │               │                               │
               ├───────────────────────────────┤               ├───────────────────────────────┤
               │                               │               │                               │
Event Flush    │ Ticker (5s)                   │  HTTP POST    │ POST /api/events/ingest       │
   [TS-102]    │ Batches new ThreatEvents      ├──────────────►│                               │ [TS-103]
               │ - Tracks lastFlushedID        │               │ Ingests into central audit log│
               │ - Exponential backoff (φ-ratio│               │ Broadcasts via WebSocket      │
               │   on connection failure)      │               │  └► Live React Dashboard      │
               └───────────────────────────────┘               └───────────────────────────────┘
```

### Key Technical Details
1. **Incremental Event Flusher (`TS-102`)**:
   Tracks `lastFlushedID` to ensure each event is dispatched exactly once across batch windows.
2. **Resilient Exponential Backoff**:
   Network failures do not block engine processing. Retries use golden-ratio backoff capped at 5 minutes.
3. **Dynamic Fleet Registry (`TS-104`)**:
   Server registers newly discovered agents on their first heartbeat with zero manual provisioning required.

---

## 4. End-to-End Threat Lifecycle Example

```
1. Client app makes DNS request: http://emotet-c2.net
2. OS routes query (A emotet-c2.net) to 127.0.0.1:5353 (pkg/interceptor)
3. Interceptor invokes ThreatAnalyzer.AnalyzeDomain("emotet-c2.net") (pkg/engine)
4. Radix Trie match found in 8µs -> Verdict: AUTO_BLOCK, Severity: 10
5. Interceptor immediately returns NXDOMAIN to client (< 2ms total latency)
6. ThreatEvent emitted to pkg/audit.AuditLogger (persisted in local ring buffer)
7. Telemetry worker captures event in next 5s cycle -> POST /api/events/ingest
8. Server broadcasts event over WebSocket to Central SOC Dashboard (< 50ms total alert lag)
```

---

## 5. Directory & File Reference

```
terminator_sec/
├── cmd/
│   ├── terminator-agent/       # Daemon entry point (monitors, DNS proxy, telemetry)
│   ├── terminator-cli/         # Diagnostic CLI tool (test-domain, status, logs)
│   └── terminator-server/      # Central SOC server & REST API
├── pkg/
│   ├── audit/                  # Ring-buffer audit logger & JSONL persistence
│   ├── engine/                 # Radix Trie, Bloom filter, Lexical/Entropy threat scorer
│   ├── interceptor/            # DNS proxy (UDP/TCP/DoH) & wire packet handlers
│   ├── ipc/                    # Unix socket / TCP IPC protocol & server
│   ├── monitor/                # FileSystemGuard, NetworkMonitor, ProcessWatcher
│   ├── platform/               # OS-specific abstractions (Darwin / Windows / Linux)
│   └── telemetry/              # Agent background telemetry & event forwarder
├── apps/
│   └── dashboard/              # SOC React + Vite web application
├── azure-pipelines.yml         # CI/CD pipeline (CI -> Manual Gate -> SIT Smoke Tests -> PR)
└── azure-devops-terminator-sec-tasks.csv  # Task-by-task backlog
```

---

## 6. Developer Guidelines

1. **Inline Latency is Sacred**: Never introduce network calls, disk I/O, or heavy mutex contention in the `pkg/engine` lookup path.
2. **Zero Panic Policy**: Background watchers (`fs_guard`, `net_monitor`, `telemetry`) must handle OS errors gracefully without crashing the core agent.
3. **Platform Isolation**: Keep platform-specific commands (`netstat`, `osascript`, `syscall`) strictly in `pkg/platform`.
4. **Git Workflow**:
   - Work on 1 feature at a time: `users/abhinav/<feature-name>`.
   - Open PR to `release/abhinav/<feature-name>` and link the corresponding Azure DevOps Task.
   - Upon approval and merge, the automated pipeline runs CI, awaits manual SIT approval, runs 5 automated smoke tests on Windows, and prepares the merge to `trsec_sit`.
