import React, { useState } from 'react';
import { Building2, Users, Home, Check, ShieldCheck, DollarSign, TrendingUp } from 'lucide-react';

export const BusinessModelView: React.FC = () => {
  const [deviceCount, setDeviceCount] = useState(25);
  const [selectedPlan, setSelectedPlan] = useState<'smb' | 'enterprise' | 'consumer'>('smb');

  const plans = [
    {
      id: 'consumer',
      name: 'Consumer / Pro',
      icon: Home,
      target: 'Home users & privacy advocates',
      price: 9.99,
      unit: '/ device / month',
      popular: false,
      features: [
        'DNS & Network threat blocker',
        'Local AI heuristics (sub-2ms)',
        'Zero-telemetry privacy guarantee',
        'Parental control categories',
        'Real-time desktop tray alerts',
      ],
    },
    {
      id: 'smb',
      name: 'Small Business (SMB)',
      icon: Users,
      target: '5 – 100 employees · No IT dept required',
      price: 19.00,
      unit: '/ seat / month',
      popular: true,
      features: [
        'All Consumer features included',
        'Central cloud policy sync',
        'Automated ransomware rollback',
        'Fleet health monitoring (Mac & Win)',
        'Email & Slack instant threat alerts',
        '30-second single-click installer',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise / MSSP',
      icon: Building2,
      target: '100 – 10,000+ seats · SOC2 & SIEM',
      price: 65.00,
      unit: '/ seat / month',
      popular: false,
      features: [
        'All SMB features included',
        'SIEM integration (Splunk, Elastic, Datadog)',
        'SOC2 Type II compliance audit logs',
        'Custom ML & YARA rule authoring',
        'MSSP white-label multi-tenant console',
        'Dedicated 24/7 SecOps support & SLA',
      ],
    },
  ];

  const calculateMonthlyRevenue = () => {
    if (selectedPlan === 'consumer') return deviceCount * 9.99;
    if (selectedPlan === 'smb') return deviceCount * 19.0;
    return deviceCount * 65.0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100 font-['Outfit']">
              Target Market & Revenue Strategy
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Global Endpoint Security Market: <span className="text-cyan-400 font-semibold">$18 Billion in 2024</span> growing to <span className="text-cyan-400 font-semibold">$35+ Billion by 2030 (CAGR ~12%)</span>
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <TrendingUp className="w-4 h-4" />
            <span>High-LTV SaaS Model</span>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isSelected = selectedPlan === plan.id;

          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id as any)}
              className={`glass-panel rounded-2xl p-6 relative cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                plan.popular
                  ? 'border-cyan-500/60 shadow-[0_0_30px_rgba(6,182,212,0.2)]'
                  : 'hover:border-slate-600'
              } ${isSelected ? 'ring-2 ring-cyan-400' : ''}`}
            >
              {plan.popular && (
                <span className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[10px] font-extrabold tracking-wider uppercase shadow-md">
                  Most Popular
                </span>
              )}

              <div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">{plan.name}</h3>
                    <p className="text-[11px] text-slate-400">{plan.target}</p>
                  </div>
                </div>

                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-100 mono-font">
                    ${plan.price.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{plan.unit}</span>
                </div>

                <div className="mt-5 space-y-2.5">
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                className={`mt-6 w-full py-2.5 rounded-xl font-semibold text-xs transition ${
                  plan.popular
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                Select {plan.name} Tier
              </button>
            </div>
          );
        })}
      </div>

      {/* Interactive Revenue Calculator */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Interactive SaaS Revenue Estimator</h3>
            <p className="text-xs text-slate-400">Calculate ARR and monthly recurring revenue based on seat count</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-slate-400 font-medium">Device / Seat Count:</span>
              <span className="text-cyan-300 font-bold mono-font text-sm">{deviceCount} Devices</span>
            </div>
            <input
              type="range"
              min="5"
              max="500"
              step="5"
              value={deviceCount}
              onChange={(e) => setDeviceCount(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>5 seats (SMB)</span>
              <span>100 seats</span>
              <span>500+ seats (Enterprise)</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex justify-around items-center">
            <div className="text-center">
              <span className="text-xs text-slate-400 font-medium block">Monthly Recurring (MRR)</span>
              <span className="text-2xl font-extrabold text-cyan-400 mono-font">
                ${calculateMonthlyRevenue().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="h-10 w-px bg-slate-800" />
            <div className="text-center">
              <span className="text-xs text-slate-400 font-medium block">Annual Recurring (ARR)</span>
              <span className="text-2xl font-extrabold text-emerald-400 mono-font">
                ${(calculateMonthlyRevenue() * 12).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
