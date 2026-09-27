import React from 'react';
import { Layers, Network, Eye, ShieldAlert, Sliders, Bell, LayoutDashboard, ArrowRight, Zap, Check } from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  const stages = [
    {
      num: '1',
      title: 'OS Kernel Hook Layer',
      tech: 'WFP (Windows) · eBPF (Linux) · NetworkExtension (macOS)',
      desc: 'Intercepts before OS delivers to app · sub-0.1ms dispatch time.',
      icon: Network,
      color: 'from-blue-500/20 to-cyan-500/30 text-cyan-400 border-cyan-500/40',
    },
    {
      num: '2',
      title: 'Background Monitoring Agent (Daemon)',
      tech: 'Network Monitor · Process Watcher · File System Guard',
      desc: 'Always running service tracking DNS, HTTP/S, new process spawns, and ransomware entropy.',
      icon: Eye,
      color: 'from-purple-500/20 to-indigo-500/30 text-purple-400 border-purple-500/40',
    },
    {
      num: '3',
      title: 'Threat Analysis Engine',
      tech: 'Rule Filter · Heuristic + ML Scanner · Signature DB',
      desc: 'Domain blocklist, DGA detection, lexical entropy scoring, and SHA-256 hash lookup in 2-10ms.',
      icon: ShieldAlert,
      color: 'from-amber-500/20 to-orange-500/30 text-amber-400 border-amber-500/40',
    },
    {
      num: '4',
      title: 'Decision + Block Engine',
      tech: 'Severity Scoring (1–10) · Auto-Block & Queue',
      desc: 'High severity (8-10) auto-blocked instantly; Medium (4-7) queued for user confirmation; Low (1-3) allowed.',
      icon: Sliders,
      color: 'from-red-500/20 to-pink-500/30 text-red-400 border-red-500/40',
    },
    {
      num: '5',
      title: 'User Notification System (Tray / Popup)',
      tech: 'Desktop Modal · 3 Explicit Decisions',
      desc: 'Popup with threat name, severity, source URL/file. 3 actions: Allow once, Always block, Trust source.',
      icon: Bell,
      color: 'from-orange-500/20 to-amber-500/30 text-orange-400 border-orange-500/40',
    },
    {
      num: '6',
      title: 'Admin Dashboard + Audit Log',
      tech: 'Real-time Threat Feed · Central Fleet Sync',
      desc: 'Per-app/domain telemetry, SOC2 compliance logs, dynamic policy push across organizational devices.',
      icon: LayoutDashboard,
      color: 'from-emerald-500/20 to-teal-500/30 text-emerald-400 border-emerald-500/40',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="glass-panel rounded-2xl p-6">
        <h2 className="text-lg font-bold text-slate-100 font-['Outfit']">
          Terminator Sec 6-Stage Technical Architecture
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          End-to-end layered pipeline from low-level OS interception to user-level decision enforcement
        </p>
      </div>

      {/* 6 Stage Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {stages.map((stage) => {
          const Icon = stage.icon;
          return (
            <div
              key={stage.num}
              className="glass-panel rounded-2xl p-6 hover:border-cyan-500/40 transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-xs font-extrabold text-cyan-400 mono-font">
                    {stage.num}
                  </span>
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br border ${stage.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-100">{stage.title}</h3>
                <p className="mt-1 text-xs text-cyan-400 font-medium mono-font">{stage.tech}</p>
                <p className="mt-3 text-xs text-slate-300 leading-relaxed">{stage.desc}</p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center text-[11px] text-emerald-400 gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>Implemented & Verified in Codebase</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
