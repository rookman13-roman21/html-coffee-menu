# 🚀 План развёртывания Coffee Menu как облачного SaaS

**Домен:** `barista-school.online`  
**Сервер:** `root@159.194.233.13` (Beget VPS, Ubuntu 24.04)  
**SSH:** `ssh -i ~/.ssh/id_ed25519 root@159.194.233.13`  
**Статус:** 🟢 Полностью рабочий — регистрация, логин, синхронизация данных, admin-панель на Tilda, отправка email, вход через Яндекс ID, Escape закрывает все попапы

---

## ✅ Решённые проблемы (хронология исправлений)

### Баг 1 — `bcrypt 5.0.0` несовместим с `passlib 1.7.4`
**Причина:** `bcrypt 5.0.0` удалил `__about__.__version__`, на который опирается `passlib` → `AttributeError` → 500  
**Решение:** Заменили `passlib` на прямые вызовы `bcrypt`:
```python
import bcrypt as _bcrypt
def hash_password(p: str) -> str:
    return _bcrypt.hashpw(p.encode('utf-8'), _bcrypt.gensalt()).decode('utf-8')
def verify_password(plain: str, hashed: str) -> bool:
    return _bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
```
`requirements.txt`: убран `passlib[bcrypt]==1.7.4`, добавлен `bcrypt==5.0.0`

### Баг 2 — `auth.js` читал `d.access_token`, сервер возвращал `d.token`
**Решение:** В `src/ui/auth.js` исправлено `saveAuth(d.access_token, ...)` → `saveAuth(d.token, ...)`

### Баг 3 — `admin-panel.js` тоже читал `d.access_token`
**Причина:** API всегда возвращает `{"ok":true, "token":"..."}`, а панель проверяла `if (!d.access_token)` → всегда `undefined` → "Неверные данные" при любом правильном пароле  
**Решение:** В `server/admin/admin-panel.js` исправлено `d.access_token` → `d.token`  
**Правило:** Все JS-клиенты должны читать `d.token`, а не `d.access_token`

### Баг 4 — Email с автокапитализацией на мобильном
**Причина:** iOS/Android автоматически делает первую букву email заглавной (`Rookman13@...`), а в БД хранится строчная (`rookman13@...`)  
**Решение:** В `admin-panel.js` добавлено `toLowerCase()` при чтении email + `autocapitalize="none" autocorrect="off"` на `<input type="email">`

### Баг 5 — Сброс пароля через `passlib` падал с `ValueError`
**Причина:** `bcrypt 5.0.0` выбрасывает `ValueError: password cannot be longer than 72 bytes` при импорте `main.py` (триггерится startup-код)  
**Решение:** Сброс пароля напрямую через `sqlite3` + `bcrypt` без импорта `main.py`:  
```python
import sqlite3, bcrypt
db_path = "/var/www/coffee-menu/server/data/app.db"  # ← реальный путь к БД
hashed = bcrypt.hashpw("NewPass".encode(), bcrypt.gensalt())
conn = sqlite3.connect(db_path)
conn.execute("UPDATE users SET password_hash=? WHERE email=?", (hashed.decode(), email))
conn.commit()
```
**Внимание:** Колонка называется `password_hash` (не `hashed_password`!)

### Результат
- Регистрация `rookman13@gmail.com` — ✅  
- Активация через SQLite (`is_active=1, is_admin=1`) — ✅  
- Логин — ✅  
- `restoreFromServer` в `store.js` — уже была реализована, импорт в `main.js` работает — ✅
- Admin-панель на Tilda (`baristaschool.online`) — ✅

### Баг 6 — SMTP: `STARTTLS` port 587 не работал с Яндексом
**Причина:** Яндекс-почта принимает только SSL-соединения на 465, `STARTTLS` отклонялся  
**Решение:** Перешли на `smtplib.SMTP_SSL(host, 465)` вместо `smtplib.SMTP` + `starttls()`

### Баг 7 — `load_dotenv()` не находил `.env`
**Причина:** `WorkingDirectory` systemd-сервиса отличался от директории скрипта  
**Решение:** `load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))` — явный путь относительно `__file__`

### Баг 8 — inline SVG вместо `<img src>` для иконки Яндекса в кнопке
**Причина:** `<img src="https://yastatic.net/...">` блокировался CSP → иконка не грузилась (показывалось "❓")  
**Решение:** Заменено на inline SVG в `src/ui/auth.js` — всегда отображается, нет внешних запросов

