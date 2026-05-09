// src/ui/cost-table.js
// UI-хелперы вкладки себестоимости: категории сырья, поставщики, usage-попап

export function setMatCat(cat)          { return window.setMatCat(cat); }
export function toggleMatCat(cat)       { return window.toggleMatCat(cat); }
export function toggleSemiCat()         { return window.toggleSemiCat(); }
export function toggleSupSection()      { return window.toggleSupSection(); }
export function toggleIngSection()      { return window.toggleIngSection(); }
export function toggleSemiSection()     { return window.toggleSemiSection(); }
export function scrollCostTo(sectionId) { return window.scrollCostTo(sectionId); }
export function openMatUsage(type, key) { return window.openMatUsage(type, key); }
export function _buildMatUsageMap()     { return window._buildMatUsageMap(); }
export function _buildSemiUsageMap()    { return window._buildSemiUsageMap(); }
