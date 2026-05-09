// src/ui/ingredients.js
// Управление строками ингредиентов в модалке напитка

export function matOptions(selected)          { return window.matOptions(selected); }
export function _ingPlaceholder(val)          { return window._ingPlaceholder(val); }
export function _ingStep(val)                 { return window._ingStep(val); }
export function _onIngMatChange(selectEl)     { return window._onIngMatChange(selectEl); }
export function _calcIngRowCost(row)          { return window._calcIngRowCost(row); }
export function _updateIngRowCost(anyEl)      { return window._updateIngRowCost(anyEl); }
export function addIngRow(selected, amt, loss){ return window.addIngRow(selected, amt, loss); }
export function _searchClear(inp)             { return window._searchClear(inp); }
export function openSupQuickDrop(key, btnEl)  { return window.openSupQuickDrop(key, btnEl); }
export function _fillMatSupBookSelect()        { return window._fillMatSupBookSelect(); }
export function _onMatSupBookChange(sel)       { return window._onMatSupBookChange(sel); }
