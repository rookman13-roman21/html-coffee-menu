# PROJECT_MAP.md — Coffee Menu SPA

> Последнее обновление: 25 июня 2026
> Стек: **Vite 5.4 + Vanilla JS (ES-модули) + FastAPI + SQLite**
> Продакшн: `https://barista-school.online`

---

## 0. Текущее состояние проекта

Быстрый архитектурный слой вынесен в `ARCHITECTURE.md`: домены продукта, источники правды, матрица ролей, API командной работы, data safety rules и smoke-сценарии.

`Coffee_menu` сейчас является ядром платформы `barista-school.online`:

- **Кабинет клиента кофейни**: напитки, поставщики, бюджет, план продаж, финмодель.
- **Кабинет автора рецептов**: профиль автора, отправка рецептов на модерацию, подготовка к публикации на витрину.
- **Публичная витрина авторских рецептов**: безопасный public API/страница без личных данных автора.
- **Admin backend**: управление пользователями, пакетами доступа, авторами, публикациями, поставщиками, пресетами и библиотекой оборудования.

Для передачи контекста в новый чат использовать `HTML_coffee_menu/NEXT_CHAT_HANDOFF.md`.

Актуальные изменения 22-24 июня 2026:

- `Бюджет` / стартовые вложения: сортировки категорий по порядку, сумме и количеству позиций; поиск по позициям; проценты/прогресс; развернуть/свернуть все категории.
- `План продаж`: добавлен блок `Дополнительные продажи` для выпечки, десертов, еды и импульса; расчёт поддерживает `% чеков` и `шт/день`, пресеты, фильтры и подсказки в таблице.
- `Финмодель`: выручка, прибыль, FC%, ТБУ, окупаемость, запас прочности и What-if считают общий план продаж: напитки + доп. позиции. KPI `Напитков / день` заменён на `Чеков / день`.
- `Финмодель` / постоянные расходы: блок расходов получил summary-плашки `ручные`, `ФОТ`, `масштаб.`, hover-подсказки, спокойный авто-ФОТ и понятную модалку расхода (`Сумма ₽/мес`, `Масштабировать в сценариях`, `Процент от выручки, %/мес`).
- `PDF/XLSX`: полный PDF и Excel используют общий план продаж; из PDF убран блок `Рейтинг напитков`, в Excel рейтинг оставлен только как dashboard-аналитика.
- `styles.css`: мобильная финмодель стала компактнее, таблица доп. продаж на mobile сохраняет horizontal scroll и все desktop-поля, строка `ИТОГО` в таблице напитков больше не обрезается.
- `server/admin/src/_equipment.js`: категории admin-библиотеки синхронизированы с клиентским бюджетом, пустые разделы не скрываются, `+ Добавить` наследует выбранную категорию, добавлены empty state, `Где используется` и полнота заполнения библиотеки.
- `server/admin/src/_presets.js`: текущий пресет группируется по категориям бюджета; библиотека справа умеет `Скрыть уже добавленные`; уже выбранные позиции показывают бейдж `В пресете`.
- `server/admin/src/_styles.js`: в `Пресеты` убран sticky у заголовков библиотеки, потому что Safari перекрывал первую строку списка.
- `src/ui/misc.js`: общий `Excel (xlsx)` из верхнего меню исправлен для ExcelJS/Safari: импорт `GROUP_LABEL`, правильный `mergeCells` по `titleRow.number`, общий `try/catch`, ссылка добавляется в DOM перед `a.click()`.
- `Команда проекта`: добавлен workspace-слой для клиентов, которые запускают кофейню вместе с партнёрами/подрядчиками. Верхний dropdown теперь быстрый переключатель проекта/заведения, а управление вынесено в `/app/settings`: `Аккаунт`, `Проект`, `Команда`, `Заведения`, `Журнал`, `Восстановление`, `Интеграции`. Пользователи с `access_drinks` / `access_finance` могут создавать свои проекты; приглашённые без оплаты работают как `guest-editor` только в чужом проекте. Структура заведений, удаление ключевых сущностей и массовый сброс/очистка проекта в v1 доступны только владельцу; backend дополнительно блокирует structural/destructive overwrite через `PUT /api/state` для editor/guest и пишет заблокированные попытки в журнал.
- `Аккаунт` и `Журнал`: пользовательский аватар доступен в профиле, верхнем меню, списке команды и строках журнала. В журнале справа используется порядок `имя → роль → аватар`; время событий форматируется как московское (`Europe/Moscow`).
- `Команда проекта` / invite UX: повторный invite на тот же email больше не создаёт дубль; существующая pending-ссылка возвращается повторно, email текущего участника блокируется как уже добавленный. Старые дубли pending-invite автоматически отзываются при загрузке команды. Team-модалки используют фирменный popup/confirm и исправленную геометрию `.btn-green`.
- `Безопасность workspace UI`: localStorage заведений изолирован по `user + workspace_id`; `/app/settings` грузит team/activity/snapshots только по active workspace со stale-response guard; меню заведений экранирует id/name/icon; duplicate startup fetches `/suppliers` and `/drinks/overrides` removed.
- `Права workspace`: frontend-матрица owner/editor/guest вынесена в `src/access/permissions.js`; `auth.js` экспортирует совместимые wrappers, а settings/locations используют единые permission checks для команды, структуры, удаления и восстановления. Backend дополнительно блокирует owner-only события ручного журнала, чтобы editor/guest не мог подделать `workspace_deleted`, `member_removed`, `location_deleted`, `snapshot_restored` и похожие записи.

### Пакеты доступа

| Пакет | Что открывает | Где управляется |
|---|---|---|
| `access_drinks` / `drinks` | `Поставщики`, `Рецептуры` | `/admin` → drawer пользователя |
| `access_finance` / `finance` | `Бюджет`, `План продаж`, `Финмодель` | `/admin` → drawer пользователя |
| `access_author` / `author` | Кабинет автора рецептов и публикация на витрину | `/admin` → drawer пользователя |

Важно:

- Новые пользователи по умолчанию получают аккаунт без пакетов; доступы выдаёт админ.
- `author` даёт доступ к вкладкам `Поставщики`, `Рецептуры`, `Мой профиль`, даже если `drinks=false`.
- Если у пользователя одновременно включены `author` и `drinks/finance`, frontend считает это режимом `Автор`, чтобы не открыть обычный клиентский набор данных.
- Навигация и `switchTab()` защищают закрытые вкладки от открытия через старый `localStorage`.
- Онбординг динамический: общий, напитки, финансы или автор.

### Author layer

Frontend-правила режима `Автор` вынесены в `src/access/author-layer.js`.

Что отличается от обычного режима `Напитки`:

- в авторских рецептурах пустой старт без демо-рецептов;
- авторские рецепты, фото рецептов, ингредиенты и полуфабрикаты сохраняются на backend;
- `customDrinks`, `customMats`, `semiItems` в режиме `Автор` не являются источником правды в localStorage;
- поставщики `Hiwater`, `Baristaline`, `МайТаймКап` скрыты только для author-слоя;
- в профиле автора есть ФИО, телефон, описание, аватар и popup с условиями сотрудничества;
- публикации в профиле автора сгруппированы по статусам: требуют внимания, на проверке, опубликованы, сняты, все;
- карточка авторского рецепта поддерживает обязательные поля для публикации, оборудование, фото, процесс, подачу/срок и органолептику;
- Telegram в author frontend-форме не показывается и не отправляется при сохранении профиля.
- Telegram-уведомления авторов подключаются через `@MBS_work_bot` отдельной привязкой: одноразовая ссылка в кабинете автора, приватный `telegram_chat_id` на backend, уведомления о проверке рецептов. `@Join_MBS_bot` не использовать для webhook платформы, он остаётся за BotHelp.
- Общий confirm-helper `src/ui/modals.js::showConfirm()` возвращает `Promise<boolean>` и также поддерживает старый callback-формат; это нужно для сценария отключения Telegram в кабинете автора.

