package interceptor

import (
	"fmt"
	"net"
	"strings"
	"sync/atomic"
	"time"

	"github.com/miekg/dns"
	"github.com/terminator-sec/terminator/pkg/audit"
	"github.com/terminator-sec/terminator/pkg/engine"
	"github.com/terminator-sec/terminator/pkg/ipc"
)

// DNSProxy intercepts and evaluates all DNS resolution requests.
type DNSProxy struct {
	listenAddr     string
	upstreamAddr   string
	analyzer       *engine.ThreatAnalyzer
	logger         *audit.AuditLogger
	ipcServer      *ipc.Server
	udpServer      *dns.Server
	tcpServer      *dns.Server
	dnsClient      *dns.Client
	totalQueries   uint64
	threatsBlocked uint64
	threatsQueued  uint64
	running        atomic.Bool
}

// NewDNSProxy creates an instance of the DNS interceptor.
func NewDNSProxy(listenAddr, upstreamAddr string, analyzer *engine.ThreatAnalyzer, logger *audit.AuditLogger, ipcServer *ipc.Server) *DNSProxy {
	if listenAddr == "" {
		listenAddr = "127.0.0.1:53"
	}
	if upstreamAddr == "" {
		upstreamAddr = "1.1.1.1:53"
	}

	return &DNSProxy{
		listenAddr:   listenAddr,
		upstreamAddr: upstreamAddr,
		analyzer:     analyzer,
		logger:       logger,
		ipcServer:    ipcServer,
		dnsClient: &dns.Client{
			Timeout: 3 * time.Second,
		},
	}
}

// Start begins listening for UDP and TCP DNS queries.
func (dp *DNSProxy) Start() error {
	dp.udpServer = &dns.Server{
		Addr:    dp.listenAddr,
		Net:     "udp",
		Handler: dns.HandlerFunc(dp.handleDNS),
	}
	dp.tcpServer = &dns.Server{
		Addr:    dp.listenAddr,
		Net:     "tcp",
		Handler: dns.HandlerFunc(dp.handleDNS),
	}

	errChan := make(chan error, 2)
	dp.running.Store(true)

	go func() {
		if err := dp.udpServer.ListenAndServe(); err != nil && dp.running.Load() {
			errChan <- fmt.Errorf("UDP DNS proxy error: %w", err)
		}
	}()

	go func() {
		if err := dp.tcpServer.ListenAndServe(); err != nil && dp.running.Load() {
			errChan <- fmt.Errorf("TCP DNS proxy error: %w", err)
		}
	}()

	// Wait briefly to check if ports bound successfully
	select {
	case err := <-errChan:
		return err
	case <-time.After(150 * time.Millisecond):
		return nil
	}
}

func (dp *DNSProxy) handleDNS(w dns.ResponseWriter, r *dns.Msg) {
	atomic.AddUint64(&dp.totalQueries, 1)
	start := time.Now()

	if len(r.Question) == 0 {
		m := new(dns.Msg)
		m.SetRcode(r, dns.RcodeFormatError)
		_ = w.WriteMsg(m)
		return
	}

	q := r.Question[0]
	domain := strings.TrimSuffix(q.Name, ".")

	// 1. Analyze threat in sub-2ms
	verdict := dp.analyzer.AnalyzeDomain(domain)
	latencyMs := float64(time.Since(start).Microseconds()) / 1000.0

	event := engine.ThreatEvent{
		ID:         fmt.Sprintf("dns_%d_%d", time.Now().UnixNano(), atomic.LoadUint64(&dp.totalQueries)),
		DeviceName: "Local Endpoint",
		OS:         "macOS",
		Verdict:    verdict,
		ResolvedAt: time.Now(),
		LatencyMs:  latencyMs,
	}

	// 2. Evaluate Verdict Action
	switch verdict.Action {
	case engine.ActionAllow:
		// Safe: Forward to upstream resolver
		dp.forwardUpstream(w, r)
		dp.logger.LogEvent(event)

	case engine.ActionAutoBlock:
		// High threat (8-10): Return NXDOMAIN + Immediate sinkhole
		atomic.AddUint64(&dp.threatsBlocked, 1)
		dp.returnBlocked(w, r, q)
		dp.logger.LogEvent(event)
		if dp.ipcServer != nil {
			dp.ipcServer.BroadcastAlert(event)
		}

	case engine.ActionQueueUser:
		// Medium threat (4-7): Interactive Prompt via Desktop Popup
		atomic.AddUint64(&dp.threatsQueued, 1)
		var userChoice engine.UserChoice
		if dp.ipcServer != nil {
			// Prompt with 4 second timeout
			userChoice = dp.ipcServer.PromptUser(event, 4*time.Second)
		} else {
			userChoice = engine.ChoiceAlwaysBlock
		}

		event.UserChoice = userChoice
		if userChoice == engine.ChoiceAllowOnce || userChoice == engine.ChoiceTrustSource {
			if userChoice == engine.ChoiceTrustSource {
				dp.analyzer.TrustSource(domain)
			}
			dp.forwardUpstream(w, r)
		} else {
			// Always block or timeout
			dp.analyzer.BlockSource(domain)
			atomic.AddUint64(&dp.threatsBlocked, 1)
			dp.returnBlocked(w, r, q)
		}
		dp.logger.LogEvent(event)
	}
}

func (dp *DNSProxy) forwardUpstream(w dns.ResponseWriter, r *dns.Msg) {
	resp, _, err := dp.dnsClient.Exchange(r, dp.upstreamAddr)
	if err != nil || resp == nil {
		m := new(dns.Msg)
		m.SetRcode(r, dns.RcodeServerFailure)
		_ = w.WriteMsg(m)
		return
	}
	_ = w.WriteMsg(resp)
}

func (dp *DNSProxy) returnBlocked(w dns.ResponseWriter, r *dns.Msg, q dns.Question) {
	m := new(dns.Msg)
	m.SetReply(r)

	if q.Qtype == dns.TypeA {
		rr := &dns.A{
			Hdr: dns.RR_Header{
				Name:   q.Name,
				Rrtype: dns.TypeA,
				Class:  dns.ClassINET,
				Ttl:    60,
			},
			A: net.ParseIP("0.0.0.0"),
		}
		m.Answer = append(m.Answer, rr)
	} else {
		m.SetRcode(r, dns.RcodeNameError) // NXDOMAIN
	}

	_ = w.WriteMsg(m)
}

// GetStats returns current operational telemetry.
func (dp *DNSProxy) GetStats() (uint64, uint64, uint64) {
	return atomic.LoadUint64(&dp.totalQueries),
		atomic.LoadUint64(&dp.threatsBlocked),
		atomic.LoadUint64(&dp.threatsQueued)
}

// Stop shuts down the DNS interceptor.
func (dp *DNSProxy) Stop() {
	dp.running.Store(false)
	if dp.udpServer != nil {
		_ = dp.udpServer.Shutdown()
	}
	if dp.tcpServer != nil {
		_ = dp.tcpServer.Shutdown()
	}
}
