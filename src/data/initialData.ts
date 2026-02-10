import type { Goal, Protocol, Session, DiaryEntry, Volcano, ProgressMetric, Roadmap, RouteInfo } from '@/types/mentoring';

export const initialGoals: Goal[] = [
  { id: 1, title: 'Масштаб сообщества', amount: '2500000', hasAmount: true, progress: 30 },
];

export const initialProtocols: Protocol[] = [
  {
    id: 'recovery',
    title: 'Рекавери: протокол восстановления ресурса',
    desc: 'Пошаговый план выхода из состояния эмоционального выгорания и возвращения энергии.',
    icon: 'zap',
    color: 'amber',
    fileName: 'протокол_рекавери_v2.pdf',
  },
  {
    id: 'boundaries',
    title: 'Границы: алгоритм защиты своих интересов',
    desc: 'Как экологично говорить «нет» и сохранять фокус на своих целях в работе с командой.',
    icon: 'zap',
    color: 'purple',
    fileName: 'алгоритм_личных_границ.pdf',
  },
  {
    id: 'focus',
    title: 'Фокус: вход в состояние потока за 5 минут',
    desc: 'Техника настройки на сверхзадачу дня и отсечения лишнего информационного шума.',
    icon: 'zap',
    color: 'blue',
    fileName: 'техника_фокуса_90_мин.pdf',
  },
];

export const initialSessions: Session[] = [
  {
    number: 3,
    date: '07 фев',
    time: '10:00 – 11:30',
    summary: 'Проектирование структуры команды и делегирование операционки.',
    steps: ['Написать вакансию ассистента', 'Собрать регламенты'],
    gradient: 'from-lime to-lime-dark',
    files: ['summary_сессия_3.pdf'],
  },
  {
    number: 2,
    date: '01 фев',
    time: '14:00 – 15:30',
    summary: 'Разбор финансовых барьеров и масштабирование.',
    steps: ['Рассчитать юнит-экономику', 'Протестировать оффер'],
    gradient: 'from-purple-light to-indigo-50',
    files: ['summary_сессия_2.pdf'],
  },
];

export const initialDiaryEntries: DiaryEntry[] = [
  {
    id: 1,
    type: 'daily',
    date: '07 фев',
    energy: 8,
    text: 'Чувствую прилив сил после планерки. Основной фокус на упаковку продукта.',
    intent: 'Сделать 5 звонков ключевым клиентам.',
  },
  {
    id: 2,
    type: 'weekly',
    date: '01 фев',
    achievements: 'Запустили тестовый трафик на 50 000 ₽, получили первые 12 заявок.',
    lessons: 'Нужно быстрее реагировать на сообщения в чате, лояльность падает через 15 минут.',
    nextStep: 'Нанять ассистента для обработки первичных входящих.',
  },
];

export const initialVolcanoes: Volcano[] = [
  { name: 'Любовь к себе', value: 3, comment: '' },
  { name: 'Здоровье и энергия', value: 4, comment: '' },
  { name: 'Бизнес и карьера', value: 6, comment: '' },
  { name: 'Отношения', value: 2, comment: '' },
  { name: 'Самореализация', value: 5, comment: '' },
  { name: 'Духовность', value: 1, comment: '' },
  { name: 'Деньги', value: 7, comment: '' },
];

export const initialProgressMetrics: Record<string, ProgressMetric> = {
  energy: { label: 'Уровень энергии', current: 8, previous: 6 },
  psyche: { label: 'Состояние психики', current: 7, previous: 7 },
  goalSatisfaction: { label: 'Удовлетворенность целью', current: 5, previous: 9 },
  pathSatisfaction: { label: 'Удовлетворенность от пути', current: 9, previous: 8 },
};

export const initialRoadmaps: Roadmap[] = [
  {
    id: 1,
    title: 'Предварительная',
    status: 'Завершена',
    description: 'Анализ ресурсов и постановка целей.',
    steps: [
      { text: 'Заполнение первичного брифа', done: true, deadline: '2025-12-26' },
      { text: 'Аудит текущих ресурсов сообщества', done: true, deadline: '2025-12-27' },
    ],
  },
  {
    id: 2,
    title: 'Утвержденная',
    status: 'В работе',
    description: 'Фокус на масштабирование сообщества.',
    steps: [
      { text: 'Проектирование новой структуры команды', done: true, deadline: '2026-01-15' },
      { text: 'Настройка системы трекинга состояния', done: true, deadline: '2026-01-20' },
      { text: 'Запуск рекламной кампании на 100 000 ₽', done: false, deadline: '2026-02-15' },
    ],
  },
  {
    id: 3,
    title: 'Итоговая',
    status: 'Ожидается',
    description: 'Стратегия после завершения менторства.',
    steps: [
      { text: 'Анализ достигнутых показателей', done: false, deadline: '2026-03-01' },
      { text: 'Упаковка кейса масштабирования', done: false, deadline: '2026-03-10' },
      { text: 'Финальная сессия и печать «Книги жизни»', done: false, deadline: '2026-03-15' },
    ],
  },
];

export const initialRouteInfo: RouteInfo = {
  sessionsTotal: 8,
  sessionsDone: 3,
  timeWeeks: 12,
  resources: ['подписка на платформу', 'бюджет на трафик 100 000 ₽', 'контакты кураторов'],
};

export const initialPointB = {
  achieved: 'Доход вырос до 1 200 000 ₽, сформирована команда из 5 человек, внедрена CRM.',
  notAchieved: 'Не удалось полностью делегировать продажи, так как не прописаны скрипты для сложных продуктов.',
  analysis: 'Путь показал, что основное ограничение было в голове. Злость стала топливом для действий.',
};
