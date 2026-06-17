// src/ui/recipe-view.js
// Просмотр карточки напитка (попап рецептуры) + фильтры вкладки Рецептуры

import { openModal, closeModal } from './modals.js';
import { filterAuthorDrinks, isAuthorMode } from '../access/author-layer.js';

// ── Перенесено из public/app.js ──

let _mvsId = null; // id полуфабриката в текущем просмотре

// ── Видео-плеер ──
function _toYouTubeEmbed(url) {
  if (!url) return null;
  // youtu.be/ID или youtube.com/watch?v=ID
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
  if (m) return `https://www.youtube.com/embed/${m[1]}?autoplay=1&playsinline=1`;
  return null;
}

export function openVideoModal(url) {
  // На мобильных YouTube блокирует embedded-iframe верификацией — открываем напрямую
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) {
    window.open(url, '_blank', 'noopener');
    return;
  }
  const embedUrl = _toYouTubeEmbed(url);
  const overlay = document.getElementById('video-modal');
  const iframe  = document.getElementById('video-modal-iframe');
  if (!overlay || !iframe) return;
  if (embedUrl) {
    iframe.src = embedUrl;
    overlay.style.display = 'flex';
    document.addEventListener('keydown', _videoModalEsc);
  } else {
    window.open(url, '_blank', 'noopener');
  }
}

export function closeVideoModal() {
  const overlay = document.getElementById('video-modal');
  const iframe  = document.getElementById('video-modal-iframe');
  if (overlay) overlay.style.display = 'none';
  if (iframe)  iframe.src = '';
  document.removeEventListener('keydown', _videoModalEsc);
}

function _videoModalEsc(e) {
  if (e.key === 'Escape') closeVideoModal();
}

