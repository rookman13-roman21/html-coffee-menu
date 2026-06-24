// src/modals/mat.js
// Модальное окно сырья: редактирование, сохранение, удаление

export function openEditMat(key) {
  const m = MAT[key];
  if (!m) return;
  _editMatKey = key;
  _refreshMatCategorySelect();
  // нормализуем единицу: "1 кг" → "кг", "1 л" → "л", всё остальное → "шт"
  const _rawUnit = (m.unit || '').toLowerCase();
  const _unit = _rawUnit.includes('кг') ? 'кг' : _rawUnit.includes(' л') || _rawUnit === 'л' ? 'л' : 'шт';
  document.getElementById('mm-modal-title').innerHTML = '<i data-lucide="pencil" class="icon"></i> Редактировать сырьё';
  document.getElementById('mm-name').value     = m.name || '';
  document.getElementById('mm-unit').value     = _unit;
  document.getElementById('mm-category').value = m.category || 'other';
  document.getElementById('mm-price').value    = S.prices[key] ?? m.price ?? '';
  document.getElementById('mm-size').value     = m.size || '';
  // ссылка на покупку
  const urlInp = document.getElementById('mm-purchase-url');
  const urlLink = document.getElementById('mm-purchase-link');
  if (urlInp) urlInp.value = m.purchaseUrl || '';
  if (urlLink) { if (m.purchaseUrl) { urlLink.href = m.purchaseUrl; urlLink.style.display = ''; } else { urlLink.style.display = 'none'; } }
  const sup = (S.suppliers||{})[key];
  document.getElementById('mm-sup-book').value  = '';
  document.getElementById('mm-sup-name').value  = sup?.name  || '';
  document.getElementById('mm-sup-phone').value = sup?.phone || '';
  document.getElementById('mm-sup-note').value  = sup?.note  || '';
  // если есть данные поставщика — разорнуть блок
  const wrap = document.getElementById('mm-sup-custom-wrap');
  if (wrap) { if (sup?.name) wrap.setAttribute('open',''); else wrap.removeAttribute('open'); }
  // КБЖУ: у базовых ингредиентов берём из MAT_NUTRITION
  const baseNutr = (window.MAT_NUTRITION || {})[key];
  const n = m.nutrition || baseNutr || {};
  ['kcal','protein','fat','carbs'].forEach(f => {
    const el = document.getElementById('mm-' + f);
    if (el) el.value = (n[f] != null && n[f] !== 0) ? n[f] : '';
  });
  // авто-открыть блок КБЖУ если есть данные
  const kbzhuDetails = document.getElementById('mm-kbzhu-details');
  if (kbzhuDetails) { if (n.kcal || n.protein || n.fat || n.carbs) kbzhuDetails.setAttribute('open',''); }
  // кнопка «Удалить» — только для кастомных
  const delBtn = document.getElementById('mm-delete-btn');
  if (delBtn) delBtn.style.display = m.custom ? '' : 'none';
  openModal('modal-mat');
  // _fillMatSupBookSelect() вызывается внутри openModal — после неё выставляем книжного поставщика
  if (sup?.name) {
    const book = (S.supplierBook || []);
    const match = book.find(b => b.name === sup.name);
    if (match) {
      const sel = document.getElementById('mm-sup-book');
      if (sel) sel.value = String(match.id);
    }
  }
  lucide.createIcons();
}

