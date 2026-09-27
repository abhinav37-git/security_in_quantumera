.PHONY: all build build-macos build-windows test clean package run-agent run-server run-dashboard

all: test build build-windows

build: build-macos build-windows

build-macos:
	@echo "==> Building macOS Binaries..."
	@mkdir -p bin
	/usr/local/go/bin/go build -ldflags="-s -w" -o bin/terminator-agent ./cmd/terminator-agent
	/usr/local/go/bin/go build -ldflags="-s -w" -o bin/terminator-cli ./cmd/terminator-cli
	/usr/local/go/bin/go build -ldflags="-s -w" -o bin/terminator-server ./cmd/terminator-server

build-windows:
	@echo "==> Cross-compiling Windows (amd64) Binaries for UTM/VMware..."
	@mkdir -p bin/windows
	GOOS=windows GOARCH=amd64 /usr/local/go/bin/go build -ldflags="-s -w" -o bin/windows/terminator-agent.exe ./cmd/terminator-agent
	GOOS=windows GOARCH=amd64 /usr/local/go/bin/go build -ldflags="-s -w" -o bin/windows/terminator-cli.exe ./cmd/terminator-cli
	GOOS=windows GOARCH=amd64 /usr/local/go/bin/go build -ldflags="-s -w" -o bin/windows/terminator-server.exe ./cmd/terminator-server

test:
	@echo "==> Running Test Suite & Latency Benchmarks..."
	/usr/local/go/bin/go test -v -bench=. ./pkg/...

package: build-macos build-windows
	@./scripts/package-windows.sh
	@./scripts/package-macos.sh

run-agent:
	@echo "==> Starting Terminator Sec Agent Daemon on DNS port 5353..."
	./bin/terminator-agent -dns-port 5353

run-server:
	@echo "==> Starting Central Admin & Telemetry Server on http://localhost:8080..."
	./bin/terminator-server -port 8080

run-dashboard:
	@echo "==> Starting React Dashboard..."
	cd apps/dashboard && npm run dev

clean:
	@rm -rf bin dist apps/dashboard/dist
