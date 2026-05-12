// src/modals/semi.js
// Модальное окно полуфабриката: добавление, редактирование, удаление

export function matOnlyOptions(selected) {
  const placeholderOpt = `<option value="" disabled ${!selected ? 'selected' : ''} style="color:var(--muted)">— Выберите ингредиент —</option>`;
  const createOpt = `<option value="__create_mat__" style="font-weight:700;color:var(--green)">＋ Создать ингредиент...</option>`;
  const groups = {};
  Object.entries(MAT).forEach(([k, m]) => {
    const cat = m.category || 'other';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push([k, m]);
  });
  const sortedCats = Object.keys(groups).sort((a, b) =>
    ((MAT_CATEGORIES[a]||{order:99}).order) - ((MAT_CATEGORIES[b]||{order:99}).order)
  );
  return createOpt + sortedCats.map(cat => {
    const label = (MAT_CATEGORIES[cat] || { label: cat }).label;
    const opts = groups[cat].map(([k, m]) =>
      `<option value="${k}"${k===selected?' selected':''}>${m.name} (${m.unit})</option>`
    ).join('');
    return `<optgroup label="${label}">${opts}</optgroup>`;
  }).join('');
}

export function _semiIngPlaceholder(matKey) {
  const m = MAT[matKey];
  if (!m) return '0';
  const u = (m.unit || '').toLowerCase();
  if (u.includes('кг')) return 'г';
  if (u === 'л' || u.includes(' л')) return 'мл';
  return '0';
}

export function _semiIngStep(matKey) {
  return '1'; // ввод всегда в г/мл/шт
}

export function _updateSemiCostPreview() {
  const yieldV = parseFloat(document.getElementById('ms-yield').value) || 0;
  let totalRaw = 0;
  document.querySelectorAll('#ms-ings .ing-row').forEach(row => {
    const matKey = row.querySelector('.ing-mat').value;
    const amt    = parseFloat(row.querySelector('.ing-amt').value) || 0;
    const lossRaw = (parseFloat(row.querySelector('.ing-loss').value) || 0) / 100;
    const m = MAT[matKey];
    if (!m || !(amt > 0)) return;
    const pricePerUnit = (S.prices[matKey] || m.price) / m.size;
    let rowCost = pricePerUnit * amt; // amt в г/мл, pricePerUnit в руб/г
    if (lossRaw > 0 && lossRaw < 1) rowCost = rowCost / (1 - lossRaw);
    totalRaw += rowCost;
  });
  const unit = document.getElementById('ms-unit').value || 'ед.';
  const perUnit = (yieldV > 0 && totalRaw > 0) ? (totalRaw / yieldV) : null;
  const el = document.getElementById('ms-cost-preview');
  if (!el) return;
  if (totalRaw > 0) {
    el.style.display = 'flex';
    el.innerHTML = `<span style="color:var(--muted);font-size:12px">Себест. сырья:</span>
      <b style="color:var(--navy)">${Math.round(totalRaw)} ₽</b>
      ${perUnit ? `<span style="color:var(--muted);font-size:12px">·</span><b style="color:var(--green)">${perUnit < 1 ? perUnit.toFixed(2) : Math.round(perUnit)} ₽/${unit}</b>` : ''}`;
  } else {
    el.style.display = 'none';
  }
}

function _makeSemiSearchSelect(wrap, selectEl) {
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
  document.body.appendChild(panel);

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
    scrollListenerActive = false;
    setTimeout(() => { scrollListenerActive = true; }, 200);
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

  selectEl.addEventListener('change', () => updateTrigger());

  let scrollListenerActive = false;
  function onScroll(e) { if (scrollListenerActive && !panel.contains(e.target)) closePanel(); }

  document.addEventListener('click', e => {
    if (!wrap.contains(e.target) && !panel.contains(e.target)) closePanel();
  }, true);

  window.addEventListener('scroll', onScroll, true);
}

