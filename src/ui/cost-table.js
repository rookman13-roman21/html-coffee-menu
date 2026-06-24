// src/ui/cost-table.js
// UI-хелперы вкладки себестоимости: категории сырья, поставщики, usage-попап


// ── Перенесено из public/app.js ──

// Переменные состояния (объявлены в app.js, используются здесь через closure)
let _fceIdx = -1;
let _fceIsNew = false;

// Множество открытых категорий постоянных расходов.
// Обновляется в toggleFcCat — единственном месте, где они открываются/закрываются.
const _fcOpenCats = new Set();

// Перерисовывает финмодель, сохраняя открытые категории постоянных расходов.
// После initFcOpenCatsKeeper() window.renderFinModel уже является keeper-обёрткой,
// которая сама восстанавливает _fcOpenCats — простой вызов достаточен.
function _rerenderFinModelKeepFC() {
  window.renderFinModel();
}

// Оборачивает window.renderFinModel один раз при инициализации,
// чтобы ЛЮБОЙ вызов renderFinModel() (из payroll, misc, updaters) сохранял
// открытые категории постоянных расходов.
export function initFcOpenCatsKeeper() {
  const _orig = window.renderFinModel;
  if (!_orig || _orig._fcKeeper) return; // не оборачивать повторно
  window.renderFinModel = function() {
    const open = new Set(_fcOpenCats);
    _orig.apply(this, arguments);
    open.forEach(cat => toggleFcCat(cat));
  };
  window.renderFinModel._fcKeeper = true;
}

export function setMatCat(cat) {
  _matActiveCat = cat;
  document.querySelectorAll('.mat-cat-tab').forEach(el => {
    el.classList.toggle('active', el.dataset.cat === cat);
  });
  document.querySelectorAll('tr.mat-cat-header[data-cat]').forEach(el => {
    const c = el.dataset.cat;
    const visible = (cat === 'all' || cat === c);
    el.style.display = visible ? '' : 'none';
    const tbody = document.getElementById('mat-tbody-' + c);
    if (tbody) tbody.style.display = (!visible || _matCollapsed[c]) ? 'none' : '';
  });
}

export function toggleMatCat(cat) {
  _matCollapsed[cat] = !_matCollapsed[cat];
  const tbody = document.getElementById('mat-tbody-' + cat);
  const icon  = document.getElementById('mat-cat-icon-' + cat);
  if (tbody) tbody.style.display = _matCollapsed[cat] ? 'none' : '';
  if (icon)  icon.textContent = _matCollapsed[cat] ? '▶' : '▼';
}

export function toggleSemiCat(cat) {
  _semiCollapsed[cat] = !_semiCollapsed[cat];
  const tbody = document.getElementById('semi-tbody-' + cat);
  const icon  = document.getElementById('semi-cat-icon-' + cat);
  if (tbody) tbody.style.display = _semiCollapsed[cat] ? 'none' : '';
  if (icon)  icon.textContent = _semiCollapsed[cat] ? '▶' : '▼';
}

export function toggleSupSection() {
  _supCollapsed = !_supCollapsed;
  const body = document.getElementById('cost-sup-body');
  const icon = document.getElementById('cost-sup-icon');
  if (body) body.style.display = _supCollapsed ? 'none' : '';
  if (icon) icon.textContent = _supCollapsed ? '▶' : '▼';
}

export function toggleIngSection() {
  _ingCollapsed = !_ingCollapsed;
  const body = document.getElementById('cost-ing-body');
  const icon = document.getElementById('cost-ing-icon');
  if (body) body.style.display = _ingCollapsed ? 'none' : '';
  if (icon) icon.textContent = _ingCollapsed ? '▶' : '▼';
}

export function toggleSemiSection() {
  _semiSectionCollapsed = !_semiSectionCollapsed;
  const body = document.getElementById('cost-semi-body');
  const icon = document.getElementById('cost-semi-icon');
  if (body) body.style.display = _semiSectionCollapsed ? 'none' : '';
  if (icon) icon.textContent = _semiSectionCollapsed ? '▶' : '▼';
}

