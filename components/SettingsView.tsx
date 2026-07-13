import React, { useState } from 'react';
import { AppState, AppSettings, LevelBucket } from '../types';
import { Settings as SettingsIcon, User, Download, Save, ShieldCheck, LogOut } from 'lucide-react';
import { signOut } from '../authService';

export interface SettingsViewProps {
  appState: AppState;
  settings: AppSettings;
  userProfile?: AppState['userProfile'];
  onUpdateSettings: (settings: AppSettings) => void;
  isReadOnly: boolean;
}

const LEVEL_BUCKET_OPTIONS: { value: LevelBucket; label: string }[] = [
  { value: 'HighSchool', label: 'High School' },
  { value: 'Elementary', label: 'Elementary' },
  { value: 'Middle', label: 'Middle' },
];

const SettingsView: React.FC<SettingsViewProps> = ({ appState, settings, userProfile, onUpdateSettings, isReadOnly }) => {
  const [draft, setDraft] = useState<AppSettings>(settings);
  const [saved, setSaved] = useState(false);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(settings);

  const handleTargetChange = (field: keyof AppSettings['targets'], value: string) => {
    const num = Number(value);
    setDraft(prev => ({
      ...prev,
      targets: {
        ...prev.targets,
        [field]: Number.isFinite(num) ? Math.max(0, num) : 0,
      },
    }));
    setSaved(false);
  };

  const handlePrimaryBucketChange = (value: LevelBucket) => {
    setDraft(prev => ({ ...prev, primaryLevelBucket: value }));
    setSaved(false);
  };

  const handleSave = () => {
    if (isReadOnly) return;
    onUpdateSettings(draft);
    setSaved(true);
  };

  const handleDownloadData = () => {
    const json = JSON.stringify(appState, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const datestamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `internpro-backup-${datestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 md:max-w-3xl">
      <header className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-app-bright/10">
          <SettingsIcon className="text-app-bright" size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-app-dark tracking-tight">Settings</h1>
          <p className="text-app-slate text-sm font-medium opacity-70">Manage your requirement targets and profile.</p>
        </div>
      </header>

      {/* Profile */}
      <section className="bg-white border border-app-slate/15 rounded-xl p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <User size={18} className="text-app-bright" />
          <h2 className="text-lg font-bold text-app-dark">Profile</h2>
        </div>
        <div className="flex items-center gap-4">
          {userProfile?.photoURL ? (
            <img src={userProfile.photoURL} alt="Profile" className="w-14 h-14 rounded-full object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-app-slate/20 flex items-center justify-center text-app-dark font-bold text-xl">
              {userProfile?.displayName?.charAt(0) || '?'}
            </div>
          )}
          <div>
            <p className="font-semibold text-app-dark">{userProfile?.displayName || 'Unknown user'}</p>
            <p className="text-sm text-app-slate opacity-80">{userProfile?.email || '—'}</p>
          </div>
        </div>
      </section>

      {/* Targets */}
      <section className="bg-white border border-app-slate/15 rounded-xl p-4 sm:p-6 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck size={18} className="text-app-bright" />
          <h2 className="text-lg font-bold text-app-dark">Requirement targets</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="min-w-0">
            <label className="block text-xs font-semibold text-app-slate mb-1">
              Primary level
            </label>
            <select
              value={draft.primaryLevelBucket}
              onChange={e => handlePrimaryBucketChange(e.target.value as LevelBucket)}
              disabled={isReadOnly}
              className="w-full min-h-[44px] rounded-lg border border-app-slate/15 bg-white px-3 py-2.5 text-base sm:text-sm text-app-dark outline-none focus:ring-2 focus:ring-app-bright/30 disabled:opacity-60"
            >
              {LEVEL_BUCKET_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <label className="block text-xs font-semibold text-app-slate mb-1">
              Intermediate maps to
            </label>
            <input
              type="text"
              value="Elementary"
              disabled
              readOnly
              className="w-full min-h-[44px] rounded-lg border border-app-slate/15 bg-app-slate/5 px-3 py-2 text-sm text-app-slate"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="min-w-0">
            <label className="block text-xs font-semibold text-app-slate mb-1">
              Total hours
            </label>
            <input
              type="number"
              min={0}
              value={draft.targets.total}
              onChange={e => handleTargetChange('total', e.target.value)}
              disabled={isReadOnly}
              className="w-full min-h-[44px] rounded-lg border border-app-slate/15 bg-white px-3 py-2.5 text-base sm:text-sm text-app-dark outline-none focus:ring-2 focus:ring-app-bright/30 disabled:opacity-60"
            />
          </div>
          <div className="min-w-0">
            <label className="block text-xs font-semibold text-app-slate mb-1">
              Primary level hours
            </label>
            <input
              type="number"
              min={0}
              value={draft.targets.primary}
              onChange={e => handleTargetChange('primary', e.target.value)}
              disabled={isReadOnly}
              className="w-full min-h-[44px] rounded-lg border border-app-slate/15 bg-white px-3 py-2.5 text-base sm:text-sm text-app-dark outline-none focus:ring-2 focus:ring-app-bright/30 disabled:opacity-60"
            />
          </div>
          <div className="min-w-0">
            <label className="block text-xs font-semibold text-app-slate mb-1">
              Each other level hours
            </label>
            <input
              type="number"
              min={0}
              value={draft.targets.others}
              onChange={e => handleTargetChange('others', e.target.value)}
              disabled={isReadOnly}
              className="w-full min-h-[44px] rounded-lg border border-app-slate/15 bg-white px-3 py-2.5 text-base sm:text-sm text-app-dark outline-none focus:ring-2 focus:ring-app-bright/30 disabled:opacity-60"
            />
          </div>
        </div>

        {!isReadOnly && (
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleSave}
              disabled={!isDirty}
              className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-lg bg-app-dark text-white text-sm font-semibold hover:bg-app-deep transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              Save settings
            </button>
            {saved && !isDirty && (
              <span className="text-sm text-app-bright font-medium">Saved.</span>
            )}
          </div>
        )}
      </section>

      {/* Data backup */}
      <section className="bg-white border border-app-slate/15 rounded-xl p-4 sm:p-6 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Download size={18} className="text-app-bright" />
          <h2 className="text-lg font-bold text-app-dark">Data backup</h2>
        </div>
        <p className="text-sm text-app-slate opacity-80">
          Download a complete copy of your portfolio data as a JSON file for your own records.
        </p>
        <button
          onClick={handleDownloadData}
          className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-lg border border-app-slate/15 text-app-dark text-sm font-semibold hover:bg-app-slate/5 transition-colors"
        >
          <Download size={16} />
          Download my data (JSON)
        </button>
      </section>

      {/* Account */}
      {!isReadOnly && (
        <section className="bg-white border border-app-slate/15 rounded-xl p-4 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <LogOut size={18} className="text-app-bright" />
            <h2 className="text-lg font-bold text-app-dark">Account</h2>
          </div>
          <p className="text-sm text-app-slate opacity-80">
            Signed in as <span className="font-semibold text-app-dark">{userProfile?.email || 'this account'}</span>. Sign out to switch to a different Google account.
          </p>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-lg border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </section>
      )}
    </div>
  );
};

export default SettingsView;
