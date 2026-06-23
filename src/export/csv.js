// src/export/csv.js
// CSV-экспорт: общая утилита + дашборд + продажи

export function exportCSV(filename, headers, rows) {
  const csv = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' })),
    download: filename,
  });
  a.click();
  URL.revokeObjectURL(a.href);
}

export function exportDashboard() {
  const drinks = window.withABC(window.enrich());
  exportCSV('mbs-dashboard.csv',
    ['Напиток', 'Цена ₽', 'Себест. ₽', 'Прибыль ₽', 'FC%', 'Рейтинг'],
    window.sortDrinks(drinks).map(d => [
      d.name, Math.round(d.price), Math.round(d.cost),
      Math.round(d.profit), window.pct(d.fc), d.abc,
    ])
  );
}

export function exportSales() {
  const drinks = window.enrich();
  const sales = window.salesMetrics ? window.salesMetrics(drinks) : { addonRows: [] };
  const rows = drinks.map(d => {
    const p = window.S.portions[d.id], rD = d.price * p, pD = d.profit * p;
    return ['Напиток', d.name, '', Math.round(d.price), Math.round(d.cost), Math.round(d.profit),
      p, Math.round(rD), Math.round(pD), Math.round(rD * window.S.days), Math.round(pD * window.S.days)];
  });
  (sales.addonRows || []).forEach(row => {
    rows.push([
      'Доп. позиция',
      row.name,
      row.mode === 'units' ? 'шт/день' : '% чеков',
      Math.round(row.price),
      Math.round(row.cost),
      Math.round(row.price - row.cost),
      +(row.unitsDay || 0).toFixed(1),
      Math.round(row.revDay),
      Math.round(row.prfDay),
      Math.round(row.revDay * window.S.days),
      Math.round(row.prfDay * window.S.days),
    ]);
  });
  exportCSV('mbs-sales.csv',
    ['Тип', 'Позиция', 'Модель', 'Цена', 'Себест.', 'Прибыль/шт', 'Шт/день', 'Выручка/день', 'Прибыль/день', 'Выручка/мес', 'Прибыль/мес'],
    rows
  );
}
