import {
  getActiveWorkspaceId, getCurrentWorkspace, getWorkspaces, setActiveWorkspaceId,
  fetchState, createWorkspace, renameWorkspace, archiveWorkspace, deleteWorkspace, fetchWorkspaceMembers,
  createWorkspaceInvite, removeWorkspaceMember, revokeWorkspaceInvite,
  fetchWorkspaceActivity, fetchWorkspaceSnapshots, createWorkspaceSnapshot,
  restoreWorkspaceSnapshot, canCreateWorkspaces, isWorkspaceOwner, getUser,
  refreshCurrentUser, updateAccountProfile, uploadAccountAvatar as uploadAccountAvatarApi,
  requestOwnPasswordReset,
} from '../ui/auth.js';

let _settingsSection = 'account';
let _activityFilter = 'all';
let _settingsNotice = '';
const _projectSummaryCache = new Map();

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function roleLabel(role) {
  return role === 'owner' ? 'владелец' : 'редактор';
}

function accountRoleLabel(user = getUser(), current = getCurrentWorkspace()) {
  if (current?.role === 'owner') return 'владелец проекта';
  if (user?.account_role === 'guest') return 'гость';
  if (user?.can_create_workspaces) return 'платный аккаунт';
  return 'редактор';
}

function userInitial(user = {}) {
  return String(user.name || user.email || '?')[0].toUpperCase();
}

function avatarHtml(url, label, className = 'workspace-member-avatar') {
  const safeUrl = String(url || '').trim();
  const initial = String(label || '?')[0].toUpperCase();
  return `<div class="${className}">${safeUrl ? `<img src="${esc(safeUrl)}" alt="">` : esc(initial)}</div>`;
}

function accessItems(user = getUser()) {
  const access = user?.access || {};
  return [
    ['Проекты', user?.can_create_workspaces ? 'доступно' : 'гость'],
    ['Финмодель', access.finance || user?.is_admin ? 'доступно' : 'нет доступа'],
    ['Рецепты', access.drinks || user?.is_admin ? 'доступно' : 'нет доступа'],
    ['Авторский режим', access.author || user?.is_admin ? 'доступно' : 'нет доступа'],
  ];
}

function activityRoleLabel(row = {}) {
  if (row.actor_role === 'owner') return 'владелец';
  if (row.actor_role === 'editor') return 'редактор';
  if (row.account_role === 'guest') return 'гость';
  if (row.account_role === 'paid') return 'платный';
  if (row.account_role === 'owner') return 'владелец';
  return row.actor_role || '';
}

function fmtDate(value) {
  if (!value) return '';
  try {
    const raw = String(value);
    const normalized = /([zZ]|[+-]\d{2}:?\d{2})$/.test(raw) ? raw : `${raw}Z`;
    return new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Europe/Moscow',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(normalized));
  } catch { return String(value); }
}

function activityLabel(action) {
  const labels = {
    project_opened: 'Вход в проект', workspace_created: 'Создан проект', workspace_renamed: 'Проект переименован',
    workspace_switched: 'Смена проекта', workspace_reset: 'Сброс проекта',
    workspace_archived: 'Проект архивирован', workspace_deleted: 'Проект удалён',
    snapshot_created: 'Точка восстановления', snapshot_restored: 'Восстановление',
    invite_created: 'Приглашение', invite_accepted: 'Принято приглашение', invite_revoked: 'Отозвано приглашение',
    member_removed: 'Участник удалён', location_created: 'Точка добавлена', location_renamed: 'Заведение изменено',
    location_deleted: 'Точка удалена', opening_costs_changed: 'Бюджет открытия', finmodel_changed: 'Финмодель',
    payroll_changed: 'ФОТ', sales_changed: 'План продаж', recipe_changed: 'Рецепт', supplier_changed: 'Поставщик',
    export_created: 'Экспорт', state_update_blocked: 'Действие заблокировано'
  };
  return labels[action] || action;
}

function activityGroup(action) {
  if (['invite_created', 'invite_accepted', 'invite_revoked', 'member_removed'].includes(action)) return 'team';
  if (['location_created', 'location_renamed', 'location_deleted', 'workspace_created', 'workspace_renamed', 'workspace_switched', 'workspace_archived', 'workspace_deleted'].includes(action)) return 'locations';
  if (action === 'opening_costs_changed') return 'budget';
  if (['finmodel_changed', 'payroll_changed', 'sales_changed'].includes(action)) return 'finance';
  if (action === 'recipe_changed') return 'recipes';
  if (action === 'supplier_changed') return 'suppliers';
  if (action === 'export_created') return 'exports';
  if (['snapshot_created', 'snapshot_restored', 'workspace_reset', 'workspace_archived', 'workspace_deleted', 'state_update_blocked'].includes(action)) return 'security';
  return 'work';
}

function snapshotReasonLabel(reason) {
  const labels = {
    manual: 'Ручная точка',
    autosave: 'Автоснимок',
    before_restore: 'Перед восстановлением',
    before_location_delete: 'Перед удалением точки',
    before_workspace_archive: 'Перед архивированием проекта',
    before_workspace_delete: 'Перед удалением проекта',
  };
  return labels[reason] || reason || 'Точка восстановления';
}

