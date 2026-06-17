# NEXT_CHAT_HANDOFF — Coffee_menu / barista-school.online

Дата актуализации: 17 июня 2026.

Этот файл нужен, чтобы новый чат быстро понял контекст проекта и мог продолжить работу без повторной раскачки.

## 1. Кто и над чем работает

Роман Суслин — основатель Московской школы бариста.

Работаем над платформой `barista-school.online` для Московской школы бариста.

Текущий главный продуктовый вектор: **платформа авторских рецептов**.

Идея: участники Mixology Cup и внешние авторы получают кабинет, вносят свои рецепты, отправляют их на модерацию, после публикации рецепты продаются через витрину и CRM-процесс в Битрикс. На первом релизе полноценная онлайн-оплата и автоматическая выдача доступа к купленному рецепту внутри платформы не обязательны: заявка и обработка могут идти через Битрикс.

На 17 июня 2026 добавлен автоматический author-доступ для участников Mixology Cup из server whitelist: при регистрации телефон сверяется с участником, у которого в yClients-отчёте есть фактический статус `visited` / «пришёл».

## 2. Связанные проекты

Основные проекты:

- `/Users/Romka/Downloads/All_Code/Coffee_menu` — ядро `barista-school.online`.
- `/Users/Romka/Downloads/All_Code/Coffee_menu/HTML_coffee_menu` — Git-репозиторий frontend/workflow-документов.
- `/Users/Romka/Downloads/All_Code/Coffee_menu/server` — backend FastAPI + admin panel.
- `/Users/Romka/Downloads/All_Code/bitrix-tools` — существующие инструменты Битрикс, справочник паттернов, будущие выплаты/документы.
- `/Users/Romka/Downloads/All_Code/mbs-mixology-cup` — контекст по участникам чемпионата.

Важно: пока не делать глубокую чистку `bitrix-tools`, если задача не про него напрямую. Для нового продукта использовать его как reference по Битрикс-паттернам.

## 3. Термины и стиль

Писать:

- «бариста», не склонять это слово.
- `yClients`, не iClients.
- «Битрикс», не Bittrex.
- В техническом контексте допустимо `Bitrix24`, но в русских текстах лучше «Битрикс».

Стиль Московской школы бариста: аккуратно, понятно, без визуального мусора.

## 4. Текущее состояние платформы

`Coffee_menu` сейчас является ядром `barista-school.online` и содержит:

- кабинет клиента кофейни;
- кабинет автора рецептов;
- public-витрину авторских рецептов;
- admin backend для пользователей, доступов, авторов, публикаций и справочников.

Раньше в проекте были только инструменты для кофейни: бюджет, план продаж, финмодель, поставщики и рецептуры. Сейчас продукт разделён на несколько слоёв доступа.

## 5. Слои доступа

В backend/admin/frontend реализованы три слоя:

| Поле backend | Поле в `user.access` | Что открывает |
|---|---|---|
| `access_drinks` | `drinks` | `Поставщики`, `Рецептуры` |
| `access_finance` | `finance` | `Бюджет`, `План продаж`, `Финмодель` |
| `access_author` | `author` | Кабинет автора рецептов |

Правила:

- Новые пользователи по умолчанию получают аккаунт без пакетов.
- Доступы выдаёт админ через `/admin`.
- `author` даёт доступ к вкладке `Рецептуры`, даже если `drinks=false`.
- Desktop/mobile навигация строится по доступам.
- `switchTab(tab)` защищает закрытые вкладки от открытия через старый `localStorage`.
- Если доступов нет, показывается no-access экран.
- Онбординг динамический: общий, напитки, финансы или автор.

## 6. Хранение данных пользователя

Важный исправленный баг: данные разных пользователей раньше могли смешиваться из-за глобального localStorage.

Сейчас:

- серверное состояние: `user_state.state_json`;
- браузерные ключи localStorage имеют user scope:
  - `mbs_locations__<user>`;
  - `mbs_loc_<id>__<user>`.

Не возвращать глобальные ключи `mbs_locations`, `mbs_active_loc`, `mbs_loc_*` без user scope.

## 7. Авторская платформа

Сделано:

