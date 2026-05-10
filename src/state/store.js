// ════════════════════════════════════════════════════════════════════
//  src/state/store.js  —  State + persistence
// ════════════════════════════════════════════════════════════════════

import { MAT, MAT_ORIG, BASE_MAT_KEYS }            from '../data/mat.js';
import { DRINKS, DRINKS_ORIG, BASE_DRINK_IDS }      from '../data/drinks.js';
import { FIXED_COSTS_DEF }                          from '../data/constants.js';

// ─── Ключи localStorage ─────────────────────────────────────────────
export const LOC_INDEX_KEY  = 'mbs_locations';
export const LOC_ACTIVE_KEY = 'mbs_active_loc';
export const LOC_DATA_PREFIX = 'mbs_loc_';
export const OLD_STATE_KEY  = 'mbs_coffee_s';
export const locDataKey = id => LOC_DATA_PREFIX + id;

// ─── Loc ────────────────────────────────────────────────────────────
export const Loc = { list: [], activeId: null };

// ─── Loc helpers ────────────────────────────────────────────────────
export function activeLoc() {
  return Loc.list.find(l => l.id === Loc.activeId) || null;
}

export function getOrgInfo() {
  const loc = activeLoc();
  return {
    name:    loc?.name    || 'Моя кофейня',
    address: loc?.address || '',
    inn:     loc?.inn     || '',
    phone:   loc?.phone   || '',
  };
}

export function loadLocIndex() {
  try {
    const raw = localStorage.getItem(LOC_INDEX_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length) Loc.list = arr;
    }
    const aid = localStorage.getItem(LOC_ACTIVE_KEY);
    if (aid && Loc.list.some(l => l.id === aid)) Loc.activeId = aid;
  } catch(e) {}
}

export function saveLocIndex() {
  try {
    localStorage.setItem(LOC_INDEX_KEY, JSON.stringify(Loc.list));
    if (Loc.activeId) localStorage.setItem(LOC_ACTIVE_KEY, Loc.activeId);
  } catch(e) {}
}

export function migrateOldState() {
  try {
    const old = localStorage.getItem(OLD_STATE_KEY);
    if (!old) return;
    if (localStorage.getItem(LOC_INDEX_KEY)) return;
    const id = 'loc_' + Date.now();
    Loc.list = [{ id, name: 'Моя кофейня' }];
    Loc.activeId = id;
    localStorage.setItem(LOC_DATA_PREFIX + id, old);
    localStorage.removeItem(OLD_STATE_KEY);
    saveLocIndex();
  } catch(e) {}
}

// ─── Дефолтные значения состояния ───────────────────────────────────
export const DEFAULTS = {
  prices:     Object.fromEntries(Object.entries(MAT).map(([k,v])=>[k,v.price])),
  salePrices: Object.fromEntries(DRINKS.map(d=>[d.id, d.price])),
  portions:   Object.fromEntries(DRINKS.map(d=>[d.id, 10])),
};