### Баг 9 — Yandex OAuth `invalid_scope`
**Причина:** Параметр `scope` передавался в URL редиректа (`urlencode({..., "scope": "login:email login:info login:phone"})`). Яндекс OAuth **не принимает** `scope` в URL — скоупы задаются только в настройках приложения на [oauth.yandex.ru](https://oauth.yandex.ru) → Яндекс возвращал `invalid_scope` и отклонял весь запрос авторизации  
**Решение:** Убран параметр `scope` из `urllib.parse.urlencode()` в функции `yandex_oauth_start()` в `server/main.py`. Скоупы (`login:email`, `login:info`, `login:phone`) настраиваются в консоли oauth.yandex.ru  
**Деплой:** `main.py` скопирован на сервер, `coffee-menu-api` перезапущен → `active` ✅

### Баг 10 — Новые пользователи Яндекс ID должны проходить ручную активацию
**Решение:** При создании нового пользователя через Яндекс OAuth `is_active=False`. Telegram-уведомление отправляется admin'у (`@baristaschool_admin_bot`, chat_id=`33668380`). Активация через admin-панель вручную.

### Баг 11 — Escape не закрывал попап `#modal-oc-item`
**Причина:** При добавлении нового модала `modal-oc-item` (попап карточки позиции стартовых вложений) его id не был добавлен в массив `MODAL_IDS` в `src/ui/events.js`. Глобальный Escape-обработчик перебирает только этот массив.
**Решение:** Добавлен `'modal-oc-item'` в `MODAL_IDS`.
**Правило:** при добавлении любого нового `<div class="modal-bg" id="modal-XYZ">` — обязательно добавлять `'modal-XYZ'` в `MODAL_IDS`.

---

---

## ✅ Что уже сделано (хронология)

| Дата | Действие |
|---|---|
| 21 мая 2026 | Сервер Beget VPS настроен (Ubuntu 24.04, nginx, Python 3.12, venv) |
| 21 мая 2026 | `server/main.py` — FastAPI с JWT, SQLite, admin-панель |
| 21 мая 2026 | systemd-сервис `coffee-menu-api` запущен, порт 8000 |
| 21 мая 2026 | Nginx настроен: `/` → dist/, `/api/` → 8000 |
| 21 мая 2026 | DNS + SSL настроены: `https://barista-school.online` работает ✅ |
| 21 мая 2026 | Фронтенд собран и задеплоен в `/var/www/coffee-menu/dist/` |
| 21 мая 2026 | `src/ui/auth.js` создан — полный экран логина/регистрации с JWT |
| 21 мая 2026 | `src/main.js` интегрирован с auth: показывает форму если нет токена |
| 21 мая 2026 | Исправлены баги: `[object Object]`, `Field required`, `EmailStr` → `str` |
| 21 мая 2026 | **Блокер:** `bcrypt 5.0.0` несовместим с `passlib 1.7.4` → заменено на прямой `bcrypt` |
| 21 мая 2026 | Исправлен `auth.js`: `d.access_token` → `d.token` |
| 21 мая 2026 | Пользователь `rookman13@gmail.com` зарегистрирован, активирован, залогинен ✅ |
| 21 мая 2026 | `server/admin/admin-panel.js` — SaaS admin-панель (19KB), деплой в `/var/www/coffee-menu/dist/` |
| 21 мая 2026 | CORS настроен: `baristaschool.online` (Tilda, без дефиса) добавлен в `allow_origins` |
| 21 мая 2026 | Admin-панель вставлена в Tilda через `<div id="adm-root"></div><script src="https://barista-school.online/admin-panel.js?v=...">` |
| 21 мая 2026 | Исправлен `admin-panel.js`: `d.access_token` → `d.token` (API всегда возвращает `token`) |
| 21 мая 2026 | Исправлен `admin-panel.js`: email `toLowerCase()` + `autocapitalize=none` (мобильная автокапитализация) |
| 21 мая 2026 | Пароль `rookman13@gmail.com` сброшен через прямой sqlite3+bcrypt скрипт → `Admin2024` |
| 21 мая 2026 | Admin-панель полностью работает: логин ✅, список пользователей ✅, активация/деактивация ✅ |
| 21 мая 2026 | **Forgot Password**: `POST /api/auth/forgot-password` + email через Яндекс SMTP SSL 465, inline forgot-form в admin-panel |
| 21 мая 2026 | **Yandex OAuth**: `GET /api/auth/yandex` + `/callback`, кнопка «Войти через Яндекс ID» с inline SVG в `auth.js` ✅ |
| 21 мая 2026 | **Yandex OAuth creds обновлены**: новые ClientID/Secret в `.env`, новое приложение «Moscow Barista School» |
| 21 мая 2026 | **Баг `invalid_scope`**: убран параметр `scope` из URL редиректа → Яндекс принимает запрос ✅ |
| 21 мая 2026 | **Telegram-уведомления**: `@baristaschool_admin_bot` — уведомление при регистрации нового пользователя |
| 21 мая 2026 | **Новые пользователи Яндекс OAuth** → `is_active=False` + TG-уведомление admin'у → ручная активация |
| 22 мая 2026 | **fix:** `modal-oc-item` добавлен в `MODAL_IDS` (`src/ui/events.js`) — Escape теперь закрывает попап карточки стартовых вложений |

---

## Что строим

Превращаем локальный SPA (данные в `localStorage`) в многопользовательский облачный сервис:

- Каждый клиент регистрируется сам → ждёт активации от владельца
- Данные каждого клиента хранятся на сервере, изолированно
- Работает с любого устройства по логину/паролю
- Владелец (ты) видит список пользователей, может блокировать/активировать
- Ты продолжаешь деплоить обновления фронтенда через `git push`

---

## Архитектура

```
Клиент (браузер)
    ↓ HTTPS (barista-school.online)
Nginx
    ├── /           → dist/ (Vite-сборка, статика)
    ├── /api/       → FastAPI (Python, порт 8000)
    └── /admin/     → Простая admin-панель (Flask или тот же FastAPI)

FastAPI
    ├── POST /api/auth/register    — регистрация
    ├── POST /api/auth/login       — логин → JWT
    ├── GET  /api/state            — загрузить данные пользователя
    └── PUT  /api/state            — сохранить данные пользователя

SQLite (старт) / PostgreSQL (масштаб)
    ├── users (id, email, name, password_hash, is_active, created_at)
    └── user_state (user_id, state_json, updated_at)
```

---

## Поэтапный план

### Этап 1 — Бэкенд (Python FastAPI) ✅ ГОТОВО

**Файлы созданы:**
```
Coffee_menu/
└── server/
    ├── main.py              ✅ FastAPI: auth + state + admin эндпоинты
    ├── requirements.txt     ✅
    └── coffee-menu-api.service  ✅ systemd-сервис
```

**Что реализовано в `server/main.py`:**
- ✅ `POST /api/auth/register` — регистрация (is_active=False, admin — сразу active)
- ✅ `POST /api/auth/login` — логин → JWT 30 дней; возвращает `{"ok":true, "token":..., "user":{...}}`
- ✅ `GET /api/auth/me` — текущий пользователь
- ✅ `GET /api/state` / `PUT /api/state` — данные пользователя
- ✅ `GET /api/admin/users`, `POST /api/admin/activate/{id}`, `POST /api/admin/deactivate/{id}`
- ✅ `GET /api/health`

**Ключевые детали кода:**
```python
# RegisterRequest — name опциональное:
class RegisterRequest(BaseModel):
    email: str
    name: str = ""  # ← обязательно, иначе 422
    password: str

# Автозаполнение имени:
name=body.name or body.email.split("@")[0],

# Логин возвращает "token" (не "access_token"!):
return {"ok": True, "token": token, "user": {...}}
# auth.js ДОЛЖЕН читать d.token, а не d.access_token
```

**На сервере (`/var/www/coffee-menu/server/`):**
- ✅ venv: `/var/www/coffee-menu/venv/`
- ✅ Пакеты: fastapi, uvicorn, sqlalchemy, passlib[bcrypt], python-jose[cryptography], pydantic, python-dotenv, python-multipart
- ✅ `.env`: `JWT_SECRET=...`, `ADMIN_EMAIL=roman@barista-school.online`
- ✅ SQLite: `/var/www/coffee-menu/data/app.db` (или `server/data/app.db` — уточнить путь!)
- ✅ systemd-сервис `coffee-menu-api` — **активен**, порт 8000
- ✅ `/api/health` → `{"ok":true}`

**⚠️ НЕ ВЫЯСНЕНО:** Точный путь к БД на сервере — `DATABASE_URL` из `.env` может указывать на `./data/app.db` относительно `WorkingDirectory` сервиса.

---

### Этап 2 — DNS + SSL ✅ ГОТОВО

- ✅ A-запись `barista-school.online → 159.194.233.13`
- ✅ SSL-сертификат Let's Encrypt (certbot), истекает 2026-08-19
- ✅ `https://barista-school.online` открывается

---

### Этап 3 — Фронтенд: экран логина + подключение к API 🟡 В ПРОЦЕССЕ

**Что сделано:**
- ✅ `src/ui/auth.js` — полный модуль: форма входа/регистрации, JWT, fetchState, pushState
- ✅ `src/main.js` — интегрирован с auth: проверяет токен при старте, показывает форму если нет
- ✅ Фронтенд собран и задеплоен в `/var/www/coffee-menu/dist/`
- ✅ Сайт открывается, показывает форму входа

**Что работает:**
- ✅ Регистрация `POST /api/auth/register` — успешно
- ✅ Логин `POST /api/auth/login` — возвращает `{ok, token, user}`, `auth.js` читает `d.token`
- ✅ `restoreFromServer(serverState)` в `store.js` — реализована, вызывается из `_initApp`
- ✅ `scheduleServerSync()` — дебаунс 2с, автосохранение данных на сервер

**Следующий шаг:**
- Протестировать сохранение/восстановление с другого устройства
- Протестировать на мобильном (iOS Safari)

---

### Этап 4 — Деплой фронтенда на сервер ✅ ГОТОВО

```bash
# Сборка:
cd /Users/romansuslin_1/Downloads/All_Code/Coffee_menu/HTML_coffee_menu
npm run build
# Деплоить только новые файлы (⚠️ НЕ rsync --delete — удалит admin-panel.js!)
NEW_JS=$(ls dist/assets/index-*.js | head -1 | xargs basename)
scp -i ~/.ssh/id_ed25519 dist/assets/$NEW_JS root@159.194.233.13:/var/www/coffee-menu/dist/assets/$NEW_JS
scp -i ~/.ssh/id_ed25519 dist/index.html root@159.194.233.13:/var/www/coffee-menu/dist/index.html
# Удалить старые JS-бандлы вручную:
# ssh root@159.194.233.13 'ls /var/www/coffee-menu/dist/assets/*.js'
```

---

### Этап 5 — Деплой обновлений (после запуска) `постоянно`

**Сценарий A — только фронтенд изменился:**
```bash
cd HTML_coffee_menu && npm run build
# Деплоить только новые файлы (⚠️ НЕ rsync --delete — удалит admin-panel.js!)
NEW_JS=$(ls dist/assets/index-*.js | head -1 | xargs basename)
scp -i ~/.ssh/id_ed25519 dist/assets/$NEW_JS root@159.194.233.13:/var/www/coffee-menu/dist/assets/$NEW_JS
scp -i ~/.ssh/id_ed25519 dist/index.html root@159.194.233.13:/var/www/coffee-menu/dist/index.html
# Удалить старые JS-бандлы:
ssh -i ~/.ssh/id_ed25519 root@159.194.233.13 "cd /var/www/coffee-menu/dist/assets && ls *.js"
```

**Сценарий B — изменился бэкенд (`server/main.py`):**
```bash
scp -i ~/.ssh/id_ed25519 server/main.py root@159.194.233.13:/var/www/coffee-menu/server/main.py
ssh -i ~/.ssh/id_ed25519 root@159.194.233.13 'systemctl restart coffee-menu-api'
```

**Сценарий C — обновить admin-panel.js:**
```bash
scp -i ~/.ssh/id_ed25519 \
  server/admin/admin-panel.js \
  root@159.194.233.13:/var/www/coffee-menu/dist/admin-panel.js
# Обновить ?v=N в Tilda чтобы сбросить кэш браузера
```

**Сценарий D — миграция БД (новые поля):**
- Для SQLite: ручной `ALTER TABLE` или миграционный скрипт

---

## Admin-панель (Tilda-интеграция)

### Архитектура
- **Файл:** `server/admin/admin-panel.js` (локально) → деплой в `/var/www/coffee-menu/dist/admin-panel.js`
- **URL:** `https://barista-school.online/admin-panel.js`
- **Tilda-вставка** (HTML-блок на странице `baristaschool.online`):
```html
<div id="adm-root"></div>
<script src="https://barista-school.online/admin-panel.js?v=3"></script>
```

### Два домена!
| Домен | Назначение |
|---|---|
| `barista-school.online` | Дашборд (основное приложение, **с дефисом**) |
| `baristaschool.online` | Tilda (лендинг + admin-панель, **без дефиса**) |

⚠️ CORS настроен на оба домена в `server/main.py`:
```python
allow_origins=[
    "https://baristaschool.online",
    "http://baristaschool.online",
    "https://barista-school.online",
    "http://barista-school.online",
    "http://localhost:5173",
]
```

### Данные входа
- **Email:** `rookman13@gmail.com`
- **Пароль:** `Admin2024`

### Деплой admin-panel.js
```bash
scp -i ~/.ssh/id_ed25519 \
  /Users/romansuslin_1/Downloads/All_Code/Coffee_menu/server/admin/admin-panel.js \
  root@159.194.233.13:/var/www/coffee-menu/dist/admin-panel.js
```

### Критические детали
1. **`d.token`** — API возвращает `token`, НЕ `access_token`. Все JS-клиенты должны читать `d.token`
2. **Email `toLowerCase()`** — обязательно применять перед отправкой (мобильная автокапитализация)
3. **БД путь:** `/var/www/coffee-menu/server/data/app.db`
4. **Колонка пароля:** `password_hash` (не `hashed_password`)

### Сброс пароля (если нужно)
```python
# /tmp/reset_pw.py — скопировать на сервер и запустить через venv
import sqlite3, bcrypt
db_path = "/var/www/coffee-menu/server/data/app.db"
email = "rookman13@gmail.com"
new_password = "NewPassword"
hashed = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt())
conn = sqlite3.connect(db_path)
conn.execute("UPDATE users SET password_hash=? WHERE email=?", (hashed.decode(), email))
conn.commit(); conn.close()
print("OK")
```
```bash
scp -i ~/.ssh/id_ed25519 /tmp/reset_pw.py root@159.194.233.13:/tmp/
ssh -i ~/.ssh/id_ed25519 root@159.194.233.13 '/var/www/coffee-menu/venv/bin/python3 /tmp/reset_pw.py'
```

---

## Email / SMTP (Forgot Password)

**Провайдер:** Яндекс SMTP, SSL 465  
**Отправитель:** `Moscow Barista School <hello@baristaschool.ru>`  
**Креденциалы в `.env`:**
```
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_USER=hello@baristaschool.ru
SMTP_PASS=tikcyzpywpomxqvt
```

**Forgot Password flow:**
- `POST /api/auth/forgot-password` — `{ email, source: 'admin' | 'user' }`
- Генерирует 8-символьный `temp_pass`, хэширует, сохраняет в БД, отправляет email
- Всегда возвращает `{ ok, temp_password, email_sent }` — temp_password показывать в UI даже если письмо не дошло
- `login_url` в письме: `source='admin'` → `baristaschool.online`, `source='user'` → `barista-school.online`
- Письмо: зелёный хедер, Telegram-кнопка, **без** кнопки «Войти»
- Admin-panel: inline forgot-form в карточке логина (source='admin')

**Ключевые детали:**
- `smtplib.SMTP_SSL(host, 465)` — НЕ `smtplib.SMTP + starttls()` (Яндекс отклоняет STARTTLS)
- `load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))` — явный путь

---

## Yandex OAuth

**Приложение:** «Moscow Barista School» на [oauth.yandex.ru](https://oauth.yandex.ru)  
**ClientID:** `6377f7d0f4c046958fcda1f5a599dc19`  
**Secret:** `20127c8213fb421ebd14a69fe013485c`  
**Scopes (в настройках приложения, НЕ в URL!):** `login:email login:info login:phone`  
**Redirect URI:** `https://barista-school.online/api/auth/yandex/callback`  

⚠️ **Важно:** `scope` НЕ передаётся в URL редиректа — Яндекс возвращает `invalid_scope`. Права задаются только в консоли oauth.yandex.ru.

**Backend endpoints (`server/main.py`):**
- `GET /api/auth/yandex` — редирект на `oauth.yandex.ru/authorize` (без параметра `scope`)
- `GET /api/auth/yandex/callback` — обмен `code` → токен через `urllib` (не httpx!), профиль через `login.yandex.ru/info`, редирект на `APP_URL/?oauth_token=...&oauth_user=...`
- Новый пользователь создаётся с `password_hash=''` и `is_active=False` → TG-уведомление admin'у
- Существующий пользователь — вход без проверки активации (уже активирован ранее)

**Frontend (`src/ui/auth.js`):**
- Кнопка «Войти через Яндекс ID» под разделителем «или»
- Иконка — inline SVG (не `<img src>` с внешнего домена)
- После редиректа: `?oauth_token=` + `?oauth_user=` → `saveAuth()` → `fetchState()` → вход
- `?auth_error=` → показывает сообщение об ошибке

**`.env` на сервере (полный состав):**
```
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_USER=hello@baristaschool.ru
SMTP_PASS=tikcyzpywpomxqvt
YANDEX_CLIENT_ID=6377f7d0f4c046958fcda1f5a599dc19
YANDEX_SECRET=20127c8213fb421ebd14a69fe013485c
YANDEX_REDIRECT=https://barista-school.online/api/auth/yandex/callback
TELEGRAM_BOT_TOKEN=7976269448:AAGL_JKrnXRi8AaMM3KnJl2TVbFyO1G_Ckw
TELEGRAM_ADMIN_CHAT_ID=33668380
```

---

## Telegram-уведомления

**Бот:** `@baristaschool_admin_bot`  
**Token:** `7976269448:AAGL_JKrnXRi8AaMM3KnJl2TVbFyO1G_Ckw`  
**Admin Chat ID:** `33668380` (`@DonRomon`)  
**Переменные:** хранятся только в `/var/www/coffee-menu/server/.env` на сервере, **не в репозитории**

**Когда отправляется уведомление:**
- Новый пользователь зарегистрировался через email — ждёт активации
- Новый пользователь вошёл через Яндекс OAuth (`is_active=False`) — ждёт активации

**Формат сообщения:**
```
🆕 Новый пользователь ждёт активации:
👤 Имя: ...
📧 Email: ...
Войди в admin-панель: https://baristaschool.online/admin
```

---

## Управление пользователями (ты как admin)

### 1. Получить JWT-токен admin'а
```bash
curl -s -X POST http://159.194.233.13/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"roman@barista-school.online","password":"<пароль>"}' \
  | python3 -m json.tool
# → {"access_token":"eyJ...", "token_type":"bearer"}
```

### 2. Список всех пользователей
```bash
curl -s http://159.194.233.13/api/admin/users \
  -H "Authorization: Bearer <TOKEN>" | python3 -m json.tool
```

### 3. Активировать пользователя
```bash
curl -s -X POST http://159.194.233.13/api/admin/activate/<USER_ID> \
  -H "Authorization: Bearer <TOKEN>"
```

### 4. Деактивировать пользователя
```bash
curl -s -X POST http://159.194.233.13/api/admin/deactivate/<USER_ID> \
  -H "Authorization: Bearer <TOKEN>"
```

### Управление сервисом
```bash
ssh -i ~/.ssh/id_ed25519 root@159.194.233.13
systemctl status coffee-menu-api    # статус
systemctl restart coffee-menu-api   # перезапуск
journalctl -u coffee-menu-api -n 50 --no-pager  # логи
```

---

## Технический стек

| Слой | Технология |
|---|---|
| Фронтенд | Vanilla JS + Vite 5.4 + ES-модули |
| Авторизация | JWT 30д (python-jose) |
| Бэкенд | Python 3.12 + FastAPI 0.111 |
| БД | SQLite (→ PostgreSQL при масштабе) |
| Веб-сервер | Nginx 1.24 + Uvicorn 0.30 |
| SSL | Let's Encrypt (certbot) — ждёт DNS |
| Деплой | `deploy.sh` (build + scp + restart) |

---

## Зависимости бэкенда

```
fastapi==0.111.0
uvicorn[standard]==0.30.1
sqlalchemy==2.0.30
python-jose[cryptography]==3.3.0
bcrypt==5.0.0          # passlib заменён прямым bcrypt (несовместимость v5)
python-dotenv==1.0.1
python-multipart==0.0.9
pydantic[email]==2.7.1
```

---

## Вопросы и решения

| Вопрос | Решение |
|---|---|
| Конфликт данных с двух устройств | Last-write-wins (достаточно для старта) |
| Токен протух | 401 → автоматически показываем форму логина |
| Резервные копии БД | Cron: `sqlite3 app.db .dump > backup_$(date +%Y%m%d).sql` |
| Масштаб (много пользователей) | Миграция SQLite → PostgreSQL без изменений кода API |

---

## Чеклист перед презентацией

- [x] Сервер настроен (Ubuntu 24.04, Nginx 1.24, Python 3.12)
- [x] FastAPI бэкенд с JWT-авторизацией запущен (`coffee-menu-api` active)
- [x] API отвечает: `https://barista-school.online/api/health` → `{"ok":true}`
- [x] SQLite БД создана с таблицами `users` и `user_state`
- [x] SSH-ключ настроен (без пароля)
- [x] DNS настроен (`barista-school.online → 159.194.233.13`)
- [x] SSL работает (certbot, истекает 2026-08-19)
- [x] Экран логина/регистрации во фронтенде (`src/ui/auth.js`) — создан и задеплоен
- [x] Фронтенд собран и задеплоен в `/var/www/coffee-menu/dist/`
- [x] **Регистрация работает** — исправлен `bcrypt` + `passlib`
- [x] Логин работает — исправлен `d.access_token` → `d.token`
- [x] `store.js`: `scheduleServerSync()` — автосохранение; `restoreFromServer()` — восстановление
- [x] **Admin-панель** — `admin-panel.js` задеплоен, вставлен в Tilda, логин работает ✅
- [x] CORS настроен для `baristaschool.online` (Tilda, без дефиса) ✅
- [x] **Forgot Password** — SMTP через Яндекс SSL 465, email доходит ✅
- [x] **Yandex OAuth** — кнопка «Войти через Яндекс ID» работает, `invalid_scope` исправлен ✅
- [x] **Telegram-уведомления** — бот `@baristaschool_admin_bot`, уведомление при новой регистрации ✅
- [x] Новые пользователи Яндекс OAuth → `is_active=False`, ручная активация через admin-панель ✅
- [x] Escape закрывает все попапы (включая `modal-oc-item`) — исправлено в сессии 38 ✅
- [ ] Данные сохраняются и восстанавливаются при перезагрузке ← **протестировать**
- [ ] Данные НЕ видны другим пользователям ← **проверить изоляцию**
- [ ] На мобильном устройстве (iOS Safari) работает корректно ← **протестировать**

---

## Команды для управления сервером

```bash
# Подключиться к серверу
ssh -i ~/.ssh/id_ed25519 root@159.194.233.13

# Логи API (ПЕРВОЕ ЧТО ЗАПУСТИТЬ при следующем сеансе!)
journalctl -u coffee-menu-api -n 30 --no-pager

# Статус сервисов
systemctl status coffee-menu-api
systemctl status nginx

# Перезапустить API после обновления кода
systemctl restart coffee-menu-api

# Задеплоить исправленный main.py
scp -i ~/.ssh/id_ed25519 \
  /Users/romansuslin_1/Downloads/All_Code/Coffee_menu/server/main.py \
  root@159.194.233.13:/var/www/coffee-menu/server/main.py
ssh -i ~/.ssh/id_ed25519 root@159.194.233.13 'systemctl restart coffee-menu-api'

# Задеплоить фронтенд
 cd /Users/romansuslin_1/Downloads/All_Code/Coffee_menu/HTML_coffee_menu
 npm run build
 # Деплоить только новые файлы (хэш меняется, см. сценарий A выше)
 # ❗ rsync --delete удалит admin-panel.js!

# Активировать себя вручную (если регистрация прошла)
sqlite3 /var/www/coffee-menu/data/app.db \
  "UPDATE users SET is_active=1, is_admin=1 WHERE email='rookman13@gmail.com';"
```

---

*Документ обновлён: 22 мая 2026 (сессия 39)*  
*Текущий статус: 🟢 Полностью рабочий SaaS — регистрация + логин + автосинхронизация + admin-панель на Tilda + Forgot Password (email) + Yandex OAuth + Telegram-уведомления + fix Escape для всех попапов + загрузка фото товара с устройства в OC item modal. Следующий шаг: тест изоляции данных между пользователями и мобильный тест.*