Backend-хранилище author-слоя:

| Таблица | Назначение |
|---|---|
| `author_recipe_drafts` | Черновики рецептов автора до отправки на модерацию |
| `author_ingredients` | Кастомные ингредиенты конкретного автора |
| `author_semis` | Кастомные полуфабрикаты конкретного автора |
| `author_championship_participations` | Очищенные данные участий автора в чемпионатах для личного профиля |
| `recipe_publications` | Активная карточка публикации, статус, цена/описание витрины, validation/review |
| `recipe_publication_versions` | Снимки версий, которые автор отправлял на проверку |
| `recipe_publication_events` | История событий модерации и публикации |

ID-изоляция frontend:

- рецепты автора: `100000000 + draft_id`;
- полуфабрикаты автора: `200000000 + semi_id`.

Это нужно, чтобы данные разных авторов не пересекались и чтобы старые локальные ID не конфликтовали с базовой библиотекой.

Авто-доступ Mixology Cup:

- приватный whitelist хранится в runtime-файле `server/data/mixology_author_access.json` и не коммитится;
- импорт whitelist делает `server/scripts/import_mixology_author_access.py` из `YClients-Dashboard/data/mixology/reports/generated/*.clients.json`;
- свежий yClients-отчёт для импорта создаётся в `YClients-Dashboard` скриптом `scripts/mbs_mixology_cup_report.js`;
- доступ автора выдаётся только при совпадении телефона и фактическом статусе `visited` / «пришёл»;
- `no_show`, `canceled`, `pending`, `confirmed` не дают author-доступ;
- при совпадении `POST /api/auth/register` сразу создаёт активного пользователя с `access_author=true`, `access_drinks=false`, `access_finance=false`, создаёт/обновляет author profile, запускает Битрикс-синхронизацию и возвращает `auto_author:true`.
- очищенные данные выступлений Mixology Cup lazy-синхронизируются в `author_championship_participations` и показываются только самому автору в `Мой профиль`;
- `GET /api/author/profile` отдаёт `championship_participations`, `PUT /api/author/profile` их не принимает;
- если у автора есть участие Mixology Cup, UI показывает блок `Участие в чемпионатах` и сценарий создания рецепта Mixology Cup; если участия нет, остаётся нейтральный сценарий первого авторского рецепта;
- после новых записей или смены статуса в yClients нужно вручную обновить whitelist на production, иначе блок в профиле не появится.

### Хранение пользовательского состояния

- Серверное состояние живёт в `user_state.state_json`.
- Локальный кэш в браузере теперь привязан к пользователю: `mbs_locations__<user>` и `mbs_loc_<id>__<user>`.
- Нельзя возвращать глобальные ключи `mbs_locations`, `mbs_active_loc`, `mbs_loc_*` без user scope: это снова смешает проекты разных аккаунтов в одном браузере.

### Битрикс и авторы

При включении доступа `Автор рецептов` backend запускает best-effort синхронизацию с Битрикс:

- ищет контакт по телефону, затем email;
- если контакт не найден, создаёт новый;
- пишет `bitrix_contact_id` в `author_profiles`;
- добавляет метку `Автор рецептов` в multi-list поле `BITRIX_AUTHOR_MARK_FIELD`;
- добавляет комментарий в timeline контакта только при первом добавлении автора;
- при сохранении author profile обновляет `NAME`, `LAST_NAME`, `SECOND_NAME` и фото контакта;
- не пишет служебную авторскую информацию в `COMMENTS`, чтобы не утащить её в yClients через `sync_comment`.

На production 16 июня 2026 `BITRIX_WEBHOOK`, `BITRIX_AUTHOR_MARK_FIELD` и `BITRIX_AUTHOR_MARK_LABEL` добавлены в `/var/www/coffee-menu/server/.env`; API перезапущен. Перед изменением создан backup `.env`, а перед добавлением enum — snapshot поля Битрикс. Read-only проверка webhook показала: поле `UF_CRM_1766349995197` доступно, enum `Автор рецептов` присутствует.

Smoke-проверка `npm run smoke:api:apply` пройдена на тестовом пользователе `suslin21@ya.ru`, телефон `+7 903 156-65-66`, Битрикс contact id `10828`.

---

## 1. Структура корневой папки

```
Coffee_menu/
├── HTML_coffee_menu/        ← Git source of truth: frontend, backend `server/`, scripts, docs
├── server/                  ← Legacy/runtime-копия backend; новые правки делать в HTML_coffee_menu/server
├── AUTH_SYSTEM.md           ← Документация системы авторизации
├── DEPLOY_PLAN.md           ← План деплоя
├── PROJECT_MAP.md           ← Этот файл
├── deploy.sh                ← Скрипт деплоя
├── _push.sh                 ← Быстрый git push
├── .github/
│   └── copilot-instructions.md  ← Архитектурные правила для Copilot
└── .vscode/                 ← Настройки VS Code + tasks.json
```

---

## 2. Основные папки и их роли

### `HTML_coffee_menu/` — Фронтенд SPA

```
HTML_coffee_menu/
├── index.html               ← Единственная HTML-страница (SPA-каркас)
├── styles.css               ← Все стили приложения
├── package.json             ← npm-зависимости (только vite)
├── vite.config.js           ← Конфиг сборщика Vite
├── dist/                    ← Продакшн-билд (не коммитится)
├── public/                  ← Статика (images/, копируется в dist as-is)
└── src/                     ← Весь JS-код (ES-модули)
    ├── main.js              ← ТОЧКА ВХОДА — импорты, window.*, _initApp
    ├── data/                ← Базовые данные (константы, справочники)
    ├── state/               ← Глобальный стейт (S, saveState)
    ├── utils/               ← Утилиты (calc, format, image); calc считает бюджет, продажи, доп. продажи и финмодель
    ├── render/              ← Рендер вкладок (cost, dashboard, finmodel, recipes, sales)
    ├── modals/              ← Логика модальных окон (drink, mat, semi)
    ├── export/              ← Экспорт (CSV, техкарты)
    └── ui/                  ← UI-обработчики (events, auth, suppliers, payroll и др.)
```

### `server/` — Бэкенд + Деплой

```
server/
├── main.py                  ← FastAPI-приложение (все endpoints)
├── requirements.txt         ← Python-зависимости
├── coffee-menu-api.service  ← systemd unit-файл (деплой на VPS)
├── .env.example             ← Пример конфига окружения
└── admin/
    ├── admin-panel.js       ← SPA-панель администратора (Vanilla JS, генерируется build.sh)
    ├── build.sh             ← Сборка admin-panel.js из src/*.js (cat конкатенация)
    ├── index.html           ← Заглушка-страница CP (не используется напрямую)
    ├── tilda-admin.html     ← Вставка на Тильду
    └── src/                 ← Исходные части admin-panel.js (12 файлов)
        ├── _header.js       (строки   1–24)  — IIFE-открытие + state vars
        ├── _styles.js       (строки  25–500) — injectStyles()
        ├── _html.js         (строки 501–859) — injectHTML() + _overlay
        ├── _utils.js        (строки 860–907) — toast, api, fmtDate, avatar, isOnline
        ├── _drawer.js       (строки 908–1001) — openDrawer/closeDrawer (пользователи)
        ├── _tab.js          (строки 1002–1020) — switchAdmTab
        ├── _equipment.js    (строки 1021–1587) — OC_MAIN_CATS + CRUD оборудования
        ├── _suppliers.js    (строки 1588–1722) — CRUD поставщиков
        ├── _presets.js      — CRUD пресетов
        ├── _authors.js      — авторы рецептов, публикации, статусы Битрикс
        ├── _render.js       — render(), renderPagination(), exportCsv()
        ├── _auth.js         — showPanel, doLogout, doLogin
        └── _events.js       — делегированные события + })();
```

