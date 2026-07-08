import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ALL_COMPETENCIES } from '../constants';
import { Competency, InternshipLog } from '../types';
import { Search, Star, Check, ChevronDown, ChevronUp, Split, X, Plus } from 'lucide-react';
import { useBodyScrollLock } from '../useBodyScrollLock';

export interface CompetencyPickerProps {
  /** Currently tagged (coverage) competency ids. */
  selectedIds: string[];
  /** The primary competency id that "owns" the entry's hours. */
  primaryId?: string;
  /** Fires whenever the tag set and/or primary selection changes. */
  onChange: (selectedIds: string[], primaryId?: string) => void;
  /** Existing logs, used to derive frequent one-tap suggestions. */
  logs: InternshipLog[];
  /** Total hours for the entry; used to validate the optional hour-split editor. */
  hours?: number;
  /** Optional explicit per-competency hour split. */
  hourSplit?: Record<string, number>;
  /** Fires when the hour-split editor changes. Pass undefined to clear the split. */
  onHourSplitChange?: (hourSplit: Record<string, number> | undefined) => void;
  isReadOnly?: boolean;
}

interface CompetencyGroup {
  key: string;
  title: string;
  category: string;
  items: Competency[];
}

const buildGroups = (list: Competency[]): CompetencyGroup[] => {
  const groups = new Map<string, CompetencyGroup>();
  // First pass: headers (ids with no trailing digits, e.g. 'A', 'P_A').
  list.forEach(c => {
    if (!/\d$/.test(c.id)) {
      groups.set(c.id, { key: c.id, title: `${c.id} – ${c.title}`, category: c.category, items: [] });
    }
  });
  // Second pass: assign every competency (including headers) to its group.
  list.forEach(c => {
    const groupKey = c.id.replace(/\d+$/, '');
    let group = groups.get(groupKey);
    if (!group) {
      group = { key: groupKey || c.category, title: c.category, category: c.category, items: [] };
      groups.set(group.key, group);
    }
    group.items.push(c);
  });
  // Within each group, keep the category-level competency (e.g. 'D', 'P_A')
  // first so it reads as the group's "general" option, then the numbered ones.
  return Array.from(groups.values())
    .filter(g => g.items.length > 0)
    .map(g => ({
      ...g,
      items: [
        ...g.items.filter(i => !/\d$/.test(i.id)),
        ...g.items.filter(i => /\d$/.test(i.id)),
      ],
    }));
};

const GROUPS = buildGroups(ALL_COMPETENCIES);
const BY_ID: Record<string, Competency> = Object.fromEntries(ALL_COMPETENCIES.map(c => [c.id, c]));

const matchesQuery = (c: Competency, q: string): boolean =>
  c.id.toLowerCase().includes(q) ||
  c.title.toLowerCase().includes(q) ||
  c.description.toLowerCase().includes(q);

