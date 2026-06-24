// ═══════════════════════════════════════════════════════════════════
//  RENDER — COST / ПОСТАВЩИКИ / ИНГРЕДИЕНТЫ / ПОЛУФАБРИКАТЫ
//  (src/render/cost.js)
//
//  Все данные читаются из window.* — они доступны после того как
//  app.js сделал Object.assign(window, {...}) в конце своего файла.
// ═══════════════════════════════════════════════════════════════════

import { filterAuthorSupplierGroups } from '../access/author-layer.js';
import { isWorkspaceOwner } from '../ui/auth.js';

let _supSearch  = '';
let _ingSearch  = '';
let _semiSearch = '';

export function filterSupCost(val) {
  _supSearch = val;
  // Фильтруем карточки поставщиков напрямую без ре-рендера
  const cards = document.querySelectorAll('#cost-sup-body .sup-card');
  const q = val.toLowerCase();
  cards.forEach(card => {
    if (!q) { card.style.display = ''; return; }
    const text = card.textContent.toLowerCase();
    card.style.display = text.includes(q) ? '' : 'none';
  });
  const clearBtn = document.querySelector('#cost-sup-body .search-clear');
  if (clearBtn) clearBtn.classList.toggle('visible', !!val);
  // Показываем «Ничего не найдено» если все скрыты
  let noRes = document.getElementById('cost-sup-nores');
  const visible = [...cards].some(c => c.style.display !== 'none');
  if (cards.length && !visible) {
    if (!noRes) {
      noRes = document.createElement('div');
      noRes.id = 'cost-sup-nores';
      noRes.style.cssText = 'color:var(--muted);font-size:13px;padding:16px 0';
      noRes.textContent = 'Ничего не найдено';
      document.getElementById('cost-sup-body').appendChild(noRes);
    }
    noRes.style.display = '';
  } else if (noRes) {
    noRes.style.display = 'none';
  }
}

export function filterIngCost(val) {
  _ingSearch = val;
  const q = val.toLowerCase();
  // Фильтруем строки таблицы ингредиентов
  document.querySelectorAll('#cost-ing-body .mat-row').forEach(row => {
    if (!q) { row.style.display = ''; row.classList.remove('mat-row--match'); return; }
    const name = (row.querySelector('.mat-td-name')?.textContent || '').toLowerCase();
    const match = name.includes(q);
    row.style.display = match ? '' : 'none';
    row.classList.toggle('mat-row--match', match);
  });
  // При поиске — раскрываем все категории; при сбросе — возвращаем свёрнутые
  document.querySelectorAll('#cost-ing-body tbody[id^="mat-tbody-"]').forEach(tbody => {
    const cat = tbody.id.replace('mat-tbody-', '');
    if (q) {
      tbody.style.display = '';
      const icon = document.getElementById('mat-cat-icon-' + cat);
      if (icon) icon.textContent = '▼';
    } else {
      const isCollapsed = (window._matCollapsed || {})[cat];
      tbody.style.display = isCollapsed ? 'none' : '';
      const icon = document.getElementById('mat-cat-icon-' + cat);
      if (icon) icon.textContent = isCollapsed ? '▶' : '▼';
    }
  });
  const clearBtn = document.querySelector('#cost-ing-body .search-clear');
  if (clearBtn) clearBtn.classList.toggle('visible', !!val);
}

export function filterSemiCost(val) {
  _semiSearch = val;
  const q = val.toLowerCase();
  document.querySelectorAll('#cost-semi-body .mat-row').forEach(row => {
    if (!q) { row.style.display = ''; row.classList.remove('mat-row--match'); return; }
    const name = (row.querySelector('.mat-td-name')?.textContent || '').toLowerCase();
    const match = name.includes(q);
    row.style.display = match ? '' : 'none';
    row.classList.toggle('mat-row--match', match);
  });
  // При поиске — раскрываем все категории; при сбросе — возвращаем свёрнутые
  document.querySelectorAll('#cost-semi-body tbody[id^="semi-tbody-"]').forEach(tbody => {
    const cat = tbody.id.replace('semi-tbody-', '');
    if (q) {
      tbody.style.display = '';
      const icon = document.getElementById('semi-cat-icon-' + cat);
      if (icon) icon.textContent = '▼';
    } else {
      const isCollapsed = (window._semiCollapsed || {})[cat];
      tbody.style.display = isCollapsed ? 'none' : '';
      const icon = document.getElementById('semi-cat-icon-' + cat);
      if (icon) icon.textContent = isCollapsed ? '▶' : '▼';
    }
  });
  const clearBtn = document.querySelector('#cost-semi-body .search-clear');
  if (clearBtn) clearBtn.classList.toggle('visible', !!val);
}

