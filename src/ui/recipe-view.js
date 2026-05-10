// src/ui/recipe-view.js
// Просмотр карточки напитка (попап рецептуры) + фильтры вкладки Рецептуры

// ── Перенесено из public/app.js ──

export function openViewDrink(id) {
  const d = window.DRINKS.find(x => x.id === id);
  if (!d) return;
  _mvdId = id;
  const enriched = window.enrich();
  const abcMap = {}; const abcTipMap = {};
  window.withABC(enriched).forEach(x => { abcMap[x.id] = x.abc; abcTipMap[x.id] = x.abcTip; });
  const ings = d.recipe.map(ing => {
    if (ing.semi != null) {
      const s = window.SEMI.find(x => x.id === ing.semi);
      if (!s) return null;
      const factor = _semiDrinkFactor(s);
      const dispAmt = ing.amt; // хранится в кг/л — показываем как есть
      const su = (s.unit || '').toLowerCase();
      const sUnit = (factor === 1000) ? (su.startsWith('г') ? 'кг' : 'л') : s.unit;
      return { name: s.name + ' <span style="font-size:10px;background:#e8f5e9;color:var(--green);border-radius:4px;padding:1px 4px;font-weight:700">п/ф</span>', dispAmt, unit: sUnit, cost: calcIngCost(ing) };
    }
    if (!window.MAT[ing.mat]) return null;
    const factor = _semiUnitFactor(ing.mat);
    const dispAmt = parseFloat((ing.amt / factor).toPrecision(4));
    const unit = _matDisplayUnit(ing.mat);
    return { name: window.MAT[ing.mat].name, dispAmt, unit, cost: calcIngCost(ing) };
  }).filter(Boolean);
  const totalCost = ings.reduce((s,i) => s + i.cost, 0);
  const price = window.S.salePrices[d.id] || 0;
  const fc = price > 0 ? totalCost / price : 0;
  const fcClr = fc <= 0.25 ? 'var(--green)' : fc <= 0.30 ? '#b38600' : 'var(--red)';
  const nut = calcNutrition(d);
  const GROUP_ICONS = { hot:'coffee', tea:'leaf', cold:'snowflake', filter:'filter' };
  const _img = getDrinkImage(d);
  const imgHtml = _img
    ? `<div class="mvd-photo-wrap"><img src="${_img}" alt="${d.name}" class="mvd-photo" onerror="this.closest('.mvd-photo-wrap').style.display='none'"></div>`
    : '';
  const ingRows = ings.map(ing => {
    const share = totalCost > 0 ? (ing.cost / totalCost * 100).toFixed(0) : 0;
    return `<div class="recipe-ing">
      <span class="recipe-ing-name">${ing.name}</span>
      <span style="font-size:10px;color:var(--muted);flex-shrink:0">${ing.dispAmt} ${ing.unit}</span>
      <span class="recipe-ing-share">${share}%</span>
      <span class="recipe-ing-cost">${rub(ing.cost)}</span>
    </div>`;
  }).join('');
  const processHtml = d.process
    ? `<div class="mvd-section"><div class="mvd-section-title"><i data-lucide="chef-hat" class="icon"></i> Процесс приготовления</div><div class="mvd-process">${d.process.replace(/\n/g,'<br>')}</div></div>`
    : '';
  const videoHtml = d.videoUrl
    ? `<a class="recipe-card-video" href="${d.videoUrl}" target="_blank" rel="noopener" style="margin-top:4px;display:inline-flex"><i data-lucide="play-circle" class="icon"></i> Смотреть видео рецепт</a>`
    : '';
  document.getElementById('mvd-title').textContent = d.name;
  document.getElementById('mvd-content').innerHTML = `
    ${imgHtml}
    <div class="mvd-meta">
      <span class="mvd-meta-group">${GROUP_LABEL[d.group]||d.group}</span>
      <span class="mvd-meta-vol">${d.vol} мл</span>
      <span style="font-weight:700;color:${fcClr}">FC ${pct(fc)}</span>
      ${abcBadge(abcMap[id]||'C', abcTipMap[id]||'')}
    </div>
    <div class="mvd-section">
      <div class="mvd-section-title"><i data-lucide="package" class="icon"></i> Состав</div>
      ${ingRows}
      <div class="recipe-total"><span>Себестоимость</span><span>${rub(totalCost)}</span></div>
      <div class="recipe-total" style="font-weight:400;font-size:12px;color:var(--muted)"><span>Цена продажи</span><span>${rub(price)}</span></div>
      <div class="recipe-total" style="color:var(--navy)"><span>Прибыль</span><span>${rub(price - totalCost)}</span></div>
    </div>
    <div class="mvd-section">
      <div class="mvd-section-title"><i data-lucide="activity" class="icon"></i> КБЖУ на порцию</div>
      <div class="mvd-nutrition">
        <div class="mvd-nut-item"><span class="mvd-nut-val">${nut.kcal}</span><span class="mvd-nut-lbl">ккал</span></div>
        <div class="mvd-nut-item"><span class="mvd-nut-val">${nut.protein}</span><span class="mvd-nut-lbl">белки, г</span></div>
        <div class="mvd-nut-item"><span class="mvd-nut-val">${nut.fat}</span><span class="mvd-nut-lbl">жиры, г</span></div>
        <div class="mvd-nut-item"><span class="mvd-nut-val">${nut.carbs}</span><span class="mvd-nut-lbl">углеводы, г</span></div>
      </div>
    </div>
    ${processHtml}
    ${videoHtml}
  `;
  openModal('modal-drink-view');
  if (window.lucide) lucide.createIcons({ nodes: [document.getElementById('modal-drink-view')] });
  const hasSemi = d.recipe.some(r => r.semi != null);
  const semiBtn = document.getElementById('mvd-semi-pdf-btn');
  if (semiBtn) semiBtn.style.display = hasSemi ? '' : 'none';
}
export function mvdOpenEdit() {
  closeModal('modal-drink-view');
  if (_mvdId !== null) openEditDrink(_mvdId);
}

