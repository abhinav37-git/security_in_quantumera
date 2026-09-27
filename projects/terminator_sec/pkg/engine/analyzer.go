package engine

import (
	"fmt"
	"strings"
	"sync"
	"time"
)

// ThreatAnalyzer is the central multi-tiered real-time evaluation engine.
type ThreatAnalyzer struct {
	mu           sync.RWMutex
	radixTree    *RadixTree
	bloomFilter  *BloomFilter
	whitelist    map[string]bool
	userTrusts   map[string]time.Time // User "Trust This Source"
	userBlocks   map[string]time.Time // User "Always Block"
	fileHashes   map[string]struct {
		Name     string
		Category ThreatCategory
		Severity int
	}
}

// NewThreatAnalyzer initializes the engine with default signatures and rules.
func NewThreatAnalyzer() *ThreatAnalyzer {
	analyzer := &ThreatAnalyzer{
		radixTree:   NewRadixTree(),
		bloomFilter: NewBloomFilter(2*1024*1024, 4), // 2MB bloom filter
		whitelist:   make(map[string]bool),
		userTrusts:  make(map[string]time.Time),
		userBlocks:  make(map[string]time.Time),
		fileHashes:  make(map[string]struct {
			Name     string
			Category ThreatCategory
			Severity int
		}),
	}

	// 1. Populate Whitelist
	for _, domain := range WhitelistedDomains {
		analyzer.whitelist[strings.ToLower(domain)] = true
	}

	// 2. Populate Malicious Domains into Radix Tree and Bloom Filter
	for _, item := range DefaultMaliciousDomains {
		analyzer.radixTree.InsertDomain(item.Pattern, item.Severity, item.Category, item.Name)
		// Clean pattern for bloom filter
		clean := strings.TrimPrefix(item.Pattern, "*.")
		analyzer.bloomFilter.Add(clean)
	}

	// 3. Populate Malicious IPs
	_ = analyzer.radixTree.InsertCIDR("185.220.101.0/24", 8, CategoryKnownBadIP, "Known Tor Exit / Malicious Scanner Subnet")
	_ = analyzer.radixTree.InsertCIDR("45.154.255.0/24", 9, CategoryKnownBadIP, "Bulletproof Hosting Botnet Subnet")
	_ = analyzer.radixTree.InsertCIDR("194.135.33.0/24", 8, CategoryKnownBadIP, "Malicious Scanner & Brute-force Range")

	// 4. Populate Malicious Hashes
	for hash, val := range DefaultMaliciousHashes {
		analyzer.fileHashes[strings.ToLower(hash)] = val
		analyzer.bloomFilter.Add(strings.ToLower(hash))
	}

	return analyzer
}

// TrustSource registers a domain, IP, or hash as permanently trusted by the user.
func (ta *ThreatAnalyzer) TrustSource(target string) {
	ta.mu.Lock()
	defer ta.mu.Unlock()
	clean := strings.ToLower(strings.TrimSpace(target))
	ta.userTrusts[clean] = time.Now()
	delete(ta.userBlocks, clean)
}

// BlockSource registers a domain, IP, or hash as permanently blocked by the user.
func (ta *ThreatAnalyzer) BlockSource(target string) {
	ta.mu.Lock()
	defer ta.mu.Unlock()
	clean := strings.ToLower(strings.TrimSpace(target))
	ta.userBlocks[clean] = time.Now()
	delete(ta.userTrusts, clean)
}

// IsWhitelisted checks if domain or parent domain is globally trusted.
func (ta *ThreatAnalyzer) isWhitelisted(domain string) bool {
	clean := strings.ToLower(strings.TrimSuffix(strings.TrimSpace(domain), "."))
	if ta.whitelist[clean] {
		return true
	}
	parts := strings.Split(clean, ".")
	if len(parts) > 2 {
		rootDomain := parts[len(parts)-2] + "." + parts[len(parts)-1]
		if ta.whitelist[rootDomain] {
			return true
		}
	}
	return false
}

