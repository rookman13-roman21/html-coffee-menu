// src/ui/locations.js
// Управление локациями (точками продаж)
import { isAuthorMode } from '../access/author-layer.js';
import {
  getActiveWorkspaceId, getCurrentWorkspace, getWorkspaces, setActiveWorkspaceId,
  fetchState, createWorkspace, fetchWorkspaceMembers,
  createWorkspaceInvite, fetchWorkspaceActivity, removeWorkspaceMember,
  revokeWorkspaceInvite, fetchWorkspaceSnapshots, createWorkspaceSnapshot,
  restoreWorkspaceSnapshot, logWorkspaceActivity, canCreateWorkspaces, hasWorkspaceMembership,
  isWorkspaceOwner, requireWorkspaceOwner,
} from './auth.js';

function _esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderLocSwitcherUI() {
  const loc = window.activeLoc();
  const nameEl = document.getElementById('loc-name');
  const iconEl = document.getElementById('loc-icon');
  if (isAuthorMode()) {
    if (nameEl) nameEl.textContent = 'Кабинет автора';
    if (iconEl) iconEl.textContent = '✍️';
    renderAuthorCabinetMenu();
    return;
  }
  if (loc && nameEl) nameEl.textContent = loc.name;
  if (loc && iconEl) iconEl.textContent = loc.icon || '☕';
  renderLocList();
}

function _renderMenuUserCard() {
  const user = window.getUser ? window.getUser() : null;
  if (!user) return '';
  const initial = (user.name || user.email || '?')[0].toUpperCase();
  return `
    <div class="loc-user-card">
      <div class="loc-user-avatar">${_esc(initial)}</div>
      <div class="loc-user-info">
        <div class="loc-user-name">${_esc(user.name || 'Автор')}</div>
        <div class="loc-user-email">${_esc(user.email || '')}</div>
      </div>
      <button class="loc-user-logout" onclick="window._authLogout()">Выйти</button>
    </div>
    <div class="loc-menu-divider"></div>
  `;
}

export function authorOpenTermsFromMenu() {
  document.getElementById('loc-menu')?.classList.remove('open');
  setTimeout(() => {
    if (window.openAuthorTermsModal) window.openAuthorTermsModal();
  }, 0);
}

function renderAuthorCabinetMenu() {
  const menu = document.getElementById('loc-menu');
  const loc = window.activeLoc ? window.activeLoc() : null;
  if (!menu) return;
  menu.classList.add('loc-menu-author');
  menu.innerHTML = `
    ${_renderMenuUserCard()}
    <div class="loc-menu-header">Профиль и документы</div>
    <button class="loc-menu-item" type="button" onclick="openAuthorProfileModal();document.getElementById('loc-menu')?.classList.remove('open')">
      <i data-lucide="user-pen" class="icon"></i>
      <span>Данные автора</span>
    </button>
    <button class="loc-menu-item" type="button" onclick="authorOpenTermsFromMenu()">
      <i data-lucide="file-text" class="icon"></i>
      <span>Условия сотрудничества</span>
    </button>
    <div class="loc-menu-divider"></div>
    <div class="loc-menu-header">Техкарты</div>
    <div class="loc-menu-note">Название пакета используется в PDF-техкартах и помогает отделять авторские наборы рецептов.</div>
    <button class="loc-menu-item active" type="button" onclick="switchTab('recipes');document.getElementById('loc-menu')?.classList.remove('open')">
      <span class="loc-emoji">${_esc(loc?.icon || '📄')}</span>
      <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${_esc(loc?.name || 'Мои техкарты')}</span>
      <i data-lucide="check" class="icon" style="color:var(--green)"></i>
    </button>
    <button class="loc-menu-item" type="button" onclick="authorOpenTechcardSettings()">
      <i data-lucide="settings-2" class="icon"></i>
      <span>Настройки шапки техкарт</span>
    </button>
    <button class="loc-menu-item" type="button" onclick="exportTechCards();document.getElementById('loc-menu')?.classList.remove('open')">
      <i data-lucide="download" class="icon"></i>
      <span>Скачать PDF техкарт</span>
    </button>
    <div class="loc-menu-divider"></div>
    <button class="loc-menu-item" type="button" onclick="loadAuthorWorkspace(true);document.getElementById('loc-menu')?.classList.remove('open')">
      <i data-lucide="refresh-cw" class="icon"></i>
      <span>Обновить данные автора</span>
    </button>
  `;
  if (window.lucide) lucide.createIcons({ nodes: [menu] });
}

