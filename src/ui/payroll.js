// src/ui/payroll.js
// Расчёт зарплат и налогов

export function calcPositionCosts(p) {
  return window.calcPositionCosts(p);
}

export function payrollPositionTotal(p) {
  return window.payrollPositionTotal(p);
}

export function payrollTotal() {
  return window.payrollTotal();
}

export function payrollTotals() {
  return window.payrollTotals();
}

export function empTypeTip(type) {
  return window.empTypeTip(type);
}

export function onPayrollPos(id, field, v) {
  return window.onPayrollPos(id, field, v);
}

export function addPayrollPosition() {
  return window.addPayrollPosition();
}

export function deletePayrollPosition(id) {
  return window.deletePayrollPosition(id);
}

export function scrollToPayroll() {
  return window.scrollToPayroll();
}
