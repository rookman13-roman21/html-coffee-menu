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

export function generateInsights(drinks) {
  const S = window.S;
  const { avgFC } = window.avgMetrics(drinks);
  const out = [];
  if (!drinks.length) return out;
  const riskCnt = drinks.filter(d => d.fc > 0.30).length;
  const aCnt    = drinks.filter(d => d.abc==='A').length;
  const cCnt    = drinks.filter(d => d.abc==='C').length;
  const worst   = [...drinks].sort((a,b)=>b.fc-a.fc)[0];
  const totalPort = Object.values(S.portions).reduce((s,v)=>s+v, 0);
  const pct = window.pct;

  if (avgFC <= 0.25) {
    out.push({ level:'good', icon:'✅', title:`Средний FC ${pct(avgFC)} — отлично`,
      text:'Ваш средний фуд-кост ниже бенчмарка отрасли (25–30%). Маржа стабильно высокая.' });
  } else if (avgFC <= 0.30) {
    out.push({ level:'good', icon:'👌', title:`Средний FC ${pct(avgFC)} — норма`,
      text:'Бенчмарк отрасли — 25–30%. Вы в рынке. Можно оптимизировать топ-3 худших позиций.' });
  } else if (avgFC <= 0.35) {
    out.push({ level:'warn', icon:'⚠️', title:`Средний FC ${pct(avgFC)} — выше нормы`,
      text:'Бенчмарк 25–30%. Поднимите цены на класс A или пересмотрите рецептуры дорогих позиций.' });
  } else {
    out.push({ level:'danger', icon:'🚨', title:`Средний FC ${pct(avgFC)} — критично`,
      text:'Маржа сжата. Срочно нужен пересмотр цен сырья (закупка) или цен продажи.' });
  }

  const aShare = aCnt / drinks.length;
  if (aShare >= 0.18 && aShare <= 0.25) {
    out.push({ level:'good', icon:'⭐', title:`Класс A: ${aCnt} напитков (${(aShare*100).toFixed(0)}%)`,
      text:'Здоровое распределение. Топ-20% генерируют основную прибыль — сфокусируйте маркетинг на них.' });
  }

  if (riskCnt > 0) {
    out.push({ level: riskCnt >= drinks.length * 0.3 ? 'danger' : 'warn',
      icon:'🔴', title:`${riskCnt} напитков с FC > 30%`,
      text:`Эти позиции «съедают» маржу. Хуже всех: «${worst.name}» (${pct(worst.fc)}). Поднимите цену или удешевите рецепт.` });
  }

  if (cCnt >= drinks.length * 0.55) {
    out.push({ level:'warn', icon:'🪫', title:`Класс C: ${cCnt} напитков`,
      text:'Слишком большой «хвост» неприбыльных позиций. Подумайте об удалении 2–3 самых слабых для упрощения меню.' });
  }

  if (totalPort === 0) {
    out.push({ level:'warn', icon:'📋', title:'План продаж не заполнен',
      text:'Зайдите во вкладку «План продаж» и укажите ожидаемые порции по каждому напитку — расчёты BEP оживут.' });
  } else {
    const bep = window.bepCalc(drinks);
    const ratio = totalPort / (bep.cupsDay || 1);
    if (ratio < 1) {
      out.push({ level:'warn', icon:'⚖️', title:`До BEP не хватает ${bep.cupsDay - totalPort} чашек/день`,
        text:`План: ${totalPort} ч/д. Точка безубыточности: ${bep.cupsDay} ч/д. Нужен либо рост трафика, либо повышение чека.` });
    } else if (ratio >= 1.5) {
      out.push({ level:'good', icon:'🚀', title:`План в ${ratio.toFixed(1)}× выше BEP`,
        text:`Текущий план продаж покрывает точку безубыточности с большим запасом — отличная финансовая устойчивость.` });
    } else {
      out.push({ level:'good', icon:'✅', title:`План на ${((ratio-1)*100).toFixed(0)}% выше BEP`,
        text:`Точка безубыточности перекрыта. Запас прочности есть, но небольшой.` });
    }
  }

  return out;
}
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