- backend-таблица `author_profiles`;
- backend-таблица `recipe_publications`;
- backend-таблица `recipe_publication_versions`;
- backend-таблица `recipe_publication_events`;
- backend-таблица `recipe_orders`;
- backend-таблица `author_recipe_drafts`;
- backend-таблица `author_ingredients`;
- backend-таблица `author_semis`;
- отдельные author routes: `/app/author/suppliers`, `/app/author/recipes`, `/app/author/profile`;
- admin-раздел `Авторы`;
- public API/страница витрины опубликованных рецептов;
- статусы публикаций: черновик/на проверке/опубликован/отклонён/архив;
- профиль автора: фамилия, имя, отчество, телефон, описание, аватар, статус документов;
- синхронизация автора с Битрикс при выдаче доступа.
- полноценная admin-модерация публикаций: карточка проверки, цена/описание для витрины, чеклист проблем, комментарий автору, история событий и версии.

Актуальная логика режима `Автор` на 17 июня 2026:

- правила author-слоя централизованы в `src/access/author-layer.js`;
- если у пользователя случайно включены `author` вместе с `drinks/finance`, frontend считает это режимом `Автор`, чтобы не открыть обычный клиентский набор данных;
- во вкладке `Рецептуры` у автора пустой старт: без демо-рецептов, с карточкой `Создайте первый авторский рецепт`;
- во вкладке `Рецептуры` доступны только разделы: `Горячие`, `Чай`, `Холодные`, `Пуровер`, `Авторские`;
- во вкладке `Поставщики` для автора скрыты `Hiwater`, `Baristaline`, `МайТаймКап`;
- вкладка `Мой профиль` доступна только author-слою;
- блок условий сотрудничества открыт через popup, не является юридическим акцептом;
- `Мой профиль` показывает публикации по статусам: требуют внимания, на проверке, опубликованы, сняты, все;
- в профиле автора есть блоки-заготовки `Данные для договора` и `Финансы`, без backend-учёта выплат на этом этапе.

Карточка авторского рецепта:

- для нового авторского рецепта дефолтная группа — `Авторские`;
- автор может сохранять неполный черновик;
- отправка `На витрину` блокируется, пока не заполнены обязательные поля: название, группа, рекомендуемая цена продажи, объём, ингредиенты, изображение, процесс, оборудование, температура подачи, срок реализации, органолептика;
- ссылка на видеорецепт необязательна;
- блок оборудования находится после `Процесс приготовления`;
- оборудование выбирается мультиселектом, своё оборудование добавляется через пункт выпадающего списка и popup; похожие названия блокируются на frontend.

Серверное хранение author-данных:

- черновики рецептов автора сохраняются в `author_recipe_drafts`;
- фото рецептов автора загружаются через `POST /api/author/recipe-image` в runtime-папку `server/data/public_uploads/author-recipes`;
- кастомные ингредиенты автора сохраняются в `author_ingredients`;
- кастомные полуфабрикаты автора сохраняются в `author_semis`;
- при первой загрузке author workspace старые локальные авторские рецепты/ингредиенты/полуфабрикаты мигрируют на backend;
- в режиме `Автор` `customDrinks`, `customMats` и `semiItems` больше не сохраняются как общий источник правды в browser localStorage;
- для авторских рецептов используется client id offset `100000000 + draft_id`;
- для авторских полуфабрикатов используется client id offset `200000000 + semi_id`;
- обычный клиентский режим `Напитки` продолжает использовать прежнюю клиентскую библиотеку.

Модерация публикаций:

- `recipe_publications.source_draft_id` связывает публикацию с серверным черновиком автора;
- повторная отправка того же черновика обновляет существующую активную публикацию и увеличивает `version`, а не плодит дубли;
- `recipe_publications.validation_json` хранит server-side результат проверки обязательных блоков;
- `recipe_publications.review_flags_json` хранит чеклист обратной связи админа;
- `recipe_publication_versions` хранит снимки отправленных версий;
- `recipe_publication_events` хранит события: submitted, published, rejected, archived, review_saved;
- `GET /api/admin/author-recipes/{pub_id}` отдаёт полную карточку рецепта для admin drawer.

Mixology auto-author:

- runtime whitelist: `server/data/mixology_author_access.json`;
- импорт: `server/scripts/import_mixology_author_access.py`;
- источник импорта v1: `YClients-Dashboard/data/mixology/reports/generated/*.clients.json`;
- засчитываются только строки, где `mixology_records` содержит `visited`;
- `no_show`, `canceled`, `pending`, `confirmed` не дают author-доступ;
- при совпадении телефона `POST /api/auth/register` создаёт активного пользователя с `access_author=true`, `access_drinks=false`, `access_finance=false`, создаёт/обновляет `author_profiles`, запускает author Bitrix sync и возвращает `token`, `user`, `auto_author:true`;
- whitelist содержит телефоны и не должен попадать в Git или публичные документы.

