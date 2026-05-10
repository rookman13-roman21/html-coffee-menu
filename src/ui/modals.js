// src/ui/modals.js
// Хелперы модальных окон: open/close, dirty-guard, unsaved warning

export function openModal(id)  {
  const el = document.getElementById(id);
  el.classList.add('open');
  // Сброс скролла модалки в начало
  const modalEl = el.querySelector('.modal');
  if (modalEl) modalEl.scrollTop = 0;
  if (id === 'modal-mat') { _fillMatSupBookSelect(); lucide.createIcons(); }
  // Блокируем скролл фона без position:fixed (иначе iOS Safari сдвигает координаты тачей)
  if (!document.documentElement.classList.contains('modal-open')) {
    document.documentElement.dataset.scrollY = window.scrollY;
    document.documentElement.classList.add('modal-open');
  }
}

export function closeModal(id) {
  // Защита: если есть несохранённые изменения — показать предупреждение вместо закрытия
  if (_isModalDirty && _isModalDirty(id)) {
    _showUnsavedWarning(id);
    return;
  }
  document.getElementById(id).classList.remove('open');
  // Разблокируем фон только если больше нет открытых модалов
  if (!document.querySelector('.modal-bg.open')) {
    const scrollY = parseInt(document.documentElement.dataset.scrollY || '0');
    document.documentElement.classList.remove('modal-open');
    window.scrollTo(0, scrollY);
  }
  _clearModalDirty(id);
}

export function _markModalDirty(id)  { if (_EDITABLE_MODALS.has(id)) _dirtyModalSet.add(id); }

export function _clearModalDirty(id) { _dirtyModalSet.delete(id); }

export function _isModalDirty(id)    { return _dirtyModalSet.has(id); }

export function safeCloseModal(id) {
  if (_isModalDirty(id)) {
    _showUnsavedWarning(id);
    return;
  }
  // Специальные cancel-функции
  if (id === 'modal-mat')           { cancelMat(true); return; }
  if (id === 'modal-supplier-book') { cancelSupplierBookModal(true); return; }
  closeModal(id);
}

export function _showUnsavedWarning(id) {
  if (document.getElementById('_unsaved-overlay')) return; // не дублируем
  const overlay = document.createElement('div');
  overlay.id = '_unsaved-overlay';
  overlay.innerHTML = `
    <div class="_unsaved-box">
      <div class="_unsaved-icon">⚠️</div>
      <div class="_unsaved-title">Есть несохранённые изменения</div>
      <div class="_unsaved-sub">Если закрыть сейчас — данные потеряются</div>
      <div class="_unsaved-btns">
        <button class="_unsaved-stay"  onclick="_dismissUnsavedWarning()">← Остаться</button>
        <button class="_unsaved-close" onclick="_forceCloseModal('${id}')">Закрыть</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

export function _dismissUnsavedWarning() {
  const el = document.getElementById('_unsaved-overlay');
  if (el) el.remove();
}

export function _forceCloseModal(id) {
  _dismissUnsavedWarning();
  _clearModalDirty(id); // снимаем dirty чтобы closeModal не заблокировал
  if (id === 'modal-mat')           { cancelMat(true); return; }
  if (id === 'modal-supplier-book') { cancelSupplierBookModal(true); return; }
  closeModal(id);
}

export function closeOnboarding() {
  document.getElementById('onboarding').style.display = 'none';
  try { localStorage.setItem('mbs_onboard', '1'); } catch(e) {}
}

export function toggleTheme() { return window.toggleTheme && window.toggleTheme(); }
export function toggleBurger() { return window.toggleBurger && window.toggleBurger(); }