---

## 3. Главные страницы и где они лежат

| Страница | Файл | Описание |
|---|---|---|
| **SPA-приложение** | `HTML_coffee_menu/index.html` | Единственная HTML-страница; содержит все вкладки и модалы |
| **Лендинг** | `HTML_coffee_menu/landing.html` | Маркетинговая страница (статическая) |
| **Админ-панель** | `server/admin/admin-panel.js` | Встраивается на Tilda (`baristaschool.online`) через `<script>` |
| **Витрина рецептов** | `HTML_coffee_menu/src/ui/public-recipes.js` | Public showcase опубликованных авторских рецептов |

### Вкладки SPA (переключаются через `switchTab()`)

| Вкладка | `activeTab` | Рендер-модуль |
|---|---|---|
| Рецептуры | `'recipes'` | `src/render/recipes.js` |
| Поставщики | `'cost'` | `src/render/cost.js` |
| План продаж | `'sales'` | `src/render/sales.js` — напитки + дополнительные продажи |
| Дашборд | `'dashboard'` | `src/render/dashboard.js` |
| Финмодель | `'finmodel'` | `src/render/finmodel.js` — общий план продаж, P&L, ТБУ, прогноз |
| Мой профиль автора | `'authorProfile'` | `src/ui/author.js` |

Author routes:

- `/app/author/suppliers` → `Поставщики`;
- `/app/author/recipes` → `Рецептуры`;
- `/app/author/profile` → `Мой профиль`.

---

## 4. Логика API (бэкенд)

**Файл:** `server/main.py` (1 165 строк, единый монолит FastAPI)

### Ключевые группы endpoints

| Группа | Prefix | Описание |
|---|---|---|
| Аутентификация | `/api/auth/` | register, login, me, forgot-password, reset-password |
| Яндекс OAuth | `/api/auth/yandex/` | login, callback |
| Telegram webhook | `/api/telegram/webhook` | Обработка callback_query (активация пользователей), protected by Telegram secret header + admin chat check |
| Telegram авторов | `/api/telegram/join-mbs/webhook`, `/api/author/telegram/*` | Привязка `@MBS_work_bot` и уведомления по модерации рецептов |
| Пользователи (admin) | `/api/admin/users` | CRUD пользователей, пакеты доступа |
| Авторы | `/api/author/*` | Профиль автора, черновики, ингредиенты, полуфабрикаты, фото и отправка рецептов на публикацию |
| Авторы (admin) | `/api/admin/authors`, `/api/admin/author-recipes` | Модерация авторов и публикаций |
| Public рецепты | `/api/public/author-recipes` | Витрина опубликованных рецептов |
| Поставщики (client) | `/api/suppliers` | Список публичных поставщиков только для активных авторизованных пользователей; телефоны не отдаются anonymous public API. Production verified 22 июня 2026: anonymous `403`, авторизованный клиент видит телефоны |
| Оборудование (OC) | `/api/oc-library` | CRUD библиотеки оборудования/мебели |
| Парсинг ссылок | `/api/proxy-meta`, `/api/admin/parse-url` | Извлечение цены/фото товара по URL с SSRF-фильтром public/private host |
| Данные проекта | `/api/state` | GET/PUT сохранение state активного workspace; старый `user_state` используется как fallback миграции |
| Командная работа | `/api/workspaces` | Список/создание проектов, участники, приглашения, журнал действий и точки восстановления; создание своих проектов разрешено только при `access_drinks` / `access_finance` или admin |
| Healthcheck | `/api/health` | Статус сервиса |

### Переменные окружения (`.env` на сервере)

```
JWT_SECRET=...
DATABASE_URL=sqlite:///./data/app.db
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_USER=hello@baristaschool.ru
SMTP_PASS=...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_ADMIN_CHAT_ID=33668380
TELEGRAM_WEBHOOK_SECRET=...  # optional; production can derive from JWT_SECRET
JOIN_MBS_WEBHOOK_SECRET=...  # optional for author Telegram webhook (@MBS_work_bot)
YANDEX_CLIENT_ID=...
YANDEX_SECRET=...
YANDEX_REDIRECT=https://barista-school.online/api/auth/yandex/callback
APP_URL=https://barista-school.online
BITRIX_WEBHOOK=...
BITRIX_AUTHOR_MARK_FIELD=UF_CRM_1766349995197
BITRIX_AUTHOR_MARK_LABEL=Автор рецептов
```

### База данных

- **Тип:** SQLite
- **Путь на сервере:** `/var/www/coffee-menu/server/data/app.db`
- **Таблицы:** `users`, `user_state`, `author_profiles`, `author_recipe_drafts`, `author_ingredients`, `author_semis`, `recipe_publications`, `recipe_publication_versions`, `recipe_publication_events`, `recipe_orders`, `oc_library`, `sup_library`, `oc_presets`, `drink_overrides`

#### Важные таблицы авторской платформы

| Таблица | Назначение |
|---|---|
| `author_profiles` | Профиль автора, публичные данные, статус документов, `bitrix_contact_id`, статус синхронизации с Битрикс |
| `author_recipe_drafts` | Серверные черновики авторских рецептов |
| `author_ingredients` | Кастомные ингредиенты автора, отдельно по `author_user_id` |
| `author_semis` | Кастомные полуфабрикаты автора, отдельно по `author_user_id` |
| `recipe_publications` | Заявки рецептов на модерацию и опубликованные карточки витрины; содержит `source_draft_id`, `version`, `validation_json`, `review_flags_json`, `review_comment`, `public_description` |
| `recipe_publication_versions` | История отправленных версий публикации, включая snapshot рецепта |
| `recipe_publication_events` | Журнал событий публикации: submitted, review_saved, rejected, published, archived |
| `recipe_orders` | Заявки/заказы по опубликованным рецептам, `bitrix_deal_id` |
| `workspaces` | Общие проекты кофейни и общий `state_json` для команды |
| `workspace_members` | Участники проекта, роли `owner` / `editor` |
| `workspace_invites` | Invite-link по email, статусы `pending` / `accepted` / `revoked` |
| `workspace_activity` | Append-only журнал ключевых действий внутри проекта |
| `workspace_state_snapshots` | Последние 40 снимков state workspace для восстановления после ошибочных правок |

#### `author_profiles`: поля Битрикс

| Поле | Назначение |
|---|---|
| `bitrix_contact_id` | ID контакта Битрикс, найденного или созданного для автора |
| `bitrix_sync_status` | `pending`, `synced`, `error` или пусто |
| `bitrix_sync_error` | Короткая ошибка последней синхронизации |
| `bitrix_synced_at` | Время успешной синхронизации |

#### Схема `oc_library`

