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

## API smoke-тест

Первый раз создать локальный конфиг, который не попадает в Git:

```bash
cp scripts/smoke_api.example.json scripts/smoke_api.local.json
```

В `scripts/smoke_api.local.json` заполнить admin email/password. Тестовый контакт уже указан в примере:

- телефон: `+7 903 156-65-66`;
- ожидаемый контакт Битрикс: `10828`.

Вместо admin email/password можно указать временный `admin_token`. Это удобно для коротких проверок, но токен нельзя коммитить и нельзя хранить в общих документах.

Read-only проверка:

```bash
npm run smoke:api
```

Проверка с безопасным включением доступа автора тестовому пользователю и ожиданием Битрикс-синхронизации:

```bash
npm run smoke:api:apply
```

Скрипт не создаёт сделки и не публикует рецепты. Он проверяет health, admin auth, `access`, тестового автора, `author_profiles`, `bitrix_contact_id` и приватность public API.

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

Правила:

- редактировать только `server/admin/src/*`;
- `server/admin/admin-panel.js` — generated bundle, напрямую не править;
- layout админки задаётся в `server/admin/src/_styles.js`: `#adm-root` должен занимать всю ширину viewport на Tilda, `#adm-panel` центрируется и ограничивается `max-width: 1100px` по `mbs-design-system`.

### Backend API

```bash
bash scripts/deploy_backend.sh
```

Перед заменой `server/main.py` делает backup SQLite:

`/var/www/coffee-menu/server/backups/app-YYYYMMDD-HHMMSS.before-backend-deploy.db`

После загрузки перезапускает `coffee-menu-api.service` и проверяет локальный health.

Практический нюанс: сразу после `systemctl restart` скрипт иногда получает ранний `curl: (7)` на `127.0.0.1:8000`, хотя сервис затем поднимается штатно. В этом случае не считать деплой успешным автоматически, а проверить отдельно:

```bash
ssh -i "$HOME/.ssh/id_ed25519" root@159.194.233.13 \
  'systemctl is-active coffee-menu-api.service && curl -fsS http://127.0.0.1:8000/api/health'

curl -fsS https://barista-school.online/api/health
```

Для author-изменений после backend-деплоя проверить наличие таблиц:

```bash
ssh -i "$HOME/.ssh/id_ed25519" root@159.194.233.13 \
  'sqlite3 /var/www/coffee-menu/server/data/app.db ".tables" | tr " " "\n" | grep -E "author_(recipe_drafts|ingredients|semis)|recipe_publication_(versions|events)"'
```

Для Mixology auto-author:

- whitelist `server/data/mixology_author_access.json` — приватный runtime-файл с телефонами, не коммитить и не печатать в логах;
- импорт whitelist: `server/scripts/import_mixology_author_access.py`;
- источник v1: `YClients-Dashboard/data/mixology/reports/generated/*.clients.json`;
- доступ выдаётся только для `visited` / «пришёл», остальные статусы не активируют автора.

## Переменные для переопределения

Скрипты не читают и не меняют `.env`. Для временного переопределения можно передать:

```bash
COFFEE_REMOTE=root@159.194.233.13
COFFEE_SSH_KEY=$HOME/.ssh/id_ed25519
COFFEE_HEALTH_URL=https://barista-school.online/api/health
```

## Что не автоматизировано

- Изменение production `.env`.
- Ручные SQL-миграции. Новые author-таблицы сейчас создаются через backend startup/init.
- Ручное обновление приватного Mixology whitelist на production.
- Создание новых Bitrix/userfield enum.
- Публикация в GitHub, если локальная ветка не поверх свежего `origin/main`.
