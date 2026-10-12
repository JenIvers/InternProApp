import React, { useMemo, useState } from 'react';
import { Clock, MapPin, Minus, Pencil, Plus, UsersRound, X } from 'lucide-react';
import type { InternshipLog, Mentor, Site } from '../types';
import MentorPhoto from './MentorPhoto';
import MentorEditor from './MentorEditor';
import {
  MAX_DASHBOARD_MENTOR_COUNT, clampMentorCount, dashboardMentors, hoursWithMentor, newMentor,
} from '../lib/mentors';
import { useBodyScrollLock } from '../useBodyScrollLock';

export interface MentorsViewProps {
  mentors: Mentor[];
  sites: Site[];
  logs: InternshipLog[];
  dashboardCount: number;
  isReadOnly: boolean;
  /** Mentor id from the URL (/mentors/:id); opens the full profile. */
  selectedMentorId?: string;
  onSelectMentor: (id: string | null) => void;
  /** Persist a mentor (photo upload included). Resolves to an error message, or null on success. */
  onSaveMentor: (mentor: Mentor, newPhoto: Blob | null, isNew: boolean) => Promise<string | null>;
  onDeleteMentor: (id: string) => void;
  onMoveMentor: (id: string, delta: -1 | 1) => void;
  onSetDashboardCount: (count: number) => void;
}

const MentorMeta: React.FC<{ mentor: Mentor; className?: string }> = ({ mentor, className = '' }) => (
  <p className={`font-semibold text-app-slate ${className}`}>
    {[mentor.title, mentor.organization].filter(Boolean).join(' · ') || 'Mentor'}
  </p>
);

