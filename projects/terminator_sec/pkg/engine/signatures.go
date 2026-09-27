package engine

// DefaultMaliciousDomains contains known C2, malware distribution, and phishing domains.
var DefaultMaliciousDomains = []struct {
	Pattern  string
	Severity int
	Category ThreatCategory
	Name     string
}{
	// Known C2 / Botnet Infrastructure
	{"*.emotet-c2.net", 10, CategoryC2Server, "Emotet Botnet Command & Control"},
	{"*.cobaltstrike-beacon.ru", 10, CategoryC2Server, "Cobalt Strike Malicious Beacon"},
	{"*.qakbot-stealer.biz", 10, CategoryC2Server, "QakBot Banking Trojan C2"},
	{"c2-sync-payload.top", 9, CategoryC2Server, "RedLine Stealer Infrastructure"},
	{"*.darkgate-gate.cc", 9, CategoryC2Server, "DarkGate Malware Delivery"},
	{"*.lockbit-leak.onion.to", 10, CategoryRansomware, "LockBit Ransomware Gateway"},
	{"revil-decryptor-fake.xyz", 9, CategoryRansomware, "REvil Ransomware Dropper"},

	// Known Phishing & Credential Harvesters
	{"*.paypal-security-verification.com", 9, CategoryPhishing, "PayPal Credential Phishing"},
	{"*.appleid-login-support.tk", 9, CategoryPhishing, "Apple ID Phishing Farm"},
	{"*.microsoft-auth-challenge.online", 8, CategoryPhishing, "Microsoft 365 Credential Harvester"},
	{"*.chase-online-secure-portal.info", 9, CategoryPhishing, "Chase Bank Phishing Gateway"},
	{"*.metamask-validate-wallet.top", 9, CategoryPhishing, "MetaMask Seed Phrase Stealer"},
	{"*.binance-kyc-update.cc", 8, CategoryPhishing, "Binance Account Takeover Phish"},

	// Cryptominers
	{"*.coinhive-pool.ws", 7, CategoryCryptominer, "Coinhive Web Miner"},
	{"*.cryptonight-miner.pro", 7, CategoryCryptominer, "Monero Covert Miner"},
	{"xmr-pool-eu.minexmr.su", 8, CategoryCryptominer, "Unauthorized XMRig Miner Pool"},

	// Malicious IP ranges
	{"185.220.101.0/24", 8, CategoryKnownBadIP, "Known Tor Exit / Malicious Scanner Subnet"},
	{"45.154.255.0/24", 9, CategoryKnownBadIP, "Bulletproof Hosting Botnet Subnet"},
	{"194.135.33.0/24", 8, CategoryKnownBadIP, "Malicious Scanner & Brute-force Range"},
}

// DefaultMaliciousHashes contains SHA-256 signatures of prominent malware/ransomware binaries.
var DefaultMaliciousHashes = map[string]struct {
	Name     string
	Category ThreatCategory
	Severity int
}{
	// WannaCry Ransomware SHA-256
	"24d004a104d4d54034dbcffc2a4b19a11f39008a575aa614ea04703480b1022c": {
		Name:     "WannaCry Ransomware v1.0",
		Category: CategoryRansomware,
		Severity: 10,
	},
	// LockBit 3.0 Encryptor
	"d2e46b9a8f11816fbe857022ab63068e1c6b5420bf803b9b47e2cfa77d54b7c8": {
		Name:     "LockBit 3.0 (Black) Encryptor",
		Category: CategoryRansomware,
		Severity: 10,
	},
	// Mimikatz Memory Dumper
	"01b0f55cf55a30e8c076717a6c9cf1c2605d8f6d6f51950e39527ec3d922bc3b": {
		Name:     "Mimikatz Credential Stealer",
		Category: CategorySuspiciousProc,
		Severity: 9,
	},
	// RedLine Stealer Sample
	"8e3b3e2a77a94dc6f8274712534a747970d4d03be589c3629e46a7be7c3905cf": {
		Name:     "RedLine InfoStealer Payload",
		Category: CategoryC2Server,
		Severity: 9,
	},
}

// WhitelistedDomains contains globally trusted root domains.
var WhitelistedDomains = []string{
	"google.com", "gstatic.com", "googleapis.com", "youtube.com",
	"apple.com", "icloud.com", "cdn-apple.com", "mzstatic.com",
	"microsoft.com", "azure.com", "live.com", "office.com", "windows.com",
	"github.com", "githubusercontent.com", "gitlab.com",
	"cloudflare.com", "cloudflare-dns.com", "one.one.one.one",
	"amazon.com", "aws.amazon.com", "amazonaws.com",
	"wikipedia.org", "wikimedia.org",
	"mozilla.org", "firefox.com",
	"golang.org", "rust-lang.org", "npmjs.org", "npmjs.com",
	"stackoverflow.com", "stackexchange.com",
	"linkedin.com", "twitter.com", "x.com",
}

// SuspiciousProcessPatterns contains command line regexes / keywords that flag suspicious activity.
var SuspiciousProcessPatterns = []struct {
	Pattern  string
	Severity int
	Category ThreatCategory
	Name     string
}{
	{"powershell -enc", 8, CategorySuspiciousProc, "Base64 Encoded PowerShell Execution"},
	{"powershell -nop -w hidden -c", 9, CategorySuspiciousProc, "Hidden PowerShell Command Execution"},
	{"mimikatz", 10, CategorySuspiciousProc, "Mimikatz LSASS Dumper"},
	{"curl -s | sh", 7, CategorySuspiciousProc, "Unverified Shell Pipe Execution"},
	{"wget -qO- | bash", 7, CategorySuspiciousProc, "Unverified Bash Pipe Execution"},
	{"vssadmin delete shadows", 10, CategoryRansomware, "Volume Shadow Copy Deletion (Ransomware TTP)"},
	{"wbadmin delete catalog", 10, CategoryRansomware, "Backup Catalog Deletion"},
	{"bcdedit /set {default} bootstatuspolicy ignoreallfailures", 9, CategoryRansomware, "Disabling Windows Recovery Modes"},
	{"nc -e /bin/sh", 9, CategorySuspiciousProc, "Netcat Reverse Shell Spawn"},
	{"nc -e /bin/bash", 9, CategorySuspiciousProc, "Netcat Reverse Shell Spawn"},
}

// KnownRansomwareExtensions detected during bulk file modification watcher.
var KnownRansomwareExtensions = map[string]string{
	".lockbit": "LockBit Ransomware",
	".locked":  "Generic Ransomware Lock",
	".crypto":  "CryptoLocker Variant",
	".wannacry": "WannaCry Ransomware",
	".ryuk":    "Ryuk Ransomware",
	".blackcat": "ALPHV / BlackCat Ransomware",
	".encrypt": "Generic Encryptor",
}
