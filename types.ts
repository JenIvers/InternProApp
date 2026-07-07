
export enum AttainmentLevel {
  EMERGING = 'Emerging',
  DEVELOPING = 'Developing',
  PROFICIENT = 'Proficient',
  EXEMPLARY = 'Exemplary'
}

export interface Competency {
  id: string;
  category: string;
  title: string;
  description: string;
}

export interface Artifact {
  id: string;
  name: string;
  type: string;
  data: string; // base64
  uploadDate: string;
  taggedCompetencyIds: string[];
  shelfId?: string;
}

export interface Shelf {
  id: string;
  name: string;
}

export interface Site {
  id: string;
  name: string;
  level: 'Primary' | 'Secondary' | 'Alternate';
  mentorName: string;
}

/** School level recorded on a log entry. */
export type SchoolLevel = 'Elementary' | 'Intermediate' | 'Middle' | 'High School';

/**
 * Requirement bucket for hour tracking. Intermediate hours fold into the
 * Elementary bucket per settings.intermediateMapsTo.
 */
export type LevelBucket = 'HighSchool' | 'Elementary' | 'Middle';

/** External evidence link attached to a log entry (e.g., a Google Doc). */
export interface EvidenceLink {
  id: string;
  label: string;
  url: string;
}

/** Optional meeting-notes facet of a log entry (drives the meetings-only export). */
export interface MeetingNotes {
  competencyIds: string[]; // defaults to taggedCompetencyIds, overridable
  reflection: string;
}

export interface InternshipLog {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number; // decimals allowed
  title?: string;
  activity: string; // legacy narrative field; superseded by `description`
  description?: string; // was `activity`; optional for back-compat with old docs
  location: string; // free-text label (legacy / fallback)
  siteId?: string; // Location as a reference to a Site
  schoolLevel: SchoolLevel;
  taggedCompetencyIds: string[]; // coverage/evidence tags
  primaryCompetencyId?: string; // owns the entry's hours
  hourSplit?: Record<string, number>; // optional explicit split; overrides primary-owns when present
  evidenceLinks?: EvidenceLink[];
  reflections: string;
  artifactIds: string[]; // optional links to Artifacts library
  meetingNotes?: MeetingNotes; // optional facet
}

/** User-editable requirement settings (Jen: HighSchool primary, 320/240/40). */
export interface AppSettings {
  primaryLevelBucket: LevelBucket;
  intermediateMapsTo: 'Elementary';
  targets: {
    total: number; // e.g. 320
    primary: number; // e.g. 240
    others: number; // e.g. 40 (each non-primary bucket)
  };
}

/** Cross-check checklists keyed by reference-data ids (lib/reference/guide.ts). */
export interface AppChecklists {
  suggestedActivities: Record<string, { done: boolean; linkedEntryIds?: string[] }>;
  deliverables: Record<string, { done: boolean; note?: string }>;
}

export interface AppState {
  schemaVersion?: number; // absent => v0; drives migration
  logs: InternshipLog[];
  artifacts: Artifact[];
  progress: Record<string, AttainmentLevel>;
  shelves: Shelf[];
  sites: Site[];
  competencyReflections: Record<string, string>;
  primarySetting: 'Primary' | 'Secondary'; // legacy; superseded by settings.primaryLevelBucket
  settings?: AppSettings;
  checklists?: AppChecklists;
  userProfile?: {
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  };
}
