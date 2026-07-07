/**
 * State migration for AppState documents.
 *
 * Versioned, additive, non-destructive. An AppState with no `schemaVersion`
 * is treated as v0. `migrateState` upgrades it step-by-step to
 * CURRENT_SCHEMA_VERSION, never deleting or overwriting existing fields.
 *
 * Design choices (documented per spec):
 * - Entries whose `primaryCompetencyId` was best-effort seeded from
 *   `taggedCompetencyIds[0]` are reported in `MigrationResult.needsPrimaryReview`
 *   (a list of log entry ids). The flag is NOT written into the persisted
 *   state so migrated documents stay clean; callers surface the list in UI.
 * - Old `primarySetting` ('Primary' | 'Secondary') maps to
 *   `settings.primaryLevelBucket`: 'Secondary' => 'HighSchool',
 *   'Primary' => 'Elementary'. Anything else falls back to 'HighSchool'
 *   (Jen's actual configuration).
 * - Idempotent: running migrateState on an already-current state returns a
 *   deep-equal state and an empty needsPrimaryReview list.
 */

import type {
  AppState,
  AppSettings,
  AppChecklists,
  InternshipLog,
} from '../../types';

export const CURRENT_SCHEMA_VERSION = 1;

export interface MigrationResult {
  state: AppState;
  /** Log entry ids whose primaryCompetencyId was auto-seeded and should be reviewed. */
  needsPrimaryReview: string[];
}

function defaultSettings(primarySetting: AppState['primarySetting']): AppSettings {
  return {
    primaryLevelBucket: primarySetting === 'Primary' ? 'Elementary' : 'HighSchool',
    intermediateMapsTo: 'Elementary',
    targets: { total: 320, primary: 240, others: 40 },
  };
}

function defaultChecklists(): AppChecklists {
  return { suggestedActivities: {}, deliverables: {} };
}

function migrateLog(log: InternshipLog, needsPrimaryReview: string[]): InternshipLog {
  const next: InternshipLog = { ...log };
  if (next.description === undefined && typeof next.activity === 'string') {
    next.description = next.activity; // keep `activity` for back-compat
  }
  if (
    next.primaryCompetencyId === undefined &&
    Array.isArray(next.taggedCompetencyIds) &&
    next.taggedCompetencyIds.length > 0
  ) {
    next.primaryCompetencyId = next.taggedCompetencyIds[0];
    needsPrimaryReview.push(next.id);
  }
  return next;
}

function migrateV0toV1(state: AppState, needsPrimaryReview: string[]): AppState {
  const next: AppState = { ...state };
  next.logs = (state.logs ?? []).map((log) => migrateLog(log, needsPrimaryReview));
  if (next.settings === undefined) {
    next.settings = defaultSettings(state.primarySetting);
  }
  if (next.checklists === undefined) {
    next.checklists = defaultChecklists();
  }
  next.schemaVersion = 1;
  return next;
}

/**
 * Migrate an AppState document to the current schema version.
 * Pure and non-destructive: the input object is never mutated, and no field
 * present on the input is removed or overwritten in the output.
 */
export function migrateState(oldState: AppState): MigrationResult {
  const needsPrimaryReview: string[] = [];
  let state = oldState;
  const version = state.schemaVersion ?? 0;
  if (version < 1) {
    state = migrateV0toV1(state, needsPrimaryReview);
  }
  if (state === oldState) {
    // Already current: still return a copy-free result (idempotent no-op).
    return { state: oldState, needsPrimaryReview };
  }
  return { state, needsPrimaryReview };
}
