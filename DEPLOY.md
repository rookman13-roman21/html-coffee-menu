# DEPLOY — Coffee_menu

Быстрый порядок работы для `barista-school.online`.

## Перед правками

```bash
cd /Users/Romka/Downloads/All_Code/Coffee_menu/HTML_coffee_menu
git fetch origin
git status --short --branch
```

Если ветка `behind`, `ahead` или `diverged`, сначала синхронизировать Git. Не начинать правки поверх непонятного состояния.

## Проверка перед деплоем

```bash
bash scripts/check.sh
```

Скрипт проверяет:

- `server/main.py` через `py_compile`;
- сборку `server/admin/admin-panel.js`;
- `node --check` для admin bundle;
- `npm run build`;
- синхронизацию `PROJECT_MAP.md`;
- отсутствие реальных секретов в документации.

## Деплой по слоям

### Frontend SPA

```bash
bash scripts/deploy_frontend.sh
```

Делает `npm run build`, загружает `dist/` на production и проверяет `/api/health`.

### Admin panel

```bash
bash scripts/deploy_admin.sh
```

Собирает `server/admin/admin-panel.js`, проверяет синтаксис, загружает bundle в `/var/www/coffee-menu/dist/admin-panel.js`.

### Backend API

```bash
bash scripts/deploy_backend.sh
```

Перед заменой `server/main.py` делает backup SQLite:

`/var/www/coffee-menu/server/backups/app-YYYYMMDD-HHMMSS.before-backend-deploy.db`

После загрузки перезапускает `coffee-menu-api.service` и проверяет локальный health.

## Переменные для переопределения

Скрипты не читают и не меняют `.env`. Для временного переопределения можно передать:

```bash
COFFEE_REMOTE=root@159.194.233.13
COFFEE_SSH_KEY=$HOME/.ssh/id_ed25519
COFFEE_HEALTH_URL=https://barista-school.online/api/health
```

## Что не автоматизировано

- Изменение production `.env`.
- Миграции с ручными SQL-командами.
- Создание новых Bitrix/userfield enum.
- Публикация в GitHub, если локальная ветка не поверх свежего `origin/main`.
