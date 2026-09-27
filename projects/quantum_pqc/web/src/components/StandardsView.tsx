'use client';

import React from 'react';
import { ThemeMode } from '../types';

interface StandardsViewProps {
  theme?: ThemeMode;
}

export const StandardsView: React.FC<StandardsViewProps> = ({ theme = 'dark' }) => {
  const isDark = theme === 'dark';

  const standards = [
    {
      code: 'FIPS 203',
      name: 'ML-KEM (Module-Lattice-Based KEM)',
      origin: 'Derived from CRYSTALS-Kyber',
      useCase: 'Asymmetric Key Encapsulation & TLS 1.3 Key Exchange',
      securityLevels: 'ML-KEM-512 (L1), ML-KEM-768 (L3), ML-KEM-1024 (L5)',
      status: 'NIST Standardized (Aug 2024)',
      color: isDark ? 'border-cyan-500/40 bg-cyan-500/5' : 'border-cyan-200 bg-cyan-50/60',
      textColor: isDark ? 'text-cyan-400' : 'text-cyan-700',
    },
    {
      code: 'FIPS 204',
      name: 'ML-DSA (Module-Lattice-Based Digital Signature)',
      origin: 'Derived from CRYSTALS-Dilithium',
      useCase: 'General Digital Signatures, X.509 Certificates, PKI',
      securityLevels: 'ML-DSA-44 (L2), ML-DSA-65 (L3), ML-DSA-87 (L5)',
      status: 'NIST Standardized (Aug 2024)',
      color: isDark ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-indigo-200 bg-indigo-50/60',
      textColor: isDark ? 'text-indigo-400' : 'text-indigo-700',
    },
    {
      code: 'FIPS 205',
      name: 'SLH-DSA (Stateless Hash-Based Signature)',
      origin: 'Derived from SPHINCS+',
      useCase: 'High-assurance long-term signatures without lattice assumptions',
      securityLevels: 'SLH-DSA-SHA2-128f, SLH-DSA-SHAKE-256s',
      status: 'NIST Standardized (Aug 2024)',
      color: isDark ? 'border-purple-500/40 bg-purple-500/5' : 'border-purple-200 bg-purple-50/60',
      textColor: isDark ? 'text-purple-400' : 'text-purple-700',
    },
    {
      code: 'RFC 8554',
      name: 'LMS / HSS (Leighton-Micali Hash-Based Signatures)',
      origin: 'IETF RFC 8554 & NIST SP 800-208',
      useCase: 'Stateful Code Signing, Firmware Updates, Secure Boot',
      securityLevels: 'LMS_SHA256_M32_H10 (Tree Height 10, Winternitz W4/W8)',
      status: 'NIST SP 800-208 Approved',
      color: isDark ? 'border-amber-500/40 bg-amber-500/5' : 'border-amber-200 bg-amber-50/60',
      textColor: isDark ? 'text-amber-400' : 'text-amber-700',
    },
  ];

  const timeline = [
    {
      year: '2025',
      title: 'Initial Preference Phase',
      details: 'CNSA 2.0 mandates PQC availability in web browsers, operating systems, and network infrastructure.',
    },
    {
      year: '2027',
      title: 'Mandatory Adoption Phase',
      details: 'All new federal acquisitions and enterprise firmware releases must enforce PQC algorithms by default.',
    },
    {
      year: '2030',
      title: 'Classical Deprecation Phase',
      details: 'Complete deprecation of legacy RSA-2048/3048, ECDSA, and Diffie-Hellman across federal systems.',
    },
    {
      year: '2035',
      title: '100% Enforced Compliance',
      details: 'Zero tolerance for classical asymmetric primitives. Full transition to NIST FIPS 203/204/205.',
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div
        className={`p-6 rounded-2xl border transition-colors ${
          isDark
            ? 'bg-gradient-to-r from-[#0b1220] via-[#0f172a] to-[#0b1220] border-cyan-500/20'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="inline-flex items-center space-x-2 text-xs font-mono text-cyan-600 dark:text-cyan-400 mb-1">
          <span>REFERENCE & POLICY MATRIX</span>
        </div>
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          NIST PQC & CNSA 2.0 Standards Reference
        </h2>
        <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Cryptographic specifications and mandatory compliance timelines for post-quantum migration.
        </p>
      </div>

      {/* Standards Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {standards.map((std, i) => (
          <div key={i} className={`border ${std.color} rounded-2xl p-6 space-y-3 transition-colors`}>
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-bold font-mono px-2.5 py-1 rounded border ${
                  isDark ? 'bg-slate-900 text-cyan-400 border-slate-800' : 'bg-white text-cyan-800 border-slate-200'
                }`}
              >
                {std.code}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">{std.status}</span>
            </div>

            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{std.name}</h3>
            <p className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{std.origin}</p>

            <div className="pt-2 space-y-2 text-xs">
              <div className={`p-3 rounded-xl border space-y-1 ${isDark ? 'bg-[#070c18] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <span className="text-slate-500 font-mono block text-[10px]">PRIMARY USE CASE</span>
                <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{std.useCase}</span>
              </div>

              <div className={`p-3 rounded-xl border space-y-1 ${isDark ? 'bg-[#070c18] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <span className="text-slate-500 font-mono block text-[10px]">SECURITY PARAMETERS</span>
                <span className="text-cyan-600 dark:text-cyan-300 font-mono text-[11px]">{std.securityLevels}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Timeline Section */}
      <div className={`border rounded-2xl p-6 space-y-6 transition-colors ${isDark ? 'bg-[#0b1220] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div>
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>CNSA 2.0 Compliance Timeline</h3>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>National Security Agency Commercial National Security Algorithm Suite 2.0</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {timeline.map((item, idx) => (
            <div key={idx} className={`border p-4 rounded-xl space-y-2 relative transition-colors ${isDark ? 'bg-[#070c18] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-2xl font-black font-mono text-cyan-600 dark:text-cyan-400">{item.year}</span>
              <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.title}</h4>
              <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.details}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