export async function saveMat() {
  const name  = document.getElementById('mm-name').value.trim();
  const unit  = document.getElementById('mm-unit').value || 'шт';
  const price = parseFloat(document.getElementById('mm-price').value) || 0;
  const size  = parseFloat(document.getElementById('mm-size').value);
  if (!name || !(size > 0)) { window.showAlert('Заполните название и объём'); return; }
  const _dupMat = Object.entries(MAT).find(([k, m]) => m.name.trim().toLowerCase() === name.toLowerCase() && k !== _editMatKey);
  if (_dupMat) { window.showAlert(`Ингредиент с названием «${name}» уже существует`); return; }
  const key = _editMatKey || ('custom_' + (window.nextMatKey++));
  if (!_editMatKey) nextMatKey; // счётчик уже увеличенся
  const category = document.getElementById('mm-category').value || 'other';
  const kcal   = parseFloat(document.getElementById('mm-kcal').value)   || 0;
  const protein= parseFloat(document.getElementById('mm-protein').value)|| 0;
  const fat    = parseFloat(document.getElementById('mm-fat').value)    || 0;
  const carbs  = parseFloat(document.getElementById('mm-carbs').value)  || 0;
  const nutrition = (kcal || protein || fat || carbs) ? { kcal, protein, fat, carbs } : undefined;
  const purchaseUrl = (document.getElementById('mm-purchase-url')?.value || '').trim();
  const isBase = !!(window.BASE_MAT_KEYS && window.BASE_MAT_KEYS.has(key));
  MAT[key] = { name, unit, price, size, ...(isBase ? {} : { custom: true }), category, ...(nutrition ? { nutrition } : {}), ...(purchaseUrl ? { purchaseUrl } : {}) };
  S.prices[key] = price;
  // поставщик
  const supName  = document.getElementById('mm-sup-name').value.trim();
  const supPhone = document.getElementById('mm-sup-phone').value.trim();
  const supNote  = document.getElementById('mm-sup-note').value.trim();
  if (supName || supPhone || supNote) {
    if (!S.suppliers) S.suppliers = {};
    S.suppliers[key] = { name: supName, phone: supPhone, note: supNote, site: '' };
  } else if (S.suppliers && S.suppliers[key]) {
    delete S.suppliers[key];
  }
  if (!isBase && window.authorCanPublish && window.authorCanPublish() && window.saveAuthorIngredient) {
    try {
      await window.saveAuthorIngredient(key, { silent: true });
    } catch (e) {
      window.showAlert(e.message || 'Не удалось сохранить ингредиент автора');
      return;
    }
  }
  _clearModalDirty('modal-mat');
  closeModal('modal-mat');
  // Если открыто из строки рецепта — вставить новый ингредиент в тот select
  if (_pendingMatSelectEl) {
    _pendingMatSelectEl.innerHTML = matOptions('mat:' + key);
    _pendingMatSelectEl.value = 'mat:' + key;
    _pendingMatSelectEl.dataset.prev = 'mat:' + key;
    _pendingMatSelectEl.dispatchEvent(new Event('change'));
    const _pendingRow = _pendingMatSelectEl.closest('.modal-ing-row');
    if (_pendingRow) {
      const amtInp = _pendingRow.querySelector('input[type="number"]');
      if (amtInp) { amtInp.placeholder = _ingPlaceholder('mat:' + key); amtInp.step = _ingStep('mat:' + key); }
      _updateIngRowCost(_pendingMatSelectEl);
    }
    _pendingMatSelectEl = null;
  }
  if (_pendingSemiMatSelectEl) {
    _pendingSemiMatSelectEl.innerHTML = matOnlyOptions(key);
    _pendingSemiMatSelectEl.value = key;
    _pendingSemiMatSelectEl.dataset.prev = key;
    _pendingSemiMatSelectEl.dispatchEvent(new Event('change'));
    const _pendingSemiRow = _pendingSemiMatSelectEl.closest('.ing-row');
    if (_pendingSemiRow) {
      const amtInp = _pendingSemiRow.querySelector('.ing-amt');
      if (amtInp) { amtInp.placeholder = _semiIngPlaceholder(key); amtInp.step = _semiIngStep(key); }
      _updateSemiIngCost(_pendingSemiMatSelectEl);
    }
    _pendingSemiMatSelectEl = null;
  }
  _editMatKey = null;
  document.getElementById('mm-modal-title').innerHTML = '<i data-lucide="plus" class="icon"></i> Новая позиция сырья';
  document.getElementById('mm-name').value  = '';
  document.getElementById('mm-unit').value  = 'шт';
  document.getElementById('mm-price').value = '';
  document.getElementById('mm-size').value  = '';
  document.getElementById('mm-category').value = 'other';
  document.getElementById('mm-sup-name').value  = '';
  document.getElementById('mm-sup-phone').value = '';
  document.getElementById('mm-sup-note').value  = '';
  document.getElementById('mm-sup-book').value  = '';
  const wrap2 = document.getElementById('mm-sup-custom-wrap');
  if (wrap2) wrap2.removeAttribute('open');
  const urlInp2 = document.getElementById('mm-purchase-url');
  const urlLink2 = document.getElementById('mm-purchase-link');
  if (urlInp2) urlInp2.value = '';
  if (urlLink2) urlLink2.style.display = 'none';
  const delBtn2 = document.getElementById('mm-delete-btn');
  if (delBtn2) delBtn2.style.display = 'none';
  const kbzhuDet2 = document.getElementById('mm-kbzhu-details');
  if (kbzhuDet2) kbzhuDet2.removeAttribute('open');
  ['mm-kcal','mm-protein','mm-fat','mm-carbs'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  markDirtyDebounce();
  saveState();
}

export function cancelMat(force = false) {
  if (!force && _isModalDirty('modal-mat')) {
    _showUnsavedWarning('modal-mat');
    return;
  }
  _pendingMatSelectEl = null;
  _pendingSemiMatSelectEl = null;
  _clearModalDirty('modal-mat');
  closeModal('modal-mat');
}

export function deleteEditingMat() {
  if (_editMatKey) deleteMat(_editMatKey);
}

function _parseCatLabel(label) {
  const parts = label.split(/\s+/);
  if (parts.length > 1 && /[^\x00-\x7F]/.test(parts[0]) && parts[0].length <= 4) {
    return { emoji: parts[0], name: parts.slice(1).join(' ') };
  }
  return { emoji: '', name: label };
}

export function openAddCategory() {
  document.getElementById('mac-emoji').value = '';
  document.getElementById('mac-name').value  = '';
  document.getElementById('mac-error').textContent = '';
  document.getElementById('mac-edit-key').value = '';
  const delBtn = document.getElementById('mac-delete-btn');
  if (delBtn) delBtn.style.display = 'none';
  const titleEl = document.getElementById('mac-modal-title');
  if (titleEl) titleEl.innerHTML = '<i data-lucide="tag" class="icon"></i> Новая категория';
  openModal('modal-add-cat');
  if (window.lucide) lucide.createIcons();
}

export function openEditCategory(key) {
  const allCats = { ...MAT_CATEGORIES, ...(S.customCategories || {}) };
  const cat = allCats[key];
  if (!cat) return;
  const isBuiltin = !!MAT_CATEGORIES[key];
  const { emoji, name } = _parseCatLabel(cat.label || '');
  document.getElementById('mac-emoji').value = emoji;
  document.getElementById('mac-name').value  = name;
  document.getElementById('mac-error').textContent = '';
  document.getElementById('mac-edit-key').value = key;
  const delBtn = document.getElementById('mac-delete-btn');
  if (delBtn) delBtn.style.display = isBuiltin ? 'none' : '';
  const titleEl = document.getElementById('mac-modal-title');
  if (titleEl) titleEl.innerHTML = '<i data-lucide="tag" class="icon"></i> Редактировать категорию';
  openModal('modal-add-cat');
  if (window.lucide) lucide.createIcons();
}

export function deleteCategory(key) {
  if (!key) return;
  const usedCount = Object.values(MAT).filter(m => m.category === key).length;
  if (usedCount > 0) {
    window.showAlert(`Нельзя удалить: в категории ${usedCount} ингр. Сначала переместите их в другую категорию.`);
    return;
  }
  window.showConfirm('Удалить категорию?', () => {
    if (S.customCategories) delete S.customCategories[key];
    closeModal('modal-add-cat');
    saveState();
    if (typeof window.renderActive === 'function') window.renderActive();
  }, { icon: '🗑️', okText: 'Удалить' });
}

export function saveCategory() {
  const emoji   = document.getElementById('mac-emoji').value.trim();
  const name    = document.getElementById('mac-name').value.trim();
  const editKey = document.getElementById('mac-edit-key').value;
  const err     = document.getElementById('mac-error');
  if (!name) { err.textContent = 'Введите название категории'; return; }
  const label = emoji ? `${emoji} ${name}` : name;

  // ── Режим редактирования ──
  if (editKey) {
    const isBase = !!MAT_CATEGORIES[editKey];
    if (!isBase && (!S.customCategories || !S.customCategories[editKey])) {
      err.textContent = 'Категория не найдена'; return;
    }
    if (isBase) {
      if (!S.customCategories) S.customCategories = {};
      S.customCategories[editKey] = { label, order: MAT_CATEGORIES[editKey].order };
    } else {
      S.customCategories[editKey].label = label;
    }
    _refreshMatCategorySelect();
    closeModal('modal-add-cat');
    saveState();
    if (typeof window.renderActive === 'function') window.renderActive();
    return;
  }

  // ── Режим добавления ──
  const key = 'cat_' + name
    .toLowerCase()
    .replace(/[а-яёa-z0-9]/g, c => {
      const tr = {а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'j',
        к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',
        ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'};
      return tr[c] || c;
    })
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 20);
  if (!key) { err.textContent = 'Не удалось создать ключ из названия'; return; }
  const allCats = { ...MAT_CATEGORIES, ...(S.customCategories || {}) };
  if (allCats[key]) { err.textContent = 'Категория с таким ключом уже существует'; return; }
  const maxOrder = Object.values(allCats).reduce((m, c) => Math.max(m, c.order || 0), 0);
  if (!S.customCategories) S.customCategories = {};
  S.customCategories[key] = { label, order: maxOrder + 1 };
  _refreshMatCategorySelect();
  closeModal('modal-add-cat');
  saveState();
  if (typeof window.renderActive === 'function') window.renderActive();
}

export function _refreshMatCategorySelect() {
  const sel = document.getElementById('mm-category');
  if (!sel) return;
  const allCats = { ...MAT_CATEGORIES, ...(S.customCategories || {}) };
  const sorted = Object.entries(allCats).sort((a,b) => (a[1].order||99)-(b[1].order||99));
  const cur = sel.value;
  sel.innerHTML = sorted.map(([k,v]) => `<option value="${k}">${v.label}</option>`).join('');
  if (cur) sel.value = cur;
}

export function onMatPurchaseUrlInput(inp) {
  const link = document.getElementById('mm-purchase-link');
  if (!link) return;
  const v = inp.value.trim();
  if (v) { link.href = v; link.style.display = ''; } else { link.style.display = 'none'; }
}

export function deleteMat(key) {
  const isAuthor = !!(window.authorCanPublish && window.authorCanPublish());
  if (!isAuthor && window.requireWorkspaceOwner && !window.requireWorkspaceOwner('Удалять сырьё может только владелец проекта.')) return;
  const used = DRINKS.some(d => d.recipe.some(r => r.mat === key));
  const usedInSemi = (window.SEMI || []).some(s => (s.recipe || []).some(r => r.mat === key));
  if (used || usedInSemi) { window.showAlert('Сырьё используется в рецептурах — сначала удалите его из напитков/полуфабрикатов'); return; }
  window.showConfirm('Удалить позицию сырья?', async () => {
    if (window.authorCanPublish && window.authorCanPublish() && window.deleteAuthorIngredient && MAT[key]?._authorIngredient) {
      try {
        await window.deleteAuthorIngredient(key, { silent: true });
      } catch (e) {
        window.showAlert(e.message || 'Не удалось удалить ингредиент автора');
        return;
      }
    }
    delete MAT[key];
    delete S.prices[key];
    if (S.suppliers) delete S.suppliers[key];
    markDirtyDebounce();
    saveState();
  }, { icon: '🗑️', okText: 'Удалить' });
}
export { matOnlyOptions, _semiIngPlaceholder, _semiIngStep, _updateSemiCostPreview, addSemiIngRow, _autoCalcSemiIngYield, _autoFillSemiYield, _calcSemiIngCost, _updateSemiIngCost, _onSemiMatChange } from './semi.js';
