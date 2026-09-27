package ipc

import (
	"bufio"
	"encoding/json"
	"fmt"
	"net"
	"runtime"
	"time"

	"github.com/terminator-sec/terminator/pkg/engine"
)

// Client allows CLI or desktop apps to communicate with the Terminator daemon.
type Client struct {
	conn       net.Conn
	reader     *bufio.Reader
	socketPath string
}

// NewClient connects to the running Terminator daemon.
func NewClient(socketPath string) (*Client, error) {
	var conn net.Conn
	var err error

	if runtime.GOOS == "windows" {
		conn, err = net.DialTimeout("tcp", "127.0.0.1:9977", 2*time.Second)
	} else {
		conn, err = net.DialTimeout("unix", socketPath, 2*time.Second)
	}

	if err != nil {
		return nil, fmt.Errorf("could not connect to Terminator Sec daemon: %w", err)
	}

	return &Client{
		conn:       conn,
		reader:     bufio.NewReader(conn),
		socketPath: socketPath,
	}, nil
}

// GetStatus queries the daemon for current operational status.
func (c *Client) GetStatus() (*AgentStatus, error) {
	msg := Message{Type: MsgTypeGetStatus}
	data, _ := json.Marshal(msg)
	if _, err := c.conn.Write(append(data, '\n')); err != nil {
		return nil, err
	}

	line, err := c.reader.ReadBytes('\n')
	if err != nil {
		return nil, err
	}

	var resp Message
	if err := json.Unmarshal(line, &resp); err != nil {
		return nil, err
	}
	return resp.Status, nil
}

// GetAuditEvents queries the daemon for recent threat events.
func (c *Client) GetAuditEvents() ([]engine.ThreatEvent, error) {
	msg := Message{Type: MsgTypeGetAuditEvents}
	data, _ := json.Marshal(msg)
	if _, err := c.conn.Write(append(data, '\n')); err != nil {
		return nil, err
	}

	line, err := c.reader.ReadBytes('\n')
	if err != nil {
		return nil, err
	}

	var resp Message
	if err := json.Unmarshal(line, &resp); err != nil {
		return nil, err
	}
	return resp.Events, nil
}

// SendDecision sends a user response to a pending interactive prompt.
func (c *Client) SendDecision(eventID string, choice engine.UserChoice, target string) error {
	msg := Message{
		Type:       MsgTypeUserDecision,
		EventID:    eventID,
		UserChoice: choice,
		Target:     target,
	}
	data, _ := json.Marshal(msg)
	_, err := c.conn.Write(append(data, '\n'))
	return err
}

// ListenEvents reads a continuous stream of events from the daemon.
func (c *Client) ListenEvents(handler func(msg Message)) error {
	for {
		line, err := c.reader.ReadBytes('\n')
		if err != nil {
			return err
		}
		var msg Message
		if err := json.Unmarshal(line, &msg); err == nil {
			handler(msg)
		}
	}
}

// Close disconnects the client.
func (c *Client) Close() error {
	return c.conn.Close()
}
