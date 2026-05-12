// src/ui/ingredients.js
// Управление строками ингредиентов в модалке напитка

export function matOptions(selected='') {
  const placeholderOpt = `<option value="" disabled ${!selected ? 'selected' : ''} style="color:var(--muted)">— Выберите ингредиент —</option>`;
  const createOpt = `<option value="__create_mat__" style="font-weight:700;color:var(--green)">＋ Создать ингредиент...</option>`;
  // Группируем MAT по категориям
  const groups = {};
  Object.entries(MAT).forEach(([k, m]) => {
    const cat = m.category || 'other';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push([k, m]);
  });
  const sortedCats = Object.keys(groups).sort((a, b) =>
    ((MAT_CATEGORIES[a]||{order:99}).order) - ((MAT_CATEGORIES[b]||{order:99}).order)
  );
  const matOpts = sortedCats.map(cat => {
    const label = (MAT_CATEGORIES[cat] || { label: cat }).label;
    const opts = groups[cat].map(([k, m]) =>
      `<option value="mat:${k}" ${selected===`mat:${k}`?'selected':''}>${m.name}</option>`
    ).join('');
    return `<optgroup label="${label}">${opts}</optgroup>`;
  }).join('');
  const semiOpts = SEMI.length ? `<optgroup label="── Полуфабрикаты ──">${
    SEMI.map(s => `<option value="semi:${s.id}" ${selected===`semi:${s.id}`?'selected':''}>${s.name} (п/ф, ${s.yield}${s.unit})</option>`).join('')
  }</optgroup>` : '';
  return placeholderOpt + createOpt + matOpts + semiOpts;
}

export function _ingPlaceholder(val) {
  if (!val) return '0';
  const [type, key] = val.split(':');
  if (type === 'semi') {
    const s = SEMI.find(x => x.id === parseInt(key));
    if (!s) return '0';
    const su = (s.unit || '').toLowerCase();
    return _semiDrinkFactor(s) === 1000 ? (su.startsWith('г') ? 'г' : 'мл') : '0';
  }
  const m = MAT[key];
  if (!m) return '0';
  const u = (m.unit || '').toLowerCase();
  if (u.includes('кг')) return 'г';
  if (u === 'л' || u.includes(' л')) return 'мл';
  return '0';
}

export function _ingStep(val) {
  return '1'; // ввод всегда в г/мл/шт
}

