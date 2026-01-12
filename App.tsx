
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import LogsView from './components/LogsView';
import CompetenciesView from './components/CompetenciesView';
import ArtifactsView from './components/ArtifactsView';
import SitesView from './components/SitesView';
import { AppState, InternshipLog, AttainmentLevel, Artifact, Shelf, Site } from './types';

const STORAGE_KEY = 'internship_tracker_data_v7';

const App: React.FC = () => {
  const [currentView, setView] = useState<string>('dashboard');
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.shelves) parsed.shelves = [];
      if (!parsed.sites) parsed.sites = [];
      if (!parsed.competencyReflections) parsed.competencyReflections = {};
      if (!parsed.primarySetting || parsed.primarySetting === 'Elementary') parsed.primarySetting = 'Secondary';
      
      // Migration for logs and sites if user has old data
      parsed.logs = parsed.logs?.map((l: any) => l.schoolLevel === 'Elementary' ? { ...l, schoolLevel: 'Primary' } : l);
      parsed.sites = parsed.sites?.map((s: any) => s.level === 'Elementary' ? { ...s, level: 'Primary' } : s);
      
      return parsed;
    }
    return {
      logs: [],
      artifacts: [],
      progress: {},
      shelves: [],
      sites: [],
      competencyReflections: {},
      primarySetting: 'Secondary'
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addLog = (log: InternshipLog) => {
    setState(prev => ({ ...prev, logs: [...prev.logs, log] }));
  };

  const updateProgress = (id: string, level: AttainmentLevel) => {
    setState(prev => ({
      ...prev,
      progress: { ...prev.progress, [id]: level }
    }));
  };

  const updateCompetencyReflection = (id: string, reflection: string) => {
    setState(prev => ({
      ...prev,
      competencyReflections: { ...prev.competencyReflections, [id]: reflection }
    }));
  };

  const addArtifact = (artifact: Artifact) => {
    setState(prev => ({ ...prev, artifacts: [...prev.artifacts, artifact] }));
  };

  const updateArtifact = (updated: Artifact) => {
    setState(prev => ({
      ...prev,
      artifacts: prev.artifacts.map(a => a.id === updated.id ? updated : a)
    }));
  };

  const addShelf = (name: string) => {
    const newShelf: Shelf = { id: crypto.randomUUID(), name };
    setState(prev => ({ ...prev, shelves: [...prev.shelves, newShelf] }));
  };

  const addSite = (site: Site) => {
    setState(prev => ({ ...prev, sites: [...prev.sites, site] }));
  };

  const removeSite = (id: string) => {
    setState(prev => ({ ...prev, sites: prev.sites.filter(s => s.id !== id) }));
  };

  const setPrimarySetting = (setting: 'Primary' | 'Secondary') => {
    setState(prev => ({ ...prev, primarySetting: setting }));
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            logs={state.logs} 
            progress={state.progress} 
            primarySetting={state.primarySetting}
            onSetPrimarySetting={setPrimarySetting}
          />
        );
      case 'logs':
        return <LogsView logs={state.logs} onAddLog={addLog} />;
      case 'competencies':
        return (
          <CompetenciesView 
            progress={state.progress} 
            logs={state.logs} 
            artifacts={state.artifacts}
            competencyReflections={state.competencyReflections}
            onUpdateProgress={updateProgress}
            onUpdateReflection={updateCompetencyReflection}
          />
        );
      case 'artifacts':
        return (
          <ArtifactsView 
            artifacts={state.artifacts} 
            shelves={state.shelves}
            onAddArtifact={addArtifact} 
            onUpdateArtifact={updateArtifact}
            onAddShelf={addShelf}
          />
        );
      case 'sites':
        return (
          <SitesView 
            sites={state.sites}
            onAddSite={addSite}
            onRemoveSite={removeSite}
          />
        );
      default:
        return (
          <Dashboard 
            logs={state.logs} 
            progress={state.progress} 
            primarySetting={state.primarySetting}
            onSetPrimarySetting={setPrimarySetting}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar currentView={currentView} setView={setView} />
      
      <main className="flex-1 md:ml-64 p-4 md:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8">
        <div className="md:hidden flex items-center justify-between mb-6">
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-blue-100">P</div>
             <h1 className="text-lg font-black bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
               InternPro
             </h1>
           </div>
           <div className="flex items-center gap-2">
             <span className="text-[10px] font-black text-slate-400 bg-white border border-slate-100 px-2 py-1 rounded-full uppercase">Bethel U</span>
           </div>
        </div>

        {renderView()}
      </main>

      <BottomNav currentView={currentView} setView={setView} />

      {(currentView === 'dashboard' || currentView === 'sites') && (
        <div className="md:hidden fixed bottom-20 right-6 z-40">
          <button 
            onClick={() => setView('logs')}
            className="w-14 h-14 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100 text-white flex items-center justify-center text-2xl active:scale-95 transition-all"
            aria-label="Add log"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
