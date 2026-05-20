// src/ui/sort.js
// Сортировка и фильтрация таблиц дашборда и продаж

const sortState      = { col: 'profit', dir: 'desc' };
const salesSortState = { col: 'name',   dir: 'asc'  };
let   salesSearch    = '';

export function sortDrinks(drinks) {
  const { col, dir } = sortState;
  return [...drinks].sort((a, b) => {
    const av = a[col], bv = b[col];
    const r  = typeof av === 'string' ? av.localeCompare(bv, 'ru') : av > bv ? 1 : av < bv ? -1 : 0;
    return dir === 'asc' ? r : -r;
  });
}

export function setSort(col) {
  if (sortState.col === col) sortState.dir = sortState.dir === 'asc' ? 'desc' : 'asc';
  else { sortState.col = col; sortState.dir = 'desc'; }
  if (!window.renderDashboard) return;
  // Сохраняем горизонтальный скролл таблицы перед ре-рендером
  const tw = document.querySelector('#tab-dashboard .table-wrap');
  const savedX = tw ? tw.scrollLeft : 0;
  window.renderDashboard();
  if (window.lucide) window.lucide.createIcons();
  // Восстанавливаем после ре-рендера (новый .table-wrap уже в DOM)
  const tw2 = document.querySelector('#tab-dashboard .table-wrap');
  if (tw2 && savedX) tw2.scrollLeft = savedX;
}

export function thSort(col, label, cls = '', tip = '') {
  const active  = sortState.col === col;
  const arrow   = active ? (sortState.dir === 'asc' ? '↑' : '↓') : '↕';
  const sc      = active ? `sortable sort-${sortState.dir}` : 'sortable';
  const tipCls  = tip ? ' tip' : '';
  const tipAttr = tip ? ` data-tip="${tip}"` : '';
  return `<th class="${sc} ${cls}${tipCls}"${tipAttr} onclick="setSort('${col}')">${label} <span class="sort-arrow">${arrow}</span></th>`;
}

export function setSalesSort(col) {
  if (salesSortState.col === col) salesSortState.dir = salesSortState.dir === 'asc' ? 'desc' : 'asc';
  else { salesSortState.col = col; salesSortState.dir = col === 'name' ? 'asc' : 'desc'; }
  filterSales(salesSearch);
}

export function thSalesSort(col, label, cls = '', tip = '') {
  const active  = salesSortState.col === col;
  const arrow   = active ? (salesSortState.dir === 'asc' ? '↑' : '↓') : '↕';
  const sc      = active ? `sortable sort-${salesSortState.dir}` : 'sortable';
  const tipCls  = tip ? ' tip' : '';
  const tipAttr = tip ? ` data-tip="${tip}"` : '';
  return `<th class="${sc} ${cls}${tipCls}"${tipAttr} onclick="setSalesSort('${col}')">${label} <span class="sort-arrow">${arrow}</span></th>`;
}

