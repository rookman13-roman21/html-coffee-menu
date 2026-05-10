// src/ui/updaters.js
// Обработчики изменения состояния: цены, порции, финмодель

export function renderTab(tab) {
  try {
    if      (tab === 'dashboard') window.renderDashboard();
    else if (tab === 'cost')      window.renderCost();
    else if (tab === 'sales')     window.renderSales();
    else if (tab === 'finmodel')  window.renderFinModel();
    else if (tab === 'recipes')   window.renderRecipes();
    if (window.lucide) window.lucide.createIcons();
  } catch(e) {
    console.error('[renderTab ' + tab + ']', e);
  }
}

export function renderActive() {
  renderTab(window.activeTab);
  if (window.dirty) window.dirty[window.activeTab] = false;
}

export function markDirty() {
  if (window.dirty) Object.keys(window.dirty).forEach(k => window.dirty[k] = true);
  renderActive();
}

export function markDirtyDebounce() {
  if (window.dirty) Object.keys(window.dirty).forEach(k => window.dirty[k] = true);
  clearTimeout(window._renderTimer);
  window._renderTimer = setTimeout(() => renderActive(), 400);
}

export function onMatPriceFocus(key) {
  return window.onMatPriceFocus(key);
}

export function onMatPriceInput(key, v) {
  return window.onMatPriceInput(key, v);
}

export function onMatPriceCommit(key, v) {
  return window.onMatPriceCommit(key, v);
}

export function onMatPrice(key, v) {
  return window.onMatPrice(key, v);
}

export function onSalePrice(id, v) {
  return window.onSalePrice(id, v);
}

export function onTargetFCSilent(v) {
  return window.onTargetFCSilent(v);
}

export function onTargetFC(v) {
  return window.onTargetFC(v);
}

export function onPortions(id, v) {
  return window.onPortions(id, v);
}

export function onDays(v) {
  return window.onDays(v);
}

export function applySalesPreset(key) {
  return window.applySalesPreset(key);
}

export function scaleSalesPortions(factor) {
  return window.scaleSalesPortions(factor);
}

export function onFixedCost(i, v) {
  return window.onFixedCost(i, v);
}

export function onFixedCostName(i, v) {
  return window.onFixedCostName(i, v);
}

export function addFixedCost() {
  return window.addFixedCost();
}

export function addFixedCostInCat(cat) {
  return window.addFixedCostInCat(cat);
}

export function delFixedCost(i) {
  return window.delFixedCost(i);
}

export function onTaxMode(v) {
  return window.onTaxMode(v);
}

export function onInvestment(v) {
  return window.onInvestment(v);
}

export function openCostEditor(idx) {
  return window.openCostEditor(idx);
}

export function closeCostEditor() {
  return window.closeCostEditor();
}

export function saveCostEditor() {
  return window.saveCostEditor();
}

export function deleteCostFromEditor() {
  return window.deleteCostFromEditor();
}

export function toggleFcCat(cat) {
  return window.toggleFcCat(cat);
}

export function flashCells() {
  const tab = document.getElementById('tab-' + window.activeTab);
  if (!tab) return;
  tab.querySelectorAll('tbody td:not(:first-child), .kpi-value').forEach(el => {
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  });
}

export function resetAll() {
  if (!confirm('Сбросить все цены и количества к исходным значениям этой точки?')) return;
  const S = window.S;
  const DEFAULTS = window.DEFAULTS;
  const FIXED_COSTS_DEF = window.FIXED_COSTS_DEF;
  const DRINKS = window.DRINKS;
  const DRINKS_ORIG = window.DRINKS_ORIG;
  const BASE_MAT_KEYS = window.BASE_MAT_KEYS;
  const MAT = window.MAT;
  Object.assign(S.prices,     DEFAULTS.prices);
  Object.assign(S.salePrices, DEFAULTS.salePrices);
  Object.assign(S.portions,   DEFAULTS.portions);
  S.days = 30; S.targetFC = 0.25;
  S.fixedCosts = FIXED_COSTS_DEF.map(c=>({...c}));
  S.taxMode = 'none'; S.investment = 0;
  S.payroll   = { rate: 250, hours: 12, shifts: 30, count: 2 };
  S.payrollPositions = [
    { id:1, name:'Управляющий',   rate:400, hours:12, shifts:22, count:1, empType:'white' },
    { id:2, name:'Шеф-бариста', rate:350, hours:10, shifts:22, count:1, empType:'grey'  },
    { id:3, name:'Бариста',       rate:250, hours:10, shifts:22, count:2, empType:'black' },
  ];
  S.payrollSettings = { mrot: 22440, ndfl: 13, ins: 30 };
  S.payrollSettingsOpen = false;
  S.fixedHintOpen = false;
  S.seasonality = [1,1,1,1,1,1,1,1,1,1,1,1];
  S.seasonalityOpen = false;
  S.suppliers = {};
  S.priceLog  = [];
  for (let i = DRINKS.length - 1; i >= 0; i--) {
    if (DRINKS[i].custom) DRINKS.splice(i, 1);
    else if (DRINKS[i].modified) {
      const orig = DRINKS_ORIG.find(o => o.id === DRINKS[i].id);
      if (orig) DRINKS[i] = {...orig, recipe: orig.recipe.map(r=>({...r}))};
    }
  }
  Object.keys(MAT).forEach(k => { if (!BASE_MAT_KEYS.has(k)) delete MAT[k]; });
  window.saveState();
  window.searchQuery = '';
  Object.keys(window.dirty).forEach(k=>window.dirty[k]=true);
  window.renderActive();
}

export function switchTab(tab) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.mobile-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  window.activeTab = tab;
  const tabEl = document.getElementById('tab-' + tab);
  if (tabEl) tabEl.classList.add('active');
  if (window.dirty && window.dirty[tab]) { renderTab(tab); window.dirty[tab] = false; }
  try { localStorage.setItem('mbs_active_tab', tab); } catch(e) {}
}
