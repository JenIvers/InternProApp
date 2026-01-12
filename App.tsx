
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import LogsView from './components/LogsView';
import CompetenciesView from './components/CompetenciesView';
import ArtifactsView from './components/ArtifactsView';
import { AppState, InternshipLog, AttainmentLevel, Artifact } from './types';

const STORAGE_KEY = 'internship_tracker_data';

const App: React.FC = () => {
  const [currentView, setView] = useState<string>('dashboard');
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      logs: [],
      artifacts: [],
      progress: {}
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

  const addArtifact = (artifact: Artifact) => {
    setState(prev => ({ ...prev, artifacts: [...prev.artifacts, artifact] }));
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard logs={state.logs} progress={state.progress} />;
      case 'logs':
        return <LogsView logs={state.logs} onAddLog={addLog} />;
      case 'competencies':
        return <CompetenciesView progress={state.progress} onUpdateProgress={updateProgress} />;
      case 'artifacts':
        return <ArtifactsView artifacts={state.artifacts} onAddArtifact={addArtifact} />;
      default:
        return <Dashboard logs={state.logs} progress={state.progress} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Desktop Sidebar */}
      <Sidebar currentView={currentView} setView={setView} />
      
      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8">
        {/* Mobile Mini Header */}
        <div className="md:hidden flex items-center justify-between mb-6">
           <h1 className="text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
             InternPro
           </h1>
           <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold border border-blue-200">
             BU
           </div>
        </div>

        {renderView()}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav currentView={currentView} setView={setView} />

      {/* Floating Action Button for Logs (Optional Enhancement for Mobile) */}
      {currentView !== 'logs' && (
        <div className="md:hidden fixed bottom-20 right-6 z-40">
          <button 
            onClick={() => setView('logs')}
            className="w-14 h-14 bg-blue-600 rounded-full shadow-lg shadow-blue-200 text-white flex items-center justify-center text-2xl hover:scale-105 active:scale-95 transition-all"
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
