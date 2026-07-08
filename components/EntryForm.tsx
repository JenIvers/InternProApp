import React, { useMemo, useRef, useState } from 'react';
import { Artifact, InternshipLog, SchoolLevel, Site } from '../types';
import { validateEntry } from '@/lib/entry-validation';
import { uploadFileToStorage } from '../storageService';
import CompetencyPicker from './CompetencyPicker';
import SitePicker from './SitePicker';
import {
  Calendar, Clock, School, FileText, PencilLine, Link2, Paperclip,
  Plus, X, ChevronDown, ChevronUp, AlertTriangle, Save, Upload, Loader2, Library,
} from 'lucide-react';

export interface EntryFormProps {
  /** Pass an existing entry to edit it; omit to create a new one. */
  entry?: InternshipLog;
  logs: InternshipLog[];
  sites: Site[];
  artifacts: Artifact[];
  onAddSite: (site: Site) => void;
  onAddArtifact: (artifact: Artifact) => void;
  onSave: (entry: InternshipLog) => void;
  onCancel: () => void;
  isReadOnly?: boolean;
  /** Signed-in owner's uid — required for direct evidence uploads. */
  userId?: string | null;
}

const SCHOOL_LEVELS: SchoolLevel[] = ['Elementary', 'Intermediate', 'Middle', 'High School'];

/**
 * Collapsible section used for the non-essential parts of the entry form
 * (Description, Competencies, Evidence). Defined at module scope so it is a
 * stable component identity — nesting it inside EntryForm would remount its
 * children (and drop input focus) on every keystroke.
 */
const Section: React.FC<{
  title: string;
  icon?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  summary?: React.ReactNode;
  warn?: boolean;
  children: React.ReactNode;
}> = ({ title, icon, open, onToggle, summary, warn, children }) => (
  <div>
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="w-full flex items-center justify-between px-4 py-3 min-h-[48px] bg-white hover:bg-app-bg/40 transition-colors"
    >
      <span className="flex items-center gap-1.5 text-xs font-semibold text-app-slate">
        {icon} {title}
        {warn && (
          <span
            className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"
            title="Recommended — not yet filled in"
          />
        )}
      </span>
      <span className="flex items-center gap-2 text-[11px] font-bold text-app-slate/60">
        {!open && summary}
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </span>
    </button>
    {open && <div className="px-4 pb-4 pt-1 space-y-3 bg-white">{children}</div>}
  </div>
);

const makeEmptyEntry = (): InternshipLog => ({
  id: crypto.randomUUID(),
  date: new Date().toISOString().split('T')[0],
  startTime: '',
  endTime: '',
  hours: 1,
  title: '',
  activity: '',
  description: '',
  location: '',
  siteId: undefined,
  schoolLevel: 'Elementary',
  taggedCompetencyIds: [],
  primaryCompetencyId: undefined,
  hourSplit: undefined,
  evidenceLinks: [],
  reflections: '',
  artifactIds: [],
  meetingNotes: undefined,
});

