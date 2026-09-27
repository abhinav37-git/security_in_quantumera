import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, Ban, ShieldCheck, X } from 'lucide-react';
import { ThreatEvent, UserChoice } from '../types';

interface ThreatModalProps {
  event: ThreatEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onDecision: (eventId: string, choice: UserChoice, target: string) => void;
}

export const ThreatModal: React.FC<ThreatModalProps> = ({
  event,
  isOpen,
  onClose,
  onDecision,
}) => {
  if (!isOpen || !event) return null;

  const { verdict } = event;
  const isHigh = verdict.severity >= 8;
  const isMedium = verdict.severity >= 4 && verdict.severity < 8;

  const severityColor = isHigh
    ? 'text-red-400 border-red-500/50 bg-red-950/40'
    : isMedium
    ? 'text-amber-400 border-amber-500/50 bg-amber-950/40'
    : 'text-emerald-400 border-emerald-500/50 bg-emerald-950/40';

  const severityGlow = isHigh
    ? 'shadow-[0_0_30px_rgba(239,68,68,0.3)]'
    : 'shadow-[0_0_30px_rgba(245,158,11,0.3)]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-lg bg-[#0e1422] border rounded-2xl p-6 shadow-2xl ${severityGlow} border-slate-700/80`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Severity Badge */}
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-xl border ${
              isHigh
                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}
          >
            {isHigh ? (
              <ShieldAlert className="w-8 h-8 animate-bounce" />
            ) : (
              <AlertTriangle className="w-8 h-8 animate-pulse" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${severityColor} mono-font`}
              >
                SEVERITY {verdict.severity} / 10
              </span>
              <span className="px-2 py-0.5 text-[11px] font-semibold text-slate-400 bg-slate-800/90 rounded-md uppercase tracking-wider">
                {verdict.category}
              </span>
            </div>
            <h2 className="mt-1 text-lg font-bold text-slate-100">
              {verdict.threat_name || 'Threat Intercepted'}
            </h2>
          </div>
        </div>

        {/* Threat Details Card */}
        <div className="mt-5 space-y-3 p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
            <span className="text-slate-400 font-medium">Source / Target:</span>
            <span className="text-cyan-300 font-bold mono-font break-all text-right max-w-[280px]">
              {verdict.target}
            </span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
            <span className="text-slate-400 font-medium">Interception Layer:</span>
            <span className="text-slate-200 mono-font">
              Tier {verdict.matched_tier} (Heuristic / ML & Signatures)
            </span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
            <span className="text-slate-400 font-medium">Decision Latency:</span>
            <span className="text-emerald-400 mono-font font-semibold">
              {event.latency_ms.toFixed(3)} ms
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-medium block mb-1">Reason:</span>
            <p className="text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60 leading-relaxed">
              {verdict.reason}
            </p>
          </div>
        </div>

        {/* Action Recommendation Banner */}
        <div className="mt-4 p-3 rounded-lg bg-blue-950/30 border border-blue-500/20 text-xs text-blue-300 flex items-center gap-2">
          <span className="font-semibold">Recommended Action:</span>
          <span>
            {isHigh
              ? 'Immediate auto-block & connection termination recommended.'
              : 'Review domain legitimacy before granting access.'}
          </span>
        </div>

        {/* 3 Explicit User Action Buttons (from Image 1, 2, 4) */}
        <div className="mt-6 grid grid-cols-3 gap-2.5">
          <button
            onClick={() => {
              onDecision(event.id, 'ALLOW_ONCE', verdict.target);
              onClose();
            }}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-500 transition group"
          >
            <CheckCircle className="w-4 h-4 mb-1 text-slate-400 group-hover:text-emerald-400" />
            <span className="text-xs font-semibold">Allow Once</span>
            <span className="text-[10px] text-slate-400">Temporary pass</span>
          </button>

          <button
            onClick={() => {
              onDecision(event.id, 'ALWAYS_BLOCK', verdict.target);
              onClose();
            }}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-red-600 hover:bg-red-500 text-white border border-red-500 shadow-lg shadow-red-600/30 transition group font-semibold"
          >
            <Ban className="w-4 h-4 mb-1 text-red-200 group-hover:scale-110 transition" />
            <span className="text-xs font-bold">Always Block</span>
            <span className="text-[10px] text-red-200">Add to blacklist</span>
          </button>

          <button
            onClick={() => {
              onDecision(event.id, 'TRUST_SOURCE', verdict.target);
              onClose();
            }}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-200 border border-cyan-500/40 hover:border-cyan-400 transition group"
          >
            <ShieldCheck className="w-4 h-4 mb-1 text-cyan-400 group-hover:scale-110 transition" />
            <span className="text-xs font-semibold">Trust Source</span>
            <span className="text-[10px] text-cyan-400">Always whitelist</span>
          </button>
        </div>
      </div>
    </div>
  );
};
