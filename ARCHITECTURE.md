# ARCHITECTURE — Coffee_menu

Документ для быстрых решений по росту проекта. `PROJECT_MAP.md` хранит подробную карту и историю, `CONTEXT.md` — полный контекст, `NEXT_CHAT_HANDOFF.md` — что обязательно прочитать в новом чате. Этот файл нужен как рабочий фундамент: домены, владельцы данных, права, опасные действия и проверки.

## 1. Границы продукта

`Coffee_menu` сейчас состоит из четырёх пользовательских поверхностей:

| Поверхность | Назначение | Основные файлы |
|---|---|---|
| Кабинет кофейни | Бюджет, поставщики, план продаж, финмодель, рецепты, настройки проекта | `src/main.js`, `src/render/*`, `src/ui/*`, `src/state/store.js` |
| Настройки проекта | Аккаунт, проект, команда, заведения, журнал, восстановление, интеграции | `src/render/settings.js`, `src/ui/auth.js`, `src/ui/locations.js`, `src/access/permissions.js` |
| Кабинет автора | Авторские рецепты, профиль, черновики, отправка на модерацию | `src/access/author-layer.js`, `src/ui/author.js`, `server/main.py` |
| Admin | Пользователи, доступы, авторы, публикации, справочники | `server/admin/src/*`, `server/admin/admin-panel.js`, `server/main.py` |

Правило: новая функция должна быть явно привязана к одной из этих поверхностей. Если функция затрагивает несколько поверхностей, сначала описать контракт между ними. Source of truth для backend-кода — `HTML_coffee_menu/server`; соседний `Coffee_menu/server` не использовать для новых правок.

## 2. Домены и источники правды

| Домен | Источник правды | Frontend | Backend/API | Важное правило |
|---|---|---|---|---|
| Аккаунт | `users` | `src/render/settings.js`, `src/ui/auth.js` | `/api/auth/*`, `/api/account/*` | Email read-only в v1; клиенту не показывать внутренние sync-статусы |
| Проект | `workspaces.state_json` + `workspace_members` | `src/render/settings.js`, `src/ui/locations.js`, `src/state/store.js` | `/api/workspaces`, `/api/state` | `workspace` = общий проект команды |
| Заведения | `workspaces.state_json.locIndex/locations/activeId` | `src/ui/locations.js`, `src/render/settings.js` | `/api/state` | `Заведение` = точка внутри проекта; структура owner-only |
| Команда | `workspace_members`, `workspace_invites` | `src/render/settings.js` | `/api/workspaces/{id}/members`, `/invites` | Управляет только owner |
| Журнал | `workspace_activity` | `src/render/settings.js` | `/api/workspaces/{id}/activity` | Append-only; не логировать каждый autosave; owner-only события нельзя писать от editor/guest |
| Восстановление | `workspace_state_snapshots` | `src/render/settings.js` | `/api/workspaces/{id}/snapshots` | Restore только owner; перед restore создавать `before_restore` |
| Бюджет/финмодель/продажи | `workspaces.state_json` | `src/render/dashboard.js`, `src/render/finmodel.js`, `src/render/sales.js` | `/api/state` | Guest/editor редактирует содержимое, но не может массово очистить проект |
| Рецепты/поставщики клиента | `workspaces.state_json` + справочники | `src/render/recipes.js`, `src/render/cost.js`, `src/ui/suppliers.js` | `/api/state`, `/api/suppliers`, `/api/drinks/overrides` | Удаление ключевых сущностей owner-only |
| Авторская платформа | author-таблицы backend | `src/access/author-layer.js`, `src/ui/author.js` | `/api/author/*`, `/api/public/author-recipes/*` | Author data не считать частью client workspace state |
| Admin-справочники | SQLite tables | `server/admin/src/*` | `/api/admin/*`, `/api/oc-library`, `/api/suppliers` | Admin bundle пересобирать после правок `server/admin/src/*` |

## 3. Матрица ролей v1

| Действие | owner | editor | guest-editor | admin |
|---|---:|---:|---:|---:|
| Создать свой проект | если есть `access_drinks/access_finance` | если есть `access_drinks/access_finance` | нет | да |
| Переключаться между доступными проектами | да | да | да | да |
| Редактировать содержимое существующей точки | да | да | да | да |
| Приглашать/удалять участников | да | нет | нет | через admin/API по отдельному сценарию |
| Переименовать проект | да | нет | нет | да |
| Добавить/создать/переименовать/удалить заведение | да | нет | нет | да |
| Удалить рецепты, поставщиков, сырьё, полуфабрикаты | да | нет | нет | да |
| Массовый сброс/очистка проекта | да | нет | нет | да |
| Создать/восстановить snapshot | да | нет | нет | да |
| Видеть журнал проекта | да | да | да | да |
| Писать события журнала | allowlist + owner-only события | allowlist без owner-only событий | allowlist без owner-only событий | allowlist |

Правило: UI-ограничение не считается защитой. Всё owner-only должно блокироваться на backend, в `PUT /api/state` semantic guard или в owner-only guard ручного журнала. Frontend-права централизованы в `src/access/permissions.js`, а `src/ui/auth.js` отдаёт совместимые wrappers для существующих inline-сценариев.

## 4. Правила безопасности данных