function _ensureClientLocMenuShell() {
  const menu = document.getElementById('loc-menu');
  if (!menu || (menu.querySelector('#loc-list') && menu.querySelector('#workspace-list'))) return;
  menu.classList.remove('loc-menu-author');
  menu.innerHTML = `
    ${_renderMenuUserCard()}
    <div class="loc-menu-header">Проект кофейни</div>
    <div class="workspace-list" id="workspace-list"></div>
    <button class="loc-menu-item" type="button" onclick="openWorkspaceTeamModal()"><i data-lucide="users" class="icon"></i> Команда проекта</button>
    <button class="loc-menu-item" type="button" onclick="openWorkspaceActivityModal()"><i data-lucide="list-checks" class="icon"></i> Журнал действий</button>
    <button class="loc-menu-item" type="button" onclick="openWorkspaceSnapshotsModal()"><i data-lucide="history" class="icon"></i> Восстановление</button>
    <div id="workspace-create-slot"></div>
    <div class="loc-menu-divider"></div>
    <div class="loc-menu-header">Заведения</div>
    <div class="loc-list" id="loc-list"></div>
    <div class="loc-menu-divider"></div>
    <button class="loc-menu-item" data-location-action onclick="openAddLocation()"><i data-lucide="plus" class="icon"></i> Добавить точку</button>
    <button class="loc-menu-item" data-location-action onclick="openTemplatesModal()"><i data-lucide="sparkles" class="icon"></i> Создать из шаблона</button>
    <button class="loc-menu-item" data-location-action onclick="renameActiveLocation()"><i data-lucide="pencil" class="icon"></i> Переименовать текущую</button>
    <button class="loc-menu-item danger" data-location-action data-owner-action onclick="deleteActiveLocation()"><i data-lucide="trash-2" class="icon"></i> Удалить текущую</button>
    <div class="loc-menu-divider"></div>
    <button class="loc-menu-item" id="loc-menu-api-key-btn" onclick="ocSetApiKey()" title="OpenAI API ключ нужен для функции AI-заполнения карточек оборудования"><i data-lucide="key-round" class="icon"></i> <span id="loc-menu-api-key-label">Добавить OpenAI API ключ</span></button>
  `;
}

function _workspaceRoleLabel(role) {
  return role === 'owner' ? 'владелец' : 'редактор';
}

function _workspaceMemberRoleLabel(member = {}) {
  if (member.role === 'owner') return 'владелец';
  if (member.account_role === 'guest') return 'гость';
  return 'редактор';
}

function _canUseClientLocations() {
  return hasWorkspaceMembership();
}

function _showWorkspaceRequired() {
  window.showAlert?.('Нет доступного проекта. Попросите владельца отправить новое приглашение.', '🔒');
}

function renderWorkspaceList() {
  const list = document.getElementById('workspace-list');
  if (!list) return;
  const createSlot = document.getElementById('workspace-create-slot');
  if (createSlot) {
    createSlot.innerHTML = canCreateWorkspaces()
      ? '<button class="loc-menu-item" type="button" onclick="createWorkspaceFromMenu()"><i data-lucide="folder-plus" class="icon"></i> Новый проект</button>'
      : '<div class="loc-menu-note workspace-paid-note">Свои проекты доступны на платном тарифе.</div>';
  }
  const workspaces = getWorkspaces();
  const current = getCurrentWorkspace();
  if (!workspaces.length) {
    list.innerHTML = `<div class="loc-menu-note">${canCreateWorkspaces() ? 'Проект будет создан автоматически при первом сохранении.' : 'У вас пока нет доступных проектов.'}</div>`;
    return;
  }
  list.innerHTML = workspaces.map(w => `
    <button class="loc-menu-item workspace-menu-item ${current && w.id === current.id ? 'active' : ''}" type="button" onclick="switchWorkspace(${Number(w.id)})">
      <i data-lucide="folder-kanban" class="icon"></i>
      <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${_esc(w.name)}</span>
      <span class="workspace-role-chip">${_workspaceRoleLabel(w.role)}</span>
    </button>
  `).join('');
}

async function _reloadWorkspaceState(serverState) {
  window.Loc.list = [];
  window.Loc.activeId = null;
  window.resetGlobalsToBase();
  if (!hasWorkspaceMembership()) {
    window.clearLocStorage?.();
    renderLocSwitcherUI();
    if (window.lucide) window.lucide.createIcons();
    return;
  }
  if (serverState) window.restoreFromServer(serverState);
  window.loadLocIndex();
  if (!window.Loc.list.length) {
    window.Loc.list = [{ id: 'loc_default', name: 'Моя кофейня', icon: '☕' }];
    window.Loc.activeId = 'loc_default';
    window.saveLocIndex();
  }
  if (!window.Loc.activeId) {
    window.Loc.activeId = window.Loc.list[0].id;
    window.saveLocIndex();
  }
  window.loadState();
  window.searchQuery = '';
  Object.keys(window.dirty || {}).forEach(k => window.dirty[k] = true);
  if (window.renderActive) window.renderActive();
  renderLocSwitcherUI();
  if (window.lucide) window.lucide.createIcons();
}

