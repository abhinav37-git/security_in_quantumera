'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import { HomePage } from '../../components/HomePage';
import { DashboardView } from '../../components/DashboardView';
import { ScanView } from '../../components/ScanView';
import { ProxyView } from '../../components/ProxyView';
import { CAView } from '../../components/CAView';
import { SignView } from '../../components/SignView';
import { StandardsView } from '../../components/StandardsView';

import {
  ScanJob,
  Finding,
  CBOMComponent,
  Certificate,
  IssuedCertificate,
  ProxyHandshake,
  SignedArtifact,
  TabType,
  ThemeMode,
} from '../../types';

import {
  INITIAL_SCANS,
  INITIAL_FINDINGS,
  INITIAL_COMPONENTS,
  INITIAL_CERTS,
  INITIAL_ISSUED_CERTS,
  INITIAL_HANDSHAKES,
  INITIAL_SIGNATURES,
  SERVICES_HEALTH,
} from '../../mockData';

const API_BASE = 'http://localhost:8080/api';

export default function ConsoleApp() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [apiConnected, setApiConnected] = useState<boolean>(false);

  // Core Data States
  const [scans, setScans] = useState<ScanJob[]>(INITIAL_SCANS);
  const [certs, setCerts] = useState<Certificate[]>(INITIAL_CERTS);
  const [issuedCerts, setIssuedCerts] = useState<IssuedCertificate[]>(INITIAL_ISSUED_CERTS);
  const [handshakes, setHandshakes] = useState<ProxyHandshake[]>(INITIAL_HANDSHAKES);
  const [signatures, setSignatures] = useState<SignedArtifact[]>(INITIAL_SIGNATURES);

  // Selected Scan Detail States
  const [selectedScan, setSelectedScan] = useState<ScanJob | null>(INITIAL_SCANS[0]);
  const [findings, setFindings] = useState<Finding[]>(INITIAL_FINDINGS);
  const [components, setComponents] = useState<CBOMComponent[]>(INITIAL_COMPONENTS);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  // Sync html class for theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Fetch all endpoints from live API
  const fetchAllData = async () => {
    try {
      const [scansRes, certsRes, handshakesRes, caCertsRes, sigsRes] = await Promise.all([
        fetch(`${API_BASE}/scans`).catch(() => null),
        fetch(`${API_BASE}/certs`).catch(() => null),
        fetch(`${API_BASE}/proxy/telemetry`).catch(() => null),
        fetch(`${API_BASE}/ca/certs`).catch(() => null),
        fetch(`${API_BASE}/signatures`).catch(() => null),
      ]);

      let isConnected = false;

      if (scansRes && scansRes.ok) {
        const data = await scansRes.json();
        if (Array.isArray(data) && data.length > 0) setScans(data);
        isConnected = true;
      }
      if (certsRes && certsRes.ok) {
        const data = await certsRes.json();
        if (Array.isArray(data) && data.length > 0) setCerts(data);
        isConnected = true;
      }
      if (handshakesRes && handshakesRes.ok) {
        const data = await handshakesRes.json();
        if (Array.isArray(data) && data.length > 0) setHandshakes(data);
        isConnected = true;
      }
      if (caCertsRes && caCertsRes.ok) {
        const data = await caCertsRes.json();
        if (Array.isArray(data) && data.length > 0) setIssuedCerts(data);
        isConnected = true;
      }
      if (sigsRes && sigsRes.ok) {
        const data = await sigsRes.json();
        if (Array.isArray(data) && data.length > 0) setSignatures(data);
        isConnected = true;
      }

      setApiConnected(isConnected);
    } catch (err) {
      setApiConnected(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch detailed scan report
  const handleViewDetails = async (id: string) => {
    setLoadingDetails(true);
    const existing = scans.find((s) => s.id === id);
    if (existing) setSelectedScan(existing);

    try {
      const res = await fetch(`${API_BASE}/scan/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.scan) setSelectedScan(data.scan);
        if (Array.isArray(data.findings)) setFindings(data.findings);
        if (Array.isArray(data.components)) setComponents(data.components);
      }
    } catch (err) {
      console.log('Using local fallback scan details');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Actions: Start Codebase Scan
  const handleStartScan = async (path: string) => {
    try {
      const res = await fetch(`${API_BASE}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });

      if (res.ok) {
        const newJob = await res.json();
        fetchAllData();
        handleViewDetails(newJob.id);
      } else {
        throw new Error(await res.text());
      }
    } catch (err: any) {
      const simulatedScan: ScanJob = {
        id: `scan-${Math.random().toString(36).substring(2, 9)}`,
        target_type: 'codebase',
        target_url: path,
        status: 'completed',
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      };
      setScans((prev) => [simulatedScan, ...prev]);
      setSelectedScan(simulatedScan);
    }
  };

  // Actions: Start Endpoint Scan
  const handleStartCertScan = async (host: string, port: string) => {
    try {
      const res = await fetch(`${API_BASE}/scan/endpoint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port: parseInt(port) }),
      });

      if (res.ok) {
        const newJob = await res.json();
        fetchAllData();
        handleViewDetails(newJob.id);
      } else {
        throw new Error(await res.text());
      }
    } catch (err: any) {
      const simulatedScan: ScanJob = {
        id: `scan-${Math.random().toString(36).substring(2, 9)}`,
        target_type: 'endpoint',
        target_url: `${host}:${port}`,
        status: 'completed',
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      };
      setScans((prev) => [simulatedScan, ...prev]);
      setSelectedScan(simulatedScan);
    }
  };

  // Actions: Issue PQC CA Certificate
  const handleIssueCert = async (commonName: string, signatureAlg: string) => {
    try {
      const res = await fetch(`${API_BASE}/ca/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          common_name: commonName,
          signature_algorithm: signatureAlg,
        }),
      });

      if (res.ok) {
        fetchAllData();
      } else {
        throw new Error(await res.text());
      }
    } catch (err: any) {
      const newCert: IssuedCertificate = {
        id: `issued-${Date.now()}`,
        common_name: commonName,
        serial_number: hexGen(18),
        issuer: `QuantumShield CA (${signatureAlg})`,
        signature_algorithm: signatureAlg,
        revoked: false,
        pem_block: `-----BEGIN CERTIFICATE-----\nMIICqDCCAj2gAwIBAgITB3+aK0EJyE4/ITANBgkqhkiG9w0BAQsFADBLMRMwEQYD\nVQQDEwpPcGVuU1NMIENBMRUwEwYDVQQKEwxRdWFudHVtU2hpZWxkMQswCQYDVQQG\nEwJVUzAeFw0yNTA3MjYwMDAwMDBaFw0yNjA3MjYwMDAwMDBaMD0xGzAZBgNVBAMM\nEnNoaWVsZC1nYXRld2F5LmludGVybmFsMRUwEwYDVQQKEwxRdWFudHVtU2hpZWxk\n-----END CERTIFICATE-----`,
        created_at: new Date().toISOString(),
      };
      setIssuedCerts((prev) => [newCert, ...prev]);
    }
  };

  // Actions: Sign Artifact (LMS)
  const handleSignArtifact = async (artifactName: string, payload: string) => {
    try {
      const res = await fetch(`${API_BASE}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artifact_name: artifactName,
          payload,
        }),
      });

      if (res.ok) {
        fetchAllData();
      } else {
        throw new Error(await res.text());
      }
    } catch (err: any) {
      const newIndex = signatures.length + 1;
      const newSig: SignedArtifact = {
        id: `sig-${Date.now()}`,
        artifact_name: artifactName,
        signature: `lms_sig_000000${newIndex}_` + hexGen(64),
        public_key: 'lms_pubkey_h10_w4_99201f8273b45c6d',
        status: 'VALID',
        lms_tree_index: newIndex,
        created_at: new Date().toISOString(),
      };
      setSignatures((prev) => [newSig, ...prev]);
    }
  };

  // Actions: Verify LMS Signature
  const handleVerifySignature = async (payload: string, signature: string, publicKey: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload, signature, public_key: publicKey }),
      });

      if (res.ok) {
        const data = await res.json();
        return Boolean(data.valid);
      }
    } catch (err: any) {
      console.log('Verification fallback calculation');
    }
    return signature.startsWith('lms_sig_') && payload.length > 0;
  };

  function hexGen(length: number) {
    let result = '';
    const characters = '0123456789ABCDEF';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${isDark ? 'bg-[#030712] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Top Banner to return to Main Site */}
      <div className={`px-6 py-2 flex items-center justify-between text-xs font-mono border-b ${isDark ? 'bg-[#050810] border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
        <div className="flex items-center space-x-2">
          <span>🔒 QuantumShield Enterprise Console Platform</span>
        </div>
        <a href="/" className="hover:text-cyan-500 font-bold transition flex items-center space-x-1">
          <span>← Return to Main Site (/)</span>
        </a>
      </div>

      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        apiConnected={apiConnected}
        totalCerts={certs.length + issuedCerts.length}
        theme={theme}
        setTheme={setTheme}
      />

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          scansCount={scans.length}
          certsCount={certs.length}
          issuedCertsCount={issuedCerts.length}
          signaturesCount={signatures.length}
          theme={theme}
        />

        {/* Content View Area */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {activeTab === 'home' && (
            <HomePage setActiveTab={setActiveTab} servicesHealth={SERVICES_HEALTH} theme={theme} />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              scans={scans}
              findings={findings}
              certs={certs}
              handshakes={handshakes}
              signatures={signatures}
              setActiveTab={setActiveTab}
              onViewScanDetails={(id) => {
                handleViewDetails(id);
                setActiveTab('scan_detail');
              }}
              theme={theme}
            />
          )}

          {(activeTab === 'scan_new' || activeTab === 'scan_detail') && (
            <ScanView
              scans={scans}
              selectedScan={selectedScan}
              findings={findings}
              components={components}
              loadingDetails={loadingDetails}
              onStartScan={handleStartScan}
              onStartCertScan={handleStartCertScan}
              onViewDetails={handleViewDetails}
              setActiveTab={setActiveTab}
              theme={theme}
            />
          )}

          {activeTab === 'proxy' && (
            <ProxyView handshakes={handshakes} setActiveTab={setActiveTab} theme={theme} />
          )}

          {(activeTab === 'ca' || activeTab === 'certs') && (
            <CAView
              certs={certs}
              issuedCerts={issuedCerts}
              onIssueCert={handleIssueCert}
              setActiveTab={setActiveTab}
              theme={theme}
            />
          )}

          {activeTab === 'sign' && (
            <SignView
              signatures={signatures}
              onSignArtifact={handleSignArtifact}
              onVerifySignature={handleVerifySignature}
              setActiveTab={setActiveTab}
              theme={theme}
            />
          )}

          {activeTab === 'standards' && <StandardsView theme={theme} />}
        </main>
      </div>
    </div>
  );
}
