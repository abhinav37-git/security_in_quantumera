import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Search, Filter, Terminal, ExternalLink } from 'lucide-react';
import { ThreatEvent } from '../types';

interface LiveThreatFeedProps {
  events: ThreatEvent[];
  onSelectEvent: (event: ThreatEvent) => void;
}

export const LiveThreatFeed: React.FC<LiveThreatFeedProps> = ({ events, onSelectEvent }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const filteredEvents = events.filter((e) => {
    // Search match
    const targetMatch = e.verdict.target.toLowerCase().includes(searchTerm.toLowerCase());
    const nameMatch = e.verdict.threat_name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!targetMatch && !nameMatch) return false;

    // Severity match
    if (severityFilter === 'HIGH' && e.verdict.severity < 8) return false;
    if (severityFilter === 'MEDIUM' && (e.verdict.severity < 4 || e.verdict.severity >= 8)) return false;
    if (severityFilter === 'LOW' && e.verdict.severity >= 4) return false;

    // Category match
    if (categoryFilter !== 'ALL' && e.verdict.category !== categoryFilter) return false;

    return true;
  });

  return (
    <div className="glass-panel rounded-2xl p-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-100 font-['Outfit']">
              Live Threat Interception Feed
            </h2>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time audit log streaming from OS kernel hooks & background monitors
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search domain, IP, process..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Severity Tabs */}
          <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800 text-xs">
            {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  severityFilter === sev
                    ? 'bg-slate-800 text-cyan-400 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events Table / List */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
              <th className="pb-3 px-3">Verdict / Action</th>
              <th className="pb-3 px-3">Severity</th>
              <th className="pb-3 px-3">Target Domain / Entity</th>
              <th className="pb-3 px-3">Threat Name</th>
              <th className="pb-3 px-3">Tier</th>
              <th className="pb-3 px-3">Latency</th>
              <th className="pb-3 px-3">Timestamp</th>
              <th className="pb-3 px-3 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  No threat events matching current search filters.
                </td>
              </tr>
            ) : (
              filteredEvents.map((evt) => {
                const isHigh = evt.verdict.severity >= 8;
                const isMedium = evt.verdict.severity >= 4 && evt.verdict.severity < 8;

                const badgeBg = isHigh
                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                  : isMedium
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';

                return (
                  <tr
                    key={evt.id}
                    className="hover:bg-slate-800/40 transition cursor-pointer group"
                    onClick={() => onSelectEvent(evt)}
                  >
                    {/* Action */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        {isHigh ? (
                          <ShieldAlert className="w-4 h-4 text-red-400" />
                        ) : isMedium ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                        ) : (
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        )}
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] border ${badgeBg}`}>
                          {evt.verdict.action}
                        </span>
                      </div>
                    </td>

                    {/* Severity */}
                    <td className="py-3 px-3">
                      <span className="font-extrabold mono-font">
                        {evt.verdict.severity} / 10
                      </span>
                    </td>

                    {/* Target */}
                    <td className="py-3 px-3 font-semibold text-slate-100 mono-font">
                      {evt.verdict.target}
                    </td>

                    {/* Threat Name */}
                    <td className="py-3 px-3 text-slate-300">
                      <span className="truncate max-w-xs block">
                        {evt.verdict.threat_name}
                      </span>
                    </td>

                    {/* Tier */}
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 font-mono text-[10px]">
                        Tier {evt.verdict.matched_tier}
                      </span>
                    </td>

                    {/* Latency */}
                    <td className="py-3 px-3 mono-font text-emerald-400 font-medium">
                      {evt.latency_ms.toFixed(2)}ms
                    </td>

                    {/* Time */}
                    <td className="py-3 px-3 text-slate-400 mono-font">
                      {new Date(evt.resolved_at).toLocaleTimeString()}
                    </td>

                    {/* Action button */}
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent(evt);
                        }}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