// ── Autocomplete-дропдаун для полей поиска ───────────────────────
function _ensureSuggestEl() {
  let el = document.getElementById('_cost-suggest');
  if (!el) {
    el = document.createElement('div');
    el.id = '_cost-suggest';
    el.className = 'cost-suggest';
    document.body.appendChild(el);
  }
  return el;
}

function _hideSuggest() {
  const el = document.getElementById('_cost-suggest');
  if (el) el.style.display = 'none';
}

function _showSuggest(inputEl, items, onSelect) {
  const q = inputEl.value.toLowerCase().trim();
  const el = _ensureSuggestEl();
  if (!q) { _hideSuggest(); return; }

  const matches = items
    .filter(name => name && name.toLowerCase().includes(q))
    .slice(0, 8);

  if (!matches.length) { _hideSuggest(); return; }

  const rect = inputEl.getBoundingClientRect();
  el.style.left  = rect.left + 'px';
  el.style.top   = (rect.bottom + 4) + 'px';
  el.style.width = rect.width + 'px';
  el.style.display = 'block';

  const esc = s => s.replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const hi = (name) => {
    const lo = name.toLowerCase();
    const idx = lo.indexOf(q);
    if (idx < 0) return esc(name);
    return esc(name.slice(0, idx))
      + '<mark>' + esc(name.slice(idx, idx + q.length)) + '</mark>'
      + esc(name.slice(idx + q.length));
  };

  el.innerHTML = matches.map(name =>
    `<div class="cost-suggest-item">${hi(name)}</div>`
  ).join('');

  el.querySelectorAll('.cost-suggest-item').forEach((item, i) => {
    item.addEventListener('mousedown', (e) => {
      e.preventDefault(); // не снимаем фокус с input
      onSelect(matches[i]);
      _hideSuggest();
    });
  });
}

function _attachCostSuggestions() {
  const configs = [
    {
      id: 'cost-sup-search',
      getItems: () => (window.S?.suppliers || []).map(s => s.name).filter(Boolean),
      onSelect: (name, el) => { filterSupCost(name); window._searchClear?.(el); },
    },
    {
      id: 'cost-ing-search',
      getItems: () => Object.values(window.MAT || {}).map(m => m.name).filter(Boolean),
      onSelect: (name, el) => { filterIngCost(name); window._searchClear?.(el); },
    },
    {
      id: 'cost-semi-search',
      getItems: () => (window.SEMI || []).map(s => s.name).filter(Boolean),
      onSelect: (name, el) => { filterSemiCost(name); window._searchClear?.(el); },
    },
  ];
  configs.forEach(({ id, getItems, onSelect }) => {
    const el = document.getElementById(id);
    if (!el) return;
    // Используем rAF: oninput на HTML-элементе вызывает renderCost() и перестраивает DOM раньше,
    // чем срабатывает этот addEventListener. После rAF берём свежий элемент по id.
    el.addEventListener('input', () => {
      requestAnimationFrame(() => {
        const fresh = document.getElementById(id);
        if (fresh) _showSuggest(fresh, getItems(), (name) => {
          fresh.value = name;
          onSelect(name, fresh);
        });
      });
    });
    el.addEventListener('blur',    () => setTimeout(_hideSuggest, 150));
    el.addEventListener('keydown', (e) => { if (e.key === 'Escape') { _hideSuggest(); e.stopPropagation(); } });
  });
}

