// ════════════════════════════════════════════════════════════════════
//  CALCULATIONS  (src/utils/calc.js)
//
//  Переходный период: функции обращаются к MAT / SEMI / DRINKS / S
//  через window.* в теле функции — к моменту вызова app.js уже
//  определил все глобалы. Прямые импорты появятся после выноса
//  state/store.js и data/templates.js.
// ════════════════════════════════════════════════════════════════════

// ─── Вспомогательные ─────────────────────────────────────────────

/**
 * Коэффициент перевода кг→г / л→мл для ингредиентов полуфабриката.
 * MAT.unit хранится как '1 кг' / '1 л' / '1 г' и т.д.
 */
export function _semiUnitFactor(matKey) {
  const MAT = window.MAT;
  const m = MAT[matKey];
  if (!m) return 1;
  const u = (m.unit || '').toLowerCase();
  return (u.includes('кг') || u === 'л' || u.includes(' л')) ? 1000 : 1;
}

/**
 * Коэффициент для полуфабриката в составе напитка:
 * если unit г/мл — пользователь вводит кг/л → ×1000.
 */
export function _semiDrinkFactor(semi) {
  if (!semi) return 1;
  const u = (semi.unit || '').toLowerCase();
  return (u === 'г' || u === 'мл' || u.startsWith('г') || u.startsWith('мл')) ? 1000 : 1;
}

// ─── Себестоимость ────────────────────────────────────────────────

/**
 * Себестоимость 1 единицы выхода полуфабриката (г/мл/шт).
 * Формула: Σ(цена_за_г × кол-во × factor) / yield
 */
export function calcSemiCostPerUnit(semi) {
  const MAT = window.MAT;
  const S   = window.S;
  const total = (semi.recipe || []).reduce((s, r) => {
    if (!MAT[r.mat]) return s;
    let c = ((S.prices[r.mat] || MAT[r.mat].price) / MAT[r.mat].size) * r.amt * _semiUnitFactor(r.mat);
    if (r.loss) c = c / (1 - r.loss);
    return s + c;
  }, 0);
  return semi.yield > 0 ? total / semi.yield : 0;
}

/**
 * Себестоимость напитка — сумма по всем ингредиентам.
 */
export function calcCost(drink) {
  return drink.recipe.reduce((sum, ing) => sum + calcIngCost(ing), 0);
}

/**
 * Себестоимость одного ингредиента.
 * Поддерживает { semi } (полуфабрикат) и { mat } (сырьё).
 * Формула: (price_per_unit / size_g) * amt_g; если loss → /( 1 - loss)
 */
export function calcIngCost(ing) {
  const MAT  = window.MAT;
  const SEMI = window.SEMI;
  const S    = window.S;

  if (ing.semi != null) {
    const s = SEMI.find(x => x.id === ing.semi);
    if (!s) return 0;
    let c = calcSemiCostPerUnit(s) * ing.amt * _semiDrinkFactor(s);
    if (ing.loss) c = c / (1 - ing.loss);
    return c;
  }
  if (!MAT[ing.mat]) return 0;
  const _price = S.prices[ing.mat] != null ? S.prices[ing.mat] : MAT[ing.mat].price;
  let c = (_price / MAT[ing.mat].size) * ing.amt;
  if (ing.loss) c = c / (1 - ing.loss);
  return c;
}

/**
 * КБЖУ напитка на основе MAT_NUTRITION.
 * @returns {{ kcal, protein, fat, carbs }}
 */
