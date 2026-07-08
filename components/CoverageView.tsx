import React, { useMemo, useState } from 'react';
import { InternshipLog, Competency } from '../types';
import { computeCoverage, categoryGroupOf, CoverageStatus, CompetencyCoverage } from '../lib/competency-metrics';
import { CheckCircle2, AlertTriangle, XCircle, Filter, ChevronDown, ChevronUp } from 'lucide-react';

export interface CoverageViewProps {
  logs: InternshipLog[];
  competencies: Competency[];
  isReadOnly: boolean;
  onViewCompetencyLogs: (competencyId: string) => void;
}

const STATUS_META: Record<CoverageStatus, { label: string; icon: React.FC<{ size?: number; strokeWidth?: number; className?: string }>; className: string; dot: string }> = {
  covered: { label: 'Covered', icon: CheckCircle2, className: 'text-emerald-600 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  thin: { label: 'Thin', icon: AlertTriangle, className: 'text-amber-600 bg-amber-50 border-amber-200', dot: 'bg-amber-400' },
  gap: { label: 'Gap', icon: XCircle, className: 'text-rose-600 bg-rose-50 border-rose-200', dot: 'bg-rose-400' },
};

/** One competency row — shared by the expanded category tables and the flat filtered list. */
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

const CoverageView: React.FC<CoverageViewProps> = ({ logs, competencies, isReadOnly, onViewCompetencyLogs }) => {
  const [gapsOnly, setGapsOnly] = useState(false);
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

  const totalGaps = useMemo(
    () => Object.values(coverage).filter((row: CompetencyCoverage) => row.status === 'gap').length,
    [coverage]
  );

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category); else next.add(category);
      return next;
    });
  };

  // Filtered mode collapses the category structure entirely: one flat list.
  // The competency ids (A3, B7, …) already carry the category.
  const gapRows = useMemo(
    () => competencies.filter(c => (coverage[c.id]?.status ?? 'gap') === 'gap'),
    [competencies, coverage]
  );

  return (
    <div className="space-y-6 pb-20 md:pb-8 px-1 md:max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-app-dark tracking-tight">Coverage vs. Guide</h2>
          <p className="text-app-slate text-sm">
            {totalGaps > 0
              ? `${totalGaps} competenc${totalGaps === 1 ? 'y has' : 'ies have'} no evidence yet.`
              : 'Every competency has at least some evidence.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setGapsOnly(v => !v)}
          aria-pressed={gapsOnly}
          className={`flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-lg text-xs font-semibold border transition-colors ${
            gapsOnly
              ? 'bg-app-dark text-white border-app-dark'
              : 'bg-white text-app-slate border-app-slate/15 hover:border-app-slate/30'
          }`}
        >
          <Filter size={14} strokeWidth={2.5} />
          Gaps only
        </button>
      </div>

      {gapsOnly ? (
        // Filtered: a single cohesive list — no category cards or section headers.
        totalGaps === 0 ? (
          <div className="text-center py-12 text-app-slate text-sm font-semibold">No gaps — nice work.</div>
        ) : (
          <div className="bg-white rounded-xl border border-app-slate/15 overflow-hidden divide-y divide-app-slate/10">
            {gapRows.map(c => (
              <CompetencyRow key={c.id} competency={c} row={coverage[c.id]} onClick={() => onViewCompetencyLogs(c.id)} />
            ))}
          </div>
        )
      ) : (
        // Full view: one grouped list, not per-category cards. Each category is
        // a summary row (covered / thin / gap counts) that expands in place;
        // expanded rows tint their competency list so the hierarchy stays legible.
        <div className="bg-white rounded-xl border border-app-slate/15 overflow-hidden divide-y divide-app-slate/10">
          {grouped.map(([category, comps]) => {
            const open = openCategories.has(category);
            const counts = comps.reduce(
              (acc, c) => {
                const status = coverage[c.id]?.status ?? 'gap';
                acc[status] += 1;
                return acc;
              },
              { covered: 0, thin: 0, gap: 0 } as Record<CoverageStatus, number>
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
                      {(['covered', 'thin', 'gap'] as CoverageStatus[]).map(status =>
                        counts[status] > 0 ? (
                          <span key={status} className="flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_META[status].dot}`} />
                            {counts[status]}
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

export default CoverageView;
