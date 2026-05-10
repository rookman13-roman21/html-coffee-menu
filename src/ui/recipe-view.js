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

// ── Инициализация состояния фильтров рецептур ──
if (window.recipeSort   === undefined) window.recipeSort   = 'group';
if (window.recipeGroup  === undefined) window.recipeGroup  = 'all';
if (window.recipeSearch === undefined) window.recipeSearch = '';

export function setRecipeSort(v) {
  window.recipeSort = v;
  filterRecipes();
}
export function setRecipeGroup(v) {
  window.recipeGroup = v;
  filterRecipes();
}
export function filterRecipes(val) {
  if (val !== undefined) window.recipeSearch = val;
  const S = window.S;
  const DRINKS = window.DRINKS;
  const MAT = window.MAT;
  const SEMI = window.SEMI;
  const recipeSort   = window.recipeSort;
  const recipeGroup  = window.recipeGroup;
  const recipeSearch = window.recipeSearch;

  const enriched = window.enrich();
  const abcMap = {}; const abcTipMap = {};
  window.withABC(enriched).forEach(d => { abcMap[d.id] = d.abc; abcTipMap[d.id] = d.abcTip; });

  let list = DRINKS.filter(d => {
    if (recipeGroup !== 'all' && d.group !== recipeGroup) return false;
    if (recipeSearch && !d.name.toLowerCase().includes(recipeSearch.toLowerCase())) return false;
    return true;
  });

  if (recipeSort === 'name') {
    list = list.slice().sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  } else if (recipeSort === 'fc') {
    list = list.slice().sort((a, b) => {
      const fa = window.calcCost(a) / (S.salePrices[a.id] || 1);
      const fb = window.calcCost(b) / (S.salePrices[b.id] || 1);
      return fb - fa;
    });
  } else if (recipeSort === 'profit') {
    list = list.slice().sort((a, b) => {
      const pa = (S.salePrices[a.id] || 0) - window.calcCost(a);
      const pb = (S.salePrices[b.id] || 0) - window.calcCost(b);
      return pb - pa;
    });
  }

  const useGroups = recipeSort === 'group' && recipeGroup === 'all';

  function buildCard(d) {
    const ings = d.recipe
      .filter(ing => (ing.semi != null ? SEMI.find(x => x.id === ing.semi) : MAT[ing.mat]))
      .map(ing => {
        if (ing.semi != null) {
          const s = SEMI.find(x => x.id === ing.semi);
          const factor = window._semiDrinkFactor(s);
          const dispAmt = ing.amt;
          const su = (s.unit || '').toLowerCase();
          const unit = (factor === 1000) ? (su.startsWith('г') ? 'кг' : 'л') : s.unit;
          return {
            name: s.name + ' <span style="font-size:9px;background:#e8f5e9;color:var(--green);border-radius:3px;padding:1px 3px;font-weight:700">п/ф</span>',
            dispAmt, unit, cost: window.calcIngCost(ing)
          };
        }
        const factor = window._semiUnitFactor(ing.mat);
        const dispAmt = parseFloat((ing.amt / factor).toPrecision(4));
        const unit = window._matDisplayUnit(ing.mat);
        return { name: MAT[ing.mat].name, dispAmt, unit, cost: window.calcIngCost(ing) };
      });
    const totalCost = ings.reduce((s, i) => s + i.cost, 0);
    const price = S.salePrices[d.id];
    const fc = price > 0 ? totalCost / price : 0;
    const ingRows = ings.map(ing => {
      const share = totalCost > 0 ? (ing.cost / totalCost * 100).toFixed(0) : 0;
      return `<div class="recipe-ing">
        <span class="recipe-ing-name">${ing.name}</span>
        <span style="font-size:10px;color:var(--muted);flex-shrink:0">${ing.dispAmt} ${ing.unit}</span>
        <span class="recipe-ing-share">${share}%</span>
        <span class="recipe-ing-cost">${window.rub(ing.cost)}</span>
      </div>`;
    }).join('');
    const fcClr = fc <= 0.25 ? 'var(--green)' : fc <= 0.30 ? '#b38600' : 'var(--red)';
    const resetBtn = d.modified
      ? `<button class="btn btn-outline" style="padding:2px 8px;font-size:11px;color:var(--muted)" onclick="event.stopPropagation();resetDrink(${d.id})" title="Вернуть к исходному"><i data-lucide="rotate-ccw" class="icon"></i></button>`
      : '';
    const _img = window.getDrinkImage(d);
    const imgHtml = _img
      ? `<div class="recipe-card-img"><img src="${_img}" alt="${d.name}" onerror="this.closest('.recipe-card-img').style.display='none'"></div>`
      : '';
    const processHtml = d.process
      ? `<div class="recipe-card-process-wrap">
          <button class="recipe-card-process-toggle" onclick="event.stopPropagation();this.closest('.recipe-card-process-wrap').classList.toggle('open')">
            <i data-lucide="chevron-down" class="icon"></i> Процесс приготовления
          </button>
          <div class="recipe-card-process-body">${d.process.replace(/\n/g, '<br>')}</div>
        </div>`
      : '';
    const videoHtml = d.videoUrl
      ? `<a class="recipe-card-video" href="${d.videoUrl}" target="_blank" rel="noopener" onclick="event.stopPropagation()"><i data-lucide="play-circle" class="icon"></i> Смотреть видео рецепт</a>`
      : '';
    return `<div class="recipe-card" onclick="openViewDrink(${d.id})">
      ${imgHtml}
      <div class="recipe-card-title" style="margin-top:${d.image ? '10px' : '0'}">
        <span>${d.name}</span>
        <div style="display:flex;align-items:center;gap:6px">${window.abcBadge(abcMap[d.id] || 'C', abcTipMap[d.id] || '')}${resetBtn}</div>
      </div>
      <div class="recipe-card-sub">
        <span>${d.vol} мл</span>
        <span>·</span>
        <span style="color:${fcClr};font-weight:700">FC ${window.pct(fc)}</span>
      </div>
      ${ingRows}
      <div class="recipe-total"><span>Себестоимость</span><span>${window.rub(totalCost)}</span></div>
      <div class="recipe-total" style="font-weight:400;font-size:12px;color:var(--muted)"><span>Цена продажи</span><span>${window.rub(price)}</span></div>
      <div class="recipe-total" style="color:var(--navy)"><span>Прибыль</span><span>${window.rub(price - totalCost)}</span></div>
      ${processHtml}
      ${videoHtml}
    </div>`;
  }

  let html = '';
  if (!list.length) {
    html = `<p style="padding:32px;text-align:center;color:var(--muted)">Ничего не найдено — измените поиск или фильтр</p>`;
  } else if (useGroups) {
    ['hot', 'tea', 'cold', 'filter'].forEach(grp => {
      const grpList = list.filter(d => d.group === grp);
      if (!grpList.length) return;
      html += `<div class="recipe-group-title">${window.GROUP_LABEL[grp]}</div>`;
      html += `<div class="recipe-grid">${grpList.map(buildCard).join('')}</div>`;
    });
  } else {
    html = `<div class="recipe-grid">${list.map(buildCard).join('')}</div>`;
  }

  const container = document.querySelector('#tab-recipes .recipe-groups');
  if (container) {
    container.innerHTML = html;
    container.classList.remove('recipe-animate');
    // eslint-disable-next-line no-unused-expressions
    container.offsetWidth; // force reflow
    container.classList.add('recipe-animate');
  }

  // Обновляем классы активных кнопок фильтра и сортировки
  document.querySelectorAll('#tab-recipes .recipe-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.grp === recipeGroup);
  });
  document.querySelectorAll('#tab-recipes .recipe-sort-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.srt === recipeSort);
  });

  if (window.lucide) lucide.createIcons({ nodes: [document.querySelector('#tab-recipes .recipe-groups')] });
}

export function toggleRecipesIntro() {
  const el = document.getElementById('recipes-intro');
  if (!el) return;
  el.classList.toggle('open');
  const isOpen = el.classList.contains('open');
  ['recipes-intro-btn', 'recipes-intro-btn-hdr'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.classList.toggle('active', isOpen);
  });
}
export function toggleSupIntro() {
  const el = document.getElementById('sup-intro');
  if (!el) return;
  el.classList.toggle('open');
  const btn = document.getElementById('sup-intro-btn');
  if (btn) btn.classList.toggle('active', el.classList.contains('open'));
}
export function toggleSalesIntro() {
  const el = document.getElementById('sales-intro');
  if (!el) return;
  el.classList.toggle('open');
  const btn = document.getElementById('sales-intro-btn');
  if (btn) btn.classList.toggle('active', el.classList.contains('open'));
}
export function toggleFinIntro() {
  const el = document.getElementById('fin-intro');
  if (!el) return;
  el.classList.toggle('open');
  const btn = document.getElementById('fin-intro-btn');
  if (btn) btn.classList.toggle('active', el.classList.contains('open'));
}