export function _onIngMatChange(selectEl) {
  const row = selectEl.closest('.modal-ing-row');
  if (!row) return;
  if (selectEl.value === '__create_mat__') {
    // Восстановить предыдущее значение
    selectEl.value = selectEl.dataset.prev || Object.keys(MAT).map(k=>'mat:'+k)[0] || '';
    // Открыть модалку создания ингредиента поверх модалки рецепта
    _pendingMatSelectEl = selectEl;
    _editMatKey = null;
    // Очистить поля модалки сырья
    document.getElementById('mm-modal-title').innerHTML = '<i data-lucide="plus" class="icon"></i> Новое сырьё';
    ['mm-name','mm-price','mm-size','mm-sup-name','mm-sup-phone','mm-sup-note'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
    document.getElementById('mm-unit').value = 'шт';
    document.getElementById('mm-category').value = 'other';
    document.getElementById('mm-sup-book').value = '';
    const wrap = document.getElementById('mm-sup-custom-wrap');
    if (wrap) wrap.removeAttribute('open');
    ['mm-kcal','mm-protein','mm-fat','mm-carbs'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
    openModal('modal-mat');
    return;
  }
  selectEl.dataset.prev = selectEl.value;
  selectEl.classList.remove('ing-select-empty');
  const amtInp = row.querySelector('.ing-inp-wrap input');
  const val = selectEl.value;
  amtInp.placeholder = _ingPlaceholder(val);
  amtInp.step = _ingStep(val);
}

export function _calcIngRowCost(row) {
  if (!row) return null;
  const val  = row.querySelector('select').value || '';
  const inputs = row.querySelectorAll('input');
  const amtInp  = inputs[0];
  const lossInp = inputs[1];
  const amt  = parseFloat(amtInp ? amtInp.value : 0) || 0;
  const loss = (parseFloat(lossInp ? lossInp.value : 0) || 0) / 100;
  if (!val || !(amt > 0)) return null;
  let cost = 0;
  if (val.startsWith('semi:')) {
    const sid = parseInt(val.slice(5));
    const s = SEMI.find(x => x.id === sid);
    if (s) cost = calcSemiCostPerUnit(s) * amt; // amt в г/мл, calcSemiCostPerUnit → руб/г
    if (loss > 0) cost = cost / (1 - loss);
  } else {
    const key = val.startsWith('mat:') ? val.slice(4) : val;
    const m = MAT[key];
    if (!m) return null;
    const pricePerUnit = (S.prices[key] || m.price) / m.size; // руб/г
    cost = pricePerUnit * amt; // amt в г/мл
    if (loss > 0) cost = cost / (1 - loss);
  }
  return cost;
}

export function _updateIngRowCost(anyEl) {
  const row = anyEl.closest('.modal-ing-row');
  if (!row) return;
  const hint = row.querySelector('.ing-cost-hint');
  if (!hint) return;
  const cost = _calcIngRowCost(row);
  hint.textContent = (cost != null && cost > 0)
    ? (cost < 1 ? cost.toFixed(2) : Math.round(cost)) + ' ₽'
    : '';
}

export function _autoCalcDrinkIngYield(anyEl) {
  const row = anyEl.closest('.modal-ing-row');
  if (!row) return;
  const amtEl   = row.querySelector('.ing-inp-wrap[data-label="Кол-во"] input');
  const lossEl  = row.querySelector('.ing-inp-wrap[data-label="Потери"] input');
  const yieldEl = row.querySelector('.ing-inp-wrap[data-label="Выход"] input');
  if (!amtEl || !lossEl || !yieldEl) return;
  const amt  = parseFloat(amtEl.value)  || 0;
  const loss = parseFloat(lossEl.value) || 0;
  if (amt > 0 && loss > 0) {
    const y = amt * (1 - loss / 100);
    yieldEl.value = parseFloat(y.toPrecision(4));
  } else {
    yieldEl.value = '';
  }
}

export function _makeIngSearchSelect(wrap, selectEl) {
  selectEl.style.display = 'none';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'ing-sel-trigger';

  const panel = document.createElement('div');
  panel.className = 'ing-sel-panel';
  panel.style.display = 'none';

  const searchInp = document.createElement('input');
  searchInp.type = 'text';
  searchInp.className = 'ing-sel-search';
  searchInp.placeholder = '\uD83D\uDD0D Поиск...';
  searchInp.autocomplete = 'off';

  const optsList = document.createElement('div');
  optsList.className = 'ing-sel-options';

  panel.appendChild(searchInp);
  panel.appendChild(optsList);
  wrap.insertBefore(trigger, selectEl);
  wrap.insertBefore(panel, selectEl);

  function getLabelForValue(val) {
    if (!val) return '— Выберите ингредиент —';
    const opt = [...selectEl.options].find(o => o.value === val);
    return opt ? opt.textContent.trim() : '— Выберите ингредиент —';
  }

  function updateTrigger() {
    const val = selectEl.value;
    trigger.className = 'ing-sel-trigger' + (!val ? ' ing-sel-empty' : '');
    trigger.innerHTML = `<span class="ing-sel-label">${getLabelForValue(val)}</span><span class="ing-sel-arrow">▾</span>`;
  }

  function renderOptions(q = '') {
    const qLow = q.toLowerCase().trim();
    const curVal = selectEl.value;
    let html = '';
    let prevGroup = null;
    [...selectEl.options].forEach(opt => {
      if (opt.disabled) return;
      const text = opt.textContent.trim();
      const val = opt.value;
      if (qLow && val !== '__create_mat__' && !text.toLowerCase().includes(qLow)) return;
      const group = opt.parentElement.tagName === 'OPTGROUP' ? opt.parentElement.label : '';
      if (group !== prevGroup) {
        if (group) html += `<div class="ing-sel-group">${group}</div>`;
        prevGroup = group;
      }
      const isActive = val === curVal ? ' ing-sel-opt--active' : '';
      const isCreate = val === '__create_mat__' ? ' ing-sel-opt--create' : '';
      html += `<div class="ing-sel-opt${isActive}${isCreate}" data-value="${val}">${text}</div>`;
    });
    optsList.innerHTML = html || '<div class="ing-sel-empty">Ничего не найдено</div>';
  }

  let isOpen = false;

  function positionPanel() {
    const r = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom - 8;
    const spaceAbove = r.top - 8;
    const panelH = Math.min(280, spaceBelow > 160 ? spaceBelow : spaceAbove);
    panel.style.maxHeight = panelH + 'px';
    optsList.style.maxHeight = (panelH - 48) + 'px';
    panel.style.left = r.left + 'px';
    panel.style.width = r.width + 'px';
    if (spaceBelow > 160 || spaceBelow >= spaceAbove) {
      panel.style.top = (r.bottom + 2) + 'px';
      panel.style.bottom = 'auto';
    } else {
      panel.style.bottom = (window.innerHeight - r.top + 2) + 'px';
      panel.style.top = 'auto';
    }
  }

  function openPanel() {
    isOpen = true;
    positionPanel();
    panel.style.display = 'block';
    searchInp.value = '';
    renderOptions();
    searchInp.focus();
    requestAnimationFrame(() => {
      const active = optsList.querySelector('.ing-sel-opt--active');
      if (active) active.scrollIntoView({ block: 'nearest' });
    });
  }

  function closePanel() {
    isOpen = false;
    panel.style.display = 'none';
  }

  updateTrigger();

  trigger.addEventListener('click', e => {
    e.stopPropagation();
    isOpen ? closePanel() : openPanel();
  });

  searchInp.addEventListener('input', () => renderOptions(searchInp.value));

  searchInp.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closePanel(); return; }
    if (e.key === 'Enter') {
      const first = optsList.querySelector('.ing-sel-opt:not(.ing-sel-opt--create)');
      if (first) first.click();
    }
  });

  optsList.addEventListener('click', e => {
    const opt = e.target.closest('.ing-sel-opt');
    if (!opt) return;
    selectEl.value = opt.dataset.value;
    selectEl.dispatchEvent(new Event('change', { bubbles: true }));
    closePanel();
  });

  // Обновлять триггер при внешнем изменении select (напр. _pendingMatSelectEl)
  selectEl.addEventListener('change', () => updateTrigger());

  document.addEventListener('click', e => {
    if (!wrap.contains(e.target)) closePanel();
  }, true);
}

