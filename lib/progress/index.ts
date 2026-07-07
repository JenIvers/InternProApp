import type { AppSettings, InternshipLog, LevelBucket } from '../../types';

/** Default requirement settings (Jen: HighSchool primary, 320/240/40). */
export const DEFAULT_SETTINGS: AppSettings = {
  primaryLevelBucket: 'HighSchool',
  intermediateMapsTo: 'Elementary',
  targets: {
    total: 320,
    primary: 240,
    others: 40,
  },
};

export interface ProgressResult {
  byBucket: Record<LevelBucket, number>;
  total: number;
  targets: Record<LevelBucket, number>;
  remainingByBucket: Record<LevelBucket, number>;
  remainingTotal: number;
  primaryLevel: LevelBucket;
}

/** Maps a log's schoolLevel onto its requirement bucket (Intermediate -> Elementary). */
function bucketForSchoolLevel(schoolLevel: InternshipLog['schoolLevel']): LevelBucket {
  switch (schoolLevel) {
    case 'High School':
      return 'HighSchool';
    case 'Middle':
      return 'Middle';
    case 'Elementary':
    case 'Intermediate':
    default:
      return 'Elementary';
  }
}

/**
 * Computes hour totals and remaining-hour progress toward the requirement
 * buckets (HighSchool / Elementary / Middle) from a list of logs and the
 * user's (optionally editable) target settings. Intermediate-level logs are
 * folded into the Elementary bucket. Missing settings fall back to the
 * default 320/240/40 targets with HighSchool as the primary bucket.
 */
export function computeProgress(
  logs: InternshipLog[],
  settings?: AppSettings
): ProgressResult {
  const resolvedSettings = settings ?? DEFAULT_SETTINGS;
  const primaryLevel = resolvedSettings.primaryLevelBucket ?? DEFAULT_SETTINGS.primaryLevelBucket;
  const targetValues = resolvedSettings.targets ?? DEFAULT_SETTINGS.targets;

  const byBucket: Record<LevelBucket, number> = {
    HighSchool: 0,
    Elementary: 0,
    Middle: 0,
  };

  for (const log of logs ?? []) {
    const bucket = bucketForSchoolLevel(log.schoolLevel);
    const hours = typeof log.hours === 'number' && !Number.isNaN(log.hours) ? log.hours : 0;
    byBucket[bucket] += hours;
  }

  const total = byBucket.HighSchool + byBucket.Elementary + byBucket.Middle;

  const targets: Record<LevelBucket, number> = {
    HighSchool: targetValues.total,
    Elementary: targetValues.total,
    Middle: targetValues.total,
  };
  (Object.keys(targets) as LevelBucket[]).forEach((bucket) => {
    targets[bucket] = bucket === primaryLevel ? targetValues.primary : targetValues.others;
  });

  const remainingByBucket: Record<LevelBucket, number> = {
    HighSchool: Math.max(0, targets.HighSchool - byBucket.HighSchool),
    Elementary: Math.max(0, targets.Elementary - byBucket.Elementary),
    Middle: Math.max(0, targets.Middle - byBucket.Middle),
  };

  const remainingTotal = Math.max(0, targetValues.total - total);

  return {
    byBucket,
    total,
    targets,
    remainingByBucket,
    remainingTotal,
    primaryLevel,
  };
}
