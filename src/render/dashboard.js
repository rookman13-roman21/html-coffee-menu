// ════════════════════════════════════════════════════════════════════
//  RENDER — DASHBOARD  (src/render/dashboard.js)
//
//  Переходный период: читаем все данные из window.* —
//  они доступны после того как app.js сделал Object.assign(window,{...})
//  в конце своего файла.
// ════════════════════════════════════════════════════════════════════

export function filterDashboard(query) {
  window.searchQuery = query;
  renderDashboard();
}

export function toggleDashIntro() {
  const el = document.getElementById('dash-intro');
  if (!el) return;
  el.classList.toggle('open');
  const btn = document.getElementById('dash-intro-btn');
  if (btn) btn.classList.toggle('active', el.classList.contains('open'));
}

export function toggleTop10() {
  const panel   = document.getElementById('dash-top10-panel');
  const chevron = document.getElementById('dash-top10-chevron');
  if (!panel) return;
  const collapsed = panel.dataset.collapsed === '1';
  if (collapsed) {
    panel.style.maxHeight  = panel.scrollHeight + 'px';
    panel.style.opacity    = '1';
    panel.style.marginBottom = '20px';
    panel.dataset.collapsed = '0';
    if (chevron) chevron.style.transform = 'rotate(0deg)';
    localStorage.setItem('dash_top10_collapsed', '0');
    // после анимации снимаем ограничение высоты
    setTimeout(() => { if (panel.dataset.collapsed === '0') panel.style.maxHeight = ''; }, 320);
  } else {
    panel.style.maxHeight  = panel.scrollHeight + 'px';
    requestAnimationFrame(() => {
      panel.style.maxHeight  = '0';
      panel.style.opacity    = '0';
      panel.style.marginBottom = '0';
    });
    panel.dataset.collapsed = '1';
    if (chevron) chevron.style.transform = 'rotate(180deg)';
    localStorage.setItem('dash_top10_collapsed', '1');
  }
}

export function initTop10Collapse() {
  const panel   = document.getElementById('dash-top10-panel');
  const chevron = document.getElementById('dash-top10-chevron');
  if (!panel) return;
  const saved = localStorage.getItem('dash_top10_collapsed');
  if (saved === '1') {
    panel.style.maxHeight   = '0';
    panel.style.opacity     = '0';
    panel.style.marginBottom = '0';
    panel.style.transition  = 'none'; // без анимации при инициализации
    panel.dataset.collapsed = '1';
    if (chevron) chevron.style.transform = 'rotate(180deg)';
    // возвращаем transition после инициализации
    requestAnimationFrame(() => { panel.style.transition = ''; });
  }
}

