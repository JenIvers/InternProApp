import { describe, it, expect } from 'vitest';
import { validateEntry } from './index';
import type { InternshipLog } from '@/types';

function baseEntry(): InternshipLog {
  return {
    id: '1',
    date: '2026-01-01',
    startTime: '09:00',
    endTime: '10:00',
    hours: 1,
    activity: 'Met with mentor',
    description: 'Met with mentor',
    location: 'Main office',
    schoolLevel: 'High School',
    taggedCompetencyIds: ['A1'],
    primaryCompetencyId: 'A1',
    reflections: '',
    artifactIds: [],
  };
}

describe('validateEntry', () => {
  it('returns no warnings for a clean entry', () => {
    expect(validateEntry(baseEntry())).toEqual([]);
  });

  it('warns when no primary competency and no tags', () => {
    const entry = { ...baseEntry(), primaryCompetencyId: undefined, taggedCompetencyIds: [] };
    const warnings = validateEntry(entry);
    expect(warnings.some(w => w.code === 'MISSING_COMPETENCY')).toBe(true);
  });

  it('does not warn about competency when tags exist but no primary', () => {
    const entry = { ...baseEntry(), primaryCompetencyId: undefined, taggedCompetencyIds: ['A1'] };
    const warnings = validateEntry(entry);
    expect(warnings.some(w => w.code === 'MISSING_COMPETENCY')).toBe(false);
  });

  it('warns on missing hours', () => {
    const entry = { ...baseEntry(), hours: undefined as unknown as number };
    expect(validateEntry(entry).some(w => w.code === 'INVALID_HOURS')).toBe(true);
  });

  it('warns on zero hours', () => {
    const entry = { ...baseEntry(), hours: 0 };
    expect(validateEntry(entry).some(w => w.code === 'INVALID_HOURS')).toBe(true);
  });

  it('warns on negative hours', () => {
    const entry = { ...baseEntry(), hours: -2 };
    expect(validateEntry(entry).some(w => w.code === 'INVALID_HOURS')).toBe(true);
  });

  it('warns on missing schoolLevel', () => {
    const entry = { ...baseEntry(), schoolLevel: undefined as unknown as InternshipLog['schoolLevel'] };
    expect(validateEntry(entry).some(w => w.code === 'MISSING_SCHOOL_LEVEL')).toBe(true);
  });

  it('warns on missing date', () => {
    const entry = { ...baseEntry(), date: '' };
    expect(validateEntry(entry).some(w => w.code === 'MISSING_DATE')).toBe(true);
  });

  it('warns when both description and activity are missing', () => {
    const entry = { ...baseEntry(), description: '', activity: '' };
    expect(validateEntry(entry).some(w => w.code === 'MISSING_DESCRIPTION')).toBe(true);
  });

  it('does not warn when activity present but description missing', () => {
    const entry = { ...baseEntry(), description: '', activity: 'Did something' };
    expect(validateEntry(entry).some(w => w.code === 'MISSING_DESCRIPTION')).toBe(false);
  });

  it('warns when hourSplit does not sum to entry.hours', () => {
    const entry = { ...baseEntry(), hours: 2, hourSplit: { A1: 1 } };
    expect(validateEntry(entry).some(w => w.code === 'HOUR_SPLIT_MISMATCH')).toBe(true);
  });

  it('does not warn when hourSplit sums correctly', () => {
    const entry = { ...baseEntry(), hours: 2, hourSplit: { A1: 1, B1: 1 } };
    expect(validateEntry(entry).some(w => w.code === 'HOUR_SPLIT_MISMATCH')).toBe(false);
  });

  it('accumulates multiple warnings for a mostly-empty entry', () => {
    const warnings = validateEntry({});
    expect(warnings.length).toBeGreaterThanOrEqual(5);
  });
});
