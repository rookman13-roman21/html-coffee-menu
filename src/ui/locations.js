// src/ui/locations.js
// Управление локациями (точками продаж)

export function renderLocSwitcherUI() {
  const loc = window.activeLoc();
  const nameEl = document.getElementById('loc-name');
  const iconEl = document.getElementById('loc-icon');
  if (loc && nameEl) nameEl.textContent = loc.name;
  if (loc && iconEl) iconEl.textContent = loc.icon || '☕';
  renderLocList();
}

export function renderLocList() {
  const Loc = window.Loc;
  const list = document.getElementById('loc-list');
  if (!list) return;
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