const _DEF_PAYROLL_POSITIONS = [
  { id:1, name:'Управляющий', rate:400, hours:12, shifts:22, count:1, empType:'white' },
  { id:2, name:'Шеф-бариста', rate:350, hours:10, shifts:22, count:1, empType:'grey'  },
  { id:3, name:'Бариста',     rate:250, hours:10, shifts:22, count:2, empType:'black' },
];
const _DEF_PAYROLL_SETTINGS = { mrot: 22440, ndfl: 13, ins: 30 };
const _DEF_SUPPLIERS = {
  coffee:        { name: 'Rockets.coffee',  phone: '+7 925 386-74-20', note: '', site: 'https://b2b.rockets.coffee' },
  filter_coffee: { name: 'Rockets.coffee',  phone: '+7 925 386-74-20', note: '', site: 'https://b2b.rockets.coffee' },
  tonic:         { name: 'Rocket Tonic',    phone: '+7 800 201-79-69', note: '', site: 'https://rocket-tonic.com' },
  cocoa:         { name: 'Unicava',         phone: '+7 922 027-11-17', note: '', site: 'https://cacava-opt.ru' },
  milk:          { name: 'Петмол',          phone: '+7 999 233-30-04', note: '', site: 'https://mypetmol.ru' },
  cream:         { name: 'Петмол',          phone: '+7 999 233-30-04', note: '', site: 'https://mypetmol.ru' },
};
const _DEF_SUPPLIER_BOOK = [
  { id:1, name: 'Rockets.coffee', phone: '+7 925 386-74-20', note: 'Зерно для эспрессо, фильтр-кофе, чай, матча и др.', site: 'https://b2b.rockets.coffee/' },
  { id:2, name: 'Tasty coffee',   phone: '+7 800 333-49-80', note: 'Зерно эспрессо и фильтр-кофе',                       site: 'https://shop.tastycoffee.ru/' },
  { id:3, name: 'Rocket Tonic',   phone: '+7 800 201-79-69', note: 'Безалкогольные тоники разных вкусов',                site: 'https://rocket-tonic.com/' },
  { id:4, name: 'Unicava',        phone: '+7 922 027-11-17', note: 'Bean to Bar шоколад и какао на максималках',         site: 'https://www.cacava-opt.ru/' },
  { id:5, name: 'Петмол',         phone: '+7 999 233-30-04', note: 'Молоко и сливки для бариста',                        site: 'https://mypetmol.ru/' },
  { id:6, name: 'Вкусов Лаб',     phone: '+7 965 342-88-99', note: 'Аутентичные пряности, перец, соль и сахар премиального качества со всего мира.', site: 'https://vkusovlab.ru' },
  { id:7, name: 'Planto',         phone: '+7 800 100-02-01', note: 'Напитки на растительной основе для бариста',         site: 'https://logikamoloka.ru/beverages/' },
];

// ─── Главный state ───────────────────────────────────────────────────
export const S = {
  prices:     {...DEFAULTS.prices},
  salePrices: {...DEFAULTS.salePrices},
  portions:   {...DEFAULTS.portions},
  days:       30,
  targetFC:   0.25,
  fixedCosts: FIXED_COSTS_DEF.map(c=>({...c})),
  taxMode:    'none',
  investment: 0,
  payroll:    { rate: 250, hours: 12, shifts: 30, count: 2 }, // legacy
  payrollPositions: _DEF_PAYROLL_POSITIONS.map(p=>({...p})),
  payrollSettings:  {..._DEF_PAYROLL_SETTINGS},
  payrollSettingsOpen: false,
  seasonality: [1,1,1,1,1,1,1,1,1,1,1,1],
  seasonalityOpen: false,
  suppliers:   JSON.parse(JSON.stringify(_DEF_SUPPLIERS)),
  supplierBook: _DEF_SUPPLIER_BOOK.map(s=>({...s})),
  priceLog:    [],
};

// ─── Сброс глобального стейта к базовым значениям ───────────────────
//     Вызывается при смене/создании/удалении локации
export function resetGlobalsToBase() {
  // Сбрасываем MAT in-place: удаляем кастомные, восстанавливаем оригинальные
  for (const k of Object.keys(MAT)) {
    if (!BASE_MAT_KEYS.has(k)) delete MAT[k];
  }
  for (const [k, v] of Object.entries(MAT_ORIG)) {
    MAT[k] = JSON.parse(JSON.stringify(v));
  }

  // Сбрасываем DRINKS in-place
  DRINKS.splice(0, DRINKS.length,
    ...DRINKS_ORIG.map(d => ({...d, recipe: d.recipe.map(r=>({...r}))}))
  );

  // Сбрасываем S
  S.prices     = {...DEFAULTS.prices};
  S.salePrices = {...DEFAULTS.salePrices};
  S.portions   = {...DEFAULTS.portions};
  S.days        = 30;
  S.targetFC    = 0.25;
  S.fixedCosts  = FIXED_COSTS_DEF.map(c=>({...c}));
  S.taxMode     = 'none';
  S.investment  = 0;
  S.payrollPositions  = _DEF_PAYROLL_POSITIONS.map(p=>({...p}));
  S.payrollSettings   = {..._DEF_PAYROLL_SETTINGS};
  S.payrollSettingsOpen = false;
  S.seasonality       = [1,1,1,1,1,1,1,1,1,1,1,1];
  S.seasonalityOpen   = false;
  S.suppliers         = JSON.parse(JSON.stringify(_DEF_SUPPLIERS));
  S.supplierBook      = _DEF_SUPPLIER_BOOK.map(s=>({...s}));
  S.priceLog          = [];

  // Сбрасываем счётчики (через window — они ещё в app.js)
  window.nextDrinkId = 27;
  window.nextSemiId  = 1;
  if (window.SEMI) window.SEMI.splice(0);
}

