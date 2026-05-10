// src/export/techcards.js
// Экспорт технологических карт (печать через iframe)



export function exportTechCards() {
  const { getOrgInfo, DRINKS, _buildTechCardBlock, _openTechCardsWindow } = window;
  const org = getOrgInfo();
  const orgName = org.name;
  let list = DRINKS.slice();
  const recipeGroup = window.recipeGroup;
  const recipeSearch = window.recipeSearch;
  if (recipeGroup !== 'all') list = list.filter(d => d.group === recipeGroup);
  if (recipeSearch) list = list.filter(d => d.name.toLowerCase().includes(recipeSearch.toLowerCase()));
  if (!list.length) { alert('Нет напитков для печати с текущими фильтрами.'); return; }

  const pages = list.map((d, idx) => {
    const cardNum = DRINKS.findIndex(x => x.id === d.id) + 1;
    return _buildTechCardBlock(d, org, cardNum, idx === list.length - 1);
  }).join('\n');

  _openTechCardsWindow(
    `Технологические карты — ${orgName}`,
    `${list.length} карт · ${new Date().toLocaleDateString('ru')}`,
    pages,
    400
  );
}

export function exportSemiTechCards() {
  const { getOrgInfo, SEMI, _buildSemiTechCardBlock, _openTechCardsWindow } = window;
  if (!SEMI.length) { alert('Нет полуфабрикатов для печати.'); return; }
  const org = getOrgInfo();
  const pages = SEMI.map((s, idx) =>
    _buildSemiTechCardBlock(s, org, idx + 1, idx === SEMI.length - 1)
  ).join('\n');
  _openTechCardsWindow(
    `Техкарты полуфабрикатов — ${org.name}`,
    `${SEMI.length} карт · ${new Date().toLocaleDateString('ru')}`,
    pages,
    400
  );
}

// ── Перенесено из public/app.js ──

