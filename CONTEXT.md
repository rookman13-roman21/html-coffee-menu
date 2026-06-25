# CONTEXT — MBS* Coffee Menu

> Платформа `barista-school.online`: кабинет кофейни, кабинет автора рецептов и витрина авторских рецептов. SPA на Vite + ES-модули.
> Последнее обновление: 25 июня 2026 — закрыты основные риски утечки данных; синхронизированы категории admin-библиотеки `oc_library` с клиентским бюджетом; добавлены дополнительные продажи в `План продаж`; `Финмодель`, PDF и Excel считают общий план продаж с едой/десертами/импульсом; блок постоянных расходов в финмодели стал понятнее; добавлен v1 слой командной работы: общий workspace проекта кофейни, приглашения участников, append-only журнал ключевых действий, точки восстановления, owner-only destructive-действия, защита invite-flow от дублей, страница `/app/settings`, личный аккаунт с аватаром и московское время в журнале. LocalStorage заведений изолирован по `user + workspace_id`, закрыт XSS-риск в меню заведений и убраны дубли стартовых API-запросов.

---

## 0.1. Актуальное состояние на 18 июня 2026

Для старта нового чата сначала читать `NEXT_CHAT_HANDOFF.md`.
Для быстрых архитектурных решений читать `ARCHITECTURE.md`: там домены, роли, API-карта и правила безопасности данных.

### Слои продукта

- **Напитки** (`access_drinks`): `Поставщики` + `Рецептуры`.
- **Финансы** (`access_finance`): `Бюджет` + `План продаж` + `Финмодель`.
- **Автор рецептов** (`access_author`): профиль автора, поставщики, подготовка рецептов и отправка на модерацию.

Навигация desktop/mobile строится по доступам. `switchTab(tab)` защищён: закрытую вкладку нельзя открыть через старый `localStorage` или прямой вызов.

Если `author` включён вместе с `drinks/finance`, frontend считает это режимом `Автор`, чтобы не показать обычный клиентский набор данных.

### Авторская платформа

- `src/access/author-layer.js` — единые frontend-правила author-слоя.
- `src/ui/author.js` — кабинет автора, профиль, условия, загрузка аватара, server sync авторских данных.
- `server/main.py` — таблицы `author_profiles`, `author_recipe_drafts`, `author_ingredients`, `author_semis`, `recipe_publications`, `recipe_publication_versions`, `recipe_publication_events`, `recipe_orders`.
- `server/admin/src/_authors.js` — admin-раздел `Авторы`: список авторов, публикации, статусы, retry синхронизации с Битрикс.
- `src/ui/public-recipes.js` — простая public-витрина опубликованных рецептов: список, страница рецепта, заявка на один рецепт.

В режиме `Автор`:

- вкладки: `Поставщики`, `Рецептуры`, `Мой профиль`;
- `Рецептуры` стартуют пустыми, без демо-рецептов;
- visible recipe groups: `Горячие`, `Чай`, `Холодные`, `Пуровер`, `Авторские`;
- скрытые поставщики: `Hiwater`, `Baristaline`, `МайТаймКап`;
- author profile: `Фамилия`, `Имя`, `Отчество`, телефон, описание автора, аватар;
- Telegram не показывается в frontend-форме и не отправляется при сохранении;
- Telegram-уведомления автора подключаются отдельно через `@MBS_work_bot`; frontend показывает только статус привязки, `telegram_chat_id` остаётся приватным backend-полем. `@Join_MBS_bot` принадлежит BotHelp, его webhook платформой не занимать.
- отключение Telegram в кабинете автора использует общий `showConfirm()` как `Promise<boolean>`; helper сохраняет обратную совместимость со старыми callback-вызовами.
- условия сотрудничества показываются в popup, без сохранения юридического акцепта.
- публикации в `Мой профиль` сгруппированы по статусам: требуют внимания, на проверке, опубликованы, сняты, все;
- заготовки `Данные для договора` и `Финансы` пока информационные, без backend-учёта выплат.

Server-backed author data:

- `author_recipe_drafts` — черновики авторских рецептов;
- `author_ingredients` — кастомные ингредиенты автора;
- `author_semis` — кастомные полуфабрикаты автора;
- `/api/author/recipe-image` — загрузка фото рецепта в runtime-папку `server/data/public_uploads/author-recipes`;
- старые локальные author custom recipes/ingredients/semis мигрируют на backend при первой загрузке author workspace;
- `saveState()` в author mode не сохраняет `customDrinks`, `customMats`, `semiItems` как общий источник правды;
- client id offset: рецепты `100000000 + draft_id`, полуфабрикаты `200000000 + semi_id`.

Карточка авторского рецепта:

- новый рецепт в author mode открывается с группой `Авторские`;
- неполный черновик можно сохранить;
- отправка `На витрину` блокируется, пока не заполнены обязательные поля: название, группа, рекомендуемая цена продажи, объём, ингредиенты, фото, процесс, оборудование, температура подачи, срок реализации, органолептика;
- ссылка на видеорецепт необязательна;
- блок оборудования стоит после процесса приготовления;
- своё оборудование добавляется через пункт выпадающего списка и popup; похожие названия блокируются на frontend.

Модерация:

- `recipe_publications.source_draft_id` связывает публикацию с серверным черновиком автора;
- повторная отправка того же черновика обновляет активную публикацию, увеличивает `version` и сохраняет snapshot в `recipe_publication_versions`;
- `recipe_publications.validation_json` хранит server-side проверку обязательных блоков;
- `recipe_publications.review_flags_json` и `review_comment` хранят ОС админа;
- `recipe_publication_events` хранит события submitted, review_saved, rejected, published, archived;
- `GET /api/admin/author-recipes/{pub_id}` отдаёт полную карточку проверки для admin drawer.

Mixology auto-author:

- whitelist хранится приватно в runtime-файле `server/data/mixology_author_access.json`, не в Git;
- импорт делает `server/scripts/import_mixology_author_access.py` из `YClients-Dashboard/data/mixology/reports/generated/*.clients.json`;
- свежий отчёт из yClients создаётся в соседнем проекте `YClients-Dashboard` скриптом `scripts/mbs_mixology_cup_report.js`;
- author-доступ при регистрации выдаётся только при совпадении телефона и статусе `visited` / «пришёл»;
- `no_show`, `canceled`, `pending`, `confirmed` не дают author-доступ;
- обычная регистрация без совпадения остаётся pending.
- очищенные данные участий Mixology Cup сохраняются в `author_championship_participations` и отдаются автору в `/api/author/profile` как `championship_participations` без телефонов и yClients ID.
- `GET /api/author/profile` lazy-синхронизирует участия из whitelist; повторная загрузка профиля не должна создавать дубликаты.
- `PUT /api/author/profile` не принимает участия от frontend.
- В `Мой профиль` блок `Участие в чемпионатах` показывается только самому автору и только при непустом `championship_participations`; покупателям и admin drawer v1 этот блок не отдаётся.
- Сценарий первого рецепта условный: для Mixology-участника текст и CTA ведут к рецепту Mixology Cup, для обычного автора остаётся нейтральный первый авторский рецепт.
- Если статус участника в yClients изменился после последнего импорта, UI не обновится сам: нужно заново собрать Mixology-отчёт и обновить production whitelist.

### Битрикс

При включении доступа `Автор рецептов` в admin backend запускает фоновую синхронизацию:

- ищет/создаёт контакт Битрикс;
- пишет `bitrix_contact_id` в `author_profiles`;
- добавляет значение `Автор рецептов` в multi-list поле `BITRIX_AUTHOR_MARK_FIELD`;
- добавляет timeline-комментарий в контакт только при первом добавлении автора;
- при сохранении профиля автора обновляет `NAME`, `LAST_NAME`, `SECOND_NAME` и фото контакта;
- не пишет служебные данные в `COMMENTS`, чтобы не утащить их в yClients через `sync_comment`.

Production-важно: 16 июня 2026 `BITRIX_WEBHOOK`, `BITRIX_AUTHOR_MARK_FIELD` и `BITRIX_AUTHOR_MARK_LABEL` добавлены в `/var/www/coffee-menu/server/.env`; API перезапущен. Перед изменением создан backup `.env`, а перед добавлением enum — snapshot поля Битрикс. Read-only проверка webhook показала: поле `UF_CRM_1766349995197` доступно, enum `Автор рецептов` присутствует.

Smoke-проверка `npm run smoke:api:apply` пройдена на тестовом пользователе `suslin21@ya.ru`, телефон `+7 903 156-65-66`, Битрикс contact id `10828`: доступ автора включается, `author_profiles` существует, `bitrix_sync_status=synced`, public API не отдаёт приватные поля.

Security hardening на 22 июня 2026:

- `.env.production` снят с Git-отслеживания; в Git оставлять только `.env.example`.
- `/api/public/author-recipes/*/order` и cart-order не возвращают `bitrix_deal_id` и внутренние order IDs.
- новые author upload URL используют непрямой owner-token вместо `user.id`; legacy-пути остаются валидными для старых файлов.
- Yandex OAuth callback возвращает в URL только одноразовый `oauth_code`; JWT выдаётся через `POST /api/auth/oauth-exchange`.
- forgot-password создаёт reset-token и отправляет ссылку; текущий пароль не меняется до `POST /api/auth/reset-password`.
- OpenAI key для AI-заполнения оборудования хранится только в памяти текущей вкладки, не в `localStorage`.
- `/api/suppliers` требует JWT активного пользователя. Телефоны поставщиков считаются публичными для клиентов платформы, но anonymous public API их не отдаёт. Проверено на production 22 июня 2026: anonymous получает `403 Not authenticated`, авторизованный клиент видит телефоны.

### Ускорение разработки

- `npm run check` — единая проверка перед правками/деплоем.
- `npm run smoke:api` — read-only production smoke.
- `npm run smoke:api:apply` — проверка тестового автора и Битрикс-синхронизации.
- `npm run deploy:frontend` — деплой SPA.
- `npm run deploy:admin` — сборка и деплой admin bundle.
- `npm run deploy:backend` — backup SQLite, деплой backend, restart API.

Admin panel:

- исходники админки лежат в `server/admin/src/*`;
- `server/admin/admin-panel.js` — generated bundle, руками его не редактировать;
- `server/admin/src/_styles.js`: `#adm-root` занимает всю ширину viewport для Tilda, `#adm-panel` центрирован и ограничен `max-width: 1100px` по `mbs-design-system`.

Локальный `scripts/smoke_api.local.json` ignored и не должен попадать в Git.

### Хранение состояния

- Новый источник правды для клиентского кабинета: `workspaces.state_json`.
- `user_state.state_json` оставлен как fallback-источник миграции для старых аккаунтов: при первом входе создаётся личный workspace и старый state переносится туда.
- Браузерные ключи localStorage должны быть scoped по `user + workspace_id`: `mbs_locations__<user>__ws_<workspace_id>`, `mbs_active_loc__<user>__ws_<workspace_id>`, `mbs_loc_<id>__<user>__ws_<workspace_id>`; backend state выбирается через активный `workspace_id`.
- Не возвращать глобальные ключи `mbs_locations`, `mbs_active_loc`, `mbs_loc_*` без workspace scope и не откатываться к user-only keys: это смешивает заведения разных проектов в одном браузере.
- В author mode локальное состояние остаётся кэшем UI, а не источником правды для авторских черновиков, ингредиентов и полуфабрикатов.

### Командная работа v1

- Таблицы: `workspaces`, `workspace_members`, `workspace_invites`, `workspace_activity`.
- Роли v1: `owner` управляет командой; `editor` редактирует общий проект и видит журнал.
- Право создавать свои проекты в v1 считается по существующим доступам `access_drinks` или `access_finance`; `access_author` сам по себе не даёт право создавать проект кофейни.
- Приглашённый без оплаченного доступа регистрируется по invite-link как guest-editor: он может редактировать приглашённый проект, но не может создавать свои проекты.
- Верхний dropdown — быстрый переключатель проекта/заведения; тяжёлое управление вынесено в `/app/settings`.
- `/app/settings` содержит разделы `Аккаунт`, `Проект`, `Команда`, `Заведения`, `Журнал`, `Восстановление`, `Интеграции`. Owner управляет проектом/командой/заведениями/restore, editor/guest видит read-only ограничения там, где действие запрещено.
- Раздел `Аккаунт` отделён от проекта: имя, телефон, email read-only, роль аккаунта, доступы, аватар и запуск сброса пароля через письмо. В UI нельзя показывать клиенту внутренние названия интеграций или служебные sync-статусы.
- Invite-link создаётся через `POST /api/workspaces/{id}/invites`; письмо отправляется best-effort через существующий SMTP, ссылка всегда возвращается для ручной отправки.
- Повторное приглашение того же email в тот же workspace не создаёт дубль: backend возвращает уже существующую pending-ссылку (`already_pending=true`), а UI объясняет, что приглашение уже ожидает принятия. Email существующего участника нельзя пригласить повторно (`409`). При загрузке команды старые дубли pending-invite автоматически переводятся в `revoked`.
- Журнал действий append-only и не должен превращаться в лог каждого autosave: фиксировать только осознанные действия пользователя. `project_opened` пишется не чаще одного раза на пользователя/проект за 30 минут; UI журнала поддерживает фильтры по разделам, роли участников и визуальную важность событий. Критические блокировки не-владельца пишутся как `state_update_blocked`.
- В журнале показывается аватар автора события; справа строка автора должна идти в порядке `имя → роль → аватар`, чтобы список не разваливался визуально. Время журнала форматировать через `Europe/Moscow`; backend timestamps без timezone считать UTC перед отображением.
- Safety baseline: `localStorage` только кэш UI, источник правды — `workspaces.state_json`; потеря membership должна очищать локальные заведения и показывать no-access.
- При переключении workspace старые `Loc.list`, `Loc.activeId` и runtime state очищаются до восстановления server state текущего проекта.
- Любые `loc.id/name/icon` из state экранируются перед `innerHTML` и inline handlers: не вставлять эти поля напрямую в HTML/JS-атрибуты.
- Autosave должен быть привязан к конкретному `workspace_id`, который был активен в момент сохранения; перед переключением проекта текущий workspace нужно принудительно синхронизировать.
- Guest/editor может редактировать общий state, но не управляет командой, не создаёт свои проекты без `access_drinks/access_finance` и не может писать произвольные типы событий в журнал. Owner-only события журнала (`workspace_deleted`, `member_removed`, `location_deleted`, `snapshot_restored` и похожие) блокируются backend даже при прямом API-запросе.
- Точки восстановления: backend-таблица `workspace_state_snapshots` хранит последние 40 снимков workspace. Autosnapshot создаётся перед перезаписью state не чаще одного раза в 15 минут, ручной снимок и восстановление доступны владельцу в меню `Восстановление`.
- Restore-flow owner-only: перед восстановлением backend сохраняет текущее состояние как `before_restore`, затем заменяет `workspaces.state_json` выбранным снимком и пишет событие `snapshot_restored` в журнал.
- Destructive-действия v1 owner-only в клиентском workspace: удаление заведений, рецептов, поставщиков, сырья и полуфабрикатов недоступно `editor` / `guest-editor` в штатном UI и дополнительно блокируется в функциях удаления. Это сохраняет совместное редактирование, но защищает основу проекта от безвозвратного удаления.
- Структура заведений owner-only: `editor` / `guest-editor` не может добавлять точку, создавать точку из шаблона или переименовывать текущую. Гость редактирует содержимое существующей точки, но не меняет каркас проекта.
- Массовые destructive-действия owner-only: верхний `Сброс`, `Очистить всё` в бюджете открытия и прямой API-save, похожий на массовую очистку/сброс `prices`, `salePrices`, `portions`, `fixedCosts`, `payroll`, `payrollPositions`, `addonSales`, `openingCosts`, `suppliers` или `priceLog`, недоступны `editor` / `guest-editor`.
- Backend state-guard: `PUT /api/state` для не-владельца сравнивает старый и новый JSON workspace и запрещает structural/destructive overwrite, если появляются/исчезают локации, меняется metadata `locIndex`, исчезают `customDrinks`, `customMats`, `semiItems`, `suppliers` или `supplierBook`, очищаются важные списки или одновременно меняется много reset-sensitive полей. Обычные изменения полей внутри существующей точки и редактирование рецептур остаются разрешёнными. Это минимальный semantic diff, не полный аудит всех полей.
- Frontend permission layer: `src/access/permissions.js` содержит единую матрицу owner/editor/guest для workspace UI; `src/ui/auth.js` экспортирует wrappers `canManageWorkspace*`, `canDeleteWorkspaceData`, `canRestoreWorkspace`, `requireWorkspace*Permission`. Новые UI-проверки прав не писать прямым сравнением роли.

---

## 0. SaaS-инфраструктура (добавлено сессия 34)

**Проект работает как облачный SaaS: `https://barista-school.online`**

### Инфраструктура
- **Сервер:** Beget VPS `root@159.194.233.13`, Ubuntu 24.04, nginx 1.24, Python 3.12
- **SSH:** `ssh -i ~/.ssh/id_ed25519 root@159.194.233.13`
- **Бэкенд:** FastAPI 0.111 + SQLite, systemd сервис `coffee-menu-api`, порт 8000
- **Код бэкенда:** `Coffee_menu/HTML_coffee_menu/server/main.py` (source of truth в Git)
- **БД:** SQLite `/var/www/coffee-menu/server/data/app.db`
- **SSL:** Let’s Encrypt, истекает 2026-08-19
- **nginx snippet:** `/etc/nginx/snippets/coffee-api.conf` — `location /api/` вынесен туда, в основном конфиге `include /etc/nginx/snippets/coffee-api.conf;` — certbot renew больше не перезапишет прокси-блок
- **HTTP/2:** включён 18 июня 2026 в active nginx config `/etc/nginx/sites-enabled/coffee-menu` (`listen 443 ssl http2;`) после проблемы, когда сайты на Beget/VPS не открывались из РФ без VPN. Симптом совпал со сценарием ТСПУ/HTTP/1.1 из Habr: много параллельных TLS-соединений при HTTP/1.1 зависают у части российских провайдеров. Проверка после правки: `curl -Iv --http2 https://barista-school.online/` должен показывать `ALPN: server accepted h2` и `HTTP/2 200`.

Важно для nginx: не хранить backup-файлы внутри `/etc/nginx/sites-enabled/`, потому что `/etc/nginx/nginx.conf` включает wildcard `sites-enabled/*`. Backup active config класть, например, в `/root/nginx-backups/`, иначе nginx подхватит старый server block и покажет warnings `conflicting server name`.

### Аутентификация: `src/ui/auth.js`
- **JWT токен** 30 дней, хранится в `localStorage['cm_token']`; пользователь — `localStorage['cm_user']`.
- **Логин возвращает:** `{ token, user }` — читать `d.token`.
- **`user.access`** возвращает объект `{ drinks, finance, author }`.
- **Экспорты:** `isLoggedIn`, `showAuthScreen`, `logout`, `fetchState`, `pushState`, `getToken`, `getUser`, `clearAuth`, `refreshCurrentUser`, `hasAccess`, `canAccessTab`.
- **`fetchState()`:** `GET /api/state` → возвращает `serverState` для `_initApp()`
- **`pushState()`:** `PUT /api/state` — вызывается из `scheduleServerSync()`

### Синхронизация данных: `src/state/store.js`
- **`scheduleServerSync()`** — дебаунс 2с после `saveState()`, вызывает `pushState()` из `auth.js`
- **`restoreFromServer(serverData)`** — принимает `{ locIndex, activeId, locations }`, записывает в localStorage, вызывается из `_initApp(serverState)`

### Поток запуска `main.js`
```js
// 1. Public route /recipes рендерит простую public-витрину без кабинета.
// 2. Для кабинета при сохранённом JWT сначала refreshCurrentUser().
// 3. Затем fetchState() и _initApp(serverState).
// 4. _initApp сбрасывает runtime, восстанавливает serverState, грузит workspace-scoped localStorage.
// 5. Потом применяет доступы и открывает первую разрешённую вкладку.
```

---

### Сессия 55 (22-23 июня 2026) — бюджет, admin-библиотека, пресеты, Excel

**Стартовые вложения / клиентский бюджет**
- Добавлены сортировки категорий по порядку, сумме и количеству позиций.
- Добавлены поиск по позициям, проценты/прогресс по категориям, `Развернуть всё` / `Свернуть всё`.

**Admin-библиотека `oc_library`**
- Категории синхронизированы с клиентским бюджетом: `Стартовый склад`, `Брендинг`, `Оборотный резерв` и остальные разделы теперь видны даже при `0` позиций.
- `+ Добавить` в выбранном разделе подставляет эту категорию в drawer.
- Добавлены empty state, подсказка `Где используется`, индикатор `Заполнено X из 12 разделов`, скрытие подфильтра `Все 0`.

**Admin `Пресеты`**
- Исправлена обрезка первой строки библиотеки в Safari: sticky-заголовки заменены на обычные.
- Добавлены `Скрыть уже добавленные`, бейдж `В пресете`, группировка текущего пресета по категориям бюджета.

**Excel export**
- Общий `Excel (xlsx)` из верхнего меню исправлен в `src/ui/misc.js`.
- Причины поломки: отсутствовал импорт `GROUP_LABEL`; затем ExcelJS падал на повторном `mergeCells` первой строки.
- Текущее правило: `GROUP_LABEL` импортировать из `src/data/drinks.js`; `mergeCells` делать по `titleRow.number`; экспорт оборачивать в `try/catch`; перед `a.click()` добавлять ссылку в DOM для Safari.
- Production-коммиты: `14adb6a`, `fc31bd5`, `3c59829`, `41d96f7`, `c1d1ef4`.

