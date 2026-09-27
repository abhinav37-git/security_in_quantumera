//go:build windows

package platform

import (
	"fmt"
	"os/exec"
	"strconv"
	"strings"
)

type windowsPlatform struct {
	primaryInterface string
}

func newPlatform() PlatformManager {
	return &windowsPlatform{
		primaryInterface: "Ethernet",
	}
}

func (p *windowsPlatform) GetPlatformName() string {
	return "Windows 10/11"
}

func (p *windowsPlatform) GetIPCPath() string {
	return `\\.\pipe\terminator_ipc`
}

func (p *windowsPlatform) IsAdmin() bool {
	cmd := exec.Command("net", "session")
	return cmd.Run() == nil
}

func (p *windowsPlatform) ConfigureSystemDNS(proxyAddr string) error {
	host := proxyAddr
	if strings.Contains(proxyAddr, ":") {
		parts := strings.Split(proxyAddr, ":")
		host = parts[0]
	}

	cmd := exec.Command("netsh", "interface", "ip", "set", "dns", fmt.Sprintf("name=\"%s\"", p.primaryInterface), "static", host)
	return cmd.Run()
}

func (p *windowsPlatform) RestoreSystemDNS() error {
	cmd := exec.Command("netsh", "interface", "ip", "set", "dns", fmt.Sprintf("name=\"%s\"", p.primaryInterface), "dhcp")
	return cmd.Run()
}

func (p *windowsPlatform) GetRunningProcesses() ([]ProcessInfo, error) {
	cmd := exec.Command("tasklist", "/FO", "CSV", "/NH")
	out, err := cmd.Output()
	if err != nil {
		return nil, err
	}

	var procs []ProcessInfo
	lines := strings.Split(string(out), "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		parts := strings.Split(line, "\",\"")
		if len(parts) >= 2 {
			name := strings.Trim(parts[0], "\"")
			pidStr := strings.Trim(parts[1], "\"")
			pid, _ := strconv.Atoi(pidStr)
			procs = append(procs, ProcessInfo{
				PID:         pid,
				Name:        name,
				Executable:  name,
				CommandLine: name,
			})
		}
	}
	return procs, nil
}
