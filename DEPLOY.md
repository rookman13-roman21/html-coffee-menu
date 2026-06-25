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

После security-изменений вручную проверить, что anonymous `GET /api/suppliers` не отдаёт данные без JWT, а авторизованный клиент получает список публичных поставщиков с телефонами.

Факт последней production-проверки 22 июня 2026: anonymous `GET /api/suppliers` вернул `403 Not authenticated`; Роман подтвердил, что авторизованный клиент видит телефоны поставщиков.

## Деплой по слоям

### Frontend SPA

```bash
bash scripts/deploy_frontend.sh
```

Делает `npm run build`, загружает `dist/` на production и проверяет `/api/health`.

После frontend-деплоя, особенно если пользователи из РФ жалуются, что сайт грузится только через VPN, проверить HTTP/2:

```bash
curl -Iv --http2 https://barista-school.online/ 2>&1 | grep -E 'ALPN|HTTP/2|HTTP/1.1'
curl -fsS --http2 https://barista-school.online/api/health
```

Ожидаемо:

- `ALPN: server accepted h2`;
- `HTTP/2 200` на главной;
- `/api/health` возвращает `{"ok":true,"version":"1.0.0"}`.

Контекст инцидента 18 июня 2026: без HTTP/2 сайт на Beget VPS `159.194.233.13` открывался через VPN, но зависал у части российских провайдеров. Симптом совпал с описанным сценарием ТСПУ/HTTP/1.1: браузер открывает много параллельных TLS-соединений, а сеть их режет/подвешивает. На production включено `listen 443 ssl http2;` в `/etc/nginx/sites-enabled/coffee-menu`.

Если нужно править nginx:

```bash
ssh -i "$HOME/.ssh/id_ed25519" root@159.194.233.13 \
  'nginx -t && systemctl reload nginx'
```

Правила:

- backup конфигов nginx не класть в `/etc/nginx/sites-enabled/`, потому что `nginx.conf` включает wildcard `sites-enabled/*`;
- backup класть в `/root/nginx-backups/` или другое место вне include;
- после правки проверять отсутствие warning `conflicting server name`;
- второй VPS `159.194.202.120` / `159-194-202-120.sslip.io` на 18 июня 2026 тоже отвечал только HTTP/1.1, но текущий SSH-ключ туда не пускал; при доступе включить HTTP/2 аналогично.

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

Backend source of truth находится в `HTML_coffee_menu/server`. `scripts/deploy_backend.sh` берёт `server/main.py` именно из Git-репозитория. Если скрипт останавливается из-за локального `server/data/mixology_author_access.json`, не загружать whitelist вместе с обычным backend-деплоем: обновлять whitelist отдельным refresh-flow. Для экстренного hotfix можно вручную загрузить tracked `server/main.py`, затем проверить production API и наличие ключевых строк исправления на сервере:

```bash
scp -i "$HOME/.ssh/id_ed25519" server/main.py \
  root@159.194.233.13:/var/www/coffee-menu/server/main.py
ssh -i "$HOME/.ssh/id_ed25519" root@159.194.233.13 \
  'systemctl restart coffee-menu-api.service && sleep 3 && curl -fsS http://127.0.0.1:8000/api/health'
```

Пример точечной проверки после backend hotfix без вывода секретов:

```bash
ssh -i "$HOME/.ssh/id_ed25519" root@159.194.233.13   'python3 - <<'"'"'PY'"'"'
from pathlib import Path
s=Path("/var/www/coffee-menu/server/main.py").read_text()
for t in ["_dedupe_pending_workspace_invites", "already_pending"]:
    print(f"{t}: {t in s}")
PY'
```

Для Telegram-уведомлений авторов:

