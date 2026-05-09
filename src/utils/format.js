// ════════════════════════════════════════════════════════════════════
//  FORMAT HELPERS
//  Чистые функции без зависимостей — форматирование и UI-значки.
// ════════════════════════════════════════════════════════════════════

/** «1 234 ₽» */
export const rub = v => Math.round(v).toLocaleString('ru') + '\u00a0₽';

/**
 * Для полуфабрикатов: показывает дробные копейки если значение < 1.
 * @param {number} v
 * @param {string} unit  — например 'мл', 'г', 'шт'
 */
export const rubSemi = (v, unit = '') => {
  if (!isFinite(v) || v === 0) return '0\u00a0₽';
  const suffix = '\u00a0₽' + (unit ? '/' + unit : '');
  if (v >= 1)   return Math.round(v).toLocaleString('ru') + suffix;
  if (v >= 0.1) return v.toFixed(2) + suffix;
  return v.toPrecision(2) + suffix;
};

/** «26.1%» (v = 0..1) */
export const pct = v => (v * 100).toFixed(1) + '%';

/** «1 234» */
export const int = v => Math.round(v).toLocaleString('ru');

// ─────────────────────────────────────────────────────────────────
//  FC%  (food-cost)
// ─────────────────────────────────────────────────────────────────

/** Порог FC: 'good' ≤25% / 'ok' ≤30% / 'bad' >30% */
export function fcCls(fc) {
  return fc <= 0.25 ? 'good' : fc <= 0.30 ? 'ok' : 'bad';
}

/**
 * Цветной значок-бейдж риска FC.
 * @returns {string} HTML `<span class="risk risk-good|ok|bad">🟢 Отлично</span>`
 */
export function riskBadge(fc) {
  const c = fcCls(fc);
  const label = c === 'good' ? '🟢 Отлично' : c === 'ok' ? '🟡 Норма' : '🔴 Риск';
  const cls   = c === 'good' ? 'risk-good'  : c === 'ok' ? 'risk-ok'  : 'risk-bad';
  return `<span class="risk ${cls}">${label}</span>`;
}

/**
 * ABC-бейдж.
 * @param {'A'|'B'|'C'} abc
 * @param {string} tip  — опциональный тултип (data-tip)
 * @returns {string} HTML `<span class="abc abc-A">`
 */
export function abcBadge(abc, tip = '') {
  const tipAttr = tip ? ` data-tip="${tip}"` : '';
  return `<span class="abc abc-${abc}"${tipAttr}>${abc}</span>`;
}

/**
 * FC% — только числовое значение с цветом (используется в таблицах).
 * Без прогресс-бара: цвет по порогу fcCls.
 * @returns {string} HTML `<span style="color:…">26.1%</span>`
 */
export function fcCombinedHtml(fc) {
  const cls = fcCls(fc);
  const clr = cls === 'bad' ? 'var(--red)' : cls === 'ok' ? '#7a5800' : 'var(--navy)';
  return `<span style="color:${clr};font-weight:700;font-size:13px">${pct(fc)}</span>`;
}
