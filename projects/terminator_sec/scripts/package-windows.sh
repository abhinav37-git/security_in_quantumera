#!/usr/bin/env bash
set -e

echo "========================================================="
echo " Building Windows Package for UTM / VMware VM Testing..."
echo "========================================================="

OUTPUT_DIR="dist/windows-terminator-sec"
mkdir -p "$OUTPUT_DIR"

# 1. Cross-compile Windows AMD64 binaries
echo "[1/4] Cross-compiling Windows 64-bit binaries (Go)..."
GOOS=windows GOARCH=amd64 /usr/local/go/bin/go build -ldflags="-s -w" -o "$OUTPUT_DIR/terminator-agent.exe" ./cmd/terminator-agent
GOOS=windows GOARCH=amd64 /usr/local/go/bin/go build -ldflags="-s -w" -o "$OUTPUT_DIR/terminator-cli.exe" ./cmd/terminator-cli
GOOS=windows GOARCH=amd64 /usr/local/go/bin/go build -ldflags="-s -w" -o "$OUTPUT_DIR/terminator-server.exe" ./cmd/terminator-server

# 2. Generate install-service.bat for easy Windows setup
cat << 'EOF' > "$OUTPUT_DIR/install-service.bat"
@echo off
title Terminator Sec - Windows VM Setup
echo =========================================================
echo    Terminator Sec - Windows Agent Setup (UTM / VMware)
echo =========================================================
echo.
echo Checking administrator privileges...
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Running with Administrator privileges.
) else (
    echo [WARN] Not running as Administrator. Run as Admin for full DNS interception.
)

echo.
echo Starting Terminator Sec Agent on DNS port 53...
echo.
terminator-agent.exe -dns-port 53 -set-system-dns=true
pause
EOF

# 3. Generate test-interception.bat
cat << 'EOF' > "$OUTPUT_DIR/test-interception.bat"
@echo off
title Terminator Sec - Test Diagnostics
echo =========================================================
echo    Running Diagnostic Tests inside Windows VM
echo =========================================================
echo.
echo 1. Testing Whitelisted Domain:
terminator-cli.exe test-domain google.com
echo.
echo 2. Testing Known C2 Server (LockBit):
terminator-cli.exe test-domain lockbit-leak.onion.to
echo.
echo 3. Testing Known Phishing Farm:
terminator-cli.exe test-domain paypal-security-verification.com
echo.
echo 4. Testing DGA Botnet Anomaly:
terminator-cli.exe test-domain xk9qz7w4lm2p0a.xyz
echo.
echo 5. Agent Status:
terminator-cli.exe status
echo.
pause
EOF

# 4. Generate README for VM Testing
cat << 'EOF' > "$OUTPUT_DIR/README.txt"
========================================================================
  TERMINATOR SEC - WINDOWS VM TESTING PACKAGE (UTM / VMWARE)
========================================================================

HOW TO TEST INSIDE WINDOWS VM (UTM or VMware):

1. Copy the contents of this folder or unzip windows-terminator-sec.zip
   into your Windows Virtual Machine (e.g. C:\TerminatorSec\).

2. Open Command Prompt or PowerShell as Administrator:
   cd C:\TerminatorSec\

3. Run the Agent:
   .\terminator-agent.exe -dns-port 53

4. In a second terminal window, run diagnostic tests:
   .\test-interception.bat
   or:
   .\terminator-cli.exe test-domain emotet-c2.net
   .\terminator-cli.exe test-domain xk9qz7w4lm2p0a.xyz
   .\terminator-cli.exe status

5. To run the central Admin Dashboard / API locally on Windows:
   .\terminator-server.exe -port 8080
   Open browser at: http://localhost:8080

Architecture Notes:
- Named Pipes IPC: \\.\pipe\terminator_ipc
- DNS Wire Format Interception: Sub-millisecond budget (<0.1ms)
- Multi-tier Radix + Bloom + Heuristic + Hash Pipeline (<2ms)
- Resource Footprint: <1% CPU, <20MB RAM
========================================================================
EOF

# 5. Package as ZIP
echo "[4/4] Creating ZIP archive for easy transfer..."
mkdir -p dist
mkdir -p apps/dashboard/public/dist
(cd dist && zip -r windows-terminator-sec.zip windows-terminator-sec)
cp dist/windows-terminator-sec.zip apps/dashboard/public/dist/windows-terminator-sec.zip 2>/dev/null || true

echo "========================================================="
echo " Windows Package successfully built at: dist/windows-terminator-sec.zip"
echo " Ready for UTM / VMware Virtual Machine testing!"
echo "========================================================="