// AnalyzeDomain performs sub-2ms multi-tier threat evaluation for a domain name.
func (ta *ThreatAnalyzer) AnalyzeDomain(domain string) ThreatVerdict {
	start := time.Now()
	clean := strings.ToLower(strings.TrimSuffix(strings.TrimSpace(domain), "."))

	ta.mu.RLock()
	// Check User Overrides
	if _, trusted := ta.userTrusts[clean]; trusted {
		ta.mu.RUnlock()
		v := CalculateVerdict(clean, "domain", 1, CategoryBenign, "User Trusted Domain", "Manually whitelisted by user", 0, 0, 1.0)
		v.Timestamp = start
		return v
	}
	if _, blocked := ta.userBlocks[clean]; blocked {
		ta.mu.RUnlock()
		v := CalculateVerdict(clean, "domain", 10, CategoryPhishing, "User Blocked Domain", "Permanently blacklisted by user rule", 0, 0, 1.0)
		v.Timestamp = start
		return v
	}
	ta.mu.RUnlock()

	// Whitelist Fast Path
	if ta.isWhitelisted(clean) {
		v := CalculateVerdict(clean, "domain", 1, CategoryBenign, "Known Legitimate Domain", "Verified in global trusted list", 0, 0, 1.0)
		v.Timestamp = start
		return v
	}

	// Tier 1: Radix Tree Match (Fast Blocklist)
	if rule, matched := ta.radixTree.MatchDomain(clean); matched {
		v := CalculateVerdict(
			clean,
			"domain",
			rule.Severity,
			rule.Category,
			rule.Name,
			fmt.Sprintf("Matched exact threat signature: %s", rule.Pattern),
			1,
			0,
			0.99,
		)
		v.Timestamp = start
		return v
	}

	// Tier 2: Heuristic & Lexical DGA / Anomaly Analysis
	hScore := AnalyzeDomainHeuristics(clean)
	if hScore.TotalScore >= 4 {
		category := CategoryDGA
		name := "Suspicious Algorithmic Domain (DGA)"
		if hScore.IsPhishing {
			category = CategoryPhishing
			name = "Brand Impersonation / Phishing Pattern"
		} else if hScore.IsPunycode {
			category = CategoryPhishing
			name = "Homograph / Punycode Deception"
		}

		reason := strings.Join(hScore.Reasons, "; ")
		v := CalculateVerdict(
			clean,
			"domain",
			hScore.TotalScore,
			category,
			name,
			reason,
			2,
			hScore.Entropy,
			hScore.Confidence,
		)
		v.Timestamp = start
		return v
	}

	// Default: Safe domain
	v := CalculateVerdict(clean, "domain", 1, CategoryBenign, "Clean Domain", "No threat signatures or lexical anomalies detected", 3, hScore.Entropy, 0.95)
	v.Timestamp = start
	return v
}

// AnalyzeIP checks if an IP matches known malicious subnets or scanner ranges.
func (ta *ThreatAnalyzer) AnalyzeIP(ipStr string) ThreatVerdict {
	start := time.Now()
	clean := strings.TrimSpace(ipStr)

	ta.mu.RLock()
	if _, trusted := ta.userTrusts[clean]; trusted {
		ta.mu.RUnlock()
		v := CalculateVerdict(clean, "ip", 1, CategoryBenign, "User Trusted IP", "Manually allowed by user", 0, 0, 1.0)
		v.Timestamp = start
		return v
	}
	if _, blocked := ta.userBlocks[clean]; blocked {
		ta.mu.RUnlock()
		v := CalculateVerdict(clean, "ip", 10, CategoryKnownBadIP, "User Blocked IP", "Manually blocked by user", 0, 0, 1.0)
		v.Timestamp = start
		return v
	}
	ta.mu.RUnlock()

	// Radix CIDR Match
	if rule, matched := ta.radixTree.MatchIP(clean); matched {
		v := CalculateVerdict(
			clean,
			"ip",
			rule.Severity,
			rule.Category,
			rule.Name,
			fmt.Sprintf("Matched blacklisted subnet: %s", rule.Pattern),
			1,
			0,
			0.98,
		)
		v.Timestamp = start
		return v
	}

	v := CalculateVerdict(clean, "ip", 1, CategoryBenign, "Clean IP", "IP not present in threat intelligence database", 3, 0, 0.95)
	v.Timestamp = start
	return v
}

// AnalyzeFileHash checks a file SHA-256 against known malware and ransomware signatures.
func (ta *ThreatAnalyzer) AnalyzeFileHash(hash string) ThreatVerdict {
	start := time.Now()
	clean := strings.ToLower(strings.TrimSpace(hash))

	ta.mu.RLock()
	defer ta.mu.RUnlock()

	if item, found := ta.fileHashes[clean]; found {
		v := CalculateVerdict(
			clean,
			"file_hash",
			item.Severity,
			item.Category,
			item.Name,
			"Confirmed malware binary hash match",
			3,
			0,
			1.0,
		)
		v.Timestamp = start
		return v
	}

	v := CalculateVerdict(clean, "file_hash", 1, CategoryBenign, "Unknown / Clean Hash", "No malicious hash signatures identified", 3, 0, 0.90)
	v.Timestamp = start
	return v
}

// AnalyzeProcess inspects a running or spawned process command line for malicious TTPs.
func (ta *ThreatAnalyzer) AnalyzeProcess(pid int, name, cmdline string) ThreatVerdict {
	start := time.Now()
	cleanCmd := strings.ToLower(cmdline)

	for _, pattern := range SuspiciousProcessPatterns {
		if strings.Contains(cleanCmd, pattern.Pattern) {
			v := CalculateVerdict(
				fmt.Sprintf("%s (PID %d)", name, pid),
				"process",
				pattern.Severity,
				pattern.Category,
				pattern.Name,
				fmt.Sprintf("Detected suspicious pattern: '%s' in command line", pattern.Pattern),
				2,
				0,
				0.92,
			)
			v.ProcessID = pid
			v.ProcessName = name
			v.Timestamp = start
			return v
		}
	}

	v := CalculateVerdict(fmt.Sprintf("%s (PID %d)", name, pid), "process", 1, CategoryBenign, "Standard Process", "Normal process execution", 3, 0, 0.95)
	v.ProcessID = pid
	v.ProcessName = name
	v.Timestamp = start
	return v
}
