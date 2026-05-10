let nextDrinkId = 27; // auto-increment id for new drinks
let nextMatKey  = 1;  // suffix for custom mat keys
let _editMatKey = null;
let _pendingMatSelectEl     = null; // select в строке рецепта напитка, откуда открыли «создать ингредиент»
let _pendingSemiMatSelectEl = null; // select в строке п/ф, откуда открыли «создать ингредиент»

// ═══════════════════════════════════════════════════════════════════
//  COUNTERS & SEMI  (мутабельные счётчики, SEMI — ещё не в src/)
// ═══════════════════════════════════════════════════════════════════
let SEMI = [];
let nextSemiId = 1;
// ═══════════════════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════════════════
let activeTab = (function() {
  try {
    const saved = localStorage.getItem('mbs_active_tab');
    const valid = ['dashboard','cost','sales','finmodel','recipes'];
    return (saved && valid.includes(saved)) ? saved : 'dashboard';
  } catch(e) { return 'dashboard'; }
})();
let searchQuery = '';
let _renderTimer = null;
const dirty = { dashboard:true, cost:true, sales:true, finmodel:true, recipes:true };

// ═══════════════════════════════════════════════════════════════════
//  EXPORT CSV
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
//  SORT (dashboard table)
// ═══════════════════════════════════════════════════════════════════
const sortState      = { col: 'profit', dir: 'desc' };
const salesSortState = { col: 'name',   dir: 'asc'  };
let   salesSearch    = '';

let _matActiveCat = 'all';
let _matCollapsed  = {}; // { [cat]: true/false }
let _semiCollapsed = false;
let _supCollapsed  = false;
let _ingCollapsed  = false;

// ════════════════════════════════════════════════════════════════════
//  LOCATIONS (multi-coffeeshop support)
// ════════════════════════════════════════════════════════════════════

// ─── Persist & Theme ─────────────────────────────────────────────
//  saveState / loadState / toggleTheme / toggleBurger → src/state/store.js + src/ui/modals.js
// Закрывать бургер при клике на нав-кнопку
document.addEventListener('click', e => {
  if (e.target.matches('.nav-btn')) document.getElementById('main-nav').classList.remove('open');
});

const _EDITABLE_MODALS = new Set([
  'modal-drink','modal-semi','modal-mat',
  'modal-supplier','modal-supplier-book','modal-loc'
]);
const _dirtyModalSet = new Set();

// Делегированный слушатель: любое изменение в открытом модале → dirty
document.addEventListener('input',  e => { const m = e.target.closest('.modal-bg'); if (m) _markModalDirty(m.id); }, true);
document.addEventListener('change', e => { const m = e.target.closest('.modal-bg'); if (m) _markModalDirty(m.id); }, true);

// Клик по подложке (не по контенту модала) → safeClose
document.addEventListener('click', e => {
  if (!e.target.classList.contains('modal-bg')) return;
  safeCloseModal(e.target.id);
});

let _supQuickKey = null;
let _supQuickEl  = null;

// Закрыть модал при клике на фон
document.addEventListener('click', e => {
  ['modal-drink','modal-mat','modal-semi','modal-templates','modal-loc','modal-supplier','modal-supplier-book','modal-price-hist','modal-drop','modal-suppliers-list','modal-drink-view'].forEach(id => {
    const bg = document.getElementById(id);
    if (e.target === bg) closeModal(id);
  });
});

// Закрыть верхний открытый модал по Escape
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  // Ищем открытый с наибольшим z-index (modal-mat поверх остальных)
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

let recipeSearch = '';
let recipeSort   = 'group';  // group | name | fc | profit
let recipeGroup  = 'all';    // all | hot | tea | cold

let _mvdId = null;

const _matPriceBeforeEdit = {}; // key → цена до начала редактирования

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

let _supplierEditKey = null;
let _supplierFromList = false;
let _supBookEditId = null;
let supListSearch = '';
let supListFilter = 'all';

// ════════════════════════════════════════════════════════════════════
//  TAB NAVIGATION
// ════════════════════════════════════════════════════════════════════

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
//  EXPOSE GLOBALS FOR ES MODULES (src/*)
//  Должно быть ДО INIT чтобы src/-функции (loadLocIndex и др.) читали
//  актуальные ссылки на объекты (Loc, S, MAT, SEMI...).
// ════════════════════════════════════════════════════════════════════
Object.assign(window, {
  SEMI,
  // Render-стейт вкладки Рецептуры
  recipeSort, recipeGroup, recipeSearch,
  // Служебные
  dirty, activeTab, searchQuery, sortState,
  nextDrinkId, nextSemiId, nextMatKey,
  // const-переменные, нужные render-модулям
  _wif, EMP_TYPE_LABELS,
  // Ключи локаций
  LOC_INDEX_KEY, LOC_ACTIVE_KEY, LOC_DATA_PREFIX, OLD_STATE_KEY,
  // Хелперы локаций (нужны src/ui/locations.js)
  locDataKey, resetGlobalsToBase,
});

