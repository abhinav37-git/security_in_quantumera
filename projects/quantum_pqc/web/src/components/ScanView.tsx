'use client';

import React, { useState } from 'react';
import { ScanJob, Finding, CBOMComponent, TabType, ThemeMode } from '../types';

interface ScanViewProps {
  scans: ScanJob[];
  selectedScan: ScanJob | null;
  findings: Finding[];
  components: CBOMComponent[];
  loadingDetails: boolean;
  onStartScan: (path: string) => Promise<void>;
  onStartCertScan: (host: string, port: string) => Promise<void>;
  onViewDetails: (scanId: string) => void;
  setActiveTab: (tab: TabType) => void;
  theme?: ThemeMode;
}

export const ScanView: React.FC<ScanViewProps> = ({
  scans,
  selectedScan,
  findings,
  components,
  loadingDetails,
  onStartScan,
  onStartCertScan,
  onViewDetails,
  setActiveTab,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [scanPath, setScanPath] = useState('');
  const [scanHost, setScanHost] = useState('');
  const [scanPort, setScanPort] = useState('443');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [activeSeverityFilter, setActiveSeverityFilter] = useState<string>('ALL');

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onStartScan(scanPath);
      setScanPath('');
    } catch (err: any) {
      setSubmitError(err.message || 'Scan failed to initialize');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndpointScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onStartCertScan(scanHost, scanPort);
      setScanHost('');
    } catch (err: any) {
      setSubmitError(err.message || 'Endpoint scan failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCBOM = () => {
    const cbomExport = {
      bomFormat: 'CycloneDX',
      specVersion: '1.5',
      serialNumber: `urn:uuid:${selectedScan?.id || 'cbom-export'}`,
      version: 1,
      metadata: {
        timestamp: new Date().toISOString(),
        tools: [{ vendor: 'QuantumShield', name: 'CBOM Scanner', version: '2.0' }],
      },
      components: components.map((c) => ({
        name: c.name,
        version: c.version,
        type: 'cryptographic-asset',
        properties: [
          { name: 'crypto:asset-type', value: c.crypto_asset_type },
          { name: 'crypto:algorithm', value: c.algorithm },
          { name: 'crypto:key-length', value: c.key_length },
          { name: 'crypto:quantum-safe', value: String(c.quantum_safe) },
        ],
      })),
      vulnerabilities: findings.map((f) => ({
        id: f.rule_id,
        ratings: [{ severity: f.severity.toLowerCase() }],
        description: f.description,
        recommendation: f.remediation,
      })),
    };

    const blob = new Blob([JSON.stringify(cbomExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cbom-${selectedScan?.id || 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredFindings =
    activeSeverityFilter === 'ALL'
      ? findings
      : findings.filter((f) => f.severity === activeSeverityFilter);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Title */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border transition-colors ${isDark ? 'bg-gradient-to-r from-[#0b1220] via-[#0f172a] to-[#0b1220] border-cyan-500/20' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-mono text-cyan-600 dark:text-cyan-400 mb-1">
            <span>PILLAR 1: DISCOVER</span>
          </div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Shield Scan & CBOM Discovery</h2>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Extract Cryptography Bill of Materials (CBOM) across software repositories and network endpoints.
          </p>
        </div>

        {selectedScan && (
          <button
            onClick={handleExportCBOM}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition flex items-center space-x-2"
          >
            <span>📥 Export CycloneDX CBOM JSON</span>
          </button>
        )}
      </div>

      {submitError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
          🚨 {submitError}
        </div>
      )}

      {/* Forms Grid: Code Scan & Endpoint Scan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Code Scan Form */}
        <form onSubmit={handleScanSubmit} className={`border p-6 rounded-2xl space-y-4 ${isDark ? 'bg-[#0b1220] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-base font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <span>💻 Codebase & Repository Scanner</span>
            </h3>
            <span className="text-[10px] bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded font-mono">
              Static AST & CBOM
            </span>
          </div>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Specify local directory path or repository path to extract cryptographic primitives.
          </p>

          <div className="space-y-2">
            <label className={`text-xs font-mono block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Directory / Repo Path</label>
            <input
              type="text"
              required
              value={scanPath}
              onChange={(e) => setScanPath(e.target.value)}
              placeholder="/Users/x/Personal/vscode/quantum_pqc"
              className={`w-full border rounded-xl px-4 py-2.5 text-xs font-mono outline-none transition ${isDark ? 'bg-[#070c18] border-slate-700 text-white focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'}`}
            />
          </div>

          {/* Preset Helper */}
          <div className="flex items-center space-x-2 text-[11px]">
            <span className={`font-mono ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Presets:</span>
            <button
              type="button"
              onClick={() => setScanPath('/Users/x/Personal/vscode/quantum_pqc')}
              className={`px-2 py-1 rounded font-mono text-[10px] ${isDark ? 'bg-slate-800 text-cyan-300' : 'bg-slate-100 text-cyan-800'}`}
            >
              Current Repo
            </button>
            <button
              type="button"
              onClick={() => setScanPath('./apps/api')}
              className={`px-2 py-1 rounded font-mono text-[10px] ${isDark ? 'bg-slate-800 text-cyan-300' : 'bg-slate-100 text-cyan-800'}`}
            >
              /apps/api
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-600 dark:text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2"
          >
            {isSubmitting ? 'Auditing Codebase...' : 'Execute CBOM Discovery Scan →'}
          </button>
        </form>

        {/* TLS Endpoint Inspector Form */}
        <form onSubmit={handleEndpointScanSubmit} className={`border p-6 rounded-2xl space-y-4 ${isDark ? 'bg-[#0b1220] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-base font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <span>🌐 Active TLS Endpoint Auditor</span>
            </h3>
            <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded font-mono">
              Live Network Handshake
            </span>
          </div>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Probe active network endpoints to evaluate TLS certificate compliance & key exchanges.
          </p>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <label className={`text-xs font-mono block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Host / Domain</label>
              <input
                type="text"
                required
                value={scanHost}
                onChange={(e) => setScanHost(e.target.value)}
                placeholder="api.quantumshield.internal"
                className={`w-full border rounded-xl px-4 py-2.5 text-xs font-mono outline-none transition ${isDark ? 'bg-[#070c18] border-slate-700 text-white focus:border-indigo-400' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'}`}
              />
            </div>
            <div className="space-y-2">
              <label className={`text-xs font-mono block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Port</label>
              <input
                type="text"
                required
                value={scanPort}
                onChange={(e) => setScanPort(e.target.value)}
                placeholder="443"
                className={`w-full border rounded-xl px-4 py-2.5 text-xs font-mono outline-none transition ${isDark ? 'bg-[#070c18] border-slate-700 text-white focus:border-indigo-400' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'}`}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 text-[11px]">
            <span className={`font-mono ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Presets:</span>
            <button
              type="button"
              onClick={() => {
                setScanHost('api.quantumshield.internal');
                setScanPort('8080');
              }}
              className={`px-2 py-1 rounded font-mono text-[10px] ${isDark ? 'bg-slate-800 text-indigo-300' : 'bg-slate-100 text-indigo-800'}`}
            >
              api:8080
            </button>
            <button
              type="button"
              onClick={() => {
                setScanHost('proxy.quantumshield.internal');
                setScanPort('8443');
              }}
              className={`px-2 py-1 rounded font-mono text-[10px] ${isDark ? 'bg-slate-800 text-indigo-300' : 'bg-slate-100 text-indigo-800'}`}
            >
              proxy:8443
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-600 dark:text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2"
          >
            {isSubmitting ? 'Auditing TLS Certificate...' : 'Inspect TLS Endpoint →'}
          </button>
        </form>
      </div>

      {/* Selected Scan Findings & CBOM Details Section */}
      <div className={`border rounded-2xl p-6 space-y-6 ${isDark ? 'bg-[#0b1220] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div>
            <h3 className={`text-lg font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <span>CBOM Audit Results & Findings</span>
              {selectedScan && (
                <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30">
                  ID: {selectedScan.id}
                </span>
              )}
            </h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Select any past scan job or run a new scan to view line-by-line vulnerabilities.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Select Scan:</span>
            <select
              value={selectedScan?.id || ''}
              onChange={(e) => onViewDetails(e.target.value)}
              className={`border text-xs rounded-xl px-3 py-1.5 font-mono outline-none ${isDark ? 'bg-[#070c18] border-slate-700 text-cyan-300' : 'bg-slate-50 border-slate-300 text-slate-800'}`}
            >
              {scans.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} ({s.target_type}) - {new Date(s.created_at).toLocaleTimeString()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loadingDetails ? (
          <div className="py-12 text-center text-slate-400 text-xs font-mono animate-pulse">
            Loading Cryptography Bill of Materials data...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Severity Filter Tabs */}
            <div className="flex items-center justify-between">
              <div className={`flex items-center space-x-1.5 p-1 rounded-xl border text-xs font-mono ${isDark ? 'bg-[#070c18] border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setActiveSeverityFilter(sev)}
                    className={`px-3 py-1 rounded-lg transition ${
                      activeSeverityFilter === sev
                        ? isDark ? 'bg-slate-800 text-cyan-300 font-bold' : 'bg-white text-cyan-900 font-bold shadow-sm'
                        : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>

              <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Showing {filteredFindings.length} findings
              </span>
            </div>

            {/* Findings List */}
            <div className="space-y-3">
              {filteredFindings.map((finding) => (
                <div
                  key={finding.id}
                  className={`border rounded-xl p-4 space-y-2 transition ${isDark ? 'bg-[#070c18] border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <span
                        className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${
                          finding.severity === 'CRITICAL'
                            ? 'bg-red-500/20 text-red-500 border-red-500/40'
                            : finding.severity === 'HIGH'
                            ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/40'
                            : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40'
                        }`}
                      >
                        {finding.severity}
                      </span>
                      <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 font-bold">{finding.rule_id}</span>
                      <span className={`text-xs font-mono font-semibold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{finding.algorithm}</span>
                    </div>

                    <span className={`text-xs font-mono ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                      {finding.file_path}:{finding.line_no}
                    </span>
                  </div>

                  <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{finding.description}</p>

                  <div className={`pt-2 flex items-start space-x-2 text-xs p-3 rounded-lg border ${isDark ? 'bg-[#0b1220] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <span className="text-cyan-600 dark:text-cyan-400 font-bold shrink-0 font-mono">Remediation:</span>
                    <span className={`font-mono text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{finding.remediation}</span>
                  </div>
                </div>
              ))}

              {filteredFindings.length === 0 && (
                <div className="py-8 text-center text-slate-500 text-xs font-mono">
                  No findings matching filter criteria.
                </div>
              )}
            </div>

            {/* CBOM Components Table */}
            <div className={`pt-4 border-t space-y-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <h4 className={`text-sm font-bold flex items-center justify-between ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <span>Extracted CBOM Components Inventory</span>
                <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{components.length} components</span>
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className={`uppercase text-[10px] border-b ${isDark ? 'bg-[#070c18] text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                    <tr>
                      <th className="py-2.5 px-4">Component</th>
                      <th className="py-2.5 px-4">Standard / Version</th>
                      <th className="py-2.5 px-4">Asset Type</th>
                      <th className="py-2.5 px-4">Algorithm</th>
                      <th className="py-2.5 px-4">Quantum Safety</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800 text-slate-300' : 'divide-slate-200 text-slate-700'}`}>
                    {components.map((comp, idx) => (
                      <tr key={idx} className={isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}>
                        <td className={`py-2.5 px-4 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{comp.name}</td>
                        <td className={`py-2.5 px-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{comp.version}</td>
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] border ${isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                            {comp.crypto_asset_type}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-cyan-600 dark:text-cyan-300 font-bold">{comp.algorithm}</td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              comp.quantum_safe
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30'
                            }`}
                          >
                            {comp.quantum_safe ? 'QUANTUM SAFE' : 'VULNERABLE'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
