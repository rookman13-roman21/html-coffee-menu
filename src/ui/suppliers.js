// src/ui/suppliers.js
// Модальные окна и список поставщиков

// ── Перенесено из public/app.js ──

export function openSupplierInfo(key) {
  if (!window.window.MAT[key]) return;
  const s = (window.S.suppliers && window.S.suppliers[key]) || {};
  document.getElementById('si-mat-name').textContent = window.MAT[key].name;
  document.getElementById('si-name').textContent = s.name || '—';
  // телефон
  const phoneEl = document.getElementById('si-phone');
  const phoneWrap = document.getElementById('si-phone-wrap');
  if (s.phone) {
    phoneEl.textContent = s.phone;
    phoneEl.href = s.phone.includes('@') ? `mailto:${s.phone}` : `tel:${s.phone.replace(/\s/g,'')}`;
    phoneWrap.style.display = '';
  } else { phoneWrap.style.display = 'none'; }
  // сайт
  const siteEl = document.getElementById('si-site');
  const siteWrap = document.getElementById('si-site-wrap');
  if (s.site) {
    siteEl.textContent = s.site;
    siteEl.href = s.site;
    siteWrap.style.display = '';
  } else { siteWrap.style.display = 'none'; }
  // заметка
  const noteEl = document.getElementById('si-note');
  const noteWrap = document.getElementById('si-note-wrap');
  if (s.note) {
    noteEl.textContent = s.note;
    noteWrap.style.display = '';
  } else { noteWrap.style.display = 'none'; }
  // сохраняем ключ для редактирования
  document.getElementById('modal-supplier-info').dataset.matKey = key;
  openModal('modal-supplier-info');
  if (window.lucide) lucide.createIcons();
}
export function siOpenEdit() {
  const key = document.getElementById('modal-supplier-info').dataset.matKey;
  closeModal('modal-supplier-info');
  openSupplierModal(key);
}

export function openSupplierModal(key) {
  if (!window.window.MAT[key]) return;
  _supplierEditKey = key;
  const s = (window.S.suppliers && window.S.suppliers[key]) || {};
  document.getElementById('sup-mat-name').textContent = window.MAT[key].name;
  document.getElementById('sup-name').value  = s.name  || '';
  document.getElementById('sup-phone').value = s.phone || '';
  document.getElementById('sup-note').value  = s.note  || '';
  document.getElementById('sup-site').value  = s.site  || '';
  openModal('modal-supplier');
  if (window.lucide) lucide.createIcons();
}
export function editSupFromList(matKey) {
  _supplierFromList = true;
  openSupplierModal(matKey);
}
export function cancelSupplierModal() {
  const fromList = _supplierFromList;
  _supplierFromList = false;
  _clearModalDirty('modal-supplier');
  closeModal('modal-supplier');
  if (fromList) openSuppliersList();
}
export function saveSupplier() {
  if (!_supplierEditKey) return;
  if (!window.S.suppliers) window.S.suppliers = {};
  const name  = document.getElementById('sup-name').value.trim();
  const phone = document.getElementById('sup-phone').value.trim();
  const note  = document.getElementById('sup-note').value.trim();
  const site  = document.getElementById('sup-site').value.trim();
  if (!name && !phone && !note && !site) {
    delete window.S.suppliers[_supplierEditKey];
  } else {
    window.S.suppliers[_supplierEditKey] = { name, phone, note, site };
  }
  saveState();
  const fromList = _supplierFromList;
  _supplierFromList = false;
  _clearModalDirty('modal-supplier');
  closeModal('modal-supplier');
  renderCost();
  if (fromList) openSuppliersList();
}

// ── Список поставщиков
export function openSuppliersList() {
  supListSearch = '';
  supListFilter = 'all';
  const inp = document.getElementById('sup-list-search');
  if (inp) inp.value = '';
  renderSuppliersList();
  openModal('modal-suppliers-list');
  if (window.lucide) lucide.createIcons();
}
function _getMatCat(key) {
  if (window.MAT_CATEGORY && window.MAT_CATEGORY[key]) return window.MAT_CATEGORY[key];
  const matEntry = (window.MAT && window.MAT[key]) || (window.S && window.S.materials && window.S.materials[key]);
  return (matEntry && matEntry.category) || 'other';
}

