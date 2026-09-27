package engine

import (
	"net"
	"strings"
	"sync"
)

// DomainNode represents a node in the domain suffix trie.
type DomainNode struct {
	Children map[string]*DomainNode
	IsLeaf   bool
	Rule     *DomainRule
}

// DomainRule holds metadata about a matched domain rule.
type DomainRule struct {
	Pattern  string
	Severity int
	Category ThreatCategory
	Name     string
	IsExact  bool // false if matches all subdomains (*.example.com)
}

// RadixTree provides O(k) prefix/suffix matching for domains and CIDR networks.
type RadixTree struct {
	mu         sync.RWMutex
	root       *DomainNode
	ipNets     []*netRule
	exactRules map[string]*DomainRule
}

type netRule struct {
	ipNet    *net.IPNet
	severity int
	category ThreatCategory
	name     string
}

// NewRadixTree initializes an empty RadixTree.
func NewRadixTree() *RadixTree {
	return &RadixTree{
		root: &DomainNode{
			Children: make(map[string]*DomainNode),
		},
		exactRules: make(map[string]*DomainRule),
	}
}

// InsertDomain adds a domain pattern (e.g., "evil.com" or "*.malware.xyz").
func (rt *RadixTree) InsertDomain(pattern string, severity int, category ThreatCategory, name string) {
	rt.mu.Lock()
	defer rt.mu.Unlock()

	cleaned := strings.ToLower(strings.TrimSpace(pattern))
	isExact := true
	if strings.HasPrefix(cleaned, "*.") {
		cleaned = cleaned[2:]
		isExact = false
	}

	rule := &DomainRule{
		Pattern:  pattern,
		Severity: severity,
		Category: category,
		Name:     name,
		IsExact:  isExact,
	}

	if isExact {
		rt.exactRules[cleaned] = rule
	}

	// Suffix trie: split domain into parts in reverse (e.g. "evil.com" -> ["com", "evil"])
	parts := strings.Split(cleaned, ".")
	current := rt.root
	for i := len(parts) - 1; i >= 0; i-- {
		part := parts[i]
		if _, exists := current.Children[part]; !exists {
			current.Children[part] = &DomainNode{
				Children: make(map[string]*DomainNode),
			}
		}
		current = current.Children[part]
	}
	current.IsLeaf = true
	current.Rule = rule
}

// InsertCIDR adds an IP network block to the blacklist.
func (rt *RadixTree) InsertCIDR(cidr string, severity int, category ThreatCategory, name string) error {
	rt.mu.Lock()
	defer rt.mu.Unlock()

	_, ipNet, err := net.ParseCIDR(cidr)
	if err != nil {
		return err
	}
	rt.ipNets = append(rt.ipNets, &netRule{
		ipNet:    ipNet,
		severity: severity,
		category: category,
		name:     name,
	})
	return nil
}

// MatchDomain checks if a domain matches any blacklist rule.
func (rt *RadixTree) MatchDomain(domain string) (*DomainRule, bool) {
	rt.mu.RLock()
	defer rt.mu.RUnlock()

	cleaned := strings.ToLower(strings.TrimSuffix(strings.TrimSpace(domain), "."))

	// Fast exact lookup
	if rule, ok := rt.exactRules[cleaned]; ok {
		return rule, true
	}

	// Suffix trie lookup
	parts := strings.Split(cleaned, ".")
	current := rt.root
	var lastMatchedRule *DomainRule

	for i := len(parts) - 1; i >= 0; i-- {
		part := parts[i]
		child, exists := current.Children[part]
		if !exists {
			break
		}
		current = child
		if current.IsLeaf && current.Rule != nil {
			// If rule is not exact, or matches full parts
			if !current.Rule.IsExact || i == 0 {
				lastMatchedRule = current.Rule
			}
		}
	}

	if lastMatchedRule != nil {
		return lastMatchedRule, true
	}

	return nil, false
}

// MatchIP checks if an IP belongs to any blacklisted CIDR network.
func (rt *RadixTree) MatchIP(ipStr string) (*DomainRule, bool) {
	rt.mu.RLock()
	defer rt.mu.RUnlock()

	ip := net.ParseIP(strings.TrimSpace(ipStr))
	if ip == nil {
		return nil, false
	}

	for _, rule := range rt.ipNets {
		if rule.ipNet.Contains(ip) {
			return &DomainRule{
				Pattern:  rule.ipNet.String(),
				Severity: rule.severity,
				Category: rule.category,
				Name:     rule.name,
				IsExact:  true,
			}, true
		}
	}
	return nil, false
}
