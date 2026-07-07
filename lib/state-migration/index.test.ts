import { describe, it, expect } from 'vitest';
import { migrateState, CURRENT_SCHEMA_VERSION } from './index';
import type { AppState } from '../../types';
import { AttainmentLevel } from '../../types';

/** Realistic v0 fixture matching the legacy AppState shape (no schemaVersion). */
function makeV0State(): AppState {
  return {
    logs: [
      {
        id: 'log-1',
        date: '2026-01-12',
        startTime: '08:00',
        endTime: '11:30',
        hours: 3.5,
        activity: 'Shadowed principal during morning supervision and PLC meeting.',
        location: 'Orono High School',
        schoolLevel: 'High School',
        taggedCompetencyIds: ['A1', 'B2'],
        reflections: 'Learned about master scheduling constraints.',
        artifactIds: ['art-1'],
      },
      {
        id: 'log-2',
        date: '2026-01-14',
        startTime: '13:00',
        endTime: '15:00',
        hours: 2,
        activity: 'Reviewed special education compliance files.',
        location: 'District Office',
        schoolLevel: 'Elementary',
        taggedCompetencyIds: [],
        reflections: '',
        artifactIds: [],
      },
    ],
    artifacts: [
      {
        id: 'art-1',
        name: 'PLC agenda.pdf',
        type: 'application/pdf',
        data: 'JVBERi0xLjQ=',
        uploadDate: '2026-01-12',
        taggedCompetencyIds: ['A1'],
        shelfId: 'shelf-1',
      },
    ],
    progress: { A1: AttainmentLevel.DEVELOPING },
    shelves: [{ id: 'shelf-1', name: 'Semester 1' }],
    sites: [
      { id: 'site-1', name: 'Orono High School', level: 'Primary', mentorName: 'Dr. Smith' },
    ],
    competencyReflections: { A1: 'Growing in this area.' },
    primarySetting: 'Secondary',
    userProfile: { displayName: 'Jen', email: 'jen@example.com', photoURL: null },
  };
}

/** Assert every key/value in `original` is preserved (deep) in `migrated`. */
function expectSubset(original: unknown, migrated: unknown, path = 'root'): void {
  if (original !== null && typeof original === 'object' && !Array.isArray(original)) {
    expect(migrated, path).toBeTypeOf('object');
    for (const [k, v] of Object.entries(original as Record<string, unknown>)) {
      expectSubset(v, (migrated as Record<string, unknown>)[k], `${path}.${k}`);
    }
  } else if (Array.isArray(original)) {
    expect(Array.isArray(migrated), path).toBe(true);
    expect((migrated as unknown[]).length, path).toBe(original.length);
    original.forEach((v, i) => expectSubset(v, (migrated as unknown[])[i], `${path}[${i}]`));
  } else {
    expect(migrated, path).toEqual(original);
  }
}

describe('migrateState v0 -> v1', () => {
  it('stamps the current schema version', () => {
    const { state } = migrateState(makeV0State());
    expect(state.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  it('preserves every original key and value (no data loss)', () => {
    const original = makeV0State();
    const snapshot = JSON.parse(JSON.stringify(original));
    const { state } = migrateState(original);
    expectSubset(snapshot, state);
    // input not mutated
    expect(original).toEqual(snapshot);
  });

  it('copies activity to description while keeping activity', () => {
    const { state } = migrateState(makeV0State());
    for (const log of state.logs) {
      expect(log.description).toBe(log.activity);
      expect(log.activity).toBeTruthy();
    }
  });

  it('does not overwrite an existing description', () => {
    const v0 = makeV0State();
    v0.logs[0].description = 'Already written description.';
    const { state } = migrateState(v0);
    expect(state.logs[0].description).toBe('Already written description.');
  });

  it('seeds primaryCompetencyId from taggedCompetencyIds[0] and flags for review', () => {
    const { state, needsPrimaryReview } = migrateState(makeV0State());
    expect(state.logs[0].primaryCompetencyId).toBe('A1');
    expect(needsPrimaryReview).toEqual(['log-1']); // log-2 has no tags
    expect(state.logs[1].primaryCompetencyId).toBeUndefined();
  });

  it('does not flag entries that already have a primaryCompetencyId', () => {
    const v0 = makeV0State();
    v0.logs[0].primaryCompetencyId = 'B2';
    const { state, needsPrimaryReview } = migrateState(v0);
    expect(state.logs[0].primaryCompetencyId).toBe('B2');
    expect(needsPrimaryReview).toEqual([]);
  });

  it('initializes settings with correct defaults, mapping Secondary -> HighSchool', () => {
    const { state } = migrateState(makeV0State());
    expect(state.settings).toEqual({
      primaryLevelBucket: 'HighSchool',
      intermediateMapsTo: 'Elementary',
      targets: { total: 320, primary: 240, others: 40 },
    });
  });

  it('maps legacy primarySetting Primary -> Elementary bucket', () => {
    const v0 = makeV0State();
    v0.primarySetting = 'Primary';
    const { state } = migrateState(v0);
    expect(state.settings?.primaryLevelBucket).toBe('Elementary');
    // legacy field kept
    expect(state.primarySetting).toBe('Primary');
  });

  it('does not overwrite existing settings', () => {
    const v0 = makeV0State();
    v0.settings = {
      primaryLevelBucket: 'Middle',
      intermediateMapsTo: 'Elementary',
      targets: { total: 100, primary: 60, others: 20 },
    };
    const { state } = migrateState(v0);
    expect(state.settings.primaryLevelBucket).toBe('Middle');
    expect(state.settings.targets.total).toBe(100);
  });

  it('initializes empty checklists', () => {
    const { state } = migrateState(makeV0State());
    expect(state.checklists).toEqual({ suggestedActivities: {}, deliverables: {} });
  });

  it('is idempotent: re-running is a deep-equal no-op with no review flags', () => {
    const first = migrateState(makeV0State());
    const second = migrateState(first.state);
    expect(second.state).toEqual(first.state);
    expect(second.needsPrimaryReview).toEqual([]);
  });

  it('returns the same reference for an already-current state', () => {
    const current = migrateState(makeV0State()).state;
    expect(migrateState(current).state).toBe(current);
  });
});
