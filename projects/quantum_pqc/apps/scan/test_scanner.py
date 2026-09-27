import os
import json
import tempfile
import unittest
from scanner import QuantumShieldScanner
from cbom_generator import generate_cbom

class TestQuantumShieldScanner(unittest.TestCase):
    def setUp(self):
        self.scanner = QuantumShieldScanner()

    def test_scan_python_source(self):
        # Create a mock Python file with weak RSA and MD5 usage
        with tempfile.NamedTemporaryFile(suffix=".py", delete=False, mode="w") as f:
            f.write("key = RSA.generate(1024)\n")
            f.write("hash = hashlib.md5(b'test')\n")
            f_name = f.name

        try:
            findings = self.scanner.scan_file(f_name, "python")
            self.assertEqual(len(findings), 2)
            
            # Verify details of RSA finding
            rsa_finding = next(f for f in findings if f["rule_id"] == "python-weak-rsa")
            self.assertEqual(rsa_finding["severity"], "High")
            self.assertEqual(rsa_finding["algorithm"], "RSA")
            self.assertEqual(rsa_finding["line_no"], 1)

            # Verify details of MD5 finding
            md5_finding = next(f for f in findings if f["rule_id"] == "python-insecure-hash")
            self.assertEqual(md5_finding["severity"], "Medium")
            self.assertEqual(md5_finding["algorithm"], "MD5/SHA-1")
            self.assertEqual(md5_finding["line_no"], 2)
        finally:
            os.unlink(f_name)

    def test_scan_dependencies(self):
        # Create a mock requirements.txt
        with tempfile.NamedTemporaryFile(suffix="requirements.txt", delete=False, mode="w") as f:
            f.write("pycryptodome==3.18.0\n")
            f_name = f.name

        try:
            deps = self.scanner.scan_python_dependencies(f_name)
            self.assertEqual(len(deps), 1)
            self.assertEqual(deps[0]["package"], "pycryptodome")
            self.assertEqual(deps[0]["status"], "classical-only")
            self.assertEqual(deps[0]["severity"], "Medium")
        finally:
            os.unlink(f_name)

    def test_cbom_generation(self):
        findings = [
            {
                "rule_id": "python-weak-rsa",
                "file_path": "main.py",
                "line_no": 10,
                "severity": "High",
                "description": "RSA key size < 3072 bits.",
                "remediation": "Upgrade to 3072+.",
                "algorithm": "RSA",
                "parameter": "2048"
            }
        ]
        dependencies = [
            {
                "package": "pycryptodome",
                "version": "3.18.0",
                "status": "classical-only",
                "severity": "Medium",
                "description": "Uses classical cryptography."
            }
        ]
        
        cbom = generate_cbom(findings, dependencies)
        self.assertEqual(cbom["bomFormat"], "CycloneDX")
        self.assertEqual(cbom["specVersion"], "1.7")
        self.assertTrue(len(cbom["components"]) >= 2)
        
        # Verify component properties
        comp = cbom["components"][0]
        self.assertEqual(comp["type"], "cryptographic-asset")
        self.assertEqual(comp["name"], "RSA")
        
        prop_severity = next(p for p in comp["properties"] if p["name"] == "quantumshield:severity")
        self.assertEqual(prop_severity["value"], "High")

if __name__ == "__main__":
    unittest.main()
