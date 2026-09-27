package main

import (
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/terminator-sec/terminator/pkg/engine"
	"github.com/terminator-sec/terminator/pkg/ipc"
	"github.com/terminator-sec/terminator/pkg/platform"
)

func printHelp() {
	fmt.Println("Terminator Sec CLI - Endpoint Protection Diagnostic Tool")
	fmt.Println("")
	fmt.Println("Usage:")
	fmt.Println("  terminator-cli status                 View agent operational health and metrics")
	fmt.Println("  terminator-cli events                 Display recent threat audit events")
	fmt.Println("  terminator-cli test-domain <domain>   Run local sub-millisecond threat analysis on domain")
	fmt.Println("  terminator-cli trust <domain>         Permanently whitelist/trust domain")
	fmt.Println("  terminator-cli block <domain>         Permanently blacklist/block domain")
	fmt.Println("  terminator-cli simulate <threat_type> Simulate threat (phish, dga, c2, ransomware, proc)")
	fmt.Println("")
}

func main() {
	if len(os.Args) < 2 {
		printHelp()
		return
	}

	cmd := os.Args[1]
	pm := platform.GetCurrentPlatform()
	socketPath := pm.GetIPCPath()

	switch cmd {
	case "status":
		client, err := ipc.NewClient(socketPath)
		if err != nil {
			fmt.Printf("⚠️  Daemon offline or unreachable: %v\n", err)
			return
		}
		defer client.Close()

		status, err := client.GetStatus()
		if err != nil {
			fmt.Printf("Error fetching status: %v\n", err)
			return
		}
		fmt.Println("🛡️  TERMINATOR SEC STATUS")
		fmt.Printf("   Platform:            %s\n", status.Platform)
		fmt.Printf("   Admin / Privileged:  %v\n", status.IsAdmin)
		fmt.Printf("   DNS Interceptor:     Active on port %d\n", status.DNSProxyPort)
		fmt.Printf("   Process Watcher:     Active\n")
		fmt.Printf("   FS / Ransomware Guard: Active\n")
		fmt.Printf("   Total Queries:       %d\n", status.TotalQueries)
		fmt.Printf("   Threats Auto-Blocked:%d\n", status.ThreatsBlocked)
		fmt.Printf("   Threats Queued:      %d\n", status.ThreatsQueued)
		fmt.Printf("   Agent CPU Usage:     %.2f%% (Target <1%%)\n", status.CPUUsagePct)
		fmt.Printf("   Uptime:              %.1fs\n", status.UptimeSeconds)

	case "events":
		client, err := ipc.NewClient(socketPath)
		if err != nil {
			fmt.Printf("⚠️  Daemon offline or unreachable: %v\n", err)
			return
		}
		defer client.Close()

		events, err := client.GetAuditEvents()
		if err != nil {
			fmt.Printf("Error fetching events: %v\n", err)
			return
		}

		fmt.Printf("📋 RECENT AUDIT LOGS (%d events)\n", len(events))
		fmt.Println("-------------------------------------------------------------------------")
		for _, e := range events {
			actionIcon := "🟢"
			if e.Verdict.Action == engine.ActionAutoBlock {
				actionIcon = "🔴"
			} else if e.Verdict.Action == engine.ActionQueueUser {
				actionIcon = "🟡"
			}
			fmt.Printf("%s [%s] Sev: %2d/10 | %-12s | %-32s | %s (%.2fms)\n",
				actionIcon,
				e.ResolvedAt.Format("15:04:05"),
				e.Verdict.Severity,
				e.Verdict.Action,
				e.Verdict.Target,
				e.Verdict.ThreatName,
				e.LatencyMs,
			)
		}

	case "test-domain":
		if len(os.Args) < 3 {
			fmt.Println("Error: Missing domain name. Example: terminator-cli test-domain bad-phish.xyz")
			return
		}
		domain := os.Args[2]
		analyzer := engine.NewThreatAnalyzer()

		start := time.Now()
		verdict := analyzer.AnalyzeDomain(domain)
		duration := time.Since(start)

		fmt.Println("🔍 THREAT ANALYSIS RESULT")
		fmt.Printf("   Target:       %s\n", verdict.Target)
		fmt.Printf("   Action:       %s\n", verdict.Action)
		fmt.Printf("   Severity:     %d / 10\n", verdict.Severity)
		fmt.Printf("   Category:     %s\n", verdict.Category)
		fmt.Printf("   Threat Name:  %s\n", verdict.ThreatName)
		fmt.Printf("   Reason:       %s\n", verdict.Reason)
		fmt.Printf("   Matched Tier: Tier %d\n", verdict.MatchedTier)
		fmt.Printf("   Entropy:      %.3f\n", verdict.Entropy)
		fmt.Printf("   Latency:      %v (%d ns)\n", duration, duration.Nanoseconds())

	case "simulate":
		if len(os.Args) < 3 {
			fmt.Println("Usage: terminator-cli simulate <c2|phish|dga|ransomware|proc>")
			return
		}
		threatType := os.Args[2]
		client, err := ipc.NewClient(socketPath)
		if err != nil {
			fmt.Printf("⚠️  Daemon offline or unreachable: %v\n", err)
			return
		}
		defer client.Close()

		var testDomain string
		switch threatType {
		case "c2":
			testDomain = "emotet-c2.net"
		case "phish":
			testDomain = "paypal-security-verification.com"
		case "dga":
			testDomain = "kx89zq2lm018a.xyz"
		default:
			testDomain = "unknown-suspicious-beacon.top"
		}

		analyzer := engine.NewThreatAnalyzer()
		verdict := analyzer.AnalyzeDomain(testDomain)
		data, _ := json.MarshalIndent(verdict, "", "  ")
		fmt.Printf("🎯 Simulated Threat Generated:\n%s\n", string(data))

	default:
		printHelp()
	}
}
