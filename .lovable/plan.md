

## Проблема

При создании пользователя через функцию `create-user` профиль и роль записываются только в **Supabase** (через триггер `handle_new_user`). Но:

- **AdminUsers** загружает `profiles` и `user_roles` из **внешней БД** (которая пустая) -- поэтому пользователи не отображаются
- **AdminClientView** загружает `profiles` из **внешней БД** -- поэтому профиль не находится и показывается "Клиент не найден"
- **AdminDashboard** загружает `profiles` из **Supabase** напрямую -- поэтому там данные видны

## Решение

Изменить `AdminUsers` и `AdminClientView` так, чтобы `profiles` и `user_roles` загружались из **Supabase** (как это уже сделано в `AdminDashboard`), а не из внешней БД. Эти таблицы управляются Supabase Auth и триггером, поэтому они всегда актуальны только в Supabase.

### Изменения по файлам

**1. `src/pages/admin/AdminUsers.tsx`**
- Заменить `externalDb.admin.select('profiles', ...)` на `supabase.from('profiles').select(...)`
- Заменить `externalDb.admin.select('user_roles', ...)` на `supabase.from('user_roles').select(...)`
- Заменить `externalDb.admin.update('profiles', ...)` в функции `toggleBlock` на `supabase.from('profiles').update(...)`

**2. `src/pages/admin/AdminClientView.tsx`**
- Заменить загрузку профиля `externalDb.admin.select('profiles', { filters: { user_id: uid } })` на `supabase.from('profiles').select('*').eq('user_id', uid).maybeSingle()`
- Все остальные таблицы (goals, sessions, protocols и т.д.) оставить на внешней БД как есть

Это выровняет все три страницы админки на единый источник данных для профилей и ролей.