| Поле | Тип | Описание |
|---|---|---|
| `id` | `INTEGER PRIMARY KEY` | Автоинкремент |
| `name` | `TEXT` | Название товара/позиции |
| `subcategory` | `TEXT DEFAULT 'equipment'` | Под-категория (ключ) |
| `category` | `TEXT DEFAULT 'equipment'` | Главная категория |
| `price` | `REAL DEFAULT 0` | Цена |
| `photo` | `TEXT DEFAULT ''` | URL или base64 фото |
| `url` | `TEXT DEFAULT ''` | Ссылка на товар |
| `is_public` | `INTEGER DEFAULT 1` | Видимость в SPA |
| `is_featured` | `INTEGER DEFAULT 0` | Выделение (featured) |
| `sort_order` | `INTEGER DEFAULT 0` | Порядок сортировки |
| `description` | `TEXT DEFAULT ''` | Описание / партнёрская заметка |
| `promo_code` | `TEXT DEFAULT ''` | Промокод |
| `promo_expires` | `TEXT DEFAULT ''` | Дата окончания промокода (ISO) |

---

## 5. Стили

| Файл | Роль |
|---|---|
| `HTML_coffee_menu/styles.css` | **Единый файл всех стилей** — нет CSS-модулей, нет препроцессоров |

### Основные CSS-классы

| Класс | Назначение |
|---|---|
| `.tab-*` | Переключение вкладок |
| `.modal-bg`, `.modal` | Модальные окна |
| `.oc-*` | Блок «Стартовые вложения» (Дашборд) |
| `.fm-*` | Финансовая модель |
| `.ing-row` | Строки ингредиентов в рецептах |
| `.author-*` | Кабинет автора рецептов |
| `.public-recipes-*` | Public-витрина авторских рецептов |
| `.kpi-*` | KPI-карточки Дашборда |
| `.sc-*` | Сценарии Финмодели |
| `.main` | Основной контейнер (`flex:1; width:100%`) |

---

## 6. Компоненты (модули `src/`)

### `src/data/` — Справочные данные (read-only)

| Файл | Экспорт |
|---|---|
| `mat.js` | `MAT_CATEGORIES`, `MAT`, `MAT_NUTRITION`, `MAT_ORIG`, `BASE_MAT_KEYS` |
| `drinks.js` | `DRINKS`, `GROUP_LABEL`, `DRINK_QUALITY`, `DRINKS_ORIG`, `BASE_DRINK_IDS` |
| `constants.js` | `SALES_PRESETS`, `FIXED_COSTS_CATS`, `FIXED_COSTS_DEF`, `MENU_TEMPLATES` |

### `src/state/` — Глобальный стейт

| Файл | Экспорт |
|---|---|
| `store.js` | `S` (главный объект состояния), `saveState`, `loadState`, `scheduleServerSync` |
| `ui-state.js` | `_collapsed`, `_semiCollapsed` (состояние UI, не сохраняется) |

### `src/utils/` — Утилиты

| Файл | Экспорт |
|---|---|
| `calc.js` | `calcCost`, `calcNutrition`, `enrich`, `withABC`, `bepCalc` и др. |
| `format.js` | `rub`, `pct`, `int`, `fcCls`, `abcBadge`, `fcCombinedHtml` |
| `image.js` | `DRINK_IMAGES`, `getDrinkImage`, `_compressImageDataURL` |

### `src/render/` — Рендер вкладок

| Файл | Функция | Вкладка |
|---|---|---|
| `dashboard.js` | `renderDashboard()` | Дашборд + Стартовые вложения |
| `cost.js` | `renderCost()` | Себестоимость + Поставщики |
| `sales.js` | `renderSales()` | План продаж |
| `recipes.js` | `renderRecipes()` | Рецептуры |
| `finmodel.js` | `renderFinModel()` | Финансовая модель |

### `src/modals/` — Модальные окна (логика)

| Файл | Функции |
|---|---|
| `drink.js` | `openAddDrink`, `openEditDrink`, `saveDrink`, `deleteDrink` |
| `mat.js` | `openEditMat`, `saveMat`, `cancelMat`, `deleteMat` |
| `semi.js` | `openAddSemi`, `openEditSemi`, `saveSemi`, `deleteSemi` |

`drink.js` в author mode:

- новый рецепт открывается с группой `Авторские`;
- черновик можно сохранить неполным;
- перед отправкой `На витрину` проверяются обязательные поля публикации;
- цена подписана как `Рекомендуемая цена продажи` с tooltip;
- блок оборудования стоит после `Процесс приготовления`;
- своё оборудование добавляется через пункт выпадающего списка и popup, похожие названия блокируются на frontend.

### `src/export/` — Экспорт данных

| Файл | Функции |
|---|---|
| `techcards.js` | `exportTechCards`, `exportSemiTechCards`, `mvdDownloadPDF` |
| `csv.js` | `exportCSV`, `exportDashboard`, `exportSales` |

### `src/ui/` — UI-логика

| Файл | Роль |
|---|---|
| `events.js` | **Все события** (делегированные), `MODAL_IDS` |
| `updaters.js` | `switchTab`, `renderAll`, `flashCells` |
| `auth.js` | Авторизация (login/register/forgot-password/OAuth) |
| `author.js` | Кабинет автора: профиль, аватар, условия, вкладки публикаций, статусы/ОС, отправка рецепта на модерацию |
| `public-recipes.js` | Простая public-витрина опубликованных рецептов: список, страница рецепта, заявка |
| `misc.js` | `exportFullPDF/XLSX`, `_printViaIframe`, `generateInsights` |
| `suppliers.js` | CRUD поставщиков |
| `payroll.js` | Калькулятор ФОТ |
| `cost-table.js` | Редактор таблицы себестоимости |
| `ingredients.js` | Управление ингредиентами |
| `locations.js` | Переключение локаций |
| `modals.js` | `openModal`, `closeModal`, `safeCloseModal` |
| `recipe-view.js` | Просмотр рецептур |
| `sort.js` | Сортировка таблиц |

---

## 7. Конфиги

| Файл | Назначение |
|---|---|
| `HTML_coffee_menu/vite.config.js` | Vite: порт 3000, outDir `dist` |
| `HTML_coffee_menu/package.json` | npm-скрипты: `dev`, `build`, `preview`, `check`, `smoke:api`, `smoke:workspace`, `deploy:*` |
| `HTML_coffee_menu/scripts/check.sh` | Единая preflight-проверка: backend compile, admin build, frontend build, docs/secret scan |
| `HTML_coffee_menu/scripts/smoke_api.py` | API smoke-тест: health, admin auth, access-флаги, автор, Битрикс sync, приватность public API |
| `HTML_coffee_menu/scripts/smoke_api.example.json` | Пример локального конфига без реальных admin credentials |
| `HTML_coffee_menu/scripts/smoke_workspace_security.py` | API smoke-тест workspace-ролей: owner/editor/guest, запрет owner-only событий журнала и optional outside workspace `403` |
| `HTML_coffee_menu/scripts/smoke_workspace_security.example.json` | Пример локального workspace security конфига без JWT |
| `HTML_coffee_menu/scripts/deploy_frontend.sh` | Деплой SPA `dist/` без удаления `admin-panel.js` |
| `HTML_coffee_menu/scripts/deploy_admin.sh` | Сборка и деплой `server/admin/admin-panel.js` |
| `HTML_coffee_menu/scripts/deploy_backend.sh` | Backup SQLite, деплой `server/main.py`, restart API, health-check |
| `HTML_coffee_menu/src/ui/locations.js` | Меню проекта: локации, workspace-переключатель, команда, invite-link, журнал, восстановление и owner-only удаление заведений |
| `HTML_coffee_menu/DEPLOY.md` | Короткая инструкция по деплою слоями |
| `HTML_coffee_menu/CHECKLIST_RELEASE.md` | Release checklist перед production-изменениями |
| `HTML_coffee_menu/NEXT_CHAT_HANDOFF.md` | Краткая передача контекста для нового чата |
| `server/scripts/import_mixology_author_access.py` | Сборка приватного Mixology author whitelist из yClients-отчёта |
| `server/coffee-menu-api.service` | systemd: uvicorn на порту 8000, WorkingDir, .env |
| `server/.env.example` | Шаблон переменных окружения |
| `.github/copilot-instructions.md` | Архитектурные правила (читает Copilot) |
| `.vscode/tasks.json` | Задачи VS Code (build, deploy и др.) |

