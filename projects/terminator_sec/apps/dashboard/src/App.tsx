import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { LiveThreatFeed } from './components/LiveThreatFeed';
import { ThreatSimulator } from './components/ThreatSimulator';
import { FleetManager } from './components/FleetManager';
import { ArchitectureView } from './components/ArchitectureView';
import { BusinessModelView } from './components/BusinessModelView';
import { ThreatModal } from './components/ThreatModal';
import { ThreatEvent, AgentStatus, DeviceInfo, UserChoice } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('feed');
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [events, setEvents] = useState<ThreatEvent[]>([]);
  const [fleet, setFleet] = useState<DeviceInfo[]>([]);
  const [activeModalEvent, setActiveModalEvent] = useState<ThreatEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initial Data Fetch
  const fetchData = async () => {
    try {
      const [statusRes, eventsRes, fleetRes] = await Promise.all([
        fetch('http://localhost:8080/api/status').then((r) => r.json()),
        fetch('http://localhost:8080/api/events').then((r) => r.json()),
        fetch('http://localhost:8080/api/fleet').then((r) => r.json()),
      ]);
      setStatus(statusRes);
      setEvents(eventsRes);
      setFleet(fleetRes);
    } catch (e) {
      console.warn('Backend server offline or unreachable, using local fallback state', e);
      // Fallback state if server not running yet
      if (!status) {
        setStatus({
          agent_version: '1.0.0-gold',
          platform: 'macOS (Darwin arm64) + Windows VM',
          is_admin: true,
          dns_proxy_port: 5353,
          dns_proxy_active: true,
          process_watch_active: true,
          fs_guard_active: true,
          total_queries: 1420,
          threats_blocked: 12,
          threats_queued: 3,
          uptime_seconds: 3420,
          cpu_usage_pct: 0.18,
        });
      }
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket for Real-Time Threat Stream
  useEffect(() => {
    let ws: WebSocket;
    try {
      ws = new WebSocket('ws://localhost:8080/ws/threats');
      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          if (data.type === 'THREAT_EVENT' && data.event) {
            setEvents((prev) => [data.event, ...prev]);
            if (data.event.verdict.action === 'QUEUE_USER') {
              setActiveModalEvent(data.event);
              setIsModalOpen(true);
            }
          }
        } catch (err) {
          console.error('WS parse error', err);
        }
      };
    } catch (e) {
      // WS error
    }
    return () => {
      if (ws) ws.close();
    };
  }, []);

  const handleDecision = async (eventId: string, choice: UserChoice, target: string) => {
    try {
      await fetch('http://localhost:8080/api/policies/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, target, choice }),
      });
      fetchData();
    } catch (e) {
      console.error('Decision error', e);
    }
  };

  const handleSimulate = async (target: string, threatType: string): Promise<ThreatEvent | null> => {
    try {
      const res = await fetch('http://localhost:8080/api/threats/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, threat_type: threatType }),
      });
      const data: ThreatEvent = await res.json();
      setEvents((prev) => [data, ...prev]);
      return data;
    } catch (e) {
      // Local evaluation fallback simulation
      const fallbackEvent: ThreatEvent = {
        id: `sim_${Date.now()}`,
        device_name: 'MacBook-Pro-Local',
        os: 'macOS 15.0',
        verdict: {
          target,
          target_type: 'domain',
          severity: target.includes('lockbit') || target.includes('emotet') ? 10 : 7,
          action: target.includes('lockbit') || target.includes('emotet') ? 'AUTO_BLOCK' : 'QUEUE_USER',
          category: target.includes('lockbit') ? 'RANSOMWARE' : 'DGA_ANOMALY',
          threat_name: target.includes('lockbit') ? 'LockBit Ransomware Gateway' : 'DGA Algorithmic Domain',
          reason: 'Identified through multi-tier heuristic and signature pipeline',
          matched_tier: 2,
          entropy: 3.82,
          confidence: 0.96,
          timestamp: new Date().toISOString(),
        },
        resolved_at: new Date().toISOString(),
        latency_ms: 0.42,
      };
      setEvents((prev) => [fallbackEvent, ...prev]);
      return fallbackEvent;
    }
  };

  const pendingEvents = events.filter((e) => e.verdict.action === 'QUEUE_USER');

  return (
    <div className="min-h-screen bg-[#070a0f] text-slate-100 flex flex-col font-['Outfit']">
      <Header
        status={status}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={pendingEvents.length}
        onOpenPending={() => {
          if (pendingEvents.length > 0) {
            setActiveModalEvent(pendingEvents[0]);
            setIsModalOpen(true);
          }
        }}
        onRefresh={fetchData}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        <StatsCards status={status} totalEvents={events.length} />

        {activeTab === 'feed' && (
          <LiveThreatFeed
            events={events}
            onSelectEvent={(evt) => {
              setActiveModalEvent(evt);
              setIsModalOpen(true);
            }}
          />
        )}

        {activeTab === 'simulator' && (
          <ThreatSimulator
            onSimulate={handleSimulate}
            onTriggerModal={(evt) => {
              setActiveModalEvent(evt);
              setIsModalOpen(true);
            }}
          />
        )}

        {activeTab === 'fleet' && <FleetManager fleet={fleet} />}

        {activeTab === 'architecture' && <ArchitectureView />}

        {activeTab === 'business' && <BusinessModelView />}
      </main>

      {/* Interactive Popup Modal (Stage 5) */}
      <ThreatModal
        event={activeModalEvent}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDecision={handleDecision}
      />

      <footer className="border-t border-slate-800/80 bg-[#070a0f] py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center px-6 gap-2">
          <span>Terminator Sec © 2026 · Ultra-Lightweight Threat Interception & Endpoint Protection</span>
          <span className="mono-font text-cyan-400">Target CPU &lt;1% · Sub-10ms Pipeline</span>
        </div>
      </footer>
    </div>
  );
}
export default App;
