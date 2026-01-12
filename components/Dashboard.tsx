
import React from 'react';
import { InternshipLog, AttainmentLevel } from '../types';
import { ALL_COMPETENCIES } from '../constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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
      color: 'bg-blue-600',
      icon: '🏛️'
    },
    { 
      label: `${alt1Setting}`, 
      current: hoursByLevel[alt1Setting], 
      target: 40,
      color: 'bg-indigo-500',
      icon: '🎒'
    },
    { 
      label: `Alternate`, 
      current: hoursByLevel['Alternate'], 
      target: 40,
      color: 'bg-violet-400',
      icon: '🏢'
    }
  ];

  const attainmentData = [
    { name: 'Emerging', count: Object.values(progress).filter(v => v === AttainmentLevel.EMERGING).length, color: '#f87171' },
    { name: 'Developing', count: Object.values(progress).filter(v => v === AttainmentLevel.DEVELOPING).length, color: '#fbbf24' },
    { name: 'Proficient', count: Object.values(progress).filter(v => v === AttainmentLevel.PROFICIENT).length, color: '#34d399' },
    { name: 'Exemplary', count: Object.values(progress).filter(v => v === AttainmentLevel.EXEMPLARY).length, color: '#60a5fa' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
      {/* Welcome Header */}
      <header className="mb-2">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
          Welcome to InternPro! 👋
        </h1>
        <p className="text-slate-500 mt-2 text-lg md:text-xl font-medium">
          Track your progress and learning here!
        </p>
      </header>

      {/* 1. Main Section: Total Progress Progress Ring & Big Number */}
      <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-10">
        <div className="relative w-48 h-48 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-50" />
            <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={553} strokeDashoffset={553 - (553 * progressPercent) / 100} className="text-blue-600 transition-all duration-1000 stroke-round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-black text-slate-800">{totalHours}</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Hours</span>
          </div>
        </div>
        
        <div className="flex-1 space-y-4 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Overall Completion</h2>
          </div>
          <p className="text-slate-500 text-sm max-w-md">
            You've completed <strong>{totalHours}</strong> out of <strong>{targetTotal}</strong> required internship hours. 
            You are <strong>{progressPercent}%</strong> of the way to your final certification goal.
          </p>
          <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-2">
            <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-xs font-black uppercase">
              {Object.keys(progress).length} Standards Covered
            </span>
            <span className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-xs font-black uppercase">
              {logs.length} Activities Logged
            </span>
          </div>
        </div>
      </section>

      {/* 2. Hour Distribution Section */}
      <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-800">Setting Distribution</h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Requirement: 240 / 40 / 40</p>
          </div>
          <div className="inline-flex bg-slate-100 p-1 rounded-2xl">
            <button 
              onClick={() => onSetPrimarySetting('Secondary')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${primarySetting === 'Secondary' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Secondary
            </button>
            <button 
              onClick={() => onSetPrimarySetting('Primary')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${primarySetting === 'Primary' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Primary
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {requirements.map(req => {
            const percent = Math.min(100, Math.round((req.current / req.target) * 100));
            return (
              <div key={req.label} className="space-y-2">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{req.icon}</span>
                    <div>
                      <h4 className="text-sm font-black text-slate-700 leading-none">{req.label}</h4>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Target: {req.target}h</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-800">{req.current}h</span>
                    <span className="text-[10px] font-bold text-slate-400 ml-1">({percent}%)</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${req.color} transition-all duration-1000 shadow-sm`} 
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Secondary Stats (Competencies) */}
      <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8">Competency Attainment</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={attainmentData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{ fontWeight: 'bold', fill: '#94a3b8' }} />
              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '16px', border: 'none', fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={50}>
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
