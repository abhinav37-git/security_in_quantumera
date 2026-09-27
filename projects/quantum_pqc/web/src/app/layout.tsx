import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuantumShield | Post-Quantum Trust Architecture & Migration Platform",
  description: "End-to-end post-quantum cryptographic (PQC) migration suite. Automated CBOM audits, crypto-agile TLS reverse proxies, hybrid X.509 PKI, and stateful LMS code signing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-[#030712] text-slate-100">{children}</body>
    </html>
  );
}