export function renderCost() {
  const {
    MAT, MAT_CATEGORIES, SEMI, S,
    calcSemiCostPerUnit, rubSemi,
    _buildMatUsageMap, _buildSemiUsageMap,
    _matActiveCat, _matCollapsed, _semiCollapsed, _semiSectionCollapsed,
    _supCollapsed, _ingCollapsed,
    toggleMatCat, toggleSemiCat,
    setMatCat,
  } = window;

  // ── Все категории ингредиентов (встроенные + кастомные) ──────────
  const ALL_CATS = { ...MAT_CATEGORIES, ...(S.customCategories || {}) };

  // ── Базовая категория полуфабрикатов ─────────────────────────────
  const SEMI_BASE_CATS = { semi_default: { label: '📦 Полуфабрикаты', order: 1 } };
  const SEMI_ALL_CATS  = { ...SEMI_BASE_CATS, ...(S.semiCustomCategories || {}) };
  const canDeleteRecipeAssets = isWorkspaceOwner() || !!(window.authorCanPublish && window.authorCanPublish());

  // ── Сырьё по категориям ──────────────────────────────────────────
  const matGroups = {};
  // Пустые кастомные категории тоже должны отображаться
  Object.keys(S.customCategories || {}).forEach(cat => {
    if (!matGroups[cat]) matGroups[cat] = [];
  });
  Object.entries(MAT).forEach(([key, m]) => {
    const cat = m.category || 'other';
    if (!matGroups[cat]) matGroups[cat] = [];
    matGroups[cat].push([key, m]);
  });
  const matSortedCats = Object.keys(matGroups).sort((a, b) =>
    ((ALL_CATS[a] || { order: 99 }).order) - ((ALL_CATS[b] || { order: 99 }).order)
  );

  // По умолчанию все категории свёрнуты (если не задано иное пользователем)
  matSortedCats.forEach(cat => {
    if (_matCollapsed[cat] === undefined) _matCollapsed[cat] = true;
  });

  // ── Секция Поставщики ────────────────────────────────────────────
  const sups = S.suppliers || {};
  const book = S.supplierBook || [];
  const byName = {};
  Object.entries(sups).forEach(([key, v]) => {
    if (!v || (!v.name && !v.phone && !v.note)) return;
    const nm = v.name || '(без названия)';
    if (!byName[nm]) byName[nm] = { name: nm, phone: v.phone || '', note: v.note || '', site: v.site || '', mats: [], matKeys: [] };
    if (MAT[key]) byName[nm].mats.push(MAT[key].name);
    byName[nm].matKeys.push(key);
    if (!byName[nm].phone && v.phone) byName[nm].phone = v.phone;
    if (!byName[nm].note  && v.note)  byName[nm].note  = v.note;
    if (!byName[nm].site  && v.site)  byName[nm].site  = v.site;
  });
  book.forEach(b => {
    if (!byName[b.name]) {
      byName[b.name] = { name: b.name, phone: b.phone || '', note: b.note || '', site: b.site || '', mats: [], matKeys: [], bookId: b.id,
        is_featured: b.is_featured || 0, logo_url: b.logo_url || '',
        promo_code: b.promo_code || '', promo_expires: b.promo_expires || '', promo_desc: b.promo_desc || '' };
    } else {
      if (!byName[b.name].note  && b.note)  byName[b.name].note  = b.note;
      if (!byName[b.name].phone && b.phone) byName[b.name].phone = b.phone;
      if (!byName[b.name].site  && b.site)  byName[b.name].site  = b.site;
      if (!byName[b.name].bookId) byName[b.name].bookId = b.id;
      if (b.is_featured) byName[b.name].is_featured = b.is_featured;
      if (b.logo_url) byName[b.name].logo_url = b.logo_url;
      if (b.promo_code) byName[b.name].promo_code = b.promo_code;
      if (b.promo_expires) byName[b.name].promo_expires = b.promo_expires;
      if (b.promo_desc) byName[b.name].promo_desc = b.promo_desc;
    }
  });
  const supGroups = filterAuthorSupplierGroups(Object.values(byName));
  const filteredSupGroups = _supSearch
    ? supGroups.filter(g => {
        const q = _supSearch.toLowerCase();
        return g.name.toLowerCase().includes(q)
          || (g.phone||'').toLowerCase().includes(q)
          || (g.note||'').toLowerCase().includes(q)
          || (g.site||'').toLowerCase().includes(q)
          || g.mats.some(nm => nm.toLowerCase().includes(q));
      })
    : supGroups;
  // Сохраняем все группы глобально для lookup по имени в openSupplierInfo
  window._supGroups = {};
  supGroups.forEach(g => { window._supGroups[g.name] = g; });
  const suppliersHtml = filteredSupGroups.length
    ? '<div class="mat-grid">' + filteredSupGroups.map(g => {
        const matTags = g.mats.map(name => '<span class="sup-mat-tag">' + name + '</span>').join('');
        const safeName = g.name.replace(/'/g, "\\'");
        const logoHtml = g.logo_url ? '<img class="sup-logo" src="' + g.logo_url + '" alt="" onerror="this.style.display=\'none\'">' : '';
        const partnerBadge = g.is_featured ? '<span class="sup-partner-badge">⭐ Партнёр MBS</span>' : '';
        const _today = new Date().toISOString().slice(0,10);
        const _promoOk = g.promo_code && (!g.promo_expires || g.promo_expires >= _today);
        const promoHtml = _promoOk ? '<div class="sup-promo-block">'
          + '<span class="sup-promo-code">' + g.promo_code + '</span>'
          + (g.promo_desc ? '<span class="sup-promo-desc"> — ' + g.promo_desc + '</span>' : '')
          + (g.promo_expires ? '<span class="sup-promo-exp"> до ' + g.promo_expires + '</span>' : '')
          + '</div>' : '';
        return '<div class="sup-card" style="cursor:pointer" onclick="openSupplierInfo(\'' + safeName + '\')">'
          + '<div class="sup-card-header">'
          + (logoHtml ? '<div class="sup-logo-wrap">' + logoHtml + '</div>' : '')
          + '<div class="sup-card-info">'
          + '<span class="sup-card-name">' + g.name + '</span>'
          + (g.phone ? '<span class="sup-card-phone">' + g.phone + '</span>' : '')
          + '</div>'
          + '</div>'
          + (partnerBadge ? '<div style="margin:4px 0">' + partnerBadge + '</div>' : '')
          + (g.note ? '<div class="sup-card-note">' + g.note + '</div>' : '')
          + (g.site ? '<div class="sup-card-note"><a href="' + g.site + '" target="_blank" onclick="event.stopPropagation()" style="color:var(--muted);text-decoration:none;font-size:12px">🌐 ' + g.site.replace(/^https?:\/\//, '') + '</a></div>' : '')
          + promoHtml
          + (matTags ? '<div class="sup-card-mats">' + matTags + '</div>' : '')
          + '</div>';
      }).join('') + '</div>'
    : `<div style="color:var(--muted);font-size:13px;padding:16px 0">${_supSearch ? 'Ничего не найдено' : 'Поставщики ещё не добавлены. Нажмите <b>+ Поставщик</b> или значок 🚚 у любого сырья.'}</div>`;

  // ── Табы категорий сырья ─────────────────────────────────────────
  const matCatTabsHtml = `
    <div class="mat-cat-tabs">
      <button class="mat-cat-tab${_matActiveCat === 'all' ? ' active' : ''}" onclick="setMatCat('all')">Всё <span>${Object.keys(MAT).length}</span></button>
      ${matSortedCats.map(cat => {
        const lbl = (ALL_CATS[cat] || { label: cat }).label;
        return `<button class="mat-cat-tab${_matActiveCat === cat ? ' active' : ''}" onclick="setMatCat('${cat}')">${lbl} <span>${matGroups[cat].length}</span></button>`;
      }).join('')}
    </div>`;

  // ── Таблица ингредиентов ─────────────────────────────────────────
  const matUsageMap = _buildMatUsageMap();
  window._matUsageMap = matUsageMap;

  const matRowsHtml = matSortedCats.map(cat => {
    const catLabel  = (ALL_CATS[cat] || { label: cat }).label;
    const collapsed = !!_matCollapsed[cat];
    const catHidden = (_matActiveCat !== 'all' && _matActiveCat !== cat) ? 'display:none' : '';
    const rows = matGroups[cat].map(([key, m]) => {
      const sup      = (S.suppliers || {})[key];
      const supTitle = sup ? `${sup.name || ''}${sup.phone ? ' · ' + sup.phone : ''}${sup.note ? ' · ' + sup.note : ''}` : 'Указать поставщика';
      const supClr   = sup ? 'var(--green)' : 'var(--muted)';
      const supCell  = sup
        ? `<button class="sup-name-btn" onclick="event.stopPropagation();openSupplierInfo('${(sup.name||'').replace(/'/g,"\\'")}'" title="${(sup.phone || '')} ${(sup.note || '')}">${sup.name || 'поставщик'}</button>`
        : `<button class="mat-del" style="font-size:11px;color:var(--muted)" onclick="event.stopPropagation();openSupQuickDrop('${key}',this)" title="Добавить поставщика">+ добавить</button>`;
      const usedIn      = matUsageMap[key] || [];
      const usageBadge  = usedIn.length
        ? `<button class="usage-badge" onclick="event.stopPropagation();openMatUsage('mat','${key}')" title="Нажмите, чтобы увидеть рецепты">${usedIn.length}</button>`
        : `<span class="usage-badge usage-badge-zero">0</span>`;
      const ingQ = _ingSearch.toLowerCase();
      if (ingQ && !m.name.toLowerCase().includes(ingQ)) return '';
      return `<tr class="mat-row${m.custom ? ' mat-row-custom' : ''}" data-cat="${cat}" onclick="openViewMat('${key}')" title="Нажмите для просмотра" style="cursor:pointer">
        <td class="mat-td-name">${m.name}${m.purchaseUrl ? ` <a href="${m.purchaseUrl}" target="_blank" rel="noopener" onclick="event.stopPropagation()" title="Ссылка на покупку" style="color:var(--green);font-size:12px;text-decoration:none;vertical-align:middle">↗</a>` : ''}</td>
        <td class="mat-td-unit mob-hide">${m.unit}</td>
        <td class="mat-td-price" style="cursor:default">
          <span style="font-weight:600">${S.prices[key]}</span> <span style="font-size:12px;color:var(--muted)">₽</span>
        </td>
        <td class="mat-td-sup mob-hide">${supCell}</td>
        <td class="mat-td-usage">${usageBadge}</td>
        <td class="mat-td-actions">
          <button class="mat-del" onclick="event.stopPropagation();openSupQuickDrop('${key}',this)" title="${supTitle}" style="color:${supClr}"><i data-lucide="truck" class="icon"></i></button>
          <button class="mat-del" onclick="event.stopPropagation();openPriceHistory('${key}')" title="История цен"><i data-lucide="history" class="icon"></i></button>
          ${m.custom && canDeleteRecipeAssets ? `<button class="mat-del" onclick="event.stopPropagation();deleteMat('${key}')" title="Удалить" style="color:var(--red)"><i data-lucide="trash-2" class="icon"></i></button>` : ''}
        </td>
      </tr>`;
    }).join('');
    return `<tr class="mat-cat-header" data-cat="${cat}" style="${catHidden}" onclick="toggleMatCat('${cat}')">
      <td colspan="6">
        <div style="display:flex;align-items:center;gap:6px;width:100%">
          <span id="mat-cat-icon-${cat}" class="mat-cat-chevron">${collapsed ? '▶' : '▼'}</span>
          ${catLabel}
          <span class="mat-cat-count">${matGroups[cat].length}</span>
          <span style="flex:1"></span>
          <button class="mat-del" onclick="event.stopPropagation();openEditCategory('${cat}')" title="Редактировать категорию" style="opacity:.7"><i data-lucide="pencil" class="icon"></i></button>
        </div>
      </td>
      </tr>
      <tbody id="mat-tbody-${cat}" style="${collapsed ? 'display:none' : ''}">${rows}</tbody>`;
  }).join('');

  const matCardsHtml = `<div class="mat-table-wrap">
    <table class="mat-table fixed-cols">
      <colgroup>
        <col style="width:30%">
        <col class="mob-hide" style="width:9%">
        <col style="width:13%">
        <col class="mob-hide" style="width:20%">
        <col style="width:8%">
        <col style="width:20%">
      </colgroup>
      <thead>
        <tr>
          <th style="width:30%">Название</th>
          <th class="mob-hide" style="width:9%">Ед. изм.</th>
          <th style="width:13%">Цена</th>
          <th class="mob-hide" style="width:20%">Поставщик</th>
          <th class="ta-c" style="width:8%" title="Кол-во рецептов, где используется">Рецепты</th>
          <th style="width:20%">Действия</th>
        </tr>
      </thead>
      ${matRowsHtml}
    </table>
  </div>`;

  // ── Полуфабрикаты ────────────────────────────────────────────────
  const semiUsageMap = _buildSemiUsageMap();
  window._semiUsageMap = semiUsageMap;

  // Группировка п/ф по категориям
  const semiGroups = {};
  Object.keys(S.semiCustomCategories || {}).forEach(cat => { if (!semiGroups[cat]) semiGroups[cat] = []; });
  SEMI.forEach(s => {
    const cat = s.category || 'semi_default';
    if (!semiGroups[cat]) semiGroups[cat] = [];
    semiGroups[cat].push(s);
  });
  // Убедимся что дефолтная категория присутствует
  if (!semiGroups['semi_default']) semiGroups['semi_default'] = [];
  const semiSortedCats = Object.keys(semiGroups).sort((a, b) =>
    ((SEMI_ALL_CATS[a] || { order: 99 }).order) - ((SEMI_ALL_CATS[b] || { order: 99 }).order)
  );
  semiSortedCats.forEach(cat => {
    if (_semiCollapsed[cat] === undefined) _semiCollapsed[cat] = true;
  });

  const semiRowsHtml = semiSortedCats.map(cat => {
    const allItems = semiGroups[cat] || [];
    const items = _semiSearch
      ? allItems.filter(s => s.name.toLowerCase().includes(_semiSearch.toLowerCase()))
      : allItems;
    const catLabel = (SEMI_ALL_CATS[cat] || {}).label || cat;
    const collapsed = _semiCollapsed[cat];
    const rows = items.map(s => {
      const cost   = calcSemiCostPerUnit(s);
      const recipe = s.recipe.map(r => {
        const mat = MAT[r.mat];
        return mat ? mat.name + ' ' + r.amt + (mat.unit.replace(/\d+ /, '')) : r.mat;
      }).join(', ');
      const usedIn = semiUsageMap[String(s.id)] || [];
      const semiUsageBadge = usedIn.length
        ? `<button class="usage-badge" onclick="event.stopPropagation();openMatUsage('semi','${s.id}')" title="Нажмите, чтобы увидеть рецепты">${usedIn.length}</button>`
        : `<span class="usage-badge usage-badge-zero">0</span>`;
      return `<tr class="mat-row" title="Состав: ${recipe}" style="cursor:pointer" onclick="openViewSemi(${s.id})">
        <td class="mat-td-name">${s.name}</td>
        <td class="mat-td-unit mob-hide">${s.yield}</td>
        <td class="mat-td-unit mob-hide">${s.unit}</td>
        <td class="mat-td-price" style="font-weight:700;color:var(--green)">${rubSemi(cost, s.unit)}</td>
        <td class="mat-td-usage">${semiUsageBadge}</td>
        <td class="mat-td-actions">
          <button class="mat-del" onclick="event.stopPropagation();exportSingleSemiPDF(${s.id})" title="Скачать техкарту PDF"><i data-lucide="file-text" class="icon"></i></button>
          <button class="mat-del" onclick="event.stopPropagation();exportSingleSemiXLSX(${s.id})" title="Скачать техкарту Excel"><i data-lucide="file-spreadsheet" class="icon"></i></button>
          ${canDeleteRecipeAssets ? `<button class="mat-del" onclick="event.stopPropagation();deleteSemi(${s.id})" title="Удалить" style="color:var(--red)"><i data-lucide="trash-2" class="icon"></i></button>` : ''}
        </td>
      </tr>`;
    }).join('');
    return `<tr class="mat-cat-header" data-semicat="${cat}" onclick="toggleSemiCat('${cat}')">
      <td colspan="6">
        <div style="display:flex;align-items:center;gap:6px;width:100%">
          <span id="semi-cat-icon-${cat}" class="mat-cat-chevron">${collapsed ? '▶' : '▼'}</span>
          ${catLabel}
          <span class="mat-cat-count">${items.length}</span>
          <span style="flex:1"></span>
          <button class="mat-del" onclick="event.stopPropagation();openEditSemiCategory('${cat}')" title="Редактировать категорию" style="opacity:.7"><i data-lucide="pencil" class="icon"></i></button>
        </div>
      </td>
      </tr>
      <tbody id="semi-tbody-${cat}" style="${collapsed ? 'display:none' : ''}">${rows}</tbody>`;
  }).join('');

  const semiHtml = SEMI.length || Object.keys(S.semiCustomCategories || {}).length
    ? `<div class="mat-table-wrap">
        <table class="mat-table fixed-cols">
          <colgroup>
            <col style="width:33%">
            <col class="mob-hide" style="width:12%">
            <col class="mob-hide" style="width:8%">
            <col style="width:17%">
            <col style="width:8%">
            <col style="width:22%">
          </colgroup>
          <thead>
            <tr>
              <th style="width:33%">Название</th>
              <th class="mob-hide" style="width:12%">Выход</th>
              <th class="mob-hide" style="width:8%">Ед.</th>
              <th style="width:17%">Себестоимость/ед.</th>
              <th class="ta-c" style="width:8%" title="Кол-во рецептов, где используется">Рецепты</th>
              <th style="width:22%">Действия</th>
            </tr>
          </thead>
          ${semiRowsHtml}
        </table>
      </div>`
    : `<div style="color:var(--muted);font-size:13px;padding:16px 0">Нет полуфабрикатов. Нажмите «+ Добавить», чтобы добавить (соусы, сиропы, основы).</div>`;

  // ── Сборка HTML ──────────────────────────────────────────────────
  const _costEl     = document.getElementById('tab-cost');
  const _costScroll = _costEl ? _costEl.scrollTop : 0;
  const _SEARCH_IDS = ['cost-sup-search', 'cost-ing-search', 'cost-semi-search'];
  const _focusedSearchId = _SEARCH_IDS.includes(document.activeElement?.id) ? document.activeElement.id : null;

  _costEl.innerHTML = `
    <div class="page-title">
      <span class="page-title-left"><i data-lucide="truck" class="icon"></i> Поставщики</span>
      <button class="btn btn-outline sup-intro-toggle" id="sup-intro-btn" onclick="toggleSupIntro()" title="Подсказка"><i data-lucide="info" class="icon"></i> <span class="sup-btn-txt">Подсказка</span></button>
    </div>
    <div class="tab-intro" id="sup-intro">
      <div class="tab-intro-icon"><i data-lucide="truck" class="icon icon-lg"></i></div>
      <div>
        <div class="tab-intro-title">Поставщики, сырьё и полуфабрикаты</div>
        <div class="tab-intro-text">
          Здесь живёт база всего, из чего делаются напитки. Три секции:<br>
          <strong>Поставщики</strong> — справочник контрагентов. Привяжи каждого к сырью — контакт будет виден прямо в таблице ингредиентов.<br>
          <strong>Ингредиенты</strong> — цены на сырьё. Обновил цену после закупки — себестоимость всех рецептур пересчиталась мгновенно.<br>
          <strong>Полуфабрикаты</strong> — заготовки со своей рецептурой (сиропы, соусы, смеси). Создай один раз и используй как ингредиент в любом напитке.
        </div>
        <div class="tab-intro-steps">
          <span class="tab-intro-step">+ Поставщик — добавь контрагента в справочник</span>
          <span class="tab-intro-step">🚚 в строке ингредиента — привязать поставщика к сырью</span>
          <span class="tab-intro-step">🕐 рядом с ценой — история изменений цены</span>
          <span class="tab-intro-step">+ Полуфабрикат — создай заготовку и используй её в рецептурах</span>
        </div>
      </div>
    </div>

    <div class="cost-subtabs">
      <button class="cost-subtab" onclick="scrollCostTo('cost-section-sup')"><i data-lucide="building-2" class="icon"></i> Поставщики <span>${supGroups.length}</span></button>
      <button class="cost-subtab" onclick="scrollCostTo('cost-section-ing')"><i data-lucide="banknote" class="icon"></i> Ингредиенты <span>${Object.keys(MAT).length}</span></button>
      <button class="cost-subtab" onclick="scrollCostTo('cost-section-semi')"><i data-lucide="layers" class="icon"></i> Полуфабрикаты <span>${SEMI.length}</span></button>
    </div>

    <div id="cost-section-sup"></div>
    <div class="section-title" style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;cursor:pointer" onclick="toggleSupSection()">
      <span style="display:flex;align-items:center;gap:5px"><span class="mat-cat-chevron" id="cost-sup-icon">${_supCollapsed ? '▶' : '▼'}</span><i data-lucide="building-2" class="icon"></i> Поставщики <span style="background:var(--border);border-radius:20px;padding:1px 7px;font-size:11px;font-weight:700;margin-left:4px">${supGroups.length}</span></span>
      <div style="display:flex;gap:8px" onclick="event.stopPropagation()">
        <button class="btn btn-outline" onclick="exportSuppliersPDF()" title="Скачать список поставщиков (PDF)"><i data-lucide="file-text" class="icon"></i><span class="sup-btn-txt"> PDF</span></button>
        <button class="btn btn-outline" onclick="exportSuppliersXLSX()" title="Скачать список поставщиков (Excel)"><i data-lucide="file-spreadsheet" class="icon"></i><span class="sup-btn-txt"> Excel</span></button>
        <button class="btn btn-outline" onclick="openSuppliersList()"><i data-lucide="list" class="icon"></i><span class="sup-btn-txt"> Полный список</span></button>
        <button class="btn btn-green" onclick="openSupplierBookModal()"><i data-lucide="plus" class="icon"></i><span class="sup-btn-txt"> Поставщик</span></button>
      </div>
    </div>
    <div id="cost-sup-body" style="${_supCollapsed ? 'display:none' : ''}">
      <div class="search-wrap" style="margin-bottom:12px">
        <span class="search-icon"><i data-lucide="search" class="icon"></i></span>
        <input class="search-inp" id="cost-sup-search" type="text" placeholder="Поиск поставщика..."
          value="${_supSearch || ''}" oninput="filterSupCost(this.value);_searchClear(this)">
        <button class="search-clear${_supSearch ? ' visible' : ''}" title="Очистить" onclick="filterSupCost('');var el=document.getElementById('cost-sup-search');el.value='';_searchClear(el)">✕</button>
      </div>
      ${suppliersHtml}
    </div>

    <div id="cost-section-ing"></div>
    <div class="section-title" style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-top:8px;cursor:pointer" onclick="toggleIngSection()">
      <span style="display:flex;align-items:center;gap:5px"><span class="mat-cat-chevron" id="cost-ing-icon">${_ingCollapsed ? '▶' : '▼'}</span><i data-lucide="banknote" class="icon"></i> Ингредиенты <span style="background:var(--border);border-radius:20px;padding:1px 7px;font-size:11px;font-weight:700;margin-left:4px">${Object.keys(MAT).length}</span></span>
      <div onclick="event.stopPropagation()" style="display:flex;gap:8px">
        <button class="btn btn-outline" onclick="exportMaterialsPDF()" title="Ингредиенты и п/ф в PDF"><i data-lucide="file-text" class="icon"></i><span class="sup-btn-txt"> PDF</span></button>
        <button class="btn btn-outline" onclick="exportMaterialsXLSX()" title="Ингредиенты и п/ф в Excel"><i data-lucide="file-spreadsheet" class="icon"></i><span class="sup-btn-txt"> Excel</span></button>
        <div style="position:relative">
          <button class="btn btn-green" onclick="event.stopPropagation();toggleAddMatMenu(this)"><i data-lucide="plus" class="icon"></i><span class="sup-btn-txt"> Добавить</span><i data-lucide="chevron-down" class="icon" style="margin-left:2px"></i></button>
          <div id="add-mat-menu" style="display:none;position:absolute;right:0;top:calc(100% + 4px);background:var(--card);border:1px solid var(--border);border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,.12);min-width:160px;z-index:100;overflow:hidden">
            <button onclick="closeAddMatMenu();openAddMatModal()" style="display:flex;align-items:center;gap:8px;width:100%;padding:10px 14px;background:none;border:none;cursor:pointer;font-size:13px;color:var(--text)"><i data-lucide="package" class="icon"></i> Ингредиент</button>
            <button onclick="closeAddMatMenu();openAddCategory()" style="display:flex;align-items:center;gap:8px;width:100%;padding:10px 14px;background:none;border:none;cursor:pointer;font-size:13px;color:var(--text)"><i data-lucide="tag" class="icon"></i> Категорию</button>
          </div>
        </div>
      </div>
    </div>
    <div id="cost-ing-body" style="${_ingCollapsed ? 'display:none' : ''}">
      <div class="search-wrap" style="margin-bottom:8px">
        <span class="search-icon"><i data-lucide="search" class="icon"></i></span>
        <input class="search-inp" id="cost-ing-search" type="text" placeholder="Поиск ингредиента..."
          value="${_ingSearch || ''}" oninput="filterIngCost(this.value);_searchClear(this)">
        <button class="search-clear${_ingSearch ? ' visible' : ''}" title="Очистить" onclick="filterIngCost('');var el=document.getElementById('cost-ing-search');el.value='';_searchClear(el)">✕</button>
      </div>
      ${matCatTabsHtml}
      ${matCardsHtml}
    </div>

    <div id="cost-section-semi"></div>
    <div class="section-title" style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-top:8px;cursor:pointer" onclick="toggleSemiSection()">
      <span style="display:flex;align-items:center;gap:5px"><span class="mat-cat-chevron" id="cost-semi-icon">${_semiSectionCollapsed ? '▶' : '▼'}</span><i data-lucide="layers" class="icon"></i> Полуфабрикаты <span style="background:var(--border);border-radius:20px;padding:1px 7px;font-size:11px;font-weight:700;margin-left:4px">${SEMI.length}</span></span>
      <div style="display:flex;gap:8px" onclick="event.stopPropagation()">
        <button class="btn btn-outline" onclick="exportSemiTechCards()" title="Экспорт техкарт полуфабрикатов в PDF"><i data-lucide="file-text" class="icon"></i><span class="sup-btn-txt"> PDF техкарт</span></button>
        <div style="position:relative">
          <button class="btn btn-green" onclick="event.stopPropagation();toggleAddSemiMenu(this)"><i data-lucide="plus" class="icon"></i><span class="sup-btn-txt"> Добавить</span><i data-lucide="chevron-down" class="icon" style="margin-left:2px"></i></button>
          <div id="add-semi-menu" style="display:none;position:absolute;right:0;top:calc(100% + 4px);background:var(--card);border:1px solid var(--border);border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,.12);min-width:170px;z-index:100;overflow:hidden">
            <button onclick="closeAddSemiMenu();openAddSemi()" style="display:flex;align-items:center;gap:8px;width:100%;padding:10px 14px;background:none;border:none;cursor:pointer;font-size:13px;color:var(--text)"><i data-lucide="layers" class="icon"></i> Полуфабрикат</button>
            <button onclick="closeAddSemiMenu();openAddSemiCategory()" style="display:flex;align-items:center;gap:8px;width:100%;padding:10px 14px;background:none;border:none;cursor:pointer;font-size:13px;color:var(--text)"><i data-lucide="tag" class="icon"></i> Категорию</button>
          </div>
        </div>
      </div>
    </div>
    <div id="cost-semi-body" style="${_semiSectionCollapsed ? 'display:none' : ''}">
      <div class="search-wrap" style="margin-bottom:8px">
        <span class="search-icon"><i data-lucide="search" class="icon"></i></span>
        <input class="search-inp" id="cost-semi-search" type="text" placeholder="Поиск полуфабриката..."
          value="${_semiSearch || ''}" oninput="filterSemiCost(this.value);_searchClear(this)">
        <button class="search-clear${_semiSearch ? ' visible' : ''}" title="Очистить" onclick="filterSemiCost('');var el=document.getElementById('cost-semi-search');el.value='';_searchClear(el)">✕</button>
      </div>
      ${semiHtml}
    </div>
  `;

  if (window.lucide) lucide.createIcons();
  if (_costScroll) _costEl.scrollTop = _costScroll;
  // Восстановить фильтры после ре-рендера
  if (_supSearch)  filterSupCost(_supSearch);
  if (_ingSearch)  filterIngCost(_ingSearch);
  if (_semiSearch) filterSemiCost(_semiSearch);
  // Восстановить фокус на поле поиска (курсор в конец)
  if (_focusedSearchId) {
    const el = document.getElementById(_focusedSearchId);
    if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
  }
  // Навесить autocomplete-listeners на поля поиска
  _attachCostSuggestions();
}
