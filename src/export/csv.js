// src/export/csv.js
// CSV-экспорт: общая утилита + дашборд + продажи

export function exportCSV(filename, headers, rows) {
  return window.exportCSV(filename, headers, rows);
}

export function exportDashboard() {
  return window.exportDashboard();
}

export function exportSales() {
  return window.exportSales();
}
