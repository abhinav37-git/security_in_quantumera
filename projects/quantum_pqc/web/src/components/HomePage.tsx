'use client';

import React, { useState } from 'react';
import { TabType, ServiceHealth, ThemeMode } from '../types';

interface HomePageProps {
  setActiveTab: (tab: TabType) => void;
  servicesHealth: ServiceHealth[];
  theme: ThemeMode;
}

export const HomePage: React.FC<HomePageProps> = ({ setActiveTab, servicesHealth, theme }) => {
  const isDark = theme === 'dark';

  // Risk Calculator State
  const [rsaCount, setRsaCount] = useState<number>(45);
  const [dataRetentionYears, setDataRetentionYears] = useState<number>(10);
  const [dailyRequests, setDailyRequests] = useState<number>(500000);
  const [activeModalPillar, setActiveModalPillar] = useState<number | null>(null);

  // Compute calculated risk score
  const quantumRiskIndex = Math.min(
    100,
    Math.round(
      (rsaCount * 0.8) +
      (dataRetentionYears > 5 ? 35 : dataRetentionYears * 5) +
      (dailyRequests > 100000 ? 25 : 10)
    )
  );

  const pillars = [
    {
      num: 1,
      title: 'Shield Scan',
      tag: 'DISCOVER',
      subtitle: 'CBOM Vulnerability Discovery',
      borderColor: isDark ? 'border-cyan-500/30' : 'border-cyan-200',
      textColor: isDark ? 'text-cyan-400' : 'text-cyan-700',
      bgColor: isDark ? 'bg-cyan-500/10' : 'bg-cyan-50',
      description:
        'Automatically audits codebases, configuration files, and network TLS endpoints to generate a complete Cryptography Bill of Materials (CBOM). Pinpoints vulnerable legacy primitives (RSA, ECDSA, SHA-1).',
      features: [
        'Codebase AST & Regex static analysis',
        'Live TLS cipher suite discovery',
        'CycloneDX CBOM standard export',
        'Line-level remediation guidance',
      ],
      tabTarget: 'scan_new' as TabType,
    },
    {
      num: 2,
      title: 'Shield Proxy',
      tag: 'PROTECT',
      subtitle: 'Crypto-Agile Translation Edge',
      borderColor: isDark ? 'border-indigo-500/30' : 'border-indigo-200',
      textColor: isDark ? 'text-indigo-400' : 'text-indigo-700',
      bgColor: isDark ? 'bg-indigo-500/10' : 'bg-indigo-50',
      description:
        'A high-performance reverse proxy that transparently translates incoming classical TLS handshakes into hybrid post-quantum TLS handshakes (ML-KEM-768/Kyber) to shield legacy backend servers.',
      features: [
        'Transparent zero-code-change drop-in',
        'Hybrid X25519_MLKEM768 key exchange',
        'Sub-2ms translation overhead',
        'Real-time handshake telemetry',
      ],
      tabTarget: 'proxy' as TabType,
    },
    {
      num: 3,
      title: 'Shield CA',
      tag: 'TRUST',
      subtitle: 'Hybrid X.509 PKI Engine',
      borderColor: isDark ? 'border-emerald-500/30' : 'border-emerald-200',
      textColor: isDark ? 'text-emerald-400' : 'text-emerald-700',
      bgColor: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50',
      description:
        'Issues NIST-approved ML-DSA-87 signatures embedded inside custom ASN.1 extensions (OID 1.3.6.1.4.1.58888.1) within standard X.509 certificates for total backwards compatibility.',
      features: [
        'NIST FIPS 204 ML-DSA-87 (Dilithium5)',
        'Backwards compatible classical ECDSA fallback',
        'ASN.1 Extension Inspector',
        'Revocation & trust chain validation',
      ],
      tabTarget: 'ca' as TabType,
    },
    {
      num: 4,
      title: 'Shield Sign',
      tag: 'DEPLOY',
      subtitle: 'Stateful LMS Code Signer',
      borderColor: isDark ? 'border-amber-500/30' : 'border-amber-200',
      textColor: isDark ? 'text-amber-400' : 'text-amber-700',
      bgColor: isDark ? 'bg-amber-500/10' : 'bg-amber-50',
      description:
        'Implements Leighton-Micali Stateful Hash-Based Signatures (RFC 8554). Incorporates database state-locking to track one-time signature counters, securing firmware and software binaries.',
      features: [
        'Stateful LMS key tree (H10, W4)',
        'Thread-safe database index locking',
        'Firmware & OT update protection',
        'Verification sandbox & audit trail',
      ],
      tabTarget: 'sign' as TabType,
    },
  ];

  return (
    <div className="space-y-10 animate-fadeIn pb-12">
      {/* Hero Banner */}
      <section
        className={`relative overflow-hidden rounded-3xl p-8 lg:p-12 shadow-xl border transition-colors duration-300 ${
          isDark
            ? 'bg-gradient-to-br from-[#0c162d] via-[#070c18] to-[#0d101f] border-cyan-500/25 shadow-cyan-950/40'
            : 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-slate-700 text-white shadow-slate-300/40'
        }`}
      >
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>NIST PQC Standards FIPS 203, 204 & CNSA 2.0 Ready</span>
          </div>

          <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Post-Quantum Trust Architecture for{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-indigo-300 to-blue-400">
              Enterprise & Federal Compliance
            </span>
          </h1>

          <p className="text-slate-300 text-base lg:text-lg leading-relaxed font-normal max-w-3xl">
            QuantumShield automates the post-quantum cryptographic migration lifecycle. Shield your data against the impending quantum decryption threat (<span className="text-cyan-300 font-semibold italic">"Harvest Now, Decrypt Later"</span>) with zero-downtime discovery, crypto-agile translation proxies, hybrid PKI, and stateful code signing.
          </p>

          {/* Call to Action Buttons */}
          <div className="flex flex-wrap gap-3.5 pt-2">
            <button
              onClick={() => setActiveTab('scan_new')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-cyan-500/25 transition duration-200 flex items-center space-x-2"
            >
              <svg className="w-5 h-5 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Run CBOM Audit</span>
            </button>

            <button
              onClick={() => setActiveTab('proxy')}
              className="px-6 py-3 rounded-xl bg-[#0d162a] hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 font-bold text-sm transition duration-200 flex items-center space-x-2"
            >
              <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Explore Shield Proxy</span>
            </button>

            <button
              onClick={() => setActiveTab('ca')}
              className="px-6 py-3 rounded-xl bg-[#0d162a] hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm transition duration-200 flex items-center space-x-2"
            >
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 0121 9z" />
              </svg>
              <span>Issue Hybrid ML-DSA Cert</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4-Pillar Pipeline Showcase */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              The 4-Pillar Post-Quantum Migration Pipeline
            </h2>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Click any pillar to view detailed implementation specs and open its management module.
            </p>
          </div>
          <span
            className={`text-xs font-mono px-3 py-1 rounded-lg self-start ${
              isDark ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20' : 'text-cyan-800 bg-cyan-100 border border-cyan-300'
            }`}
          >
            End-to-End Migration Suite
          </span>
        </div>

        {/* Pipeline Diagram Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {pillars.map((pillar) => (
            <div
              key={pillar.num}
              onClick={() => setActiveModalPillar(pillar.num)}
              className={`group relative rounded-2xl p-5 border transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between ${
                isDark
                  ? `bg-[#0b1220] ${pillar.borderColor} hover:border-cyan-400/60 shadow-cyan-950/30`
                  : `bg-white ${pillar.borderColor} hover:border-cyan-500 shadow-slate-200/80`
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md ${pillar.bgColor} ${pillar.textColor} border ${pillar.borderColor} font-mono tracking-widest`}>
                    PILLAR {pillar.num}: {pillar.tag}
                  </span>
                  <span className={`text-xs font-mono transition ${isDark ? 'text-slate-500 group-hover:text-cyan-400' : 'text-slate-400 group-hover:text-cyan-600'}`}>
                    Details →
                  </span>
                </div>

                <div>
                  <h3 className={`text-lg font-extrabold transition ${isDark ? 'text-white group-hover:text-cyan-300' : 'text-slate-900 group-hover:text-cyan-700'}`}>
                    {pillar.title}
                  </h3>
                  <p className={`text-xs font-mono mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {pillar.subtitle}
                  </p>
                </div>

                <p className={`text-xs leading-relaxed line-clamp-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {pillar.description}
                </p>
              </div>

              <div className={`pt-4 border-t mt-4 flex items-center justify-between ${isDark ? 'border-slate-800/80' : 'border-slate-100'}`}>
                <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {pillar.features.length} Core Specifications
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab(pillar.tabTarget);
                  }}
                  className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center space-x-1"
                >
                  <span>Open Tool</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pillar Detail Modal Flyout */}
      {activeModalPillar !== null && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`rounded-2xl max-w-2xl w-full p-6 lg:p-8 space-y-6 shadow-2xl animate-scaleUp border ${isDark ? 'bg-[#0b1220] border-cyan-500/40' : 'bg-white border-slate-300'}`}>
            {(() => {
              const p = pillars.find(item => item.num === activeModalPillar)!;
              return (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md ${p.bgColor} ${p.textColor} border ${p.borderColor} font-mono tracking-widest`}>
                        PILLAR {p.num}: {p.tag}
                      </span>
                      <h3 className={`text-2xl font-bold mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{p.title}</h3>
                      <p className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{p.subtitle}</p>
                    </div>
                    <button
                      onClick={() => setActiveModalPillar(null)}
                      className={`p-2 rounded-lg ${isDark ? 'text-slate-400 hover:text-white bg-slate-800/50' : 'text-slate-500 hover:text-slate-900 bg-slate-100'}`}
                    >
                      ✕
                    </button>
                  </div>

                  <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {p.description}
                  </p>

                  <div className={`space-y-2.5 p-4 rounded-xl border ${isDark ? 'bg-[#070c18] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <h4 className={`text-xs font-bold uppercase tracking-wider font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      Technical Capabilities & Algorithms
                    </h4>
                    <ul className={`space-y-2 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {p.features.map((feat, idx) => (
                        <li key={idx} className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      onClick={() => setActiveModalPillar(null)}
                      className={`px-4 py-2 text-xs font-semibold ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        const target = p.tabTarget;
                        setActiveModalPillar(null);
                        setActiveTab(target);
                      }}
                      className="px-5 py-2.5 text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl shadow-md"
                    >
                      Launch {p.title} Dashboard →
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Interactive Quantum Risk & Compliance Calculator */}
      <section
        className={`rounded-2xl border p-6 lg:p-8 space-y-6 transition-colors ${
          isDark
            ? 'bg-gradient-to-r from-[#0b1220] via-[#0f172a] to-[#0b1220] border-indigo-500/25'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-mono text-indigo-500 dark:text-indigo-400 mb-1">
              <span>⚡ COMPLIANCE & RISK AUDITOR</span>
            </div>
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Interactive Quantum Vulnerability & Compliance Calculator
            </h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Estimate your organisation's exposure under Shor's Algorithm and check your CNSA 2.0 timeline readiness.
            </p>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {quantumRiskIndex}<span className="text-sm font-normal text-slate-500">/100</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${quantumRiskIndex > 65 ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30'}`}>
              {quantumRiskIndex > 65 ? 'CRITICAL RISK EXPOSURE' : 'MODERATE TRANSITION RISK'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Slider 1: RSA Keys */}
          <div className={`p-4 rounded-xl border space-y-3 ${isDark ? 'bg-[#070c18] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex justify-between items-center text-xs">
              <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Legacy RSA/ECC Keys</span>
              <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">{rsaCount} active</span>
            </div>
            <input
              type="range"
              min="5"
              max="200"
              value={rsaCount}
              onChange={(e) => setRsaCount(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              Vulnerable to quantum prime factorization and discrete log solving.
            </p>
          </div>

          {/* Slider 2: Data Retention */}
          <div className={`p-4 rounded-xl border space-y-3 ${isDark ? 'bg-[#070c18] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex justify-between items-center text-xs">
              <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Sensitive Data Retention</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{dataRetentionYears} years</span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              value={dataRetentionYears}
              onChange={(e) => setDataRetentionYears(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              High retention datasets are prime targets for "Harvest Now, Decrypt Later".
            </p>
          </div>

          {/* Slider 3: Daily Handshakes */}
          <div className={`p-4 rounded-xl border space-y-3 ${isDark ? 'bg-[#070c18] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex justify-between items-center text-xs">
              <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Daily TLS Handshakes</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{(dailyRequests / 1000).toFixed(0)}k req/day</span>
            </div>
            <input
              type="range"
              min="50000"
              max="2000000"
              step="50000"
              value={dailyRequests}
              onChange={(e) => setDailyRequests(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              Volume of edge traffic requiring hybrid ML-KEM reverse proxy translation.
            </p>
          </div>
        </div>

        {/* Regulatory Timeline Info */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border text-xs ${isDark ? 'bg-[#070c18] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
              🏛️
            </div>
            <div>
              <span className={`font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>CNSA 2.0 Timeline Mandate (NSM-10)</span>
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Web browsers, software/firmware updates, and network devices must begin PQC transition by <span className="font-semibold text-amber-600 dark:text-amber-300">2025</span> and achieve 100% PQC adoption by <span className="font-semibold text-amber-600 dark:text-amber-300">2030</span>.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 shrink-0">
              🛡️
            </div>
            <div>
              <span className={`font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>QuantumShield Recommended Action</span>
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Deploy <span className="font-semibold text-cyan-600 dark:text-cyan-300">Shield Proxy</span> to translate TLS traffic to ML-KEM today, and sign software updates with stateful <span className="font-semibold text-cyan-600 dark:text-cyan-300">LMS</span> immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live System Services Status */}
      <section className="space-y-4">
        <h3 className={`text-lg font-bold flex items-center justify-between ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <span>Live Microservices Platform Health</span>
          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>All Engines Operational</span>
          </span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {servicesHealth.map((service, i) => (
            <div
              key={i}
              className={`border p-4 rounded-xl space-y-2 transition ${
                isDark
                  ? 'bg-[#0b1220] border-slate-800 hover:border-slate-700'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{service.name}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <p className={`text-[11px] line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{service.description}</p>
              <div className={`pt-2 flex justify-between items-center text-[10px] font-mono border-t ${isDark ? 'border-slate-800/80 text-slate-500' : 'border-slate-100 text-slate-500'}`}>
                <span>Latency: {service.latency}</span>
                <span className="text-cyan-600 dark:text-cyan-400">{service.port}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