### Сессия 56 (23 июня 2026) — дополнительные продажи, финмодель, PDF/XLSX, mobile

**План продаж**
- Добавлен блок `Дополнительные продажи` для не-напитков: выпечка, десерты, еда, импульсные позиции.
- Поддерживаются две модели объёма: `% чеков` и `шт/день`.
- Количество чеков в день теперь не вводится отдельно: оно автоматически равно количеству напитков/чеков в плане продаж.
- Средний чек считается как сумма среднего чека напитков и вклада дополнительных продаж.
- В таблице доп. продаж оставлены все desktop-колонки на mobile; на узких экранах работает горизонтальный скролл.

**Расчёты**
- `src/utils/calc.js::salesMetrics()` возвращает раздельные и общие показатели: напитки, доп. продажи, общий оборот, общая себестоимость, общая прибыль, общий FC%, средний чек и долю доп. продаж.
- `S.addonSales` хранится в `src/state/store.js`, сохраняется в server state и сбрасывается вместе с локацией.
- Дополнительные продажи влияют на выручку, прибыль, food-cost, ТБУ, запас прочности и окупаемость.

**Финмодель**
- KPI `Выручка / мес` показывает разложение на напитки и доп. продажи.
- KPI `Чеков / день` заменил прежнюю формулировку `Напитков / день`.
- Добавлены/обновлены показатели: средний чек, доп. продажи в месяц, отклонение FC от целевого, покрытие ТБУ, запас прочности.
- P&L показывает выручку и себестоимость доп. продаж отдельными строками.
- What-if использует общий план продаж, а не только напитки.

**Отчёты**
- Полный PDF-отчёт использует общий план продаж и больше не содержит блок `Рейтинг напитков`.
- Excel `xlsx` использует общий план продаж и добавляет KPI по доп. продажам; рейтинг напитков оставлен только в Excel dashboard как рабочий аналитический блок.
- CSV плана продаж обновлён под дополнительные продажи.

**Mobile**
- KPI финмодели на телефоне компактнее: по 2 блока в строку, с fallback в 1 колонку на очень узких экранах.
- В таблице напитков исправлена обрезка строки `ИТОГО`.
- В таблице доп. продаж исправлена колонка `ОБЪЁМ`: единицы `шт`/`%` визуально согласованы, подсказки в заголовках работают как в таблице напитков.

### Сессия 57 (24 июня 2026) — UX постоянных расходов в финмодели

**Модалка расхода**
- `Фиксированная сумма ₽` переименована в `Сумма ₽/мес`.
- Галочка `Переменная — масштабируется...` переименована в `Масштабировать в сценариях`.
- Добавлена короткая подсказка: использовать, если расход растёт вместе с продажами.
- При выборе `% от выручки` поле переключается на `Процент от выручки, %/мес`; для этого обработчики `_fceTypeChange`, `_fcePctHint`, `_fceShareToggle`, `_fceShareUpdate` экспортируются из `src/main.js` в `window`.

**Блок постоянных расходов**
- Таблица постоянных расходов оформлена как отдельный рабочий контейнер с рамкой и более читаемыми строками.
- Авто-ФОТ больше не выглядит как особый фиолетовый статус: используется спокойный бейдж `Авто`, подпись `из калькулятора ФОТ` вторым рядом и мягкий системный фон.
- В заголовок блока добавлены summary-плашки `ручные`, `ФОТ`, `масштаб.`.
- На summary-плашках есть hover-подсказки через `data-tip`, чтобы объяснять клиенту состав каждой суммы.
- Mobile: summary-плашки переносятся под заголовок; таблица сохраняет горизонтальный скролл.

Public API витрины не должен раскрывать приватные данные автора и полный recipe snapshot. До покупки покупатель видит только продающее превью рецепта, цену, объём, автора и описание для витрины. План динамического Tilda-каталога с фильтрами и корзиной отменён 19 июня 2026; не возобновлять его без нового отдельного согласования.

Anonymous public API не должен отдавать телефоны, email, Telegram, yClients ID, `bitrix_contact_id`, `bitrix_deal_id`, order IDs, `author_user_id` и другие внутренние CRM/platform ID. Исключение: `/api/suppliers` не является anonymous endpoint; он требует JWT активного пользователя и может отдавать публичные телефоны поставщиков авторизованным клиентам.

### Ключевые исправления (bcrypt)
```python
# server/main.py — bcrypt напрямую, без passlib:
import bcrypt as _bcrypt
def hash_password(p): return _bcrypt.hashpw(p.encode(), _bcrypt.gensalt()).decode()
def verify_password(plain, hashed): return _bcrypt.checkpw(plain.encode(), hashed.encode())
# passlib[bcrypt]==1.7.4 удалён — несовместим с bcrypt 5.0.0
```

### Деплой
```bash
# Фронтенд:
cd HTML_coffee_menu && npm run build
# Деплоить только изменённые файлы (хэш в имени меняется после каждой сборки):
scp -i ~/.ssh/id_ed25519 dist/assets/index-XXXX.js root@159.194.233.13:/var/www/coffee-menu/dist/assets/
scp -i ~/.ssh/id_ed25519 dist/index.html root@159.194.233.13:/var/www/coffee-menu/dist/index.html
# Удалить старые js-бандлы чтобы не было конфликтов!
ssh -i ~/.ssh/id_ed25519 root@159.194.233.13 'ls /var/www/coffee-menu/dist/assets/'
# Бэкенд:
scp -i ~/.ssh/id_ed25519 server/main.py root@159.194.233.13:/var/www/coffee-menu/server/
ssh -i ~/.ssh/id_ed25519 root@159.194.233.13 'systemctl restart coffee-menu-api'
```

---

### Email / SMTP (сессия 36)

**Провайдер:** Яндекс SMTP, SSL, порт 465
**Отправитель:** `Moscow Barista School <hello@baristaschool.ru>`
**Сервис:** `coffee-menu-api` читает настройки из `/var/www/coffee-menu/server/.env`

```
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_USER=hello@baristaschool.ru
SMTP_PASS=*** хранится только в server/.env ***
```

**Ключевые детали:**
- Используется `smtplib.SMTP_SSL` (не `SMTP` + `starttls`) — Яндекс принимает только SSL на 465
- `load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))` — явный путь, иначе `.env` не найден
- Тема письма: `Сброс пароля — Moscow Barista School`
- Письмо содержит кнопку сброса пароля и Telegram-кнопку (`https://t.me/Moscow_barista_school`).

**Forgot Password flow:**
- `POST /api/auth/forgot-password` принимает `{ email, source }` (`source: 'admin' | 'user'`)
- Генерирует reset-token на 24 часа, сохраняет его в БД и отправляет ссылку на email.
- Текущий пароль не меняется до успешного `POST /api/auth/reset-password`.
- Всегда возвращает одинаковый безопасный ответ `{ ok, email_sent }`; reset-link не возвращается в public API и не показывается в UI.
- `login_url` в письме зависит от `source`: admin → `https://baristaschool.online/#adm`, user → `https://barista-school.online`.

**Admin-panel (tilda-admin.html + admin-panel.js):**
- Inline forgot-form прямо в карточке логина (не отдельный модал)
- `body: JSON.stringify({ email: fEmail, source: 'admin' })` — всегда source='admin'
- UI показывает только статус отправки письма; reset-link через public API не раскрывается

---

### Yandex OAuth (сессия 36, обновлено сессия 37)

**Приложение:** «Moscow Barista School» на oauth.yandex.ru
**ClientID:** `6377f7d0f4c046958fcda1f5a599dc19`
**Secret:** хранится только в `/var/www/coffee-menu/server/.env`, в документации не фиксировать
**Scopes:** `login:email login:info login:phone`
**Redirect URI:** `https://barista-school.online/api/auth/yandex/callback`

> ⚠️ Новые пользователи через Яндекс OAuth → `is_active=False` → ожидают ручной активации через admin-панель

**`.env` на сервере (полный состав):**
```
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_USER=hello@baristaschool.ru
SMTP_PASS=***
YANDEX_CLIENT_ID=***
YANDEX_SECRET=***
YANDEX_REDIRECT=https://barista-school.online/api/auth/yandex/callback
TELEGRAM_BOT_TOKEN=***
TELEGRAM_ADMIN_CHAT_ID=33668380
TELEGRAM_WEBHOOK_SECRET=***  # optional; если не задан, production берёт derived secret из JWT_SECRET
```

**Backend endpoints (server/main.py):**
- `GET /api/auth/yandex` — редирект на `oauth.yandex.ru/authorize`
- `GET /api/auth/yandex/callback` — обменивает `code` → токен, получает профиль через `login.yandex.ru/info`, извлекает телефон из `profile.get("default_phone")`, создаёт пользователя с `is_active=False`, отправляет TG-уведомление
- Редирект на `APP_URL/?oauth_code=...` (если `is_active=True`) или на `/` с ошибкой; JWT и user-профиль выдаются только через `POST /api/auth/oauth-exchange`

> ⚠️ **Yandex OAuth callback (server/main.py):** использовать `create_token(user.id)`, не `create_access_token(...)` —
> функция `create_access_token` не существует, NameError — OAuth всегда падал без видимой ошибки (фикс сессия 45)

**Frontend (src/ui/auth.js):**
- Кнопка «Войти через Яндекс ID» под разделителем «или»
- Иконка — inline SVG (красный круг с Я), **не** `<img src>` с внешнего домена
- Клик → `window.location.href = API + '/api/auth/yandex'`
- После редиректа читает `?oauth_code=` из URL → `POST /api/auth/oauth-exchange` → `saveAuth()` → `fetchState()` → вход
- Читает `?auth_error=` → показывает сообщение об ошибке

**Паттерны OAuth (что нельзя делать):**
| ❌ Нельзя | ✅ Правильно |
|---|---|
| `<img src="https://yastatic.net/...">` для иконки | Inline SVG — не блокируется, всегда отображается |
| `import httpx` для OAuth | `urllib.request.urlopen` — httpx не в venv |
| Секрет в коде | Читать из `.env` через `os.getenv('YANDEX_SECRET')` |
| Новые пользователи Яндекс ID сразу активны | Новые → `is_active=False` → ручная активация через admin |

---

### Telegram-уведомления (сессия 37)

**Бот:** `@baristaschool_admin_bot`
**Token:** хранится только в `/var/www/coffee-menu/server/.env`, в документации не фиксировать
**Admin chat ID:** `33668380` (`@DonRomon`)
**Env vars:** `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`, опционально `TELEGRAM_WEBHOOK_SECRET` в `/var/www/coffee-menu/server/.env`

**При регистрации** (email и Яндекс OAuth) отправляется уведомление:
- Имя, email, телефон, источник (`email` или `yandex`)
- Ссылка на admin-панель для активации
- Inline-кнопки ✅ Активировать / ❌ Отклонить (через Telegram Bot API callback)

**Backend (`notify_admin_new_user`):**
```python
TG_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TG_ADMIN_CHAT = os.getenv("TELEGRAM_ADMIN_CHAT_ID")
```
Если env vars не заданы — функция молча игнорируется (нет crash).

Webhook `/api/telegram/webhook` проверяет `X-Telegram-Bot-Api-Secret-Token` и admin chat. После смены `JWT_SECRET`/`TELEGRAM_WEBHOOK_SECRET` webhook нужно перерегистрировать через `/api/admin/register-webhook`.

Разовый endpoint просмотра updates перенесён в admin-only `/api/admin/telegram/setup`; публичного `/api/telegram/setup` быть не должно.

**Важно:** не хранить токен и chat_id в коде или репозитории — только в `.env` на сервере.

### Telegram-уведомления авторов через `@MBS_work_bot`

Для авторских рецептов используется отдельная конфигурация, чтобы не ломать старый бот регистраций:

- env: `JOIN_MBS_BOT_TOKEN`, `JOIN_MBS_BOT_USERNAME=MBS_work_bot`, опционально `JOIN_MBS_AUTHOR_REVIEW_CHAT_ID`, `JOIN_MBS_WEBHOOK_SECRET`;
- author API: `/api/author/telegram/status`, `/api/author/telegram/link`, `/api/author/telegram/settings`;
- webhook: `/api/telegram/join-mbs/webhook`, регистрация через `/api/admin/register-join-mbs-webhook`;
- 22 июня 2026 webhook `@MBS_work_bot` возвращён в Битрикс Open Lines (`im.bitrix.info`), чтобы входящие сообщения из Telegram попадали в открытую линию `Пиберри`. Coffee_menu не должен перехватывать webhook этого бота: клиентское меню и воронку нужно переносить в слой Битрикс/openline, а для авторских Telegram-уведомлений нужен отдельный бот или отдельное согласованное решение.
- автор привязывает Telegram по одноразовой ссылке `/start author_<token>`;
- команда получает уведомления об отправке/повторной отправке рецепта на проверку;
- автор получает уведомления о доработке, публикации, снятии и комментариях проверки.

Production на 19 июня 2026:

- `JOIN_MBS_BOT_TOKEN`, `JOIN_MBS_BOT_USERNAME=MBS_work_bot`, `JOIN_MBS_AUTHOR_REVIEW_CHAT_ID` заданы в `/var/www/coffee-menu/server/.env`;
- токен `@MBS_work_bot` хранится в локальном проекте `schedule-online/events-schedule-sync` как `MBS_WORK_BOT_TOKEN`, в документации значение не указывать;
- webhook `@MBS_work_bot` установлен на endpoint Битрикс Open Lines (`im.bitrix.info`) с `allowed_updates=["message","callback_query"]`; `/api/telegram/join-mbs/webhook` больше не должен занимать этот бот;
- webhook `@Join_MBS_bot` снят с платформы, чтобы BotHelp снова управлял основным ботом школы;
- после смены бота старые Telegram-привязки авторов технически остаются chat_id, но авторам нужно переподключить Telegram через кабинет, чтобы они стартовали новый бот.
- 19 июня 2026 исправлено отключение Telegram из кабинета автора: `showConfirm()` теперь возвращает `Promise<boolean>`, поэтому после подтверждения реально вызывается `DELETE /api/author/telegram/link`; frontend задеплоен.

---

## 1. Назначение проекта

**Аудитория:** будущие и действующие владельцы кофеен (студенты MBS).

**Задача:** дать финансовый инструмент, который открывается двойным кликом в браузере и позволяет:
- рассчитать себестоимость каждого напитка из рецептуры
- сделать ABC-анализ меню по марже
- спланировать выручку и прибыль от продаж
- построить финмодель (ТБУ + сценарии) на основе реального плана продаж

---

## 2. Файловая структура

```
HTML_coffee_menu/
├── index.html          # Разметка + <script type="module" src="/src/main.js">
├── landing.html        # Лендинг + Firebase Auth (отдельный standalone HTML, без Vite)
├── styles.css          # Все стили (CSS Variables, Grid, Flexbox, Dark theme, Print)
├── vite.config.js      # Vite 5.4 конфиг (root: '.', outDir: 'dist')
├── package.json        # devDependency: vite
├── build.py            # Одноразовый скрипт (исторический артефакт)
├── CONTEXT.md          # Этот файл
├── images/             # Фотографии напитков (16 .jpg)
├── dist/               # Сборка Vite (gitignore)
└── src/                # ES-модули (30 файлов, точка входа — main.js)
    ├── main.js         # Единственная точка входа Vite; INIT, window.*, switchTab
    ├── data/
    │   ├── constants.js    # GROUP_LABEL, SALES_PRESETS, FIXED_COSTS_DEF, nextDrinkId/SemiId/MatKey
    │   ├── drinks.js       # DRINKS, DRINKS_ORIG, DRINK_IMAGES, DRINK_QUALITY
    │   └── mat.js          # MAT, MAT_ORIG, MAT_CATEGORIES, BASE_MAT_KEYS
    ├── state/
    │   ├── store.js        # S, Loc, DEFAULTS, activeLoc, saveState, loadState, resetGlobalsToBase
    │   └── ui-state.js     # dirty, sortState, salesSortState, _matActiveCat, PS_DEFAULTS
    ├── utils/
    │   ├── calc.js         # calcCost, calcIngCost, calcSemiCostPerUnit, enrich, withABC, ...
    │   ├── format.js       # rub, pct, int, fcBarHtml, riskBadge, fcCombinedHtml, abcBadge, fcCls
    │   └── image.js        # getDrinkImage
    ├── render/
    │   ├── dashboard.js    # renderDashboard
    │   ├── cost.js         # renderCost
    │   ├── sales.js        # renderSales
    │   ├── finmodel.js     # renderFinModel
    │   └── recipes.js      # renderRecipes
    ├── modals/
    │   ├── drink.js        # openAddDrink, openEditDrink, saveDrink, deleteDrink, resetDrink
    │   ├── mat.js          # openAddMat, openEditMat, saveMat, deleteMat, cancelMat
    │   └── semi.js         # openAddSemi, openEditSemi, saveSemi, deleteSemi
    ├── export/
    │   ├── csv.js          # exportCSV, exportDashboard, exportSales
    │   └── techcards.js    # _techCardCSS, _buildTechCardBlock, _buildSemiTechCardBlock, exportTechCards, mvdDownload*
    └── ui/
        ├── auth.js         # SaaS JWT-аутентификация: форма входа/регистрации, fetchState, pushState
        ├── updaters.js     # switchTab, flashCells, renderTab, markDirty
        ├── events.js       # burgerNav, modalDirty, safeClose, Escape, keyboard nav
        ├── modals.js       # openModal, closeModal, safeCloseModal, _unsaved warning
        ├── ingredients.js  # addIngRow, matOptions, _onIngMatChange, _ingPlaceholder
        ├── cost-table.js   # openCostEditor, _syncTargetFCInputs, setMatCat
        ├── locations.js    # renderLocSwitcherUI, renderLocList, modal-loc
        ├── misc.js         # exportFullPDF/XLSX, exportMaterialsPDF/XLSX, exportSuppliersPDF/XLSX,
        │                   # buildBEPChart, buildSeasonalChart, openDropCandidates, openPriceHistory
        ├── payroll.js      # renderPayroll, calcPositionCosts, renderPayrollSummary
        ├── recipe-view.js  # openViewDrink
        ├── sort.js         # setSort, sortDrinks, thSort, setSalesSort, thSalesSort, ...
        └── suppliers.js    # renderSupplierBook, openSupplierModal, saveSupplier
```

**Сборка Vite:**
- Dev: `npm run dev` → `localhost:5173`
- Build: `npm run build` → `dist/` (33 модуля, ~320 kB, ~430ms)
- `index.html` содержит только `<script type="module" src="/src/main.js">`; ExcelJS лениво грузится через `ensureExcelJS()` из локального `/vendor/exceljs/exceljs.min.js`

---

## 3. Стек

| Слой | Технология |
|------|-----------|
| Разметка | HTML5 |
| Стили | CSS (CSS Variables, CSS Grid, Flexbox, `@media print`) — `styles.css` |
| Логика | Vanilla JS ES-модули — `src/` (30 файлов, точка входа `src/main.js`) |
| Сборка | **Vite 5.4** (`vite.config.js`; dev: `localhost:5173`, build: `dist/`) |
| Excel-экспорт | ExcelJS 4.4, лениво через `ensureExcelJS()` из локального `/vendor/exceljs/exceljs.min.js`; **не npm** |
| Шрифт | Mulish (Google Fonts, CDN) |
| Иконки | Lucide (CDN, UMD) |
| Зависимости runtime | **нет** (кроме CDN-ресурсов) |

---

## 4. Дизайн-токены (CSS-переменные)

```css
--navy:   #417033   /* тёмно-зелёный, заголовки, шапка, акцент */
--green:  #4F883E   /* основной зелёный, шапки таблиц */
--light:  #E7F2E3   /* светло-зелёный фон карточек "hi" */
--soft:   #B6D8AB   /* полосы ABC-A, прогресс-бары good */
--red:    #CC2841   /* риск, отрицательные значения */
--red-bg: #F8DDE1   /* фон карточек danger/пессимистичного сценария */
--border: #cde3c5   /* рамки карточек и таблиц */
--muted:  #6b7280   /* вторичный текст, подписи */
--font:   'Mulish', sans-serif
```

---

## 5. Архитектура JS

### 5.1 DATA (источник истины)

**`MAT`** — объект-словарь сырья (18 базовых позиций + `custom_N` при добавлении пользователем):
```js
MAT = {
  coffee:        { name, unit, price, size },  // price = ₽ за 1 unit, size = г/мл/шт в 1 unit
  filter_coffee,                               // зерно под фильтр (отдельный ключ, p=4000₽/кг)
  milk, cream, cocoa, matcha, sugar, sugar_van, sugar_org,
  cup250, cup350, cup450, cup_p300, cup_p500,
  orange, tea, tonic, lime
}
```

**`SEMI`** — массив полуфабрикатов (создаются пользователем):
```js
SEMI = [
  { id, name, unit: 'мл'|'г'|'шт', yield: number, process: string,
    recipe: [{mat, amt, loss?}] }
]
```
- `id` — автоинкремент от `nextSemiId` (начинается с 1)
- `unit` / `yield` — единица и объём одной партии выхода
- `recipe` — только сырьё из MAT (не рекурсивно, п/ф не могут содержать п/ф)

**`nextSemiId`** — автоинкремент id для полуфабрикатов

