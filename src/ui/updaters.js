// src/ui/updaters.js
// Обработчики изменения состояния: цены, порции, финмодель

export function markDirty() {
  return window.markDirty();
}

export function markDirtyDebounce() {
  return window.markDirtyDebounce();
}

export function renderActive() {
  return window.renderActive();
}

export function renderTab(tab) {
  return window.renderTab(tab);
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
  return window.flashCells();
}

export function resetAll() {
  return window.resetAll();
}

export function switchTab(tab) {
  return window.switchTab(tab);
}
