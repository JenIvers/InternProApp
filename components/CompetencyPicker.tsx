import React, { useMemo, useState } from 'react';
import { ALL_COMPETENCIES } from '../constants';
import { Competency, InternshipLog } from '../types';
import { Search, Star, Check, ChevronDown, ChevronUp, Split, X } from 'lucide-react';

export interface CompetencyPickerProps {
  /** Currently tagged (coverage) competency ids. */
  selectedIds: string[];
  /** The primary competency id that "owns" the entry's hours. */
  primaryId?: string;
  /** Fires whenever the tag set and/or primary selection changes. */
  onChange: (selectedIds: string[], primaryId?: string) => void;
  /** Existing logs, used to derive recent/frequent one-tap chips. */
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
  return Array.from(groups.values()).filter(g => g.items.length > 0);
};

const GROUPS = buildGroups(ALL_COMPETENCIES);
const BY_ID: Record<string, Competency> = Object.fromEntries(ALL_COMPETENCIES.map(c => [c.id, c]));

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
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [openGroupKey, setOpenGroupKey] = useState<string | null>(null);
  const [splitOpen, setSplitOpen] = useState(!!hourSplit && Object.keys(hourSplit).length > 0);

  const recentsAndFrequents = useMemo(() => {
    const counts: Record<string, { count: number; lastDate: string }> = {};
    logs.forEach(log => {
      const ids = log.taggedCompetencyIds || [];
      ids.forEach(id => {
        if (!counts[id]) counts[id] = { count: 0, lastDate: log.date };
        counts[id].count += 1;
        if (log.date > counts[id].lastDate) counts[id].lastDate = log.date;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => (b[1].count - a[1].count) || (b[1].lastDate.localeCompare(a[1].lastDate)))
      .slice(0, 8)
      .map(([id]) => id)
      .filter(id => BY_ID[id]);
  }, [logs]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return ALL_COMPETENCIES.filter(c =>
      c.id.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
    ).slice(0, 25);
  }, [query]);

  const toggleId = (id: string) => {
    if (isReadOnly) return;
    const isSelected = selectedIds.includes(id);
    let nextIds: string[];
    let nextPrimary = primaryId;
    if (isSelected) {
      nextIds = selectedIds.filter(sid => sid !== id);
      if (nextPrimary === id) {
        nextPrimary = nextIds[0];
      }
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

  return (
    <div className="space-y-4">
      {/* Selected tags */}
      {selectedCompetencies.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCompetencies.map(c => {
            const isPrimary = c.id === primaryId;
            return (
              <span
                key={c.id}
                className={`flex items-center gap-0.5 pl-3 pr-1 py-1 rounded-xl text-xs font-bold border ${
                  isPrimary
                    ? 'bg-app-dark text-white border-app-dark'
                    : 'bg-white text-app-dark border-app-dark/15'
                }`}
              >
                <span title={c.title} className="pr-1">{c.id}</span>
                {!isReadOnly && (
                  <>
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
                      <span className="p-2 -my-1">
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
                  </>
                )}
              </span>
            );
          })}
        </div>
      )}

      {/* Recents/frequents one-tap chips */}
      {!isReadOnly && recentsAndFrequents.length > 0 && (
        <div>
          <p className="text-[10px] font-black text-app-slate uppercase tracking-widest mb-2 opacity-60">Recently / Frequently Used</p>
          <div className="flex flex-wrap gap-2">
            {recentsAndFrequents.map(id => {
              const c = BY_ID[id];
              const isSelected = selectedIds.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleId(id)}
                  className={`px-3 py-2 min-h-[38px] rounded-lg text-[11px] font-bold border transition-colors ${
                    isSelected
                      ? 'bg-app-bright/10 text-app-bright border-app-bright/30'
                      : 'bg-white text-app-slate border-app-dark/10 hover:border-app-bright/40'
                  }`}
                >
                  {isSelected && <Check size={10} className="inline mr-1" />}
                  {c.id}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!isReadOnly && (
        <>
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-app-slate/50" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by code, title, or keyword (e.g. A3)"
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-app-dark/10 outline-none focus:ring-2 focus:ring-app-bright/30 text-base sm:text-sm font-semibold text-app-dark"
            />
          </div>

          {query.trim() ? (
            <div className="max-h-64 overflow-y-auto overscroll-contain border border-app-dark/10 rounded-xl divide-y divide-app-dark/5 bg-white">
              {searchResults.length === 0 && (
                <p className="p-4 text-sm text-app-slate/60 font-semibold">No competencies match &ldquo;{query}&rdquo;.</p>
              )}
              {searchResults.map(c => {
                const isSelected = selectedIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleId(c.id)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-app-bg transition-colors ${isSelected ? 'bg-app-bright/5' : ''}`}
                  >
                    <span className={`shrink-0 w-5 h-5 rounded-md border flex items-center justify-center mt-0.5 ${isSelected ? 'bg-app-dark border-app-dark text-white' : 'border-app-dark/20'}`}>
                      {isSelected && <Check size={12} />}
                    </span>
                    <span>
                      <span className="text-sm font-black text-app-dark">{c.id} &middot; {c.title}</span>
                      <span className="block text-xs text-app-slate/70 font-medium line-clamp-2">{c.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Dropdown-first, grouped by category */
            <div className="border border-app-dark/10 rounded-xl divide-y divide-app-dark/5 bg-white overflow-hidden">
              {(expanded ? GROUPS : GROUPS.slice(0, 6)).map(group => {
                const isOpen = openGroupKey === group.key;
                const selectedInGroup = group.items.filter(i => selectedIds.includes(i.id)).length;
                return (
                  <div key={group.key}>
                    <button
                      type="button"
                      onClick={() => setOpenGroupKey(isOpen ? null : group.key)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-app-bg transition-colors"
                    >
                      <span className="text-sm font-black text-app-dark">{group.title}</span>
                      <span className="flex items-center gap-2">
                        {selectedInGroup > 0 && (
                          <span className="text-[10px] font-black text-app-bright bg-app-bright/10 px-2 py-0.5 rounded-full">{selectedInGroup}</span>
                        )}
                        {isOpen ? <ChevronUp size={16} className="text-app-slate/50" /> : <ChevronDown size={16} className="text-app-slate/50" />}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-3 flex flex-wrap gap-2 bg-app-bg/40">
                        {group.items.map(c => {
                          const isSelected = selectedIds.includes(c.id);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              title={c.description}
                              onClick={() => toggleId(c.id)}
                              className={`px-3 py-2.5 min-h-[40px] rounded-lg text-xs font-bold border transition-colors ${
                                isSelected
                                  ? 'bg-app-dark text-white border-app-dark'
                                  : 'bg-white text-app-slate border-app-dark/10 hover:border-app-bright/40'
                              }`}
                            >
                              {c.id}: {c.title}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              {GROUPS.length > 6 && (
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  className="w-full px-4 py-2.5 text-center text-xs font-black text-app-bright uppercase tracking-widest hover:bg-app-bg transition-colors"
                >
                  {expanded ? 'Show Fewer Categories' : `Show All ${GROUPS.length} Categories`}
                </button>
              )}
            </div>
          )}

          {/* Optional hour-split editor */}
          {selectedCompetencies.length > 1 && hours !== undefined && onHourSplitChange && (
            <div className="border border-app-dark/10 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  const next = !splitOpen;
                  setSplitOpen(next);
                  if (!next) onHourSplitChange(undefined);
                }}
                className="w-full flex items-center justify-between px-4 py-3 bg-app-bg/40 hover:bg-app-bg transition-colors"
              >
                <span className="flex items-center gap-2 text-xs font-black text-app-slate uppercase tracking-widest">
                  <Split size={14} /> Split Hours Across Competencies
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
                        className="w-24 px-3 py-2.5 rounded-lg bg-app-bg border border-app-dark/10 text-right font-bold text-base sm:text-sm outline-none focus:ring-2 focus:ring-app-bright/30"
                      />
                    </div>
                  ))}
                  <div className={`flex items-center justify-between pt-2 border-t border-app-dark/10 text-xs font-black ${splitMismatch ? 'text-red-500' : 'text-app-slate'}`}>
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
        </>
      )}

      {isReadOnly && selectedCompetencies.length === 0 && (
        <p className="text-sm text-app-slate/60 font-semibold">No competencies tagged.</p>
      )}
    </div>
  );
};

export default CompetencyPicker;
