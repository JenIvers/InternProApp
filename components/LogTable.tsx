import React, { useMemo, useState } from 'react';
import { InternshipLog, Site, Competency, SchoolLevel } from '../types';
import { ALL_COMPETENCIES } from '../constants';
import { applyLogQuery, LogQuery, LogQuerySort } from '@/lib/log-query';
import { computeCompetencyHours, categoryGroupOf } from '@/lib/competency-metrics';
import { validateEntry, type Warning } from '@/lib/entry-validation';
import {
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  Search,
  X,
  Star,
  Pencil,
  Trash2,
  Download,
  ChevronRight,
  Link as LinkIcon,
  MessageSquare,
  Filter,
  AlertTriangle,
  SlidersHorizontal,
} from 'lucide-react';

/** Props for the desktop hybrid review table (PRD stories 13–23). */
export interface LogTableProps {
  /** All log entries for the current portfolio. */
  logs: InternshipLog[];
  /** Saved sites, used to resolve `siteId` to a name and to populate the site filter. */
  sites: Site[];
  /**
   * Competency catalog used to render codes/titles and the category filter.
   * Defaults to the full `ALL_COMPETENCIES` catalog when omitted.
   */
  competencies?: Competency[];
  /** When true, all editing affordances are hidden/disabled (viewer mode). */
  isReadOnly: boolean;
  /** Commit an inline quick-edit or any full log mutation. */
  onUpdateLog: (log: InternshipLog) => void;
  /** Open the full editor form for an entry (mobile EntryForm / desktop dialog). */
  onEditEntry: (log: InternshipLog) => void;
  /** Delete an entry by id. */
  onDeleteLog: (id: string) => void;
  /** Export the currently filtered/sorted set (feeds the export-model pipeline). */
  onExportFiltered: (filteredLogs: InternshipLog[]) => void;
  /** Optional competency id to pre-seed the competency filter (cross-view jump from Coverage). */
  initialCompetencyId?: string;
  /** When true, start with the "Incomplete only" filter enabled (cross-view jump from Dashboard). */
  initialIncompleteOnly?: boolean;
}

const SCHOOL_LEVELS: SchoolLevel[] = ['Elementary', 'Intermediate', 'Middle', 'High School'];

const fmtHours = (n: number): string => {
  const v = Number(n) || 0;
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
};

