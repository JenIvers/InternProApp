import { describe, it, expect } from 'vitest';
import type { Competency, InternshipLog } from '../../types';
import {
  computeCompetencyHours,
  computeCoverage,
  computeCategoryRollups,
  categoryGroupOf,
  COVERED_MIN_HOURS,
} from './index';

const comps: Competency[] = [
  { id: 'A', category: 'Core Leadership', title: 'A', description: '' },
  { id: 'A1', category: 'Core Leadership', title: 'A1', description: '' },
  { id: 'A2', category: 'Core Leadership', title: 'A2', description: '' },
  { id: 'B1', category: 'Core Leadership', title: 'B1', description: '' },
  { id: 'P_B1', category: 'Principal', title: 'PB1', description: '' },
];

let n = 0;
function log(partial: Partial<InternshipLog>): InternshipLog {
  return {
    id: `log-${++n}`,
    date: '2026-01-01',
    startTime: '08:00',
    endTime: '10:00',
    hours: 2,
    activity: 'legacy',
    location: 'School',
    schoolLevel: 'Middle',
    taggedCompetencyIds: [],
    reflections: '',
    artifactIds: [],
    ...partial,
  };
}

describe('computeCompetencyHours', () => {
  it('primary competency owns all hours when no split', () => {
    const logs = [
      log({ hours: 2.5, primaryCompetencyId: 'A1', taggedCompetencyIds: ['A1', 'B1'] }),
    ];
    expect(computeCompetencyHours(logs)).toEqual({ A1: 2.5 });
  });

  it('hourSplit overrides primary attribution', () => {
    const logs = [
      log({
        hours: 3,
        primaryCompetencyId: 'A1',
        hourSplit: { A2: 1, B1: 2 },
      }),
    ];
    expect(computeCompetencyHours(logs)).toEqual({ A2: 1, B1: 2 });
  });

  it('entries with neither primary nor split contribute no hours', () => {
    const logs = [log({ hours: 4, taggedCompetencyIds: ['A1'] })];
    expect(computeCompetencyHours(logs)).toEqual({});
  });

  it('accumulates across entries and rounds float drift', () => {
    const logs = [
      log({ hours: 0.1, primaryCompetencyId: 'A1' }),
      log({ hours: 0.2, primaryCompetencyId: 'A1' }),
    ];
    expect(computeCompetencyHours(logs)).toEqual({ A1: 0.3 });
  });
});

describe('computeCoverage', () => {
  it('marks untouched competencies as gap with zeros', () => {
    const cov = computeCoverage([], comps);
    expect(cov['A1']).toEqual({ hours: 0, entryCount: 0, evidenceCount: 0, status: 'gap' });
  });

  it('tag-only entries count coverage but no hours (thin)', () => {
    const logs = [log({ hours: 5, taggedCompetencyIds: ['A1'] })];
    const cov = computeCoverage(logs, comps);
    expect(cov['A1']).toEqual({ hours: 0, entryCount: 1, evidenceCount: 0, status: 'thin' });
  });

  it('covered requires >= threshold hours and >= 1 evidence', () => {
    const logs = [
      log({
        hours: COVERED_MIN_HOURS,
        primaryCompetencyId: 'A1',
        taggedCompetencyIds: ['A1'],
        evidenceLinks: [{ id: 'e1', label: 'doc', url: 'https://x' }],
        artifactIds: ['art1'],
      }),
    ];
    const cov = computeCoverage(logs, comps);
    expect(cov['A1'].status).toBe('covered');
    expect(cov['A1'].evidenceCount).toBe(2);
    expect(cov['A1'].hours).toBe(3);
  });

  it('enough hours without evidence is thin', () => {
    const logs = [log({ hours: 10, primaryCompetencyId: 'A1' })];
    expect(computeCoverage(logs, comps)['A1'].status).toBe('thin');
  });

  it('ignores competency ids not in the catalog', () => {
    const logs = [log({ taggedCompetencyIds: ['ZZZ'], primaryCompetencyId: 'ZZZ' })];
    const cov = computeCoverage(logs, comps);
    expect(cov['ZZZ']).toBeUndefined();
  });

  it('split keys count as touching the competency', () => {
    const logs = [log({ hours: 4, hourSplit: { A2: 4 } })];
    const cov = computeCoverage(logs, comps);
    expect(cov['A2'].entryCount).toBe(1);
    expect(cov['A2'].hours).toBe(4);
  });
});

describe('categoryGroupOf', () => {
  it('strips trailing digits', () => {
    expect(categoryGroupOf('A1')).toBe('A');
    expect(categoryGroupOf('P_B3')).toBe('P_B');
    expect(categoryGroupOf('A')).toBe('A');
  });
});

describe('computeCategoryRollups', () => {
  it('sums hours/evidence per group and dedupes entry counts', () => {
    const logs = [
      log({
        hours: 3,
        hourSplit: { A1: 1, A2: 2 },
        evidenceLinks: [{ id: 'e', label: 'l', url: 'u' }],
      }),
      log({ hours: 2, primaryCompetencyId: 'B1' }),
    ];
    const roll = computeCategoryRollups(logs, comps);
    expect(roll['A'].hours).toBe(3);
    expect(roll['A'].entryCount).toBe(1); // one entry touched both A1 and A2
    expect(roll['A'].evidenceCount).toBe(2); // 1 evidence counted for A1 and A2
    expect(roll['B'].hours).toBe(2);
    expect(roll['B'].entryCount).toBe(1);
    expect(roll['P_B'].hours).toBe(0);
    expect(roll['P_B'].gap).toBe(1);
  });

  it('status tallies add up to competencyCount', () => {
    const roll = computeCategoryRollups([], comps);
    for (const r of Object.values(roll)) {
      expect(r.covered + r.thin + r.gap).toBe(r.competencyCount);
      expect(r.gap).toBe(r.competencyCount);
    }
  });
});

describe('reconciliation', () => {
  it('per-competency hours sum to the attributable total', () => {
    const logs = [
      log({ hours: 2.5, primaryCompetencyId: 'A1' }),
      log({ hours: 3, hourSplit: { A2: 1, B1: 2 } }),
      log({ hours: 4, taggedCompetencyIds: ['A1'] }), // unattributed
    ];
    const perComp = computeCompetencyHours(logs);
    const sum = Object.values(perComp).reduce((a, b) => a + b, 0);
    // attributable total = 2.5 (primary) + 3 (split) ; the tag-only 4h is excluded
    expect(sum).toBeCloseTo(5.5, 10);
    // rollup hours also reconcile
    const roll = computeCategoryRollups(logs, comps);
    const rollSum = Object.values(roll).reduce((a, r) => a + r.hours, 0);
    expect(rollSum).toBeCloseTo(5.5, 10);
  });
});