---

## 8. Критичные файлы (требуют осторожности)

| Файл | Почему критичен |
|---|---|
| `src/main.js` | Точка входа. Контролирует порядок `window.activeTab → switchTab()`. Сломать легко — упадёт всё приложение |
| `src/ui/events.js` | Все события + `MODAL_IDS`. Пропустить новый модал → Escape не закроет его |
| `src/state/store.js` | `saveState` / `loadState` — ошибка здесь уничтожит данные пользователя |
| `index.html` | Все модалы в одном файле. Несбалансированные `</div>` → скролл заблокирован, попапы невидимы |
| `styles.css` | Единый файл — нет изоляции. Изменение `.modal` влияет на все 15+ модалов |
| `server/main.py` | Единый монолит API. Синтаксическая ошибка → весь бэкенд падает |
| `server/data/app.db` | **Реальная БД на сервере.** Локальная копия отсутствует — бэкапы вручную |
| `server/data/mixology_author_access.json` | Приватный runtime whitelist Mixology с телефонами/yClients ID. Не коммитить, не печатать |
| `server/admin/admin-panel.js` | Генерируется `build.sh`. Деплоится через `scp` напрямую в `dist/`. **Не затирать `rsync --delete`** |
| `server/admin/src/_*.js` | Исходники admin-panel.js. Редактировать только их — собирать через `build.sh` |

### ⚠️ Архитектурные ловушки

```
❌ НЕ восстанавливать public/app.js — удалён навсегда (коммит 05a6bf2)
❌ НЕ подключать внешние CDN на старте приложения; ExcelJS грузить лениво через `ensureExcelJS()` из локального `/vendor/exceljs/exceljs.min.js`
❌ НЕ использовать window.print() — только _printViaIframe()
❌ НЕ ставить switchTab() ДО window.activeTab = ...
❌ НЕ использовать oninput если обработчик делает полный ре-рендер — только onchange
❌ НЕ делать rsync --delete при деплое — удалит admin-panel.js
⚠️  После certbot renew (~2026-08-19) — проверить: curl https://barista-school.online/api/health
   (location /api/ теперь в snippet и не перезаписывается, но проверка не лишняя)
⚠️  Если сайт в РФ открывается только через VPN — сначала проверить HTTP/2:
   curl -Iv --http2 https://barista-school.online/
   Ожидаемо: ALPN server accepted h2 и HTTP/2 200.
   Backup nginx-конфигов не класть в /etc/nginx/sites-enabled/, там wildcard include.
```

---

## 9. Запуск проекта локально

### Фронтенд

```bash
cd /Users/romansuslin_1/Downloads/All_Code/Coffee_menu/HTML_coffee_menu

# Установить зависимости (первый раз)
npm install

# Запустить dev-сервер (HMR, порт 3000)
npm run dev
# → http://localhost:3000
```

### Бэкенд (опционально, только для тестирования API)

Бэкенд работает только на VPS. Локальный запуск — при необходимости:

```bash
cd /Users/romansuslin_1/Downloads/All_Code/Coffee_menu/server

# Создать виртуальное окружение
python3 -m venv venv
source venv/bin/activate

# Установить зависимости
pip install -r requirements.txt

# Создать .env из примера
cp .env.example .env
# заполнить переменные в .env

# Запустить
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
# → http://localhost:8000/api/health
```

---

## 10. Как проверять изменения

### Локальная проверка фронтенда

```bash
# Dev-сервер с HMR
cd HTML_coffee_menu
npm run dev

# Единая проверка перед деплоем
npm run check

# API smoke-тест production
npm run smoke:api

# API smoke-тест с включением автора тестовому пользователю
npm run smoke:api:apply
```

### Деплой на продакшн

```bash
cd HTML_coffee_menu

# Проверить всё перед деплоем
npm run check

# Деплоить только нужный слой
npm run deploy:frontend
npm run deploy:admin
npm run deploy:backend
```

Подробности и env overrides: `DEPLOY.md`.

### Проверка сервера

```bash
# Статус API
curl -s https://barista-school.online/api/health

# Проверка HTTP/2 после nginx/frontend deploy
curl -Iv --http2 https://barista-school.online/
curl -fsS --http2 https://barista-school.online/api/health

# Логи бэкенда
ssh -i ~/.ssh/id_ed25519 root@159.194.233.13 \
  'journalctl -u coffee-menu-api -n 50 --no-pager'

# Пользователи в БД
ssh -i ~/.ssh/id_ed25519 root@159.194.233.13 \
  'sqlite3 /var/www/coffee-menu/server/data/app.db "SELECT id,email,is_active,is_admin FROM users;"'
```

### Адреса для ручной проверки

| Адрес | Что проверять |
|---|---|
| `http://localhost:3000` | Локальный фронтенд (dev) |
| `https://barista-school.online` | Продакшн SPA |
| `https://barista-school.online/api/health` | Статус API |
| `https://baristaschool.online` | Tilda + Админ-панель |

---

## 11. Админ-панель (`server/admin/admin-panel.js`)

**Деплой:** `scp ... root@159.194.233.13:/var/www/coffee-menu/dist/admin-panel.js`
**Встраивается:** на Tilda (`baristaschool.online`) через `<div id="adm-root"></div><script src="https://barista-school.online/admin-panel.js?v=N">`

### Сборка

```bash
# Отредактировать нужный src/_*.js, затем:
bash server/admin/build.sh
# → собирает admin-panel.js (2700 строк) из 12 файлов src/
```

Задача VS Code **deploy-admin-drawer** автоматически запускает `build.sh` перед `scp`.

### Архитектура

- Весь код завёрнут в **IIFE** `(function(){...})()` — функции не в глобальном скоупе автоматически
- Глобальные функции (для `onclick="..."` в HTML) **обязательно** экспортируются через `window.xxx = xxx`
- CSS-переменные темизации: `--adm-navy`, `--adm-red`, `--adm-red-bg`, `--adm-border`, `--adm-light`, `--adm-soft`, `--adm-text`, `--adm-muted`, `--adm-card`, `--adm-input`
- Шрифт: **Mulish** (Google Fonts, подключён в head)
- `server/admin/admin-panel.js` — generated bundle; руками править только `server/admin/src/*`, затем запускать `server/admin/build.sh` или `npm run deploy:admin`
- `server/admin/src/_styles.js` задаёт layout админки: `#adm-root` занимает всю ширину viewport для Tilda-фона, `#adm-panel` центрирован и ограничен `max-width: 1100px` по design system.

### Модерация авторских рецептов

