
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
}

export interface InternshipLog {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  activity: string;
  location: string;
  schoolLevel: 'Elementary' | 'Secondary' | 'Alternate';
  taggedCompetencyIds: string[];
  reflections: string;
  artifactIds: string[];
}

export interface CompetencyProgress {
  competencyId: string;
  level: AttainmentLevel;
  lastUpdated: string;
}

export interface AppState {
  logs: InternshipLog[];
  artifacts: Artifact[];
  progress: Record<string, AttainmentLevel>;
}
