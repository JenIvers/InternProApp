import type { InternshipLog } from '@/types';

export interface Warning {
  code: string;
  field: string;
  message: string;
}

/**
 * Pure validation of a single InternshipLog entry. Returns a list of
 * non-fatal warnings describing missing/inconsistent data. Does not throw
 * and does not mutate the entry.
 */
export function validateEntry(entry: Partial<InternshipLog>): Warning[] {
  const warnings: Warning[] = [];

  const hasPrimary = !!entry.primaryCompetencyId;
  const hasTags = !!(entry.taggedCompetencyIds && entry.taggedCompetencyIds.length > 0);
  if (!hasPrimary && !hasTags) {
    warnings.push({
      code: 'MISSING_COMPETENCY',
      field: 'primaryCompetencyId',
      message: 'No competency is tagged or set as primary for this entry.',
    });
  }

  if (entry.hours === undefined || entry.hours === null || isNaN(entry.hours) || entry.hours <= 0) {
    warnings.push({
      code: 'INVALID_HOURS',
      field: 'hours',
      message: 'Hours must be a positive number.',
    });
  }

  if (!entry.schoolLevel) {
    warnings.push({
      code: 'MISSING_SCHOOL_LEVEL',
      field: 'schoolLevel',
      message: 'School level is not set.',
    });
  }

  if (!entry.date) {
    warnings.push({
      code: 'MISSING_DATE',
      field: 'date',
      message: 'Date is not set.',
    });
  }

  const hasDescription = !!(entry.description && entry.description.trim().length > 0);
  const hasActivity = !!(entry.activity && entry.activity.trim().length > 0);
  if (!hasDescription && !hasActivity) {
    warnings.push({
      code: 'MISSING_DESCRIPTION',
      field: 'description',
      message: 'No description or activity narrative is provided.',
    });
  }

  if (entry.hourSplit && Object.keys(entry.hourSplit).length > 0) {
    const splitSum = Object.values(entry.hourSplit).reduce((sum, v) => sum + (v || 0), 0);
    const hours = entry.hours ?? 0;
    if (Math.abs(splitSum - hours) > 0.001) {
      warnings.push({
        code: 'HOUR_SPLIT_MISMATCH',
        field: 'hourSplit',
        message: `Hour split totals ${splitSum} but entry hours is ${hours}.`,
      });
    }
  }

  return warnings;
}