const EntryForm: React.FC<EntryFormProps> = ({
  entry,
  logs,
  sites,
  artifacts,
  onAddSite,
  onAddArtifact,
  onSave,
  onCancel,
  isReadOnly,
  userId,
}) => {
  const isEdit = !!entry;
  const [form, setForm] = useState<InternshipLog>(() => entry ? { ...makeEmptyEntry(), ...entry } : makeEmptyEntry());
  const [meetingNotesOpen, setMeetingNotesOpen] = useState(!!entry?.meetingNotes);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [artifactPickerOpen, setArtifactPickerOpen] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick-capture: on a phone, a NEW entry collapses the non-essential sections
  // so the essentials (date, hours, title, level, location) are all that shows.
  // Editing an existing entry — or any desktop-width screen — starts expanded.
  const [sectionsDefaultOpen] = useState(() => {
    if (isEdit) return true;
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true;
    return !window.matchMedia('(max-width: 767px)').matches;
  });
  const [descriptionOpen, setDescriptionOpen] = useState(sectionsDefaultOpen);
  const [competenciesOpen, setCompetenciesOpen] = useState(sectionsDefaultOpen);
  const [evidenceOpen, setEvidenceOpen] = useState(sectionsDefaultOpen);

  const liveWarnings = useMemo(() => validateEntry(form), [form]);
  const hasDescWarning = liveWarnings.some(w => w.code === 'MISSING_DESCRIPTION');
  const hasCompWarning = liveWarnings.some(w => w.code === 'MISSING_COMPETENCY');
  const descFilled = !!((form.description ?? form.activity) || '').trim();
  const compCount = form.taggedCompetencyIds?.length ?? 0;
  const evidenceCount = (form.evidenceLinks?.length ?? 0) + (form.artifactIds?.length ?? 0);

  const updateField = <K extends keyof InternshipLog>(key: K, value: InternshipLog[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleCompetencyChange = (selectedIds: string[], primaryId?: string) => {
    setForm(prev => ({
      ...prev,
      taggedCompetencyIds: selectedIds,
      primaryCompetencyId: primaryId,
      meetingNotes: prev.meetingNotes
        ? { ...prev.meetingNotes, competencyIds: prev.meetingNotes.competencyIds }
        : prev.meetingNotes,
    }));
  };

  const handleSiteChange = (value: { siteId?: string; location?: string }) => {
    setForm(prev => ({ ...prev, siteId: value.siteId, location: value.location || '' }));
  };

  const addEvidenceLink = () => {
    if (!newLinkUrl.trim()) return;
    const link = { id: crypto.randomUUID(), label: newLinkLabel.trim() || newLinkUrl.trim(), url: newLinkUrl.trim() };
    setForm(prev => ({ ...prev, evidenceLinks: [...(prev.evidenceLinks || []), link] }));
    setNewLinkUrl('');
    setNewLinkLabel('');
  };

  const removeEvidenceLink = (id: string) => {
    setForm(prev => ({ ...prev, evidenceLinks: (prev.evidenceLinks || []).filter(l => l.id !== id) }));
  };

  const toggleArtifact = (id: string) => {
    setForm(prev => {
      const has = prev.artifactIds.includes(id);
      return { ...prev, artifactIds: has ? prev.artifactIds.filter(a => a !== id) : [...prev.artifactIds, id] };
    });
  };

  // Direct evidence upload: the file goes to Storage, becomes a library
  // artifact (so it also shows in the Portfolio Vault), and is attached to
  // this entry in one step. On iOS the plain file input natively offers
  // Take Photo / Photo Library / Choose File.
  const handleEvidenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!userId) {
      setUploadError('You must be signed in to upload files.');
      return;
    }
    setIsUploading(true);
    setUploadError(null);
    try {
      const artifactId = crypto.randomUUID();
      const result = await uploadFileToStorage(userId, file, artifactId);
      if (!result.success) {
        setUploadError(result.error || 'Upload failed.');
        return;
      }
      onAddArtifact({
        id: artifactId,
        name: file.name,
        type: file.type,
        data: result.url!, // Storage URL, not base64
        uploadDate: new Date().toLocaleDateString(),
        taggedCompetencyIds: form.taggedCompetencyIds,
        shelfId: undefined,
      });
      setForm(prev => ({ ...prev, artifactIds: [...prev.artifactIds, artifactId] }));
    } catch {
      setUploadError('An unexpected error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  const openMeetingNotes = () => {
    setMeetingNotesOpen(true);
    if (!form.meetingNotes) {
      setForm(prev => ({
        ...prev,
        meetingNotes: { competencyIds: prev.taggedCompetencyIds, reflection: '' },
      }));
    }
  };

  const closeMeetingNotes = () => {
    setMeetingNotesOpen(false);
    setForm(prev => ({ ...prev, meetingNotes: undefined }));
  };

  const doSave = () => {
    const finalEntry: InternshipLog = {
      ...form,
      description: form.description || form.activity,
      activity: form.activity || form.description || '',
    };
    onSave(finalEntry);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hasBlockingMissingPrimary = !form.primaryCompetencyId && (form.taggedCompetencyIds?.length ?? 0) === 0;
    if (hasBlockingMissingPrimary && !pendingConfirm) {
      setPendingConfirm(true);
      return;
    }
    doSave();
  };

  const confirmSaveAnyway = () => {
    setPendingConfirm(false);
    doSave();
  };

  if (isReadOnly) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-app-dark/10 text-sm font-semibold text-app-slate">
        Editing is disabled in read-only viewer mode.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white flex flex-col flex-1 min-h-0 md:rounded-2xl">
      {/* Header — pinned; respects the iOS safe-area inset */}
      <div className="shrink-0 border-b border-app-dark/10 px-5 md:px-8 pt-safe">
        <div className="flex items-center justify-between py-4">
          <h3 className="text-lg font-black text-app-dark">{isEdit ? 'Edit Activity' : 'New Activity'}</h3>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="-mr-2 p-2 rounded-lg text-app-slate/60 hover:text-app-dark hover:bg-app-bg transition-colors"
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 md:px-8 py-4 md:py-6 space-y-4 md:space-y-5">
      {/* Date / Hours / Level */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5 min-w-0">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-app-slate">
            <Calendar size={13} /> Date
          </label>
          <input
            type="date"
            required
            value={form.date}
            onChange={e => updateField('date', e.target.value)}
            className="w-full px-4 py-2.5 min-h-[44px] rounded-lg bg-app-bg border border-app-dark/10 outline-none focus:ring-2 focus:ring-app-bright/30 font-bold text-app-dark text-base"
          />
        </div>
        <div className="space-y-1.5 min-w-0">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-app-slate">
            <Clock size={13} /> Hours
          </label>
          <input
            type="number"
            required
            inputMode="decimal"
            step="0.25"
            min="0"
            value={form.hours}
            onChange={e => updateField('hours', parseFloat(e.target.value))}
            className="w-full px-4 py-2.5 min-h-[44px] rounded-lg bg-app-bg border border-app-dark/10 outline-none focus:ring-2 focus:ring-app-bright/30 font-bold text-app-dark text-base"
          />
        </div>
        <div className="space-y-1.5 min-w-0">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-app-slate">
            <School size={13} /> School Level
          </label>
          <div className="relative">
            <select
              value={form.schoolLevel}
              onChange={e => updateField('schoolLevel', e.target.value as SchoolLevel)}
              className="w-full px-4 py-2.5 min-h-[44px] rounded-lg bg-app-bg border border-app-dark/10 outline-none focus:ring-2 focus:ring-app-bright/30 font-bold text-app-dark text-base appearance-none cursor-pointer"
            >
              {SCHOOL_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-app-slate/50 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-app-slate">
          <PencilLine size={13} /> Title
        </label>
        <input
          type="text"
          value={form.title || ''}
          onChange={e => updateField('title', e.target.value)}
          placeholder="Brief title for this activity"
          className="w-full px-4 py-2.5 min-h-[44px] rounded-lg bg-app-bg border border-app-dark/10 outline-none focus:ring-2 focus:ring-app-bright/30 font-bold text-app-dark text-base"
        />
      </div>

      {/* Location */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-app-slate">Location</label>
        <SitePicker
          sites={sites}
          siteId={form.siteId}
          location={form.location}
          onChange={handleSiteChange}
          onAddSite={onAddSite}
          isReadOnly={isReadOnly}
        />
      </div>

      {/* Detail sections — one grouped container, hairline dividers between rows */}
      <div className="rounded-xl border border-app-dark/10 overflow-hidden divide-y divide-app-dark/10 bg-white">
      {/* Description (collapsible — soft-optional for quick capture) */}
      <Section
        title="Description"
        icon={<FileText size={13} />}
        open={descriptionOpen}
        onToggle={() => setDescriptionOpen(v => !v)}
        warn={hasDescWarning}
        summary={descFilled ? 'Added' : 'Add later'}
      >
        <textarea
          rows={4}
          value={form.description ?? form.activity}
          onChange={e => updateField('description', e.target.value)}
          placeholder="What did you do during this activity?"
          className="w-full px-4 py-2.5 min-h-[44px] rounded-lg bg-app-bg border border-app-dark/10 outline-none focus:ring-2 focus:ring-app-bright/30 font-medium text-app-dark text-base resize-none"
        />
      </Section>

      {/* Competencies (collapsible) */}
      <Section
        title="Competencies"
        open={competenciesOpen}
        onToggle={() => setCompetenciesOpen(v => !v)}
        warn={hasCompWarning}
        summary={compCount > 0 ? `${compCount} tagged` : 'None tagged'}
      >
        <CompetencyPicker
          selectedIds={form.taggedCompetencyIds}
          primaryId={form.primaryCompetencyId}
          onChange={handleCompetencyChange}
          logs={logs}
          hours={form.hours}
          hourSplit={form.hourSplit}
          onHourSplitChange={hourSplit => updateField('hourSplit', hourSplit as InternshipLog['hourSplit'])}
          isReadOnly={isReadOnly}
        />
      </Section>

      {/* Evidence: links + artifact attachments (collapsible) */}
      <Section
        title="Evidence"
        icon={<Link2 size={13} />}
        open={evidenceOpen}
        onToggle={() => setEvidenceOpen(v => !v)}
        summary={evidenceCount > 0 ? `${evidenceCount} attached` : 'Add later'}
      >
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-app-slate">
            <Link2 size={13} /> Evidence Links
          </label>
          {(form.evidenceLinks || []).map(link => (
            <div key={link.id} className="flex items-center justify-between gap-2 px-4 py-2.5 bg-app-bg rounded-xl border border-app-dark/10">
              <a href={link.url} target="_blank" rel="noreferrer" className="text-sm font-bold text-app-bright truncate hover:underline">
                {link.label}
              </a>
              <button type="button" onClick={() => removeEvidenceLink(link.id)} className="text-app-slate/50 hover:text-red-500 shrink-0">
                <X size={16} />
              </button>
            </div>
          ))}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newLinkLabel}
              onChange={e => setNewLinkLabel(e.target.value)}
              placeholder="Label (optional)"
              className="flex-1 min-w-0 px-3 py-3 rounded-lg bg-app-bg border border-app-dark/10 outline-none focus:ring-2 focus:ring-app-bright/30 text-base sm:text-sm font-semibold text-app-dark"
            />
            <input
              type="url"
              value={newLinkUrl}
              onChange={e => setNewLinkUrl(e.target.value)}
              placeholder="Paste a URL"
              className="flex-1 min-w-0 px-3 py-3 rounded-lg bg-app-bg border border-app-dark/10 outline-none focus:ring-2 focus:ring-app-bright/30 text-base sm:text-sm font-semibold text-app-dark"
            />
            <button
              type="button"
              onClick={addEvidenceLink}
              className="px-4 py-2.5 min-h-[44px] rounded-lg bg-app-dark text-white font-bold text-sm flex items-center justify-center gap-1.5 hover:bg-black transition-colors shrink-0"
            >
              <Plus size={14} /> Add
            </button>
          </div>
        </div>

        {/* File evidence: attached artifacts + library picker + direct upload */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-app-slate">
            <Paperclip size={13} /> Files &amp; Media
          </label>

          {/* Attached artifacts */}
          {form.artifactIds.map(id => {
            const artifact = artifacts.find(a => a.id === id);
            return (
              <div key={id} className="flex items-center justify-between gap-2 px-4 py-2.5 bg-app-bg rounded-xl border border-app-dark/10">
                <span className="text-sm font-bold text-app-dark truncate">
                  {artifact?.name ?? 'Attached file'}
                </span>
                <button
                  type="button"
                  onClick={() => toggleArtifact(id)}
                  aria-label="Detach"
                  className="text-app-slate/50 hover:text-red-500 shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
            );
          })}

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => setArtifactPickerOpen(v => !v)}
              disabled={artifacts.length === 0}
              className="flex-1 px-4 py-2.5 min-h-[44px] rounded-lg bg-app-bg border border-app-dark/10 text-sm font-bold text-app-dark flex items-center justify-center gap-1.5 hover:bg-app-bg/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Library size={15} /> From library
              {artifactPickerOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex-1 px-4 py-2.5 min-h-[44px] rounded-lg bg-app-bg border border-app-dark/10 text-sm font-bold text-app-dark flex items-center justify-center gap-1.5 hover:bg-app-bg/60 transition-colors disabled:opacity-60"
            >
              {isUploading
                ? <><Loader2 size={15} className="animate-spin" /> Uploading…</>
                : <><Upload size={15} /> Upload file</>}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,audio/*,application/pdf"
              onChange={handleEvidenceUpload}
              className="hidden"
            />
          </div>
          {artifacts.length === 0 && (
            <p className="text-[11px] font-semibold text-app-slate/60">
              Your library is empty — upload a file here and it&rsquo;s saved to your Portfolio Vault too.
            </p>
          )}
          {uploadError && (
            <p className="text-xs font-bold text-red-600">{uploadError}</p>
          )}

          {artifactPickerOpen && artifacts.length > 0 && (
            <div className="max-h-56 overflow-y-auto overscroll-contain border border-app-dark/10 rounded-xl divide-y divide-app-dark/5">
              {artifacts.map(artifact => {
                const isSelected = form.artifactIds.includes(artifact.id);
                return (
                  <button
                    key={artifact.id}
                    type="button"
                    onClick={() => toggleArtifact(artifact.id)}
                    className={`w-full text-left px-4 py-2.5 text-sm font-semibold flex items-center justify-between ${isSelected ? 'bg-app-bright/5 text-app-dark' : 'text-app-slate hover:bg-app-bg'}`}
                  >
                    <span className="truncate">{artifact.name}</span>
                    {isSelected && <span className="text-app-bright text-xs font-black shrink-0 ml-2">Attached</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Section>

      {/* Meeting notes (collapsible) */}
      <div>
        <button
          type="button"
          onClick={() => (meetingNotesOpen ? closeMeetingNotes() : openMeetingNotes())}
          aria-expanded={meetingNotesOpen}
          className="w-full flex items-center justify-between px-4 py-3 min-h-[48px] bg-white hover:bg-app-bg/40 transition-colors"
        >
          <span className="text-xs font-semibold text-app-slate">Meeting notes (optional)</span>
          <span className="text-app-slate/60">
            {meetingNotesOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </button>
        {meetingNotesOpen && form.meetingNotes && (
          <div className="px-4 pb-4 pt-1 space-y-3 bg-white">
            <p className="text-xs font-bold text-app-slate/70">
              Competencies discussed default to this entry&rsquo;s tags; adjust below if needed.
            </p>
            <CompetencyPicker
              selectedIds={form.meetingNotes.competencyIds}
              onChange={(ids) => setForm(prev => ({
                ...prev,
                meetingNotes: prev.meetingNotes ? { ...prev.meetingNotes, competencyIds: ids } : prev.meetingNotes,
              }))}
              logs={logs}
              isReadOnly={isReadOnly}
            />
            <textarea
              rows={3}
              value={form.meetingNotes.reflection}
              onChange={e => setForm(prev => ({
                ...prev,
                meetingNotes: prev.meetingNotes ? { ...prev.meetingNotes, reflection: e.target.value } : prev.meetingNotes,
              }))}
              placeholder="Reflection on growth from this meeting..."
              className="w-full px-4 py-3 rounded-xl bg-app-bg border border-app-dark/10 outline-none focus:ring-2 focus:ring-app-bright/30 font-medium text-app-dark text-sm resize-none"
            />
          </div>
        )}
      </div>
      </div>

      {/* Validation warnings */}
      {liveWarnings.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5">
          {liveWarnings.map(w => (
            <p key={w.code} className="flex items-start gap-2 text-xs font-bold text-amber-700">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" /> {w.message}
            </p>
          ))}
        </div>
      )}
      </div>

      {/* Footer — pinned above the iOS safe area; holds Save / the confirm prompt */}
      <div className="shrink-0 border-t border-app-dark/10 bg-white px-5 md:px-8 py-4 pb-safe">
        {pendingConfirm ? (
          <div className="space-y-3">
            <p className="text-sm font-bold text-red-700">
              This entry has no competency tagged or set as primary. Save anyway?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={confirmSaveAnyway}
                className="flex-1 min-h-[44px] py-2.5 rounded-lg bg-red-600 text-white font-bold text-sm active:scale-[0.99] transition-transform"
              >
                Save anyway
              </button>
              <button
                type="button"
                onClick={() => setPendingConfirm(false)}
                className="flex-1 min-h-[44px] py-2.5 rounded-lg bg-white border border-app-dark/10 text-app-dark font-bold text-sm"
              >
                Go back
              </button>
            </div>
          </div>
        ) : (
          <button
            type="submit"
            className="w-full min-h-[48px] py-3 bg-app-dark text-white rounded-lg font-bold text-sm shadow-md flex items-center justify-center gap-2 hover:bg-black active:scale-[0.99] transition-all"
          >
            <Save size={18} /> {isEdit ? 'Update entry' : 'Save entry'}
          </button>
        )}
      </div>
    </form>
  );
};

export default EntryForm;