| Файл / endpoint | Назначение |
|---|---|
| `server/admin/src/_authors.js` | Вкладка `Авторы`, список публикаций, drawer проверки рецепта |
| `GET /api/admin/author-recipes` | Компактный список публикаций для админки |
| `GET /api/admin/author-recipes/{pub_id}` | Полная карточка рецепта: фото, состав, оборудование, процесс, подача/срок, органолептика, история, версии |
| `PATCH /api/admin/author-recipes/{pub_id}` | Цена/описание витрины, статус, `review_flags`, `review_comment` |

Public-витрина:

- `GET /api/public/author-recipes` отдаёт опубликованные рецепты для простой витрины;
- `GET /api/public/author-recipes/{slug}` отдаёт страницу опубликованного рецепта;
- `POST /api/public/author-recipes/{recipe_id}/order` создаёт заявку на один рецепт;
- предыдущий план динамического Tilda-каталога с фильтрами и корзиной отменён, Tilda-блок удалён.

Статусы:

- `pending` / `На проверке` — автор отправил версию, админ проверяет.
- `published` / `Опубликован` — рецепт доступен public-витрине; review flags/comment очищаются.
- `rejected` / `На доработке` — автор видит комментарий и чеклист блоков, которые нужно поправить.
- `archived` / `Снят` — публикация снята с витрины.

Повторная отправка того же серверного черновика обновляет активную публикацию через `source_draft_id`, увеличивает `version` и пишет snapshot в `recipe_publication_versions`, а не создаёт дубль карточки.

### Менеджер подкатегорий оборудования

| Функция | Описание |
|---|---|
| `openSubcatManager(mainCat)` | Открывает модал менеджера для указанной главной категории |
| `_renderSubcatMgr(mainCat)` | Перерисовывает список подкатегорий в модале |
| `_subcatMgrRow(name, i, mainCat)` | Генерирует HTML одной строки списка |
| `_bindSubcatMgrEvents()` | Делегированные события на список (edit/save/del) |
| `addSubcatFromMgr()` | Добавляет новую подкатегорию из поля ввода |
| `resetSubcats(mainCat)` | Сброс к дефолтным подкатегориям |
| `closeSubcatMgr()` | Закрывает модал |

**Хранилище:** `localStorage['adm_subcats']` → `{equipment: {list: [...], initialized: bool}, ...}`
**Счётчик позиций:** `_oc_items.filter(it => (it.category||'equipment') === mainCat && it.subcategory === name).length`
**Защита удаления:** кнопка ✕ рендерится с `disabled` если `count > 0`; в обработчике `del` стоит дополнительная проверка `if (btn.disabled) return`

### CSS-классы админ-панели

| Префикс | Назначение |
|---|---|
| `.adm-scm-*` | Модал менеджера подкатегорий |
| `.adm-eq-*` | Редактор позиций оборудования |
| `.adm-drawer-*` | Боковая панель настроек пользователя |
| `.adm-author-*` | Вкладка авторов и drawer модерации рецепта |
| `var(--adm-*)` | CSS-переменные темизации |

---

## 12. История изменений (сессии 41–44)

| Сессия | Дата | Изменение |
|---|---|---|
| 41 | май 2026 | Динамический `<select>` подкатегорий: мерж `OC_SUBCATS` + уникальных из `_oc_items` |
| 42 | 23 мая 2026 | Добавлен менеджер подкатегорий (CRUD через localStorage); фикс IIFE-скоупа (`window.xxx`); CSS-стилизация через `.adm-scm-*` и `var(--adm-*)` |
| 43 | 23 мая 2026 | `_subcatMgrRow`: счётчик позиций (badge «N поз.») + `disabled` на кнопке удаления если `count > 0`; двойная защита в обработчике `del` |
| 44 | 23 мая 2026 | **Поставщики (admin-panel.js):** UX-улучшения — превью логотипа, rich name cell (phone/site/promo/tags), фильтры Все/Партнёры/Публичные/Скрытые, поиск по тегам. **Bugfix:** `closeSupDrawer()` не сбрасывал `saveBtn.disabled = false` → второй поставщик нельзя было сохранить без перезагрузки. **Аудит:** все `close*Drawer()` проверены — `closeEqDrawer()` уже корректен, `closeDrawer()` (пользователи) не имеет проблемы т.к. footer пересоздаётся через `innerHTML` при каждом `openDrawer()`. Правило задокументировано как §15 в `copilot-instructions.md` |
| 45 | 24 мая 2026 | **Фикс полного отказа авторизации (сессия 45):** 1) `.env.production` — `VITE_API_URL` сброшен в пустую строку (был `https://barista-school.online/api` → двойной prefix `/api/api/` в запросах → 404 на все эндпоинты); 2) `server/main.py` — `create_access_token` → `create_token(user.id)` в Yandex OAuth callback (NameError → OAuth всегда падал); 3) nginx HTTPS блок — добавлен `location /api/` proxy (certbot не добавляет его автоматически при выпуске сертификата); 4) пароль admin сброшен через `forgot-password` (перезаписан при диагностике). |
| 46 | 24 мая 2026 | **nginx include-файл для certbot:** `location /api/` вынесен из основного конфига в `/etc/nginx/snippets/coffee-api.conf`; в `/etc/nginx/sites-available/coffee-menu` заменён на `include /etc/nginx/snippets/coffee-api.conf;` — теперь `certbot renew` может перезаписывать секцию `server {}`, не затрагивая прокси-блок. `nginx -t` + `systemctl reload nginx` — OK, `curl /api/health` → `{"ok":true}`. |
| 49 | 24 мая 2026 | **Рефакторинг admin-panel.js (Вариант А):** файл (2701 строк) разрезан на 12 независимых модулей в `server/admin/src/_*.js`. Создан `server/admin/build.sh` — конкатенирует части в `admin-panel.js` через `cat`. Задача `deploy-admin-drawer` обновлена: добавлен шаг `bash build.sh &&` перед `scp`. Проверка: `node --check admin-panel.js` → SYNTAX_OK, `diff` с оригиналом → DIFF_CLEAN. Логика кода не изменялась. |
| 48 | 24 мая 2026 | **Security audit:** credentials в `tasks.json` заменены на плейсхолдеры `REDACTED`. Git-история проверена — секретов в коммитах нет. Документация `AUTH_SYSTEM.md` и `copilot-instructions.md` актуализированы (правила §13–§16). |
| 47 | 24 мая 2026 | **Фикс admin-panel.js (drawer-кнопки):** `adm-drawer` и `adm-confirm` живут в `_overlay` (`document.body`), вне `#adm-root` — `root.addEventListener` их не ловил. Решение: извлечена именованная `_handleClick`, подписана на оба контейнера (`root` + `_overlay`). Удалён `onclick="event.stopPropagation()"` с `.adm-row-actions` — блокировал кнопки в таблице. Инициализация `adm-confirm`/`keydown` listeners вынесена из тела обработчика (раньше добавлялась при каждом клике). **Новая функция:** поле «Комментарий» (📝) в карточке пользователя — `textarea` с авто-сохранением (debounce 1.2с + blur), метка времени изменения (`notes_updated_at`), стили `.adm-drawer-notes-*`. В `server/main.py`: колонка `notes VARCHAR` + `notes_updated_at DATETIME` в таблице `users`, автомиграция, GET и PATCH `/api/admin/users/` обновлены. |
| 50 | 17 июня 2026 | **Author platform:** author layer вынесен в `src/access/author-layer.js`; авторские черновики/ингредиенты/полуфабрикаты сохраняются на backend; добавлен Mixology auto-author по whitelist `visited`; профиль автора получил ФИО, аватар, условия, вкладки публикаций и ОС; карточка рецепта получила обязательные поля для публикации и оборудование; admin-модерация получила full drawer, review flags/comment, versions/events; admin layout выровнен под `mbs-design-system` (`#adm-root` full-width, `#adm-panel` 1100px centered). |
| 51 | 17 июня 2026 | **Mixology championship profile:** добавлена таблица `author_championship_participations`; `GET /api/author/profile` отдаёт очищенные `championship_participations`; авторский профиль показывает блок `Участие в чемпионатах` и CTA на рецепт Mixology Cup; production backend/frontend выкатаны, whitelist обновлён из свежего yClients-отчёта. |
| 52 | 18 июня 2026 | **Author Telegram notifications:** добавлена привязка авторов к Telegram-боту, отдельные env `JOIN_MBS_*`, webhook `/api/telegram/join-mbs/webhook`, API `/api/author/telegram/*` и best-effort уведомления команде/автору по событиям проверки рецептов. 19 июня 2026 production переключён с `@Join_MBS_bot` на `@MBS_work_bot`, потому что `@Join_MBS_bot` используется BotHelp и не должен занимать webhook платформы. |
| 53 | 18 июня 2026 | **Production HTTP/2 / доступность из РФ:** после жалоб “сайт открывается только через VPN” включён HTTP/2 на nginx для `barista-school.online` и `www.barista-school.online` (`/etc/nginx/sites-enabled/coffee-menu`, `listen 443 ssl http2;`). Проверка: `curl -Iv --http2 https://barista-school.online/` → `ALPN: server accepted h2`, `HTTP/2 200`; `/api/health` → `HTTP/2 200`. Backup nginx-конфига перенесён из `sites-enabled` в `/root/nginx-backups/`, потому что wildcard include создавал warning `conflicting server name`. Соседний VPS `159.194.202.120` / `159-194-202-120.sslip.io` тоже отвечал только HTTP/1.1, но текущий SSH-ключ туда не пускал; при доступе включить HTTP/2 аналогично. |
| 54 | 19 июня 2026 | **Telegram disconnect confirm:** исправлено отключение Telegram в кабинете автора. `showConfirm()` раньше работал только через callback, а `disconnectAuthorTelegram()` ожидал `await showConfirm(...)`; теперь helper возвращает `Promise<boolean>` и сохраняет callback-совместимость. Frontend задеплоен, `npm run check` и `git diff --check` пройдены. |
| 55 | 22-23 июня 2026 | **Бюджет, admin-библиотека, пресеты, Excel:** категории стартовых вложений получили сортировки/поиск/прогресс; admin-библиотека показывает все категории клиентского бюджета и пустые разделы; `Пресеты` получили `Скрыть уже добавленные`, `В пресете`, группировку по категориям; общий `Excel (xlsx)` исправлен для ExcelJS/Safari. |

