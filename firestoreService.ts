import { doc, getDoc, setDoc, DocumentData } from "firebase/firestore";
import { db } from "./firebase";
import { AppState } from "./types";
import { migrateState, CURRENT_SCHEMA_VERSION } from "@/lib/state-migration";
import {
  BACKUP_COLLECTION,
  backupDocId,
  needsPreMigrationBackup,
} from "@/lib/backup";

const COLLECTION_NAME = "intern_data";

export interface SaveResult {
  success: boolean;
  error?: string;
}

/**
 * Result of a migration-aware load. `state` is the (possibly migrated)
 * AppState, or null when no document exists for the user. `needsPrimaryReview`
 * lists log-entry ids whose `primaryCompetencyId` was auto-seeded by the
 * migration and should be confirmed by the user. `migrated` is true when the
 * loaded document predated the current schema and was upgraded in memory.
 */
export interface LoadStateResult {
  state: AppState | null;
  needsPrimaryReview: string[];
  migrated: boolean;
}

/**
 * Pre-migration backups pending their first persisted write, keyed by userId.
 * When a document is loaded that predates the current schema, we stash the
 * ORIGINAL (pre-migration) document here. The first save for that user then
 * writes a one-time backup copy to `intern_data_backups` BEFORE the migrated
 * document is persisted. Cleared once the backup write succeeds. This lives at
 * module scope because the persistence layer, not the caller, owns the
 * backup-before-migrate guarantee.
 */
const pendingBackups = new Map<string, DocumentData>();

/**
 * In-flight backup writes, keyed by userId, so concurrent saves (idle timeout
 * racing a visibilitychange/pagehide flush) share a single backup write instead
 * of racing to create duplicate backup documents.
 */
const inFlightBackups = new Map<string, Promise<SaveResult>>();

/**
 * Write the one-time pre-migration backup for `userId` if one is pending.
 * Resolves `{ success: true }` when there is nothing to back up or the backup
 * write succeeds; resolves `{ success: false }` (leaving the pending entry in
 * place so a later save can retry) when the backup write fails. Callers MUST
 * NOT persist the migrated document unless this resolves successfully.
 */
async function ensurePreMigrationBackup(userId: string): Promise<SaveResult> {
  const original = pendingBackups.get(userId);
  if (!original) return { success: true };

  const existing = inFlightBackups.get(userId);
  if (existing) return existing;

  const backupPromise = (async (): Promise<SaveResult> => {
    try {
      const backupRef = doc(db, BACKUP_COLLECTION, backupDocId(userId));
      await setDoc(backupRef, original);
      pendingBackups.delete(userId);
      return { success: true };
    } catch (error) {
      console.error("Error writing pre-migration backup to Firestore:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      // Keep the pending entry so the next save retries the backup.
      return { success: false, error: `Pre-migration backup failed: ${errorMessage}` };
    } finally {
      inFlightBackups.delete(userId);
    }
  })();

  inFlightBackups.set(userId, backupPromise);
  return backupPromise;
}

export const saveStateToFirestore = async (userId: string, state: AppState): Promise<SaveResult> => {
  if (!userId) {
    return { success: false, error: "No user ID provided" };
  }
  try {
    // Back up the original pre-migration document before the first persisted
    // write. If the backup fails, do NOT proceed with the save.
    const backupResult = await ensurePreMigrationBackup(userId);
    if (!backupResult.success) {
      return backupResult;
    }

    const docRef = doc(db, COLLECTION_NAME, userId);
    await setDoc(docRef, state);
    return { success: true };
  } catch (error) {
    console.error("Error saving state to Firestore:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return { success: false, error: errorMessage };
  }
};

/**
 * Load a user's portfolio and migrate it in memory to the current schema.
 *
 * When the stored document predates the current schema, the ORIGINAL document
 * is stashed for a one-time backup that the first subsequent
 * `saveStateToFirestore` will persist before writing the migrated document.
 *
 * Pass `{ readOnly: true }` for viewer mode (`?view=`) reads: migration still
 * runs in memory, but no backup is registered so the read path can never cause
 * a write to another user's data.
 */
export const loadStateWithMigration = async (
  userId: string,
  options?: { readOnly?: boolean },
): Promise<LoadStateResult> => {
  if (!userId) return { state: null, needsPrimaryReview: [], migrated: false };
  try {
    const docRef = doc(db, COLLECTION_NAME, userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // New user / missing doc: nothing to migrate or back up.
      pendingBackups.delete(userId);
      return { state: null, needsPrimaryReview: [], migrated: false };
    }

    const raw = docSnap.data();
    const migrated = needsPreMigrationBackup(
      raw as { schemaVersion?: unknown },
      CURRENT_SCHEMA_VERSION,
    );
    const result = migrateState(raw as AppState);

    if (!options?.readOnly) {
      if (migrated) {
        // Stash the ORIGINAL (pre-migration) document for the one-time backup.
        pendingBackups.set(userId, raw);
      } else {
        // Already current: ensure no stale backup is left pending.
        pendingBackups.delete(userId);
      }
    }

    return {
      state: result.state,
      needsPrimaryReview: result.needsPrimaryReview,
      migrated,
    };
  } catch (error) {
    console.error("Error loading state from Firestore:", error);
    return { state: null, needsPrimaryReview: [], migrated: false };
  }
};

/**
 * Backward-compatible load: returns just the (possibly migrated) AppState, or
 * null. Existing callers keep working unchanged; callers that need the
 * `needsPrimaryReview` list should use `loadStateWithMigration` instead.
 */
export const loadStateFromFirestore = async (
  userId: string,
  options?: { readOnly?: boolean },
): Promise<AppState | null> => {
  const { state } = await loadStateWithMigration(userId, options);
  return state;
};
