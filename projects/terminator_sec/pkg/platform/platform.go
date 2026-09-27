package platform

// ProcessInfo holds basic details of a running process.
type ProcessInfo struct {
	PID         int    `json:"pid"`
	PPID        int    `json:"ppid"`
	Name        string `json:"name"`
	Executable  string `json:"executable"`
	CommandLine string `json:"command_line"`
	Username    string `json:"username"`
}

// PlatformManager abstracts OS-specific network hooks, DNS configuration, and process observation.
type PlatformManager interface {
	GetPlatformName() string
	GetIPCPath() string
	ConfigureSystemDNS(proxyAddr string) error
	RestoreSystemDNS() error
	GetRunningProcesses() ([]ProcessInfo, error)
	IsAdmin() bool
}

// GetCurrentPlatform returns the OS-appropriate platform manager.
func GetCurrentPlatform() PlatformManager {
	return newPlatform()
}
