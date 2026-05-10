// src/ui/updaters.js
// Обработчики изменения состояния: цены, порции, финмодель

import { _matPriceBeforeEdit } from '../state/ui-state.js';
import { SALES_PRESETS } from '../data/constants.js';

export function renderTab(tab) {
  try {
    if      (tab === 'dashboard') { window.renderDashboard(); if (window.lucide) window.lucide.createIcons(); window.initTop10Collapse(); return; }
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
  if (!Object.prototype.hasOwnProperty.call(_matPriceBeforeEdit, key)) {
    _matPriceBeforeEdit[key] = window.S.prices[key];
  }
}

export function onMatPriceInput(key, v) {
  const n = parseFloat(v);
  if (!(n > 0)) return;
  window.S.prices[key] = n;
}

export function onMatPriceCommit(key, v) {
  const n = parseFloat(v);
  if (!(n > 0)) return;
  window.S.prices[key] = n;
  const old = _matPriceBeforeEdit[key];
  if (old !== undefined && old !== n) {
    if (!Array.isArray(window.S.priceLog)) window.S.priceLog = [];
    window.S.priceLog.push({ matKey: key, oldPrice: old, newPrice: n, date: new Date().toISOString() });
    if (window.S.priceLog.length > 500) window.S.priceLog = window.S.priceLog.slice(-500);
  }
  delete _matPriceBeforeEdit[key];
  markDirtyDebounce();
}

export function onMatPrice(key, v) { onMatPriceInput(key, v); }

export function onSalePrice(id, v) {
  const n = parseFloat(v);
  if (n > 0) { window.S.salePrices[id] = n; markDirtyDebounce(); }
}

function _syncTargetFCInputs(val) {
  const v = Math.round(val * 100);
  ['kpi-target-fc', 'dash-target-fc'].forEach(id => {
    const el = document.getElementById(id);
    if (el && el !== document.activeElement) el.value = v;
  });
}

export function onTargetFCSilent(v) {
  const n = parseFloat(v) / 100;
  if (n > 0 && n < 1) { window.S.targetFC = n; _syncTargetFCInputs(n); }
}

export function onTargetFC(v) {
  const n = parseFloat(v) / 100;
  if (n > 0 && n < 1) { window.S.targetFC = n; _syncTargetFCInputs(n); markDirtyDebounce(); }
}

export function onPortions(id, v) {
  const n = parseInt(v);
  if (n >= 0) {
    window.S.portions[id] = n;
    if (window.dirty) window.dirty.finmodel = true;
    markDirtyDebounce();
  }
}

export function onDays(v) {
  const n = parseInt(v);
  if (n > 0) {
    window.S.days = n;
    if (window.dirty) window.dirty.finmodel = true;
    markDirtyDebounce();
  }
}

export function applySalesPreset(key) {
  const preset = SALES_PRESETS[key];
  if (!preset) return;
  window.S.activePreset = key;
  const baseIds = new Set(window.DRINKS.map(d => d.id));
  Object.entries(preset.portions).forEach(([id, val]) => {
    if (baseIds.has(Number(id))) window.S.portions[Number(id)] = val;
  });
  if (window.dirty) window.dirty.finmodel = true;
  window.renderSales();
  window.saveState();
  if (window.lucide) window.lucide.createIcons();
}

export function scaleSalesPortions(factor) {
  Object.keys(window.S.portions).forEach(id => {
    window.S.portions[Number(id)] = Math.max(0, Math.round(window.S.portions[Number(id)] * factor));
  });
  if (window.dirty) window.dirty.finmodel = true;
  window.renderSales();
  window.saveState();
  if (window.lucide) window.lucide.createIcons();
}

export function onFixedCost(i, v) {
  const n = parseFloat(v);
  if (n >= 0) { window.S.fixedCosts[i].value = n; markDirtyDebounce(); }
}

export function onFixedCostName(i, v) {
  if (v.trim()) { window.S.fixedCosts[i].name = v.trim(); window.saveState(); }
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