export function addIngRow(selected='', amt='', loss='') {
  // selected = 'mat:coffee' | 'semi:5' | '' (legacy: plain key → convert)
  if (selected && !selected.startsWith('mat:') && !selected.startsWith('semi:')) selected = 'mat:' + selected;
  const ph = _ingPlaceholder(selected || ('mat:' + Object.keys(MAT)[0]));
  const st = _ingStep(selected || ('mat:' + Object.keys(MAT)[0]));
  const row = document.createElement('div');
  row.className = 'modal-ing-row';
  row.innerHTML = `
    <div class="ing-select-wrap">
      <select class="modal-select${!selected ? ' ing-select-empty' : ''}" onchange="_onIngMatChange(this);_updateIngRowCost(this)">${matOptions(selected)}</select>
    </div>
    <button class="modal-ing-del" title="Удалить" onclick="this.closest('.modal-ing-row').remove()"><i data-lucide="trash-2" class="icon"></i></button>
    <div class="ing-inp-wrap" data-label="Кол-во"><input class="modal-inp" type="text" inputmode="decimal" placeholder="${ph}" value="${amt}" oninput="this.value=this.value.replace(',','.');_updateIngRowCost(this);_autoCalcDrinkIngYield(this)"></div>
    <div class="ing-inp-wrap" data-label="Потери"><input class="modal-inp" type="number" min="0" max="99" step="1" inputmode="numeric" placeholder="%" value="${loss}" oninput="_updateIngRowCost(this);_autoCalcDrinkIngYield(this)"></div>
    <div class="ing-inp-wrap" data-label="Выход"><input class="modal-inp ing-yield" type="text" inputmode="decimal" placeholder="авто" title="Фактический выход после потерь"></div>
    <span class="ing-cost-hint"></span>
  `;
  document.getElementById('md-ings').appendChild(row);
  const selEl = row.querySelector('select');
  _makeIngSearchSelect(row.querySelector('.ing-select-wrap'), selEl);
  // Сохранить начальное значение для восстановления при отмене создания ингредиента
  if (selEl) selEl.dataset.prev = selEl.value;
  if (window.lucide) lucide.createIcons({ nodes: [row] });
  // Показать цену сразу если редактируем существующий напиток
  if (amt) {
    const hint = row.querySelector('.ing-cost-hint');
    const cost = _calcIngRowCost(row);
    if (hint && cost != null && cost > 0)
      hint.textContent = (cost < 1 ? cost.toFixed(2) : Math.round(cost)) + ' ₽';
  }
  // Показать выход если есть потери
  if (amt && loss) {
    const amtNum  = parseFloat(amt)  || 0;
    const lossNum = parseFloat(loss) || 0;
    if (amtNum > 0 && lossNum > 0) {
      const yieldEl = row.querySelector('.ing-yield');
      if (yieldEl) yieldEl.value = parseFloat((amtNum * (1 - lossNum / 100)).toPrecision(4));
    }
  }
}

