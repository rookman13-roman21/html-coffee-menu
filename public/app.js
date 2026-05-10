let nextDrinkId = 27; // auto-increment id for new drinks
let nextMatKey  = 1;  // suffix for custom mat keys
let _editMatKey = null;
let _pendingMatSelectEl     = null; // select в строке рецепта напитка, откуда открыли «создать ингредиент»
let _pendingSemiMatSelectEl = null; // select в строке п/ф, откуда открыли «создать ингредиент»

// ─── Полуфабрикаты ───────────────────────────────────────────────
// { id, name, unit:'мл'|'г'|'шт', yield: number, process:'', recipe:[{mat,amt,loss?}] }
let SEMI = [];
let nextSemiId = 1;
// ═══════════════════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════════════════
const DEFAULTS = {
  prices:     Object.fromEntries(Object.entries(MAT).map(([k,v])=>[k,v.price])),
  salePrices: Object.fromEntries(DRINKS.map(d=>[d.id, d.price])),
  portions:   Object.fromEntries(DRINKS.map(d=>[d.id, 10])),
};

const S = {
  prices:     {...DEFAULTS.prices},
  salePrices: {...DEFAULTS.salePrices},
  portions:   {...DEFAULTS.portions},
  days:       30,
  targetFC:   0.25,
  fixedCosts: FIXED_COSTS_DEF.map(c=>({...c})),
  taxMode:    'none',
  investment: 0,
  payroll:    { rate: 250, hours: 12, shifts: 30, count: 2 }, // legacy
  payrollPositions: [
    { id:1, name:'Управляющий',   rate:400, hours:12, shifts:22, count:1, empType:'white' },
    { id:2, name:'Шеф-бариста', rate:350, hours:10, shifts:22, count:1, empType:'grey'  },
    { id:3, name:'Бариста',       rate:250, hours:10, shifts:22, count:2, empType:'black' },
  ],
  payrollSettings: { mrot: 22440, ndfl: 13, ins: 30 },
  payrollSettingsOpen: false,
  seasonality: [1,1,1,1,1,1,1,1,1,1,1,1], // Янв-Дек: множитель выручки/объёма
  seasonalityOpen: false,
  suppliers: {
    coffee:        { name: 'Rockets.coffee',  phone: '+7 925 386-74-20', note: '', site: 'https://b2b.rockets.coffee' },
    filter_coffee: { name: 'Rockets.coffee',  phone: '+7 925 386-74-20', note: '', site: 'https://b2b.rockets.coffee' },
    tonic:         { name: 'Rocket Tonic',    phone: '+7 800 201-79-69', note: '', site: 'https://rocket-tonic.com' },
    cocoa:         { name: 'Unicava',         phone: '+7 922 027-11-17', note: '', site: 'https://cacava-opt.ru' },
    milk:          { name: 'Петмол',          phone: '+7 999 233-30-04', note: '', site: 'https://mypetmol.ru' },
    cream:         { name: 'Петмол',          phone: '+7 999 233-30-04', note: '', site: 'https://mypetmol.ru' },
  },
  supplierBook: [
    { id:1, name: 'Rockets.coffee', phone: '+7 925 386-74-20', note: 'Зерно для эспрессо, фильтр-кофе, чай, матча и др.', site: 'https://b2b.rockets.coffee/' },
    { id:2, name: 'Tasty coffee',   phone: '+7 800 333-49-80', note: 'Зерно эспрессо и фильтр-кофе',                   site: 'https://shop.tastycoffee.ru/' },
    { id:3, name: 'Rocket Tonic',   phone: '+7 800 201-79-69', note: 'Безалкогольные тоники разных вкусов',                site: 'https://rocket-tonic.com/' },
    { id:4, name: 'Unicava',        phone: '+7 922 027-11-17', note: 'Bean to Bar шоколад и какао на максималках',         site: 'https://www.cacava-opt.ru/' },
    { id:5, name: 'Петмол',         phone: '+7 999 233-30-04', note: 'Молоко и сливки для бариста',                   site: 'https://mypetmol.ru/' },
    { id:6, name: 'Вкусов Лаб',     phone: '+7 965 342-88-99',  note: 'Аутентичные пряности, перец, соль и сахар премиального качества со всего мира.', site: 'https://vkusovlab.ru' },
    { id:7, name: 'Planto',         phone: '+7 800 100-02-01',  note: 'Напитки на растительной основе для бариста',       site: 'https://logikamoloka.ru/beverages/' },
  ], // [ { id, name, phone, note, site } ] — справочник без привязки
  priceLog:      [], // [{ matKey, oldPrice, newPrice, date }]
};

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
const Loc = { list: [], activeId: null };
const LOC_INDEX_KEY  = 'mbs_locations';
const LOC_ACTIVE_KEY = 'mbs_active_loc';
const LOC_DATA_PREFIX= 'mbs_loc_';
const OLD_STATE_KEY  = 'mbs_coffee_s';