---

## Граф зависимостей модулей (упрощённый)

```
data/           ← state/          ← utils/         ← render/        ← ui/
mat.js              store.js          calc.js           dashboard.js      events.js
drinks.js           ui-state.js       format.js         cost.js           updaters.js
constants.js                          image.js          sales.js          auth.js
                                                         recipes.js        misc.js
                                                         finmodel.js       modals.js
                                                                           ...
                                        ↑
                                   src/main.js  ←──── index.html (CDN: ExcelJS, Lucide)
                                   (window.*)
```

> **Правило:** модули нижнего уровня **не импортируют** модули верхнего. Циклических импортов нет.


### Сессия 58 (24 июня 2026) — командная работа и журнал действий

- Добавлен слой `workspaces`: общий проект кофейни поверх существующих локаций.
- Старый `user_state` не удалён: при первом входе пользователя backend создаёт личный workspace и переносит старый state.
- `GET /api/state` / `PUT /api/state` работают с активным `workspace_id`; frontend хранит активный workspace в `cm_workspace_id`.
- В меню проекта добавлены `Команда проекта`, `Журнал действий`, переключение workspace и создание нового проекта.
- Владелец создаёт invite-link по email; участник получает роль `editor` и редактирует общий проект. Backend запрещает editor управлять командой.
- Повторный invite на тот же email/workspace не создаёт новую pending-запись: backend возвращает существующий token/link с `already_pending=true`; invite для email уже состоящего в проекте возвращает `409`.
- Добавлен guest-invite слой: регистрация по invite-link активирует гостя, принимает приглашение и не выдаёт право создавать свои проекты; это право остаётся за admin и клиентами с `access_drinks` / `access_finance`.
- `workspace_activity` фиксирует ключевые события без шума autosave: проект, приглашения, локации, бюджет открытия, финмодель/ФОТ, план продаж, рецепты, поставщики, экспорты, полный сброс проекта владельцем и заблокированные критические попытки не-владельца. `project_opened` throttled до одного события на пользователя/проект за 30 минут; UI журнала показывает фильтры, роль участника и визуальную важность события.
- Добавлены точки восстановления workspace: backend хранит последние 40 снимков, autosnapshot создаётся перед перезаписью state не чаще одного раза в 15 минут, ручной snapshot и restore доступны владельцу в меню `Восстановление`.
- Destructive-действия общего проекта owner-only: `editor` / `guest-editor` не видит или получает блокировку на удаление заведений, рецептов, поставщиков, сырья и полуфабрикатов. Обычное редактирование общего проекта остаётся доступным.
- Структура заведений owner-only: `editor` / `guest-editor` не может добавлять точку, создавать точку из шаблона или переименовывать текущую. Обычное редактирование содержимого существующей точки остаётся доступным.
- Массовые destructive-действия owner-only: верхний `Сброс`, `Очистить всё` в бюджете открытия и похожий прямой API-save блокируются для `editor` / `guest-editor`.
- Backend state-guard в `PUT /api/state`: для не-владельца сравнивается старый и новый workspace JSON; появление/исчезновение локаций, изменение metadata `locIndex`, исчезновение `customDrinks`, `customMats`, `semiItems`, `suppliers` или `supplierBook`, очистка важных списков и массовое изменение reset-sensitive полей считается structural/destructive overwrite и возвращает `403`. Заблокированная попытка пишется в `workspace_activity` как `state_update_blocked`.

### Сессия 59 (25 июня 2026) — invite-flow без дублей и UI команды

- Исправлена причина дублей в `workspace_invites`: `POST /api/workspaces/{id}/invites` теперь сначала нормализует email, отзывает старые pending-дубли, проверяет membership и только потом создаёт invite.
- Если pending invite на email уже существует, новый invite не создаётся; API возвращает существующую ссылку и `already_pending=true`, frontend показывает `Приглашение уже ожидает принятия`.
- Если email уже состоит в проекте, API возвращает `409` с понятным текстом `Этот пользователь уже состоит в проекте`.
- `GET /api/workspaces/{id}/members` скрывает pending-invite для email, который уже стал участником, и чистит старые дубли.
- Team UI приведён к общему стилю: системные prompts/confirms заменены на фирменные модалки, `.btn-green` получил базовую геометрию кнопки и min-width в строках приглашения/действий.
- Production-проверка после деплоя: `/api/health` отвечает `ok`, frontend bundle содержит `alreadyPending`, backend на сервере содержит `_dedupe_pending_workspace_invites`. GitHub-коммит frontend-документов/стилей: `5e77109 fix: prevent duplicate workspace invites`.

