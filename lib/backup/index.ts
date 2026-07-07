/**
 * Pure helpers for the pre-migration backup flow.
 *
 * Before the first save that would persist a migrated (schema-upgraded)
 * document, the persistence layer writes a one-time copy of the ORIGINAL
 * pre-migration document to the `intern_data_backups` collection, keyed
 * `{userId}_{ISOtimestamp}`. These helpers are framework-free so the id
 * scheme and the "does this doc need a backup?" decision stay unit-testable.
 *
 * Firestore note: Firebase uids are alphanumeric and ISO-8601 timestamps
 * contain no underscores, so the first `_` in a backup id always separates
 * the owner uid from the timestamp (firestore.rules relies on this).
 */

export const BACKUP_COLLECTION = 'intern_data_backups';

/** Build the backup document id: `{userId}_{ISOtimestamp}`. */
export function backupDocId(userId: string, when: Date = new Date()): string {
  return `${userId}_${when.toISOString()}`;
}

/**
 * A loaded document needs a one-time backup before its first migrated write
 * exactly when it predates the given schema version (no `schemaVersion`
 * field, or a lower one). A missing document (new user) needs no backup.
 */
export function needsPreMigrationBackup(
  raw: { schemaVersion?: unknown } | null | undefined,
  currentVersion: number,
): boolean {
  if (raw === null || raw === undefined) return false;
  const version = raw.schemaVersion;
  return typeof version !== 'number' || version < currentVersion;
}
