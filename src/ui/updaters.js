// src/ui/updaters.js
// Обработчики изменения состояния: цены, порции, финмодель

import { _matPriceBeforeEdit } from '../state/ui-state.js';
import { SALES_PRESETS } from '../data/constants.js';
import { canAccessTab, firstAllowedTab, requireWorkspaceOwner } from './auth.js';
import { isAuthorMode } from '../access/author-layer.js';
import { syncUrlForTab } from '../access/app-routes.js';
import { renderSettings } from '../render/settings.js';
import { renderWorkspace } from '../render/workspace.js';

export function renderTab(tab) {
  try {
    if      (tab === 'workspace') renderWorkspace();
    else if (tab === 'dashboard') { window.renderDashboard(); if (window.lucide) window.lucide.createIcons(); window.initTop10Collapse(); return; }
    else if (tab === 'cost')      window.renderCost();
    else if (tab === 'sales')     window.renderSales();
    else if (tab === 'finmodel')  window.renderFinModel();
    else if (tab === 'recipes')   window.renderRecipes();
    else if (tab === 'authorProfile') window.renderAuthorProfile();
    else if (tab === 'settings') window.renderSettings ? window.renderSettings() : renderSettings();
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
  window.logWorkspaceActivity?.('sales_changed', 'sales_preset', key, `Применён пресет продаж «${key}»`);
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

const ADDON_SALE_PRESETS = {
  bakery:  { name: 'Выпечка', category: 'bakery', type: 'resale', mode: 'attach', price: 190, cost: 95, attachPct: 18 },
  dessert: { name: 'Десерт', category: 'dessert', type: 'resale', mode: 'attach', price: 260, cost: 120, attachPct: 8 },
  food:    { name: 'Сэндвич', category: 'food', type: 'resale', mode: 'attach', price: 390, cost: 210, attachPct: 6 },
  impulse: { name: 'Импульс', category: 'impulse', type: 'resale', mode: 'units', price: 120, cost: 55, unitsPerDay: 5 },
};

const ADDON_SALES_PACKS = {
  none: [],
  bakery: [
    { ...ADDON_SALE_PRESETS.bakery },
  ],
  showcase: [
    { ...ADDON_SALE_PRESETS.bakery },
    { ...ADDON_SALE_PRESETS.dessert },
    { ...ADDON_SALE_PRESETS.impulse },
  ],
  kitchen: [
    { ...ADDON_SALE_PRESETS.bakery, attachPct: 20 },
    { ...ADDON_SALE_PRESETS.dessert, attachPct: 10 },
    { ...ADDON_SALE_PRESETS.food, attachPct: 12 },
  ],
  kiosk: [
    { ...ADDON_SALE_PRESETS.bakery, attachPct: 12 },
    { ...ADDON_SALE_PRESETS.impulse, unitsPerDay: 8 },
  ],
};

function _nextAddonSaleId() {
  const rows = Array.isArray(window.S.addonSales) ? window.S.addonSales : [];
  return rows.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

export function addAddonSale(kind = 'bakery') {
  if (!Array.isArray(window.S.addonSales)) window.S.addonSales = [];
  const preset = ADDON_SALE_PRESETS[kind] || ADDON_SALE_PRESETS.bakery;
  window.S.addonSales.push({
    id: _nextAddonSaleId(),
    name: preset.name,
    category: preset.category,
    type: preset.type,
    mode: preset.mode,
    price: preset.price,
    cost: preset.cost,
    unitsPerDay: preset.unitsPerDay || 0,
    attachPct: preset.attachPct || 0,
    qtyPerCheck: 1,
  });
  if (window.dirty) window.dirty.finmodel = true;
  window.renderSales();
  window.saveState();
  window.logWorkspaceActivity?.('sales_changed', 'addon_sale', kind, 'Добавлена дополнительная продажа');
  if (window.lucide) window.lucide.createIcons();
}

export function applyAddonSalesPreset(key) {
  const pack = ADDON_SALES_PACKS[key];
  if (!pack) return;
  let nextId = 1;
  window.S.addonSales = pack.map(item => ({
    id: nextId++,
    name: item.name,
    category: item.category,
    type: item.type,
    mode: item.mode,
    price: item.price,
    cost: item.cost,
    unitsPerDay: item.unitsPerDay || 0,
    attachPct: item.attachPct || 0,
    qtyPerCheck: 1,
  }));
  if (!window.S.salesMeta) window.S.salesMeta = { checksPerDay: 0, addonFilter: 'all' };
  window.S.salesMeta.addonFilter = 'all';
  if (window.dirty) window.dirty.finmodel = true;
  window.renderSales();
  window.saveState();
  window.logWorkspaceActivity?.('sales_changed', 'addon_sales_preset', key, `Применён пресет доп. продаж «${key}»`);
  if (window.lucide) window.lucide.createIcons();
}

export function setAddonFilter(cat) {
  if (!window.S.salesMeta) window.S.salesMeta = { checksPerDay: 0, addonFilter: 'all' };
  window.S.salesMeta.addonFilter = cat || 'all';
  window.renderSales();
  window.saveState();
  if (window.lucide) window.lucide.createIcons();
}

export function scrollToAddonSales() {
  const el = document.getElementById('sales-addon-block');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function onSalesChecksPerDay(v) {
  const n = Number(v);
  if (!window.S.salesMeta) window.S.salesMeta = { checksPerDay: 0, addonFilter: 'all' };
  window.S.salesMeta.checksPerDay = Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
  if (window.dirty) window.dirty.finmodel = true;
  markDirtyDebounce();
  window.saveState();
}

export function onAddonSale(id, field, value, keepFocus = false) {
  const row = (window.S.addonSales || []).find(item => Number(item.id) === Number(id));
  if (!row) return;
  if (['name', 'category', 'type', 'mode'].includes(field)) {
    row[field] = String(value || '').trim() || (field === 'mode' ? 'attach' : field === 'type' ? 'resale' : 'other');
    if (field === 'mode' && row.mode !== 'units') row.mode = 'attach';
  } else {
    const n = Number(value);
    row[field] = Number.isFinite(n) ? Math.max(0, n) : 0;
  }
  if (window.dirty) window.dirty.finmodel = true;
  if (keepFocus) {
    if (window.dirty) window.dirty.sales = true;
    clearTimeout(window._renderTimer);
  } else {
    markDirtyDebounce();
  }
  window.saveState();
  window.clearTimeout(window._workspaceAddonLogTimer);
  window._workspaceAddonLogTimer = window.setTimeout(() => window.logWorkspaceActivity?.('sales_changed', 'addon_sale', id, `Изменена дополнительная продажа «${row.name || ''}»`), 1200);
}

export function deleteAddonSale(id) {
  window.S.addonSales = (window.S.addonSales || []).filter(item => Number(item.id) !== Number(id));
  if (window.dirty) window.dirty.finmodel = true;
  window.renderSales();
  window.saveState();
  window.logWorkspaceActivity?.('sales_changed', 'addon_sale', id, 'Удалена дополнительная продажа');
  if (window.lucide) window.lucide.createIcons();
}

export function onFixedCost(i, v) {
  const n = parseFloat(v);
  if (n >= 0) {
    window.S.fixedCosts[i].value = n;
    window.clearTimeout(window._workspaceFinLogTimer);
    window._workspaceFinLogTimer = window.setTimeout(() => window.logWorkspaceActivity?.('finmodel_changed', 'fixed_cost', i, 'Изменены постоянные расходы'), 1200);
    markDirtyDebounce();
  }
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
  if (!requireWorkspaceOwner('Сброс всех цен и финансовых полей доступен только владельцу проекта.')) return;
  window.showConfirm('Сбросить все цены и количества к исходным значениям этой точки?', () => {
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
    S.salesMeta = { checksPerDay: 0, addonFilter: 'all' };
    S.addonSales = [];
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
    window.logWorkspaceActivity?.('workspace_reset', 'workspace', window.getActiveWorkspaceId?.() || '', 'Владелец выполнил полный сброс параметров точки', { action: 'reset_all' });
    window.renderActive();
  }, { icon: '🔄', okText: 'Сбросить', danger: false });
}

export function switchTab(tab, opts = {}) {
  if (window.activeTab === 'workspace' && tab !== 'workspace') {
    window.workspaceFlushNoteAutosave?.();
  }
  const canOpenTab = isAuthorMode() ? ['cost', 'recipes', 'authorProfile'].includes(tab) : canAccessTab(tab);
  if (!canOpenTab) {
    const fallback = isAuthorMode() ? 'recipes' : firstAllowedTab();
    if (!fallback || fallback === tab) return;
    tab = fallback;
  }
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.mobile-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.body.classList.add('app-hide-footer');
  window.activeTab = tab;
  const tabEl = document.getElementById('tab-' + tab);
  if (tabEl) tabEl.classList.add('active');
  if (window.dirty && window.dirty[tab]) { renderTab(tab); window.dirty[tab] = false; }
  try { localStorage.setItem('mbs_active_tab', tab); } catch(e) {}
  syncUrlForTab(tab, { replace: !!opts.replaceUrl });
}
