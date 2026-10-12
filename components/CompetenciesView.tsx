import React, { useMemo, useState } from 'react';
import { InternshipLog, Competency } from '../types';
import {
  computeCoverage,
  categoryGroupOf,
  COVERED_MIN_HOURS,
  CoverageStatus,
  CompetencyCoverage,
} from '../lib/competency-metrics';
import { CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

export interface CompetenciesViewProps {
  logs: InternshipLog[];
  competencies: Competency[];
  isReadOnly: boolean;
  onViewCompetencyLogs: (competencyId: string) => void;
}

const STATUS_META: Record<CoverageStatus, { label: string; icon: React.FC<{ size?: number; strokeWidth?: number; className?: string }>; className: string; dot: string }> = {
  complete: { label: 'Complete', icon: CheckCircle2, className: 'text-emerald-600 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  gap: { label: 'Gap', icon: XCircle, className: 'text-rose-600 bg-rose-50 border-rose-200', dot: 'bg-rose-400' },
};

type StatusFilter = 'all' | CoverageStatus;

/** One competency row — shared by the expanded category lists and the flat filtered list. */
const CompetencyRow: React.FC<{
  competency: Competency;
  row?: CompetencyCoverage;
  onClick: () => void;
}> = ({ competency, row, onClick }) => {
  const meta = STATUS_META[row?.status ?? 'gap'];
  const Icon = meta.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 min-h-[52px] text-left hover:bg-app-bg/60 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm text-app-dark">{competency.id}</div>
        <div className="text-app-slate text-xs truncate">{competency.title}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="font-semibold text-sm text-app-dark tabular-nums">{row?.hours.toFixed(1) ?? '0.0'}</div>
        <div className="text-[11px] text-app-slate/60 tabular-nums hidden sm:block">
          {row?.entryCount ?? 0} {(row?.entryCount ?? 0) === 1 ? 'entry' : 'entries'} · {row?.evidenceCount ?? 0} evidence
        </div>
      </div>
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0 ${meta.className}`}>
        <Icon size={12} strokeWidth={2.5} />
        {meta.label}
      </span>
    </button>
  );
};

const CompetenciesView: React.FC<CompetenciesViewProps> = ({ logs, competencies, isReadOnly, onViewCompetencyLogs }) => {
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [openCategories, setOpenCategories] = useState<Set<string>>(() => new Set());

  const coverage = useMemo(() => computeCoverage(logs, competencies), [logs, competencies]);

  const grouped = useMemo(() => {
    const byCategory = new Map<string, Competency[]>();
    for (const c of competencies) {
      const g = categoryGroupOf(c.id);
      const list = byCategory.get(g) ?? [];
      list.push(c);
      byCategory.set(g, list);
    }
    return Array.from(byCategory.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [competencies]);

  const counts = useMemo(() => {
    const out: Record<StatusFilter, number> = { all: competencies.length, complete: 0, gap: 0 };
    for (const c of competencies) out[coverage[c.id]?.status ?? 'gap'] += 1;
    return out;
  }, [competencies, coverage]);

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category); else next.add(category);
      return next;
    });
  };

  // A status filter collapses the category structure into one flat list; the
  // competency ids (A3, B7, …) already carry the category.
  const filteredRows = useMemo(
    () => (filter === 'all' ? [] : competencies.filter(c => (coverage[c.id]?.status ?? 'gap') === filter)),
    [competencies, coverage, filter]
  );

  const tabs: { id: StatusFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'complete', label: 'Complete' },
    { id: 'gap', label: 'Gap' },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-8 px-1 md:max-w-4xl">
      <header className="min-w-0">
        <h1 className="text-2xl font-bold text-app-dark tracking-tight">Competencies</h1>
        <p className="text-app-slate text-sm opacity-70">
          A competency is complete once it has at least {COVERED_MIN_HOURS} hours and one piece of evidence.
        </p>
      </header>

      <div className="inline-flex p-1 rounded-lg bg-app-slate/10" role="tablist" aria-label="Filter competencies">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={filter === tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 min-h-[40px] rounded-md text-sm font-semibold transition-colors ${
              filter === tab.id ? 'bg-white text-app-dark shadow-sm' : 'text-app-slate hover:text-app-dark'
            }`}
          >
            {tab.label} <span className="opacity-50 ml-1 tabular-nums">{counts[tab.id]}</span>
          </button>
        ))}
      </div>

      {filter !== 'all' ? (
        filteredRows.length === 0 ? (
          <div className="text-center py-12 text-app-slate text-sm font-semibold">
            {filter === 'gap' ? 'No gaps — nice work.' : 'Nothing is complete yet.'}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-app-slate/15 overflow-hidden divide-y divide-app-slate/10">
            {filteredRows.map(c => (
              <CompetencyRow key={c.id} competency={c} row={coverage[c.id]} onClick={() => onViewCompetencyLogs(c.id)} />
            ))}
          </div>
        )
      ) : (
        // Full view: one grouped list. Each category is a summary row
        // (complete / gap counts) that expands in place.
        <div className="bg-white rounded-xl border border-app-slate/15 overflow-hidden divide-y divide-app-slate/10">
          {grouped.map(([category, comps]) => {
            const open = openCategories.has(category);
            const catCounts = comps.reduce(
              (acc, c) => {
                acc[coverage[c.id]?.status ?? 'gap'] += 1;
                return acc;
              },
              { complete: 0, gap: 0 } as Record<CoverageStatus, number>
            );
            return (
              <div key={category}>
                <button
                  type="button"
                  onClick={() => toggleCategory(category)}
                  aria-expanded={open}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 min-h-[52px] bg-white hover:bg-app-bg/40 transition-colors"
                >
                  <span className="text-sm font-bold text-app-dark">Category {category}</span>
                  <span className="flex items-center gap-3">
                    <span className="flex items-center gap-2.5 text-[11px] font-semibold text-app-slate tabular-nums">
                      {(['complete', 'gap'] as CoverageStatus[]).map(status =>
                        catCounts[status] > 0 ? (
                          <span key={status} className="flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_META[status].dot}`} />
                            {catCounts[status]}
                          </span>
                        ) : null
                      )}
                    </span>
                    <span className="text-app-slate/60">
                      {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </span>
                </button>
                {open && (
                  <div className="border-t border-app-slate/10 divide-y divide-app-slate/10 bg-app-bg/30">
                    {comps.map(c => (
                      <CompetencyRow key={c.id} competency={c} row={coverage[c.id]} onClick={() => onViewCompetencyLogs(c.id)} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {isReadOnly && (
        <p className="text-center text-xs text-app-slate/60 font-semibold">Read-only view</p>
      )}
    </div>
  );
};

export default CompetenciesView;