export function calcNutrition(d) {
  const MAT_NUTRITION = window.MAT_NUTRITION;
  const SEMI = window.SEMI;
  // У полуфабрикатов (в их собственном рецепте) amt хранится в кг/л
  const isSemi = d.yield !== undefined;
  let kcal = 0, protein = 0, fat = 0, carbs = 0;
  (d.recipe || []).forEach(ing => {
    // ── Полуфабрикат в составе напитка ──────────────────────────
    if (ing.semi != null) {
      const s = (SEMI || []).find(x => x.id === ing.semi);
      if (!s || !s.yield) return;
      // Суммарное КБЖУ всей партии полуфабриката
      let sK = 0, sP = 0, sF = 0, sC = 0;
      (s.recipe || []).forEach(sr => {
        const sn = MAT_NUTRITION[sr.mat];
        if (!sn) return;
        const f = _semiUnitFactor(sr.mat);
        const a = sr.amt * f * (1 - (sr.loss || 0));
        sK += sn.kcal    * a / 100;
        sP += sn.protein * a / 100;
        sF += sn.fat     * a / 100;
        sC += sn.carbs   * a / 100;
      });
      // Количество полуфабриката в напитке (г/мл)
      const drinkAmt = ing.amt * _semiDrinkFactor(s) * (1 - (ing.loss || 0));
      kcal    += (sK / s.yield) * drinkAmt;
      protein += (sP / s.yield) * drinkAmt;
      fat     += (sF / s.yield) * drinkAmt;
      carbs   += (sC / s.yield) * drinkAmt;
      return;
    }
    // ── Обычное сырьё ────────────────────────────────────────────
    const n = MAT_NUTRITION[ing.mat] || (window.MAT && window.MAT[ing.mat] && window.MAT[ing.mat].nutrition);
    if (!n) return;
    const factor = isSemi ? _semiUnitFactor(ing.mat) : 1;
    const amt = ing.amt * factor * (1 - (ing.loss || 0));
    kcal    += n.kcal    * amt / 100;
    protein += n.protein * amt / 100;
    fat     += n.fat     * amt / 100;
    carbs   += n.carbs   * amt / 100;
  });
  return {
    kcal:    Math.round(kcal),
    protein: +protein.toFixed(1),
    fat:     +fat.toFixed(1),
    carbs:   +carbs.toFixed(1),
  };
}

// ─── Агрегация ────────────────────────────────────────────────────

/**
 * Обогащает DRINKS расчётными полями: cost, price, profit, fc, rec.
 * rec = рекомендуемая цена продажи при targetFC.
 */
export function enrich() {
  const DRINKS = window.DRINKS;
  const S      = window.S;
  return DRINKS.map(d => {
    const cost   = calcCost(d);
    const price  = S.salePrices[d.id];
    const profit = price - cost;
    const fc     = price > 0 ? cost / price : 0;
    const rec    = Math.ceil(cost / S.targetFC / 10) * 10;
    return { ...d, cost, price, profit, fc, rec };
  });
}

/**
 * Добавляет поле abc: 'A'|'B'|'C' + abcTip по убыванию прибыли.
 * A = топ 20%, B = следующие 30%, C = оставшиеся 50%.
 */
export function withABC(drinks) {
  const sorted = [...drinks].sort((a, b) => b.profit - a.profit);
  const n = sorted.length;
  const nA  = Math.round(n * 0.2);
  const nAB = Math.round(n * 0.5);
  const totalProfit = sorted.reduce((s, d) => s + Math.max(d.profit, 0), 0);
  const map = {}, tipMap = {};
  sorted.forEach((d, i) => {
    const cls   = i < nA ? 'A' : i < nAB ? 'B' : 'C';
    const share = totalProfit > 0 ? (Math.max(d.profit, 0) / totalProfit * 100).toFixed(1) : '0.0';
    map[d.id]    = cls;
    tipMap[d.id] =
      cls === 'A'
        ? `Класс A — топ-20% по прибыли. Позиция #${i+1} из ${n}. Доля в марже меню: ${share}%. Рекомендация: продвигать активнее, держать в меню.`
      : cls === 'B'
        ? `Класс B — средняя зона (30% ассортимента). Позиция #${i+1} из ${n}. Доля в марже: ${share}%. Рекомендация: рабочий ассортимент, можно поднять цену.`
        : `Класс C — нижние 50% по прибыли. Позиция #${i+1} из ${n}. Доля в марже: ${share}%. Рекомендация: пересмотреть цену или снизить себестоимость.`;
  });
  return drinks.map(d => ({ ...d, abc: map[d.id], abcTip: tipMap[d.id] }));
}

// ─── Метрики ──────────────────────────────────────────────────────

/**
 * Простые средние по массиву напитков.
 * @returns {{ avgCost, avgPrice, avgProfit, avgFC }}
 */
