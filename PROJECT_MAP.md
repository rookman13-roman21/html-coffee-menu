# PROJECT_MAP.md — Coffee Menu SPA

> Последнее обновление: май 2026  
> Стек: **Vite 5.4 + Vanilla JS (ES-модули) + FastAPI + SQLite**  
> Продакшн: `https://barista-school.online`

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
    ├── admin-panel.js       ← SPA-панель администратора (Vanilla JS)
    ├── index.html           ← Заглушка-страница CP (не используется напрямую)
    └── tilda-admin.html     ← Вставка на Тильду
```

---

## 3. Главные страницы и где они лежат

| Страница | Файл | Описание |
|---|---|---|
| **SPA-приложение** | `HTML_coffee_menu/index.html` | Единственная HTML-страница; содержит все вкладки и модалы |
| **Лендинг** | `HTML_coffee_menu/landing.html` | Маркетинговая страница (статическая) |
| **Админ-панель** | `server/admin/admin-panel.js` | Встраивается на Tilda (`baristaschool.online`) через `<script>` |

### Вкладки SPA (переключаются через `switchTab()`)

| Вкладка | `activeTab` | Рендер-модуль |
|---|---|---|
| Рецептуры | `'drinks'` | `src/render/recipes.js` |
| Себестоимость | `'materials'` | `src/render/cost.js` |
| Поставщики | `'cost'` | `src/render/cost.js` |
| План продаж | `'sales'` | `src/render/sales.js` |
| Дашборд | `'dashboard'` | `src/render/dashboard.js` |
| Финмодель | `'finmodel'` | `src/render/finmodel.js` |

---

## 4. Логика API (бэкенд)

**Файл:** `server/main.py` (1 165 строк, единый монолит FastAPI)

### Ключевые группы endpoints

| Группа | Prefix | Описание |
|---|---|---|
| Аутентификация | `/api/auth/` | register, login, me, forgot-password, reset-password |
| Яндекс OAuth | `/api/auth/yandex/` | login, callback |
| Telegram webhook | `/api/telegram/webhook` | Обработка callback_query (активация пользователей) |
| Пользователи (admin) | `/api/admin/users` | CRUD пользователей |
| Оборудование (OC) | `/api/oc-library` | CRUD библиотеки оборудования/мебели |
| Парсинг ссылок | `/api/parse-url` | Извлечение цены/фото товара по URL |
| Данные пользователя | `/api/data` | GET/POST сохранение стейта SPA |
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
```

### База данных

- **Тип:** SQLite
- **Путь на сервере:** `/var/www/coffee-menu/server/data/app.db`
- **Таблицы:** `users`, `oc_library`, `password_resets`, `user_data`

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
| `HTML_coffee_menu/package.json` | npm-скрипты: `dev`, `build`, `preview` |
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
| `server/admin/admin-panel.js` | Деплоится через `scp` напрямую в `dist/`. **Не затирать `rsync --delete`** |

### ⚠️ Архитектурные ловушки

```
❌ НЕ восстанавливать public/app.js — удалён навсегда (коммит 05a6bf2)
❌ НЕ делать import ExcelJS — только CDN (window.ExcelJS)
❌ НЕ использовать window.print() — только _printViaIframe()
❌ НЕ ставить switchTab() ДО window.activeTab = ...
❌ НЕ использовать oninput если обработчик делает полный ре-рендер — только onchange
❌ НЕ делать rsync --delete при деплое — удалит admin-panel.js
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
# Dev-сервер с HMR (моментальное обновление при сохранении)
cd HTML_coffee_menu && npm run dev

# Проверить что продакшн-билд собирается без ошибок
npm run build
```

### Деплой на продакшн

```bash
# 1. Собрать фронтенд
cd HTML_coffee_menu && npm run build

# 2. Задеплоить фронтенд (НЕ --delete чтобы не удалить admin-panel.js)
rsync -avz --exclude='admin-panel.js' dist/ \
  root@159.194.233.13:/var/www/coffee-menu/dist/ \
  -e 'ssh -i ~/.ssh/id_ed25519'

# 3. Задеплоить бэкенд
scp -i ~/.ssh/id_ed25519 server/main.py \
  root@159.194.233.13:/var/www/coffee-menu/server/main.py

# 4. Перезапустить API
ssh -i ~/.ssh/id_ed25519 root@159.194.233.13 \
  'systemctl restart coffee-menu-api && systemctl is-active coffee-menu-api'

# 5. Задеплоить admin-panel.js отдельно
scp -i ~/.ssh/id_ed25519 server/admin/admin-panel.js \
  root@159.194.233.13:/var/www/coffee-menu/dist/admin-panel.js
```

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
