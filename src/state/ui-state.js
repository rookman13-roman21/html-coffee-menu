// ════════════════════════════════════════════════════════════════════
//  src/state/ui-state.js — UI runtime state
//  Все переменные-состояния, ранее жившие в public/app.js
// ════════════════════════════════════════════════════════════════════

// ─── Редактирование ингредиентов / п/ф ───────────────────────────
export let _editMatKey = null;
export let _pendingMatSelectEl     = null;
export let _pendingSemiMatSelectEl = null;

// ─── Сортировка, поиск, debounce ────────────────────────────────
export let searchQuery  = '';
export let _renderTimer = null;

// ─── Флаги "нужен ре-рендер" (объект — мутируется по ссылке) ────
export const dirty = { workspace:true, dashboard:true, cost:true, sales:true, finmodel:true, recipes:true, authorProfile:true, settings:true };

// ─── Состояние сортировки таблицы напитков / продаж ─────────────
export const sortState      = { col: 'profit', dir: 'desc' };
export const salesSortState = { col: 'name',   dir: 'asc'  };
export let   salesSearch    = '';

// ─── Состояние вкладки Cost (категории / свёрнутость) ───────────
export let _matActiveCat  = 'all';
export let _matCollapsed  = {};
export let _semiCollapsed = {};
export let _semiSectionCollapsed = false;
export let _supCollapsed  = false;
export let _ingCollapsed  = false;

// ─── Рецепты ─────────────────────────────────────────────────────
export let recipeSearch = '';
export let recipeSort   = 'group';
export let recipeGroup  = 'all';

// ─── Просмотр техкарты + редактор FC ────────────────────────────
export let _mvdId = null;
export const _matPriceBeforeEdit = {};
export let _fceIdx = -1;

// ─── Зарплата — настройки по умолчанию ──────────────────────────
export const PS_DEFAULTS = { mrot: 22440, ndfl: 13, ins: 30 };

// ─── Категоризация сырья ─────────────────────────────────────────
export const MAT_CATEGORY = {
  coffee:'coffee', filter_coffee:'coffee',
  milk:'dairy', cream:'dairy',
  cocoa:'other', matcha:'tea', tea:'tea',
  sugar:'sugar', sugar_van:'sugar', sugar_org:'sugar',
  cup250:'pack', cup350:'pack', cup450:'pack', cup_p300:'pack', cup_p500:'pack',
  orange:'other', tonic:'other', lime:'other',
};
export const CAT_LABELS = {
  all:'Все', coffee:'Зерно', dairy:'Молочное', tea:'Чай/Матча',
  sugar:'Сахар', pack:'Упаковка', other:'Прочее', nomat:'Без сырья',
};

// ─── Поставщики ──────────────────────────────────────────────────
export let _supplierEditKey  = null;
export let _supplierFromList = false;
export let _supBookEditId    = null;
export let supListSearch     = '';
export let supListFilter     = 'all';
export let _supQuickKey = null;
export let _supQuickEl  = null;

// ─── Dirty-tracking модалов ──────────────────────────────────────
export const _EDITABLE_MODALS = new Set([
  'modal-drink', 'modal-semi', 'modal-mat',
  'modal-supplier', 'modal-supplier-book', 'modal-loc',
]);
export const _dirtyModalSet = new Set();
