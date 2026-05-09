// src/ui/sort.js
// Сортировка и фильтрация таблиц дашборда и продаж

export function sortDrinks(drinks) {
  return window.sortDrinks(drinks);
}

export function setSort(col) {
  return window.setSort(col);
}

export function thSort(col, label, cls, tip) {
  return window.thSort(col, label, cls, tip);
}

export function setSalesSort(col) {
  return window.setSalesSort(col);
}

export function thSalesSort(col, label, cls, tip) {
  return window.thSalesSort(col, label, cls, tip);
}

export function filterSales(val) {
  return window.filterSales(val);
}

export function filterDashboard(val) {
  return window.filterDashboard(val);
}