export function _techCardCSS() {
  return `
  @import url('https://fonts.googleapis.com/css2?family=Mulish:wght@400;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Mulish', Arial, sans-serif; font-size: 9.5pt; color: #222; padding-top: 52px; }
  @page { size: A4; margin: 15mm 12mm; }
  .card { padding: 0 0 10px; }
  .pb { page-break-after: always; }
  .card-header-inner { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
  .approve { text-align: left; border: 1px solid #aaa; padding: 8px 12px; font-size: 9pt; min-width: 220px; }
  .drink-photo { width: 160px; height: 120px; object-fit: cover; border-radius: 4px; border: 1px solid #ccc; display: block; }
  h1 { text-align: center; font-size: 13pt; margin: 8px 0 2px; }
  .gost { text-align: center; font-size: 9pt; color: #555; margin-bottom: 12px; }
  h2 { font-size: 10pt; color: #417033; margin: 12px 0 5px; text-transform: uppercase; break-after: avoid; }
  .section { break-inside: avoid; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 9pt; }
  th { background: #417033; color: #fff; padding: 4px 6px; text-align: left; }
  td { padding: 3px 6px; border: 1px solid #ccc; }
  table.info td, table.qa td { border: 1px solid #bbb; }
  .lbl { font-weight: bold; background: #f0f5ee; width: 38%; }
  .r { text-align: right; } .c { text-align: center; } .b { font-weight: bold; }
  tr.total td { font-weight: bold; background: #f0f5ee; }
  .tech { line-height: 1.5; margin-bottom: 8px; }
  .sign { display: flex; justify-content: space-between; margin-top: 20px; font-size: 9pt; }
  .print-bar { position: fixed; top: 0; left: 0; right: 0; z-index: 999; background: #417033; color: #fff;
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 20px; gap: 12px; box-shadow: 0 2px 8px rgba(0,0,0,.25); font-family: 'Mulish', Arial, sans-serif; font-size: 13px; }
  .print-bar strong { font-size: 14px; }
  .print-bar button { background: #fff; color: #417033; border: none; border-radius: 6px; padding: 8px 20px; font-size: 13px; font-weight: 700; cursor: pointer; }
  .print-bar button:hover { background: #e7f2e3; }
  .mbs-footer { text-align: right; margin-top: 28px; padding-top: 6px;
    border-top: 1px solid #ddd; font-family: 'Mulish', Arial, sans-serif;
    font-size: 8pt; color: #888; }
  @media print { .print-bar { display: none; } body { padding-top: 0; }
    th, .lbl, tr.total td { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`;
}// ─── Генерация HTML одной карточки ──────────────────────────────────
export function _buildTechCardBlock(d, org, cardNum, isLast) {
  // org может быть строкой (обратная совместимость) или объектом
  if (typeof org === 'string') org = { name: org, legalName: org, ceoTitle: 'Руководитель', ceoName: '', address: '' };
  const orgName = org.name || 'Кофейня';
  const today = new Date().toLocaleDateString('ru');
  const year  = new Date().getFullYear();
  const GROUP_NAMES = { hot:'Горячие кофейные', tea:'Чай и матча', cold:'Холодные напитки', filter:'Фильтр-кофе', author:'Авторские' };
  const isCold = d.group === 'cold';

  const _dq = DRINK_QUALITY[d.id] || {};
  const qaAppearance  = d.appearance  || _dq.appearance  || '';
  const qaTaste       = d.taste       || _dq.taste       || '';
  const qaConsistency = d.consistency || _dq.consistency || '';
  const qaColor       = _dq.color || '';
  const storageLife   = d.storage_life  || (isCold ? '30 минут с момента приготовления' : '15 минут с момента приготовления');
  const servingTemp   = d.storage_temp  || (isCold ? 'не выше +10°C' : 'не ниже 60°C');

  const recipeRows = d.recipe.map(r => {
    if (r.semi != null) {
      const s = window.SEMI.find(x => x.id === r.semi);
      if (!s) return '';
      const cost = calcIngCost(r);
      const brutto = r.loss ? (r.amt / (1 - (r.loss||0))).toFixed(1) : r.amt.toString();
      const loss = r.loss ? (r.loss * 100).toFixed(0) + '%' : '—';
      return `<tr><td>${s.name} <sup style="font-size:7pt;color:#2a7a2a">[п/ф]</sup></td><td class="c">${s.unit}</td><td class="r">${brutto}</td><td class="r">${r.amt}</td><td class="c">${loss}</td><td class="r b">${Math.round(cost)} ₽</td></tr>`;
    }
    if (!window.MAT[r.mat]) return '';
    const m      = window.MAT[r.mat];
    const loss   = r.loss ? (r.loss * 100).toFixed(0) + '%' : '—';
    const brutto = r.loss ? (r.amt / (1 - r.loss)).toFixed(1) : r.amt.toString();
    const cost   = calcIngCost(r);
    return `<tr><td>${m.name}</td><td class="c">${m.unit.replace(/^1\s*/,'')}</td><td class="r">${brutto}</td><td class="r">${r.amt}</td><td class="c">${loss}</td><td class="r b">${Math.round(cost)} ₽</td></tr>`;
  }).join('');
  const totalCost = d.recipe.reduce((s,r) => s + calcIngCost(r), 0);

  // Блок раскрытых полуфабрикатов
  const usedSemis = d.recipe.filter(r => r.semi != null).map(r => window.SEMI.find(s => s.id === r.semi)).filter(Boolean);
  // Стоимость ингредиента полуфабриката (с учётом _semiUnitFactor)
  const _semiIngCostPDF = r => {
    if (!window.MAT[r.mat]) return 0;
    let c = ((window.S.prices[r.mat] || window.MAT[r.mat].price) / window.MAT[r.mat].size) * r.amt * _semiUnitFactor(r.mat);
    if (r.loss) c = c / (1 - r.loss);
    return c;
  };
  const semiBlock = usedSemis.length ? `
  <h2>Используемые полуфабрикаты</h2>
  ${usedSemis.map(s => {
    const semiCostPer = calcSemiCostPerUnit(s);
    const rows = (s.recipe||[]).filter(r => window.MAT[r.mat]).map(r => {
      const m = window.MAT[r.mat];
      const loss = r.loss ? (r.loss*100).toFixed(0)+'%' : '—';
      const brutto = r.loss ? (r.amt/(1-r.loss)).toFixed(1) : r.amt.toString();
      const cost = _semiIngCostPDF(r);
      return `<tr><td>${m.name}</td><td class="c">${m.unit.replace(/^1\s*/,'')}</td><td class="r">${brutto}</td><td class="r">${r.amt}</td><td class="c">${loss}</td><td class="r b">${Math.round(cost)} ₽</td></tr>`;
    }).join('');
    const semiTotal = (s.recipe||[]).reduce((sum,r) => sum + _semiIngCostPDF(r), 0);
    return `<p style="font-weight:700;margin:8pt 0 3pt">${s.name} — выход ${s.yield} ${s.unit}, себест. ${Math.round(semiCostPer)} ₽/${s.unit}</p>
    <table>
      <thead><tr><th>Сырьё</th><th>Ед.</th><th>Брутто</th><th>Нетто</th><th>Потери</th><th>Стоимость</th></tr></thead>
      <tbody>${rows}
      <tr class="total"><td colspan="5">ИТОГО сырья</td><td class="r b">${Math.round(semiTotal)} ₽</td></tr>
      </tbody>
    </table>
    ${s.process ? `<p style="font-size:9pt;color:#555;margin-top:4pt">${s.process.replace(/\n/g,'<br>')}</p>` : ''}`;
  }).join('')}` : '';

  const techText = d.process
    ? d.process.replace(/\n/g,'<br>')
    : d.group === 'hot'
      ? 'В подготовленную чашку приготовить эспрессо (одинарный/двойной согласно рецептуре). Вспенить молоко/сливки до температуры 60–65°C. Соединить компоненты согласно технологии напитка. При необходимости добавить сиропы/добавки. Подавать немедленно при температуре 60–65°C.'
      : d.group === 'tea'
      ? 'Чай: заварить кипятком (95°C) согласно дозировке, настаивать 3–5 минут. Матча: венчиком взбить порошок матча с горячей водой (80°C) до однородной пены, добавить молоко температурой 60°C. Подавать при температуре 60–65°C.'
      : 'Все компоненты предварительно охладить до +4°C. В стакан со льдом (3–4 кубика) последовательно влить ингредиенты согласно рецептуре. Перемешать барной ложкой. Подавать немедленно при температуре +4…+8°C.';

  const qaBlock = (qaAppearance || qaTaste || qaConsistency || qaColor)
    ? `<table class="qa">
      ${qaAppearance  ? `<tr><td class="lbl">Внешний вид</td><td>${qaAppearance}</td></tr>` : ''}
      ${qaConsistency ? `<tr><td class="lbl">Консистенция</td><td>${qaConsistency}</td></tr>` : ''}
      ${qaColor       ? `<tr><td class="lbl">Цвет</td><td>${qaColor}</td></tr>` : ''}
      ${qaTaste       ? `<tr><td class="lbl">Вкус и запах</td><td>${qaTaste}</td></tr>` : ''}
    </table>`
    : '<p style="color:#999;font-size:9pt">Показатели не заполнены</p>';


  const nut = calcNutrition(d);

  return `<div class="card${isLast ? '' : ' pb'}">
  <div class="card-header-inner">
    <div class="org-block">
      ${org.legalName ? `<div style="font-weight:700;font-size:10pt">${org.legalName}</div>` : ''}
      ${orgName !== org.legalName ? `<div style="font-size:9pt;color:#555">${orgName}</div>` : ''}
      ${org.address ? `<div style="font-size:8.5pt;color:#666">${org.address}</div>` : ''}
    </div>
    <div class="approve">
      <div><b>УТВЕРЖДАЮ:</b></div>
      <div>${org.ceoTitle || 'Руководитель'} ${org.legalName || orgName}</div>
      <div style="margin-top:8px">${org.ceoName || '_______________________'}</div>
      <div style="margin-top:4px;color:#888">(${org.ceoName ? 'подпись' : 'Ф.И.О.'})</div>
      <div style="margin-top:6px">«__» ____________ ${year} г.</div>
    </div>
  </div>
  ${getDrinkImage(d) ? `<img src="${getDrinkImage(d)}" alt="${d.name}" class="drink-photo" style="display:block;margin:0 auto 8px;width:160px;height:120px;object-fit:cover;border-radius:4px;border:1px solid #ccc" onerror="this.style.display='none'">` : ''}
  <h1>ТЕХНОЛОГИЧЕСКАЯ КАРТА № ${cardNum}</h1>
  <p class="gost">(по ГОСТ Р 53105-2008)</p>
  <table class="info">
    <tr><td class="lbl">Наименование изделия</td><td>${d.name}</td></tr>
    <tr><td class="lbl">Группа</td><td>${GROUP_NAMES[d.group] || '—'}</td></tr>
    <tr><td class="lbl">Выход готового изделия</td><td>${d.vol} мл (1 порция)</td></tr>
    <tr><td class="lbl">Дата составления</td><td>${today}</td></tr>
    <tr><td class="lbl">Срок реализации</td><td>${storageLife}</td></tr>
    <tr><td class="lbl">Температура подачи</td><td>${servingTemp}</td></tr>
    <tr><td class="lbl">Условия хранения сырья</td><td>+2…+6 °C для молочных продуктов, сухие при +18 °C</td></tr>
  </table>

  <div class="section">
  <h2>1. Характеристика сырья</h2>
  <p style="font-size:9pt;line-height:1.5;margin-bottom:8px">Продовольственное сырьё, пищевые продукты и полуфабрикаты, используемые для приготовления блюда, должны соответствовать требованиям действующих нормативных документов, иметь сопроводительные документы, подтверждающие их качество и безопасность (ТР ТС 021/2011).</p>
  </div>

  <div class="section">
  <h2>2. Рецептура</h2>
  <table>
    <thead><tr><th>Сырьё / полуфабрикат</th><th>Ед.</th><th>Брутто</th><th>Нетто</th><th>Потери</th><th>Стоимость</th></tr></thead>
    <tbody>${recipeRows}
    <tr class="total"><td colspan="5">ИТОГО</td><td class="r b">${Math.round(totalCost)} ₽</td></tr>
    </tbody>
  </table>
  </div>

  <div class="section">
  <h2>3. Технология приготовления</h2>
  <p class="tech">${techText}</p>
  ${semiBlock}
  </div>

  <div class="section">
  <h2>4. Требования к оформлению и подаче</h2>
  <p style="font-size:9pt;line-height:1.5;margin-bottom:8px">Подают в чистой посуде объёмом ${d.vol} мл. Температура подачи: ${servingTemp}. Срок реализации: ${storageLife}. Напиток подаётся немедленно после приготовления.</p>
  </div>

  <div class="section">
  <h2>5. Показатели качества и безопасности</h2>
  ${qaBlock}
  <p style="font-size:8.5pt;color:#444;margin-top:6px;line-height:1.5">Микробиологические показатели блюда соответствуют требованиям ТР ТС 021/2011 «О безопасности пищевой продукции», Приложение 1, индекс 6.2.</p>
  </div>

  <div class="section">
  <h2>6. Пищевая ценность (1 порция, ${d.vol} мл)</h2>
  <table class="qa">
    <tr><td class="lbl">Белки, г</td><td class="lbl">Жиры, г</td><td class="lbl">Углеводы, г</td><td class="lbl">Энергетическая ценность, ккал</td></tr>
    <tr><td>${nut.protein.toFixed(1)}</td><td>${nut.fat.toFixed(1)}</td><td>${nut.carbs.toFixed(1)}</td><td>${nut.kcal.toFixed(0)}</td></tr>
  </table>
  </div>

  <div class="section">
  <div class="sign">
    <span>Технолог: ____________________</span>
    <span>Зав. производством: ____________________</span>
  </div>
  </div>
</div>`;
}

