/**
 * export-model — pure module that turns internship logs into a
 * renderer-agnostic export model for the three PDF export modes.
 *
 * No React, no Firebase, no PDF library — plain data in, plain data out.
 */

import type {
  InternshipLog,
  AppSettings,
  LevelBucket,
  SchoolLevel,
} from '../../types';

export type ExportMode = 'full' | 'activities' | 'meetings';

/** A single column of the export table. */
export interface ExportColumn {
  key: string;
  label: string;
}

/** One table row: cell values keyed by column key. */
export interface ExportRow {
  /** id of the source log entry */
  entryId: string;
  cells: Record<string, string>;
  /**
   * Present only in 'full' mode when the entry carries meeting notes;
   * rendered inline beneath the row by the renderer.
   */
  meetingNotes?: {
    competencyIds: string[];
    reflection: string;
  };
}

export interface ExportSection {
  title: string;
  columns: ExportColumn[];
  rows: ExportRow[];
}

/** Totals section — hours by requirement bucket plus grand total. */
export interface ExportTotals {
  byBucket: Record<LevelBucket, number>;
  grandTotal: number;
}

export interface ExportModel {
  mode: ExportMode;
  title: string;
  columns: ExportColumn[];
  rows: ExportRow[];
  sections: ExportSection[];
  /** Absent in 'meetings' mode (no hours columns / totals there). */
  totals?: ExportTotals;
}

/** Official Bethel Activities Log columns. */
const ACTIVITY_COLUMNS: ExportColumn[] = [
  { key: 'date', label: 'Date' },
  { key: 'activity', label: 'Activity' },
  { key: 'competency', label: 'Competency' },
  { key: 'location', label: 'Location' },
  { key: 'hours', label: 'Hours' },
  { key: 'level', label: 'Level' },
];

/** Scheduled Meetings Log columns (Guide format) — deliberately no Hours. */
const MEETING_COLUMNS: ExportColumn[] = [
  { key: 'date', label: 'Date' },
  { key: 'competency', label: 'Competency' },
  { key: 'reflection', label: 'Reflection' },
];

const TITLES: Record<ExportMode, string> = {
  full: 'Internship Activities Log (with Meeting Notes)',
  activities: 'Internship Activities Log',
  meetings: 'Scheduled Meetings Log',
};

/**
 * Shared bucket rule: maps a log's school level into a requirement bucket.
 * Intermediate folds into the bucket named by settings.intermediateMapsTo
 * (Elementary for Jen).
 */
export function bucketForLevel(
  level: SchoolLevel,
  settings: AppSettings
): LevelBucket {
  switch (level) {
    case 'High School':
      return 'HighSchool';
    case 'Middle':
      return 'Middle';
    case 'Intermediate':
      return settings.intermediateMapsTo;
    case 'Elementary':
    default:
      return 'Elementary';
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function activityText(log: InternshipLog): string {
  return log.description ?? log.activity ?? '';
}

function competencyText(log: InternshipLog): string {
  const ids = log.primaryCompetencyId
    ? [
        log.primaryCompetencyId,
        ...log.taggedCompetencyIds.filter(
          (id) => id !== log.primaryCompetencyId
        ),
      ]
    : log.taggedCompetencyIds;
  return ids.join(', ');
}

/**
 * An entry counts as a meeting only when its notes carry a real reflection;
 * an empty reflection would render a blank meetings row.
 */
export function hasMeetingNotes(log: InternshipLog): boolean {
  return !!log.meetingNotes && log.meetingNotes.reflection.trim().length > 0;
}

function activityRow(log: InternshipLog, includeMeetingNotes: boolean): ExportRow {
  const row: ExportRow = {
    entryId: log.id,
    cells: {
      date: log.date,
      activity: activityText(log),
      competency: competencyText(log),
      location: log.location ?? '',
      hours: String(log.hours),
      level: log.schoolLevel,
    },
  };
  if (includeMeetingNotes && hasMeetingNotes(log)) {
    row.meetingNotes = {
      competencyIds:
        log.meetingNotes.competencyIds.length > 0
          ? [...log.meetingNotes.competencyIds]
          : [...log.taggedCompetencyIds],
      reflection: log.meetingNotes.reflection,
    };
  }
  return row;
}

function meetingRow(log: InternshipLog): ExportRow {
  const notes = log.meetingNotes!;
  const ids =
    notes.competencyIds.length > 0 ? notes.competencyIds : log.taggedCompetencyIds;
  return {
    entryId: log.id,
    cells: {
      date: log.date,
      competency: ids.join(', '),
      reflection: notes.reflection,
    },
  };
}

function computeTotals(
  logs: InternshipLog[],
  settings: AppSettings
): ExportTotals {
  const byBucket: Record<LevelBucket, number> = {
    HighSchool: 0,
    Elementary: 0,
    Middle: 0,
  };
  let grandTotal = 0;
  for (const log of logs) {
    const hours = Number.isFinite(log.hours) ? log.hours : 0;
    byBucket[bucketForLevel(log.schoolLevel, settings)] += hours;
    grandTotal += hours;
  }
  return {
    byBucket: {
      HighSchool: round2(byBucket.HighSchool),
      Elementary: round2(byBucket.Elementary),
      Middle: round2(byBucket.Middle),
    },
    grandTotal: round2(grandTotal),
  };
}

function sortByDate(logs: InternshipLog[]): InternshipLog[] {
  return [...logs].sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Build a renderer-agnostic export model.
 *
 * - 'activities': official columns, all entries, no meeting notes, totals.
 * - 'full': same as activities plus inline meeting notes on rows that have them.
 * - 'meetings': only entries with meetingNotes; Date · Competency · Reflection;
 *   no hours columns and no totals.
 */
export function buildExportModel(
  logs: InternshipLog[],
  settings: AppSettings,
  mode: ExportMode
): ExportModel {
  const ordered = sortByDate(logs);

  if (mode === 'meetings') {
    const rows = ordered.filter(hasMeetingNotes).map(meetingRow);
    const section: ExportSection = {
      title: TITLES.meetings,
      columns: MEETING_COLUMNS,
      rows,
    };
    return {
      mode,
      title: TITLES.meetings,
      columns: MEETING_COLUMNS,
      rows,
      sections: [section],
    };
  }

  const includeNotes = mode === 'full';
  const rows = ordered.map((l) => activityRow(l, includeNotes));
  const totals = computeTotals(ordered, settings);
  const section: ExportSection = {
    title: TITLES[mode],
    columns: ACTIVITY_COLUMNS,
    rows,
  };
  return {
    mode,
    title: TITLES[mode],
    columns: ACTIVITY_COLUMNS,
    rows,
    sections: [section],
    totals,
  };
}