export function renderSuppliersList() {
  const sups = window.S.suppliers || {};
  const book = window.S.supplierBook || [];

  // Группируем mat-linked по имени
  const byName = {};
  Object.entries(sups).forEach(([key, v]) => {
    if (!v || (!v.name && !v.phone && !v.note)) return;
    const nm = v.name || '(без названия)';
    if (!byName[nm]) byName[nm] = { name: nm, phone: v.phone||'', note: v.note||'', site: v.site||'', mats: [], matKeys: [], bookId: null };
    if (window.MAT[key]) byName[nm].mats.push({ label: window.MAT[key].name, key });
    byName[nm].matKeys.push(key);
    if (!byName[nm].phone && v.phone) byName[nm].phone = v.phone;
    if (!byName[nm].note  && v.note)  byName[nm].note  = v.note;
    if (!byName[nm].site  && v.site)  byName[nm].site  = v.site;
  });
  book.forEach(b => { if (byName[b.name]) byName[b.name].bookId = b.id; });

  let groups = Object.values(byName).map(g => ({ ...g, isBookOnly: false }));
  book.forEach(b => {
    if (!byName[b.name])
      groups.push({ name: b.name, phone: b.phone||'', note: b.note||'', site: b.site||'', mats: [], matKeys: [], bookId: b.id, isBookOnly: true });
  });

  // Поиск
  const q = supListSearch.toLowerCase();
  let filtered = q
    ? groups.filter(g =>
        g.name.toLowerCase().includes(q) ||
        g.phone.toLowerCase().includes(q) ||
        g.note.toLowerCase().includes(q) ||
        g.mats.some(m => m.label.toLowerCase().includes(q)))
    : groups;

  // Фильтр по категории
  if (supListFilter === 'nomat') {
    filtered = filtered.filter(g => g.mats.length === 0);
  } else if (supListFilter !== 'all') {
    filtered = filtered.filter(g =>
      g.mats.some(m => _getMatCat(m.key) === supListFilter));
  }

  // Статистика
  const filledMat = Object.entries(sups).filter(([,v]) => v && (v.name||v.phone||v.note)).length;
  const totalMats = Object.keys(MAT).length;
  document.getElementById('sup-list-stats').innerHTML =
    `Поставщиков: <b>${groups.length}</b> &nbsp;·&nbsp; Позиций сырья заполнено: <b>${filledMat}</b> из <b>${totalMats}</b>`;

  // Чипы фильтра
  document.getElementById('sup-filter-chips').innerHTML =
    ['all','coffee','dairy','tea','sugar','pack','other','nomat'].map(c =>
      `<button class="filter-chip${supListFilter===c?' active':''}" onclick="supListFilter='${c}';renderSuppliersList()">${window.CAT_LABELS[c]}</button>`
    ).join('');

  // Карточки
  let body = '';
  if (!filtered.length) {
    body = `<div style="padding:28px;text-align:center;color:var(--muted)">${
      supListFilter !== 'all' || q
        ? 'Ничего не найдено'
        : 'Поставщики ещё не добавлены.<br>Нажмите <b>+ Добавить</b> или значок 🚚 у любого сырья.'
    }</div>`;
  } else {
    body = filtered.map(g => {
      const matTags = g.mats.map(m =>
        `<span class="sup-mat-tag" title="Изменить для ${m.label}" onclick="editSupFromList('${m.key}')">${m.label}</span>`
      ).join('');
      const noMatBadge = g.isBookOnly ? `<span class="sup-book-badge">Без сырья</span>` : '';
      const editAction = g.isBookOnly
        ? `openSupplierBookModal('${g.bookId}', true)`
        : `editSupFromList('${g.matKeys[0]}')`;
      return `<div class="sup-card">
        <div class="sup-card-header">
          <div class="sup-card-info">
            <span class="sup-card-name"><i data-lucide="building-2" class="icon"></i> ${g.name}</span>
            ${g.phone ? `<span class="sup-card-phone">${g.phone}</span>` : ''}
          </div>
          <button class="btn btn-outline sup-edit-btn" onclick="${editAction}"><i data-lucide="pencil" class="icon"></i> Изменить</button>
        </div>
        ${g.note ? `<div class="sup-card-note">${g.note}</div>` : ''}
        ${g.site ? `<div class="sup-card-note"><a href="${g.site}" target="_blank" style="color:var(--muted);text-decoration:none">🌐 ${g.site}</a></div>` : ''}
        <div class="sup-card-mats">${matTags}${noMatBadge}</div>
      </div>`;
    }).join('');
  }
  document.getElementById('sup-list-body').innerHTML = body;
  if (window.lucide) lucide.createIcons();
}

