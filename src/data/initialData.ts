import type { Goal, Protocol, Session, DiaryEntry, Volcano, ProgressMetric, Roadmap, RouteInfo } from '@/types/mentoring';

export const initialGoals: Goal[] = [];

export const initialProtocols: Protocol[] = [];

export const initialSessions: Session[] = [];

export const initialDiaryEntries: DiaryEntry[] = [];

export const initialVolcanoes: Volcano[] = [
  { name: 'Любовь к себе', value: 0, comment: '' },
  { name: 'Здоровье и энергия', value: 0, comment: '' },
  { name: 'Бизнес и карьера', value: 0, comment: '' },
  { name: 'Отношения', value: 0, comment: '' },
  { name: 'Самореализация', value: 0, comment: '' },
  { name: 'Духовность', value: 0, comment: '' },
  { name: 'Деньги', value: 0, comment: '' },
];

export const initialProgressMetrics: Record<string, ProgressMetric> = {
  energy: { label: 'Уровень энергии', current: 0, previous: 0 },
  psyche: { label: 'Состояние психики', current: 0, previous: 0 },
  goalSatisfaction: { label: 'Удовлетворенность целью', current: 0, previous: 0 },
  pathSatisfaction: { label: 'Удовлетворенность от пути', current: 0, previous: 0 },
};

export const initialRoadmaps: Roadmap[] = [];

export const initialRouteInfo: RouteInfo = {
  sessionsTotal: 0,
  sessionsDone: 0,
  timeWeeks: 0,
  resources: [],
};

export const initialPointB = {
  achieved: '',
  notAchieved: '',
  analysis: '',
};