export async function switchWorkspace(id) {
  if (!id || String(id) === String(getActiveWorkspaceId())) {
    document.getElementById('loc-menu')?.classList.remove('open');
    return;
  }
  window.saveState();
  await window.flushServerSync?.(getActiveWorkspaceId());
  setActiveWorkspaceId(id);
  const serverState = await fetchState();
  await logWorkspaceActivity('workspace_switched', 'workspace', String(id), 'Переключился на проект');
  await _reloadWorkspaceState(serverState);
  document.getElementById('loc-menu')?.classList.remove('open');
}

export async function createWorkspaceFromMenu() {
  if (!canCreateWorkspaces()) {
    window.showAlert('Свои проекты доступны на платном тарифе');
    return;
  }
  const name = prompt('Название нового проекта кофейни', 'Новый проект кофейни');
  if (!name || !name.trim()) return;
  try {
    const ws = await createWorkspace(name.trim());
    setActiveWorkspaceId(ws.id);
    const serverState = await fetchState();
    await _reloadWorkspaceState(serverState);
    document.getElementById('loc-menu')?.classList.remove('open');
  } catch (e) {
    window.showAlert(e.message || 'Не удалось создать проект');
  }
}

function _ensureWorkspaceModal() {
  let modal = document.getElementById('workspace-modal');
  if (modal) return modal;
  modal = document.createElement('div');
  modal.id = 'workspace-modal';
  modal.className = 'workspace-modal';
  modal.style.display = 'none';
  document.body.appendChild(modal);
  return modal;
}

function _closeWorkspaceModal() {
  const modal = document.getElementById('workspace-modal');
  if (modal) modal.style.display = 'none';
}

function _workspaceModalShell(title, subtitle, body) {
  return `
    <div class="workspace-modal-backdrop" onclick="closeWorkspaceModal()"></div>
    <div class="workspace-dialog" role="dialog" aria-modal="true">
      <div class="workspace-dialog-head">
        <div>
          <h3>${_esc(title)}</h3>
          <p>${_esc(subtitle || '')}</p>
        </div>
        <button class="modal-close" type="button" onclick="closeWorkspaceModal()">×</button>
      </div>
      <div class="workspace-dialog-body">${body}</div>
    </div>
  `;
}

async function _renderWorkspaceTeam(modal, inviteResult = null) {
  const current = getCurrentWorkspace();
  if (!current) return;
  const data = await fetchWorkspaceMembers(current.id);
  const isOwner = current.role === 'owner';
  const notice = typeof inviteResult === 'string' ? inviteResult : '';
  const result = inviteResult && typeof inviteResult === 'object' ? inviteResult : null;
  const hasGuest = (data.members || []).some(m => m.account_role === 'guest' && m.role !== 'owner');
  const members = (data.members || []).map(m => `
    <div class="workspace-member-row">
      <div class="workspace-member-avatar">${_esc((m.name || m.email || '?')[0]).toUpperCase()}</div>
      <div class="workspace-member-main">
        <strong>${_esc(m.name || m.email)}</strong>
        <span>${_esc(m.email || '')}</span>
      </div>
      <span class="workspace-role-chip">${_workspaceMemberRoleLabel(m)}</span>
      ${isOwner && m.role !== 'owner' ? `<button class="btn btn-outline workspace-mini-btn" type="button" onclick="removeWorkspaceMemberFromModal(${Number(m.user_id)})">Убрать</button>` : ''}
    </div>
  `).join('');
  const invites = (data.invites || []).map(i => `
    <div class="workspace-invite-row">
      <span>${_esc(i.email)}</span>
      <small>ожидает принятия</small>
      ${isOwner ? `
        ${i.invite_link ? `<button class="btn btn-outline workspace-mini-btn" type="button" data-copy-link="${_esc(i.invite_link)}" onclick="copyWorkspaceInviteLink(this)">Копировать</button>` : ''}
        <button class="btn btn-outline workspace-mini-btn" type="button" onclick="revokeWorkspaceInviteFromModal(${Number(i.id)})">Отозвать</button>
      ` : ''}
    </div>
  `).join('');
  const resultBlock = result ? `
    <div class="workspace-invite-complete">
      <div class="workspace-success">
        <strong>Приглашение создано${result.emailSent ? ' и отправлено на email' : ''}</strong>
        <span>${result.emailSent
          ? 'Участник получит письмо. Ссылку ниже можно дополнительно отправить в мессенджере.'
          : 'Письмо не отправлено автоматически. Скопируйте ссылку и отправьте участнику вручную.'}</span>
      </div>
      <div class="workspace-copy-row">
        <input readonly value="${_esc(result.inviteLink || '')}" aria-label="Ссылка приглашения">
        <button class="btn btn-outline" type="button" onclick="copyWorkspaceInviteLink(this)">Копировать</button>
      </div>
      <div class="workspace-action-row">
        <button class="btn btn-outline" type="button" onclick="inviteAnotherFromModal()">Пригласить ещё</button>
        <button class="btn-green" type="button" onclick="closeWorkspaceModal()">Готово</button>
      </div>
    </div>
  ` : '<div id="workspace-invite-result"></div>';
  modal.innerHTML = _workspaceModalShell('Команда проекта', current.name, `
    ${notice ? `<div class="workspace-notice">${_esc(notice)}</div>` : ''}
    <div class="workspace-section-title">Участники</div>
    <div class="workspace-list-panel">${members || '<div class="workspace-empty">Пока нет участников.</div>'}</div>
    ${hasGuest ? '<div class="workspace-hint">Гость может редактировать этот проект, но не может создавать свои проекты.</div>' : ''}
    ${invites ? `<div class="workspace-section-title">Приглашения</div><div class="workspace-list-panel">${invites}</div>` : ''}
    ${isOwner ? `
      <div class="workspace-invite-form">
        <label>Email участника</label>
        <div class="workspace-invite-rowform">
          <input type="email" id="workspace-invite-email" placeholder="partner@example.com">
          <button class="btn-green" type="button" onclick="sendWorkspaceInviteFromModal()"><i data-lucide="send" class="icon"></i> Пригласить</button>
        </div>
        <div class="workspace-hint">Участник сможет редактировать проект. Сложные роли добавим следующим этапом.</div>
        ${resultBlock}
      </div>
    ` : '<div class="workspace-hint">Вы редактор проекта. Приглашать участников может владелец.</div>'}
  `);
  modal.style.display = 'block';
  if (window.lucide) window.lucide.createIcons({ nodes: [modal] });
}