// ════════════════════════════════════════════════════════════════════
//  PERSIST & THEME  (saveState / loadState / toggleTheme / toggleBurger удалены → src/)
// ════════════════════════════════════════════════════════════════════
// Закрывать бургер при клике на нав-кнопку
document.addEventListener('click', e => {
  if (e.target.matches('.nav-btn')) document.getElementById('main-nav').classList.remove('open');
});

// ════════════════════════════════════════════════════════════════════
//  ONBOARDING
// ════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════
//  MODAL HELPERS
// ════════════════════════════════════════════════════════════════════

// ─── Защита от потери данных при случайном закрытии модала ──────────
const _EDITABLE_MODALS = new Set([
  'modal-drink','modal-semi','modal-mat',
  'modal-supplier','modal-supplier-book','modal-loc'
]);
const _dirtyModalSet = new Set();

// Показывает кастомный мини-диалог поверх модала (по центру экрана)

// Делегированный слушатель: любое изменение в открытом модале → dirty
document.addEventListener('input',  e => { const m = e.target.closest('.modal-bg'); if (m) _markModalDirty(m.id); }, true);
document.addEventListener('change', e => { const m = e.target.closest('.modal-bg'); if (m) _markModalDirty(m.id); }, true);

// Клик по подложке (не по контенту модала) → safeClose
document.addEventListener('click', e => {
  if (!e.target.classList.contains('modal-bg')) return;
  safeCloseModal(e.target.id);
});

// Заполняем дропдаун книжки поставщиков в modal-mat

// Быстрая замена поставщика прямо из карточки сырья
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

// ════════════════════════════════════════════════════════════════════
//  ADD/EDIT DRINK MODAL
// ════════════════════════════════════════════════════════════════════
// Значение select для MAT: "mat:coffee", для SEMI: "semi:5"

// ── Изображение полуфабриката ───────────────────────────────────

