import { describe, it, expect } from 'vitest';
import {
  mentorGridLayout, clampMentorCount, dashboardMentors, mentorCardText, hoursWithMentor,
  moveMentor, setPrimaryMentor, photoStyle,
} from './index';
import type { InternshipLog, Mentor } from '../../types';

const mentor = (over: Partial<Mentor> = {}): Mentor => ({
  id: 'm', name: 'A', title: 'Principal', organization: 'X', bio: '', showOnDashboard: true, dashboardText: 'quote', ...over,
});

describe('mentorGridLayout (desktop)', () => {
  const cases: [number, number, number][] = [
    [1, 1, 1], [4, 4, 1], [5, 5, 1], [6, 3, 2], [7, 4, 2], [8, 4, 2],
    [9, 5, 2], [10, 5, 2], [11, 4, 3], [12, 4, 3],
  ];
  it.each(cases)('%i mentors -> %i columns, %i rows', (n, cols, rows) => {
    const l = mentorGridLayout(n, false);
    expect(l.cols).toBe(cols);
    expect(l.rows).toBe(rows);
    expect(l.cols).toBeLessThanOrEqual(5);
  });

  it('gets denser as rows are added', () => {
    expect(mentorGridLayout(5, false).variant).toBe('full');
    expect(mentorGridLayout(6, false).variant).toBe('mid');
    expect(mentorGridLayout(12, false).variant).toBe('compact');
  });
});

describe('mentorGridLayout (narrow)', () => {
  it('caps columns at 3 and densifies sooner', () => {
    expect(mentorGridLayout(2, true)).toMatchObject({ cols: 2, variant: 'full' });
    expect(mentorGridLayout(4, true)).toMatchObject({ cols: 2, variant: 'mid' });
    expect(mentorGridLayout(12, true)).toMatchObject({ cols: 3, rows: 4, variant: 'compact' });
  });
});

describe('clampMentorCount / dashboardMentors', () => {
  it('clamps to 1..12 and defaults for junk', () => {
    expect(clampMentorCount(0)).toBe(1);
    expect(clampMentorCount(99)).toBe(12);
    expect(clampMentorCount(NaN)).toBe(4);
    expect(clampMentorCount(5.6)).toBe(6);
  });

  it('keeps pinned mentors in list order, up to the count', () => {
    const ms = [mentor({ id: 'a' }), mentor({ id: 'b', showOnDashboard: false }), mentor({ id: 'c' }), mentor({ id: 'd' })];
    expect(dashboardMentors(ms, 2).map((m) => m.id)).toEqual(['a', 'c']);
    expect(dashboardMentors(ms, 12).map((m) => m.id)).toEqual(['a', 'c', 'd']);
  });
});

describe('mentorCardText', () => {
  const logs = [
    { siteId: 's1', hours: 2.5 }, { siteId: 's1', hours: 1 }, { siteId: 's2', hours: 9 },
  ] as InternshipLog[];

  it('uses the quote by default and falls back to the bio', () => {
    expect(mentorCardText(mentor({ quote: 'Be calm.', bio: 'Bio. More.' }), logs)).toBe('Be calm.');
    expect(mentorCardText(mentor({ bio: 'First one. Second.' }), logs)).toBe('First one.');
  });

  it('uses only the first sentence of the bio', () => {
    expect(mentorCardText(mentor({ dashboardText: 'bio', quote: 'Q', bio: 'Leads well! She grew up here.' }), logs)).toBe('Leads well!');
  });

  it('computes hours together from the linked site, falling back when unlinked', () => {
    expect(mentorCardText(mentor({ dashboardText: 'hours', siteId: 's1' }), logs)).toBe('3.5 hours together');
    expect(mentorCardText(mentor({ dashboardText: 'hours', siteId: 'none', quote: 'Q' }), logs)).toBe('Q');
    expect(hoursWithMentor(mentor(), logs)).toBeUndefined();
  });
});

describe('ordering helpers', () => {
  const ms = [mentor({ id: 'a' }), mentor({ id: 'b' }), mentor({ id: 'c' })];
  it('moves a mentor and ignores moves past the ends', () => {
    expect(moveMentor(ms, 'b', -1).map((m) => m.id)).toEqual(['b', 'a', 'c']);
    expect(moveMentor(ms, 'a', -1)).toBe(ms);
    expect(moveMentor(ms, 'c', 1)).toBe(ms);
  });
  it('keeps exactly one primary mentor', () => {
    const withPrimary = setPrimaryMentor(setPrimaryMentor(ms, 'a', true), 'b', true);
    expect(withPrimary.filter((m) => m.isPrimary).map((m) => m.id)).toEqual(['b']);
    expect(setPrimaryMentor(withPrimary, 'b', false).some((m) => m.isPrimary)).toBe(false);
  });
});

describe('photoStyle', () => {
  it('defaults the focal point to the upper third', () => {
    expect(photoStyle({})).toEqual({ objectPosition: '50% 25%', transformOrigin: '50% 25%' });
  });
  it('applies zoom around the focal point', () => {
    expect(photoStyle({ photoFocus: { x: 40, y: 30 }, photoZoom: 1.5 })).toEqual({
      objectPosition: '40% 30%', transformOrigin: '40% 30%', transform: 'scale(1.5)',
    });
  });
});
