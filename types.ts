
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
  /** How many pinned mentors the dashboard shows (default 4). */
  mentorDashboardCount?: number;
}

/** What a mentor's dashboard card shows beneath their name, role and school. */
export type MentorCardText = 'quote' | 'bio' | 'hours';

/**
 * A mentor featured on the Mentor Spotlight page. Array order in
 * AppState.mentors is the display order on both the page and the dashboard.
 */
export interface Mentor {
  id: string;
  name: string;
  title: string; // role, e.g. "Principal"
  organization: string; // school or district
  bio: string;
  quote?: string; // a lesson learned from this mentor
  photoUrl?: string; // Firebase Storage download URL (never inline base64)
  photoFocus?: { x: number; y: number }; // 0-100 object-position of the face
  photoZoom?: number; // 1 = fit, >1 = zoomed in
  siteId?: string; // optional link to a Site
  isPrimary?: boolean;
  showOnDashboard: boolean;
  dashboardText: MentorCardText;
}

export interface AppState {
  schemaVersion?: number; // absent => v0; drives migration
  updatedAt?: string; // ISO timestamp stamped on each save; detects stale cross-device state
  logs: InternshipLog[];
  artifacts: Artifact[];
  progress: Record<string, AttainmentLevel>;
  shelves: Shelf[];
  sites: Site[];
  competencyReflections: Record<string, string>;
  primarySetting: 'Primary' | 'Secondary'; // legacy; superseded by settings.primaryLevelBucket
  settings?: AppSettings;
  mentors?: Mentor[];
  userProfile?: {
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  };
}