1. `workspaces.state_json` — главный источник правды для клиентского проекта.
2. `localStorage` — только кэш интерфейса. Для авторизованного пользователя ключи заведений должны иметь scope `user + workspace_id`.
3. При смене workspace сначала очищать старые `Loc.list`, `Loc.activeId` и runtime state, потом восстанавливать server state активного проекта.
4. Асинхронные ответы вкладок settings должны иметь guard по `workspace_id`, чтобы старый ответ не перерисовал новый проект.
5. Guest/editor не может менять структуру проекта или удалять сущности, которые владелец не сможет быстро восстановить.
6. `PUT /api/state` для non-owner должен блокировать structural/destructive overwrite.
7. Поля из state, которые попадают в `innerHTML` или inline handlers, нужно экранировать: особенно `loc.id`, `loc.name`, `loc.icon`.
8. Public API не должен отдавать приватные поля автора, внутренние IDs, телефоны поставщиков anonymous-пользователю или служебные sync-статусы.
9. `.env`, runtime DB, private whitelist и реальные токены не должны попадать в Git.
10. В клиентском UI не показывать пользователям внутренние названия интеграций и CRM-синхронизаций.
11. `POST /api/workspaces/{id}/activity` не должен принимать owner-only события от editor/guest: журнал является частью контроля безопасности.

## 5. API-карта для командного слоя

| Endpoint | Роль | Назначение |
|---|---|---|
| `GET /api/state` | member | Получить state активного или указанного workspace |
| `PUT /api/state` | member + guard | Сохранить state workspace; destructive overwrite для non-owner запрещён |
| `GET /api/workspaces` | user | Список доступных и архивных проектов + `can_create_workspaces` |
| `POST /api/workspaces` | paid/admin | Создать проект |
| `PATCH /api/workspaces/{id}` | owner | Переименовать проект |
| `POST /api/workspaces/{id}/archive` | owner | Архивировать проект |
| `POST /api/workspaces/{id}/restore` | owner | Вернуть проект из архива |
| `DELETE /api/workspaces/{id}` | owner | Удалить проект |
| `GET /api/workspaces/{id}/members` | member | Участники и pending invites проекта |
| `POST /api/workspaces/{id}/invites` | owner | Создать приглашение; duplicate email возвращает существующую pending-ссылку |
| `DELETE /api/workspaces/{id}/invites/{invite_id}` | owner | Отозвать приглашение |
| `POST /api/workspace-invites/{token}/accept` | user | Принять приглашение |
| `DELETE /api/workspaces/{id}/members/{user_id}` | owner | Удалить участника |
| `GET /api/workspaces/{id}/activity` | member | Журнал активного проекта |
| `POST /api/workspaces/{id}/activity` | member + allowlist + owner-only guard | Записать явное событие, не autosave; owner-only события блокируются для editor/guest |
| `GET /api/workspaces/{id}/snapshots` | member | Список точек восстановления |
| `POST /api/workspaces/{id}/snapshots` | owner | Создать ручную точку восстановления |
| `POST /api/workspaces/{id}/snapshots/{snapshot_id}/restore` | owner | Восстановить проект из точки |

## 6. Правило добавления новой функции

Перед кодом ответить на пять вопросов:

1. Какой домен меняется?
2. Какой источник правды у данных?
3. Какие роли могут видеть и менять данные?
4. Какие действия опасные или необратимые?
5. Какие smoke-сценарии нужно добавить в `CHECKLIST_RELEASE.md`?

После реализации обновить:

- `ARCHITECTURE.md`, если меняется домен, API, роли или безопасность;
- `PROJECT_MAP.md`, если меняется карта файлов или появляется новый слой;
- `NEXT_CHAT_HANDOFF.md`, если следующий чат должен знать новый контекст;
- `CHECKLIST_RELEASE.md`, если появляется новый риск регрессии.

## 7. Базовые smoke-сценарии

Минимум перед release, если менялся workspace/settings/state:

1. Owner с `access_drinks` или `access_finance` создаёт проект и видит кнопку `Новый проект`.
2. Guest без тарифа принимает invite, попадает в чужой проект и не может создать свой проект.
3. Owner и guest видят один и тот же state существующей точки после изменения разрешённых полей.
4. Guest/editor не может добавить, удалить или переименовать заведение.
5. Guest/editor не может удалить рецепт, поставщика, сырьё, полуфабрикат или массово очистить проект.
6. Два проекта с разными заведениями, командой и журналом не смешиваются при переключении.
7. `/app/settings` на вкладках `Команда`, `Журнал`, `Восстановление`, `Заведения` показывает данные только активного проекта.
8. Журнал показывает московское время, роль и аватар автора события.
9. Anonymous `/api/suppliers` возвращает `403`.
10. Public recipes API не отдаёт приватные ключи и служебные поля.
11. Editor/guest не может через прямой `POST /api/workspaces/{id}/activity` записать `workspace_deleted`, `member_removed`, `location_deleted`, `snapshot_restored` и другие owner-only события.

## 8. Что не делать без отдельного решения

- Не делать большой rewrite всего frontend.
- Не переносить все данные в новую схему без миграционного плана.
- Не добавлять новые роли (`viewer`, granular permissions) без матрицы прав.
- Не делать chat/CRM-задачи внутри workspace до стабилизации базового командного слоя.
- Не менять `.env` и production-интеграции в рамках обычных UI-задач.
- Не добавлять зависимости только ради косметики.
