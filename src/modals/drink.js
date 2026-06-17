// src/modals/drink.js
// Модальное окно напитка: добавление, редактирование, удаление, сброс

const DRINK_EQUIPMENT_OPTIONS = [
  'Кофемашина эспрессо',
  'Кофемолка эспрессо',
  'Кофеварка фильтр-кофе',
  'Кофемолка под фильтр',
  'Чайник с контролем температуры',
  'Весы',
  'Блендер',
  'Миксер',
  'Сувид',
  'Вакууматор',
  'Льдогенератор',
  'Холодильник',
  'Морозильник',
  'Соковыжималка',
  'Шейкер / барный инвентарь',
  'Сифон',
  'Дегидратор',
  'Плита / индукционная плитка',
  'Термометр',
];
const DRINK_EQUIPMENT_CUSTOM_VALUE = '__custom_equipment__';
const AUTHOR_PRICE_LABEL = 'Рекомендуемая цена продажи';
const DEFAULT_PRICE_LABEL = 'Цена продажи, ₽';

let _drinkEquipmentSelection = [];

function _normalizeEquipmentName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/espresso|эспрессо[\s-]*машина/g, 'кофемашина эспрессо')
    .replace(/кофе[\s-]*машина/g, 'кофемашина')
    .replace(/кофе[\s-]*молка|гриндер/g, 'кофемолка')
    .replace(/ледогенератор/g, 'льдогенератор')
    .replace(/[^a-zа-я0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function _equipmentId(name) {
  return _normalizeEquipmentName(name).replace(/\s+/g, '-');
}

function _equipmentKeyWords(name) {
  return _normalizeEquipmentName(name)
    .split(' ')
    .filter(w => w.length > 2 && !['для', 'под', 'или'].includes(w));
}

function _findSimilarEquipment(name) {
  const targetNorm = _normalizeEquipmentName(name);
  if (!targetNorm) return null;
  const candidates = [
    ...DRINK_EQUIPMENT_OPTIONS,
    ..._drinkEquipmentSelection.map(x => x.name),
  ];
  const targetWords = _equipmentKeyWords(name);
  return candidates.find(candidate => {
    const candidateNorm = _normalizeEquipmentName(candidate);
    if (!candidateNorm) return false;
    if (candidateNorm === targetNorm) return true;
    if (candidateNorm.includes(targetNorm) || targetNorm.includes(candidateNorm)) return true;
    const candidateWords = _equipmentKeyWords(candidate);
    const overlap = targetWords.filter(w => candidateWords.includes(w)).length;
    return targetWords.length >= 2 && overlap >= Math.min(2, targetWords.length);
  }) || null;
}

function _canonicalEquipmentName(name) {
  const fromLibrary = DRINK_EQUIPMENT_OPTIONS.find(opt => _normalizeEquipmentName(opt) === _normalizeEquipmentName(name));
  return fromLibrary || String(name || '').trim();
}

function _equipmentToObject(item) {
  const name = typeof item === 'string' ? item : item?.name;
  const cleanName = _canonicalEquipmentName(name);
  return cleanName ? { id: _equipmentId(cleanName), name: cleanName } : null;
}

function _nextFreeDrinkId() {
  const maxId = DRINKS.reduce((max, d) => Math.max(max, Number(d.id) || 0), 0);
  window.nextDrinkId = Math.max(Number(window.nextDrinkId) || 1, maxId + 1);
  return window.nextDrinkId++;
}

function _escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function _setEquipmentError(message) {
  const el = document.getElementById('md-equipment-error');
  if (!el) return;
  el.textContent = message || '';
  el.style.display = message ? 'block' : 'none';
}

function _isAuthorDrinkMode() {
  return !!(window.authorCanPublish && window.authorCanPublish());
}

function _setDrinkAuthorUi() {
  const modal = document.getElementById('modal-drink');
  const note = document.getElementById('md-author-required-note');
  const label = document.getElementById('md-price-label-text');
  const tip = document.getElementById('md-price-tip');
  const isAuthor = _isAuthorDrinkMode();
  if (modal) modal.classList.toggle('modal-drink-author', isAuthor);
  if (note) note.style.display = isAuthor ? 'block' : 'none';
  if (label) label.textContent = isAuthor ? AUTHOR_PRICE_LABEL : DEFAULT_PRICE_LABEL;
  if (tip) tip.style.display = isAuthor ? 'inline-flex' : 'none';
}

function _clearPublicationMarks() {
  const modal = document.getElementById('modal-drink');
  if (!modal) return;
  modal.querySelectorAll('.md-publication-missing').forEach(el => {
    el.classList.remove('md-publication-missing');
  });
  const errors = document.getElementById('md-publication-errors');
  if (errors) {
    errors.innerHTML = '';
    errors.style.display = 'none';
  }
}

function _publicationFieldTargets(field) {
  const map = {
    name: ['#md-name'],
    group: ['#md-group'],
    price: ['#md-price'],
    volume: ['#md-vol'],
    ingredients: ['#md-ings'],
    image: ['#md-img-area'],
    process: ['#md-process'],
    equipment: ['.md-equipment-box'],
    storage_temp: ['#md-storage-temp'],
    storage_life: ['#md-storage-life'],
    appearance: ['#md-appearance'],
    taste: ['#md-taste'],
    consistency: ['#md-consistency'],
  };
  return map[field] || [];
}

export function markDrinkPublicationMissing(fields = [], labels = []) {
  _setDrinkAuthorUi();
  _clearPublicationMarks();
  fields.forEach(field => {
    _publicationFieldTargets(field).forEach(selector => {
      document.querySelector(selector)?.classList.add('md-publication-missing');
    });
  });
  const errors = document.getElementById('md-publication-errors');
  if (errors && labels.length) {
    errors.innerHTML = `
      <strong>Заполните поля для публикации:</strong>
      <ul>${labels.map(label => `<li>${_escapeHtml(label)}</li>`).join('')}</ul>
    `;
    errors.style.display = 'block';
  }
}

export function openDrinkEquipmentCustomPopover() {
  const popover = document.getElementById('md-equipment-popover');
  const input = document.getElementById('md-equipment-custom');
  if (!popover || !input) return;
  popover.style.display = 'block';
  input.focus();
}

export function closeDrinkEquipmentCustomPopover() {
  const popover = document.getElementById('md-equipment-popover');
  const input = document.getElementById('md-equipment-custom');
  if (popover) popover.style.display = 'none';
  if (input) input.value = '';
  _setEquipmentError('');
}

export function getDrinkEquipmentSelection() {
  return _drinkEquipmentSelection.map(item => ({ ...item }));
}

export function setDrinkEquipmentSelection(items = []) {
  const seen = new Set();
  _drinkEquipmentSelection = (items || [])
    .map(_equipmentToObject)
    .filter(Boolean)
    .filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  _setEquipmentError('');
  renderDrinkEquipment();
}

export function renderDrinkEquipment() {
  const chips = document.getElementById('md-equipment-selected');
  const select = document.getElementById('md-equipment-select');
  if (!chips || !select) return;
  chips.innerHTML = _drinkEquipmentSelection.length
    ? _drinkEquipmentSelection.map(item => `
      <button type="button" class="md-equipment-chip" onclick="removeDrinkEquipment('${item.id}')">
        <span>${_escapeHtml(item.name)}</span>
        <i data-lucide="x" class="icon"></i>
      </button>
    `).join('')
    : '<span class="md-equipment-empty">Оборудование ещё не выбрано</span>';

  const selected = new Set(_drinkEquipmentSelection.map(item => item.id));
  const selectedOptions = DRINK_EQUIPMENT_OPTIONS
    .filter(name => selected.has(_equipmentId(name)))
    .map(name => `<option value="${_escapeHtml(name)}" disabled>✓ ${_escapeHtml(name)}</option>`);
  const availableOptions = DRINK_EQUIPMENT_OPTIONS
    .filter(name => !selected.has(_equipmentId(name)))
    .map(name => `<option value="${_escapeHtml(name)}">${_escapeHtml(name)}</option>`);
  select.innerHTML = [
    '<option value="">Добавить оборудование...</option>',
    ...selectedOptions,
    ...availableOptions,
    `<option value="${DRINK_EQUIPMENT_CUSTOM_VALUE}">＋ Добавить своё оборудование...</option>`,
  ].join('');
  select.value = '';
  if (window.lucide) lucide.createIcons({ nodes: [chips] });
}

function _addDrinkEquipment(name, { custom = false } = {}) {
  const cleanName = _canonicalEquipmentName(name);
  if (!cleanName) return false;
  const similar = _findSimilarEquipment(cleanName);
  const alreadySelected = similar && _drinkEquipmentSelection.some(item => _normalizeEquipmentName(item.name) === _normalizeEquipmentName(similar));
  if (alreadySelected) {
    _setEquipmentError(`Такое оборудование уже выбрано: ${similar}`);
    return false;
  }
  if (custom && similar && _normalizeEquipmentName(similar) !== _normalizeEquipmentName(cleanName)) {
    _setEquipmentError(`Похоже, в списке уже есть: ${similar}`);
    return false;
  }
  _drinkEquipmentSelection.push({ id: _equipmentId(cleanName), name: cleanName });
  _setEquipmentError('');
  renderDrinkEquipment();
  return true;
}

export function onDrinkEquipmentSelect(selectEl) {
  const name = selectEl?.value || '';
  if (!name) return;
  if (name === DRINK_EQUIPMENT_CUSTOM_VALUE) {
    selectEl.value = '';
    openDrinkEquipmentCustomPopover();
    return;
  }
  _addDrinkEquipment(name);
}

export function addDrinkEquipmentCustom() {
  const input = document.getElementById('md-equipment-custom');
  const name = input?.value.trim() || '';
  if (!name) {
    _setEquipmentError('Введите название оборудования');
    return;
  }
  if (_addDrinkEquipment(name, { custom: true })) closeDrinkEquipmentCustomPopover();
}

export function removeDrinkEquipment(id) {
  _drinkEquipmentSelection = _drinkEquipmentSelection.filter(item => item.id !== id);
  _setEquipmentError('');
  renderDrinkEquipment();
}

export function openAddDrink() {
  _setDrinkAuthorUi();
  _clearPublicationMarks();
  document.getElementById('modal-drink-title').innerHTML = '<i data-lucide="plus" class="icon"></i> Новый напиток';
  if (window.lucide) lucide.createIcons({ nodes: [document.getElementById('modal-drink-title')] });
  document.getElementById('md-process').value = '';
  document.getElementById('md-video').value    = '';
  document.getElementById('md-storage-temp').value = '';
  document.getElementById('md-storage-life').value = '';
  document.getElementById('md-appearance').value   = '';
  document.getElementById('md-taste').value        = '';
  document.getElementById('md-consistency').value  = '';
  const _prev = document.getElementById('md-img-preview');
  _prev.src = ''; _prev.style.display = 'none';
  document.getElementById('md-img-placeholder').style.display = '';
  document.getElementById('md-img-clear').style.display = 'none';
  document.getElementById('md-delete-btn').style.display = 'none';
  document.getElementById('md-name').value  = '';
  document.getElementById('md-price').value = '';
  document.getElementById('md-vol').value   = '';
  document.getElementById('md-group').value = _isAuthorDrinkMode() ? 'author' : 'hot';
  document.getElementById('md-edit-id').value = '';
  setDrinkEquipmentSelection([]);
  closeDrinkEquipmentCustomPopover();
  document.getElementById('md-ings').innerHTML = '';
  addIngRow(); addIngRow();
  openModal('modal-drink');
}

export function openEditDrink(id) {
  const d = DRINKS.find(x => x.id === id && x.custom) || DRINKS.find(x=>x.id===id);
  if (!d) return;
  _setDrinkAuthorUi();
  _clearPublicationMarks();
  document.getElementById('modal-drink-title').innerHTML = '<i data-lucide="pencil" class="icon"></i> Редактировать напиток';
  if (window.lucide) lucide.createIcons({ nodes: [document.getElementById('modal-drink-title')] });
  document.getElementById('md-name').value  = d.name;
  document.getElementById('md-price').value = S.salePrices[id];
  document.getElementById('md-vol').value   = d.vol;
  document.getElementById('md-group').value = d.group;
  document.getElementById('md-edit-id').value = id;
  document.getElementById('md-process').value = d.process || '';
  document.getElementById('md-video').value    = d.videoUrl || '';
  const _isCold = d.group === 'cold';
  const _defTemp = _isCold ? 'не выше +10°C' : 'не ниже 60°C';
  const _defLife = _isCold ? '30 минут с момента приготовления' : '15 минут с момента приготовления';
  document.getElementById('md-storage-temp').value = d.storage_temp || _defTemp;
  document.getElementById('md-storage-life').value = d.storage_life || _defLife;
  const _dq = DRINK_QUALITY[d.id];
  document.getElementById('md-appearance').value   = d.appearance  || (_dq && _dq.appearance)  || '';
  document.getElementById('md-taste').value        = d.taste       || (_dq && _dq.taste)       || '';
  document.getElementById('md-consistency').value  = d.consistency || (_dq && _dq.consistency) || '';
  setDrinkEquipmentSelection(d.equipment || d.recipeEquipment || []);
  closeDrinkEquipmentCustomPopover();
  // Изображение
  const preview = document.getElementById('md-img-preview');
  const placeholder = document.getElementById('md-img-placeholder');
  const clearBtn = document.getElementById('md-img-clear');
  if (d.image) {
    preview.src = d.image; preview.style.display = 'block';
    placeholder.style.display = 'none'; clearBtn.style.display = '';
  } else {
    preview.src = ''; preview.style.display = 'none';
    placeholder.style.display = ''; clearBtn.style.display = 'none';
  }
  document.getElementById('md-ings').innerHTML = '';
  d.recipe.forEach(r => {
    const sel = r.semi != null ? `semi:${r.semi}` : `mat:${r.mat}`;
    let displayAmt = r.amt;
    if (r.semi != null) {
      const _s = SEMI.find(x => x.id === r.semi);
      displayAmt = _s ? r.amt * window._semiDrinkFactor(_s) : r.amt;
    } else if (r.mat) {
      displayAmt = r.amt; // хранится в г/мл, показываем напрямую
    }
    const displayLoss = r.loss ? parseFloat((r.loss * 100).toPrecision(4)) : '';
    addIngRow(sel, displayAmt, displayLoss);
  });
  // показать кнопку удаления/сброса
  const delBtn = document.getElementById('md-delete-btn');
  const delLabel = document.getElementById('md-delete-label');
  if (d.custom) {
    delBtn.style.display = '';
    delBtn.style.color = 'var(--red)';
    delBtn.style.borderColor = '#f4b8c4';
    delLabel.textContent = 'Удалить';
    delBtn.dataset.action = 'delete';
  } else if (d.modified) {
    delBtn.style.display = '';
    delBtn.style.color = 'var(--muted)';
    delBtn.style.borderColor = '';
    delLabel.textContent = 'Сбросить';
    delBtn.dataset.action = 'reset';
  } else {
    // базовый напиток: показываем «Сбросить» (недоступно пока не изменён, но модалка открылась из рецептур)
    delBtn.style.display = 'none';
  }
  if (window.lucide) lucide.createIcons({ nodes: [delBtn] });
  openModal('modal-drink');
}

export async function saveDrink() {
  _clearPublicationMarks();
  const name  = document.getElementById('md-name').value.trim();
  const price = parseFloat(document.getElementById('md-price').value);
  const vol   = parseInt(document.getElementById('md-vol').value) || 0;
  const group = document.getElementById('md-group').value;
  const editId = document.getElementById('md-edit-id').value;
  if (!name || !(price>0)) { window.showAlert('Заполните название и цену'); return; }
  const _editIdNum = editId !== '' ? parseInt(editId) : null;
  const _dupDrink = DRINKS.find(d => d.name.trim().toLowerCase() === name.toLowerCase() && d.id !== _editIdNum);
  if (_dupDrink) { window.showAlert(`Напиток с названием «${name}» уже существует`); return; }
  const recipe = [];
  document.querySelectorAll('#md-ings .modal-ing-row').forEach(row => {
    const selEl  = row.querySelector('select');
    const inputs = row.querySelectorAll('input');
    const amt    = parseFloat(inputs[0].value);
    if (!selEl.value || !(amt > 0)) return;
    const l = parseFloat(inputs[1].value) / 100;
    const [type, key] = selEl.value.split(':');
    if (type === 'semi') {
      const s = SEMI.find(x => x.id === parseInt(key));
      const _f = s ? window._semiDrinkFactor(s) : 1;
      const ing = { semi: parseInt(key), amt: _f > 1 ? amt / _f : amt };
      if (l > 0 && l < 1) ing.loss = l;
      recipe.push(ing);
    } else {
      const ing = { mat: key, amt }; // пользователь вводит в г/мл, храним напрямую
      if (l > 0 && l < 1) ing.loss = l;
      recipe.push(ing);
    }
  });
  if (recipe.length === 0) { window.showAlert('Добавьте хотя бы один ингредиент'); return; }
  const process  = document.getElementById('md-process').value.trim();
  const videoUrl = document.getElementById('md-video').value.trim();
  const storage_temp  = document.getElementById('md-storage-temp').value.trim();
  const storage_life  = document.getElementById('md-storage-life').value.trim();
  const appearance    = document.getElementById('md-appearance').value.trim();
  const taste         = document.getElementById('md-taste').value.trim();
  const consistency   = document.getElementById('md-consistency').value.trim();
  const equipment     = getDrinkEquipmentSelection();
  const imgEl    = document.getElementById('md-img-preview');
  const image    = (imgEl.style.display !== 'none' && imgEl.src) ? imgEl.src : '';
  let savedDrink = null;
  if (editId !== '') {
    const id = parseInt(editId);
    const idx = DRINKS.findIndex(x => x.id === id && x.custom) >= 0
      ? DRINKS.findIndex(x => x.id === id && x.custom)
      : DRINKS.findIndex(x=>x.id===id);
    if (idx >= 0) {
      const wasCustom = DRINKS[idx].custom || false;
      DRINKS[idx] = {...DRINKS[idx], name, group, vol, recipe, process, videoUrl, image,
        equipment,
        storage_temp, storage_life, appearance, taste, consistency,
        custom: wasCustom,
        modified: !wasCustom || undefined
      };
      savedDrink = DRINKS[idx];
    }
    S.salePrices[id] = price;
  } else {
    const id = _nextFreeDrinkId();
    savedDrink = { id, group, name, vol, recipe, process, videoUrl, image,
      equipment,
      storage_temp, storage_life, appearance, taste, consistency, price, custom:true };
    DRINKS.push(savedDrink);
    S.salePrices[id] = price;
    S.portions[id]   = 5;
  }
  if (window.authorCanPublish && window.authorCanPublish() && window.saveAuthorDraftForDrink && savedDrink) {
    try {
      await window.saveAuthorDraftForDrink(savedDrink, { silent: true });
    } catch (e) {
      window.showAlert(e.message || 'Не удалось сохранить авторский черновик');
      return;
    }
  }
  _clearModalDirty('modal-drink');
  closeModal('modal-drink');
  markDirtyDebounce();
  saveState();
  if (window.renderRecipes) window.renderRecipes();
}

export function deleteDrink(id) {
  window.showConfirm('Удалить напиток?', async () => {
    const idx = DRINKS.findIndex(d => d.id === id && d.custom) >= 0
      ? DRINKS.findIndex(d => d.id === id && d.custom)
      : DRINKS.findIndex(d=>d.id===id);
    const drink = idx >= 0 ? DRINKS[idx] : null;
    if (drink && window.authorCanPublish && window.authorCanPublish() && window.deleteAuthorDraftForDrink) {
      try {
        await window.deleteAuthorDraftForDrink(drink, { silent: true });
      } catch (e) {
        window.showAlert(e.message || 'Не удалось удалить авторский черновик');
        return;
      }
    }
    if (idx>=0) DRINKS.splice(idx,1);
    delete S.salePrices[id];
    delete S.portions[id];
    markDirtyDebounce();
    saveState();
    if (window.renderRecipes) window.renderRecipes();
  }, { icon: '🗑️', okText: 'Удалить' });
}

export function _compressImageDataURL(dataURL, maxPx, quality, callback) {
  const img = new Image();
  img.onload = () => {
    let w = img.naturalWidth, h = img.naturalHeight;
    if (w > maxPx || h > maxPx) {
      if (w >= h) { h = Math.round(h * maxPx / w); w = maxPx; }
      else        { w = Math.round(w * maxPx / h); h = maxPx; }
    }
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    callback(canvas.toDataURL('image/jpeg', quality));
  };
  img.onerror = () => callback(dataURL); // на случай сбоя — оставляем как есть
  img.src = dataURL;
}

export async function onDrinkImgChange(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  if (file.size > 5 * 1024 * 1024) { window.showAlert('Файл слишком большой. Максимум 5 МБ.'); return; }
  if (window.authorCanPublish && window.authorCanPublish() && window.uploadAuthorRecipeImage) {
    try {
      const imageUrl = await window.uploadAuthorRecipeImage(file);
      const preview = document.getElementById('md-img-preview');
      const placeholder = document.getElementById('md-img-placeholder');
      preview.src = imageUrl;
      preview.style.display = 'block';
      placeholder.style.display = 'none';
      document.getElementById('md-img-clear').style.display = '';
    } catch (e) {
      window.showAlert(e.message || 'Не удалось загрузить фото');
    } finally {
      input.value = '';
    }
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    _compressImageDataURL(e.target.result, 800, 0.82, compressed => {
      const preview = document.getElementById('md-img-preview');
      const placeholder = document.getElementById('md-img-placeholder');
      preview.src = compressed;
      preview.style.display = 'block';
      placeholder.style.display = 'none';
      document.getElementById('md-img-clear').style.display = '';
    });
  };
  reader.readAsDataURL(file);
  input.value = '';
}

export function clearDrinkImg() {
  const preview = document.getElementById('md-img-preview');
  preview.src = ''; preview.style.display = 'none';
  document.getElementById('md-img-placeholder').style.display = '';
  document.getElementById('md-img-clear').style.display = 'none';
}

export function onSemiImgChange(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  if (file.size > 5 * 1024 * 1024) { window.showAlert('Файл слишком большой. Максимум 5 МБ.'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    _compressImageDataURL(e.target.result, 800, 0.82, compressed => {
      const preview = document.getElementById('ms-img-preview');
      preview.src = compressed;
      preview.style.display = 'block';
      document.getElementById('ms-img-placeholder').style.display = 'none';
      document.getElementById('ms-img-clear').style.display = '';
    });
  };
  reader.readAsDataURL(file);
  input.value = '';
}

export function clearSemiImg() {
  const preview = document.getElementById('ms-img-preview');
  preview.src = ''; preview.style.display = 'none';
  document.getElementById('ms-img-placeholder').style.display = '';
  document.getElementById('ms-img-clear').style.display = 'none';
}

export function mdDeleteAction() {
  const id = parseInt(document.getElementById('md-edit-id').value);
  const action = document.getElementById('md-delete-btn').dataset.action;
  _clearModalDirty('modal-drink');
  closeModal('modal-drink');
  if (action === 'delete') deleteDrink(id);
  else if (action === 'reset') resetDrink(id);
}

export function resetDrink(id) {
  window.showConfirm('Вернуть напиток к исходным значениям?', () => {
    const orig = DRINKS_ORIG.find(d => d.id === id);
    if (!orig) return;
    const idx = DRINKS.findIndex(d => d.id === id);
    if (idx >= 0) DRINKS[idx] = {...orig}; // снимает флаг modified
    S.salePrices[id] = orig.price;
    markDirtyDebounce();
    saveState();
  }, { icon: '🔄', okText: 'Сбросить', danger: false });
}
