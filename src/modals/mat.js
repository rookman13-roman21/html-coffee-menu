// src/modals/mat.js
// Модальное окно сырья: редактирование, сохранение, удаление

export function openEditMat(key) {
  return window.openEditMat(key);
}

export function saveMat() {
  return window.saveMat();
}

export function cancelMat(force) {
  return window.cancelMat(force);
}

export function deleteMat(key) {
  return window.deleteMat(key);
}

export function matOnlyOptions(selected) {
  return window.matOnlyOptions(selected);
}
