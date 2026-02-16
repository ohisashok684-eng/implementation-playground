

## Замена загрузки файлов на URL-ссылки (протоколы + дорожные карты + сессии)

### Суть

Во всех трёх сущностях (протоколы, дорожные карты, сессии) заменяем загрузку файлов через Storage на ввод URL-ссылок (Google Docs, Notion и т.д.). Пользователь при нажатии "Открыть" просто переходит по ссылке -- мгновенно, без signed URL, без about:blank.

---

### Изменения по файлам

#### 1. `src/pages/admin/AdminClientView.tsx` -- админ-панель (основной объём работы)

**Сессии:**
- Убрать `import { uploadFile }` и `fileInputRef`
- Форма сессии: заменить `files: [] as File[]` на `file_urls: [] as string[]` (массив ссылок)
- В модальном окне создания/редактирования: заменить `<input type="file">` + список файлов на текстовые поля для ввода URL + кнопка "Добавить ссылку"
- В `handleSaveSession`: убрать цикл загрузки файлов через `uploadFile`, сохранять `file_urls` напрямую в БД (поле `files` -- это массив строк, теперь там будут URL вместо путей storage)
- В списке сессий (строки 571-605): убрать инлайн-загрузку файла через `<label>/<input type="file">`, заменить кнопки открытия файлов -- вместо `supabase.storage.createSignedUrl` делать `window.open(url, '_blank')`

**Протоколы:**
- Убрать `fileInputRef`
- Форма протокола: заменить `file: null as File | null` на `file_url: ''` (строка URL)
- В модальном окне: заменить `<input type="file">` на текстовое поле URL
- В `handleSaveProtocol`: убрать вызов `uploadFile`, сохранять `file_url` напрямую

**Дорожные карты:**
- Убрать `roadmapFileInputRef` и функцию `handleUploadRoadmapFile`
- Форма: заменить `file: null as File | null` на `file_url: ''`
- В модальном окне: заменить `<input type="file">` на текстовое поле URL
- В `handleSaveRoadmap`: убрать `uploadFile`, сохранять `file_url` напрямую
- В списке карт (строки 756-769): убрать инлайн-загрузку, заменить кнопку открытия файла на `window.open(r.file_url, '_blank')`

#### 2. `src/tabs/ProtocolsTab.tsx` -- пользовательский интерфейс протоколов

- Убрать `import { uploadFile }` и `import { openStorageFile }`
- Убрать `fileInputRef`, `newFile` из state
- Кнопка "Открыть файл": вместо `openStorageFile(p.fileUrl)` делать `window.open(p.fileUrl, '_blank')`
- В модальном окне редактирования: заменить `<input type="file">` и кнопку загрузки на текстовое поле URL
- В `handleSave`: убрать логику `uploadFile`, сохранять URL напрямую

#### 3. `src/tabs/RoadmapsTab.tsx` -- пользовательский интерфейс дорожных карт

- Убрать `import { openStorageFile }`
- Кнопка "Открыть файл": вместо `openStorageFile(rm.fileUrl)` делать `window.open(rm.fileUrl, '_blank')`

#### 4. `src/tabs/DashboardTab.tsx` -- пользовательский интерфейс сессий

- Убрать `import { openStorageFile }`
- Кнопки "Открыть файл" в сессиях (строки 222-235): вместо `openStorageFile(f)` делать `window.open(f, '_blank')`

#### 5. `src/types/mentoring.ts` -- типы

- В `Session`: поле `files: string[]` остаётся без изменений (теперь хранит URL вместо путей)
- В `Protocol`: поле `fileUrl?: string` остаётся без изменений (теперь хранит URL)

---

### Что НЕ меняется

- Схема базы данных -- колонки `file_url` (TEXT) и `files` (TEXT[]) уже существуют и подходят для хранения URL
- `src/lib/openFile.ts` и `src/lib/uploadFile.ts` -- можно оставить как есть (перестанут использоваться для этих сущностей, но не сломают ничего)
- Типы в `src/types/mentoring.ts` -- семантика полей меняется, но типы остаются теми же

### Валидация URL

При вводе URL в админке -- простая проверка что строка начинается с `http://` или `https://`. Если нет -- показывать подсказку.

### Результат

- Все файлы (протоколы, дорожные карты, сессии) открываются мгновенно через `window.open(url, '_blank')`
- Никаких signed URL, никаких токенов, никаких about:blank
- Админ просто вставляет ссылку на Google Docs / Notion / любой другой ресурс

