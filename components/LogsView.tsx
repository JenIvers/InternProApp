import React, { useState } from 'react';
import { InternshipLog } from '../types';
import { ALL_COMPETENCIES } from '../constants';
import { Clock, Calendar, School, Plus, PencilLine, Tag, Timer, X, Edit2, Printer } from 'lucide-react';

interface LogsViewProps {
  logs: InternshipLog[];
  onAddLog: (log: InternshipLog) => void;
  onUpdateLog: (log: InternshipLog) => void;
  isReadOnly?: boolean;
  userName?: string | null;
}

const LogsView: React.FC<LogsViewProps> = ({ logs, onAddLog, onUpdateLog, isReadOnly, userName }) => {
  const [isAdding, setIsAdding] = useState(false);
  
  // Stats Calculations
  const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const totalHours = logs.reduce((sum, log) => sum + Number(log.hours), 0);
  
  const statsByLevel = logs.reduce((acc, log) => {
    const level = log.schoolLevel || 'Other';
    acc[level] = (acc[level] || 0) + Number(log.hours);
    return acc;
  }, {} as Record<string, number>);

  const handlePrint = () => {
    window.print();
  };

  const [formData, setFormData] = useState<Partial<InternshipLog>>({
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '12:00',
    hours: 4,
    title: '',
    activity: '',
    location: '',
    schoolLevel: 'Middle',
    taggedCompetencyIds: [],
    reflections: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleCompetency = (id: string) => {
    setFormData(prev => {
      const current = prev.taggedCompetencyIds || [];
      const next = current.includes(id)
        ? current.filter(cid => cid !== id)
        : [...current, id];
      return { ...prev, taggedCompetencyIds: next };
    });
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      startTime: '08:00',
      endTime: '12:00',
      hours: 4,
      title: '',
      activity: '',
      location: '',
      schoolLevel: 'Middle',
      taggedCompetencyIds: [],
      reflections: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.id) {
      // Update existing log
      const updatedLog: InternshipLog = {
        ...formData as InternshipLog,
        hours: Number(formData.hours),
        title: formData.title || '',
        taggedCompetencyIds: formData.taggedCompetencyIds || [],
        reflections: formData.reflections || '',
        artifactIds: formData.artifactIds || []
      };
      onUpdateLog(updatedLog);
    } else {
      // Create new log
      const newLog: InternshipLog = {
        id: crypto.randomUUID(),
        date: formData.date!,
        startTime: formData.startTime!,
        endTime: formData.endTime!,
        hours: Number(formData.hours),
        title: formData.title || '',
        activity: formData.activity!,
        location: formData.location!,
        schoolLevel: formData.schoolLevel as InternshipLog['schoolLevel'],
        taggedCompetencyIds: formData.taggedCompetencyIds || [],
        reflections: formData.reflections || '',
        artifactIds: []
      };
      onAddLog(newLog);
    }
    
    setIsAdding(false);
    resetForm();
  };

  const handleEditClick = (log: InternshipLog) => {
    setFormData({ ...log, title: log.title || '' });
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClose = () => {
    setIsAdding(false);
    resetForm();
  };

  return (
    <div className="space-y-8 pb-20 md:pb-8">
      <div className="flex justify-between items-center px-4 print:hidden">
        <div>
          <h2 className="text-3xl font-black text-app-dark tracking-tight">Activity Log</h2>
          <p className="text-app-slate text-base font-bold opacity-70">Cataloging real-world leadership moments.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handlePrint}
            className="px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3 bg-white text-app-dark border border-app-dark/10 shadow-xl hover:bg-app-bg active:scale-95"
          >
            <Printer size={18} strokeWidth={3} />
            <span className="hidden sm:inline">Export Report</span>
          </button>
          {!isReadOnly && (
            <button
              onClick={isAdding ? handleClose : () => setIsAdding(true)}
              className={`px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3 shadow-2xl ${
                isAdding 
                  ? 'bg-white text-app-dark border border-white/50' 
                  : 'bg-app-dark text-white shadow-app-dark/30 hover:scale-105 active:scale-95'
              }`}
            >
              {isAdding ? <X size={18} strokeWidth={3} /> : <Plus size={18} strokeWidth={3} />}
              <span>{isAdding ? 'Close' : 'New Entry'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Printable Report Section - Hidden in UI */}
      <div className="hidden print:block p-12 bg-white min-h-screen text-slate-900">
        {/* Header */}
        <div className="border-b-4 border-slate-900 pb-10 mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900">Internship Portfolio Report</h1>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-sm mt-3">
              {userName || 'Internship Candidate'} &mdash; Bethel University Principal Internship
            </p>
          </div>
          <div className="text-right">
            <div className="bg-slate-900 text-white px-6 py-4 rounded-xl">
              <p className="text-4xl font-black leading-none">{totalHours.toFixed(1)}</p>
              <p className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-70">Cumulative Hours</p>
            </div>
          </div>
        </div>

        {/* Stats Overview Grid */}
        <div className="mb-12">
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-6 flex items-center gap-4">
            <span>Hours by Institutional Context</span>
            <div className="flex-1 h-px bg-slate-100"></div>
          </h2>
          <div className="grid grid-cols-4 gap-6">
            {['Elementary', 'Intermediate', 'Middle', 'High School'].map(level => (
              <div key={level} className="border-2 border-slate-50 p-6 rounded-2xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{level}</p>
                <p className="text-2xl font-black text-slate-900">{(statsByLevel[level] || 0).toFixed(1)} <span className="text-xs opacity-30">hrs</span></p>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Log Table */}
        <div>
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-6 flex items-center gap-4">
            <span>Chronological Activity History</span>
            <div className="flex-1 h-px bg-slate-100"></div>
          </h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400 w-32">Date</th>
                <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Activity Overview</th>
                <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400 w-32">Level</th>
                <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right w-24">Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedLogs.map((log) => (
                <tr key={log.id} className="break-inside-avoid">
                  <td className="py-4 px-2 text-sm font-bold text-slate-500">{log.date}</td>
                  <td className="py-4 px-2">
                    <p className="text-base font-black text-slate-900 leading-tight">
                      {log.title || log.activity}
                    </p>
                  </td>
                  <td className="py-4 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">{log.schoolLevel}</td>
                  <td className="py-4 px-2 text-right text-base font-black text-slate-900">{Number(log.hours).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-900">
                <td colSpan={3} className="py-8 px-2 text-xs font-black uppercase tracking-[0.4em] text-slate-900">Total Internship Engagement</td>
                <td className="py-8 px-2 text-right text-3xl font-black text-slate-900">{totalHours.toFixed(1)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-20 pt-10 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          <p>InternPro Portfolio System &bull; Secure Academic Record</p>
          <p>Generated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="glass p-10 rounded-[3.5rem] shadow-2xl border border-white/60 space-y-10 animate-in fade-in slide-in-from-top-6 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[11px] font-black text-app-slate uppercase tracking-[0.2em] ml-2">
                <Calendar size={14} className="text-app-bright" /> Date of Engagement
              </label>
              <input type="date" name="date" value={formData.date} onChange={handleInputChange} required className="w-full p-5 rounded-[1.5rem] bg-white/60 border-none focus:ring-4 focus:ring-app-bright/10 outline-none font-bold text-app-dark shadow-inner" />
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[11px] font-black text-app-slate uppercase tracking-[0.2em] ml-2">
                <Timer size={14} className="text-app-bright" /> Credit Hours
              </label>
              <input type="number" step="0.5" name="hours" value={formData.hours} onChange={handleInputChange} required className="w-full p-5 rounded-[1.5rem] bg-white/60 border-none focus:ring-4 focus:ring-app-bright/10 outline-none font-bold text-app-dark shadow-inner" />
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[11px] font-black text-app-slate uppercase tracking-[0.2em] ml-2">
                <School size={14} className="text-app-bright" /> Institutional Context
              </label>
              <div className="relative">
                <select name="schoolLevel" value={formData.schoolLevel} onChange={handleInputChange} className="w-full p-5 rounded-[1.5rem] bg-white/60 border-none focus:ring-4 focus:ring-app-bright/10 outline-none font-bold text-app-dark appearance-none shadow-inner">
                  <option value="Elementary">Elementary</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Middle">Middle School</option>
                  <option value="High School">High School</option>
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                  <Plus size={16} className="rotate-45" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[11px] font-black text-app-slate uppercase tracking-[0.2em] ml-2">
              <Edit2 size={14} className="text-app-bright" /> Title / Overview
            </label>
            <textarea
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Brief summary or title for this entry..."
              rows={1}
              className="w-full p-5 rounded-[1.5rem] bg-white/60 border-none focus:ring-4 focus:ring-app-bright/10 outline-none font-bold text-app-dark shadow-inner placeholder:text-app-light/50 resize-none"
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[11px] font-black text-app-slate uppercase tracking-[0.2em] ml-2">
              <PencilLine size={14} className="text-app-bright" /> Description of Professional Activity
            </label>
            <textarea
              name="activity"
              value={formData.activity}
              onChange={handleInputChange}
              required
              placeholder="Provide a professional summary of your work during this session..."
              className="w-full p-8 rounded-[2.5rem] bg-white/60 border-none focus:ring-4 focus:ring-app-bright/10 outline-none h-40 font-medium text-app-dark shadow-inner placeholder:text-app-light/50"
            />
          </div>

          <div className="space-y-4">
             <label className="flex items-center gap-2 text-[11px] font-black text-app-slate uppercase tracking-[0.2em] ml-2">
              <Tag size={14} className="text-app-bright" /> Competency Alignment
            </label>
            <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-6 bg-white/40 rounded-[2.5rem] border border-white/50 no-scrollbar shadow-inner">
              {ALL_COMPETENCIES.map(comp => (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() => toggleCompetency(comp.id)}
                  className={`px-4 py-2.5 rounded-2xl text-[10px] font-black transition-all border ${
                    formData.taggedCompetencyIds?.includes(comp.id)
                      ? 'bg-app-dark text-white border-app-dark shadow-xl shadow-app-dark/20'
                      : 'bg-white text-app-slate border-white/60 hover:border-app-light'
                  }`}
                >
                  {comp.id}: {comp.title}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="w-full py-6 bg-app-dark text-white rounded-[2rem] font-black uppercase text-sm tracking-[0.3em] shadow-2xl shadow-app-dark/40 active:scale-[0.98] transition-all hover:bg-black">
            {formData.id ? 'Update Session Log' : 'Archive Session to Log'}
          </button>
        </form>
      )}

      <div className="space-y-6 px-1 print:hidden">
        {logs.slice().reverse().map(log => (
          <div key={log.id} className="glass p-8 rounded-[3rem] shadow-sm hover:shadow-2xl hover:translate-x-1 transition-all group duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
              <div className="flex gap-5">
                 <div className="w-14 h-14 rounded-2xl bg-white shadow-xl flex items-center justify-center text-app-light group-hover:bg-app-bright group-hover:text-white transition-all duration-500">
                    <Clock size={24} strokeWidth={2.5} />
                 </div>
                 <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="text-[11px] font-black text-app-bright bg-app-bright/5 border border-app-bright/10 px-3 py-1 rounded-lg uppercase tracking-widest">{log.date}</span>
                      <span className="text-[11px] font-black text-app-slate bg-app-dark/5 px-3 py-1 rounded-lg uppercase tracking-widest flex items-center gap-2">
                        <School size={12} strokeWidth={2.5} /> {log.schoolLevel}
                      </span>
                    </div>
                    {log.title && (
                      <h4 className="text-xl font-black text-app-dark leading-tight group-hover:text-app-bright transition-colors mb-2">{log.title}</h4>
                    )}
                    <p className={`${log.title ? 'text-sm text-app-slate font-medium line-clamp-2' : 'text-xl font-black text-app-dark leading-tight group-hover:text-app-bright transition-colors'}`}>
                      {log.activity}
                    </p>
                 </div>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                 <div className="text-right glass-blue p-5 rounded-[2rem] min-w-[120px] shadow-sm">
                   <span className="text-4xl font-black text-app-dark tracking-tighter">{log.hours}</span>
                   <span className="text-[11px] text-app-slate block uppercase font-black tracking-widest opacity-60">Session Hours</span>
                 </div>
                 
                 {!isReadOnly && (
                    <button 
                      onClick={() => handleEditClick(log)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/50 text-app-slate hover:bg-app-bright hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                    >
                      <Edit2 size={12} strokeWidth={3} />
                      Edit Log
                    </button>
                 )}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 ml-1">
              <div className="flex items-center gap-2 text-[10px] font-black text-app-light uppercase tracking-widest mr-2 opacity-50">
                <Tag size={12} strokeWidth={3} /> Aligned:
              </div>
              {log.taggedCompetencyIds.map(id => {
                const comp = ALL_COMPETENCIES.find(c => c.id === id);
                return (
                  <span key={id} title={comp?.description} className="px-3 py-1.5 glass text-app-slate rounded-xl text-[10px] font-black border border-white/50 shadow-sm hover:bg-white hover:text-app-bright transition-colors cursor-help">
                    {id}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogsView;