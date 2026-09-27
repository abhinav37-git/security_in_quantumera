//go:build !darwin && !windows

package platform

import (
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
)

type linuxPlatform struct{}

func newPlatform() PlatformManager {
	return &linuxPlatform{}
}

func (p *linuxPlatform) GetPlatformName() string {
	return "Linux"
}

func (p *linuxPlatform) GetIPCPath() string {
	return "/var/run/terminator.sock"
}

func (p *linuxPlatform) IsAdmin() bool {
	return os.Geteuid() == 0
}

func (p *linuxPlatform) ConfigureSystemDNS(proxyAddr string) error {
	return nil
}

func (p *linuxPlatform) RestoreSystemDNS() error {
	return nil
}

func (p *linuxPlatform) GetRunningProcesses() ([]ProcessInfo, error) {
	cmd := exec.Command("ps", "-eo", "pid,ppid,user,comm")
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
