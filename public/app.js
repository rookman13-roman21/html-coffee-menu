// ════════════════════════════════════════════════════════════════════
//  public/app.js  —  UI state + event wiring
//  Счётчики (SEMI/nextDrinkId/nextSemiId/nextMatKey), INIT, tooltip,
//  keyboard nav → src/main.js
// ════════════════════════════════════════════════════════════════════

// ─── Редактирование ингредиентов / п/ф ───────────────────────────
let _editMatKey = null;
let _pendingMatSelectEl     = null;
let _pendingSemiMatSelectEl = null;

// ─── UI state ────────────────────────────────────────────────────
let searchQuery  = '';
let _renderTimer = null;
const dirty = { dashboard:true, cost:true, sales:true, finmodel:true, recipes:true };

const sortState      = { col: 'profit', dir: 'desc' };
const salesSortState = { col: 'name',   dir: 'asc'  };
let   salesSearch    = '';

let _matActiveCat  = 'all';
let _matCollapsed  = {};
let _semiCollapsed = false;
let _supCollapsed  = false;
let _ingCollapsed  = false;

let recipeSearch = '';
let recipeSort   = 'group';
let recipeGroup  = 'all';

let _mvdId = null;
const _matPriceBeforeEdit = {};
let _fceIdx = -1;

const PS_DEFAULTS = { mrot: 22440, ndfl: 13, ins: 30 };

const MAT_CATEGORY = {
  coffee:'coffee', milk:'dairy', cream:'dairy',
  cocoa:'other', matcha:'tea', tea:'tea',
  sugar:'sugar', sugar_van:'sugar', sugar_org:'sugar',
  cup250:'pack', cup350:'pack', cup450:'pack', cup_p300:'pack', cup_p500:'pack',
  orange:'other', tonic:'other', lime:'other',
};
const CAT_LABELS = { all:'Все', coffee:'Зерно', dairy:'Молочное', tea:'Чай/Матча', sugar:'Сахар', pack:'Упаковка', other:'Прочее', nomat:'Без сырья' };

let _supplierEditKey  = null;
let _supplierFromList = false;
let _supBookEditId    = null;
let supListSearch     = '';
let supListFilter     = 'all';

let _supQuickKey = null;
let _supQuickEl  = null;

// ─── Modal dirty tracking ─────────────────────────────────────────
const _EDITABLE_MODALS = new Set([
  'modal-drink','modal-semi','modal-mat',
  'modal-supplier','modal-supplier-book','modal-loc'
]);
const _dirtyModalSet = new Set();

// ════════════════════════════════════════════════════════════════════
//  EVENT WIRING
// ════════════════════════════════════════════════════════════════════

// Закрывать бургер при клике на нав-кнопку
document.addEventListener('click', e => {
  if (e.target.matches('.nav-btn')) document.getElementById('main-nav').classList.remove('open');
});

// Делегированный слушатель: любое изменение в открытом модале → dirty
document.addEventListener('input',  e => { const m = e.target.closest('.modal-bg'); if (m) _markModalDirty(m.id); }, true);
document.addEventListener('change', e => { const m = e.target.closest('.modal-bg'); if (m) _markModalDirty(m.id); }, true);

// Клик по подложке модала → safeClose
document.addEventListener('click', e => {
  if (!e.target.classList.contains('modal-bg')) return;
  safeCloseModal(e.target.id);
});

// Закрыть модал при клике на фон (резервный обработчик)
document.addEventListener('click', e => {
  ['modal-drink','modal-mat','modal-semi','modal-templates','modal-loc','modal-supplier','modal-supplier-book','modal-price-hist','modal-drop','modal-suppliers-list','modal-drink-view'].forEach(id => {
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
    if (el && el.classList.contains('open')) {
      safeCloseModal(id);
      return;
    }
  }
});

// TAB NAVIGATION
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});
const mobileTabbar = document.getElementById('mobile-tabbar');
if (mobileTabbar) {
  mobileTabbar.addEventListener('click', e => {
    const btn = e.target.closest('.mobile-tab');
    if (btn) switchTab(btn.dataset.tab);
  });
}

// ════════════════════════════════════════════════════════════════════
//  EXPOSE UI GLOBALS FOR ES MODULES (src/*)
// ════════════════════════════════════════════════════════════════════
Object.assign(window, {
  dirty, searchQuery, sortState, salesSortState, salesSearch,
  recipeSort, recipeGroup, recipeSearch,
  _matActiveCat, _matCollapsed, _semiCollapsed, _supCollapsed, _ingCollapsed,
  _editMatKey, _pendingMatSelectEl, _pendingSemiMatSelectEl,
  _mvdId, _matPriceBeforeEdit, _fceIdx,
  PS_DEFAULTS, MAT_CATEGORY, CAT_LABELS,
  _supplierEditKey, _supplierFromList, _supBookEditId,
  supListSearch, supListFilter, _supQuickKey, _supQuickEl,
  _EDITABLE_MODALS, _dirtyModalSet,
});
