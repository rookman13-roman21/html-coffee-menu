// ════════════════════════════════════════════════════════════════════
//  RENDER — FIN MODEL  (src/render/finmodel.js)
//
//  Все данные читаются из window.* — доступны после Object.assign
//  в конце public/app.js.
//  Зависимости: enrich, bepCalc, weightedMetrics, salesMetrics,
//    rub, pct, int, S, DRINKS, FIXED_COSTS_CATS,
//    getEffectiveCosts, payrollTotal, payrollTotals, PS,
//    calcPositionCosts, empTypeTip, buildSeasonalChart, recalcWhatIf3,
//    _wif (const → window._wif),
//    EMP_TYPE_LABELS (const → window.EMP_TYPE_LABELS)
// ════════════════════════════════════════════════════════════════════

export function renderFinModel() {
  // const-переменные из app.js, выставленные в window
  const _wif            = window._wif;
  const EMP_TYPE_LABELS = window.EMP_TYPE_LABELS;

  // Читаем всё остальное из window
  const {
    enrich, bepCalc, weightedMetrics, salesMetrics,
    rub, pct, int,
    S, DRINKS, FIXED_COSTS_CATS,
    saveState, getOrgInfo,
    getEffectiveCosts, payrollTotal, payrollTotals, PS,
    calcPositionCosts, empTypeTip,
    buildSeasonalChart, recalcWhatIf3,
  } = window;

  // Удалить дублирующие статьи ФОТ бариста/смены и Налоги и взносы
  const dupPattern = /фот.*(бариста|смен)|налоги\s*(и|&)\s*взносы/i;
  const hadDups = S.fixedCosts.some(c => dupPattern.test(c.name));
  if (hadDups) {
    S.fixedCosts = S.fixedCosts.filter(c => !dupPattern.test(c.name));
    saveState();
  }

  const drinks = enrich();
  const bep = bepCalc(drinks);
  const { avgCost, avgPrice, avgProfit, avgFC } = weightedMetrics(drinks);
  const { totalPort, totRevMon, totPrfMon } = salesMetrics(drinks);
  const totalFixed = bep.totalFixed;
  const varCostsMon = drinks.reduce((s, d) => s + d.cost * S.portions[d.id], 0) * S.days;
  const taxMode = S.taxMode || 'none';

  function calcTax(rev, varC, fixed) {
    if (taxMode === 'usn6')  return rev * 0.06;
    if (taxMode === 'usn15') return Math.max(0, (rev - varC - fixed) * 0.15);
    return 0;
  }
  const TAX_LABELS = { none: 'Без налога', usn6: 'УСН 6%', usn15: 'УСН 15%' };

  // Запас прочности
  const safetyAbs   = totRevMon - bep.revBEP;
  const safetyPct   = totRevMon > 0 ? safetyAbs / totRevMon * 100 : 0;
  const bepProgress = bep.revBEP > 0 ? Math.min(totRevMon / bep.revBEP * 100, 100) : 100;
  const bepPClr     = bepProgress >= 100 ? 'var(--green)' : bepProgress >= 70 ? '#b38600' : 'var(--red)';
  const safetyCls   = safetyAbs >= 0 ? 'num-pos' : 'num-neg';

  // Normalize fixedCosts
  S.fixedCosts.forEach((c, _i) => { if (!c.id) c.id = 1000 + _i; if (!c.category) c.category = 'other'; });
  const effCosts = getEffectiveCosts(totRevMon);

  const _fcOnly   = effCosts.filter(c => !c.isVariable).reduce((s, c) => s + c.value, 0);
  const _varExtra = effCosts.filter(c => c.isVariable).reduce((s, c) => s + c.value, 0);
  const _fotAmt   = effCosts.some(c => /фот|зарплат|зп|оплата.?труда/i.test(c.name)) ? 0 : (typeof payrollTotal === 'function' ? payrollTotal() : 0);
  const _ebit     = (totRevMon - varCostsMon - _varExtra) - _fcOnly - _fotAmt;
  const _tax      = calcTax(totRevMon, varCostsMon + _varExtra, _fcOnly + _fotAmt);
  const baseNet   = _ebit - _tax;
  const investment = S.investment || 0;
  const paybackMon = investment > 0 && baseNet > 0 ? (investment / baseNet) : null;

  // Build grouped cost table
  const costTableHtml = (() => {
    let rows = '';
    FIXED_COSTS_CATS.forEach(cat => {
      const items = S.fixedCosts.map((c, idx) => ({ c, idx, ev: effCosts[idx] })).filter(({ c }) => (c.category || 'other') === cat.id);
      if (!items.length) return;
      const catTotal = items.reduce((s, { ev }) => s + ((ev && ev.value) || 0), 0);
      rows += `<tr class="fc-cat-hdr fc-cat-collapsed" onclick="toggleFcCat('${cat.id}')"><td colspan="2"><span class="fc-cat-chev" id="fc-chev-${cat.id}">▶</span> ${cat.label} <span class="fc-cat-cnt">${items.length}</span></td><td style="text-align:right">${rub(catTotal)}</td><td style="text-align:right"><button class="fc-cat-add" onclick="event.stopPropagation();addFixedCostInCat('${cat.id}')" title="Добавить в эту категорию">+</button></td></tr>`;
      items.forEach(({ c, idx, ev }) => {
        const isFot = !!(ev && ev._fromPayroll);
        const badge = isFot
          ? `<span class="fc-badge fc-fot">авто-ФОТ</span>`
          : c.isPercent
            ? `<span class="fc-badge fc-pct">${c.pct}% · ${c.pctShare ?? 100}% выр.</span>`
            : c.isVariable ? `<span class="fc-badge fc-var">перем.</span>` : `<span class="fc-badge fc-fix">фикс.</span>`;
        const valTxt = c.isPercent
          ? `<span class="fc-pct-amt">≈ ${rub((ev && ev.value) || 0)}</span>`
          : rub((ev && ev.value) || 0);
        const actionBtn = isFot
          ? `<button class="fc-edit-btn" onclick="event.stopPropagation();scrollToPayroll()" title="Перейти к калькулятору ФОТ"><i data-lucide="arrow-down" class="icon" style="width:13px;height:13px"></i></button>`
          : `<button class="fc-edit-btn" onclick="event.stopPropagation();openCostEditor(${idx})" title="Изменить"><i data-lucide="pencil" class="icon" style="width:13px;height:13px"></i></button>`;
        const clickHandler = isFot ? `onclick="scrollToPayroll()"` : `onclick="openCostEditor(${idx})"`;
        const fotHint = isFot ? ` <span style="font-size:11px;color:var(--muted)"> ← из калькулятора ФОТ</span>` : '';
        rows += `<tr class="fc-item${isFot ? ' fc-item-fot' : ''}" data-fc-cat="${cat.id}" style="display:none" ${clickHandler}><td class="fc-item-name">${c.name.replace(/</g, '&lt;').replace(/>/g, '&gt;')}${fotHint}</td><td>${badge}</td><td style="text-align:right">${valTxt}</td><td style="text-align:right">${actionBtn}</td></tr>`;
      });
    });
    return `<table class="fc-table"><colgroup><col style="width:44%"><col style="width:18%"><col style="width:26%"><col style="width:12%"></colgroup><thead><tr><th>Название</th><th>Тип</th><th style="text-align:right">₽ / мес</th><th></th></tr></thead><tbody>${rows}</tbody></table>`;
  })();

  const varFixed  = effCosts.filter(c => c.isVariable).reduce((s, c) => s + c.value, 0);
  const pureFixed = totalFixed - varFixed;

  const SCEN = [
    { name: 'Пессимистичный', mult: 0.5, cls: 'pess', icon: 'trending-down' },
    { name: 'Базовый план',   mult: 1.0, cls: 'base', icon: 'bar-chart-2' },
    { name: 'Оптимистичный',  mult: 2.0, cls: 'opt',  icon: 'trending-up' },
  ];

  const scenarioCards = SCEN.map(sc => {
    const revMon  = totRevMon * sc.mult;
    const varMon  = varCostsMon * sc.mult;
    const fixed   = pureFixed + varFixed * sc.mult;
    const margin  = revMon - varMon;
    const tax     = calcTax(revMon, varMon, fixed);
    const net     = margin - fixed - tax;
    const cups    = Math.round(totalPort * sc.mult);
    const fcW     = revMon > 0 ? varMon / revMon : 0;
    const rentab  = revMon > 0 ? net / revMon * 100 : 0;
    const profCls = net >= 0 ? 'profit-pos' : 'profit-neg';
    const netIcon = net >= 0
      ? `<i data-lucide="check-circle" class="icon" style="width:18px;height:18px"></i>`
      : `<i data-lucide="x-circle" class="icon" style="width:18px;height:18px"></i>`;
    const fixedNote = varFixed > 0 ? ` <span style="font-size:10px;opacity:.6">(перем: ${rub(varFixed * sc.mult)})</span>` : '';
    return `
      <div class="scenario-card sc-${sc.cls}${sc.cls === 'base' ? ' sc-base-active' : ''}">
        ${sc.cls === 'base' ? '<div class="sc-your-plan-badge">✦ Ваш план</div>' : ''}
        <div class="sc-title"><i data-lucide="${sc.icon}" class="icon"></i> ${sc.name} <span style="font-size:11px;opacity:.6">×${sc.mult}</span></div>
        <div class="sc-row"><span data-tip="Количество чашек в день&#10;из плана умноженное на ${sc.mult}">Чашек/день</span><span class="sv">${int(cups)}</span></div>
        <div class="sc-row"><span data-tip="Общая выручка за месяц&#10;= чашек/день × средний чек × дни">Выручка/мес</span><span class="sv">${rub(revMon)}</span></div>
        <div class="sc-row"><span data-tip="Стоимость сырья за месяц&#10;(ингредиенты + потери при приготовке)">Себест. сырья</span><span class="sv">${rub(varMon)}</span></div>
        <div class="sc-row"><span data-tip="Food Cost % — доля себестоимости сырья в выручке&#10;Норма для HoReCa: 20–28%">FC%</span><span class="sv">${pct(fcW)}</span></div>
        <div class="sc-row"><span data-tip="Выручка минус себестоимость сырья.&#10;Из этого покрываются пост. расходы и формируется прибыль.">Маржа</span><span class="sv">${rub(margin)}</span></div>
        <div class="sc-row"><span data-tip="Постоянные расходы не зависят от объёма продаж.&#10;Аренда, ФОТ, амортизация..">Пост. расходы</span><span class="sv">${rub(fixed)}${fixedNote}</span></div>
        ${tax > 0 ? `<div class="sc-row"><span>Налог (${TAX_LABELS[taxMode]})</span><span class="sv">${rub(tax)}</span></div>` : ''}
        <div class="sc-row" style="opacity:.65;font-size:11px"><span data-tip="Чистая прибыль ÷ выручка × 100.&#10;Норма для кофейни: 10–20%">Рентабельность</span><span>${rentab.toFixed(1)}%</span></div>
        <div class="sc-profit ${profCls}">${netIcon} ${rub(net)}</div>
      </div>
    `;
  }).join('');

  // Бенчмарк FC%
  const fcBench = avgFC <= 0.20 ? { lbl: 'отлично', clr: 'var(--green)' }
                : avgFC <= 0.28 ? { lbl: 'норма HoReCa', clr: 'var(--green)' }
                : avgFC <= 0.33 ? { lbl: 'выше нормы', clr: '#b38600' }
                :                 { lbl: 'критически высоко', clr: 'var(--red)' };

  // P&L строки
  const fixedOnlyCosts     = effCosts.filter(c => !c.isVariable);
  const variableExtraCosts = effCosts.filter(c => c.isVariable);
  const fixedOnlyTotal     = fixedOnlyCosts.reduce((s, c) => s + c.value, 0);
  const variableExtraTotal = variableExtraCosts.reduce((s, c) => s + c.value, 0);
  const payrollTotVal2 = payrollTotal();
  const fotInFixed2 = effCosts.some(c => /фот|зарплат|зп|оплата.?труда/i.test(c.name));
  const fotAmount = fotInFixed2 ? 0 : payrollTotVal2;
  const totalVarCosts = varCostsMon + variableExtraTotal;
  const gross    = totRevMon - varCostsMon;
  const grossAdj = gross - variableExtraTotal;
  const ebit     = grossAdj - fixedOnlyTotal - fotAmount;
  const taxBase  = calcTax(totRevMon, totalVarCosts, fixedOnlyTotal + fotAmount);

  const mkRow = (r) => {
    const pctFmt = r.pct100 ? '100%' : r.pct != null ? (r.pct * 100).toFixed(1) + '%' : '';
    const clr    = r.val < 0 ? 'color:var(--red)' : r.accent ? (baseNet >= 0 ? 'color:var(--navy)' : 'color:var(--red)') : '';
    const fw     = r.bold ? 'font-weight:800' : '';
    const bg     = r.bold ? 'background:var(--gray)' : r.sub ? 'background:var(--light)' : '';
    const indent = r.sub ? 'padding:7px 14px 7px 32px;font-size:12px;color:var(--muted)' : `padding:9px 14px;${fw}`;
    return `<tr style="${bg};border-bottom:1px solid var(--border)">
      <td style="${indent}" ${r.tip ? `data-tip="${r.tip}"` : ''}>${r.lbl}</td>
      <td style="padding:9px 14px;text-align:right;${fw};${clr};${r.sub ? 'font-size:12px' : ''}">${rub(r.val)}</td>
      <td style="padding:9px 14px;text-align:right;font-size:11px;opacity:.65;${clr}">${pctFmt}</td>
    </tr>`;
  };

  const payrollDetailRow = (payrollTotVal2 > 0 && !fotInFixed2)
    ? [mkRow({ lbl: '· ФОТ (из калькулятора)', val: -payrollTotVal2, pct: totRevMon > 0 ? payrollTotVal2 / totRevMon : 0, sub: true, tip: 'Итого нагрузка на работодателя из калькулятора ФОТ — учитывается автоматически' })]
    : [];

  const fixedDetailRows = fixedOnlyCosts.map(c => mkRow({
    lbl: `· ${c.name}${c._fromPayroll ? ' <span style="font-size:10px;opacity:.6">(калькулятор ФОТ)</span>' : ''}`,
    val: -c.value,
    pct: totRevMon > 0 ? c.value / totRevMon : 0,
    sub: true,
    tip: c._fromPayroll ? 'Значение берётся автоматически из калькулятора ФОТ ниже' : undefined,
  }));

  const varExtraDetailRows = variableExtraCosts.map(c => mkRow({
    lbl: `· ${c.name}`,
    val: -c.value,
    pct: totRevMon > 0 ? c.value / totRevMon : 0,
    sub: true,
    tip: 'Переменная статья (отмечена как «перем.»)',
  }));

  const plRows = [
    mkRow({ lbl: 'Выручка от продаж',          val: totRevMon,                    pct100: true, tip: 'Цена × порции × дни' }),
    mkRow({ lbl: '− Себестоимость сырья',       val: -varCostsMon,                 pct: varCostsMon / totRevMon, tip: 'FC% — доля себестоимости напитков в выручке' }),
    mkRow({ lbl: 'Валовая прибыль',             val: gross,                        pct: gross / totRevMon, bold: true, tip: 'Выручка − себестоимость сырья' }),
    ...(variableExtraCosts.length > 0 ? [
      mkRow({ lbl: '− Переменные операц. расходы', val: -variableExtraTotal, pct: variableExtraTotal / totRevMon, tip: 'Статьи, отмеченные как «перем.» — растут вместе с трафиком' }),
      ...varExtraDetailRows,
    ] : []),
    mkRow({ lbl: '− Постоянные расходы',        val: -(fixedOnlyTotal + fotAmount), pct: (fixedOnlyTotal + fotAmount) / totRevMon, tip: 'Статьи без галочки «перем.»' }),
    ...fixedDetailRows,
    ...payrollDetailRow,
    mkRow({ lbl: 'EBIT (операц. прибыль)',      val: ebit,                         pct: ebit / totRevMon, bold: true, tip: 'Прибыль до уплаты налогов' }),
    ...(taxBase > 0 ? [mkRow({ lbl: `− Налог (${TAX_LABELS[taxMode]})`, val: -taxBase, pct: taxBase / totRevMon, tip: 'Налоговый режим: ' + TAX_LABELS[taxMode] })] : []),
    mkRow({ lbl: 'Чистая прибыль',              val: baseNet,                      pct: baseNet / totRevMon, bold: true, accent: true, tip: 'EBIT − налог' }),
  ].join('');

  // Предупреждения
  const warnings = [];
  const zeroDrinks = DRINKS.filter(d => !(S.portions[d.id] > 0));
  if (zeroDrinks.length > DRINKS.length * 0.3) {
    warnings.push(`<div class="fin-warn fin-warn-orange"><i data-lucide="alert-triangle" class="icon"></i> ${zeroDrinks.length} напитков без порций/день — не учтены в ТБУ и выручке. <a class="fin-warn-link" onclick="switchTab('sales')">Заполнить план продаж</a></div>`);
  }
  if (S.fixedCosts.length < 3) {
    warnings.push(`<div class="fin-warn fin-warn-info"><i data-lucide="info" class="icon"></i> Указано только ${S.fixedCosts.length} статьи расходов. Добавьте аренду, коммуналку, ФОТ — окупаемость будет посчитана неточно.</div>`);
  }
  const warningsBanner = warnings.length ? `<div class="fin-warnings">${warnings.join('')}</div>` : '';

  document.getElementById('tab-finmodel').innerHTML = `
    <div class="page-title">
      <span class="page-title-left"><i data-lucide="banknote" class="icon"></i> Финансовая модель</span>
      <button class="btn btn-outline fin-intro-toggle" id="fin-intro-btn" onclick="toggleFinIntro()" title="Подсказка"><i data-lucide="info" class="icon"></i> <span class="fin-intro-btn-txt">Подсказка</span></button>
    </div>
    <div class="tab-intro" id="fin-intro">
      <div class="tab-intro-icon"><i data-lucide="banknote" class="icon icon-lg"></i></div>
      <div>
        <div class="tab-intro-title">Финансовая модель</div>
        <div class="tab-intro-text">
          Дашборд вверху показывает <strong>ключевые показатели</strong> — выручку, расходы, прибыль, FC%, ТБУ и запас прочности.<br>
          Данные пересчитываются автоматически при любом изменении меню, порций или расходов.
        </div>
        <div class="tab-intro-steps">
          <span class="tab-intro-step">1. Заполни постоянные расходы и ФОТ → дашборд обновится</span>
          <span class="tab-intro-step">2. Укажи стартовые вложения → появится срок окупаемости</span>
          <span class="tab-intro-step">3. Pricing wizard: смоделируй изменение цен и трафика</span>
          <span class="tab-intro-step">4. Сезонность: пресеты БЦ, ЖК, лето → прогноз на 12 мес</span>
        </div>
      </div>
    </div>
    <div class="fm-content">

    <!-- ═══════════════════════════════════ ДАШБОРД ═══════════════════════════════════ -->
    <div class="fm-dashboard">

      <!-- Ряд 1: Финансы -->
      <div class="fm-dash-row">
        <div class="fm-kpi-card">
          <div class="fm-kpi-icon"><i data-lucide="banknote" class="icon"></i></div>
          <div class="fm-kpi-body">
            <div class="fm-kpi-label" data-tip="Выручка = цена × порции × дней в месяце">Выручка / мес</div>
            <div class="fm-kpi-value">${rub(totRevMon)}</div>
          </div>
        </div>
        <div class="fm-kpi-card">
          <div class="fm-kpi-icon"><i data-lucide="receipt" class="icon"></i></div>
          <div class="fm-kpi-body">
            <div class="fm-kpi-label" data-tip="Все расходы: сырьё + постоянные + ФОТ + налог">Расходы / мес</div>
            <div class="fm-kpi-value">${rub(varCostsMon + fixedOnlyTotal + fotAmount + taxBase)}</div>
          </div>
        </div>
        <div class="fm-kpi-card fm-kpi-card--accent ${baseNet >= 0 ? 'fm-kpi-pos' : 'fm-kpi-neg'}">
          <div class="fm-kpi-icon"><i data-lucide="${baseNet >= 0 ? 'trending-up' : 'trending-down'}" class="icon"></i></div>
          <div class="fm-kpi-body">
            <div class="fm-kpi-label">Чистая прибыль</div>
            <div class="fm-kpi-value">${rub(baseNet)}</div>
          </div>
        </div>
        <div class="fm-kpi-card">
          <div class="fm-kpi-icon"><i data-lucide="percent" class="icon"></i></div>
          <div class="fm-kpi-body">
            <div class="fm-kpi-label" data-tip="Рентабельность = чистая прибыль ÷ выручка&#10;Норма для кофейни: 10–20%">Рентабельность</div>
            <div class="fm-kpi-value" style="color:${totRevMon > 0 && baseNet / totRevMon >= 0.10 ? 'var(--green)' : totRevMon > 0 && baseNet / totRevMon >= 0 ? '#b38600' : 'var(--red)'}">${totRevMon > 0 ? (baseNet / totRevMon * 100).toFixed(1) + '%' : '—'}</div>
          </div>
        </div>
      </div>

      <!-- Ряд 2: Операционные метрики -->
      <div class="fm-dash-row">
        <div class="fm-kpi-card">
          <div class="fm-kpi-icon"><i data-lucide="coffee" class="icon"></i></div>
          <div class="fm-kpi-body">
            <div class="fm-kpi-label" data-tip="Суммарное количество порций всех напитков в день по плану продаж">Порций / день</div>
            <div class="fm-kpi-value">${int(totalPort)}</div>
          </div>
        </div>
        <div class="fm-kpi-card">
          <div class="fm-kpi-icon"><i data-lucide="package" class="icon"></i></div>
          <div class="fm-kpi-body">
            <div class="fm-kpi-label" data-tip="Food Cost % — доля себестоимости сырья в выручке&#10;Отлично: <20% · Норма HoReCa: 20–28% · Высоко: >28%">FC% (себест./выручка)</div>
            <div class="fm-kpi-value" style="color:${fcBench.clr}">${pct(avgFC)} <span class="fm-kpi-badge">${fcBench.lbl}</span></div>
          </div>
        </div>
        <div class="fm-kpi-card">
          <div class="fm-kpi-icon"><i data-lucide="scale" class="icon"></i></div>
          <div class="fm-kpi-body">
            <div class="fm-kpi-label" data-tip="Точка безубыточности — выручка, при которой прибыль = 0">ТБУ / мес</div>
            <div class="fm-kpi-value">${rub(bep.revBEP)}</div>
          </div>
        </div>
        <div class="fm-kpi-card">
          <div class="fm-kpi-icon"><i data-lucide="shield" class="icon"></i></div>
          <div class="fm-kpi-body">
            <div class="fm-kpi-label" data-tip="Запас прочности = (выручка − ТБУ) ÷ выручка&#10;Показывает, насколько можно упасть до убытка">Запас прочности</div>
            <div class="fm-kpi-value" style="color:${safetyAbs >= 0 ? 'var(--green)' : 'var(--red)'}">${safetyAbs >= 0 ? '+' : ''}${safetyPct.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      <!-- Прогресс-бар ТБУ -->
      <div class="fm-dash-bep">
        <div class="fm-dash-bep-labels">
          <span>Покрытие ТБУ</span>
          <span style="font-weight:700;color:${bepPClr}">${Math.min(bepProgress, 100).toFixed(0)}% ${bepProgress >= 100 ? '✓' : ''}</span>
        </div>
        <div class="fm-dash-bep-track">
          <div class="fm-dash-bep-fill" style="width:${Math.min(bepProgress, 100)}%;background:${bepPClr}"></div>
        </div>
        <div class="fm-dash-bep-sub">
          <span>0</span>
          <span style="color:var(--muted);font-size:11px">${safetyAbs >= 0 ? `▲ выше ТБУ на ${rub(safetyAbs)}` : `▼ до ТБУ не хватает ${rub(-safetyAbs)}`}</span>
          <span>${rub(bep.revBEP)}</span>
        </div>
      </div>

      <!-- Окупаемость (если введены инвестиции) -->
      ${investment > 0 ? `
      <div class="fm-dash-payback">
        <i data-lucide="clock" class="icon"></i>
        <span>Стартовые вложения: <strong>${rub(investment)}</strong></span>
        <span class="fm-dash-payback-sep">→</span>
        ${paybackMon !== null
          ? `<span>Окупаемость: <strong style="color:var(--navy)">${paybackMon.toFixed(1)} мес.</strong></span>`
          : `<span style="color:var(--red)">Убыток — окупаемости нет</span>`
        }
        <button class="fm-dash-payback-edit" onclick="document.getElementById('fin-invest-input').focus();document.getElementById('finblock-1').scrollIntoView({behavior:'smooth'})" title="Изменить вложения"><i data-lucide="pencil" class="icon" style="width:12px;height:12px"></i></button>
      </div>` : `
      <div class="fm-dash-payback fm-dash-payback--hint" onclick="document.getElementById('fin-invest-input').focus();document.getElementById('finblock-1').scrollIntoView({behavior:'smooth'})">
        <i data-lucide="landmark" class="icon"></i>
        <span>Введите стартовые вложения в Блоке 1 — появится срок окупаемости</span>
        <i data-lucide="chevron-right" class="icon" style="margin-left:auto"></i>
      </div>`}

    </div>
    <!-- ═══════════════════════════════════════════════════════════════════════════════ -->

    <div class="fin-quicknav">
      <button class="fin-qn-btn" onclick="document.getElementById('finblock-1').scrollIntoView({behavior:'smooth'})"><i data-lucide="database" class="icon"></i> Исходные данные</button>
      <button class="fin-qn-btn" onclick="scrollToPayroll()"><i data-lucide="users" class="icon"></i> Калькулятор ФОТ</button>
      <button class="fin-qn-btn" onclick="document.getElementById('finblock-3').scrollIntoView({behavior:'smooth'})"><i data-lucide="sliders" class="icon"></i> Моделирование</button>
      <button class="fin-qn-btn" onclick="document.getElementById('finblock-4').scrollIntoView({behavior:'smooth'})"><i data-lucide="calendar" class="icon"></i> Прогноз</button>
    </div>

    <!-- ─────────────────────────────────── СТАРТОВЫЕ ВЛОЖЕНИЯ -->
    <div class="fin-invest-top">
      <div class="fin-invest-top-label" data-tip="Сумма денег, вложенных в запуск:&#10;оборудование, ремонт, первый депозит...&#10;Срок окупаемости = инвестиции ÷ чистая прибыль."><i data-lucide="landmark" class="icon"></i> Стартовые вложения, ₽</div>
      <div class="fin-invest-top-row">
        <input class="inp" id="fin-invest-input" type="number" min="0" step="50000" inputmode="numeric" style="width:160px;text-align:right"
          value="${investment}" onchange="onInvestment(this.value)" placeholder="0">
        <span style="font-size:12px;color:var(--muted)">₽</span>
        ${paybackMon !== null
          ? `<span class="fin-invest-top-payback"><i data-lucide="clock" class="icon"></i> Окупаемость: <strong style="color:var(--navy)">${paybackMon.toFixed(1)} мес.</strong></span>`
          : investment > 0 && baseNet <= 0
            ? `<span class="fin-invest-top-payback" style="color:var(--red)"><i data-lucide="alert-circle" class="icon"></i> Убыток — окупаемости нет</span>`
            : `<span class="fin-invest-top-payback" style="color:var(--muted)">Введите сумму — увидите срок окупаемости</span>`
        }
      </div>
    </div>

    <!-- ───────────────────────────────────── БЛОК 1: ИСХОДНЫЕ ДАННЫЕ -->
    <div class="finblock-hd finblock-hd-1" id="finblock-1">
      <span class="finblock-num">1</span>
      <i data-lucide="database" class="icon"></i> Исходные данные
    </div>

    <div class="section-title" style="display:flex;justify-content:space-between;align-items:center">
      <span><i data-lucide="pin" class="icon"></i> Постоянные расходы (₽/мес)</span>
      <button class="fin-hint-toggle" onclick="toggleFixedHint()"><i data-lucide="${S.fixedHintOpen ? 'chevron-up' : 'info'}" class="icon"></i> ${S.fixedHintOpen ? 'Скрыть' : 'Что вводить?'}</button>
    </div>
    ${S.fixedHintOpen ? `<div class="hint" style="margin-bottom:12px">
      <i data-lucide="info" class="icon"></i>
      Введите расходы, которые платите каждый месяц независимо от объёма продаж: аренда, коммуналка, интернет, амортизация.
      <br><br>
      <strong>Галочка «перем.»</strong> — отмечайте расходы, которые <em>растут вместе с трафиком</em>: расходники, комиссия агрегаторов и т.п.
      Такие статьи будут масштабироваться в <strong>сценариях</strong> (×0.5 / ×2.0) и на <strong>графике сезонности</strong> —
      в слабые месяцы они уменьшатся, в сильные вырастут. На базовый план и ТБУ галочка не влияет.
    </div>` : ''}
    <div class="fc-table-wrap">${costTableHtml}</div>
    <div class="panel-dark" style="margin-bottom:20px">
      <div class="pd-label">ИТОГО постоянные расходы</div>
      <div class="pd-value">${rub(totalFixed)}</div>
    </div>

    <div class="fin-param-card" style="max-width:420px;margin-bottom:24px">
      <div class="fin-param-label" data-tip="УСН 6% — налог со всей выручки.&#10;УСН 15% — налог с (доходы − расходы).&#10;Выберите свой режим налогообложения."><i data-lucide="receipt" class="icon"></i> Режим налогообложения</div>
      <select class="modal-select" style="width:100%;font-size:13px" onchange="onTaxMode(this.value)">
        <option value="none"  ${taxMode === 'none'  ? 'selected' : ''}>Без налога</option>
        <option value="usn6"  ${taxMode === 'usn6'  ? 'selected' : ''}>УСН 6% — доходы</option>
        <option value="usn15" ${taxMode === 'usn15' ? 'selected' : ''}>УСН 15% — доходы − расходы</option>
      </select>
      ${taxMode === 'none' ? `
        <div class="tax-hint-box th-none">Налог не учитывается в расчётах P&amp;L.</div>` : taxMode === 'usn6' ? `
        <div class="tax-hint-box th-usn6">
          <strong>6% от всей выручки</strong> — независимо от расходов.<br>
          <span style="opacity:.8">Выгоден, если расходы &lt; 60% от выручки. Взносы ИП уменьшают налог до 50%.</span>
          <div class="tax-hint-amount">При текущей выручке: <strong>${rub(_tax)} / мес</strong></div>
        </div>` : `
        <div class="tax-hint-box th-usn15">
          <strong>15% от прибыли</strong> (выручка − все расходы).<br>
          <span style="opacity:.8">Выгоден при высоких расходах (&gt; 60% от выручки). Минимальный налог — 1% от выручки.</span>
          <div class="tax-hint-amount">При текущей прибыли: <strong>${rub(_tax)} / мес</strong></div>
        </div>`}
    </div>

    <div id="payroll-section" class="section-title" style="display:flex;align-items:center;justify-content:space-between">
      <span><i data-lucide="users" class="icon"></i> Калькулятор ФОТ <span style="font-size:12px;font-weight:500;color:var(--muted);margin-left:6px">фонд оплаты труда</span></span>
      <button class="btn btn-outline" style="font-size:12px;padding:5px 12px" onclick="addPayrollPosition()"><i data-lucide="plus" class="icon"></i> Добавить должность</button>
    </div>
    <div class="panel" style="padding:0;margin-bottom:8px;overflow:hidden">
      <div class="payroll-mobile-cards">
        ${(S.payrollPositions || []).map(p => {
          const _mc = calcPositionCosts(p);
          const _mtype = p.empType || 'black';
          const _msel = ['white', 'grey', 'black'].map(t =>
            `<option value="${t}"${_mtype === t ? ' selected' : ''}>${EMP_TYPE_LABELS[t]}</option>`
          ).join('');
          return `<div class="pr-mob-card">
            <div class="pr-mob-row1">
              <input class="inp pr-mob-name-inp" type="text" value="${p.name}" oninput="onPayrollPos(${p.id},'name',this.value)" placeholder="Должность">
              <strong class="pr-mob-total">${rub(_mc.total)}</strong>
              <button class="mat-del" onclick="deletePayrollPosition(${p.id})" title="Удалить"><i data-lucide="trash-2" class="icon"></i></button>
            </div>
            <div class="pr-mob-row2">
              <div class="pr-mob-field"><span class="pr-mob-field-lbl">Ставка ₽/ч</span><input class="inp pr-mob-inp" type="number" inputmode="numeric" value="${p.rate}" oninput="onPayrollPos(${p.id},'rate',this.value)" onchange="renderFinModel();if(window.lucide)lucide.createIcons()"></div>
              <div class="pr-mob-field"><span class="pr-mob-field-lbl">Часов/смену</span><input class="inp pr-mob-inp" type="number" inputmode="numeric" value="${p.hours}" oninput="onPayrollPos(${p.id},'hours',this.value)" onchange="renderFinModel();if(window.lucide)lucide.createIcons()"></div>
              <div class="pr-mob-field"><span class="pr-mob-field-lbl">Смен/мес</span><input class="inp pr-mob-inp" type="number" inputmode="numeric" value="${p.shifts}" oninput="onPayrollPos(${p.id},'shifts',this.value)" onchange="renderFinModel();if(window.lucide)lucide.createIcons()"></div>
              <div class="pr-mob-field"><span class="pr-mob-field-lbl">Количество</span><input class="inp pr-mob-inp" type="number" inputmode="numeric" value="${p.count}" oninput="onPayrollPos(${p.id},'count',this.value)" onchange="renderFinModel();if(window.lucide)lucide.createIcons()"></div>
            </div>
            <div class="pr-mob-row3">
              <select class="payroll-emp-select pr-mob-scheme-sel" onchange="onPayrollPos(${p.id},'empType',this.value)" data-emptype="${_mtype}">${_msel}</select>
              ${_mc.taxes > 0 ? `<span class="pr-mob-tax-badge">+ ${rub(_mc.taxes)} взносы</span>` : '<span class="pr-mob-tax-badge pr-mob-tax-zero">без взносов</span>'}
            </div>
          </div>`;
        }).join('')}
      </div>
      <div class="payroll-table-wrap">
        <table class="payroll-table">
          <colgroup>
            <col style="min-width:120px"><col style="width:82px"><col style="width:78px">
            <col style="width:78px"><col style="width:62px"><col style="width:128px">
            <col style="width:96px"><col style="width:80px"><col style="width:36px">
          </colgroup>
          <thead>
            <tr>
              <th>Должность</th><th class="ta-r">Ставка ₽/ч</th><th class="ta-r">Час/см.</th>
              <th class="ta-r">Смен/мес</th><th class="ta-r">Кол.</th><th>Оформление</th>
              <th class="ta-r">Налоги/взносы</th><th class="ta-r">Итого/мес</th><th></th>
            </tr>
          </thead>
          <tbody>
            ${(S.payrollPositions || []).map(p => {
              const c = calcPositionCosts(p);
              const type = p.empType || 'black';
              const sel = ['white', 'grey', 'black'].map(t =>
                `<option value="${t}"${type === t ? ' selected' : ''}>${EMP_TYPE_LABELS[t]}</option>`
              ).join('');
              return `<tr>
                <td><input class="inp payroll-inp-name" id="pr-name-${p.id}" type="text" value="${p.name}" oninput="onPayrollPos(${p.id},'name',this.value)"></td>
                <td><input class="inp payroll-inp" id="pr-rate-${p.id}" type="number" min="0" step="10" inputmode="numeric" value="${p.rate}" oninput="onPayrollPos(${p.id},'rate',this.value)" onchange="renderFinModel();if(window.lucide)lucide.createIcons()"></td>
                <td><input class="inp payroll-inp" id="pr-hours-${p.id}" type="number" min="0" max="24" step="1" inputmode="numeric" value="${p.hours}" oninput="onPayrollPos(${p.id},'hours',this.value)" onchange="renderFinModel();if(window.lucide)lucide.createIcons()"></td>
                <td><input class="inp payroll-inp" id="pr-shifts-${p.id}" type="number" min="0" step="1" inputmode="numeric" value="${p.shifts}" oninput="onPayrollPos(${p.id},'shifts',this.value)" onchange="renderFinModel();if(window.lucide)lucide.createIcons()"></td>
                <td><input class="inp payroll-inp" id="pr-count-${p.id}" type="number" min="1" step="1" inputmode="numeric" value="${p.count}" oninput="onPayrollPos(${p.id},'count',this.value)" onchange="renderFinModel();if(window.lucide)lucide.createIcons()"></td>
                <td>
                  <select class="payroll-emp-select" title="${empTypeTip(type)}" onchange="onPayrollPos(${p.id},'empType',this.value)" data-emptype="${type}">${sel}</select>
                </td>
                <td class="ta-r payroll-tax-cell" id="pr-tax-${p.id}" title="${empTypeTip(type)}">${c.taxes > 0 ? '+' + rub(c.taxes) : '—'}</td>
                <td class="ta-r fw7" id="pr-total-${p.id}">${rub(c.total)}</td>
                <td><button class="mat-del" onclick="deletePayrollPosition(${p.id})" title="Удалить"><i data-lucide="trash-2" class="icon"></i></button></td>
              </tr>`;
            }).join('')}
          </tbody>
          <tfoot>
            <tr class="payroll-total-row">
              <td colspan="6">ИТОГО ФОТ / месяц</td>
              <td class="ta-r" id="pr-sum-taxes-tfoot">${rub(payrollTotals().taxes)}</td>
              <td class="ta-r" id="payroll-grand-total">${rub(payrollTotals().total)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div class="payroll-summary">
        <div class="payroll-sum-item"><div class="payroll-sum-label">Выплата сотрудникам</div><div class="payroll-sum-val" id="pr-sum-employee">${rub(payrollTotals().toEmployee)}</div></div>
        <div class="payroll-sum-sep">⊕</div>
        <div class="payroll-sum-item"><div class="payroll-sum-label">Налоги и взносы</div><div class="payroll-sum-val tax-color" id="pr-sum-taxes">${rub(payrollTotals().taxes)}</div></div>
        <div class="payroll-sum-sep">=</div>
        <div class="payroll-sum-item payroll-sum-total"><div class="payroll-sum-label">Нагрузка на работодателя</div><div class="payroll-sum-val">${rub(payrollTotals().total)}</div></div>
      </div>
      ${totRevMon > 0 ? (() => {
        const fotPct = payrollTotals().total / totRevMon * 100;
        const fotClr = fotPct < 25 ? 'var(--green)' : fotPct <= 35 ? '#b38600' : 'var(--red)';
        return `<div class="payroll-bench">
          <i data-lucide="info" class="icon" style="width:13px;height:13px"></i>
          ФОТ % от выручки:&nbsp;<strong style="color:${fotClr}">${fotPct.toFixed(1)}%</strong>
          <span class="payroll-bench-norm">норма HoReCa: 25–35%</span>
        </div>`;
      })() : ''}
      <div style="display:flex;justify-content:flex-end;align-items:center;padding:10px 14px;border-top:1px solid var(--border)">
        <span style="font-size:11px;color:var(--muted);font-style:italic"><i data-lucide="check-circle" class="icon" style="width:12px;height:12px;color:var(--green)"></i> ФОТ учитывается в расчётах автоматически</span>
      </div>
    </div>

    <!-- Настройки налогообложения ФОТ -->
    <div class="pts-wrap" style="margin-bottom:20px">
      <button class="pts-toggle" onclick="togglePayrollSettings()">
        <i data-lucide="settings-2" class="icon"></i>
        Настройки налогообложения
        <span class="pts-toggle-hint">МРОТ, НДФЛ, взносы</span>
        <i data-lucide="${S.payrollSettingsOpen ? 'chevron-up' : 'chevron-down'}" class="icon" style="margin-left:auto"></i>
      </button>
      ${S.payrollSettingsOpen ? `
      <div class="pts-body">
        <div class="pts-schemes">
          <div class="pts-scheme pts-scheme-white">
            <div class="pts-scheme-head"><span class="pts-dot" style="background:var(--green)"></span>Официально (белая)</div>
            <div class="pts-scheme-desc">Трудовой договор, официальный расчётный листок. Ставка в калькуляторе = начисленная зарплата (гросс).</div>
            <div class="pts-scheme-formula">
              <div>На руки: ставка − НДФЛ&nbsp;<strong>${PS().ndfl}%</strong></div>
              <div>Взносы: ставка × <strong>${PS().ins}%</strong> (платит работодатель)</div>
              <div>Расходы работодателя: ставка × ${(1 + PS().ins / 100).toFixed(2)}</div>
            </div>
          </div>
          <div class="pts-scheme pts-scheme-grey">
            <div class="pts-scheme-head"><span class="pts-dot" style="background:#e6a817"></span>Серая схема (МРОТ + кэш)</div>
            <div class="pts-scheme-desc">Официально оформляется только МРОТ. Налоги платятся только с него. Остаток выдаётся наличными.</div>
            <div class="pts-scheme-formula">
              <div>Офиц. часть: МРОТ (${PS().mrot.toLocaleString('ru')} ₽) × кол-во</div>
              <div>Налоги: с МРОТ × (НДФЛ ${PS().ndfl}% + взносы ${PS().ins}%)</div>
              <div>Кэш: ставка − МРОТ × кол-во (без налогов)</div>
            </div>
          </div>
          <div class="pts-scheme pts-scheme-black">
            <div class="pts-scheme-head"><span class="pts-dot" style="background:var(--muted)"></span>Неофициально (чёрная)</div>
            <div class="pts-scheme-desc">Вся сумма выдаётся наличными. Никаких отчислений. Расходы = выплате сотруднику.</div>
            <div class="pts-scheme-formula">
              <div>На руки: вся ставка</div>
              <div>Налоги: 0 ₽</div>
            </div>
          </div>
        </div>
        <div class="pts-rates">
          <div class="pts-rate-group">
            <label class="pts-rate-label">МРОТ (ваш регион), ₽<span class="pts-rate-hint">Федеральный — 22 440 ₽. В регионах может быть ниже.</span></label>
            <input class="inp" type="number" min="0" step="100" inputmode="numeric" value="${PS().mrot}" onchange="onPayrollSetting('mrot',this.value)" style="max-width:160px;text-align:right">
          </div>
          <div class="pts-rate-group">
            <label class="pts-rate-label">НДФЛ, %<span class="pts-rate-hint">Стандартная ставка — 13%. С 2025 г. при доходе от 2.4 млн — 15%.</span></label>
            <input class="inp" type="number" min="0" max="50" step="0.1" inputmode="decimal" value="${PS().ndfl}" onchange="onPayrollSetting('ndfl',this.value)" style="max-width:120px;text-align:right">
          </div>
          <div class="pts-rate-group">
            <label class="pts-rate-label">Страховые взносы, %<span class="pts-rate-hint">Стандарт — 30%. Для МСП с зарплат свыше МРОТ — 15% (льготный тариф).</span></label>
            <input class="inp" type="number" min="0" max="100" step="0.1" inputmode="decimal" value="${PS().ins}" onchange="onPayrollSetting('ins',this.value)" style="max-width:120px;text-align:right">
          </div>
        </div>
      </div>
      ` : ''}
    </div>

    ${warningsBanner}

    <!-- ───────────────────────────────────── P&L ТАБЛИЦА -->
    <div class="section-title" style="margin-top:8px"><i data-lucide="table-2" class="icon"></i> Отчёт о прибылях и убытках (P&amp;L) <span style="font-size:12px;font-weight:500;color:var(--muted);margin-left:6px">базовый сценарий</span></div>
    <div class="panel" style="padding:0;overflow:hidden;margin-bottom:24px">
      <table style="width:100%;border-collapse:collapse">
        <colgroup><col style="width:58%"><col style="width:24%"><col style="width:18%"></colgroup>
        <thead>
          <tr style="background:var(--light)">
            <th style="padding:9px 14px;text-align:left;font-size:12px;font-weight:700;color:var(--muted)">Статья</th>
            <th style="padding:9px 14px;text-align:right;font-size:12px;font-weight:700;color:var(--muted)">₽ / мес</th>
            <th style="padding:9px 14px;text-align:right;font-size:12px;font-weight:700;color:var(--muted)">% выручки</th>
          </tr>
        </thead>
        <tbody>${plRows}</tbody>
      </table>
    </div>

    <!-- ───────────────────────────────────── БЛОК 2: МОДЕЛИРОВАНИЕ -->
    <div class="finblock-hd finblock-hd-2" id="finblock-3">
      <span class="finblock-num">2</span>
      <i data-lucide="sliders" class="icon"></i> Моделирование
    </div>

    <div class="section-title" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
      <span><i data-lucide="sliders" class="icon"></i> Pricing wizard — «А что если?» <span style="font-size:12px;font-weight:500;color:var(--muted);margin-left:6px">смоделируйте изменение цен и трафика</span></span>
      <button class="btn btn-outline" style="padding:5px 12px;font-size:12px;flex-shrink:0" onclick="resetWhatIf3()"><i data-lucide="rotate-ccw" class="icon"></i> Сбросить</button>
    </div>
    <div class="panel whatif-panel" style="padding:20px;margin-bottom:24px">
      <div id="whatif-result" class="wif-cards"></div>
      <div class="wif-divider"></div>
      <div class="wif-sliders">
        <div class="wif-slider-card">
          <div class="wif-slider-top">
            <span class="wif-slider-label"><i data-lucide="tag" class="icon" style="color:var(--green)"></i> Цены продажи</span>
            <span class="wif-slider-val" id="wif-price-val">${(_wif.price >= 0 ? '+' : '') + _wif.price}%</span>
          </div>
          <input type="range" id="wif-price" min="-50" max="50" step="1" value="${_wif.price}" oninput="onWhatIf3('price',this.value)">
          <div class="whatif-marks"><span>−50%</span><span>0</span><span>+50%</span></div>
        </div>
        <div class="wif-slider-card">
          <div class="wif-slider-top">
            <span class="wif-slider-label"><i data-lucide="package" class="icon" style="color:#b38600"></i> Цены сырья</span>
            <span class="wif-slider-val" id="wif-cost-val">${(_wif.cost >= 0 ? '+' : '') + _wif.cost}%</span>
          </div>
          <input type="range" id="wif-cost" min="-50" max="50" step="1" value="${_wif.cost}" oninput="onWhatIf3('cost',this.value)">
          <div class="whatif-marks"><span>−50%</span><span>0</span><span>+50%</span></div>
        </div>
        <div class="wif-slider-card">
          <div class="wif-slider-top">
            <span class="wif-slider-label"><i data-lucide="users" class="icon" style="color:var(--red)"></i> Трафик / порции</span>
            <span class="wif-slider-val" id="wif-traffic-val">${(_wif.traffic >= 0 ? '+' : '') + _wif.traffic}%</span>
          </div>
          <input type="range" id="wif-traffic" min="-50" max="50" step="5" value="${_wif.traffic}" oninput="onWhatIf3('traffic',this.value)">
          <div class="whatif-marks"><span>−50%</span><span>0</span><span>+50%</span></div>
        </div>
      </div>
      <div class="hint" style="margin-top:12px"><i data-lucide="info" class="icon"></i> Двигайте слайдеры — сразу увидите как меняются маржа, ТБУ и прибыль</div>
    </div>

    <!-- ───────────────────────────────────── БЛОК 3: ПРОГНОЗ НА ГОД -->
    <div class="finblock-hd finblock-hd-3" id="finblock-4">
      <span class="finblock-num">3</span>
      <i data-lucide="calendar" class="icon"></i> Прогноз на год
    </div>

    <div class="section-title"><i data-lucide="calendar" class="icon"></i> Сезонность <span style="font-size:12px;font-weight:500;color:var(--muted);margin-left:6px">прогноз прибыли по 12 месяцам</span></div>

    <div class="season-presets">
      <button class="season-preset-btn" onclick="applySeasonPreset('flat')"><i data-lucide="minus" class="icon"></i> Равномерно</button>
      <button class="season-preset-btn" onclick="applySeasonPreset('summer')">&#9728; Лето +30%</button>
      <button class="season-preset-btn" onclick="applySeasonPreset('bc')">🏢 Кофейня в БЦ</button>
      <button class="season-preset-btn" onclick="applySeasonPreset('jk')">🏘️ Кофейня в ЖК</button>
    </div>

    <div class="season-grid">
      ${['\u042fнв','\u0424ев','\u041cар','\u0410пр','\u041cай','\u0418юн','\u0418юл','\u0410вг','\u0421ен','\u041eкт','\u041dоя','\u0414ек'].map((m, i) => {
        const k   = (S.seasonality || Array(12).fill(1))[i];
        const pct = Math.round(k * 100);
        const cls = k > 1.05 ? 'season-cell-up' : k < 0.95 ? 'season-cell-down' : '';
        return `<button class="season-cell ${cls}" onclick="openSeasonDrawer(${i})">
          <span class="season-cell-mon">${m}</span>
          <span class="season-cell-pct" id="scell-${i}">${pct}%</span>
        </button>`;
      }).join('')}
    </div>

    <div class="season-drawer" id="season-drawer">
      <div class="season-drawer-header">
        <span class="season-drawer-title" id="season-drawer-title">Январь</span>
        <button class="season-drawer-close" onclick="closeSeasonDrawer()"><i data-lucide="x" class="icon"></i></button>
      </div>
      <div class="season-drawer-body">
        <div class="season-drawer-val" id="season-drawer-val">100%</div>
        <input type="range" id="season-drawer-range" class="season-drawer-range" min="30" max="200" step="5" value="100" oninput="onSeasonDrawerChange(this.value)">
        <div class="season-drawer-marks"><span>30%</span><span>100%</span><span>200%</span></div>
        <div class="season-drawer-hint">100% = базовый месяц &nbsp;·&nbsp; <span style="color:var(--green)">120%</span> = +20% &nbsp;·&nbsp; <span style="color:var(--red)">80%</span> = −20%</div>
      </div>
    </div>

    <div class="section-title"><i data-lucide="bar-chart" class="icon"></i> Чистая прибыль / 12 месяцев</div>
    <div class="panel" style="padding:14px 18px 10px;overflow:hidden;margin-bottom:24px">
      <div id="seasonal-chart">
        ${buildSeasonalChart(totRevMon, varCostsMon, totalFixed, calcTax)}
      </div>
    </div>

    </div>
  `;
  // Инициализируем результат What-if со стартовыми значениями
  recalcWhatIf3();
}
