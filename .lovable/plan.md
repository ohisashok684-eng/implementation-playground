

## Единый стиль кнопки "Открыть файл"

Сделать кнопку открытия файла в сессиях и дорожных картах такой же, как в протоколах -- отдельная черная кнопка на всю ширину карточки.

### Что изменится

**1. История сессий (`src/tabs/DashboardTab.tsx`)**
- Заменить мелкие текстовые ссылки "Файл 1" на полноценную черную кнопку с иконкой и текстом "Открыть файл"
- Стиль: `bg-foreground text-white`, скругление, uppercase, на всю ширину -- как у протоколов

**2. Дорожные карты (`src/tabs/RoadmapsTab.tsx`)**
- Заменить маленькую текстовую ссылку "Открыть файл" на такую же черную кнопку
- Стиль идентичен протоколам

### Образец стиля (из протоколов)
```
className="w-full flex items-center justify-center space-x-2 py-4 rounded-2xl
  text-[11px] font-bold uppercase tracking-widest active:scale-95
  transition-transform shadow-lg bg-foreground text-white"
```

### Файлы для изменения
- `src/tabs/DashboardTab.tsx` -- кнопка файла в карточке сессии
- `src/tabs/RoadmapsTab.tsx` -- кнопка файла в карточке дорожной карты
