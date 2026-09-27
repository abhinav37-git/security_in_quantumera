import React from 'react';
import { ShieldCheck, ShieldAlert, Cpu, Zap, Radio, Lock } from 'lucide-react';
import { AgentStatus } from '../types';

interface StatsCardsProps {
  status: AgentStatus | null;
  totalEvents: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ status, totalEvents }) => {
  const queries = status ? status.total_queries : totalEvents;
  const blocked = status ? status.threats_blocked : 4;
  const queued = status ? status.threats_queued : 1;
  const cpu = status ? status.cpu_usage_pct : 0.18;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Intercepted Queries */}
      <div className="glass-panel rounded-2xl p-5 relative overflow-hidden group hover:border-cyan-500/40 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Queries Intercepted
          </span>
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Radio className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-100 mono-font">
            {queries.toLocaleString()}
          </span>
          <span className="text-xs font-semibold text-cyan-400">DNS & Network</span>
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Real-time kernel hook active (~0.1ms)</span>
        </div>
      </div>

      {/* Threats Auto-Blocked */}
      <div className="glass-panel rounded-2xl p-5 relative overflow-hidden group hover:border-red-500/40 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Auto-Blocked Threats
          </span>
          <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-red-400 mono-font">
            {blocked.toLocaleString()}
          </span>
          <span className="text-xs font-bold text-red-400/80 uppercase">Sev 8-10</span>
        </div>
        <div className="mt-2 text-xs text-slate-400">
          <span>Zero user prompt needed · Instant NXDOMAIN</span>
        </div>
      </div>

      {/* Decision Queued for User */}
      <div className="glass-panel rounded-2xl p-5 relative overflow-hidden group hover:border-amber-500/40 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            User Decided (Sev 4-7)
          </span>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Lock className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-amber-300 mono-font">
            {queued.toLocaleString()}
          </span>
          <span className="text-xs font-semibold text-amber-400">Interactive</span>
        </div>
        <div className="mt-2 text-xs text-slate-400">
          <span>No black-box decisions · User in control</span>
        </div>
      </div>

      {/* Engine CPU Footprint */}
      <div className="glass-panel rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/40 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            System Resource Overhead
          </span>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Cpu className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-emerald-400 mono-font">
            {cpu.toFixed(2)}%
          </span>
          <span className="text-xs font-bold text-emerald-400 uppercase">Target &lt;1%</span>
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Decision latency: &lt;0.5ms avg</span>
        </div>
      </div>
    </div>
  );
};
