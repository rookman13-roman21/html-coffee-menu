// src/export/techcards.js
// Экспорт технологических карт (печать через iframe)

export function _techCardCSS() {
  const { _techCardCSS: fn } = window;
  if (fn) return fn();
  return '';
}

export function _buildTechCardBlock(d, org, cardNum, isLast) {
  return window._buildTechCardBlock(d, org, cardNum, isLast);
}

export function _buildSemiTechCardBlock(s, org, cardNum, isLast) {
  return window._buildSemiTechCardBlock(s, org, cardNum, isLast);
}

export function _printViaIframe(html, filename) {
  return window._printViaIframe(html, filename);
}

export function _openTechCardsWindow(title, hint, pages, autoprint) {
  return window._openTechCardsWindow(title, hint, pages, autoprint);
}

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

export function mvdDownloadPDF() {
  return window.mvdDownloadPDF();
}

export function mvdDownloadSemiPDF() {
  return window.mvdDownloadSemiPDF();
}

export function mvdDownloadExcel() {
  return window.mvdDownloadExcel();
}