// ── Справочник поставщиков (без привязки к сырью)
let _supBookFromList = false;
export function openSupplierBookModal(id, fromList) {
  _supBookFromList = !!fromList;
  _supBookEditId = id || null;
  if (id) {
    const entry = (window.S.supplierBook||[]).find(b => String(b.id) === String(id));
    if (!entry) return;
    document.getElementById('sup-book-title').textContent = 'Редактировать поставщика';
    document.getElementById('sup-book-name').value  = entry.name  || '';
    document.getElementById('sup-book-phone').value = entry.phone || '';
    document.getElementById('sup-book-note').value  = entry.note  || '';
    document.getElementById('sup-book-site').value  = entry.site  || '';
    document.getElementById('sup-book-del-btn').style.display = '';
  } else {
    document.getElementById('sup-book-title').textContent = 'Новый поставщик';
    document.getElementById('sup-book-name').value  = '';
    document.getElementById('sup-book-phone').value = '';
    document.getElementById('sup-book-note').value  = '';
    document.getElementById('sup-book-site').value  = '';
    document.getElementById('sup-book-del-btn').style.display = 'none';
  }
  openModal('modal-supplier-book');
  if (window.lucide) lucide.createIcons();
}
export function cancelSupplierBookModal(force = false) {
  if (!force && _isModalDirty('modal-supplier-book')) {
    _showUnsavedWarning('modal-supplier-book');
    return;
  }
  const fromList = _supBookFromList;
  _supBookFromList = false;
  _clearModalDirty('modal-supplier-book');
  closeModal('modal-supplier-book');
  if (fromList) openSuppliersList();
}
export function saveSupplierBook() {
  const name  = document.getElementById('sup-book-name').value.trim();
  const phone = document.getElementById('sup-book-phone').value.trim();
  const note  = document.getElementById('sup-book-note').value.trim();
  const site  = document.getElementById('sup-book-site').value.trim();
  if (!name) { document.getElementById('sup-book-name').focus(); return; }
  if (!window.S.supplierBook) window.S.supplierBook = [];
  if (_supBookEditId) {
    const idx = window.S.supplierBook.findIndex(b => String(b.id) === String(_supBookEditId));
    if (idx >= 0) window.S.supplierBook[idx] = { ...window.S.supplierBook[idx], name, phone, note, site };
  } else {
    const maxId = window.S.supplierBook.reduce((m,b) => Math.max(m, b.id||0), 0);
    window.S.supplierBook.push({ id: maxId + 1, name, phone, note, site });
  }
  saveState();
  const fromList = _supBookFromList;
  _supBookFromList = false;
  _clearModalDirty('modal-supplier-book');
  closeModal('modal-supplier-book');
  renderCost();
  if (fromList) openSuppliersList();
}
export function deleteSupplierBook() {
  if (!_supBookEditId || !window.S.supplierBook) return;
  if (!confirm('Удалить поставщика из справочника?')) return;
  window.S.supplierBook = window.S.supplierBook.filter(b => String(b.id) !== String(_supBookEditId));
  saveState();
  const fromList = _supBookFromList;
  _supBookFromList = false;
  _clearModalDirty('modal-supplier-book');
  closeModal('modal-supplier-book');
  renderCost();
  if (fromList) openSuppliersList();
}

