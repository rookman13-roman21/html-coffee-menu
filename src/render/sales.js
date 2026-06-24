// ════════════════════════════════════════════════════════════════════
//  RENDER — SALES PLAN  (src/render/sales.js)
//
//  Все данные читаются из window.* — доступны после Object.assign
//  в конце public/app.js.
// ════════════════════════════════════════════════════════════════════

import { hasAccess } from '../ui/auth.js';

const ADDON_CATEGORY_LABELS = {
  bakery: 'Выпечка',
  dessert: 'Десерты',
  food: 'Еда',
  impulse: 'Импульс',
  retail: 'Розница',
  other: 'Другое',
};

const ADDON_TYPE_LABELS = {
  resale: 'Перепрод.',
  inhouse: 'Своё',
};

const ADDON_PRESET_LABELS = {
  none: 'Только напитки',
  bakery: 'Напитки + выпечка',
  showcase: 'Кофейня с витриной',
  kitchen: 'Кофейня с кухней',
  kiosk: 'Киоск / to go',
};

function escAttr(v) {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function addonOptions(labels, active) {
  return Object.entries(labels).map(([key, label]) => `<option value="${key}"${active === key ? ' selected' : ''}>${label}</option>`).join('');
}

function addonTh(label, cls = '', tip = '') {
  return `<th class="${cls}${tip ? ' tip' : ''}"${tip ? ` data-tip="${tip}"` : ''}>${label}</th>`;
}

function addonCategoryTabs(rows, active) {
  const counts = rows.reduce((acc, row) => {
    acc[row.category] = (acc[row.category] || 0) + 1;
    return acc;
  }, {});
  const cats = ['all', ...Object.keys(ADDON_CATEGORY_LABELS).filter(cat => counts[cat])];
  return `<div class="addon-tabs">${cats.map(cat => {
    const label = cat === 'all' ? 'Все' : ADDON_CATEGORY_LABELS[cat];
    const count = cat === 'all' ? rows.length : counts[cat];
    return `<button class="addon-tab${active === cat ? ' active' : ''}" onclick="setAddonFilter('${cat}')">${label} <span>${count}</span></button>`;
  }).join('')}</div>`;
}

function renderSalesWarning(metrics, pct) {
  const target = window.S?.targetFC || 0.25;
  const combinedFC = metrics.totRevDay > 0 ? metrics.totCostDay / metrics.totRevDay : 0;
  const risky = (metrics.addonRows || [])
    .filter(row => row.price > 0 && row.fc > Math.max(target, 0.3))
    .sort((a, b) => b.fc - a.fc)
    .slice(0, 3);
  if (combinedFC <= target && !risky.length) return '';
  const parts = [];
  if (combinedFC > target) parts.push(`общий FC ${pct(combinedFC)} выше цели ${pct(target)}`);
  if (risky.length) parts.push(`высокий FC: ${risky.map(row => `${row.name} ${pct(row.fc)}`).join(', ')}`);
  return `<div class="sales-warning"><i data-lucide="alert-triangle" class="icon"></i><span>${parts.join('; ')}.</span></div>`;
}

function renderCheckBreakdown(metrics, rub, int) {
  return `
    <div class="sales-check-breakdown">
      <div class="sales-check-main">
        <span>Средний чек</span>
        <strong>${rub(metrics.avgDrinkCheck || 0)} + ${rub(metrics.avgAddonCheck || 0)} = ${rub(metrics.avgCheckTotal || 0)}</strong>
      </div>
      <div class="sales-check-meta">
        <span>${int(metrics.totalPort || 0)} напитков/день</span>
        <span>${int(metrics.addonUnitsDay || 0)} доп. поз./день</span>
      </div>
    </div>`;
}

function renderAddonSalesBlock(metrics, rub, pct, int) {
  const allRows = metrics.addonRows || [];
  const activeFilter = (window.S?.salesMeta?.addonFilter) || 'all';
  const rows = activeFilter === 'all' ? allRows : allRows.filter(row => row.category === activeFilter);
  const filteredRevMon = rows.reduce((s, row) => s + row.revDay * (window.S.days || 30), 0);
  const filteredPrfMon = rows.reduce((s, row) => s + row.prfDay * (window.S.days || 30), 0);
  const filteredCostMon = rows.reduce((s, row) => s + row.costDay * (window.S.days || 30), 0);
  const rowHtml = rows.length ? rows.map(row => {
    const modeValueHtml = row.mode === 'units'
      ? `<span class="addon-volume-field"><input class="inp sm addon-num" type="number" min="0" step="1" inputmode="numeric" value="${Math.round(row.unitsPerDay || 0)}" oninput="onAddonSale(${row.id},'unitsPerDay',this.value,true)" onchange="onAddonSale(${row.id},'unitsPerDay',this.value)"><span class="addon-unit">шт</span></span>`
      : `<span class="addon-volume-field"><input class="inp sm addon-num" type="number" min="0" max="100" step="1" inputmode="numeric" value="${Math.round(row.attachPct || 0)}" oninput="onAddonSale(${row.id},'attachPct',this.value,true)" onchange="onAddonSale(${row.id},'attachPct',this.value)"><span class="addon-unit">%</span></span>`;
    return `
      <tr>
        <td><input class="inp addon-name-inp" value="${escAttr(row.name)}" onchange="onAddonSale(${row.id},'name',this.value)"></td>
        <td>
          <select class="modal-select addon-select" onchange="onAddonSale(${row.id},'category',this.value)">
            ${addonOptions(ADDON_CATEGORY_LABELS, row.category)}
          </select>
        </td>
        <td class="mob-hide">
          <select class="modal-select addon-select" onchange="onAddonSale(${row.id},'type',this.value)">
            ${addonOptions(ADDON_TYPE_LABELS, row.type)}
          </select>
        </td>
        <td class="ta-r"><input class="inp sm addon-num" type="number" min="0" inputmode="numeric" value="${Math.round(row.price)}" oninput="onAddonSale(${row.id},'price',this.value,true)" onchange="onAddonSale(${row.id},'price',this.value)"></td>
        <td class="ta-r mob-hide"><input class="inp sm addon-num" type="number" min="0" inputmode="numeric" value="${Math.round(row.cost)}" oninput="onAddonSale(${row.id},'cost',this.value,true)" onchange="onAddonSale(${row.id},'cost',this.value)"></td>
        <td>
          <select class="modal-select addon-select" onchange="onAddonSale(${row.id},'mode',this.value)">
            <option value="attach"${row.mode === 'attach' ? ' selected' : ''}>% чеков</option>
            <option value="units"${row.mode === 'units' ? ' selected' : ''}>шт/день</option>
          </select>
        </td>
        <td class="ta-c">${modeValueHtml}</td>
        <td class="ta-r mob-hide">${row.price > 0 ? pct(row.fc) : '—'}</td>
        <td class="ta-r">${rub(row.revDay * (window.S.days || 30))}</td>
        <td class="ta-r ${row.prfDay >= 0 ? 'num-pos' : 'num-neg'}">${rub(row.prfDay * (window.S.days || 30))}</td>
        <td class="ta-c"><button class="btn btn-outline addon-del-btn" onclick="deleteAddonSale(${row.id})" title="Удалить позицию"><i data-lucide="trash-2" class="icon"></i></button></td>
      </tr>`;
  }).join('') : `
      <tr><td colspan="11" class="addon-empty">Добавьте выпечку, еду, десерты или импульсные позиции — они увеличат средний чек и попадут в финмодель.</td></tr>
    `;

  return `
    <div class="sales-addon-block" id="sales-addon-block">
      <div class="sales-addon-head">
        <div>
          <div class="sales-addon-title"><i data-lucide="plus-circle" class="icon"></i> Дополнительные продажи</div>
          <div class="sales-addon-sub">Считаются как часть среднего чека: ${rub(metrics.avgDrinkCheck || 0)} напитки + ${rub(metrics.avgAddonCheck || 0)} доп. позиции.</div>
        </div>
        <div class="sales-addon-actions">
          <select class="modal-select addon-preset-select" onchange="applyAddonSalesPreset(this.value);this.value=''">
            <option value="">Пресет доп. продаж</option>
            ${Object.entries(ADDON_PRESET_LABELS).map(([key, label]) => `<option value="${key}">${label}</option>`).join('')}
          </select>
          <button class="btn btn-outline" onclick="addAddonSale('bakery')">+ Выпечка</button>
          <button class="btn btn-outline" onclick="addAddonSale('dessert')">+ Десерт</button>
          <button class="btn btn-outline" onclick="addAddonSale('food')">+ Еда</button>
          <button class="btn btn-outline" onclick="addAddonSale('impulse')">+ Импульс</button>
        </div>
      </div>
      ${renderCheckBreakdown(metrics, rub, int)}
      ${addonCategoryTabs(allRows, activeFilter)}
      <div class="table-wrap sales-addon-wrap">
        <table class="sales-addon-table">
          <thead><tr>
            ${addonTh('Позиция', '', 'Название дополнительной позиции: выпечка, десерт, еда, импульсная покупка или розница')}
            ${addonTh('Категория', '', 'Группа позиции для фильтрации и анализа структуры доп. продаж')}
            ${addonTh('Тип', 'mob-hide', 'Перепродажа — покупаем готовое. Своё — готовим внутри кофейни')}
            ${addonTh('Цена', 'ta-r', 'Цена продажи одной позиции')}
            ${addonTh('Себест.', 'ta-r mob-hide', 'Себестоимость одной позиции. Влияет на FC%, прибыль и финмодель')}
            ${addonTh('Модель', '', '% чеков — позиция покупается в доле заказов. шт/день — фиксированное количество в день')}
            ${addonTh('Объём', 'ta-c', 'Для % чеков: доля заказов с этой позицией. Для шт/день: среднее количество продаж в день')}
            ${addonTh('FC%', 'ta-r mob-hide', 'Food Cost % позиции = себестоимость ÷ цена продажи')}
            ${addonTh('Выр./мес', 'ta-r', 'Месячная выручка по позиции = цена × объём × дней в месяце')}
            ${addonTh('Приб./мес', 'ta-r', 'Месячная валовая прибыль по позиции = (цена − себестоимость) × объём × дней')}
            <th></th>
          </tr></thead>
          <tbody>${rowHtml}</tbody>
          <tfoot><tr>
            <td colspan="7">ИТОГО${activeFilter !== 'all' ? ' в фильтре' : ' доп. продаж'}</td>
            <td class="ta-r mob-hide">${filteredRevMon > 0 ? pct(filteredCostMon / filteredRevMon) : '—'}</td>
            <td class="ta-r">${rub(filteredRevMon || 0)}</td>
            <td class="ta-r">${rub(filteredPrfMon || 0)}</td>
            <td></td>
          </tr></tfoot>
        </table>
      </div>
    </div>`;
}

export function renderSales() {
  const {
    enrich, withABC, salesMetrics,
    rub, pct, int,
    fcCombinedHtml, abcBadge,
    S, SALES_PRESETS,
    salesSearch,
    thSalesSort, filterSales,
  } = window;

  const drinks = enrich();
  const metrics = salesMetrics(drinks);
  const { totalPort, totRevMon, totPrfMon } = metrics;
  const wFC       = totRevMon > 0 ? 1 - totPrfMon / totRevMon : 0;
  const avgChk    = metrics.avgCheckTotal || 0;

  const _salesEl        = document.getElementById('tab-sales');
  const _salesScroll    = _salesEl ? _salesEl.scrollTop : 0;
  const _salesTableWrap = document.getElementById('sales-table-wrap');
  const _salesTableScroll = _salesTableWrap ? _salesTableWrap.scrollTop : 0;

  const fcClr = wFC > 0.3 ? 'var(--red)' : wFC > 0.25 ? '#b38600' : 'var(--green)';
  const fcBrd = fcClr;
  const canEditMenu = hasAccess('drinks');

  _salesEl.innerHTML = `
    <div class="page-title">
      <span class="page-title-left"><i data-lucide="shopping-cart" class="icon"></i> Планирование продаж</span>
      <div class="sales-hdr-actions">
        <button class="btn btn-outline sales-intro-toggle" id="sales-intro-btn" onclick="toggleSalesIntro()" title="Подсказка"><i data-lucide="info" class="icon"></i> <span class="sales-btn-txt">Подсказка</span></button>
        ${canEditMenu ? '<button class="btn btn-outline" onclick="openDropCandidates()" title="Кандидаты на удаление"><i data-lucide="scissors" class="icon"></i> <span class="sales-btn-txt">Кандидаты</span></button>' : ''}
        <button class="btn btn-outline" onclick="exportSales()"><i data-lucide="download" class="icon"></i><span class="sales-btn-txt"> Скачать CSV</span></button>
      </div>
    </div>
    <div class="tab-intro" id="sales-intro">
      <div class="tab-intro-icon"><i data-lucide="shopping-cart" class="icon icon-lg"></i></div>
      <div>
        <div class="tab-intro-title">План продаж</div>
        <div class="tab-intro-text">
          Задай количество порций в день для каждого напитка — таблица считает <strong>выручку, прибыль, food-cost и средний чек</strong> в реальном времени.<br>
          Добавь <strong>выпечку, еду, десерты или импульсные позиции</strong>, чтобы средний чек и финмодель отражали реальный формат кофейни.<br>
          Используй <strong>пресет</strong> для быстрого старта или заполни порции вручную.<br>
          Кнопки <strong>±10%</strong> масштабируют весь план сразу. Поле <strong>«Дней в месяце»</strong> — для учёта неполного месяца.<br>
          Задай <strong>Целевой FC%</strong> — строки с превышением подсветятся красным. Все данные автоматически передаются в <strong>Финмодель</strong>.
        </div>
        <div class="tab-intro-steps">
          <span class="tab-intro-step">1. Выбери пресет или заполни порции вручную</span>
          <span class="tab-intro-step">2. Скорректируй ±10% или измени дни в месяце</span>
          <span class="tab-intro-step">3. Задай Целевой FC% — проверь, какие позиции не вписываются</span>
          <span class="tab-intro-step">4. Следи за KPI: food-cost, средний чек, прибыль/мес</span>
          <span class="tab-intro-step">5. Финмодель пересчитается автоматически</span>
        </div>
      </div>
    </div>

    <div class="sales-kpi-row">
      <div class="sales-kpi-card sales-kpi-wide">
        <div class="sales-kpi-label">Выручка / мес</div>
        <div class="sales-kpi-val">${rub(totRevMon)}</div>
      </div>
      <div class="sales-kpi-card sales-kpi-wide sales-kpi-green">
        <div class="sales-kpi-label">Прибыль / мес</div>
        <div class="sales-kpi-val" style="color:var(--green)">${rub(totPrfMon)}</div>
      </div>
      <div class="sales-kpi-card sales-kpi-compact">
        <div class="sales-kpi-label">Напитков / день</div>
        <div class="sales-kpi-val">${int(totalPort)}</div>
      </div>
      <div class="sales-kpi-card sales-kpi-compact" style="border-color:${fcBrd}">
        <div class="sales-kpi-label">Food-cost %</div>
        <div class="sales-kpi-val" style="color:${fcClr}">${pct(wFC)}</div>
      </div>
      <div class="sales-kpi-card sales-kpi-compact">
        <div class="sales-kpi-label">Средний чек</div>
        <div class="sales-kpi-val">${rub(avgChk)}</div>
        <div class="sales-kpi-sub">Напитки ${rub(metrics.avgDrinkCheck || 0)} + доп. ${rub(metrics.avgAddonCheck || 0)}</div>
      </div>
      <div class="sales-kpi-card sales-kpi-compact sales-kpi-click" onclick="scrollToAddonSales()" title="Перейти к дополнительным продажам">
        <div class="sales-kpi-label">Доп. продажи</div>
        <div class="sales-kpi-val">${rub(metrics.addonRevMon || 0)}</div>
        <div class="sales-kpi-sub">${pct(metrics.addonShare || 0)} выручки</div>
      </div>
      <div class="sales-kpi-card sales-kpi-compact kpi-card--editable" title="Целевой food-cost %">
        <div class="sales-kpi-label">Целевой FC%</div>
        <div class="sales-kpi-val kpi-value--input">
          <input type="number" id="kpi-target-fc" class="kpi-inp" min="5" max="60" step="1" inputmode="numeric"
            value="${Math.round(S.targetFC * 100)}"
            oninput="onTargetFCSilent(this.value)"
            onblur="onTargetFC(this.value)"
            onclick="event.stopPropagation()"
            title="Целевой food-cost %">
          <span class="kpi-inp-unit">%</span>
        </div>
      </div>
      <div class="sales-days-scale">
        <span class="sales-days-label">Дней в месяце:</span>
        <input class="inp sm" type="number" min="1" max="31" inputmode="numeric" value="${S.days}" onchange="onDays(this.value)">
      </div>
    </div>
    ${renderSalesWarning(metrics, pct)}
    <div class="sales-controls-row">
      <div class="sales-preset-wrap">
        <div class="modal-label">Пресет</div>
        <select class="modal-select sales-preset-select" onchange="applySalesPreset(this.value)">
          <option value="">— выбрать —</option>
          ${Object.entries(SALES_PRESETS).map(([k, p]) =>
            `<option value="${k}"${S.activePreset === k ? ' selected' : ''}>${p.label}</option>`
          ).join('')}
        </select>
      </div>
      <button class="btn btn-outline sales-scale-btn red" onclick="scaleSalesPortions(0.90)">−10%</button>
      <button class="btn btn-outline sales-scale-btn green" onclick="scaleSalesPortions(1.10)">+10%</button>
      <div class="search-wrap" style="margin-bottom:0;flex:1;min-width:140px">
        <span class="search-icon"><i data-lucide="search" class="icon"></i></span>
        <input class="search-inp" id="sales-search" type="text" placeholder="Поиск по названию..."
          value="${salesSearch || ''}" oninput="filterSales(this.value);_searchClear(this)">
        <button class="search-clear${salesSearch ? ' visible' : ''}" title="Очистить" onclick="filterSales('');var el=document.getElementById('sales-search');el.value='';_searchClear(el)">✕</button>
      </div>
    </div>

    <div class="table-wrap" id="sales-table-wrap">
      <table class="sales-merged-table">
        <colgroup>
          <col style="width:20%"><!-- Напиток -->
          <col class="mob-hide" style="width:7%"><!-- Себест. -->
          <col style="width:6%"><!-- FC% -->
          <col style="width:8%"><!-- Цена ₽ -->
          <col class="mob-hide" style="width:8%"><!-- Рек. цена -->
          <col class="mob-hide" style="width:8%"><!-- Прибыль/чашку -->
          <col class="mob-hide" style="width:5%"><!-- ABC -->
          <col style="width:9%"><!-- Порций/день -->
          <col class="mob-hide" style="width:10%"><!-- Выручка/мес -->
          <col style="width:10%"><!-- Прибыль/мес -->
          <col class="mob-hide" style="width:5%"><!-- Кнопка -->
        </colgroup>
        <thead><tr>
          ${thSalesSort('name',    'Напиток',           '',             'Название. Клик по строке — открыть карточку редактирования')}
          ${thSalesSort('cost',    'Себест. ₽',          'ta-r mob-hide','Расчётная себестоимость одной порции по текущим ценам сырья')}
          ${thSalesSort('fc',      'FC%',               'ta-c',         'Food Cost % — доля себестоимости в цене. 🟢 ≤25% · 🟡 26–30% · 🔴 >30%')}
          ${thSalesSort('price',   'Цена ₽',            'ta-r',         'Цена продажи. Редактируется прямо в таблице')}
          ${thSalesSort('rec',     'Рек. цена ₽',       'ta-r mob-hide','Минимальная цена для достижения целевого FC%')}
          ${thSalesSort('profit',  'Прибыль/чашку ₽',   'ta-r mob-hide','Прибыль с одной чашки = Цена − Себестоимость')}
          ${thSalesSort('abc',     'ABC',               'ta-c mob-hide','A — топ 20% прибыли · B — следующие 30% · C — нижние 50%')}
          ${thSalesSort('portions','Порций/день',       'ta-c',         'Среднее количество порций в день. Редактируется')}
          ${thSalesSort('revMon',  'Выручка/мес ₽',     'ta-r mob-hide','Выручка за месяц = Цена × Порций × Дней')}
          ${thSalesSort('prfMon',  'Прибыль/мес ₽',    'ta-r',         'Прибыль/чашку × Порций × Дней. Попадает в финмодель')}
          <th class="mob-hide"></th>
        </tr></thead>
        <tbody></tbody>
        <tfoot style="position:sticky;bottom:0;z-index:2"></tfoot>
      </table>
    </div>
    ${renderAddonSalesBlock(metrics, rub, pct, int)}
  `;

  filterSales(salesSearch || '');
  if (_salesScroll) _salesEl.scrollTop = _salesScroll;
  const _salesTW = document.getElementById('sales-table-wrap');
  if (_salesTW && _salesTableScroll) _salesTW.scrollTop = _salesTableScroll;
}
