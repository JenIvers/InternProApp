import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Clock,
  GraduationCap,
  School,
  Building2,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { AppSettings, Competency, InternshipLog, LevelBucket } from '../types';
import { computeProgress } from '../lib/progress';
import { computeCategoryRollups, computeCompetencyHours } from '../lib/competency-metrics';
import { validateEntry } from '../lib/entry-validation';

export interface DashboardNewProps {
  logs: InternshipLog[];
  competencies: Competency[];
  settings?: AppSettings;
  /** Ids of entries flagged by migration for a one-time primary-competency review. */
  needsPrimaryReview?: string[];
  /** Navigate to the log editor for a given entry id (used by the "needs review" callout). */
  onReviewEntry?: (logId: string) => void;
  /** Jump to the Activity Log with the "Incomplete only" filter enabled. */
  onReviewIncomplete?: () => void;
  isReadOnly: boolean;
}

const BUCKET_META: Record<LevelBucket, { label: string; icon: React.ElementType }> = {
  HighSchool: { label: 'High School', icon: GraduationCap },
  Elementary: { label: 'Elementary', icon: School },
  Middle: { label: 'Middle', icon: Building2 },
};

const round1 = (n: number): number => Math.round(n * 10) / 10;

/** Category header rows in CORE_COMPETENCIES have single-letter (or short) ids with no digits. */
const isCategoryHeader = (c: Competency): boolean => !/\d/.test(c.id);

