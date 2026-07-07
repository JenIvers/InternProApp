import { describe, it, expect } from 'vitest';
import { computeProgress } from './index';
import type { AppSettings, InternshipLog } from '../../types';

function makeLog(overrides: Partial<InternshipLog>): InternshipLog {
  return {
    id: overrides.id ?? Math.random().toString(36).slice(2),
    date: '2026-01-01',
    startTime: '09:00',
    endTime: '10:00',
    hours: 1,
    activity: 'Test activity',
    location: 'Test site',
    schoolLevel: 'High School',
    taggedCompetencyIds: [],
    reflections: '',
    artifactIds: [],
    ...overrides,
  };
}

const defaultSettings: AppSettings = {
  primaryLevelBucket: 'HighSchool',
  intermediateMapsTo: 'Elementary',
  targets: { total: 320, primary: 240, others: 40 },
};

describe('computeProgress', () => {
  it('buckets hours by schoolLevel', () => {
    const logs = [
      makeLog({ schoolLevel: 'High School', hours: 10 }),
      makeLog({ schoolLevel: 'Elementary', hours: 5 }),
      makeLog({ schoolLevel: 'Middle', hours: 3 }),
    ];
    const result = computeProgress(logs, defaultSettings);
    expect(result.byBucket).toEqual({ HighSchool: 10, Elementary: 5, Middle: 3 });
    expect(result.total).toBe(18);
  });

  it('folds Intermediate hours into the Elementary bucket', () => {
    const logs = [
      makeLog({ schoolLevel: 'Elementary', hours: 5 }),
      makeLog({ schoolLevel: 'Intermediate', hours: 7 }),
    ];
    const result = computeProgress(logs, defaultSettings);
    expect(result.byBucket.Elementary).toBe(12);
    expect(result.total).toBe(12);
  });

  it('applies default targets (320/240/40/40) when settings are missing', () => {
    const logs = [makeLog({ schoolLevel: 'High School', hours: 10 })];
    const result = computeProgress(logs, undefined);
    expect(result.targets).toEqual({ HighSchool: 240, Elementary: 40, Middle: 40 });
    expect(result.primaryLevel).toBe('HighSchool');
  });

  it('computes remaining hours per bucket and total', () => {
    const logs = [
      makeLog({ schoolLevel: 'High School', hours: 100 }),
      makeLog({ schoolLevel: 'Elementary', hours: 10 }),
      makeLog({ schoolLevel: 'Middle', hours: 5 }),
    ];
    const result = computeProgress(logs, defaultSettings);
    expect(result.remainingByBucket).toEqual({ HighSchool: 140, Elementary: 30, Middle: 35 });
    expect(result.remainingTotal).toBe(320 - 115);
  });

  it('supports an editable primary level (Middle as primary)', () => {
    const settings: AppSettings = {
      primaryLevelBucket: 'Middle',
      intermediateMapsTo: 'Elementary',
      targets: { total: 200, primary: 120, others: 40 },
    };
    const logs = [makeLog({ schoolLevel: 'Middle', hours: 10 })];
    const result = computeProgress(logs, settings);
    expect(result.targets).toEqual({ HighSchool: 40, Elementary: 40, Middle: 120 });
    expect(result.remainingByBucket.Middle).toBe(110);
    expect(result.primaryLevel).toBe('Middle');
  });

  it('supports fully custom editable targets', () => {
    const settings: AppSettings = {
      primaryLevelBucket: 'HighSchool',
      intermediateMapsTo: 'Elementary',
      targets: { total: 500, primary: 400, others: 50 },
    };
    const logs = [makeLog({ schoolLevel: 'High School', hours: 400 })];
    const result = computeProgress(logs, settings);
    expect(result.remainingByBucket.HighSchool).toBe(0);
    expect(result.remainingTotal).toBe(100);
  });

  it('handles zero hours (empty log list)', () => {
    const result = computeProgress([], defaultSettings);
    expect(result.byBucket).toEqual({ HighSchool: 0, Elementary: 0, Middle: 0 });
    expect(result.total).toBe(0);
    expect(result.remainingByBucket).toEqual({ HighSchool: 240, Elementary: 40, Middle: 40 });
    expect(result.remainingTotal).toBe(320);
  });

  it('clamps remaining hours to zero when over target (does not go negative)', () => {
    const logs = [
      makeLog({ schoolLevel: 'High School', hours: 300 }),
      makeLog({ schoolLevel: 'Elementary', hours: 60 }),
      makeLog({ schoolLevel: 'Middle', hours: 60 }),
    ];
    const result = computeProgress(logs, defaultSettings);
    expect(result.remainingByBucket).toEqual({ HighSchool: 0, Elementary: 0, Middle: 0 });
    expect(result.remainingTotal).toBe(0);
  });
});
