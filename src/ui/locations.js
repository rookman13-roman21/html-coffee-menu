// src/ui/locations.js
// Управление локациями (точками продаж)
import { isAuthorMode } from '../access/author-layer.js';

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
    <button class="loc-menu-item" type="button" onclick="openAuthorTermsModal();document.getElementById('loc-menu')?.classList.remove('open')">
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
  if (!menu || menu.querySelector('#loc-list')) return;
  menu.classList.remove('loc-menu-author');
  menu.innerHTML = `
    ${_renderMenuUserCard()}
    <div class="loc-menu-header">Заведения</div>
    <div class="loc-list" id="loc-list"></div>
    <div class="loc-menu-divider"></div>
    <button class="loc-menu-item" onclick="openAddLocation()"><i data-lucide="plus" class="icon"></i> Добавить точку</button>
    <button class="loc-menu-item" onclick="openTemplatesModal()"><i data-lucide="sparkles" class="icon"></i> Создать из шаблона</button>
    <button class="loc-menu-item" onclick="renameActiveLocation()"><i data-lucide="pencil" class="icon"></i> Переименовать текущую</button>
    <button class="loc-menu-item danger" onclick="deleteActiveLocation()"><i data-lucide="trash-2" class="icon"></i> Удалить текущую</button>
    <div class="loc-menu-divider"></div>
    <button class="loc-menu-item" id="loc-menu-api-key-btn" onclick="ocSetApiKey()" title="OpenAI API ключ нужен для функции AI-заполнения карточек оборудования"><i data-lucide="key-round" class="icon"></i> <span id="loc-menu-api-key-label">Добавить OpenAI API ключ</span></button>
  `;
}

export function renderLocList() {
  if (isAuthorMode()) return renderAuthorCabinetMenu();
  _ensureClientLocMenuShell();
  const Loc = window.Loc;
  const list = document.getElementById('loc-list');
  if (!list) return;
  document.getElementById('loc-menu')?.classList.remove('loc-menu-author');
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
  const Loc = window.Loc;
  if (!id || id === Loc.activeId) { document.getElementById('loc-menu')?.classList.remove('open'); return; }
  window.saveState();
  Loc.activeId = id;
  window.saveLocIndex();
  window.resetGlobalsToBase();
  window.loadState();
  window.searchQuery = '';
  Object.keys(window.dirty).forEach(k=>window.dirty[k]=true);
  window.renderActive();
  renderLocSwitcherUI();
  document.getElementById('loc-menu')?.classList.remove('open');
}

export function openAddLocation() {
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
  const Loc = window.Loc;
  if (Loc.list.length <= 1) { window.showAlert('Нельзя удалить единственную точку. Сначала добавьте ещё одну.', 'ℹ️'); return; }
  const loc = window.activeLoc(); if (!loc) return;
  window.showConfirm(`Удалить «${loc.name}»? Все её данные будут безвозвратно потеряны.`, () => {
    try { localStorage.removeItem(window.locDataKey(loc.id)); } catch(e) {}
    Loc.list = Loc.list.filter(l => l.id !== loc.id);
    Loc.activeId = Loc.list[0].id;
    window.saveLocIndex();
    window.resetGlobalsToBase();
    window.loadState();
    window.searchQuery = '';
    Object.keys(window.dirty).forEach(k=>window.dirty[k]=true);
    window.renderActive();
    renderLocSwitcherUI();
    document.getElementById('loc-menu')?.classList.remove('open');
  }, { icon: '🗑️', okText: 'Удалить' });
}

export function saveLocation() {
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
  window.searchQuery = '';
  Object.keys(window.dirty).forEach(k=>window.dirty[k]=true);
  window.renderActive();
  renderLocSwitcherUI();
  window._clearModalDirty('modal-loc');
  window.closeModal('modal-loc');
}