export function addSemiIngRow(matKey='', amt='', loss='', yieldAmt='') {
  const wrap = document.getElementById('ms-ings');
  const firstKey = matKey || '';
  const row = document.createElement('div');
  row.className = 'ing-row';
  row.innerHTML = `
    <div class="ing-row-header">
      <div class="ing-select-wrap">
        <select class="modal-select ing-mat">${matOnlyOptions(firstKey)}</select>
      </div>
      <button class="btn btn-outline ing-del-btn" type="button"><i data-lucide="trash-2" class="icon"></i></button>
    </div>
    <div class="ing-row-fields">
      <div class="ing-field-wrap">
        <span class="ing-field-label">Кол-во</span>
        <input class="modal-inp ing-amt" type="text" inputmode="decimal" value="${amt}" placeholder="${_semiIngPlaceholder(firstKey)}">
      </div>
      <div class="ing-field-wrap">
        <span class="ing-field-label">Потери, %</span>
        <input class="modal-inp ing-loss" type="number" min="0" max="99" step="1" inputmode="numeric" value="${loss}" placeholder="0">
      </div>
      <div class="ing-field-wrap">
        <span class="ing-field-label">Выход</span>
        <input class="modal-inp ing-yield" type="text" inputmode="decimal" value="${yieldAmt}" placeholder="авто" title="Фактический выход после обработки">
      </div>
    </div>
    <span class="ing-cost-hint"></span>
  `;
  wrap.appendChild(row);

  const matSel  = row.querySelector('.ing-mat');
  const amtInp  = row.querySelector('.ing-amt');
  const lossInp = row.querySelector('.ing-loss');
  const delBtn  = row.querySelector('.ing-del-btn');

  _makeSemiSearchSelect(row.querySelector('.ing-select-wrap'), matSel);

  matSel.addEventListener('change', () => {
    _onSemiMatChange(matSel);
    _updateSemiIngCost(matSel);
  });
  amtInp.addEventListener('input', () => {
    amtInp.value = amtInp.value.replace(',', '.');
    _updateSemiCostPreview();
    _updateSemiIngCost(amtInp);
    _autoCalcSemiIngYield(amtInp);
  });
  lossInp.addEventListener('input', () => {
    _updateSemiCostPreview();
    _updateSemiIngCost(lossInp);
    _autoCalcSemiIngYield(lossInp);
  });
  delBtn.addEventListener('click', () => {
    row.remove();
    _updateSemiCostPreview();
  });

  if (window.lucide) lucide.createIcons({ nodes: [row] });
  _updateSemiCostPreview();
  if (amt) {
    const hint = row.querySelector('.ing-cost-hint');
    const cost = _calcSemiIngCost(row);
    if (hint && cost > 0) hint.textContent = (cost < 1 ? cost.toFixed(2) : Math.round(cost)) + '\u00a0₽';
  }
}

export function _autoCalcSemiIngYield(anyEl) {
  const row = anyEl.closest('.ing-row');
  if (!row) return;
  const amtEl   = row.querySelector('.ing-amt');
  const lossEl  = row.querySelector('.ing-loss');
  const yieldEl = row.querySelector('.ing-yield');
  if (!amtEl || !lossEl || !yieldEl) return;
  const amt  = parseFloat(amtEl.value)  || 0;
  const loss = parseFloat(lossEl.value) || 0;
  if (amt > 0 && loss > 0) {
    const y = amt * (1 - loss / 100);
    yieldEl.value = parseFloat(y.toPrecision(4));
  } else if (loss === 0) {
    yieldEl.value = '';
  }
}

export function _autoFillSemiYield() {
  const yieldInp = document.getElementById('ms-yield');
  if (!yieldInp) return;
  let total = 0;
  let hasAny = false;
  document.querySelectorAll('#ms-ings .ing-row').forEach(row => {
    const matKey  = (row.querySelector('.ing-mat') || {}).value || '';
    const amtVal  = parseFloat((row.querySelector('.ing-amt')  || {}).value) || 0;
    const yldVal  = parseFloat((row.querySelector('.ing-yield')|| {}).value);
    // значения в г/мл (пользователь вводит в г), суммируем напрямую
    const contrib = isFinite(yldVal) ? yldVal : amtVal;
    if (amtVal > 0 || isFinite(yldVal)) { total += contrib; hasAny = true; }
  });
  if (hasAny && total > 0) yieldInp.value = Math.round(total);
}

export function _calcSemiIngCost(row) {
  if (!row) return 0;
  const key  = (row.querySelector('.ing-mat') || {}).value || '';
  const amt  = parseFloat((row.querySelector('.ing-amt')  || {}).value) || 0;
  const loss = (parseFloat((row.querySelector('.ing-loss') || {}).value) || 0) / 100;
  const m = MAT[key];
  if (!m || !(amt > 0)) return 0;
  const pricePerUnit = (S.prices[key] || m.price) / m.size; // руб/г
  let cost = pricePerUnit * amt; // amt в г/мл
  if (loss > 0) cost = cost / (1 - loss);
  return cost;
}

