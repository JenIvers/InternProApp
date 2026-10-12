import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ImageUp, Trash2, X, Loader } from 'lucide-react';
import type { Mentor, MentorCardText, Site } from '../types';
import MentorPhoto from './MentorPhoto';
import { resizeImageToJpeg } from '../imageUtils';
import { useBodyScrollLock } from '../useBodyScrollLock';

interface MentorEditorProps {
  /** The mentor being edited (a blank draft for a new one). */
  mentor: Mentor;
  isNew: boolean;
  sites: Site[];
  canMoveEarlier: boolean;
  canMoveLater: boolean;
  /** Called with the edited mentor and, if the photo changed, the new JPEG. */
  onSave: (mentor: Mentor, newPhoto: Blob | null) => Promise<string | null>;
  onDelete: () => void;
  onMove: (delta: -1 | 1) => void;
  onClose: () => void;
}

const inputClass =
  'w-full px-4 py-2.5 min-h-[44px] rounded-lg bg-app-bg border border-app-slate/15 outline-none focus:ring-2 focus:ring-app-bright/30 font-medium text-app-dark text-base';
const labelClass = 'block text-xs font-semibold text-app-slate mb-1.5';

const CARD_TEXT_OPTIONS: { value: MentorCardText; label: string }[] = [
  { value: 'quote', label: 'Their lesson (quote)' },
  { value: 'bio', label: 'First sentence of bio' },
  { value: 'hours', label: 'Hours together' },
];

const clamp = (n: number) => Math.min(100, Math.max(0, n));

/**
 * Side drawer (bottom sheet on mobile) for adding or editing a mentor. Mount it
 * fresh per mentor (key by id) — the draft is seeded from props once.
 */