const CompetencyPicker: React.FC<CompetencyPickerProps> = ({
  selectedIds,
  primaryId,
  onChange,
  logs,
  hours,
  hourSplit,
  onHourSplitChange,
  isReadOnly,
}) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [splitOpen, setSplitOpen] = useState(!!hourSplit && Object.keys(hourSplit).length > 0);
  const searchRef = useRef<HTMLInputElement>(null);

  useBodyScrollLock(sheetOpen);

  const openSheet = () => {
    setQuery('');
    setSheetOpen(true);
  };

  // Focus the search input on desktop only when the sheet opens (autoFocus on
  // mobile pops the keyboard and jumps the viewport).
  useEffect(() => {
    if (!sheetOpen) return;
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches) {
      // Defer so the element is mounted before focusing.
      const id = window.setTimeout(() => searchRef.current?.focus(), 0);
      return () => window.clearTimeout(id);
    }
  }, [sheetOpen]);

  // Close the sheet on Escape.
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSheetOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheetOpen]);

  const frequentIds = useMemo(() => {
    const counts: Record<string, { count: number; lastDate: string }> = {};
    logs.forEach(log => {
      (log.taggedCompetencyIds || []).forEach(id => {
        if (!counts[id]) counts[id] = { count: 0, lastDate: log.date };
        counts[id].count += 1;
        if (log.date > counts[id].lastDate) counts[id].lastDate = log.date;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => (b[1].count - a[1].count) || (b[1].lastDate.localeCompare(a[1].lastDate)))
      .slice(0, 5)
      .map(([id]) => id)
      .filter(id => BY_ID[id]);
  }, [logs]);

  const toggleId = (id: string) => {
    if (isReadOnly) return;
    const isSelected = selectedIds.includes(id);
    let nextIds: string[];
    let nextPrimary = primaryId;
    if (isSelected) {
      nextIds = selectedIds.filter(sid => sid !== id);
      if (nextPrimary === id) nextPrimary = nextIds[0];
    } else {
      nextIds = [...selectedIds, id];
      if (!nextPrimary) nextPrimary = id;
    }
    onChange(nextIds, nextPrimary);
    if (hourSplit && !nextIds.includes(id)) {
      const rest = { ...hourSplit };
      delete rest[id];
      onHourSplitChange?.(Object.keys(rest).length > 0 ? rest : undefined);
    }
  };

  const setPrimary = (id: string) => {
    if (isReadOnly) return;
    const nextIds = selectedIds.includes(id) ? selectedIds : [...selectedIds, id];
    onChange(nextIds, id);
  };

  const handleSplitChange = (id: string, value: string) => {
    const num = value === '' ? 0 : parseFloat(value);
    const next = { ...(hourSplit || {}), [id]: isNaN(num) ? 0 : num };
    onHourSplitChange?.(next);
  };

  const splitSum = useMemo(
    () => Object.values(hourSplit || {}).reduce((sum: number, v: number) => sum + (v || 0), 0),
    [hourSplit]
  );
  const splitMismatch = splitOpen && hourSplit && hours !== undefined && Math.abs(splitSum - hours) > 0.001;

  const selectedCompetencies = selectedIds.map(id => BY_ID[id]).filter(Boolean);

  // Groups filtered by the current query; only groups with matching items show.
  const q = query.trim().toLowerCase();
  const visibleGroups = useMemo(() => {
    if (!q) return GROUPS;
    return GROUPS
      .map(g => ({ ...g, items: g.items.filter(c => matchesQuery(c, q)) }))
      .filter(g => g.items.length > 0);
  }, [q]);

  /** One dense, thumb-friendly checkbox row: box + code + title, whole row toggles. */
  const renderRow = (c: Competency) => {
    const isSelected = selectedIds.includes(c.id);
    return (
      <button
        key={c.id}
        type="button"
        onClick={() => toggleId(c.id)}
        title={c.description}
        className={`w-full flex items-center gap-3 px-3 min-h-[44px] py-1.5 text-left transition-colors active:bg-app-bright/10 ${
          isSelected ? 'bg-app-bright/5' : ''
        }`}
      >
        <span
          className={`shrink-0 w-[18px] h-[18px] rounded-[5px] border flex items-center justify-center transition-colors ${
            isSelected ? 'bg-app-dark border-app-dark text-white' : 'border-app-slate/30 bg-white'
          }`}
        >
          {isSelected && <Check size={13} strokeWidth={3} />}
        </span>
        <span className="shrink-0 w-9 text-xs font-bold text-app-dark tabular-nums">{c.id}</span>
        <span className="min-w-0 truncate text-sm font-semibold text-app-slate">{c.title}</span>
      </button>
    );
  };

  // ── Read-only: render the selection as static text ───────────────────────
  if (isReadOnly) {
    if (selectedCompetencies.length === 0) {
      return <p className="text-sm text-app-slate/60 font-semibold">No competencies tagged.</p>;
    }
    return (
      <div className="flex flex-wrap gap-2">
        {selectedCompetencies.map(c => {
          const isPrimary = c.id === primaryId;
          return (
            <span
              key={c.id}
              title={c.title}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold border ${
                isPrimary ? 'bg-app-dark text-white border-app-dark' : 'bg-white text-app-dark border-app-slate/15'
              }`}
            >
              {isPrimary && <Star size={12} className="fill-current" />}
              {c.id}
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ── Inline: selected competencies (removable, primary starred) ─────── */}
      {selectedCompetencies.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedCompetencies.map(c => {
            const isPrimary = c.id === primaryId;
            return (
              <span
                key={c.id}
                className={`flex items-center gap-0.5 pl-3 pr-1 py-1 rounded-lg text-xs font-bold border ${
                  isPrimary ? 'bg-app-dark text-white border-app-dark' : 'bg-white text-app-dark border-app-slate/15'
                }`}
              >
                <span title={c.title} className="pr-1">{c.id}</span>
                {!isPrimary && (
                  <button
                    type="button"
                    onClick={() => setPrimary(c.id)}
                    title="Set as primary"
                    aria-label={`Set ${c.id} as primary`}
                    className="p-2 -my-1 rounded-lg opacity-60 hover:opacity-100"
                  >
                    <Star size={14} />
                  </button>
                )}
                {isPrimary && (
                  <span className="p-2 -my-1" title="Primary competency">
                    <Star size={14} className="fill-current" />
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => toggleId(c.id)}
                  title="Remove"
                  aria-label={`Remove ${c.id}`}
                  className="p-2 -my-1 rounded-lg opacity-60 hover:opacity-100"
                >
                  <X size={14} />
                </button>
              </span>
            );
          })}
        </div>
      ) : (
        <p className="text-xs font-semibold text-app-slate/60">No competencies tagged yet.</p>
      )}

      {/* Prominent open-sheet button */}
      <button
        type="button"
        onClick={openSheet}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg bg-app-bg border border-app-slate/15 text-sm font-bold text-app-dark hover:border-app-bright/40 transition-colors"
      >
        <Plus size={16} className="text-app-bright" />
        {selectedCompetencies.length > 0 ? 'Edit selection' : 'Add competencies'}
      </button>

      {/* ── Inline: optional hour-split editor ──────────────────────────────── */}
      {selectedCompetencies.length > 1 && hours !== undefined && onHourSplitChange && (
        <div className="border border-app-slate/15 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => {
              const next = !splitOpen;
              setSplitOpen(next);
              if (!next) onHourSplitChange(undefined);
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 min-h-[44px] bg-app-bg/40 hover:bg-app-bg transition-colors"
          >
            <span className="flex items-center gap-2 text-xs font-semibold text-app-slate">
              <Split size={14} /> Split hours across competencies
            </span>
            {splitOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {splitOpen && (
            <div className="p-4 space-y-2 bg-white">
              {selectedCompetencies.map(c => (
                <div key={c.id} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-xs font-bold text-app-dark">{c.id} &middot; {c.title}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.25"
                    min="0"
                    value={hourSplit?.[c.id] ?? ''}
                    onChange={e => handleSplitChange(c.id, e.target.value)}
                    className="w-24 px-3 py-2 min-h-[40px] rounded-lg bg-app-bg border border-app-slate/15 text-right font-bold text-base sm:text-sm outline-none focus:ring-2 focus:ring-app-bright/30"
                  />
                </div>
              ))}
              <div className={`flex items-center justify-between pt-2 border-t border-app-slate/10 text-xs font-bold ${splitMismatch ? 'text-red-500' : 'text-app-slate'}`}>
                <span>Split Total</span>
                <span>{splitSum} / {hours}</span>
              </div>
              {splitMismatch && (
                <p className="text-[11px] font-bold text-red-500">Split hours must sum to the entry&rsquo;s total hours.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Sheet: full-screen search-first picker ──────────────────────────── */}
      {sheetOpen && createPortal(
        <div className="fixed inset-0 z-[90] flex md:items-center md:justify-center md:p-6">
          <div
            className="absolute inset-0 bg-app-dark/40"
            onClick={() => setSheetOpen(false)}
          />
          <div className="relative bg-white w-full h-dvh md:h-auto md:max-h-[80vh] md:max-w-lg md:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Sticky header: search + close */}
            <div className="shrink-0 border-b border-app-slate/10 px-4 pt-safe">
              <div className="flex items-center gap-2 py-3">
                <div className="relative flex-1 min-w-0">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-slate/50" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search competencies…"
                    className="w-full pl-10 pr-3 py-2.5 min-h-[44px] rounded-lg bg-app-bg border border-app-slate/15 outline-none focus:ring-2 focus:ring-app-bright/30 text-base font-semibold text-app-dark"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  aria-label="Close"
                  className="shrink-0 w-11 h-11 flex items-center justify-center rounded-lg text-app-slate hover:bg-app-bg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              {/* Frequently used (only when not searching) */}
              {!q && frequentIds.length > 0 && (
                <div>
                  <div className="sticky top-0 z-10 bg-app-bg/95 backdrop-blur-sm px-3 py-1.5 text-[11px] font-bold text-app-slate/70 border-b border-app-slate/10">
                    Frequently used
                  </div>
                  <div className="divide-y divide-app-slate/10">
                    {frequentIds.map(id => renderRow(BY_ID[id]))}
                  </div>
                </div>
              )}

              {/* Flat list with sticky category headers */}
              {visibleGroups.map(group => (
                <div key={group.key}>
                  <div className="sticky top-0 z-10 bg-app-bg/95 backdrop-blur-sm px-3 py-1.5 text-[11px] font-bold text-app-slate/70 border-b border-app-slate/10">
                    <span className="truncate">{group.title}</span>
                  </div>
                  <div className="divide-y divide-app-slate/10">
                    {group.items.map(c => renderRow(c))}
                  </div>
                </div>
              ))}

              {q && visibleGroups.length === 0 && (
                <p className="p-6 text-sm text-app-slate/60 font-semibold text-center">
                  No competencies match &ldquo;{query}&rdquo;.
                </p>
              )}
            </div>

            {/* Footer: Done */}
            <div className="shrink-0 border-t border-app-slate/10 bg-white px-4 py-3 pb-safe">
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-app-dark text-white text-sm font-bold hover:bg-app-deep transition-colors"
              >
                Done{selectedIds.length > 0 ? ` · ${selectedIds.length} selected` : ''}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CompetencyPicker;