const DashboardNew: React.FC<DashboardNewProps> = ({
  logs,
  competencies,
  settings,
  needsPrimaryReview = [],
  onReviewEntry,
  onReviewIncomplete,
  isReadOnly,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const progress = useMemo(() => computeProgress(logs, settings), [logs, settings]);
  const categoryRollups = useMemo(
    () => computeCategoryRollups(logs, competencies),
    [logs, competencies]
  );
  const competencyHours = useMemo(() => computeCompetencyHours(logs), [logs]);
  const incompleteCount = useMemo(
    () => logs.reduce((n, log) => (validateEntry(log).length > 0 ? n + 1 : n), 0),
    [logs]
  );

  const categoryHeaders = useMemo(
    () => competencies.filter(isCategoryHeader).sort((a, b) => a.id.localeCompare(b.id)),
    [competencies]
  );
  const subCompetenciesByCategory = useMemo(() => {
    const map = new Map<string, Competency[]>();
    for (const c of competencies) {
      if (isCategoryHeader(c)) continue;
      const group = c.id.replace(/\d+$/, '');
      const list = map.get(group) ?? [];
      list.push(c);
      map.set(group, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.id.localeCompare(b.id));
    return map;
  }, [competencies]);

  const hoursOverTimeData = useMemo(() => {
    const byMonth = new Map<string, number>();
    for (const log of logs) {
      const month = (log.date ?? '').slice(0, 7); // YYYY-MM
      if (!month) continue;
      byMonth.set(month, round1((byMonth.get(month) ?? 0) + (log.hours || 0)));
    }
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, hours]) => ({ month, hours }));
  }, [logs]);

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const reviewLogsById = useMemo(() => {
    const map = new Map<string, InternshipLog>();
    for (const log of logs) map.set(log.id, log);
    return map;
  }, [logs]);

  const buckets: LevelBucket[] = ['HighSchool', 'Elementary', 'Middle'];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-app-dark tracking-tight">Dashboard</h1>
        <p className="text-app-slate text-sm font-medium opacity-70">
          Progress toward your internship hour requirements and competency coverage.
        </p>
      </header>

      {needsPrimaryReview.length > 0 && (
        <section className="rounded-xl border border-amber-300 bg-amber-50 px-4 sm:px-5 py-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-amber-800">
              {needsPrimaryReview.length} {needsPrimaryReview.length === 1 ? 'entry needs' : 'entries need'} a primary-competency review
            </h2>
            <p className="text-xs text-amber-700 opacity-80 mb-2">
              These entries had their primary competency guessed during migration. Please confirm it.
            </p>
            <ul className="flex flex-wrap gap-2">
              {needsPrimaryReview.map((id) => {
                const log = reviewLogsById.get(id);
                const label = log ? (log.title || log.description || log.activity || id) : id;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => onReviewEntry?.(id)}
                      className="text-xs font-semibold px-3 py-2 rounded-lg bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors truncate max-w-[220px]"
                      title={label}
                    >
                      {label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {incompleteCount > 0 && (
        <section className="rounded-xl border border-amber-300 bg-amber-50 px-4 sm:px-5 py-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-amber-800">
              {incompleteCount} {incompleteCount === 1 ? 'entry is' : 'entries are'} missing details
            </h2>
            <p className="text-xs text-amber-700 opacity-80 mb-2">
              Quick-capture entries with no description, competency, or other gaps. Tap to finish them.
            </p>
            <button
              type="button"
              onClick={() => onReviewIncomplete?.()}
              className="text-xs font-semibold px-3 py-2 rounded-lg bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 transition-colors"
            >
              Review in Activity Log
            </button>
          </div>
        </section>
      )}

      {/* Requirement progress */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {buckets.map((bucket) => {
          const meta = BUCKET_META[bucket];
          const Icon = meta.icon;
          const done = round1(progress.byBucket[bucket]);
          const target = progress.targets[bucket];
          const remaining = round1(progress.remainingByBucket[bucket]);
          const pct = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;
          const isPrimary = bucket === progress.primaryLevel;
          return (
            <div
              key={bucket}
              className="rounded-xl border border-app-slate/15 bg-white px-4 py-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-app-dark">
                  <Icon size={16} />
                  <span className="text-xs font-bold uppercase tracking-wide">{meta.label}</span>
                </div>
                {isPrimary && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-app-bright bg-app-bright/10 px-2 py-0.5 rounded-full">
                    Primary
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-2xl font-black text-app-dark tabular-nums">{done}</span>
                <span className="text-xs font-semibold text-app-slate opacity-60">/ {target}h</span>
              </div>
              <div className="w-full h-2 rounded-full bg-app-slate/10 overflow-hidden mb-2">
                <div
                  className="h-full rounded-full bg-app-bright"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-[11px] font-medium text-app-slate opacity-70">
                {remaining > 0 ? `${remaining}h remaining` : 'Target met'}
              </p>
            </div>
          );
        })}

        <div className="rounded-xl border border-app-dark/15 bg-app-dark px-4 py-4 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} />
            <span className="text-xs font-bold uppercase tracking-wide">Total</span>
          </div>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-2xl font-black tabular-nums">{round1(progress.total)}</span>
            <span className="text-xs font-semibold opacity-60">
              / {round1(progress.total + progress.remainingTotal)}h
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden mb-2">
            <div
              className="h-full rounded-full bg-white"
              style={{
                width: `${
                  progress.total + progress.remainingTotal > 0
                    ? Math.min(100, Math.round((progress.total / (progress.total + progress.remainingTotal)) * 100))
                    : 0
                }%`,
              }}
            />
          </div>
          <p className="text-[11px] font-medium opacity-70">
            {progress.remainingTotal > 0 ? `${round1(progress.remainingTotal)}h remaining` : 'Target met'}
          </p>
        </div>
      </section>

      {/* Hours over time */}
      {hoursOverTimeData.length > 1 && (
        <section className="rounded-xl border border-app-slate/15 bg-white px-5 py-5">
          <h2 className="text-sm font-bold text-app-dark mb-4">Hours logged by month</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={hoursOverTimeData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="month"
                  fontSize={10}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontWeight: 600, fill: '#6492A0' }}
                />
                <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#6492A0' }} />
                <Tooltip
                  cursor={{ fill: 'rgba(66, 131, 164, 0.06)' }}
                  contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: 12 }}
                />
                <Bar dataKey="hours" radius={[4, 4, 0, 0]} fill="#4283A4" maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Hours by competency, grouped by category */}
      <section className="rounded-xl border border-app-slate/15 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-app-slate/10">
          <h2 className="text-sm font-bold text-app-dark">Hours by competency</h2>
          <p className="text-[11px] font-medium text-app-slate opacity-70">
            Grouped by category. Expand a category to see sub-competencies.
          </p>
        </div>
        <ul className="divide-y divide-app-slate/10">
          {categoryHeaders.map((cat) => {
            const rollup = categoryRollups[cat.id];
            const subs = subCompetenciesByCategory.get(cat.id) ?? [];
            const expanded = expandedCategories.has(cat.id);
            const hours = rollup ? round1(rollup.hours) : 0;
            return (
              <li key={cat.id}>
                <button
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-app-slate/5 transition-colors text-left"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    {expanded ? (
                      <ChevronDown size={14} className="text-app-slate shrink-0" />
                    ) : (
                      <ChevronRight size={14} className="text-app-slate shrink-0" />
                    )}
                    <span className="text-xs font-bold text-app-dark truncate">
                      {cat.id} · {cat.title}
                    </span>
                  </span>
                  <span className="flex items-center gap-3 shrink-0 text-[11px] font-semibold text-app-slate">
                    {rollup && (
                      <span className="hidden sm:inline opacity-60">
                        {rollup.covered} covered · {rollup.thin} thin · {rollup.gap} gap
                      </span>
                    )}
                    <span className="tabular-nums text-app-dark">{hours}h</span>
                  </span>
                </button>
                {expanded && (
                  <ul className="pb-2">
                    {subs.map((sub) => (
                      <li
                        key={sub.id}
                        className="flex items-center justify-between pl-11 pr-5 py-1.5 text-xs"
                      >
                        <span className="text-app-slate truncate mr-3">
                          {sub.id} · {sub.title}
                        </span>
                        <span className="tabular-nums font-semibold text-app-dark shrink-0">
                          {round1(competencyHours[sub.id] ?? 0)}h
                        </span>
                      </li>
                    ))}
                    {subs.length === 0 && (
                      <li className="pl-11 pr-5 py-1.5 text-xs text-app-slate opacity-60">
                        No sub-competencies.
                      </li>
                    )}
                  </ul>
                )}
              </li>
            );
          })}
          {categoryHeaders.length === 0 && (
            <li className="px-5 py-6 text-xs text-app-slate opacity-60 text-center">
              No competencies configured.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
};

export default DashboardNew;
