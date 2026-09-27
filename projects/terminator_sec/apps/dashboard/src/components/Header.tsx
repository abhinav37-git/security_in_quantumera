import React from 'react';
import { Shield, ShieldAlert, Cpu, Activity, RefreshCw, Terminal, Bell } from 'lucide-react';
import { AgentStatus } from '../types';

interface HeaderProps {
  status: AgentStatus | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingCount: number;
  onOpenPending: () => void;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  activeTab,
  setActiveTab,
  pendingCount,
  onOpenPending,
  onRefresh,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#070a0f]/90 backdrop-blur-xl px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <Shield className="w-6 h-6 animate-pulse" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#070a0f]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-indigo-300 font-['Outfit']">
                TERMINATOR <span className="text-cyan-400">SEC</span>
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-widest uppercase rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 mono-font">
                v1.0 GOLD
              </span>
            </div>
            <p className="text-xs text-slate-400">Next-Gen Threat Interception & Endpoint Protection</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center p-1 bg-slate-900/90 rounded-xl border border-slate-800 shadow-inner">
          {[
            { id: 'feed', label: 'Threat Feed' },
            { id: 'simulator', label: 'Interception Playground' },
            { id: 'fleet', label: 'Device Fleet (Mac/Win VM)' },
            { id: 'architecture', label: '6-Stage Architecture' },
            { id: 'business', label: 'Business Strategy' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Live Status Indicators */}
        <div className="flex items-center gap-3">
          {/* Pending Alerts Badge */}
          {pendingCount > 0 && (
            <button
              onClick={onOpenPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold animate-bounce"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{pendingCount} Pending Decision</span>
            </button>
          )}

          {/* Engine Latency / CPU */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">CPU:</span>
            <span className="text-emerald-400 font-semibold mono-font">
              {status ? `${status.cpu_usage_pct.toFixed(2)}%` : '<0.20%'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">DNS Hook:</span>
            <span className="text-cyan-300 font-semibold mono-font">~0.1ms</span>
          </div>

          <button
            onClick={onRefresh}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-400 transition"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
