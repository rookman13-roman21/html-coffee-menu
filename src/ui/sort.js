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
  const drinks   = window.enrich();
  const { col, dir } = salesSortState;
  const sorted   = [...drinks].sort((a, b) => {
    const aVal = col === 'revMon'   ? a.price  * (S.portions[a.id] || 0) * S.days
               : col === 'prfMon'   ? a.profit * (S.portions[a.id] || 0) * S.days
               : col === 'revDay'   ? a.price  * (S.portions[a.id] || 0)
               : col === 'prfDay'   ? a.profit * (S.portions[a.id] || 0)
               : col === 'portions' ? (S.portions[a.id] || 0)
               : a[col];
    const bVal = col === 'revMon'   ? b.price  * (S.portions[b.id] || 0) * S.days
               : col === 'prfMon'   ? b.profit * (S.portions[b.id] || 0) * S.days
               : col === 'revDay'   ? b.price  * (S.portions[b.id] || 0)
               : col === 'prfDay'   ? b.profit * (S.portions[b.id] || 0)
               : col === 'portions' ? (S.portions[b.id] || 0)
               : b[col];
    const r = typeof aVal === 'string' ? aVal.localeCompare(bVal, 'ru') : aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    return dir === 'asc' ? r : -r;
  });
  const filtered = salesSearch
    ? sorted.filter(d => d.name.toLowerCase().includes(salesSearch.toLowerCase()))
    : sorted;

  const rub         = window.rub;
  const int         = window.int;
  const GROUP_LABEL = window.GROUP_LABEL;

  const ftPort   = filtered.reduce((s, d) => s + (S.portions[d.id] || 0), 0);
  const ftRevDay = filtered.reduce((s, d) => s + d.price  * (S.portions[d.id] || 0), 0);
  const ftPrfDay = filtered.reduce((s, d) => s + d.profit * (S.portions[d.id] || 0), 0);
  const ftRevMon = ftRevDay * S.days;
  const ftPrfMon = ftPrfDay * S.days;

  let lastGroup = null;
  const rows = filtered.map(d => {
    const p       = S.portions[d.id] || 0;
    const revM    = d.price  * p * S.days;
    const prfD    = d.profit * p;
    const zeroCls = p === 0 ? ' style="opacity:.45"' : '';
    let grRow = '';
    if (!salesSearch && d.group !== lastGroup) {
      lastGroup = d.group;
      grRow = `<tr class="group-row"><td colspan="4">${GROUP_LABEL[d.group]}</td></tr>`;
    }
    return grRow + `<tr${zeroCls}>
      <td class="fw7">${d.name}${p === 0 ? ' <span style="font-size:10px;color:var(--muted)">—</span>' : ''}</td>
      <td class="ta-c">
        <input class="inp sm" type="number" min="0" inputmode="numeric" style="background:var(--light)"
          value="${p}" data-portions-id="${d.id}"
          oninput="onPortions(${d.id},this.value)">
      </td>
      <td class="ta-r">${rub(revM)}</td>
      <td class="ta-r num-pos fw7">${rub(prfD * S.days)}</td>
    </tr>`;
  }).join('');

  const tb   = document.querySelector('#tab-sales tbody');
  const foot = document.querySelector('#tab-sales tfoot');
  if (tb)   tb.innerHTML = rows;
  if (foot) foot.innerHTML = `
    <tr style="background:var(--navy);color:white;font-weight:800;font-size:14px;box-shadow:0 -2px 8px rgba(0,0,0,.15)">
      <td>ИТОГО${salesSearch ? ' <span style="font-size:11px;opacity:.7">(фильтр)</span>' : ''}</td>
      <td class="ta-c" style="font-size:18px">${int(ftPort)}</td>
      <td class="ta-r">${rub(ftRevMon)}</td>
      <td class="ta-r">${rub(ftPrfMon)}</td>
    </tr>`;
}

export function filterDashboard(val) {
  window.searchQuery = val;
  if (window.renderDashboard) window.renderDashboard();
}
