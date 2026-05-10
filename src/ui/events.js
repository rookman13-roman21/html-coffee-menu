// ════════════════════════════════════════════════════════════════════
//  src/ui/events.js — global event wiring
//  Последнее, что осталось в public/app.js — перенесено сюда.
//  Вызывается из src/main.js в конце после INIT.
// ════════════════════════════════════════════════════════════════════

import { closeModal, safeCloseModal, _markModalDirty } from './modals.js';
import { switchTab } from './updaters.js';

const MODAL_IDS = [
  'modal-drink','modal-mat','modal-semi','modal-templates','modal-loc',
  'modal-supplier','modal-supplier-book','modal-price-hist','modal-drop',
  'modal-suppliers-list','modal-drink-view',
];

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
  MODAL_IDS.forEach(id => {
    const bg = document.getElementById(id);
    if (e.target === bg) closeModal(id);
  });
});

// Закрыть дропдауны при клике вне их
const DROPDOWN_IDS = ['loc-menu', 'export-menu'];
document.addEventListener('click', () => {
  DROPDOWN_IDS.forEach(id => document.getElementById(id)?.classList.remove('open'));
});

// Закрыть верхний открытый модал или дропдаун по Escape
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  // сначала проверяем дропдауны
  for (const id of DROPDOWN_IDS) {
    const el = document.getElementById(id);
    if (el && el.classList.contains('open')) { el.classList.remove('open'); return; }
  }
  // затем модалки
  for (const id of MODAL_IDS) {
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
