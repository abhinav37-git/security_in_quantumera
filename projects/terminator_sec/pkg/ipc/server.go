package ipc

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"os"
	"path/filepath"
	"runtime"
	"sync"
	"time"

	"github.com/terminator-sec/terminator/pkg/engine"
)

// Server handles IPC connections from the desktop UI and CLI.
type Server struct {
	mu             sync.RWMutex
	listener       net.Listener
	clients        map[net.Conn]bool
	pendingPrompts map[string]chan engine.UserChoice
	onDecision     func(eventID string, choice engine.UserChoice, target string)
	getStatus      func() *AgentStatus
	getEvents      func(limit int) []engine.ThreatEvent
	socketPath     string
	isClosed       bool
}

// NewServer creates a new IPC server.
func NewServer(socketPath string, getStatus func() *AgentStatus, getEvents func(limit int) []engine.ThreatEvent, onDecision func(string, engine.UserChoice, string)) *Server {
	return &Server{
		clients:        make(map[net.Conn]bool),
		pendingPrompts: make(map[string]chan engine.UserChoice),
		onDecision:     onDecision,
		getStatus:      getStatus,
		getEvents:      getEvents,
		socketPath:     socketPath,
	}
}

// Start listens for incoming IPC client connections.
func (s *Server) Start() error {
	var l net.Listener
	var err error

	if runtime.GOOS == "windows" {
		// On Windows, bind local loopback port for reliable IPC
		l, err = net.Listen("tcp", "127.0.0.1:9977")
	} else {
		// On macOS / Linux, use Unix Domain Socket
		_ = os.Remove(s.socketPath)
		_ = os.MkdirAll(filepath.Dir(s.socketPath), 0755)
		l, err = net.Listen("unix", s.socketPath)
	}

	if err != nil {
		return fmt.Errorf("failed to start IPC listener: %w", err)
	}
	s.listener = l

	go s.acceptLoop()
	return nil
}

func (s *Server) acceptLoop() {
	for {
		conn, err := s.listener.Accept()
		if err != nil {
			s.mu.RLock()
			closed := s.isClosed
			s.mu.RUnlock()
			if closed {
				return
			}
			continue
		}

		s.mu.Lock()
		s.clients[conn] = true
		s.mu.Unlock()

		go s.handleClient(conn)
	}
}

func (s *Server) handleClient(conn net.Conn) {
	defer func() {
		conn.Close()
		s.mu.Lock()
		delete(s.clients, conn)
		s.mu.Unlock()
	}()

	reader := bufio.NewReader(conn)
	for {
		line, err := reader.ReadBytes('\n')
		if err != nil {
			if err != io.EOF {
				// connection error
			}
			return
		}

		var msg Message
		if err := json.Unmarshal(line, &msg); err != nil {
			continue
		}

		s.handleMessage(conn, &msg)
	}
}

func (s *Server) handleMessage(conn net.Conn, msg *Message) {
	switch msg.Type {
	case MsgTypeGetStatus:
		var status *AgentStatus
		if s.getStatus != nil {
			status = s.getStatus()
		}
		s.sendDirect(conn, Message{
			Type:   MsgTypeStatusResponse,
			Status: status,
		})

	case MsgTypeGetAuditEvents:
		var events []engine.ThreatEvent
		if s.getEvents != nil {
			events = s.getEvents(50)
		}
		s.sendDirect(conn, Message{
			Type:   MsgTypeAuditResponse,
			Events: events,
		})

	case MsgTypeUserDecision:
		s.mu.Lock()
		if ch, exists := s.pendingPrompts[msg.EventID]; exists {
			select {
			case ch <- msg.UserChoice:
			default:
			}
			delete(s.pendingPrompts, msg.EventID)
		}
		s.mu.Unlock()

		if s.onDecision != nil {
			s.onDecision(msg.EventID, msg.UserChoice, msg.Target)
		}
	}
}

func (s *Server) sendDirect(conn net.Conn, msg Message) {
	data, err := json.Marshal(msg)
	if err == nil {
		_, _ = conn.Write(append(data, '\n'))
	}
}

// BroadcastAlert sends an alert notification to all connected UI clients.
func (s *Server) BroadcastAlert(event engine.ThreatEvent) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	msg := Message{
		Type:    MsgTypeThreatAlert,
		EventID: event.ID,
		Event:   &event,
	}
	data, err := json.Marshal(msg)
	if err != nil {
		return
	}
	payload := append(data, '\n')

	for conn := range s.clients {
		_, _ = conn.Write(payload)
	}
}

// PromptUser broadcasts an interactive prompt and blocks awaiting user response or timeout.
func (s *Server) PromptUser(event engine.ThreatEvent, timeout time.Duration) engine.UserChoice {
	ch := make(chan engine.UserChoice, 1)

	s.mu.Lock()
	s.pendingPrompts[event.ID] = ch
	s.mu.Unlock()

	// Broadcast prompt message
	msg := Message{
		Type:    MsgTypePromptUser,
		EventID: event.ID,
		Event:   &event,
	}
	data, _ := json.Marshal(msg)
	payload := append(data, '\n')

	s.mu.RLock()
	for conn := range s.clients {
		_, _ = conn.Write(payload)
	}
	s.mu.RUnlock()

	// Wait for user choice or timeout
	select {
	case choice := <-ch:
		return choice
	case <-time.After(timeout):
		s.mu.Lock()
		delete(s.pendingPrompts, event.ID)
		s.mu.Unlock()
		// Safe default fallback
		return engine.ChoiceAlwaysBlock
	}
}

// Stop closes the server and listener.
func (s *Server) Stop() error {
	s.mu.Lock()
	s.isClosed = true
	for conn := range s.clients {
		_ = conn.Close()
	}
	s.mu.Unlock()

	if s.listener != nil {
		_ = s.listener.Close()
	}
	if runtime.GOOS != "windows" {
		_ = os.Remove(s.socketPath)
	}
	return nil
}
