
import React, { useState } from 'react';
import { AttainmentLevel, InternshipLog, Artifact } from '../types';
import { ALL_COMPETENCIES } from '../constants';

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
      case AttainmentLevel.EMERGING: return 'bg-red-400';
      case AttainmentLevel.DEVELOPING: return 'bg-amber-400';
      case AttainmentLevel.PROFICIENT: return 'bg-emerald-400';
      case AttainmentLevel.EXEMPLARY: return 'bg-blue-400';
      default: return 'bg-slate-200';
    }
  };

  const currentReflection = editingCompId ? (competencyReflections[editingCompId] || '') : '';
  const relevantLogs = editingCompId ? logs.filter(l => l.taggedCompetencyIds.includes(editingCompId)) : [];

  return (
    <div className="space-y-6 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Framework</h2>
          <p className="text-slate-500 text-sm">Track mastery and synthesize evidence.</p>
        </div>
        <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar">
          {levels.map(l => (
            <div key={l} className="flex items-center space-x-1 shrink-0">
              <div className={`w-2 h-2 rounded-full ${getLevelColor(l)}`}></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">{l}</span>
            </div>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {ALL_COMPETENCIES.map(comp => {
          const artifactCount = artifacts.filter(a => a.taggedCompetencyIds?.includes(comp.id)).length;
          const hasReflection = !!competencyReflections[comp.id];
          
          return (
            <div key={comp.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <span className="text-[10px] font-black text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded uppercase leading-none">{comp.id}</span>
                    <h4 className="font-bold text-slate-800 text-sm">{comp.title}</h4>
                    {artifactCount > 0 && (
                      <span className="bg-emerald-50 text-emerald-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {artifactCount} Proofs
                      </span>
                    )}
                    {hasReflection && (
                      <span className="bg-blue-50 text-blue-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        Reflected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{comp.description}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setEditingCompId(comp.id)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
                  >
                    Reflect
                  </button>
                  <div className="flex space-x-1 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                    {levels.map(level => {
                      const isActive = progress[comp.id] === level;
                      return (
                        <button
                          key={level}
                          onClick={() => onUpdateProgress(comp.id, level)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                            isActive 
                              ? `${getLevelColor(level)} text-white shadow-md scale-105`
                              : 'text-slate-300 hover:text-slate-600'
                          }`}
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

      {/* Manual Synthesis Reflection Modal */}
      {editingCompId && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditingCompId(null)}></div>
          <div className="relative bg-white w-full max-w-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-10">
            <header className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-lg font-black text-slate-800">Standard Synthesis</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{editingCompId}: {ALL_COMPETENCIES.find(c => c.id === editingCompId)?.title}</p>
              </div>
              <button onClick={() => setEditingCompId(null)} className="p-2 text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
            </header>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Evidence Summary Section */}
              <section>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Linked Activity Logs</h4>
                {relevantLogs.length > 0 ? (
                  <div className="space-y-2">
                    {relevantLogs.map(log => (
                      <div key={log.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                        <div className="flex justify-between font-bold text-slate-500 mb-1">
                          <span>{log.date}</span>
                          <span>{log.hours}h</span>
                        </div>
                        <p className="text-slate-700 font-medium">{log.activity}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No specific activities logged for this standard yet.</p>
                )}
              </section>

              {/* Reflection Entry Section */}
              <section>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Synthesis Reflection</h4>
                <p className="text-xs text-slate-500 mb-4">Summarize your growth and how you demonstrated this competency across your logs.</p>
                <textarea
                  autoFocus
                  value={currentReflection}
                  onChange={(e) => onUpdateReflection(editingCompId, e.target.value)}
                  placeholder="Type your professional reflection here..."
                  className="w-full h-48 p-4 bg-blue-50 border-none rounded-3xl text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-blue-200"
                />
              </section>
            </div>

            <footer className="p-6 bg-slate-50 border-t border-slate-100">
              <button 
                onClick={() => setEditingCompId(null)}
                className="w-full bg-slate-800 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-[0.98] transition-all"
              >
                Save Reflection
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetenciesView;