// ════════════════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════════════════
// Восстанавливаем сохранённое состояние
loadLocIndex();
// Миграция со старого формата (mbs_coffee_s) → loc_default
if (!Loc.list.length) {
  try {
    if (localStorage.getItem(OLD_STATE_KEY)) migrateOldState();
  } catch(e) {}
}
// Если всё ещё нет локаций — создаём дефолтную
if (!Loc.list.length) {
  Loc.list = [{ id: 'loc_default', name: 'Моя кофейня', icon: '☕' }];
  Loc.activeId = 'loc_default';
  saveLocIndex();
}
if (!Loc.activeId) { Loc.activeId = Loc.list[0].id; saveLocIndex(); }
loadState();
// Синхронизируем примитивные счётчики — store.js мог обновить window.*
if ((window.nextDrinkId || 0) > nextDrinkId) nextDrinkId = window.nextDrinkId;
if ((window.nextSemiId  || 0) > nextSemiId)  nextSemiId  = window.nextSemiId;
try { renderLocSwitcherUI(); } catch(e) { console.error('[renderLocSwitcherUI]', e); }
try {
  if (localStorage.getItem('mbs_theme') === 'dark') {
    document.body.classList.add('dark');
    const icon = document.getElementById('theme-icon');
    if (icon) icon.setAttribute('data-lucide', 'sun');
  }
  // Онбординг при первом визите
  if (!localStorage.getItem('mbs_onboard')) {
    document.getElementById('onboarding').style.display = 'block';
  }
} catch(e) {}

// Рендерим только активную вкладку — остальные лениво по требованию
Object.keys(dirty).forEach(k => dirty[k] = true);
switchTab(activeTab);
if (window.lucide) lucide.createIcons();

// Tooltip: единый div#tip-box, следует за курсором — без CSS ::after и race condition
(function() {
  const box = document.getElementById('tip-box');
  if (!box) return;
  let currentEl = null;

  function show(el, cx, cy) {
    if (currentEl !== el) {
      currentEl = el;
      box.textContent = el.dataset.tip;
      box.classList.remove('tip-visible');
      box.style.left = '-9999px';
      box.style.top  = '-9999px';
    }
    // позиционируем по курсору
    const bw = box.offsetWidth  || 240;
    const bh = box.offsetHeight || 40;
    const gap = 14;
    const ty = (window.innerHeight - cy < bh + gap + 16)
      ? cy - bh - gap
      : cy + gap;
    const tx = Math.max(8, Math.min(cx - bw / 2, window.innerWidth - bw - 8));
    box.style.left = tx + 'px';
    box.style.top  = ty + 'px';
    box.classList.add('tip-visible');
  }

  function hide() {
    currentEl = null;
    box.classList.remove('tip-visible');
  }

  document.addEventListener('pointermove', e => {
    const el = e.target.closest('[data-tip]');
    if (el && el.dataset.tip) show(el, e.clientX, e.clientY);
    else hide();
  });
  document.addEventListener('pointerleave', hide);
  document.addEventListener('pointerdown',  hide);
  document.addEventListener('scroll', hide, true);
})();

// Выделяем содержимое поля только при Tab-навигации (не при клике/спиннере)
let _kbNav = false;
document.addEventListener('keydown',   () => { _kbNav = true;  }, true);
document.addEventListener('mousedown', () => { _kbNav = false; }, true);
document.addEventListener('focus', e => {
  if (e.target.matches('.inp') && _kbNav) e.target.select();
}, true);

// На мобильных: при тапе по любому input/textarea — курсор в конец
if ('ontouchstart' in window) {
  document.addEventListener('focus', e => {
    const el = e.target;
    if (!el.matches('input, textarea') || _kbNav) return;
    const val = el.value;
    const origType = el.type;
    // type="number" не поддерживает setSelectionRange на iOS — временно меняем на text
    if (origType === 'number') {
      el.type = 'text';
    }
    requestAnimationFrame(() => {
      try {
        const len = el.value.length;
        el.setSelectionRange(len, len);
      } catch(_) {}
      if (origType === 'number') {
        el.type = 'number';
        el.value = val;
      }
    });
  }, true);
}

