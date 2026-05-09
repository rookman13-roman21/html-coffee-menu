// src/ui/modals.js
// Хелперы модальных окон: open/close, dirty-guard, unsaved warning

export function openModal(id)             { return window.openModal(id); }
export function closeModal(id)            { return window.closeModal(id); }
export function safeCloseModal(id)        { return window.safeCloseModal(id); }
export function _markModalDirty(id)       { return window._markModalDirty(id); }
export function _clearModalDirty(id)      { return window._clearModalDirty(id); }
export function _isModalDirty(id)         { return window._isModalDirty(id); }
export function _showUnsavedWarning(id)   { return window._showUnsavedWarning(id); }
export function _dismissUnsavedWarning()  { return window._dismissUnsavedWarning(); }
export function _forceCloseModal(id)      { return window._forceCloseModal(id); }
export function closeOnboarding()         { return window.closeOnboarding(); }
export function toggleTheme()             { return window.toggleTheme(); }
export function toggleBurger()            { return window.toggleBurger(); }
