// src/ui/suppliers.js
// Модальные окна и список поставщиков

export function openSupplierInfo(key)          { return window.openSupplierInfo(key); }
export function siOpenEdit()                   { return window.siOpenEdit(); }
export function openSupplierModal(key)         { return window.openSupplierModal(key); }
export function editSupFromList(matKey)        { return window.editSupFromList(matKey); }
export function cancelSupplierModal()          { return window.cancelSupplierModal(); }
export function saveSupplier()                 { return window.saveSupplier(); }
export function openSuppliersList()            { return window.openSuppliersList(); }
export function renderSuppliersList()          { return window.renderSuppliersList(); }
export function openSupplierBookModal(id, fromList) { return window.openSupplierBookModal(id, fromList); }
export function cancelSupplierBookModal(force) { return window.cancelSupplierBookModal(force); }
export function exportSuppliersPDF()           { return window.exportSuppliersPDF(); }