export function filterSales(val) {
  salesSearch    = val;
  const S        = window.S;
  const drinks   = window.withABC(window.enrich());
  const { col, dir } = salesSortState;
  const sorted   = [...drinks].sort((a, b) => {
    const aVal = col === 'revMon'   ? a.price  * (S.portions[a.id] || 0) * S.days
               : col === 'prfMon'   ? a.profit * (S.portions[a.id] || 0) * S.days
               : col === 'portions' ? (S.portions[a.id] || 0)
               : a[col];
    const bVal = col === 'revMon'   ? b.price  * (S.portions[b.id] || 0) * S.days
               : col === 'prfMon'   ? b.profit * (S.portions[b.id] || 0) * S.days
               : col === 'portions' ? (S.portions[b.id] || 0)
               : b[col];
    const r = typeof aVal === 'string' ? aVal.localeCompare(bVal, 'ru') : aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    return dir === 'asc' ? r : -r;
  });
  const filtered = salesSearch
    ? sorted.filter(d => d.name.toLowerCase().includes(salesSearch.toLowerCase()))
    : sorted;

  const rub            = window.rub;
  const int            = window.int;
  const GROUP_LABEL    = window.GROUP_LABEL;
  const fcCombinedHtml = window.fcCombinedHtml;
  const abcBadge       = window.abcBadge;

  const ftPort   = filtered.reduce((s, d) => s + (S.portions[d.id] || 0), 0);
  const ftRevDay = filtered.reduce((s, d) => s + d.price  * (S.portions[d.id] || 0), 0);
  const ftPrfDay = filtered.reduce((s, d) => s + d.profit * (S.portions[d.id] || 0), 0);
  const ftRevMon = ftRevDay * S.days;
  const ftPrfMon = ftPrfDay * S.days;

  const _svgTrash     = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`;
  const _svgRotateCcw = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`;
  const _svgPencil    = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left:5px;color:var(--muted)"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;

  let lastGroup = null;
  const rows = filtered.map(d => {
    const p          = S.portions[d.id] || 0;
    const revM       = d.price  * p * S.days;
    const prfM       = d.profit * p * S.days;
    const zeroCls    = p === 0 ? ' style="opacity:.45"' : '';
    const recHighlight = d.fc > S.targetFC + 0.10
      ? 'style="color:#7a5800;font-weight:800"'
      : 'style="color:var(--navy);font-weight:700"';
    const fcWarning  = d.fc > S.targetFC + 0.10
      ? ' <span title="FC% существенно выше целевого" style="font-size:12px">⚠️</span>' : '';
    const actionBtn  = d.custom
      ? `<button class="btn btn-outline" style="padding:3px 8px;font-size:11px;color:var(--red);border-color:#f4b8c4" onclick="event.stopPropagation();deleteDrink(${d.id})" title="Удалить напиток">${_svgTrash}</button>`
      : d.modified
        ? `<button class="btn btn-outline" style="padding:3px 8px;font-size:11px;color:var(--muted)" onclick="event.stopPropagation();resetDrink(${d.id})" title="Вернуть к исходному">${_svgRotateCcw}</button>`
        : '';
    let grRow = '';
    if (!salesSearch && d.group !== lastGroup) {
      lastGroup = d.group;
      grRow = `<tr class="group-row"><td colspan="11">${GROUP_LABEL[d.group]}</td></tr>`;
    }
    return grRow + `<tr${zeroCls} style="cursor:pointer" onmousedown="if(document.activeElement&&document.activeElement.tagName==='INPUT')window._suppressRowClick=true;" onclick="if(window._suppressRowClick){window._suppressRowClick=false;}else{openEditDrink(${d.id});}">
      <td class="fw7">${d.name}${(d.custom || d.modified) ? _svgPencil : ''}${p === 0 ? ' <span style="font-size:10px;color:var(--muted)">—</span>' : ''}</td>
      <td class="ta-r mob-hide">${rub(d.cost)}</td>
      <td class="ta-c">${fcCombinedHtml(d.fc)}</td>
      <td class="ta-r" onclick="event.stopPropagation()"><span style="display:inline-flex;align-items:center;gap:4px"><input class="inp white dash-price-inp" type="number" inputmode="numeric" min="1" value="${d.price}" onchange="onSalePrice(${d.id},this.value)"><span style="font-size:12px;color:var(--muted)">₽</span></span></td>
      <td class="ta-r mob-hide" ${recHighlight}>${rub(d.rec)}${fcWarning}</td>
      <td class="ta-r mob-hide">${rub(d.profit)}</td>
      <td class="ta-c mob-hide">${abcBadge(d.abc, d.abcTip)}</td>
      <td class="ta-c" onclick="event.stopPropagation()"><input class="inp sm" type="number" min="0" inputmode="numeric" style="background:var(--light)" value="${p}" data-portions-id="${d.id}" oninput="onPortions(${d.id},this.value)"></td>
      <td class="ta-r mob-hide">${rub(revM)}</td>
      <td class="ta-r ${prfM > 0 ? 'num-pos fw7' : ''}">${rub(prfM)}</td>
      <td class="mob-hide" onclick="event.stopPropagation()">${actionBtn}</td>
    </tr>`;
  }).join('');

  const tb   = document.querySelector('#tab-sales tbody');
  const foot = document.querySelector('#tab-sales tfoot');
  if (tb)   tb.innerHTML = rows;
  if (foot) foot.innerHTML = `
    <tr style="background:var(--navy);color:white;font-weight:800;font-size:14px;box-shadow:0 -2px 8px rgba(0,0,0,.15)">
      <td>ИТОГО${salesSearch ? ' <span style="font-size:11px;opacity:.7">(фильтр)</span>' : ''}</td>
      <td class="mob-hide"></td>
      <td class="mob-hide"></td>
      <td class="mob-hide"></td>
      <td class="mob-hide"></td>
      <td class="mob-hide"></td>
      <td class="mob-hide"></td>
      <td class="ta-c" style="font-size:18px">${int(ftPort)}</td>
      <td class="ta-r mob-hide">${rub(ftRevMon)}</td>
      <td class="ta-r">${rub(ftPrfMon)}</td>
      <td class="mob-hide"></td>
    </tr>`;
}

export function filterDashboard(val) {
  window.searchQuery = val;
  if (window.renderDashboard) window.renderDashboard();
}
