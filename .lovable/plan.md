

## Проблема

Текущий подход с программным `.click()` на динамически созданном `<a>` НЕ решает проблему, потому что Safari и мобильные браузеры блокируют **любое** программное открытие новых вкладок после асинхронной операции (fetch signed URL), независимо от того, используется `window.open` или `document.createElement('a').click()`. Браузер считает это попапом, так как клик пользователя "протух" за время ожидания ответа сервера.

## Решение: предзагрузка ссылок

Кардинально другой подход -- **получать подписанные ссылки заранее**, а не по клику. Тогда кнопка "Открыть файл" будет настоящим элементом `<a href="..." target="_blank">`, по которому пользователь кликает сам. Браузер никогда не заблокирует такой клик.

```text
Компонент загружается
        |
        v
useEffect: для каждого файла запрашиваем signed URL
        |
        v
Сохраняем URL в state (Map: filePath -> signedUrl)
        |
        v
Кнопка рендерится как <a href={signedUrl} target="_blank">
        |
        v
Пользователь кликает -- браузер открывает файл БЕЗ ограничений
```

## Затронутые файлы

### 1. `src/lib/openFile.ts`
- Добавить функцию `getSignedUrl(filePath)` -- только получает URL, без открытия
- Оставить `openSignedFile` как запасной вариант

### 2. `src/tabs/ProtocolsTab.tsx`
- Добавить `useEffect` для предзагрузки signed URLs всех протоколов с файлами
- Заменить `<button onClick={handleOpenFile}>` на `<a href={signedUrl} target="_blank" rel="noopener noreferrer">`
- Если URL ещё загружается -- показывать индикатор загрузки

### 3. `src/tabs/DashboardTab.tsx`
- Добавить `useEffect` для предзагрузки signed URLs файлов сессий
- Заменить кнопки на `<a>` теги с предзагруженными ссылками

### 4. `src/tabs/RoadmapsTab.tsx`
- Добавить `useEffect` для предзагрузки signed URLs файлов дорожных карт
- Заменить кнопки на `<a>` теги с предзагруженными ссылками

## Технические детали

Новая функция в `openFile.ts`:
```typescript
export const getSignedUrl = async (filePath: string): Promise<string | null> => {
  const { data, error } = await supabase.storage
    .from('mentoring-files')
    .createSignedUrl(filePath, 3600);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
};
```

Хук предзагрузки в каждом компоненте:
```typescript
const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

useEffect(() => {
  const loadUrls = async () => {
    const urls: Record<string, string> = {};
    for (const item of itemsWithFiles) {
      if (item.fileUrl) {
        const url = await getSignedUrl(item.fileUrl);
        if (url) urls[item.fileUrl] = url;
      }
    }
    setSignedUrls(urls);
  };
  loadUrls();
}, [items]); // перезагрузка при изменении данных
```

Кнопка становится ссылкой:
```tsx
{signedUrls[filePath] ? (
  <a href={signedUrls[filePath]} target="_blank" rel="noopener noreferrer"
     className="...стили кнопки...">
    Открыть файл
  </a>
) : (
  <span className="...disabled стили...">Загрузка...</span>
)}
```

## Почему это сработает

- Пользователь физически кликает по настоящей ссылке `<a>` -- ни один браузер это не блокирует
- Нет асинхронных операций в момент клика -- URL уже готов
- Работает одинаково на всех устройствах и браузерах
- Ссылки действительны 1 час -- более чем достаточно для сессии
- Можно открывать любое количество файлов подряд без ограничений