// ─── State persistence ───────────────────────────────────────────────
export function saveState() {
  if (!Loc.activeId) return;
  const SEMI = window.SEMI || [];
  const _wif = window._wif || { price: 0, cost: 0, traffic: 0 };
  try {
    localStorage.setItem(locDataKey(Loc.activeId), JSON.stringify({
      prices: S.prices, salePrices: S.salePrices, portions: S.portions,
      days: S.days, targetFC: S.targetFC, fixedCosts: S.fixedCosts,
      taxMode: S.taxMode, investment: S.investment,
      payrollPositions: S.payrollPositions,
      payrollSettings: S.payrollSettings, payrollSettingsOpen: S.payrollSettingsOpen,
      fixedHintOpen: S.fixedHintOpen,
      seasonality: S.seasonality, seasonalityOpen: S.seasonalityOpen,
      wif: { price: _wif.price, cost: _wif.cost, traffic: _wif.traffic },
      suppliers: S.suppliers, supplierBook: S.supplierBook, priceLog: S.priceLog,
      customDrinks: DRINKS.filter(d => d.custom),
      modifiedDrinks: DRINKS.filter(d => d.modified).map(d => ({
        id: d.id, name: d.name, group: d.group, vol: d.vol, recipe: d.recipe,
      })),
      drinkPatches: DRINKS.reduce((acc, d) => {
        const patch = {};
        if (d.image)    patch.image    = d.image;
        if (d.process)  patch.process  = d.process;
        if (d.videoUrl) patch.videoUrl = d.videoUrl;
        if (Object.keys(patch).length) acc[d.id] = patch;
        return acc;
      }, {}),
      customMats: Object.entries(MAT).filter(([,v]) => v.custom).map(([k,v]) => ({ key: k, ...v })),
      semiItems: SEMI,
    }));
  } catch(e) {}
}

