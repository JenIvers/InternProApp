import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import DashboardNew from './components/DashboardNew';
import LogTable from './components/LogTable';
import CoverageView from './components/CoverageView';
import ChecklistsView from './components/ChecklistsView';
import ArtifactsView from './components/ArtifactsView';
import SettingsView from './components/SettingsView';
import EntryForm from './components/EntryForm';
import ExportDialog from './components/ExportDialog';
import LoginView from './components/LoginView';
import {
  AppState, InternshipLog, Artifact, Shelf, Site,
  AppSettings, AppChecklists, SchoolLevel, LevelBucket,
} from './types';
import { loadStateWithMigration, saveStateToFirestore } from './firestoreService';
import { CURRENT_SCHEMA_VERSION } from '@/lib/state-migration';
import { bucketForLevel } from '@/lib/export-model';
import { ALL_COMPETENCIES } from './constants';
import { subscribeToAuthChanges, checkRedirectResult } from './authService';
import { User } from 'firebase/auth';
import logo from './bethel-logo.png';
import { register as registerSW } from './registerServiceWorker';
import { useBodyScrollLock } from './useBodyScrollLock';
import { RefreshCw, AlertCircle, Plus } from 'lucide-react';

/** Fallback requirement settings for brand-new portfolios (Jen's config). */
const DEFAULT_SETTINGS: AppSettings = {
  primaryLevelBucket: 'HighSchool',
  intermediateMapsTo: 'Elementary',
  targets: { total: 320, primary: 240, others: 40 },
};

const EMPTY_CHECKLISTS: AppChecklists = { suggestedActivities: {}, deliverables: {} };

