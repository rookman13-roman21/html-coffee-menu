// src/ui/misc.js
// Разное: шаблоны, инсайты, сезонность, кандидаты на удаление, PDF-отчёты, onWhatIf

export function openTemplatesModal()    { return window.openTemplatesModal(); }
export function chooseTemplate(id)      { return window.chooseTemplate(id); }
export function applyTemplateData(id)   { return window.applyTemplateData(id); }
export function generateInsights(drinks){ return window.generateInsights(drinks); }
export function toggleSeasonality()     { return window.toggleSeasonality(); }
export function openDropCandidates()    { return window.openDropCandidates(); }
export function onWhatIf(v)             { return window.onWhatIf(v); }
export function exportFullPDF()         { return window.exportFullPDF(); }
export function exportMaterialsPDF()    { return window.exportMaterialsPDF(); }
export function buildBEPChart(...args)  { return window.buildBEPChart(...args); }
export function applyPayrollToFixed()   { return window.applyPayrollToFixed(); }
export function onPayrollSetting(key,v) { return window.onPayrollSetting(key, v); }
export function togglePayrollSettings() { return window.togglePayrollSettings(); }
export function toggleFixedHint()       { return window.toggleFixedHint(); }
export function _matDisplayUnit(matKey) { return window._matDisplayUnit(matKey); }
