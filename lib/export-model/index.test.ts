import { describe, it, expect } from 'vitest';
import { buildExportModel, bucketForLevel } from './index';
import type { InternshipLog, AppSettings } from '../../types';

const settings: AppSettings = {
  primaryLevelBucket: 'HighSchool',
  intermediateMapsTo: 'Elementary',
  targets: { total: 320, primary: 240, others: 40 },
};

function makeLog(overrides: Partial<InternshipLog> & { id: string }): InternshipLog {
  return {
    date: '2026-01-15',
    startTime: '08:00',
    endTime: '10:00',
    hours: 2,
    activity: 'Legacy narrative',
    location: 'Orono HS',
    schoolLevel: 'High School',
    taggedCompetencyIds: ['A1'],
    reflections: '',
    artifactIds: [],
    ...overrides,
  };
}

const logs: InternshipLog[] = [
  makeLog({
    id: 'hs1',
    date: '2026-01-10',
    hours: 3.5,
    description: 'Observed principal PLC leadership',
    taggedCompetencyIds: ['A1', 'B2'],
    primaryCompetencyId: 'A1',
    schoolLevel: 'High School',
    location: 'Orono HS',
  }),
  makeLog({
    id: 'meet1',
    date: '2026-01-05',
    hours: 1.5,
    description: 'Mentor meeting on staffing',
    taggedCompetencyIds: ['C3'],
    schoolLevel: 'Middle',
    location: 'Orono MS',
    meetingNotes: { competencyIds: ['C3'], reflection: 'Discussed growth in staffing decisions.' },
  }),
  makeLog({
    id: 'int1',
    date: '2026-02-01',
    hours: 2,
    description: 'Intermediate site visit',
    taggedCompetencyIds: ['D1'],
    schoolLevel: 'Intermediate',
    location: 'Intermediate School',
  }),
  makeLog({
    id: 'elem1',
    date: '2026-02-03',
    hours: 4,
    description: 'Elementary observation',
    taggedCompetencyIds: ['E2'],
    schoolLevel: 'Elementary',
    location: 'Schumann Elementary',
    meetingNotes: { competencyIds: [], reflection: 'Reflection with empty ids falls back to tags.' },
  }),
];

describe('bucketForLevel', () => {
  it('maps Intermediate into the Elementary bucket per settings', () => {
    expect(bucketForLevel('Intermediate', settings)).toBe('Elementary');
    expect(bucketForLevel('High School', settings)).toBe('HighSchool');
    expect(bucketForLevel('Middle', settings)).toBe('Middle');
    expect(bucketForLevel('Elementary', settings)).toBe('Elementary');
  });
});

describe('buildExportModel — activities mode', () => {
  const model = buildExportModel(logs, settings, 'activities');

  it('uses the official activity columns', () => {
    expect(model.columns.map((c) => c.label)).toEqual([
      'Date', 'Activity', 'Competency', 'Location', 'Hours', 'Level',
    ]);
  });

  it('includes every entry sorted by date', () => {
    expect(model.rows.map((r) => r.entryId)).toEqual(['meet1', 'hs1', 'int1', 'elem1']);
  });

  it('excludes meeting notes from all rows', () => {
    expect(model.rows.every((r) => r.meetingNotes === undefined)).toBe(true);
  });

  it('computes totals by bucket with Intermediate folded into Elementary', () => {
    expect(model.totals).toBeDefined();
    expect(model.totals!.byBucket).toEqual({
      HighSchool: 3.5,
      Middle: 1.5,
      Elementary: 6, // 2 (Intermediate) + 4 (Elementary)
    });
    expect(model.totals!.grandTotal).toBe(11);
  });

  it('renders cells: description over legacy activity, primary competency first', () => {
    const hs = model.rows.find((r) => r.entryId === 'hs1')!;
    expect(hs.cells.activity).toBe('Observed principal PLC leadership');
    expect(hs.cells.competency).toBe('A1, B2');
    expect(hs.cells.hours).toBe('3.5');
    expect(hs.cells.level).toBe('High School');
    expect(hs.cells.location).toBe('Orono HS');
  });

  it('falls back to legacy activity field when description is absent', () => {
    const m = buildExportModel([makeLog({ id: 'x', description: undefined })], settings, 'activities');
    expect(m.rows[0].cells.activity).toBe('Legacy narrative');
  });
});

describe('buildExportModel — full mode', () => {
  const model = buildExportModel(logs, settings, 'full');

  it('includes all entries with the official columns and totals', () => {
    expect(model.rows).toHaveLength(4);
    expect(model.columns.map((c) => c.key)).toEqual([
      'date', 'activity', 'competency', 'location', 'hours', 'level',
    ]);
    expect(model.totals!.grandTotal).toBe(11);
  });

  it('attaches meeting notes inline only to entries that have them', () => {
    const meet = model.rows.find((r) => r.entryId === 'meet1')!;
    expect(meet.meetingNotes).toEqual({
      competencyIds: ['C3'],
      reflection: 'Discussed growth in staffing decisions.',
    });
    const hs = model.rows.find((r) => r.entryId === 'hs1')!;
    expect(hs.meetingNotes).toBeUndefined();
  });

  it('defaults empty meetingNotes.competencyIds to the entry tags', () => {
    const elem = model.rows.find((r) => r.entryId === 'elem1')!;
    expect(elem.meetingNotes!.competencyIds).toEqual(['E2']);
  });
});

describe('buildExportModel — meetings mode', () => {
  const model = buildExportModel(logs, settings, 'meetings');

  it('includes only entries with meeting notes', () => {
    expect(model.rows.map((r) => r.entryId)).toEqual(['meet1', 'elem1']);
  });

  it('uses Date / Competency / Reflection columns with no hours column', () => {
    expect(model.columns.map((c) => c.label)).toEqual(['Date', 'Competency', 'Reflection']);
    expect(model.columns.some((c) => c.key === 'hours')).toBe(false);
  });

  it('omits totals entirely', () => {
    expect(model.totals).toBeUndefined();
  });

  it('renders the reflection and meeting competency ids', () => {
    const meet = model.rows.find((r) => r.entryId === 'meet1')!;
    expect(meet.cells).toEqual({
      date: '2026-01-05',
      competency: 'C3',
      reflection: 'Discussed growth in staffing decisions.',
    });
    const elem = model.rows.find((r) => r.entryId === 'elem1')!;
    expect(elem.cells.competency).toBe('E2'); // fallback to tags
  });
});

describe('edge cases', () => {
  it('returns empty rows and zero totals for an empty log list', () => {
    const m = buildExportModel([], settings, 'activities');
    expect(m.rows).toEqual([]);
    expect(m.totals).toEqual({
      byBucket: { HighSchool: 0, Elementary: 0, Middle: 0 },
      grandTotal: 0,
    });
    const meetings = buildExportModel([], settings, 'meetings');
    expect(meetings.rows).toEqual([]);
  });

  it('does not mutate the input logs array order', () => {
    const input = [...logs];
    buildExportModel(input, settings, 'full');
    expect(input.map((l) => l.id)).toEqual(logs.map((l) => l.id));
  });

  it('honors a different intermediateMapsTo-independent bucket via settings shape', () => {
    const m = buildExportModel(
      [makeLog({ id: 'i', schoolLevel: 'Intermediate', hours: 5 })],
      settings,
      'full'
    );
    expect(m.totals!.byBucket.Elementary).toBe(5);
    expect(m.totals!.byBucket.HighSchool).toBe(0);
  });
});