const App: React.FC = () => {
  const [currentView, setViewRaw] = useState<string>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthInitializing, setIsAuthInitializing] = useState(true);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [needsPrimaryReview, setNeedsPrimaryReview] = useState<string[]>([]);

  // Cross-view jump: competency id to pre-seed the log table's filter.
  const [logPrefilterCompetencyId, setLogPrefilterCompetencyId] = useState<string | undefined>(undefined);
  // Cross-view jump: pre-enable the log table's "Incomplete only" filter.
  const [logPrefilterIncomplete, setLogPrefilterIncomplete] = useState(false);
  // Cross-view jump: school levels to pre-seed the log table's level filter
  // (plural: a requirement bucket can span levels, e.g. Elementary + Intermediate).
  const [logPrefilterLevels, setLogPrefilterLevels] = useState<SchoolLevel[] | undefined>(undefined);

  // Entry editor (modal) — open with an entry to edit, or undefined to create.
  const [editor, setEditor] = useState<{ open: boolean; entry?: InternshipLog }>({ open: false });

  // Export dialog.
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFilteredLogs, setExportFilteredLogs] = useState<InternshipLog[] | undefined>(undefined);

  // Lock background scroll while a full-screen sheet/modal owns the viewport,
  // so the page underneath can't rubber-band on mobile.
  useBodyScrollLock(editor.open || exportOpen);

  const [state, setState] = useState<AppState>({
    schemaVersion: CURRENT_SCHEMA_VERSION,
    logs: [],
    artifacts: [],
    progress: {},
    shelves: [],
    sites: [],
    competencyReflections: {},
    primarySetting: 'Secondary',
    settings: DEFAULT_SETTINGS,
    checklists: EMPTY_CHECKLISTS,
  });

  // Navigate via the nav bars: clears any cross-view log prefilters.
  const setView = (view: string) => {
    setLogPrefilterCompetencyId(undefined);
    setLogPrefilterIncomplete(false);
    setLogPrefilterLevels(undefined);
    setViewRaw(view);
  };

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
            const { state: sharedData } = await loadStateWithMigration(viewId, { readOnly: true });
            if (isMounted && sharedData) {
              setState(sharedData);
            }
            setIsLoading(false);
          } else if (currentUser) {
            console.log("Loading editor mode data for:", currentUser.uid);
            setIsReadOnly(false);
            const { state: firestoreData, needsPrimaryReview: review } =
              await loadStateWithMigration(currentUser.uid);
            if (isMounted) {
              setNeedsPrimaryReview(review);
              if (firestoreData) {
                // If we have existing data, make sure the profile is up to date
                setState({
                  ...firestoreData,
                  userProfile: {
                    displayName: currentUser.displayName,
                    email: currentUser.email,
                    photoURL: currentUser.photoURL,
                  },
                });
              } else {
                // Initialize with user profile
                setState(prev => ({
                  ...prev,
                  userProfile: {
                    displayName: currentUser.displayName,
                    email: currentUser.email,
                    photoURL: currentUser.photoURL,
                  },
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
  useEffect(() => {
    if (isReadOnly || !user) return;

    const triggerSave = () => {
      if (pendingSaveRef.current) {
        performSave();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        triggerSave();
      }
    };
    const handlePageHide = () => triggerSave();
    const handleBlur = () => triggerSave();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide, { capture: true });
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide, { capture: true });
      window.removeEventListener('blur', handleBlur);
    };
  }, [performSave, isReadOnly, user]);

  // ---- Log CRUD -----------------------------------------------------------
  const updateLog = (updatedLog: InternshipLog) => {
    setState(prev => ({
      ...prev,
      logs: prev.logs.map(log => log.id === updatedLog.id ? updatedLog : log),
    }));
  };

  const deleteLog = (id: string) => {
    setState(prev => ({ ...prev, logs: prev.logs.filter(log => log.id !== id) }));
    setNeedsPrimaryReview(prev => prev.filter(rid => rid !== id));
  };

  // Save from the EntryForm modal: add when new, update when the id already exists.
  const saveEntry = (entry: InternshipLog) => {
    setState(prev => {
      const exists = prev.logs.some(l => l.id === entry.id);
      return {
        ...prev,
        logs: exists
          ? prev.logs.map(l => (l.id === entry.id ? entry : l))
          : [...prev.logs, entry],
      };
    });
    // A saved entry has been reviewed — clear it from the migration review list.
    setNeedsPrimaryReview(prev => prev.filter(rid => rid !== entry.id));
    setEditor({ open: false });
  };

  const openNewEntry = () => setEditor({ open: true, entry: undefined });
  const openEditEntry = (log: InternshipLog) => setEditor({ open: true, entry: log });
  const closeEditor = () => setEditor({ open: false });

  const handleReviewEntry = (logId: string) => {
    const log = state.logs.find(l => l.id === logId);
    if (log) openEditEntry(log);
  };

  // ---- Settings / checklists ---------------------------------------------
  const updateSettings = (settings: AppSettings) => {
    setState(prev => ({ ...prev, settings }));
  };

  const updateChecklists = (checklists: AppChecklists) => {
    setState(prev => ({ ...prev, checklists }));
  };

  // ---- Artifacts / shelves / sites ---------------------------------------
  const addArtifact = (artifact: Artifact) => {
    setState(prev => ({ ...prev, artifacts: [...prev.artifacts, artifact] }));
  };

  const updateArtifact = (updated: Artifact) => {
    setState(prev => ({
      ...prev,
      artifacts: prev.artifacts.map(a => a.id === updated.id ? updated : a),
    }));
  };

  const addShelf = (name: string) => {
    const newShelf: Shelf = { id: crypto.randomUUID(), name };
    setState(prev => ({ ...prev, shelves: [...prev.shelves, newShelf] }));
  };

  const addSite = (site: Site) => {
    setState(prev => ({ ...prev, sites: [...prev.sites, site] }));
  };

  // ---- Export -------------------------------------------------------------
  const handleExportFiltered = (filtered: InternshipLog[]) => {
    setExportFilteredLogs(filtered);
    setExportOpen(true);
  };

  // ---- Cross-view jump ----------------------------------------------------
  const handleViewCompetencyLogs = (competencyId: string) => {
    setLogPrefilterIncomplete(false);
    setLogPrefilterLevels(undefined);
    setLogPrefilterCompetencyId(competencyId);
    setViewRaw('logs');
  };

  // Jump to the Activity Log with the "Incomplete only" filter pre-enabled.
  const handleViewIncompleteLogs = () => {
    setLogPrefilterCompetencyId(undefined);
    setLogPrefilterIncomplete(true);
    setLogPrefilterLevels(undefined);
    setViewRaw('logs');
  };

  // Jump to the Activity Log filtered to a requirement bucket (from a
  // Dashboard stat tile). Filters to every school level that folds into that
  // bucket — per settings, Intermediate maps into Elementary for Jen — so the
  // tile's hours and the filtered list always agree.
  const handleViewLevelLogs = (bucket: LevelBucket) => {
    const ALL_LEVELS: SchoolLevel[] = ['Elementary', 'Intermediate', 'Middle', 'High School'];
    const levels = ALL_LEVELS.filter(l => bucketForLevel(l, settings) === bucket);
    setLogPrefilterCompetencyId(undefined);
    setLogPrefilterIncomplete(false);
    setLogPrefilterLevels(levels);
    setViewRaw('logs');
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

  const settings = state.settings ?? DEFAULT_SETTINGS;
  const authorName = isReadOnly ? state.userProfile?.displayName : user?.displayName;

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardNew
            logs={state.logs}
            competencies={ALL_COMPETENCIES}
            settings={settings}
            needsPrimaryReview={needsPrimaryReview}
            onReviewEntry={handleReviewEntry}
            onReviewIncomplete={handleViewIncompleteLogs}
            onViewLevelLogs={handleViewLevelLogs}
            onOpenCoverage={() => setView('coverage')}
            isReadOnly={isReadOnly}
          />
        );
      case 'logs':
        return (
          <div className="space-y-4 pb-20 md:pb-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-app-dark tracking-tight">Activity Log</h2>
                <p className="text-app-slate text-sm">Search, sort, and total your internship entries.</p>
              </div>
              {/* Export lives in the log toolbar; on mobile the bottom-nav "+" adds
                  entries, so the header button appears only on md+. */}
              {!isReadOnly && (
                <button
                  onClick={openNewEntry}
                  className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-lg bg-app-dark text-white text-xs font-bold hover:bg-app-deep transition-all shadow-sm"
                >
                  <Plus size={16} strokeWidth={2.5} /> Add entry
                </button>
              )}
            </div>
            <LogTable
              logs={state.logs}
              sites={state.sites}
              isReadOnly={isReadOnly}
              onUpdateLog={updateLog}
              onEditEntry={openEditEntry}
              onDeleteLog={deleteLog}
              onExportFiltered={handleExportFiltered}
              initialCompetencyId={logPrefilterCompetencyId}
              initialIncompleteOnly={logPrefilterIncomplete}
              initialLevels={logPrefilterLevels}
            />
          </div>
        );
      case 'coverage':
        return (
          <CoverageView
            logs={state.logs}
            competencies={ALL_COMPETENCIES}
            isReadOnly={isReadOnly}
            onViewCompetencyLogs={handleViewCompetencyLogs}
          />
        );
      case 'checklists':
        return (
          <ChecklistsView
            checklists={state.checklists ?? EMPTY_CHECKLISTS}
            logs={state.logs}
            isReadOnly={isReadOnly}
            onUpdateChecklists={updateChecklists}
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
      case 'settings':
        return (
          <SettingsView
            appState={state}
            settings={settings}
            userProfile={state.userProfile}
            onUpdateSettings={updateSettings}
            isReadOnly={isReadOnly}
          />
        );
      default:
        return (
          <DashboardNew
            logs={state.logs}
            competencies={ALL_COMPETENCIES}
            settings={settings}
            needsPrimaryReview={needsPrimaryReview}
            onReviewEntry={handleReviewEntry}
            onReviewIncomplete={handleViewIncompleteLogs}
            onViewLevelLogs={handleViewLevelLogs}
            onOpenCoverage={() => setView('coverage')}
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
               <p className="text-app-slate font-semibold text-xs">
                 {isReadOnly ? 'Loading Portfolio...' : 'Syncing Portfolio...'}
               </p>
            </div>
          </div>
        ) : (
          <>
            <div className="md:hidden flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <img src={logo} alt="Bethel" className="w-10 h-10 object-contain" />
                <h1 className="text-lg font-black text-app-dark">
                  InternPro
                </h1>
              </div>
              <div className="flex items-center gap-3">
                {isReadOnly && (
                  <span className="bg-app-bright/10 text-app-bright text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide mr-2">Viewer Mode</span>
                )}
                {(isReadOnly ? state.userProfile : user) ? (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full border border-app-bright/20 p-0.5">
                      {(isReadOnly ? state.userProfile : user)?.photoURL ? (
                        <img src={(isReadOnly ? state.userProfile : user)?.photoURL || ''} alt="Profile" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <div className="w-full h-full rounded-full bg-app-bright/10 flex items-center justify-center text-app-bright font-bold text-[10px]">
                          {(isReadOnly ? state.userProfile : user)?.displayName?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <span className="text-[10px] text-app-slate font-semibold uppercase tracking-wide opacity-70">Bethel University</span>
                )}
              </div>
            </div>

            {renderView()}
          </>
        )}
      </main>

      <BottomNav currentView={currentView} setView={setView} onAdd={openNewEntry} isReadOnly={isReadOnly} />

      {/* Entry editor modal — full-screen sheet on mobile, centered card on desktop */}
      {editor.open && (
        <div className="fixed inset-0 z-[80] bg-app-dark/40 flex md:items-center md:justify-center md:p-6 md:overflow-y-auto">
          <div className="bg-white w-full md:max-w-2xl md:rounded-2xl md:my-6 shadow-2xl flex flex-col h-dvh md:h-auto md:max-h-[90vh] overflow-hidden">
            <EntryForm
              entry={editor.entry}
              logs={state.logs}
              sites={state.sites}
              artifacts={state.artifacts}
              onAddSite={addSite}
              onAddArtifact={addArtifact}
              onSave={saveEntry}
              onCancel={closeEditor}
              isReadOnly={isReadOnly}
              userId={user?.uid}
            />
          </div>
        </div>
      )}

      {/* Export dialog */}
      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        logs={state.logs}
        filteredLogs={exportFilteredLogs}
        settings={settings}
        authorName={authorName}
        isReadOnly={false}
      />

      {/* Update Notification Toast */}
      {showUpdateToast && (
        <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:bottom-8 z-[100] animate-in slide-in-from-bottom-5 duration-500">
          <div className="bg-app-dark text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 border border-app-slate/15">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-app-bright/20 flex items-center justify-center text-app-bright">
                <RefreshCw size={20} className="animate-spin-slow" />
              </div>
              <div>
                <p className="text-white text-sm font-bold">New Version Available</p>
                <p className="text-white/60 text-[10px] font-medium">Updates are ready to install</p>
              </div>
            </div>
            <button
              onClick={onUpdate}
              className="bg-white hover:bg-app-bg text-app-dark px-5 py-2.5 min-h-[44px] rounded-lg text-sm font-bold transition-colors active:scale-95 shadow-sm"
            >
              Update Now
            </button>
          </div>
        </div>
      )}

      {/* Save Error Notification Toast */}
      {saveError && (
        <div className="fixed top-4 left-4 right-4 md:left-auto md:right-8 md:top-8 z-[100] animate-in slide-in-from-top-5 duration-500">
          <div className="bg-red-500 p-4 rounded-xl shadow-2xl flex items-center justify-between gap-4 border border-red-400/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                <AlertCircle size={20} />
              </div>
              <div>
                <p className="text-white text-sm font-bold">Save Failed</p>
                <p className="text-white/90 text-[10px] font-semibold">{saveError}</p>
              </div>
            </div>
            <button
              onClick={() => setSaveError(null)}
              className="text-white hover:bg-white/20 px-3 py-2 rounded-lg text-xs font-bold transition-all active:scale-95"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