export function scrollCostTo(sectionId) {
  const el = document.getElementById(sectionId);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Попап использования ингредиента / полуфабриката в рецептах ──
export function _buildMatUsageMap() {
  // { matKey: [ drinkName, ... ] }
  const map = {};
  const allDrinks = typeof window.enrich === 'function' ? window.enrich() : DRINKS;
  allDrinks.forEach(d => {
    (d.recipe || []).forEach(r => {
      if (r.mat) {
        if (!map[r.mat]) map[r.mat] = [];
        map[r.mat].push(d.name);
      }
    });
  });
  return map;
}

export function _buildSemiUsageMap() {
  // { semiId: [ drinkName, ... ] }
  const map = {};
  const allDrinks = typeof window.enrich === 'function' ? window.enrich() : DRINKS;
  allDrinks.forEach(d => {
    (d.recipe || []).forEach(r => {
      if (r.semi !== undefined && r.semi !== null) {
        const sid = String(r.semi);
        if (!map[sid]) map[sid] = [];
        map[sid].push(d.name);
      }
    });
  });
  // also check window.SEMI recipes for nested mat/semi usage
  window.SEMI.forEach(s => {
    (s.recipe || []).forEach(r => {
      if (r.mat) {
        if (!map['mat:' + r.mat]) map['mat:' + r.mat] = [];
        // not shown in mat table — skip
      }
    });
  });
  return map;
}

export function openMatUsage(type, key) {
  let name, drinksArr;
  if (type === 'mat') {
    const m = window.MAT[key];
    name      = m ? m.name : key;
    drinksArr = (window._matUsageMap || {})[key] || [];
  } else {
    const s = window.SEMI.find(x => String(x.id) === String(key));
    name      = s ? s.name : key;
    drinksArr = (window._semiUsageMap || {})[String(key)] || [];
  }

  const existing = document.getElementById('mat-usage-popup');
  if (existing) existing.remove();
  if (!drinksArr || !drinksArr.length) return;

  const listHtml = drinksArr.map(n =>
    `<div class="usage-popup-item"><i data-lucide="coffee" class="icon" style="width:13px;height:13px;flex-shrink:0"></i> ${n}</div>`
  ).join('');

  const overlay = document.createElement('div');
  overlay.id = 'mat-usage-popup';
  overlay.className = 'usage-popup-overlay';
  overlay.innerHTML = `
    <div class="usage-popup">
      <div class="usage-popup-header">
        <span class="usage-popup-title">Используется в рецептах</span>
        <button class="usage-popup-close" onclick="document.getElementById('mat-usage-popup').remove()">&times;</button>
      </div>
      <div class="usage-popup-ingredient">${name}</div>
      <div class="usage-popup-list">${listHtml}</div>
    </div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  if (window.lucide) lucide.createIcons();
}

export function addFixedCost() { addFixedCostInCat('other'); }
export function delFixedCost(i) { if(window.S.fixedCosts.length > 1) { const c = window.S.fixedCosts[i]; window.S.fixedCosts.splice(i,1); _rerenderFinModelKeepFC(); saveState(); window.logWorkspaceActivity?.('finmodel_changed', 'fixed_cost', i, `Удалён расход${c?.name ? ` «${c.name}»` : ''}`); if(window.lucide) lucide.createIcons(); } }
export function onTaxMode(v) { S.taxMode = v; _rerenderFinModelKeepFC(); saveState(); window.logWorkspaceActivity?.('finmodel_changed', 'tax', v, 'Изменён налоговый режим'); if(window.lucide) lucide.createIcons(); }
export function onInvestment(v) { const n=parseFloat(v); if(n>=0){ S.investment=n; _rerenderFinModelKeepFC(); saveState(); window.logWorkspaceActivity?.('finmodel_changed', 'investment', '', 'Изменены инвестиции'); if(window.lucide) lucide.createIcons(); } }


export function addFixedCostInCat(cat) {
  window.S.fixedCosts.push({ id: ++_nextCostId, name:'', value:0, category: cat || 'other', isVariable:false });
  window.logWorkspaceActivity?.('finmodel_changed', 'fixed_cost', _nextCostId, 'Добавлен постоянный расход');
  const idx = window.S.fixedCosts.length - 1;
  _fceIsNew = true;
  _rerenderFinModelKeepFC();
  setTimeout(() => { openCostEditor(idx); if(window.lucide) lucide.createIcons(); }, 80);
}

export function toggleFcCat(cat) {
  const rows = document.querySelectorAll(`tr[data-fc-cat="${cat}"]`);
  const chev = document.getElementById(`fc-chev-${cat}`);
  const isHidden = rows.length > 0 && rows[0].style.display === 'none';
  rows.forEach(r => r.style.display = isHidden ? '' : 'none');
  if (chev) chev.textContent = isHidden ? '▼' : '▶';
  if (isHidden) _fcOpenCats.add(cat); else _fcOpenCats.delete(cat);
}

export function openCostEditor(idx) {
  _fceIdx = idx;
  const c = window.window.S.fixedCosts[idx];
  if (!c) return;
  let ov = document.getElementById('fc-editor-overlay');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'fc-editor-overlay';
    ov.className = 'fc-editor-overlay';
    ov.addEventListener('click', function(e) { if (e.target === ov) closeCostEditor(); });
    ov.innerHTML = `
      <div class="fc-editor-modal">
        <div class="fc-editor-hdr">
          <span class="fc-editor-title">Редактировать расход</span>
          <button class="fc-editor-close" onclick="closeCostEditor()">✕</button>
        </div>
        <div class="fc-editor-body">
          <label class="fc-editor-label">Название</label>
          <input id="fce-name" class="inp" type="text" style="width:100%;margin-bottom:12px">
          <label class="fc-editor-label">Категория</label>
          <select id="fce-category" class="modal-select" style="width:100%;margin-bottom:14px">
            ${window.FIXED_COSTS_CATS.map(ct => `<option value="${ct.id}">${ct.label}</option>`).join('')}
          </select>
          <label class="fc-editor-label">Способ расчёта</label>
          <div class="fce-type-row">
            <label class="fce-radio"><input type="radio" name="fce-valtype" value="fixed" id="fce-type-fixed" onchange="_fceTypeChange()"> Сумма ₽/мес</label>
            <label class="fce-radio"><input type="radio" name="fce-valtype" value="pct" id="fce-type-pct" onchange="_fceTypeChange()"> % от выручки</label>
          </div>
          <div id="fce-fixed-fields" style="margin-top:12px">
            <label class="fc-editor-label">Сумма, ₽/мес</label>
            <input id="fce-value" class="inp" type="number" min="0" step="500" inputmode="numeric" style="width:100%;margin-bottom:10px">
            <label class="fce-radio"><input type="checkbox" id="fce-variable"> Масштабировать в сценариях</label>
            <div style="font-size:11px;color:var(--muted);margin-top:4px">Использовать, если расход растёт вместе с продажами.</div>
          </div>
          <div id="fce-pct-fields" style="display:none;margin-top:12px">
            <label class="fc-editor-label">Процент от выручки, %/мес</label>
            <input id="fce-pct" class="inp" type="number" min="0" max="100" step="0.1" inputmode="decimal" style="width:100%;margin-bottom:10px" oninput="_fcePctHint()">
            <div style="margin-bottom:8px">
              <button type="button" id="fce-share-toggle" onclick="_fceShareToggle()" style="background:none;border:none;padding:0;cursor:pointer;font-size:12px;color:var(--muted);display:flex;align-items:center;gap:4px">
                <span id="fce-share-arrow" style="font-size:10px">▶</span>
                <span>Доля применимой выручки, %</span>
                <span title="Если расход применяется не ко всей выручке — укажите долю. Пример: эквайринг только на безналичные оплаты (90% от выручки)" style="cursor:help;opacity:.6">ⓘ</span>
                <span id="fce-share-cur" style="color:var(--navy);font-weight:700"></span>
              </button>
              <div id="fce-share-wrap" style="display:none;margin-top:6px">
                <input id="fce-pctShare" class="inp" type="number" min="1" max="100" step="5" inputmode="numeric" style="width:100%;margin-bottom:4px" oninput="_fcePctHint()">
                <div style="font-size:11px;color:var(--muted)">100 = вся выручка · меньше 100 = только часть (напр. 90 если 90% оплат по карте)</div>
              </div>
            </div>
            <div class="fce-pct-hint" id="fce-pct-hint"></div>
          </div>
        </div>
        <div class="fc-editor-footer">
          <button class="btn btn-sm fc-del-btn" onclick="deleteCostFromEditor()">Удалить</button>
          <button class="btn btn-sm" style="background:var(--green);color:#fff;border:none" onclick="saveCostEditor()">Сохранить</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
  }
  document.getElementById('fce-name').value = c.name || '';
  document.getElementById('fce-category').value = c.category || 'other';
  const isPct = !!c.isPercent;
  document.getElementById('fce-type-fixed').checked = !isPct;
  document.getElementById('fce-type-pct').checked = isPct;
  document.getElementById('fce-value').value = c.value || 0;
  document.getElementById('fce-variable').checked = !!c.isVariable;
  document.getElementById('fce-pct').value = c.pct || 2;
  // pctShare: дефолт 100 (= вся выручка); у эквайринга сохранено 90
  const shareVal = c.pctShare != null ? c.pctShare : 100;
  const shareEl  = document.getElementById('fce-pctShare');
  if (shareEl) shareEl.value = shareVal;
  // раскрыть поле сразу если значение нестандартное (< 100)
  const shareWrap  = document.getElementById('fce-share-wrap');
  const shareArrow = document.getElementById('fce-share-arrow');
  if (shareWrap && shareArrow) {
    const expanded = shareVal < 100;
    shareWrap.style.display = expanded ? '' : 'none';
    shareArrow.textContent  = expanded ? '▼' : '▶';
  }
  _fceTypeChange();
  _fcePctHint();
  ov.style.display = 'flex';
}