// ─── Универсальная печать через скрытый iframe (надёжно в Safari) ───
export function _printViaIframe(html, filename) {
  // Удаляем старый iframe, если был
  const old = document.getElementById('mbs-print-iframe');
  if (old) old.remove();

  const iframe = document.createElement('iframe');
  iframe.id = 'mbs-print-iframe';
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  if (filename) iframe.setAttribute('name', filename); // подсказка имени для «Сохранить PDF»
  document.body.appendChild(iframe);

  const doIt = () => {
    try {
      const cw = iframe.contentWindow;
      cw.focus();
      cw.print();
    } catch(e) {
      alert('Не удалось открыть диалог печати: ' + e.message);
    }
    // Удаляем iframe позже — после закрытия диалога
    setTimeout(() => { iframe.remove(); }, 2000);
  };

  // Пишем HTML в iframe
  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  // Ждём загрузки картинок и шрифтов
  const imgs = doc.images ? Array.from(doc.images) : [];
  if (imgs.length === 0) {
    setTimeout(doIt, 250);
  } else {
    let loaded = 0;
    const done = () => { if (++loaded >= imgs.length) setTimeout(doIt, 200); };
    imgs.forEach(img => {
      if (img.complete) done();
      else { img.addEventListener('load', done); img.addEventListener('error', done); }
    });
    // Страховка — на случай зависших картинок
    setTimeout(() => { if (loaded < imgs.length) doIt(); }, 3000);
  }
}

