'use client';

import React, { useState } from 'react';
import { ThemeMode } from '../types';

interface LandingPageProps {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ theme, setTheme }) => {
  const isDark = theme === 'dark';
  const [activeStep, setActiveStep] = useState<number>(1);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [licenseKey, setLicenseKey] = useState<string>('');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);

  const migrationSteps = [
    {
      step: 1,
      tag: 'DISCOVER',
      title: 'Automated CBOM Discovery Audit',
      subtitle: 'Identify Cryptographic Vulnerabilities',
      color: 'from-cyan-500 to-blue-600',
      icon: '🔍',
      description:
        'Run non-intrusive static code audits and active TLS network probes to build a complete Cryptography Bill of Materials (CBOM). Pinpoint vulnerable RSA-2048, ECDSA, and SHA-1 instances line by line.',
      benefit: 'Complete visibility into all legacy cryptography across repositories and endpoints.',
    },
    {
      step: 2,
      tag: 'PROTECT',
      title: 'Deploy Crypto-Agile Shield Proxy',
      subtitle: 'Zero-Code-Change TLS Edge Gateway',
      color: 'from-indigo-500 to-purple-600',
      icon: '⚡',
      description:
        'Drop in the high-throughput Shield Proxy at your network edge. Incoming classical client requests are transparently translated into hybrid post-quantum TLS handshakes (ML-KEM-768 / Kyber) with sub-2ms overhead.',
      benefit: 'Immediate protection against "Harvest Now, Decrypt Later" without rewriting backend services.',
    },
    {
      step: 3,
      tag: 'TRUST',
      title: 'Issue Hybrid Dual-Signed Certificates',
      subtitle: 'Backwards-Compatible X.509 PKI',
      color: 'from-emerald-500 to-teal-600',
      icon: '🔑',
      description:
        'Issue X.509 certificates containing NIST-approved ML-DSA-87 signatures embedded inside ASN.1 extensions (OID 1.3.6.1.4.1.58888.1). Legacy clients validate classically while PQC clients enforce ML-DSA.',
      benefit: '100% operational uptime during multi-year enterprise transition periods.',
    },
    {
      step: 4,
      tag: 'DEPLOY',
      title: 'Enforce Stateful LMS Code Signing',
      subtitle: 'RFC 8554 Stateful State-Guard',
      color: 'from-amber-500 to-orange-600',
      icon: '✍️',
      description:
        'Secure software releases, firmware binaries, and OT/IoT nodes with Leighton-Micali Hash Signatures (LMS). Database state-locking prevents signature index reuse vulnerabilities.',
      benefit: 'Supply chain integrity compliance under CNSA 2.0 & NIST SP 800-208 mandates.',
    },
  ];

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail && !licenseKey) {
      setAuthError('Please enter a valid work email or license key.');
      return;
    }
    // Grant access and redirect to console app
    window.location.href = '/app';
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDark ? 'bg-[#030712] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Top Marketing Navigation */}
      <header className={`sticky top-0 z-50 border-b px-6 lg:px-12 py-4 flex items-center justify-between backdrop-blur-md transition-colors ${isDark ? 'bg-[#070b14]/90 border-cyan-500/20' : 'bg-white/90 border-slate-200 shadow-sm'}`}>
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            QuantumShield
          </span>
        </div>

        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
          <a href="#products" className={`hover:text-cyan-500 transition ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Products & Gated Access
          </a>
          <a href="#migration" className={`hover:text-cyan-500 transition ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Migration Workflow
          </a>
          <a href="#video" className={`hover:text-cyan-500 transition ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Video Demo
          </a>
          <a href="#pricing" className={`hover:text-cyan-500 transition ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Licensing Tiers
          </a>
        </nav>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition ${isDark ? 'bg-[#0b1220] border-cyan-500/30 text-amber-300' : 'bg-slate-100 border-slate-300 text-amber-700'}`}
          >
            {isDark ? '☀️ Light' : '🌙 Dark'}
          </button>
          <button
            onClick={() => setShowAuthModal(true)}
            className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition ${isDark ? 'bg-[#0b1220] border-slate-700 text-slate-200 hover:bg-slate-800' : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'}`}
          >
            🔑 Sign In / License
          </button>
          <a
            href="/app"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/25 transition flex items-center space-x-2"
          >
            <span>Launch Platform Console</span>
            <span>→</span>
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6 lg:px-12 max-w-7xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold tracking-wide">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>NIST FIPS 203, 204, 205 & CNSA 2.0 Compliant Migration Suite</span>
        </div>

        <h1 className={`text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight max-w-5xl mx-auto leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Post-Quantum Security & Trust Architecture for{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-indigo-400 to-blue-500">
            Enterprise & Defense
          </span>
        </h1>

        <p className={`text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          Nullify <span className="font-semibold text-cyan-500">"Harvest Now, Decrypt Later"</span> threats. QuantumShield delivers automated discovery, zero-downtime crypto-agile reverse proxies, hybrid PKI, and stateful code signing in a single control panel.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm shadow-xl shadow-cyan-500/30 transition flex items-center space-x-2"
          >
            <span>Activate Product / Sign In</span>
            <span className="text-base">🔑</span>
          </button>

          <a
            href="/app"
            className={`px-8 py-4 rounded-2xl border font-bold text-sm transition flex items-center space-x-2 ${
              isDark
                ? 'bg-[#0b1220] border-slate-700 text-slate-200 hover:bg-slate-800'
                : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100 shadow-sm'
            }`}
          >
            <span>Launch Live Console Demo</span>
            <span>→</span>
          </a>
        </div>
      </section>

      {/* PRODUCTS SECTION (Product Catalog & Gated License Access) */}
      <section id="products" className={`py-20 px-6 lg:px-12 border-t transition-colors ${isDark ? 'bg-[#070c18] border-slate-800' : 'bg-slate-100/70 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-mono font-extrabold text-cyan-500 uppercase tracking-widest">
              ENTERPRISE PRODUCT SUITE
            </span>
            <h2 className={`text-3xl lg:text-4xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Featured Platform Products
            </h2>
            <p className={`text-sm max-w-2xl mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Access to our flagship post-quantum suite is secured via Enterprise License Verification or Authenticated Sign-In.
            </p>
          </div>

          {/* Featured Product Card: QuantumShield */}
          <div className={`p-8 lg:p-10 rounded-3xl border transition-all duration-300 ${isDark ? 'bg-[#0b1220] border-cyan-500/40 shadow-xl shadow-cyan-950/30' : 'bg-white border-slate-300 shadow-xl'}`}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    FLAGSHIP PRODUCT SUITE
                  </span>
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center space-x-1">
                    <span>🔒</span>
                    <span>License Key & Sign-In Protected</span>
                  </span>
                </div>

                <h3 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  QuantumShield™ Post-Quantum Migration Platform
                </h3>

                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  An end-to-end, drop-in post-quantum trust engine coordinating CBOM vulnerability audits, high-throughput hybrid TLS reverse proxies (ML-KEM-768), backwards-compatible X.509 certificate authorities (ML-DSA-87), and stateful Leighton-Micali code signers (LMS RFC 8554).
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 font-mono text-xs">
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#070c18] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                    <span className="text-[10px] text-slate-500 block">PILLAR 1</span>
                    <span className="font-bold text-cyan-400">Shield Scan</span>
                  </div>
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#070c18] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                    <span className="text-[10px] text-slate-500 block">PILLAR 2</span>
                    <span className="font-bold text-indigo-400">Shield Proxy</span>
                  </div>
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#070c18] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                    <span className="text-[10px] text-slate-500 block">PILLAR 3</span>
                    <span className="font-bold text-emerald-400">Shield CA</span>
                  </div>
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#070c18] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                    <span className="text-[10px] text-slate-500 block">PILLAR 4</span>
                    <span className="font-bold text-amber-400">Shield Sign</span>
                  </div>
                </div>
              </div>

              {/* Product Access Action Box */}
              <div className={`p-6 rounded-2xl border text-center space-y-4 ${isDark ? 'bg-[#070c18] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center text-2xl mx-auto">
                  🔐
                </div>
                <div>
                  <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Enterprise Product Gateway</h4>
                  <p className="text-xs text-slate-500 mt-1">Requires an active enterprise license file (.lic) or organization single sign-on (SSO).</p>
                </div>

                <div className="space-y-2.5 pt-2">
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-xs shadow-md transition"
                  >
                    Enter License Key / Sign In →
                  </button>
                  <a
                    href="/app"
                    className="w-full py-2.5 block text-center rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold transition"
                  >
                    Launch Demo Console
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Vector Migration Workflow Section */}
      <section id="migration" className={`py-20 px-6 lg:px-12 border-y transition-colors ${isDark ? 'bg-[#070c18] border-slate-800' : 'bg-slate-100/70 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-mono font-extrabold text-cyan-500 uppercase tracking-widest">
              STEP-BY-STEP TRANSITION PIPELINE
            </span>
            <h2 className={`text-3xl lg:text-4xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              How Enterprise PQC Migration Works
            </h2>
            <p className={`text-sm max-w-2xl mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              QuantumShield standardizes post-quantum migration into a 4-phase, zero-downtime automated pipeline.
            </p>
          </div>

          {/* Step Selector Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {migrationSteps.map((s) => (
              <button
                key={s.step}
                onClick={() => setActiveStep(s.step)}
                className={`p-4 rounded-2xl border text-left transition-all duration-300 ${
                  activeStep === s.step
                    ? isDark
                      ? 'bg-[#0b1220] border-cyan-400 text-white shadow-lg shadow-cyan-950/40'
                      : 'bg-white border-cyan-500 text-slate-900 shadow-md'
                    : isDark
                    ? 'bg-[#050810] border-slate-800/80 text-slate-400 hover:text-slate-200'
                    : 'bg-white/60 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">{s.icon}</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-500">
                    PHASE 0{s.step}
                  </span>
                </div>
                <h4 className="text-sm font-extrabold truncate">{s.tag}</h4>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{s.title}</p>
              </button>
            ))}
          </div>

          {/* Animated Active Vector Stage Showcase */}
          <div className={`p-8 lg:p-12 rounded-3xl border transition-all duration-300 relative overflow-hidden ${isDark ? 'bg-[#0b1220] border-cyan-500/30' : 'bg-white border-slate-300 shadow-xl'}`}>
            {(() => {
              const curr = migrationSteps.find((s) => s.step === activeStep)!;
              return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div className="space-y-5">
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                      PHASE {curr.step}: {curr.tag}
                    </span>
                    <h3 className={`text-2xl lg:text-3xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {curr.title}
                    </h3>
                    <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {curr.description}
                    </p>

                    <div className={`p-4 rounded-xl border space-y-1 ${isDark ? 'bg-[#070c18] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <span className="text-[10px] font-mono uppercase text-cyan-500 font-bold block">CLIENT END BENEFIT</span>
                      <span className={`text-xs font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{curr.benefit}</span>
                    </div>
                  </div>

                  {/* Vector Diagram Simulation Box */}
                  <div className={`p-6 rounded-2xl border font-mono text-xs space-y-4 ${isDark ? 'bg-[#070c18] border-slate-800' : 'bg-slate-900 text-slate-200 border-slate-800'}`}>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-3">
                      <span>VECTOR SIMULATION STAGE</span>
                      <span className="text-cyan-400 font-bold">STATUS: ACTIVE</span>
                    </div>

                    {curr.step === 1 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-slate-300">
                          <span>[ Scanner Daemon ]</span>
                          <span className="text-cyan-400 animate-pulse">Parsing AST...</span>
                        </div>
                        <div className="p-3 rounded bg-[#0b1220] border border-slate-800 text-[11px] text-red-400">
                          ⚠️ Vulnerability Detected: RSA-2048 at line 42 (tls_config.go)
                        </div>
                        <div className="text-[11px] text-emerald-400">
                          ✓ CBOM Spec: CycloneDX 1.5 JSON generated
                        </div>
                      </div>
                    )}

                    {curr.step === 2 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-slate-300">
                          <span>Client Handshake</span>
                          <span className="text-indigo-400 font-bold">TLS 1.3 PQC</span>
                        </div>
                        <div className="p-3 rounded bg-[#0b1220] border border-indigo-500/40 text-[11px] text-indigo-300">
                          Cipher: TLS_AES_256_GCM_SHA384 (X25519_MLKEM768)
                        </div>
                        <div className="text-[11px] text-emerald-400">
                          ✓ Overhead: 1.64 ms (Sub-2ms SLA met)
                        </div>
                      </div>
                    )}

                    {curr.step === 3 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-slate-300">
                          <span>X.509 Certificate Issuer</span>
                          <span className="text-emerald-400 font-bold">Dual Signed</span>
                        </div>
                        <div className="p-3 rounded bg-[#0b1220] border border-emerald-500/40 text-[11px] text-emerald-300">
                          Extension OID: 1.3.6.1.4.1.58888.1 (ML-DSA-87)
                        </div>
                        <div className="text-[11px] text-slate-400">
                          ✓ Backwards compatibility verified for ECDSA P-384
                        </div>
                      </div>
                    )}

                    {curr.step === 4 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-slate-300">
                          <span>LMS State Guard</span>
                          <span className="text-amber-400 font-bold font-mono">Tree H10 Locked</span>
                        </div>
                        <div className="p-3 rounded bg-[#0b1220] border border-amber-500/40 text-[11px] text-amber-300">
                          Signature: lms_sig_00000002_7f6e5d...
                        </div>
                        <div className="text-[11px] text-emerald-400">
                          ✓ Atomic DB State lock confirmed (Zero key reuse)
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* Video Showcase Placeholder Section */}
      <section id="video" className="py-20 px-6 lg:px-12 max-w-7xl mx-auto text-center space-y-8">
        <div className="space-y-3">
          <span className="text-xs font-mono font-extrabold text-cyan-500 uppercase tracking-widest">
            PLATFORM DEMO SHOWCASE
          </span>
          <h2 className={`text-3xl lg:text-4xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            See QuantumShield in Action
          </h2>
          <p className={`text-sm max-w-2xl mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Watch how QuantumShield discovers vulnerabilities, proxies hybrid TLS traffic, and signs code updates in 3 minutes.
          </p>
        </div>

        {/* Video Player Placeholder Box */}
        <div className="relative max-w-4xl mx-auto aspect-video rounded-3xl border overflow-hidden shadow-2xl group cursor-pointer bg-gradient-to-br from-[#0c162d] via-[#070c18] to-[#0d101f] border-cyan-500/30 flex items-center justify-center">
          <div className="absolute inset-0 bg-cyan-500/10 opacity-30 group-hover:opacity-50 transition"></div>

          <div className="relative z-10 space-y-4 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-cyan-500/40 group-hover:scale-110 transition duration-300">
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div>
              <span className="text-base font-bold text-white block">Platform Demo Video Placeholder</span>
              <span className="text-xs text-slate-400 font-mono">Embed your video link here (YouTube / Vimeo / MP4)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Pricing Section */}
      <section id="pricing" className="py-20 px-6 lg:px-12 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-mono font-extrabold text-cyan-500 uppercase tracking-widest">
            FLEXIBLE ENTERPRISE DEPLOYMENTS
          </span>
          <h2 className={`text-3xl lg:text-4xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Licensing & Deployment Models
          </h2>
          <p className={`text-sm max-w-2xl mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Scalable hybrid licensing tailored for developers, enterprise clouds, and air-gapped federal networks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Developer Tier */}
          <div className={`p-8 rounded-3xl border space-y-6 flex flex-col justify-between ${isDark ? 'bg-[#0b1220] border-slate-800' : 'bg-white border-slate-200 shadow-md'}`}>
            <div className="space-y-4">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase">DEVELOPER & CI/CD</span>
              <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Scanner License</h3>
              <p className="text-xs text-slate-500">For security engineering teams integrating CBOM scans in CI/CD pipelines.</p>
              <div className="text-3xl font-black text-cyan-500">$499<span className="text-xs font-normal text-slate-500">/mo</span></div>
              <ul className={`space-y-2 text-xs font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <li>✓ Static CBOM Code Scans</li>
                <li>✓ TLS Endpoint Auditor</li>
                <li>✓ CycloneDX JSON Export</li>
              </ul>
            </div>
            <button onClick={() => setShowAuthModal(true)} className="w-full py-3 text-center rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition">
              Activate License →
            </button>
          </div>

          {/* Enterprise Tier */}
          <div className={`p-8 rounded-3xl border space-y-6 flex flex-col justify-between relative ${isDark ? 'bg-[#0f172a] border-cyan-500 shadow-xl shadow-cyan-950/50' : 'bg-slate-900 text-white border-cyan-500 shadow-xl'}`}>
            <div className="absolute -top-3 right-6 bg-cyan-500 text-slate-950 text-[10px] font-black uppercase px-3 py-1 rounded-full">
              POPULAR FOR CLOUD
            </div>
            <div className="space-y-4">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase">ENTERPRISE PLATFORM</span>
              <h3 className="text-2xl font-black text-white">Cloud / On-Prem Proxy</h3>
              <p className="text-xs text-slate-400">Complete translation proxies, hybrid PKI engine, and stateful signing nodes.</p>
              <div className="text-3xl font-black text-cyan-400">$2,499<span className="text-xs font-normal text-slate-400">/mo</span></div>
              <ul className="space-y-2 text-xs font-mono text-slate-200">
                <li>✓ All Scanner Features</li>
                <li>✓ Shield Proxy Gateway (ML-KEM)</li>
                <li>✓ Hybrid X.509 CA (ML-DSA-87)</li>
                <li>✓ Stateful LMS Signer (RFC 8554)</li>
              </ul>
            </div>
            <button onClick={() => setShowAuthModal(true)} className="w-full py-3 text-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 text-xs font-black transition">
              Sign In to Console →
            </button>
          </div>

          {/* Defense Tier */}
          <div className={`p-8 rounded-3xl border space-y-6 flex flex-col justify-between ${isDark ? 'bg-[#0b1220] border-slate-800' : 'bg-white border-slate-200 shadow-md'}`}>
            <div className="space-y-4">
              <span className="text-xs font-mono font-bold text-amber-500 uppercase">GOVERNMENT & OT</span>
              <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Defense & SCADA</h3>
              <p className="text-xs text-slate-500">Air-gapped deployments for aerospace, telecoms, and industrial OT networks.</p>
              <div className="text-3xl font-black text-amber-500">Custom</div>
              <ul className={`space-y-2 text-xs font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <li>✓ Air-gapped On-Prem Stack</li>
                <li>✓ Dedicated Integration Engineers</li>
                <li>✓ CNSA 2.0 Audit SLA Guarantee</li>
              </ul>
            </div>
            <a href="mailto:contact@quantumshield.io" className="w-full py-3 text-center rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition">
              Request CISO Audit →
            </a>
          </div>
        </div>
      </section>

      {/* Enterprise Sign-In / License Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`rounded-3xl max-w-md w-full p-6 lg:p-8 space-y-6 shadow-2xl animate-scaleUp border ${isDark ? 'bg-[#0b1220] border-cyan-500/40' : 'bg-white border-slate-300'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🔑</span>
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>QuantumShield Auth</h3>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className={`p-2 rounded-lg ${isDark ? 'text-slate-400 hover:text-white bg-slate-800/50' : 'text-slate-500 hover:text-slate-900 bg-slate-100'}`}
              >
                ✕
              </button>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
                ⚠️ {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs font-mono">
              <div className="space-y-1.5">
                <label className={`block font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Enterprise License Key (.lic)</label>
                <input
                  type="text"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  placeholder="qs-lic-2026-mldsa87-99481a"
                  className={`w-full p-3 rounded-xl border outline-none font-mono ${isDark ? 'bg-[#070c18] border-slate-700 text-cyan-300 focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'}`}
                />
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-700"></div>
                <span className="flex-shrink mx-3 text-slate-500 text-[10px]">OR WORK EMAIL</span>
                <div className="flex-grow border-t border-slate-700"></div>
              </div>

              <div className="space-y-1.5">
                <label className={`block font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Work Email</label>
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="security@enterprise.com"
                  className={`w-full p-3 rounded-xl border outline-none ${isDark ? 'bg-[#070c18] border-slate-700 text-white focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'}`}
                />
              </div>

              <div className="space-y-1.5">
                <label className={`block font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Password</label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={`w-full p-3 rounded-xl border outline-none ${isDark ? 'bg-[#070c18] border-slate-700 text-white focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'}`}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition mt-2"
              >
                Authenticate & Launch Console →
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Enterprise Footer */}
      <footer className={`border-t py-12 px-6 lg:px-12 transition-colors ${isDark ? 'bg-[#070c18] border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs font-mono">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-bold text-cyan-500">QuantumShield</span>
            <span>© 2026 QuantumShield Technologies Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center space-x-6">
            <a href="/app" className="hover:text-cyan-500">Console App</a>
            <a href="#products" className="hover:text-cyan-500">Products</a>
            <a href="#migration" className="hover:text-cyan-500">Vector Flow</a>
            <a href="#pricing" className="hover:text-cyan-500">Pricing</a>
            <span className="text-emerald-500 font-bold">CNSA 2.0 Mandate Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
