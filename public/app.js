// ════════════════════════════════════════════════════════════════════
//  public/app.js  —  event wiring only
//  UI state → src/state/ui-state.js  (window.* via src/main.js)
//  Счётчики/INIT/tooltip/kb-nav → src/main.js
// ════════════════════════════════════════════════════════════════════

// Закрывать бургер при клике на нав-кнопку
document.addEventListener('click', e => {
  if (e.target.matches('.nav-btn')) document.getElementById('main-nav').classList.remove('open');
});

// Любое изменение в открытом модале → dirty-mark
document.addEventListener('input',  e => { const m = e.target.closest('.modal-bg'); if (m) _markModalDirty(m.id); }, true);
document.addEventListener('change', e => { const m = e.target.closest('.modal-bg'); if (m) _markModalDirty(m.id); }, true);

// Клик по подложке модала → safeClose
document.addEventListener('click', e => {
  if (!e.target.classList.contains('modal-bg')) return;
  safeCloseModal(e.target.id);
});

// Закрыть модал при клике на фон (резервный обработчик)
document.addEventListener('click', e => {
  ['modal-drink','modal-mat','modal-semi','modal-templates','modal-loc',
   'modal-supplier','modal-supplier-book','modal-price-hist','modal-drop',
   'modal-suppliers-list','modal-drink-view'].forEach(id => {
    const bg = document.getElementById(id);
    if (e.target === bg) closeModal(id);
  });
});

// Закрыть верхний открытый модал по Escape
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const all = ['modal-mat','modal-drink','modal-semi','modal-supplier','modal-supplier-book',
               'modal-loc','modal-templates','modal-price-hist','modal-drop',
               'modal-suppliers-list','modal-drink-view'];
  for (const id of all) {
    const el = document.getElementById(id);
    if (el && el.classList.contains('open')) { safeCloseModal(id); return; }
  }
});

// TAB NAVIGATION — desktop
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// TAB NAVIGATION — mobile tabbar
const _mobileTabbar = document.getElementById('mobile-tabbar');
if (_mobileTabbar) {
  _mobileTabbar.addEventListener('click', e => {
    const btn = e.target.closest('.mobile-tab');
    if (btn) switchTab(btn.dataset.tab);
  });
}
