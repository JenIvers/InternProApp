
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
  activity: string;
  location: string;
  schoolLevel: 'Primary' | 'Secondary' | 'Alternate';
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
}
