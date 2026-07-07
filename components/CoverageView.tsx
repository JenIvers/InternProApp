import React, { useMemo, useState } from 'react';
import { InternshipLog, Competency } from '../types';
import { computeCoverage, categoryGroupOf, CoverageStatus, CompetencyCoverage } from '../lib/competency-metrics';
import { CheckCircle2, AlertTriangle, XCircle, Filter, Layers } from 'lucide-react';

export interface CoverageViewProps {
  logs: InternshipLog[];
  competencies: Competency[];
  isReadOnly: boolean;
  onViewCompetencyLogs: (competencyId: string) => void;
}

const STATUS_META: Record<CoverageStatus, { label: string; icon: React.FC<{ size?: number; strokeWidth?: number; className?: string }>; className: string }> = {
  covered: { label: 'Covered', icon: CheckCircle2, className: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  thin: { label: 'Thin', icon: AlertTriangle, className: 'text-amber-600 bg-amber-50 border-amber-200' },
  gap: { label: 'Gap', icon: XCircle, className: 'text-rose-600 bg-rose-50 border-rose-200' },
};

const CoverageView: React.FC<CoverageViewProps> = ({ logs, competencies, isReadOnly, onViewCompetencyLogs }) => {
  const [gapsOnly, setGapsOnly] = useState(false);

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

  return (
    <div className="space-y-6 pb-20 md:pb-8 px-1">
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
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-colors ${
            gapsOnly
              ? 'bg-app-dark text-white border-app-dark'
              : 'bg-white text-app-slate border-app-dark/10 hover:border-app-dark/30'
          }`}
        >
          <Filter size={14} strokeWidth={2.5} />
          {gapsOnly ? 'Showing gaps only' : 'Show gaps only'}
        </button>
      </div>

      <div className="space-y-8">
        {grouped.map(([category, comps]) => {
          const rows = comps.filter(c => !gapsOnly || coverage[c.id]?.status === 'gap');
          if (rows.length === 0) return null;
          return (
            <div key={category} className="bg-white rounded-xl border border-app-dark/10 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-app-bg border-b border-app-dark/10">
                <Layers size={14} className="text-app-slate" strokeWidth={2.5} />
                <h3 className="text-xs font-bold uppercase tracking-widest text-app-slate">Category {category}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-app-slate/70 border-b border-app-dark/5">
                      <th className="px-3 sm:px-4 py-2 font-bold">Competency</th>
                      <th className="px-3 sm:px-4 py-2 font-bold text-right">Hours</th>
                      <th className="px-4 py-2 font-bold text-right hidden sm:table-cell">Entries</th>
                      <th className="px-4 py-2 font-bold text-right hidden sm:table-cell">Evidence</th>
                      <th className="px-3 sm:px-4 py-2 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(c => {
                      const row = coverage[c.id];
                      const meta = STATUS_META[row?.status ?? 'gap'];
                      const Icon = meta.icon;
                      return (
                        <tr
                          key={c.id}
                          onClick={() => onViewCompetencyLogs(c.id)}
                          className="border-b border-app-dark/5 last:border-0 cursor-pointer hover:bg-app-bg/60 transition-colors"
                        >
                          <td className="px-3 sm:px-4 py-3">
                            <div className="font-bold text-app-dark">{c.id}</div>
                            <div className="text-app-slate text-xs">{c.title}</div>
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-right font-semibold text-app-dark tabular-nums">
                            {row?.hours.toFixed(1) ?? '0.0'}
                          </td>
                          <td className="px-4 py-3 text-right text-app-slate tabular-nums hidden sm:table-cell">{row?.entryCount ?? 0}</td>
                          <td className="px-4 py-3 text-right text-app-slate tabular-nums hidden sm:table-cell">{row?.evidenceCount ?? 0}</td>
                          <td className="px-3 sm:px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${meta.className}`}>
                              <Icon size={12} strokeWidth={2.5} />
                              {meta.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
        {grouped.every(([, comps]) => comps.every(c => gapsOnly && coverage[c.id]?.status !== 'gap')) && gapsOnly && totalGaps === 0 && (
          <div className="text-center py-12 text-app-slate">No gaps — nice work.</div>
        )}
      </div>
      {isReadOnly && (
        <p className="text-center text-xs text-app-slate/60 uppercase tracking-widest font-bold">Read-only view</p>
      )}
    </div>
  );
};

export default CoverageView;
