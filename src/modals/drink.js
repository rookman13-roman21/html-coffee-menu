// src/modals/drink.js
// Модальное окно напитка: добавление, редактирование, удаление, сброс

export function openAddDrink() {
  return window.openAddDrink();
}

export function openEditDrink(id) {
  return window.openEditDrink(id);
}

export function saveDrink() {
  return window.saveDrink();
}

export function deleteDrink(id) {
  return window.deleteDrink(id);
}

export function resetDrink(id) {
  return window.resetDrink(id);
}

export function mdDeleteAction() {
  return window.mdDeleteAction();
}

export function onDrinkImgChange(input) {
  return window.onDrinkImgChange(input);
}

export function clearDrinkImg() {
  return window.clearDrinkImg();
}