export function avgMetrics(drinks) {
  const n = drinks.length || 1;
  const avgCost   = drinks.reduce((s, d) => s + d.cost,   0) / n;
  const avgPrice  = drinks.reduce((s, d) => s + d.price,  0) / n;
  const avgProfit = drinks.reduce((s, d) => s + d.profit, 0) / n;
  const avgFC     = avgCost / avgPrice;
  return { avgCost, avgPrice, avgProfit, avgFC };
}

/**
 * Взвешенные средние по реальным порциям из плана продаж (S.portions).
 * Если плана нет — возвращает avgMetrics.
 */
export function weightedMetrics(drinks) {
  const S = window.S;
  const totalPorts = Object.values(S.portions).reduce((s, v) => s + v, 0);
  if (totalPorts === 0) return avgMetrics(drinks);
  let wCost = 0, wPrice = 0, wProfit = 0;
  drinks.forEach(d => {
    const p = S.portions[d.id] || 0;
    wCost   += d.cost   * p;
    wPrice  += d.price  * p;
    wProfit += d.profit * p;
  });
  const avgCost   = wCost   / totalPorts;
  const avgPrice  = wPrice  / totalPorts;
  const avgProfit = wProfit / totalPorts;
  const avgFC     = avgCost / avgPrice;
  return { avgCost, avgPrice, avgProfit, avgFC };
}

function _num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeAddonSale(item = {}) {
  return {
    id: item.id,
    name: String(item.name || '').trim(),
    category: item.category || 'other',
    type: item.type || 'resale',
    mode: item.mode === 'units' ? 'units' : 'attach',
    price: Math.max(0, _num(item.price)),
    cost: Math.max(0, _num(item.cost)),
    unitsPerDay: Math.max(0, _num(item.unitsPerDay)),
    attachPct: Math.max(0, _num(item.attachPct)),
    qtyPerCheck: Math.max(0, _num(item.qtyPerCheck, 1) || 1),
  };
}

export function addonSaleUnits(item, totalChecks) {
  const row = normalizeAddonSale(item);
  if (row.mode === 'units') return row.unitsPerDay;
  return Math.max(0, totalChecks || 0) * row.attachPct / 100 * row.qtyPerCheck;
}

export function addonSalesMetrics(totalChecks = 0) {
  const S = window.S || {};
  const rows = (Array.isArray(S.addonSales) ? S.addonSales : [])
    .map(item => {
      const row = normalizeAddonSale(item);
      const unitsDay = addonSaleUnits(row, totalChecks);
      const revDay = row.price * unitsDay;
      const costDay = row.cost * unitsDay;
      const prfDay = revDay - costDay;
      const fc = row.price > 0 ? row.cost / row.price : 0;
      return { ...row, unitsDay, revDay, costDay, prfDay, fc };
    })
    .filter(row => row.name || row.price > 0 || row.cost > 0 || row.unitsDay > 0 || row.attachPct > 0);

  const revDay = rows.reduce((s, row) => s + row.revDay, 0);
  const costDay = rows.reduce((s, row) => s + row.costDay, 0);
  const prfDay = rows.reduce((s, row) => s + row.prfDay, 0);
  const days = Math.max(1, _num(S.days, 30));
  return {
    rows,
    unitsDay: rows.reduce((s, row) => s + row.unitsDay, 0),
    revDay,
    costDay,
    prfDay,
    revMon: revDay * days,
    costMon: costDay * days,
    prfMon: prfDay * days,
  };
}

/**
 * Итоговые метрики плана продаж.
 * @returns {{ totalPort, totRevDay, totPrfDay, totRevMon, totPrfMon }}
 */