const MentorsView: React.FC<MentorsViewProps> = ({
  mentors, sites, logs, dashboardCount, isReadOnly, selectedMentorId,
  onSelectMentor, onSaveMentor, onDeleteMentor, onMoveMentor, onSetDashboardCount,
}) => {
  // 'new' = blank draft; a mentor id = editing that mentor; null = drawer closed.
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [newId, setNewId] = useState(() => crypto.randomUUID());

  const selected = mentors.find(m => m.id === selectedMentorId) ?? null;
  const editingMentor = editing === 'new'
    ? newMentor(newId)
    : mentors.find(m => m.id === editing) ?? null;
  const editingIndex = editingMentor ? mentors.findIndex(m => m.id === editingMentor.id) : -1;

  useBodyScrollLock(!!selected);

  const featured = mentors.find(m => m.isPrimary) ?? null;
  const others = mentors.filter(m => m.id !== featured?.id);
  const pinnedCount = useMemo(() => mentors.filter(m => m.showOnDashboard).length, [mentors]);
  const shownCount = dashboardMentors(mentors, dashboardCount).length;

  const openAdd = () => {
    setNewId(crypto.randomUUID());
    setEditing('new');
  };

  const handleSave = async (mentor: Mentor, photo: Blob | null) => {
    const failure = await onSaveMentor(mentor, photo, editing === 'new');
    if (!failure) setEditing(null);
    return failure;
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-app-dark tracking-tight">Mentor Spotlight</h1>
          <p className="text-app-slate text-sm font-medium opacity-70">The leaders who shaped your internship.</p>
        </div>
        {!isReadOnly && (
          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg bg-app-dark text-white text-sm font-bold hover:bg-app-deep transition-colors shadow-sm"
          >
            <Plus size={16} strokeWidth={2.5} /> Add mentor
          </button>
        )}
      </header>

      {!isReadOnly && mentors.length > 0 && (
        <div className="rounded-xl border border-app-slate/15 bg-white px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-app-dark">Dashboard row</p>
            <p className="text-[11px] font-medium text-app-slate opacity-70">
              {pinnedCount} pinned · showing {shownCount}. Pin mentors from their edit drawer.
            </p>
          </div>
          <div className="flex items-center gap-1" role="group" aria-label="Mentors shown on the dashboard">
            <button
              type="button"
              onClick={() => onSetDashboardCount(clampMentorCount(dashboardCount - 1))}
              disabled={dashboardCount <= 1}
              aria-label="Show fewer mentors"
              className="w-11 h-11 rounded-lg border border-app-slate/15 text-app-slate flex items-center justify-center hover:bg-app-slate/5 disabled:opacity-40 transition-colors"
            >
              <Minus size={16} />
            </button>
            <span className="w-10 text-center text-sm font-bold text-app-dark tabular-nums" aria-live="polite">{dashboardCount}</span>
            <button
              type="button"
              onClick={() => onSetDashboardCount(clampMentorCount(dashboardCount + 1))}
              disabled={dashboardCount >= MAX_DASHBOARD_MENTOR_COUNT}
              aria-label="Show more mentors"
              className="w-11 h-11 rounded-lg border border-app-slate/15 text-app-slate flex items-center justify-center hover:bg-app-slate/5 disabled:opacity-40 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      )}

      {mentors.length === 0 ? (
        <div className="rounded-xl border border-app-slate/15 bg-white px-6 py-14 text-center">
          <span className="mx-auto mb-3 w-12 h-12 rounded-full bg-app-bright/10 text-app-bright flex items-center justify-center">
            <UsersRound size={22} />
          </span>
          <p className="text-sm font-bold text-app-dark">No mentors yet</p>
          <p className="text-xs font-medium text-app-slate opacity-70 mt-1 max-w-sm mx-auto">
            Add the principals, coaches, and district leaders you have learned from, with a photo and a few words about each.
          </p>
          {!isReadOnly && (
            <button
              type="button"
              onClick={openAdd}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg bg-app-dark text-white text-sm font-bold hover:bg-app-deep transition-colors"
            >
              <Plus size={16} strokeWidth={2.5} /> Add your first mentor
            </button>
          )}
        </div>
      ) : (
        <>
          {featured && (
            <article className="rounded-xl border border-app-slate/15 bg-white overflow-hidden grid md:grid-cols-5">
              <button type="button" onClick={() => onSelectMentor(featured.id)} aria-label={`Open ${featured.name}`} className="md:col-span-2 block text-left">
                <MentorPhoto mentor={featured} className="w-full aspect-[4/5] md:h-full md:aspect-auto md:min-h-[360px]" />
              </button>
              <div className="md:col-span-3 p-6 md:p-8 flex flex-col">
                <span className="self-start text-[10px] font-bold uppercase tracking-wide text-app-bright bg-app-bright/10 px-2 py-0.5 rounded-full mb-3">Primary mentor</span>
                <h2 className="text-2xl font-bold text-app-dark tracking-tight">{featured.name}</h2>
                <MentorMeta mentor={featured} className="text-sm mt-0.5" />
                {featured.bio && <p className="text-sm text-app-dark/80 leading-relaxed mt-4 line-clamp-6">{featured.bio}</p>}
                {featured.quote && (
                  <blockquote className="mt-4 pl-4 border-l-2 border-app-bright/40 text-sm italic text-app-deep">“{featured.quote}”</blockquote>
                )}
                <div className="mt-auto pt-6 flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => onSelectMentor(featured.id)} className="px-3 py-2 min-h-[44px] rounded-lg border border-app-slate/15 text-app-slate text-sm font-semibold hover:bg-app-slate/5 transition-colors">
                    Full profile
                  </button>
                  {!isReadOnly && (
                    <button type="button" onClick={() => setEditing(featured.id)} className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-lg border border-app-slate/15 text-app-slate text-sm font-semibold hover:bg-app-slate/5 transition-colors">
                      <Pencil size={14} /> Edit
                    </button>
                  )}
                </div>
              </div>
            </article>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {others.map(m => (
              <article key={m.id} className="group relative rounded-xl border border-app-slate/15 bg-white overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                <button type="button" onClick={() => onSelectMentor(m.id)} className="text-left flex flex-col flex-1" aria-label={`Open ${m.name}`}>
                  <MentorPhoto mentor={m} className="w-full aspect-[4/5]" />
                  <span className="block p-4 flex-1">
                    <span className="block text-sm font-bold text-app-dark leading-snug">{m.name}</span>
                    <MentorMeta mentor={m} className="text-xs mt-0.5" />
                    {m.bio && <span className="block text-xs text-app-dark/75 leading-relaxed mt-2 line-clamp-3">{m.bio}</span>}
                  </span>
                </button>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => setEditing(m.id)}
                    aria-label={`Edit ${m.name}`}
                    className="absolute top-2 right-2 w-10 h-10 rounded-full bg-white/90 text-app-dark flex items-center justify-center shadow md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                  >
                    <Pencil size={15} />
                  </button>
                )}
              </article>
            ))}
            {!isReadOnly && (
              <button
                type="button"
                onClick={openAdd}
                className="rounded-xl border-2 border-dashed border-app-slate/25 text-app-slate hover:border-app-bright hover:text-app-bright hover:bg-white transition-colors flex flex-col items-center justify-center gap-2 min-h-[220px]"
              >
                <Plus size={24} />
                <span className="text-sm font-semibold">Add a mentor</span>
              </button>
            )}
          </div>
        </>
      )}

      {/* Full profile (deep-linkable at /mentors/:id) */}
      {selected && (
        <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center md:p-4">
          <div className="absolute inset-0 bg-app-dark/40" onClick={() => onSelectMentor(null)} />
          <div role="dialog" aria-modal="true" aria-label={selected.name} className="relative bg-white w-full max-w-3xl rounded-t-2xl md:rounded-2xl border border-app-slate/15 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <button type="button" onClick={() => onSelectMentor(null)} aria-label="Close" className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-white/90 shadow flex items-center justify-center text-app-slate hover:text-app-dark">
              <X size={20} />
            </button>
            <div className="overflow-y-auto grid md:grid-cols-5">
              <MentorPhoto mentor={selected} className="w-full aspect-[4/5] md:col-span-2 md:h-full md:aspect-auto md:min-h-[420px]" />
              <div className="md:col-span-3 p-6 md:p-8 space-y-4">
                <div>
                  {selected.isPrimary && (
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wide text-app-bright bg-app-bright/10 px-2 py-0.5 rounded-full mb-2">Primary mentor</span>
                  )}
                  <h2 className="text-2xl font-bold text-app-dark tracking-tight">{selected.name}</h2>
                  <MentorMeta mentor={selected} className="text-sm mt-0.5" />
                </div>
                {selected.bio && <p className="text-sm text-app-dark/80 leading-relaxed whitespace-pre-line">{selected.bio}</p>}
                {selected.quote && (
                  <blockquote className="pl-4 border-l-2 border-app-bright/40 text-sm italic text-app-deep">“{selected.quote}”</blockquote>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  {selected.siteId && sites.find(s => s.id === selected.siteId) && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border border-app-slate/15 text-app-slate bg-app-bg">
                      <MapPin size={12} />{sites.find(s => s.id === selected.siteId)!.name}
                    </span>
                  )}
                  {(hoursWithMentor(selected, logs) ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border border-app-slate/15 text-app-slate bg-app-bg">
                      <Clock size={12} />{hoursWithMentor(selected, logs)} hours together
                    </span>
                  )}
                </div>
                {!isReadOnly && (
                  <button type="button" onClick={() => { onSelectMentor(null); setEditing(selected.id); }} className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-lg border border-app-slate/15 text-app-slate text-sm font-semibold hover:bg-app-slate/5 transition-colors">
                    <Pencil size={14} /> Edit mentor
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {editingMentor && (
        <MentorEditor
          key={editingMentor.id}
          mentor={editingMentor}
          isNew={editing === 'new'}
          sites={sites}
          canMoveEarlier={editingIndex > 0}
          canMoveLater={editingIndex >= 0 && editingIndex < mentors.length - 1}
          onSave={handleSave}
          onDelete={() => { onDeleteMentor(editingMentor.id); setEditing(null); }}
          onMove={(delta) => onMoveMentor(editingMentor.id, delta)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
};

export default MentorsView;
