'use client';

import React from 'react';
import { ScanJob, Finding, Certificate, ProxyHandshake, SignedArtifact, TabType, ThemeMode } from '../types';

interface DashboardViewProps {
  scans: ScanJob[];
  findings: Finding[];
  certs: Certificate[];
  handshakes: ProxyHandshake[];
  signatures: SignedArtifact[];
  setActiveTab: (tab: TabType) => void;
  onViewScanDetails: (scanId: string) => void;
  theme: ThemeMode;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  scans,
  findings,
  certs,
  handshakes,
  signatures,
  setActiveTab,
  onViewScanDetails,
  theme,
}) => {
  const isDark = theme === 'dark';

  const completedScans = scans.filter((s) => s.status === 'completed').length;
  const criticalFindings = findings.filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH').length;
  const hybridCertCount = certs.filter((c) => c.pq_hybrid).length;

  const totalAssets = Math.max(1, certs.length + findings.length);
  const safeAssets = hybridCertCount + Math.max(0, certs.length - findings.length);
  const postureScore = Math.min(100, Math.round((safeAssets / (totalAssets + 2)) * 100));

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner & Header */}
      <div
        className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border transition-colors ${
          isDark
            ? 'bg-gradient-to-r from-[#0b1220] via-[#0f172a] to-[#0b1220] border-cyan-500/20'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-mono text-cyan-600 dark:text-cyan-400 mb-1">
            <span>REAL-TIME POST-QUANTUM CONTROL PLANE</span>
          </div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Executive Posture Dashboard</h2>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Monitoring active cryptosystems, CBOM vulnerabilities, hybrid TLS traffic, and stateful code signing.
          </p>
        </div>

        {/* Posture Score Pill */}
        <div className={`flex items-center space-x-4 p-3.5 rounded-xl border ${isDark ? 'bg-[#070c18] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className="relative flex items-center justify-center w-14 h-14">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className={isDark ? 'text-slate-800' : 'text-slate-200'}
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-cyan-500"
                strokeDasharray={`${postureScore}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className={`absolute text-sm font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{postureScore}%</span>
          </div>
          <div>
            <span className={`text-xs font-mono block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Overall PQC Readiness</span>
            <span className="text-xs font-bold text-cyan-600 dark:text-cyan-300">
              {postureScore >= 75 ? 'Phase 4 Quantum Agile' : 'Migration In Progress'}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Stat Card 1 */}
        <div className={`border p-5 rounded-2xl space-y-3 transition ${isDark ? 'bg-[#0b1220] border-slate-800 hover:border-cyan-500/30' : 'bg-white border-slate-200 hover:border-cyan-300 shadow-sm'}`}>
          <div className="flex items-center justify-between text-xs">
            <span className={`font-mono uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>CBOM Audits</span>
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500">🔍</span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-3xl font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{scans.length}</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">({completedScans} complete)</span>
          </div>
          <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Code repositories & endpoints audited</p>
        </div>

        {/* Stat Card 2 */}
        <div className={`border p-5 rounded-2xl space-y-3 transition ${isDark ? 'bg-[#0b1220] border-slate-800 hover:border-cyan-500/30' : 'bg-white border-slate-200 hover:border-cyan-300 shadow-sm'}`}>
          <div className="flex items-center justify-between text-xs">
            <span className={`font-mono uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Critical Vulnerabilities</span>
            <span className="p-1.5 rounded-lg bg-red-500/10 text-red-500">⚠️</span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-red-500 font-mono">{criticalFindings}</span>
            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>findings</span>
          </div>
          <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Legacy RSA/ECDSA/SHA-1 instances</p>
        </div>

        {/* Stat Card 3 */}
        <div className={`border p-5 rounded-2xl space-y-3 transition ${isDark ? 'bg-[#0b1220] border-slate-800 hover:border-cyan-500/30' : 'bg-white border-slate-200 hover:border-cyan-300 shadow-sm'}`}>
          <div className="flex items-center justify-between text-xs">
            <span className={`font-mono uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Hybrid Certificates</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">🔑</span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{hybridCertCount}</span>
            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>/ {certs.length} total</span>
          </div>
          <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>CNSA 2.0 ML-DSA-87 signed X.509 certs</p>
        </div>

        {/* Stat Card 4 */}
        <div className={`border p-5 rounded-2xl space-y-3 transition ${isDark ? 'bg-[#0b1220] border-slate-800 hover:border-cyan-500/30' : 'bg-white border-slate-200 hover:border-cyan-300 shadow-sm'}`}>
          <div className="flex items-center justify-between text-xs">
            <span className={`font-mono uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>LMS State Guard</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">✍️</span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">{signatures.length}</span>
            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>signed binaries</span>
          </div>
          <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Stateful Leighton-Micali RFC 8554</p>
        </div>
      </div>

      {/* Algorithm Inventory & Live Activity Feed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Algorithm Inventory breakdown */}
        <div className={`lg:col-span-2 border rounded-2xl p-6 space-y-5 ${isDark ? 'bg-[#0b1220] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Cryptographic Algorithm Inventory</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Distribution of legacy vs quantum-safe algorithms in environment</p>
            </div>
            <button
              onClick={() => setActiveTab('scan_new')}
              className={`text-xs font-medium border px-3 py-1.5 rounded-lg transition ${
                isDark ? 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20' : 'text-cyan-800 border-cyan-300 bg-cyan-50 hover:bg-cyan-100'
              }`}
            >
              Audit Inventory →
            </button>
          </div>

          {/* Progress Bars */}
          <div className="space-y-4 pt-2">
            {/* ML-KEM / Kyber */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className={`font-bold flex items-center space-x-1.5 ${isDark ? 'text-cyan-300' : 'text-cyan-800'}`}>
                  <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                  <span>ML-KEM-768 / Kyber768 (NIST FIPS 203)</span>
                </span>
                <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>Quantum Safe • Active Edge</span>
              </div>
              <div className={`w-full h-2.5 rounded-full overflow-hidden border ${isDark ? 'bg-[#070c18] border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full w-[85%]"></div>
              </div>
            </div>

            {/* ML-DSA-87 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className={`font-bold flex items-center space-x-1.5 ${isDark ? 'text-indigo-300' : 'text-indigo-800'}`}>
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  <span>ML-DSA-87 / Dilithium5 (NIST FIPS 204)</span>
                </span>
                <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>Quantum Safe • CA Signature</span>
              </div>
              <div className={`w-full h-2.5 rounded-full overflow-hidden border ${isDark ? 'bg-[#070c18] border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full w-[70%]"></div>
              </div>
            </div>

            {/* LMS Stateful */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className={`font-bold flex items-center space-x-1.5 ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>LMS-H10 Stateful Hash (RFC 8554)</span>
                </span>
                <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>Quantum Safe • Code Signer</span>
              </div>
              <div className={`w-full h-2.5 rounded-full overflow-hidden border ${isDark ? 'bg-[#070c18] border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full w-[90%]"></div>
              </div>
            </div>

            {/* Legacy RSA-2048 */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-red-500 font-bold flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  <span>RSA-2048 / RSA-4096 (Classical PKCS#1)</span>
                </span>
                <span className="text-red-500 font-bold">Vulnerable • Action Required</span>
              </div>
              <div className={`w-full h-2.5 rounded-full overflow-hidden border ${isDark ? 'bg-[#070c18] border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                <div className="h-full bg-gradient-to-r from-red-600 to-amber-600 rounded-full w-[40%]"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Live Telemetry Feed */}
        <div className={`border rounded-2xl p-6 space-y-4 ${isDark ? 'bg-[#0b1220] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-base font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Live Telemetry Stream</span>
            </h3>
            <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Auto-refresh 5s</span>
          </div>

          <div className="space-y-3 font-mono text-xs max-h-80 overflow-y-auto pr-1">
            {handshakes.map((hs, i) => (
              <div key={i} className={`p-2.5 rounded-xl border space-y-1 ${isDark ? 'bg-[#070c18] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-cyan-600 dark:text-cyan-400 font-bold">{hs.tls_version}</span>
                  <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>{new Date(hs.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className={`text-[11px] truncate ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{hs.cipher_suite}</div>
                <div className={`flex items-center justify-between text-[10px] pt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  <span>Client: {hs.client_ip}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{hs.latency_ms}ms</span>
                </div>
              </div>
            ))}

            {signatures.map((sig, i) => (
              <div key={`sig-${i}`} className={`p-2.5 rounded-xl border space-y-1 ${isDark ? 'bg-[#070c18] border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-amber-700 dark:text-amber-400 font-bold">LMS Signed</span>
                  <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>Tree Index #{sig.lms_tree_index}</span>
                </div>
                <div className={`text-[11px] truncate ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{sig.artifact_name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Scans Table */}
      <div className={`border rounded-2xl p-6 space-y-4 ${isDark ? 'bg-[#0b1220] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Recent Cryptographic CBOM Scans</h3>
          <button
            onClick={() => setActiveTab('scan_new')}
            className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-medium"
          >
            Start New Scan →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className={`uppercase text-[10px] tracking-wider border-b ${isDark ? 'bg-[#070c18] text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
              <tr>
                <th className="py-3 px-4">Scan ID</th>
                <th className="py-3 px-4">Target Type</th>
                <th className="py-3 px-4">Target URL / Path</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created At</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-200 text-slate-700'}`}>
              {scans.map((scan) => (
                <tr key={scan.id} className={isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}>
                  <td className="py-3 px-4 text-cyan-600 dark:text-cyan-400 font-bold">{scan.id}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] border ${isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                      {scan.target_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 max-w-xs truncate">{scan.target_url}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold">
                      {scan.status}
                    </span>
                  </td>
                  <td className={`py-3 px-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{new Date(scan.created_at).toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onViewScanDetails(scan.id)}
                      className={`px-3 py-1 rounded border text-xs font-sans transition ${
                        isDark ? 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border-cyan-300'
                      }`}
                    >
                      View CBOM Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
