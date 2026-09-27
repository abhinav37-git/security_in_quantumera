import React, { useState } from 'react';
import { Play, Sparkles, ShieldAlert, Zap, Layers, RefreshCw } from 'lucide-react';
import { ThreatEvent } from '../types';

interface ThreatSimulatorProps {
  onSimulate: (target: string, type: string) => Promise<ThreatEvent | null>;
  onTriggerModal: (event: ThreatEvent) => void;
}

export const ThreatSimulator: React.FC<ThreatSimulatorProps> = ({ onSimulate, onTriggerModal }) => {
  const [customTarget, setCustomTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<ThreatEvent | null>(null);

  const presets = [
    {
      label: 'LockBit Ransomware Gateway',
      target: 'lockbit-leak.onion.to',
      type: 'ransomware',
      severity: '10/10',
      expected: 'AUTO_BLOCK (Immediate Drop)',
      category: 'RANSOMWARE',
    },
    {
      label: 'PayPal Phishing Harvest',
      target: 'paypal-security-verification.com',
      type: 'phish',
      severity: '9/10',
      expected: 'AUTO_BLOCK (NXDOMAIN)',
      category: 'PHISHING',
    },
    {
      label: 'DGA Botnet Algorithmic Domain',
      target: 'xk9qz7w4lm2p0a.xyz',
      type: 'dga',
      severity: '7/10',
      expected: 'QUEUE_USER (Interactive Popup)',
      category: 'DGA_ANOMALY',
    },
    {
      label: 'Emotet Banking Trojan C2',
      target: 'emotet-c2.net',
      type: 'c2',
      severity: '10/10',
      expected: 'AUTO_BLOCK (Connection Reset)',
      category: 'C2_SERVER',
    },
    {
      label: 'Known Legitimate Service',
      target: 'google.com',
      type: 'benign',
      severity: '1/10',
      expected: 'ALLOW (Forward to Upstream)',
      category: 'BENIGN',
    },
  ];

  const handleRunPreset = async (target: string, type: string) => {
    setLoading(true);
    const res = await onSimulate(target, type);
    setLoading(false);
    if (res) {
      setLastResult(res);
      if (res.verdict.action === 'QUEUE_USER' || res.verdict.severity >= 8) {
        onTriggerModal(res);
      }
    }
  };

  const handleCustomRun = async () => {
    if (!customTarget.trim()) return;
    setLoading(true);
    const res = await onSimulate(customTarget.trim(), 'custom');
    setLoading(false);
    if (res) {
      setLastResult(res);
      if (res.verdict.action === 'QUEUE_USER' || res.verdict.severity >= 8) {
        onTriggerModal(res);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Simulation Header */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 font-['Outfit']">
              Interception & Decision Playground
            </h2>
            <p className="text-xs text-slate-400">
              Simulate live kernel DNS queries & process events to test sub-millisecond evaluation
            </p>
          </div>
        </div>

        {/* Custom Input */}
        <div className="mt-5 flex gap-3">
          <input
            type="text"
            placeholder="Enter any custom domain, IP, or hash (e.g. apple-verify-id.tk or 185.220.101.5)"
            value={customTarget}
            onChange={(e) => setCustomTarget(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={handleCustomRun}
            disabled={loading || !customTarget.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>Evaluate Threat</span>
          </button>
        </div>
      </div>

      {/* Preset Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {presets.map((preset, idx) => (
          <div
            key={idx}
            className="glass-panel rounded-2xl p-5 hover:border-cyan-500/40 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Scenario {idx + 1}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] mono-font font-bold text-cyan-300">
                  {preset.severity}
                </span>
              </div>
              <h3 className="mt-2 text-sm font-bold text-slate-100">{preset.label}</h3>
              <p className="mt-1 text-xs text-cyan-400 mono-font break-all">{preset.target}</p>
              <div className="mt-3 p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-300">
                <span className="text-slate-500">Expected:</span> {preset.expected}
              </div>
            </div>

            <button
              onClick={() => handleRunPreset(preset.target, preset.type)}
              disabled={loading}
              className="mt-4 flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-slate-700 hover:border-cyan-500/40 transition shadow"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Simulate Interception</span>
            </button>
          </div>
        ))}
      </div>

      {/* Last Result Card */}
      {lastResult && (
        <div className="glass-panel-glow rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              Live Engine Verdict Output
            </span>
            <span className="text-xs mono-font text-emerald-400 font-semibold">
              Execution Time: {lastResult.latency_ms.toFixed(3)} ms
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block mb-1">Target Entity</span>
              <span className="text-slate-200 font-bold mono-font">{lastResult.verdict.target}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block mb-1">Severity & Action</span>
              <span className="text-cyan-300 font-bold mono-font">
                {lastResult.verdict.severity}/10 · {lastResult.verdict.action}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block mb-1">Analysis Tier</span>
              <span className="text-slate-200 font-bold mono-font">
                Tier {lastResult.verdict.matched_tier} (Heuristic/Radix)
              </span>
            </div>
          </div>

          <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-500 block mb-1">Detailed Threat Reason</span>
            <p className="text-slate-300">{lastResult.verdict.reason}</p>
          </div>
        </div>
      )}
    </div>
  );
};
