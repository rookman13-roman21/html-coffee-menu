// src/ui/misc.js
// Разное: шаблоны, инсайты, сезонность, кандидаты на удаление, PDF-отчёты, onWhatIf

export function openTemplatesModal() {
  const MENU_TEMPLATES = window.MENU_TEMPLATES;
  const grid = document.getElementById('templates-grid');
  grid.innerHTML = Object.entries(MENU_TEMPLATES).map(([id,t]) =>
    `<button class="template-card" onclick="chooseTemplate('${id}')">
      <div class="tpl-icon">${t.icon}</div>
      <div class="tpl-name">${t.name}</div>
      <div class="tpl-desc">${t.desc}</div>
      <div class="tpl-meta">${t.meta}</div>
    </button>`
  ).join('');
  document.getElementById('loc-menu')?.classList.remove('open');
  window.openModal('modal-templates');
  if (window.lucide) lucide.createIcons();
}

export function chooseTemplate(id) {
  const tpl = window.MENU_TEMPLATES[id]; if (!tpl) return;
  window.closeModal('modal-templates');
  window._locModalMode = 'template'; window._locTemplateId = id;
  document.getElementById('modal-loc-title').innerHTML = `<i data-lucide="sparkles" class="icon"></i> Точка по шаблону «${tpl.name}»`;
  document.getElementById('ml-icon').value = tpl.icon;
  document.getElementById('ml-name').value = tpl.name;
  document.getElementById('ml-clone-wrap').style.display = 'none';
  document.getElementById('ml-requisites-wrap').style.display = '';
  window.openModal('modal-loc');
  if (window.lucide) lucide.createIcons();
}

export function applyTemplateData(id) {
  const tpl = window.MENU_TEMPLATES[id]; if (!tpl) return;
  const DRINKS = window.DRINKS;
  const S = window.S;
  if (tpl.keepIds) {
    const keep = new Set(tpl.keepIds);
    for (let i = DRINKS.length - 1; i >= 0; i--) {
      if (!keep.has(DRINKS[i].id)) DRINKS.splice(i, 1);
    }
    Object.keys(S.salePrices).forEach(k => { if (!keep.has(+k)) delete S.salePrices[k]; });
    Object.keys(S.portions).forEach(k => { if (!keep.has(+k)) delete S.portions[k]; });
  }
  if (tpl.priceMul && tpl.priceMul !== 1) {
    DRINKS.forEach(d => {
      const base = S.salePrices[d.id] ?? d.price;
      S.salePrices[d.id] = Math.round(base * tpl.priceMul / 10) * 10;
    });
  }
  if (tpl.portions) {
    DRINKS.forEach(d => {
      if (tpl.portions[d.id] != null) S.portions[d.id] = tpl.portions[d.id];
      else S.portions[d.id] = 5;
    });
  }
  if (tpl.fixedCostsMul && tpl.fixedCostsMul !== 1) {
    S.fixedCosts = S.fixedCosts.map(c => ({...c, value: Math.round(c.value * tpl.fixedCostsMul)}));
  }
}

export function generateInsights(drinks){ return window.generateInsights(drinks); }
export function toggleSeasonality()     { return window.toggleSeasonality(); }
export function openDropCandidates()    { return window.openDropCandidates(); }
export function onWhatIf(v)             { return window.onWhatIf(v); }
export function exportFullPDF()         { return window.exportFullPDF(); }
export function exportMaterialsPDF()    { return window.exportMaterialsPDF(); }
export function buildBEPChart(...args)  { return window.buildBEPChart(...args); }
export function applyPayrollToFixed()   { return window.applyPayrollToFixed(); }
export function onPayrollSetting(key,v) { return window.onPayrollSetting(key, v); }
export function togglePayrollSettings() { return window.togglePayrollSettings(); }
export function toggleFixedHint()       { return window.toggleFixedHint(); }
export function _matDisplayUnit(matKey) { return window._matDisplayUnit(matKey); }
