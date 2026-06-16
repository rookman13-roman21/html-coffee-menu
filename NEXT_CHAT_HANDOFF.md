# NEXT_CHAT_HANDOFF — Coffee_menu / barista-school.online

Дата: 16 июня 2026.

## 1. Контекст

Работаем над платформой `barista-school.online` для Московской школы бариста.

Главная новая линия продукта: платформа авторских рецептов.

`Coffee_menu` сейчас является ядром:

- кабинет клиента кофейни;
- кабинет автора рецептов;
- public-витрина авторских рецептов;
- admin backend для доступов, авторов, публикаций и справочников.

Связанные проекты:

- `/Users/Romka/Downloads/All_Code/Coffee_menu` — основное ядро;
- `/Users/Romka/Downloads/All_Code/bitrix-tools` — справочник паттернов Битрикс, будущие выплаты/документы;
- `/Users/Romka/Downloads/All_Code/mbs-mixology-cup` — источник контекста по участникам чемпионата.

## 2. Что уже сделано

### Доступы

В backend/admin/frontend есть три слоя:

- `access_drinks` / `drinks`: `Поставщики`, `Рецептуры`;
- `access_finance` / `finance`: `Бюджет`, `План продаж`, `Финмодель`;
- `access_author` / `author`: кабинет автора рецептов.

Новые пользователи по умолчанию без пакетов. Доступы выдаются через `/admin`.

### Автор рецептов

Сделаны:

- таблица `author_profiles`;
- таблица `recipe_publications`;
- таблица `recipe_orders`;
- авторский блок во вкладке `Рецептуры`;
- admin-раздел `Авторы`;
- public API/витрина опубликованных рецептов.

### Битрикс

При включении `Автор рецептов` backend best-effort синхронизирует автора с Битрикс:

- ищет/создаёт контакт;
- пишет `bitrix_contact_id`;
- добавляет метку `Автор рецептов`;
- добавляет timeline-комментарий;
- не пишет служебные данные в `COMMENTS`.

На production настроено:

- `BITRIX_WEBHOOK`;
- `BITRIX_AUTHOR_MARK_FIELD=UF_CRM_1766349995197`;
- `BITRIX_AUTHOR_MARK_LABEL=Автор рецептов`;
- enum `Автор рецептов` добавлен в поле Битрикс.

Тестовый контакт:

- Битрикс: `https://baristaschool.bitrix24.ru/crm/contact/details/10828/`;
- телефон: `+7 903 156-65-66`;
- пользователь платформы: `id=11`, `suslin21@ya.ru`.

Последняя проверка:

```text
npm run smoke:api:apply
OK author access toggle
OK author profile exists
OK Bitrix sync synced
OK public recipes privacy
```

Временный admin JWT для проверки был удалён, `scripts/smoke_api.local.json` удалён.

### Ускорение разработки

Добавлены команды:

```bash
npm run check
npm run smoke:api
npm run smoke:api:apply
npm run deploy:frontend
npm run deploy:admin
npm run deploy:backend
```

Документы:

- `DEPLOY.md`;
- `CHECKLIST_RELEASE.md`;
- `PROJECT_MAP.md`;
- `CONTEXT.md`.

## 3. Как начинать новый чат

1. Открыть проект:

```bash
cd /Users/Romka/Downloads/All_Code/Coffee_menu/HTML_coffee_menu
git status --short --branch
```

2. Перед правками:

```bash
git fetch origin
git status --short --branch
npm run check
```

3. Если задача касается автора/Битрикс:

```bash
npm run smoke:api
```

Для `smoke:api` нужен локальный ignored config:

```bash
cp scripts/smoke_api.example.json scripts/smoke_api.local.json
```

В него нельзя коммитить реальные admin credentials или token.

## 4. Следующая продуктовая задача

Не уходить в глубокую чистку `bitrix-tools`, пока бизнес-логика MVP не зафиксирована.

Лучший следующий шаг:

**MVP заказа опубликованного авторского рецепта**

Минимальный сценарий:

1. Покупатель видит опубликованный рецепт на public-витрине.
2. Оставляет заявку.
3. Backend создаёт запись в `recipe_orders`.
4. Backend создаёт/находит контакт покупателя в Битрикс.
5. Backend создаёт сделку в Битрикс в воронке `CATEGORY_ID=28`.
6. Сделка содержит рецепт, автора, цену, источник и ссылку/ID платформы.
7. В `recipe_orders` сохраняется `bitrix_deal_id`.
8. Admin видит список заказов и ссылку на сделку.

Первый релиз без полноценной оплаты и автоматической выдачи рецепта внутри платформы. Продажа и обработка идут через Битрикс.

## 5. Риски и правила

- Не трогать `.env` без отдельного разрешения.
- Не выводить реальные webhook/token/password.
- Перед backend-деплоем делать SQLite backup.
- Admin-панель править в `server/admin/src/*`, затем собирать `server/admin/build.sh`.
- Public API не должен отдавать `email`, `phone`, `telegram`, yClients ID, `bitrix_contact_id`.
- `bitrix-tools` сейчас использовать как справочник, не рефакторить широко без отдельной задачи.

## 6. Последние коммиты

```text
a15122a test: allow smoke checks with admin token
6beb355 test: add API smoke checks
bb3cbaf chore: add release and deploy workflow
416e7c1 docs: mark Bitrix author sync configured
9b1ab5d feat: add access layers and author workspace
```
