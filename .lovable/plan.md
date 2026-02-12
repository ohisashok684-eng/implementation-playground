

## Загрузка данных из базы на стороне пользователя

### Проблема

Страница пользователя (`Index.tsx`) использует захардкоженные начальные данные из `initialData.ts` (пустые массивы). Данные, добавленные админом в базу (сессии, протоколы, дорожные карты и т.д.), никогда не загружаются на стороне клиента.

Единственное исключение -- вопросы "Точка Б", которые уже загружаются из БД.

### Решение

Добавить в `Index.tsx` загрузку всех данных из базы при авторизации пользователя (`useEffect` по `user.id`), аналогично тому, как это сделано для Point B.

### Таблицы для загрузки

| Данные | Таблица | Маппинг в стейт |
|--------|---------|-----------------|
| Цели | `goals` | `setGoals` |
| Сессии | `sessions` | `setSessions` (убрать `const`, сделать `useState`) |
| Протоколы | `protocols` | `setProtocols` |
| Дорожные карты | `roadmaps` + `roadmap_steps` | `setRoadmaps` |
| Вулканы | `volcanoes` | `setVolcanoes` |
| Метрики | `progress_metrics` | `setProgressMetrics` |
| Маршрут | `route_info` | `setRouteInfo` |
| Дневник | `diary_entries` | `setDiaryEntries` |

### Изменения в файлах

**`src/pages/Index.tsx`**:
1. Добавить `useEffect` с загрузкой всех данных из Supabase по `user.id`
2. Сделать `sessions` изменяемым (`useState` вместо `const`)
3. Маппить данные из БД в формат, ожидаемый компонентами (например, `session_number` -> `number`, `session_date` -> `date`)
4. Если данных в БД нет -- оставлять начальные значения (fallback)
5. Обновить функции сохранения (goals, volcanoes, metrics, route_info, diary) чтобы они писали в БД, а не только в локальный стейт

### Технические детали

Загрузка данных:

```text
useEffect(() => {
  if (!user) return;
  const load = async () => {
    // Параллельная загрузка всех таблиц
    const [goalsRes, sessionsRes, protocolsRes, ...] = await Promise.all([
      supabase.from('goals').select('*').eq('user_id', user.id),
      supabase.from('sessions').select('*').eq('user_id', user.id).order('session_number'),
      supabase.from('protocols').select('*').eq('user_id', user.id),
      supabase.from('roadmaps').select('*, roadmap_steps(*)').eq('user_id', user.id),
      supabase.from('volcanoes').select('*').eq('user_id', user.id),
      supabase.from('progress_metrics').select('*').eq('user_id', user.id),
      supabase.from('route_info').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('diary_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);
    // Маппинг и установка в стейт
  };
  load();
}, [user]);
```

Маппинг данных из БД в типы приложения:

```text
// Сессии: session_number -> number, session_date -> date и т.д.
// Протоколы: description -> desc, file_name -> fileName
// Дорожные карты: roadmap_steps -> steps (с маппингом полей)
// Метрики: массив -> Record<string, ProgressMetric>
// Route info: sessions_total -> sessionsTotal и т.д.
```

Сохранение данных в БД (upsert/insert при изменениях):
- Goals: upsert при сохранении, delete при удалении
- Volcanoes: upsert при фиксации комментария
- Metrics: upsert при изменении значения
- Route info: upsert при сохранении маршрута
- Diary: insert при создании записи
