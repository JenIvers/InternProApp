/**
 * competency-metrics — pure functions for attributing logged hours to
 * competencies and computing coverage/rollup views.
 *
 * Hours attribution rules (in priority order):
 *  1. `entry.hourSplit` (Record<competencyId, hours>) overrides everything
 *     when present and non-empty; each competency gets its stated hours.
 *  2. Otherwise `entry.primaryCompetencyId` owns ALL of the entry's hours.
 *  3. Entries with neither contribute hours to no competency, but still
 *     count toward coverage (entryCount/evidenceCount) via
 *     `taggedCompetencyIds`.
 *
 * Coverage counting: a competency is "touched" by an entry when the entry
 * references it anywhere — taggedCompetencyIds, primaryCompetencyId, or a
 * key of hourSplit. evidenceCount sums (evidenceLinks + artifactIds) of
 * every entry touching the competency.
 *
 * Status thresholds (documented, deliberately simple):
 *  - 'gap'     — no entries touch the competency at all.
 *  - 'covered' — at least COVERED_MIN_HOURS (3) attributed hours AND at
 *                least COVERED_MIN_EVIDENCE (1) piece of evidence.
 *  - 'thin'    — touched, but below the covered bar.
 */

import type { Competency, InternshipLog } from '../../types';

export const COVERED_MIN_HOURS = 3;
export const COVERED_MIN_EVIDENCE = 1;

export type CoverageStatus = 'covered' | 'thin' | 'gap';

export interface CompetencyCoverage {
  hours: number;
  entryCount: number;
  evidenceCount: number;
  status: CoverageStatus;
}

export interface CategoryRollup {
  hours: number;
  entryCount: number; // entries touching any competency in the category (deduped)
  evidenceCount: number;
  competencyCount: number;
  covered: number;
  thin: number;
  gap: number;
}

/** Round to 2 decimals to avoid floating-point drift in sums. */
const round2 = (n: number): number => Math.round(n * 100) / 100;

function hasSplit(log: InternshipLog): boolean {
  return !!log.hourSplit && Object.keys(log.hourSplit).length > 0;
}

/** All competency ids an entry references (tags, primary, split keys). */
function touchedIds(log: InternshipLog): Set<string> {
  const ids = new Set<string>(log.taggedCompetencyIds ?? []);
  if (log.primaryCompetencyId) ids.add(log.primaryCompetencyId);
  if (log.hourSplit) for (const id of Object.keys(log.hourSplit)) ids.add(id);
  return ids;
}

/** Hours attributed to each competency by a single entry, per the rules above. */
function entryHours(log: InternshipLog): Record<string, number> {
  if (hasSplit(log)) return { ...log.hourSplit! };
  if (log.primaryCompetencyId) return { [log.primaryCompetencyId]: log.hours };
  return {};
}

/**
 * Total attributed hours per competency across all logs.
 * Only competencies that receive hours appear as keys.
 */
export function computeCompetencyHours(logs: InternshipLog[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const log of logs) {
    const attributed = entryHours(log);
    for (const [id, h] of Object.entries(attributed)) {
      out[id] = round2((out[id] ?? 0) + h);
    }
  }
  return out;
}

/**
 * Per-competency coverage for every competency in `competencies`
 * (competencies never referenced by any log get a 'gap' row with zeros).
 * Ids referenced by logs but absent from `competencies` are ignored.
 */
export function computeCoverage(
  logs: InternshipLog[],
  competencies: Competency[]
): Record<string, CompetencyCoverage> {
  const hours = computeCompetencyHours(logs);
  const out: Record<string, CompetencyCoverage> = {};
  for (const c of competencies) {
    out[c.id] = { hours: hours[c.id] ?? 0, entryCount: 0, evidenceCount: 0, status: 'gap' };
  }
  for (const log of logs) {
    const evidence = (log.evidenceLinks?.length ?? 0) + (log.artifactIds?.length ?? 0);
    for (const id of touchedIds(log)) {
      const row = out[id];
      if (!row) continue; // unknown competency id
      row.entryCount += 1;
      row.evidenceCount += evidence;
    }
  }
  for (const row of Object.values(out)) {
    if (row.entryCount === 0) row.status = 'gap';
    else if (row.hours >= COVERED_MIN_HOURS && row.evidenceCount >= COVERED_MIN_EVIDENCE)
      row.status = 'covered';
    else row.status = 'thin';
  }
  return out;
}

/**
 * Category group of a competency id: the leading non-digit prefix
 * ('A1' -> 'A', 'P_B3' -> 'P_B', 'O4' -> 'O', 'A' -> 'A').
 */
export function categoryGroupOf(competencyId: string): string {
  return competencyId.replace(/\d+$/, '');
}

/**
 * Rollups keyed by category group (id prefix — see categoryGroupOf).
 * Hours/evidence sum the member competencies' coverage rows; entryCount is
 * the number of distinct log entries touching any competency in the group.
 */
export function computeCategoryRollups(
  logs: InternshipLog[],
  competencies: Competency[]
): Record<string, CategoryRollup> {
  const coverage = computeCoverage(logs, competencies);
  const out: Record<string, CategoryRollup> = {};
  const groupOfId = new Map<string, string>();
  for (const c of competencies) {
    const g = categoryGroupOf(c.id);
    groupOfId.set(c.id, g);
    const row = (out[g] ??= {
      hours: 0,
      entryCount: 0,
      evidenceCount: 0,
      competencyCount: 0,
      covered: 0,
      thin: 0,
      gap: 0,
    });
    const cov = coverage[c.id];
    row.hours = round2(row.hours + cov.hours);
    row.evidenceCount += cov.evidenceCount;
    row.competencyCount += 1;
    row[cov.status] += 1;
  }
  // Deduped entry counts per group.
  for (const log of logs) {
    const groups = new Set<string>();
    for (const id of touchedIds(log)) {
      const g = groupOfId.get(id);
      if (g) groups.add(g);
    }
    for (const g of groups) out[g].entryCount += 1;
  }
  return out;
}
