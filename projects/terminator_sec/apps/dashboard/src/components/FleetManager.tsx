import React from 'react';
import { Laptop, Monitor, Server, Cpu, CheckCircle2, ShieldAlert, ArrowUpRight, Download } from 'lucide-react';
import { DeviceInfo } from '../types';

interface FleetManagerProps {
  fleet: DeviceInfo[];
}

export const FleetManager: React.FC<FleetManagerProps> = ({ fleet }) => {
  return (
    <div className="space-y-6">
      {/* Fleet Overview Header */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100 font-['Outfit']">
              Cross-Platform Device Fleet
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Active endpoint nodes synchronized across macOS Host, Windows VM (UTM / VMware), and Cloud
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/dist/windows-terminator-sec.zip"
              download
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-semibold transition"
            >
              <Download className="w-4 h-4" />
              <span>Download Windows VM Package (.exe)</span>
            </a>
          </div>
        </div>
      </div>

      {/* Fleet Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {fleet.map((device) => {
          const isMac = device.os.toLowerCase().includes('macos');
          const isWin = device.os.toLowerCase().includes('windows');

          return (
            <div
              key={device.id}
              className="glass-panel rounded-2xl p-6 hover:border-cyan-500/40 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400">
                    {isMac ? (
                      <Laptop className="w-6 h-6" />
                    ) : isWin ? (
                      <Monitor className="w-6 h-6" />
                    ) : (
                      <Server className="w-6 h-6" />
                    )}
                  </div>
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{device.status}</span>
                  </span>
                </div>

                <h3 className="mt-4 text-base font-bold text-slate-100">{device.hostname}</h3>
                <p className="text-xs text-slate-400 font-medium">{device.os}</p>

                <div className="mt-5 space-y-2.5 text-xs">
                  <div className="flex justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-slate-500">Agent Version:</span>
                    <span className="text-slate-300 mono-font font-semibold">{device.version}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-slate-500">IP Address:</span>
                    <span className="text-cyan-300 mono-font font-semibold">{device.ip}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-slate-500">CPU Overhead:</span>
                    <span className="text-emerald-400 mono-font font-bold">
                      {device.cpu_usage.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Heartbeat:</span>
                    <span className="text-slate-400 mono-font">
                      {new Date(device.last_seen).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  {isWin ? 'UTM/VMware Virtual Node' : 'Native Hardware'}
                </span>
                <span className="text-cyan-400 font-semibold flex items-center gap-1">
                  Synced <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
