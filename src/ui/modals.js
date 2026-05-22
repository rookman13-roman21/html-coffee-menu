// src/ui/modals.js
// Хелперы модальных окон: open/close, dirty-guard, unsaved warning

export function openModal(id)  {
  const el = document.getElementById(id);
  if (!el) { console.error('[openModal] element not found:', id); return; }
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

export function showAlert(msg, icon = '⚠️') {
  if (document.getElementById('_dialog-overlay')) return;
  const overlay = document.createElement('div');
  overlay.id = '_dialog-overlay';
  overlay.innerHTML = `
    <div class="_dialog-box">
      <div class="_dialog-icon">${icon}</div>
      <div class="_dialog-msg">${msg}</div>
      <div class="_dialog-btns">
        <button class="_dialog-ok" id="_dialog-ok-btn">ОК</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('_dialog-ok-btn').addEventListener('click', () => overlay.remove());
}

export function showConfirm(msg, onConfirm, opts = {}) {
  if (document.getElementById('_dialog-overlay')) return;
  const icon    = opts.icon    || '❓';
  const okText  = opts.okText  || 'Подтвердить';
  const danger  = opts.danger !== false;
  const overlay = document.createElement('div');
  overlay.id = '_dialog-overlay';
  overlay.innerHTML = `
    <div class="_dialog-box">
      <div class="_dialog-icon">${icon}</div>
      <div class="_dialog-msg">${msg}</div>
      <div class="_dialog-btns">
        <button class="_dialog-cancel" id="_dialog-cancel-btn">Отмена</button>
        <button class="${danger ? '_dialog-confirm' : '_dialog-ok'}" id="_dialog-confirm-btn">${okText}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('_dialog-cancel-btn').addEventListener('click', () => overlay.remove());
  document.getElementById('_dialog-confirm-btn').addEventListener('click', () => {
    overlay.remove();
    onConfirm();
  });
}

export function closeOnboarding() {
  document.getElementById('onboarding').style.display = 'none';
  try { localStorage.setItem('mbs_onboard', '1'); } catch(e) {}
}

export function toggleTheme() {
  const dark = document.body.classList.toggle('dark');
  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.setAttribute('data-lucide', dark ? 'sun' : 'moon');
    if (window.lucide) window.lucide.createIcons({ nodes: [icon] });
  }
  try { localStorage.setItem('mbs_theme', dark ? 'dark' : 'light'); } catch(e) {}
}
export function toggleBurger() {
  const nav = document.getElementById('main-nav');
  if (nav) nav.classList.toggle('open');
}