**`DRINKS`** — массив 30 базовых напитков (ids 0–29; + кастомные при добавлении):
```js
{ id, group, name, vol, recipe: [{mat?, semi?, amt, loss?}], price, custom? }
```
- `group`: `'hot'` | `'tea'` | `'cold'` | `'filter'`
- ids 27–29: Фильтр-кофе 250/350/350 (группа `'filter'`, ингредиент `filter_coffee`)
- `recipe.loss` — коэффициент потерь при обработке (например, апельсин `loss:0.5`)
- `recipe.mat` — ключ сырья из MAT **или** `recipe.semi` — id полуфабриката из SEMI
- `price` — базовая цена продажи (переопределяется через `S.salePrices`)
- `custom: true` — признак пользовательского напитка (сохраняется в localStorage)

**`FIXED_COSTS_DEF`** — 6 статей постоянных расходов (шаблон)

**`GROUP_LABEL`** — словарь меток групп:
```js
{ hot: 'Горячие кофейные', tea: 'Чай и матча', cold: 'Холодные напитки', filter: 'Фильтр-кофе' }
```

**`DEFAULTS`** — снимок исходных цен/цен продажи/порций для кнопки «Сброс»

**`SALES_PRESETS`** — 4 пресета плана продаж: `normal` / `quiet` / `summer` / `winter`

**`nextDrinkId`** — автоинкремент id для новых напитков (начинается с 30)

**`nextMatKey`** — суффикс для ключей кастомного сырья (`custom_1`, `custom_2`, ...)

---

### 5.2 STATE (`S`)

```js
S = {
  prices,           // текущие цены сырья { mat_key: number }
  salePrices,       // цены продажи напитков { id: number }
  portions,         // порций/день { id: number }
  days,             // дней в месяце (default: 30)
  targetFC,         // целевой food-cost % (default: 0.25)
  fixedCosts,       // массив { name, value } — постоянные расходы
  taxMode,          // 'none' | 'usn6' | 'usn15' — налоговый режим
  investment,       // стартовые вложения ₽ (для расчёта окупаемости)
  payrollPositions, // [ { id, name, rate, hours, shifts, count, empType } ] — ФОТ по должностям
  payrollSettings,  // { mrot, ndfl, ins } — настройки расчёта ФОТ
  seasonality,      // [×1..×N] × 12 месяцев — сезонный коэффициент выручки
  suppliers,        // { mat_key: { name, phone, note, site } } — поставщик к ингредиенту
  supplierBook,     // [ { id, name, phone, note, site } ] — общий справочник поставщиков
  priceLog,         // [ { matKey, oldPrice, newPrice, date } ] — лог изменений цен сырья
  activePreset,     // string | null — ключ активного пресета плана продаж
  customCategories, // { key: { label, order } } — пользовательские и переопределённые категории ингредиентов
  semiCustomCategories, // { key: { label, order } } — пользовательские и переопределённые категории п/ф
}
```

**Поставщики по умолчанию** (привязаны к ингредиентам):
- `coffee`, `filter_coffee` → Rockets.coffee (+7 925 386-74-20)
- `tonic` → Rocket Tonic (+7 800 201-79-69)
- `cocoa` → Unicava (+7 922 027-11-17)
- `milk`, `cream` → Петмол (+7 999 233-30-04)

**Справочник поставщиков (5 записей):** Rockets.coffee, Tasty coffee, Rocket Tonic, Unicava, Петмол

---

### 5.3 CALCULATIONS

| Функция | Что делает |
|---------|-----------|
| `calcCost(drink)` | Себестоимость напитка из рецептуры (с учётом loss; поддерживает `{semi}` и `{mat}`) |
| `calcIngCost(ing)` | Себестоимость одного ингредиента (поддерживает `{semi}` и `{mat}`) |
| `calcSemiCostPerUnit(semi)` | Себестоимость 1 единицы выхода полуфабриката: сумма сырья / yield |
| `enrich()` | Возвращает массив drinks + `{cost, price, profit, fc, rec}` |
| `withABC(drinks)` | Добавляет поле `abc: 'A'|'B'|'C'` (20/30/50% по прибыли) |
| `avgMetrics(drinks)` | Простые средние (avgCost, avgPrice, avgProfit, avgFC) |
| `weightedMetrics(drinks)` | **Взвешенные** средние по реальным порциям из плана продаж |
| `salesMetrics(drinks)` | Итоги плана: totalPort, totRevDay/Mon, totPrfDay/Mon |
| `bepCalc(drinks)` | ТБУ от взвешенных показателей: cupsMonth, cupsDay, revBEP |

**Формула себестоимости ингредиента:**
```
cost = (price_per_unit / size_g) * amt_g
если loss: cost = cost / (1 - loss)
```

**ABC-классификация** (по убыванию прибыли/чашку):
- A = топ 20% → приоритет продаж
- B = следующие 30% → рабочий ассортимент
- C = оставшиеся 50% → пересмотреть цену или себестоимость

---

### 5.4 РЕНДЕР-ФУНКЦИИ

Каждая вкладка — отдельная функция, которая пишет `innerHTML` в `<div id="tab-*">`.

| Функция | Вкладка |
|---------|---------|
| `renderDashboard()` | 📊 Обзор меню |
| `renderCost()` | 🧮 Себестоимость |
| `renderSales()` | 🛒 План продаж |
| `renderFinModel()` | 💰 Финмодель |
| `renderRecipes()` | 📋 Рецептуры |

**Паттерн ленивого рендера:**
```js
const dirty = { dashboard:true, cost:true, sales:true, finmodel:true, recipes:true };
// При переходе на вкладку — рендер только если dirty=true
// После рендера dirty=false
```

---

### 5.5 FORMAT HELPERS

```js
rub(v)             // → "1 234 ₽"
pct(v)             // → "26.1%"  (v = 0..1)
int(v)             // → "1 234"
fcBarHtml(fc)      // → HTML с цветным текстом + прогресс-бар (зел/жёлт/красн)
riskBadge(fc)      // → <span class="risk risk-*">🟢/🟡/🔴</span>
fcCombinedHtml(fc) // → riskBadge + fcBarHtml в одном flex-контейнере (используется в таблицах)
abcBadge(abc)      // → <span class="abc abc-A/B/C">A</span>
fcCls(fc)          // → 'good' | 'ok' | 'bad' (пороги: 0.25 / 0.30)
```

---

### 5.6 SORT

```js
// Дашборд
const sortState = { col: 'profit', dir: 'desc' };
function setSort(col)           // клик по заголовку → toggle asc/desc
function sortDrinks(drinks)     // сортирует по sortState
function thSort(col, label, cls, tip) // генерирует <th> с onclick, стрелкой и тултипом

// Себестоимость — сортировка встроена в renderCost() напрямую (нет отдельного sortState)

// План продаж (поддерживает сортировку по revMon, prfMon и др.)
const salesSortState = { col: 'name', dir: 'asc' };
function setSalesSort(col) / thSalesSort() / filterSales(val)

// Рецептуры
let recipeSort = 'group';   // 'group' | 'name' | 'fc' | 'profit'
let recipeGroup = 'all';    // 'all' | 'hot' | 'tea' | 'cold' | 'filter'
function setRecipeSort(s) / setRecipeGroup(g) / filterRecipes(val)
```

---

### 5.7 EXPORT CSV

```js
exportCSV(filename, headers, rows)  // скачивает .csv с BOM (для Excel)
exportDashboard()                   // из вкладки Дашборд
exportSales()                       // из вкладки План продаж
```

---

### 5.8 МОДАЛЬНЫЕ ОКНА

**modal-drink** — добавить / редактировать напиток:
```js
openAddDrink()          // открыть в режиме "новый"
openEditDrink(id)       // открыть в режиме "редактировать"
saveDrink()             // сохранить в DRINKS + S.salePrices
deleteDrink(id)         // удалить из DRINKS + S
resetDrink(id)          // сбросить к DRINKS_ORIG (только базовые)
addIngRow(mat, amt, loss) // добавить строку ингредиента в форму
```

**modal-mat** — добавить новое сырьё:
```js
saveMat()               // добавить в MAT + S.prices с ключом 'custom_N'
deleteMat(key)          // проверяет использование в рецептурах → удаляет
```

**modal-semi** — добавить / редактировать полуфабрикат:
```js
openAddSemi()                        // открыть в режиме "новый"
openEditSemi(id)                     // открыть в режиме "редактировать"
saveSemi()                           // create/update в SEMI → renderCost()
deleteSemi(id)                       // проверяет использование в напитках → удаляет
addSemiIngRow(matKey, amt, loss)     // добавить строку MAT-ингредиента в форму п/ф
matOnlyOptions(selected)             // <option> только из MAT (без SEMI)
```

Особенности `modal-semi`:
- Live-расчёт стоимости: плашка `#ms-cost-preview` — «Себест. сырья: X ₽ · Y ₽/ед.»; обновляется через `_updateSemiCostPreview()` при изменении любого поля
- Поле кол-ва: `type="text" inputmode="decimal"` — placeholder зависит от единицы сырья

---

### 5.9 PERSIST & THEME

```js
saveState()   // сериализует S + customDrinks + customMats → localStorage('mbs_coffee_s')
loadState()   // восстанавливает при старте; не перезаписывает дефолты если в localStorage пустой объект/массив
toggleTheme() // dark/light; обновляет data-lucide на theme-icon; сохраняет в localStorage
toggleBurger() // мобильное меню
closeOnboarding() // скрывает онбординг; сохраняет флаг в localStorage
```

---

### 5.10 ФИНМОДЕЛЬ — ДОПОЛНИТЕЛЬНЫЙ ФУНКЦИОНАЛ

**P&L (отчёт о прибылях и убытках):**
- Выручка → Себестоимость сырья → Валовая прибыль → Постоянные расходы → EBIT → Налог → Чистая прибыль

**Налоговые режимы (`taxMode`):**
- `none` — без налога
- `usn6` — УСН 6% от выручки
- `usn15` — УСН 15% от (доходы − расходы)

**Окупаемость инвестиций:**
```
paybackMon = investment / baseNet (мес.)
```

**«А что если?» (What-if калькулятор):**
- Слайдер −30%..+30% → пересчитывает средний чек, FC%, ТБУ, чистую прибыль

**Статьи постоянных расходов:**
```js
addFixedCost()       // добавить статью
delFixedCost(i)      // удалить (минимум 1 статья)
onFixedCostName(i,v) // переименовать inline
```

**`buildBEPChart()`** — SVG-функция (~130 строк). Рисует диаграмму ТБУ: выручка vs расходы, зоны убытка/прибыли, маркер ТБУ, линия плана. **Написана, но не вызывается** — намеренно отключена.

---

### 5.11 RESET

```js
resetAll()  // confirm → восстанавливает S из DEFAULTS + FIXED_COSTS_DEF + очищает localStorage
```

---

## 6. Вкладки — детальное описание

### 📊 Дашборд
- 8 KPI-плашек: кол-во напитков, средний чек, прибыль/чашка, FC%, целевой FC%, класс A (топ 20%), риск FC>30%, на грани FC 25-30%
- Мини-бар-чарт Топ-10 по прибыли (HTML div, без SVG)
- Таблица рейтинга: сортировка по клику, FC-бар, ABC-бейдж, inline-редактирование, кнопка удаления для кастомных
- Поиск по названию
- Легенда ABC
- Кнопки: «⬇ CSV»

### 🧮 Себестоимость
- Сетка редактируемых цен на сырьё (при изменении → дебаунс-пересчёт) — **сворачивается** кнопкой «Цены на сырьё ▲/▼»
- Кнопка «+ Сырьё» → modal-mat
- **Секция полуфабрикатов** — карточки SEMI с себестоимостью/ед., кнопки редактирования и удаления; **сворачивается** кнопкой «Полуфабрикаты ▲/▼»; кнопка «+ Полуфабрикат» → modal-semi
- Целевой FC% (редактируемый) → обновляет колонку «Рекомендуемая цена»
- Таблица: Напиток / Себест. / FC% (объединённый: значок+%+полоска) / Ваша цена / Рекомендуемая / Прибыль / кнопка
  - Рекомендуемая цена подсвечивается жёлтым (`#fffbe6`) + ⚠️ только если `FC% > targetFC + 10пп`
  - Кнопка «↺» в строке: сброс к исходной рецептуре и цене
- Поиск + сортировка

### 🛒 План продаж
- **KPI-строка 1** `.sales-kpi-row1`: «Выручка/мес», «Прибыль/мес» (зелёная), «Чашек/день»
- **KPI-строка 2** `.sales-kpi-row2`: «Food-cost %» (цвет по порогу), «Средний чек», блок «Дней в месяце + кнопки ±10%»
- Редактируемые порции/день (oninput + дебаунс 400мс)
- Таблица **4 колонки**: Напиток / Порций/день / Выручка/мес ₽ / Прибыль/мес ₽
- ИТОГО-строка в tfoot
- Пресет-селект + поиск по названию + сортировка по 4 столбцам
- Кнопки «⬇ CSV»

### 💰 Финмодель
- Редактируемые статьи постоянных расходов (inline + delete)
- Режим налогообложения (select)
- Стартовые вложения + расчёт окупаемости
- Взвешенные KPI-плашки из плана продаж
- «А что если?» — слайдер изменения цен
- Сценарии ×0.5/×1.0/×2.0 от базового плана
- P&L-таблица (7 строк)

### 📋 Рецептуры
- Фильтр по группе (hot / tea / cold / filter) + поиск + сортировка (4 режима)
- Карточки: ингредиенты с пропорциональными полосами, доля %, стоимость ₽
- ABC-бейдж, FC%, кнопка редактирования для кастомных напитков
- Итоги: себестоимость / цена продажи / прибыль
- Кнопки: «+ Напиток», «PDF техкарт»

---

## 7. Связи между вкладками

```
Цены сырья (🧮) ──────┐
Цены продажи (🧮) ─────┼─→ enrich() → всё пересчитывается
Целевой FC% (🧮) ──────┘

Порции/день (🛒) ──────────→ salesMetrics() → weightedMetrics()
                                     ↓
                              💰 Финмодель (ТБУ + сценарии + P&L)
```

---

## 8. Известные особенности и решения

| Проблема | Решение |
|---------|---------|
| Sticky thead конфликтовал со sticky header | `thead { position: sticky; top: 0 }` — sticky на элементе thead, а не на th; работает во всех браузерах включая Safari |
| `border-collapse: collapse` ломал z-index у sticky | Переход на `border-collapse: separate; border-spacing: 0` + `border-bottom` на `td` |
| KPI-значения с длинным текстом переполнялись | `clamp(20px, 2.2vw, 26px)` + `word-break: break-word`; текст убран из `kpi-value` в `kpi-label` |
| Тултипы обрезались в overflow:auto таблице | `[data-tip]::after { position: fixed }` + JS-позиционирование через `mouseover` с `--tip-x`/`--tip-y` |
| Тултип вылезал за нижний край экрана | JS проверяет `spaceBelow < 130` → флип вверх через `--tip-anchor` |
| Инициализация тёмной темы ломала theme-icon | `element.setAttribute('data-lucide', 'sun')` вместо `textContent = '☀️'` |
| Финмодель не учитывала реальный план | Замена `avgMetrics` на `weightedMetrics` + `salesMetrics` |
| Сценарии с ручным вводом чашек | Заменены на множители ×0.5/×1.0/×2.0 от плана |
| Экспорт CSV в Excel (кодировка) | BOM (`\uFEFF`) + разделитель `;` |
| Потери при отжиме/обработке | `loss` в рецептуре: `cost / (1 - loss)` |
| Спиннер `input[type=number]` ломался на 2-й клик | `oninput` + дебаунс 400мс — DOM не пересоздаётся пока пользователь кликает |
| Выделение текста в ячейках при быстром клике | `user-select:none` на `td` + `user-select:auto` на `td input` |
| FC% не двигался через text-align (flex-контейнер внутри td) | `justify-content: flex-end` на `.fc-combined` + `text-align: right; padding-right: 24px` на `td` |
| Поставщики из localStorage перезаписывали дефолты | `loadState()`: проверка на непустой объект/массив перед применением |
| Чёрный экран при печати в Safari (`file://`) | Blob URL и popup `window.print()` не работают в Safari на `file://`. Решение: `_printViaIframe(html)` — скрытый iframe в текущем документе, `iframe.contentWindow.print()` из родительского контекста |
| Белый лист при скачивании PDF в Safari | Blob URL замораживал страницу при открытии диалога → `_printViaIframe` без Blob |
| `type="number"` placeholder не показывается в Safari | `type="text" inputmode="decimal"` — placeholder всегда виден, `parseFloat()` при сохранении |
| `unit` хранится как `'1 кг'`/`'1 л'` (не просто `'кг'`) | Проверка через `.includes('кг')` / `.includes('л')` для определения формата placeholder |
| iOS Safari зумирует страницу при фокусе | `font-size: 16px !important` на все `input/select/textarea` внутри `@media (max-width: 768px)` |
| `position: fixed` не работает внутри `position: sticky` на iOS | `#loc-menu` и `#export-menu` вынесены из хедера в DOM после `</header>`; JS позиционирует через `getBoundingClientRect()` |
| На мобиле выпадалка «Моя кофейня» открывалась внизу экрана | `top: 58px !important` в мобильном медиа-запросе — меню прижато к шапке |
| `.btn-green` не был определён в CSS | Добавлен `.btn-green { background: var(--green); color: #fff; border: none; }` + hover + dark override |
| `.btn-green` выглядел квадратным в team-flow | `.btn-green` должен быть полноценной кнопкой: `inline-flex`, `align-items:center`, `justify-content:center`, `gap`, `padding`, `border-radius`, `font`, `line-height`; для `.workspace-invite-rowform` и `.workspace-action-row` держать `height: 42px` и `min-width: 118px`. |
| В журнале действий время не совпадало с Москвой | Timestamps backend без timezone трактовать как UTC (`Z`) и форматировать через `Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Moscow' })`. |
| Аватар в журнале визуально ломал правую колонку | В actor-блоке держать порядок `имя → роль → аватар`; аватар справа, текст выровнен вправо на desktop и влево на mobile. |
| Десктопная строка ингредиента переносилась на 2-й ряд | Мобильный `@media` устанавливал `grid-row: 2` → десктоп должен явно указывать `grid-row: 1` на всех 5 дочерних. Переключить с `nth-of-type` на `nth-child`. |
| Предупреждение о несохранённых изменениях показывалось при открытии модала | `_markModalDirty` вызывался в `openEditDrink`/`openEditSemi` — убрать эти вызовы; метить dirty только через делегированный `input`/`change` на документе |
| Предупреждение не адаптировалось под тёмную тему | Инлайн-стили заменены на CSS-классы (`._unsaved-box` и др.) с правилами `body.dark` |
| Настройки налогообложения (МРОТ/НДФЛ/взносы) не пересчитывали ФОТ | `_refreshPayrollRow` не была выставлена в `window` → добавлена в `_srcExports` через `main.js` |
| Легенда ABC выводилась в одну строку на мобильном | В `renderDashboard`: заголовок `display:block`, каждый пункт в отдельном `<div>`, обёртка `flex-direction:column` |
| Фокус слетал с инпутов МРОТ/НДФЛ/взносы при каждой нажатой клавише | `oninput` → `onchange` в трёх инпутах `finmodel.js` — ре-рендер только при уходе из поля |
| Настройки налогообложения (МРОТ/НДФЛ/взносы) не пересчитывались после ввода | `_refreshPayrollRow` не была выставлена в `window` → добавлены в `_srcExports` через `main.js` |
| Легенда ABC выводилась в одну строку на мобильном | В `renderDashboard`: заголовок `display:block`, каждый пункт в отдельном `<div>`, обёртка `flex-direction:column` |
| Фокус слетал с инпутов МРОТ/НДФЛ/взносы при каждой нажатой клавише | `oninput` → `onchange` в трёх инпутах `finmodel.js` — ре-рендер происходит только при уходе из поля |
| Вкладки Дашборд / Продажи / Поставщики отображались с неправильной шириной (узко на десктопе, шире viewport на мобайле) | **Причина:** `body { display: flex; flex-direction: column }` (добавлен для sticky-footer) делает `<main class="main">` flex-child. В flex-column `margin: 0 auto` не растягивает элемент до полной ширины — он сжимается до ширины контента. **Решение:** `width: 100%` на `.main` — до применения `max-width: 1440px` и `margin: 0 auto`. **Правило:** при `body { display: flex }` все дочерние блоки-контейнеры должны иметь явный `width: 100%`. |
| В модалке «Новый полуфабрикат» поле «Цена» не обновлялось при вводе кол-ва; ячейка «Потери» не работала | **Причина:** `addSemiIngRow` строила HTML с inline `oninput="_updateSemiIngCost(this)"`. В Vite-сборке имена функций минифицируются → `window._updateSemiIngCost` не находилась. **Решение:** убрать все inline-обработчики из HTML-строки; после `wrap.appendChild(row)` навесить `addEventListener('input'/'change'/'click')` напрямую на DOM-элементы внутри замыкания. **Правило:** в Vite ES-модулях не использовать `oninput="moduleFn(this)"` — только `addEventListener`. |
| В модалке «Новый полуфабрикат» поле «Цена» не обновлялось при вводе кол-ва / потерь; ячейка «Потери» не работала | **Причина:** `addSemiIngRow` строила HTML через innerHTML со строками `oninput="_updateSemiIngCost(this)"` и `onchange="_onSemiMatChange(this)"`. В Vite-сборке имена функций минифицируются → `window._updateSemiIngCost` не находилась. **Решение:** убрать все inline-обработчики из HTML-строки; после `wrap.appendChild(row)` навесить `addEventListener('input')` / `addEventListener('change')` / `addEventListener('click')` напрямую на DOM-элементы внутри замыкания функции. **Правило:** в Vite ES-модулях нельзя использовать `oninput="moduleFn(this)"` для функций из модулей — они не гарантированно попадают в `window`. Использовать `addEventListener`. |
| Все попапы (рецепты, ингредиенты, полуфабрикаты, ингредиенты напитка) переставали открываться: скролл блокировался, но ничего не появлялось | **Причина:** незакрытый `</div>` у `div.modal-bg#modal-oc-item` в `index.html` — все последующие модалы (начиная с `modal-drink-view`) были вложены внутрь `modal-oc-item`. При его состоянии `display:none` дочерние попапы тоже были невидимы, но `openModal()` всё равно добавлял `html.modal-open` → скролл блокировался. **Решение:** добавить закрывающий `</div>` перед `<div class="modal-bg" id="modal-drink-view">` в `index.html`. **Правило:** при добавлении нового `modal-bg` в `index.html` — обязательно проверять баланс `<div>`/`</div>` через счётчик глубины (ожидаемое закрытие после двух `</div>` — один для `.modal`, один для `.modal-bg`). |