function currentRoleHint() {
  return isWorkspaceOwner()
    ? 'Вы владелец проекта и можете управлять командой, заведениями и восстановлением.'
    : 'Вы редактор проекта. Управление командой и структурой доступно владельцу проекта.';
}


const PROJECT_STAGES = [
  ['idea', 'Идея'],
  ['model', 'Расчёт'],
  ['premises', 'Поиск помещения'],
  ['renovation', 'Ремонт'],
  ['purchase', 'Закупка'],
  ['launch', 'Запуск'],
];
const PROJECT_FORMAT_LABELS = {
  kiosk: 'Киоск',
  island: 'Остров в ТЦ',
  full: 'Кофейня',
};
const PROJECT_CURRENCY_LABELS = { RUB: '₽ RUB', USD: '$ USD', EUR: '€ EUR' };

function fmtProjectDate(value) {
  if (!value) return 'не указано';
  try {
    const raw = String(value);
    const normalized = /([zZ]|[+-]\d{2}:?\d{2})$/.test(raw) ? raw : `${raw}Z`;
    return new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Europe/Moscow',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(normalized));
  } catch { return String(value); }
}

function projectMeta() {
  const meta = window.S?.projectMeta || {};
  return { city: '', stage: 'idea', openingDate: '', ...meta };
}

function projectFormatLabel() {
  const format = window.S?.openingMeta?.format || 'full';
  return PROJECT_FORMAT_LABELS[format] || format;
}

function projectCurrencyLabel() {
  const currency = window.S?.openingMeta?.currency || 'RUB';
  return PROJECT_CURRENCY_LABELS[currency] || currency;
}

function projectStageOptions(selected) {
  return PROJECT_STAGES.map(([value, label]) =>
    `<option value="${esc(value)}" ${selected === value ? 'selected' : ''}>${esc(label)}</option>`
  ).join('');
}

function projectSummary(current) {
  const locs = window.Loc?.list || [];
  const cached = current?.id ? _projectSummaryCache.get(String(current.id)) : null;
  return {
    ownerName: cached?.ownerName || (current?.role === 'owner' ? 'Вы' : 'Владелец проекта'),
    memberCount: cached?.memberCount || 0,
    locationCount: locs.length || 0,
  };
}

function renderLayout(panelHtml) {
  const current = getCurrentWorkspace();
  const sections = [
    ['account', 'user-round', 'Аккаунт'],
    ['project', 'folder-kanban', 'Проект'],
    ['team', 'users', 'Команда'],
    ['locations', 'store', 'Заведения'],
    ['activity', 'list-checks', 'Журнал'],
    ['snapshots', 'history', 'Восстановление'],
    ['integrations', 'key-round', 'Интеграции'],
  ];
  return `
    <section class="settings-page">
      <div class="settings-head">
        <div>
          <h1>Кабинет и настройки</h1>
          <p>${esc(current?.name || 'Проект не выбран')}</p>
        </div>
        <button class="btn btn-outline" type="button" onclick="toggleLocMenu(event)">
          <i data-lucide="chevrons-up-down" class="icon"></i> Сменить проект
        </button>
      </div>
      ${_settingsNotice ? `<div class="settings-notice">${esc(_settingsNotice)}</div>` : ''}
      <div class="settings-shell">
        <aside class="settings-side">
          ${sections.map(([key, icon, label]) => `
            <button type="button" class="${_settingsSection === key ? 'active' : ''}" onclick="settingsSetSection('${key}')">
              <i data-lucide="${icon}" class="icon"></i>
              <span>${label}</span>
            </button>
          `).join('')}
        </aside>
        <div class="settings-panel" id="settings-panel">${panelHtml}</div>
      </div>
    </section>
  `;
}

function renderAccountSection() {
  const user = getUser() || {};
  const avatar = user.avatar_url || '';
  return `
    <div class="settings-grid">
      <div class="settings-card">
        <div class="settings-card-head">
          <div>
            <h2>Личные данные</h2>
            <p>Эти данные видны в команде проекта и используются для связи.</p>
          </div>
          <span class="settings-role">${esc(accountRoleLabel(user))}</span>
        </div>
        <div class="settings-account-profile">
          <button class="settings-avatar" type="button" onclick="document.getElementById('settings-account-avatar-file')?.click()" title="Загрузить фото">
            ${avatar ? `<img src="${esc(avatar)}" alt="">` : `<span>${esc(userInitial(user))}</span>`}
          </button>
          <div class="settings-account-main">
            <input id="settings-account-avatar-file" type="file" accept="image/jpeg,image/png,image/webp" style="display:none" onchange="settingsUploadAccountAvatar(this)">
            <label class="settings-label">Имя</label>
            <div class="settings-inline-form">
              <input id="settings-account-name" type="text" value="${esc(user.name || '')}" placeholder="Ваше имя">
              <button class="btn-green" type="button" onclick="settingsSaveAccountProfile()">Сохранить</button>
            </div>
            <label class="settings-label">Телефон</label>
            <div class="settings-inline-form">
              <input id="settings-account-phone" type="tel" value="${esc(user.phone || '')}" placeholder="+7 999 999-28-36">
              <button class="btn btn-outline" type="button" onclick="settingsSaveAccountProfile()">Обновить</button>
            </div>
          </div>
        </div>
        <label class="settings-label">Email</label>
        <div class="settings-inline-form">
          <input type="email" value="${esc(user.email || '')}" disabled>
          <button class="btn btn-outline" type="button" disabled>Нельзя изменить</button>
        </div>
        <div class="settings-hint">Email используется для входа и доступа к проектам, изменить его пока нельзя.</div>
      </div>
      <div class="settings-card">
        <div class="settings-card-head">
          <div>
            <h2>Доступ и безопасность</h2>
            <p>Смена пароля выполняется через письмо на текущий email.</p>
          </div>
        </div>
        <div class="settings-access-list">
          ${accessItems(user).map(([label, value]) => `
            <div class="settings-access-row">
              <span>${esc(label)}</span>
              <strong>${esc(value)}</strong>
            </div>
          `).join('')}
        </div>
        <button class="btn btn-outline settings-full-btn" type="button" onclick="settingsRequestPasswordReset()">
          <i data-lucide="key-round" class="icon"></i> Сменить пароль
        </button>
        <div class="settings-hint">Мы отправим ссылку для смены пароля на email, указанный в аккаунте.</div>
      </div>
    </div>
  `;
}

