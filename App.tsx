import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import LogsView from './components/LogsView';
import CompetenciesView from './components/CompetenciesView';
import ArtifactsView from './components/ArtifactsView';
import SitesView from './components/SitesView';
import LoginView from './components/LoginView';
import { AppState, InternshipLog, AttainmentLevel, Artifact, Shelf, Site } from './types';
import { loadStateFromFirestore, saveStateToFirestore } from './firestoreService';
import { subscribeToAuthChanges } from './authService';
import { User } from 'firebase/auth';
import logo from './bethel-logo.png';

const App: React.FC = () => {
  const [currentView, setView] = useState<string>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [state, setState] = useState<AppState>({
    logs: [],
    artifacts: [],
    progress: {},
    shelves: [],
    sites: [],
    competencyReflections: {},
    primarySetting: 'Secondary'
  });

  // Auth Subscription
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Initial Data Load
  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams(window.location.search);
        const viewId = params.get('view');
        
        // Viewer Mode: Load data from the ID in URL
        if (viewId) {
          setIsReadOnly(true);
          const sharedData = await loadStateFromFirestore(viewId);
          if (sharedData) {
            setState(sharedData);
            setIsLoading(false);
            return;
          }
        }

        // Editor Mode: Load data for logged-in user
        if (user) {
          setIsReadOnly(false);
          const firestoreData = await loadStateFromFirestore(user.uid);
          if (firestoreData) {
            setState(firestoreData);
          } 
          // New user? Could fall back to empty state (already set) or localStorage migration if needed
        }
      } catch (error) {
        console.error("Failed to initialize data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Only run if we are NOT waiting for auth (i.e. we either have a user, or we know we are in view mode, or we are sure no user is logged in)
    // Actually, onAuthStateChanged fires initially, so 'user' state update will trigger this if we depend on [user].
    // But we need to handle the "initial load" specifically.
    if (user || window.location.search) {
        initData();
    } else {
        // No user, no view param. 
        setIsLoading(false);
    }
  }, [user]);

  // Sync to Firestore (only if logged in and not read-only)
  useEffect(() => {
    if (isLoading || isReadOnly || !user) return;

    const timeoutId = setTimeout(() => {
      saveStateToFirestore(user.uid, state);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [state, isLoading, isReadOnly, user]);

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

  if (!user && !isReadOnly && !isLoading) {
    return <LoginView />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            logs={state.logs} 
            progress={state.progress} 
            primarySetting={state.primarySetting}
            onSetPrimarySetting={setPrimarySetting}
            isReadOnly={isReadOnly}
          />
        );
      case 'logs':
        return <LogsView logs={state.logs} onAddLog={addLog} isReadOnly={isReadOnly} />;
      case 'competencies':
        return (
          <CompetenciesView 
            progress={state.progress} 
            logs={state.logs} 
            artifacts={state.artifacts}
            competencyReflections={state.competencyReflections}
            onUpdateProgress={updateProgress}
            onUpdateReflection={updateCompetencyReflection}
            isReadOnly={isReadOnly}
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
            isReadOnly={isReadOnly}
          />
        );
      case 'sites':
        return (
          <SitesView 
            sites={state.sites}
            onAddSite={addSite}
            onRemoveSite={removeSite}
            isReadOnly={isReadOnly}
          />
        );
      default:
        return (
          <Dashboard 
            logs={state.logs} 
            progress={state.progress} 
            primarySetting={state.primarySetting}
            onSetPrimarySetting={setPrimarySetting}
            isReadOnly={isReadOnly}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar currentView={currentView} setView={setView} isReadOnly={isReadOnly} userId={user?.uid} />
      
      <main className="flex-1 md:ml-64 p-4 md:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
               <div className="w-12 h-12 border-4 border-app-bright border-t-transparent rounded-full animate-spin"></div>
               <p className="text-app-slate font-black uppercase tracking-widest text-xs">
                 {isReadOnly ? 'Loading Portfolio...' : 'Syncing Portfolio...'}
               </p>
            </div>
          </div>
        ) : (
          <>
            <div className="md:hidden flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <img src={logo} alt="Bethel" className="w-10 h-10 object-contain" />
                <h1 className="text-lg font-black bg-gradient-to-r from-[#162D34] to-[#4587A7] bg-clip-text text-transparent">
                  InternPro
                </h1>
              </div>
              <div className="flex items-center gap-2 text-right">
                {isReadOnly && (
                  <span className="bg-app-bright/10 text-app-bright text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest mr-2">Viewer Mode</span>
                )}
                <span className="text-[10px] text-app-slate font-black uppercase tracking-widest opacity-70">Bethel University</span>
              </div>
            </div>

            {renderView()}
          </>
        )}
      </main>

      <BottomNav currentView={currentView} setView={setView} />

      {!isReadOnly && (currentView === 'dashboard' || currentView === 'sites') && (
        <div className="md:hidden fixed bottom-20 right-6 z-40">
          <button 
            onClick={() => setView('logs')}
            className="w-14 h-14 bg-[#162D34] rounded-2xl shadow-xl shadow-[#162D3433] text-white flex items-center justify-center text-2xl active:scale-95 transition-all"
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