Основные файлы:

- `server/main.py` — backend API, миграции, Битрикс-синхронизация.
- `server/admin/src/_authors.js` — admin-раздел авторов.
- `server/admin/src/_styles.js` — стили admin; `#adm-root` full-width, `#adm-panel` центрирован до `1100px` по design system.
- `server/admin/src/_drawer.js` — drawer пользователя и access toggles.
- `HTML_coffee_menu/src/ui/author.js` — кабинет автора.
- `HTML_coffee_menu/src/modals/drink.js` — форма рецепта, обязательные поля author-публикации, оборудование.
- `HTML_coffee_menu/src/access/author-layer.js` — frontend-правила author-слоя.
- `HTML_coffee_menu/src/ui/public-recipes.js` — public-витрина.
- `HTML_coffee_menu/src/render/recipes.js` — интеграция авторского блока во вкладку рецептур.

## 8. Битрикс-синхронизация автора

При включении `access_author: false -> true`:

1. Backend сохраняет доступ автора.
2. Создаёт/обновляет `author_profiles`.
3. В фоне запускает best-effort синхронизацию с Битрикс.
4. Ищет контакт по телефону, затем email.
5. Если контакт не найден, создаёт контакт.
6. Пишет `bitrix_contact_id` в `author_profiles`.
7. Добавляет метку `Автор рецептов` в multi-list поле.
8. Добавляет комментарий в timeline контакта только при первом добавлении автора, не при каждом сохранении профиля/аватара.
9. Не пишет служебные данные в `COMMENTS`, чтобы не утащить их в yClients через `sync_comment`.

При сохранении профиля автора backend обновляет в Битрикс `NAME`, `LAST_NAME`, `SECOND_NAME` и фото контакта. Telegram убран из author frontend-формы, чтобы не затирать старые данные.

Production-настройки:

- `BITRIX_WEBHOOK` добавлен в `/var/www/coffee-menu/server/.env`.
- `BITRIX_AUTHOR_MARK_FIELD=UF_CRM_1766349995197`.
- `BITRIX_AUTHOR_MARK_LABEL=Автор рецептов`.
- Enum `Автор рецептов` добавлен в поле Битрикс.

Backup-файлы после настройки:

- `/var/www/coffee-menu/server/backups/.env-20260616-175422.before-bitrix-webhook`;
- `/var/www/coffee-menu/server/backups/bitrix-author-field-20260616-180123.json`.

## 9. Проверенный тестовый автор

Тестовый контакт:

- Битрикс: `https://baristaschool.bitrix24.ru/crm/contact/details/10828/`;
- телефон: `+7 903 156-65-66`;
- пользователь платформы: `id=11`;
- email: `suslin21@ya.ru`.

Последняя smoke-проверка прошла:

```text
npm run smoke:api:apply
OK health
OK admin token configured
OK /api/auth/me access
OK /api/admin/users access flags
Test user: id=11, email=suslin21@ya.ru, phone=+7 (903) 156-65-66
OK author access toggle
OK author profile exists
OK Bitrix sync synced
OK public recipes privacy
All smoke checks passed.
```

Временный admin JWT после проверки был удалён. Локальный `scripts/smoke_api.local.json` удалён.

## 10. Ускорение разработки

В `HTML_coffee_menu/package.json` добавлены команды:

```bash
npm run check
npm run smoke:api
npm run smoke:api:apply
npm run deploy:frontend
npm run deploy:admin
npm run deploy:backend
```

Что делают:

- `npm run check` — preflight: `py_compile server/main.py`, сборка admin bundle, `node --check`, `npm run build`, sync docs, secret scan.
- `npm run smoke:api` — production smoke через API.
- `npm run smoke:api:apply` — smoke с включением автора тестовому пользователю и проверкой Битрикс-синхронизации.
- `npm run deploy:frontend` — build + upload `dist/`, не удаляет `admin-panel.js`.
- `npm run deploy:admin` — `server/admin/build.sh`, `node --check`, upload `admin-panel.js`.
- `npm run deploy:backend` — `py_compile`, SQLite backup, upload `server/main.py`, restart API, health check.

Документы:

- `DEPLOY.md`;
- `CHECKLIST_RELEASE.md`;
- `PROJECT_MAP.md`;
- `CONTEXT.md`;
- `NEXT_CHAT_HANDOFF.md`.

## 11. Как начинать работу в новом чате