export async function openWorkspaceTeamModal() {
  document.getElementById('loc-menu')?.classList.remove('open');
  const modal = _ensureWorkspaceModal();
  modal.innerHTML = _workspaceModalShell('Команда проекта', 'Загрузка...', '<div class="workspace-empty">Загружаем участников...</div>');
  modal.style.display = 'block';
  try { await _renderWorkspaceTeam(modal); }
  catch (e) { modal.innerHTML = _workspaceModalShell('Команда проекта', '', `<div class="workspace-empty">${_esc(e.message || 'Не удалось загрузить команду')}</div>`); }
}

export async function sendWorkspaceInviteFromModal() {
  const emailEl = document.getElementById('workspace-invite-email');
  const result = document.getElementById('workspace-invite-result');
  const email = emailEl ? emailEl.value.trim() : '';
  if (!email) { if (result) result.innerHTML = '<div class="workspace-error">Введите email.</div>'; return; }
  try {
    if (result) result.innerHTML = '<div class="workspace-notice">Создаём приглашение...</div>';
    const data = await createWorkspaceInvite(email);
    await _renderWorkspaceTeam(_ensureWorkspaceModal(), {
      email,
      inviteLink: data.invite_link || '',
      emailSent: !!data.email_sent,
    });
  } catch (e) {
    if (result) result.innerHTML = `<div class="workspace-error">${_esc(e.message || 'Не удалось создать приглашение')}</div>`;
  }
}

export function inviteAnotherFromModal() {
  const emailEl = document.getElementById('workspace-invite-email');
  const result = document.getElementById('workspace-invite-result');
  if (emailEl) {
    emailEl.value = '';
    emailEl.focus();
  }
  if (result) result.innerHTML = '';
}

export function copyWorkspaceInviteLink(source) {
  const direct = source?.dataset?.copyLink || '';
  const row = source?.closest?.('.workspace-copy-row');
  const input = row ? row.querySelector('input') : document.querySelector('.workspace-copy-row input');
  const value = direct || input?.value || '';
  if (!value) return;
  if (input && !direct) input.select();
  navigator.clipboard?.writeText(value).catch(() => {
    if (input) {
      input.select();
      document.execCommand('copy');
    }
  });
  if (source && source.textContent) {
    const prev = source.textContent;
    source.textContent = 'Скопировано';
    setTimeout(() => { source.textContent = prev; }, 1400);
  }
}

export async function removeWorkspaceMemberFromModal(userId) {
  if (!confirm('Удалить участника из проекта?')) return;
  try {
    await removeWorkspaceMember(userId);
    await _renderWorkspaceTeam(_ensureWorkspaceModal(), 'Участник удалён из проекта.');
  } catch (e) { window.showAlert(e.message || 'Не удалось удалить участника'); }
}