export function salesMetrics(drinks) {
  const S = window.S;
  const totalPort = drinks.reduce((s, d) => s + (S.portions[d.id] || 0), 0);
  const totalChecks = totalPort;
  const checksAuto = true;
  const drinkRevDay = drinks.reduce((s, d) => s + d.price  * (S.portions[d.id] || 0), 0);
  const drinkCostDay = drinks.reduce((s, d) => s + d.cost * (S.portions[d.id] || 0), 0);
  const drinkPrfDay = drinks.reduce((s, d) => s + d.profit * (S.portions[d.id] || 0), 0);
  const addon = addonSalesMetrics(totalChecks);
  const totRevDay = drinkRevDay + addon.revDay;
  const totCostDay = drinkCostDay + addon.costDay;
  const totPrfDay = drinkPrfDay + addon.prfDay;
  const days = Math.max(1, _num(S.days, 30));
  return {
    totalPort,
    totalChecks,
    checksAuto,
    drinkRevDay,
    drinkCostDay,
    drinkPrfDay,
    drinkRevMon: drinkRevDay * days,
    drinkCostMon: drinkCostDay * days,
    drinkPrfMon: drinkPrfDay * days,
    addonRows: addon.rows,
    addonUnitsDay: addon.unitsDay,
    addonRevDay: addon.revDay,
    addonCostDay: addon.costDay,
    addonPrfDay: addon.prfDay,
    addonRevMon: addon.revMon,
    addonCostMon: addon.costMon,
    addonPrfMon: addon.prfMon,
    addonShare: totRevDay > 0 ? addon.revDay / totRevDay : 0,
    avgDrinkCheck: totalChecks > 0 ? drinkRevDay / totalChecks : 0,
    avgAddonCheck: totalChecks > 0 ? addon.revDay / totalChecks : 0,
    avgCheckTotal: totalChecks > 0 ? totRevDay / totalChecks : 0,
    avgProfitTotal: totalChecks > 0 ? totPrfDay / totalChecks : 0,
    totCostDay,
    totRevDay,
    totPrfDay,
    totCostMon: totCostDay * days,
    totRevMon: totRevDay * days,
    totPrfMon: totPrfDay * days,
  };
}

/**
 * Возвращает массив постоянных расходов с подставленными значениями:
 * – ФОТ-строки заменяются на реальный payrollTotal()
 * – %-строки пересчитываются от текущей выручки
 */
export function getEffectiveCosts(revMon) {
  const S          = window.S;
  const payrollTot = window.payrollTotal;
  if (revMon === undefined) {
    const { totRevMon } = salesMetrics(enrich());
    revMon = totRevMon;
  }
  const fotVal = typeof payrollTot === 'function' ? payrollTot() : 0;
  return S.fixedCosts.map(c => {
    if (/^фот|зарплат|зп$|оплата.?труда/i.test(c.name.trim())) {
      return { ...c, value: fotVal, _fromPayroll: true };
    }
    if (c.isPercent && c.pct) {
      const share = (c.pctShare != null ? c.pctShare : 100) / 100;
      return { ...c, value: Math.round(revMon * share * c.pct / 100) };
    }
    return c;
  });
}

/**
 * Расчёт точки безубыточности (ТБУ).
 * Зависит от weightedMetrics, salesMetrics, getEffectiveCosts, payrollTotal.
 */
export function bepCalc(drinks) {
  const S            = window.S;
  const getEffective = window.getEffectiveCosts;
  const payrollTot   = window.payrollTotal;
  const sales         = salesMetrics(drinks);
  const { totRevMon: _bepRev } = sales;
  const _bepEff = getEffective(_bepRev);
  const fixedFromCosts = _bepEff.reduce((s, c) => s + c.value, 0);
  const fotInFixed = _bepEff.some(c => /фот|зарплат|зп|оплата.?труда/i.test(c.name));
  const payroll = fotInFixed ? 0 : (typeof payrollTot === 'function' ? payrollTot() : 0);
  const totalFixed = fixedFromCosts + payroll;
  const weighted = weightedMetrics(drinks);
  const avgProfit = sales.totalChecks > 0 ? sales.avgProfitTotal : weighted.avgProfit;
  const avgPrice = sales.totalChecks > 0 ? sales.avgCheckTotal : weighted.avgPrice;
  const cupsMonth = avgProfit > 0 ? Math.ceil(totalFixed / avgProfit) : 0;
  const cupsDay   = Math.ceil(cupsMonth / (S.days || 30));
  return { totalFixed, fixedFromCosts, payroll, cupsMonth, cupsDay, revBEP: cupsMonth * avgPrice };
}
