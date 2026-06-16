// ════════════════════════════════════════════════════════════════════
//  RENDER — SALES PLAN  (src/render/sales.js)
//
//  Все данные читаются из window.* — доступны после Object.assign
//  в конце public/app.js.
// ════════════════════════════════════════════════════════════════════

import { hasAccess } from '../ui/auth.js';

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
  const { totalPort, totRevDay, totPrfDay, totRevMon, totPrfMon } = salesMetrics(drinks);
  const wFC       = totRevMon > 0 ? 1 - totPrfMon / totRevMon : 0;
  const avgChk    = totalPort > 0 ? totRevDay / totalPort : 0;

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
        <div class="sales-kpi-label">Чашек / день</div>
        <div class="sales-kpi-val">${int(totalPort)}</div>
      </div>
      <div class="sales-kpi-card sales-kpi-compact" style="border-color:${fcBrd}">
        <div class="sales-kpi-label">Food-cost %</div>
        <div class="sales-kpi-val" style="color:${fcClr}">${pct(wFC)}</div>
      </div>
      <div class="sales-kpi-card sales-kpi-compact">
        <div class="sales-kpi-label">Средний чек</div>
        <div class="sales-kpi-val">${rub(avgChk)}</div>
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
  `;

  filterSales(salesSearch || '');
  if (_salesScroll) _salesEl.scrollTop = _salesScroll;
  const _salesTW = document.getElementById('sales-table-wrap');
  if (_salesTW && _salesTableScroll) _salesTW.scrollTop = _salesTableScroll;
}