export async function revokeWorkspaceInviteFromModal(inviteId) {
  try {
    await revokeWorkspaceInvite(inviteId);
    await _renderWorkspaceTeam(_ensureWorkspaceModal(), 'Приглашение отозвано.');
  } catch (e) { window.showAlert(e.message || 'Не удалось отозвать приглашение'); }
}

function _activityLabel(action) {
  const labels = {
    project_opened: 'Вход в проект', workspace_created: 'Создан проект', workspace_switched: 'Смена проекта',
    snapshot_created: 'Точка восстановления', snapshot_restored: 'Восстановление',
    invite_created: 'Приглашение', invite_accepted: 'Принято приглашение', invite_revoked: 'Отозвано приглашение', member_removed: 'Участник удалён',
    location_created: 'Точка добавлена', location_renamed: 'Точка изменена', location_deleted: 'Точка удалена',
    opening_costs_changed: 'Бюджет открытия', finmodel_changed: 'Финмодель', payroll_changed: 'ФОТ', sales_changed: 'План продаж',
    recipe_changed: 'Рецепт', supplier_changed: 'Поставщик', export_created: 'Экспорт'
  };
  return labels[action] || action;
}

function _fmtActivityDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('ru-RU', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
}

export async function openWorkspaceActivityModal() {
  document.getElementById('loc-menu')?.classList.remove('open');
  const modal = _ensureWorkspaceModal();
  const current = getCurrentWorkspace();
  modal.innerHTML = _workspaceModalShell('Журнал действий', current?.name || '', '<div class="workspace-empty">Загружаем события...</div>');
  modal.style.display = 'block';
  try {
    const rows = await fetchWorkspaceActivity(current?.id);
    const body = rows.length ? rows.map(r => `
      <div class="workspace-activity-row">
        <div class="workspace-activity-date">${_esc(_fmtActivityDate(r.created_at))}</div>
        <div class="workspace-activity-main">
          <strong>${_esc(_activityLabel(r.action))}</strong>
          <span>${_esc(r.summary || '')}</span>
        </div>
        <div class="workspace-activity-actor">${_esc(r.actor_name || 'Система')}</div>
      </div>
    `).join('') : '<div class="workspace-empty">Пока нет событий.</div>';
    modal.innerHTML = _workspaceModalShell('Журнал действий', current?.name || '', `<div class="workspace-activity-list">${body}</div>`);
  } catch (e) {
    modal.innerHTML = _workspaceModalShell('Журнал действий', current?.name || '', `<div class="workspace-empty">${_esc(e.message || 'Не удалось загрузить журнал')}</div>`);
  }
}

function _snapshotReasonLabel(reason) {
  const labels = {
    manual: 'Ручная точка',
    autosave: 'Автоснимок',
    before_restore: 'Перед восстановлением',
    before_location_delete: 'Перед удалением точки',
  };
  return labels[reason] || reason || 'Точка восстановления';
}

export async function openWorkspaceSnapshotsModal() {
  document.getElementById('loc-menu')?.classList.remove('open');
  const modal = _ensureWorkspaceModal();
  const current = getCurrentWorkspace();
  modal.innerHTML = _workspaceModalShell('Восстановление проекта', current?.name || '', '<div class="workspace-empty">Загружаем точки восстановления...</div>');
  modal.style.display = 'block';
  if (!current) {
    modal.innerHTML = _workspaceModalShell('Восстановление проекта', '', '<div class="workspace-empty">Проект не выбран.</div>');
    return;
  }
  try {
    const rows = await fetchWorkspaceSnapshots(current.id);
    const isOwner = current.role === 'owner';
    const actions = isOwner ? `
      <div class="workspace-action-row" style="justify-content:flex-start;margin-bottom:14px">
        <button class="btn-green" type="button" onclick="createWorkspaceSnapshotFromModal()">
          <i data-lucide="save" class="icon"></i> Создать точку сейчас
        </button>
      </div>
    ` : '<div class="workspace-hint">Восстанавливать проект может только владелец. Редактор видит список для контроля.</div>';
    const body = rows.length ? rows.map(s => `
      <div class="workspace-activity-row">
        <div class="workspace-activity-date">${_esc(_fmtActivityDate(s.created_at))}</div>
        <div class="workspace-activity-main">
          <strong>${_esc(_snapshotReasonLabel(s.reason))}</strong>
          <span>${Number(s.location_count || 0)} заведений${s.active_location ? ` · активное: ${_esc(s.active_location)}` : ''}</span>
          <span>Создал: ${_esc(s.actor_name || 'Система')}</span>
        </div>
        ${isOwner ? `<button class="btn btn-outline workspace-mini-btn" type="button" onclick="restoreWorkspaceSnapshotFromModal(${Number(s.id)})">Восстановить</button>` : ''}
      </div>
    `).join('') : '<div class="workspace-empty">Точек восстановления пока нет. Создайте первую перед крупными изменениями.</div>';
    modal.innerHTML = _workspaceModalShell('Восстановление проекта', current.name || '', `
      ${actions}
      <div class="workspace-hint">Восстановление заменит текущий проект выбранным снимком. Текущее состояние будет сохранено отдельной точкой перед откатом.</div>
      <div class="workspace-activity-list">${body}</div>
    `);
    if (window.lucide) window.lucide.createIcons({ nodes: [modal] });
  } catch (e) {
    modal.innerHTML = _workspaceModalShell('Восстановление проекта', current.name || '', `<div class="workspace-empty">${_esc(e.message || 'Не удалось загрузить точки восстановления')}</div>`);
  }
}

