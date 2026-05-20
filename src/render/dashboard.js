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
  if (window.lucide) window.lucide.createIcons();
  const inp = document.getElementById('dash-search');
  if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
}

export function setDashGroup(v) {
  window.dashGroup = v;
  renderDashboard();
  if (window.lucide) window.lucide.createIcons();
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
  if (window.dashGroup === undefined) window.dashGroup = 'all';
  const { withABC, enrich, avgMetrics, sortDrinks,
          rub, pct, fcCombinedHtml, abcBadge, thSort,
          S, searchQuery } = window;
  const dg = window.dashGroup || 'all';

  const drinks   = withABC(enrich());
  const { avgCost, avgPrice, avgProfit, avgFC } = avgMetrics(drinks);
  const riskCnt  = drinks.filter(d => d.fc > 0.30).length;
  const okCnt    = drinks.filter(d => d.fc > 0.25 && d.fc <= 0.30).length;
  const aCnt     = drinks.filter(d => d.abc === 'A').length;
  const sorted   = sortDrinks(drinks);
  const grpFiltered = dg !== 'all'
    ? sorted.filter(d => d.group === dg)
    : sorted;
  const filtered = searchQuery
    ? grpFiltered.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : grpFiltered;

  const rows = filtered.map(d => {
    const profCls      = d.profit >= avgProfit ? 'num-pos' : '';
    const recHighlight = d.fc > S.targetFC + 0.10
      ? 'style="color:#7a5800;font-weight:800"'
      : 'style="color:var(--navy);font-weight:700"';
    const _svgTrash    = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`;
    const _svgRotateCcw = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`;
    const _svgPencil    = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left:5px;color:var(--muted)"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
    const actionBtn = d.custom
      ? `<button class="btn btn-outline" style="padding:3px 8px;font-size:11px;color:var(--red);border-color:#f4b8c4" onclick="event.stopPropagation();deleteDrink(${d.id})" title="Удалить напиток">${_svgTrash}</button>`
      : d.modified
        ? `<button class="btn btn-outline" style="padding:3px 8px;font-size:11px;color:var(--muted)" onclick="event.stopPropagation();resetDrink(${d.id})" title="Вернуть к исходному">${_svgRotateCcw}</button>`
        : '';
    return `<tr style="cursor:pointer" onmousedown="if(document.activeElement&&document.activeElement.tagName==='INPUT')window._suppressRowClick=true;" onclick="if(window._suppressRowClick){window._suppressRowClick=false;}else{openEditDrink(${d.id});}">
      <td class="fw7">${d.name}${(d.custom || d.modified) ? _svgPencil : ''}</td>
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
          Вкладка «Обзор» — стартовая точка: рейтинг всех напитков по прибыльности и ключевые метрики.<br>
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
    </div>
    <div class="panel" style="font-size:13px;color:var(--muted);display:flex;align-items:center;gap:10px">
      <i data-lucide="arrow-right" class="icon" style="flex-shrink:0"></i>
      <span>Таблица напитков объединена с планом продаж — перейдите во вкладку <strong style="color:var(--navy)">«Планирование продаж»</strong> чтобы увидеть FC%, цены, ABC-рейтинг и план порций в одном месте.</span>
    </div>
  `;
}
