
import React from 'react';
import { InternshipLog, AttainmentLevel } from '../types';
import { ALL_COMPETENCIES } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  logs: InternshipLog[];
  progress: Record<string, AttainmentLevel>;
}

const Dashboard: React.FC<DashboardProps> = ({ logs, progress }) => {
  const totalHours = logs.reduce((acc, log) => acc + log.hours, 0);
  const targetHours = 320;
  const progressPercent = Math.min(100, Math.round((totalHours / targetHours) * 100));

  const levelColors = {
    [AttainmentLevel.EMERGING]: '#f87171',
    [AttainmentLevel.DEVELOPING]: '#fbbf24',
    [AttainmentLevel.PROFICIENT]: '#34d399',
    [AttainmentLevel.EXEMPLARY]: '#60a5fa'
  };

  const chartData = [
    { name: 'Emerging', count: Object.values(progress).filter(v => v === AttainmentLevel.EMERGING).length, color: levelColors[AttainmentLevel.EMERGING] },
    { name: 'Developing', count: Object.values(progress).filter(v => v === AttainmentLevel.DEVELOPING).length, color: levelColors[AttainmentLevel.DEVELOPING] },
    { name: 'Proficient', count: Object.values(progress).filter(v => v === AttainmentLevel.PROFICIENT).length, color: levelColors[AttainmentLevel.PROFICIENT] },
    { name: 'Exemplary', count: Object.values(progress).filter(v => v === AttainmentLevel.EXEMPLARY).length, color: levelColors[AttainmentLevel.EXEMPLARY] },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-800">Internship Overview</h2>
        <p className="text-slate-500">Welcome back. Here's your current progress.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-400 mb-1">Total Hours</p>
          <p className="text-3xl font-bold text-slate-800">{totalHours} <span className="text-lg font-normal text-slate-400">/ {targetHours}</span></p>
          <div className="mt-4 w-full bg-slate-100 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-400 mb-1">Competencies Tracked</p>
          <p className="text-3xl font-bold text-slate-800">{Object.keys(progress).length} <span className="text-lg font-normal text-slate-400">/ {ALL_COMPETENCIES.length}</span></p>
          <p className="mt-4 text-xs text-slate-400">Focusing on Core Leadership areas</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-400 mb-1">Recent Activity</p>
          {logs.length > 0 ? (
            <div className="mt-1">
              <p className="text-sm font-semibold text-slate-700 truncate">{logs[logs.length - 1].activity}</p>
              <p className="text-xs text-slate-400 mt-1">{logs[logs.length - 1].date}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No logs recorded yet.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Competency Attainment</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Links</h3>
          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">📄</span>
                <div>
                  <p className="text-sm font-semibold">Bethel Internship Guide</p>
                  <p className="text-xs text-slate-400">Official Policies & Procedures</p>
                </div>
              </div>
              <span className="text-slate-300">→</span>
            </div>
            <div className="p-4 rounded-xl border border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">📅</span>
                <div>
                  <p className="text-sm font-semibold">Upcoming Review</p>
                  <p className="text-xs text-slate-400">Scheduled for May 2026</p>
                </div>
              </div>
              <span className="text-slate-300">→</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