Сначала:

```bash
cd /Users/Romka/Downloads/All_Code/Coffee_menu/HTML_coffee_menu
git status --short --branch
git fetch origin
git status --short --branch
npm run check
```

Если задача касается автора/Битрикс:

```bash
npm run smoke:api
```

Для smoke нужен ignored config:

```bash
cp scripts/smoke_api.example.json scripts/smoke_api.local.json
```

В `scripts/smoke_api.local.json` нельзя коммитить реальные admin credentials или token.

## 12. Git-состояние

На момент handoff 17 июня 2026:

- `Coffee_menu/HTML_coffee_menu`: `main...origin/main`, рабочая папка dirty после серии изменений author-слоя.
- Backend `Coffee_menu/server` не является отдельным git repo; изменения backend лежат в соседнем `server/main.py`.
- Последний известный коммит до серии author-правок: `5f06321 docs: add next chat handoff`.
- `bitrix-tools`: ранее был dirty, не чистили глубоко, есть backup patch в `/private/tmp/mbs-risk-backups/`.

Последние важные коммиты:

```text
5f06321 docs: add next chat handoff
a15122a test: allow smoke checks with admin token
6beb355 test: add API smoke checks
bb3cbaf chore: add release and deploy workflow
416e7c1 docs: mark Bitrix author sync configured
9b1ab5d feat: add access layers and author workspace
```

## 13. Production

Production:

- сайт: `https://barista-school.online`;
- admin: `https://baristaschool.online/admin`;
- API health: `https://barista-school.online/api/health`;
- сервер: `root@159.194.233.13`;
- backend service: `coffee-menu-api.service`;
- backend path: `/var/www/coffee-menu/server`;
- frontend dist: `/var/www/coffee-menu/dist`;
- DB: `/var/www/coffee-menu/server/data/app.db`.

Перед backend-деплоем обязательно делать SQLite backup.

Последний production deploy author-слоя:

- backend и frontend выкатаны 17 июня 2026;
- production health: `https://barista-school.online/api/health` отвечает `{"ok":true,"version":"1.0.0"}`;
- production HTML подключал bundle `/assets/index-CIQA3tiy.js`;
- на production SQLite проверены таблицы `author_recipe_drafts`, `author_ingredients`, `author_semis`;
- `npm run deploy:backend` может показать ранний `curl: (7)` сразу после restart API, но повторная проверка `systemctl is-active coffee-menu-api.service` и `/api/health` проходит.

## 14. Правила безопасности

- Не трогать `.env` без отдельного явного разрешения.
- Не выводить реальные webhook/token/password.
- Не коммитить `scripts/smoke_api.local.json`.
- Не коммитить `.env`, `.env.production` с приватными значениями.
- Перед production backend-деплоем делать backup SQLite.
- Если создаётся временный admin JWT для smoke-теста, пользователь должен явно разрешить это; токен не выводить, config удалить после проверки.
- Public API не должен отдавать:
  - phone;
  - email;
  - Telegram;
  - yClients ID;
  - `bitrix_contact_id`;
  - внутренние приватные поля автора.

## 15. Admin panel

Admin panel исходники:

- `server/admin/src/_header.js`;
- `server/admin/src/_styles.js`;
- `server/admin/src/_html.js`;
- `server/admin/src/_utils.js`;
- `server/admin/src/_drawer.js`;
- `server/admin/src/_tab.js`;
- `server/admin/src/_equipment.js`;
- `server/admin/src/_suppliers.js`;
- `server/admin/src/_presets.js`;
- `server/admin/src/_authors.js`;
- `server/admin/src/_render.js`;
- `server/admin/src/_auth.js`;
- `server/admin/src/_events.js`.

Правило: редактировать исходники `server/admin/src/*`, затем запускать:

```bash
bash server/admin/build.sh
```

Или использовать:

```bash
npm run deploy:admin
```

`server/admin/admin-panel.js` — bundle, который деплоится в `/var/www/coffee-menu/dist/admin-panel.js`.

## 16. Важные API endpoints

Auth:

- `POST /api/auth/login`;
- `GET /api/auth/me`;
- `GET /api/state`;
- `PUT /api/state`.

Admin:

- `GET /api/admin/users`;
- `PATCH /api/admin/users/{user_id}`;
- `GET /api/admin/authors`;
- `POST /api/admin/authors/{user_id}/sync-bitrix`;
- `GET /api/admin/author-recipes`;
- `GET /api/admin/author-recipes/{pub_id}`;
- `PATCH /api/admin/author-recipes/{pub_id}`.

