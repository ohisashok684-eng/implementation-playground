export interface Goal {
  id: string | number;
  title: string;
  amount: string;
  hasAmount: boolean;
  progress: number;
}

export interface Protocol {
  id: string;
  title: string;
  desc: string;
  icon: string;
  color: string;
  fileName: string;
}

export interface Session {
  number: number;
  date: string;
  time: string;
  summary: string;
  steps: string[];
  gradient: string;
  files: string[];
}

export interface DiaryEntry {
  id: string | number;
  type: 'daily' | 'weekly';
  date: string;
  energy?: number;
  text?: string;
  intent?: string;
  achievements?: string;
  lessons?: string;
  nextStep?: string;
}

export interface Volcano {
  name: string;
  value: number;
  comment: string;
}

export interface ProgressMetric {
  label: string;
  current: number;
  previous: number;
}

export interface RoadmapStep {
  text: string;
  done: boolean;
  deadline: string;
}

export interface Roadmap {
  id: number;
  title: string;
  status: string;
  description: string;
  steps: RoadmapStep[];
  fileUrl?: string;
}

export interface RouteInfo {
  sessionsTotal: number;
  sessionsDone: number;
  timeWeeks: number;
  resources: string[];
}

export type TabId = 'dashboard' | 'roadmaps' | 'tracking' | 'protocols';
