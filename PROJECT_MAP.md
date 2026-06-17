# PROJECT_MAP.md — Coffee Menu SPA

> Последнее обновление: 17 июня 2026
> Стек: **Vite 5.4 + Vanilla JS (ES-модули) + FastAPI + SQLite**
> Продакшн: `https://barista-school.online`

---

## 0. Текущее состояние проекта

`Coffee_menu` сейчас является ядром платформы `barista-school.online`:

- **Кабинет клиента кофейни**: напитки, поставщики, бюджет, план продаж, финмодель.
- **Кабинет автора рецептов**: профиль автора, отправка рецептов на модерацию, подготовка к публикации на витрину.
- **Публичная витрина авторских рецептов**: безопасный public API/страница без личных данных автора.
- **Admin backend**: управление пользователями, пакетами доступа, авторами, публикациями, поставщиками, пресетами и библиотекой оборудования.

Для передачи контекста в новый чат использовать `HTML_coffee_menu/NEXT_CHAT_HANDOFF.md`.

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

Backend-хранилище author-слоя:

| Таблица | Назначение |
|---|---|
| `author_recipe_drafts` | Черновики рецептов автора до отправки на модерацию |
| `author_ingredients` | Кастомные ингредиенты конкретного автора |
| `author_semis` | Кастомные полуфабрикаты конкретного автора |
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
- доступ автора выдаётся только при совпадении телефона и фактическом статусе `visited` / «пришёл»;
- `no_show`, `canceled`, `pending`, `confirmed` не дают author-доступ;
- при совпадении `POST /api/auth/register` сразу создаёт активного пользователя с `access_author=true`, `access_drinks=false`, `access_finance=false`, создаёт/обновляет author profile, запускает Битрикс-синхронизацию и возвращает `auto_author:true`.

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
├── HTML_coffee_menu/        ← Фронтенд (SPA)
├── server/                  ← Бэкенд (FastAPI) + Admin-панель
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
    ├── utils/               ← Утилиты (calc, format, image)
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
| План продаж | `'sales'` | `src/render/sales.js` |
| Дашборд | `'dashboard'` | `src/render/dashboard.js` |
| Финмодель | `'finmodel'` | `src/render/finmodel.js` |
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
| Telegram webhook | `/api/telegram/webhook` | Обработка callback_query (активация пользователей) |
| Пользователи (admin) | `/api/admin/users` | CRUD пользователей, пакеты доступа |
| Авторы | `/api/author/*` | Профиль автора, черновики, ингредиенты, полуфабрикаты, фото и отправка рецептов на публикацию |
| Авторы (admin) | `/api/admin/authors`, `/api/admin/author-recipes` | Модерация авторов и публикаций |
| Public рецепты | `/api/public/author-recipes` | Витрина опубликованных рецептов |
| Оборудование (OC) | `/api/oc-library` | CRUD библиотеки оборудования/мебели |
| Парсинг ссылок | `/api/parse-url` | Извлечение цены/фото товара по URL |
| Данные пользователя | `/api/state` | GET/PUT сохранение стейта SPA |
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
| `public-recipes.js` | Public-витрина опубликованных рецептов и форма заявки |
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
| `HTML_coffee_menu/package.json` | npm-скрипты: `dev`, `build`, `preview`, `check`, `smoke:api`, `deploy:*` |
| `HTML_coffee_menu/scripts/check.sh` | Единая preflight-проверка: backend compile, admin build, frontend build, docs/secret scan |
| `HTML_coffee_menu/scripts/smoke_api.py` | API smoke-тест: health, admin auth, access-флаги, автор, Битрикс sync, приватность public API |
| `HTML_coffee_menu/scripts/smoke_api.example.json` | Пример локального конфига без реальных admin credentials |
| `HTML_coffee_menu/scripts/deploy_frontend.sh` | Деплой SPA `dist/` без удаления `admin-panel.js` |
| `HTML_coffee_menu/scripts/deploy_admin.sh` | Сборка и деплой `server/admin/admin-panel.js` |
| `HTML_coffee_menu/scripts/deploy_backend.sh` | Backup SQLite, деплой `server/main.py`, restart API, health-check |
| `HTML_coffee_menu/DEPLOY.md` | Короткая инструкция по деплою слоями |
| `HTML_coffee_menu/CHECKLIST_RELEASE.md` | Release checklist перед production-изменениями |
| `HTML_coffee_menu/NEXT_CHAT_HANDOFF.md` | Краткая передача контекста для нового чата |
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
| `server/admin/admin-panel.js` | Генерируется `build.sh`. Деплоится через `scp` напрямую в `dist/`. **Не затирать `rsync --delete`** |
| `server/admin/src/_*.js` | Исходники admin-panel.js. Редактировать только их — собирать через `build.sh` |

### ⚠️ Архитектурные ловушки

```
❌ НЕ восстанавливать public/app.js — удалён навсегда (коммит 05a6bf2)
❌ НЕ делать import ExcelJS — только CDN (window.ExcelJS)
❌ НЕ использовать window.print() — только _printViaIframe()
❌ НЕ ставить switchTab() ДО window.activeTab = ...
❌ НЕ использовать oninput если обработчик делает полный ре-рендер — только onchange
❌ НЕ делать rsync --delete при деплое — удалит admin-panel.js
⚠️  После certbot renew (~2026-08-19) — проверить: curl https://barista-school.online/api/health
   (location /api/ теперь в snippet и не перезаписывается, но проверка не лишняя)
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