function emptyProjectHtml() {
  return `
    <div class="settings-card settings-empty-card">
      <i data-lucide="lock" class="icon settings-empty-icon"></i>
      <h2>Нет доступного проекта</h2>
      <p>Попросите владельца отправить новое приглашение или выберите аккаунт с доступом к проекту.</p>
    </div>
  `;
}

function renderProjectSection() {
  const current = getCurrentWorkspace();
  const workspaces = getWorkspaces();
  const owner = isWorkspaceOwner();
  const meta = projectMeta();
  const summary = projectSummary(current);
  if (!current) return emptyProjectHtml();
  return `
    <div class="settings-project-layout">
      <div class="settings-project-main">
        <div class="settings-card">
          <div class="settings-card-head">
            <div>
              <h2>Сводка проекта</h2>
              <p>Основная информация о текущем проекте кофейни.</p>
            </div>
            <span class="settings-role">${roleLabel(current?.role)}</span>
          </div>
          <div class="settings-summary-grid">
            <div><span>Владелец</span><strong>${esc(summary.ownerName)}</strong></div>
            <div><span>Ваша роль</span><strong>${esc(roleLabel(current?.role))}</strong></div>
            <div><span>Участники</span><strong>${summary.memberCount ? `${summary.memberCount}` : '...'}</strong></div>
            <div><span>Заведения</span><strong>${summary.locationCount}</strong></div>
            <div><span>Создан</span><strong>${esc(fmtProjectDate(current.created_at))}</strong></div>
            <div><span>Обновлён</span><strong>${esc(fmtProjectDate(current.updated_at))}</strong></div>
          </div>
        </div>

        <div class="settings-card">
          <div class="settings-card-head">
            <div>
              <h2>Параметры проекта</h2>
              <p>Эти данные помогают команде понимать контекст запуска.</p>
            </div>
          </div>
          <div class="settings-fields-grid">
            <label class="settings-field">
              <span>Город</span>
              <input id="settings-project-city" type="text" value="${esc(meta.city)}" placeholder="Москва" ${owner ? '' : 'disabled'}>
            </label>
            <label class="settings-field">
              <span>Планируемое открытие</span>
              <input id="settings-project-opening-date" type="date" value="${esc(meta.openingDate)}" ${owner ? '' : 'disabled'}>
            </label>
            <label class="settings-field">
              <span>Стадия</span>
              <select id="settings-project-stage" ${owner ? '' : 'disabled'}>${projectStageOptions(meta.stage)}</select>
            </label>
            <div class="settings-field settings-field-readonly">
              <span>Формат</span>
              <strong>${esc(projectFormatLabel())}</strong>
            </div>
            <div class="settings-field settings-field-readonly">
              <span>Валюта</span>
              <strong>${esc(projectCurrencyLabel())}</strong>
            </div>
          </div>
          ${owner
            ? '<button class="btn-green settings-save-meta" type="button" onclick="settingsSaveProjectMeta()">Сохранить параметры</button>'
            : '<div class="settings-hint">Параметры проекта может менять только владелец.</div>'}
        </div>

        <div class="settings-card">
          <div class="settings-card-head">
            <div>
              <h2>Управление проектом</h2>
              <p>Название проекта видно всем участникам и используется в верхнем переключателе.</p>
            </div>
          </div>
          <label class="settings-label">Название проекта</label>
          <div class="settings-inline-form">
            <input id="settings-project-name" type="text" value="${esc(current?.name || '')}" ${owner ? '' : 'disabled'}>
            ${owner
              ? '<button class="btn-green" type="button" onclick="settingsRenameProject()">Сохранить</button>'
              : '<button class="btn btn-outline" type="button" disabled>Доступно владельцу</button>'}
          </div>
          ${canCreateWorkspaces() ? `
            <button class="btn btn-outline settings-full-btn" type="button" onclick="settingsCreateWorkspace()">
              <i data-lucide="folder-plus" class="icon"></i> Новый проект
            </button>
          ` : '<div class="settings-hint">Свои проекты доступны на платном тарифе.</div>'}
          <div class="settings-hint">${esc(currentRoleHint())}</div>
        </div>

        ${owner ? `
          <div class="settings-card settings-danger-card">
            <div class="settings-card-head">
              <div>
                <h2>Опасная зона</h2>
                <p>Действия ниже могут сильно повлиять на рабочий проект.</p>
              </div>
            </div>
            <div class="settings-danger-actions">
              <button class="btn-danger-outline" type="button" onclick="settingsResetProjectContent()">
                <i data-lucide="rotate-ccw" class="icon"></i> Сбросить содержимое
              </button>
              <button class="btn btn-outline" type="button" onclick="settingsArchiveProject()">
                <i data-lucide="archive" class="icon"></i> Архивировать проект
              </button>
              <button class="btn-danger-outline" type="button" onclick="settingsDeleteProject()">
                <i data-lucide="trash-2" class="icon"></i> Удалить проект
              </button>
            </div>
            <div class="settings-hint">Перед архивированием или удалением создаётся точка восстановления. Действия доступны только владельцу.</div>
          </div>
        ` : ''}
      </div>

      <div class="settings-project-aside">
        <div class="settings-card">
          <div class="settings-card-head">
            <div>
              <h2>Доступные проекты</h2>
              <p>Переключайтесь между своими и приглашёнными проектами.</p>
            </div>
          </div>
          <div class="settings-list">
            ${workspaces.map(w => `
              <button class="settings-project-row settings-project-row-rich ${current && String(w.id) === String(current.id) ? 'active' : ''}" type="button" onclick="settingsSwitchWorkspace(${Number(w.id)})">
                <span>
                  <strong>${esc(w.name)}</strong>
                  <em>${esc(roleLabel(w.role))} · обновлён ${esc(fmtProjectDate(w.updated_at))}</em>
                </span>
                ${current && String(w.id) === String(current.id) ? '<small>активен</small>' : '<small>открыть</small>'}
              </button>
            `).join('') || '<div class="settings-empty">Проектов пока нет.</div>'}
          </div>
          ${canCreateWorkspaces() ? `
            <button class="btn btn-outline settings-full-btn" type="button" onclick="settingsCreateWorkspace()">
              <i data-lucide="folder-plus" class="icon"></i> Новый проект
            </button>
          ` : '<div class="settings-hint">Свои проекты доступны на платном тарифе.</div>'}
        </div>
      </div>
    </div>
  `;
}
function renderTeamLoading() {
  return '<div class="settings-card"><div class="settings-empty">Загружаем участников...</div></div>';
}