const LogTable: React.FC<LogTableProps> = ({
  logs,
  sites,
  competencies = ALL_COMPETENCIES,
  isReadOnly,
  onUpdateLog,
  onEditEntry,
  onDeleteLog,
  onExportFiltered,
  initialCompetencyId,
  initialIncompleteOnly,
}) => {
  // ---- Filter / query state ----------------------------------------------
  const [search, setSearch] = useState('');
  const [competencyFilter, setCompetencyFilter] = useState(
    initialCompetencyId ? `comp:${initialCompetencyId}` : ''
  ); // '', 'cat:A', or 'comp:A1'
  const [levelFilter, setLevelFilter] = useState<SchoolLevel | ''>('');
  const [siteFilter, setSiteFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [incompleteOnly, setIncompleteOnly] = useState(!!initialIncompleteOnly);
  const [sort, setSort] = useState<LogQuerySort>({ key: 'date', dir: 'desc' });
  // Mobile: the secondary filters collapse behind a "Filters" toggle to keep the
  // toolbar compact. On md+ they are always visible (the toggle is hidden).
  const [filtersOpen, setFiltersOpen] = useState(false);

  // ---- Row interaction state ---------------------------------------------
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ logId: string; field: 'date' | 'hours' | 'schoolLevel' } | null>(null);

  const competencyById = useMemo(() => {
    const m = new Map<string, Competency>();
    for (const c of competencies) m.set(c.id, c);
    return m;
  }, [competencies]);

  const siteById = useMemo(() => {
    const m = new Map<string, Site>();
    for (const s of sites) m.set(s.id, s);
    return m;
  }, [sites]);

  /** Category groups present in the catalog, in first-seen order (leaf comps only). */
  const categoryGroups = useMemo(() => {
    const seen = new Set<string>();
    const groups: string[] = [];
    for (const c of competencies) {
      const g = categoryGroupOf(c.id);
      if (!seen.has(g)) {
        seen.add(g);
        groups.push(g);
      }
    }
    return groups;
  }, [competencies]);

  // ---- Build query and derive filtered set --------------------------------
  const query = useMemo<LogQuery>(() => {
    let competencyIds: string[] | undefined;
    if (competencyFilter.startsWith('comp:')) {
      competencyIds = [competencyFilter.slice(5)];
    } else if (competencyFilter.startsWith('cat:')) {
      const g = competencyFilter.slice(4);
      competencyIds = competencies.filter((c) => categoryGroupOf(c.id) === g).map((c) => c.id);
    }
    const dateRange =
      dateFrom || dateTo ? { from: dateFrom || undefined, to: dateTo || undefined } : undefined;
    return {
      search: search.trim() || undefined,
      competencyIds,
      levels: levelFilter ? [levelFilter] : undefined,
      siteIds: siteFilter ? [siteFilter] : undefined,
      dateRange,
      sort,
    };
  }, [search, competencyFilter, levelFilter, siteFilter, dateFrom, dateTo, sort, competencies]);

  // Soft-validation warnings per entry (drives the "incomplete" badge + filter).
  const warningsByLog = useMemo(() => {
    const m = new Map<string, Warning[]>();
    for (const log of logs) m.set(log.id, validateEntry(log));
    return m;
  }, [logs]);

  const incompleteCount = useMemo(() => {
    let n = 0;
    for (const w of warningsByLog.values()) if (w.length > 0) n++;
    return n;
  }, [warningsByLog]);

  const filteredLogs = useMemo(() => {
    const base = applyLogQuery(logs, query);
    return incompleteOnly
      ? base.filter((l) => (warningsByLog.get(l.id)?.length ?? 0) > 0)
      : base;
  }, [logs, query, incompleteOnly, warningsByLog]);

  // ---- Totals for the current filtered set --------------------------------
  const hoursByLevel = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const log of filteredLogs) {
      const lvl = log.schoolLevel || 'Other';
      acc[lvl] = (acc[lvl] || 0) + (Number(log.hours) || 0);
    }
    return acc;
  }, [filteredLogs]);

  const grandTotal = useMemo(
    () => filteredLogs.reduce((sum, l) => sum + (Number(l.hours) || 0), 0),
    [filteredLogs]
  );

  const competencyBreakdown = useMemo(() => {
    const hours = computeCompetencyHours(filteredLogs);
    return Object.entries(hours)
      .filter(([, h]) => h > 0)
      .sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredLogs]);

  const hasActiveFilters =
    !!search || !!competencyFilter || !!levelFilter || !!siteFilter || !!dateFrom || !!dateTo || incompleteOnly;

  // ---- Handlers -----------------------------------------------------------
  const toggleSort = (key: LogQuerySort['key']) => {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    );
  };

  const sortIcon = (key: LogQuerySort['key']) => {
    if (sort.key !== key) return <ChevronsUpDown size={12} className="opacity-30" />;
    return sort.dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  };

  const clearFilters = () => {
    setSearch('');
    setCompetencyFilter('');
    setLevelFilter('');
    setSiteFilter('');
    setDateFrom('');
    setDateTo('');
    setIncompleteOnly(false);
  };

  const commitEdit = (log: InternshipLog, field: 'date' | 'hours' | 'schoolLevel', raw: string) => {
    let updated: InternshipLog = log;
    if (field === 'hours') {
      const parsed = parseFloat(raw);
      updated = { ...log, hours: Number.isFinite(parsed) ? parsed : log.hours };
    } else if (field === 'date') {
      updated = { ...log, date: raw || log.date };
    } else {
      updated = { ...log, schoolLevel: raw as SchoolLevel };
    }
    setEditingCell(null);
    if (updated !== log) onUpdateLog(updated);
  };

  const locationLabel = (log: InternshipLog): string => {
    if (log.siteId && siteById.has(log.siteId)) return siteById.get(log.siteId)!.name;
    return log.location || '—';
  };

  const cellBtnClass =
    'w-full text-left px-1 -mx-1 rounded hover:bg-app-bright/10 transition-colors cursor-pointer';

  const isEditing = (logId: string, field: 'date' | 'hours' | 'schoolLevel') =>
    !!editingCell && editingCell.logId === logId && editingCell.field === field;

  // ---- Render -------------------------------------------------------------
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white border border-app-dark/10 rounded-2xl p-3 sm:p-4 shadow-sm space-y-3">
        {/* Search + mobile Filters toggle */}
        <div className="flex items-end gap-2">
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] font-black uppercase tracking-widest text-app-slate mb-1.5">
              Search
            </label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-light" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Title, description, location…"
                className="w-full pl-9 pr-3 py-2.5 text-base sm:text-sm rounded-lg bg-app-bg border border-app-dark/10 outline-none focus:border-app-bright font-medium text-app-dark"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            className={`md:hidden shrink-0 flex items-center gap-1.5 py-2.5 px-3 rounded-lg border text-xs font-black uppercase tracking-widest transition-colors ${
              filtersOpen ? 'bg-app-dark text-white border-app-dark' : 'border-app-dark/10 text-app-slate'
            }`}
          >
            <SlidersHorizontal size={15} /> Filters
          </button>
        </div>

        {/* Filter controls — collapsible on mobile, inline on md+ */}
        <div
          className={`${filtersOpen ? 'grid grid-cols-2 gap-3' : 'hidden'} md:flex md:flex-wrap md:items-end md:gap-3`}
        >
          <div className="min-w-0">
            <label className="block text-[10px] font-black uppercase tracking-widest text-app-slate mb-1.5">
              Competency
            </label>
            <select
              value={competencyFilter}
              onChange={(e) => setCompetencyFilter(e.target.value)}
              className="w-full md:max-w-[220px] py-2.5 md:py-2 px-3 text-base sm:text-sm rounded-lg bg-app-bg border border-app-dark/10 outline-none focus:border-app-bright font-medium text-app-dark"
            >
              <option value="">All competencies</option>
              <optgroup label="By category">
                {categoryGroups.map((g) => {
                  const c = competencyById.get(g);
                  return (
                    <option key={`cat:${g}`} value={`cat:${g}`}>
                      {g}
                      {c ? ` — ${c.title}` : ''}
                    </option>
                  );
                })}
              </optgroup>
              <optgroup label="By competency">
                {competencies.map((c) => (
                  <option key={`comp:${c.id}`} value={`comp:${c.id}`}>
                    {c.id}: {c.title}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="min-w-0">
            <label className="block text-[10px] font-black uppercase tracking-widest text-app-slate mb-1.5">
              Level
            </label>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as SchoolLevel | '')}
              className="w-full py-2.5 md:py-2 px-3 text-base sm:text-sm rounded-lg bg-app-bg border border-app-dark/10 outline-none focus:border-app-bright font-medium text-app-dark"
            >
              <option value="">All levels</option>
              {SCHOOL_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <label className="block text-[10px] font-black uppercase tracking-widest text-app-slate mb-1.5">
              Site
            </label>
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="w-full md:max-w-[180px] py-2.5 md:py-2 px-3 text-base sm:text-sm rounded-lg bg-app-bg border border-app-dark/10 outline-none focus:border-app-bright font-medium text-app-dark"
            >
              <option value="">All sites</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <label className="block text-[10px] font-black uppercase tracking-widest text-app-slate mb-1.5">
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full py-2.5 md:py-2 px-3 text-base sm:text-sm rounded-lg bg-app-bg border border-app-dark/10 outline-none focus:border-app-bright font-medium text-app-dark"
            />
          </div>
          <div className="min-w-0">
            <label className="block text-[10px] font-black uppercase tracking-widest text-app-slate mb-1.5">
              To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full py-2.5 md:py-2 px-3 text-base sm:text-sm rounded-lg bg-app-bg border border-app-dark/10 outline-none focus:border-app-bright font-medium text-app-dark"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIncompleteOnly((v) => !v)}
            aria-pressed={incompleteOnly}
            title="Show only entries with missing details"
            className={`flex items-center gap-1.5 py-2.5 px-3 text-xs font-black uppercase tracking-widest rounded-lg border transition-colors ${
              incompleteOnly
                ? 'bg-amber-400 border-amber-400 text-app-dark'
                : 'border-app-dark/10 text-app-slate hover:bg-app-bg'
            }`}
          >
            <AlertTriangle size={14} /> Incomplete only
            {incompleteCount > 0 && (
              <span
                className={`ml-0.5 px-1.5 rounded-full text-[10px] tabular-nums ${
                  incompleteOnly ? 'bg-app-dark/10 text-app-dark' : 'bg-amber-100 text-amber-700'
                }`}
              >
                {incompleteCount}
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 py-2.5 px-3 text-xs font-black uppercase tracking-widest text-app-slate rounded-lg border border-app-dark/10 hover:bg-app-bg transition-colors"
            >
              <X size={14} /> Clear
            </button>
          )}
          <button
            onClick={() => onExportFiltered(filteredLogs)}
            className="flex items-center gap-2 py-2.5 px-4 text-xs font-black uppercase tracking-widest text-white bg-app-dark rounded-lg hover:bg-black transition-colors active:scale-95 ml-auto"
          >
            <Download size={14} /> <span className="hidden sm:inline">Export current view</span><span className="sm:hidden">Export</span>
          </button>
        </div>
      </div>

      {/* Result meta */}
      <div className="flex items-center gap-2 px-1 text-xs font-bold text-app-slate">
        <Filter size={13} className="text-app-light" />
        Showing {filteredLogs.length} of {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
      </div>

      {/* Table (desktop / tablet) */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-app-dark/10 bg-white shadow-sm">
        <table className="w-full min-w-[820px] text-sm border-collapse">
          <thead>
            <tr className="bg-app-bg text-app-slate border-b border-app-dark/10">
              <th className="w-8" />
              <SortableTh label="Date" onClick={() => toggleSort('date')} icon={sortIcon('date')} />
              <th className="text-left font-black uppercase tracking-widest text-[10px] px-3 py-3">
                Title / Activity
              </th>
              <th className="text-left font-black uppercase tracking-widest text-[10px] px-3 py-3">
                Competencies
              </th>
              <th className="text-left font-black uppercase tracking-widest text-[10px] px-3 py-3">
                Location
              </th>
              <SortableTh
                label="Hours"
                onClick={() => toggleSort('hours')}
                icon={sortIcon('hours')}
                align="right"
              />
              <SortableTh
                label="Level"
                onClick={() => toggleSort('schoolLevel')}
                icon={sortIcon('schoolLevel')}
              />
              {!isReadOnly && <th className="w-20" />}
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={isReadOnly ? 7 : 8} className="text-center py-12 text-app-slate font-medium">
                  No entries match the current filters.
                </td>
              </tr>
            )}
            {filteredLogs.map((log) => {
              const expanded = expandedId === log.id;
              const tags = log.taggedCompetencyIds ?? [];
              const warnings = warningsByLog.get(log.id) ?? [];
              const incompleteTitle =
                warnings.length > 0
                  ? `Incomplete — ${warnings.map((w) => w.message).join(' ')}`
                  : undefined;
              return (
                <React.Fragment key={log.id}>
                  <tr
                    className={`border-b border-app-dark/5 hover:bg-app-bright/5 transition-colors ${
                      expanded ? 'bg-app-bright/5' : ''
                    }`}
                  >
                    {/* Expand toggle */}
                    <td className="px-2 py-2 align-top">
                      <button
                        onClick={() => setExpandedId(expanded ? null : log.id)}
                        aria-label={expanded ? 'Collapse row' : 'Expand row'}
                        className="p-1 rounded hover:bg-app-dark/10 text-app-slate transition-colors"
                      >
                        <ChevronRight
                          size={15}
                          className={`transition-transform ${expanded ? 'rotate-90' : ''}`}
                        />
                      </button>
                    </td>

                    {/* Date (quick-edit) */}
                    <td className="px-3 py-2 align-top whitespace-nowrap font-semibold text-app-dark">
                      {!isReadOnly && isEditing(log.id, 'date') ? (
                        <input
                          type="date"
                          defaultValue={log.date}
                          autoFocus
                          onBlur={(e) => commitEdit(log, 'date', e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          className="py-1 px-1.5 text-sm rounded border border-app-bright outline-none"
                        />
                      ) : (
                        <button
                          type="button"
                          disabled={isReadOnly}
                          onClick={() => !isReadOnly && setEditingCell({ logId: log.id, field: 'date' })}
                          className={isReadOnly ? 'cursor-default' : cellBtnClass}
                        >
                          {log.date}
                        </button>
                      )}
                    </td>

                    {/* Title / Activity */}
                    <td className="px-3 py-2 align-top max-w-[260px]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {warnings.length > 0 &&
                          (isReadOnly ? (
                            <span
                              title={incompleteTitle}
                              aria-label={incompleteTitle}
                              className="shrink-0 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-100 text-amber-600"
                            >
                              <AlertTriangle size={11} />
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onEditEntry(log)}
                              title={`${incompleteTitle} — click to complete`}
                              aria-label={`${incompleteTitle} — click to complete`}
                              className="shrink-0 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-100 text-amber-600 hover:bg-amber-400 hover:text-app-dark transition-colors"
                            >
                              <AlertTriangle size={11} />
                            </button>
                          ))}
                        <span className="font-bold text-app-dark truncate">
                          {log.title || log.activity || 'Untitled entry'}
                        </span>
                      </div>
                      {log.title && (log.description || log.activity) && (
                        <div className="text-xs text-app-slate truncate">
                          {log.description || log.activity}
                        </div>
                      )}
                    </td>

                    {/* Competency codes */}
                    <td className="px-3 py-2 align-top">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {log.primaryCompetencyId && (
                          <span
                            title={competencyById.get(log.primaryCompetencyId)?.title}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-app-dark text-white text-[10px] font-black"
                          >
                            <Star size={9} className="fill-current" />
                            {log.primaryCompetencyId}
                          </span>
                        )}
                        {tags
                          .filter((id) => id !== log.primaryCompetencyId)
                          .map((id) => (
                            <span
                              key={id}
                              title={competencyById.get(id)?.title}
                              className="px-1.5 py-0.5 rounded bg-app-bright/10 text-app-slate text-[10px] font-black border border-app-bright/10"
                            >
                              {id}
                            </span>
                          ))}
                        {tags.length === 0 && !log.primaryCompetencyId && (
                          <span className="text-app-light text-xs">—</span>
                        )}
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-3 py-2 align-top text-app-slate font-medium whitespace-nowrap max-w-[140px] truncate">
                      {locationLabel(log)}
                    </td>

                    {/* Hours (quick-edit) */}
                    <td className="px-3 py-2 align-top text-right font-black text-app-dark whitespace-nowrap">
                      {!isReadOnly && isEditing(log.id, 'hours') ? (
                        <input
                          type="number"
                          step="0.5"
                          defaultValue={log.hours}
                          autoFocus
                          onBlur={(e) => commitEdit(log, 'hours', e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          className="w-16 py-1 px-1.5 text-sm text-right rounded border border-app-bright outline-none"
                        />
                      ) : (
                        <button
                          type="button"
                          disabled={isReadOnly}
                          onClick={() => !isReadOnly && setEditingCell({ logId: log.id, field: 'hours' })}
                          className={isReadOnly ? 'cursor-default' : `${cellBtnClass} text-right`}
                        >
                          {fmtHours(log.hours)}
                        </button>
                      )}
                    </td>

                    {/* Level (quick-edit) */}
                    <td className="px-3 py-2 align-top whitespace-nowrap">
                      {!isReadOnly && isEditing(log.id, 'schoolLevel') ? (
                        <select
                          defaultValue={log.schoolLevel}
                          autoFocus
                          onBlur={(e) => commitEdit(log, 'schoolLevel', e.target.value)}
                          onChange={(e) => commitEdit(log, 'schoolLevel', e.target.value)}
                          className="py-1 px-1.5 text-sm rounded border border-app-bright outline-none"
                        >
                          {SCHOOL_LEVELS.map((l) => (
                            <option key={l} value={l}>
                              {l}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <button
                          type="button"
                          disabled={isReadOnly}
                          onClick={() =>
                            !isReadOnly && setEditingCell({ logId: log.id, field: 'schoolLevel' })
                          }
                          className={isReadOnly ? 'cursor-default' : cellBtnClass}
                        >
                          <span className="text-xs font-black uppercase tracking-wide text-app-slate">
                            {log.schoolLevel}
                          </span>
                        </button>
                      )}
                    </td>

                    {/* Row actions */}
                    {!isReadOnly && (
                      <td className="px-3 py-2 align-top">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onEditEntry(log)}
                            aria-label="Edit entry"
                            className="p-1.5 rounded-lg text-app-slate hover:bg-app-bright hover:text-white transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => onDeleteLog(log.id)}
                            aria-label="Delete entry"
                            className="p-1.5 rounded-lg text-app-slate hover:bg-red-500 hover:text-white transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>

                  {/* Expanded detail row */}
                  {expanded && (
                    <tr className="bg-app-bg/60 border-b border-app-dark/10">
                      <td />
                      <td colSpan={isReadOnly ? 6 : 7} className="px-3 py-4">
                        <div className="space-y-4 max-w-3xl">
                          <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-app-slate mb-1">
                              Description
                            </h4>
                            <p className="text-sm text-app-dark font-medium whitespace-pre-wrap">
                              {log.description || log.activity || 'No description recorded.'}
                            </p>
                          </div>

                          <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-app-slate mb-1.5">
                              Competencies
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                              {(log.taggedCompetencyIds ?? []).length === 0 &&
                                !log.primaryCompetencyId && (
                                  <span className="text-sm text-app-slate">None tagged.</span>
                                )}
                              {log.primaryCompetencyId && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-app-dark text-white text-xs font-black">
                                  <Star size={11} className="fill-current" />
                                  {log.primaryCompetencyId}
                                  {competencyById.get(log.primaryCompetencyId)
                                    ? `: ${competencyById.get(log.primaryCompetencyId)!.title}`
                                    : ''}
                                </span>
                              )}
                              {(log.taggedCompetencyIds ?? [])
                                .filter((id) => id !== log.primaryCompetencyId)
                                .map((id) => (
                                  <span
                                    key={id}
                                    className="px-2 py-1 rounded-lg bg-white border border-app-dark/10 text-app-slate text-xs font-black"
                                  >
                                    {id}
                                    {competencyById.get(id) ? `: ${competencyById.get(id)!.title}` : ''}
                                  </span>
                                ))}
                            </div>
                          </div>

                          {log.evidenceLinks && log.evidenceLinks.length > 0 && (
                            <div>
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-app-slate mb-1.5">
                                Evidence Links
                              </h4>
                              <ul className="space-y-1">
                                {log.evidenceLinks.map((link) => (
                                  <li key={link.id}>
                                    <a
                                      href={link.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 text-sm font-bold text-app-bright hover:underline"
                                    >
                                      <LinkIcon size={13} />
                                      {link.label || link.url}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {log.meetingNotes && log.meetingNotes.reflection && (
                            <div>
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-app-slate mb-1.5 flex items-center gap-1.5">
                                <MessageSquare size={12} /> Meeting Notes
                              </h4>
                              <p className="text-sm text-app-dark font-medium whitespace-pre-wrap">
                                {log.meetingNotes.reflection}
                              </p>
                            </div>
                          )}

                          {log.reflections && (
                            <div>
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-app-slate mb-1.5">
                                Reflection
                              </h4>
                              <p className="text-sm text-app-dark font-medium whitespace-pre-wrap">
                                {log.reflections}
                              </p>
                            </div>
                          )}

                          {!isReadOnly && (
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                onClick={() => onEditEntry(log)}
                                className="flex items-center gap-1.5 py-1.5 px-3 text-xs font-black uppercase tracking-widest text-white bg-app-dark rounded-lg hover:bg-black transition-colors"
                              >
                                <Pencil size={13} /> Edit
                              </button>
                              <button
                                onClick={() => onDeleteLog(log.id)}
                                className="flex items-center gap-1.5 py-1.5 px-3 text-xs font-black uppercase tracking-widest text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                              >
                                <Trash2 size={13} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>

          {/* Totals row for the current filtered set */}
          {filteredLogs.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-app-dark/20 bg-app-bg font-black text-app-dark">
                <td />
                <td className="px-3 py-3 text-[10px] uppercase tracking-widest text-app-slate" colSpan={4}>
                  Totals ({filteredLogs.length} {filteredLogs.length === 1 ? 'entry' : 'entries'})
                  <span className="ml-3 font-bold normal-case tracking-normal text-app-slate">
                    {SCHOOL_LEVELS.filter((l) => hoursByLevel[l]).map((l) => (
                      <span key={l} className="mr-3">
                        {l}: {fmtHours(hoursByLevel[l])}
                      </span>
                    ))}
                  </span>
                </td>
                <td className="px-3 py-3 text-right text-base whitespace-nowrap">
                  {fmtHours(grandTotal)} hrs
                </td>
                <td />
                {!isReadOnly && <td />}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Mobile card list — the table degrades to a scannable, tappable list on phones */}
      <div className="md:hidden space-y-2">
        {filteredLogs.length === 0 ? (
          <div className="rounded-xl border border-app-slate/15 bg-white px-4 py-8 text-center text-sm text-app-slate font-medium">
            No entries match the current filters.
          </div>
        ) : (
        <div className="rounded-xl border border-app-slate/15 bg-white overflow-hidden divide-y divide-app-slate/10">
        {filteredLogs.map((log) => {
          const expanded = expandedId === log.id;
          const tags = log.taggedCompetencyIds ?? [];
          const warnings = warningsByLog.get(log.id) ?? [];
          const incompleteTitle =
            warnings.length > 0
              ? `Incomplete — ${warnings.map((w) => w.message).join(' ')}`
              : undefined;
          return (
            <div key={log.id}>
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : log.id)}
                aria-expanded={expanded}
                className="w-full text-left px-4 py-3 min-h-[56px] flex items-start gap-3 hover:bg-app-slate/5 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {warnings.length > 0 && (
                      <span
                        title={incompleteTitle}
                        aria-label={incompleteTitle}
                        className="shrink-0 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-100 text-amber-600"
                      >
                        <AlertTriangle size={11} />
                      </span>
                    )}
                    <span className="font-bold text-app-dark truncate">
                      {log.title || log.activity || 'Untitled entry'}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-semibold text-app-slate">
                    <span className="tabular-nums">{log.date}</span>
                    <span className="opacity-40">·</span>
                    <span className="tabular-nums font-black text-app-dark">{fmtHours(log.hours)}h</span>
                    <span className="opacity-40">·</span>
                    <span className="uppercase tracking-wide text-[11px]">{log.schoolLevel}</span>
                    <span className="opacity-40">·</span>
                    <span className="truncate max-w-[120px]">{locationLabel(log)}</span>
                  </div>
                  {(log.primaryCompetencyId || tags.length > 0) && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {log.primaryCompetencyId && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-app-dark text-white text-[10px] font-black">
                          <Star size={9} className="fill-current" />
                          {log.primaryCompetencyId}
                        </span>
                      )}
                      {tags
                        .filter((id) => id !== log.primaryCompetencyId)
                        .slice(0, 4)
                        .map((id) => (
                          <span
                            key={id}
                            className="px-1.5 py-0.5 rounded bg-app-bright/10 text-app-slate text-[10px] font-black border border-app-bright/10"
                          >
                            {id}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
                <ChevronRight
                  size={18}
                  className={`shrink-0 mt-1 text-app-slate transition-transform ${expanded ? 'rotate-90' : ''}`}
                />
              </button>

              {expanded && (
                <div className="px-4 pb-4 pt-1 space-y-3 border-t border-app-dark/5 bg-app-bg/40">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-app-slate mb-1">
                      Description
                    </h4>
                    <p className="text-sm text-app-dark font-medium whitespace-pre-wrap">
                      {log.description || log.activity || 'No description recorded.'}
                    </p>
                  </div>

                  {(log.taggedCompetencyIds ?? []).length > 0 || log.primaryCompetencyId ? (
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-app-slate mb-1.5">
                        Competencies
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {log.primaryCompetencyId && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-app-dark text-white text-xs font-black">
                            <Star size={11} className="fill-current" />
                            {log.primaryCompetencyId}
                            {competencyById.get(log.primaryCompetencyId)
                              ? `: ${competencyById.get(log.primaryCompetencyId)!.title}`
                              : ''}
                          </span>
                        )}
                        {(log.taggedCompetencyIds ?? [])
                          .filter((id) => id !== log.primaryCompetencyId)
                          .map((id) => (
                            <span
                              key={id}
                              className="px-2 py-1 rounded-lg bg-white border border-app-dark/10 text-app-slate text-xs font-black"
                            >
                              {id}
                              {competencyById.get(id) ? `: ${competencyById.get(id)!.title}` : ''}
                            </span>
                          ))}
                      </div>
                    </div>
                  ) : null}

                  {log.evidenceLinks && log.evidenceLinks.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-app-slate mb-1.5">
                        Evidence Links
                      </h4>
                      <ul className="space-y-1">
                        {log.evidenceLinks.map((link) => (
                          <li key={link.id}>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm font-bold text-app-bright hover:underline"
                            >
                              <LinkIcon size={13} />
                              {link.label || link.url}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {log.meetingNotes && log.meetingNotes.reflection && (
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-app-slate mb-1.5 flex items-center gap-1.5">
                        <MessageSquare size={12} /> Meeting Notes
                      </h4>
                      <p className="text-sm text-app-dark font-medium whitespace-pre-wrap">
                        {log.meetingNotes.reflection}
                      </p>
                    </div>
                  )}

                  {log.reflections && (
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-app-slate mb-1.5">
                        Reflection
                      </h4>
                      <p className="text-sm text-app-dark font-medium whitespace-pre-wrap">
                        {log.reflections}
                      </p>
                    </div>
                  )}

                  {!isReadOnly && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => onEditEntry(log)}
                        className="flex-1 flex items-center justify-center gap-1.5 min-h-[44px] px-3 text-xs font-black uppercase tracking-widest text-white bg-app-dark rounded-xl hover:bg-black transition-colors active:scale-[0.99]"
                      >
                        <Pencil size={14} /> Edit
                      </button>
                      <button
                        onClick={() => onDeleteLog(log.id)}
                        aria-label="Delete entry"
                        className="flex items-center justify-center gap-1.5 min-h-[44px] px-4 text-xs font-black uppercase tracking-widest text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        </div>
        )}

        {/* Mobile totals */}
        {filteredLogs.length > 0 && (
          <div className="rounded-2xl border-2 border-app-dark/15 bg-app-bg px-4 py-3 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-app-slate">
              Total · {filteredLogs.length} {filteredLogs.length === 1 ? 'entry' : 'entries'}
            </span>
            <span className="text-base font-black text-app-dark tabular-nums">
              {fmtHours(grandTotal)} hrs
            </span>
          </div>
        )}
      </div>

      {/* Per-competency breakdown for the filtered set */}
      {competencyBreakdown.length > 0 && (
        <div className="rounded-2xl border border-app-dark/10 bg-white shadow-sm p-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-app-slate mb-3">
            Competency Breakdown (filtered) · attributed hours
          </h3>
          <div className="flex flex-wrap gap-2">
            {competencyBreakdown.map(([id, hrs]) => (
              <div
                key={id}
                title={competencyById.get(id)?.title}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-app-bg border border-app-dark/5"
              >
                <span className="text-xs font-black text-app-dark">{id}</span>
                <span className="text-xs font-bold text-app-bright">{fmtHours(hrs)} hrs</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const SortableTh: React.FC<{
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  align?: 'left' | 'right';
}> = ({ label, onClick, icon, align = 'left' }) => (
  <th className={`px-3 py-3 ${align === 'right' ? 'text-right' : 'text-left'}`}>
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 font-black uppercase tracking-widest text-[10px] text-app-slate hover:text-app-dark transition-colors ${
        align === 'right' ? 'flex-row-reverse' : ''
      }`}
    >
      {label}
      {icon}
    </button>
  </th>
);

export default LogTable;
