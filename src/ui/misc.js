// src/ui/misc.js
// Разное: шаблоны, инсайты, сезонность, кандидаты на удаление, PDF-отчёты, onWhatIf

import { hasAccess, hasWorkspaceMembership, requireWorkspaceOwner } from './auth.js';
import { ensureExcelJS } from '../utils/vendor.js';
import { GROUP_LABEL } from '../data/drinks.js';

export function openTemplatesModal() {
  if (!hasWorkspaceMembership()) {
    window.showAlert?.('Нет доступного проекта. Попросите владельца отправить новое приглашение.', '🔒');
    return;
  }
  if (!requireWorkspaceOwner('Создавать заведения из шаблона может только владелец проекта.')) return;
  const MENU_TEMPLATES = window.MENU_TEMPLATES;
  const grid = document.getElementById('templates-grid');
  grid.innerHTML = Object.entries(MENU_TEMPLATES).map(([id,t]) =>
    `<button class="template-card" onclick="chooseTemplate('${id}')">
      <div class="tpl-icon">${t.icon}</div>
      <div class="tpl-name">${t.name}</div>
      <div class="tpl-desc">${t.desc}</div>
      <div class="tpl-meta">${t.meta}</div>
    </button>`
  ).join('');
  document.getElementById('loc-menu')?.classList.remove('open');
  window.openModal('modal-templates');
  if (window.lucide) lucide.createIcons();
}

export function chooseTemplate(id) {
  if (!hasWorkspaceMembership()) {
    window.showAlert?.('Нет доступного проекта. Попросите владельца отправить новое приглашение.', '🔒');
    return;
  }
  if (!requireWorkspaceOwner('Создавать заведения из шаблона может только владелец проекта.')) return;
  const tpl = window.MENU_TEMPLATES[id]; if (!tpl) return;
  window.closeModal('modal-templates');
  window._locModalMode = 'template'; window._locTemplateId = id;
  document.getElementById('modal-loc-title').innerHTML = `<i data-lucide="sparkles" class="icon"></i> Точка по шаблону «${tpl.name}»`;
  document.getElementById('ml-icon').value = tpl.icon;
  document.getElementById('ml-name').value = tpl.name;
  document.getElementById('ml-clone-wrap').style.display = 'none';
  document.getElementById('ml-requisites-wrap').style.display = '';
  window.openModal('modal-loc');
  if (window.lucide) lucide.createIcons();
}

export function applyTemplateData(id) {
  const tpl = window.MENU_TEMPLATES[id]; if (!tpl) return;
  const DRINKS = window.DRINKS;
  const S = window.S;
  if (tpl.keepIds) {
    const keep = new Set(tpl.keepIds);
    for (let i = DRINKS.length - 1; i >= 0; i--) {
      if (!keep.has(DRINKS[i].id)) DRINKS.splice(i, 1);
    }
    Object.keys(S.salePrices).forEach(k => { if (!keep.has(+k)) delete S.salePrices[k]; });
    Object.keys(S.portions).forEach(k => { if (!keep.has(+k)) delete S.portions[k]; });
  }
  if (tpl.priceMul && tpl.priceMul !== 1) {
    DRINKS.forEach(d => {
      const base = S.salePrices[d.id] ?? d.price;
      S.salePrices[d.id] = Math.round(base * tpl.priceMul / 10) * 10;
    });
  }
  if (tpl.portions) {
    DRINKS.forEach(d => {
      if (tpl.portions[d.id] != null) S.portions[d.id] = tpl.portions[d.id];
      else S.portions[d.id] = 5;
    });
  }
  if (tpl.fixedCostsMul && tpl.fixedCostsMul !== 1) {
    S.fixedCosts = S.fixedCosts.map(c => ({...c, value: Math.round(c.value * tpl.fixedCostsMul)}));
  }
}

export function generateInsights(drinks) {
  const S = window.S;
  const { avgFC } = window.avgMetrics(drinks);
  const out = [];
  if (!drinks.length) return out;
  const riskCnt = drinks.filter(d => d.fc > 0.30).length;
  const aCnt    = drinks.filter(d => d.abc==='A').length;
  const cCnt    = drinks.filter(d => d.abc==='C').length;
  const worst   = [...drinks].sort((a,b)=>b.fc-a.fc)[0];
  const totalPort = Object.values(S.portions).reduce((s,v)=>s+v, 0);
  const pct = window.pct;

  if (avgFC <= 0.25) {
    out.push({ level:'good', icon:'✅', title:`Средний FC ${pct(avgFC)} — отлично`,
      text:'Ваш средний фуд-кост ниже бенчмарка отрасли (25–30%). Маржа стабильно высокая.' });
  } else if (avgFC <= 0.30) {
    out.push({ level:'good', icon:'👌', title:`Средний FC ${pct(avgFC)} — норма`,
      text:'Бенчмарк отрасли — 25–30%. Вы в рынке. Можно оптимизировать топ-3 худших позиций.' });
  } else if (avgFC <= 0.35) {
    out.push({ level:'warn', icon:'⚠️', title:`Средний FC ${pct(avgFC)} — выше нормы`,
      text:'Бенчмарк 25–30%. Поднимите цены на класс A или пересмотрите рецептуры дорогих позиций.' });
  } else {
    out.push({ level:'danger', icon:'🚨', title:`Средний FC ${pct(avgFC)} — критично`,
      text:'Маржа сжата. Срочно нужен пересмотр цен сырья (закупка) или цен продажи.' });
  }

  const aShare = aCnt / drinks.length;
  if (aShare >= 0.18 && aShare <= 0.25) {
    out.push({ level:'good', icon:'⭐', title:`Класс A: ${aCnt} напитков (${(aShare*100).toFixed(0)}%)`,
      text:'Здоровое распределение. Топ-20% генерируют основную прибыль — сфокусируйте маркетинг на них.' });
  }

  if (riskCnt > 0) {
    out.push({ level: riskCnt >= drinks.length * 0.3 ? 'danger' : 'warn',
      icon:'🔴', title:`${riskCnt} напитков с FC > 30%`,
      text:`Эти позиции «съедают» маржу. Хуже всех: «${worst.name}» (${pct(worst.fc)}). Поднимите цену или удешевите рецепт.` });
  }

  if (cCnt >= drinks.length * 0.55) {
    out.push({ level:'warn', icon:'🪫', title:`Класс C: ${cCnt} напитков`,
      text:'Слишком большой «хвост» неприбыльных позиций. Подумайте об удалении 2–3 самых слабых для упрощения меню.' });
  }

  if (totalPort === 0) {
    out.push({ level:'warn', icon:'📋', title:'План продаж не заполнен',
      text:'Зайдите во вкладку «План продаж» и укажите ожидаемые порции по каждому напитку — расчёты BEP оживут.' });
  } else {
    const bep = window.bepCalc(drinks);
    const ratio = totalPort / (bep.cupsDay || 1);
    if (ratio < 1) {
      out.push({ level:'warn', icon:'⚖️', title:`До BEP не хватает ${bep.cupsDay - totalPort} чашек/день`,
        text:`План: ${totalPort} ч/д. Точка безубыточности: ${bep.cupsDay} ч/д. Нужен либо рост трафика, либо повышение чека.` });
    } else if (ratio >= 1.5) {
      out.push({ level:'good', icon:'🚀', title:`План в ${ratio.toFixed(1)}× выше BEP`,
        text:`Текущий план продаж покрывает точку безубыточности с большим запасом — отличная финансовая устойчивость.` });
    } else {
      out.push({ level:'good', icon:'✅', title:`План на ${((ratio-1)*100).toFixed(0)}% выше BEP`,
        text:`Точка безубыточности перекрыта. Запас прочности есть, но небольшой.` });
    }
  }

  return out;
}