// ════════════════════════════════════════════════════════════════════
//  ADD MATERIAL MODAL
// ════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════
//  SEMI-FINISHED PRODUCTS CRUD
// ════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════
//  RENDER — DASHBOARD
// ════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════
//  RENDER — COST CALCULATOR
// ════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════
//  RENDER — SALES PLAN
// ════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════
//  RENDER — FINANCIAL MODEL
// ════════════════════════════════════════════════════════════════════
  const shift = parseInt(v);
  const el = document.getElementById('whatif-pct');
  if (el) el.textContent = (shift >= 0 ? '+' : '') + shift + '%';
  const res = document.getElementById('whatif-result');
  if (!res) return;
  const mult = 1 + shift / 100;
  const drinks = enrich();
  const bepBase = bepCalc(drinks);
  const totalFixed = bepBase.totalFixed;
  const taxMode = S.taxMode || 'none';
  function calcTax(rev, varC, fixed) {
    if (taxMode === 'usn6')  return rev * 0.06;
    if (taxMode === 'usn15') return Math.max(0, (rev - varC - fixed) * 0.15);
    return 0;
  }
  const totRev2 = drinks.reduce((s,d) => s + S.salePrices[d.id] * mult * S.portions[d.id], 0) * S.days;
  const varCosts2 = drinks.reduce((s,d) => s + d.cost * S.portions[d.id], 0) * S.days;
  const net2 = totRev2 - varCosts2 - totalFixed - calcTax(totRev2, varCosts2, totalFixed);
  const avgPrice2 = drinks.length > 0 ? totRev2 / (drinks.reduce((s,d)=>s+S.portions[d.id],0)*S.days||1) : 0;
  const newFC = totRev2 > 0 ? varCosts2 / totRev2 : 0;
  const newBEP = (1 - newFC) > 0 ? totalFixed / (1 - newFC) : 0;
  const netClr = net2 >= 0 ? 'var(--green)' : 'var(--red)';
  res.innerHTML = [
    `<div style="flex:1;min-width:130px;background:var(--gray);border-radius:9px;padding:10px 13px">
      <div style="font-size:10px;font-weight:700;color:var(--muted);margin-bottom:3px">Средний чек</div>
      <div style="font-weight:800;font-size:17px">${rub(avgPrice2)}</div></div>`,
    `<div style="flex:1;min-width:130px;background:var(--gray);border-radius:9px;padding:10px 13px">
      <div style="font-size:10px;font-weight:700;color:var(--muted);margin-bottom:3px">FC%</div>
      <div style="font-weight:800;font-size:17px">${pct(newFC)}</div></div>`,
    `<div style="flex:1;min-width:130px;background:var(--gray);border-radius:9px;padding:10px 13px">
      <div style="font-size:10px;font-weight:700;color:var(--muted);margin-bottom:3px">Выручка ТБУ</div>
      <div style="font-weight:800;font-size:17px">${rub(newBEP)}</div></div>`,
    `<div style="flex:1;min-width:130px;background:var(--gray);border-radius:9px;padding:10px 13px">
      <div style="font-size:10px;font-weight:700;color:var(--muted);margin-bottom:3px">Чистая прибыль</div>
      <div style="font-weight:800;font-size:17px;color:${netClr}">${rub(net2)}</div></div>`,
  ].join('');
}

// ════════════════════════════════════════════════════════════════════
//  RENDER — RECIPES
// ════════════════════════════════════════════════════════════════════
let recipeSearch = '';
let recipeSort   = 'group';  // group | name | fc | profit
let recipeGroup  = 'all';    // all | hot | tea | cold

let _mvdId = null;

// ─── Общий CSS для всех техкарт ────────────────────────────────────

// ════════════════════════════════════════════════════════════════════
//  STATE UPDATERS
// ════════════════════════════════════════════════════════════════════

// Вызывается на каждый oninput — только пересчитывает, не логирует
const _matPriceBeforeEdit = {}; // key → цена до начала редактирования

// Вызывается на onblur — логирует изменение только если значение действительно изменилось

// Устаревший alias для совместимости (на случай если где-то вызывается напрямую)

// ─── Пресеты и масштабирование плана продаж ──────────────────────

let _fceIdx = -1;

// ════════════════════════════════════════════════════════════════════
//  PAYROLL CALCULATOR
// ════════════════════════════════════════════════════════════════════
// Дефолтные значения налоговых ставок (используются при отсутствии настроек)
const PS_DEFAULTS = { mrot: 22440, ndfl: 13, ins: 30 };
// Возвращает текущие налоговые настройки (из S или дефолтные)

// ════════════════════════════════════════════════════════════════════
//  SUPPLIERS & PRICE HISTORY
// ════════════════════════════════════════════════════════════════════
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
//  TECH CARDS PDF (по ГОСТ Р 53105 / СанПиН)
// ════════════════════════════════════════════════════════════════════

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
  // Мутируемый стейт
  S, Loc, SEMI,
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