const MentorEditor: React.FC<MentorEditorProps> = ({
  mentor, isNew, sites, canMoveEarlier, canMoveLater, onSave, onDelete, onMove, onClose,
}) => {
  useBodyScrollLock(true);
  const [draft, setDraft] = useState<Mentor>(mentor);
  const [newPhoto, setNewPhoto] = useState<{ blob: Blob; url: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; fx: number; fy: number } | null>(null);

  // Release the local preview's object URL when it is replaced or the drawer closes.
  const previewUrl = newPhoto?.url;
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const set = <K extends keyof Mentor>(key: K, value: Mentor[K]) =>
    setDraft(prev => ({ ...prev, [key]: value }));

  const hasPhoto = !!(newPhoto?.url ?? draft.photoUrl);
  const zoom = draft.photoZoom ?? 1;
  const focus = draft.photoFocus ?? { x: 50, y: 25 };

  const handlePickPhoto = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      const blob = await resizeImageToJpeg(file);
      setNewPhoto({ blob, url: URL.createObjectURL(blob) });
      setDraft(prev => ({ ...prev, photoFocus: { x: 50, y: 25 }, photoZoom: 1 }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "That image couldn't be read.");
    }
  };

  // Drag the portrait inside its frame to choose which part stays in view.
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!hasPhoto) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, fx: focus.x, fy: focus.y };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = dragRef.current;
    const frame = frameRef.current;
    if (!start || !frame) return;
    const rect = frame.getBoundingClientRect();
    // Dragging the image right means showing more of its left side.
    const nx = clamp(start.fx - ((e.clientX - start.x) / rect.width) * 100);
    const ny = clamp(start.fy - ((e.clientY - start.y) / rect.height) * 100);
    setDraft(prev => ({ ...prev, photoFocus: { x: nx, y: ny } }));
  };
  const endDrag = () => { dragRef.current = null; };

  const handleSave = async () => {
    if (!draft.name.trim()) {
      setError('Add the mentor’s name.');
      return;
    }
    setBusy(true);
    setError(null);
    const failure = await onSave(
      { ...draft, name: draft.name.trim(), title: draft.title.trim(), organization: draft.organization.trim() },
      newPhoto?.blob ?? null
    );
    setBusy(false);
    if (failure) setError(failure);
  };

  return (
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-app-dark/40" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={isNew ? 'Add mentor' : 'Edit mentor'}
        className="absolute bg-white shadow-2xl flex flex-col inset-x-0 bottom-0 top-12 rounded-t-2xl md:inset-y-0 md:left-auto md:right-0 md:w-[440px] md:top-0 md:rounded-none animate-in slide-in-from-bottom-5 md:slide-in-from-right duration-300"
      >
        <div className="shrink-0 border-b border-app-slate/10 px-5 flex items-center justify-between py-4">
          <h3 className="text-lg font-bold text-app-dark">{isNew ? 'Add mentor' : 'Edit mentor'}</h3>
          <button onClick={onClose} aria-label="Close" className="-mr-2 p-2 rounded-lg text-app-slate hover:bg-app-bg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 space-y-5">
          {/* Photo */}
          <div className="space-y-3">
            <div className="flex gap-4 items-start">
              <div
                ref={frameRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className={`relative w-32 aspect-[4/5] rounded-xl overflow-hidden shrink-0 ring-2 ring-app-bright/40 touch-none ${hasPhoto ? 'cursor-move' : ''}`}
              >
                <MentorPhoto mentor={draft} previewUrl={newPhoto?.url} className="w-full h-full" />
                {hasPhoto && (
                  <span className="absolute left-1.5 top-1.5 px-1.5 py-0.5 rounded-md bg-app-dark/70 text-white text-[10px] font-bold pointer-events-none">
                    Drag to position
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-3">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 min-h-[44px] rounded-lg border border-app-slate/15 text-app-dark text-sm font-semibold hover:bg-app-slate/5 transition-colors"
                >
                  <ImageUp size={16} className="text-app-slate" />
                  {hasPhoto ? 'Change photo' : 'Add photo'}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { void handlePickPhoto(e.target.files?.[0]); e.target.value = ''; }}
                />
                <label className="block">
                  <span className="block text-xs font-semibold text-app-slate mb-1">Zoom</span>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.05}
                    value={zoom}
                    disabled={!hasPhoto}
                    onChange={(e) => set('photoZoom', Number(e.target.value))}
                    className="w-full accent-app-dark disabled:opacity-40"
                  />
                </label>
                <p className="text-[11px] font-medium text-app-slate opacity-70">
                  Portrait photos work best. Position the face; it stays in frame everywhere.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-app-bg px-3 py-2.5">
              <span className="text-[11px] font-semibold text-app-slate">Preview</span>
              <MentorPhoto mentor={draft} previewUrl={newPhoto?.url} className="w-12 aspect-square rounded-lg" />
              <MentorPhoto mentor={draft} previewUrl={newPhoto?.url} className="w-9 h-9 rounded-full text-xs" />
              <MentorPhoto mentor={draft} previewUrl={newPhoto?.url} className="w-9 aspect-[4/5] rounded-md text-xs" />
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <label className="block">
              <span className={labelClass}>Name</span>
              <input value={draft.name} onChange={(e) => set('name', e.target.value)} className={inputClass} autoComplete="off" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className={labelClass}>Title</span>
                <input value={draft.title} onChange={(e) => set('title', e.target.value)} placeholder="Principal" className={inputClass} />
              </label>
              <label className="block">
                <span className={labelClass}>School / district</span>
                <input value={draft.organization} onChange={(e) => set('organization', e.target.value)} placeholder="Lincoln High School" className={inputClass} />
              </label>
            </div>
            <label className="block">
              <span className={labelClass}>Bio</span>
              <textarea
                rows={5}
                value={draft.bio}
                onChange={(e) => set('bio', e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-app-bg border border-app-slate/15 outline-none focus:ring-2 focus:ring-app-bright/30 font-medium text-app-dark text-base"
              />
            </label>
            <label className="block">
              <span className={labelClass}>A lesson from this mentor <span className="opacity-60 font-medium">(optional)</span></span>
              <input value={draft.quote ?? ''} onChange={(e) => set('quote', e.target.value)} className={inputClass} />
            </label>
            <label className="block">
              <span className={labelClass}>Linked site <span className="opacity-60 font-medium">(optional)</span></span>
              <select
                value={draft.siteId ?? ''}
                onChange={(e) => set('siteId', e.target.value || undefined)}
                className={inputClass}
              >
                <option value="">None</option>
                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>

            <div className="rounded-xl border border-app-slate/15 divide-y divide-app-slate/10">
              <label className="flex items-center justify-between gap-3 px-4 py-3 min-h-[52px] cursor-pointer">
                <span className="text-sm font-semibold text-app-dark">
                  Show on dashboard
                  <span className="block text-[11px] font-medium text-app-slate opacity-70">In the order shown on this page</span>
                </span>
                <input type="checkbox" checked={draft.showOnDashboard} onChange={(e) => set('showOnDashboard', e.target.checked)} className="w-5 h-5 accent-app-dark" />
              </label>
              <label className="block px-4 py-3">
                <span className={labelClass}>Dashboard card text</span>
                <select value={draft.dashboardText} onChange={(e) => set('dashboardText', e.target.value as MentorCardText)} className={inputClass}>
                  {CARD_TEXT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
            </div>

            <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
              <input type="checkbox" checked={!!draft.isPrimary} onChange={(e) => set('isPrimary', e.target.checked)} className="w-5 h-5 accent-app-dark" />
              <span className="text-sm font-semibold text-app-dark">
                Primary mentor
                <span className="block text-[11px] font-medium text-app-slate opacity-70">Featured at the top of this page</span>
              </span>
            </label>

            {!isNew && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-app-slate mr-auto">Order</span>
                <button type="button" disabled={!canMoveEarlier} onClick={() => onMove(-1)} className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-lg border border-app-slate/15 text-app-slate text-sm font-semibold hover:bg-app-slate/5 disabled:opacity-40 transition-colors">
                  <ArrowLeft size={14} /> Earlier
                </button>
                <button type="button" disabled={!canMoveLater} onClick={() => onMove(1)} className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-lg border border-app-slate/15 text-app-slate text-sm font-semibold hover:bg-app-slate/5 disabled:opacity-40 transition-colors">
                  Later <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-app-slate/10 px-5 py-4 pb-safe space-y-3">
          {error && (
            <p role="alert" className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}
          <div className="flex items-center gap-2">
            {!isNew && (confirmDelete ? (
              <button type="button" onClick={onDelete} className="px-4 py-2.5 min-h-[48px] rounded-lg bg-red-600 text-white text-sm font-bold">
                Confirm delete
              </button>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} aria-label="Delete mentor" className="px-4 py-2.5 min-h-[48px] rounded-lg text-red-600 border border-red-200 hover:bg-red-50 transition-colors">
                <Trash2 size={16} />
              </button>
            ))}
            <button
              type="button"
              onClick={handleSave}
              disabled={busy}
              className="flex-1 min-h-[48px] rounded-lg bg-app-dark text-white text-sm font-bold hover:bg-app-deep transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {busy && <Loader size={16} className="animate-spin" />}
              {busy ? 'Saving…' : 'Save mentor'}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default MentorEditor;