async function loadTeamSection() {
  const current = getCurrentWorkspace();
  const panel = document.getElementById('settings-panel');
  if (!panel || !current) return;
  try {
    const data = await fetchWorkspaceMembers(current.id);
    const owner = isWorkspaceOwner();
    const members = (data.members || []).map(m => `
      <div class="settings-member-row">
        ${avatarHtml(m.avatar_url, m.name || m.email)}
        <div class="settings-row-main">
          <strong>${esc(m.name || m.email)}</strong>
          <span>${esc(m.email || '')}</span>
        </div>
        <span class="workspace-role-chip">${m.role === 'owner' ? 'владелец' : (m.account_role === 'guest' ? 'гость' : 'редактор')}</span>
        ${owner && m.role !== 'owner' ? `<button class="btn btn-outline workspace-mini-btn" type="button" onclick="settingsRemoveMember(${Number(m.user_id)})">Убрать</button>` : ''}
      </div>
    `).join('');
    const invites = (data.invites || []).map(i => `
      <div class="settings-member-row">
        <div class="settings-row-main">
          <strong>${esc(i.email)}</strong>
          <span>Ожидает принятия</span>
        </div>
        ${owner ? `<button class="btn btn-outline workspace-mini-btn" type="button" data-settings-copy="${esc(i.invite_link || '')}" onclick="settingsCopyValue(this)">Копировать</button>
        <button class="btn btn-outline workspace-mini-btn" type="button" onclick="settingsRevokeInvite(${Number(i.id)})">Отозвать</button>` : ''}
      </div>
    `).join('');
    panel.innerHTML = `
      <div class="settings-card">
        <div class="settings-card-head">
          <div>
            <h2>Команда проекта</h2>
            <p>Участники работают в общем проекте. Управляет командой только владелец.</p>
          </div>
        </div>
        <div class="settings-list">${members || '<div class="settings-empty">Пока нет участников.</div>'}</div>
      </div>
      <div class="settings-card">
        <div class="settings-card-head">
          <div>
            <h2>Приглашения</h2>
            <p>Приглашённый сможет редактировать проект, но не сможет управлять командой.</p>
          </div>
        </div>
        ${invites ? `<div class="settings-list">${invites}</div>` : '<div class="settings-empty">Активных приглашений нет.</div>'}
        ${owner ? `
          <div class="settings-inline-form settings-invite-form">
            <input id="settings-invite-email" type="email" placeholder="partner@example.com">
            <button class="btn-green" type="button" onclick="settingsSendInvite()"><i data-lucide="send" class="icon"></i> Пригласить</button>
          </div>
          <div id="settings-invite-result"></div>
        ` : '<div class="settings-hint">Доступно владельцу проекта.</div>'}
      </div>
    `;
    if (window.lucide) window.lucide.createIcons({ nodes: [panel] });
  } catch (e) {
    panel.innerHTML = `<div class="settings-card"><div class="settings-empty">${esc(e.message || 'Не удалось загрузить команду')}</div></div>`;
  }
}

