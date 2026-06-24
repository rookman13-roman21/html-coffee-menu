// src/ui/payroll.js
// Расчёт зарплат и налогов

// ── Перенесено из public/app.js ──

export function scrollToPayroll() {
  const el = document.getElementById('payroll-section') || document.querySelector('.payroll-section, [data-section="payroll"]');
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const targetY = window.scrollY + rect.top - (window.innerHeight / 2) + (rect.height / 2);
  window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
}

export function PS() {
  return Object.assign({}, PS_DEFAULTS, window.S.payrollSettings || {});
}

export function calcPositionCosts(p) {
  const ps    = PS();
  const mrot  = ps.mrot;
  const ndfl  = ps.ndfl / 100;
  const ins   = ps.ins  / 100;
  const gross = (p.rate||0) * (p.hours||0) * (p.shifts||0) * (p.count||0);
  const type  = p.empType || 'black';
  if (type === 'white') {
    const ndflAmt = Math.round(gross * ndfl);
    const insAmt  = Math.round(gross * ins);
    return { toEmployee: gross - ndflAmt, taxes: ndflAmt + insAmt, total: gross + insAmt };
  }
  if (type === 'grey') {
    const officialBase = mrot * (p.count || 1);
    const official  = Math.min(gross, officialBase);
    const cashPart  = Math.max(0, gross - officialBase);
    const ndflAmt   = Math.round(official * ndfl);
    const insAmt    = Math.round(official * ins);
    return { toEmployee: (official - ndflAmt) + cashPart, taxes: ndflAmt + insAmt, total: official + insAmt + cashPart };
  }
  // black
  return { toEmployee: gross, taxes: 0, total: gross };
}

export function payrollPositionTotal(p) {
  return calcPositionCosts(p).total;
}
export function payrollTotal() {
  return (window.S.payrollPositions||[]).reduce((s,p) => s + payrollPositionTotal(p), 0);
}
export function payrollTotals() {
  const res = { toEmployee:0, taxes:0, total:0 };
  (window.S.payrollPositions||[]).forEach(p => {
    const c = calcPositionCosts(p);
    res.toEmployee += c.toEmployee;
    res.taxes      += c.taxes;
    res.total      += c.total;
  });
  return res;
}

export const EMP_TYPE_LABELS = { white:'Официально', grey:'Серая схема', black:'Неофициально' };
export function empTypeTip(type) {
  const ps = PS();
  if (type === 'white') return `Трудовой договор. Ставка = гросс. Работник получает гросс − НДФЛ ${ps.ndfl}%. Работодатель: +${ps.ins}% взносы.`;
  if (type === 'grey')  return `Официально только МРОТ (${ps.mrot.toLocaleString('ru')} ₽) × кол-во. НДФЛ ${ps.ndfl}% + взносы ${ps.ins}% с МРОТ. Остальное — наличными.`;
  return 'Вся сумма — на руки. Никаких налогов.';
}
export const EMP_TYPE_CLR = { white:'var(--green)', grey:'#e6a817', black:'var(--muted)' };

export function onPayrollPos(id, field, v) {
  const pos = (window.S.payrollPositions||[]).find(p => p.id === id);
  if (!pos) return;
  if (field === 'name' || field === 'empType') {
    pos[field] = v;
    if (field === 'empType') { renderFinModel(); saveState(); if(window.lucide) lucide.createIcons(); }
    else saveState();
    window.logWorkspaceActivity?.('payroll_changed', 'payroll_position', id, `Изменена должность ФОТ «${pos.name || ''}»`);
    return;
  }
  const n = parseFloat(v);
  if (!(n >= 0)) return;
  pos[field] = n;
  _refreshPayrollRow(id);
  saveState();
  window.clearTimeout(window._workspacePayrollLogTimer);
  window._workspacePayrollLogTimer = window.setTimeout(() => window.logWorkspaceActivity?.('payroll_changed', 'payroll_position', id, `Изменён ФОТ «${pos.name || ''}»`), 1200);
}
export function _refreshPayrollRow(id) {
  const pos = (window.S.payrollPositions||[]).find(p => p.id === id);
  if (!pos) return;
  const c = calcPositionCosts(pos);
  const rowTotal = document.getElementById(`pr-total-${id}`);
  if (rowTotal) rowTotal.textContent = rub(c.total);
  const rowTax = document.getElementById(`pr-tax-${id}`);
  if (rowTax) rowTax.textContent = c.taxes > 0 ? `+${rub(c.taxes)}` : '—';
  _refreshPayrollSummary();
}
export function _refreshPayrollSummary() {
  const t = payrollTotals();
  const s = document.getElementById('pr-sum-employee'); if (s) s.textContent = rub(t.toEmployee);
  const x = document.getElementById('pr-sum-taxes');    if (x) x.textContent = rub(t.taxes);
  const g = document.getElementById('payroll-grand-total'); if (g) g.textContent = rub(t.total);
}
export function addPayrollPosition() {
  if (!window.S.payrollPositions) window.S.payrollPositions = [];
  const maxId = window.S.payrollPositions.reduce((m,p) => Math.max(m, p.id||0), 0);
  window.S.payrollPositions.push({ id: maxId+1, name:'Новая должность', rate:250, hours:12, shifts:26, count:1, empType:'black' });
  renderFinModel();
  saveState();
  window.logWorkspaceActivity?.('payroll_changed', 'payroll_position', maxId + 1, 'Добавлена должность ФОТ');
  if (window.lucide) lucide.createIcons();
  const last = window.S.payrollPositions[window.S.payrollPositions.length-1];
  const el = document.getElementById(`pr-name-${last.id}`);
  if (el) { el.focus(); el.select(); }
}
export function deletePayrollPosition(id) {
  if (!window.S.payrollPositions || window.S.payrollPositions.length <= 1) return;
  window.S.payrollPositions = window.S.payrollPositions.filter(p => p.id !== id);
  renderFinModel();
  saveState();
  window.logWorkspaceActivity?.('payroll_changed', 'payroll_position', id, 'Удалена должность ФОТ');
  if (window.lucide) lucide.createIcons();
}

