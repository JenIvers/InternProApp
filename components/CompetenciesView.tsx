
import React from 'react';
import { AttainmentLevel } from '../types';
import { ALL_COMPETENCIES } from '../constants';

interface CompetenciesViewProps {
  progress: Record<string, AttainmentLevel>;
  onUpdateProgress: (id: string, level: AttainmentLevel) => void;
}

const CompetenciesView: React.FC<CompetenciesViewProps> = ({ progress, onUpdateProgress }) => {
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

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Competency Framework</h2>
          <p className="text-slate-500">Track your attainment for Bethel University standards.</p>
        </div>
        <div className="flex space-x-2">
          {levels.map(l => (
            <div key={l} className="flex items-center space-x-1">
              <div className={`w-3 h-3 rounded-full ${getLevelColor(l)}`}></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{l}</span>
            </div>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {ALL_COMPETENCIES.map(comp => (
          <div key={comp.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded leading-none">{comp.id}</span>
                <h4 className="font-bold text-slate-800">{comp.title}</h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-50 text-slate-400 uppercase font-bold">{comp.category}</span>
              </div>
              <p className="text-sm text-slate-500 mt-1">{comp.description}</p>
            </div>
            
            <div className="flex space-x-1 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
              {levels.map(level => {
                const isActive = progress[comp.id] === level;
                return (
                  <button
                    key={level}
                    onClick={() => onUpdateProgress(comp.id, level)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isActive 
                        ? `${getLevelColor(level)} text-white shadow-sm scale-105`
                        : 'text-slate-400 hover:bg-white hover:text-slate-600'
                    }`}
                  >
                    {level.charAt(0)}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompetenciesView;
