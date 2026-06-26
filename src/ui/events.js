// ════════════════════════════════════════════════════════════════════
//  src/ui/events.js — global event wiring
//  Последнее, что осталось в public/app.js — перенесено сюда.
//  Вызывается из src/main.js в конце после INIT.
// ════════════════════════════════════════════════════════════════════

import { closeModal, safeCloseModal, _markModalDirty } from './modals.js';
import { switchTab } from './updaters.js';
import { tabFromPath } from '../access/app-routes.js';

const MODAL_IDS = [
  'modal-drink','modal-mat','modal-semi','modal-templates','modal-loc',
  'modal-supplier','modal-supplier-book','modal-price-hist','modal-drop',
  'modal-suppliers-list','modal-drink-view','modal-oc-item','modal-oc-library',
  'modal-mat-view','modal-supplier-info','modal-add-cat','modal-add-semi-cat',
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
function openMobileMoreSheet() {
  const sheet = document.getElementById('mobile-more-sheet');
  const backdrop = document.getElementById('mobile-more-backdrop');
  const btn = document.querySelector('.mobile-tab[data-mobile-more]');
  if (!sheet || !backdrop) return;
  backdrop.hidden = false;
  requestAnimationFrame(() => {
    sheet.classList.add('open');
    backdrop.classList.add('open');
    sheet.setAttribute('aria-hidden', 'false');
    if (btn) btn.setAttribute('aria-expanded', 'true');
  });
}

function closeMobileMoreSheet() {
  const sheet = document.getElementById('mobile-more-sheet');
  const backdrop = document.getElementById('mobile-more-backdrop');
  const btn = document.querySelector('.mobile-tab[data-mobile-more]');
  if (!sheet || !backdrop) return;
  sheet.classList.remove('open');
  backdrop.classList.remove('open');
  sheet.setAttribute('aria-hidden', 'true');
  if (btn) btn.setAttribute('aria-expanded', 'false');
  setTimeout(() => {
    if (!backdrop.classList.contains('open')) backdrop.hidden = true;
  }, 180);
}
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
  const mobileMoreSheet = document.getElementById('mobile-more-sheet');
  if (mobileMoreSheet && mobileMoreSheet.classList.contains('open')) {
    closeMobileMoreSheet();
    return;
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
// Double-tap on active tab → scroll to top
const _mobileTabbar = document.getElementById('mobile-tabbar');
if (_mobileTabbar) {
  let _lastTabTap = { tab: null, time: 0 };
  _mobileTabbar.addEventListener('click', e => {
    const btn = e.target.closest('.mobile-tab');
    if (!btn) return;
    if (btn.dataset.mobileMore) {
      if (document.getElementById('mobile-more-sheet')?.classList.contains('open')) closeMobileMoreSheet();
      else openMobileMoreSheet();
      return;
    }
    const tab = btn.dataset.tab;
    const now = Date.now();
    if (tab === window.activeTab && tab === _lastTabTap.tab && now - _lastTabTap.time < 400) {
      // Двойной тап на активный таб — скролим наверх
      window.scrollTo({ top: 0, behavior: 'smooth' });
      _lastTabTap = { tab: null, time: 0 };
    } else {
      _lastTabTap = { tab, time: now };
      switchTab(tab);
    }
  });
}

document.addEventListener('click', e => {
  if (e.target.closest('[data-mobile-more-close]') || e.target.id === 'mobile-more-backdrop') {
    closeMobileMoreSheet();
    return;
  }
  const item = e.target.closest('.mobile-more-item[data-tab]');
  if (!item) return;
  closeMobileMoreSheet();
  switchTab(item.dataset.tab);
});

window.addEventListener('popstate', () => {
  const tab = tabFromPath();
  if (tab) switchTab(tab, { replaceUrl: true });
});
