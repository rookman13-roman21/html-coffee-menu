// src/ui/suppliers.js
// Модальные окна и список поставщиков

import { filterAuthorSupplierGroups } from '../access/author-layer.js';

// ── Перенесено из public/app.js ──

export function openSupplierInfo(name) {
  const g = (window._supGroups && window._supGroups[name]) || {};

  // Заголовок — имя поставщика
  document.getElementById('si-title').textContent = g.name || 'Поставщик';

  // Логотип
  const logoWrap = document.getElementById('si-logo-wrap');
  const logoImg  = document.getElementById('si-logo');
  if (g.logo_url) { logoImg.src = g.logo_url; logoWrap.style.display = 'flex'; }
  else { logoWrap.style.display = 'none'; }

  // Партнёрский бейдж
  document.getElementById('si-partner-wrap').style.display = g.is_featured ? '' : 'none';

  // Телефон
  const phoneEl   = document.getElementById('si-phone');
  const phoneWrap = document.getElementById('si-phone-wrap');
  if (g.phone) {
    phoneEl.textContent = g.phone;
    phoneEl.href = g.phone.includes('@') ? `mailto:${g.phone}` : `tel:${g.phone.replace(/\s/g,'')}`;
    phoneWrap.style.display = '';
  } else { phoneWrap.style.display = 'none'; }

  // Сайт
  const siteEl   = document.getElementById('si-site');
  const siteWrap = document.getElementById('si-site-wrap');
  if (g.site) {
    siteEl.textContent = g.site.replace(/^https?:\/\//, '');
    siteEl.href = g.site;
    siteWrap.style.display = '';
  } else { siteWrap.style.display = 'none'; }

  // Заметка
  const noteEl   = document.getElementById('si-note');
  const noteWrap = document.getElementById('si-note-wrap');
  if (g.note) {
    noteEl.textContent = g.note;
    noteWrap.style.display = '';
  } else { noteWrap.style.display = 'none'; }

  // Промокод
  const promoWrap = document.getElementById('si-promo-wrap');
  const _today = new Date().toISOString().slice(0,10);
  const _promoOk = g.promo_code && (!g.promo_expires || g.promo_expires >= _today);
  if (_promoOk) {
    promoWrap.style.display = '';
    promoWrap.innerHTML = `<div class="sup-promo-block">
      <span class="sup-promo-code">${g.promo_code}</span>
      ${g.promo_desc ? `<span class="sup-promo-desc"> — ${g.promo_desc}</span>` : ''}
      ${g.promo_expires ? `<span class="sup-promo-exp"> до ${g.promo_expires}</span>` : ''}
    </div>`;
  } else { promoWrap.style.display = 'none'; promoWrap.innerHTML = ''; }

  // Привязанные ингредиенты
  const matsWrap = document.getElementById('si-mats-wrap');
  const matsEl   = document.getElementById('si-mats');
  if (g.mats && g.mats.length) {
    matsEl.innerHTML = g.mats.map(m => `<span class="sup-mat-tag">${m}</span>`).join('');
    matsWrap.style.display = '';
  } else { matsWrap.style.display = 'none'; }

  // Кнопка «Удалить» — показываем для любого найденного поставщика
  const delBtn = document.getElementById('si-delete-btn');
  delBtn.style.display = g.name ? '' : 'none';

  // Кнопка «Редактировать» — показываем для любого найденного поставщика
  document.getElementById('si-edit-btn').style.display = g.name ? '' : 'none';

  document.getElementById('modal-supplier-info').dataset.supName = g.name || '';
  openModal('modal-supplier-info');
  if (window.lucide) lucide.createIcons();
}

export function siCopyPhone() {
  const phone = document.getElementById('si-phone').textContent;
  if (!phone || phone === '—') return;
  navigator.clipboard.writeText(phone).then(() => {
    const btn = document.getElementById('si-phone-copy');
    if (btn) { btn.textContent = '✓'; setTimeout(() => { btn.textContent = '📋'; }, 1500); }
  }).catch(() => {});
}

export function siDeleteSupplier() {
  const name = document.getElementById('modal-supplier-info').dataset.supName;
  const g = window._supGroups && window._supGroups[name];
  if (!g) return;
  window.showConfirm(`Удалить поставщика «${name}»?`, () => {
    if (g.matKeys && g.matKeys.length && window.S.suppliers) {
      g.matKeys.forEach(k => { delete window.S.suppliers[k]; });
    }
    if (window.S.supplierBook) {
      if (g.bookId) {
        // удаляем по id
        window.S.supplierBook = window.S.supplierBook.filter(b => String(b.id) !== String(g.bookId));
      } else {
        // fallback: удаляем по имени (если id не был сохранён)
        window.S.supplierBook = window.S.supplierBook.filter(b => b.name !== name);
      }
    }
    saveState();
    closeModal('modal-supplier-info');
    renderCost();
  });
}

export function siOpenEdit() {
  const name = document.getElementById('modal-supplier-info').dataset.supName;
  const g = window._supGroups && window._supGroups[name];
  closeModal('modal-supplier-info');
  if (g && g.matKeys && g.matKeys.length) {
    openSupplierModal(g.matKeys[0]);
    return;
  }
  // Ищем запись в supplierBook: сначала по bookId, если не работает — по имени
  const bookEntry = (window.S.supplierBook || []).find(b =>
    (g && g.bookId != null && String(b.id) === String(g.bookId)) || b.name === name
  );
  if (bookEntry) {
    openSupplierBookModal(bookEntry.id);
  }
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
  window.logWorkspaceActivity?.('supplier_changed', 'supplier', _supplierEditKey, `Изменён поставщик для «${window.MAT[_supplierEditKey]?.name || _supplierEditKey}»`);
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
// Маппинг category из MAT_CATEGORIES → ключи фильтр-чипов
const _CAT_TO_FILTER = {
  coffee: 'coffee', dairy: 'dairy', tea: 'tea',
  bakery: 'sugar',    // бакалея → Сахар
  supplies: 'pack',   // расходники → Упаковка
  drinks: 'other',    // напитки → Прочее
  fruits: 'other',    // фрукты → Прочее
  other: 'other',
};
function _getMatCat(key) {
  if (window.MAT_CATEGORY && window.MAT_CATEGORY[key]) return window.MAT_CATEGORY[key];
  const matEntry = (window.MAT && window.MAT[key]) || (window.S && window.S.materials && window.S.materials[key]);
  const rawCat = (matEntry && matEntry.category) || 'other';
  return _CAT_TO_FILTER[rawCat] || 'other';
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
  book.forEach(b => {
    if (byName[b.name]) {
      byName[b.name].bookId = b.id;
      if (b.is_featured) byName[b.name].is_featured = b.is_featured;
      if (b.logo_url)     byName[b.name].logo_url    = b.logo_url;
      if (b.promo_code)   byName[b.name].promo_code  = b.promo_code;
      if (b.promo_expires) byName[b.name].promo_expires = b.promo_expires;
      if (b.promo_desc)   byName[b.name].promo_desc  = b.promo_desc;
    }
  });

  let groups = Object.values(byName).map(g => ({ ...g, isBookOnly: false }));
  book.forEach(b => {
    if (!byName[b.name]) {
      groups.push({ name: b.name, phone: b.phone||'', note: b.note||'', site: b.site||'', mats: [], matKeys: [], bookId: b.id, isBookOnly: true,
        is_featured: b.is_featured || 0, logo_url: b.logo_url || '',
        promo_code: b.promo_code || '', promo_expires: b.promo_expires || '', promo_desc: b.promo_desc || '' });
    } else {
      const g = groups.find(x => x.name === b.name);
      if (g) {
        if (b.is_featured) g.is_featured = 1;
        if (b.logo_url)    g.logo_url    = b.logo_url;
        if (b.promo_code)  g.promo_code  = b.promo_code;
        if (b.promo_expires) g.promo_expires = b.promo_expires;
        if (b.promo_desc)  g.promo_desc  = b.promo_desc;
      }
    }
  });
  groups = filterAuthorSupplierGroups(groups);

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
    filtered = filtered.filter(g => {
      if (g.mats.length === 0) return supListFilter === 'other'; // book-only → Прочее
      return g.mats.some(m => _getMatCat(m.key) === supListFilter);
    });
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
      const partnerBadge = g.is_featured ? `<span class="sup-partner-badge">⭐ Партнёр MBS</span>` : '';
      const editAction = g.isBookOnly
        ? `openSupplierBookModal('${g.bookId}', true)`
        : `editSupFromList('${g.matKeys[0]}')`;
      const logoHtml = g.logo_url ? `<img class="sup-logo" src="${g.logo_url}" alt="" onerror="this.style.display='none'">` : '';
      const _tod = new Date().toISOString().slice(0,10);
      const _promoOk = g.promo_code && (!g.promo_expires || g.promo_expires >= _tod);
      const promoHtml = _promoOk
        ? `<div class="sup-promo-block"><span class="sup-promo-code">${g.promo_code}</span>${g.promo_desc ? `<span class="sup-promo-desc"> — ${g.promo_desc}</span>` : ''}${g.promo_expires ? `<span class="sup-promo-exp"> до ${g.promo_expires}</span>` : ''}</div>`
        : '';
      return `<div class="sup-card">
        <div class="sup-card-header">
          ${logoHtml ? `<div class="sup-logo-wrap">${logoHtml}</div>` : ''}
          <div class="sup-card-info">
            <span class="sup-card-name"><i data-lucide="building-2" class="icon"></i> ${g.name}</span>
            ${g.phone ? `<span class="sup-card-phone">${g.phone}</span>` : ''}
          </div>
          <button class="btn btn-outline sup-edit-btn" onclick="${editAction}"><i data-lucide="pencil" class="icon"></i> Изменить</button>
        </div>
        ${partnerBadge ? `<div style="margin:4px 0">${partnerBadge}</div>` : ''}
        ${g.note ? `<div class="sup-card-note">${g.note}</div>` : ''}
        ${g.site ? `<div class="sup-card-note"><a href="${g.site}" target="_blank" style="color:var(--muted);text-decoration:none">🌐 ${g.site}</a></div>` : ''}
        ${promoHtml}
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
  _supBookEditId = (id != null && id !== '') ? id : null;
  if (_supBookEditId != null) {
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
  window.logWorkspaceActivity?.('supplier_changed', 'supplier_book', _supBookEditId || '', `Сохранён поставщик «${name}»`);
  const fromList = _supBookFromList;
  _supBookFromList = false;
  _clearModalDirty('modal-supplier-book');
  closeModal('modal-supplier-book');
  renderCost();
  if (fromList) openSuppliersList();
}
export function deleteSupplierBook() {
  if (!_supBookEditId || !window.S.supplierBook) return;
  window.showConfirm('Удалить поставщика из справочника?', () => {
    window.S.supplierBook = window.S.supplierBook.filter(b => String(b.id) !== String(_supBookEditId));
    saveState();
    window.logWorkspaceActivity?.('supplier_changed', 'supplier_book', _supBookEditId, 'Удалён поставщик из списка');
    const fromList = _supBookFromList;
    _supBookFromList = false;
    _clearModalDirty('modal-supplier-book');
    closeModal('modal-supplier-book');
    renderCost();
    if (fromList) openSuppliersList();
  }, { icon: '🗑️', okText: 'Удалить' });
}