Author:

- `GET /api/author/profile`;
- `PUT /api/author/profile`;
- `POST /api/author/profile/avatar`;
- `GET /api/author/drafts`;
- `POST /api/author/drafts`;
- `PUT /api/author/drafts/{draft_id}`;
- `DELETE /api/author/drafts/{draft_id}`;
- `GET /api/author/ingredients`;
- `PUT /api/author/ingredients/{mat_key}`;
- `DELETE /api/author/ingredients/{mat_key}`;
- `GET /api/author/semis`;
- `POST /api/author/semis`;
- `PUT /api/author/semis/{semi_id}`;
- `DELETE /api/author/semis/{semi_id}`;
- `POST /api/author/recipe-image`;
- `GET /api/author/recipes`;
- `POST /api/author/recipes`.

Public:

- `GET /api/public/author-recipes`;
- `GET /api/public/author-recipes/{slug}`;
- `POST /api/public/author-recipes/{recipe_id}/order`.

Health:

- `GET /api/health`.

Mixology author access:

- публичного endpoint нет;
- импорт whitelist выполняется серверным скриптом `server/scripts/import_mixology_author_access.py`;
- runtime-файл `server/data/mixology_author_access.json` приватный.

## 17. Следующие возможные направления

Роман сам выберет, с чего продолжать. Возможные направления:

### A. MVP заказа опубликованного авторского рецепта

Минимальный сценарий:

1. Покупатель видит опубликованный рецепт на public-витрине.
2. Оставляет заявку.
3. Backend создаёт запись в `recipe_orders`.
4. Backend создаёт/находит контакт покупателя в Битрикс.
5. Backend создаёт сделку в Битрикс в воронке `CATEGORY_ID=28`.
6. Сделка содержит рецепт, автора, цену, источник и ссылку/ID платформы.
7. В `recipe_orders` сохраняется `bitrix_deal_id`.
8. Admin видит список заказов и ссылку на сделку.

Первый релиз без полноценной оплаты и автоматической выдачи рецепта внутри платформы.

### B. Улучшение кабинета автора

Возможные задачи:

- добавить реальные поля/статусы договора ГПХ;
- добавить банковские/налоговые данные автора после согласования юридической модели;
- добавить реальные продажи/начисления/выплаты в блок `Финансы`;
- сделать публичный preview карточки перед отправкой;
- добавить подсказки по заполнению сложных блоков рецепта.

### C. Модерация и admin workflow

Возможные задачи:

- добавить уведомления автору о доработке/публикации;
- добавить очередь модерации и сортировку по дате/статусу;
- добавить более подробную историю действий администратора;
- добавить internal notes, не видимые автору.

### D. Public-витрина

Возможные задачи:

- список опубликованных рецептов;
- страница рецепта;
- форма заявки;
- безопасный public API;
- встраивание на `baristaschool.ru` или Tilda-блок.

### E. Битрикс и выплаты

Возможные задачи:

- сделки по рецептам в `CATEGORY_ID=28`;
- связь сделки с рецептом и автором;
- выплаты автору;
- dashboard по продажам;
- документы через Битрикс.

### F. Инвентаризация `bitrix-tools`

Делать минимально, если понадобится:

- найти файлы, которые создают сделки;
- найти файлы, которые считают выплаты;
- найти использование `CATEGORY_ID=28`;
- не рефакторить широко без отдельной задачи.

## 18. Рекомендованный старт нового чата

Можно написать в новый чат:

```text
Прочитай /Users/Romka/Downloads/All_Code/Coffee_menu/HTML_coffee_menu/NEXT_CHAT_HANDOFF.md.

Мы продолжаем работу над платформой barista-school.online для Московской школы бариста.
Я сам выберу следующую задачу. Сначала проверь git status, прочитай PROJECT_MAP.md, CONTEXT.md, DEPLOY.md и CHECKLIST_RELEASE.md.
Не трогай .env и не выводи секреты.
Перед правками запускай npm run check.
Если задача касается автора/Битрикс, используй smoke-тесты из package.json.
```

## 19. Что специально не делать без запроса

- Не менять архитектуру проекта.
- Не чистить широко `bitrix-tools`.
- Не переносить backend в другой репозиторий.
- Не делать полноценную оплату/выдачу рецептов, пока не утверждён сценарий.
- Не создавать новые зависимости без необходимости.
- Не удалять старые файлы без объяснения и подтверждения.