export async function createWorkspaceSnapshotFromModal() {
  try {
    await window.flushServerSync?.(getActiveWorkspaceId());
    await createWorkspaceSnapshot('manual');
    await openWorkspaceSnapshotsModal();
  } catch (e) {
    window.showAlert(e.message || 'Не удалось создать точку восстановления');
  }
}

export async function restoreWorkspaceSnapshotFromModal(snapshotId) {
  window.showConfirm('Восстановить проект из выбранной точки? Текущее состояние будет сохранено перед откатом.', async () => {
    try {
      await window.flushServerSync?.(getActiveWorkspaceId());
      const serverState = await restoreWorkspaceSnapshot(snapshotId);
      await _reloadWorkspaceState(serverState);
      await openWorkspaceActivityModal();
    } catch (e) {
      window.showAlert(e.message || 'Не удалось восстановить проект');
    }
  }, { icon: '↩️', okText: 'Восстановить' });
}

export function closeWorkspaceModal() { _closeWorkspaceModal(); }

export function renderLocList() {
  if (isAuthorMode()) return renderAuthorCabinetMenu();
  _ensureClientLocMenuShell();
  const Loc = window.Loc;
  const menu = document.getElementById('loc-menu');
  const list = document.getElementById('loc-list');
  if (!list) return;
  document.getElementById('loc-menu')?.classList.remove('loc-menu-author');
  renderWorkspaceList();
  if (!_canUseClientLocations()) {
    list.innerHTML = '<div class="loc-menu-note">Нет доступных заведений без проекта.</div>';
    const actionButtons = menu?.querySelectorAll('[data-location-action]') || [];
    actionButtons.forEach(btn => { btn.style.display = 'none'; });
    if (window.lucide) lucide.createIcons();
    return;
  }
  const actionButtons = menu?.querySelectorAll('[data-location-action]') || [];
  actionButtons.forEach(btn => { btn.style.display = ''; });
  const ownerActionButtons = menu?.querySelectorAll('[data-owner-action]') || [];
  ownerActionButtons.forEach(btn => { btn.style.display = isWorkspaceOwner() ? '' : 'none'; });
  list.innerHTML = Loc.list.map(l =>
    `<button class="loc-menu-item ${l.id===Loc.activeId?'active':''}" onclick="switchLocation('${l.id}')">
      <span class="loc-emoji">${l.icon||'☕'}</span>
      <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${l.name}</span>
      ${l.id===Loc.activeId?'<i data-lucide="check" class="icon" style="color:var(--green)"></i>':''}
    </button>`
  ).join('');
  if (window.lucide) lucide.createIcons();
}

export function toggleLocMenu(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('loc-menu');
  const isOpening = !menu.classList.contains('open');
  if (isOpening && window.innerWidth > 768) {
    const r = document.getElementById('loc-switcher').getBoundingClientRect();
    menu.style.top = (r.bottom + 4) + 'px';
    menu.style.left = r.left + 'px';
    menu.style.right = 'auto';
    menu.style.bottom = 'auto';
  }
  menu.classList.toggle('open');
  document.getElementById('export-menu')?.classList.remove('open');
}

export function toggleExportMenu(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('export-menu');
  const isOpening = !menu.classList.contains('open');
  if (isOpening && window.innerWidth > 768) {
    const r = document.getElementById('export-wrap').getBoundingClientRect();
    menu.style.top = (r.bottom + 4) + 'px';
    menu.style.right = (window.innerWidth - r.right) + 'px';
    menu.style.left = 'auto';
    menu.style.bottom = 'auto';
  }
  menu.classList.toggle('open');
  document.getElementById('loc-menu')?.classList.remove('open');
}

