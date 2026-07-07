import type { InternshipLog, AttainmentLevel, SchoolLevel } from '@/types';

export interface LogQueryDateRange {
  from?: string;
  to?: string;
}

export interface LogQuerySort {
  key: 'date' | 'hours' | 'schoolLevel';
  dir: 'asc' | 'desc';
}

export interface LogQuery {
  search?: string;
  competencyIds?: string[];
  levels?: AttainmentLevel[] | SchoolLevel[];
  siteIds?: string[];
  dateRange?: LogQueryDateRange;
  sort?: LogQuerySort;
}

function matchesSearch(log: InternshipLog, search: string): boolean {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  const haystacks = [log.title, log.description, log.activity, log.location];
  return haystacks.some(
    (field) => typeof field === 'string' && field.toLowerCase().includes(needle)
  );
}

function matchesCompetencies(log: InternshipLog, competencyIds: string[]): boolean {
  if (competencyIds.length === 0) return true;
  const tagged = log.taggedCompetencyIds ?? [];
  return competencyIds.some(
    (id) => tagged.includes(id) || log.primaryCompetencyId === id
  );
}

function matchesLevels(log: InternshipLog, levels: string[]): boolean {
  if (levels.length === 0) return true;
  return levels.includes(log.schoolLevel);
}

function matchesSites(log: InternshipLog, siteIds: string[]): boolean {
  if (siteIds.length === 0) return true;
  if (!log.siteId) return false;
  return siteIds.includes(log.siteId);
}

function matchesDateRange(log: InternshipLog, range: LogQueryDateRange): boolean {
  if (!range) return true;
  const date = log.date;
  if (range.from && date < range.from) return false;
  if (range.to && date > range.to) return false;
  return true;
}

const SCHOOL_LEVEL_ORDER: Record<SchoolLevel, number> = {
  Elementary: 0,
  Intermediate: 1,
  Middle: 2,
  'High School': 3,
};

function compare(a: InternshipLog, b: InternshipLog, sort: LogQuerySort): number {
  let result = 0;
  switch (sort.key) {
    case 'date':
      result = a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
      break;
    case 'hours':
      result = a.hours - b.hours;
      break;
    case 'schoolLevel':
      result = SCHOOL_LEVEL_ORDER[a.schoolLevel] - SCHOOL_LEVEL_ORDER[b.schoolLevel];
      break;
  }
  return sort.dir === 'desc' ? -result : result;
}

/**
 * Filters and optionally sorts internship logs according to `query`.
 * Pure function: does not mutate `logs`. Sort is stable.
 */
export function applyLogQuery(
  logs: InternshipLog[],
  query: LogQuery = {}
): InternshipLog[] {
  const { search, competencyIds = [], levels = [], siteIds = [], dateRange, sort } = query;

  let result = logs.filter((log) => {
    if (search && !matchesSearch(log, search)) return false;
    if (!matchesCompetencies(log, competencyIds)) return false;
    if (!matchesLevels(log, levels as string[])) return false;
    if (!matchesSites(log, siteIds)) return false;
    if (dateRange && !matchesDateRange(log, dateRange)) return false;
    return true;
  });

  if (sort) {
    // Decorate-sort-undecorate for stability (Array.prototype.sort is stable
    // in modern engines, but we make it explicit/robust here anyway).
    result = result
      .map((log, index) => ({ log, index }))
      .sort((a, b) => {
        const c = compare(a.log, b.log, sort);
        return c !== 0 ? c : a.index - b.index;
      })
      .map((entry) => entry.log);
  }

  return result;
}
