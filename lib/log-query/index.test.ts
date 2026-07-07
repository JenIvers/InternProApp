import { describe, it, expect } from 'vitest';
import { applyLogQuery } from './index';
import type { InternshipLog, SchoolLevel } from '@/types';

function makeLog(overrides: Partial<InternshipLog>): InternshipLog {
  return {
    id: overrides.id ?? 'log-1',
    date: overrides.date ?? '2026-01-01',
    startTime: '08:00',
    endTime: '09:00',
    hours: overrides.hours ?? 1,
    title: overrides.title,
    activity: overrides.activity ?? '',
    description: overrides.description,
    location: overrides.location ?? '',
    siteId: overrides.siteId,
    schoolLevel: overrides.schoolLevel ?? 'High School',
    taggedCompetencyIds: overrides.taggedCompetencyIds ?? [],
    primaryCompetencyId: overrides.primaryCompetencyId,
    reflections: '',
    artifactIds: [],
    ...overrides,
  };
}

describe('applyLogQuery', () => {
  it('returns all logs when query is empty', () => {
    const logs = [makeLog({ id: 'a' }), makeLog({ id: 'b' })];
    expect(applyLogQuery(logs, {})).toHaveLength(2);
    expect(applyLogQuery(logs)).toHaveLength(2);
  });

  describe('search', () => {
    it('matches title case-insensitively', () => {
      const logs = [
        makeLog({ id: 'a', title: 'Budget Meeting' }),
        makeLog({ id: 'b', title: 'Recess Duty' }),
      ];
      const result = applyLogQuery(logs, { search: 'budget' });
      expect(result.map((l) => l.id)).toEqual(['a']);
    });

    it('matches description', () => {
      const logs = [
        makeLog({ id: 'a', description: 'Discussed staffing plan' }),
        makeLog({ id: 'b', description: 'Reviewed cafeteria menu' }),
      ];
      expect(applyLogQuery(logs, { search: 'staffing' }).map((l) => l.id)).toEqual(['a']);
    });

    it('matches legacy activity field', () => {
      const logs = [
        makeLog({ id: 'a', activity: 'Observed PLC session' }),
        makeLog({ id: 'b', activity: 'Hallway supervision' }),
      ];
      expect(applyLogQuery(logs, { search: 'plc' }).map((l) => l.id)).toEqual(['a']);
    });

    it('matches location', () => {
      const logs = [
        makeLog({ id: 'a', location: 'North Elementary' }),
        makeLog({ id: 'b', location: 'South Middle' }),
      ];
      expect(applyLogQuery(logs, { search: 'north' }).map((l) => l.id)).toEqual(['a']);
    });

    it('returns all logs for empty/whitespace search', () => {
      const logs = [makeLog({ id: 'a' }), makeLog({ id: 'b' })];
      expect(applyLogQuery(logs, { search: '   ' })).toHaveLength(2);
    });
  });

  describe('competencyIds', () => {
    it('matches via taggedCompetencyIds', () => {
      const logs = [
        makeLog({ id: 'a', taggedCompetencyIds: ['C1', 'C2'] }),
        makeLog({ id: 'b', taggedCompetencyIds: ['C3'] }),
      ];
      expect(applyLogQuery(logs, { competencyIds: ['C1'] }).map((l) => l.id)).toEqual(['a']);
    });

    it('matches via primaryCompetencyId', () => {
      const logs = [
        makeLog({ id: 'a', primaryCompetencyId: 'C9', taggedCompetencyIds: [] }),
        makeLog({ id: 'b', primaryCompetencyId: 'C8', taggedCompetencyIds: [] }),
      ];
      expect(applyLogQuery(logs, { competencyIds: ['C9'] }).map((l) => l.id)).toEqual(['a']);
    });
  });

  describe('levels', () => {
    it('filters by schoolLevel', () => {
      const logs = [
        makeLog({ id: 'a', schoolLevel: 'Elementary' }),
        makeLog({ id: 'b', schoolLevel: 'Middle' }),
      ];
      expect(applyLogQuery(logs, { levels: ['Elementary'] as SchoolLevel[] }).map((l) => l.id)).toEqual(['a']);
    });
  });

  describe('siteIds', () => {
    it('filters by siteId, ignoring location fallback', () => {
      const logs = [
        makeLog({ id: 'a', siteId: 'site-1', location: 'Somewhere' }),
        makeLog({ id: 'b', siteId: undefined, location: 'site-1' }),
      ];
      expect(applyLogQuery(logs, { siteIds: ['site-1'] }).map((l) => l.id)).toEqual(['a']);
    });
  });

  describe('dateRange', () => {
    it('filters by from/to inclusive', () => {
      const logs = [
        makeLog({ id: 'a', date: '2026-01-01' }),
        makeLog({ id: 'b', date: '2026-02-01' }),
        makeLog({ id: 'c', date: '2026-03-01' }),
      ];
      const result = applyLogQuery(logs, { dateRange: { from: '2026-01-15', to: '2026-02-15' } });
      expect(result.map((l) => l.id)).toEqual(['b']);
    });

    it('supports open-ended from', () => {
      const logs = [makeLog({ id: 'a', date: '2026-01-01' }), makeLog({ id: 'b', date: '2026-06-01' })];
      expect(applyLogQuery(logs, { dateRange: { from: '2026-03-01' } }).map((l) => l.id)).toEqual(['b']);
    });

    it('supports open-ended to', () => {
      const logs = [makeLog({ id: 'a', date: '2026-01-01' }), makeLog({ id: 'b', date: '2026-06-01' })];
      expect(applyLogQuery(logs, { dateRange: { to: '2026-03-01' } }).map((l) => l.id)).toEqual(['a']);
    });
  });

  describe('combined filters', () => {
    it('applies search + competency + level + site + date together', () => {
      const logs = [
        makeLog({
          id: 'match',
          title: 'Faculty Meeting',
          taggedCompetencyIds: ['C1'],
          schoolLevel: 'High School',
          siteId: 'site-1',
          date: '2026-02-10',
        }),
        makeLog({
          id: 'wrong-competency',
          title: 'Faculty Meeting',
          taggedCompetencyIds: ['C2'],
          schoolLevel: 'High School',
          siteId: 'site-1',
          date: '2026-02-10',
        }),
        makeLog({
          id: 'wrong-search',
          title: 'Recess Duty',
          taggedCompetencyIds: ['C1'],
          schoolLevel: 'High School',
          siteId: 'site-1',
          date: '2026-02-10',
        }),
      ];
      const result = applyLogQuery(logs, {
        search: 'faculty',
        competencyIds: ['C1'],
        levels: ['High School'] as SchoolLevel[],
        siteIds: ['site-1'],
        dateRange: { from: '2026-01-01', to: '2026-03-01' },
      });
      expect(result.map((l) => l.id)).toEqual(['match']);
    });
  });

  describe('sort', () => {
    it('sorts by date ascending/descending', () => {
      const logs = [
        makeLog({ id: 'a', date: '2026-03-01' }),
        makeLog({ id: 'b', date: '2026-01-01' }),
        makeLog({ id: 'c', date: '2026-02-01' }),
      ];
      expect(
        applyLogQuery(logs, { sort: { key: 'date', dir: 'asc' } }).map((l) => l.id)
      ).toEqual(['b', 'c', 'a']);
      expect(
        applyLogQuery(logs, { sort: { key: 'date', dir: 'desc' } }).map((l) => l.id)
      ).toEqual(['a', 'c', 'b']);
    });

    it('sorts by hours', () => {
      const logs = [
        makeLog({ id: 'a', hours: 3 }),
        makeLog({ id: 'b', hours: 1 }),
        makeLog({ id: 'c', hours: 2 }),
      ];
      expect(
        applyLogQuery(logs, { sort: { key: 'hours', dir: 'asc' } }).map((l) => l.id)
      ).toEqual(['b', 'c', 'a']);
    });

    it('sorts by schoolLevel using a defined level order', () => {
      const logs = [
        makeLog({ id: 'a', schoolLevel: 'High School' }),
        makeLog({ id: 'b', schoolLevel: 'Elementary' }),
        makeLog({ id: 'c', schoolLevel: 'Middle' }),
      ];
      expect(
        applyLogQuery(logs, { sort: { key: 'schoolLevel', dir: 'asc' } }).map((l) => l.id)
      ).toEqual(['b', 'c', 'a']);
    });

    it('is stable: equal keys preserve original relative order', () => {
      const logs = [
        makeLog({ id: 'a', date: '2026-01-01', hours: 1 }),
        makeLog({ id: 'b', date: '2026-01-01', hours: 2 }),
        makeLog({ id: 'c', date: '2026-01-01', hours: 3 }),
      ];
      const result = applyLogQuery(logs, { sort: { key: 'date', dir: 'asc' } });
      expect(result.map((l) => l.id)).toEqual(['a', 'b', 'c']);
    });

    it('does not mutate the input array', () => {
      const logs = [makeLog({ id: 'a', date: '2026-03-01' }), makeLog({ id: 'b', date: '2026-01-01' })];
      const copy = [...logs];
      applyLogQuery(logs, { sort: { key: 'date', dir: 'asc' } });
      expect(logs).toEqual(copy);
    });
  });
});