export function renderDashboard() {
  const { withABC, enrich, avgMetrics, sortDrinks,
          rub, pct, fcCombinedHtml, abcBadge, thSort,
          S, searchQuery } = window;

  const drinks   = withABC(enrich());
  const { avgCost, avgPrice, avgProfit, avgFC } = avgMetrics(drinks);
  const riskCnt  = drinks.filter(d => d.fc > 0.30).length;
  const okCnt    = drinks.filter(d => d.fc > 0.25 && d.fc <= 0.30).length;
  const aCnt     = drinks.filter(d => d.abc === 'A').length;
  const sorted   = sortDrinks(drinks);
  const filtered = searchQuery
    ? sorted.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : sorted;

  // Mini bar chart top-10
  const top10  = [...drinks].sort((a, b) => b.profit - a.profit).slice(0, 10);
  const maxPr  = top10[0]?.profit || 1;
  const chartHtml = top10.map((d, i) => {
    const w  = Math.round(d.profit / maxPr * 100);
    const bc = d.abc === 'A' ? 'var(--soft)' : d.abc === 'B' ? '#ffd84a' : 'var(--red-bg)';
    const vc = d.abc === 'A' ? 'var(--navy)' : d.abc === 'B' ? '#7a5800' : 'var(--red)';
    return `<div class="dash-top10-row">
      <div class="dash-top10-rank" style="background:${bc};color:${vc}">${i + 1}</div>
      <div class="dash-top10-body">
        <div class="dash-top10-hdr">
          <span class="dash-top10-name">${d.name}</span>
          <span class="dash-top10-val" style="color:${vc}">${Math.round(d.profit)}\u00a0₽</span>
        </div>
        <div class="dash-top10-track">
          <div class="dash-top10-bar" style="width:${w}%;background:${bc}"></div>
        </div>
      </div>
    </div>`;
  }).join('');

  const rows = filtered.map(d => {
    const profCls      = d.profit >= avgProfit ? 'num-pos' : '';
    const recHighlight = d.fc > S.targetFC + 0.10
      ? 'style="color:#7a5800;font-weight:800"'
      : 'style="color:var(--navy);font-weight:700"';
    const actionBtn = d.custom
      ? `<button class="btn btn-outline" style="padding:3px 8px;font-size:11px;color:var(--red);border-color:#f4b8c4" onclick="event.stopPropagation();deleteDrink(${d.id})" title="Удалить напиток"><i data-lucide="trash-2" class="icon"></i></button>`
      : d.modified
        ? `<button class="btn btn-outline" style="padding:3px 8px;font-size:11px;color:var(--muted)" onclick="event.stopPropagation();resetDrink(${d.id})" title="Вернуть к исходному"><i data-lucide="rotate-ccw" class="icon"></i></button>`
        : '';
    return `<tr style="cursor:pointer" onmousedown="if(document.activeElement&&document.activeElement.tagName==='INPUT')window._suppressRowClick=true;" onclick="if(window._suppressRowClick){window._suppressRowClick=false;}else{openEditDrink(${d.id});}">
      <td class="fw7">${d.name}${(d.custom || d.modified) ? '<i data-lucide="pencil" class="icon" style="margin-left:5px;color:var(--muted)"></i>' : ''}</td>
      <td class="ta-r mob-hide">${rub(d.cost)}</td>
      <td>${fcCombinedHtml(d.fc)}</td>
      <td class="ta-r" onclick="event.stopPropagation()"><span style="display:inline-flex;align-items:center;gap:4px"><input class="inp white dash-price-inp" type="number" inputmode="numeric" min="1" value="${d.price}" onchange="onSalePrice(${d.id},this.value)"><span style="font-size:12px;color:var(--muted)">₽</span></span></td>
      <td class="ta-r mob-hide" ${recHighlight}>${rub(d.rec)}${d.fc > S.targetFC + 0.10 ? ' <span title="FC% существенно выше целевого" style="font-size:12px">⚠️</span>' : ''}</td>
      <td class="ta-r ${profCls}">${rub(d.profit)}</td>
      <td class="ta-c">${abcBadge(d.abc, d.abcTip)}</td>
      <td onclick="event.stopPropagation()">${actionBtn}</td>
    </tr>`;
  }).join('');

  document.getElementById('tab-dashboard').innerHTML = `
    <div class="page-title">
      <span class="page-title-left"><i data-lucide="layout-dashboard" class="icon"></i> Обзор меню</span>
      <div class="dash-hdr-actions">
        <button class="btn btn-outline dash-intro-toggle" id="dash-intro-btn" onclick="toggleDashIntro()" title="Подсказка"><i data-lucide="info" class="icon"></i> <span class="dash-btn-txt">Подсказка</span></button>
        <button class="btn btn-outline" onclick="openDropCandidates()" title="Кандидаты на удаление"><i data-lucide="scissors" class="icon"></i> <span class="dash-btn-txt">Кандидаты</span></button>
        <button class="btn btn-outline" onclick="exportDashboard()" title="CSV"><i data-lucide="download" class="icon"></i> <span class="dash-btn-txt">CSV</span></button>
      </div>
    </div>
    <div class="tab-intro" id="dash-intro">
      <div class="tab-intro-icon"><i data-lucide="layout-dashboard" class="icon icon-lg"></i></div>
      <div>
        <div class="tab-intro-title">Добро пожаловать в MBS* Coffee Menu</div>
        <div class="tab-intro-text">
          Это CFO-инструмент владельца кофейни — считает <strong>себестоимость</strong> каждого напитка из рецептуры, показывает <strong>прибыль с каждой чашки</strong> и помогает построить <strong>финансовую модель</strong> всего заведения.<br>
          Вкладка «Обзор» — стартовая точка: рейтинг всех напитков по прибыльности, ABC-анализ меню и ключевые метрики.<br>
          <strong>FC%</strong> (фуд-кост) — доля себестоимости в цене. Чем ниже — тем выгоднее позиция для кофейни.<br>
          Цену продажи можно редактировать прямо в таблице — все расчёты пересчитаются мгновенно.
        </div>
        <div class="tab-intro-steps">
          <span class="tab-intro-step">🟢 FC ≤ 25% — отлично</span>
          <span class="tab-intro-step">🟡 26–30% — допустимо</span>
          <span class="tab-intro-step">🔴 > 30% — пересмотри цену</span>
          <span class="tab-intro-step">A — топ 20% прибыли · B — рабочие · C — кандидаты на пересмотр</span>
          <span class="tab-intro-step">Целевой FC% — задай норму, система покажет рекомендуемую цену</span>
          <span class="tab-intro-step">⚠️ рядом с ценой — она ниже рекомендованной для целевого FC%</span>
          <span class="tab-intro-step">Клик на заголовок таблицы — сортировка по любому столбцу</span>
        </div>
      </div>
    </div>
    <div class="kpi-grid">
      <div class="kpi-card accent"><div class="kpi-label">Напитков в меню</div><div class="kpi-value">${drinks.length}</div></div>
      <div class="kpi-card"><div class="kpi-label">Средний чек</div><div class="kpi-value">${rub(avgPrice)}</div></div>
      <div class="kpi-card"><div class="kpi-label">Прибыль / чашка</div><div class="kpi-value">${rub(avgProfit)}</div></div>
      <div class="kpi-card"><div class="kpi-label">Средний FC%</div><div class="kpi-value">${pct(avgFC)}</div></div>
      <div class="kpi-card kpi-card--editable kpi-card--span2" title="Нажмите для изменения">
        <div class="kpi-label">Целевой FC%</div>
        <div class="kpi-value kpi-value--input">
          <input type="number" id="kpi-target-fc" class="kpi-inp" min="5" max="60" step="1" inputmode="numeric"
            value="${Math.round(S.targetFC * 100)}"
            oninput="onTargetFCSilent(this.value)"
            onblur="onTargetFC(this.value)"
            onclick="event.stopPropagation()"
            title="Целевой food-cost %">
          <span class="kpi-inp-unit">%</span>
        </div>
      </div>
    </div>
    <div class="section-title dash-top10-title" onclick="toggleTop10()" style="cursor:pointer;user-select:none" title="Свернуть / развернуть">
      <i data-lucide="trending-down" class="icon"></i> Топ-10 по прибыли с чашки
      <i data-lucide="chevron-up" class="icon dash-top10-chevron" id="dash-top10-chevron" style="margin-left:auto;transition:transform .25s"></i>
    </div>
    <div class="panel dash-top10-panel" id="dash-top10-panel" style="margin-bottom:20px;overflow:hidden;transition:max-height .3s ease,opacity .25s ease,margin .25s ease">${chartHtml}</div>
    <div class="section-title"><i data-lucide="clipboard-list" class="icon"></i> Рейтинг напитков — кликните заголовок для сортировки</div>
    <div class="dash-search-row">
      <div class="search-wrap" style="margin-bottom:0;flex:1">
        <span class="search-icon"><i data-lucide="search" class="icon"></i></span>
        <input class="search-inp" id="dash-search" type="text" placeholder="Поиск по названию..."
          value="${searchQuery}" oninput="filterDashboard(this.value);_searchClear(this)">
        <button class="search-clear${searchQuery ? ' visible' : ''}" title="Очистить" onclick="filterDashboard('');var el=document.getElementById('dash-search');el.value='';_searchClear(el)">✕</button>
      </div>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr>
          ${thSort('name','Напиток','','Название позиции меню. Клик по строке — открыть карточку редактирования')}
          ${thSort('cost','Себест. ₽','ta-r mob-hide','Расчётная себестоимость одной порции по текущим ценам сырья. Пересчитывается автоматически при изменении цен поставщиков')}
          ${thSort('fc','FC%','ta-c','Food Cost % — доля себестоимости в цене продажи. 🟢 ≤25% отлично · 🟡 26–30% норма · 🔴 >30% пересмотрите цену или рецептуру')}
          ${thSort('price','Цена ₽','ta-r','Цена продажи для гостя. Редактируется прямо в таблице — изменения сохраняются немедленно')}
          ${thSort('rec','Рек. цена ₽','ta-r mob-hide','Минимальная цена для достижения целевого FC%. ⚠️ — ваша цена существенно ниже рекомендованной, позиция убыточна по FC')}
          ${thSort('profit','Прибыль ₽','ta-r','Прибыль с одной чашки = Цена − Себестоимость. Зелёный цвет — выше среднего по меню')}
          ${thSort('abc','ABC','ta-c','ABC-анализ по прибыли с чашки: A — топ 20% (продвигать), B — следующие 30% (рабочий ассортимент), C — нижние 50% (пересмотреть)')}
          <th></th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="panel" style="font-size:13px;color:var(--muted)">
      <strong style="color:var(--navy);display:block;margin-bottom:6px">ABC-классификация:</strong>
      <div style="display:flex;flex-direction:column;gap:4px">
        <div>${abcBadge('A')} Топ-20% по прибыли — приоритет продаж</div>
        <div>${abcBadge('B')} Следующие 30% — рабочий ассортимент</div>
        <div>${abcBadge('C')} Остальные 50% — пересмотреть цену или себестоимость</div>
      </div>
    </div>
  `;
}
