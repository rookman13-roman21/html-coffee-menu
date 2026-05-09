// src/modals/semi.js
// Модальное окно полуфабриката: добавление, редактирование, удаление

export function openAddSemi() {
  return window.openAddSemi();
}

export function openEditSemi(id) {
  return window.openEditSemi(id);
}

export function saveSemi() {
  return window.saveSemi();
}

export function deleteSemi(id) {
  return window.deleteSemi(id);
}

export function addSemiIngRow(matKey, amt, loss, yieldAmt) {
  return window.addSemiIngRow(matKey, amt, loss, yieldAmt);
}

export function onSemiImgChange(input) {
  return window.onSemiImgChange(input);
}

export function clearSemiImg() {
  return window.clearSemiImg();
}

export function _updateSemiCostPreview() {
  return window._updateSemiCostPreview();
}

export function _onSemiMatChange(selectEl) {
  return window._onSemiMatChange(selectEl);
}

export function _autoFillSemiYield() {
  return window._autoFillSemiYield();
}