export function _fillMatSupBookSelect() {
  const sel = document.getElementById('mm-sup-book');
  if (!sel) return;
  const book = S.supplierBook || [];
  sel.innerHTML = '<option value="">— Не указан —</option>' +
    book.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
}

export function _onMatSupBookChange(sel) {
  const id = parseInt(sel.value);
  const book = S.supplierBook || [];
  const b = book.find(x => x.id === id);
  const wrap = document.getElementById('mm-sup-custom-wrap');
  if (!b) {
    // Сброс — сворачиваем блок «Завести нового»
    if (wrap) wrap.removeAttribute('open');
    document.getElementById('mm-sup-name').value  = '';
    document.getElementById('mm-sup-phone').value = '';
    document.getElementById('mm-sup-note').value  = '';
    return;
  }
  // Выбрали из справочника — раскрываем детали чтобы показать данные
  if (wrap) wrap.setAttribute('open', '');
  document.getElementById('mm-sup-name').value  = b.name  || '';
  document.getElementById('mm-sup-phone').value = b.phone || '';
  document.getElementById('mm-sup-note').value  = b.note  || '';
}

export function openSupQuickDrop(key, btnEl) {
  _supQuickKey = key;
  _supQuickEl  = btnEl;
  const book = S.supplierBook || [];
  const cur  = (S.suppliers || {})[key] || {};

  // Удаляем старый дроп
  let old = document.getElementById('sup-quick-drop');
  if (old) old.remove();

  const drop = document.createElement('div');
  drop.id = 'sup-quick-drop';
  drop.style.cssText = 'position:fixed;z-index:9999;background:var(--white);border:1.5px solid var(--border);border-radius:10px;box-shadow:0 4px 24px rgba(0,0,0,.35);min-width:220px;max-height:320px;overflow-y:auto;padding:6px 0';

  const items = [
    { id: '__clear__', label: '— Не указан', sub: '' },
    { id: '__custom__', label: 'Указать вручную…', sub: '' },
    ...book.map(b => ({ id: b.id, label: b.name, sub: b.phone || '' }))
  ];
  items.forEach(item => {
    const div = document.createElement('div');
    div.style.cssText = 'padding:8px 14px;cursor:pointer;font-size:13px;display:flex;flex-direction:column;gap:1px';
    div.innerHTML = `<span style="font-weight:600;color:var(--text)">${item.label}</span>${item.sub ? `<span style="font-size:11px;color:var(--muted)">${item.sub}</span>` : ''}`;
    if (cur.name && item.label === cur.name) div.style.background = 'var(--light)';
    div.addEventListener('mouseenter', () => div.style.background = 'var(--light)');
    div.addEventListener('mouseleave', () => div.style.background = cur.name === item.label ? 'var(--light)' : '');
    div.addEventListener('click', () => {
      drop.remove();
      document.removeEventListener('click', _supQuickClose, true);
      if (item.id === '__clear__') {
        if (S.suppliers) delete S.suppliers[key];
        saveState(); renderCost();
      } else if (item.id === '__custom__') {
        openSupplierModal(key);
      } else {
        if (!S.suppliers) S.suppliers = {};
        const b = book.find(x => x.id === item.id);
        if (b) S.suppliers[key] = { name: b.name, phone: b.phone || '', note: b.note || '', site: b.site || '' };
        saveState(); renderCost();
      }
    });
    drop.appendChild(div);
  });

  document.body.appendChild(drop);
  // Позиционируем под кнопкой
  const r = btnEl.getBoundingClientRect();
  const dw = drop.offsetWidth || 220;
  let left = r.left;
  if (left + dw > window.innerWidth - 8) left = window.innerWidth - dw - 8;
  drop.style.top  = (r.bottom + 4) + 'px';
  drop.style.left = left + 'px';

  setTimeout(() => document.addEventListener('click', _supQuickClose, true), 0);
  // Закрывать при скролле страницы (но не самого дропдауна)
  const _supScrollClose = (e) => {
    if (!drop.contains(e.target)) {
      drop.remove();
      document.removeEventListener('click', _supQuickClose, true);
      document.removeEventListener('scroll', _supScrollClose, true);
    }
  };
  setTimeout(() => document.addEventListener('scroll', _supScrollClose, true), 0);
}

export function _supQuickClose(e) {
  const drop = document.getElementById('sup-quick-drop');
  if (drop && !drop.contains(e.target)) {
    drop.remove();
    document.removeEventListener('click', _supQuickClose, true);
  }
}

export function _searchClear(inp) {
  const btn = inp.parentElement.querySelector('.search-clear');
  if (btn) btn.classList.toggle('visible', inp.value.length > 0);
}