function renderLocationsSection() {
  const owner = isWorkspaceOwner();
  const locs = window.Loc?.list || [];
  const activeId = window.Loc?.activeId || '';
  return `
    <div class="settings-card">
      <div class="settings-card-head">
        <div>
          <h2>Заведения внутри проекта</h2>
          <p>Заведение используется в бюджете, финмодели, рецептах и документах.</p>
        </div>
        ${owner ? '<span class="settings-role">владелец</span>' : '<span class="settings-role">только просмотр</span>'}
      </div>
      <div class="settings-list">
        ${locs.map(l => `
          <button class="settings-location-row ${l.id === activeId ? 'active' : ''}" type="button" onclick="settingsSwitchLocation('${esc(l.id)}')">
            <span class="loc-emoji">${esc(l.icon || '☕')}</span>
            <span>${esc(l.name)}</span>
            ${l.id === activeId ? '<small>активно</small>' : ''}
          </button>
        `).join('') || '<div class="settings-empty">Заведений пока нет.</div>'}
      </div>
      <div class="settings-action-grid">
        ${owner ? `
          <button class="btn btn-outline" type="button" onclick="openAddLocation()"><i data-lucide="plus" class="icon"></i> Добавить точку</button>
          <button class="btn btn-outline" type="button" onclick="openTemplatesModal()"><i data-lucide="sparkles" class="icon"></i> Создать из шаблона</button>
          <button class="btn btn-outline" type="button" onclick="renameActiveLocation()"><i data-lucide="pencil" class="icon"></i> Переименовать заведение</button>
          <button class="btn-danger-outline" type="button" onclick="deleteActiveLocation()"><i data-lucide="trash-2" class="icon"></i> Удалить заведение</button>
        ` : '<div class="settings-hint">Добавлять, переименовывать и удалять заведения может только владелец проекта.</div>'}
      </div>
    </div>
  `;
}

function renderActivityLoading() {
  return '<div class="settings-card"><div class="settings-empty">Загружаем журнал...</div></div>';
}

async function loadActivitySection() {
  const panel = document.getElementById('settings-panel');
  const current = getCurrentWorkspace();
  if (!panel || !current) return;
  try {
    const rows = await fetchWorkspaceActivity(current.id);
    const filters = [
      ['all', 'Все'], ['team', 'Команда'], ['locations', 'Заведения'], ['budget', 'Бюджет'],
      ['finance', 'Финмодель'], ['recipes', 'Рецепты'], ['suppliers', 'Поставщики'],
      ['exports', 'Экспорт'], ['security', 'Безопасность'],
    ];
    const filtered = _activityFilter === 'all' ? rows : rows.filter(r => activityGroup(r.action) === _activityFilter);
    panel.innerHTML = `
      <div class="settings-card">
        <div class="settings-card-head">
          <div>
            <h2>Журнал действий</h2>
            <p>Ключевые события проекта без лишних автосохранений.</p>
          </div>
        </div>
        <div class="workspace-activity-filters settings-filters">
          ${filters.map(([key, label]) => `
            <button type="button" class="${_activityFilter === key ? 'active' : ''}" onclick="settingsSetActivityFilter('${key}')">
              ${label}<span>${rows.filter(r => key === 'all' || activityGroup(r.action) === key).length}</span>
            </button>
          `).join('')}
        </div>
        <div class="workspace-activity-list">
          ${filtered.map(r => `
            <div class="workspace-activity-row workspace-activity-${r.action === 'state_update_blocked' ? 'danger' : 'work'}">
              <div class="workspace-activity-date">${esc(fmtDate(r.created_at))}</div>
              <div class="workspace-activity-main">
                <strong>${esc(activityLabel(r.action))}</strong>
                <span>${esc(r.summary || '')}</span>
              </div>
              <div class="workspace-activity-actor">
                <div>
                  <span>${esc(r.actor_name || 'Система')}</span>
                  <small>${esc(activityRoleLabel(r))}</small>
                </div>
                ${avatarHtml(r.actor_avatar_url, r.actor_name || 'Система', 'workspace-activity-avatar')}
              </div>
            </div>
          `).join('') || '<div class="settings-empty">По этому фильтру событий пока нет.</div>'}
        </div>
      </div>
    `;
  } catch (e) {
    panel.innerHTML = `<div class="settings-card"><div class="settings-empty">${esc(e.message || 'Не удалось загрузить журнал')}</div></div>`;
  }
}

function renderSnapshotsLoading() {
  return '<div class="settings-card"><div class="settings-empty">Загружаем точки восстановления...</div></div>';
}

