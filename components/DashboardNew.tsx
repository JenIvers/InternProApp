import React, { useMemo } from 'react';
import {
  AlertTriangle,
  ChevronRight,
  Clock,
  GraduationCap,
  School,
  Building2,
} from 'lucide-react';
import type { AppSettings, Artifact, Competency, InternshipLog, LevelBucket, Mentor } from '../types';
import ArtifactCarousel from './ArtifactCarousel';
import MentorRow from './MentorRow';
import { DEFAULT_DASHBOARD_MENTOR_COUNT, dashboardMentors } from '../lib/mentors';
import { computeProgress } from '../lib/progress';
import { computeCategoryRollups } from '../lib/competency-metrics';
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
  /** Jump to the Activity Log filtered to a requirement bucket's school level. */
  onViewLevelLogs?: (bucket: LevelBucket) => void;
  /** Navigate to the Competencies page for full drill-down. */
  onOpenCompetencies?: () => void;
  artifacts?: Artifact[];
  mentors?: Mentor[];
  onOpenArtifact?: (id: string) => void;
  onOpenPortfolio?: () => void;
  onOpenMentor?: (id: string) => void;
  onOpenMentors?: () => void;
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
  onViewLevelLogs,
  onOpenCompetencies,
  artifacts = [],
  mentors = [],
  onOpenArtifact,
  onOpenPortfolio,
  onOpenMentor,
  onOpenMentors,
  isReadOnly,
}) => {
  const progress = useMemo(() => computeProgress(logs, settings), [logs, settings]);
  const categoryRollups = useMemo(
    () => computeCategoryRollups(logs, competencies),
    [logs, competencies]
  );
  const incompleteCount = useMemo(
    () => logs.reduce((n, log) => (validateEntry(log).length > 0 ? n + 1 : n), 0),
    [logs]
  );

  const categoryHeaders = useMemo(
    () => competencies.filter(isCategoryHeader).sort((a, b) => a.id.localeCompare(b.id)),
    [competencies]
  );

  const rankedCategories = useMemo(() => {
    const withHours = categoryHeaders
      .map((cat) => ({ cat, hours: round1(categoryRollups[cat.id]?.hours ?? 0) }))
      .filter((c) => c.hours > 0)
      .sort((a, b) => b.hours - a.hours);
    const empty = categoryHeaders
      .filter((cat) => round1(categoryRollups[cat.id]?.hours ?? 0) === 0)
      .map((cat) => cat.id);
    const maxHours = withHours.length > 0 ? withHours[0].hours : 0;
    return { withHours, empty, maxHours };
  }, [categoryHeaders, categoryRollups]);

  const reviewLogsById = useMemo(() => {
    const map = new Map<string, InternshipLog>();
    for (const log of logs) map.set(log.id, log);
    return map;
  }, [logs]);

  // Primary level leads; the remaining levels keep a stable order after it.
  const buckets: LevelBucket[] = (['HighSchool', 'Elementary', 'Middle'] as LevelBucket[])
    .sort((a, b) =>
      (a === progress.primaryLevel ? 0 : 1) - (b === progress.primaryLevel ? 0 : 1)
    );

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

      {/* Requirement progress: Total leads as the headline stat, then the
          primary level, then the remaining levels. */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-app-slate/15 bg-app-deep px-4 py-4 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} />
            <span className="text-xs font-bold">Total</span>
          </div>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-2xl font-bold tabular-nums">{round1(progress.total)}</span>
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

        {buckets.map((bucket) => {
          const meta = BUCKET_META[bucket];
          const Icon = meta.icon;
          const done = round1(progress.byBucket[bucket]);
          const target = progress.targets[bucket];
          const remaining = round1(progress.remainingByBucket[bucket]);
          const pct = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;
          const isPrimary = bucket === progress.primaryLevel;
          return (
            <button
              key={bucket}
              type="button"
              onClick={() => onViewLevelLogs?.(bucket)}
              disabled={!onViewLevelLogs}
              className="rounded-xl border border-app-slate/15 bg-white px-4 py-4 text-left enabled:hover:border-app-slate/30 enabled:active:scale-[0.99] transition-all enabled:cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-app-dark">
                  <Icon size={16} />
                  <span className="text-xs font-bold">{meta.label}</span>
                </div>
                {isPrimary && (
                  <span className="text-[10px] font-bold text-app-bright bg-app-bright/10 px-2 py-0.5 rounded-full">
                    Primary
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-2xl font-bold text-app-dark tabular-nums">{done}</span>
                <span className="text-xs font-semibold text-app-slate opacity-60">/ {target}h</span>
              </div>
              <div className="w-full h-2 rounded-full bg-app-slate/10 overflow-hidden mb-2">
                <div
                  className="h-full rounded-full bg-brand-bar"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-[11px] font-medium text-app-slate opacity-70">
                {remaining > 0 ? `${remaining}h remaining` : 'Target met'}
              </p>
            </button>
          );
        })}
      </section>

      {/* Hours over time */}

      {/* Hours by competency, ranked by category */}
      <section className="rounded-xl border border-app-slate/15 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-app-slate/10 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-app-dark">Hours by competency</h2>
          </div>
          {onOpenCompetencies && (
            <button
              type="button"
              onClick={onOpenCompetencies}
              className="flex items-center gap-1 shrink-0 text-[11px] font-bold text-app-bright hover:text-app-deep transition-colors"
            >
              View all
              <ChevronRight size={12} />
            </button>
          )}
        </div>
        <ul className="divide-y divide-app-slate/10">
          {rankedCategories.withHours.map(({ cat, hours }) => {
            const rollup = categoryRollups[cat.id];
            const barPct = rankedCategories.maxHours > 0 ? Math.max(4, Math.round((hours / rankedCategories.maxHours) * 100)) : 0;
            const rowContent = (
              <>
                <span className="shrink-0 w-6 text-center text-[11px] font-bold text-app-dark bg-app-slate/10 rounded px-1 py-0.5">
                  {cat.id}
                </span>
                <span className="text-xs font-semibold text-app-dark truncate min-w-0 max-w-[9rem] sm:max-w-[14rem]">
                  {cat.title}
                </span>
                <span className="flex-1 min-w-0 h-1.5 rounded-full bg-app-slate/10 overflow-hidden">
                  <span
                    className="block h-full rounded-full bg-brand-bar"
                    style={{ width: `${barPct}%` }}
                  />
                </span>
                {rollup && (
                  <span className="hidden sm:inline shrink-0 text-[10px] font-medium text-app-slate opacity-60">
                    {rollup.complete} complete · {rollup.gap} gap
                  </span>
                )}
                <span className="shrink-0 text-xs font-bold text-app-dark tabular-nums w-12 text-right">
                  {hours}h
                </span>
              </>
            );
            return (
              <li key={cat.id}>
                {onOpenCompetencies ? (
                  <button
                    type="button"
                    onClick={onOpenCompetencies}
                    className="w-full flex items-center gap-3 px-5 py-2 h-10 text-left hover:bg-app-slate/5 transition-colors cursor-pointer"
                  >
                    {rowContent}
                  </button>
                ) : (
                  <div className="w-full flex items-center gap-3 px-5 py-2 h-10 text-left">
                    {rowContent}
                  </div>
                )}
              </li>
            );
          })}
          {rankedCategories.withHours.length === 0 && (
            <li className="px-5 py-6 text-xs text-app-slate opacity-60 text-center">
              No hours logged yet.
            </li>
          )}
        </ul>
        {rankedCategories.empty.length > 0 && (
          <div className="px-5 py-2.5 border-t border-app-slate/10 text-[11px] font-medium text-app-slate opacity-60">
            {rankedCategories.empty.length}{' '}
            {rankedCategories.empty.length === 1 ? 'category' : 'categories'} with no hours yet:{' '}
            {rankedCategories.empty.join(', ')}
          </div>
        )}
      </section>

      <ArtifactCarousel
        artifacts={artifacts}
        onOpenArtifact={(id) => onOpenArtifact?.(id)}
        onOpenPortfolio={() => onOpenPortfolio?.()}
      />

      <MentorRow
        mentors={dashboardMentors(mentors, settings?.mentorDashboardCount ?? DEFAULT_DASHBOARD_MENTOR_COUNT)}
        logs={logs}
        onOpenMentor={(id) => onOpenMentor?.(id)}
        onOpenAll={() => onOpenMentors?.()}
      />
    </div>
  );
};

export default DashboardNew;