- реальные `JOIN_MBS_BOT_TOKEN`, `JOIN_MBS_BOT_USERNAME`, `JOIN_MBS_AUTHOR_REVIEW_CHAT_ID`, опционально `JOIN_MBS_WEBHOOK_SECRET` задаются только в production `.env`;
- для старого регистрационного бота используется `TELEGRAM_WEBHOOK_SECRET`; если env не задан, production формирует secret из `JWT_SECRET`, после backend-деплоя перерегистрировать `/api/admin/register-webhook`;
- для авторских уведомлений используется `@MBS_work_bot`: `JOIN_MBS_BOT_USERNAME=MBS_work_bot`, токен можно сверить с `MBS_WORK_BOT_TOKEN` в локальном проекте `schedule-online/events-schedule-sync`, но не выводить его в терминал/чат;
- `@Join_MBS_bot` используется BotHelp; не ставить на него webhook платформы, иначе BotHelp перестанет получать входящие сообщения;
- после backend-деплоя зарегистрировать webhook `@MBS_work_bot` через admin endpoint `/api/admin/register-join-mbs-webhook` или прямым `setWebhook` с сервера; если задан `JOIN_MBS_WEBHOOK_SECRET`, регистрация передаст secret_token;
- на 19 июня 2026 production webhook `@MBS_work_bot` установлен на `/api/telegram/join-mbs/webhook`, webhook `@Join_MBS_bot` очищен для BotHelp; после смены домена/бота/токена регистрировать заново;
- не выводить токены и chat_id авторов в логи, документацию и ответы.

Для Mixology auto-author:

- whitelist `server/data/mixology_author_access.json` — приватный runtime-файл с телефонами, не коммитить и не печатать в логах;
- импорт whitelist: `server/scripts/import_mixology_author_access.py`;
- источник v1: `YClients-Dashboard/data/mixology/reports/generated/*.clients.json`;
- доступ выдаётся только для `visited` / «пришёл», остальные статусы не активируют автора.
- если в yClients только что добавили участника или поменяли статус на «пришёл», сначала нужно создать свежий отчёт в `YClients-Dashboard`; старый whitelist сам не обновится.

Безопасное ручное обновление production whitelist:

```bash
cd /Users/Romka/Downloads/All_Code/YClients-Dashboard
MBS_MIXOLOGY_DATE_FROM=2024-01-01 MBS_MIXOLOGY_DATE_TO=YYYY-MM-DD node scripts/mbs_mixology_cup_report.js

cd /Users/Romka/Downloads/All_Code/Coffee_menu
python3 server/scripts/import_mixology_author_access.py \
  --source /path/to/fresh/mbs-mixology-cup-clients-YYYY-MM-DDTHH-MM-SS.clients.json \
  --output /tmp/mixology_author_access.fresh.json

ssh -i "$HOME/.ssh/id_ed25519" root@159.194.233.13 \
  'cd /var/www/coffee-menu/server && mkdir -p backups && cp data/mixology_author_access.json backups/mixology_author_access-$(date +%Y%m%d-%H%M%S).before-refresh.json'

scp -i "$HOME/.ssh/id_ed25519" /tmp/mixology_author_access.fresh.json \
  root@159.194.233.13:/var/www/coffee-menu/server/data/mixology_author_access.json
```

Правила:

- не открывать и не печатать содержимое whitelist в чат или логи;
- проверять только агрегаты: количество items, наличие участия без вывода телефона/yClients ID;
- после обновления whitelist restart API не обязателен: `GET /api/author/profile` читает whitelist и lazy-синхронизирует участия;
- если одновременно деплоится backend, `scripts/deploy_backend.sh` теперь останавливается при наличии локального `server/data/mixology_author_access.json`; whitelist обновлять отдельным refresh-flow или явно ставить `COFFEE_UPLOAD_MIXOLOGY_WHITELIST=1` только при осознанной загрузке свежего файла.

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
- Ручное обновление приватного Mixology whitelist на production после изменений в yClients.
- Создание новых Bitrix/userfield enum.
- Публикация в GitHub, если локальная ветка не поверх свежего `origin/main`.