// ─── Открыть окно с техкартами / запустить печать ───────────────────
// autoprint: число мс перед автопечатью; 0 — открыть превью без автопечати.
export function _openTechCardsWindow(title, hint, pages, autoprint) {
  // CSS без .print-bar (печатаем напрямую через iframe)
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
<style>${_techCardCSS()}
body { padding-top: 0; }
</style></head><body>
${pages}
<div class="mbs-footer">Московская школа бариста &nbsp;·&nbsp; baristaschool.ru</div>
</body></html>`;
  _printViaIframe(html, title);
}

// ─── PDF одной техкарты (из карточки напитка) ───────────────────────
export function mvdDownloadSemiPDF() {
  document.getElementById('mvd-download-menu').classList.remove('open');
  const d = window.DRINKS.find(x => x.id === _mvdId);
  if (!d) return;
  const usedSemis = d.recipe
    .filter(r => r.semi != null)
    .map(r => window.SEMI.find(s => s.id === r.semi))
    .filter(Boolean);
  if (!usedSemis.length) return;
  const org = window.getOrgInfo();
  const pages = usedSemis.map((s, idx) =>
    _buildSemiTechCardBlock(s, org, idx + 1, idx === usedSemis.length - 1)
  ).join('\n');
  _openTechCardsWindow(
    `Техкарты п/ф — ${d.name} (${org.name})`,
    `${usedSemis.length} карт · ${new Date().toLocaleDateString('ru')}`,
    pages,
    400
  );
}

export function mvdDownloadPDF() {
  document.getElementById('mvd-download-menu').classList.remove('open');
  const data = _mvdGetData(); if (!data) return;
  const { d } = data;
  const org = window.getOrgInfo();
  const cardNum = window.DRINKS.findIndex(x => x.id === d.id) + 1;
  const page = _buildTechCardBlock(d, org, cardNum, true);
  _openTechCardsWindow(`Техкарта — ${d.name}`, '', page, 0);
}
export async function mvdDownloadExcel() {
  document.getElementById('mvd-download-menu').classList.remove('open');
  if (!window.ExcelJS) { alert('Библиотека ExcelJS не загрузилась. Проверьте интернет.'); return; }
  const data = _mvdGetData(); if (!data) return;
  const { d, ings, totalCost, price, profit, fc, nut, groupName } = data;
  const today  = new Date().toLocaleDateString('ru');
  const year   = new Date().getFullYear();
  const isCold = d.group === 'cold';
  const cardNum = window.DRINKS.findIndex(x => x.id === d.id) + 1;
  const orgName = window.getOrgInfo().name;[d.id] || {};
  const q = {
    appearance:  d.appearance  || _dq2.appearance  || '',
    taste:       d.taste       || _dq2.taste       || '',
    consistency: d.consistency || _dq2.consistency || '',
    color:       _dq2.color    || ''
  };

  // брутто/нетто/потери из оригинального рецепта
  const recipeRows = d.recipe.filter(r => window.MAT[r.mat]).map(r => {
    const m      = window.MAT[r.mat];
    const loss   = r.loss ? +(r.loss * 100).toFixed(1) : null;
    const brutto = r.loss ? +(r.amt / (1 - r.loss)).toFixed(1) : r.amt;
    const cost   = calcIngCost(r);
    return { name: m.name, unit: m.unit.replace(/^1\s*/,''), brutto, netto: r.amt, loss, cost };
  });


  // ══════════════════════════════════════════════════════════════
  //   ГОСТ Р 53105-2008 — структура идентична PDF-техкарте
  // ══════════════════════════════════════════════════════════════

  // ── цвета (совпадают с PDF) ────────────────────────────────────
  const C_GREEN  = 'FF417033';   // заголовки секций
  const C_LGREEN = 'FFF0F5EE';   // фон .lbl ячеек
  const C_WHITE  = 'FFFFFFFF';
  const C_GREY   = 'FFF5F5F5';
  const C_BORDER = 'FFBBBBBB';

  // ── хелперы ───────────────────────────────────────────────────
  const F = (argb) => ({ type:'pattern', pattern:'solid', fgColor:{ argb } });
  const FONT = (bold=false, size=10, argb='FF222222') => ({ name:'Arial', size, bold, color:{ argb } });
  const BORDER = () => {
    const s = { style:'thin', color:{ argb: C_BORDER } };
    return { top:s, bottom:s, left:s, right:s };
  };
  const AL = (h='left', v='middle', wrap=false) => ({ horizontal:h, vertical:v, wrapText:wrap });

  // ── книга ─────────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook();
  wb.creator = 'MBS Coffee Menu';
  const ws = wb.addWorksheet('Техкарта', {
    pageSetup:{ paperSize:9, orientation:'portrait', fitToPage:true, fitToWidth:1, margins:{ left:0.47, right:0.47, top:0.59, bottom:0.59 } }
  });

  // 6 колонок: A-F
  ws.columns = [
    { key:'A', width:5  },   // №
    { key:'B', width:30 },   // название ингредиента / метка
    { key:'C', width:11 },   // брутто / значение
    { key:'D', width:11 },   // нетто
    { key:'E', width:10 },   // потери / ед.
    { key:'F', width:14 },   // стоимость
  ];

  let R = 1; // текущая строка

  // ── вспомогательные функции построения ────────────────────────
  const cell = (col, r) => ws.getCell(`${col}${r}`);
  const merge = (r1, c1, r2, c2) => ws.mergeCells(r1, c1, r2, c2);

  // Авто-высота строки по длине текста и ширине колонки (символов)
  function autoH(text, colWidthChars, minH = 18) {
    if (!text) return minH;
    const str = String(text);
    // приблизительно: 1 строка = 14px, символ ≈ 1 ед. ширины
    const lines = str.split('\n').reduce((acc, line) => {
      return acc + Math.ceil(line.length / colWidthChars);
    }, 0);
    return Math.max(minH, lines * 15);
  }

  function sectionHeader(label, row) {
    merge(row, 1, row, 6);
    const c = cell('A', row);
    c.value     = label.toUpperCase();
    c.font      = FONT(true, 10, C_WHITE);
    c.fill      = F(C_GREEN);
    c.alignment = AL('left');
    ws.getRow(row).height = 20;
  }

  function infoRow(label, value, row) {
    merge(row, 1, row, 2);
    merge(row, 3, row, 6);
    const lc = cell('A', row);
    lc.value     = label;
    lc.font      = FONT(true, 10);
    lc.fill      = F(C_LGREEN);
    lc.alignment = AL('left', 'middle', true);
    lc.border    = BORDER();
    const vc = cell('C', row);
    vc.value     = value;
    vc.font      = FONT(false, 10);
    vc.fill      = F(C_WHITE);
    vc.alignment = AL('left', 'middle', true);
    vc.border    = BORDER();
    // авто-высота: значение идёт в 4 колонки (C-F), суммарная ширина ~46
    ws.getRow(row).height = autoH(value, 46);
  }

  // ══ БЛОК 1: ШАПКА (фото слева + «Утверждаю» справа) ══════════

  const PHOTO_ROWS = 6; // строки 1-6 отведены под фото / утверждаю

  // «Утверждаю» — колонки D-F, строки 1-4
  merge(1, 4, 1, 6);
  const appr1 = cell('D', 1);
  appr1.value     = `Утверждаю: руководитель ${orgName}`;
  appr1.font      = FONT(true, 10);
  appr1.alignment = AL('left', 'middle', true);
  // высота первой строки под длину названия (ширина D-F ≈ 35 символов)
  ws.getRow(1).height = autoH(`Утверждаю: руководитель ${orgName}`, 33, 22);

  merge(2, 4, 2, 6);
  cell('D', 2).value = '_______________________';
  cell('D', 2).font  = FONT(false, 10, 'FF888888');
  ws.getRow(2).height = 18;

  merge(3, 4, 3, 6);
  cell('D', 3).value = `«__» ____________ ${year} г.`;
  cell('D', 3).font  = FONT(false, 10, 'FF888888');
  ws.getRow(3).height = 18;

  for (let r = 4; r <= PHOTO_ROWS; r++) ws.getRow(r).height = 18;

  // Фото — ячейки A1:C6
  if (d.image) {
    try {
      const raw  = d.image;
      const ext  = raw.startsWith('data:image/png') ? 'png' : 'jpeg';
      const b64  = raw.substring(raw.indexOf(',') + 1);
      const imgId = wb.addImage({ base64: b64, extension: ext });
      ws.addImage(imgId, { tl:{ col:0, row:0 }, br:{ col:2.9, row:PHOTO_ROWS }, editAs:'oneCell' });
    } catch(e) { console.warn('Фото:', e); }
  }

  R = PHOTO_ROWS + 1;

  // ══ БЛОК 2: ЗАГОЛОВОК ════════════════════════════════════════

  merge(R, 1, R, 6);
  const titleC = cell('A', R);
  titleC.value     = `ТЕХНОЛОГИЧЕСКАЯ КАРТА № ${cardNum}`;
  titleC.font      = FONT(true, 14, 'FF222222');
  titleC.alignment = AL('center');
  ws.getRow(R).height = 26;
  R++;

  merge(R, 1, R, 6);
  const gostC = cell('A', R);
  gostC.value     = '(по ГОСТ Р 53105-2008)';
  gostC.font      = FONT(false, 9, 'FF777777');
  gostC.alignment = AL('center');
  ws.getRow(R).height = 16;
  R++;
  R++; // пустая

  // ══ БЛОК 3: ОБЩАЯ ИНФОРМАЦИЯ ══════════════════════════════════

  sectionHeader('Общие сведения', R); R++;
  infoRow('Наименование изделия', d.name, R); R++;
  infoRow('Группа блюд',          groupName, R); R++;
  infoRow('Выход готового блюда', `${d.vol} мл (1 порция)`, R); R++;
  infoRow('Дата составления',     today, R); R++;
  infoRow('Срок реализации',      isCold ? '30 минут с момента приготовления' : '15 минут с момента приготовления', R); R++;
  infoRow('Условия хранения сырья', '+2…+6 °C для молочных продуктов, сухие при +18 °C', R); R++;
  R++; // пустая

  // ══ БЛОК 4: РЕЦЕПТУРА ══════════════════════════════════════════

  sectionHeader('Рецептура', R); R++;

  // заголовок таблицы
  const rHdrs = ['№', 'Сырьё / полуфабрикат', 'Брутто', 'Нетто', 'Потери', 'Стоим., ₽'];
  ['A','B','C','D','E','F'].forEach((col, i) => {
    const c = cell(col, R);
    c.value     = rHdrs[i];
    c.font      = FONT(true, 10, C_WHITE);
    c.fill      = F(C_GREEN);
    c.alignment = AL(i >= 2 ? 'center' : 'left');
    c.border    = BORDER();
  });
  ws.getRow(R).height = 20;
  R++;

  // строки ингредиентов
  recipeRows.forEach((r2, idx) => {
    const bg = idx % 2 === 0 ? C_WHITE : 'FFF7F9F7';
    const vals = [idx+1, r2.name, r2.brutto, r2.netto, r2.loss != null ? `${r2.loss}%` : '—', Math.round(r2.cost)];
    ['A','B','C','D','E','F'].forEach((col, i) => {
      const c = cell(col, R);
      c.value     = vals[i];
      c.font      = FONT(false, 10);
      c.fill      = F(bg);
      c.alignment = AL(i >= 2 ? 'center' : 'left');
      c.border    = BORDER();
    });
    ws.getRow(R).height = 18;
    R++;
  });

  // строка ИТОГО
  merge(R, 1, R, 5);
  const totL = cell('A', R);
  totL.value     = 'ИТОГО';
  totL.font      = FONT(true, 10);
  totL.fill      = F(C_LGREEN);
  totL.alignment = AL('right');
  totL.border    = BORDER();
  const totV = cell('F', R);
  totV.value     = Math.round(totalCost);
  totV.numFmt    = '#,##0" ₽"';
  totV.font      = FONT(true, 10);
  totV.fill      = F(C_LGREEN);
  totV.alignment = AL('center');
  totV.border    = BORDER();
  ws.getRow(R).height = 20;
  R++;
  R++; // пустая

  // ══ БЛОК 5: ЭКОНОМИКА ══════════════════════════════════════════

  const fcColor = fc > 0.3 ? 'FFCC0000' : fc > 0.25 ? 'FF8B6914' : 'FF2D6A4F';
  const ecoRows = [
    ['Себестоимость (ингредиенты)', Math.round(totalCost), false, C_WHITE],
    ['Цена продажи',                Math.round(price),     false, C_WHITE],
    [`FC% (food cost)`,             `${(fc*100).toFixed(1)}%`, false, C_WHITE, true],
    ['Прибыль с порции',            Math.round(profit),    true,  C_LGREEN],
  ];
  ecoRows.forEach(([label, val, bold, bg, isFC]) => {
    merge(R, 1, R, 5);
    const lc = cell('A', R);
    lc.value     = label;
    lc.font      = FONT(bold, 10);
    lc.fill      = F(bg);
    lc.alignment = AL('left');
    lc.border    = BORDER();
    const vc = cell('F', R);
    vc.value     = val;
    vc.font      = FONT(true, 10, isFC ? fcColor : (bold ? 'FF1B4332' : 'FF222222'));
    vc.fill      = F(bg);
    vc.alignment = AL('center');
    vc.border    = BORDER();
    if (!isFC) vc.numFmt = '#,##0" ₽"';
    ws.getRow(R).height = 20;
    R++;
  });
  R++; // пустая

  // ══ БЛОК 6: ТЕХНОЛОГИЯ ══════════════════════════════════════════

  const techText = d.process
    ? d.process
    : d.group === 'hot'
      ? 'В подготовленную чашку приготовить эспрессо (одинарный/двойной согласно рецептуре). Вспенить молоко/сливки до температуры 60–65°C. Соединить компоненты согласно технологии напитка. При необходимости добавить сиропы/добавки. Подавать немедленно при температуре 60–65°C.'
      : d.group === 'tea'
      ? 'Чай: заварить кипятком (95°C) согласно дозировке, настаивать 3–5 минут. Матча: венчиком взбить порошок матча с горячей водой (80°C) до однородной пены, добавить молоко температурой 60°C. Подавать при температуре 60–65°C.'
      : 'Все компоненты предварительно охладить до +4°C. В стакан со льдом (3–4 кубика) последовательно влить ингредиенты согласно рецептуре. Перемешать барной ложкой. Подавать немедленно при температуре +4…+8°C.';

  sectionHeader('Технология приготовления', R); R++;
  merge(R, 1, R, 6);
  const techC = cell('A', R);
  techC.value     = techText;
  techC.font      = FONT(false, 10);
  techC.fill      = F(C_WHITE);
  techC.alignment = AL('left', 'top', true);
  techC.border    = BORDER();
  // полная ширина 6 колонок ≈ 81 символ
  ws.getRow(R).height = autoH(techText, 78, 45);
  R++;
  R++; // пустая

  // ══ БЛОК 7: ПОКАЗАТЕЛИ КАЧЕСТВА ══════════════════════════════

  sectionHeader('Показатели качества и безопасности', R); R++;

  if (q) {
    const qaRows = [
      ['Внешний вид', q.appearance],
      ['Консистенция', q.consistency],
      ['Цвет', q.color],
      ['Вкус и запах', q.taste],
    ];
    qaRows.forEach(([lbl, val]) => {
      merge(R, 1, R, 2);
      merge(R, 3, R, 6);
      const lc = cell('A', R);
      lc.value     = lbl;
      lc.font      = FONT(true, 10);
      lc.fill      = F(C_LGREEN);
      lc.alignment = AL('left', 'middle', true);
      lc.border    = BORDER();
      const vc = cell('C', R);
      vc.value     = val;
      vc.font      = FONT(false, 10);
      vc.fill      = F(C_WHITE);
      vc.alignment = AL('left', 'middle', true);
      vc.border    = BORDER();
      // авто-высота: значение идёт в 4 колонки (C-F), ≈ 46 символов
      ws.getRow(R).height = autoH(val, 46);
      R++;
    });
  } else {
    merge(R, 1, R, 6);
    cell('A', R).value     = 'Показатели не заполнены';
    cell('A', R).font      = FONT(false, 9, 'FF999999');
    cell('A', R).alignment = AL('left');
    ws.getRow(R).height = 16;
    R++;
  }
  R++; // пустая

  // ══ БЛОК 8: ПИЩЕВАЯ ЦЕННОСТЬ ════════════════════════════════

  sectionHeader('Пищевая ценность на порцию', R); R++;

  const nutHdrs = ['Энерг. ценность', '', 'Белки', 'Жиры', 'Углеводы', ''];
  const nutVals = [`${nut.kcal} ккал`, '', `${nut.protein} г`, `${nut.fat} г`, `${nut.carbs} г`, ''];
  ['A','B','C','D','E','F'].forEach((col, i) => {
    const c = cell(col, R);
    c.value     = nutHdrs[i];
    c.font      = FONT(true, 10, C_WHITE);
    c.fill      = F(C_GREEN);
    c.alignment = AL('center');
    c.border    = BORDER();
  });
  ws.mergeCells(R, 1, R, 2);
  ws.getRow(R).height = 18;
  R++;

  ['A','B','C','D','E','F'].forEach((col, i) => {
    const c = cell(col, R);
    c.value     = nutVals[i];
    c.font      = FONT(true, 11);
    c.fill      = F(C_WHITE);
    c.alignment = AL('center');
    c.border    = BORDER();
  });
  ws.mergeCells(R, 1, R, 2);
  ws.getRow(R).height = 22;
  R++;
  R += 2; // пустые

  // ══ БЛОК 9: ПОДПИСИ ══════════════════════════════════════════

  merge(R, 1, R, 3);
  cell('A', R).value     = 'Технолог: ________________________';
  cell('A', R).font      = FONT(false, 9, 'FF888888');
  cell('A', R).alignment = AL('left');

  merge(R, 4, R, 6);
  cell('D', R).value     = 'Зав. производством: ________________________';
  cell('D', R).font      = FONT(false, 9, 'FF888888');
  cell('D', R).alignment = AL('right');
  ws.getRow(R).height = 20;

  // ── Футер авторства ───────────────────────────────────────────
  R += 2;
  merge(R, 1, R, 6);
  const footerC = cell('A', R);
  footerC.value     = 'Московская школа бариста  ·  baristaschool.ru';
  footerC.font      = { name:'Arial', size:8, color:{ argb:'FFBBBBBB' }, italic:true };
  footerC.alignment = AL('right');
  ws.getRow(R).height = 14;

  // ══ Сохранение ═══════════════════════════════════════════════

  const buffer = await wb.xlsx.writeBuffer();
  const blob   = new Blob([buffer], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement('a');
  a.href       = url;
  a.download   = `Техкарта — ${d.name}.xlsx`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

export function exportSingleSemiPDF(idRaw) {
  const s = window.SEMI.find(x => x.id === Number(idRaw));
  if (!s) return;
  const org = window.getOrgInfo();
  const cardNum = window.SEMI.findIndex(x => x.id === s.id) + 1;
  const page = _buildSemiTechCardBlock(s, org, cardNum, true);
  _openTechCardsWindow(
    `Техкарта полуфабриката — ${s.name}`,
    `${org.name} · ${new Date().toLocaleDateString('ru')}`,
    page,
    400
  );
}

export async function exportSingleSemiXLSX(idRaw) {
  if (!window.ExcelJS) { alert('Библиотека ExcelJS не загрузилась.'); return; }
  const s = window.SEMI.find(x => x.id === Number(idRaw));
  if (!s) return;

  const org      = window.getOrgInfo();
  const orgName  = org.name || 'Кофейня';
  const today    = new Date().toLocaleDateString('ru');
  const year     = new Date().getFullYear();
  const cardNum  = window.SEMI.findIndex(x => x.id === s.id) + 1;
  const costPer  = calcSemiCostPerUnit(s);

  // ── хелперы ──────────────────────────────────────────────────
  const C_GREEN  = 'FF417033';
  const C_LGREEN = 'FFF0F5EE';
  const C_WHITE  = 'FFFFFFFF';
  const C_GREY   = 'FFF5F5F5';
  const C_BORDER = 'FFBBBBBB';
  const F    = argb => ({ type:'pattern', pattern:'solid', fgColor:{ argb } });
  const FONT = (bold=false, size=10, argb='FF222222') => ({ name:'Arial', size, bold, color:{ argb } });
  const BD   = () => { const s = { style:'thin', color:{ argb:C_BORDER } }; return { top:s, bottom:s, left:s, right:s }; };
  const AL   = (h='left', v='middle', wrap=false) => ({ horizontal:h, vertical:v, wrapText:wrap });
  function autoH(text, colW, minH=18) {
    if (!text) return minH;
    const lines = String(text).split('\n').reduce((a,l) => a + Math.ceil(l.length/colW), 0);
    return Math.max(minH, lines * 15);
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = 'MBS Coffee Menu';
  const ws = wb.addWorksheet('Техкарта', {
    pageSetup:{ paperSize:9, orientation:'portrait', fitToPage:true, fitToWidth:1,
                margins:{ left:0.47, right:0.47, top:0.59, bottom:0.59 } }
  });
  ws.columns = [
    { key:'A', width:5  },
    { key:'B', width:30 },
    { key:'C', width:11 },
    { key:'D', width:11 },
    { key:'E', width:10 },
    { key:'F', width:14 },
  ];

  let R = 1;
  const cell  = (col, r) => ws.getCell(`${col}${r}`);
  const merge = (r1,c1,r2,c2) => ws.mergeCells(r1,c1,r2,c2);

  function sectionHeader(label, row) {
    merge(row,1,row,6);
    const c = cell('A',row);
    c.value=label.toUpperCase(); c.font=FONT(true,10,C_WHITE); c.fill=F(C_GREEN); c.alignment=AL('left'); ws.getRow(row).height=20;
  }
  function infoRow(label, value, row) {
    merge(row,1,row,2); merge(row,3,row,6);
    const lc=cell('A',row); lc.value=label; lc.font=FONT(true,10); lc.fill=F(C_LGREEN); lc.alignment=AL('left','middle',true); lc.border=BD();
    const vc=cell('C',row); vc.value=value; vc.font=FONT(false,10); vc.fill=F(C_WHITE); vc.alignment=AL('left','middle',true); vc.border=BD();
    ws.getRow(row).height=autoH(value,46);
  }

  // ── шапка «Утверждаю» ────────────────────────────────────────
  merge(1,4,1,6);
  const appr1=cell('D',1); appr1.value=`Утверждаю: ${org.ceoTitle||'Руководитель'} ${org.legalName||orgName}`; appr1.font=FONT(true,10); appr1.alignment=AL('left','middle',true);
  ws.getRow(1).height=autoH(`Утверждаю: ${org.ceoTitle||'Руководитель'} ${org.legalName||orgName}`,33,22);
  merge(2,4,2,6); cell('D',2).value='_______________________'; cell('D',2).font=FONT(false,10,'FF888888'); ws.getRow(2).height=18;
  merge(3,4,3,6); cell('D',3).value=`«__» ____________ ${year} г.`; cell('D',3).font=FONT(false,10,'FF888888'); ws.getRow(3).height=18;
  for (let r=4;r<=6;r++) ws.getRow(r).height=18;

  // Фото
  if (s.image) {
    try {
      const raw=s.image; const ext=raw.startsWith('data:image/png')?'png':'jpeg';
      const b64=raw.substring(raw.indexOf(',')+1);
      const imgId=wb.addImage({ base64:b64, extension:ext });
      ws.addImage(imgId,{ tl:{col:0,row:0}, br:{col:2.9,row:6}, editAs:'oneCell' });
    } catch(e){}
  }
  R=7;

  // ── заголовок ────────────────────────────────────────────────
  merge(R,1,R,6);
  const titleC=cell('A',R); titleC.value=`ТЕХНОЛОГИЧЕСКАЯ КАРТА ПОЛУФАБРИКАТА № ${cardNum}`; titleC.font=FONT(true,14); titleC.alignment=AL('center'); ws.getRow(R).height=26; R++;
  merge(R,1,R,6); cell('A',R).value='(по ГОСТ Р 53105-2008)'; cell('A',R).font=FONT(false,9,'FF777777'); cell('A',R).alignment=AL('center'); ws.getRow(R).height=16; R++;
  R++; // пустая

  // ── общие сведения ────────────────────────────────────────────
  sectionHeader('Общие сведения',R); R++;
  infoRow('Наименование полуфабриката', s.name, R); R++;
  infoRow('Выход готового полуфабриката', `${s.yield} ${s.unit}`, R); R++;
  infoRow('Себестоимость единицы', `${Math.round(costPer)} ₽/${s.unit}`, R); R++;
  infoRow('Дата составления', today, R); R++;
  R++;

  // ── рецептура ────────────────────────────────────────────────
  sectionHeader('Рецептура',R); R++;

  // шапка таблицы ингредиентов
  const hRow=ws.getRow(R);
  ['№','Сырьё','Брутто','Нетто','Потери','Стоимость'].forEach((h,i) => {
    const c=hRow.getCell(i+1); c.value=h; c.font=FONT(true,9,C_WHITE); c.fill=F(C_GREEN);
    c.alignment=AL('center'); c.border=BD();
  });
  hRow.height=18; R++;

  let ingN=0;
  let totalCost=0;
  (s.recipe||[]).forEach(r => {
    if (!window.MAT[r.mat]) return;
    ingN++;
    const m=window.MAT[r.mat];
    const loss=r.loss?+(r.loss*100).toFixed(1):null;
    const brutto=r.loss?+(r.amt/(1-r.loss)).toFixed(3):r.amt;
    let cost=((window.S.prices[r.mat]||window.MAT[r.mat].price)/window.MAT[r.mat].size)*r.amt*_semiUnitFactor(r.mat);
    if (r.loss) cost=cost/(1-r.loss);
    totalCost+=cost;
    const iRow=ws.getRow(R);
    const bg=ingN%2===0?C_GREY:C_WHITE;
    const vals=[ingN, m.name, brutto, r.amt, loss?loss+'%':'—', Math.round(cost)+' ₽'];
    vals.forEach((v,i) => {
      const c=iRow.getCell(i+1); c.value=v; c.font=FONT(false,9); c.fill=F(bg); c.border=BD();
      c.alignment=AL(i===1?'left':'center');
    });
    iRow.height=16; R++;
  });

  // строка итого
  const totRow=ws.getRow(R);
  merge(R,1,R,5);
  const tc=totRow.getCell(1); tc.value='ИТОГО сырья'; tc.font=FONT(true,10); tc.fill=F(C_LGREEN); tc.alignment=AL('right'); tc.border=BD();
  const tc2=totRow.getCell(6); tc2.value=Math.round(totalCost)+' ₽'; tc2.font=FONT(true,10,C_GREEN); tc2.fill=F(C_LGREEN); tc2.alignment=AL('center'); tc2.border=BD();
  totRow.height=18; R++;
  R++;

  // ── технология ────────────────────────────────────────────────
  if (s.process) {
    sectionHeader('Технология приготовления',R); R++;
    merge(R,1,R,6);
    const pc=cell('A',R); pc.value=s.process; pc.font=FONT(false,10); pc.fill=F(C_WHITE); pc.alignment=AL('left','middle',true); pc.border=BD();
    ws.getRow(R).height=autoH(s.process,70,24); R++;
    R++;
  }

  // ── хранение ─────────────────────────────────────────────────
  if (s.storage_temp||s.storage_life) {
    sectionHeader('Условия хранения',R); R++;
    if (s.storage_temp) { infoRow('Температура хранения',s.storage_temp,R); R++; }
    if (s.storage_life) { infoRow('Срок хранения',s.storage_life,R); R++; }
    R++;
  }

  // ── органолептика ─────────────────────────────────────────────
  if (s.appearance||s.taste||s.consistency) {
    sectionHeader('Органолептические показатели',R); R++;
    if (s.appearance)  { infoRow('Внешний вид',s.appearance,R); R++; }
    if (s.taste)       { infoRow('Вкус и запах',s.taste,R); R++; }
    if (s.consistency) { infoRow('Консистенция',s.consistency,R); R++; }
    R++;
  }

  // ── подписи ────────────────────────────────────────────────────
  merge(R,1,R,3); cell('A',R).value='Технолог: ____________________'; cell('A',R).font=FONT(false,9,'FF888888');
  merge(R,4,R,6); cell('D',R).value='Зав. производством: ____________________'; cell('D',R).font=FONT(false,9,'FF888888');
  ws.getRow(R).height=20;

  // ── сохранение ────────────────────────────────────────────────
  const buf  = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href=url; a.download=`Техкарта_${s.name.replace(/[/\\?%*:|"<>]/g,'_')}.xlsx`;
  a.click(); URL.revokeObjectURL(url);
}

export function _buildSemiTechCardBlock(s, org, cardNum, isLast) {
  if (typeof org === 'string') org = { name: org, legalName: org, ceoTitle: 'Руководитель', ceoName: '', address: '' };
  const orgName = org.name || 'Кофейня';
  const today = new Date().toLocaleDateString('ru');
  const year  = new Date().getFullYear();
  const semiCostPer = calcSemiCostPerUnit(s);

  function _semiIngCost(r) {
    if (!window.MAT[r.mat]) return 0;
    let c = ((window.S.prices[r.mat] || window.MAT[r.mat].price) / window.MAT[r.mat].size) * r.amt * _semiUnitFactor(r.mat);
    if (r.loss) c = c / (1 - r.loss);
    return c;
  }

  const semiTotal = (s.recipe||[]).reduce((sum, r) => sum + _semiIngCost(r), 0);

  const recipeRows = (s.recipe||[]).map(r => {
    if (!window.MAT[r.mat]) return '';
    const m      = window.MAT[r.mat];
    const loss   = r.loss ? (r.loss * 100).toFixed(0) + '%' : '—';
    const brutto = r.loss ? (r.amt / (1 - r.loss)).toFixed(3) : r.amt.toString();
    const cost   = _semiIngCost(r);
    return `<tr><td>${m.name}</td><td class="c">${m.unit.replace(/^1\s*/,'')}</td><td class="r">${brutto}</td><td class="r">${r.amt}</td><td class="c">${loss}</td><td class="r">${r.yieldAmt||'—'}</td><td class="r b">${Math.round(cost)} ₽</td></tr>`;
  }).join('');

  const processBlock = s.process
    ? `<h2>Технология приготовления</h2><p class="tech">${s.process.replace(/\n/g,'<br>')}</p>`
    : '';

  const storageBlock = (s.storage_temp || s.storage_life) ? `
  <h2>Условия хранения и реализации</h2>
  <table class="info">
    ${s.storage_temp ? `<tr><td class="lbl">Температура хранения</td><td>${s.storage_temp}</td></tr>` : ''}
    ${s.storage_life ? `<tr><td class="lbl">Срок хранения</td><td>${s.storage_life}</td></tr>` : ''}
  </table>` : '';

  const organoBlock = (s.appearance || s.taste || s.consistency) ? `
  <h2>Органолептические показатели</h2>
  <table class="qa">
    ${s.appearance  ? `<tr><td class="lbl">Внешний вид</td><td>${s.appearance}</td></tr>` : ''}
    ${s.taste       ? `<tr><td class="lbl">Вкус и запах</td><td>${s.taste}</td></tr>` : ''}
    ${s.consistency ? `<tr><td class="lbl">Консистенция</td><td>${s.consistency}</td></tr>` : ''}
  </table>` : '';

  return `<div class="card${isLast ? '' : ' pb'}">
  <div class="card-header-inner">
    <div class="org-block">
      ${org.legalName ? `<div style="font-weight:700;font-size:10pt">${org.legalName}</div>` : ''}
      ${orgName !== org.legalName ? `<div style="font-size:9pt;color:#555">${orgName}</div>` : ''}
      ${org.address ? `<div style="font-size:8.5pt;color:#666">${org.address}</div>` : ''}
    </div>
    <div class="approve">
      <div><b>УТВЕРЖДАЮ:</b></div>
      <div>${org.ceoTitle || 'Руководитель'} ${org.legalName || orgName}</div>
      <div style="margin-top:8px">${org.ceoName || '_______________________'}</div>
      <div style="margin-top:4px;color:#888">(${org.ceoName ? 'подпись' : 'Ф.И.О.'})</div>
      <div style="margin-top:6px">«__» ____________ ${year} г.</div>
    </div>
  </div>
  ${s.image ? `<img src="${s.image}" alt="${s.name}" class="drink-photo" style="display:block;margin:0 auto 8px;width:160px;height:120px;object-fit:cover;border-radius:4px;border:1px solid #ccc" onerror="this.style.display='none'">` : ''}
  <h1>ТЕХНОЛОГИЧЕСКАЯ КАРТА ПОЛУФАБРИКАТА № ${cardNum}</h1>
  <p class="gost">(по ГОСТ Р 53105-2008)</p>
  <table class="info">
    <tr><td class="lbl">Наименование полуфабриката</td><td>${s.name}</td></tr>
    <tr><td class="lbl">Выход готового полуфабриката</td><td>${s.yield} ${s.unit}</td></tr>
    <tr><td class="lbl">Себестоимость единицы</td><td>${Math.round(semiCostPer)} ₽/${s.unit}</td></tr>
    <tr><td class="lbl">Дата составления</td><td>${today}</td></tr>
  </table>
  <h2>Рецептура</h2>
  <table>
    <thead><tr><th>Сырьё</th><th>Ед.</th><th>Брутто</th><th>Нетто</th><th>Потери</th><th>Выход</th><th>Стоимость</th></tr></thead>
    <tbody>${recipeRows}
    <tr class="total"><td colspan="6">ИТОГО сырья</td><td class="r b">${Math.round(semiTotal)} ₽</td></tr>
    </tbody>
  </table>
  ${processBlock}
  ${storageBlock}
  ${organoBlock}
  <div class="sign">
    <span>Технолог: ____________________</span>
    <span>Зав. производством: ____________________</span>
  </div>
</div>`;
}

