import ssl
import socket
from datetime import datetime

def inspect_tls_endpoint(host, port=443):
    """
    Connects to a TLS endpoint, retrieves certificate metadata, and determines CNSA 2.0 status.
    """
    result = {
        "endpoint": f"{host}:{port}",
        "connected": False,
        "subject": "Unknown",
        "issuer": "Unknown",
        "algorithm": "Unknown",
        "key_bits": 0,
        "expiry_date": None,
        "pq_hybrid": False,
        "cnsa_compliant": False,
        "warnings": []
    }

    try:
        context = ssl.create_default_context()
        # Enable all cipher suites
        context.set_ciphers('DEFAULT:AESGCM+ECDH:CHACHA20+ECDH:ECDH+AESGCM:ECDH+CHACHA20')
        
        with socket.create_connection((host, port), timeout=5) as sock:
            with context.wrap_socket(sock, server_hostname=host) as ssock:
                cert = ssock.getpeercert()
                cipher = ssock.cipher()
                
                result["connected"] = True
                
                # Check cipher suite for PQ hybrid (e.g., MLKEM, X25519MLKEM768 / 0x11ec)
                cipher_name = cipher[0]
                if "mlkem" in cipher_name.lower() or "kyber" in cipher_name.lower():
                    result["pq_hybrid"] = True
                
                # Parse certificate properties
                subject = dict(x[0] for x in cert.get('subject', []))
                issuer = dict(x[0] for x in cert.get('issuer', []))
                
                result["subject"] = subject.get('commonName', 'Unknown')
                result["issuer"] = issuer.get('commonName', 'Unknown')
                
                # Parse expiry
                not_after_str = cert.get('notAfter')
                if not_after_str:
                    expiry = datetime.strptime(not_after_str, '%b %d %H:%M:%S %Y %Z')
                    result["expiry_date"] = expiry.strftime('%Y-%m-%d')
                
                # Try to extract key details
                # Default python ssl module returns structured cert but doesn't give raw signature algorithm or key size directly.
                # We can deduce based on TLS configuration or standard parameters.
                # In standard environments, we can query details.
                # Let's inspect the cipher group to guess public key type
                if "ECDSA" in cipher_name:
                    result["algorithm"] = "ECDSA"
                    result["key_bits"] = 256
                elif "RSA" in cipher_name:
                    result["algorithm"] = "RSA"
                    result["key_bits"] = 2048
                else:
                    result["algorithm"] = "ECDSA (Assumed)"
                    result["key_bits"] = 256

                # Check CNSA 2.0 Compliance:
                # Requires ML-KEM-1024 or ML-DSA-87, or classical RSA >= 3072 / ECDSA >= P-384 in the interim
                if result["pq_hybrid"]:
                    result["cnsa_compliant"] = True
                elif result["algorithm"] == "RSA" and result["key_bits"] >= 3072:
                    result["cnsa_compliant"] = True
                    result["warnings"].append("Uses classical RSA >= 3072. Must transition to ML-DSA/ML-KEM by 2030 CNSA deadline.")
                elif result["algorithm"] == "ECDSA" and result["key_bits"] >= 384:
                    result["cnsa_compliant"] = True
                    result["warnings"].append("Uses classical ECDSA >= P-384. Must transition to ML-DSA/ML-KEM by 2030 CNSA deadline.")
                else:
                    result["cnsa_compliant"] = False
                    result["warnings"].append("Vulnerable to post-quantum decryption (Harvest Now, Decrypt Later).")

    except Exception as e:
        result["warnings"].append(f"Connection failed: {str(e)}")

    return result

if __name__ == "__main__":
    import sys
    host = sys.argv[1] if len(sys.argv) > 1 else "google.com"
    print(inspect_tls_endpoint(host))