export function exportFullPDF() {
  window.logWorkspaceActivity?.('export_created', 'report', 'full_pdf', 'Сформирован PDF — полный отчёт');
  document.getElementById('export-menu')?.classList.remove('open');
  const loc = window.activeLoc();
  const drinks = window.withABC(window.enrich());
  const baseAvg = window.avgMetrics(drinks);
  const { avgProfit } = baseAvg;
  const sales = window.salesMetrics(drinks);
  const bep = window.bepCalc(drinks);
  const today = new Date().toLocaleDateString('ru');
  const locName = loc?.name || 'Кофейня';
  const year = new Date().getFullYear();

  // Постоянные расходы (тот же расчёт что в P&L)
  const totRevMon   = sales.totRevMon;
  const _eff1 = window.getEffectiveCosts(totRevMon);
  const fotInFixed  = _eff1.some(c => /фот|зарплат|зп|оплата.?труда/i.test(c.name));
  const fotAmt      = fotInFixed ? 0 : (typeof payrollTotal === 'function' ? window.payrollTotal() : 0);
  const varExtra    = _eff1.filter(c=>c.isVariable).reduce((s,c)=>s+c.value,0);
  const fixedOnly   = _eff1.filter(c=>!c.isVariable).reduce((s,c)=>s+c.value,0);
  const totalFixed  = fixedOnly + fotAmt + varExtra;

  // P&L
  const varCostsMon = sales.totCostMon != null ? sales.totCostMon : drinks.reduce((s,d)=>s+(d.cost*(window.S.portions[d.id]||0)*window.S.days),0);
  const ebit        = totRevMon - varCostsMon - totalFixed;
  const _taxMode1  = window.S.taxMode || 'none';
  const taxAmt      = _taxMode1 === 'usn6' ? totRevMon * 0.06 : _taxMode1 === 'usn15' ? Math.max(0, (totRevMon - varCostsMon - varExtra - fixedOnly - fotAmt) * 0.15) : 0;
  const netProfit   = ebit - taxAmt;
  const investment  = window.S.investment || 0;
  const paybackMon  = investment > 0 && netProfit > 0 ? (investment / netProfit) : null;
  const drinkRevMon = sales.drinkRevMon || 0;
  const drinkCostMon = sales.drinkCostMon || 0;
  const addonRevMon = sales.addonRevMon || 0;
  const addonCostMon = sales.addonCostMon || 0;
  const addonPrfMon = sales.addonPrfMon || 0;
  const hasAddonSales = addonRevMon > 0;

  const n = v => Math.round(v).toLocaleString('ru');
  const TAX_LABELS = { none: 'Нет', usn6: 'УСН 6%', usn15: 'УСН 15%' };
  const fcClrPdf = fc => fc <= 0.25 ? '#1a7a1a' : fc <= 0.30 ? '#b87e00' : '#c0392b';
  const fcBgPdf  = fc => fc <= 0.25 ? '#e6f4e6' : fc <= 0.30 ? '#fff8e1' : '#fdecea';
  const netClr   = netProfit >= 0 ? '#1a7a1a' : '#c0392b';
  const netBg    = netProfit >= 0 ? '#e6f4e6' : '#fdecea';
  const avgPrice = sales.avgCheckTotal || baseAvg.avgPrice;
  const avgDrinkCheck = sales.avgDrinkCheck || baseAvg.avgPrice;
  const avgAddonCheck = sales.avgAddonCheck || 0;
  const avgProfitTotal = sales.avgProfitTotal || avgProfit;
  const avgFC = totRevMon > 0 ? varCostsMon / totRevMon : baseAvg.avgFC;
  const addonSharePct = totRevMon > 0 ? addonRevMon / totRevMon * 100 : 0;
  const fcTarget = 0.28;
  const fcDeltaPp = (avgFC - fcTarget) * 100;
  const safetyAbs = totRevMon - bep.revBEP;
  const safetyPct = totRevMon > 0 ? safetyAbs / totRevMon * 100 : 0;
  const bepCoverRatio = bep.revBEP > 0 ? totRevMon / bep.revBEP : 0;

  // ── KPI-карточки ─────────────────────────────────────────────────
  const kpiCards = [
    { label: 'Напитков в меню',      value: drinks.length,                     sub: '' },
    { label: 'Чеков / день',         value: n(sales.totalChecks || sales.totalPort || 0), sub: 'база для среднего чека' },
    { label: 'Средний чек',          value: n(avgPrice) + ' ₽',                sub: hasAddonSales ? `${n(avgDrinkCheck)} ₽ напитки + ${n(avgAddonCheck)} ₽ доп.` : '' },
    { label: 'Доп. продажи / мес',   value: n(addonRevMon) + ' ₽',             sub: hasAddonSales ? `${addonSharePct.toFixed(1)}% выручки · ${n(addonPrfMon)} ₽ прибыли` : '' },
    { label: 'Прибыль / чек',        value: n(avgProfitTotal) + ' ₽',          sub: 'валовая, до расходов' },
    { label: 'Средний FC%',          value: (avgFC*100).toFixed(1) + '%',       sub: fcDeltaPp > 0 ? `выше ориентира на ${fcDeltaPp.toFixed(1)} п.п.` : `ниже ориентира на ${Math.abs(fcDeltaPp).toFixed(1)} п.п.`, color: fcClrPdf(avgFC), bg: fcBgPdf(avgFC) },
    { label: 'Выручка / день',       value: n(sales.totRevDay) + ' ₽',         sub: '' },
    { label: 'Прибыль / день',       value: n(sales.totPrfDay) + ' ₽',         sub: 'до налогов' },
    { label: 'Выручка / месяц',      value: n(totRevMon) + ' ₽',               sub: '' },
    { label: 'Чистая прибыль / мес', value: n(netProfit) + ' ₽',               sub: '', color: netClr, bg: netBg },
    { label: 'Покрытие ТБУ',         value: bepCoverRatio > 0 ? bepCoverRatio.toFixed(1) + '×' : '—', sub: safetyAbs >= 0 ? `выше ТБУ на ${n(safetyAbs)} ₽` : `до ТБУ не хватает ${n(-safetyAbs)} ₽`, color: safetyAbs >= 0 ? '#1a7a1a' : '#c0392b' },
    { label: 'Запас прочности',      value: (safetyAbs >= 0 ? '+' : '') + safetyPct.toFixed(1) + '%', sub: safetyAbs >= 0 ? 'допустимое падение выручки' : 'план ниже безубыточности', color: safetyAbs >= 0 ? '#1a7a1a' : '#c0392b' },
    { label: 'ТБУ (выручка / мес)',  value: n(bep.revBEP) + ' ₽',              sub: 'минимум для покрытия расходов' },
    ...(investment > 0 ? [
      { label: 'Стартовые вложения', value: n(investment) + ' ₽',              sub: '' },
      { label: 'Срок окупаемости',   value: paybackMon ? paybackMon.toFixed(1) + ' мес.' : 'убыток', sub: '', color: paybackMon ? '#1a7a1a' : '#c0392b' },
    ] : []),
  ].map(k => `<div class="kpi-card" style="background:${k.bg||'#f4f8f2'}">
    <div class="kpi-label">${k.label}</div>
    <div class="kpi-value" style="color:${k.color||'#222'}">${k.value}</div>
    ${k.sub ? `<div class="kpi-sub">${k.sub}</div>` : ''}
  </div>`).join('');

  // ── План продаж ───────────────────────────────────────────────────
  const targetFC = window.S.targetFC || 0;
  const planRows = window.sortDrinks(drinks).filter(d => (window.S.portions[d.id]||0) > 0).map(d => {
    const p = window.S.portions[d.id] || 0;
    const overFC = targetFC > 0 && d.fc > targetFC;
    const fcClr = overFC ? '#c0392b' : fcClrPdf(d.fc);
    const fcBg  = overFC ? '#fdecea' : fcBgPdf(d.fc);
    return `<tr><td class="drink-name">${d.name}</td><td class="r muted">${Math.round(d.price)}</td><td class="c" style="color:${fcClr};background:${fcBg};font-weight:700">${(d.fc*100).toFixed(1)}%</td><td class="c">${p}</td><td class="r">${n(d.price*p)}</td><td class="r">${n(d.profit*p)}</td><td class="r fw">${n(d.price*p*window.S.days)}</td><td class="r fw">${n(d.profit*p*window.S.days)}</td></tr>`;
  }).join('');
  const addonPlanRows = (sales.addonRows || []).map(row => {
    const fc = row.price > 0 ? row.cost / row.price : 0;
    return `<tr><td class="drink-name">${row.name}</td><td class="r muted">${Math.round(row.price)}</td><td class="c" style="color:${fcClrPdf(fc)};background:${fcBgPdf(fc)};font-weight:700">${(fc*100).toFixed(1)}%</td><td class="c">${row.unitsDay.toFixed(1)}</td><td class="r">${n(row.revDay)}</td><td class="r">${n(row.prfDay)}</td><td class="r fw">${n(row.revDay*window.S.days)}</td><td class="r fw">${n(row.prfDay*window.S.days)}</td></tr>`;
  }).join('');

  // ── P&L ───────────────────────────────────────────────────────────
  const plItems = [
    { label: 'Выручка от продаж',       val: totRevMon,   bold: false, top: true },
    ...(hasAddonSales ? [
      { label: '· Напитки',             val: drinkRevMon, sub: true },
      { label: '· Дополнительные продажи', val: addonRevMon, sub: true },
    ] : []),
    { label: '− Себестоимость сырья',   val: -varCostsMon, bold: false },
    ...(hasAddonSales ? [
      { label: '· Себестоимость напитков', val: -drinkCostMon, sub: true },
      { label: '· Себестоимость доп. продаж', val: -addonCostMon, sub: true },
    ] : []),
    { label: 'Валовая прибыль',         val: totRevMon - varCostsMon, bold: true },
    ...window.getEffectiveCosts(totRevMon).map(c => ({ label: `− ${c.name}${c.isVariable?' (перем.)':''}`, val: -c.value })),
    ...(fotAmt > 0 ? [{ label: '− ФОТ (все сотрудники)', val: -fotAmt }] : []),
    { label: 'EBIT (операц. прибыль)', val: ebit, bold: true },
    ...(taxAmt > 0 ? [{ label: `− Налог (${TAX_LABELS[window.S.taxMode]})`, val: -taxAmt }] : []),
    { label: 'Чистая прибыль',          val: netProfit, bold: true, accent: true },
  ];
  const plRows = plItems.map((r, i) => {
    const isAccent = r.accent;
    const isBold   = r.bold;
    const vClr     = isAccent ? (netProfit >= 0 ? '#1a7a1a' : '#c0392b') : (r.val < 0 ? '#c0392b' : '#222');
    const bg       = isAccent ? (netProfit >= 0 ? '#e6f4e6' : '#fdecea') : (isBold ? '#eef5eb' : (r.sub ? '#f7fbf5' : (i%2===0?'#fff':'#fafcf9')));
    const fw       = isBold ? '700' : '400';
    const bTop     = r.top ? 'border-top:2px solid #b5d4a8;' : '';
    const padLeft  = r.sub ? '26px' : (isBold ? '8px' : '20px');
    return `<tr style="background:${bg};${bTop}">
      <td style="padding:5px 8px;font-size:9pt;font-weight:${fw};padding-left:${padLeft};color:${r.sub ? '#555' : '#222'}">${r.label}</td>
      <td style="padding:5px 8px;text-align:right;font-size:9pt;font-weight:${fw};color:${vClr}">${n(Math.abs(r.val))} ₽</td>
      <td style="padding:5px 8px;text-align:right;font-size:9pt;color:#555">${totRevMon > 0 ? (r.val/totRevMon*100).toFixed(1) + '%' : ''}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Финансовый отчёт — ${locName}</title>
<link href="/vendor/fonts/mulish.css" rel="stylesheet">
<style>
* { box-sizing:border-box; margin:0; padding:0; }
body { font-family:'Mulish',Arial,sans-serif; font-size:10pt; color:#222; background:#fff; }
@page { size:A4; margin:12mm 10mm; }

/* Обложка */
.cover { background:#417033; color:#fff; padding:20px 24px 16px; margin-bottom:20px; border-radius:6px; display:flex; justify-content:space-between; align-items:flex-end; }
.cover-left h1 { font-size:16pt; font-weight:800; margin-bottom:4px; }
.cover-left p  { font-size:9.5pt; opacity:.85; }
.cover-right   { text-align:right; font-size:9pt; opacity:.8; line-height:1.8; }

/* Секции */
.section-title { font-size:11pt; font-weight:800; color:#417033; margin:18px 0 8px; padding-bottom:4px; border-bottom:2.5px solid #c5e0b4; display:flex; align-items:center; gap:6px; }
.section-title span { font-size:13pt; }

/* KPI-сетка */
.kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:7px; margin-bottom:16px; }
.kpi-card { border-radius:6px; padding:9px 11px; border:1px solid #dcebd7; }
.kpi-label { font-size:7.5pt; color:#444; font-weight:600; text-transform:uppercase; letter-spacing:.03em; margin-bottom:4px; }
.kpi-value { font-size:13pt; font-weight:800; color:#222; line-height:1.1; }
.kpi-sub   { font-size:7.5pt; color:#555; margin-top:2px; }

/* Таблицы */
table { width:100%; border-collapse:collapse; margin-bottom:14px; font-size:8.5pt; }
th { background:#417033; color:#fff; padding:5px 7px; text-align:left; font-weight:700; font-size:8pt; }
th.r, td.r { text-align:right; }
th.c, td.c { text-align:center; }
td { padding:4px 7px; border-bottom:1px solid #e8f0e5; vertical-align:middle; }
tr:nth-child(even) td { background:#fafcf9; }
td.fw  { font-weight:700; }
td.muted { color:#444; }
td.drink-name { max-width:170px; }
.group-sep td { background:#f0f5ee !important; padding:5px 7px; border-bottom:1.5px solid #c8dfc0; }
.group-sep span { font-size:8pt; font-weight:700; color:#417033; text-transform:uppercase; letter-spacing:.05em; }
tfoot tr td { font-weight:700; background:#e7f2e3 !important; border-top:1.5px solid #9ecb8a; }

/* Разрыв */
.pb { page-break-before:always; margin-top:0; }
.hint { font-size:8pt; color:#555; margin:-10px 0 12px; font-style:italic; }

/* Футер */
.mbs-footer { margin-top:24px; padding-top:5px; border-top:1px solid #ddd; text-align:right; font-size:8pt; color:#666; }

@media print {
  .cover, th, tfoot tr td, .group-sep td { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .kpi-card { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
}
</style></head><body>

<!-- ОБЛОЖКА -->
<div class="cover">
  <div class="cover-left">
    <h1>MBS Coffee Menu</h1>
    <p>Финансовый отчёт &nbsp;·&nbsp; ${locName}</p>
  </div>
  <div class="cover-right">
    <div>${today}</div>
    <div>${window.S.days} дней в месяце</div>
    <div>${drinks.length} напитков</div>
  </div>
</div>

<!-- KPI -->
<div class="section-title"><span>📊</span> Ключевые показатели</div>
<div class="kpi-grid">${kpiCards}</div>

<!-- ПЛАН ПРОДАЖ -->
<div class="section-title"><span>📈</span> План продаж <span style="font-size:9pt;font-weight:400;color:#6b7280">(только активные позиции)</span></div>
<p class="hint">${window.S.days} дней в месяце &nbsp;·&nbsp; напитки с порциями &gt; 0 и дополнительные продажи${targetFC > 0 ? ' &nbsp;·&nbsp; Целевой FC%: ' + Math.round(targetFC*100) + '% (красный = превышение)' : ''}</p>
<table>
  <thead><tr><th>Позиция</th><th class="r">Цена</th><th class="c">FC%</th><th class="c">Объём/д</th><th class="r">Выр./день</th><th class="r">Приб./день</th><th class="r">Выр./мес</th><th class="r">Приб./мес</th></tr></thead>
  <tbody>${planRows}${addonPlanRows ? `<tr class="group-sep"><td colspan="8"><span>Дополнительные продажи</span></td></tr>${addonPlanRows}` : ''}</tbody>
  <tfoot><tr><td colspan="4">ИТОГО</td><td class="r">${n(sales.totRevDay)} ₽</td><td class="r">${n(sales.totPrfDay)} ₽</td><td class="r">${n(totRevMon)} ₽</td><td class="r">${n(sales.totPrfMon)} ₽</td></tr></tfoot>
</table>

<!-- P&L -->
<div class="section-title"><span>💰</span> P&amp;L — Отчёт о прибылях и убытках</div>
<p class="hint">Базовый план &nbsp;·&nbsp; Налоговый режим: ${TAX_LABELS[window.S.taxMode]||window.S.taxMode}</p>
<table>
  <thead><tr><th>Статья</th><th class="r">Сумма, ₽</th><th class="r">% от выр.</th></tr></thead>
  <tbody>${plRows}</tbody>
</table>
${investment > 0 ? `
<table style="max-width:320px">
  <thead><tr><th colspan="2">Инвестиции и окупаемость</th></tr></thead>
  <tbody>
    <tr><td>Стартовые вложения</td><td class="r fw">${n(investment)} ₽</td></tr>
    <tr><td>Срок окупаемости</td><td class="r fw" style="color:${paybackMon?'#1a7a1a':'#c0392b'}">${paybackMon ? paybackMon.toFixed(1) + ' мес.' : 'убыток'}</td></tr>
  </tbody>
</table>` : ''}

<div class="mbs-footer">Московская школа бариста &nbsp;·&nbsp; baristaschool.ru</div>
</body></html>`;

  window._printViaIframe(html, 'mbs-finmodel');
}

export async function exportFullXLSX() {
  window.logWorkspaceActivity?.('export_created', 'report', 'full_xlsx', 'Сформирован Excel-отчёт');
  try {
    await _exportFullXLSXUnsafe();
  } catch (e) {
    console.error('exportFullXLSX error:', e);
    window.showAlert?.('Не удалось скачать Excel: ' + (e?.message || 'ошибка формирования файла'));
  }
}

async function _exportFullXLSXUnsafe() {
  document.getElementById('export-menu')?.classList.remove('open');
  try { await ensureExcelJS(); } catch (e) { window.showAlert(e.message || 'Библиотека ExcelJS не загрузилась.'); return; }

  const loc    = window.activeLoc();
  const drinks = window.withABC(window.enrich());
  const sales  = window.salesMetrics(drinks);
  const baseAvg = window.avgMetrics(drinks);
  const avgPrice = sales.avgCheckTotal || baseAvg.avgPrice;
  const avgProfit = sales.avgProfitTotal || baseAvg.avgProfit;
  const bep    = window.bepCalc(drinks);
  const today  = new Date().toLocaleDateString('ru');
  const todayISO = new Date().toISOString().slice(0, 10);
  const locName  = loc?.name || 'Кофейня';

  // Постоянные расходы / P&L (тот же расчёт что в renderFinModel)
  const totRevMon   = sales.totRevMon;
  const _eff2 = window.getEffectiveCosts(totRevMon);
  const fotInFixed  = _eff2.some(c => /фот|зарплат|зп|оплата.?труда/i.test(c.name));
  const fotAmt      = fotInFixed ? 0 : (typeof payrollTotal === 'function' ? window.payrollTotal() : 0);
  const varExtra    = _eff2.filter(c => c.isVariable).reduce((s, c) => s + c.value, 0);
  const fixedOnly   = _eff2.filter(c => !c.isVariable).reduce((s, c) => s + c.value, 0);
  const totalFixed  = fixedOnly + fotAmt + varExtra;
  const varCostsMon = sales.totCostMon != null ? sales.totCostMon : drinks.reduce((s, d) => s + d.cost * (window.S.portions[d.id] || 0) * window.S.days, 0);
  const avgFC = totRevMon > 0 ? varCostsMon / totRevMon : baseAvg.avgFC;
  const ebit        = totRevMon - varCostsMon - totalFixed;
  const _taxMode2   = window.S.taxMode || 'none';
  const taxAmt      = _taxMode2 === 'usn6' ? totRevMon * 0.06 : _taxMode2 === 'usn15' ? Math.max(0, (totRevMon - varCostsMon - varExtra - fixedOnly - fotAmt) * 0.15) : 0;
  const netProfit   = ebit - taxAmt;
  const investment  = window.S.investment || 0;
  const paybackMon  = investment > 0 && netProfit > 0 ? investment / netProfit : null;
  const TAX_LABELS  = { none: 'Нет', usn6: 'УСН 6%', usn15: 'УСН 15%' };
  const drinkRevMon = sales.drinkRevMon || 0;
  const drinkCostMon = sales.drinkCostMon || 0;
  const addonRevMon = sales.addonRevMon || 0;
  const addonCostMon = sales.addonCostMon || 0;
  const addonPrfMon = sales.addonPrfMon || 0;
  const hasAddonSales = addonRevMon > 0;
  const avgDrinkCheck = sales.avgDrinkCheck || baseAvg.avgPrice;
  const avgAddonCheck = sales.avgAddonCheck || 0;
  const addonSharePct = totRevMon > 0 ? addonRevMon / totRevMon * 100 : 0;
  const fcTarget = 0.28;
  const fcDeltaPp = (avgFC - fcTarget) * 100;
  const safetyAbs = totRevMon - bep.revBEP;
  const safetyPct = totRevMon > 0 ? safetyAbs / totRevMon * 100 : 0;
  const bepCoverRatio = bep.revBEP > 0 ? totRevMon / bep.revBEP : 0;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'MBS Coffee Menu';
  wb.created = new Date();

  // ── Палитра ──────────────────────────────────────────────────────
  const C = {
    green:      '417033', greenLight: 'e7f2e3', greenMid: 'c5e0b4',
    greenDark:  '2e5024', white:      'FFFFFF', gray:     'f4f8f2',
    grayBorder: 'd0e4c8', yellow:     'fff8e1', yellowBd: 'ffe082',
    red:        'fdecea', redBd:      'f5c6c6', redText:  'c0392b',
    goodText:   '1a6b1a', warnText:   'b87e00',
    muted:      '9ca3af', dark:       '1e2e1a',
  };
  const fill   = (argb)  => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
  const border = (style = 'thin') => ({ top:{style}, left:{style}, bottom:{style}, right:{style} });
  const borderB = (style = 'thin') => ({ bottom: { style } });
  const font   = (bold = false, sz = 10, color = '222222', italic = false) => ({ name:'Arial', bold, size:sz, color:{ argb:color }, italic });
  const align  = (h = 'left', v = 'middle', wrap = false) => ({ horizontal:h, vertical:v, wrapText:wrap });

  const applyHeader = (row, fg = C.green, fontColor = C.white, sz = 10) => {
    row.eachCell(cell => {
      cell.fill = fill(fg); cell.font = font(true, sz, fontColor);
      cell.alignment = align('center'); cell.border = border();
    });
    row.height = 22;
  };
  const applyDataRow = (row, even = false, boldCols = []) => {
    row.eachCell((cell, c) => {
      cell.fill = fill(even ? C.gray : C.white);
      cell.font = font(boldCols.includes(c), 9);
      cell.border = borderB();
      if (typeof cell.value === 'number') cell.alignment = align('right');
    });
    row.height = 18;
  };
  const applyTotal = (row, fg = C.greenLight) => {
    row.eachCell(cell => {
      cell.fill = fill(fg); cell.font = font(true, 10);
      cell.border = { top:{style:'medium'}, bottom:{style:'medium'} };
      if (typeof cell.value === 'number') cell.alignment = align('right');
    });
    row.height = 20;
  };
  const addSectionTitle = (ws, title, cols) => {
    const r = ws.addRow([title]);
    ws.mergeCells(r.number, 1, r.number, cols);
    r.getCell(1).fill = fill(C.greenDark);
    r.getCell(1).font = font(true, 11, C.white);
    r.getCell(1).alignment = align('left', 'middle');
    r.height = 24;
    return r;
  };

  // ════════════════════════════════════════════════════════════════
  // Лист 1: Дашборд
  // ════════════════════════════════════════════════════════════════
  const wsDash = wb.addWorksheet('Дашборд', { views:[{ state:'frozen', ySplit:3 }] });
  wsDash.columns = [
    { width: 30 }, { width: 18 }, { width: 30 }, { width: 18 },
  ];

  // Строка-подпись
  const brandRow0 = wsDash.addRow(['Создано в сервисе barista-school.online — Moscow Barista School']);
  wsDash.mergeCells(1, 1, 1, 4);
  brandRow0.getCell(1).font = { name: 'Arial', italic: true, size: 9, color: { argb: '999999' } };
  brandRow0.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  brandRow0.height = 16;

  // Заголовок листа
  const titleRow = wsDash.addRow(['MBS Coffee Menu — финансовый отчёт', '', locName, today]);
  wsDash.mergeCells(titleRow.number, 1, titleRow.number, 2);
  titleRow.getCell(1).fill = fill(C.green);
  titleRow.getCell(1).font = font(true, 14, C.white);
  titleRow.getCell(1).alignment = align('left', 'middle');
  titleRow.getCell(3).fill = fill(C.green);
  titleRow.getCell(3).font = font(false, 11, C.greenLight);
  titleRow.getCell(3).alignment = align('right', 'middle');
  titleRow.getCell(4).fill = fill(C.green);
  titleRow.getCell(4).font = font(false, 11, C.greenLight);
  titleRow.getCell(4).alignment = align('right', 'middle');
  titleRow.height = 32;

  wsDash.addRow([]); // spacer

  // KPI-блок
  addSectionTitle(wsDash, '  Ключевые показатели', 4);
  const kpiData = [
    ['Напитков в меню', drinks.length,                'Выручка / мес',       Math.round(totRevMon)],
    ['Чеков / день', Math.round(sales.totalChecks || sales.totalPort || 0), 'Средний чек, ₽',  Math.round(avgPrice)],
    ...(hasAddonSales ? [['Средний чек напитков, ₽', Math.round(avgDrinkCheck), 'Средний чек доп. продаж, ₽', Math.round(avgAddonCheck)]] : []),
    ['Доп. продажи / мес, ₽', Math.round(addonRevMon), 'Доля доп. продаж', +(addonSharePct).toFixed(1) + '%'],
    ['Доп. прибыль / мес, ₽', Math.round(addonPrfMon), 'Прибыль / мес, ₽', Math.round(sales.totPrfMon)],
    ['Прибыль/чек, ₽', Math.round(avgProfit),        'Чистая прибыль, ₽',  Math.round(netProfit)],
    ['Средний FC%', +(avgFC*100).toFixed(1)+'%', 'Отклонение от 28%', (fcDeltaPp > 0 ? '+' : '') + fcDeltaPp.toFixed(1) + ' п.п.'],
    ['Выручка / день, ₽',Math.round(sales.totRevDay), 'Покрытие ТБУ',      bepCoverRatio > 0 ? +bepCoverRatio.toFixed(1) : '—'],
    ['Запас прочности', (safetyAbs >= 0 ? '+' : '') + safetyPct.toFixed(1) + '%', 'ТБУ (выручка/мес)', Math.round(bep.revBEP)],
    ['Прибыль / день, ₽',Math.round(sales.totPrfDay), 'ТБУ (чеков/день)', bep.cupsDay],
    ...(investment > 0 ? [['Инвестиции, ₽', investment, 'Окупаемость', paybackMon ? +paybackMon.toFixed(1) : 'убыток']] : []),
  ];
  kpiData.forEach((r, i) => {
    const row = wsDash.addRow(r);
    const even = i % 2 === 0;
    const bg = even ? C.greenLight : C.white;
    [1,3].forEach(c => { row.getCell(c).fill = fill(bg); row.getCell(c).font = font(true, 9, C.greenDark); row.getCell(c).border = borderB(); });
    [2,4].forEach(c => {
      row.getCell(c).fill = fill(even ? C.gray : C.white);
      row.getCell(c).font = font(false, 10);
      row.getCell(c).alignment = align('right');
      row.getCell(c).border = borderB();
    });
    row.height = 19;
  });

  wsDash.addRow([]); // spacer

  // Таблица напитков
  addSectionTitle(wsDash, '  Рейтинг напитков по прибыли', 4);
  const drinkHeaderRow = wsDash.addRow(['Напиток','Цена, ₽','Себест., ₽','Прибыль, ₽','FC%','Рейтинг','Порций/день','Выручка/мес, ₽']);
  wsDash.columns = [
    { width:32 }, { width:12 }, { width:12 }, { width:14 },
    { width:9  }, { width:7  }, { width:13 }, { width:16 },
  ];
  applyHeader(drinkHeaderRow);
  window.sortDrinks(drinks).forEach((d, i) => {
    const p = window.S.portions[d.id] || 0;
    const row = wsDash.addRow([d.name, Math.round(d.price), Math.round(d.cost), Math.round(d.profit), +(d.fc*100).toFixed(1), d.abc, p, Math.round(d.price*p*window.S.days)]);
    applyDataRow(row, i%2===1, [4]);
    // FC% цветной
    const fcCell = row.getCell(5);
    if (d.fc <= 0.25)      { fcCell.fill = fill('e6f4e6'); fcCell.font = font(true, 9, C.goodText); }
    else if (d.fc <= 0.30) { fcCell.fill = fill(C.yellow); fcCell.font = font(true, 9, C.warnText); }
    else                   { fcCell.fill = fill(C.red);    fcCell.font = font(true, 9, C.redText);  }
    fcCell.numFmt = '0.0"%"'; fcCell.value = +(d.fc*100).toFixed(1);
    // ABC цветной
    const abcCell = row.getCell(6);
    if (d.abc==='A')      { abcCell.fill = fill('e6f4e6'); abcCell.font = font(true, 9, C.goodText); }
    else if (d.abc==='B') { abcCell.fill = fill(C.yellow); abcCell.font = font(true, 9, C.warnText); }
    else                  { abcCell.fill = fill(C.red);    abcCell.font = font(true, 9, C.redText);  }
    abcCell.alignment = align('center');
    // Числа вправо
    [2,3,4,5,7,8].forEach(c => { row.getCell(c).alignment = align('right'); row.getCell(c).numFmt = '#,##0'; });
    row.getCell(5).numFmt = '0.0';
  });
  // Итого
  const dashTotalRow = wsDash.addRow(['ИТОГО', '', '', '', '', '', drinks.reduce((s,d)=>s+(window.S.portions[d.id]||0),0), Math.round(totRevMon)]);
  applyTotal(dashTotalRow);
  [7,8].forEach(c => { dashTotalRow.getCell(c).alignment = align('right'); dashTotalRow.getCell(c).numFmt = '#,##0'; });

  // ════════════════════════════════════════════════════════════════
  // Лист 2: План продаж
  // ════════════════════════════════════════════════════════════════
  const wsSales = wb.addWorksheet('План продаж', { views:[{ state:'frozen', ySplit:1 }] });
  wsSales.columns = [
    {width:32},{width:11},{width:11},{width:13},{width:13},{width:13},{width:14},{width:15},{width:15},
  ];
  const salesHdr = wsSales.addRow(['Позиция','Цена, ₽','Себест., ₽','Прибыль, ₽','FC%','Объём/день','Выр./день, ₽','Приб./день, ₽','Выр./мес, ₽']);
  applyHeader(salesHdr);
  window.sortDrinks(drinks).forEach((d, i) => {
    const p = window.S.portions[d.id] || 0;
    const row = wsSales.addRow([d.name, Math.round(d.price), Math.round(d.cost), Math.round(d.profit), +(d.fc*100).toFixed(1), p, Math.round(d.price*p), Math.round(d.profit*p), Math.round(d.price*p*window.S.days)]);
    applyDataRow(row, i%2===1, [4]);
    [2,3,4,6,7,8,9].forEach(c => { row.getCell(c).alignment = align('right'); row.getCell(c).numFmt = '#,##0'; });
    row.getCell(5).alignment = align('right'); row.getCell(5).numFmt = '0.0';
    const fcCell = row.getCell(5);
    if (d.fc <= 0.25)      { fcCell.fill = fill('e6f4e6'); fcCell.font = font(false, 9, C.goodText); }
    else if (d.fc <= 0.30) { fcCell.fill = fill(C.yellow); fcCell.font = font(false, 9, C.warnText); }
    else                   { fcCell.fill = fill(C.red);    fcCell.font = font(false, 9, C.redText);  }
  });
  if ((sales.addonRows || []).length) {
    const section = wsSales.addRow(['Дополнительные продажи']);
    wsSales.mergeCells(section.number, 1, section.number, 9);
    section.getCell(1).fill = fill(C.greenLight);
    section.getCell(1).font = font(true, 10, C.greenDark);
    (sales.addonRows || []).forEach((item, i) => {
      const row = wsSales.addRow([
        item.name,
        Math.round(item.price),
        Math.round(item.cost),
        Math.round(item.price - item.cost),
        item.price > 0 ? +(item.cost / item.price * 100).toFixed(1) : 0,
        +(item.unitsDay || 0).toFixed(1),
        Math.round(item.revDay),
        Math.round(item.prfDay),
        Math.round(item.revDay * window.S.days),
      ]);
      applyDataRow(row, i%2===1, [4]);
      [2,3,4,5,6,7,8,9].forEach(c => { row.getCell(c).alignment = align('right'); row.getCell(c).numFmt = '#,##0'; });
      row.getCell(5).numFmt = '0.0';
    });
  }
  const salesTotRow = wsSales.addRow(['ИТОГО','','','','', drinks.reduce((s,d)=>s+(window.S.portions[d.id]||0),0), Math.round(sales.totRevDay), Math.round(sales.totPrfDay), Math.round(totRevMon)]);
  applyTotal(salesTotRow);
  [6,7,8,9].forEach(c => { salesTotRow.getCell(c).alignment = align('right'); salesTotRow.getCell(c).numFmt = '#,##0'; });

  // ════════════════════════════════════════════════════════════════
  // Лист 3: P&L
  // ════════════════════════════════════════════════════════════════
  const wsFinance = wb.addWorksheet('P&L — Финансы');
  wsFinance.columns = [ {width:40}, {width:18}, {width:14} ];

  addSectionTitle(wsFinance, '  P&L — Отчёт о прибылях и убытках', 3);
  const plHeader = wsFinance.addRow(['Статья', 'Сумма / мес, ₽', '% от выручки']);
  applyHeader(plHeader);

  const plItems = [
    { label: 'Выручка от продаж',          val: totRevMon,           bold: true },
    ...(hasAddonSales ? [
      { label: '  · Напитки',              val: drinkRevMon,          sub: true },
      { label: '  · Дополнительные продажи', val: addonRevMon,        sub: true },
    ] : []),
    { label: '  − Себестоимость сырья',     val: -varCostsMon,        bold: false },
    ...(hasAddonSales ? [
      { label: '    · Себестоимость напитков', val: -drinkCostMon,     sub: true },
      { label: '    · Себестоимость доп. продаж', val: -addonCostMon,  sub: true },
    ] : []),
    { label: 'Валовая прибыль',             val: totRevMon-varCostsMon, bold: true, sep: true },
    ...window.getEffectiveCosts(totRevMon).map(c => ({ label: `  − ${c.name}${c.isVariable?' (перем.)':''}`, val: -c.value })),
    ...(fotAmt > 0 ? [{ label: '  − ФОТ', val: -fotAmt }] : []),
    { label: 'EBIT (операц. прибыль)',      val: ebit,                bold: true, sep: true },
    ...(taxAmt > 0 ? [{ label: `  − Налог (${TAX_LABELS[window.S.taxMode]})`, val: -taxAmt }] : []),
    { label: 'ЧИСТАЯ ПРИБЫЛЬ',             val: netProfit,           bold: true, accent: true },
  ];

  plItems.forEach((item, i) => {
    const pct = totRevMon > 0 ? +(item.val/totRevMon*100).toFixed(1) : 0;
    const row = wsFinance.addRow([item.label, Math.round(Math.abs(item.val)), pct]);
    row.height = item.bold ? 20 : 17;
    const isAccent = item.accent;
    if (isAccent) {
      const bg = netProfit >= 0 ? 'e6f4e6' : C.red;
      const tc = netProfit >= 0 ? C.goodText : C.redText;
      row.eachCell(cell => { cell.fill = fill(bg); cell.font = font(true, 11, tc); cell.border = { top:{style:'medium'}, bottom:{style:'double'} }; });
    } else if (item.bold) {
      row.eachCell(cell => { cell.fill = fill(C.greenLight); cell.font = font(true, 10); if (item.sep) cell.border = { top:{style:'thin', color:{argb:C.greenMid}} }; });
    } else if (item.sub) {
      row.eachCell((cell, c) => { cell.fill = fill(C.gray); cell.font = font(false, 9, c === 1 ? '555555' : '222222'); });
    } else {
      row.eachCell((cell, c) => { cell.fill = fill(i%2===0 ? C.white : C.gray); cell.font = font(false, 9); });
    }
    row.getCell(1).alignment = align('left', 'middle');
    row.getCell(2).alignment = align('right');
    row.getCell(2).numFmt = '#,##0';
    row.getCell(3).alignment = align('right');
    row.getCell(3).numFmt = '0.0';
    if (item.val < 0 && !item.bold) row.getCell(2).font = { ...row.getCell(2).font, color: { argb: C.redText } };
  });

  wsFinance.addRow([]);
  addSectionTitle(wsFinance, '  Параметры', 3);
  const params = [
    ['Дней в месяце', window.S.days, ''],
    ['Целевой FC%', +(window.S.targetFC*100).toFixed(1), '%'],
    ['FC% общий', +(avgFC*100).toFixed(1), '%'],
    ['Чеков / день', Math.round(sales.totalChecks || sales.totalPort || 0), ''],
    ['Средний чек, ₽', Math.round(avgPrice), ''],
    ...(hasAddonSales ? [['Доп. продажи / мес, ₽', Math.round(addonRevMon), '']] : []),
    ['Налоговый режим', TAX_LABELS[window.S.taxMode] || window.S.taxMode, ''],
    ...(investment > 0 ? [['Инвестиции, ₽', investment, ''], ['Срок окупаемости, мес', paybackMon ? +paybackMon.toFixed(1) : '—', '']] : []),
  ];
  params.forEach((r, i) => {
    const row = wsFinance.addRow(r);
    row.getCell(1).fill = fill(i%2===0 ? C.greenLight : C.white); row.getCell(1).font = font(true, 9);
    row.getCell(2).fill = fill(i%2===0 ? C.gray : C.white); row.getCell(2).font = font(false, 10); row.getCell(2).alignment = align('right');
    row.getCell(2).numFmt = '#,##0'; row.height = 18;
  });

  // ════════════════════════════════════════════════════════════════
  // Лист 4: Себестоимость
  // ════════════════════════════════════════════════════════════════
  const wsCost = wb.addWorksheet('Себестоимость', { views:[{ state:'frozen', ySplit:1 }] });
  wsCost.columns = [ {width:32},{width:10},{width:11},{width:11},{width:12},{width:12},{width:12} ];
  const costHdr = wsCost.addRow(['Напиток','Группа','Объём, мл','Цена, ₽','Себест., ₽','Прибыль, ₽','FC%']);
  applyHeader(costHdr);
  const sortedForCost = [...drinks].sort((a,b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name,'ru'));
  let lastGrp = null;
  sortedForCost.forEach((d, i) => {
    if (d.group !== lastGrp) {
      lastGrp = d.group;
      const grpRow = wsCost.addRow([GROUP_LABEL[d.group]||d.group]);
      wsCost.mergeCells(grpRow.number, 1, grpRow.number, 7);
      grpRow.getCell(1).fill = fill(C.greenMid); grpRow.getCell(1).font = font(true, 9, C.greenDark);
      grpRow.height = 16;
    }
    const row = wsCost.addRow([d.name, d.group, d.vol, Math.round(d.price), Math.round(d.cost), Math.round(d.profit), +(d.fc*100).toFixed(1)]);
    applyDataRow(row, i%2===1);
    [4,5,6].forEach(c => { row.getCell(c).alignment = align('right'); row.getCell(c).numFmt = '#,##0'; });
    row.getCell(3).alignment = align('right');
    row.getCell(7).alignment = align('right');
    row.getCell(7).numFmt = '0.0';
    const fcCell = row.getCell(7);
    if (d.fc <= 0.25)      { fcCell.fill = fill('e6f4e6'); fcCell.font = font(false, 9, C.goodText); }
    else if (d.fc <= 0.30) { fcCell.fill = fill(C.yellow); fcCell.font = font(false, 9, C.warnText); }
    else                   { fcCell.fill = fill(C.red);    fcCell.font = font(false, 9, C.redText);  }
  });

  // ════════════════════════════════════════════════════════════════
  // Сохранить
  // ════════════════════════════════════════════════════════════════
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url  = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `mbs-${locName.replace(/\s+/g,'_')}-${todayISO}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
export function exportSuppliersPDF() {
  const book   = window.S.supplierBook || [];
  const sups   = window.S.suppliers   || {};
  const today  = new Date().toLocaleDateString('ru');
  const loc    = window.activeLoc();
  const locName = loc?.name || 'Кофейня';

  // Собираем поставщиков с привязанными ингредиентами
  const byName = {};
  Object.entries(sups).forEach(([key, v]) => {
    if (!v || !v.name) return;
    if (!byName[v.name]) byName[v.name] = { ...v, mats: [] };
    if (window.MAT[key]) byName[v.name].mats.push(window.MAT[key].name);
  });
  book.forEach(b => {
    if (!byName[b.name]) byName[b.name] = { name: b.name, phone: b.phone||'', note: b.note||'', site: b.site||'', mats: [] };
    else {
      if (!byName[b.name].phone && b.phone) byName[b.name].phone = b.phone;
      if (!byName[b.name].note  && b.note)  byName[b.name].note  = b.note;
      if (!byName[b.name].site  && b.site)  byName[b.name].site  = b.site;
    }
  });
  const list = Object.values(byName);

  const rows = list.map((s, i) => `
    <tr>
      <td class="num">${i+1}</td>
      <td class="bold">${s.name}</td>
      <td>${s.phone || '—'}</td>
      <td>${s.note  || '—'}</td>
      <td>${s.site  ? `<span style="color:#417033">${s.site.replace(/^https?:\/\//,'')}</span>` : '—'}</td>
      <td>${s.mats.length ? s.mats.join(', ') : '—'}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Поставщики — ${locName}</title>
<link href="/vendor/fonts/mulish.css" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Mulish',Arial,sans-serif;font-size:10pt;color:#222;background:#fff}
@page{size:A4 landscape;margin:10mm}
.cover{background:#417033;color:#fff;padding:16px 20px;margin-bottom:16px;border-radius:6px;display:flex;justify-content:space-between;align-items:flex-end}
.cover h1{font-size:15pt;font-weight:800}
.cover p{font-size:9pt;opacity:.85;margin-top:3px}
.cover-right{text-align:right;font-size:9pt;opacity:.8}
table{width:100%;border-collapse:collapse;font-size:9pt}
th{background:#417033;color:#fff;padding:6px 8px;text-align:left;font-weight:700}
td{padding:5px 8px;border-bottom:1px solid #e4ede0;vertical-align:top}
tr:nth-child(even) td{background:#fafcf9}
td.num{color:#999;width:28px;text-align:center}
td.bold{font-weight:700}
.footer{margin-top:16px;text-align:right;font-size:8pt;color:#666;border-top:1px solid #ddd;padding-top:4px}
@media print{.cover,th{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="cover">
  <div><h1>Список поставщиков</h1><p>${locName} &nbsp;·&nbsp; ${today}</p></div>
  <div class="cover-right">${list.length} поставщиков</div>
</div>
<table>
  <thead><tr><th>#</th><th>Название</th><th>Телефон / email</th><th>Заметка</th><th>Сайт</th><th>Ингредиенты</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="footer">Московская школа бариста &nbsp;·&nbsp; baristaschool.ru</div>
</body></html>`;

  window._printViaIframe(html, 'mbs-suppliers');
}

export async function exportSuppliersXLSX() {
  try { await ensureExcelJS(); } catch (e) { window.showAlert(e.message || 'Библиотека ExcelJS не загрузилась.'); return; }
  const book   = window.S.supplierBook || [];
  const sups   = window.S.suppliers   || {};
  const loc    = window.activeLoc();
  const locName = loc?.name || 'Кофейня';
  const todayISO = new Date().toISOString().slice(0,10);

  const byName = {};
  Object.entries(sups).forEach(([key, v]) => {
    if (!v || !v.name) return;
    if (!byName[v.name]) byName[v.name] = { ...v, mats: [] };
    if (window.MAT[key]) byName[v.name].mats.push(window.MAT[key].name);
  });
  book.forEach(b => {
    if (!byName[b.name]) byName[b.name] = { name: b.name, phone: b.phone||'', note: b.note||'', site: b.site||'', mats: [] };
    else {
      if (!byName[b.name].phone && b.phone) byName[b.name].phone = b.phone;
      if (!byName[b.name].note  && b.note)  byName[b.name].note  = b.note;
      if (!byName[b.name].site  && b.site)  byName[b.name].site  = b.site;
    }
  });
  const list = Object.values(byName);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'MBS Coffee Menu';
  const ws = wb.addWorksheet('Поставщики');
  ws.columns = [
    { header: '№',            key: 'n',     width: 5  },
    { header: 'Название',     key: 'name',  width: 28 },
    { header: 'Телефон',      key: 'phone', width: 20 },
    { header: 'Заметка',      key: 'note',  width: 36 },
    { header: 'Сайт',         key: 'site',  width: 30 },
    { header: 'Ингредиенты',  key: 'mats',  width: 42 },
  ];
  // Строка-подпись
  ws.spliceRows(1, 0, ['Создано в сервисе barista-school.online — Moscow Barista School']);
  ws.mergeCells(1, 1, 1, 6);
  const brandRowS = ws.getRow(1);
  brandRowS.getCell(1).font = { name: 'Arial', italic: true, size: 9, color: { argb: '999999' } };
  brandRowS.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  brandRowS.height = 16;
  // Заголовок
  const hRow = ws.getRow(2);
  hRow.eachCell(cell => {
    cell.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:'417033' } };
    cell.font = { name:'Arial', bold:true, size:10, color:{ argb:'FFFFFF' } };
    cell.alignment = { vertical:'middle', horizontal:'center' };
  });
  hRow.height = 20;
  list.forEach((s, i) => {
    const r = ws.addRow({ n: i+1, name: s.name, phone: s.phone||'', note: s.note||'', site: s.site||'', mats: s.mats.join(', ') });
    r.height = 18;
    r.eachCell(cell => {
      cell.border = { bottom: { style:'thin', color:{ argb:'d0e4c8' } } };
      cell.alignment = { vertical:'middle', wrapText:true };
    });
    if (i % 2 === 1) r.eachCell(c => { c.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:'f4f8f2' } }; });
  });
  const buf  = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url  = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `mbs-suppliers-${locName.replace(/\s+/g,'_')}-${todayISO}.xlsx`;
  a.click(); setTimeout(() => URL.revokeObjectURL(url), 3000);
}

// ════════════════════════════════════════════════════════════════════
//  EXPORT — Ингредиенты + Полуфабрикаты (PDF + XLSX)
// ════════════════════════════════════════════════════════════════════

export function exportMaterialsPDF() {
  const today   = new Date().toLocaleDateString('ru');
  const loc     = window.activeLoc();
  const locName = loc?.name || 'Кофейня';
  const sups    = window.S.suppliers || {};

  // Ингредиенты по категориям
  const catOrder = Object.keys(MAT_CATEGORIES).sort((a,b) => (MAT_CATEGORIES[a].order||99)-(MAT_CATEGORIES[b].order||99));
  let matRows = '';
  let globalN = 0;
  catOrder.forEach(cat => {
    const items = Object.entries(MAT).filter(([,m]) => (m.category||'other') === cat);
    if (!items.length) return;
    const catLabel = (MAT_CATEGORIES[cat]||{label:cat}).label;
    matRows += `<tr class="cat-row"><td colspan="7">${catLabel}</td></tr>`;
    items.forEach(([key, m]) => {
      globalN++;
      const sup = sups[key];
      matRows += `<tr>
        <td class="num">${globalN}</td>
        <td class="bold">${m.name}</td>
        <td class="c">${m.unit}</td>
        <td class="r">${m.size ? m.size : '—'}</td>
        <td class="r">${m.price ? Math.round(m.price)+' ₽' : '—'}</td>
        <td>${sup ? sup.name : '—'}</td>
      </tr>`;
    });
  });

  // Полуфабрикаты
  let semiRows = SEMI.map((s, i) => {
    const cost = (s.recipe||[]).reduce((sum, r) => {
      if (r.mat && window.MAT[r.mat]) {
        const pricePerUnit = window.MAT[r.mat].price / (window.MAT[r.mat].size || 1);
        const amt = r.amt * (1 + (r.loss||0)/100);
        return sum + pricePerUnit * amt;
      }
      return sum;
    }, 0);
    const costPer = s.yield ? cost / s.yield : 0;
    return `<tr>
      <td class="num">${i+1}</td>
      <td class="bold">${s.name}</td>
      <td class="c">${s.unit||'г'}</td>
      <td class="r">${s.yield||'—'}</td>
      <td class="r">${costPer ? costPer.toFixed(2)+' ₽/'+s.unit : '—'}</td>
      <td>${(s.recipe||[]).map(r => r.mat && window.MAT[r.mat] ? window.MAT[r.mat].name : '—').join(', ')}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Ингредиенты — ${locName}</title>
<link href="/vendor/fonts/mulish.css" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Mulish',Arial,sans-serif;font-size:9.5pt;color:#222;background:#fff}
@page{size:A4 landscape;margin:10mm}
.cover{background:#417033;color:#fff;padding:14px 20px;margin-bottom:14px;border-radius:6px;display:flex;justify-content:space-between;align-items:flex-end}
.cover h1{font-size:14pt;font-weight:800}.cover p{font-size:9pt;opacity:.85;margin-top:3px}
.cover-right{text-align:right;font-size:9pt;opacity:.8}
.sec-title{font-size:11pt;font-weight:800;color:#417033;margin:14px 0 6px;padding-bottom:3px;border-bottom:2px solid #c5e0b4}
table{width:100%;border-collapse:collapse;font-size:8.5pt;margin-bottom:10px}
th{background:#417033;color:#fff;padding:5px 7px;text-align:left;font-weight:700}
th.r,td.r{text-align:right}th.c,td.c{text-align:center}
td{padding:4px 7px;border-bottom:1px solid #e4ede0;vertical-align:middle}
tr:nth-child(even) td{background:#fafcf9}
td.num{color:#999;width:26px;text-align:center}
td.bold{font-weight:700}
.cat-row td{background:#eef5eb!important;font-weight:700;font-size:8pt;color:#417033;text-transform:uppercase;letter-spacing:.04em;padding:4px 7px}
.footer{margin-top:14px;text-align:right;font-size:8pt;color:#666;border-top:1px solid #ddd;padding-top:4px}
@media print{.cover,th,.cat-row td{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="cover">
  <div><h1>Ингредиенты и полуфабрикаты</h1><p>${locName} &nbsp;·&nbsp; ${today}</p></div>
  <div class="cover-right">${Object.keys(MAT).length} ингредиентов &nbsp;·&nbsp; ${SEMI.length} полуфабрикатов</div>
</div>
<div class="sec-title">☕ Ингредиенты</div>
<table>
  <thead><tr><th>#</th><th>Название</th><th class="c">Ед.</th><th class="r">Объём ед.</th><th class="r">Цена ед.</th><th>Поставщик</th></tr></thead>
  <tbody>${matRows}</tbody>
</table>
${SEMI.length ? `
<div class="sec-title" style="page-break-before:auto">🥣 Полуфабрикаты</div>
<table>
  <thead><tr><th>#</th><th>Название</th><th class="c">Ед.</th><th class="r">Выход</th><th class="r">Себест./ед.</th><th>Состав</th></tr></thead>
  <tbody>${semiRows}</tbody>
</table>` : ''}
<div class="footer">Московская школа бариста &nbsp;·&nbsp; baristaschool.ru</div>
</body></html>`;

  window._printViaIframe(html, 'mbs-materials');
}

export async function exportMaterialsXLSX() {
  try { await ensureExcelJS(); } catch (e) { window.showAlert(e.message || 'Библиотека ExcelJS не загрузилась.'); return; }
  const loc      = window.activeLoc();
  const locName  = loc?.name || 'Кофейня';
  const todayISO = new Date().toISOString().slice(0,10);
  const sups     = window.S.suppliers || {};

  const wb = new ExcelJS.Workbook();
  wb.creator = 'MBS Coffee Menu';

  // ── Лист 1: Ингредиенты ─────────────────────────────────────────
  const ws1 = wb.addWorksheet('Ингредиенты');
  ws1.columns = [
    { header:'№',           key:'n',       width:5  },
    { header:'Категория',   key:'cat',     width:18 },
    { header:'Название',    key:'name',    width:28 },
    { header:'Ед.',         key:'unit',    width:8  },
    { header:'Объём ед.',   key:'size',    width:12 },
    { header:'Цена ед., ₽', key:'price',   width:14 },
    { header:'Поставщик',   key:'sup',     width:24 },
  ];
  const fillG  = argb => ({ type:'pattern', pattern:'solid', fgColor:{ argb } });
  const fnt    = (bold, sz=10, color='222222') => ({ name:'Arial', bold, size:sz, color:{ argb:color } });
  // Строка-подпись
  ws1.spliceRows(1, 0, ['Создано в сервисе barista-school.online — Moscow Barista School']);
  ws1.mergeCells(1, 1, 1, 7);
  const brandRowM = ws1.getRow(1);
  brandRowM.getCell(1).font = { name: 'Arial', italic: true, size: 9, color: { argb: '999999' } };
  brandRowM.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  brandRowM.height = 16;
  const hRow1  = ws1.getRow(2);
  hRow1.eachCell(c => { c.fill=fillG('417033'); c.font=fnt(true,10,'FFFFFF'); c.alignment={vertical:'middle',horizontal:'center'}; });
  hRow1.height = 20;

  const catOrder = Object.keys(MAT_CATEGORIES).sort((a,b)=>(MAT_CATEGORIES[a].order||99)-(MAT_CATEGORIES[b].order||99));
  let globalN = 0;
  catOrder.forEach(cat => {
    const items = Object.entries(MAT).filter(([,m]) => (m.category||'other') === cat);
    if (!items.length) return;
    const catLabel = (MAT_CATEGORIES[cat]||{label:cat}).label;
    // Строка-заголовок категории
    const cr = ws1.addRow({ n:'', cat: catLabel.toUpperCase(), name:'', unit:'', size:'', price:'', ppu:'', sup:'' });
    cr.eachCell(c => { c.fill=fillG('eef5eb'); c.font=fnt(true,9,'417033'); });
    cr.height = 16;
    ws1.mergeCells(cr.number, 2, cr.number, 8);

    items.forEach(([key, m]) => {
      globalN++;
      const sup  = sups[key];
      const r    = ws1.addRow({ n:globalN, cat:'', name:m.name, unit:m.unit, size:m.size||'', price:m.price||'', sup:sup?sup.name:'' });
      r.height   = 17;
      r.eachCell(c => { c.border={ bottom:{style:'thin',color:{argb:'d0e4c8'}} }; c.alignment={vertical:'middle'}; });
      if (globalN%2===0) r.eachCell(c=>{ c.fill=fillG('f4f8f2'); });
      // Числа — формат
      r.getCell('price').numFmt = '#,##0.00';
      r.getCell('n').alignment  = { horizontal:'center', vertical:'middle' };
      r.getCell('unit').alignment = { horizontal:'center', vertical:'middle' };
    });
  });

  // ── Лист 2: Полуфабрикаты ────────────────────────────────────────
  if (SEMI.length) {
    const ws2 = wb.addWorksheet('Полуфабрикаты');
    ws2.columns = [
      { header:'№',            key:'n',    width:5  },
      { header:'Название',     key:'name', width:28 },
      { header:'Ед.',          key:'unit', width:8  },
      { header:'Выход',        key:'yld',  width:10 },
      { header:'Себест./ед.',  key:'cost', width:14 },
      { header:'Состав',       key:'comp', width:48 },
    ];
    const hRow2 = ws2.getRow(1);
    hRow2.eachCell(c => { c.fill=fillG('417033'); c.font=fnt(true,10,'FFFFFF'); c.alignment={vertical:'middle',horizontal:'center'}; });
    hRow2.height = 20;
    SEMI.forEach((s, i) => {
      const cost = (s.recipe||[]).reduce((sum, r) => {
        if (r.mat && window.MAT[r.mat]) {
          const ppu = window.MAT[r.mat].price / (window.MAT[r.mat].size||1);
          return sum + ppu * r.amt * (1+(r.loss||0)/100);
        }
        return sum;
      }, 0);
      const costPer = s.yield ? +(cost/s.yield).toFixed(2) : '';
      const comp    = (s.recipe||[]).map(r => r.mat&&window.MAT[r.mat]?window.MAT[r.mat].name:'?').join(', ');
      const r = ws2.addRow({ n:i+1, name:s.name, unit:s.unit||'г', yld:s.yield||'', cost:costPer, comp });
      r.height=17;
      r.eachCell(c=>{ c.border={bottom:{style:'thin',color:{argb:'d0e4c8'}}}; c.alignment={vertical:'middle',wrapText:true}; });
      if (i%2===1) r.eachCell(c=>{ c.fill=fillG('f4f8f2'); });
      r.getCell('cost').numFmt='#,##0.00';
      r.getCell('n').alignment={horizontal:'center',vertical:'middle'};
    });
  }

  const buf  = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href=url;
  a.download = `mbs-materials-${locName.replace(/\s+/g,'_')}-${todayISO}.xlsx`;
  a.click(); setTimeout(()=>URL.revokeObjectURL(url),3000);
}
export function buildBEPChart(cupsMonth, revBEP, avgPrice, avgCost, totalFixed, planCups) {
  const W=600, H=268, PL=70, PR=16, PT=28, PB=52;
  const cw = W-PL-PR, ch = H-PT-PB;
  const dark = document.body.classList.contains('dark');

  const clrRev       = dark ? '#89d185' : '#417033';
  const clrCost      = dark ? '#f48771' : '#d9534f';
  const clrProfit    = dark ? 'rgba(137,209,133,.16)' : 'rgba(65,112,51,.10)';
  const clrLoss      = dark ? 'rgba(244,135,113,.13)' : 'rgba(217,83,79,.08)';
  const clrPlan      = dark ? '#4fc3f7' : '#0077b6';
  const clrBEP       = dark ? '#d7ba7d' : '#b38600';
  const clrGrid      = dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)';
  const clrTxt       = dark ? '#6e7681' : '#9ca3af';
  const clrTxtStrong = dark ? '#aaaaaa' : '#5a6270';
  const clrAxis      = dark ? 'rgba(255,255,255,.14)' : 'rgba(0,0,0,.12)';
  const clrCalloutBg = dark ? '#2a2a2a' : '#ffffff';
  const clrCalloutBorder = dark ? 'rgba(215,186,125,.6)' : 'rgba(179,134,0,.4)';
  const clrPlanCalloutBg = dark ? '#1a2a33' : '#f0f8ff';
  const clrPlanCalloutBorder = dark ? 'rgba(79,195,247,.5)' : 'rgba(0,119,182,.3)';
  const bg           = dark ? '#252526' : '#ffffff';
  const ff = 'system-ui,sans-serif';

  const fmt = v => v >= 1e6 ? (v/1e6).toFixed(1)+'М₽' : v >= 1e3 ? Math.round(v/1e3)+'к₽' : Math.round(v)+'₽';
  const fmtC = v => v >= 1e6 ? (v/1e6).toFixed(1)+'м' : v >= 1e3 ? Math.round(v/1e3)+'к' : Math.round(v);

  const cupsMax = Math.max(cupsMonth * 2.6, planCups * 1.4, 10);
  const yMax    = Math.max(avgPrice * cupsMax, totalFixed + avgCost * cupsMax) * 1.1;

  const cx = c => PL + (c / cupsMax) * cw;
  const cy = v => PT + ch - Math.max(0, Math.min(1, v / yMax)) * ch;

  const rx0 = cx(0), ry0 = cy(0), rxM = cx(cupsMax), ryM = cy(avgPrice * cupsMax);
  const costX0 = cx(0), costY0 = cy(totalFixed), costXM = cx(cupsMax), costYM = cy(totalFixed + avgCost * cupsMax);
  const bx = cx(cupsMonth), by = cy(revBEP);
  const px = planCups > 0 ? cx(planCups) : null;

  const lossPoly = `${cx(0)},${cy(0)} ${bx},${by} ${cx(0)},${cy(totalFixed)}`;
  const profPoly = `${bx},${by} ${rxM},${ryM} ${rxM},${costYM} ${bx},${by}`;

  // Сетка
  const gridLines = [1,2,3,4].map(i => {
    const yv = (yMax / 4) * i;
    return `<line x1="${PL}" y1="${cy(yv)}" x2="${PL+cw}" y2="${cy(yv)}" stroke="${clrGrid}" stroke-width="1"/>`;
  }).join('');
  const vGridLines = [1,2,3,4].map(i => {
    const x = cx((cupsMax / 4) * i);
    return `<line x1="${x}" y1="${PT}" x2="${x}" y2="${PT+ch}" stroke="${clrGrid}" stroke-width="1"/>`;
  }).join('');

  // Подписи Y — с символом ₽
  const yLabels = [0,1,2,3,4].map(i => {
    const v = (yMax / 4) * i;
    return `<text x="${PL-8}" y="${cy(v)+4}" text-anchor="end" font-size="10" font-family="${ff}" fill="${clrTxt}">${fmtC(v)}₽</text>`;
  }).join('');

  // Подписи X
  const xLabels = [0,1,2,3,4].map(i => {
    const v = Math.round((cupsMax / 4) * i);
    return `<text x="${cx(v)}" y="${PT+ch+15}" text-anchor="middle" font-size="10" font-family="${ff}" fill="${clrTxt}">${v}</text>`;
  }).join('');

  // Названия осей
  const yAxisTitle = `<text transform="rotate(-90 14 ${PT+ch/2})" x="14" y="${PT+ch/2+4}" text-anchor="middle" font-size="10" font-family="${ff}" font-weight="600" fill="${clrTxtStrong}">Сумма, ₽</text>`;
  const xAxisTitle = `<text x="${PL+cw/2}" y="${H-4}" text-anchor="middle" font-size="10" font-family="${ff}" font-weight="600" fill="${clrTxtStrong}">Чашек в месяц</text>`;

  // Подписи зон — лёгкий watermark-текст, не перекрывает данные
  const zoneLabels = `
    <text x="${(PL + bx) / 2}" y="${Math.max(PT+16, Math.min(PT+ch-10, (PT+ch+by)/2-6))}" text-anchor="middle"
      font-size="10" font-family="${ff}" font-weight="700" fill="${clrCost}" opacity=".4">УБЫТОК</text>
    <text x="${(bx+PL+cw)/2}" y="${Math.max(PT+16, Math.min(PT+ch-10, (PT+by)/2+14))}" text-anchor="middle"
      font-size="10" font-family="${ff}" font-weight="700" fill="${clrRev}" opacity=".4">ПРИБЫЛЬ</text>
  `;

  // Линия плана — всегда видна, подсказка появляется при наведении
  const planLine = px !== null ? (() => {
    const labelRight = px < PL + cw * 0.75;
    const cX = labelRight ? px + 14 : px - 14;
    const cAnchor = labelRight ? 'start' : 'end';
    const cW = 70, cH = 32;
    const cLeft = labelRight ? cX : cX - cW;
    return `
      <line x1="${px}" y1="${PT}" x2="${px}" y2="${PT+ch}" stroke="${clrPlan}" stroke-width="1.5" stroke-dasharray="5,3" opacity=".8"/>
      <g class="bep-plan-hotspot" style="cursor:pointer">
        <rect x="${px-10}" y="${PT}" width="20" height="${ch}" fill="transparent"/>
        <g class="bep-plan-tip">
          <rect x="${cLeft}" y="${PT+6}" width="${cW}" height="${cH}" rx="5"
            fill="${clrPlanCalloutBg}" stroke="${clrPlanCalloutBorder}" stroke-width="1.5"
            filter="drop-shadow(0 2px 6px rgba(0,0,0,.12))"/>
          <text x="${cLeft + cW/2}" y="${PT+19}" text-anchor="middle" font-size="9" font-family="${ff}" font-weight="700" fill="${clrPlan}">Ваш план</text>
          <text x="${cLeft + cW/2}" y="${PT+31}" text-anchor="middle" font-size="10" font-family="${ff}" font-weight="800" fill="${clrPlan}">${Math.round(planCups)} чаш/мес</text>
        </g>
      </g>
    `;
  })() : '';

  // Точка ТБУ — маркер всегда виден, подсказка появляется при наведении
  const calloutW = 100, calloutH = 52;
  const calloutRight = bx < PL + cw * 0.52;
  const calloutX = calloutRight ? bx + 16 : bx - calloutW - 16;
  const calloutY = Math.max(PT + 4, Math.min(PT + ch - calloutH - 4, by - calloutH/2));
  const connLineX2 = calloutRight ? calloutX : calloutX + calloutW;
  const bepCallout = `
    <line x1="${bx}" y1="${by+7}" x2="${bx}" y2="${PT+ch}" stroke="${clrBEP}" stroke-width="1" stroke-dasharray="3,2" opacity=".45"/>
    <g class="bep-hotspot" style="cursor:pointer">
      <circle cx="${bx}" cy="${by}" r="18" fill="transparent"/>
      <circle cx="${bx}" cy="${by}" r="7" fill="${clrBEP}" stroke="${bg}" stroke-width="2.5"/>
      <circle cx="${bx}" cy="${by}" r="3" fill="${bg}"/>
      <g class="bep-tip">
        <line x1="${bx}" y1="${by}" x2="${connLineX2}" y2="${calloutY + calloutH/2}" stroke="${clrBEP}" stroke-width="1" stroke-dasharray="3,2" opacity=".5"/>
        <rect x="${calloutX}" y="${calloutY}" width="${calloutW}" height="${calloutH}" rx="7"
          fill="${clrCalloutBg}" stroke="${clrCalloutBorder}" stroke-width="1.5"
          filter="drop-shadow(0 3px 8px rgba(0,0,0,.15))"/>
        <text x="${calloutX + calloutW/2}" y="${calloutY + 13}" text-anchor="middle"
          font-size="9" font-family="${ff}" font-weight="800" fill="${clrBEP}">Точка безубыточности</text>
        <line x1="${calloutX+8}" y1="${calloutY+18}" x2="${calloutX+calloutW-8}" y2="${calloutY+18}"
          stroke="${clrBEP}" stroke-width=".5" opacity=".35"/>
        <text x="${calloutX+8}" y="${calloutY+30}" font-size="9" font-family="${ff}" fill="${clrTxtStrong}">Чашек/мес:</text>
        <text x="${calloutX+calloutW-8}" y="${calloutY+30}" text-anchor="end"
          font-size="10" font-family="${ff}" font-weight="700" fill="${clrBEP}">${Math.round(cupsMonth)}</text>
        <text x="${calloutX+8}" y="${calloutY+44}" font-size="9" font-family="${ff}" fill="${clrTxtStrong}">Выручка:</text>
        <text x="${calloutX+calloutW-8}" y="${calloutY+44}" text-anchor="end"
          font-size="10" font-family="${ff}" font-weight="700" fill="${clrBEP}">${fmt(revBEP)}</text>
      </g>
    </g>
  `;

  // Подписи конца линий
  const lineLabels = `
    <text x="${rxM-4}" y="${ryM-7}" text-anchor="end" font-size="9" font-family="${ff}" font-weight="700" fill="${clrRev}">Выручка</text>
    <text x="${costXM-4}" y="${costYM-7}" text-anchor="end" font-size="9" font-family="${ff}" font-weight="700" fill="${clrCost}">Расходы</text>
  `;

  // Легенда снизу по центру
  const legCY = PT + ch + 32;
  const legItems = [
    { type:'line', color:clrRev,  dash:false, label:'Выручка' },
    { type:'line', color:clrCost, dash:true,  label:'Расходы' },
    { type:'rect', color:clrProfit, border:clrRev,  label:'Прибыль' },
    { type:'rect', color:clrLoss,   border:clrCost, label:'Убыток' },
  ];
  const legSpacing = 80, legTotalW = legSpacing * legItems.length - 16;
  const legStart = (W - legTotalW) / 2;
  const legend = legItems.map((item, i) => {
    const lx = legStart + i * legSpacing;
    const icon = item.type === 'line'
      ? `<line x1="${lx}" y1="${legCY}" x2="${lx+16}" y2="${legCY}" stroke="${item.color}" stroke-width="2" ${item.dash?'stroke-dasharray="5,3"':''}/>`
      : `<rect x="${lx}" y="${legCY-5}" width="12" height="8" rx="2" fill="${item.color}" stroke="${item.border}" stroke-width="1"/>`;
    return `${icon}<text x="${lx+20}" y="${legCY+4}" font-size="10" font-family="${ff}" fill="${clrTxtStrong}">${item.label}</text>`;
  }).join('');

  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block;overflow:visible" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <clipPath id="chart-clip"><rect x="${PL}" y="${PT}" width="${cw}" height="${ch}"/></clipPath>
      <linearGradient id="grad-rev" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${clrRev}" stop-opacity=".15"/>
        <stop offset="100%" stop-color="${clrRev}" stop-opacity="0"/>
      </linearGradient>
      <style>
        .bep-tip { visibility: hidden; pointer-events: none; }
        .bep-hotspot:hover .bep-tip { visibility: visible; }
        .bep-plan-tip { visibility: hidden; pointer-events: none; }
        .bep-plan-hotspot:hover .bep-plan-tip { visibility: visible; }
      </style>
    </defs>
    ${yAxisTitle}${xAxisTitle}
    ${gridLines}${vGridLines}
    <g clip-path="url(#chart-clip)">
      <polygon points="${lossPoly}" fill="${clrLoss}"/>
      <polygon points="${profPoly}" fill="${clrProfit}"/>
      <polygon points="${rx0},${ry0} ${rxM},${ryM} ${rxM},${PT+ch} ${rx0},${PT+ch}" fill="url(#grad-rev)" opacity=".7"/>
      <line x1="${rx0}" y1="${ry0}" x2="${rxM}" y2="${ryM}" stroke="${clrRev}" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="${costX0}" y1="${costY0}" x2="${costXM}" y2="${costYM}" stroke="${clrCost}" stroke-width="2" stroke-dasharray="7,4" stroke-linecap="round"/>
      ${zoneLabels}
    </g>
    ${planLine}
    <line x1="${PL}" y1="${PT}" x2="${PL}" y2="${PT+ch}" stroke="${clrAxis}" stroke-width="1.5"/>
    <line x1="${PL}" y1="${PT+ch}" x2="${PL+cw}" y2="${PT+ch}" stroke="${clrAxis}" stroke-width="1.5"/>
    ${yLabels}${xLabels}
    ${lineLabels}
    ${bepCallout}
    ${legend}
  </svg>`;
}
export function applyPayrollToFixed() {
  const tot = window.payrollTotal();
  if (!tot) { window.showAlert('Добавьте хотя бы одну должность'); return; }
  let idx = window.S.fixedCosts.findIndex(c => /фот|зарплат|зп|оплата труда/i.test(c.name));
  if (idx < 0) {
    window.S.fixedCosts.unshift({ name: 'ФОТ (персонал)', value: tot });
  } else {
    window.S.fixedCosts[idx].value = tot;
  }
  window.renderFinModel();
  window.saveState();
  if (window.lucide) lucide.createIcons();
}
export function onPayrollSetting(key, v) {
  if (!window.S.payrollSettings) window.S.payrollSettings = {};
  const n = parseFloat(v);
  if (isNaN(n) || n < 0) return;
  window.S.payrollSettings[key] = n;
  window.saveState();
  // Пересчитаем все строки таблицы
  (window.S.payrollPositions||[]).forEach(p => window._refreshPayrollRow(p.id));
  // Обновить формулы в блоке настроек (если раскрыт)
  const wb = document.querySelector('.pts-body');
  if (wb) { window.renderFinModel(); if (window.lucide) lucide.createIcons(); }
}
export function togglePayrollSettings() {
  window.S.payrollSettingsOpen = !window.S.payrollSettingsOpen;
  window.saveState();
  window.renderFinModel();
  if (window.lucide) lucide.createIcons();
}
export function toggleFixedHint() {
  window.S.fixedHintOpen = !window.S.fixedHintOpen;
  window.saveState();
  window.renderFinModel();
  if (window.lucide) lucide.createIcons();
}
// Совместимость со старым обработчиком (если где-то остался)
export function onWhatIf(v) { window.onWhatIf3('price', v); }

export function toggleSeasonality() {
  window.S.seasonalityOpen = !window.S.seasonalityOpen;
  window.saveState();
  window.renderFinModel();
  if (window.lucide) lucide.createIcons();
}

// ════════════════════════════════════════════════════════════════════
//  MENU CLEANUP — drop candidates
// ════════════════════════════════════════════════════════════════════
export function openDropCandidates() {
  if (!hasAccess('drinks')) {
    if (window.showAlert) window.showAlert('Этот инструмент доступен только в пакете «Напитки».');
    return;
  }
  const drinks = window.withABC(window.enrich());
  const candidates = drinks.map(d => {
    const port = window.S.portions[d.id] || 0;
    let score = 0;
    const reasons = [];
    if (d.abc === 'C') { score += 3; reasons.push('класс C'); }
    if (d.fc > 0.30)   { score += 2; reasons.push(`FC ${window.pct(d.fc)}`); }
    if (port <= 3)     { score += 2; reasons.push(`всего ${port} порц/день`); }
    if (d.profit < 50) { score += 1; reasons.push(`прибыль ${window.rub(d.profit)}`); }
    return { ...d, port, score, reasons };
  })
  .filter(d => d.score >= 3)
  .sort((a,b) => b.score - a.score || a.profit - b.profit);

  const grid = document.getElementById('drop-grid');
  if (!candidates.length) {
    grid.innerHTML = `<div style="padding:32px;text-align:center;color:var(--muted)">
      <div style="font-size:42px;margin-bottom:8px">🎉</div>
      <div style="font-weight:700;color:var(--green);margin-bottom:6px">Меню оптимизировано!</div>
      <div>Кандидатов на удаление не найдено — все позиции работают.</div>
    </div>`;
  } else {
    grid.innerHTML = `
      <div style="font-size:13px;color:var(--muted);margin-bottom:12px">
        Найдено <strong style="color:var(--red)">${candidates.length}</strong> позиций для пересмотра. Критерии: класс C, FC&gt;30%, &lt;3 порц/день, прибыль &lt;50₽.
      </div>
      <div class="table-wrap" style="max-height:60vh">
        <table>
          <thead><tr>
            <th>Напиток</th>
            <th class="ta-c">Score</th>
            <th>Причины</th>
            <th class="ta-r">FC%</th>
            <th class="ta-r">Прибыль</th>
            <th class="ta-c">Порц/день</th>
            <th></th>
          </tr></thead>
          <tbody>${candidates.map(d => {
            const sevClr = d.score >= 6 ? 'var(--red)' : d.score >= 4 ? '#b38600' : 'var(--navy)';
            return `<tr>
              <td class="fw7">${d.name}</td>
              <td class="ta-c"><span style="background:${sevClr};color:white;padding:2px 8px;border-radius:8px;font-weight:800;font-size:12px">${d.score}</span></td>
              <td style="font-size:12px;color:var(--muted)">${d.reasons.join(' · ')}</td>
              <td class="ta-r">${window.pct(d.fc)}</td>
              <td class="ta-r">${window.rub(d.profit)}</td>
              <td class="ta-c">${d.port}</td>
              <td>${d.custom && (window.isWorkspaceOwner?.() || window.authorCanPublish?.())
                ? `<button class="btn btn-outline" style="padding:3px 10px;font-size:11px;color:var(--red);border-color:#f4b8c4" onclick="if(confirm('Удалить «${d.name.replace(/'/g,"\\\\'")}» из меню?')){window.deleteDrink(${d.id});openDropCandidates();}">Удалить</button>`
                : `<span style="font-size:11px;color:var(--muted)">${d.custom ? 'только владелец' : 'базовый'}</span>`}</td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>
      <div class="hint" style="margin-top:14px"><i data-lucide="info" class="icon"></i> Базовые напитки нельзя удалить, но вы можете отредактировать их (рецепт/цену) или просто игнорировать в плане продаж.</div>`;
  }
  window.openModal('modal-drop');
  if (window.lucide) lucide.createIcons();
}

export function _confirmDeleteDropDrink(id, name) {
  if (!hasAccess('drinks')) {
    if (window.showAlert) window.showAlert('Этот инструмент доступен только в пакете «Напитки».');
    return;
  }
  if (!window.authorCanPublish?.() && window.requireWorkspaceOwner && !window.requireWorkspaceOwner('Удалять рецепты может только владелец проекта.')) return;
  window.showConfirm(`Удалить «${name}» из меню?`, () => {
    window.deleteDrink(id);
    window.openDropCandidates();
  }, { icon: '🗑️', okText: 'Удалить' });
}



export function _matDisplayUnit(matKey) {
  const m = window.MAT[matKey];
  if (!m) return '';
  const u = (m.unit || '').toLowerCase();
  if (u.includes('кг')) return 'г';
  if (u === 'л' || u.includes(' л')) return 'мл';
  return 'шт';
}

// ── Перенесено из public/app.js ──

export function openPriceHistory(key) {
  if (!window.MAT[key]) return;
  const log = (window.S.priceLog || []).filter(e => e.matKey === key).slice().reverse();
  const rows = log.length
    ? log.map(e => {
        const diff  = e.newPrice - (e.oldPrice||0);
        const pctD  = e.oldPrice ? (diff/e.oldPrice*100).toFixed(1) : '—';
        const clr   = diff > 0 ? 'var(--red)' : diff < 0 ? 'var(--green)' : 'var(--muted)';
        const sign  = diff > 0 ? '+' : '';
        const date  = new Date(e.date).toLocaleString('ru', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' });
        return `<tr>
          <td style="padding:6px 10px;font-size:12px">${date}</td>
          <td style="padding:6px 10px;text-align:right">${rub(e.oldPrice||0)}</td>
          <td style="padding:6px 10px;text-align:right;font-weight:700">${rub(e.newPrice)}</td>
          <td style="padding:6px 10px;text-align:right;color:${clr};font-weight:700">${sign}${rub(diff)} (${sign}${pctD}%)</td>
        </tr>`;
      }).join('')
    : `<tr><td colspan="4" style="padding:18px;text-align:center;color:var(--muted)">Изменений цены ещё не было</td></tr>`;
  document.getElementById('phist-mat-name').textContent = window.MAT[key].name;
  document.getElementById('phist-rows').innerHTML = rows;
  openModal('modal-price-hist');
  if (window.lucide) lucide.createIcons();
}

// ════════════════════════════════════════════════════════════════════
//  WHAT-IF — 3 sliders (price / cost / traffic)
// ════════════════════════════════════════════════════════════════════
export const _wif = { price: 0, cost: 0, traffic: 0 };
export function onWhatIf3(field, v) {
  _wif[field] = parseInt(v);
  document.getElementById('wif-' + field + '-val').textContent = (_wif[field]>=0?'+':'') + _wif[field] + '%';
  saveState();
  recalcWhatIf3();
}
export function resetWhatIf3() {
  _wif.price = _wif.cost = _wif.traffic = 0;
  ['price','cost','traffic'].forEach(f => {
    const el = document.getElementById('wif-' + f);
    if (el) el.value = 0;
    const v = document.getElementById('wif-' + f + '-val');
    if (v) v.textContent = '0%';
  });
  recalcWhatIf3();
}
export function recalcWhatIf3() {
  const out = document.getElementById('whatif-result');
  if (!out) return;
  const drinks = window.enrich();
  const taxMode = window.S.taxMode || 'none';

  // Те же компоненты что и в P&L
  const sales = window.salesMetrics(drinks);
  const { totRevMon: _wifRev } = sales;
  const _wifEff = window.getEffectiveCosts(_wifRev);
  const fotInFixed  = _wifEff.some(c => /фот|зарплат|зп|оплата.?труда/i.test(c.name));
  const fotAmount   = fotInFixed ? 0 : window.payrollTotal();
  const varExtra    = _wifEff.filter(c =>  c.isVariable).reduce((s,c)=>s+c.value, 0);
  const pureFixed   = _wifEff.filter(c => !c.isVariable).reduce((s,c)=>s+c.value, 0) + fotAmount;

  const calcTax = (rev, varC, fixed) =>
    taxMode==='usn6' ? rev*0.06 : taxMode==='usn15' ? Math.max(0,(rev-varC-fixed)*0.15) : 0;

  const mPrice   = 1 + _wif.price/100;
  const mCost    = 1 + _wif.cost/100;
  const mTraffic = 1 + _wif.traffic/100;

  // Базовые показатели из общего плана продаж: напитки + дополнительные позиции.
  const baseRev  = sales.totRevMon;
  const baseVar  = sales.totCostMon;
  const baseVarE = varExtra; // переменные операц. расходы при базовом трафике
  const baseTot  = baseVar + baseVarE + pureFixed;
  const baseNet  = baseRev - baseVar - baseVarE - pureFixed - calcTax(baseRev, baseVar + baseVarE, pureFixed);
  const basePort = sales.totalPort;

  // С учётом коэффициентов
  const rev2   = baseRev * mPrice * mTraffic;
  const var2   = baseVar * mCost  * mTraffic;
  const varE2  = varExtra * mTraffic;           // переменные операц. расходы тоже масштабируются
  const net2   = rev2 - var2 - varE2 - pureFixed - calcTax(rev2, var2 + varE2, pureFixed);
  const port2  = basePort * mTraffic;
  const fc2    = rev2>0 ? var2/rev2 : 0;
  const bep2   = (1-fc2)>0 ? pureFixed/(1-fc2) : 0;
  const avgChk = port2>0 ? rev2/(port2*window.S.days) : 0;
  const cover  = bep2>0 ? rev2/bep2*100 : 100;

  const delta = net2 - baseNet;
  const dClr  = delta>0 ? 'var(--green)' : delta<0 ? 'var(--red)' : 'var(--muted)';
  const sign  = delta>0 ? '+' : '';
  const netClr = net2>=0 ? 'var(--navy)' : 'var(--red)';

  // Базовые показатели для дельт
  const baseFC   = baseRev>0 ? baseVar/baseRev : 0;
  const baseAvgChk = basePort>0 ? baseRev/(basePort*window.S.days) : 0;
  const dRevAbs  = rev2 - baseRev;
  const dAvgAbs  = avgChk - baseAvgChk;
  const dFCpp    = (fc2 - baseFC) * 100;  // в процентных пунктах

  const dRevClr  = dRevAbs>0 ? 'var(--green)' : dRevAbs<0 ? 'var(--red)' : 'var(--muted)';
  const dAvgClr  = dAvgAbs>0 ? 'var(--green)' : dAvgAbs<0 ? 'var(--red)' : 'var(--muted)';
  const dFCClr   = dFCpp<0  ? 'var(--green)' : dFCpp>0  ? 'var(--red)' : 'var(--muted)'; // FC↓ = хорошо
  const s = v => v>0?'+':'';

  const mkDelta = (val, label, invert=false) => {
    if (Math.abs(val) < 0.01) return `<span class="wif-delta wif-delta-zero">${label}</span>`;
    const pos = invert ? val < 0 : val > 0;
    const cls = pos ? 'wif-delta-pos' : 'wif-delta-neg';
    return `<span class="wif-delta ${cls}">${label}</span>`;
  };

  out.innerHTML = `
    <div class="wif-card">
      <div class="wif-card-label">Средний чек</div>
      <div class="wif-card-val">${rub(avgChk)}</div>
      ${mkDelta(dAvgAbs, `${s(dAvgAbs)}${rub(dAvgAbs)} к базе`)}
    </div>
    <div class="wif-card">
      <div class="wif-card-label">FC%</div>
      <div class="wif-card-val">${pct(fc2)}</div>
      ${mkDelta(dFCpp, `${s(dFCpp)}${dFCpp.toFixed(1)} п.п. к базе`, true)}
    </div>
    <div class="wif-card">
      <div class="wif-card-label">Выручка / мес</div>
      <div class="wif-card-val">${rub(rev2)}</div>
      ${mkDelta(dRevAbs, `${s(dRevAbs)}${rub(dRevAbs)} к базе`)}
    </div>
    <div class="wif-card">
      <div class="wif-card-label">Выручка ТБУ</div>
      <div class="wif-card-val">${rub(bep2)}</div>
      <span class="wif-delta wif-delta-zero">покрытие ${cover.toFixed(0)}%</span>
    </div>
    <div class="wif-card wif-card-accent">
      <div class="wif-card-label">Чистая прибыль / мес</div>
      <div class="wif-card-val" style="color:${netClr}">${rub(net2)}</div>
      ${mkDelta(delta, `${sign}${rub(delta)} к базе`)}
    </div>`;
}
// ════════════════════════════════════════════════════════════════════
//  SEASONAL 12-MONTH CHART
// ════════════════════════════════════════════════════════════════════
export function buildSeasonalChart(totRevMon, varCostsMon, totalFixed, calcTax) {
  const MONTHS = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
  const season = window.S.seasonality || Array(12).fill(1);
  const varFixed  = (window.S.fixedCosts||[]).filter(c=>c.isVariable).reduce((s,c)=>s+c.value,0);
  const pureFixed = totalFixed - varFixed;
  const data = season.map((k,i) => {
    const rev=totRevMon*k, varC=varCostsMon*k, fixed=pureFixed+varFixed*k;
    const tax=calcTax(rev,varC,fixed);
    return { m:MONTHS[i], k, net:rev-varC-fixed-tax };
  });
  const dark=document.body.classList.contains('dark');
  const ff='system-ui,sans-serif';
  const W=580,H=190,PL=62,PR=12,PT=16,PB=30;
  const cw=W-PL-PR, ch=H-PT-PB, n=12;
  const barW=Math.floor(cw/n*0.7), gap=cw/n;
  const maxN=Math.max(...data.map(d=>d.net),0), minN=Math.min(...data.map(d=>d.net),0);
  const range=maxN-minN||1;
  const cy=v=>PT+ch-((v-minN)/range)*ch;
  const cx=i=>PL+gap*(i+0.5);
  const zero=cy(0);
  const clrPos=dark?'#89d185':'#417033', clrNeg=dark?'#f48771':'#d9534f';
  const clrGrid=dark?'rgba(255,255,255,.06)':'rgba(0,0,0,.05)';
  const clrTxt=dark?'#999':'#888', clrAxis=dark?'rgba(255,255,255,.18)':'rgba(0,0,0,.14)';
  const gridPts=[0]; if(maxN>0)gridPts.push(maxN); if(minN<0)gridPts.push(minN);
  const gridSvg=[...new Set(gridPts)].map(v=>{
    const y=cy(v); const fv=a=>Math.abs(a)>=1e6?(a/1e6).toFixed(1)+'М':Math.abs(a)>=1e3?Math.round(a/1e3)+'к':Math.round(a);
    return `<line x1="${PL}" y1="${y}" x2="${PL+cw}" y2="${y}" stroke="${clrGrid}" stroke-width="1"/>
    <text x="${PL-5}" y="${y+4}" text-anchor="end" font-size="9" font-family="${ff}" fill="${clrTxt}">${fv(v)}₽</text>`;
  }).join('');
  const barsSvg=data.map((d,i)=>{
    const x=cx(i), pos=d.net>=0;
    const bt=pos?cy(d.net):zero, bb=pos?zero:cy(d.net), h=Math.max(Math.abs(bb-bt),2);
    const clr=pos?clrPos:clrNeg;
    // Для отрицательных баров — подпись выше нулевой линии
    const labelY=pos?bt-4:zero-4;
    const fv=v=>Math.abs(v)>=1e6?(v/1e6).toFixed(1)+'М':Math.abs(v)>=1e3?Math.round(v/1e3)+'к':Math.round(v);
    return `<rect x="${x-barW/2}" y="${bt}" width="${barW}" height="${h}" rx="2" fill="${clr}" opacity="${d.k===1?'0.82':'0.65'}"/>
    <text x="${x}" y="${PT+ch+12}" text-anchor="middle" font-size="9" font-family="${ff}" fill="${clrTxt}">${d.m}</text>
    <text x="${x}" y="${labelY}" text-anchor="middle" font-size="8" font-family="${ff}" font-weight="700" fill="${clr}">${fv(d.net)}₽</text>`;
  }).join('');
  const zeroLine=`<line x1="${PL}" y1="${zero}" x2="${PL+cw}" y2="${zero}" stroke="${clrAxis}" stroke-width="1.5"/>`;
  const axisY=`<line x1="${PL}" y1="${PT}" x2="${PL}" y2="${PT+ch}" stroke="${clrAxis}" stroke-width="1.5"/>`;

  // KPI под графиком
  const totalYear = data.reduce((s,d)=>s+d.net, 0);
  const bestMonth = data.reduce((a,b)=>a.net>b.net?a:b);
  const worstMonth = data.reduce((a,b)=>a.net<b.net?a:b);
  const fmRub = v => rub ? rub(v) : (Math.round(v).toLocaleString('ru-RU')+' ₽');
  const kpiClr = v => v >= 0 ? 'var(--green)' : 'var(--red)';
  const kpiHtml = `
    <div class="season-kpi">
      <div class="season-kpi-card">
        <div class="season-kpi-label">Итого за год</div>
        <div class="season-kpi-val" style="color:${kpiClr(totalYear)}">${fmRub(totalYear)}</div>
      </div>
      <div class="season-kpi-card">
        <div class="season-kpi-label">Лучший месяц</div>
        <div class="season-kpi-val" style="color:var(--green)">${fmRub(bestMonth.net)}</div>
        <div class="season-kpi-sub">${bestMonth.m}</div>
      </div>
      <div class="season-kpi-card">
        <div class="season-kpi-label">Худший месяц</div>
        <div class="season-kpi-val" style="color:${kpiClr(worstMonth.net)}">${fmRub(worstMonth.net)}</div>
        <div class="season-kpi-sub">${worstMonth.m}</div>
      </div>
    </div>`;

  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block;overflow:visible" xmlns="http://www.w3.org/2000/svg">
    ${gridSvg}${axisY}${zeroLine}${barsSvg}</svg>${kpiHtml}`;
}

// ════════════════════════════════════════════════════════════════════
//  SEASONALITY + FIXED-COST VARIABLE HANDLERS
// ════════════════════════════════════════════════════════════════════
export function onSeasonalMonth(i, v) {
  if (!window.S.seasonality) window.S.seasonality = Array(12).fill(1);
  window.S.seasonality[i] = parseFloat(v);
  const lbl = document.getElementById('sm-val-'+i);
  if (lbl) lbl.textContent = Math.round(parseFloat(v)*100) + '%';
  // perерисовать только чарт
  const chartEl = document.getElementById('seasonal-chart');
  if (chartEl) {
    const drinks = window.enrich();
    const varCostsMon = drinks.reduce((s,d)=>s+d.cost*window.S.portions[d.id],0)*window.S.days;
    const totRevMon   = drinks.reduce((s,d)=>s+d.price*window.S.portions[d.id],0)*window.S.days;
    const totalFixed  = window.getEffectiveCosts(totRevMon).reduce((s,c)=>s+c.value,0);
    const taxMode = window.S.taxMode||'none';
    const calcTaxLocal = (rev,varC,fixed) => taxMode==='usn6'?rev*0.06:taxMode==='usn15'?Math.max(0,(rev-varC-fixed)*0.15):0;
    chartEl.innerHTML = buildSeasonalChart(totRevMon, varCostsMon, totalFixed, calcTaxLocal);
  }
  saveState();
}

let _seasonDrawerIdx = 0;
export function openSeasonDrawer(i) {
  _seasonDrawerIdx = i;
  const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  const k = (window.S.seasonality||Array(12).fill(1))[i];
  const pct = Math.round(k*100);
  const drawer = document.getElementById('season-drawer');
  document.getElementById('season-drawer-title').textContent = MONTHS[i];
  document.getElementById('season-drawer-val').textContent = pct + '%';
  const range = document.getElementById('season-drawer-range');
  range.value = pct;
  _updateDrawerRangeColor(pct);
  drawer.classList.add('open');
}
export function closeSeasonDrawer() {
  document.getElementById('season-drawer').classList.remove('open');
}
export function onSeasonDrawerChange(v) {
  const pct = parseInt(v);
  const k = pct / 100;
  if (!window.S.seasonality) window.S.seasonality = Array(12).fill(1);
  window.S.seasonality[_seasonDrawerIdx] = k;
  document.getElementById('season-drawer-val').textContent = pct + '%';
  _updateDrawerRangeColor(pct);
  // Обновить ячейку в сетке
  const cell = document.getElementById('scell-' + _seasonDrawerIdx);
  const btn  = cell && cell.closest('.season-cell');
  if (cell) cell.textContent = pct + '%';
  if (btn) {
    btn.classList.remove('season-cell-up', 'season-cell-down');
    if (k > 1.05) btn.classList.add('season-cell-up');
    else if (k < 0.95) btn.classList.add('season-cell-down');
  }
  // Обновить чарт
  const chartEl = document.getElementById('seasonal-chart');
  if (chartEl) {
    const drinks = window.enrich();
    const varCostsMon = drinks.reduce((s,d)=>s+d.cost*window.S.portions[d.id],0)*window.S.days;
    const totRevMon   = drinks.reduce((s,d)=>s+d.price*window.S.portions[d.id],0)*window.S.days;
    const totalFixed  = window.getEffectiveCosts(totRevMon).reduce((s,c)=>s+c.value,0);
    const taxMode = window.S.taxMode||'none';
    const calcTaxLocal = (rev,varC,fixed) => taxMode==='usn6'?rev*0.06:taxMode==='usn15'?Math.max(0,(rev-varC-fixed)*0.15):0;
    chartEl.innerHTML = buildSeasonalChart(totRevMon, varCostsMon, totalFixed, calcTaxLocal);
  }
  saveState();
}
export function _updateDrawerRangeColor(pct) {
  const range = document.getElementById('season-drawer-range');
  if (!range) return;
  const pos = (pct - 30) / (200 - 30) * 100;
  const clr = pct > 105 ? '#6abf69' : pct < 95 ? '#e53935' : '#888';
  range.style.background = `linear-gradient(to right, ${clr} ${pos}%, var(--border) ${pos}%)`;
}

export function applySeasonPreset(preset) {
  const FLAT   = Array(12).fill(1);
  // Лето: апр-сен +30%, дек-фев слабый
  const SUMMER = [0.75, 0.75, 0.90, 1.10, 1.25, 1.35, 1.35, 1.25, 1.10, 0.95, 0.80, 0.75];
  // Кофейня в БЦ: пики фев-май и сен-ноя (деловые сезоны), летом -25% (отпуска), янв слабый (каникулы)
  const BC     = [0.80, 1.10, 1.15, 1.20, 1.15, 0.85, 0.70, 0.75, 1.15, 1.20, 1.15, 0.85];
  // Кофейня в ЖК: летом +20% (дети дома, жара), ноя-фев тихий (люди дома), авг пик
  const JK     = [0.80, 0.85, 0.90, 1.00, 1.10, 1.20, 1.25, 1.30, 1.10, 1.00, 0.85, 0.80];
  window.S.seasonality = preset === 'summer' ? SUMMER : preset === 'bc' ? BC : preset === 'jk' ? JK : FLAT;
  saveState();
  renderFinModel();
  if (window.lucide) lucide.createIcons();
}

export function onFixedCostVariable(i, checked) {
  window.S.fixedCosts[i].isVariable = !!checked;
  saveState();
  renderFinModel();
  if (window.lucide) lucide.createIcons();
}

// ════════════════════════════════════════════════════════════════════
//  EXPORT — Стартовые вложения (PDF + XLSX)
// ════════════════════════════════════════════════════════════════════

import { OC_CATS, OC_FORMATS, _ocCalcTotal, _ocFmtAmt } from '../render/dashboard.js';

export function exportOpeningCostsPDF() {
  window.logWorkspaceActivity?.('export_created', 'report', 'opening_costs_pdf', 'Сформирован PDF бюджета открытия');
  const S       = window.S;
  const costs   = S.openingCosts || [];
  const meta    = S.openingMeta  || {};
  const format  = meta.format   || 'full';
  const currency = meta.currency || 'RUB';
  const today   = new Date().toLocaleDateString('ru');
  const loc     = window.activeLoc();
  const locName = loc?.name || 'Кофейня';
  const total   = _ocCalcTotal(costs);
  const fmtName = OC_FORMATS[format]?.label || format;

  // Группируем по категориям
  const byCat = {};
  Object.keys(OC_CATS).forEach(c => { byCat[c] = []; });
  costs.forEach(item => {
    if (byCat[item.category]) byCat[item.category].push(item);
    else byCat['reserve'].push(item);
  });

  const fmtRub = v => v.toLocaleString('ru') + ' ₽';
  const fmtCur = v => currency !== 'RUB' ? ` (${_ocFmtAmt(v)})` : '';

  let rows = '';
  let globalN = 0;
  let catRows = '';
  Object.entries(byCat).forEach(([cat, items]) => {
    if (!items.length) return;
    const catTotal = items.reduce((s, r) => s + r.price * r.qty, 0);
    const info = OC_CATS[cat];
    catRows += `<tr class="cat-row"><td colspan="5">${info.icon} ${info.label}</td><td class="num-r">${fmtRub(catTotal)}${fmtCur(catTotal)}</td></tr>`;
    items.forEach(item => {
      globalN++;
      const rowTotal = item.price * item.qty;
      catRows += `<tr>
        <td class="num">${globalN}</td>
        <td class="name">${item.name || '—'}</td>
        <td class="num-r">${item.qty}</td>
        <td class="num-r">${fmtRub(item.price)}${fmtCur(item.price)}</td>
        <td class="url">${item.url ? `<span style="color:#417033;font-size:8pt">${item.url.replace(/^https?:\/\//,'').replace(/\/$/, '')}</span>` : '—'}</td>
        <td class="num-r bold">${fmtRub(rowTotal)}${fmtCur(rowTotal)}</td>
      </tr>`;
    });
  });

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Стартовые вложения — ${locName}</title>
<link href="/vendor/fonts/mulish.css" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Mulish',Arial,sans-serif;font-size:10pt;color:#222;background:#fff}
@page{size:A4 landscape;margin:10mm}
.cover{background:#417033;color:#fff;padding:16px 20px;margin-bottom:16px;border-radius:6px;display:flex;justify-content:space-between;align-items:flex-end}
.cover h1{font-size:15pt;font-weight:800}
.cover p{font-size:9pt;opacity:.85;margin-top:3px}
.cover-right{text-align:right;font-size:9pt;opacity:.85}
.cover-right .total{font-size:17pt;font-weight:800}
table{width:100%;border-collapse:collapse;font-size:9pt}
th{background:#417033;color:#fff;padding:6px 8px;text-align:left;font-weight:700}
th.num-r{text-align:right}
td{padding:5px 8px;border-bottom:1px solid #e4ede0;vertical-align:middle}
td.num{color:#999;width:28px;text-align:center}
td.num-r{text-align:right;white-space:nowrap}
td.bold{font-weight:700}
td.url{font-size:8pt;color:#417033;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
td.name{font-weight:600}
tr:nth-child(even) td{background:#fafcf9}
tr.cat-row td{background:#417033;color:#fff;font-weight:700;font-size:10pt;padding:5px 8px;letter-spacing:0.01em}
tr.cat-row svg{width:12px;height:12px;vertical-align:middle;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;margin-right:4px;position:relative;top:-1px}
.footer{margin-top:16px;text-align:right;font-size:8pt;color:#666;border-top:1px solid #ddd;padding-top:4px}
.total-row td{background:#e8f2e3;font-weight:800;font-size:10pt}
@media print{.cover,th,tr.cat-row td,.total-row td{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="cover">
  <div>
    <h1>Стартовые вложения</h1>
    <p>${locName} &nbsp;·&nbsp; Формат: ${fmtName} &nbsp;·&nbsp; ${today}</p>
  </div>
  <div class="cover-right">
    <div>Итого</div>
    <div class="total">${fmtRub(total)}</div>
    ${currency !== 'RUB' ? `<div style="opacity:.8;font-size:11pt">${_ocFmtAmt(total)}</div>` : ''}
  </div>
</div>
<table>
  <thead><tr>
    <th style="width:28px">#</th>
    <th>Наименование</th>
    <th class="num-r" style="width:60px">Кол-во</th>
    <th class="num-r" style="width:120px">Цена за ед.</th>
    <th style="width:180px">Ссылка</th>
    <th class="num-r" style="width:130px">Итого</th>
  </tr></thead>
  <tbody>
    ${catRows}
    <tr class="total-row">
      <td colspan="5" style="text-align:right">ИТОГО ВЛОЖЕНИЙ</td>
      <td class="num-r">${fmtRub(total)}${fmtCur(total)}</td>
    </tr>
  </tbody>
</table>
<div class="footer">Московская школа бариста &nbsp;·&nbsp; baristaschool.ru &nbsp;·&nbsp; ${costs.length} позиций</div>
</body></html>`;

  window._printViaIframe(html, 'mbs-opening-costs');
}

export async function exportOpeningCostsXLSX() {
  window.logWorkspaceActivity?.('export_created', 'report', 'opening_costs_xlsx', 'Сформирован Excel бюджета открытия');
  try { await ensureExcelJS(); } catch (e) { window.showAlert(e.message || 'Библиотека ExcelJS не загрузилась.'); return; }
  const S        = window.S;
  const costs    = S.openingCosts || [];
  const meta     = S.openingMeta  || {};
  const format   = meta.format   || 'full';
  const currency = meta.currency || 'RUB';
  const loc      = window.activeLoc();
  const locName  = loc?.name || 'Кофейня';
  const todayISO = new Date().toISOString().slice(0, 10);
  const fmtName  = OC_FORMATS[format]?.label || format;

  // Группируем
  const byCat = {};
  Object.keys(OC_CATS).forEach(c => { byCat[c] = []; });
  costs.forEach(item => {
    if (byCat[item.category]) byCat[item.category].push(item);
    else byCat['reserve'].push(item);
  });

  const wb = new ExcelJS.Workbook();
  wb.creator = 'MBS Coffee Menu';
  const ws = wb.addWorksheet('Стартовые вложения');

  const C = {
    green:     '417033',
    greenBg:   'e8f2e3',
    catBg:     'd4e8cc',
    rowEven:   'f4f8f2',
    white:     'FFFFFF',
    muted:     '999999',
    text:      '222222',
  };
  const fill  = (c) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb: c } });
  const font  = (bold, size = 10, color = C.text) => ({ name: 'Arial', bold, size, color: { argb: color } });
  const align = (h = 'left') => ({ vertical: 'middle', horizontal: h });

  ws.columns = [
    { header: '№',             key: 'n',      width: 5   },
    { header: 'Категория',     key: 'cat',    width: 22  },
    { header: 'Наименование',  key: 'name',   width: 38  },
    { header: 'Кол-во',        key: 'qty',    width: 8   },
    { header: 'Цена, ₽',       key: 'price',  width: 14  },
    { header: 'Итого, ₽',      key: 'total',  width: 16  },
    { header: 'Ссылка',        key: 'url',    width: 36  },
  ];

  // Строка-подпись
  ws.spliceRows(1, 0, ['Создано в сервисе barista-school.online — Moscow Barista School']);
  ws.mergeCells(1, 1, 1, 7);
  const brandRowOC = ws.getRow(1);
  brandRowOC.getCell(1).font = { name: 'Arial', italic: true, size: 9, color: { argb: '999999' } };
  brandRowOC.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  brandRowOC.height = 16;

  // Заголовок таблицы
  const hRow = ws.getRow(2);
  hRow.eachCell(cell => {
    cell.fill = fill(C.green);
    cell.font = font(true, 10, C.white);
    cell.alignment = align('center');
    cell.border = { bottom: { style: 'thin', color: { argb: C.green } } };
  });
  hRow.height = 22;

  let globalN   = 0;
  let rowIndex  = 1; // tracker for even/odd

  Object.entries(byCat).forEach(([cat, items]) => {
    if (!items.length) return;
    const catTotal = items.reduce((s, r) => s + r.price * r.qty, 0);
    const info = OC_CATS[cat];

    // Строка категории (без SVG-иконки — ExcelJS отображает её как текст)
    const cr = ws.addRow({ cat: `▌ ${info.label}`, total: catTotal });
    cr.height = 20;
    cr.eachCell(cell => {
      cell.fill = fill(C.catBg);
      cell.font = font(true, 10, C.text);
      cell.alignment = align();
    });
    // Сумма по категории вправо
    cr.getCell('total').alignment = align('right');
    cr.getCell('total').numFmt = '#,##0" ₽"';
    cr.getCell('total').value = catTotal;

    items.forEach((item, i) => {
      globalN++;
      rowIndex++;
      const rowTotal = item.price * item.qty;
      const r = ws.addRow({
        n:     globalN,
        cat:   OC_CATS[cat]?.label || cat,
        name:  item.name,
        qty:   item.qty,
        price: item.price,
        total: rowTotal,
        url:   item.url || '',
      });
      r.height = 18;
      r.eachCell(cell => {
        cell.alignment = { vertical: 'middle', wrapText: false };
        cell.border = { bottom: { style: 'thin', color: { argb: 'e4ede0' } } };
      });
      if (rowIndex % 2 === 0) r.eachCell(c => { c.fill = fill(C.rowEven); });
      r.getCell('n').font     = font(false, 9, C.muted);
      r.getCell('price').numFmt = '#,##0" ₽"';
      r.getCell('total').numFmt = '#,##0" ₽"';
      r.getCell('total').font   = font(true, 10, C.text);
      r.getCell('price').alignment = align('right');
      r.getCell('total').alignment = align('right');
      r.getCell('qty').alignment   = align('center');

      // Гиперссылка
      if (item.url) {
        r.getCell('url').value = { text: item.url.replace(/^https?:\/\//, ''), hyperlink: item.url };
        r.getCell('url').font  = { name: 'Arial', size: 9, color: { argb: C.green }, underline: true };
      }
    });
  });

  // Итоговая строка
  const total    = _ocCalcTotal(costs);
  const totalRow = ws.addRow({ cat: 'ИТОГО ВЛОЖЕНИЙ', total });
  totalRow.height = 24;
  totalRow.eachCell(cell => {
    cell.fill = fill(C.greenBg);
    cell.font = font(true, 11, C.text);
    cell.alignment = align();
  });
  totalRow.getCell('total').numFmt    = '#,##0" ₽"';
  totalRow.getCell('total').alignment = align('right');
  totalRow.getCell('cat').alignment   = align('right');

  // Мета-лист
  const wsMeta = wb.addWorksheet('Инфо');
  wsMeta.addRow(['Параметр', 'Значение']);
  wsMeta.addRow(['Точка',    locName]);
  wsMeta.addRow(['Формат',   fmtName]);
  wsMeta.addRow(['Дата',     todayISO]);
  wsMeta.addRow(['Позиций',  costs.length]);
  wsMeta.addRow(['Итого, ₽', total]);
  if (currency !== 'RUB') {
    wsMeta.addRow([`Итого (${currency})`, _ocFmtAmt(total)]);
  }
  wsMeta.columns = [{ width: 18 }, { width: 24 }];

  const buf  = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `mbs-opening-costs-${locName.replace(/\s+/g, '_')}-${todayISO}.xlsx`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
