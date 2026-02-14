

## План рефакторинга: устранение дублирования (DRY)

Приоритет от простого к сложному. Каждый шаг -- самостоятельная правка, не ломающая остальные.

### Шаг 1. formatAmount -- вынести в утилиту (2 минуты)

Создать `src/lib/format.ts` с экспортом `formatAmount`. Удалить копии из `Index.tsx` и `DashboardTab.tsx`, заменить на импорт.

### Шаг 2. Заменить все ручные модалки на ModalOverlay (15 минут)

Компонент `ModalOverlay` уже существует и делает ровно то же самое, что и 10 скопированных блоков. Заменить все инлайн-модалки на `<ModalOverlay>`:

- `Index.tsx`: Point A, Point B, Metric Picker (3 штуки)
- `DashboardTab.tsx`: Steps Edit (1 штука)
- `TrackingTab.tsx`: View Entry (1 штука)
- `RoadmapsTab.tsx`: Roadmap Detail (1 штука)
- `AdminClientView.tsx`: все 5 форм

Это уберёт примерно 100-150 строк дублированной разметки.

### Шаг 3. Компонент ScaleInput для шкалы 1-10 (5 минут)

Создать `src/components/ScaleInput.tsx`:

```text
ScaleInput
  Props: value, onChange, activeColor?, columns?
  Renders: grid of 1-10 buttons
```

Использовать в `TrackingTab` (2 места) и `Index.tsx` (вулканы).

### Шаг 4. Утилита uploadFile (5 минут)

Создать `src/lib/uploadFile.ts`:

```text
uploadFile(bucketPath: string, file: File) => Promise<string | null>
  - Генерирует уникальный путь
  - Загружает в storage
  - Возвращает путь или null при ошибке
```

Заменить 7 копий загрузки файлов в `AdminClientView.tsx` и `ProtocolsTab.tsx`.

### Шаг 5. Хелпер adminCrud для однотипных CRUD-операций (5 минут)

Создать вспомогательную функцию в `AdminClientView.tsx`:

```text
adminAction(action, args, successMsg) => Promise
  - Вызывает externalDb.admin[action]
  - Показывает toast с successMsg
  - Вызывает loadClientData
  - При ошибке показывает toast с ошибкой
```

Это упростит 8-10 однотипных обработчиков delete/update/insert.

## Итого

| Что | Было | Станет | Экономия строк |
|-----|------|--------|----------------|
| formatAmount | 2 копии | 1 утилита | ~5 строк |
| Модальные окна | 10 инлайн | 10 вызовов ModalOverlay | ~120 строк |
| Шкала 1-10 | 3 копии | 1 компонент | ~40 строк |
| Загрузка файлов | 7 копий | 1 утилита | ~35 строк |
| CRUD-обработчики | 8 копий паттерна | 1 хелпер | ~40 строк |

Общая экономия: примерно **240 строк** дублированного кода.

## Затронутые файлы

**Новые файлы:**
- `src/lib/format.ts`
- `src/components/ScaleInput.tsx`
- `src/lib/uploadFile.ts`

**Изменяемые файлы:**
- `src/pages/Index.tsx` -- убрать formatAmount, заменить 3 инлайн-модалки на ModalOverlay, заменить шкалу вулканов на ScaleInput
- `src/tabs/DashboardTab.tsx` -- убрать formatAmount, заменить инлайн-модалку
- `src/tabs/TrackingTab.tsx` -- заменить инлайн-модалку, заменить 2 шкалы на ScaleInput
- `src/tabs/RoadmapsTab.tsx` -- заменить инлайн-модалку
- `src/tabs/ProtocolsTab.tsx` -- использовать uploadFile
- `src/pages/admin/AdminClientView.tsx` -- заменить 5 инлайн-модалок, использовать uploadFile, использовать adminAction хелпер
