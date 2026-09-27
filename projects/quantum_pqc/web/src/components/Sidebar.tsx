'use client';

import React from 'react';
import { TabType, ThemeMode } from '../types';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  scansCount: number;
  certsCount: number;
  issuedCertsCount: number;
  signaturesCount: number;
  theme: ThemeMode;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  scansCount,
  certsCount,
  issuedCertsCount,
  signaturesCount,
  theme,
}) => {
  const isDark = theme === 'dark';

  const menuItems = [
    {
      id: 'home' as TabType,
      label: 'Product Overview',
      subtitle: 'Overview & Threat Matrix',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      badge: null,
    },
    {
      id: 'dashboard' as TabType,
      label: 'Executive Dashboard',
      subtitle: 'Real-Time Risk & Telemetry',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      badge: null,
    },
    {
      id: 'scan_new' as TabType,
      label: 'Shield Scan (CBOM)',
      subtitle: 'Discovery & Vulnerability Audit',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      badge: scansCount > 0 ? scansCount : null,
    },
    {
      id: 'proxy' as TabType,
      label: 'Shield Proxy',
      subtitle: 'Crypto-Agile TLS Translation',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      badge: 'ML-KEM',
    },
    {
      id: 'ca' as TabType,
      label: 'Shield CA',
      subtitle: 'Hybrid X.509 Trust Center',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 0121 9z" />
        </svg>
      ),
      badge: issuedCertsCount > 0 ? issuedCertsCount : null,
    },
    {
      id: 'sign' as TabType,
      label: 'Shield Sign',
      subtitle: 'Stateful LMS Code Signer',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      ),
      badge: signaturesCount > 0 ? signaturesCount : null,
    },
    {
      id: 'standards' as TabType,
      label: 'Standards & Policy',
      subtitle: 'NIST PQC & CNSA 2.0 Matrix',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      badge: 'NIST',
    },
  ];

  return (
    <aside
      className={`w-72 p-4 flex flex-col justify-between shrink-0 min-h-[calc(100vh-65px)] transition-colors duration-300 border-r ${
        isDark ? 'bg-[#070c18] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      <div className="space-y-6">
        <div>
          <p
            className={`px-3 text-[11px] font-bold uppercase tracking-wider mb-3 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Core Migration Suite
          </p>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive =
                activeTab === item.id ||
                (item.id === 'scan_new' && activeTab === 'scan_detail') ||
                (item.id === 'ca' && activeTab === 'certs');

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full group flex items-start space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left ${
                    isActive
                      ? isDark
                        ? 'bg-gradient-to-r from-cyan-500/15 via-indigo-500/10 to-transparent border border-cyan-500/30 text-white shadow-lg shadow-cyan-950/30'
                        : 'bg-cyan-50 border border-cyan-300 text-cyan-900 shadow-sm'
                      : isDark
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <div
                    className={`mt-0.5 transition-colors duration-200 ${
                      isActive
                        ? 'text-cyan-500 font-bold'
                        : isDark
                        ? 'text-slate-500 group-hover:text-slate-300'
                        : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  >
                    {item.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold truncate ${isActive ? (isDark ? 'text-white' : 'text-cyan-900') : ''}`}>
                        {item.label}
                      </span>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                            isActive
                              ? isDark
                                ? 'bg-cyan-500 text-[#070c18]'
                                : 'bg-cyan-600 text-white'
                              : isDark
                              ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                              : 'bg-slate-100 text-slate-700 border border-slate-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                      {item.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Microservices Status Card */}
        <div
          className={`rounded-xl border p-3.5 space-y-3 transition ${
            isDark ? 'bg-[#0b1220] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold flex items-center space-x-1.5 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
              <svg className="w-3.5 h-3.5 text-cyan-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Security Stack</span>
            </span>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono">
              ALL ACTIVE
            </span>
          </div>

          <div className="space-y-1.5 text-[11px] font-mono">
            <div className={`flex justify-between items-center ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>REST API</span>
              </span>
              <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Port 8080</span>
            </div>
            <div className={`flex justify-between items-center ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>PQC Proxy</span>
              </span>
              <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Port 8443</span>
            </div>
            <div className={`flex justify-between items-center ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>LMS State Guard</span>
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Locked</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div
        className={`pt-4 border-t text-[11px] font-mono space-y-1 ${
          isDark ? 'border-slate-800/80 text-slate-500' : 'border-slate-200 text-slate-600'
        }`}
      >
        <div className="flex items-center justify-between">
          <span>Standards:</span>
          <span className="text-cyan-600 dark:text-cyan-400 font-semibold">CNSA 2.0 Ready</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Primitives:</span>
          <span>ML-KEM / ML-DSA / LMS</span>
        </div>
      </div>
    </aside>
  );
};
