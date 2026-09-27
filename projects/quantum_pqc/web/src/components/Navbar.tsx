'use client';

import React from 'react';
import { TabType, ThemeMode } from '../types';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  apiConnected: boolean;
  totalCerts: number;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  apiConnected,
  totalCerts,
  theme,
  setTheme,
}) => {
  const isDark = theme === 'dark';

  return (
    <header
      className={`sticky top-0 z-50 border-b px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-lg transition-colors duration-300 ${
        isDark
          ? 'border-cyan-500/20 bg-[#070b14]/90 backdrop-blur-md shadow-cyan-950/20'
          : 'border-slate-200 bg-white/90 backdrop-blur-md shadow-slate-200/50'
      }`}
    >
      {/* Brand Logo & Name */}
      <div className="flex items-center space-x-3.5 cursor-pointer" onClick={() => setActiveTab('home')}>
        <div className="relative group">
          <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 blur opacity-40 group-hover:opacity-75 transition duration-300"></div>
          <div
            className={`relative h-10 w-10 rounded-xl flex items-center justify-center shadow-inner transition ${
              isDark ? 'bg-[#0d1527] border border-cyan-500/30' : 'bg-slate-100 border border-slate-300'
            }`}
          >
            <svg className="h-6 w-6 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>

        <div>
          <div className="flex items-center space-x-2">
            <span
              className={`text-xl font-extrabold tracking-tight font-sans ${
                isDark
                  ? 'bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-cyan-400'
                  : 'text-slate-900'
              }`}
            >
              QuantumShield
            </span>
          </div>
          <p className={`text-xs font-mono tracking-tight ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Post-Quantum Trust & Code Signing Platform
          </p>
        </div>
      </div>

      {/* Center Navigation Shortcuts */}
      <div
        className={`hidden md:flex items-center space-x-1.5 p-1 rounded-xl border transition ${
          isDark ? 'bg-[#0b1220] border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}
      >
        <button
          onClick={() => setActiveTab('home')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center space-x-1.5 ${
            activeTab === 'home'
              ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-500/20'
              : isDark
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <span>🏠 Product Home</span>
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center space-x-1.5 ${
            activeTab === 'dashboard'
              ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-500/20'
              : isDark
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <span>📊 Dashboard</span>
        </button>
        <button
          onClick={() => setActiveTab('scan_new')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center space-x-1.5 ${
            activeTab === 'scan_new' || activeTab === 'scan_detail'
              ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-500/20'
              : isDark
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <span>🔍 CBOM Discovery</span>
        </button>
        <button
          onClick={() => setActiveTab('standards')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center space-x-1.5 ${
            activeTab === 'standards'
              ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-500/20'
              : isDark
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <span>📚 Standards Matrix</span>
        </button>
      </div>

      {/* Right Controls: Theme Toggle & API Status */}
      <div className="flex items-center space-x-3">
        {/* Theme Toggle Button */}
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all duration-200 flex items-center space-x-1.5 ${
            isDark
              ? 'bg-[#0b1220] border-cyan-500/30 text-amber-300 hover:bg-cyan-500/10'
              : 'bg-amber-500/10 border-amber-500/40 text-amber-700 hover:bg-amber-500/20'
          }`}
          title="Toggle Light / Dark Mode"
        >
          <span>{isDark ? '☀️ Light Theme' : '🌙 Dark Theme'}</span>
        </button>

        {/* API Live Status */}
        <div
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs ${
            isDark ? 'bg-[#0b1220] border-slate-800' : 'bg-slate-100 border-slate-300'
          }`}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${apiConnected ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${apiConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </span>
          <span className={`font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            {apiConnected ? 'API Live (8080)' : 'Demo Mode'}
          </span>
        </div>

        <button
          onClick={() => setActiveTab('ca')}
          className={`px-3.5 py-1.5 rounded-lg border text-xs font-medium transition flex items-center space-x-1.5 ${
            isDark
              ? 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30 text-cyan-300'
              : 'bg-cyan-50 hover:bg-cyan-100 border-cyan-300 text-cyan-800'
          }`}
        >
          <span>🔑 Active Certs</span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              isDark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-200 text-cyan-900'
            }`}
          >
            {totalCerts}
          </span>
        </button>
      </div>
    </header>
  );
};