export function closeCostEditor() {
  const ov = document.getElementById('fc-editor-overlay');
  if (ov) ov.style.display = 'none';
  if (_fceIsNew && _fceIdx >= 0 && _fceIdx < window.S.fixedCosts.length) {
    window.S.fixedCosts.splice(_fceIdx, 1);
    _rerenderFinModelKeepFC();
  }
  _fceIdx = -1;
  _fceIsNew = false;
}

export function _fceTypeChange() {
  const isPct = !!(document.getElementById('fce-type-pct') && document.getElementById('fce-type-pct').checked);
  const ff = document.getElementById('fce-fixed-fields');
  const pf = document.getElementById('fce-pct-fields');
  if (ff) ff.style.display = isPct ? 'none' : '';
  if (pf) pf.style.display = isPct ? '' : 'none';
}

export function _fceShareToggle() {
  const wrap  = document.getElementById('fce-share-wrap');
  const arrow = document.getElementById('fce-share-arrow');
  if (!wrap) return;
  const open = wrap.style.display === 'none';
  wrap.style.display  = open ? '' : 'none';
  arrow.textContent   = open ? '▼' : '▶';
}
export function _fceShareUpdate() {
  const shareEl = document.getElementById('fce-pctShare');
  const cur     = document.getElementById('fce-share-cur');
  const wrap    = document.getElementById('fce-share-wrap');
  const arrow   = document.getElementById('fce-share-arrow');
  if (!shareEl || !cur) return;
  const val = parseFloat(shareEl.value) || 100;
  const notFull = val < 100;
  cur.textContent   = notFull ? `(${val}%)` : '';
  if (notFull && wrap && wrap.style.display === 'none') {
    wrap.style.display = '';
    if (arrow) arrow.textContent = '▼';
  }
}
export function _fcePctHint() {
  const hint = document.getElementById('fce-pct-hint');
  if (!hint) return;
  _fceShareUpdate();
  const pct   = parseFloat(document.getElementById('fce-pct').value) || 0;
  const shareEl = document.getElementById('fce-pctShare');
  const share = shareEl ? (parseFloat(shareEl.value) || 100) : 100;
  const { totRevMon } = window.salesMetrics(window.enrich());
  const computed = Math.round(totRevMon * share / 100 * pct / 100);
  hint.textContent = computed > 0 ? `≈ ${computed.toLocaleString('ru')} ₽ / мес при текущей выручке` : '';
}

