/**
 * mentors — pure helpers for the Mentor Spotlight page and dashboard row.
 */
import type { InternshipLog, Mentor } from '../../types';

export const MAX_DASHBOARD_COLUMNS = 5;
export const DEFAULT_DASHBOARD_MENTOR_COUNT = 4;
export const MAX_DASHBOARD_MENTOR_COUNT = 12;

export type MentorCardVariant = 'full' | 'mid' | 'compact';

export interface MentorGridLayout {
  cols: number;
  rows: number;
  variant: MentorCardVariant;
}

/**
 * Balanced grid for `count` mentors, at most MAX_DASHBOARD_COLUMNS per row:
 * rows = ceil(count / 5), cols = ceil(count / rows) — so 6 -> 3+3, 8 -> 4+4,
 * 12 -> 4+4+4, 5 -> 5. A short last row is centred by the layout at the same
 * card width. The card variant gets denser as rows are added so the section
 * never grows tall: one row = full cards, two = photo + text side by side,
 * three or more = compact chips.
 *
 * `narrow` (phones) caps the columns at 2-3 and goes denser sooner.
 */
export function mentorGridLayout(count: number, narrow: boolean): MentorGridLayout {
  const n = Math.max(1, Math.floor(count));
  if (narrow) {
    const cols = n <= 2 ? n : n <= 6 ? 2 : 3;
    return { cols, rows: Math.ceil(n / cols), variant: n <= 2 ? 'full' : n <= 4 ? 'mid' : 'compact' };
  }
  const rows = Math.ceil(n / MAX_DASHBOARD_COLUMNS);
  const cols = Math.ceil(n / rows);
  return { cols, rows, variant: rows === 1 ? 'full' : rows === 2 ? 'mid' : 'compact' };
}

export function clampMentorCount(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_DASHBOARD_MENTOR_COUNT;
  return Math.min(MAX_DASHBOARD_MENTOR_COUNT, Math.max(1, Math.round(value)));
}

/** Mentors shown on the dashboard: pinned ones, in list order, up to `count`. */
export function dashboardMentors(mentors: Mentor[], count: number): Mentor[] {
  return mentors.filter((m) => m.showOnDashboard).slice(0, clampMentorCount(count));
}

/** Hours of logged activity at the mentor's linked site, or undefined with no site. */
export function hoursWithMentor(mentor: Mentor, logs: InternshipLog[]): number | undefined {
  if (!mentor.siteId) return undefined;
  const total = logs
    .filter((l) => l.siteId === mentor.siteId)
    .reduce((sum, l) => sum + l.hours, 0);
  return Math.round(total * 100) / 100;
}

function firstSentence(text: string): string {
  const trimmed = text.trim();
  const match = /^.*?[.!?](?=\s|$)/.exec(trimmed);
  return (match ? match[0] : trimmed).trim();
}

/**
 * The line of text under a mentor's name on the dashboard, per the mentor's
 * `dashboardText` choice. Falls back (quote -> bio) when the chosen source is
 * empty, so a card never shows a blank line by accident.
 */
export function mentorCardText(mentor: Mentor, logs: InternshipLog[]): string {
  const quote = mentor.quote?.trim() ?? '';
  const bio = firstSentence(mentor.bio ?? '');
  if (mentor.dashboardText === 'hours') {
    const hours = hoursWithMentor(mentor, logs);
    if (hours !== undefined && hours > 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'} together`;
    return quote || bio;
  }
  if (mentor.dashboardText === 'bio') return bio || quote;
  return quote || bio;
}

export function newMentor(id: string): Mentor {
  return {
    id,
    name: '',
    title: '',
    organization: '',
    bio: '',
    showOnDashboard: true,
    dashboardText: 'quote',
  };
}

/** Move the mentor with `id` one step toward the start (-1) or end (+1). */
export function moveMentor(mentors: Mentor[], id: string, delta: -1 | 1): Mentor[] {
  const from = mentors.findIndex((m) => m.id === id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= mentors.length) return mentors;
  const next = mentors.slice();
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

/** Make `id` the only primary mentor (or clear primary when `primary` is false). */
export function setPrimaryMentor(mentors: Mentor[], id: string, primary: boolean): Mentor[] {
  return mentors.map((m) => ({ ...m, isPrimary: m.id === id ? primary : primary ? false : m.isPrimary }));
}

/** The CSS an <img> needs to keep a mentor's face in frame inside any crop. */
export function photoStyle(mentor: Pick<Mentor, 'photoFocus' | 'photoZoom'>): {
  objectPosition: string;
  transformOrigin: string;
  transform?: string;
} {
  const x = mentor.photoFocus?.x ?? 50;
  const y = mentor.photoFocus?.y ?? 25; // faces sit in the upper part of a portrait
  const zoom = mentor.photoZoom ?? 1;
  return {
    objectPosition: `${x}% ${y}%`,
    transformOrigin: `${x}% ${y}%`,
    ...(zoom > 1 ? { transform: `scale(${zoom})` } : {}),
  };
}