export function mvdToggleDownload(e) {
  e.stopPropagation();
  const menu = document.getElementById('mvd-download-menu');
  menu.classList.toggle('open');
  const close = () => { menu.classList.remove('open'); document.removeEventListener('click', close); };
  if (menu.classList.contains('open')) setTimeout(() => document.addEventListener('click', close), 0);
}

export function _mvdGetData() {
  const d = window.DRINKS.find(x => x.id === _mvdId);
  if (!d) return null;
  const ings = d.recipe.filter(ing => window.MAT[ing.mat]).map(ing => ({
    name: window.MAT[ing.mat].name,
    amt:  ing.amt,
    unit: window.MAT[ing.mat].unit,
    cost: calcIngCost(ing),
    loss: ing.loss || 0
  }));
  const totalCost = ings.reduce((s, i) => s + i.cost, 0);
  const price     = window.S.salePrices[d.id] || 0;
  const profit    = price - totalCost;
  const fc        = price > 0 ? totalCost / price : 0;
  const nut       = calcNutrition(d);
  const GROUP_NAMES = { hot: 'Горячие кофейные', tea: 'Чай и матча', cold: 'Холодные напитки', filter: 'Фильтр-кофе' };
  return { d, ings, totalCost, price, profit, fc, nut, groupName: GROUP_NAMES[d.group] || d.group };
}

export function setRecipeSort(v)      { return window.setRecipeSort(v); }
export function setRecipeGroup(v)     { return window.setRecipeGroup(v); }
export function filterRecipes()       { return window.filterRecipes(); }
export function toggleRecipesIntro()  { return window.toggleRecipesIntro(); }
export function toggleSupIntro()      { return window.toggleSupIntro(); }
export function toggleSalesIntro()    { return window.toggleSalesIntro(); }
export function toggleFinIntro()      { return window.toggleFinIntro(); }


