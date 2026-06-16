# CHECKLIST_RELEASE — barista-school.online

## 1. Git

- `git fetch origin`
- `git status --short --branch`
- Ветка не `behind`, не `diverged`.
- Нет случайных `.env`, `.DS_Store`, временных файлов в индексе.

## 2. Проверка

```bash
bash scripts/check.sh
```

Если менялся backend:

- убедиться, что SQLite backup будет создан перед деплоем;
- проверить, что новые env-переменные описаны в `.env.example`, но реальные значения не попали в Git.

Если менялась admin-панель:

- менять исходники `server/admin/src/*`;
- после этого обязательно собрать `server/admin/admin-panel.js`;
- деплоить именно bundle.

Если менялся frontend:

- проверить desktop/mobile навигацию;
- проверить доступы `drinks`, `finance`, `author`;
- проверить no-access экран и первую доступную вкладку.

## 3. Production smoke

- `https://barista-school.online/api/health`
- Login обычного пользователя.
- `/api/auth/me` возвращает `access`.
- Admin открывается на `/admin`.
- Таблица пользователей показывает доступы.

## 4. Автор рецептов

Для тестового пользователя:

- включить `Автор рецептов` в admin;
- убедиться, что доступ включился без ожидания Битрикс;
- проверить `author_profiles.bitrix_contact_id`;
- открыть контакт Битрикс и проверить метку `Автор рецептов`;
- проверить timeline-комментарий.

## 5. Публичные данные

Перед публикацией витрины проверить, что public API не отдаёт:

- телефон;
- email;
- Telegram;
- yClients ID;
- внутренние ID, которые не нужны покупателю.

## 6. После деплоя

- записать в `CONTEXT.md` или `PROJECT_MAP.md` важные изменения архитектуры;
- сделать commit;
- push только если ветка построена поверх свежего `origin/main`.