async function loadSnapshotsSection() {
  const panel = document.getElementById('settings-panel');
  const current = getCurrentWorkspace();
  if (!panel || !current) return;
  try {
    const owner = isWorkspaceOwner();
    const rows = await fetchWorkspaceSnapshots(current.id);
    panel.innerHTML = `
      <div class="settings-card">
        <div class="settings-card-head">
          <div>
            <h2>Восстановление</h2>
            <p>Точки восстановления помогают откатить ошибочные правки проекта.</p>
          </div>
          ${owner ? '<button class="btn-green" type="button" onclick="settingsCreateSnapshot()"><i data-lucide="save" class="icon"></i> Создать точку</button>' : ''}
        </div>
        ${owner ? '<div class="settings-hint">Перед восстановлением текущее состояние будет сохранено отдельной точкой.</div>' : '<div class="settings-hint">Восстанавливать проект может только владелец.</div>'}
        <div class="workspace-activity-list">
          ${rows.map(s => `
            <div class="workspace-activity-row">
              <div class="workspace-activity-date">${esc(fmtDate(s.created_at))}</div>
              <div class="workspace-activity-main">
                <strong>${esc(snapshotReasonLabel(s.reason))}</strong>
                <span>${Number(s.location_count || 0)} заведений${s.active_location ? ` · активное: ${esc(s.active_location)}` : ''}</span>
                <span>Создал: ${esc(s.actor_name || 'Система')}</span>
              </div>
              ${owner ? `<button class="btn btn-outline workspace-mini-btn" type="button" onclick="settingsRestoreSnapshot(${Number(s.id)})">Восстановить</button>` : ''}
            </div>
          `).join('') || '<div class="settings-empty">Точек восстановления пока нет.</div>'}
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons({ nodes: [panel] });
  } catch (e) {
    panel.innerHTML = `<div class="settings-card"><div class="settings-empty">${esc(e.message || 'Не удалось загрузить точки восстановления')}</div></div>`;
  }
}

function renderIntegrationsSection() {
  return `
    <div class="settings-card">
      <div class="settings-card-head">
        <div>
          <h2>Интеграции</h2>
          <p>OpenAI API ключ нужен только для AI-заполнения карточек оборудования.</p>
        </div>
      </div>
      <div class="settings-integration-row">
        <div>
          <strong>OpenAI API ключ</strong>
          <span>Ключ хранится только в памяти текущей вкладки и сбрасывается после перезагрузки.</span>
        </div>
        <button class="btn btn-outline" type="button" onclick="ocSetApiKey()"><i data-lucide="key-round" class="icon"></i> Настроить ключ</button>
      </div>
    </div>
  `;
}

function renderSection() {
  if (_settingsSection === 'account') return renderAccountSection();
  if (!getCurrentWorkspace()) return emptyProjectHtml();
  if (_settingsSection === 'team') return renderTeamLoading();
  if (_settingsSection === 'locations') return renderLocationsSection();
  if (_settingsSection === 'activity') return renderActivityLoading();
  if (_settingsSection === 'snapshots') return renderSnapshotsLoading();
  if (_settingsSection === 'integrations') return renderIntegrationsSection();
  return renderProjectSection();
}

function refreshUserMenu() {
  const menu = document.getElementById('loc-menu');
  if (menu) menu.innerHTML = '';
  window.renderLocSwitcherUI?.();
}

function afterRender() {
  if (_settingsSection === 'project') loadProjectSummary();
  if (_settingsSection === 'team') loadTeamSection();
  if (_settingsSection === 'activity') loadActivitySection();
  if (_settingsSection === 'snapshots') loadSnapshotsSection();
  if (window.lucide) window.lucide.createIcons();
}

export function renderSettings(section) {
  if (section) _settingsSection = section;
  const root = document.getElementById('tab-settings');
  if (!root) return;
  root.innerHTML = renderLayout(renderSection());
  afterRender();
}

export function settingsSetSection(section) {
  _settingsSection = section || 'project';
  _settingsNotice = '';
  renderSettings();
}

export async function settingsSaveAccountProfile() {
  const name = (document.getElementById('settings-account-name')?.value || '').trim();
  const phone = (document.getElementById('settings-account-phone')?.value || '').trim();
  if (!name) {
    window.showAlert?.('Введите имя');
    return;
  }
  try {
    await updateAccountProfile({ name, phone });
    await refreshCurrentUser();
    _settingsNotice = 'Личные данные сохранены.';
    refreshUserMenu();
    renderSettings('account');
  } catch (e) {
    window.showAlert?.(e.message || 'Не удалось сохранить профиль');
  }
}

export async function settingsUploadAccountAvatar(input) {
  const file = input?.files?.[0];
  if (!file) return;
  try {
    await uploadAccountAvatarApi(file);
    await refreshCurrentUser();
    _settingsNotice = 'Фото профиля загружено.';
    refreshUserMenu();
    renderSettings('account');
  } catch (e) {
    window.showAlert?.(e.message || 'Не удалось загрузить фото');
  } finally {
    if (input) input.value = '';
  }
}

export async function settingsRequestPasswordReset() {
  try {
    const data = await requestOwnPasswordReset();
    _settingsNotice = data.email_sent
      ? 'Письмо для смены пароля отправлено на ваш email.'
      : 'Ссылка создана, но письмо не отправилось. Проверьте SMTP-настройки.';
    renderSettings('account');
  } catch (e) {
    window.showAlert?.(e.message || 'Не удалось отправить письмо');
  }
}


async function loadProjectSummary() {
  const current = getCurrentWorkspace();
  if (!current?.id) return;
  const key = String(current.id);
  try {
    const data = await fetchWorkspaceMembers(current.id);
    const owner = (data.members || []).find(m => m.role === 'owner');
    const next = {
      memberCount: (data.members || []).length,
      ownerName: owner?.name || owner?.email || (current.role === 'owner' ? 'Вы' : 'Владелец проекта'),
    };
    const prev = _projectSummaryCache.get(key) || {};
    if (prev.memberCount !== next.memberCount || prev.ownerName !== next.ownerName) {
      _projectSummaryCache.set(key, next);
      if (_settingsSection === 'project') renderSettings('project');
    }
  } catch {}
}

function persistProjectMetaToLocations(meta) {
  const locs = window.Loc?.list || [];
  for (const loc of locs) {
    try {
      const key = window.locDataKey?.(loc.id);
      if (!key) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const data = JSON.parse(raw);
      localStorage.setItem(key, JSON.stringify({ ...data, projectMeta: meta }));
    } catch {}
  }
}

export function settingsSaveProjectMeta() {
  if (!isWorkspaceOwner()) {
    window.showAlert?.('Параметры проекта может менять только владелец.');
    return;
  }
  const meta = {
    city: (document.getElementById('settings-project-city')?.value || '').trim(),
    openingDate: (document.getElementById('settings-project-opening-date')?.value || '').trim(),
    stage: (document.getElementById('settings-project-stage')?.value || 'idea').trim() || 'idea',
  };
  if (!window.S) return;
  window.S.projectMeta = meta;
  persistProjectMetaToLocations(meta);
  window.saveState?.();
  _settingsNotice = 'Параметры проекта сохранены.';
  renderSettings('project');
}

export function settingsResetProjectContent() {
  if (!isWorkspaceOwner()) {
    window.showAlert?.('Сброс проекта доступен только владельцу.');
    return;
  }
  window.resetAll?.();
}

async function openWorkspaceAfterDangerAction(data, notice) {
  const next = (data?.workspaces || [])[0] || null;
  if (next?.id) {
    setActiveWorkspaceId(next.id);
    const state = await fetchState();
    window.Loc.list = [];
    window.Loc.activeId = null;
    window.resetGlobalsToBase?.();
    if (state) window.restoreFromServer?.(state);
    window.loadLocIndex?.();
    window.loadState?.();
  } else {
    setActiveWorkspaceId('');
    window.Loc.list = [];
    window.Loc.activeId = null;
    window.resetGlobalsToBase?.();
  }
  Object.keys(window.dirty || {}).forEach(k => window.dirty[k] = true);
  _settingsNotice = notice;
  window.renderLocSwitcherUI?.();
  renderSettings('project');
}

export async function settingsArchiveProject() {
  const current = getCurrentWorkspace();
  if (!current?.id || !isWorkspaceOwner()) {
    window.showAlert?.('Архивировать проект может только владелец.');
    return;
  }
  const ok = await window.showConfirm?.(`Архивировать проект «${current.name}»? Он исчезнет из списка активных проектов.`, null, { icon: '📦', okText: 'Архивировать', danger: false });
  if (!ok) return;
  try {
    await window.flushServerSync?.(getActiveWorkspaceId());
    const data = await archiveWorkspace(current.id);
    await openWorkspaceAfterDangerAction(data, 'Проект архивирован.');
  } catch (e) {
    window.showAlert?.(e.message || 'Не удалось архивировать проект');
  }
}

export async function settingsDeleteProject() {
  const current = getCurrentWorkspace();
  if (!current?.id || !isWorkspaceOwner()) {
    window.showAlert?.('Удалить проект может только владелец.');
    return;
  }
  const typed = await window.showPrompt?.(`Чтобы удалить проект, введите его название: ${current.name}`, '', { okText: 'Продолжить', placeholder: current.name });
  if (typed === null || typeof typed === 'undefined') return;
  if (String(typed).trim() !== String(current.name || '').trim()) {
    window.showAlert?.('Название не совпало. Проект не удалён.');
    return;
  }
  const ok = await window.showConfirm?.(`Удалить проект «${current.name}»? Он будет скрыт из кабинета для всех участников.`, null, { icon: '🗑️', okText: 'Удалить', danger: true });
  if (!ok) return;
  try {
    await window.flushServerSync?.(getActiveWorkspaceId());
    const data = await deleteWorkspace(current.id);
    await openWorkspaceAfterDangerAction(data, 'Проект удалён.');
  } catch (e) {
    window.showAlert?.(e.message || 'Не удалось удалить проект');
  }
}

export async function settingsRenameProject() {
  const current = getCurrentWorkspace();
  const input = document.getElementById('settings-project-name');
  const name = (input?.value || '').trim();
  if (!current?.id || !name) return;
  try {
    await renameWorkspace(current.id, name);
    _settingsNotice = 'Название проекта обновлено.';
    window.renderLocSwitcherUI?.();
    renderSettings('project');
  } catch (e) {
    window.showAlert?.(e.message || 'Не удалось переименовать проект');
  }
}

export async function settingsCreateWorkspace() {
  if (!canCreateWorkspaces()) return;
  const name = await window.showPrompt?.('Название нового проекта кофейни', 'Новый проект кофейни', { okText: 'Создать' });
  if (!name || !name.trim()) return;
  try {
    const ws = await createWorkspace(name.trim());
    setActiveWorkspaceId(ws.id);
    const state = await fetchState();
    if (state) window.restoreFromServer?.(state);
    _settingsNotice = 'Проект создан.';
    window.renderLocSwitcherUI?.();
    renderSettings('project');
  } catch (e) {
    window.showAlert?.(e.message || 'Не удалось создать проект');
  }
}

export async function settingsSwitchWorkspace(id) {
  if (!id || String(id) === String(getActiveWorkspaceId())) return;
  try {
    window.saveState?.();
    await window.flushServerSync?.(getActiveWorkspaceId());
    setActiveWorkspaceId(id);
    const state = await fetchState();
    if (state) {
      window.Loc.list = [];
      window.Loc.activeId = null;
      window.resetGlobalsToBase?.();
      window.restoreFromServer?.(state);
      window.loadLocIndex?.();
      window.loadState?.();
    }
    Object.keys(window.dirty || {}).forEach(k => window.dirty[k] = true);
    window.renderLocSwitcherUI?.();
    renderSettings('project');
  } catch (e) {
    window.showAlert?.(e.message || 'Не удалось переключить проект');
  }
}

export async function settingsSendInvite() {
  const input = document.getElementById('settings-invite-email');
  const result = document.getElementById('settings-invite-result');
  const email = (input?.value || '').trim();
  if (!email) {
    if (result) result.innerHTML = '<div class="workspace-error">Введите email.</div>';
    return;
  }
  try {
    const data = await createWorkspaceInvite(email);
    if (result) result.innerHTML = `
      <div class="workspace-success">
        <strong>${data.already_pending ? 'Приглашение уже ожидает принятия' : 'Приглашение создано'}</strong>
        <span>${data.email_sent ? 'Письмо отправлено на email.' : 'Ссылку можно отправить вручную.'}</span>
        ${data.invite_link ? `<div class="workspace-copy-row"><input readonly value="${esc(data.invite_link)}"><button class="btn btn-outline" type="button" onclick="settingsCopyValue(this)">Копировать</button></div>` : ''}
      </div>
    `;
    if (input) input.value = '';
    setTimeout(() => renderSettings('team'), 900);
  } catch (e) {
    if (result) result.innerHTML = `<div class="workspace-error">${esc(e.message || 'Не удалось создать приглашение')}</div>`;
  }
}

export async function settingsRemoveMember(userId) {
  const ok = await window.showConfirm?.('Удалить участника из проекта?', null, { icon: '🔒', okText: 'Убрать' });
  if (!ok) return;
  try {
    await removeWorkspaceMember(userId);
    _settingsNotice = 'Участник удалён из проекта.';
    renderSettings('team');
  } catch (e) {
    window.showAlert?.(e.message || 'Не удалось удалить участника');
  }
}

export async function settingsRevokeInvite(inviteId) {
  try {
    await revokeWorkspaceInvite(inviteId);
    _settingsNotice = 'Приглашение отозвано.';
    renderSettings('team');
  } catch (e) {
    window.showAlert?.(e.message || 'Не удалось отозвать приглашение');
  }
}

export function settingsCopyValue(source) {
  const direct = source?.dataset?.settingsCopy || '';
  const row = source?.closest?.('.workspace-copy-row, .settings-member-row');
  const input = row ? row.querySelector('input') : null;
  const value = direct || input?.value || '';
  if (!value) return;
  navigator.clipboard?.writeText(value).catch(() => {
    if (input) {
      input.select();
      document.execCommand('copy');
    }
  });
  if (source) {
    const prev = source.textContent;
    source.textContent = 'Скопировано';
    setTimeout(() => { source.textContent = prev; }, 1400);
  }
}

export function settingsSwitchLocation(id) {
  window.switchLocation?.(id);
  setTimeout(() => renderSettings('locations'), 50);
}

export function settingsSetActivityFilter(filter) {
  _activityFilter = filter || 'all';
  renderSettings('activity');
}

export async function settingsCreateSnapshot() {
  try {
    await window.flushServerSync?.(getActiveWorkspaceId());
    await createWorkspaceSnapshot('manual');
    _settingsNotice = 'Точка восстановления создана.';
    renderSettings('snapshots');
  } catch (e) {
    window.showAlert?.(e.message || 'Не удалось создать точку восстановления');
  }
}

export async function settingsRestoreSnapshot(snapshotId) {
  const ok = await window.showConfirm?.('Восстановить проект из выбранной точки? Текущее состояние будет сохранено перед откатом.', null, { icon: '↩️', okText: 'Восстановить' });
  if (!ok) return;
  try {
    await window.flushServerSync?.(getActiveWorkspaceId());
    const state = await restoreWorkspaceSnapshot(snapshotId);
    if (state) {
      window.Loc.list = [];
      window.Loc.activeId = null;
      window.resetGlobalsToBase?.();
      window.restoreFromServer?.(state);
      window.loadLocIndex?.();
      window.loadState?.();
    }
    Object.keys(window.dirty || {}).forEach(k => window.dirty[k] = true);
    _settingsNotice = 'Проект восстановлен из точки восстановления.';
    window.renderLocSwitcherUI?.();
    renderSettings('snapshots');
  } catch (e) {
    window.showAlert?.(e.message || 'Не удалось восстановить проект');
  }
}
