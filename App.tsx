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
import { subscribeToAuthChanges, checkRedirectResult } from './authService';
import { User } from 'firebase/auth';
import logo from './bethel-logo.png';
import { register as registerSW } from './registerServiceWorker';
import { RefreshCw, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setView] = useState<string>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthInitializing, setIsAuthInitializing] = useState(true);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [state, setState] = useState<AppState>({
    logs: [],
    artifacts: [],
    progress: {},
    shelves: [],
    sites: [],
    competencyReflections: {},
    primarySetting: 'Secondary'
  });

  // Combined Auth and Initial Data Load
  useEffect(() => {
    // Register Service Worker for updates
    registerSW((registration) => {
      setSwRegistration(registration);
      setShowUpdateToast(true);
    });

    let isMounted = true;

    const initialize = async () => {
      console.log("App initializing...");
      try {
        // 1. Check for redirect result first (crucial for mobile/PWA)
        console.log("Checking redirect result...");
        const redirectUser = await checkRedirectResult();
        if (isMounted && redirectUser) {
          console.log("Redirect user found:", redirectUser.email);
          setUser(redirectUser);
        }

        // 2. Set up auth state listener
        console.log("Subscribing to auth changes...");
        const unsubscribe = subscribeToAuthChanges(async (currentUser) => {
          if (!isMounted) return;
          
          console.log("Auth state changed:", currentUser ? currentUser.email : "no user");
          setUser(currentUser);
          setIsAuthInitializing(false);

          // 3. Load data based on auth state or URL params
          const params = new URLSearchParams(window.location.search);
          const viewId = params.get('view');

          if (viewId) {
            console.log("Loading viewer mode data for:", viewId);
            setIsReadOnly(true);
            const sharedData = await loadStateFromFirestore(viewId);
            if (isMounted && sharedData) {
              setState(sharedData);
            }
            setIsLoading(false);
          } else if (currentUser) {
            console.log("Loading editor mode data for:", currentUser.uid);
            setIsReadOnly(false);
            const firestoreData = await loadStateFromFirestore(currentUser.uid);
            if (isMounted) {
              if (firestoreData) {
                // If we have existing data, make sure the profile is up to date
                setState({
                  ...firestoreData,
                  userProfile: {
                    displayName: currentUser.displayName,
                    email: currentUser.email,
                    photoURL: currentUser.photoURL
                  }
                });
              } else {
                // Initialize with user profile
                setState(prev => ({
                  ...prev,
                  userProfile: {
                    displayName: currentUser.displayName,
                    email: currentUser.email,
                    photoURL: currentUser.photoURL
                  }
                }));
              }
            }
            setIsLoading(false);
          } else {
            console.log("No user and no view ID, stopping loader.");
            setIsLoading(false);
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error("Initialization error:", error);
        if (isMounted) {
          setIsAuthInitializing(false);
          setIsLoading(false);
        }
      }
    };

    const authUnsubscribePromise = initialize();

    return () => {
      isMounted = false;
      authUnsubscribePromise.then(unsubscribe => unsubscribe && unsubscribe());
    };
  }, []);

  // Sync to Firestore (only if logged in and not read-only)
  // Uses a smart save strategy: 30s idle timeout + save on tab visibility change
  const pendingSaveRef = React.useRef(false);
  const lastSavedStateRef = React.useRef<string>('');

  const performSave = React.useCallback(async () => {
    if (isLoading || isAuthInitializing || isReadOnly || !user) return;

    // Skip if state hasn't changed since last save
    const currentStateJson = JSON.stringify(state);
    if (currentStateJson === lastSavedStateRef.current) return;

    pendingSaveRef.current = false;
    const result = await saveStateToFirestore(user.uid, state);
    if (!result.success) {
      setSaveError(result.error || "Failed to save data");
      setTimeout(() => setSaveError(null), 5000);
    } else {
      setSaveError(null);
      lastSavedStateRef.current = currentStateJson;
    }
  }, [state, isLoading, isAuthInitializing, isReadOnly, user]);

  // Idle timeout save (30 seconds after last change)
  useEffect(() => {
    if (isLoading || isAuthInitializing || isReadOnly || !user) return;

    pendingSaveRef.current = true;
    const timeoutId = setTimeout(() => {
      performSave();
    }, 30000); // 30 seconds - reduces writes by ~10x vs 3 seconds

    return () => clearTimeout(timeoutId);
  }, [state, isLoading, isAuthInitializing, isReadOnly, user, performSave]);

  // Save when user leaves the tab/app (mobile-optimized)
  // Uses multiple events for maximum reliability on iOS PWAs
  useEffect(() => {
    if (isReadOnly || !user) return;

    const triggerSave = () => {
      if (pendingSaveRef.current) {
        performSave();
      }
    };

    // visibilitychange: fires when switching tabs or apps
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        triggerSave();
      }
    };

    // pagehide: more reliable than beforeunload on iOS/mobile
    // Using capture phase ensures earliest possible execution
    const handlePageHide = () => {
      triggerSave();
    };

    // blur: fires when PWA loses focus (user taps outside)
    const handleBlur = () => {
      triggerSave();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide, { capture: true });
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide, { capture: true });
      window.removeEventListener('blur', handleBlur);
    };
  }, [performSave, isReadOnly, user]);

  const addLog = (log: InternshipLog) => {
    setState(prev => ({ ...prev, logs: [...prev.logs, log] }));
  };

  const updateLog = (updatedLog: InternshipLog) => {
    setState(prev => ({
      ...prev,
      logs: prev.logs.map(log => log.id === updatedLog.id ? updatedLog : log)
    }));
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

  const onUpdate = () => {
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage('skipWaiting');
    }
    setShowUpdateToast(false);
    window.location.reload();
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
        return (
          <LogsView 
            logs={state.logs} 
            onAddLog={addLog} 
            onUpdateLog={updateLog} 
            isReadOnly={isReadOnly} 
            userName={isReadOnly ? state.userProfile?.displayName : user?.displayName}
          />
        );
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
            user={user}
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
      <Sidebar 
        currentView={currentView} 
        setView={setView} 
        isReadOnly={isReadOnly} 
        userId={user?.uid} 
        user={isReadOnly ? state.userProfile : user}
      />
      
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
                <h1 className="text-lg font-black text-app-dark bg-gradient-to-r from-app-dark to-app-bright bg-clip-text text-transparent">
                  InternPro
                </h1>
              </div>
              <div className="flex items-center gap-3">
                {isReadOnly && (
                  <span className="bg-app-bright/10 text-app-bright text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest mr-2">Viewer Mode</span>
                )}
                {(isReadOnly ? state.userProfile : user) ? (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full border border-app-bright/20 p-0.5">
                      {(isReadOnly ? state.userProfile : user)?.photoURL ? (
                        <img src={(isReadOnly ? state.userProfile : user)?.photoURL || ''} alt="Profile" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <div className="w-full h-full rounded-full bg-app-bright/10 flex items-center justify-center text-app-bright font-black text-[10px]">
                          {(isReadOnly ? state.userProfile : user)?.displayName?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <span className="text-[10px] text-app-slate font-black uppercase tracking-widest opacity-70">Bethel University</span>
                )}
              </div>
            </div>

            {renderView()}
          </>
        )}
      </main>

      <BottomNav currentView={currentView} setView={setView} />

      {/* Update Notification Toast */}
      {showUpdateToast && (
        <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:bottom-8 z-[100] animate-in slide-in-from-bottom-5 duration-500">
          <div className="glass-dark p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-app-bright/20 flex items-center justify-center text-app-bright">
                <RefreshCw size={20} className="animate-spin-slow" />
              </div>
              <div>
                <p className="text-white text-sm font-bold">New Version Available</p>
                <p className="text-white/60 text-[10px] uppercase tracking-widest font-black">Updates are ready to install</p>
              </div>
            </div>
            <button
              onClick={onUpdate}
              className="bg-app-bright hover:bg-app-bright/90 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-app-bright/20"
            >
              Update Now
            </button>
          </div>
        </div>
      )}

      {/* Save Error Notification Toast */}
      {saveError && (
        <div className="fixed top-4 left-4 right-4 md:left-auto md:right-8 md:top-8 z-[100] animate-in slide-in-from-top-5 duration-500">
          <div className="bg-red-500/95 backdrop-blur-sm p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 border border-red-400/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                <AlertCircle size={20} />
              </div>
              <div>
                <p className="text-white text-sm font-bold">Save Failed</p>
                <p className="text-white/90 text-[10px] uppercase tracking-widest font-black">{saveError}</p>
              </div>
            </div>
            <button
              onClick={() => setSaveError(null)}
              className="text-white hover:bg-white/20 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

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