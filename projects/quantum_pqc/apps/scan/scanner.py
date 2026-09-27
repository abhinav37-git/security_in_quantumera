import os
import re
import json
import argparse
from cbom_generator import generate_cbom

# Mapping file extensions to rule languages
EXTENSION_MAP = {
    ".py": "python",
    ".js": "javascript",
    ".ts": "javascript",
    ".jsx": "javascript",
    ".tsx": "javascript",
    ".go": "go",
    ".rs": "rust",
    ".java": "java",
    ".c": "c_cpp",
    ".cpp": "c_cpp",
    ".h": "c_cpp",
    ".hpp": "c_cpp"
}

class QuantumShieldScanner:
    def __init__(self, rules_path=None, advisories_path=None):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        if not rules_path:
            rules_path = os.path.join(base_dir, "rules", "scanner_rules.json")
        if not advisories_path:
            advisories_path = os.path.join(base_dir, "dependency_advisories", "pqc_vuln_db.json")

        self.rules = self._load_json(rules_path).get("rules", [])
        self.advisories = self._load_json(advisories_path).get("advisories", {})

    def _load_json(self, path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading {path}: {e}")
            return {}

    def scan_directory(self, target_path):
        findings = []
        dependencies = []

        if not os.path.exists(target_path):
            return findings, dependencies

        # Walk target directory
        for root, _, files in os.walk(target_path):
            for file in files:
                filepath = os.path.join(root, file)
                ext = os.path.splitext(file)[1]
                
                # Check for dependency files
                if file == "requirements.txt":
                    dependencies.extend(self.scan_python_dependencies(filepath))
                elif file == "package.json":
                    dependencies.extend(self.scan_js_dependencies(filepath))
                elif file == "go.mod":
                    dependencies.extend(self.scan_go_dependencies(filepath))

                # Identify language
                lang = EXTENSION_MAP.get(ext)
                if not lang:
                    # Always run generic regexes on text files
                    lang = "generic"

                # Scan file source code
                file_findings = self.scan_file(filepath, lang)
                findings.extend(file_findings)

        return findings, dependencies

    def scan_file(self, filepath, lang):
        findings = []
        try:
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                lines = f.readlines()
        except Exception:
            return findings

        # Filter rules applicable to this language or generic rules
        applicable_rules = [r for r in self.rules if r["language"] == lang or r["language"] == "generic"]

        for rule in applicable_rules:
            pattern = re.compile(rule["pattern"])
            for line_idx, line in enumerate(lines):
                if pattern.search(line):
                    algorithm = rule.get("algorithm", "Unknown")

                    findings.append({
                        "rule_id": rule["id"],
                        "file_path": os.path.relpath(filepath),
                        "line_no": line_idx + 1,
                        "severity": rule["severity"],
                        "description": rule["description"],
                        "remediation": rule["remediation"],
                        "algorithm": algorithm,
                        "parameter": "2048" if "2048" in line else "unknown"
                    })
        return findings

    def scan_python_dependencies(self, filepath):
        deps = []
        advisories_list = self.advisories.get("python", [])
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    # Match package==version or package>=version etc.
                    match = re.match(r"^([a-zA-Z0-9_\-]+)\s*(==|>=|<=|>|<)?\s*([a-zA-Z0-9\.]+)?", line)
                    if match:
                        pkg_name = match.group(1).lower()
                        version = match.group(3) or "unknown"
                        for adv in advisories_list:
                            if adv["package"].lower() == pkg_name:
                                # For demonstration, raise finding if version matches or is old
                                deps.append({
                                    "package": pkg_name,
                                    "version": version,
                                    "status": adv["status"],
                                    "severity": adv["severity"],
                                    "description": adv["description"]
                                })
        except Exception:
            pass
        return deps

    def scan_js_dependencies(self, filepath):
        deps = []
        advisories_list = self.advisories.get("javascript", [])
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
                all_deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
                for pkg_name, version in all_deps.items():
                    clean_name = pkg_name.lower()
                    for adv in advisories_list:
                        if adv["package"].lower() == clean_name:
                            deps.append({
                                "package": pkg_name,
                                "version": version.replace("^", "").replace("~", ""),
                                "status": adv["status"],
                                "severity": adv["severity"],
                                "description": adv["description"]
                            })
        except Exception:
            pass
        return deps

    def scan_go_dependencies(self, filepath):
        deps = []
        advisories_list = self.advisories.get("go", [])
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    # Match: require github.com/cloudflare/circl v1.3.0
                    match = re.search(r"^\s*([a-zA-Z0-9\.\-_/]+)\s+(v[0-9\.]+)", line)
                    if match:
                        pkg_name = match.group(1)
                        version = match.group(2)
                        for adv in advisories_list:
                            if adv["package"] == pkg_name:
                                deps.append({
                                    "package": pkg_name,
                                    "version": version,
                                    "status": adv["status"],
                                    "severity": adv["severity"],
                                    "description": adv["description"]
                                })
        except Exception:
            pass
        return deps

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="QuantumShield CBOM Scanner Engine")
    parser.add_argument("--path", help="Local directory path to scan for classical crypto")
    parser.add_argument("--host", help="TLS endpoint host to inspect (e.g. google.com)")
    parser.add_argument("--port", type=int, default=443, help="Port of the TLS endpoint")
    parser.add_argument("--output", help="Path to write the generated CycloneDX CBOM report")
    
    args = parser.parse_args()

    if args.host:
        from cert_scanner import inspect_tls_endpoint
        print(f"[*] Probing TLS endpoint: {args.host}:{args.port}...")
        cert_info = inspect_tls_endpoint(args.host, args.port)
        print(json.dumps(cert_info, indent=2))
    elif args.path:
        print(f"[*] Scanning codebase directory: {args.path}...")
        scanner = QuantumShieldScanner()
        findings, deps = scanner.scan_directory(args.path)
        
        print(f"[*] Completed scan. Found {len(findings)} source code issues and {len(deps)} dependency advisories.")
        
        cbom = generate_cbom(findings, deps)
        
        if args.output:
            with open(args.output, "w", encoding="utf-8") as f:
                json.dump(cbom, f, indent=2)
            print(f"[+] CBOM report saved to: {args.output}")
        else:
            print(json.dumps(cbom, indent=2))
    else:
        parser.print_help()