---

## 9. Как расширять проект

### Добавить новый напиток
```js
// В массив DRINKS добавить объект:
{ id: 30, group: 'cold', name: 'Новый напиток', vol: 300,
  recipe: [{mat: 'coffee', amt: 19}, {mat: 'cup_p300', amt: 1}],
  price: 350 }
// S.portions[30] добавится автоматически через DEFAULTS
```

### Добавить новое сырьё
```js
// В MAT добавить запись:
newMat: { name: 'Название', unit: '1 кг', price: 500, size: 1000 }
```

### Изменить пороги ABC
```js
// В функции withABC():
const nA  = Math.round(n * 0.2);   // % для класса A
const nAB = Math.round(n * 0.5);   // % для классов A+B
```

### Изменить пороги FC%
```js
// В функции fcCls():
return fc <= 0.25 ? 'good' : fc <= 0.30 ? 'ok' : 'bad';
```

### Включить график ТБУ
```js
// В renderFinModel(), после блока bepFormula, добавить:
`<div class="panel" style="padding:16px;margin-bottom:20px">
  ${buildBEPChart(bep.cupsMonth, bep.revBEP, avgPrice, avgCost, totalFixed, totalPort * S.days)}
</div>`
```

---

## 10. Сессии разработки

### Сессия 1 (5 мая 2026) — создание проекта
- Создана структура HTML + CSS + JS в одном файле
- Реализованы 4 вкладки: Дашборд, Себестоимость, План продаж, Финмодель
- Базовые 27 напитков с рецептурами и 17 позиций сырья
- MBS-дизайн: Mulish, CSS-переменные

### Сессия 2 (5 мая 2026) — полировка + новый функционал
- Переименовано: «MBS* Coffee Menu»
- KPI-лейблы: убраны uppercase, уменьшена min-width
- Добавлен FC-прогрессбар (`fcBarHtml`)
- Сортировка по заголовкам таблицы (Дашборд)
- Кнопка Reset (шапка)
- Финмодель связана с планом продаж через `weightedMetrics` / `salesMetrics`
- Сценарии переработаны: ×0.5/×1.0/×2.0 от базового плана
- Добавлена вкладка 📋 Рецептуры с карточками и полосами
- Экспорт CSV (Дашборд + План продаж)

### Сессия 3 (6 мая 2026) — тултипы, описания вкладок, выделение текста
- `.tab-intro` блок в каждой вкладке: иконка + заголовок + текст + шаги
- Тултипы на всех заголовках таблиц (`data-tip` + `.tip` класс)
- `user-select: none` на ячейках таблиц без наследования в инпуты

### Сессия 4 (6 мая 2026) — крупный функциональный апгрейд
- 💾 **localStorage** — `saveState()` / `loadState()`
- 🔍 **Поиск** — фильтрация в Дашборде, Себестоимости, Плане продаж, Рецептурах
- 📉 **Мини-бар-чарт** — Топ-10 по прибыли на Дашборде
- 🌙 **Тёмная тема** — `toggleTheme()`, сохраняется в localStorage
- 🖨 **Печать** — `@media print`
- 🧾 **Налоги** — `taxMode`: none / usn6 / usn15
- 💰 **Инвестиции + окупаемость**
- 📊 **P&L-таблица** в Финмодели
- 🎚 **«А что если?»** — слайдер изменения цен
- ✏️ **CRUD напитков и сырья** — модальные окна add/edit/delete
- ✏️ **Редактируемые названия статей расходов**

### Сессия 5 (6 мая 2026) — исправление спиннера числовых полей
- `oninput` + дебаунс 400мс для порций/день
- Убраны все `e.preventDefault()` на `mousedown`
- CSS-каскад `user-select` для td/input

### Сессия 6 (6 мая 2026) — баги, вёрстка, тултипы
- Исправлен баг: `toggleTheme()` при инициализации использовал `textContent` и уничтожал `<i id="theme-icon">` → заменён на `setAttribute('data-lucide', 'sun')`
- Исправлен `build.py`: защита от повторного запуска + `import os` наверх
- Исправлена опечатка «фисташювый» → «фисташковый»
- Удалён дублирующийся CSS-класс `.cost-del-btn:hover`
- Тултипы унифицированы: единый механизм `[data-tip]::after { position: fixed }` для всех элементов; добавлен авто-флип вверх если мало места снизу
- KPI-карточка «Класс A»: текст «напитков» убран из `kpi-value` → не переносится
- Sticky-заголовки таблиц: `border-collapse: separate` + `thead { position: sticky }` (не `th`) — работает во всех браузерах включая Safari

### Сессия 7 (6 мая 2026) — сортировка и поиск во всех вкладках, resetDrink, график ТБУ
- **Сортировка** добавлена в Себестоимость (`costSortState`, `setCostSort`, `thCostSort`, `filterCost`) и План продаж (`salesSortState`, `setSalesSort`, `thSalesSort`, `filterSales`) — сортировка по 6–7 столбцам каждая
- **Поиск** расширен на вкладки Себестоимость, Рецептуры (`recipeSearch`)
- **Фильтр по группам** в Рецептурах (`recipeGroup`: all / hot / tea / cold)
- **Сортировка в Рецептурах** — 4 режима: по группам, алфавиту, FC%, прибыли
- **`resetDrink(id)`** — сброс изменённого напитка к исходным значениям (`DRINKS_ORIG`); кнопка «Сбросить» в модале
- **Флаг `modified`** на базовых напитках после редактирования — показывается иконка карандаша и кнопка сброса
- **`buildBEPChart()`** — SVG-функция (~130 строк): диаграмма ТБУ с зонами убытка/прибыли, маркером точки БУ с тултипом при наведении, линией плана, легендой, подписями осей. Написана, **в `renderFinModel` не вызывается** — намеренно отключена (включить см. раздел 9)
- **`nextMatKey`** — автоинкремент суффикса для кастомного сырья (`custom_1`, `custom_2`, …)
- **`DRINKS_ORIG`** — иммутабельный снимок базовых напитков при старте для функции сброса
- **`MAT_ORIG`** — иммутабельный снимок базового сырья при старте

### Сессия 8 (7 мая 2026) — поставщики, пресеты, FC% колонка, фильтр-кофе

**Новое сырьё и напитки:**
- `filter_coffee` добавлен в MAT как отдельный ингредиент (зерно под фильтр, 4000₽/кг)
- Группа `filter` добавлена в GROUP_LABEL
- Напитки 27–29: «Фильтр-кофе 250», «Фильтр-кофе 350», «Фильтр-кофе (авторский)» — используют `filter_coffee`
- `nextDrinkId` начинается с 30 (не с 27)

**Поставщики:**
- `S.suppliers` — словарь привязки ингредиента к поставщику; заполнен дефолтными данными для 6 ключей
- `S.supplierBook` — справочник 5 поставщиков (Rockets.coffee, Tasty coffee, Rocket Tonic, Unicava, Петмол)
- Логика `loadState()`: не перезаписывать дефолты если в localStorage пустой объект/массив

**Активный пресет плана продаж:**
- `S.activePreset` — ключ текущего активного пресета; устанавливается в `applySalesPreset(key)`
- В `renderSales()`: активная кнопка пресета подсвечивается зелёным (`background: var(--green); color: #fff`)

**FC% колонка (таблицы себестоимости и дашборда):**
- `fcCombinedHtml(fc)` — объединяет `riskBadge` + `fcBarHtml` в один flex-контейнер
- Колонки Статус и FC% объединены в одну: `filterCost` colspan=8, `renderCost` colspan=7
- CSS: заголовок по центру, значение вправо (`justify-content: flex-end` на `.fc-combined`)

**Рекомендуемая цена в таблице себестоимости:**
- Подсветка `background: #fffbe6` + ⚠️ если `d.fc > S.targetFC + 0.10`
- Tooltip кнопки сброса: «Вернуть исходную рецептуру и цену»

**Исправление синтаксической ошибки:**
- В `renderCost()`: пропущен закрывающий `` ` `` шаблонной строки `_costEl.innerHTML` — исправлено; страница не открывалась

### Сессия 9 (7 мая 2026) — рефакторинг техкарт + Excel по ГОСТ + футер MBS

**Рефакторинг печати техкарт:**
- Вынесены общие части в три функции:
  - `_techCardCSS()` — CSS для всех PDF техкарт (A4, ГОСТ-стиль, print-bar, .mbs-footer)
  - `_buildTechCardBlock(d, orgName, cardNum, isLast)` — генерирует HTML одной техкарты: фото + «Утверждаю», 9 ГОСТ-блоков (шапка, рецептура брутто/нетто/потери, технология, качество, подписи)
  - `_openTechCardsWindow(title, hint, pages, autoprint)` — открывает попап с техкартами

**Excel техкарты (ExcelJS 4.4, CDN):**
- `mvdDownloadExcel()` — ГОСТ-структура на одном листе:
  - Шапка: A1:C6 фото, D1:H6 «Утверждаю»; слияние ячеек
  - 9 блоков: общие сведения, рецептура, технология, показатели качества, пищевая ценность, подписи
  - `autoH(text, colWidthChars, minH)` — автовысота строк по тексту
  - `wrapText: true` на всех длинных ячейках
- SheetJS остался для `exportFullXLSX` (общий Excel всей базы)

**Футер «Московская школа бариста · baristaschool.ru»:**
- Добавлен во все PDF-документы: `.mbs-footer` div в конце body
- Добавлен в Excel: последняя строка, серый курсив

### Сессия 10 (7 мая 2026) — исправление печати в Safari (чёрный экран + белый лист)

**Проблема:** Safari на `file://` при вызове `window.print()` из popup-окна замораживал документ → чёрный экран; Blob URL вызывал белый лист.

**Причина:** Safari не поддерживает `window.print()` из popup-окна на `file://` протоколе.

**Решение — `_printViaIframe(html, filename)`:**
```js
// Создаём скрытый iframe в текущей странице (не попап!)
const iframe = document.createElement('iframe');
iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
document.body.appendChild(iframe);
// Пишем HTML
const doc = iframe.contentWindow.document;
doc.open(); doc.write(html); doc.close();
// Ждём загрузки картинок → print из родительского контекста
iframe.contentWindow.print();
setTimeout(() => iframe.remove(), 2000);
```

**Почему это работает в Safari:**
- `iframe.contentWindow.print()` вызывается из контекста основной страницы — Safari обрабатывает корректно
- Нет Blob URL (они замораживают страницу при печати)
- Нет popup (заблокирован браузером / даёт чёрный экран)
- Страховка: если картинки не загрузились за 3 сек — печать запускается принудительно

**Что изменено:**
- `_openTechCardsWindow` → убраны popup и Blob URL, вызывает `_printViaIframe(html)`; убрана кнопка print-bar (не нужна — диалог открывается сразу)
- `exportFullPDF` → заменён `window.open + document.write` на `_printViaIframe(html, 'mbs-finmodel')`
- Все три функции печати (`exportFullPDF`, `mvdDownloadPDF`, `exportTechCards`) теперь используют единый `_printViaIframe`

**Ключевое правило для будущего:**
> ⚠️ На `file://` в Safari НЕЛЬЗЯ использовать Blob URL или `window.print()` из popup.
> Всегда использовать `_printViaIframe(html)` — скрытый iframe в текущем документе.

### Сессия 11 (7 мая 2026) — полуфабрикаты (полная реализация)

**Новые глобальные данные:**
- `SEMI = []` — массив полуфабрикатов: `{id, name, unit, yield, process, recipe:[{mat,amt,loss?}]}`
- `nextSemiId = 1` — автоинкремент id

**Расчёты:**
- `calcSemiCostPerUnit(semi)` — себестоимость 1 единицы выхода: `∑ calcIngCost(r) / yield`
- `calcCost(drink)` — обновлён: поддерживает `{semi, amt, loss}` в рецептуре через рекурсивный вызов `calcSemiCostPerUnit`
- `calcIngCost(ing)` — обновлён аналогично

**Рецептуры напитков:**
- `matOptions(selected)` — перестроен: значения `"mat:key"` / `"semi:id"`, полуфабрикаты в `<optgroup>`
- `addIngRow(selected, amt, loss)` — принимает `"mat:key"` или `"semi:id"`, legacy-ключ автоконвертируется
- `openEditDrink(id)` — загружает ингредиенты с `r.semi != null ? "semi:${r.semi}" : "mat:${r.mat}"`
- `saveDrink()` — парсит `type:key` → `{semi: parseInt(key)}` или `{mat: key}`

**Persist:**
- `saveState()` — добавлено `semiItems: SEMI`
- `loadState()` — восстанавливает `SEMI` и `nextSemiId` из `sv.semiItems`

**CRUD полуфабрикатов:**
- `openAddSemi()` / `openEditSemi(id)` / `saveSemi()` / `deleteSemi(id)`
- `addSemiIngRow(matKey, amt, loss)` — строка MAT-ингредиента только из MAT
- `matOnlyOptions(selected)` — `<option>` только из MAT
- `_updateSemiCostPreview()` — live-расчёт стоимости в модале
- `_onSemiMatChange(selectEl)` — обновляет placeholder/step при смене сырья

**Секция полуфабрикатов в `renderCost`:**
- Сворачиваемая панель (`_semiPanelOpen`, `toggleSemiPanel()`) с ▲/▼
- Карточки: название, выход, **себестоимость/ед. выделена зелёным**
- Кнопки редактирования и удаления прямо в карточке

**modal-semi в index.html:**
- Поля: название, единица выхода, выход, список ингредиентов, описание/процесс
- Плашка `#ms-cost-preview` — live-расчёт себестоимости
- Поля `ms-unit` и `ms-yield` имеют `onchange`/`oninput` для обновления preview

**openViewDrink:**
- Ингредиент `{semi}` показывается с именем и бейджем «п/ф» (зелёный)

**_buildTechCardBlock:**
- Строки рецептуры: п/ф отмечены `[п/ф]` надстрочно
- Блок «Используемые полуфабрикаты» — расшифрованный состав каждого п/ф с таблицей и описанием

**closeModal backdrop:**
- Добавлен `'modal-semi'` в список модалов с закрытием по клику на фон

### Сессия 12 (7 мая 2026) — умный placeholder для кол-ва ингредиента

**Проблема:** пользователь не понимал, в каких единицах вводить кол-во. Например, для сырья `'Зерно эспрессо (1 кг)'` непонятно — вводить граммы или килограммы.

**Решение:** placeholder в поле кол-ва зависит от единицы сырья:
- `unit` содержит `'кг'` или `'л'` → placeholder `0.000` (подсказывает 3 знака после запятой)
- всё остальное (г, мл, шт) → placeholder `0`

**Ключевой факт:** `MAT[key].unit` хранится как `'1 кг'`, `'1 л'`, `'1 шт'` (с числом!). Поэтому используется `.includes('кг')` / `.includes('л')`, а не строгое `===`.

**Функции:**
- `_semiIngPlaceholder(matKey)` — placeholder для модала полуфабриката
- `_semiIngStep(matKey)` — шаг (`0.001` для кг/л, `1` для остальных)
- `_ingPlaceholder(val)` — placeholder для модала напитка (val = `"mat:key"` или `"semi:id"`)
- `_ingStep(val)` — шаг для модала напитка
- `_onSemiMatChange(selectEl)` — обновляет placeholder и step при смене сырья (п/ф)
- `_onIngMatChange(selectEl)` — обновляет placeholder и step при смене сырья (напиток)

**Поле кол-ва переведено на `type="text" inputmode="decimal"`** — `type="number"` в Safari не показывал placeholder. `parseFloat()` при сохранении корректно парсит текстовое значение.

**Правило для будущего:**
> ⚠️ `type="number"` placeholder не отображается в Safari (особенно на `file://`).
> Для числовых полей с placeholder использовать `type="text" inputmode="decimal"`.


### Сессия 13 (8 мая 2026) — чистка кода, перенос кнопки, удаление ТБУ

**Исправление `_syncTargetFCInputs` (commit `76d2204`):**
- Функция синхронизировала значение целевого FC% только в одном поле; исправлена для синхронизации во всех инпутах сразу

**Удаление мёртвого кода (commit `6ff1121`, −82 строки):**
- Удалены: `costSortState`, `filterCost`, `thCostSort` — сортировка/поиск по себестоимости, отдельный стейт больше не нужен
- Удалены: `toggleMatPanel`, `toggleSemiPanel`, `_matPanelOpen`, `_semiPanelOpen` — сворачиваемые панели сырья и п/ф убраны из вёрстки
- Удалена переменная `costSearch` (поиск по себестоимости)
- `_matActiveCat` и `setMatCat()` **оставлены** (используются в renderCost)

**Перенос кнопки «+ Напиток» (commit `cad73b4`):**
- Убрана из `renderDashboard()` — на дашборде кнопки добавления напитка больше нет
- Добавлена в `renderRecipes()` рядом с «PDF техкарт» — обёрнуты в `<div style="display:flex;gap:8px">`

**Удаление блока ТБУ из Финмодели (commit `ee7500f`, −26 строк):**
- Убран весь блок «Точка безубыточности (ТБУ)»: заголовок section-title, панель с тремя плашками (чашек/день, выручка/мес, запас прочности), прогресс-бар покрытия и подсказка bepFormula
- Расчёты ТБУ (`bepCalc`, `bep.*`) **остались** в коде — используются в сценариях и What-if
- `buildBEPChart()` по-прежнему существует, но не вызывается (намеренно)

### Сессия 14 — техкарты по ГОСТ + реквизиты организации + органолептика напитков

**Поля органолептики и хранения в модалке напитка (`modal-drink`):**
- Добавлены 5 новых полей: `md-storage-temp` (Температура подачи), `md-storage-life` (Срок реализации), `md-appearance`, `md-taste`, `md-consistency` (textarea, resize:vertical)
- Соответствующие поля в объекте напитка: `storage_temp`, `storage_life`, `appearance`, `taste`, `consistency`
- При редактировании старого напитка органолептика подтягивается из легаси-объекта `DRINK_QUALITY[d.id]` (фолбэк)
- Дефолты по группе: горячие/чай — «не ниже 60°C» / «15 минут»; холодные — «не выше +10°C» / «30 минут»

**Те же 5 полей для модалки полуфабриката (`modal-semi`):**
- Поля: `ms-storage-temp`, `ms-storage-life`, `ms-appearance`, `ms-taste`, `ms-consistency`
- Удалён автозаполнитель `_autoFillSemiYield` — выход вводится вручную
- В CSS добавлено `textarea.modal-inp { height: auto; line-height: 1.5; padding: 8px 12px; }`

**Реквизиты организации (новый раздел в модалке локации `modal-loc`):**
- Поля: `legalName` (Юр. название ИП/ООО), `ceoTitle` (Должность), `ceoName` (ФИО), `address` (Адрес)
- Хранятся в объекте `Loc.list[i]` рядом с `name` и `icon`
- Хелпер `getOrgInfo()` возвращает `{ name, legalName, ceoTitle, ceoName, address }` с дефолтами
- Используются во всех PDF-техкартах автоматически

**Техкарты по ГОСТ Р 53105-2008 + ТР ТС 021/2011 (`_buildTechCardBlock`):**
Структура карты переработана под требования эксперта Роспотребнадзора:
1. **Шапка** — слева: ИП/ООО, коммерч. название, адрес. Справа: «УТВЕРЖДАЮ» + должность + ФИО + дата
2. **Таблица info** — наименование, группа, выход, дата, срок реализации, температура подачи, условия хранения сырья
3. **Раздел 1. Характеристика сырья** — статичный текст про ТР ТС 021/2011
4. **Раздел 2. Рецептура** — таблица брутто/нетто/потери/стоимость
5. **Раздел 3. Технология приготовления** — текст из `d.process` или дефолт по группе
6. **Раздел 4. Требования к оформлению и подаче** — динамический текст с подстановкой объёма, температуры, срока
7. **Раздел 5. Показатели качества и безопасности** — таблица органолептики + строка про ТР ТС 021/2011 п.6.2
8. **Раздел 6. Пищевая ценность** — таблица Белки/Жиры/Углеводы/Ккал из `calcNutrition(d)`

**Сигнатура `_buildTechCardBlock(d, org, cardNum, isLast)`** — теперь принимает объект `org` вместо строки `orgName` (обратная совместимость через `typeof org === 'string'`).