export function switchLocation(id) {
  if (!_canUseClientLocations()) { _showWorkspaceRequired(); return; }
  const Loc = window.Loc;
  if (!id || id === Loc.activeId) { document.getElementById('loc-menu')?.classList.remove('open'); return; }
  window.saveState();
  Loc.activeId = id;
  window.saveLocIndex();
  logWorkspaceActivity('location_switched', 'location', id, `Переключился на точку «${(window.activeLoc()?.name || id)}»`);
  window.resetGlobalsToBase();
  window.loadState();
  window.searchQuery = '';
  Object.keys(window.dirty).forEach(k=>window.dirty[k]=true);
  window.renderActive();
  renderLocSwitcherUI();
  document.getElementById('loc-menu')?.classList.remove('open');
}

export function openAddLocation() {
  if (!_canUseClientLocations()) { _showWorkspaceRequired(); return; }
  const Loc = window.Loc;
  window._locModalMode = 'add'; window._locTemplateId = null;
  document.getElementById('modal-loc-title').innerHTML = '<i data-lucide="plus" class="icon"></i> Новая точка';
  _setLocationModalLabels('client');
  document.getElementById('ml-icon').value = '☕';
  document.getElementById('ml-name').value = '';
  document.getElementById('ml-legal-name').value = '';
  document.getElementById('ml-ceo-title').value  = '';
  document.getElementById('ml-ceo-name').value   = '';
  document.getElementById('ml-address').value    = '';
  const sel = document.getElementById('ml-clone');
  sel.innerHTML = '<option value="">— Пустая (с базовым меню) —</option>'
    + Loc.list.map(l => `<option value="${l.id}">${l.icon||'☕'} ${l.name}</option>`).join('');
  document.getElementById('ml-clone-wrap').style.display = '';
  document.getElementById('ml-requisites-wrap').style.display = '';
  document.getElementById('loc-menu')?.classList.remove('open');
  window.openModal('modal-loc');
  if (window.lucide) lucide.createIcons();
}

export function renameActiveLocation() {
  if (!_canUseClientLocations()) { _showWorkspaceRequired(); return; }
  const loc = window.activeLoc(); if (!loc) return;
  window._locModalMode = 'rename'; window._locTemplateId = null;
  document.getElementById('modal-loc-title').innerHTML = '<i data-lucide="pencil" class="icon"></i> Переименовать точку';
  _setLocationModalLabels('client');
  document.getElementById('ml-icon').value       = loc.icon       || '☕';
  document.getElementById('ml-name').value       = loc.name;
  document.getElementById('ml-legal-name').value = loc.legalName  || '';
  document.getElementById('ml-ceo-title').value  = loc.ceoTitle   || '';
  document.getElementById('ml-ceo-name').value   = loc.ceoName    || '';
  document.getElementById('ml-address').value    = loc.address    || '';
  document.getElementById('ml-clone-wrap').style.display = 'none';
  document.getElementById('ml-requisites-wrap').style.display = '';
  document.getElementById('loc-menu')?.classList.remove('open');
  window.openModal('modal-loc');
  if (window.lucide) lucide.createIcons();
}

function _setLocationModalLabels(mode) {
  const isAuthor = mode === 'author';
  const nameInput = document.getElementById('ml-name');
  const nameLabel = nameInput?.closest('div')?.querySelector('.modal-label');
  const requisitesTitle = document.getElementById('ml-requisites-title');
  const authorNote = document.getElementById('ml-author-note');
  const saveBtn = document.querySelector('#modal-loc .modal-footer .btn-primary');
  if (nameLabel) nameLabel.textContent = isAuthor ? 'Название пакета техкарт' : 'Название (коммерческое)';
  if (nameInput) nameInput.placeholder = isAuthor ? 'Например: Рецепты Mixology Cup' : 'Например: На Тверской';
  if (requisitesTitle) requisitesTitle.textContent = isAuthor ? 'Шапка PDF-документов' : 'Реквизиты для документов';
  if (authorNote) authorNote.style.display = isAuthor ? '' : 'none';
  if (saveBtn) saveBtn.textContent = isAuthor ? 'Сохранить настройки' : '✔ Сохранить';
}

