
## Проблема: платформа грузится очень долго или не загружается

При входе пользователя компонент Index.tsx одновременно отправляет **10 отдельных HTTP-запросов** к backend-функции `external-db`. Каждый запрос:
- Вызывает отдельный холодный старт backend-функции
- Создаёт **отдельное TCP-соединение** к внешнему серверу PostgreSQL
- Конкурирует за ограниченное число соединений на внешнем сервере

Когда 10+ соединений приходят одновременно, внешний сервер начинает отклонять или ставить в очередь запросы. Результат -- часть данных не загружается, страница зависает, или вообще не открывается.

## Решение: объединить все запросы в один

Вместо 10 отдельных вызовов -- один запрос `batch`, который выполняет все 10 SQL-запросов в рамках одного соединения к БД.

```text
БЫЛО (10 запросов, 10 соединений):
  Index.tsx загружается
       |
       +--> fetch(external-db?action=select, goals)       --> Pool -> connect -> query
       +--> fetch(external-db?action=select, sessions)    --> Pool -> connect -> query
       +--> fetch(external-db?action=select, protocols)   --> Pool -> connect -> query
       +--> fetch(external-db?action=select, roadmaps)    --> Pool -> connect -> query
       +--> fetch(external-db?action=select, volcanoes)   --> Pool -> connect -> query
       +--> fetch(external-db?action=select, metrics)     --> Pool -> connect -> query
       +--> fetch(external-db?action=select, route_info)  --> Pool -> connect -> query
       +--> fetch(external-db?action=select, diary)       --> Pool -> connect -> query
       +--> fetch(external-db?action=select, questions)   --> Pool -> connect -> query
       +--> fetch(external-db?action=select, answers)     --> Pool -> connect -> query

СТАНЕТ (1 запрос, 1 соединение):
  Index.tsx загружается
       |
       +--> fetch(external-db?action=batch, [все 10 запросов])
                  |
                  v
            Pool -> connect -> query1 -> query2 -> ... -> query10
                  |
                  v
            Один ответ со всеми данными
```

## Затронутые файлы

### 1. `supabase/functions/external-db/index.ts`
- Добавить новый action `batch` -- принимает массив запросов, выполняет их последовательно через одно соединение, возвращает массив результатов
- Это не требует изменения существующих actions -- они продолжат работать для отдельных операций

### 2. `src/lib/externalDb.ts`
- Добавить метод `externalDb.batch(queries)` -- отправляет один HTTP-запрос с массивом операций

### 3. `src/pages/Index.tsx`
- Заменить `Promise.all` из 10 отдельных `externalDb.select()` на один вызов `externalDb.batch()`
- Парсить результат из единого ответа

## Технические детали

### Новый action `batch` в edge-функции

Принимает массив операций и выполняет их последовательно через одно DB-соединение:

```typescript
// Запрос:
{ queries: [
  { action: "select", table: "goals", filters: { user_id: "..." } },
  { action: "select", table: "sessions", filters: { user_id: "..." }, order: { column: "session_number", ascending: true } },
  // ... ещё 8 запросов
]}

// Ответ:
{ results: [
  { data: [...goals] },
  { data: [...sessions] },
  // ... 
]}
```

### Новый метод в externalDb.ts

```typescript
batch: (queries: Array<{ action: string; table: string; [key: string]: any }>) =>
  call('batch', { queries })
```

### Изменение в Index.tsx

Вместо 10 вызовов `externalDb.select()` -- один вызов `externalDb.batch()` с массивом из 10 запросов, затем распаковка результатов по индексу.

## Ожидаемый результат

- Загрузка ускорится в 5-10 раз (один запрос вместо десяти)
- Исчезнут ошибки из-за перегрузки внешнего сервера
- Платформа будет стабильно загружаться с первого раза
- Существующий функционал (отдельные select/insert/update) продолжит работать без изменений
