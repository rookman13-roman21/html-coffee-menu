// src/modals/mat.js
// Модальное окно сырья: редактирование, сохранение, удаление

export function openEditMat(key) {
  const m = MAT[key];
  if (!m) return;
  _editMatKey = key;
  document.getElementById('mm-modal-title').innerHTML = '<i data-lucide="pencil" class="icon"></i> Редактировать сырьё';
  document.getElementById('mm-name').value     = m.name || '';
  document.getElementById('mm-unit').value     = m.unit || 'шт';
  document.getElementById('mm-category').value = m.category || 'other';
  document.getElementById('mm-price').value    = S.prices[key] ?? m.price ?? '';
  document.getElementById('mm-size').value     = m.size || '';
  const sup = (S.suppliers||{})[key];
  document.getElementById('mm-sup-book').value  = '';
  document.getElementById('mm-sup-name').value  = sup?.name  || '';
  document.getElementById('mm-sup-phone').value = sup?.phone || '';
  document.getElementById('mm-sup-note').value  = sup?.note  || '';
  // если есть данные поставщика — разорнуть блок
  const wrap = document.getElementById('mm-sup-custom-wrap');
  if (wrap) { if (sup?.name) wrap.setAttribute('open',''); else wrap.removeAttribute('open'); }
  const n = m.nutrition || {};
  ['kcal','protein','fat','carbs'].forEach(f => {
    const el = document.getElementById('mm-' + f);
    if (el) el.value = n[f] || '';
  });
  openModal('modal-mat');
  lucide.createIcons();
}

export function saveMat() {
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
  MAT[key] = { name, unit, price, size, custom:true, category, ...(nutrition ? { nutrition } : {}) };
  S.prices[key] = price;
  // поставщик
  const supName  = document.getElementById('mm-sup-name').value.trim();
  const supPhone = document.getElementById('mm-sup-phone').value.trim();
  const supNote  = document.getElementById('mm-sup-note').value.trim();
  if (supName || supPhone || supNote) {
    if (!S.suppliers) S.suppliers = {};
    S.suppliers[key] = { name: supName, phone: supPhone, note: supNote, site: '' };
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

export function deleteMat(key) {
  const used = DRINKS.some(d => d.recipe.some(r => r.mat === key));
  const usedInSemi = (window.SEMI || []).some(s => (s.recipe || []).some(r => r.mat === key));
  if (used || usedInSemi) { window.showAlert('Сырьё используется в рецептурах — сначала удалите его из напитков/полуфабрикатов'); return; }
  window.showConfirm('Удалить позицию сырья?', () => {
    delete MAT[key];
    delete S.prices[key];
    markDirtyDebounce();
    saveState();
  }, { icon: '🗑️', okText: 'Удалить' });
}
export { matOnlyOptions, _semiIngPlaceholder, _semiIngStep, _updateSemiCostPreview, addSemiIngRow, _autoCalcSemiIngYield, _autoFillSemiYield, _calcSemiIngCost, _updateSemiIngCost, _onSemiMatChange } from './semi.js';