**Аналогично для полуфабрикатов** — `_buildSemiTechCardBlock` использует `s.storage_temp`, `s.storage_life`, `s.appearance`, `s.taste`, `s.consistency`.

**Исправление расчёта стоимости полуфабрикатов в PDF** (показывал «0 ₽»):
- `calcIngCost(r)` для ингредиентов полуфабриката не применял `_semiUnitFactor` (коэффициент кг→г, л→мл)
- Введена локальная `_semiIngCostPDF(r)` с правильной формулой (как в `calcSemiCostPerUnit`)

**Прочие UX-исправления:**
- Кнопки очистки у всех 4 поисковых полей через JS-класс `.visible` (CSS `:has()` нестабильно)
- Авто-замена запятой на точку в полях количества ингредиентов (`oninput`)
- Блок описания режима налогообложения под селектором tax mode
- Исправлен рецепт «Какао 300» (молоко 200→250)

**Критическая ошибка инициализации (исправлена):**
- При обновлении страницы дашборд показывал белый экран
- Причина: `['dashboard','cost','sales','finmodel','recipes'].forEach(t => renderTab(t))` рендерил все 5 вкладок при старте
- Решение: рендерить только активную вкладку через `switchTab(activeTab)`; остальные — лениво при первом переключении (флаг `dirty[tab]`)
- Добавлен `try/catch` в `renderTab()` с `console.error`
- ВНИМАНИЕ: INIT-блок **НЕ оборачивать в DOMContentLoaded** — `<script>` находится в конце `<body>`, событие уже произошло

**Опечатки в полях `calcNutrition` (исправлено):**
- Возвращает `{ protein, carbs, fat, kcal }` (не `prot`/`carb`)
- Использовать `nut.protein`, `nut.carbs` в любых новых местах вывода

---

### Сессия 14 — Дополнение: баг с nameEl в renderLocSwitcherUI

**Критический баг инициализации (исправлен):**
- `renderLocSwitcherUI()` использовала `nameEl` без объявления — `ReferenceError: nameEl is not defined`
- Ошибка происходила в INIT-блоке ДО вызова `switchTab(activeTab)` — весь скрипт останавливался
- Результат: всегда отображался `tab-dashboard` (захардкожен в HTML как `class="tab active"`), пустой и не прогруженный
- Симптом у пользователя: «скидывает на первую вкладку Дашборд, которая не грузится» — на любой сохранённой вкладке

**Исправление — добавить объявление `nameEl` внутри функции:**
```js
function renderLocSwitcherUI() {
  const loc = activeLoc();
  const nameEl = document.getElementById('loc-name');  // было забыто!
  const iconEl = document.getElementById('loc-icon');
  if (loc && nameEl) nameEl.textContent = loc.name;
  if (loc && iconEl) iconEl.textContent = loc.icon || 'кофе';
  renderLocList();
}
```

**В INIT-блоке вызов обёрнут в try/catch:**
```js
try { renderLocSwitcherUI(); } catch(e) { console.error('[renderLocSwitcherUI]', e); }
```

**Правила на будущее:**
- Любые `document.getElementById(...)` внутри функций должны объявляться локально через `const el = ...`
- INIT-блок критичен — любая необработанная ошибка гасит всю инициализацию включая `switchTab()`
- Все вызовы в INIT-блоке оборачивать в try/catch

---

### Сессия 15 (8 мая 2026) — новая вёрстка вкладки «План продаж»

**Новая 2-строчная KPI-секция (коммит `267d02f`):**

Вместо одной горизонтальной строки — два ряда KPI:
- **Строка 1** `.sales-kpi-row1`: 3 карточки — «Выручка / мес» (широкая), «Прибыль / мес» (широкая, зелёная), «Чашек / день» (компактная)
- **Строка 2** `.sales-kpi-row2`: 4 элемента — «Food-cost %» (граница меняет цвет по порогу), «Средний чек», блок «Дней в месяце + ±10%»

**Таблица плана продаж — 4 колонки:**
- Убраны колонки «Выручка/день» и «Прибыль/день» — перегружали экран
- Оставлены: **Напиток** / **Порций/день** / **Выручка/мес ₽** / **Прибыль/мес ₽**
- `filterSales` пересчитан под 4 колонки (`colspan=4`)

**Новые CSS-классы:**
- `.sales-kpi-row1`, `.sales-kpi-row2` — flex-строки KPI
- `.sales-kpi-card` — базовая карточка
- `.sales-kpi-wide` — широкая карточка (flex: 2)
- `.sales-kpi-compact` — компактная (flex: 1)
- `.sales-kpi-green` — зелёная рамка (прибыль)
- `.sales-days-scale` — блок «Дней + кнопки»
- `.sales-scale-btn.red/.green` — кнопки −10% / +10%

---

### Сессия 16 (8 мая 2026) — dark mode фиксы

**`.btn-green` не существовал в CSS (коммит `f47df2b`):**
- Кнопки «+ Поставщик», «+ Сырьё», «+ Полуфабрикат», «+ Напиток» использовали класс `.btn-green` в app.js — но он не был определён в styles.css
- Добавлены правила:
  ```css
  .btn-green { background: var(--green); color: #fff; border: none; }
  .btn-green:hover { opacity: .88; }
  body.dark .btn-green { background: var(--green); color: #fff; }
  ```

**`.sales-preset-select` в тёмной теме (коммит `f47df2b`):**
- Имел `background: #fff` без dark override → белый фон в тёмной теме
- Добавлено: `body.dark .sales-preset-select { background: #3c3c3c; color: #d4d4d4; border-color: #454545; }`

---

### Сессия 17 (8 мая 2026) — мобильные UX-фиксы

**Предотвращение zoom на iOS при фокусе (коммит `36c6709`):**
- iOS Safari зумирует страницу при фокусе на полях с `font-size < 16px`
- Добавлен универсальный override внутри `@media (max-width: 768px)`:
  ```css
  input, select, textarea,
  .inp, .modal-inp, .modal-select, .sales-preset-select {
    font-size: 16px !important;
  }
  ```
- Удалены дублирующие `font-size: 15px/16px` из отдельных мобильных правил

**Исправление выпадающего меню «Моя кофейня» на iOS (коммиты `7d4f586`, `d745b1d`):**

Причина бага: `position: fixed` внутри `position: sticky` не работает на iOS Safari.
- `#loc-menu` и `#export-menu` **вынесены из хедера** в DOM — сразу после `</header>`
- CSS: `position: fixed` для обоих меню; z-index: 250 (десктоп), 350 (мобайл)
- На десктопе: `toggleLocMenu()` и `toggleExportMenu()` вычисляют позицию через `.getBoundingClientRect()` и устанавливают `top`/`left`/`right` динамически
- На мобайле: `top: 58px !important` — меню открывается прямо под шапкой

**Обновлённые функции JS:**
```js
function toggleLocMenu(e) {
  // desktop: позиционирует по getBoundingClientRect() от #loc-switcher
  // mobile: css top:58px через !important
}
function toggleExportMenu(e) {
  // desktop: позиционирует справа, привязка к #export-wrap
}
```

---

### Сессия 18 (8 мая 2026) — inputmode для всех числовых полей

**Цель:** на мобиле открывать правильную клавиатуру для каждого поля ввода.

