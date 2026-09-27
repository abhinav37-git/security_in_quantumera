//go:build darwin

package platform

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
)

type darwinPlatform struct {
	primaryInterface string
	backupDNS        []string
}

func newPlatform() PlatformManager {
	return &darwinPlatform{
		primaryInterface: detectPrimaryNetworkService(),
	}
}

func (p *darwinPlatform) GetPlatformName() string {
	return "macOS (Darwin)"
}

func (p *darwinPlatform) GetIPCPath() string {
	home, _ := os.UserHomeDir()
	dir := filepath.Join(home, ".terminator")
	_ = os.MkdirAll(dir, 0755)
	return filepath.Join(dir, "terminator.sock")
}

func (p *darwinPlatform) IsAdmin() bool {
	return os.Geteuid() == 0
}

func detectPrimaryNetworkService() string {
	// Query default route interface
	cmd := exec.Command("route", "-n", "get", "default")
	out, err := cmd.Output()
	if err != nil {
		return "Wi-Fi"
	}
	lines := strings.Split(string(out), "\n")
	var ifaceName string
	for _, l := range lines {
		if strings.Contains(l, "interface:") {
			parts := strings.Fields(l)
			if len(parts) >= 2 {
				ifaceName = parts[1]
				break
			}
		}
	}
	if ifaceName == "" {
		return "Wi-Fi"
	}

	// Map interface (e.g. en0) to network service name (e.g. Wi-Fi)
	cmd = exec.Command("networksetup", "-listnetworkserviceorder")
	out, err = cmd.Output()
	if err != nil {
		return "Wi-Fi"
	}
	lines = strings.Split(string(out), "\n")
	for i, l := range lines {
		if strings.Contains(l, fmt.Sprintf("Device: %s", ifaceName)) && i > 0 {
			prevLine := lines[i-1]
			if idx := strings.Index(prevLine, ")"); idx != -1 {
				service := strings.TrimSpace(prevLine[idx+1:])
				if service != "" {
					return service
				}
			}
		}
	}
	return "Wi-Fi"
}

func (p *darwinPlatform) ConfigureSystemDNS(proxyAddr string) error {
	service := p.primaryInterface
	if service == "" {
		service = "Wi-Fi"
	}

	cmd := exec.Command("networksetup", "-getdnsservers", service)
	out, err := cmd.Output()
	if err == nil {
		lines := strings.Split(strings.TrimSpace(string(out)), "\n")
		if len(lines) > 0 && !strings.Contains(lines[0], "There aren't any DNS Servers") {
			p.backupDNS = lines
		}
	}

	host := proxyAddr
	if strings.Contains(proxyAddr, ":") {
		parts := strings.Split(proxyAddr, ":")
		host = parts[0]
	}

	setCmd := exec.Command("networksetup", "-setdnsservers", service, host)
	return setCmd.Run()
}

func (p *darwinPlatform) RestoreSystemDNS() error {
	service := p.primaryInterface
	if service == "" {
		service = "Wi-Fi"
	}

	if len(p.backupDNS) > 0 {
		args := append([]string{"-setdnsservers", service}, p.backupDNS...)
		return exec.Command("networksetup", args...).Run()
	}
	return exec.Command("networksetup", "-setdnsservers", service, "Empty").Run()
}

func (p *darwinPlatform) GetRunningProcesses() ([]ProcessInfo, error) {
	cmd := exec.Command("ps", "-axo", "pid,ppid,user,comm")
	out, err := cmd.Output()
	if err != nil {
		return nil, err
	}

	var procs []ProcessInfo
	lines := strings.Split(string(out), "\n")
	for i, line := range lines {
		if i == 0 || strings.TrimSpace(line) == "" {
			continue
		}
		fields := strings.Fields(line)
		if len(fields) < 4 {
			continue
		}
		pid, _ := strconv.Atoi(fields[0])
		ppid, _ := strconv.Atoi(fields[1])
		user := fields[2]
		comm := strings.Join(fields[3:], " ")

		procs = append(procs, ProcessInfo{
			PID:         pid,
			PPID:        ppid,
			Name:        filepath.Base(comm),
			Executable:  comm,
			CommandLine: comm,
			Username:    user,
		})
	}
	return procs, nil
}