export function authorOpenTechcardSettings() {
  const loc = window.activeLoc(); if (!loc) return;
  window._locModalMode = 'rename'; window._locTemplateId = null;
  document.getElementById('modal-loc-title').innerHTML = '<i data-lucide="settings-2" class="icon"></i> Настройки техкарт';
  _setLocationModalLabels('author');
  document.getElementById('ml-icon').value       = loc.icon       || '📄';
  document.getElementById('ml-name').value       = loc.name;
  document.getElementById('ml-legal-name').value = loc.legalName  || '';
  document.getElementById('ml-ceo-title').value  = loc.ceoTitle   || '';
  document.getElementById('ml-ceo-name').value   = loc.ceoName    || '';
  document.getElementById('ml-address').value    = loc.address    || '';
  document.getElementById('ml-clone-wrap').style.display = 'none';
  document.getElementById('ml-requisites-wrap').style.display = '';
  document.getElementById('loc-menu')?.classList.remove('open');
  window.openModal('modal-loc');
  if (window.lucide) lucide.createIcons();
}

export function deleteActiveLocation() {
  if (!_canUseClientLocations()) { _showWorkspaceRequired(); return; }
  if (!requireWorkspaceOwner('Удалять заведения может только владелец проекта.')) return;
  const Loc = window.Loc;
  if (Loc.list.length <= 1) { window.showAlert('Нельзя удалить единственную точку. Сначала добавьте ещё одну.', 'ℹ️'); return; }
  const loc = window.activeLoc(); if (!loc) return;
  window.showConfirm(`Удалить «${loc.name}»? Текущее состояние проекта будет сохранено для восстановления.`, async () => {
    if (getCurrentWorkspace()?.role === 'owner') {
      try {
        await window.flushServerSync?.(getActiveWorkspaceId());
        await createWorkspaceSnapshot('before_location_delete');
      } catch(e) {}
    }
    try { localStorage.removeItem(window.locDataKey(loc.id)); } catch(e) {}
    Loc.list = Loc.list.filter(l => l.id !== loc.id);
    Loc.activeId = Loc.list[0].id;
    window.saveLocIndex();
    window.resetGlobalsToBase();
    window.loadState();
    window.saveState();
    window.searchQuery = '';
    Object.keys(window.dirty).forEach(k=>window.dirty[k]=true);
    window.renderActive();
    logWorkspaceActivity('location_deleted', 'location', loc.id, `Удалена точка «${loc.name}»`);
    renderLocSwitcherUI();
    document.getElementById('loc-menu')?.classList.remove('open');
  }, { icon: '🗑️', okText: 'Удалить' });
}

export function saveLocation() {
  if (!isAuthorMode() && !_canUseClientLocations()) { _showWorkspaceRequired(); return; }
  const Loc = window.Loc;
  const name = document.getElementById('ml-name').value.trim();
  const icon = document.getElementById('ml-icon').value.trim() || '☕';
  if (!name) { window.showAlert('Введите название точки'); return; }

  if (window._locModalMode === 'rename') {
    const loc = window.activeLoc(); if (loc) {
      loc.name      = name;
      loc.icon      = icon;
      loc.legalName = document.getElementById('ml-legal-name').value.trim();
      loc.ceoTitle  = document.getElementById('ml-ceo-title').value.trim();
      loc.ceoName   = document.getElementById('ml-ceo-name').value.trim();
      loc.address   = document.getElementById('ml-address').value.trim();
    }
    window.saveLocIndex();
    window.saveState();
    logWorkspaceActivity('location_renamed', 'location', loc?.id || '', `Изменена точка «${name}»`);
    renderLocSwitcherUI();
    window._clearModalDirty('modal-loc');
    window.closeModal('modal-loc');
    return;
  }

  const id = 'loc_' + Date.now() + '_' + Math.random().toString(36).slice(2,7);
  const legalName = document.getElementById('ml-legal-name').value.trim();
  const ceoTitle  = document.getElementById('ml-ceo-title').value.trim();
  const ceoName   = document.getElementById('ml-ceo-name').value.trim();
  const address   = document.getElementById('ml-address').value.trim();
  Loc.list.push({ id, name, icon, legalName, ceoTitle, ceoName, address });
  window.saveState();
  Loc.activeId = id;
  window.saveLocIndex();

  if (window._locModalMode === 'template' && window._locTemplateId) {
    window.resetGlobalsToBase();
    window.applyTemplateData(window._locTemplateId);
  } else {
    const cloneFrom = document.getElementById('ml-clone').value;
    if (cloneFrom) {
      try {
        const src = localStorage.getItem(window.locDataKey(cloneFrom));
        if (src) localStorage.setItem(window.locDataKey(id), src);
      } catch(e) {}
      window.resetGlobalsToBase();
      window.loadState();
    } else {
      window.resetGlobalsToBase();
    }
  }

  window.saveState();
  logWorkspaceActivity('location_created', 'location', id, `Добавлена точка «${name}»`);
  window.searchQuery = '';
  Object.keys(window.dirty).forEach(k=>window.dirty[k]=true);
  window.renderActive();
  renderLocSwitcherUI();
  window._clearModalDirty('modal-loc');
  window.closeModal('modal-loc');
}