function _html(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function _equipmentList(d) {
  return (d.equipment || [])
    .map(item => typeof item === 'string' ? item : item?.name)
    .filter(Boolean);
}

export function openViewDrink(id) {
  const d = window.DRINKS.find(x => x.id === id && x.custom) || window.DRINKS.find(x => x.id === id);
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
      const dispAmt = factor > 1 ? ing.amt * factor : ing.amt; // кг→г для отображения
      const su = (s.unit || '').toLowerCase();
      const sUnit = (factor === 1000) ? (su.startsWith('г') ? 'г' : 'мл') : s.unit;
      return { name: s.name + ' <span style="font-size:10px;color:var(--muted);border-radius:4px;padding:1px 4px;font-weight:600">п/ф</span>', dispAmt, unit: sUnit, cost: calcIngCost(ing) };
    }
    if (!window.MAT[ing.mat]) return null;
    const dispAmt = ing.amt; // хранится в г/мл, показываем напрямую
    const unit = _matDisplayUnit(ing.mat); // теперь возвращает г/мл
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
  const equipment = _equipmentList(d);
  const equipmentHtml = equipment.length
    ? `<div class="mvd-section"><div class="mvd-section-title"><i data-lucide="wrench" class="icon"></i> Оборудование</div><div class="recipe-equipment-tags">${equipment.map(name => `<span>${_html(name)}</span>`).join('')}</div></div>`
    : '';
  const videoHtml = d.videoUrl
    ? `<button class="recipe-card-video" onclick="openVideoModal('${d.videoUrl}')" style="margin-top:4px"><i data-lucide="play-circle" class="icon"></i> Смотреть видео рецепт</button>`
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
    ${equipmentHtml}
    ${processHtml}
    ${videoHtml}
  `;
  openModal('modal-drink-view');
  if (window.lucide) lucide.createIcons({ nodes: [document.getElementById('modal-drink-view')] });
  const hasSemi = d.recipe.some(r => r.semi != null);
  const _show = (id, v) => { const el = document.getElementById(id); if (el) el.style.display = v ? '' : 'none'; };
  _show('mvd-drink-pdf-btn',     true);
  _show('mvd-drink-xls-btn',     true);
  _show('mvd-semi-pdf-btn',      hasSemi);
  _show('mvd-semi-only-pdf-btn', false);
  _show('mvd-semi-only-xls-btn', false);
  _mvsId = null;
}
export function mvdOpenEdit() {
  if (_mvsId !== null) {
    closeModal('modal-drink-view');
    window.openEditSemi(_mvsId);
  } else if (_mvdId !== null) {
    closeModal('modal-drink-view');
    openEditDrink(_mvdId);
  }
}

export function mvdToggleDownload(e) {
  e.stopPropagation();
  const menu = document.getElementById('mvd-download-menu');
  menu.classList.toggle('open');
  const close = () => { menu.classList.remove('open'); document.removeEventListener('click', close); };
  if (menu.classList.contains('open')) setTimeout(() => document.addEventListener('click', close), 0);
}

export function openViewSemi(id) {
  const s = window.SEMI.find(x => x.id === id);
  if (!s) return;
  _mvsId = id;
  _mvdId = null;
  const MAT   = window.MAT;
  const S     = window.S;
  const { calcSemiCostPerUnit, calcNutrition, rub, rubSemi, _semiUnitFactor } = window;

  const ings = (s.recipe || []).filter(r => MAT[r.mat]).map(r => {
    const m  = MAT[r.mat];
    const sf = _semiUnitFactor(r.mat);
    const dispAmt = +(r.amt * sf).toFixed(1);
    const mu  = (m.unit || '').toLowerCase();
    const unit = mu.includes('кг') ? 'г' : (mu === 'л' || mu.includes(' л')) ? 'мл' : m.unit.replace(/^1\s*/, '');
    let cost = ((S.prices[r.mat] || m.price) / m.size) * r.amt * sf;
    if (r.loss) cost = cost / (1 - r.loss);
    return { name: m.name, dispAmt, unit, cost };
  });

  const totalCost   = ings.reduce((sum, i) => sum + i.cost, 0);
  const costPerUnit = calcSemiCostPerUnit(s);
  const nut = calcNutrition(s);

  const _img = s.image || null;
  const imgHtml = _img
    ? `<div class="mvd-photo-wrap"><img src="${_img}" alt="${s.name}" class="mvd-photo" onerror="this.closest('.mvd-photo-wrap').style.display='none'"></div>`
    : '';

  const ingRows = ings.map(ing => {
    const share = totalCost > 0 ? (ing.cost / totalCost * 100).toFixed(0) : 0;
    return `<div class="recipe-ing">
      <span class="recipe-ing-name">${ing.name}</span>
      <span style="font-size:10px;color:var(--muted);flex-shrink:0">${ing.dispAmt} ${ing.unit}</span>
      <span class="recipe-ing-share">${share}%</span>
      <span class="recipe-ing-cost">${rub(ing.cost)}</span>
    </div>`;
  }).join('');

  const processHtml = s.process
    ? `<div class="mvd-section"><div class="mvd-section-title"><i data-lucide="chef-hat" class="icon"></i> Технология приготовления</div><div class="mvd-process">${s.process.replace(/\n/g,'<br>')}</div></div>`
    : '';

  const storageHtml = (s.storage_temp || s.storage_life)
    ? `<div class="mvd-section"><div class="mvd-section-title"><i data-lucide="thermometer" class="icon"></i> Условия хранения</div>
        <div class="mvd-info-card">
          ${s.storage_temp ? `<div class="mvd-info-row"><span class="mvd-info-label">Температура:</span><span class="mvd-info-value">${s.storage_temp}</span></div>` : ''}
          ${s.storage_life ? `<div class="mvd-info-row"><span class="mvd-info-label">Срок хранения:</span><span class="mvd-info-value">${s.storage_life}</span></div>` : ''}
        </div>
      </div>`
    : '';

  const organoHtml = (s.appearance || s.taste || s.consistency)
    ? [
        s.appearance  ? `<div class="mvd-section"><div class="mvd-section-title"><i data-lucide="eye" class="icon"></i> Внешний вид</div><div class="mvd-info-card"><div class="mvd-info-value">${s.appearance}</div></div></div>` : '',
        s.taste       ? `<div class="mvd-section"><div class="mvd-section-title"><i data-lucide="coffee" class="icon"></i> Вкус и запах</div><div class="mvd-info-card"><div class="mvd-info-value">${s.taste}</div></div></div>` : '',
        s.consistency ? `<div class="mvd-section"><div class="mvd-section-title"><i data-lucide="droplets" class="icon"></i> Консистенция</div><div class="mvd-info-card"><div class="mvd-info-value">${s.consistency}</div></div></div>` : '',
      ].join('')
    : '';

  document.getElementById('mvd-title').textContent = s.name;
  document.getElementById('mvd-content').innerHTML = `
    ${imgHtml}
    <div class="mvd-meta">
      <span class="mvd-meta-group"><i data-lucide="layers" class="icon"></i> Полуфабрикат</span>
      <span class="mvd-meta-vol">Выход: ${s.yield} ${s.unit}</span>
      <span style="font-weight:700;color:var(--green)">${rubSemi(costPerUnit, s.unit)}</span>
    </div>
    <div class="mvd-section">
      <div class="mvd-section-title"><i data-lucide="package" class="icon"></i> Состав</div>
      ${ingRows || '<div style="color:var(--muted);font-size:13px">Нет ингредиентов</div>'}
      <div class="recipe-total"><span>Себестоимость партии</span><span>${rub(totalCost)}</span></div>
      <div class="recipe-total" style="color:var(--navy)"><span>Себестоимость единицы</span><span>${rubSemi(costPerUnit, s.unit)}</span></div>
    </div>
    <div class="mvd-section">
      <div class="mvd-section-title"><i data-lucide="activity" class="icon"></i> КБЖУ (на выход)</div>
      <div class="mvd-nutrition">
        <div class="mvd-nut-item"><span class="mvd-nut-val">${nut.kcal}</span><span class="mvd-nut-lbl">ккал</span></div>
        <div class="mvd-nut-item"><span class="mvd-nut-val">${nut.protein}</span><span class="mvd-nut-lbl">белки, г</span></div>
        <div class="mvd-nut-item"><span class="mvd-nut-val">${nut.fat}</span><span class="mvd-nut-lbl">жиры, г</span></div>
        <div class="mvd-nut-item"><span class="mvd-nut-val">${nut.carbs}</span><span class="mvd-nut-lbl">углеводы, г</span></div>
      </div>
    </div>
    ${processHtml}${storageHtml}${organoHtml}
  `;

  // Управление кнопками скачивания
  const _show = (id, v) => { const el = document.getElementById(id); if (el) el.style.display = v ? '' : 'none'; };
  _show('mvd-drink-pdf-btn',      false);
  _show('mvd-drink-xls-btn',      false);
  _show('mvd-semi-pdf-btn',       false);
  _show('mvd-semi-only-pdf-btn',  true);
  _show('mvd-semi-only-xls-btn',  true);

  openModal('modal-drink-view');
  if (window.lucide) lucide.createIcons({ nodes: [document.getElementById('modal-drink-view')] });
}

export function mvdSemiDownloadPDF() {
  document.getElementById('mvd-download-menu').classList.remove('open');
  if (_mvsId !== null) window.exportSingleSemiPDF(_mvsId);
}

export function mvdSemiDownloadXLSX() {
  document.getElementById('mvd-download-menu').classList.remove('open');
  if (_mvsId !== null) window.exportSingleSemiXLSX(_mvsId);
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

  const authorMode = isAuthorMode();
  const authorBaseList = filterAuthorDrinks(DRINKS).filter(d => !d._hidden);
  let list = authorBaseList.filter(d => {
    if (d._hidden) return false;
    if (recipeGroup !== 'all' && d.group !== recipeGroup) return false;
    const displayName = d._serverName || d.name;
    if (recipeSearch && !displayName.toLowerCase().includes(recipeSearch.toLowerCase())) return false;
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
          const dispAmt = factor > 1 ? ing.amt * factor : ing.amt; // кг→г
          const su = (s.unit || '').toLowerCase();
          const unit = (factor === 1000) ? (su.startsWith('г') ? 'г' : 'мл') : s.unit;
          return {
            name: s.name + ' <span style="font-size:9px;color:var(--muted);border-radius:3px;padding:1px 3px;font-weight:600">п/ф</span>',
            dispAmt, unit, cost: window.calcIngCost(ing)
          };
        }
          const dispAmt = ing.amt; // хранится в г/мл
          const unit = window._matDisplayUnit(ing.mat); // теперь возвращает г/мл
        return { name: MAT[ing.mat].name, dispAmt, unit, cost: window.calcIngCost(ing) };
      });
    const totalCost = ings.reduce((s, i) => s + i.cost, 0);
    const price = d._serverPrice != null ? d._serverPrice : (S.salePrices[d.id] || 0);
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
    const videoIconHtml = d.videoUrl
      ? `<a class="recipe-card-video-icon" href="${d.videoUrl}" target="_blank" rel="noopener" onclick="event.stopPropagation()" title="Смотреть видео рецепт"><i data-lucide="play-circle" class="icon"></i></a>`
      : '';
    const equipment = _equipmentList(d);
    const equipmentHtml = equipment.length
      ? `<div class="recipe-equipment-line"><i data-lucide="wrench" class="icon"></i><span>${equipment.slice(0, 3).map(_html).join(', ')}${equipment.length > 3 ? ` +${equipment.length - 3}` : ''}</span></div>`
      : '';
    const pub = window.authorPublicationForDrink ? window.authorPublicationForDrink(d.id) : null;
    const pubLabel = pub
      ? (pub.status === 'published' ? 'Опубликован' : pub.status === 'rejected' ? 'На доработке' : 'На проверке')
      : 'На витрину';
    const authorBtn = (window.authorCanPublish && window.authorCanPublish())
      ? `<button class="recipe-publish-btn ${pub ? 'has-status' : ''}" onclick="event.stopPropagation();submitRecipeForPublication(${d.id})" title="Отправить на модерацию">${pubLabel}</button>`
      : '';
    return `<div class="recipe-card" onclick="openViewDrink(${d.id})">
      ${imgHtml}
      <div class="recipe-card-title" style="margin-top:${d.image ? '10px' : '0'}">
        <span>${d._serverName || d.name}</span>
        <div style="display:flex;align-items:center;gap:6px">${videoIconHtml}${resetBtn}</div>
      </div>
      <div class="recipe-card-sub">
        <span>${d.vol} мл</span>
        <span>·</span>
        <span style="color:${fcClr};font-weight:700">FC ${window.pct(fc)}</span>
      </div>
      ${equipmentHtml}
      <div class="recipe-ings">${ingRows}</div>
      <div class="recipe-total"><span>Себестоимость</span><span>${window.rub(totalCost)}</span></div>
      <div class="recipe-total" style="font-weight:400;font-size:12px;color:var(--muted)"><span>Цена продажи</span><span>${window.rub(price)}</span></div>
      <div class="recipe-total" style="color:var(--navy)"><span>Прибыль</span><span>${window.rub(price - totalCost)}</span></div>
      ${authorBtn}
    </div>`;
  }

  let html = '';
  if (!list.length && authorMode && !authorBaseList.length) {
    html = `
      <div class="author-recipe-empty-card">
        <div class="author-recipe-empty-icon"><i data-lucide="sparkles" class="icon"></i></div>
        <div>
          <h3>Создайте первый авторский рецепт</h3>
          <p>Добавьте напиток, заполните состав, процесс приготовления и подготовьте рецепт к публикации на витрину.</p>
          <button class="btn btn-green" onclick="openAddDrink()"><i data-lucide="plus" class="icon"></i> Создать рецепт</button>
        </div>
      </div>
    `;
  } else if (!list.length) {
    html = `<p style="padding:32px;text-align:center;color:var(--muted)">Ничего не найдено — измените поиск или фильтр</p>`;
  } else if (useGroups) {
    ['hot', 'tea', 'cold', 'filter', 'author'].forEach(grp => {
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

let _mmvKey = null;

export function openViewMat(key) {
  const MAT  = window.MAT;
  const S    = window.S;
  const m = MAT[key];
  if (!m) return;
  _mmvKey = key;

  const { MAT_NUTRITION, MAT_CATEGORIES } = window;
  const _rawUnit = (m.unit || '').toLowerCase();
  const baseNutr = (MAT_NUTRITION || {})[key];
  const n = m.nutrition || baseNutr || {};
  const price = S.prices[key] ?? m.price ?? 0;
  const sup = (S.suppliers || {})[key];
  const catLabel = ((MAT_CATEGORIES || {})[m.category || 'other'] || {}).label || m.category || '';

  const nutHtml = (n.kcal || n.protein || n.fat || n.carbs)
    ? `<div class="mvd-section">
        <div class="mvd-section-title"><i data-lucide="activity" class="icon"></i> КБЖУ на 100 г/мл</div>
        <div class="mvd-nutrition">
          <div class="mvd-nut-item"><span class="mvd-nut-val">${n.kcal||0}</span><span class="mvd-nut-lbl">ккал</span></div>
          <div class="mvd-nut-item"><span class="mvd-nut-val">${n.protein||0}</span><span class="mvd-nut-lbl">белки, г</span></div>
          <div class="mvd-nut-item"><span class="mvd-nut-val">${n.fat||0}</span><span class="mvd-nut-lbl">жиры, г</span></div>
          <div class="mvd-nut-item"><span class="mvd-nut-val">${n.carbs||0}</span><span class="mvd-nut-lbl">углев., г</span></div>
        </div>
      </div>` : '';

  const supHtml = sup
    ? `<div class="mvd-section">
        <div class="mvd-section-title"><i data-lucide="truck" class="icon"></i> Поставщик</div>
        <div class="mvd-info-card">
          ${sup.name  ? `<div class="mvd-info-row"><span class="mvd-info-label">Название:</span><span class="mvd-info-value">${sup.name}</span></div>` : ''}
          ${sup.phone ? `<div class="mvd-info-row"><span class="mvd-info-label">Телефон:</span><span class="mvd-info-value"><a href="tel:${sup.phone}" style="color:inherit;text-decoration:none">${sup.phone}</a></span></div>` : ''}
          ${sup.note  ? `<div class="mvd-info-row"><span class="mvd-info-label">Заметка:</span><span class="mvd-info-value">${sup.note}</span></div>` : ''}
          ${sup.site  ? `<div class="mvd-info-row"><span class="mvd-info-label">Сайт:</span><span class="mvd-info-value"><a href="${sup.site}" target="_blank" rel="noopener" style="color:var(--green)">${sup.site.replace(/^https?:\/\//, '')}</a></span></div>` : ''}
        </div>
      </div>` : '';

  const _sizeUnit = _rawUnit.includes('кг') ? 'г' : (_rawUnit.includes(' л') || _rawUnit === 'л') ? 'мл' : m.unit.replace(/^1\s*/, '');
  const pricePerUnit = price > 0 && m.size > 0 ? (price / m.size).toFixed(3) : '—';

  const purchaseHtml = m.purchaseUrl
    ? `<a href="${m.purchaseUrl}" target="_blank" rel="noopener" class="mvd-purchase-btn"><i data-lucide="external-link" class="icon"></i> Открыть страницу покупки</a>`
    : '';

  const usageMap = window._matUsageMap || {};
  const usedIn = usageMap[key] || [];
  const usageHtml = usedIn.length
    ? `<div class="mvd-section"><div class="mvd-section-title"><i data-lucide="bar-chart-2" class="icon"></i> Используется в рецептурах</div><div style="display:flex;flex-wrap:wrap;gap:6px">${usedIn.map(name => `<span class="sup-mat-tag">${name}</span>`).join('')}</div></div>`
    : '';

  document.getElementById('mmv-title').textContent = m.name;
  document.getElementById('mmv-content').innerHTML = `
    <div class="mvd-section">
      <div class="mvd-section-title"><i data-lucide="package" class="icon"></i> Основные данные</div>
      <div class="mvd-info-card">
        <div class="mvd-info-row"><span class="mvd-info-label">Категория:</span><span class="mvd-info-value">${catLabel}</span></div>
        <div class="mvd-info-row"><span class="mvd-info-label">Единица закупки:</span><span class="mvd-info-value">${m.unit} (${m.size} ${_sizeUnit})</span></div>
        <div class="mvd-info-row" style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border,#e8e8e8)">
          <span class="mvd-info-label">Цена за единицу:</span>
          <span class="mvd-info-value" style="font-size:17px;font-weight:700;color:var(--green)">${price} ₽</span>
        </div>
      </div>
      ${purchaseHtml}
    </div>
    ${nutHtml}
    ${supHtml}
    ${usageHtml}
  `;
  openModal('modal-mat-view');
  if (window.lucide) lucide.createIcons({ nodes: [document.getElementById('mmv-content')] });
}

export function mmvOpenEdit() {
  if (_mmvKey === null) return;
  const key = _mmvKey;
  closeModal('modal-mat-view');
  window.openEditMat(key);
}
