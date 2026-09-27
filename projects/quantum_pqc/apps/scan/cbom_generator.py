import json
import uuid
from datetime import datetime

def generate_cbom(findings, dependencies):
    """
    Converts code findings and dependencies into a CycloneDX v1.7 CBOM document.
    """
    bom = {
        "bomFormat": "CycloneDX",
        "specVersion": "1.7",
        "serialNumber": f"urn:uuid:{uuid.uuid4()}",
        "version": 1,
        "metadata": {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "tools": {
                "components": [
                    {
                        "type": "application",
                        "name": "QuantumShield Scan Engine",
                        "version": "1.0.0"
                    }
                ]
            }
        },
        "components": []
    }

    # 1. Add static code findings as cryptographic assets
    for idx, f in enumerate(findings):
        asset_name = f.get("algorithm", "Unknown Algorithm")
        component = {
            "type": "cryptographic-asset",
            "bom-ref": f"crypto-asset-{idx}",
            "name": asset_name,
            "description": f.get("description"),
            "cryptoProperties": {
                "assetType": "algorithm",
                "algorithmProperties": {
                    "parameterSet": f.get("parameter", "unknown"),
                    "executionEnvironment": "application-code"
                }
            },
            "properties": [
                {"name": "quantumshield:severity", "value": f.get("severity")},
                {"name": "quantumshield:file_path", "value": f.get("file_path")},
                {"name": "quantumshield:line_no", "value": str(f.get("line_no"))},
                {"name": "quantumshield:remediation", "value": f.get("remediation")}
            ]
        }
        
        # Add quantum-safety flag properties
        is_qs = "false"
        if "ml-kem" in asset_name.lower() or "ml-dsa" in asset_name.lower() or "hybrid" in asset_name.lower():
            is_qs = "true"
        component["properties"].append({"name": "quantumshield:quantum_safe", "value": is_qs})
        
        bom["components"].append(component)

    # 2. Add dependencies as library components with security tags
    for idx, dep in enumerate(dependencies):
        comp = {
            "type": "library",
            "bom-ref": f"library-{idx}",
            "name": dep.get("package"),
            "version": dep.get("version"),
            "description": dep.get("description", "Library dependency"),
            "properties": [
                {"name": "quantumshield:status", "value": dep.get("status")},
                {"name": "quantumshield:severity", "value": dep.get("severity", "Low")}
            ]
        }
        bom["components"].append(comp)

    return bom
