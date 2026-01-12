import React from 'react';
import { InternshipLog, AttainmentLevel } from '../types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { LayoutDashboard, School, GraduationCap, Building2, Award, CheckCircle2, Sparkles } from 'lucide-react';

interface DashboardProps {
  logs: InternshipLog[];
  progress: Record<string, AttainmentLevel>;
  primarySetting: 'Primary' | 'Secondary';
  onSetPrimarySetting: (setting: 'Primary' | 'Secondary') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ logs, progress, primarySetting, onSetPrimarySetting }) => {
  const totalHours = logs.reduce((acc, log) => acc + log.hours, 0);
  const targetTotal = 320;
  const progressPercent = Math.min(100, Math.round((totalHours / targetTotal) * 100));

  const alt1Setting = primarySetting === 'Secondary' ? 'Primary' : 'Secondary';

  const hoursByLevel = {
    Secondary: logs.filter(l => l.schoolLevel === 'Secondary').reduce((a, b) => a + b.hours, 0),
    Primary: logs.filter(l => l.schoolLevel === 'Primary').reduce((a, b) => a + b.hours, 0),
    Alternate: logs.filter(l => l.schoolLevel === 'Alternate').reduce((a, b) => a + b.hours, 0),
  };

  const requirements = [
    { 
      label: `${primarySetting}`, 
      current: hoursByLevel[primarySetting], 
      target: 240,
      color: 'bg-app-dark',
      icon: primarySetting === 'Secondary' ? GraduationCap : School,
      glassColor: 'rgba(20, 41, 48, 0.05)'
    },
    { 
      label: `${alt1Setting}`, 
      current: hoursByLevel[alt1Setting], 
      target: 40,
      color: 'bg-app-bright',
      icon: alt1Setting === 'Primary' ? School : GraduationCap,
      glassColor: 'rgba(66, 131, 164, 0.1)'
    },
    { 
      label: `Alternate`, 
      current: hoursByLevel['Alternate'], 
      target: 40,
      color: 'bg-app-slate',
      icon: Building2,
      glassColor: 'rgba(100, 146, 160, 0.1)'
    }
  ];

  const attainmentData = [
    { name: 'Emerging', count: Object.values(progress).filter(v => v === AttainmentLevel.EMERGING).length, color: '#A2C8D3' },
    { name: 'Developing', count: Object.values(progress).filter(v => v === AttainmentLevel.DEVELOPING).length, color: '#6492A0' },
    { name: 'Proficient', count: Object.values(progress).filter(v => v === AttainmentLevel.PROFICIENT).length, color: '#305663' },
    { name: 'Exemplary', count: Object.values(progress).filter(v => v === AttainmentLevel.EXEMPLARY).length, color: '#142930' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl glass-blue">
              <Sparkles className="text-app-bright" size={24} />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-app-dark tracking-tight">
              Welcome to InternPro!
            </h1>
          </div>
          <p className="text-app-slate text-lg font-medium opacity-80 pl-1">
            Track your admin hours and artifacts here.
          </p>
        </div>
      </header>

      {/* Main Stats Card with Liquid Glass */}
      <section className="glass p-10 rounded-[3rem] shadow-2xl shadow-app-dark/5 flex flex-col lg:flex-row items-center gap-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-app-bright/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        
        <div className="relative w-56 h-56 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="112" cy="112" r="100" stroke="rgba(255,255,255,0.5)" strokeWidth="16" fill="transparent" />
            <circle cx="112" cy="112" r="100" stroke="url(#gradient)" strokeWidth="16" fill="transparent" strokeDasharray={628} strokeDashoffset={628 - (628 * progressPercent) / 100} className="transition-all duration-1000 stroke-round" />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4283A4" />
                <stop offset="100%" stopColor="#142930" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl font-black text-app-dark tracking-tighter">{totalHours}</span>
            <span className="text-[11px] font-black text-app-slate uppercase tracking-[0.2em] mt-2 opacity-60">Total Hours</span>
          </div>
        </div>
        
        <div className="flex-1 space-y-8 text-center lg:text-left relative z-10">
          <div>
            <h2 className="text-3xl font-black text-app-dark tracking-tight mb-4">Total Hours Tracked</h2>
            <p className="text-app-deep text-lg leading-relaxed max-w-xl font-medium opacity-80">
              You are <span className="text-app-bright font-black">{progressPercent}%</span> of the way to your 320-hour goal. 
              Keep cataloging your instructional leadership moments.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
            <div className="glass-blue px-6 py-3 rounded-2xl flex items-center gap-3 border border-app-bright/20">
              <Award size={20} className="text-app-bright" />
              <span className="text-sm font-black text-app-dark uppercase tracking-wide">{Object.keys(progress).length} Competencies Met</span>
            </div>
            <div className="bg-app-dark/5 px-6 py-3 rounded-2xl flex items-center gap-3 border border-app-dark/10">
              <CheckCircle2 size={20} className="text-app-dark" />
              <span className="text-sm font-black text-app-dark uppercase tracking-wide">{logs.length} Logged Entries</span>
            </div>
          </div>
        </div>
      </section>

      {/* Setting Distribution - More distinct color variation */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-4">
          <div>
            <h3 className="text-2xl font-black text-app-dark tracking-tight">Institutional Placements</h3>
            <p className="text-app-slate text-sm font-bold opacity-60">Meeting the 240 / 40 / 40 hour distribution.</p>
          </div>
          <div className="inline-flex glass p-1.5 rounded-2xl shadow-lg shadow-app-dark/5">
            <button 
              onClick={() => onSetPrimarySetting('Secondary')}
              className={`px-8 py-2.5 rounded-xl text-[11px] font-black transition-all ${primarySetting === 'Secondary' ? 'bg-app-dark text-white shadow-xl shadow-[#14293033]' : 'text-app-slate hover:text-app-dark'}`}
            >
              Secondary Site
            </button>
            <button 
              onClick={() => onSetPrimarySetting('Primary')}
              className={`px-8 py-2.5 rounded-xl text-[11px] font-black transition-all ${primarySetting === 'Primary' ? 'bg-app-dark text-white shadow-xl shadow-[#14293033]' : 'text-app-slate hover:text-app-dark'}`}
            >
              Primary Site
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {requirements.map(req => {
            const percent = Math.min(100, Math.round((req.current / req.target) * 100));
            const Icon = req.icon;
            return (
              <div key={req.label} className="glass p-8 rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group" style={{ backgroundColor: req.glassColor }}>
                <div className="flex items-center justify-between mb-8">
                  <div className={`p-4 rounded-2xl ${req.color} text-white shadow-2xl shadow-inner group-hover:scale-110 transition-transform`}>
                    <Icon size={24} strokeWidth={2.5} />
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-app-dark tracking-tighter">{req.current}</span>
                    <span className="text-[10px] font-black text-app-slate uppercase tracking-widest ml-1 opacity-50">/ {req.target}h</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-black text-app-deep uppercase tracking-widest">{req.label} Experience</h4>
                  <div className="w-full bg-white/50 h-3 rounded-full overflow-hidden border border-white/30 p-[2px]">
                    <div 
                      className={`h-full ${req.color} transition-all duration-1000 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]`} 
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Competency Attainment Chart */}
      <section className="glass p-10 rounded-[3.5rem] shadow-xl border border-white/40">
        <div className="flex items-center gap-4 mb-10">
           <div className="w-14 h-14 rounded-2xl bg-app-bright/10 flex items-center justify-center text-app-bright shadow-inner">
               <LayoutDashboard size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-app-dark tracking-tight">Competency Attainment</h3>
              <p className="text-app-slate text-[11px] font-black uppercase tracking-widest opacity-60">Performance Distribution Across MN Standards</p>
            </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={attainmentData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="name" 
                fontSize={10} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontWeight: '900', fill: '#6492A0' }} 
              />
              <Tooltip 
                cursor={{ fill: 'rgba(66, 131, 164, 0.05)' }} 
                contentStyle={{ 
                    borderRadius: '24px', 
                    border: 'none', 
                    fontWeight: 'bold', 
                    background: 'rgba(255, 255, 255, 0.9)', 
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' 
                }} 
              />
              <Bar dataKey="count" radius={[14, 14, 14, 14]} barSize={60}>
                {attainmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;