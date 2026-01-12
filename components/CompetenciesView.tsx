import React, { useState } from 'react';
import { AttainmentLevel, InternshipLog, Artifact } from '../types';
import { ALL_COMPETENCIES } from '../constants';
import { Target, MessageSquare, CheckCircle2, FileText, X } from 'lucide-react';

interface CompetenciesViewProps {
  progress: Record<string, AttainmentLevel>;
  logs: InternshipLog[];
  artifacts: Artifact[];
  competencyReflections: Record<string, string>;
  onUpdateProgress: (id: string, level: AttainmentLevel) => void;
  onUpdateReflection: (id: string, reflection: string) => void;
}

const CompetenciesView: React.FC<CompetenciesViewProps> = ({ 
  progress, 
  logs, 
  artifacts, 
  competencyReflections,
  onUpdateProgress,
  onUpdateReflection
}) => {
  const [editingCompId, setEditingCompId] = useState<string | null>(null);
  const levels = Object.values(AttainmentLevel);

  const getLevelColor = (level: AttainmentLevel) => {
    switch (level) {
      case AttainmentLevel.EMERGING: return 'bg-app-light';
      case AttainmentLevel.DEVELOPING: return 'bg-app-slate';
      case AttainmentLevel.PROFICIENT: return 'bg-app-deep';
      case AttainmentLevel.EXEMPLARY: return 'bg-app-dark';
      default: return 'bg-slate-200';
    }
  };

  const currentReflection = editingCompId ? (competencyReflections[editingCompId] || '') : '';
  const relevantLogs = editingCompId ? logs.filter(l => l.taggedCompetencyIds.includes(editingCompId)) : [];

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <div className="p-2 rounded-xl glass-blue">
               <Target className="text-app-dark" size={24} />
             </div>
             <h2 className="text-3xl font-black text-app-dark tracking-tight">Competency Progress</h2>
          </div>
          <p className="text-app-slate text-sm font-bold opacity-70">Cataloging proof of administrative capability.</p>
        </div>
        <div className="flex gap-4 glass p-3 rounded-2xl shadow-sm overflow-x-auto no-scrollbar border border-white/50">
          {levels.map(l => (
            <div key={l} className="flex items-center space-x-2 shrink-0">
              <div className={`w-3 h-3 rounded-full ${getLevelColor(l)} shadow-sm`}></div>
              <span className="text-[10px] font-black text-app-slate uppercase tracking-widest opacity-80">{l}</span>
            </div>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-5 px-1">
        {ALL_COMPETENCIES.map(comp => {
          const artifactCount = artifacts.filter(a => a.taggedCompetencyIds?.includes(comp.id)).length;
          const hasReflection = !!competencyReflections[comp.id];
          const currentLevel = progress[comp.id];
          
          return (
            <div key={comp.id} className="glass p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:translate-x-1 transition-all duration-300 group">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center flex-wrap gap-3">
                    <span className="text-[11px] font-black text-app-bright border border-app-bright/20 px-3 py-1 rounded-xl uppercase bg-app-bright/5">{comp.id}</span>
                    <h4 className="font-black text-app-dark text-lg tracking-tight group-hover:text-app-bright transition-colors">{comp.title}</h4>
                    
                    <div className="flex items-center gap-2">
                      {artifactCount > 0 && (
                        <div className="bg-app-bright/10 text-app-bright text-[10px] px-3 py-1.5 rounded-full font-black uppercase flex items-center gap-1.5 border border-app-bright/10 shadow-sm">
                          <CheckCircle2 size={12} strokeWidth={3} /> {artifactCount} Proofs
                        </div>
                      )}
                      {hasReflection && (
                        <div className="bg-app-dark/5 text-app-dark text-[10px] px-3 py-1.5 rounded-full font-black uppercase flex items-center gap-1.5 border border-app-dark/10 shadow-sm">
                          <MessageSquare size={12} strokeWidth={3} /> Reflected
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-app-deep/70 leading-relaxed font-medium">{comp.description}</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setEditingCompId(comp.id)}
                    className="w-12 h-12 flex items-center justify-center glass-blue text-app-dark rounded-2xl hover:bg-app-bright hover:text-white transition-all shadow-lg active:scale-90"
                    title="Reflection & Evidence"
                  >
                    <FileText size={20} strokeWidth={2.5} />
                  </button>
                  <div className="flex space-x-2 glass p-2 rounded-2xl border border-white/50 shadow-inner">
                    {levels.map(level => {
                      const isActive = currentLevel === level;
                      return (
                        <button
                          key={level}
                          onClick={() => onUpdateProgress(comp.id, level)}
                          className={`w-10 h-10 rounded-xl text-[11px] font-black transition-all flex items-center justify-center ${
                            isActive 
                              ? `${getLevelColor(level)} text-white shadow-xl scale-110 ring-4 ring-white/30`
                              : 'text-app-light hover:text-app-slate'
                          }`}
                          title={level}
                        >
                          {level.charAt(0)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Synthesis Modal */}
      {editingCompId && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-app-dark/60 backdrop-blur-xl" onClick={() => setEditingCompId(null)}></div>
          <div className="relative glass w-full max-w-3xl sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-12 duration-500">
            <header className="p-10 border-b border-white/20 flex items-center justify-between sticky top-0 bg-white/70 z-10">
              <div>
                <h3 className="text-2xl font-black text-app-dark tracking-tight">Standard Synthesis</h3>
                <div className="flex items-center gap-3 mt-2">
                   <span className="text-[11px] font-black text-app-bright bg-app-bright/10 px-3 py-1 rounded-lg uppercase tracking-widest">{editingCompId}</span>
                   <p className="text-xs font-bold text-app-slate uppercase tracking-widest truncate max-w-xs">{ALL_COMPETENCIES.find(c => c.id === editingCompId)?.title}</p>
                </div>
              </div>
              <button onClick={() => setEditingCompId(null)} className="p-4 bg-app-dark/5 text-app-dark hover:bg-app-dark hover:text-white rounded-[1.5rem] transition-all active:scale-90 shadow-sm">
                <X size={22} strokeWidth={3} />
              </button>
            </header>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar">
              <section>
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-8 h-8 rounded-xl glass-blue flex items-center justify-center">
                     <CheckCircle2 size={16} className="text-app-bright" strokeWidth={3} />
                   </div>
                   <h4 className="text-[12px] font-black text-app-dark uppercase tracking-[0.2em]">Connected Activity Logs</h4>
                </div>
                {relevantLogs.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {relevantLogs.map(log => (
                      <div key={log.id} className="p-6 bg-white/40 rounded-[2rem] border border-white/50 text-xs shadow-sm group hover:bg-white/60 transition-colors">
                        <div className="flex justify-between font-black text-app-slate mb-3 uppercase tracking-tight">
                          <span className="bg-app-slate/10 px-3 py-1 rounded-lg">{log.date}</span>
                          <span className="text-app-bright font-black">{log.hours}h Active</span>
                        </div>
                        <p className="text-app-dark font-bold leading-relaxed text-sm">{log.activity}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-10 bg-app-dark/5 rounded-[2.5rem] border border-dashed border-app-slate/30 text-center">
                    <p className="text-sm text-app-slate font-bold italic opacity-60">No activity logs tagged for this standard yet.</p>
                  </div>
                )}
              </section>

              <section>
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-8 h-8 rounded-xl glass-blue flex items-center justify-center">
                     <MessageSquare size={16} className="text-app-bright" strokeWidth={3} />
                   </div>
                   <h4 className="text-[12px] font-black text-app-dark uppercase tracking-[0.2em]">Synthesis & Growth Reflection</h4>
                </div>
                <div className="relative">
                  <textarea
                    autoFocus
                    value={currentReflection}
                    onChange={(e) => onUpdateReflection(editingCompId, e.target.value)}
                    placeholder="Reflect on your growth. How does this evidence prove you have mastered this standard? What were your key learnings?"
                    className="w-full h-72 p-8 bg-white/60 border border-white/50 rounded-[2.5rem] text-base text-app-dark focus:ring-4 focus:ring-app-bright/10 focus:border-app-bright outline-none placeholder:text-app-light font-medium leading-relaxed transition-all shadow-inner"
                  />
                  <div className="absolute bottom-6 right-8 text-[10px] font-black text-app-light uppercase tracking-widest pointer-events-none">Autosaved</div>
                </div>
              </section>
            </div>

            <footer className="p-10 bg-white/70 border-t border-white/20 backdrop-blur-md">
              <button 
                onClick={() => setEditingCompId(null)}
                className="w-full bg-app-dark text-white py-6 rounded-[2rem] font-black uppercase text-sm tracking-[0.25em] shadow-2xl shadow-app-dark/40 hover:bg-app-deep active:scale-[0.98] transition-all"
              >
                Archive Synthesis
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetenciesView;