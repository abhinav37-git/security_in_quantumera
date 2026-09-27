package engine

import (
	"math"
	"strings"
	"unicode"
)

// SuspiciousTLDs with disproportionately high abuse/phishing rates.
var SuspiciousTLDs = map[string]int{
	"tk":      7,
	"top":     6,
	"xyz":     5,
	"click":   6,
	"gq":      7,
	"cf":      7,
	"ml":      7,
	"fit":     5,
	"rest":    5,
	"country": 6,
	"stream":  6,
	"work":    5,
	"quest":   6,
	"monster": 6,
}

// BrandTargets for homoglyph / phishing detection.
var HighValueBrands = []string{
	"google", "apple", "paypal", "microsoft", "amazon", "netflix",
	"bankofamerica", "chase", "wellsfargo", "binance", "coinbase",
	"facebook", "instagram", "twitter", "login", "secure", "verify",
}

// CalculateShannonEntropy computes information entropy of a string.
func CalculateShannonEntropy(s string) float64 {
	if len(s) == 0 {
		return 0.0
	}
	freq := make(map[rune]float64)
	for _, r := range s {
		freq[r]++
	}
	var entropy float64
	length := float64(len(s))
	for _, count := range freq {
		p := count / length
		entropy -= p * math.Log2(p)
	}
	return entropy
}

// HeuristicScore holds the result of lexical and anomaly analysis.
type HeuristicScore struct {
	TotalScore    int
	Entropy       float64
	IsDGA         bool
	IsPunycode    bool
	IsPhishing    bool
	Reasons       []string
	Confidence    float64
}

// AnalyzeDomainHeuristics inspects the lexical structure of a domain.
func AnalyzeDomainHeuristics(domain string) HeuristicScore {
	cleaned := strings.ToLower(strings.TrimSuffix(strings.TrimSpace(domain), "."))
	parts := strings.Split(cleaned, ".")
	if len(parts) < 2 {
		return HeuristicScore{TotalScore: 1, Confidence: 0.9}
	}

	tld := parts[len(parts)-1]
	sld := parts[len(parts)-2]
	fullPrefix := strings.Join(parts[:len(parts)-1], "")

	score := 1
	var reasons []string
	var isDGA, isPunycode, isPhishing bool

	// 1. Check IDN / Punycode (Homograph attack)
	if strings.Contains(cleaned, "xn--") {
		score += 5
		isPunycode = true
		reasons = append(reasons, "IDN/Punycode homograph pattern detected")
	}

	// 2. Shannon Entropy of SLD
	entropy := CalculateShannonEntropy(sld)
	if len(sld) >= 8 && entropy >= 3.6 {
		score += 4
		isDGA = true
		reasons = append(reasons, "High lexical entropy (>3.6) characteristic of DGA botnet")
	} else if len(sld) >= 12 && entropy >= 3.3 {
		score += 3
		isDGA = true
		reasons = append(reasons, "Elevated entropy (>3.3) on long domain name")
	}

	// 3. Vowel / Consonant ratio & Consonant clustering
	vowels := 0
	consonants := 0
	digits := 0
	maxConsonantCluster := 0
	currentCluster := 0

	for _, r := range sld {
		if unicode.IsDigit(r) {
			digits++
			currentCluster = 0
		} else if strings.ContainsRune("aeiou", r) {
			vowels++
			currentCluster = 0
		} else if unicode.IsLetter(r) {
			consonants++
			currentCluster++
			if currentCluster > maxConsonantCluster {
				maxConsonantCluster = currentCluster
			}
		}
	}

	// Anomaly: excessive consecutive consonants (e.g. "bcfghjklq")
	if maxConsonantCluster >= 5 && len(sld) > 7 {
		score += 3
		isDGA = true
		reasons = append(reasons, "Abnormal consecutive consonant sequence (synthetic pattern)")
	}

	// Anomaly: high digit ratio
	digitRatio := float64(digits) / float64(len(sld))
	if digitRatio > 0.4 && len(sld) > 6 {
		score += 2
		reasons = append(reasons, "High numeric character concentration")
	}

	// 4. Check Brand Phishing keywords combined with suspicious TLD or hyphenation
	for _, brand := range HighValueBrands {
		if strings.Contains(sld, brand) && sld != brand {
			// e.g. "paypal-security-update" or "login-apple"
			score += 4
			isPhishing = true
			reasons = append(reasons, "Targeted brand impersonation keyword: "+brand)
			break
		}
	}

	// 5. Suspicious TLD check
	if tldScore, found := SuspiciousTLDs[tld]; found {
		score += (tldScore / 2)
		reasons = append(reasons, "High-risk TLD zone: ."+tld)
	}

	// 6. Subdomain Depth / DNS Tunneling check
	if len(parts) >= 5 || len(fullPrefix) > 60 {
		score += 3
		reasons = append(reasons, "Excessive subdomain depth / potential DNS exfiltration tunnel")
	}

	// Clamp score between 1 and 10
	if score > 10 {
		score = 10
	}

	confidence := 0.75
	if len(reasons) > 1 {
		confidence = 0.90
	} else if len(reasons) == 0 {
		confidence = 0.95
	}

	return HeuristicScore{
		TotalScore: score,
		Entropy:    entropy,
		IsDGA:      isDGA,
		IsPunycode: isPunycode,
		IsPhishing: isPhishing,
		Reasons:    reasons,
		Confidence: confidence,
	}
}