export function saveCostEditor() {
  if (_fceIdx < 0 || _fceIdx >= window.window.S.fixedCosts.length) return;
  const c = window.window.S.fixedCosts[_fceIdx];
  c.name = (document.getElementById('fce-name').value || '').trim() || c.name;
  c.category = document.getElementById('fce-category').value || 'other';
  const isPct = document.getElementById('fce-type-pct').checked;
  if (isPct) {
    c.isPercent  = true;
    c.pct        = parseFloat(document.getElementById('fce-pct').value) || 0;
    c.pctShare   = parseFloat(document.getElementById('fce-pctShare').value) || 100;
    c.value      = 0;
    c.isVariable = true;
  } else {
    c.isPercent  = false;
    c.pct        = 0;
    c.pctShare   = 100;
    c.value      = parseFloat(document.getElementById('fce-value').value) || 0;
    c.isVariable = document.getElementById('fce-variable').checked;
  }
  _fceIsNew = false;
  closeCostEditor();
  _rerenderFinModelKeepFC();
  saveState();
  if (window.lucide) lucide.createIcons();
}

export function deleteCostFromEditor() {
  if (_fceIdx < 0 || window.window.S.fixedCosts.length <= 1) return;
  window.showConfirm(`Удалить «${window.window.S.fixedCosts[_fceIdx].name}»?`, () => {
    window.window.S.fixedCosts.splice(_fceIdx, 1);
    _fceIsNew = false;
    closeCostEditor();
    _rerenderFinModelKeepFC();
    saveState();
    if (window.lucide) lucide.createIcons();
  }, { icon: '🗑️', okText: 'Удалить' });
}
