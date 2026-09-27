#!/usr/bin/env bash
set -e

echo "========================================================="
echo " Building macOS Package & launchd Service Setup..."
echo "========================================================="

OUTPUT_DIR="dist/macos"
mkdir -p "$OUTPUT_DIR"

# 1. Compile native macOS binaries (Universal / Host ARM64)
echo "[1/3] Compiling native macOS binaries..."
/usr/local/go/bin/go build -ldflags="-s -w" -o "$OUTPUT_DIR/terminator-agent" ./cmd/terminator-agent
/usr/local/go/bin/go build -ldflags="-s -w" -o "$OUTPUT_DIR/terminator-cli" ./cmd/terminator-cli
/usr/local/go/bin/go build -ldflags="-s -w" -o "$OUTPUT_DIR/terminator-server" ./cmd/terminator-server

# 2. Generate launchd plist configuration
cat << 'EOF' > "$OUTPUT_DIR/com.terminatorsec.agent.plist"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.terminatorsec.agent</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/terminator-agent</string>
        <string>-dns-port</string>
        <string>53</string>
        <string>-set-system-dns=true</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/var/log/terminator-agent.log</string>
    <key>StandardErrorPath</key>
    <string>/var/log/terminator-agent.err</string>
</dict>
</plist>
EOF

# 3. Generate install-macos.sh
cat << 'EOF' > "$OUTPUT_DIR/install-macos.sh"
#!/usr/bin/env bash
set -e

echo "Installing Terminator Sec on macOS..."
if [ "$EUID" -ne 0 ]; then
  echo "Please run with sudo: sudo ./install-macos.sh"
  exit 1
fi

cp terminator-agent /usr/local/bin/
cp terminator-cli /usr/local/bin/
cp com.terminatorsec.agent.plist /Library/LaunchDaemons/

launchctl load /Library/LaunchDaemons/com.terminatorsec.agent.plist
echo "[OK] Terminator Sec Agent installed & running as macOS launchd service."
EOF

chmod +x "$OUTPUT_DIR/install-macos.sh"

echo "========================================================="
echo " macOS Package successfully built at: dist/macos/"
echo "========================================================="