**Правило:**
| `inputmode` | Клавиатура | Где используется |
|---|---|---|
| `numeric` | Только цифры (без точки) | Целые числа: цена, объём, кол-во, ставки, МРОТ |
| `decimal` | Цифры + точка/запятая | Дробные: БЖУ, выход п/ф, %, НДФЛ, страховые |
| `tel` | Телефонная (цифры + + # *) | Поля телефона поставщиков |

**Что добавлено/изменено:**

*index.html:*
- `md-price` (цена напитка) → `inputmode="numeric"`
- `md-vol` (объём мл) → сначала `numeric`, потом исправлено на `decimal` (объём может быть дробным)
- `mm-price`, `mm-size` (цена/объём сырья) → `numeric`
- `mm-kcal` → `numeric`; `mm-protein`, `mm-fat`, `mm-carbs` → `decimal`
- `ms-yield` (выход полуфабриката) → `decimal`
- `sup-phone`, `sup-book-phone`, `mm-sup-phone` — `type="text"` → `type="tel" inputmode="tel"`

*app.js:*
- Потери `%` в строках ингредиентов → `numeric`
- `kpi-target-fc` (целевой FC%) → `numeric`
- Стартовые вложения → `numeric`
- ФОТ: ставка, часы, смены, кол-во → `numeric`
- МРОТ → `numeric`; НДФЛ, страховые → `decimal`
- Статьи расходов: сумма → `numeric`; % от выручки → `decimal`; доля % → `numeric`

**Уже было правильно (не изменялось):**
- Поля кол-ва ингредиентов (`.ing-amt`, `.ing-yield`) — `type="text" inputmode="decimal"` ✅
- Поле порций/день в таблице продаж — `inputmode="numeric"` ✅
- Цена сырья в таблице — `inputmode="numeric"` ✅
- Цена продажи (inline) — `inputmode="numeric"` ✅
- Дни в месяце — `inputmode="numeric"` ✅


---

### Сессия 19 (9 мая 2026) — глобальный аудит app.js: 7 правок в DATA-секции

**Цель:** полный аудит всех 6330 строк `app.js` — поиск логических ошибок, расхождений данных, опечаток в рецептурах.

**Коммит:** `1e62dbd` — «fix: recipe/process audit - 7 corrections (id:2,15,16,18,19,23,25)»

---

#### Найденные и исправленные ошибки (DATA-секция, строки 1–200)

**id:2 — Капучино 300** (горячие):
- `cup350` → `cup300` (стакан 300 мл, не 350)
- `vol: 350` → `vol: 300`

**id:15 — Раф классический**:
- `cream: 30` → `cream: 35` (сливки занижены; стандарт 30–35 мл)

**id:16 — Раф фисташковый** (опечатка в `process`):
- «Добавьте ваниль...» → «Добавьте фисташку...» — описание технологии приготовления

**id:18 — Флэт уайт 160 мл**:
- `cup250` → `cup_p300` (бумажный стакан с крышкой, не фарфоровый cup250)
- `vol: 200` → `vol: 160`

**id:19 — Латте матча 350 мл**:
- `vol: 300` → `vol: 350` (несоответствие объёма названию)
- `cup350` → `cup_p300` (бумажный стакан для матча-латте)

**id:23 — Лимонад апельсиновый 400 мл**:
- `cup350` → `cup450` (400 мл не влезает в стакан 350)
- `orange: 2` → `orange: 1.5` (2 апельсина на порцию — перерасход)

**id:25 — Холодный чай персиковый 400 мл**:
- `cup350` → `cup450` (аналогично id:23)

---

#### Аудит остального кода (строки 200–6330) — ошибок не найдено

| Блок | Строки | Результат |
|------|--------|-----------|
| Render-функции, helpers, sort | 200–1450 | ✅ чисто |
| XLSX export, saveState/loadState | 1450–2050 | ✅ чисто |
| Modals CRUD (напитки, сырьё, п/ф) | 2050–3000 | ✅ чисто |
| renderCost, renderSales | 3000–3700 | ✅ чисто |
| renderFinModel, BEP chart | 3700–4500 | ✅ чисто |
| Tech cards PDF/Excel, filterRecipes | 4500–5100 | ✅ чисто |
| Payroll, state updaters, openCostEditor | 5100–5450 | ✅ чисто |
| Suppliers, WhatIf, Seasonality, Init | 5450–6330 | ✅ чисто |

**Примечания:**
- `calcPositionCosts()` — схемы белая/серая/чёрная ФОТ рассчитываются корректно
- `recalcWhatIf3()` — переменные расходы масштабируются с трафиком, постоянные — нет
- `buildSeasonalChart()` — `totalYear`, `bestMonth`, `worstMonth` корректны
- `openDropCandidates()` — критерии score логически верны

---

#### Техническое примечание: обходной путь для git push

`run_in_terminal` для git-команд падает с regex overflow (сторонний терминал содержит `group-course-block.html`). Рабочий обходной путь — bash-скрипт через create_file + run_in_terminal.


---

### Сессия 20 (9 мая 2026) — изображения, логотип, подвал, мобильное меню

---

#### 1. Система изображений для напитков

**Инфраструктура уже существовала** (обнаружено в ходе аудита):
- `d.image` поддерживается в `filterRecipes()`, `openViewDrink()`, `_buildTechCardBlock()`
- CSS классы `.recipe-card-img`, `.mvd-photo-wrap` уже присутствовали
- Modal upload UI (FileReader → base64) уже был реализован

**Сделано:**
- Создана папка `images/` в репозитории
- Добавлен объект `DRINK_IMAGES` (app.js) — маппинг id напитка → путь к файлу
- Добавлена функция `getDrinkImage(d)` — возвращает `d.image || DRINK_IMAGES[d.id] || null`
- Все 3 места рендеринга обновлены: используют `getDrinkImage(d)` + `onerror` (скрывает если файл не найден)
- Все 30 напитков получили логичные имена файлов на русском (пары 300/400 мл — общее фото)

**Файлы добавлены пользователем (16 шт):**
`Эспрессо.jpg`, `Американо.jpg`, `Капучино.jpg`, `Латте.jpg`, `Флэт уайт.jpg`,
`Моккачино.jpg`, `Раф ванильный.jpg`, `Раф апельсиновый.jpg`, `Какао.jpg`,
`Ванильное облако.jpg`, `Зелёный чай.jpg`, `Чай.jpg`, `Матча.jpg`,
`Айс-латте.jpg`, `Бамбл.jpg`, `Эспрессо -тоник.jpg` (с пробелом — исправлено в маппинге)

**Без фото:** Айс-какао, Фильтр-кофе, Пуровер — скрываются автоматически через `onerror`

**Коммиты:** `aea265b`, `d6e6633`

---

#### 2. Логотип в шапке

- Убрана иконка кофе и текст «MBS* Coffee Menu»
- **Десктоп:** `moscow barista school logo.svg` (высота 36px)
- **Мобильный** (≤768px): `MBS logo.svg` (высота 28px) — CSS `content:` override в `@media`
- На экране онбординга: логотип `moscow barista school logo.svg` вместо иконки+текста

**Коммиты:** `7176a3c`, `92099b3`

---

#### 3. Подвал (footer)

**Структура:**
- Десктоп: 3 колонки — Контакты | Логотип + соцсети | Адрес
- Мобильный: тёмная полоса — логотип MBS + 4 иконки (телефон, Instagram, Telegram, карта) + адрес

**Контакты:**
- Телефон: +7 995 999-28-36
- Сайт: baristaschool.ru
- Instagram: instagram.com/barista_school
- Telegram: t.me/moscowbaristaschool
- Адрес: м. Бауманская, Нижняя Красносельская 35 стр. 50
- Яндекс.Карты: yandex.ru/maps/org/206204133172

**Проблемы и исправления по итерациям:**
1. Иконки не отображались → заменены `<i data-lucide>` на inline SVG (footer был после `<script>`)
2. Footer перенесён ДО `<script src="app.js">` — иконки начали работать
3. Мобильный footer перекрывался таббаром → `padding-bottom: calc(72px + env(safe-area-inset-bottom))`
4. Цвет подвала: тёмный `#1e2820` → `var(--navy)` (как шапка) — согласованность
5. Зелёные тексты не читались на зелёном фоне → все тексты/иконки переведены в белый
6. Тёмная тема: подвал оставался зелёным (`--navy` в dark = `#89d185`) → `body.dark .footer-desktop/mobile { background: #252526 !important }`
7. Иконка адреса убрана (была «съехавшая»)
8. Год: 2025 → 2026

**Финальное состояние:**
- Светлая тема: фон `var(--navy)` (#417033) = шапка, тексты белые
- Тёмная тема: фон `#252526` = как все блоки

**Коммиты:** `140fe45`, `3ff13d5`, `fffa035`, `a9b149a`, `f024ab9`, `5783796`, `723d457`

---

#### 4. Мобильное нижнее меню (таббар)

**До:** простая плашка `var(--navy)` с тонкой белой линией на активной вкладке

**После (редизайн):**
- Стеклянный фон: `rgba(55, 90, 43, 0.92)` + `backdrop-filter: blur(16px)`
- Тонкая верхняя граница: `rgba(255,255,255,.08)`
- Активная вкладка: pill-подсветка `rgba(255,255,255,.14)` + `border-radius: 12px`
- Активная иконка: поднимается `translateY(-1px)` + мягкое свечение `drop-shadow`
- Неактивные: `rgba(255,255,255,.5)`, плавная анимация `.2s`
- Gap между кнопками, `border-radius` у каждой кнопки
- Тёмная тема: `rgba(30,30,30,.92)` с blur

**Коммит:** `b4e3685`

---

#### Итоговые коммиты сессии 20

| Коммит | Описание |
|--------|----------|
| `aea265b` | feat: add images/ folder + DRINK_IMAGES mapping |
| `d6e6633` | feat: add drink images (16 photos) + fix espresso-tonic filename |
| `7176a3c` | feat: replace header text with MBS logo SVG |
| `92099b3` | feat: use MBS logo.svg in mobile header |
| `140fe45` | feat: add footer — desktop card + mobile dark bar |
| `3ff13d5` | fix: footer icons via inline SVG, dark desktop, mobile above tabbar |
| `fffa035` | fix: footer year 2026, restore dark desktop CSS, fix addr icon |
| `a9b149a` | fix: footer matches header color, remove addr icon |
| `f024ab9` | fix: footer all text/icons white for readability on green bg |
| `5783796` | fix: footer dark theme uses dark gray #252526 |
| `723d457` | fix: footer dark theme force gray bg (!important) |
| `b4e3685` | feat: redesign mobile tabbar — glass blur, pill active state |



---

### Сессия 21 (9 мая 2026) — мобильный UX: клик по строке, создание ингредиента, мобильная вёрстка строк

---

#### 1. Клик по строке для редактирования (без кнопки карандаша)

**Коммит:** `3ab8cf2`

- **Полуфабрикаты** (`<tr>`): карандаш-кнопка убрана — `<tr>` уже имел `onclick="openEditSemi(…)"`
- **Сырьё** (`.mat-row-custom`): добавлен `onclick="openEditMat('${key}')"` на `<tr>`, `event.stopPropagation()` на кнопках цены/удаления/инпуте цены
- CSS: `.mat-row-custom:hover td { background: var(--light); }` + `cursor: pointer`

---

#### 2. Создание ингредиента прямо из дропдауна рецептуры напитка

**Коммит:** `2e8c324`

- `matOptions(selected)`: добавлена опция `＋ Создать ингредиент...` (value=`__create_mat__`) в начале списка
- `_onIngMatChange(selectEl)`: перехватывает `__create_mat__`, сохраняет `selectEl` в глобальный `_pendingMatSelectEl`, открывает `modal-mat`
- `saveMat()`: после сохранения — если `_pendingMatSelectEl` установлен, обновляет тот select новым ингредиентом и сбрасывает переменную
- `cancelMat()`: сбрасывает `_pendingMatSelectEl`, закрывает `modal-mat`
- CSS: `#modal-mat.open { z-index: 1100 }` — стакируется поверх `modal-drink` (z-index 1000)
- `index.html`: кнопки закрытия `modal-mat` заменены с `closeModal('modal-mat')` на `cancelMat()`

---

#### 3. Placeholder и пунктирная граница для пустых строк ингредиентов

**Коммит:** `eb1bf3c`

- `matOptions(selected)`: добавлена `<option disabled>— Выберите ингредиент —</option>` (selected когда нет выбранного)
- `addIngRow()`: новая строка получает класс `ing-select-empty` при отсутствии выбора
- CSS: `.ing-select-empty { color: var(--muted); border-style: dashed; }`
- `_onIngMatChange()`: убирает класс `ing-select-empty` после выбора, сохраняет `dataset.prev`

---

#### 4. Фикс скролла/позиции на iOS Safari при открытии модальных окон

**Коммит:** `a7a924c`

**Проблема:** `body { position: fixed }` сбрасывал позицию прокрутки — после закрытия модала страница прыгала в начало.

**Решение:**
- `openModal()`: заменено `body.style.position = 'fixed'` на `document.documentElement.classList.add('modal-open')`; сохраняется `scrollY` в `documentElement.dataset.scrollY`
- `closeModal()`: читает `documentElement.dataset.scrollY`, восстанавливает `window.scrollTo`, убирает класс `modal-open`
- CSS: `html.modal-open { overflow: hidden; }` (не body)

---

#### 5. КБЖУ перенесён выше блока поставщика в modal-mat

**Коммит:** `767b198`

- В `index.html` (`modal-mat`): `<details>` с КБЖУ теперь стоит **перед** блоком поставщика
- Блок «Нет нужного? Завести нового поставщика» раскрывается вниз к подвалу модала

---

#### 6. Модальные окна — flex-layout на мобильном: скролл внутри, футер прижат к низу

**Коммит:** `ebdb766`

**HTML (`index.html`):**
- Контент `modal-drink`, `modal-mat`, `modal-semi`, `modal-drink-view` обёрнут в `<div class="modal-body">`

**CSS (мобильный, ≤768px):**
- `.modal { display: flex; flex-direction: column; overflow: hidden; }`
- `.modal-title { flex-shrink: 0; border-bottom: 1px solid var(--border); }`
- `.modal-body { flex: 1; overflow-y: auto; padding: 16px; }`
- `.modal-footer { flex-shrink: 0; border-top: 1px solid var(--border); }`
- Убран `position: sticky` с `.modal-footer` на мобильном

**CSS (десктоп):**
- `.modal-body { display: contents; }` — прозрачная обёртка, дети «выпадают» в поток модала

---

#### 7. Строка ингредиента на мобильном — CSS Grid, метки через `::before`

**Финальный коммит:** `32ee8db`

**Структура строки (`addIngRow` в app.js):**

```
<select class="modal-select ing-mat-select …">…</select>
<button class="modal-ing-del">🗑</button>
<div class="ing-inp-wrap" data-label="Кол-во"><input …></div>
<div class="ing-inp-wrap" data-label="Потери"><input …></div>
<span class="ing-cost-hint"></span>
```

**Десктоп CSS:** `.ing-inp-wrap { display: contents; }` — дети в 5-колоночный grid родителя

**Мобильный CSS (≤768px):**
- `modal-ing-row` = CSS Grid `1fr 44px`, 3 ряда:
  - Ряд 1: select (col 1) + trash (col 2)
  - Ряд 2: ing-inp-wrap:nth-of-type(1) (col 1) + ing-inp-wrap:nth-of-type(2) (col 2)
  - Ряд 3: ing-cost-hint (col 1/-1)
- `.ing-inp-wrap::before { content: attr(data-label); }` — метки «Кол-во» / «Потери»

**Вспомогательное:**
- `_onIngMatChange()`: ищет поле кол-ва через `row.querySelector('.ing-inp-wrap input')`
- Промежуточные итерации (`4214a31`, `ab51a80`, `bdae501`, `a11a93c`) — попытки с обёртками div; финально — `display: contents` на десктопе и CSS Grid на мобильном без лишних обёрток

---

#### Итоговые коммиты сессии 21

| Коммит | Описание |
|--------|----------|
| `3ab8cf2` | ux: click row to edit ingredient/semi, remove pencil buttons |
| `2e8c324` | feat: create ingredient directly from recipe card dropdown |
| `eb1bf3c` | ux: ingredient select placeholder + dashed border for empty rows |
| `a7a924c` | fix: iOS Safari touch coords — html overflow:hidden instead of body fixed |
| `767b198` | ux: move KBZHU block above supplier in mat modal |
| `ebdb766` | fix: modal flex layout on mobile — scrollable body, footer pinned |
| `4214a31` | ux: add qty/loss labels in ingredient rows on mobile |
| `ab51a80` | fix: ingredient row mobile layout — trash inline with inputs |
| `bdae501` | fix: ing row mobile — select+trash on top, labeled qty/loss below |
| `a11a93c` | fix: ing row full width on mobile |
| `32ee8db` | fix: ing row mobile — CSS grid, no wrapper divs, labels via ::before |

---

### Сессия 22 (9 мая 2026) — фикс десктопной вёрстки строки ингредиента

**Коммит:** `e1ffd59`

**Проблема:** после мобильных правок сессии 21 десктопная строка ингредиента ломалась — элементы переносились на вторую строку вместо одной горизонтальной линии.

**Причина:** мобильный `@media` устанавливал явный `grid-row: 2` на `nth-child(3)` и `nth-child(4)`. Десктопные правила не имели `grid-row: 1` — grid auto-placement сохранял row-2 из медиа-каскада.

**Структура строки (напоминание):**
```
child 1: <select class="modal-select">    → grid-column: 1
child 2: <button class="modal-ing-del">  → grid-column: 5
child 3: <div class="ing-inp-wrap" data-label="Кол-во"> → grid-column: 2
child 4: <div class="ing-inp-wrap" data-label="Потери"> → grid-column: 3
child 5: <span class="ing-cost-hint">    → grid-column: 4
```

**Десктопный grid:** `grid-template-columns: 1fr 90px 90px 52px 32px`

**Финальный CSS десктопа (вне media-query):**
```css
.modal-ing-row {
  display: grid;
  grid-template-columns: 1fr 90px 90px 52px 32px;
  gap: 8px;
  align-items: center;
  margin-bottom: 6px;
}
.ing-inp-wrap { display: block; }
.modal-ing-row > :nth-child(1) { grid-column: 1; grid-row: 1; }
.modal-ing-row > :nth-child(2) { grid-column: 5; grid-row: 1; }
.modal-ing-row > :nth-child(3) { grid-column: 2; grid-row: 1; }
.modal-ing-row > :nth-child(4) { grid-column: 3; grid-row: 1; }
.modal-ing-row > :nth-child(5) { grid-column: 4; grid-row: 1; }
.modal-ing-row .modal-inp, .modal-ing-row .modal-select { width: 100%; margin: 0; }
.modal-ing-row .ing-inp-wrap .modal-inp { width: 100%; margin: 0; }
```

**Ключевые правила:**
- `grid-row: 1` явно на всех 5 дочерних элементах — нейтрализует row-2 из мобильного каскада
- Переход с `nth-of-type` на `nth-child` — надёжнее для смешанных типов элементов (div/span/button/select)
- `display: block` на `.ing-inp-wrap` (не `display: contents`) — избегает ненадёжного поведения contents в некоторых браузерах

**Мобильный CSS (НЕ изменялся):**
```css
@media (max-width: 768px) {
  .modal-ing-row { grid-template-columns: 1fr 44px; grid-template-rows: auto auto auto; }
  .modal-ing-row > :nth-child(3) { grid-column: 1; grid-row: 2; }
  .modal-ing-row > :nth-child(4) { grid-column: 2; grid-row: 2; }
  .modal-ing-row .ing-inp-wrap { display: flex; flex-direction: column; gap: 3px; }
  .modal-ing-row .ing-inp-wrap::before { content: attr(data-label); … }
  .modal-ing-row .ing-cost-hint { grid-column: 1/-1; grid-row: 3; }
}
```

**Итог:** десктоп — одна строка: Ингредиент | Кол-во | Потери | Цена | 🗑. Мобильный — 3 ряда с метками. Оба работают корректно.


---

### Сессия 23 (9 мая 2026) — защита модалов от случайного закрытия

**Цель:** предупреждать пользователя перед закрытием модала, если в форме были изменения.

#### Система «dirty tracking»

```js
const _EDITABLE_MODALS = new Set(['modal-drink','modal-semi','modal-mat','modal-supplier','modal-supplier-book','modal-loc']);
const _dirtyModalSet   = new Set();
```

API: `_markModalDirty(id)` / `_clearModalDirty(id)` / `_isModalDirty(id)`

Делегированные слушатели на документе — любое `input`/`change` внутри `.modal-bg` → `_markModalDirty(modal.id)`. При открытии модала (`openEditDrink`, `openEditSemi`) `_markModalDirty` **не вызывается** — dirty только от реальных действий пользователя.

#### Перехват закрытия

`closeModal(id)` — первым делом проверяет `_isModalDirty(id)`, показывает `_showUnsavedWarning(id)` и делает `return` (модал остаётся открытым). Аналогично `safeCloseModal(id)` — для кнопок «×»/«Отмена»/Escape.

Клик по backdrop: делегированный `document.addEventListener('click', ...)` вызывает `safeCloseModal(e.target.id)`.

#### Оверлей предупреждения

HTML с классами `._unsaved-box`, `._unsaved-stay`, `._unsaved-close`. Функции: `_dismissUnsavedWarning()`, `_forceCloseModal(id)` (clear + close).

Все функции сохранения/удаления вызывают `_clearModalDirty(id)` до `closeModal`.

Кнопки «×»/«Отмена» в `modal-drink`, `modal-semi`, `modal-loc`, `modal-supplier` → `safeCloseModal('...')`.

#### Коммиты

| Коммит | Описание |
|--------|---------|
| `dee65c2` | feat: warn before closing modals with unsaved changes |
| `c2d2555` | feat: custom inline unsaved warning bar |
| `3fc7c86` | fix: warning as centered overlay |
| `42be2ab` | fix: dirty check inside closeModal itself |
| `957e83e` | fix: don't mark dirty on modal open — only on actual user input |

---

### Сессия 24 (9 мая 2026) — адаптация предупреждения под тёмную тему

**Коммит:** `1dadd82`

Инлайн-стили оверлея вынесены в CSS-классы `styles.css`. Добавлены правила `body.dark`:

```css
body.dark ._unsaved-box   { background: #1e1e1e; box-shadow: 0 8px 40px rgba(0,0,0,.55); }
body.dark ._unsaved-title { color: #e8e8e8; }
body.dark ._unsaved-sub   { color: #888; }
body.dark ._unsaved-stay  { background: #2a2a2a; border-color: #444; color: #d4d4d4; }
body.dark ._unsaved-stay:hover  { background: #333; border-color: #666; }
body.dark ._unsaved-close { background: #c0392b; }
body.dark ._unsaved-close:hover { background: #a93226; }
```

Добавлены hover-эффекты для светлой темы (`._unsaved-stay:hover`, `._unsaved-close:hover`).


---

### Сессия 25 (10 мая 2026) — рефакторинг монолита app.js → ES-модули (Vite)

**Цель:** разбить монолит `public/app.js` (7286 строк) на 30 ES-модулей в `src/`, добавить сборку через Vite 5.4.

---

#### Результат

- **Удалён:** `public/app.js` (коммит `05a6bf2`)
- **Создано:** 30 файлов в `src/` (дерево см. раздел 2)
- **Сборка:** 33 модуля, ~227.57 kB, 381ms — зелёная
- **Коммиты:** 20 штук (`9bfb9be` → `b06994b`)

---

#### Паттерн выставления функций в `window`

Все функции, которые вызываются из inline-обработчиков HTML (`onclick="..."`, `oninput="..."`), должны быть глобальными. В `src/main.js` они выставляются двумя способами:

```js
// 1. Явный Object.assign для ключевых функций
Object.assign(window, { switchTab, renderTab, ... });

// 2. Массовый экспорт через _srcExports
import * as _srcExports from './ui/misc.js';
Object.entries(_srcExports).forEach(([k, v]) => { window[k] = v; });
```

**Правило:** если добавляется новая функция, вызываемая из HTML — либо добавить явно в `Object.assign`, либо убедиться, что файл попадает в `_srcExports`.

---

#### Инициализация в `main.js`

```js
// Восстанавливаем активную вкладку из localStorage
const _savedTab = localStorage.getItem('mbs_active_tab') || 'dashboard';
window.activeTab = _savedTab;   // ← ОБЯЗАТЕЛЬНО до switchTab()

loadLocIndex();
SEMI.push(...loadSemiItems());
try { renderLocSwitcherUI(); } catch(e) { console.error(e); }
switchTab(_savedTab);           // ← использует window.activeTab
initTooltips();
initKeyboardNav();
```

---

#### Исправленные runtime-баги (коммит `b06994b`)

| Баг | Причина | Исправление |
|-----|---------|------------|
| Бесконечная рекурсия `switchTab` | `src/ui/updaters.js` вызывал `window.switchTab(tab)` вместо реальной реализации | Заменён на настоящую реализацию: переключение `.active`-классов + `window.activeTab = tab` + `localStorage` |
| `window.activeTab` не устанавливался | Нигде не присваивался до `switchTab()`, `flashCells()` читал `undefined` | Добавлено `window.activeTab = _savedTab` в `main.js` до вызова `switchTab()` |
| Налог не считался в PDF-экспорте | В `src/ui/misc.js`: `typeof calcTax === 'function'` всегда `false` (`calcTax` — локальная функция рендер-модуля, не глобальная) | Заменён на инлайн-расчёт через `window.S.taxMode` напрямую в `exportFullPDF` и `exportMaterialsPDF` |

**Ключевой факт:** `calcTax` — это локальная функция внутри каждого рендер-модуля (`render/finmodel.js`), она **не** выставляется в `window`. При написании нового кода в `misc.js` использовать инлайн-расчёт налога или импортировать явно.

---

#### Архитектурные правила после рефакторинга

1. **`src/main.js`** — единственная точка входа. Импортирует все модули, выставляет `window.*`, вызывает INIT.
2. **Нет циклических импортов.** Зависимости: `data/` ← `state/` ← `utils/` ← `render/` ← `ui/`.
3. **`window.activeTab`** устанавливается в `main.js` и обновляется в `switchTab()` (`ui/updaters.js`).
4. **ExcelJS** лениво подключается из локального `/vendor/exceljs/exceljs.min.js` через `ensureExcelJS()` — **не** через npm/import. После загрузки доступен как глобальный `ExcelJS`.
5. **`public/app.js` удалён** — не восстанавливать. Весь код живёт в `src/`.

---

#### Коммиты сессии 25

| Коммит | Описание |
|--------|----------|
| `9bfb9be` | refactor: move generateInsights → src/ui/misc.js |
| `d8606f4` | refactor: move exportFullPDF/XLSX → src/ui/misc.js |
| `e3e68d6` | refactor: move exportSuppliersPDF/XLSX + exportMaterialsPDF/XLSX → src/ui/misc.js |
| `663dff1` | refactor: move payroll/seasonality/dropCandidates/onWhatIf → src/ui/misc.js |
| `513f813` | refactor: move buildBEPChart → src/ui/misc.js |
| `ec9a406` | refactor: replace _matDisplayUnit proxy with real impl in misc.js |
| `7351b54` | refactor: move supplier modal/list functions → src/ui/suppliers.js |
| `e813200` | refactor: move payroll functions → src/ui/payroll.js |
| `c083517` | refactor: move cost-table UI + cost editor → src/ui/cost-table.js |
| `45fb353` | refactor: move openPriceHistory/onWhatIf3/seasonal → src/ui/misc.js |
| `2d5cbed` | recipe-view.js + techcards.js: openViewDrink/mvd/techCards blocks |
| `41850bc` | modals/drink/mat/semi + ui/modals/ingredients: move 50 funcs |
| `1e894c4` | app.js: remove 46 already-migrated funcs (−1637 lines) |
| `7ca0205` | data: extract MAT/DRINKS/constants → src/data/*.js |
| `22bab6b` | state: S/Loc/DEFAULTS/resetGlobalsToBase → store.js |
| `0ce7caa` | fix: export _wif/EMP_TYPE_LABELS to window; clean Object.assign |
| `5ce7bd8` | refactor: INIT/tooltip/kb-nav → src/main.js |
| `d3742aa` | refactor: UI state → src/state/ui-state.js |
| `05a6bf2` | refactor: event wiring → src/ui/events.js; **delete public/app.js** |
| `b06994b` | fix: 3 runtime bugs — switchTab recursion, window.activeTab, calcTax in PDF export |


---

### Сессия 26 (10 мая 2026) — три хотфикса: ФОТ, ABC-легенда, фокус инпутов

#### 1. Настройки налогообложения не пересчитывали ФОТ (коммит `94d13ce`)

**Проблема:** изменение МРОТ, НДФЛ% и страховых взносов в блоке «Настройки налогообложения» не давало эффекта — строки позиций ФОТ и итоговая сумма не обновлялись.

**Причина:** `onPayrollSetting()` в `src/ui/misc.js` вызывала `window._refreshPayrollRow(p.id)` и `window._refreshPayrollSummary()`, однако эти функции не были выставлены в `window` — они существовали только как локальные экспорты `src/ui/payroll.js`.

**Исправление:** в `src/main.js` добавлены импорт и выставление в `window`:
```js
import { ..., _refreshPayrollRow, _refreshPayrollSummary } from './ui/payroll.js';
window._refreshPayrollRow    = _refreshPayrollRow;
window._refreshPayrollSummary = _refreshPayrollSummary;
```

---

#### 2. ABC-легенда в одну строку на мобильном (коммит `01e045a`)

**Проблема:** на узком экране три пункта легенды ABC (A / B / C) отображались в одну горизонтальную строку — текст обрезался.

**Исправление** в `src/render/dashboard.js`:
- Заголовок «Легенда ABC» — `display:block` (не inline)
- Каждый пункт вынесен в отдельный `<div>` вместо `<span>`
- Обёртка легенды: `flex-direction:column; gap:4px`

---

#### 3. Фокус слетал при вводе в поля МРОТ/НДФЛ/взносы (коммит `fb0cbb7`)

**Проблема:** при каждом нажатии клавиши в инпутах МРОТ, НДФЛ%, страховых взносов — фокус уходил с поля, невозможно было ввести многозначное число.

**Причина:** инпуты имели `oninput="onPayrollSetting(...)"` → внутри вызывался `window.renderFinModel()` (полный ре-рендер финмодели) → текущий `<input>` уничтожался и пересоздавался → фокус терялся.

**Исправление** в `src/render/finmodel.js` — `oninput` → `onchange` на трёх инпутах:
```html
<!-- БЫЛО -->
<input ... oninput="onPayrollSetting('mrot',this.value)">
<input ... oninput="onPayrollSetting('ndfl',this.value)">
<input ... oninput="onPayrollSetting('ins',this.value)">

<!-- СТАЛО -->
<input ... onchange="onPayrollSetting('mrot',this.value)">
<input ... onchange="onPayrollSetting('ndfl',this.value)">
<input ... onchange="onPayrollSetting('ins',this.value)">
```

**Результат:** ре-рендер происходит только при уходе из поля (Tab / Enter / клик в другое место). Ввод многозначных чисел работает без потери фокуса.

**Правило для будущего:**
> ⚠️ Если `oninput` вызывает функцию с полным ре-рендером DOM — заменить на `onchange`. Иначе фокус теряется при каждом нажатии клавиши.

---

#### Коммиты сессии 26

| Коммит | Описание |
|--------|----------|
| `94d13ce` | fix: export _refreshPayrollRow/_refreshPayrollSummary to window |
| `01e045a` | fix: ABC legend — each item on new line (mobile) |
| `fb0cbb7` | fix: oninput→onchange in payroll settings inputs (focus loss) |

---

### Сессия 27 (11 мая 2026) — layout fix: body flex + .main width

**Проблема:** после добавления sticky-footer (`ec9c8f9`) появилась регрессия — вкладки Дашборд, Продажи, Поставщики отображались узко на десктопе и шире viewport на мобайле. Рецептуры и Финмодель выглядели корректно (широкий grid-контент распирал `.main` до полной ширины).

**Корневая причина:** `body { display: flex; flex-direction: column }` превращает `<main class="main">` в flex-child. Свойство `margin: 0 auto` на flex-child **не** растягивает его до полной ширины — он сжимается до ширины содержимого.

**Исправление** (`styles.css`, одна строка):
```css
/* БЫЛО: */
.main { flex: 1; }

/* СТАЛО: */
.main { flex: 1; width: 100%; }
```

`width: 100%` заставляет `.main` занять всю ширину flex-контейнера, после чего `max-width: 1440px` и `margin: 0 auto` работают как ожидается.

**Правило для будущего:**
> ⚠️ При `body { display: flex; flex-direction: column }` все дочерние блоки-обёртки (`.main`, `.container` и т.п.) **обязательно** должны иметь `width: 100%`. Иначе `margin: 0 auto` будет сжимать их до ширины контента.

#### Коммиты сессии 27

| Коммит | Описание |
|--------|----------|
| `7bbfcb0` | fix: .main width 100pct — restore full-width layout on dashboard/sales/suppliers tabs |

---

### Сессия 28 (11 мая 2026) — инлайн SVG в строках таблицы Дашборда

**Проблема:** после сортировки таблицы «Обзора» исчезали SVG-иконки в кнопках строк — корзина (🗑), сброс (↺) и карандаш (✏).

**Причина:** иконки были реализованы через `<i data-lucide="trash-2">` / `<i data-lucide="rotate-ccw">` / `<i data-lucide="pencil">`. Функция `renderDashboard()` полностью перезаписывает `innerHTML` контейнера вкладки — `lucide.createIcons()` инициализирует иконки при старте, но не вызывается повторно после каждого ре-рендера.

**Анатомия `app.js`:** в файле существуют **две копии** генерации HTML строк:
- Первая (~строка 3347) — в `renderDashboard()` (основной рендер + сортировка)
- Вторая (~строка 3502) — в `filterDashboard()` (поиск по названию)

**Решение:** заменить `<i data-lucide>` на инлайн SVG в обеих копиях в `app.js` и в `src/render/dashboard.js`.

**Инлайн SVG-константы (для справки):**
```js
// trash-2 (13×13)
const _svgTrash = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`;

// rotate-ccw (13×13)
const _svgRotateCcw = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`;

// pencil (11×11, margin-left:5px, color:var(--muted))
const _svgPencil = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left:5px;color:var(--muted)"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
```

**Правило для будущего:**
> ⚠️ При полном ре-рендере через `innerHTML` иконки Lucide (`<i data-lucide>`) не переинициализируются автоматически. Использовать **инлайн SVG** в шаблонных строках рендер-функций.

**Изменённые файлы:**
- `HTML_coffee_menu/app.js` — две копии (`renderDashboard` + `filterDashboard`): `<i data-lucide>` → инлайн SVG; в первой копии константы `_svgTrash`, `_svgRotateCcw`, `_svgPencil`; во второй — `_svgT`, `_svgR`, `_svgP` (чтобы избежать конфликта имён в одной функции)
- `HTML_coffee_menu/src/render/dashboard.js` — аналогично (был исправлен ранее в этой же сессии)

#### Коммиты сессии 28

| Коммит | Описание |
|--------|----------|
| `fe93747` | fix: inline SVG icons in dashboard rows (no disappear on sort) |

---

### Сессия 29 (11 мая 2026) — мобильный тулбар рецептур + карточки с фото

#### 1. Порядок элементов в мобильном тулбаре рецептур

**Проблема:** на мобильном экране (≤700px) элементы тулбара отображались в неудобном порядке — сначала поиск, потом фильтры (табы категорий), потом сортировка. Оптимальный порядок: сортировка → фильтры → поиск.

Дополнительно: фильтр-кнопки (табы категорий) горизонтально скроллились, выезжая за пределы экрана.

**Решение** — CSS `order` без изменений HTML (`src/render/recipes.js`):

```css
@media (max-width: 700px) {
  .recipes-toolbar-main { flex-wrap: wrap; gap: 8px; }

  /* Сортировка — первая, над табами */
  .recipes-toolbar-main .recipes-toolbar-sort { order: 1; margin-left: 0; }

  /* Табы (фильтры) — вторые, на всю ширину, flex-wrap */
  .recipes-toolbar-main .recipe-filter-btns {
    order: 2; width: 100%;
    flex-wrap: wrap !important; overflow-x: visible !important; gap: 5px;
  }

  /* Поиск — последний, на всю ширину */
  .recipes-toolbar-main .search-wrap {
    order: 3; min-width: 100% !important; max-width: 100% !important;
  }
}
```

**Коммиты:** `cf444a3` (фильтры выше поиска, без горизонтального скролла), `74cd780` (сортировка над табами)

---

#### 2. Внешний вид карточки рецепта с фото

**Проблема:**
1. Название напитка вплотную прилегало к фотографии — `margin-bottom: 0` у `.recipe-card-img`
2. Углы фотографии в карточке были скруглены по отдельному `border-radius: 12px 12px 0 0` — избыточно, т.к. `overflow: hidden` на карточке уже обрезает углы по скруглению карточки

**Исправление** (`styles.css`):

```css
/* БЫЛО: */
.recipe-card-img { margin: -16px -18px 0; aspect-ratio: 4/3; overflow: hidden; border-radius: 12px 12px 0 0; }

/* СТАЛО: */
.recipe-card-img { margin: -16px -18px 14px; aspect-ratio: 4/3; overflow: hidden; border-radius: 0; }
```

- `margin-bottom: 0` → `14px` — отступ между фото и названием
- `border-radius: 12px 12px 0 0` → `0` — скругление не нужно, `overflow: hidden` на `.recipe-card` обрезает фото по углам карточки

**Коммит:** `fd6d897`

---

#### Итоговые коммиты сессии 29

| Коммит | Описание |
|--------|----------|
| `cf444a3` | fix: recipe toolbar mobile — filter-btns above search, no hscroll |
| `74cd780` | fix: recipe toolbar mobile — sort above filter tabs |
| `fd6d897` | fix: recipe-card-img — remove border-radius, add margin-bottom 14px |
| `78d2391` | fix: remove overflow:hidden from .recipe-card (ошибочный) |
| `476686a` | revert: restore overflow:hidden on .recipe-card (обрезка фото по углам) |

---

### Сессия 30 (12 мая 2026) — fix: модалка полуфабриката

**Проблема:** в модалке «Новый полуфабрикат» при вводе количества ингредиента поле «Цена» оставалось пустым, ячейка «Потери» не пересчитывала данные.

**Причина:** `addSemiIngRow` генерировала HTML-строку с inline-обработчиками:
```html
<input oninput="_updateSemiIngCost(this);_autoCalcSemiIngYield(this)">
<select onchange="_onSemiMatChange(this);_updateSemiIngCost(this)">
```
В Vite-сборке модульные функции не гарантированно попадают в `window`, имена могут минифицироваться — inline-строки не находили функций.

**Исправление** (`src/modals/semi.js`):
- Убраны все `oninput=`, `onchange=`, `onclick=` из HTML-строки
- После `wrap.appendChild(row)` навешены `addEventListener` напрямую на DOM-элементы внутри замыкания функции:
```js
matSel.addEventListener('change', () => { _onSemiMatChange(matSel); _updateSemiIngCost(matSel); });
amtInp.addEventListener('input', () => { amtInp.value = amtInp.value.replace(',','.'); _updateSemiCostPreview(); _updateSemiIngCost(amtInp); _autoCalcSemiIngYield(amtInp); });
lossInp.addEventListener('input', () => { _updateSemiCostPreview(); _updateSemiIngCost(lossInp); _autoCalcSemiIngYield(lossInp); });
delBtn.addEventListener('click', () => { row.remove(); _updateSemiCostPreview(); });
```

**Правило (добавлено в copilot-instructions):** в Vite ES-модулях избегать inline `oninput="moduleFn(this)"` для функций из модулей. Использовать `addEventListener` внутри замыкания — функции вызываются напрямую, без зависимости от `window`.

**Коммиты:**

| Коммит | Описание |
|--------|----------|
| `f5acd41` | fix: add _updateSemiIngCost and _autoCalcSemiIngYield to window exports |
| `864eb24` | fix: use addEventListener in addSemiIngRow instead of inline oninput globals |


---

### Сессия 31 (12 мая 2026) — категории ингредиентов и п/ф: добавление, редактирование, удаление

**`S.customCategories`** — словарь пользовательских и переопределённых категорий ингредиентов:
- Ключи `cat_*` — новые категории пользователя
- Базовые ключи (`coffee`, `dairy`, `tea`, …) — переопределение через `saveCategory()` в `src/modals/mat.js`

**`S.semiCustomCategories`** — аналогично для п/ф:
- Ключи `scat_*` — новые категории
- Базовый ключ `semi_default` — переопределение через `saveSemiCategory()`

Логика слияния:
```js
const ALL_CATS = { ...MAT_CATEGORIES, ...(S.customCategories || {}) };
```

CRUD (`src/modals/mat.js`): `openAddCategory`, `saveCategory`, `openEditCategory(key)`, `deleteCategory(key)`
Аналоги п/ф (`src/modals/semi.js`): `openAddSemiCategory`, `saveSemiCategory`, `openEditSemiCategory(key)`, `deleteSemiCategory(key)`

Кнопка «Удалить» в модалке: красная заливка `background:var(--red,#e74c3c);color:#fff`. Скрыта для базовых категорий.

| Коммит | Описание |
|--------|----------|
| `b38b296` | feat: edit/delete categories for materials and semis |
| `5f7ecaf` | fix: make delete category buttons filled red (visible) |

---

### Сессия 32 (12 мая 2026) — редактирование базовых категорий + карандаш вправо

**Карандаш вправо:** flex-контейнер в `<td>`, spacer `<span style="flex:1">`, кнопка в конце. Показывается для ВСЕХ категорий (убрана проверка `isCustomMatCat`/`isCustomSemiCat`).

**Базовые категории редактируемые:** `openEditCategory`/`openEditSemiCategory` читают из merged `ALL_CATS`. `isBuiltin=true` → кнопка «Удалить» скрыта. `saveCategory`/`saveSemiCategory` при `isBase` сохраняют override в `S.customCategories`/`S.semiCustomCategories`.

| Коммит | Описание |
|--------|----------|
| `d2aef0f` | feat: pencil right-aligned, base categories editable |

---

## 11. Деплой и внешние сервисы

### Архитектура деплоя

```
https://baristaschool.ru/landing  (landing.html)
        ↓ Google / email auth
        ↓ onAuthSuccess → 1.5 сек
https://html-coffee-menu.vercel.app  (Vite-приложение)
```

### Vite-приложение (CaféDesk)

| Параметр | Значение |
|---|---|
| URL | `https://html-coffee-menu.vercel.app` |
| Платформа | Vercel |
| Репозиторий | `rookman13-roman21/html-coffee-menu`, ветка `main` |
| Авто-деплой | При каждом `git push` в `main` |

### Firebase

| Параметр | Значение |
|---|---|
| Проект | `moscow-barista-school` |
| authDomain | `moscow-barista-school.firebaseapp.com` |
| SDK | Firebase compat v10.12.0 (CDN, только в `landing.html`) |
| Authorized domains | `baristaschool.ru`, `localhost` |

### landing.html (лендинг + авторизация)

- **Расположение в репо:** `HTML_coffee_menu/landing.html`
- **Хостинг:** `https://baristaschool.ru/landing` (партнёрский домен MBS)
- **Технология:** Standalone HTML (~1120 строк), inline CSS + JS, **без Vite**
- **Firebase SDK:** подключён CDN-тегом `<script src="https://www.gstatic.com/firebasejs/10.12.0/...">` внутри `landing.html`
- **Авторизация:** Google Sign-In (popup) + Email/Password
- **После входа:** `onAuthSuccess()` → пишет `localStorage.setItem('mbs_active_tab', 'dashboard')` → редирект на Vercel-приложение через `window.location.href = 'https://html-coffee-menu.vercel.app'`

### ⚠️ Известное ограничение: cross-domain localStorage

`localStorage` не шарится между доменами. `mbs_active_tab` записывается на `baristaschool.ru`, но Vite-приложение читает свой `localStorage` на `vercel.app`. Таб dashboard при редиректе **не откроется автоматически**.

**Возможное решение (не реализовано):** передавать таб через URL-параметр:
```js
// landing.html onAuthSuccess:
window.location.href = 'https://html-coffee-menu.vercel.app?tab=dashboard';

// src/main.js INIT:
const _urlTab = new URLSearchParams(location.search).get('tab');
const _savedTab = _urlTab || localStorage.getItem('mbs_active_tab') || 'dashboard';
```

---

### Сессия 33 (12 мая 2026) — лендинг + Firebase Auth + редирект на Vercel

**Цель:** создать лендинг-страницу `landing.html` с авторизацией Firebase и редиректом на Vite-приложение после успешного входа.

---

#### 1. Создание landing.html

Standalone HTML-файл (~1120 строк) с inline CSS и JS. Структура:
- `HEADER` — логотип CaféDesk, кнопки «Возможности» и «Войти»
- `HERO` — заголовок, описание, интерактивная демо-карточка (3 вкладки: Дашборд / Себестоимость / Финмодель)
- `FEATURES` — 6 карточек возможностей с fade-in при скролле
- `STATS` — 4 статистики (50+ рецептур, 4 режима, 5 мин, 0 ₽)
- `PRICING` — 2 тарифа (Бесплатно / Команда «Скоро»)
- `AUTH` — 2 вкладки (Регистрация / Войти), Google + Email/Password
- `CTA` — секция призыва к действию
- `FOOTER` — с упоминанием партнёра `baristaschool.ru`

**Дизайн-токены landing.html** (отдельные от styles.css):
```css
--navy:   #417033   /* совпадает с основным приложением */
--green:  #4F883E
--light:  #E7F2E3
--red:    #CC2841
```

---

#### 2. Firebase Auth — исправленные баги

**Баг 1 — попап закрывался мгновенно:**
- `showAuthError(msg)` вызывался без `panel` → элемент ошибки добавлялся не в DOM
- **Исправление:** захватить `activePanel = document.querySelector('.auth-panel.active')` ДО `signInWithPopup()`, передать в `showAuthError(msg, activePanel)`

**Баг 2 — `auth/unauthorized-domain`:**
- Домен `baristaschool.ru` не был в Firebase Authorized domains
- **Исправление:** добавить вручную через Firebase Console → Authentication → Settings → Authorized domains

**Баг 3 — редирект на `index.html` не работал:**
- `window.location.href = 'index.html'` на `baristaschool.ru` открывал несуществующую страницу
- **Исправление:** заменить на полный URL Vercel-приложения

**Баг 4 — неправильный ключ localStorage:**
- Использовался `cafedeskActiveTab` вместо реального `mbs_active_tab` из `src/main.js`
- **Исправление:** `localStorage.setItem('mbs_active_tab', 'dashboard')` (хотя из-за cross-domain не имеет эффекта)

---

#### 3. Итоговый поток авторизации

```js
function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  const activePanel = document.querySelector('.auth-panel.active');
  auth.signInWithPopup(provider)
    .then(result => onAuthSuccess(result.user))
    .catch(err => {
      console.error('[Firebase Google Auth]', err.code, err.message);
      showAuthError(firebaseErrorRu(err.code), activePanel);
    });
}

function onAuthSuccess(user) {
  // XSS-защита через esc()
  // Показ success-экрана
  setTimeout(() => {
    localStorage.setItem('mbs_active_tab', 'dashboard');
    window.location.href = 'https://html-coffee-menu.vercel.app';
  }, 1500);
}
```

---

#### Коммиты сессии 33

| Коммит | Описание |
|--------|----------|
| *(серия)* | feat: create landing.html with Firebase Auth |
| `d4d28d5` | fix: redirect to Vercel app after auth |

---

### Сессия 34 (12 мая 2026) — tilda-blocks: HTML-блоки для Tilda + лендинг CaféDesk

**Цель:** Создать набор самодостаточных HTML-блоков для вставки в Tilda и превью-страницу на Vercel.

---

#### 1. Структура tilda-blocks/

Папка `tilda-blocks/` (и её копия `public/tilda-blocks/`) содержит 7 HTML-блоков + README + index.html. Каждый файл — standalone блок с inline `<style>` и `<script>` для вставки в Tilda через «Блок HTML/JS».

| Файл | Содержимое |
|---|---|
| `01-hero.html` | Главный экран — 2-колоночный layout: текст + интерактивный макет приложения |
| `02-benefits.html` | Преимущества — 6 карточек с иконками |
| `03-features-detail.html` | Детальные фичи — 5 шагов с нумерацией |
| `04-for-whom.html` | Для кого — 3 портрета ЦА + блок «Не подходит» |
| `05-stats.html` | Цифры — 30+ рецептур, 4 режима, 5 мин, PDF, 14 600 ₽ |
| `06-pricing.html` | Тарифы — CaféDesk 14 600 ₽ (featured) + Команда 990 ₽/мес (скоро) |
| `07-cta-final.html` | Финальный CTA — тёмный фон, кнопка «Получить доступ — 14 600 ₽ →» |
| `index.html` | Превью-страница: все 7 блоков + dev-toolbar с навигацией |

**Цена:** 14 600 ₽ (единоразово, доступ навсегда) — в блоках 01, 05, 06, 07.

**Деплой:** папка копируется в `public/tilda-blocks/` → Vite включает в `dist/` → доступна на `https://html-coffee-menu.vercel.app/tilda-blocks/`

**Причина копирования в public/:** `vercel.json` настроен на `outputDirectory: dist`. Файлы из `public/` Vite копирует в `dist/` автоматически. Файлы в корне репозитория в `dist/` не попадают.

**Правило синхронизации:** при изменении файлов в `tilda-blocks/` — обязательно копировать в `public/tilda-blocks/` перед коммитом:
```bash
cp tilda-blocks/01-hero.html public/tilda-blocks/01-hero.html
```

---

#### 2. Дизайн-система tilda-blocks (цвета и шрифты)

```css
/* Цвета */
--cd-green-dark:  #1e3a16  /* заголовки */
--cd-green-mid:   #417033  /* акценты, кнопки */
--cd-green-light: #4F883E  /* ховеры */
--cd-green-bg:    #e7f2e3  /* светлые фоны */
--cd-border:      #cde3c5  /* рамки */

/* Шрифт */
font-family: 'Mulish', 'Helvetica Neue', Arial, sans-serif;
/* В Tilda подключается через Google Fonts; fallback — системный sans-serif */
```

---

#### 3. Hero-блок (01-hero.html) — детали

**Layout:** 2 колонки (`grid-template-columns: 1fr 1fr`, gap 72px). При ≤960px — 1 колонка, визуал сверху.

**Левая колонка:** badge с пульсирующей точкой → h1 → подзаголовок → цена → кнопки → ноты.

**Правая колонка:** `.cd-app-card` — имитация интерфейса приложения с header, nav-табами (Дашборд / Себестоимость / Финмодель) и телом с KPI-плитками и строками напитков. Плавающие бейджи `.cd-float-1` (🚀) и `.cd-float-2` (📋).

**Авто-ротация вкладок** (добавлена в сессии 35):
- Запуск через 0.9с после загрузки
- Переключение каждые 3.2 сек: Дашборд → Себестоимость → Финмодель → …
- Зелёный прогресс-бар между nav и body
- При наведении на макет — пауза; при уходе — перезапуск
- При ручном клике на вкладку — перезапуск от неё

**Анимации появления** (добавлены в сессии 35):
- `.cd-hero-text` — `fade + slide-up` 0.65с, задержка 0.1с
- `.cd-hero-visual` — `fade + scale(0.93)` 0.7с, задержка 0.35с
- Stagger дочерних элементов текста: badge(0.2с) → h1(0.3с) → sub(0.4с) → price(0.48с) → actions(0.56с) → note(0.64с)

---

#### Коммиты сессии 34

| Коммит | Описание |
|--------|----------|
| `6814927` | feat: create tilda-blocks/ — 7 HTML blocks + README |
| `05ac4ea` | feat: hero 2-col layout with app mockup, price 14600 rub across all blocks |
| `6f96b17` | feat: add tilda-blocks/index.html — preview of all 7 blocks on Vercel |
| `1674391` | fix: move tilda-blocks to public/ so Vite includes it in dist |

---

### Сессия 35 (12 мая 2026) — hero: авто-ротация + анимации появления

**Добавлено в `01-hero.html`** (и синхронизировано в `public/tilda-blocks/`):
1. CSS-анимации `@keyframes cd-fade-up` и `cd-fade-scale` — плавное появление блоков
2. Stagger-анимации для дочерних элементов текста через `animation: ... both`
3. Прогресс-бар `.cd-app-progress` / `.cd-app-progress-bar` — тонкая полоска под nav
4. Логика авто-ротации: `cdStartAuto()` / `cdStopAuto()` / `cdAutoNext()` / `cdStartProgress()`
5. `mouseenter`/`mouseleave` на `.cd-hero-visual` — пауза при наведении
6. `cdSwitchTabInternal()` вынесена отдельно; `cdSwitchTab()` (публичная) сбрасывает и перезапускает таймер

| Коммит | Описание |
|--------|----------|
| `b45a12c` | feat: hero entrance animations + auto-rotation tabs with progress bar |

---

### Сессия 36 (21 мая 2026) — Email + Yandex OAuth
- FastAPI backend: регистрация, логин, смена пароля, сброс пароля через email
- Yandex OAuth: вход через Яндекс ID
- SMTP через Яндекс SSL (port 465)
- Admin-панель: управление пользователями

### Сессия 37 (21 мая 2026) — Telegram-уведомления + телефон в регистрации
- Telegram-бот для уведомлений при регистрации нового пользователя
- Поле телефона в форме регистрации с нормализацией (`normalizePhone()`)
- Яндекс OAuth: scope `login:phone`, новые пользователи → `is_active=False`
- Обновлены Yandex OAuth credentials (новое приложение с правами на телефон)
- CSS-баг: `#auth-phone-field.visible` отсутствовал → исправлено

---

### Сессия 38 (22 мая 2026) — fix: Escape для modal-oc-item

**Проблема:** попап карточки позиции стартовых вложений (`#modal-oc-item`) не закрывался по нажатию Escape.

**Причина:** `modal-oc-item` отсутствовал в массиве `MODAL_IDS` в `src/ui/events.js`. Глобальный Escape-обработчик перебирает `MODAL_IDS` и вызывает `safeCloseModal(id)` для первого открытого модала — т.к. `modal-oc-item` не был в списке, обработчик его игнорировал.

**Исправление** (`src/ui/events.js`):
```js
// БЫЛО:
const MODAL_IDS = [
  'modal-drink','modal-mat','modal-semi','modal-templates','modal-loc',
  'modal-supplier','modal-supplier-book','modal-price-hist','modal-drop',
  'modal-suppliers-list','modal-drink-view',
];

// СТАЛО:
const MODAL_IDS = [
  'modal-drink','modal-mat','modal-semi','modal-templates','modal-loc',
  'modal-supplier','modal-supplier-book','modal-price-hist','modal-drop',
  'modal-suppliers-list','modal-drink-view','modal-oc-item',
];
```

**Правило:** при добавлении нового `<div class="modal-bg" id="modal-XYZ">` в `index.html` — обязательно добавлять `'modal-XYZ'` в `MODAL_IDS` в `src/ui/events.js`. Иначе Escape и клик по подложке не будут закрывать этот модал.

| Коммит | Описание |
|--------|----------|
| *(deploy)* | fix: add modal-oc-item to MODAL_IDS — Escape now closes the popup |

---

### Сессия 40 (22 мая 2026) — fix: незакрытый modal-oc-item блокировал все попапы

**Проблема:** после добавления `modal-oc-item` (сессия 38–39) все попапы перестали открываться: рецепты, ингредиенты, полуфабрикаты, ингредиенты напитка. При нажатии скролл страницы блокировался, но попап не появлялся. Починить можно было только перезагрузкой страницы.

**Диагностика:** подсчёт баланса `<div>`/`</div>` внутри `modal-oc-item` показал, что после `</div>` строки 195 `index.html` глубина вложенности = **1** (не 0). Все модалы начиная с `modal-drink-view` были вложены внутрь `modal-oc-item`. Поскольку `modal-oc-item` имеет `display:none` по умолчанию, все дочерние попапы тоже не отображались. `openModal()` при этом честно добавлял `html.modal-open` → скролл блокировался.

**Исправление** (`index.html`): добавлен один `</div>` (закрывает `div.modal-bg#modal-oc-item`) перед `<div class="modal-bg" id="modal-drink-view">`.

**Правило:** при добавлении нового `modal-bg` — структура всегда:
```html
<div class="modal-bg" id="modal-XYZ">
  <div class="modal">
    ...
  </div>
</div>  ← этот тег часто теряется!
```
После добавления нового модала проверять: `modal.modal-bg` закрывается двумя `</div>` — один для `.modal`, один для `.modal-bg`.

**Дополнительное исправление:** добавлен явный `import { openModal, closeModal } from './modals.js'` в `src/ui/recipe-view.js` + null-check в `openModal()` (`src/ui/modals.js`).

| Коммит | Описание |
|--------|----------|
| `64c606f` | fix: import openModal/closeModal in recipe-view.js; null-check in openModal |
| `7571a0a` | fix: close modal-oc-item modal-bg — all modals were nested inside it |

---

### Сессия 39 (22 мая 2025) — загрузка фото с устройства + скролл в OC item modal

#### 1. Загрузка фото с устройства (FileReader → base64)

**Исходное состояние:** кнопка «Загрузить фото» открывала строку с `<input type="url">`. Пользователю нужна загрузка файла с устройства.

**Решение:**
- `index.html`: заменена `oci-photo-url-row` на `<input id="oci-photo-file" type="file" accept="image/*" style="display:none" onchange="ocPhotoFileChange(this)">`. Кнопка вызывает `.click()` на этом инпуте
- `src/render/dashboard.js`: убраны `ocPhotoUrlToggle/Apply/Cancel`; добавлена `ocPhotoFileChange(input)` — FileReader читает файл → base64 DataURL → `photoImg.src` + `photoImg.setAttribute('data-user-url', dataUrl)`; `input.value = ''` для повторной загрузки
- `src/main.js`: импорт/экспорт обновлён (3 функции → 1)
- Фото сохраняется в `item.photo` как base64 при `ocItemSave()`

#### 2. Скролл OC item modal на мобиле

**Проблема:** нижняя часть формы недоступна на мобиле.

**Причина:** `.oci-layout` лежал напрямую в `.modal` (минуя `modal-body`). На мобиле `.modal` имеет `overflow: hidden` + `display: flex`.

**Исправление** (`index.html`):
```html
<div class="modal-body oci-modal-body">
  <div class="oci-layout">…</div>
</div>
```
Десктоп: `modal-body { display: contents }` — прозрачно. Мобиле: `modal-body { flex: 1; overflow-y: auto }` — скроллится.
Убран `overflow-y: auto` с `.oci-right` в `styles.css`.

**Правило:** при добавлении нового OC-подобного модала с `.oci-layout` — обязательно оборачивать контент в `<div class="modal-body">`.

#### Коммиты сессии 39

| Коммит | Описание |
|--------|----------|
| `fdf11e6` | feat: ручная загрузка фото через URL *(отменено в этой же сессии)* |
| `2bf15c0` | feat: загрузка фото с устройства (FileReader) вместо URL |
| `72c04b4` | fix: OC item modal — скролл на мобиле через modal-body |

---

### Сессия 41 — fix: "Ошибка сохранения" при редактировании оборудования в admin-панели

**Проблема:** при нажатии «Сохранить» в drawer оборудования появлялась ошибка «Ошибка сохранения». Прямой вызов API через `curl -X PUT` возвращал `{"ok":true}` HTTP 200.

**Диагностика:** Safari пишет «Load failed» для PUT-запросов, заблокированных CORS preflight. Причина — метод `"PUT"` отсутствовал в `allow_methods` у `CORSMiddleware`.

**Исправление (`server/main.py`):**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[...],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],  # PUT добавлен!
    allow_headers=["Authorization", "Content-Type"],
)
```

**Дополнительно (`server/admin/admin-panel.js`):** улучшена обработка ошибок в `saveEqItem()` — теперь выводит реальную причину вместо generic «Ошибка сохранения».

**Правило:** при добавлении нового PUT/PATCH/DELETE-эндпоинта — всегда проверять `allow_methods` в `CORSMiddleware`. Safari блокирует любой метод, не указанный явно, с ошибкой «Load failed» без подробностей.

#### OC-Library CRUD (admin)

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/admin/oc-library` | список позиций |
| `POST` | `/api/admin/oc-library` | создать (`{name, subcategory, price, photo, url}`) |
| `PUT` | `/api/admin/oc-library/{id}` | обновить (тот же body) |
| `DELETE` | `/api/admin/oc-library/{id}` | удалить |
| `POST` | `/api/admin/oc-library/bulk-delete` | массовое удаление `{ids: []}` |

Модель: `OcLibraryItem(name, subcategory, price=0.0, photo='', url='', description='', promo_code='', promo_expires='')`

#### Деплой изменений (admin-panel + backend)
```bash
scp -i ~/.ssh/id_ed25519 server/admin/admin-panel.js root@159.194.233.13:/var/www/coffee-menu/dist/admin-panel.js
scp -i ~/.ssh/id_ed25519 server/main.py root@159.194.233.13:/var/www/coffee-menu/server/main.py
ssh -i ~/.ssh/id_ed25519 root@159.194.233.13 'systemctl restart coffee-menu-api'
```

---

### Сессия 42 (23 мая 2026) — feat: promo block в OC-карточке + tab-фильтр и UX-улучшения в admin-панели

#### 1. Новые поля `oc_library` (DB + API)

Добавлены три новых колонки в таблицу `oc_library`:

| Поле | Тип | Назначение |
|---|---|---|
| `description` | `TEXT DEFAULT ''` | Описание товара / партнёра |
| `promo_code` | `TEXT DEFAULT ''` | Промокод для скидки |
| `promo_expires` | `TEXT DEFAULT ''` | Срок действия промокода (ISO-дата) |

Миграция выполняется автоматически при старте сервера (`ALTER TABLE oc_library ADD COLUMN ...`). Все CRUD-эндпоинты (`GET public`, `GET admin`, `POST`, `PUT`) возвращают и принимают новые поля.

**Обновлённая модель:** `OcLibraryItem(name, subcategory, price, photo, url, description, promo_code, promo_expires)`

#### 2. Promo block в SPA (OC item modal)

**Файлы:** `src/render/dashboard.js`, `index.html`, `styles.css`

- `index.html`: добавлен `<div id="oci-promo-block" class="oci-promo-block" style="display:none">` внутри `.oci-right`, после строки с `#oci-cat`
- `dashboard.js`: функции `_libPromo(name)` (ищет товар в `_oclibData` по имени) и `_renderPromo(libItem)` (формирует HTML блока)
- Блок показывается только если у товара есть `description` или `promo_code`
- Промокод: кликабельный pill + кнопка «Скопировать» → «✓ Скопировано» на 1.8с
- Кэш `_oclibData` заполняется лениво при первом открытии OC-карточки
- CSS-классы: `.oci-promo-block`, `.oci-promo-header`, `.oci-promo-code-pill`, `.oci-promo-code`, `.oci-promo-copy-btn`, `.oci-promo-exp`

#### 3. Admin-панель — UX-улучшения (`server/admin/admin-panel.js`)

**Drawer — новые поля:**
- Textarea `#adm-eq-description` (описание)
- Input `#adm-eq-promo-code` (промокод) + `#adm-eq-promo-expires` (дата, `type=date`) + кнопка `×` для очистки даты

**Сохранение с восстановлением скролла:**
- `saveEqItem()` сохраняет `_savedScrollY = window.scrollY` до вызова API
- `loadOcLibrary()` теперь **возвращает промис** (`return api(...)`)
- После `.then(loadOcLibrary)` → `window.scrollTo(0, _savedScrollY)` восстанавливает позицию

**Tab-фильтр вместо `<select>`:**
- Глобальные переменные `_oc_main_tab` и `_oc_sub_tab` (строки, пустая = «все»)
- `updateEqCatFilter()` рендерит двухуровневые pill-табы с счётчиком элементов в каждой группе
- Клик по таб-пилюле обновляет `_oc_main_tab`/`_oc_sub_tab` и вызывает `renderOcLibrary()`
- CSS: `.adm-lib-tabs-wrap`, `.adm-lib-main-tabs`, `.adm-lib-sub-tabs`, `.adm-lib-tab`, `.tab-cnt`

**Список позиций:**
- Удалена колонка «Категория» → 6 колонок: Фото, Название, Цена, Ссылка, 🏷️, Действия
- Sticky group headers (`position:sticky; top:48px`) по главной + под-категории
- Кнопки Edit/Delete в `.adm-eq-actions { display:flex }` — не переносятся
- `stopPropagation()` на всех кнопках строки
- 🏷️ badge в отдельной колонке, если у позиции заполнен `promo_code`

#### Деплой сессии 42

```bash
# Бэкенд (миграция + новые поля в API)
scp -i ~/.ssh/id_ed25519 server/main.py root@159.194.233.13:/var/www/coffee-menu/server/main.py
ssh -i ~/.ssh/id_ed25519 root@159.194.233.13 'systemctl restart coffee-menu-api'

# Admin-панель
scp -i ~/.ssh/id_ed25519 server/admin/admin-panel.js root@159.194.233.13:/var/www/coffee-menu/dist/admin-panel.js

# Фронтенд SPA
cd HTML_coffee_menu && npm run build
rsync -avz --exclude='admin-panel.js' dist/ root@159.194.233.13:/var/www/coffee-menu/dist/ -e 'ssh -i ~/.ssh/id_ed25519'
```

---

### Сессия 43 (23 мая 2026) — feat: OC_KIOSK_EQUIPMENT whitelist + полные данные из библиотеки в item

#### 1. `OC_KIOSK_EQUIPMENT` — строгий whitelist для формата «Киоск»

**Файл:** `src/render/dashboard.js`

Добавлена константа `OC_KIOSK_EQUIPMENT` (объект `{ name: qty }`) — 18 позиций оборудования, специфичных для формата киоска:

```js
const OC_KIOSK_EQUIPMENT = {
  'Нок Бокс из нержавеющей стали 150х150мм': 2,  // единственная позиция с qty > 1
  'Кофемашина Sanremo D8.2 PRO': 1,
  // ... 16 других позиций
};
```

**Логика `ocLoadTemplate(format)`:**

| Формат | Источник оборудования | Дедупликация | qty |
|---|---|---|---|
| `kiosk` | whitelist `OC_KIOSK_EQUIPMENT` | `Set` по имени | из whitelist (кастомный) |
| `island` / `full` | `is_featured: true` → fallback все публичные | — | 1 |

**Статический fallback в `OC_TEMPLATES.kiosk`:** обновлён реальными позициями из admin-библиотеки с актуальными ценами (на случай недоступности API).

#### 2. Полные данные из библиотеки сохраняются в item

При загрузке шаблона через API (`/api/oc-library?category=equipment`) все поля библиотеки теперь проставляются в каждый item:

```js
// Было (только базовые поля):
{ name, price, url, qty, category }

// Стало (все поля):
{ name, price, url, qty, category, photo, description, promo_code, promo_expires, is_featured }
```

**Эффект:** фото и промо-блок показываются мгновенно при открытии карточки — без дополнительных API-запросов.

#### 3. `ocItemEdit()` — обновлённая логика промо-блока

```js
// Приоритет источника данных для промо:
// 1. item напрямую (данные загружены с шаблоном)
const itemAsMeta = (item.description || item.promo_code)
  ? { description: item.description, promo_code: item.promo_code, promo_expires: item.promo_expires }
  : null;

// 2. _oclibData кэш (если item пришёл из старого localStorage)
const libMeta = itemAsMeta || _libPromo();
if (libMeta) _renderPromo(libMeta);

// 3. Фоновый fetch — обновляет кэш и вызывает _renderPromo(_libPromo())
```

**Фоновый fetch** теперь также вызывает `_renderPromo` после получения данных — гарантирует обновление блока если item был из старого кэша без полных данных.

#### ⚠️ Важное ограничение

Пользователи с ранее загруженным шаблоном в `localStorage` получат `photo`/`promo_code`/`description` только после повторного нажатия **«Загрузить шаблон»**. Автоматической миграции старых items нет.

#### Деплой сессии 43

```bash
# Только фронтенд (бэкенд и admin-panel не изменялись)
cd HTML_coffee_menu && npm run build
rsync -avz --exclude='admin-panel.js' dist/ root@159.194.233.13:/var/www/coffee-menu/dist/ -e 'ssh -i ~/.ssh/id_ed25519'
# Собрано: index-BWRepKKY.js
```

---

### Сессия 47 (май 2026) — fix: drawer-кнопки + поле Комментарий в карточке пользователя

#### 1. Фикс A — drawer-кнопки (Активировать, Заблокировать, Сброс пароля, Удалить, Сделать админом)

**Файл:** `server/admin/admin-panel.js`

**Корень проблемы:** `adm-drawer` и `adm-confirm` живут в `_overlay`, который аппендится в `document.body` **вне** `#adm-root`. `root.addEventListener('click', handler)` физически не может поймать клики по элементам внутри `_overlay`.

**Решение:**
- Создана именованная функция `_handleClick(e)` (вместо анонимной)
- Оба контейнера подписаны: `root.addEventListener('click', _handleClick)` + `_overlay.addEventListener('click', _handleClick)`
- Инициализация вынесена в блок one-time init (слушатели `adm-confirm` и `keydown` Escape больше не дублируются при каждом клике)

**Правило (§16 в copilot-instructions):** всегда подписывать оба контейнера на `_handleClick`.

#### 2. Фикс B — кнопки 🚫 и 👁 в строке таблицы

**Корень проблемы:** `<div class="adm-row-actions">` имел `onclick="event.stopPropagation()"`, что блокировало всплытие кликов к делегированному обработчику `root`.

**Решение:** убран `stopPropagation`. Охрана от случайного открытия drawer встроена в `_handleClick` через `el.closest('[data-act]')`.

#### 3. Фича C — поле «Комментарий» в карточке пользователя

**Файлы:** `server/main.py`, `server/admin/admin-panel.js`

**Бэкенд:**
- В модель `User` добавлены поля: `notes = Column(String, nullable=True)`, `notes_updated_at = Column(DateTime, nullable=True)`
- `_run_migrations()` выполняет `ALTER TABLE users ADD COLUMN notes VARCHAR` и `ADD COLUMN notes_updated_at DATETIME` (idempotent)
- `GET /api/admin/users` — возвращает `notes` и `notes_updated_at`
- `PATCH /api/admin/users/{user_id}` — при ключе `"notes"` сохраняет текст и `notes_updated_at = datetime.utcnow()`, возвращает `notes_updated_at` в ответе

**Фронтенд:**
- В `openDrawer(u)` добавлен textarea-блок с CSS-классами `.adm-drawer-notes-row`, `.adm-drawer-notes-ta`, `.adm-drawer-notes-status`
- Автосохранение: debounce 1.2с на `input` + немедленно на `blur`
- После сохранения показывает `✓ Сохранено · DD.MM.YYYY HH:MM` на 4с, затем очищает
- При открытии drawer показывает `Изменено: DD.MM.YYYY HH:MM` если `u.notes_updated_at` установлен

#### Деплой сессии 47

```bash
# Бэкенд + перезапуск сервиса
scp -i ~/.ssh/id_ed25519 server/main.py root@159.194.233.13:/var/www/coffee-menu/server/main.py
ssh -i ~/.ssh/id_ed25519 root@159.194.233.13 'systemctl restart coffee-menu-api'

# Admin-panel
scp -i ~/.ssh/id_ed25519 server/admin/admin-panel.js root@159.194.233.13:/var/www/coffee-menu/dist/admin-panel.js
```

---

### Сессия 48 — Admin override рецептур + фото только из admin

#### Фича A — Вкладка «Рецептуры» в admin-panel.js

**Файл:** `server/admin/admin-panel.js`

**Backend (main.py):**
- Таблица `drink_overrides`: `drink_id` (PK), `name`, `price`, `is_hidden`, `image_url`, `updated_at`
- `GET /api/admin/drinks/overrides` — возвращает все overrides
- `POST /api/admin/drinks/override` — создать/обновить override
- `DELETE /api/admin/drinks/override/{drink_id}` — удалить override (сброс к дефолту)

**Frontend (admin-panel.js):**
- Вкладка «Рецептуры» с 6-колоночной таблицей: #, Название, Alias, Цена, Фото, Видимость
- Над таблицей — строка stats: Всего / Alias / Цена ↩ / Фото / Скрыто (ненулевые)
- Hover строк: `#f5fbf2` (светло-зелёный), dark-тема `#1e2d1e`
- Миниатюра фото 28×28 в строке таблицы (`<img class="adm-rec-thumb">`), `onerror` → opacity 0.3
- Дравер редактирования: Название (alias), Цена, URL фото + превью с валидацией, переключатель «Скрыт»
- Кнопка «🗑 Сбросить»: видна только если есть override; вызывает DELETE-эндпоинт; `resetRecDrawer()`
- Валидация URL: `onerror`/`onload` на превью + красная надпись `#adm-rec-url-err`
- Подсказка под полем Название: «Если пусто — студенты видят оригинальное название из базы»
- Escape закрывает дравер (добавлен в глобальный keydown-handler)
- `closeRecDrawer()` — сбрасывает `saveBtn.disabled` и `resetBtn.disabled` (§15 compliant)

**Применение overrides во фронтенде (main.js):**
```js
// При init: GET /api/drinks/overrides → применяем к DRINKS[]
if (ov.name)      DRINKS[idx].name      = ov.name;
if (ov.price)     DRINKS[idx].price     = ov.price;
if (ov.is_hidden) DRINKS[idx].hidden    = true;
if (ov.image_url) DRINKS[idx].image     = ov.image_url;
else              delete DRINKS[idx].image; // ← если нет override — фото нет
```

#### Фича B — Фото в рецептурах только из admin

**Файл:** `HTML_coffee_menu/src/utils/image.js`

**Изменение:**
```js
// БЫЛО:
export function getDrinkImage(d) {
  return d.image || DRINK_IMAGES[d.id] || null;
}
// СТАЛО:
export function getDrinkImage(d) {
  return d.image || null; // нет fallback на статичные файлы
}
```

**Смысл:** `DRINK_IMAGES` содержит hardcoded пути к stock-фото (espresso.jpg, cappuccino.jpg и т.д.). После этого изменения:
- Фото показывается **только** если admin задал `image_url` в override ИЛИ владелец загрузил вручную
- `DRINK_IMAGES` объект оставлен в файле (не удалён), но не используется как fallback
- Затрагивает: вкладка Рецептуры, просмотр карточки напитка, экспорт техкарт PDF/Excel

#### Деплой сессии 48

```bash
# Admin-panel
scp -i ~/.ssh/id_ed25519 server/admin/admin-panel.js root@159.194.233.13:/var/www/coffee-menu/dist/admin-panel.js

# Фронтенд (build + rsync)
cd HTML_coffee_menu && npm run build
rsync -avz --exclude='admin-panel.js' dist/ root@159.194.233.13:/var/www/coffee-menu/dist/ -e 'ssh -i ~/.ssh/id_ed25519'
```

---

### Сессия 49 (24 мая 2026) — fix: фильтры поставщиков + двойной модал в таблице ингредиентов

#### Баг 1 — Теги фильтров в «Полном списке поставщиков» не работали корректно

**Файл:** `src/ui/suppliers.js`

**Причина:** `_getMatCat(key)` возвращала сырые категории из `MAT_CATEGORIES` (`bakery`, `drinks`, `fruits`, `supplies`), а фильтр-чипы ожидают другие ключи (`sugar`, `other`, `other`, `pack`). Поставщики с такими ингредиентами пропадали из всех фильтров.

Дополнительно: book-only поставщики (без привязанного сырья, например High Water) не попадали в «Прочее».

**Решение:**
```js
// Добавлен маппинг сырых категорий → ключи фильтров
const _CAT_TO_FILTER = {
  coffee: 'coffee', dairy: 'dairy', tea: 'tea',
  bakery: 'sugar',    // бакалея → Сахар
  supplies: 'pack',   // расходники → Упаковка
  drinks: 'other',    // напитки → Прочее
  fruits: 'other',    // фрукты → Прочее
  other: 'other',
};
function _getMatCat(key) {
  // ...
  return _CAT_TO_FILTER[rawCat] || 'other';
}
```

Фильтр по категории: book-only поставщики (без сырья) теперь появляются в «Прочее»:
```js
filtered = filtered.filter(g => {
  if (g.mats.length === 0) return supListFilter === 'other'; // book-only → Прочее
  return g.mats.some(m => _getMatCat(m.key) === supListFilter);
});
```

**⚠️ Важно:** При добавлении новой категории в `MAT_CATEGORIES` (mat.js) — **обязательно** добавить её в `_CAT_TO_FILTER` в `suppliers.js`, иначе поставщики с такими ингредиентами пропадут из всех фильтров.

#### Баг 2 — Клик на поставщика в таблице ингредиентов открывал два модала

**Файл:** `src/render/cost.js`

**Причина 1:** На кнопке поставщика (`sup-name-btn`) не было `event.stopPropagation()` — клик всплывал к `<tr onclick="openViewMat(...)">` → открывались и карточка ингредиента, и инфо-модал поставщика.

**Причина 2:** `openSupplierInfo` вызывался с ключом ингредиента (`matcha`, `tea`...), а `_supGroups` индексирован по **имени поставщика** → `_supGroups['matcha'] = undefined` → пустой модал.

**Причина 3:** Кнопка «+ добавить» тоже не имела `stopPropagation` → при клике открывался dropdown + карточка ингредиента.

**Решение:**
```js
// БЫЛО:
`<button ... onclick="openSupplierInfo('${key}')">`
// СТАЛО (stopPropagation + передача имени поставщика):
`<button ... onclick="event.stopPropagation();openSupplierInfo('${(sup.name||'').replace(/'/g,"\\'")}'">`

// БЫЛО:
`<button ... onclick="openSupQuickDrop('${key}',this)">`
// СТАЛО:
`<button ... onclick="event.stopPropagation();openSupQuickDrop('${key}',this)">`
```
