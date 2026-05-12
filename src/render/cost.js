// ════════════════════════════════════════════════════════════════════
//  RENDER — COST / ПОСТАВЩИКИ / ИНГРЕДИЕНТЫ / ПОЛУФАБРИКАТЫ
//  (src/render/cost.js)
//
//  Все данные читаются из window.* — они доступны после того как
//  app.js сделал Object.assign(window, {...}) в конце своего файла.
// ════════════════════════════════════════════════════════════════════

export function renderCost() {
  const {
    MAT, MAT_CATEGORIES, SEMI, S,
    calcSemiCostPerUnit, rubSemi,
    _buildMatUsageMap, _buildSemiUsageMap,
    _matActiveCat, _matCollapsed, _semiCollapsed,
    _supCollapsed, _ingCollapsed,
    toggleMatCat, toggleSemiCat,
    setMatCat,
  } = window;

  // ── Сырьё по категориям ──────────────────────────────────────────
  const matGroups = {};
  Object.entries(MAT).forEach(([key, m]) => {
    const cat = m.category || 'other';
    if (!matGroups[cat]) matGroups[cat] = [];
    matGroups[cat].push([key, m]);
  });
  const matSortedCats = Object.keys(matGroups).sort((a, b) =>
    ((MAT_CATEGORIES[a] || { order: 99 }).order) - ((MAT_CATEGORIES[b] || { order: 99 }).order)
  );

  // ── Секция Поставщики ────────────────────────────────────────────
  const sups = S.suppliers || {};
  const book = S.supplierBook || [];
  const byName = {};
  Object.entries(sups).forEach(([key, v]) => {
    if (!v || (!v.name && !v.phone && !v.note)) return;
    const nm = v.name || '(без названия)';
    if (!byName[nm]) byName[nm] = { name: nm, phone: v.phone || '', note: v.note || '', site: v.site || '', mats: [], matKeys: [] };
    if (MAT[key]) byName[nm].mats.push(MAT[key].name);
    byName[nm].matKeys.push(key);
    if (!byName[nm].phone && v.phone) byName[nm].phone = v.phone;
    if (!byName[nm].note  && v.note)  byName[nm].note  = v.note;
    if (!byName[nm].site  && v.site)  byName[nm].site  = v.site;
  });
  book.forEach(b => {
    if (!byName[b.name]) {
      byName[b.name] = { name: b.name, phone: b.phone || '', note: b.note || '', site: b.site || '', mats: [], matKeys: [], bookId: b.id };
    } else {
      if (!byName[b.name].note  && b.note)  byName[b.name].note  = b.note;
      if (!byName[b.name].phone && b.phone) byName[b.name].phone = b.phone;
      if (!byName[b.name].site  && b.site)  byName[b.name].site  = b.site;
      if (!byName[b.name].bookId) byName[b.name].bookId = b.id;
    }
  });
  const supGroups = Object.values(byName);
  const suppliersHtml = supGroups.length
    ? '<div class="mat-grid">' + supGroups.map(g => {
        const matTags = g.mats.map(name => '<span class="sup-mat-tag">' + name + '</span>').join('');
        const editFn = (g.matKeys && g.matKeys.length)
          ? "openSupplierModal('" + g.matKeys[0] + "')"
          : "openSupplierBookModal('" + (g.bookId || '') + "')";
        return '<div class="sup-card">'
          + '<div class="sup-card-header">'
          + '<div class="sup-card-info">'
          + '<span class="sup-card-name"><i data-lucide="building-2" class="icon"></i> ' + g.name + '</span>'
          + (g.phone ? '<span class="sup-card-phone">' + g.phone + '</span>' : '')
          + '</div>'
          + '<button class="btn btn-outline sup-edit-btn" onclick="' + editFn + '"><i data-lucide="pencil" class="icon"></i></button>'
          + '</div>'
          + (g.note ? '<div class="sup-card-note">' + g.note + '</div>' : '')
          + (g.site ? '<div class="sup-card-note"><a href="' + g.site + '" target="_blank" style="color:var(--muted);text-decoration:none;font-size:12px">🌐 ' + g.site.replace(/^https?:\/\//, '') + '</a></div>' : '')
          + (matTags ? '<div class="sup-card-mats">' + matTags + '</div>' : '')
          + '</div>';
      }).join('') + '</div>'
    : '<div style="color:var(--muted);font-size:13px;padding:16px 0">Поставщики ещё не добавлены. Нажмите <b>+ Поставщик</b> или значок 🚚 у любого сырья.</div>';

  // ── Табы категорий сырья ─────────────────────────────────────────
  const matCatTabsHtml = `
    <div class="mat-cat-tabs">
      <button class="mat-cat-tab${_matActiveCat === 'all' ? ' active' : ''}" onclick="setMatCat('all')">Всё <span>${Object.keys(MAT).length}</span></button>
      ${matSortedCats.map(cat => {
        const lbl = (MAT_CATEGORIES[cat] || { label: cat }).label;
        return `<button class="mat-cat-tab${_matActiveCat === cat ? ' active' : ''}" onclick="setMatCat('${cat}')">${lbl} <span>${matGroups[cat].length}</span></button>`;
      }).join('')}
    </div>`;

  // ── Таблица ингредиентов ─────────────────────────────────────────
  const matUsageMap = _buildMatUsageMap();
  window._matUsageMap = matUsageMap;

  const matRowsHtml = matSortedCats.map(cat => {
    const catLabel  = (MAT_CATEGORIES[cat] || { label: cat }).label;
    const collapsed = !!_matCollapsed[cat];
    const catHidden = (_matActiveCat !== 'all' && _matActiveCat !== cat) ? 'display:none' : '';
    const rows = matGroups[cat].map(([key, m]) => {
      const sup      = (S.suppliers || {})[key];
      const supTitle = sup ? `${sup.name || ''}${sup.phone ? ' · ' + sup.phone : ''}${sup.note ? ' · ' + sup.note : ''}` : 'Указать поставщика';
      const supClr   = sup ? 'var(--green)' : 'var(--muted)';
      const supCell  = sup
        ? `<button class="sup-name-btn" onclick="openSupplierInfo('${key}')" title="${(sup.phone || '')} ${(sup.note || '')}">${sup.name || 'поставщик'}</button>`
        : `<button class="mat-del" style="font-size:11px;color:var(--muted)" onclick="openSupQuickDrop('${key}',this)" title="Добавить поставщика">+ добавить</button>`;
      const usedIn      = matUsageMap[key] || [];
      const usageBadge  = usedIn.length
        ? `<button class="usage-badge" onclick="openMatUsage('mat','${key}')" title="Нажмите, чтобы увидеть рецепты">${usedIn.length}</button>`
        : `<span class="usage-badge usage-badge-zero">0</span>`;
      return `<tr style="${collapsed ? 'display:none' : ''}" class="mat-row${m.custom ? ' mat-row-custom' : ''}" data-cat="${cat}" onclick="openEditMat('${key}')" title="Нажмите для редактирования" style="cursor:pointer">
        <td class="mat-td-name">${m.name}${m.purchaseUrl ? ` <a href="${m.purchaseUrl}" target="_blank" rel="noopener" onclick="event.stopPropagation()" title="Ссылка на покупку" style="color:var(--green);font-size:12px;text-decoration:none;vertical-align:middle">↗</a>` : ''}</td>
        <td class="mat-td-unit mob-hide">${m.unit}</td>
        <td class="mat-td-price">
          <input class="inp sm" type="number" min="1" style="width:72px" inputmode="numeric"
            id="mat-inp-${key}" value="${S.prices[key]}"
            onfocus="onMatPriceFocus('${key}')"
            oninput="onMatPriceInput('${key}',this.value)"
            onblur="onMatPriceCommit('${key}',this.value)"
            onclick="event.stopPropagation()"> <span style="font-size:12px;color:var(--muted)">₽</span>
        </td>
        <td class="mat-td-sup mob-hide">${supCell}</td>
        <td class="mat-td-usage">${usageBadge}</td>
        <td class="mat-td-actions">
          <button class="mat-del" onclick="event.stopPropagation();openSupQuickDrop('${key}',this)" title="${supTitle}" style="color:${supClr}"><i data-lucide="truck" class="icon"></i></button>
          <button class="mat-del" onclick="event.stopPropagation();openPriceHistory('${key}')" title="История цен"><i data-lucide="history" class="icon"></i></button>
          ${m.custom ? `<button class="mat-del" onclick="event.stopPropagation();deleteMat('${key}')" title="Удалить" style="color:var(--red)"><i data-lucide="trash-2" class="icon"></i></button>` : ''}
        </td>
      </tr>`;
    }).join('');
    return `<tr class="mat-cat-header" data-cat="${cat}" style="${catHidden}" onclick="toggleMatCat('${cat}')">
        <td colspan="6">
          <span id="mat-cat-icon-${cat}" class="mat-cat-chevron">${collapsed ? '▶' : '▼'}</span>
          ${catLabel}
          <span class="mat-cat-count">${matGroups[cat].length}</span>
        </td>
      </tr>
      <tbody id="mat-tbody-${cat}">${rows}</tbody>`;
  }).join('');

  const matCardsHtml = `<div class="mat-table-wrap">
    <table class="mat-table">
      <thead>
        <tr>
          <th style="width:30%">Название</th>
          <th class="mob-hide" style="width:9%">Ед. изм.</th>
          <th style="width:13%">Цена</th>
          <th class="mob-hide" style="width:20%">Поставщик</th>
          <th class="ta-c" style="width:8%" title="Кол-во рецептов, где используется">Рецепты</th>
          <th style="width:20%">Действия</th>
        </tr>
      </thead>
      ${matRowsHtml}
    </table>
  </div>`;

  // ── Полуфабрикаты ────────────────────────────────────────────────
  const semiUsageMap = _buildSemiUsageMap();
  window._semiUsageMap = semiUsageMap;

  const semiHtml = SEMI.length
    ? `<div class="mat-table-wrap">
        <table class="mat-table">
          <thead>
            <tr>
              <th style="width:33%">Название</th>
              <th class="mob-hide" style="width:12%">Выход</th>
              <th class="mob-hide" style="width:8%">Ед.</th>
              <th style="width:17%">Себестоимость/ед.</th>
              <th class="ta-c" style="width:8%" title="Кол-во рецептов, где используется">Рецепты</th>
              <th style="width:22%">Действия</th>
            </tr>
          </thead>
          <tr class="mat-cat-header" onclick="toggleSemiCat()">
            <td colspan="6">
              <span id="semi-cat-icon" class="mat-cat-chevron">${_semiCollapsed ? '▶' : '▼'}</span>
              Полуфабрикаты
              <span class="mat-cat-count">${SEMI.length}</span>
            </td>
          </tr>
          <tbody id="semi-tbody" style="${_semiCollapsed ? 'display:none' : ''}">
            ${SEMI.map(s => {
              const cost   = calcSemiCostPerUnit(s);
              const recipe = s.recipe.map(r => {
                const mat = MAT[r.mat];
                return mat ? mat.name + ' ' + r.amt + (mat.unit.replace(/\d+ /, '')) : r.mat;
              }).join(', ');
              const usedIn = semiUsageMap[String(s.id)] || [];
              const semiUsageBadge = usedIn.length
                ? `<button class="usage-badge" onclick="event.stopPropagation();openMatUsage('semi','${s.id}')" title="Нажмите, чтобы увидеть рецепты">${usedIn.length}</button>`
                : `<span class="usage-badge usage-badge-zero">0</span>`;
              return `<tr class="mat-row" title="Состав: ${recipe}" style="cursor:pointer" onclick="openViewSemi(${s.id})">
                <td class="mat-td-name">${s.name}</td>
                <td class="mat-td-unit mob-hide">${s.yield}</td>
                <td class="mat-td-unit mob-hide">${s.unit}</td>
                <td class="mat-td-price" style="font-weight:700;color:var(--green)">${rubSemi(cost, s.unit)}</td>
                <td class="mat-td-usage">${semiUsageBadge}</td>
                <td class="mat-td-actions">
                  <button class="mat-del" onclick="event.stopPropagation();exportSingleSemiPDF(${s.id})" title="Скачать техкарту PDF"><i data-lucide="file-text" class="icon"></i></button>
                  <button class="mat-del" onclick="event.stopPropagation();exportSingleSemiXLSX(${s.id})" title="Скачать техкарту Excel"><i data-lucide="file-spreadsheet" class="icon"></i></button>
                  <button class="mat-del" onclick="event.stopPropagation();deleteSemi(${s.id})" title="Удалить" style="color:var(--red)"><i data-lucide="trash-2" class="icon"></i></button>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`
    : `<div style="color:var(--muted);font-size:13px;padding:16px 0">Нет полуфабрикатов. Нажмите «+ Полуфабрикат», чтобы добавить (соусы, сиропы, основы).</div>`;

  // ── Сборка HTML ──────────────────────────────────────────────────
  const _costEl     = document.getElementById('tab-cost');
  const _costScroll = _costEl ? _costEl.scrollTop : 0;

  _costEl.innerHTML = `
    <div class="page-title">
      <span class="page-title-left"><i data-lucide="truck" class="icon"></i> Поставщики</span>
      <button class="btn btn-outline sup-intro-toggle" id="sup-intro-btn" onclick="toggleSupIntro()" title="Подсказка"><i data-lucide="info" class="icon"></i> <span class="sup-btn-txt">Подсказка</span></button>
    </div>
    <div class="tab-intro" id="sup-intro">
      <div class="tab-intro-icon"><i data-lucide="truck" class="icon icon-lg"></i></div>
      <div>
        <div class="tab-intro-title">Поставщики, сырьё и полуфабрикаты</div>
        <div class="tab-intro-text">
          Здесь живёт база всего, из чего делаются напитки. Три секции:<br>
          <strong>Поставщики</strong> — справочник контрагентов. Привяжи каждого к сырью — контакт будет виден прямо в таблице ингредиентов.<br>
          <strong>Ингредиенты</strong> — цены на сырьё. Обновил цену после закупки — себестоимость всех рецептур пересчиталась мгновенно.<br>
          <strong>Полуфабрикаты</strong> — заготовки со своей рецептурой (сиропы, соусы, смеси). Создай один раз и используй как ингредиент в любом напитке.
        </div>
        <div class="tab-intro-steps">
          <span class="tab-intro-step">+ Поставщик — добавь контрагента в справочник</span>
          <span class="tab-intro-step">🚚 в строке ингредиента — привязать поставщика к сырью</span>
          <span class="tab-intro-step">🕐 рядом с ценой — история изменений цены</span>
          <span class="tab-intro-step">+ Полуфабрикат — создай заготовку и используй её в рецептурах</span>
        </div>
      </div>
    </div>

    <div class="cost-subtabs">
      <button class="cost-subtab" onclick="scrollCostTo('cost-section-sup')"><i data-lucide="building-2" class="icon"></i> Поставщики <span>${supGroups.length}</span></button>
      <button class="cost-subtab" onclick="scrollCostTo('cost-section-ing')"><i data-lucide="banknote" class="icon"></i> Ингредиенты <span>${Object.keys(MAT).length}</span></button>
      <button class="cost-subtab" onclick="scrollCostTo('cost-section-semi')"><i data-lucide="layers" class="icon"></i> Полуфабрикаты <span>${SEMI.length}</span></button>
    </div>

    <div id="cost-section-sup"></div>
    <div class="section-title" style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;cursor:pointer" onclick="toggleSupSection()">
      <span style="display:flex;align-items:center;gap:5px"><span class="mat-cat-chevron" id="cost-sup-icon">${_supCollapsed ? '▶' : '▼'}</span><i data-lucide="building-2" class="icon"></i> Поставщики <span style="background:var(--border);border-radius:20px;padding:1px 7px;font-size:11px;font-weight:700;margin-left:4px">${supGroups.length}</span></span>
      <div style="display:flex;gap:8px" onclick="event.stopPropagation()">
        <button class="btn btn-outline" onclick="exportSuppliersPDF()" title="Скачать список поставщиков (PDF)"><i data-lucide="file-text" class="icon"></i><span class="sup-btn-txt"> PDF</span></button>
        <button class="btn btn-outline" onclick="exportSuppliersXLSX()" title="Скачать список поставщиков (Excel)"><i data-lucide="file-spreadsheet" class="icon"></i><span class="sup-btn-txt"> Excel</span></button>
        <button class="btn btn-outline" onclick="openSuppliersList()"><i data-lucide="list" class="icon"></i><span class="sup-btn-txt"> Полный список</span></button>
        <button class="btn btn-green" onclick="openSupplierBookModal()"><i data-lucide="plus" class="icon"></i><span class="sup-btn-txt"> Поставщик</span></button>
      </div>
    </div>
    <div id="cost-sup-body" style="${_supCollapsed ? 'display:none' : ''}">
      ${suppliersHtml}
    </div>

    <div id="cost-section-ing"></div>
    <div class="section-title" style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-top:8px;cursor:pointer" onclick="toggleIngSection()">
      <span style="display:flex;align-items:center;gap:5px"><span class="mat-cat-chevron" id="cost-ing-icon">${_ingCollapsed ? '▶' : '▼'}</span><i data-lucide="banknote" class="icon"></i> Ингредиенты <span style="background:var(--border);border-radius:20px;padding:1px 7px;font-size:11px;font-weight:700;margin-left:4px">${Object.keys(MAT).length}</span></span>
      <div onclick="event.stopPropagation()" style="display:flex;gap:8px">
        <button class="btn btn-outline" onclick="exportMaterialsPDF()" title="Ингредиенты и п/ф в PDF"><i data-lucide="file-text" class="icon"></i><span class="sup-btn-txt"> PDF</span></button>
        <button class="btn btn-outline" onclick="exportMaterialsXLSX()" title="Ингредиенты и п/ф в Excel"><i data-lucide="file-spreadsheet" class="icon"></i><span class="sup-btn-txt"> Excel</span></button>
        <button class="btn btn-green" onclick="openModal('modal-mat')"><i data-lucide="plus" class="icon"></i><span class="sup-btn-txt"> Сырьё</span></button>
      </div>
    </div>
    <div id="cost-ing-body" style="${_ingCollapsed ? 'display:none' : ''}">
      ${matCatTabsHtml}
      ${matCardsHtml}
    </div>

    <div id="cost-section-semi"></div>
    <div class="section-title" style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-top:8px;cursor:pointer" onclick="toggleSemiSection()">
      <span style="display:flex;align-items:center;gap:5px"><span class="mat-cat-chevron" id="cost-semi-icon">${_semiCollapsed ? '▶' : '▼'}</span><i data-lucide="layers" class="icon"></i> Полуфабрикаты <span style="background:var(--border);border-radius:20px;padding:1px 7px;font-size:11px;font-weight:700;margin-left:4px">${SEMI.length}</span></span>
      <div style="display:flex;gap:8px" onclick="event.stopPropagation()">
        <button class="btn btn-outline" onclick="exportSemiTechCards()" title="Экспорт техкарт полуфабрикатов в PDF"><i data-lucide="file-text" class="icon"></i><span class="sup-btn-txt"> PDF техкарт</span></button>
        <button class="btn btn-green" onclick="openAddSemi()"><i data-lucide="plus" class="icon"></i><span class="sup-btn-txt"> Полуфабрикат</span></button>
      </div>
    </div>
    <div id="cost-semi-body" style="${_semiCollapsed ? 'display:none' : ''}">
      ${semiHtml}
    </div>
  `;

  if (window.lucide) lucide.createIcons();
  if (_costScroll) _costEl.scrollTop = _costScroll;
}
