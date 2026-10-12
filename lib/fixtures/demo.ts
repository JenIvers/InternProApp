/**
 * Dev-only demo portfolio, loaded by `npm run dev` at `/?demo=1` so screens can
 * be exercised without a Google sign-in or touching real data. Never imported
 * in production builds (App.tsx guards the import with import.meta.env.DEV).
 */
import type { AppState, InternshipLog, Mentor, Artifact } from '../../types';
import { CURRENT_SCHEMA_VERSION } from '../state-migration';

const svgPhoto = (hue: number): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${hue} 40% 78%)"/><stop offset="1" stop-color="hsl(${hue} 40% 40%)"/></linearGradient></defs><rect width="400" height="500" fill="url(#g)"/><circle cx="200" cy="170" r="70" fill="hsl(${hue} 40% 22%)" opacity=".6"/><path d="M50 500c0-100 70-160 150-160s150 60 150 160z" fill="hsl(${hue} 40% 22%)" opacity=".6"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

// Smallest valid one-page PDF.
const TINY_PDF =
  'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iagozIDAgb2JqPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9NZWRpYUJveFswIDAgMjAwIDIwMF0+PmVuZG9iagp0cmFpbGVyPDwvUm9vdCAxIDAgUj4+CiUlRU9GCg==';

const MENTORS: [string, string, string, string, number][] = [
  ['Dr. Maria Alvarez', 'Principal', 'Lincoln High School', 'Lead the building you have, not the one in the handbook.', 200],
  ['James Okafor', 'Assistant Principal', 'Oak Elementary', 'Relationships are the real operating system of a school.', 160],
  ['Linda Chen', 'Director of Teaching & Learning', 'District Office', 'Let the data start the conversation, never end it.', 28],
  ['Robert Hale', 'Principal', 'Pine Middle School', 'Be the calmest person in the loudest hallway.', 262],
  ['Dr. Aisha Rahman', 'Superintendent', 'ISD 278', 'Think in systems, act in classrooms.', 340],
  ['Tom Berglund', 'Special Education Director', 'District Office', 'Compliance is the floor. Kids deserve the ceiling.', 210],
];

export function buildDemoState(): AppState {
  const mentors: Mentor[] = MENTORS.map(([name, title, organization, quote, hue], i) => ({
    id: `demo-mentor-${i}`,
    name,
    title,
    organization,
    bio: `${name} has been a generous guide this year, opening doors to difficult conversations and showing what steady, caring leadership looks like in practice.`,
    quote,
    photoUrl: svgPhoto(hue),
    photoFocus: { x: 50, y: 25 },
    isPrimary: i === 0,
    showOnDashboard: i < 4,
    dashboardText: i % 3 === 2 ? 'bio' : 'quote',
  }));

  const levels = ['High School', 'Elementary', 'Middle'] as const;
  const logs: InternshipLog[] = Array.from({ length: 12 }, (_, i) => ({
    id: `demo-log-${i}`,
    date: `2026-0${1 + (i % 6)}-${10 + i}`,
    startTime: '08:00',
    endTime: '11:00',
    hours: 2 + (i % 3),
    title: `Demo activity ${i + 1}`,
    activity: 'Demo entry for UI testing.',
    description: 'Demo entry for UI testing.',
    location: '',
    schoolLevel: levels[i % 3],
    taggedCompetencyIds: [['A1', 'B2', 'C1'][i % 3]],
    primaryCompetencyId: ['A1', 'B2', 'C1'][i % 3],
    reflections: '',
    artifactIds: i % 2 === 0 ? [`demo-art-${i % 4}`] : [],
  }));

  const artifacts: Artifact[] = [
    { id: 'demo-art-0', name: 'Staff meeting agenda', type: 'image/svg+xml', data: svgPhoto(200), uploadDate: '2026-03-12', taggedCompetencyIds: ['A1'], shelfId: 'demo-shelf' },
    { id: 'demo-art-1', name: 'School Improvement Plan 2025', type: 'application/pdf', data: TINY_PDF, uploadDate: '2026-03-11', taggedCompetencyIds: ['B2'], shelfId: 'demo-shelf' },
    { id: 'demo-art-2', name: 'Walkthrough photo – Rm 214', type: 'image/svg+xml', data: svgPhoto(28), uploadDate: '2026-03-10', taggedCompetencyIds: ['C1'] },
    { id: 'demo-art-3', name: 'Parent night recording', type: 'video/mp4', data: '', uploadDate: '2026-03-09', taggedCompetencyIds: [] },
    { id: 'demo-art-4', name: 'Master schedule draft', type: 'application/pdf', data: TINY_PDF, uploadDate: '2026-03-08', taggedCompetencyIds: ['A1'] },
    { id: 'demo-art-5', name: 'Bus duty reflection', type: '', data: svgPhoto(160), uploadDate: '2026-03-07', taggedCompetencyIds: [] },
  ];

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    logs,
    artifacts,
    progress: {},
    shelves: [{ id: 'demo-shelf', name: 'Leadership Evidence' }],
    sites: [],
    competencyReflections: {},
    primarySetting: 'Secondary',
    settings: {
      primaryLevelBucket: 'HighSchool',
      intermediateMapsTo: 'Elementary',
      targets: { total: 320, primary: 240, others: 40 },
      mentorDashboardCount: 4,
    },
    mentors,
    userProfile: { displayName: 'Demo Intern', email: 'demo@example.edu', photoURL: null },
  };
}