### Сессия 60 (25 июня 2026) — кабинет настроек, аккаунт и аватары в журнале

- Верхний dropdown разгружен: он остаётся быстрым переключателем проекта и заведения, а администрирование проекта вынесено в `/app/settings`.
- `/app/settings` содержит разделы `Аккаунт`, `Проект`, `Команда`, `Заведения`, `Журнал`, `Восстановление`, `Интеграции`; owner управляет проектом, editor/guest видит ограничения read-only для owner-only действий.
- Раздел `Аккаунт` показывает имя, телефон, email read-only, роль/доступы, аватар и кнопку сброса пароля через письмо на текущий email; клиентский UI не должен показывать внутренние sync-статусы интеграций.
- `workspace_members` и `workspace_activity` отдают `avatar_url`, чтобы команда и журнал показывали реальный аватар пользователя.
- В строке журнала справа порядок автора события: `имя → роль → аватар`; время форматируется в московском часовом поясе `Europe/Moscow`, timestamps без timezone считаются UTC.
- Проверено и задеплоено: `npm run check`, frontend deploy, `/api/health`. Последние коммиты: `389ec80 feat: add account settings panel`, `71624de feat: show avatars in activity log`, `882affc fix: align activity avatar to the right`.

### Сессия 61 (25 июня 2026) — active workspace sync и security audit

- `/app/settings` синхронизирован с активным `workspace`: `Команда`, `Журнал`, `Восстановление`, `Заведения` и project blocks читают данные текущего проекта, а асинхронные ответы старого workspace игнорируются.
- LocalStorage заведений переведен на scope `user + workspace_id`; при переключении проекта очищаются старые `Loc.list`, `Loc.activeId` и runtime state перед восстановлением server state.
- Исправлены XSS-risk spots в меню заведений и settings rows: `loc.id/name/icon` экранируются перед вставкой в `innerHTML` и inline handlers.
- Убраны дубли стартовых API-запросов `/suppliers` и `/drinks/overrides` в `src/main.js`.
- Security smoke: tracked `.env`/runtime DB/whitelist не найдены; anonymous `/api/suppliers` = 403; public recipes API проверен на отсутствие приватных keys.
- Проверено и задеплоено: `npm run check`, `npm run deploy:frontend`, `/api/health`. Коммиты: `29c3ab5`, `5abe6b5`.

### Сессия 62 (25 июня 2026) — architecture baseline

- Добавлен `ARCHITECTURE.md` как короткий рабочий документ для роста проекта: домены, источники правды, матрица ролей, правила безопасности данных, API-карта workspace и smoke-сценарии.
- Правило для новых функций: перед кодом определить домен, source of truth, роли, dangerous actions и release checks; после реализации обновлять релевантные базы знаний.

### Сессия 63 (25 июня 2026) — frontend permissions helper

- Добавлен `src/access/permissions.js`: единый frontend-слой для `owner` / `editor` / `guest-editor`, account role labels, workspace management, structure, destructive и restore permissions.
- `src/ui/auth.js` теперь экспортирует централизованные wrappers: `canManageWorkspace*`, `canDeleteWorkspaceData`, `canRestoreWorkspace`, `requireWorkspace*Permission`. Старые `isWorkspaceOwner` / `requireWorkspaceOwner` сохранены для совместимости.
- `src/render/settings.js` и `src/ui/locations.js` используют permission wrappers вместо локальных сравнений роли для команды, заведений, опасной зоны и восстановления.


### Сессия 64 (25 июня 2026) — backend activity guard

- Backend `/api/workspaces/{id}/activity` получил owner-only guard для событий управления проектом, командой, заведениями и восстановлением. Editor/guest сохраняет право логировать разрешённые содержательные изменения, но не может подделать критические записи журнала вроде `workspace_deleted`, `member_removed`, `location_deleted`, `snapshot_restored`.

### Сессия 65 (25 июня 2026) — backend source of truth in Git

- Backend source перенесён в `HTML_coffee_menu/server`, чтобы `server/main.py`, `server/admin/src/*`, `requirements.txt`, `.env.example` и backend scripts попадали в GitHub вместе с frontend.
- `scripts/check.sh`, `scripts/deploy_backend.sh` и `scripts/deploy_admin.sh` переключены на tracked `HTML_coffee_menu/server`. Соседний `Coffee_menu/server` теперь legacy/runtime-копия; новые правки делать в Git source.
- В `.gitignore` добавлена защита от backend runtime-файлов: `server/.env`, `server/data/`, `__pycache__`, `*.pyc`, generated `server/admin/admin-panel.js`.

### Сессия 66 (25 июня 2026) — production deploy workspace security

- Production deploy выполнен после переноса backend source в Git: `npm run deploy:backend` загрузил tracked `HTML_coffee_menu/server/main.py`, сделал SQLite backup и перезапустил `coffee-menu-api`; первый health внутри deploy поймал ранний `curl: (7)`, повторная проверка через SSH подтвердила `active` и `/api/health = ok`.
- На production проверено наличие `WORKSPACE_OWNER_ACTIVITY_ACTIONS`, `_require_workspace_owner_activity` и `state_update_blocked` в `/var/www/coffee-menu/server/main.py`.
- `npm run deploy:frontend` выкатил bundle `assets/index-Dg3DFYDQ.js` / `assets/index-C0kcJg3F.css`; публичные проверки: `/api/health = {ok:true, version:1.0.0}`, главная `HTTP/2 200`, ALPN `h2`.
- Smoke direct API без JWT: `POST /api/workspaces/1/activity` с `workspace_deleted` возвращает `403 Not authenticated`. Role-specific smoke editor/guest -> `403` требует авторизованный JWT тестового пользователя; локального `scripts/smoke_api.local.json` сейчас нет.

### Сессия 67 (25 июня 2026) — workspace security smoke

- Добавлен `scripts/smoke_workspace_security.py` и пример `scripts/smoke_workspace_security.example.json`. Скрипт читает локальный ignored config `scripts/smoke_workspace_security.local.json` или env-переменные `COFFEE_WS_SMOKE_*`.
- Новый npm script `smoke:workspace` проверяет health, JWT owner/editor/guest, доступ участников к workspace, запрет owner-only событий журнала для editor/guest (`workspace_deleted`, `member_removed`, `location_deleted`, `snapshot_restored`) и optional `outside_workspace_id -> 403`.
- JWT owner/editor/guest не хранить в docs и не коммитить; `.gitignore` теперь игнорирует `scripts/smoke_workspace_security.local.json`.

### Сессия 68 (25 июня 2026) — рабочая зона проекта

- Добавлена новая вкладка `Рабочая зона` в верхнюю навигацию перед `Бюджет`; URL: `/app/workspace`.
- V1 рабочей зоны хранит `notes` и `links` в `workspace.state` как `S.workspaceArea`, без новых backend-таблиц. Это значит, что данные изолированы по активному workspace, синхронизируются через существующий `GET/PUT /api/state` и попадают в snapshots/restore проекта.
- Новый модуль `src/render/workspace.js`: обзор, закреплённые ссылки, список заметок, список ссылок, простой rich-text редактор заметки через `contenteditable`.
- Поддержаны совместные действия owner/editor/guest: участники могут добавлять и редактировать материалы рабочей зоны; события логируются как `workspace_note_changed` и `workspace_link_changed`.
- Журнал настроек получил фильтр `Рабочая зона`, чтобы изменения заметок и ссылок не смешивались с системными событиями.
