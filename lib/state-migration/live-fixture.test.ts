import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { migrateState, CURRENT_SCHEMA_VERSION } from './index';
import type { AppState } from '../../types';

const FIXTURE_PATH = resolve(__dirname, '../fixtures/live-v0-appstate.sanitized.json');
const UNTAGGED_LOG_ID = '98b43cd4-6b75-4f9a-b639-6e20600a89b8';

/** Load the sanitized live v0 snapshot, stripping the non-AppState __comment key. */
function loadLiveV0State(): AppState {
  const raw = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8')) as Record<string, unknown>;
  delete raw.__comment;
  return raw as unknown as AppState;
}

/** Recursively assert every key/value from `original` is present unchanged in `migrated`. */
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

describe('migrateState against the live production v0 snapshot', () => {
  it('preserves every original key and value (zero data loss) and does not mutate input', () => {
    const original = loadLiveV0State();
    const snapshot = JSON.parse(JSON.stringify(original));
    const { state } = migrateState(original);
    expectSubset(snapshot, state);
    expect(original).toEqual(snapshot);
  });

  it('stamps schemaVersion and initializes settings and checklists', () => {
    const { state } = migrateState(loadLiveV0State());
    expect(state.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(state.settings).toEqual({
      primaryLevelBucket: 'HighSchool', // primarySetting 'Secondary' -> HighSchool
      intermediateMapsTo: 'Elementary',
      targets: { total: 320, primary: 240, others: 40 },
    });
    expect(state.checklists).toEqual({ suggestedActivities: {}, deliverables: {} });
  });

  it('seeds primaryCompetencyId from taggedCompetencyIds[0] on every tagged log and flags each for review', () => {
    const original = loadLiveV0State();
    const { state, needsPrimaryReview } = migrateState(original);
    const taggedIds: string[] = [];
    state.logs.forEach((log, i) => {
      const tags = original.logs[i].taggedCompetencyIds;
      if (tags.length > 0) {
        expect(log.primaryCompetencyId, log.id).toBe(tags[0]);
        taggedIds.push(log.id);
      }
    });
    // Module semantics: needsPrimaryReview lists best-effort SEEDED entries (per PRD),
    // in log order. The untagged entry is NOT seeded and NOT in this list.
    expect(needsPrimaryReview).toEqual(taggedIds);
    expect(taggedIds).toHaveLength(state.logs.length - 1);
  });

  it('leaves the untagged real entry without a primaryCompetencyId (surfaced by its absence)', () => {
    const { state, needsPrimaryReview } = migrateState(loadLiveV0State());
    const untagged = state.logs.find((l) => l.id === UNTAGGED_LOG_ID);
    expect(untagged).toBeDefined();
    expect(untagged?.primaryCompetencyId).toBeUndefined();
    expect(needsPrimaryReview).not.toContain(UNTAGGED_LOG_ID);
    // Coverage: callers can surface untagged entries as logs missing a primaryCompetencyId.
    const missingPrimary = state.logs.filter((l) => l.primaryCompetencyId === undefined);
    expect(missingPrimary.map((l) => l.id)).toEqual([UNTAGGED_LOG_ID]);
  });

  it('copies activity to description on every log while retaining activity', () => {
    const { state } = migrateState(loadLiveV0State());
    for (const log of state.logs) {
      expect(log.description, log.id).toBe(log.activity);
      expect(log.activity, log.id).toBeTruthy();
    }
  });

  it('is idempotent: migrating the migrated state is a deep-equal no-op', () => {
    const first = migrateState(loadLiveV0State());
    const second = migrateState(first.state);
    expect(second.state).toEqual(first.state);
    expect(second.state).toBe(first.state); // reference-preserving no-op
    expect(second.needsPrimaryReview).toEqual([]);
  });
});
