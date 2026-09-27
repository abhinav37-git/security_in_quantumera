'use client';

import React, { useState } from 'react';
import { Certificate, IssuedCertificate, TabType, ThemeMode } from '../types';

interface CAViewProps {
  certs: Certificate[];
  issuedCerts: IssuedCertificate[];
  onIssueCert: (commonName: string, signatureAlg: string) => Promise<void>;
  setActiveTab: (tab: TabType) => void;
  theme?: ThemeMode;
}

export const CAView: React.FC<CAViewProps> = ({
  certs,
  issuedCerts,
  onIssueCert,
  setActiveTab,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [commonName, setCommonName] = useState('');
  const [signatureAlg, setSignatureAlg] = useState('ML-DSA-87');
  const [isIssuing, setIsIssuing] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);

  const [selectedPem, setSelectedPem] = useState<IssuedCertificate | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsIssuing(true);
    setIssueError(null);
    try {
      await onIssueCert(commonName, signatureAlg);
      setCommonName('');
    } catch (err: any) {
      setIssueError(err.message || 'Failed to issue certificate');
    } finally {
      setIsIssuing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Certificate PEM block copied to clipboard!');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border transition-colors ${isDark ? 'bg-gradient-to-r from-[#0b1220] via-[#0f172a] to-[#0b1220] border-emerald-500/20' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 mb-1">
            <span>PILLAR 3: TRUST</span>
          </div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Shield CA (Hybrid Certificate Authority)</h2>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Issues standard X.509 certificates containing embedded post-quantum NIST ML-DSA-87 signatures inside ASN.1 extension <code className="text-emerald-600 dark:text-emerald-300 font-mono">1.3.6.1.4.1.58888.1</code>.
          </p>
        </div>

        <div className={`flex items-center space-x-2 text-xs font-mono px-3.5 py-2 rounded-xl border ${isDark ? 'bg-[#070c18] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Root CA Standard:</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">NIST FIPS 204 (ML-DSA-87)</span>
        </div>
      </div>

      {issueError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
          🚨 {issueError}
        </div>
      )}

      {/* Form: Issue PQC Certificate */}
      <form onSubmit={handleSubmit} className={`border p-6 rounded-2xl space-y-4 ${isDark ? 'bg-[#0b1220] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <h3 className={`text-base font-bold flex items-center justify-between ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <span>🔑 Issue Post-Quantum Certificate</span>
          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">NIST ML-DSA-87</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-2">
            <label className={`text-xs font-mono block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Common Name (CN)</label>
            <input
              type="text"
              required
              value={commonName}
              onChange={(e) => setCommonName(e.target.value)}
              placeholder="e.g. gateway.internal or auth.enterprise.com"
              className={`w-full border rounded-xl px-4 py-2.5 text-xs font-mono outline-none transition ${isDark ? 'bg-[#070c18] border-slate-700 text-white focus:border-emerald-400' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'}`}
            />
          </div>

          <div className="space-y-2">
            <label className={`text-xs font-mono block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Signature Primitive</label>
            <select
              value={signatureAlg}
              onChange={(e) => setSignatureAlg(e.target.value)}
              className={`w-full border rounded-xl px-3 py-2.5 text-xs font-mono outline-none transition ${isDark ? 'bg-[#070c18] border-slate-700 text-emerald-300 focus:border-emerald-400' : 'bg-slate-50 border-slate-300 text-emerald-800 focus:border-emerald-500'}`}
            >
              <option value="ML-DSA-87">ML-DSA-87 (Dilithium5)</option>
              <option value="ML-DSA-87+ECDSA-P384">Hybrid ML-DSA-87 + ECDSA P-384</option>
              <option value="LMS-H10">LMS Stateful Signature (H10)</option>
            </select>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isIssuing}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center space-x-2"
          >
            <span>{isIssuing ? 'Generating ML-DSA Keypair...' : 'Issue X.509 PQC Certificate →'}</span>
          </button>
        </div>
      </form>

      {/* ASN.1 Extension Inspector Banner */}
      <div className={`border rounded-2xl p-5 space-y-3 ${isDark ? 'bg-[#070c18] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <h4 className={`text-xs font-bold uppercase tracking-wider font-mono flex items-center justify-between ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
          <span>ASN.1 Dual Signature Extension Structure</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">OID 1.3.6.1.4.1.58888.1</span>
        </h4>
        <pre className={`text-[11px] font-mono p-4 rounded-xl border overflow-x-auto ${isDark ? 'bg-[#0b1220] text-slate-300 border-slate-800' : 'bg-slate-900 text-slate-200 border-slate-800'}`}>
{`SEQUENCE {
  OBJECT IDENTIFIER : 1.3.6.1.4.1.58888.1 (QuantumShield ML-DSA Signature Extension)
  OCTET STRING : 
    SEQUENCE {
      AlgorithmIdentifier : ML-DSA-87 (2.16.840.1.101.3.4.3.19)
      BIT STRING : [2592 bytes ML-DSA-87 Post-Quantum Signature]
    }
}`}
        </pre>
      </div>

      {/* Issued Certificates Registry Table */}
      <div className={`border rounded-2xl p-6 space-y-4 ${isDark ? 'bg-[#0b1220] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Active Issued Certificates Registry</h3>
          <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{issuedCerts.length} certificates</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className={`uppercase text-[10px] border-b ${isDark ? 'bg-[#070c18] text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
              <tr>
                <th className="py-3 px-4">Common Name</th>
                <th className="py-3 px-4">Serial Number</th>
                <th className="py-3 px-4">Signature Alg</th>
                <th className="py-3 px-4">Issuer</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">PEM Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800 text-slate-300' : 'divide-slate-200 text-slate-700'}`}>
              {issuedCerts.map((cert) => (
                <tr key={cert.id} className={isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}>
                  <td className={`py-3 px-4 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{cert.common_name}</td>
                  <td className={`py-3 px-4 font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{cert.serial_number}</td>
                  <td className="py-3 px-4 text-emerald-600 dark:text-emerald-300 font-bold">{cert.signature_algorithm}</td>
                  <td className={`py-3 px-4 max-w-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{cert.issuer}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold">
                      ACTIVE
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => setSelectedPem(cert)}
                      className={`px-2.5 py-1 rounded text-xs transition ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}`}
                    >
                      View PEM
                    </button>
                    <button
                      onClick={() => copyToClipboard(cert.pem_block)}
                      className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 rounded border border-emerald-500/30 text-xs transition"
                    >
                      Copy
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PEM Modal Viewer */}
      {selectedPem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-scaleUp border ${isDark ? 'bg-[#0b1220] border-emerald-500/40' : 'bg-white border-slate-300'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>X.509 Certificate PEM Block</h3>
                <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400">{selectedPem.common_name}</p>
              </div>
              <button
                onClick={() => setSelectedPem(null)}
                className={`p-2 rounded-lg ${isDark ? 'text-slate-400 hover:text-white bg-slate-800/50' : 'text-slate-500 hover:text-slate-900 bg-slate-100'}`}
              >
                ✕
              </button>
            </div>

            <pre className={`text-xs font-mono p-4 rounded-xl border overflow-x-auto whitespace-pre-wrap ${isDark ? 'bg-[#070c18] text-slate-300 border-slate-800' : 'bg-slate-900 text-slate-200 border-slate-800'}`}>
              {selectedPem.pem_block}
            </pre>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => copyToClipboard(selectedPem.pem_block)}
                className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 rounded-xl border border-emerald-500/30 text-xs font-bold"
              >
                Copy PEM Block
              </button>
              <button
                onClick={() => setSelectedPem(null)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
