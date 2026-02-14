

## Диагностика: почему платформа зависает

Найдено **4 критические проблемы**:

### 1. Edge-функция создаёт новое подключение к БД на КАЖДЫЙ запрос

В `external-db/index.ts` функция `getPool()` вызывается внутри обработчика запроса. Это значит, что каждый HTTP-вызов создаёт новый TCP connection pool к внешнему PostgreSQL серверу. Установка TCP-соединения с удалённым сервером занимает 2-5 секунд, а если сервер в РФ и edge-функция в другом регионе -- до 10 секунд.

**Исправление**: вынести создание пула на уровень модуля. В Deno Deploy (на котором работают backend-функции) модульный код сохраняется между вызовами на одном изоляте -- повторные запросы будут переиспользовать уже открытое соединение.

### 2. Нет таймаута на HTTP-запросы к backend-функции

В `externalDb.ts` функция `call()` использует обычный `fetch()` без `AbortController` и таймаута. Если edge-функция зависает (cold start, медленная БД), фронтенд ждёт бесконечно -- "вечная загрузка".

**Исправление**: добавить `AbortController` с таймаутом 30 секунд + автоматический retry (1 повторная попытка).

### 3. Страница "Трекинг" делает ОТДЕЛЬНЫЙ запрос

`TrackingTab` при каждом открытии вызывает `externalDb.select('tracking_questions')` -- это ещё один HTTP-вызов к edge-функции, ещё одно создание пула, ещё одно ожидание. При этом данные `tracking_questions` уже загружаются в batch-запросе Index.tsx (нет, на самом деле НЕ загружаются -- в batch есть `point_b_questions`, но нет `tracking_questions`).

**Исправление**: включить `tracking_questions` в основной batch-запрос в `Index.tsx` и передавать вопросы в `TrackingTab` как props вместо отдельного запроса.

### 4. Кнопка "Выйти" работает через раз

Функция `signOut` ожидает ответ от auth-сервера (`await supabase.auth.signOut()`). Если сеть медленная, кнопка выглядит "мёртвой". Нужно сначала очистить состояние (мгновенный UI-отклик), а потом делать серверный вызов.

## Затронутые файлы

### 1. `supabase/functions/external-db/index.ts`
- Вынести `getPool()` на уровень модуля (lazy singleton)
- Переиспользовать пул между запросами на одном изоляте

### 2. `src/lib/externalDb.ts`
- Добавить `AbortController` с таймаутом 30 секунд
- Добавить 1 автоматический retry при ошибке
- Улучшить обработку ошибок

### 3. `src/pages/Index.tsx`
- Добавить `tracking_questions` в batch-запрос (11-й запрос)
- Передавать загруженные вопросы в `TrackingTab` через props

### 4. `src/tabs/TrackingTab.tsx`
- Убрать `useEffect` с отдельным `externalDb.select`
- Принимать `trackingQuestions` через props
- Убрать состояние `loading` (данные уже готовы от родителя)

### 5. `src/hooks/useAuth.tsx`
- В `signOut`: сначала очистить state (мгновенный UI), потом вызывать `supabase.auth.signOut()` в фоне

## Технические детали

### Singleton пул в edge-функции:
```typescript
let pool: Pool | null = null;
function getPool() {
  if (pool) return pool;
  // ...создание пула...
  pool = new Pool(...);
  return pool;
}
```

### Таймаут и retry в externalDb.ts:
```typescript
async function call(action, body, attempt = 0) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(url, { signal: controller.signal, ... });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(...);
    return res.json();
  } catch (err) {
    clearTimeout(timeout);
    if (attempt < 1) return call(action, body, attempt + 1);
    throw err;
  }
}
```

### Мгновенный signOut:
```typescript
const signOut = async () => {
  setUser(null);
  setSession(null);
  setRole(null);
  setProfileName(null);
  // Фоновый вызов -- не блокирует UI
  supabase.auth.signOut().catch(() => {});
};
```

## Про РУ-зону

Адаптация под РФ-зону не нужна на уровне кода. Проблема в том, что edge-функции работают в ближайшем к пользователю регионе, а внешний PostgreSQL сервер может быть далеко. Решение -- переиспользование соединений (пункт 1), что убирает повторный overhead на каждый запрос. Код уже полностью русифицирован и не зависит от региональных настроек браузера.

## Ожидаемый результат

- Первая загрузка: 3-5 секунд вместо 15-30+
- Повторные загрузки (warm start): 1-2 секунды
- Трекинг: загружается мгновенно (данные уже есть)
- Выход: мгновенный отклик
- При сбоях: автоматический retry вместо вечной загрузки