export function _updateSemiIngCost(anyEl) {
  const row = anyEl.closest('.ing-row');
  if (!row) return;
  const hint = row.querySelector('.ing-cost-hint');
  if (!hint) return;
  const cost = _calcSemiIngCost(row);
  hint.textContent = cost > 0 ? (cost < 1 ? cost.toFixed(2) : Math.round(cost)) + '\u00a0₽' : '';
}

export function _onSemiMatChange(selectEl) {
  const row = selectEl.closest('.ing-row');
  if (!row) return;
  if (selectEl.value === '__create_mat__') {
    // Восстановить предыдущее значение
    selectEl.value = selectEl.dataset.prev || Object.keys(MAT)[0] || '';
    _pendingSemiMatSelectEl = selectEl;
    _editMatKey = null;
    // Открыть модалку создания сырья поверх модалки п/ф
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
  const amtInp = row.querySelector('.ing-amt');
  amtInp.placeholder = _semiIngPlaceholder(selectEl.value);
  amtInp.step = _semiIngStep(selectEl.value);
  _updateSemiCostPreview();
}

export function openAddSemi() {
  document.getElementById('modal-semi-title').innerHTML = '<i data-lucide="layers" class="icon"></i> Новый полуфабрикат';
  document.getElementById('ms-name').value    = '';
  document.getElementById('ms-unit').value    = 'мл';
  document.getElementById('ms-yield').value   = '';
  document.getElementById('ms-process').value = '';
  document.getElementById('ms-storage-temp').value = '';
  document.getElementById('ms-storage-life').value = '';
  document.getElementById('ms-appearance').value   = '';
  document.getElementById('ms-taste').value        = '';
  document.getElementById('ms-consistency').value  = '';
  document.getElementById('ms-edit-id').value = '';
  document.getElementById('ms-delete-btn').style.display = 'none';
  // Сброс изображения
  const _mp = document.getElementById('ms-img-preview');
  _mp.src = ''; _mp.style.display = 'none';
  document.getElementById('ms-img-placeholder').style.display = '';
  document.getElementById('ms-img-clear').style.display = 'none';
  document.getElementById('ms-ings').innerHTML = '';
  addSemiIngRow();
  openModal('modal-semi');
  _updateSemiCostPreview();
  if (window.lucide) lucide.createIcons();
}

export function openEditSemi(id) {
  const semi = SEMI.find(s => s.id === id);
  if (!semi) return;
  document.getElementById('modal-semi-title').innerHTML = '<i data-lucide="layers" class="icon"></i> Редактировать полуфабрикат';
  document.getElementById('ms-name').value    = semi.name;
  document.getElementById('ms-unit').value    = semi.unit;
  document.getElementById('ms-yield').value   = semi.yield;
  document.getElementById('ms-process').value = semi.process || '';
  document.getElementById('ms-storage-temp').value = semi.storage_temp || '';
  document.getElementById('ms-storage-life').value = semi.storage_life || '';
  document.getElementById('ms-appearance').value   = semi.appearance || '';
  document.getElementById('ms-taste').value        = semi.taste || '';
  document.getElementById('ms-consistency').value  = semi.consistency || '';
  document.getElementById('ms-edit-id').value = semi.id;
  document.getElementById('ms-delete-btn').style.display = '';
  // Изображение
  const _sp = document.getElementById('ms-img-preview');
  const _sph = document.getElementById('ms-img-placeholder');
  const _scb = document.getElementById('ms-img-clear');
  if (semi.image) {
    _sp.src = semi.image; _sp.style.display = 'block';
    _sph.style.display = 'none'; _scb.style.display = '';
  } else {
    _sp.src = ''; _sp.style.display = 'none';
    _sph.style.display = ''; _scb.style.display = 'none';
  }
  document.getElementById('ms-ings').innerHTML = '';
  (semi.recipe || []).forEach(r => {
    const _f = _semiUnitFactor(r.mat);
    const _dAmt = r.amt * _f; // кг→г для отображения
    const _dYield = (r.yieldAmt && _f > 1) ? r.yieldAmt * _f : (r.yieldAmt || '');
    addSemiIngRow(r.mat, _dAmt, r.loss ? parseFloat((r.loss * 100).toPrecision(4)) : '', _dYield);
  });
  if (!(semi.recipe && semi.recipe.length)) addSemiIngRow();
  openModal('modal-semi');
  _updateSemiCostPreview();
  if (window.lucide) lucide.createIcons();
}

export function saveSemi() {
  const name    = document.getElementById('ms-name').value.trim();
  const unit    = document.getElementById('ms-unit').value;
  const yieldV  = parseFloat(document.getElementById('ms-yield').value);
  const process = document.getElementById('ms-process').value.trim();
  const storage_temp  = document.getElementById('ms-storage-temp').value.trim();
  const storage_life  = document.getElementById('ms-storage-life').value.trim();
  const appearance    = document.getElementById('ms-appearance').value.trim();
  const taste         = document.getElementById('ms-taste').value.trim();
  const consistency   = document.getElementById('ms-consistency').value.trim();
  const editId  = document.getElementById('ms-edit-id').value;
  if (!name) { window.showAlert('Введите название'); return; }
  if (!(yieldV > 0)) { window.showAlert('Введите выход (> 0)'); return; }
  const _editSemiIdNum = editId ? parseInt(editId) : null;
  const _dupSemi = SEMI.find(s => s.name.trim().toLowerCase() === name.toLowerCase() && s.id !== _editSemiIdNum);
  if (_dupSemi) { window.showAlert(`Полуфабрикат с названием «${name}» уже существует`); return; }
  const imgEl = document.getElementById('ms-img-preview');
  const image = (imgEl && imgEl.style.display !== 'none' && imgEl.src) ? imgEl.src : '';

  const recipe = [];
  document.querySelectorAll('#ms-ings .ing-row').forEach(row => {
    const mat  = row.querySelector('.ing-mat').value;
    const amt  = parseFloat(row.querySelector('.ing-amt').value);
    const loss = (parseFloat(row.querySelector('.ing-loss').value) || 0) / 100;
    const yieldAmt = parseFloat(row.querySelector('.ing-yield').value);
    if (mat && amt > 0) {
      const _f = _semiUnitFactor(mat);
      const storedAmt = _f > 1 ? amt / _f : amt; // г→кг для хранения
      const r = { mat, amt: storedAmt };
      if (loss > 0 && loss < 1) r.loss = loss;
      if (isFinite(yieldAmt) && yieldAmt > 0) r.yieldAmt = (_f > 1 ? yieldAmt / _f : yieldAmt);
      recipe.push(r);
    }
  });
  if (!recipe.length) { window.showAlert('Добавьте хотя бы один ингредиент'); return; }

  if (editId) {
    const idx = SEMI.findIndex(s => s.id === parseInt(editId));
    if (idx >= 0) SEMI[idx] = { id: parseInt(editId), name, unit, yield: yieldV, process, image, storage_temp, storage_life, appearance, taste, consistency, recipe };
  } else {
    SEMI.push({ id: window.nextSemiId++, name, unit, yield: yieldV, process, image, storage_temp, storage_life, appearance, taste, consistency, recipe });
  }
  _clearModalDirty('modal-semi');
  closeModal('modal-semi');
  // Если открыто из строки ингредиента напитка — вставить новый п/ф в тот select
  if (!editId && window._pendingSemiSelectFromDrink) {
    const newSemi = SEMI[SEMI.length - 1];
    const selEl = window._pendingSemiSelectFromDrink;
    selEl.innerHTML = window.matOptions(`semi:${newSemi.id}`);
    selEl.value = `semi:${newSemi.id}`;
    selEl.dataset.prev = `semi:${newSemi.id}`;
    selEl.dispatchEvent(new Event('change', { bubbles: true }));
    window._pendingSemiSelectFromDrink = null;
  }
  markDirtyDebounce();
  saveState();
  renderCost();
}

export function deleteSemi(idRaw) {
  const id = parseInt(idRaw);
  const usedInDrink = DRINKS.some(d => d.recipe.some(r => r.semi === id));
  if (usedInDrink) { window.showAlert('Полуфабрикат используется в рецептурах напитков — сначала удалите его из напитков'); return; }
  window.showConfirm('Удалить полуфабрикат?', () => {
    SEMI = SEMI.filter(s => s.id !== id);
    _clearModalDirty('modal-semi');
    closeModal('modal-semi');
    markDirtyDebounce();
    saveState();
    renderCost();
  }, { icon: '🗑️', okText: 'Удалить' });
}

export { onSemiImgChange, clearSemiImg } from './drink.js';
