package engine

import (
	"testing"
	"time"
)

func TestEngineAnalysis(t *testing.T) {
	analyzer := NewThreatAnalyzer()

	tests := []struct {
		target         string
		expectedAction ThreatAction
		minSeverity    int
		maxSeverity    int
		desc           string
	}{
		{
			target:         "google.com",
			expectedAction: ActionAllow,
			minSeverity:    1,
			maxSeverity:    1,
			desc:           "Whitelisted Domain",
		},
		{
			target:         "emotet-c2.net",
			expectedAction: ActionAutoBlock,
			minSeverity:    8,
			maxSeverity:    10,
			desc:           "Known C2 Domain",
		},
		{
			target:         "sub.paypal-security-verification.com",
			expectedAction: ActionAutoBlock,
			minSeverity:    8,
			maxSeverity:    10,
			desc:           "Known Phishing Wildcard",
		},
		{
			target:         "xk9qz7w4lm2p0a.xyz",
			expectedAction: ActionQueueUser,
			minSeverity:    4,
			maxSeverity:    7,
			desc:           "DGA Anomaly / Suspicious TLD",
		},
		{
			target:         "appleid-login-support.tk",
			expectedAction: ActionAutoBlock,
			minSeverity:    8,
			maxSeverity:    10,
			desc:           "Apple ID Phishing Farm",
		},
	}

	for _, tc := range tests {
		t.Run(tc.desc, func(t *testing.T) {
			start := time.Now()
			verdict := analyzer.AnalyzeDomain(tc.target)
			duration := time.Since(start)

			t.Logf("[%s] -> Action: %s, Severity: %d, Category: %s, Duration: %v, Reason: %s",
				tc.target, verdict.Action, verdict.Severity, verdict.Category, duration, verdict.Reason)

			if verdict.Action != tc.expectedAction {
				t.Errorf("Expected action %v, got %v", tc.expectedAction, verdict.Action)
			}
			if verdict.Severity < tc.minSeverity || verdict.Severity > tc.maxSeverity {
				t.Errorf("Expected severity between %d and %d, got %d", tc.minSeverity, tc.maxSeverity, verdict.Severity)
			}
			if duration > 10*time.Millisecond {
				t.Errorf("Analysis took too long: %v (budget is <10ms)", duration)
			}
		})
	}
}

func TestUserOverrides(t *testing.T) {
	analyzer := NewThreatAnalyzer()
	domain := "custom-suspicious-dga-12345.xyz"

	// Initially medium threat
	v1 := analyzer.AnalyzeDomain(domain)
	if v1.Action != ActionQueueUser && v1.Action != ActionAutoBlock {
		t.Fatalf("Expected suspicious action, got %v", v1.Action)
	}

	// Trust source
	analyzer.TrustSource(domain)
	v2 := analyzer.AnalyzeDomain(domain)
	if v2.Action != ActionAllow || v2.Severity != 1 {
		t.Fatalf("Expected trusted domain to be ALLOW (1), got action %v severity %d", v2.Action, v2.Severity)
	}

	// Always block
	analyzer.BlockSource(domain)
	v3 := analyzer.AnalyzeDomain(domain)
	if v3.Action != ActionAutoBlock || v3.Severity != 10 {
		t.Fatalf("Expected blocked domain to be AUTO_BLOCK (10), got action %v severity %d", v3.Action, v3.Severity)
	}
}

func BenchmarkDomainAnalysis(b *testing.B) {
	analyzer := NewThreatAnalyzer()
	domains := []string{
		"google.com",
		"sub.paypal-security-verification.com",
		"x98zq2la891.top",
		"github.com",
		"emotet-c2.net",
		"legit-corporate-service.internal",
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		d := domains[i%len(domains)]
		_ = analyzer.AnalyzeDomain(d)
	}
}