export function loadState() {
  if (!Loc.activeId) return;
  const _wif = window._wif || { price: 0, cost: 0, traffic: 0 };
  try {
    const raw = localStorage.getItem(locDataKey(Loc.activeId));
    if (!raw) return;
    const sv = JSON.parse(raw);

    if (sv.prices)      Object.assign(S.prices, sv.prices);
    if (sv.salePrices)  Object.assign(S.salePrices, sv.salePrices);
    if (sv.portions)    Object.assign(S.portions, sv.portions);
    if (sv.days != null)     S.days = sv.days;
    if (sv.targetFC != null) S.targetFC = sv.targetFC;
    if (sv.fixedCosts) {
      S.fixedCosts = sv.fixedCosts;
      S.fixedCosts.forEach((c, i) => {
        if (!c.id) c.id = 1000 + i;
        if (!c.category) c.category = 'other';
      });
    }
    if (sv.taxMode)            S.taxMode    = sv.taxMode;
    if (sv.investment != null) S.investment = sv.investment;

    // Миграция со старого формата payroll
    if (sv.payroll && !sv.payrollPositions) {
      S.payrollPositions = [{
        id: 1, name: 'Бариста',
        rate: sv.payroll.rate || 250,
        hours: sv.payroll.hours || 12,
        shifts: sv.payroll.shifts || 30,
        count: sv.payroll.count || 2,
      }];
    }
    if (sv.payrollPositions) S.payrollPositions = sv.payrollPositions;
    if (sv.payrollSettings)  Object.assign(S.payrollSettings, sv.payrollSettings);
    if (sv.payrollSettingsOpen != null) S.payrollSettingsOpen = sv.payrollSettingsOpen;
    if (sv.fixedHintOpen != null)       S.fixedHintOpen = sv.fixedHintOpen;
    if (sv.seasonality)            S.seasonality = sv.seasonality;
    if (sv.seasonalityOpen != null) S.seasonalityOpen = sv.seasonalityOpen;

    if (sv.wif) {
      _wif.price   = sv.wif.price   || 0;
      _wif.cost    = sv.wif.cost    || 0;
      _wif.traffic = sv.wif.traffic || 0;
    }

    if (sv.suppliers    && Object.keys(sv.suppliers).length > 0) S.suppliers    = sv.suppliers;
    if (sv.supplierBook && sv.supplierBook.length > 0)           S.supplierBook = sv.supplierBook;

    // Миграция: добавляем системных поставщиков если их ещё нет в книге
    const _sysSuppliers = [
      { id:6, name:'Вкусов Лаб', phone:'+7 965 342-88-99', note:'Аутентичные пряности, перец, соль и сахар премиального качества со всего мира.', site:'https://vkusovlab.ru' },
      { id:7, name:'Planto',     phone:'+7 800 100-02-01', note:'Напитки на растительной основе для бариста', site:'https://logikamoloka.ru/beverages/' },
    ];
    _sysSuppliers.forEach(sys => {
      if (!S.supplierBook.find(b => b.name === sys.name)) {
        const maxId = S.supplierBook.reduce((m, b) => Math.max(m, b.id || 0), 0);
        S.supplierBook.push({ ...sys, id: Math.max(sys.id, maxId + 1) });
      }
    });
    // Миграция: обновляем телефоны/заметки
    const _phoneUpdates = { 'Вкусов Лаб': '+7 965 342-88-99', 'Planto': '+7 800 100-02-01' };
    S.supplierBook.forEach(b => { if (_phoneUpdates[b.name]) b.phone = _phoneUpdates[b.name]; });
    const _noteUpdates = {
      'Rockets.coffee': 'Зерно для эспрессо, фильтр-кофе, чай, матча и др.',
      'Rocket Tonic':   'Безалкогольные тоники разных вкусов',
      'Unicava':        'Bean to Bar шоколад и какао на максималках',
      'Петмол':         'Молоко и сливки для бариста',
    };
    S.supplierBook.forEach(b => { if (_noteUpdates[b.name]) b.note = _noteUpdates[b.name]; });

    if (sv.priceLog) S.priceLog = sv.priceLog;

    if (sv.customMats) {
      sv.customMats.forEach(m => {
        const { key, ...rest } = m;
        MAT[key] = { ...rest, custom: true };
        if (!S.prices[key]) S.prices[key] = rest.price;
      });
    }
    if (sv.customDrinks) {
      sv.customDrinks.forEach(d => {
        if (!DRINKS.find(x => x.id === d.id)) {
          DRINKS.push(d);
          if (window.nextDrinkId <= d.id) window.nextDrinkId = d.id + 1;
        }
        if (S.salePrices[d.id] == null) S.salePrices[d.id] = d.price;
        if (S.portions[d.id]   == null) S.portions[d.id]   = 5;
      });
    }
    if (sv.modifiedDrinks) {
      sv.modifiedDrinks.forEach(md => {
        const idx = DRINKS.findIndex(x => x.id === md.id);
        if (idx >= 0) DRINKS[idx] = { ...DRINKS[idx], name: md.name, group: md.group, vol: md.vol, recipe: md.recipe, modified: true };
      });
    }
    if (sv.drinkPatches) {
      Object.entries(sv.drinkPatches).forEach(([idStr, patch]) => {
        const idx = DRINKS.findIndex(x => x.id === Number(idStr));
        if (idx >= 0) DRINKS[idx] = { ...DRINKS[idx], ...patch };
      });
    }
    if (sv.semiItems && sv.semiItems.length > 0) {
      window.SEMI.splice(0, window.SEMI.length, ...sv.semiItems);
      window.nextSemiId = Math.max(...window.SEMI.map(s => s.id), 0) + 1;
    }
  } catch(e) {}
}
