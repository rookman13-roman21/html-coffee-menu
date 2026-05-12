// src/modals/drink.js
// Модальное окно напитка: добавление, редактирование, удаление, сброс

export function openAddDrink() {
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
  document.getElementById('md-group').value = 'hot';
  document.getElementById('md-edit-id').value = '';
  document.getElementById('md-ings').innerHTML = '';
  addIngRow(); addIngRow();
  openModal('modal-drink');
}

export function openEditDrink(id) {
  const d = DRINKS.find(x=>x.id===id);
  if (!d) return;
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

export function saveDrink() {
  const name  = document.getElementById('md-name').value.trim();
  const price = parseFloat(document.getElementById('md-price').value);
  const vol   = parseInt(document.getElementById('md-vol').value) || 0;
  const group = document.getElementById('md-group').value;
  const editId = document.getElementById('md-edit-id').value;
  if (!name || !(price>0)) { alert('Заполните название и цену'); return; }
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
  if (recipe.length === 0) { alert('Добавьте хотя бы один ингредиент'); return; }
  const process  = document.getElementById('md-process').value.trim();
  const videoUrl = document.getElementById('md-video').value.trim();
  const storage_temp  = document.getElementById('md-storage-temp').value.trim();
  const storage_life  = document.getElementById('md-storage-life').value.trim();
  const appearance    = document.getElementById('md-appearance').value.trim();
  const taste         = document.getElementById('md-taste').value.trim();
  const consistency   = document.getElementById('md-consistency').value.trim();
  const imgEl    = document.getElementById('md-img-preview');
  const image    = (imgEl.style.display !== 'none' && imgEl.src) ? imgEl.src : '';
  if (editId !== '') {
    const id = parseInt(editId);
    const idx = DRINKS.findIndex(x=>x.id===id);
    if (idx >= 0) {
      const wasCustom = DRINKS[idx].custom || false;
      DRINKS[idx] = {...DRINKS[idx], name, group, vol, recipe, process, videoUrl, image,
        storage_temp, storage_life, appearance, taste, consistency,
        custom: wasCustom,
        modified: !wasCustom || undefined
      };
    }
    S.salePrices[id] = price;
  } else {
    const id = window.nextDrinkId++;
    DRINKS.push({ id, group, name, vol, recipe, process, videoUrl, image,
      storage_temp, storage_life, appearance, taste, consistency, price, custom:true });
    S.salePrices[id] = price;
    S.portions[id]   = 5;
  }
  _clearModalDirty('modal-drink');
  closeModal('modal-drink');
  markDirtyDebounce();
  saveState();
}

export function deleteDrink(id) {
  if (!confirm('Удалить напиток?')) return;
  const idx = DRINKS.findIndex(d=>d.id===id);
  if (idx>=0) DRINKS.splice(idx,1);
  delete S.salePrices[id];
  delete S.portions[id];
  markDirtyDebounce();
  saveState();
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

export function onDrinkImgChange(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  if (file.size > 5 * 1024 * 1024) { alert('Файл слишком большой. Максимум 5 МБ.'); return; }
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
  if (file.size > 5 * 1024 * 1024) { alert('Файл слишком большой. Максимум 5 МБ.'); return; }
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
  if (!confirm('Вернуть напиток к исходным значениям?')) return;
  const orig = DRINKS_ORIG.find(d => d.id === id);
  if (!orig) return;
  const idx = DRINKS.findIndex(d => d.id === id);
  if (idx >= 0) DRINKS[idx] = {...orig}; // снимает флаг modified
  S.salePrices[id] = orig.price;
  markDirtyDebounce();
  saveState();
}
