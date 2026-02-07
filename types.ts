
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

export interface InternshipLog {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  title?: string;
  activity: string;
  location: string;
  schoolLevel: 'Elementary' | 'Intermediate' | 'Middle' | 'High School';
  taggedCompetencyIds: string[];
  reflections: string;
  artifactIds: string[];
}

export interface AppState {
  logs: InternshipLog[];
  artifacts: Artifact[];
  progress: Record<string, AttainmentLevel>;
  shelves: Shelf[];
  sites: Site[];
  competencyReflections: Record<string, string>;
  primarySetting: 'Primary' | 'Secondary';
  userProfile?: {
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  };
}
