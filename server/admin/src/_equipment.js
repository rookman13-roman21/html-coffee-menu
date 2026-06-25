  // ── EQUIPMENT FUNCTIONS ────────────────────────────────────────
  var OC_MAIN_CATS = {
    renovation: 'Ремонт и отделка',
    equipment:  'Оборудование',
    furniture:  'Мебель и интерьер',
    automation: 'Автоматизация',
    stock:      'Стартовый склад',
    branding:   'Брендинг',
    legal:      'Юридическое оформление',
    marketing:  'Маркетинг запуска',
    rent:       'Депозит / аванс аренды',
    uniform:    'Форма и инвентарь',
    training:   'Обучение персонала',
    reserve:    'Оборотный резерв',
  };

  var OC_SUBCATS = {
    renovation: ['Черновые работы','Электрика','Сантехника','Отделка','Вентиляция','Прочее'],
    equipment:  ['Кофемашины','Кофемолки','Холодильное','Посудомоечное','Блендеры','Водоподготовка','Вытяжка','Прочее'],
    furniture:  ['Барные стойки','Столы и стулья','Витрины','Декор','Прочее'],
    automation: ['CRM/POS','Кассовое оборудование','Весы','Прочее'],
    stock:      ['Кофе и чай','Молоко и альтмолоко','Сиропы','Стаканы и крышки','Расходники','Прочее'],
    branding:   ['Вывески','Упаковка','Стаканы с логотипом','Полиграфия','Прочее'],
    legal:      ['Регистрация ИП/ООО','Лицензии','Договоры','Нотариальные расходы','Прочее'],
    marketing:  ['SMM','Таргетированная реклама','Фотосъёмка','Блогеры','Прочее'],
    rent:       ['Депозит','Авансовый платёж','Прочее'],
    uniform:    ['Форма','Инвентарь','Прочее'],
    training:   ['Баристы','Менеджеры','Онлайн-курсы','Прочее'],
    reserve:    ['Оборотный резерв','Прочее'],
  };

  function loadOcLibrary() {
    var loading = document.getElementById('adm-eq-loading');
    var table = document.getElementById('adm-eq-table');
    if (loading) loading.style.display = '';
    if (table) table.style.display = 'none';
    return api('GET', '/admin/oc-library').then(function(data) {
      if (loading) loading.style.display = 'none';
      if (table) table.style.display = '';
      if (data && Array.isArray(data)) {
        _oc_items = data;
        _oc_selected = [];
        renderOcLibrary();
        updateEqCatFilter();
      }
    }).catch(function() {
      if (loading) loading.textContent = 'Ошибка загрузки';
    });
  }

  function getEqCats() {
    var cats = {};
    _oc_items.forEach(function(it) { if (it.subcategory) cats[it.subcategory] = 1; });
    return Object.keys(cats).sort();
  }

  function _admAiFillBasic(ogTitle, ogImage, prices) {
    var nameEl = document.getElementById('adm-eq-name');
    var photoEl = document.getElementById('adm-eq-photo');
    var priceEl = document.getElementById('adm-eq-price');
    if (nameEl && ogTitle) nameEl.value = ogTitle.slice(0, 80);
    if (ogImage) {
      if (photoEl) photoEl.value = ogImage;
      var prev = document.getElementById('adm-eq-photo-preview');
      if (prev) { prev.src = ogImage; prev.style.display = 'block'; }
    }
    if (priceEl && prices && prices[0]) priceEl.value = prices[0];
  }

  function updateEqCatFilter() {
    var mainWrap = document.getElementById('adm-eq-main-tabs');
    var subWrap  = document.getElementById('adm-eq-sub-tabs');
    var contextEl = document.getElementById('adm-eq-context');
    var coverageEl = document.getElementById('adm-eq-coverage');
    var addBtn = document.getElementById('adm-eq-add-btn');
    if (!mainWrap) return;

    // Считаем позиции по главным категориям
    var mainCounts = {};
    _oc_items.forEach(function(it) { var k = it.category || 'equipment'; mainCounts[k] = (mainCounts[k] || 0) + 1; });
    var total = _oc_items.length;
    var catEntries = Object.entries(OC_MAIN_CATS);
    var filledCats = catEntries.filter(function(entry) { return (mainCounts[entry[0]] || 0) > 0; });
    var emptyCats = catEntries.filter(function(entry) { return !(mainCounts[entry[0]] || 0); });

    if (coverageEl) {
      var emptyText = emptyCats.length
        ? '<span class="adm-eq-coverage-empty">Пустые: ' + emptyCats.map(function(entry) { return _escHtml(entry[1]); }).join(', ') + '</span>'
        : '<span class="adm-eq-coverage-done">Все разделы заполнены</span>';
      coverageEl.innerHTML =
        '<div class="adm-eq-coverage-main">Заполнено ' + filledCats.length + ' из ' + catEntries.length + ' разделов</div>' +
        emptyText;
    }
    if (addBtn) {
      addBtn.textContent = _oc_main_tab ? '+ Добавить в ' + (OC_MAIN_CATS[_oc_main_tab] || _oc_main_tab) : '+ Добавить';
    }
    if (contextEl) {
      if (_oc_main_tab) {
        contextEl.innerHTML =
          '<span class="adm-eq-context-label">Где используется</span>' +
          '<span>Клиентский бюджет: Стартовые вложения → ' + _escHtml(OC_MAIN_CATS[_oc_main_tab] || _oc_main_tab) + '</span>';
        contextEl.style.display = '';
      } else {
        contextEl.style.display = 'none';
        contextEl.innerHTML = '';
      }
    }

    // Рендер главных табов
    var mainHtml = '<button class="adm-lib-tab' + (!_oc_main_tab ? ' active' : '') + '" data-tab-main="">Все разделы <span class="tab-cnt">' + total + '</span></button>';
    catEntries.forEach(function(entry) {
      var k = entry[0], label = entry[1], cnt = mainCounts[k] || 0;
      mainHtml += '<button class="adm-lib-tab' + (_oc_main_tab === k ? ' active' : '') + '" data-tab-main="' + k + '">' + label + ' <span class="tab-cnt">' + cnt + '</span></button>';
    });
    mainWrap.innerHTML = mainHtml;

    // Рендер суб-табов
    if (_oc_main_tab) {
      var subCounts = {};
      _oc_items.filter(function(it) { return (it.category || 'equipment') === _oc_main_tab; })
        .forEach(function(it) { var k = it.subcategory || '—'; subCounts[k] = (subCounts[k] || 0) + 1; });
      var mainTotal = mainCounts[_oc_main_tab] || 0;
      if (!mainTotal) {
        subWrap.style.display = 'none';
        subWrap.innerHTML = '';
        return;
      }
      var subHtml = '<button class="adm-lib-tab' + (!_oc_sub_tab ? ' active' : '') + '" data-tab-sub="">Все <span class="tab-cnt">' + mainTotal + '</span></button>';
      Object.keys(subCounts).sort().forEach(function(sub) {
        subHtml += '<button class="adm-lib-tab' + (_oc_sub_tab === sub ? ' active' : '') + '" data-tab-sub="' + sub + '">' + sub + ' <span class="tab-cnt">' + subCounts[sub] + '</span></button>';
      });
      subWrap.innerHTML = subHtml;
      subWrap.style.display = '';
    } else {
      subWrap.style.display = 'none';
      subWrap.innerHTML = '';
    }
  }

  function renderOcLibrary() {
    var tbody = document.getElementById('adm-eq-tbody');
    if (!tbody) return;
    var q = (document.getElementById('adm-eq-search') ? document.getElementById('adm-eq-search').value : '').toLowerCase();
    var items = _oc_items.filter(function(it) {
      if (q && !(it.name || '').toLowerCase().includes(q)) return false;
      if (_oc_main_tab && (it.category || 'equipment') !== _oc_main_tab) return false;
      if (_oc_sub_tab && (it.subcategory || '—') !== _oc_sub_tab) return false;
      return true;
    });
    // Group by main category + subcategory
    var groups = {};
    items.forEach(function(it) {
      var mainLabel = OC_MAIN_CATS[it.category || 'equipment'] || (it.category || 'equipment');
      var key = mainLabel + ' / ' + (it.subcategory || 'Без подкатегории');
      if (!groups[key]) groups[key] = [];
      groups[key].push(it);
    });
    var html = '';
    Object.keys(groups).sort().forEach(function(cat) {
      html += '<tr class="adm-eq-cat-row"><td colspan="6">' + cat + '</td></tr>';
      groups[cat].forEach(function(it) {
        var checked = _oc_selected.indexOf(it.id) >= 0 ? 'checked' : '';
        var thumb = it.photo ? '<img class="adm-eq-thumb" src="' + it.photo + '" onerror="this.style.display=\'none\'">' : '<div class="adm-eq-thumb-empty">🖼</div>';
        var price = it.price ? it.price.toLocaleString('ru-RU') + ' ₽' : '—';
        var link = it.url ? '<a class="adm-eq-link" href="' + it.url + '" target="_blank" onclick="event.stopPropagation()">🔗</a>' : '—';
        var badges = '';
        if (it.is_featured) badges += '<span class="adm-badge adm-badge-feat" title="Рекомендуем">⭐</span>';
        if (!it.is_public) badges += '<span class="adm-badge adm-badge-priv" title="Скрыто">🔒</span>';
        if (it.promo_code) badges += '<span class="adm-badge" title="Есть промокод">🏷️</span>';
        var pubIcon = it.is_public ? '👁' : '🔒';
        var pubTitle = it.is_public ? 'Видно в SPA — нажмите чтобы скрыть' : 'Скрыто — нажмите чтобы показать';
        html += '<tr data-eq-id="' + it.id + '" draggable="true" data-sort="' + (it.sort_order || 0) + '">' +
          '<td><input type="checkbox" class="adm-eq-check-row" data-id="' + it.id + '"' + checked + ' onclick="event.stopPropagation()"></td>' +
          '<td>' + thumb + '</td>' +
          '<td class="adm-eq-name">' + (it.name || '') + (badges ? ' ' + badges : '') + '</td>' +
          '<td class="adm-eq-price">' + price + '</td>' +
          '<td>' + link + '</td>' +
          '<td><div class="adm-eq-actions">' +
          '<span class="adm-drag-handle" title="Перетащить" onclick="event.stopPropagation()">⠿</span>' +
          '<button class="adm-act" data-act="eq-toggle-pub" data-id="' + it.id + '" title="' + pubTitle + '">' + pubIcon + '</button>' +
          '<button class="adm-act" data-act="eq-edit" data-id="' + it.id + '">✏️</button>' +
          '<button class="adm-act" data-act="eq-del" data-id="' + it.id + '">🗑</button>' +
          '</div></td>' +
          '</tr>';
      });
    });
    if (!items.length) {
      var emptyTitle = _oc_main_tab
        ? 'В разделе «' + _escHtml(OC_MAIN_CATS[_oc_main_tab] || _oc_main_tab) + '» пока нет позиций'
        : 'В библиотеке пока нет позиций';
      var emptyText = _oc_main_tab
        ? 'Добавьте первую позицию, чтобы она стала доступна для наполнения клиентского бюджета.'
        : 'Добавьте первую позицию или выберите раздел бюджета выше.';
      var emptyButton = _oc_main_tab
        ? '<button class="adm-eq-empty-add" type="button" data-eq-empty-add>+ Добавить в ' + _escHtml(OC_MAIN_CATS[_oc_main_tab] || _oc_main_tab) + '</button>'
        : '<button class="adm-eq-empty-add" type="button" data-eq-empty-add>+ Добавить позицию</button>';
      html = '<tr class="adm-eq-empty-row"><td colspan="6">' +
        '<div class="adm-eq-empty-state">' +
          '<div class="adm-eq-empty-title">' + emptyTitle + '</div>' +
          '<div class="adm-eq-empty-text">' + emptyText + '</div>' +
          emptyButton +
        '</div>' +
      '</td></tr>';
    }
    tbody.innerHTML = html;
    updateBulkDelBtn();
    _initDragDrop(tbody);
  }

  var _dragSrcId = null;
  function _initDragDrop(tbody) {
    tbody.querySelectorAll('tr[draggable]').forEach(function(row) {
      row.addEventListener('dragstart', function(e) {
        _dragSrcId = row.dataset.eqId;
        row.style.opacity = '0.5';
        e.dataTransfer.effectAllowed = 'move';
      });
      row.addEventListener('dragend', function() {
        row.style.opacity = '';
        tbody.querySelectorAll('tr.adm-drag-over').forEach(function(r) { r.classList.remove('adm-drag-over'); });
      });
      row.addEventListener('dragover', function(e) {
        e.preventDefault();
        tbody.querySelectorAll('tr.adm-drag-over').forEach(function(r) { r.classList.remove('adm-drag-over'); });
        if (row.dataset.eqId !== _dragSrcId) row.classList.add('adm-drag-over');
      });
      row.addEventListener('drop', function(e) {
        e.preventDefault();
        row.classList.remove('adm-drag-over');
        var targetId = row.dataset.eqId;
        if (!_dragSrcId || _dragSrcId === targetId) return;
        // Reorder _oc_items in DOM order (all visible rows)
        var rows = Array.from(tbody.querySelectorAll('tr[data-eq-id]'));
        var ids = rows.map(function(r) { return parseInt(r.dataset.eqId); });
        var srcIdx = ids.indexOf(parseInt(_dragSrcId));
        var tgtIdx = ids.indexOf(parseInt(targetId));
        if (srcIdx < 0 || tgtIdx < 0) return;
        // Reassign sort_order: assign 0..n in new order
        ids.splice(srcIdx, 1);
        ids.splice(tgtIdx, 0, parseInt(_dragSrcId));
        ids.forEach(function(id, i) {
          var it = _oc_items.find(function(x) { return x.id === id; });
          if (it) it.sort_order = i * 10;
        });
        // Persist to server — batch updates
        ids.forEach(function(id, i) {
          var it = _oc_items.find(function(x) { return x.id === id; });
          if (!it) return;
          api('PUT', '/admin/oc-library/' + id, {
            name: it.name, subcategory: it.subcategory, price: it.price,
            photo: it.photo || '', url: it.url || '', category: it.category || 'equipment',
            is_public: it.is_public !== undefined ? it.is_public : 1,
            is_featured: it.is_featured || 0, sort_order: i * 10
          });
        });
        renderOcLibrary();
      });
    });
  }

  function updateBulkDelBtn() {
    var btn = document.getElementById('adm-eq-bulk-del');
    var cnt = document.getElementById('adm-eq-sel-count');
    if (!btn) return;
    if (_oc_selected.length > 0) {
      btn.style.display = '';
      if (cnt) cnt.textContent = _oc_selected.length;
    } else {
      btn.style.display = 'none';
    }
  }

  function _escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function _loadSubcatData() {
    if (window._subcatDataCache) return window._subcatDataCache;
    try { window._subcatDataCache = JSON.parse(localStorage.getItem('adm_subcats') || '{}'); } catch(e) { window._subcatDataCache = {}; }
    return window._subcatDataCache;
  }
  function _saveSubcatData() { localStorage.setItem('adm_subcats', JSON.stringify(window._subcatDataCache || {})); }

  function _getSubcats(mainCat) {
    var data = _loadSubcatData();
    if (data[mainCat] && data[mainCat].initialized) return data[mainCat].list.slice();
    // Default: OC_SUBCATS + dynamic from _oc_items
    var list = (OC_SUBCATS[mainCat] || []).slice();
    (_oc_items || []).forEach(function(it) {
      if ((it.category || 'equipment') === mainCat && it.subcategory && list.indexOf(it.subcategory) < 0) list.push(it.subcategory);
    });
    return list;
  }

  function _fillSubcatSelect(mainCat, selectedVal) {
    var catSel = document.getElementById('adm-eq-cat-select');
    if (!catSel) return;
    var subcats = _getSubcats(mainCat);
    catSel.innerHTML = '<option value="">— Выберите подкатегорию —</option>' +
      subcats.map(function(c) { return '<option value="' + c + '"' + (c === selectedVal ? ' selected' : '') + '>' + c + '</option>'; }).join('');
    if (selectedVal && subcats.indexOf(selectedVal) < 0) {
      catSel.innerHTML += '<option value="' + selectedVal + '" selected>' + selectedVal + '</option>';
    }
  }

  function openSubcatManager(mainCat) {
    var data = _loadSubcatData();
    if (!data[mainCat] || !data[mainCat].initialized) {
      var list = _getSubcats(mainCat);
      data[mainCat] = { list: list, initialized: true };
      _saveSubcatData();
    }
    _renderSubcatMgr(mainCat);
    _bindSubcatMgrEvents();
  }

  function _renderSubcatMgr(mainCat) {
    var old = document.getElementById('adm-subcat-mgr-modal');
    if (old) old.remove();
    var data = _loadSubcatData();
    var list = data[mainCat] ? data[mainCat].list : [];
    var catName = OC_MAIN_CATS[mainCat] || mainCat;
    var modal = document.createElement('div');
    modal.id = 'adm-subcat-mgr-modal';
    modal.className = 'adm-scm-backdrop';
    modal.innerHTML = [
      '<div class="adm-scm-dialog">',
        '<div class="adm-scm-header">',
          '<div>',
            '<div class="adm-scm-title">Подкатегории</div>',
            '<div class="adm-scm-sub">' + _escHtml(catName) + '</div>',
          '</div>',
          '<button onclick="closeSubcatMgr()" class="adm-scm-close">✕</button>',
        '</div>',
        '<div id="adm-scm-list" class="adm-scm-list">',
          list.length ? list.map(function(name, i) { return _subcatMgrRow(name, i, mainCat); }).join('') :
            '<div class="adm-scm-empty">Список пуст</div>',
        '</div>',
        '<div class="adm-scm-footer-add">',
          '<input id="adm-scm-new-input" type="text" placeholder="Новая подкатегория..." class="adm-scm-new-inp">',
          '<button id="adm-scm-add-btn" class="adm-scm-add-btn">+ Добавить</button>',
        '</div>',
        '<div class="adm-scm-footer-actions">',
          '<button id="adm-scm-reset-btn" class="adm-scm-reset-btn">↺ Сбросить к умолчанию</button>',
          '<button onclick="closeSubcatMgr()" class="adm-scm-done-btn">Готово</button>',
        '</div>',
      '</div>'
    ].join('');
    document.body.appendChild(modal);
    window._subcatMgrCat = mainCat;
    modal.addEventListener('click', function(e) { if (e.target === modal) closeSubcatMgr(); });
    document.getElementById('adm-scm-new-input').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') addSubcatFromMgr();
    });
    document.getElementById('adm-scm-add-btn').addEventListener('click', addSubcatFromMgr);
    document.getElementById('adm-scm-reset-btn').addEventListener('click', function() { resetSubcats(mainCat); });
    document.getElementById('adm-scm-new-input').focus();
  }

  function _subcatMgrRow(name, i, mainCat) {
    var count = (_oc_items || []).filter(function(it) {
      return (it.category || 'equipment') === mainCat && it.subcategory === name;
    }).length;
    var hasItems = count > 0;
    var countBadge = '<span class="adm-scm-count">' + count + ' поз.</span>';
    var delBtn = hasItems
      ? '<button id="adm-scm-dbtn-' + i + '" data-idx="' + i + '" data-action="del" title="Нельзя удалить — есть позиции" class="adm-scm-btn-del" disabled>✕</button>'
      : '<button id="adm-scm-dbtn-' + i + '" data-idx="' + i + '" data-action="del" title="Удалить" class="adm-scm-btn-del">✕</button>';
    return [
      '<div id="adm-scm-row-' + i + '" class="adm-scm-row">',
        '<span class="adm-scm-num">' + (i+1) + '.</span>',
        '<span id="adm-scm-lbl-' + i + '" class="adm-scm-lbl">' + _escHtml(name) + '</span>',
        countBadge,
        '<input id="adm-scm-inp-' + i + '" type="text" value="' + _escHtml(name) + '" class="adm-scm-rename-inp" style="display:none">',
        '<button id="adm-scm-ebtn-' + i + '" data-idx="' + i + '" data-action="edit" title="Переименовать" class="adm-scm-btn-edit">✎</button>',
        '<button id="adm-scm-sbtn-' + i + '" data-idx="' + i + '" data-action="save" title="Сохранить" class="adm-scm-btn-save" style="display:none">✓</button>',
        delBtn,
      '</div>'
    ].join('');
  }

  function _bindSubcatMgrEvents() {
    var list = document.getElementById('adm-scm-list');
    if (!list) return;
    list.addEventListener('click', function(e) {
      var btn = e.target.closest('button[data-action]');
      if (!btn) return;
      var i = parseInt(btn.dataset.idx);
      var action = btn.dataset.action;
      if (action === 'edit') {
        document.getElementById('adm-scm-lbl-' + i).style.display = 'none';
        document.getElementById('adm-scm-inp-' + i).style.display = '';
        document.getElementById('adm-scm-ebtn-' + i).style.display = 'none';
        document.getElementById('adm-scm-sbtn-' + i).style.display = '';
        var inp = document.getElementById('adm-scm-inp-' + i);
        inp.focus(); inp.select();
        inp.onkeydown = function(ev) {
          if (ev.key === 'Enter') _applySubcatRename(i);
          if (ev.key === 'Escape') { _cancelSubcatRename(i); }
        };
      } else if (action === 'save') {
        _applySubcatRename(i);
      } else if (action === 'del') {
        if (btn.disabled) return;
        var data = _loadSubcatData();
        var cat = window._subcatMgrCat;
        data[cat].list.splice(i, 1);
        _saveSubcatData();
        _renderSubcatMgr(cat);
        _bindSubcatMgrEvents();
      }
    });
  }

  function _applySubcatRename(i) {
    var inp = document.getElementById('adm-scm-inp-' + i);
    var newName = inp ? inp.value.trim() : '';
    if (!newName) return;
    var data = _loadSubcatData();
    var cat = window._subcatMgrCat;
    data[cat].list[i] = newName;
    _saveSubcatData();
    _cancelSubcatRename(i);
    var lbl = document.getElementById('adm-scm-lbl-' + i);
    if (lbl) lbl.textContent = newName;
  }

  function _cancelSubcatRename(i) {
    var data = _loadSubcatData();
    var cat = window._subcatMgrCat;
    var orig = data[cat] && data[cat].list[i] ? data[cat].list[i] : '';
    var inp = document.getElementById('adm-scm-inp-' + i);
    if (inp) { inp.style.display = 'none'; inp.value = orig; }
    var lbl = document.getElementById('adm-scm-lbl-' + i);
    if (lbl) lbl.style.display = '';
    var ebtn = document.getElementById('adm-scm-ebtn-' + i);
    if (ebtn) ebtn.style.display = '';
    var sbtn = document.getElementById('adm-scm-sbtn-' + i);
    if (sbtn) sbtn.style.display = 'none';
  }

  function addSubcatFromMgr() {
    var inp = document.getElementById('adm-scm-new-input');
    if (!inp) return;
    var name = inp.value.trim();
    if (!name) return;
    var cat = window._subcatMgrCat;
    var data = _loadSubcatData();
    if (!data[cat]) data[cat] = { list: [], initialized: true };
    if (data[cat].list.indexOf(name) >= 0) {
      inp.style.outline = '2px solid #cc4444';
      setTimeout(function() { inp.style.outline = ''; }, 1500);
      return;
    }
    data[cat].list.push(name);
    _saveSubcatData();
    inp.value = '';
    _renderSubcatMgr(cat);
    _bindSubcatMgrEvents();
    var newInp = document.getElementById('adm-scm-new-input');
    if (newInp) newInp.focus();
  }

  function resetSubcats(mainCat) {
    if (!confirm('Сбросить список подкатегорий к умолчанию? Все изменения будут удалены.')) return;
    var data = _loadSubcatData();
    delete data[mainCat];
    _saveSubcatData();
    openSubcatManager(mainCat);
  }

  function closeSubcatMgr() {
    var modal = document.getElementById('adm-subcat-mgr-modal');
    if (modal) modal.remove();
    // Обновить dropdown в drawer
    var mainCatSel = document.getElementById('adm-eq-main-cat');
    var catSel = document.getElementById('adm-eq-cat-select');
    if (mainCatSel && catSel) _fillSubcatSelect(mainCatSel.value, catSel.value);
  }

  // Экспорт в window для доступа из inline onclick
  window.openSubcatManager = openSubcatManager;
  window.closeSubcatMgr = closeSubcatMgr;
  window.addSubcatFromMgr = addSubcatFromMgr;
  window.resetSubcats = resetSubcats;

  function openEqDrawer(item) {
    _oc_edit_id = item ? item.id : null;
    var title = document.getElementById('adm-eq-drawer-title');
    if (title) title.textContent = item ? 'Редактировать позицию' : 'Добавить позицию';
    // Populate main category select
    var mainCatSel = document.getElementById('adm-eq-main-cat');
    if (mainCatSel) {
      var curMainCat = item ? (item.category || 'equipment') : (_oc_main_tab || 'equipment');
      mainCatSel.innerHTML = Object.entries(OC_MAIN_CATS).map(function(e) {
        return '<option value="' + e[0] + '"' + (e[0] === curMainCat ? ' selected' : '') + '>' + e[1] + '</option>';
      }).join('');
      // Repopulate subcategory select when main cat changes
      mainCatSel.onchange = function() { _fillSubcatSelect(mainCatSel.value, null); };
    }
    var curMainCat2 = item ? (item.category || 'equipment') : (_oc_main_tab || 'equipment');
    _fillSubcatSelect(curMainCat2, item ? item.subcategory : null);
    var fields = { 'adm-eq-url-input': item ? (item.url||'') : '',
                   'adm-eq-name': item ? (item.name||'') : '',
                   'adm-eq-price': item ? (item.price||'') : '',
                   'adm-eq-photo': item ? (item.photo||'') : '',
                   'adm-eq-sort-order': item ? (item.sort_order !== undefined ? item.sort_order : 0) : 0,
                   'adm-eq-description': item ? (item.description||'') : '',
                   'adm-eq-promo-code': item ? (item.promo_code||'') : '',
                   'adm-eq-promo-expires': item ? (item.promo_expires||'') : '' };
    Object.keys(fields).forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.value = fields[id];
    });
    var prev = document.getElementById('adm-eq-photo-preview');
    if (prev) {
      var photoVal = item && item.photo ? item.photo : '';
      prev.src = photoVal;
      prev.style.display = photoVal ? 'block' : 'none';
    }
    // Checkboxes
    var isPubEl = document.getElementById('adm-eq-is-public');
    var isFeatEl = document.getElementById('adm-eq-is-featured');
    if (isPubEl) isPubEl.checked = item ? (item.is_public !== 0) : true;
    if (isFeatEl) isFeatEl.checked = item ? !!item.is_featured : false;
    document.getElementById('adm-eq-drawer').classList.add('open');
    document.getElementById('adm-eq-drawer-backdrop').classList.add('open');
    document.body.style.overflow = 'hidden';
    // Показать статус GPT-ключа
    var statusEl = document.getElementById('adm-eq-ai-status');
    if (statusEl) {
      var hasKey = !!localStorage.getItem('adm_openai_key');
      statusEl.textContent = hasKey ? '✅ GPT-ключ настроен — категория определится автоматически' : '🔑 Нет GPT-ключа — нажмите 🔑 чтобы добавить OpenAI ключ для автоопределения категории';
      statusEl.style.color = hasKey ? '#417033' : '#6b7280';
    }
  }

  function closeEqDrawer() {
    document.getElementById('adm-eq-drawer').classList.remove('open');
    document.getElementById('adm-eq-drawer-backdrop').classList.remove('open');
    document.body.style.overflow = '';
    // Сбрасываем состояние кнопок — drawer переиспользуется
    var saveBtn = document.getElementById('adm-eq-save-btn');
    if (saveBtn) saveBtn.disabled = false;
    var aiBtn = document.getElementById('adm-eq-ai-btn');
    if (aiBtn) { aiBtn.disabled = false; aiBtn.innerHTML = '✨ Заполнить автоматически'; }
  }

  function saveEqItem() {
    var nameEl = document.getElementById('adm-eq-name');
    var catSel = document.getElementById('adm-eq-cat-select');
    var newCatEl = document.getElementById('adm-eq-new-cat');
    var name = nameEl ? nameEl.value.trim() : '';
    if (!name) { alert('Укажите название'); return; }
    var cat = catSel ? catSel.value : '';
    if (!cat && newCatEl) cat = newCatEl.value.trim();
    if (!cat) { alert('Укажите категорию'); return; }
    var priceEl = document.getElementById('adm-eq-price');
    var photoEl = document.getElementById('adm-eq-photo');
    var urlEl = document.getElementById('adm-eq-url-input');
    var mainCatEl = document.getElementById('adm-eq-main-cat');
    var isPubEl = document.getElementById('adm-eq-is-public');
    var isFeatEl = document.getElementById('adm-eq-is-featured');
    var sortEl = document.getElementById('adm-eq-sort-order');
    var descEl = document.getElementById('adm-eq-description');
    var promoCodeEl = document.getElementById('adm-eq-promo-code');
    var promoExpiresEl = document.getElementById('adm-eq-promo-expires');
    var body = {
      name: name,
      subcategory: cat,
      price: priceEl ? (parseFloat(priceEl.value) || 0) : 0,
      photo: photoEl ? photoEl.value.trim() : '',
      url: urlEl ? urlEl.value.trim() : '',
      category: mainCatEl ? (mainCatEl.value || 'equipment') : 'equipment',
      is_public: isPubEl ? (isPubEl.checked ? 1 : 0) : 1,
      is_featured: isFeatEl ? (isFeatEl.checked ? 1 : 0) : 0,
      sort_order: sortEl ? (parseInt(sortEl.value) || 0) : 0,
      description: descEl ? descEl.value.trim() : '',
      promo_code: promoCodeEl ? promoCodeEl.value.trim().toUpperCase() : '',
      promo_expires: promoExpiresEl ? promoExpiresEl.value : ''
    };
    var btn = document.getElementById('adm-eq-save-btn');
    if (btn) btn.disabled = true;
    var method = _oc_edit_id ? 'PUT' : 'POST';
    var path = _oc_edit_id ? '/admin/oc-library/' + _oc_edit_id : '/admin/oc-library';
    var _savedScrollY = window.scrollY;
    api(method, path, body).then(function(d) {
      if (!d || d.ok === false || d.detail) {
        throw new Error(d && (d.detail || JSON.stringify(d)) || 'Нет ответа от сервера');
      }
      closeEqDrawer();
      loadOcLibrary().then(function() {
        window.scrollTo({ top: _savedScrollY, behavior: 'instant' });
      }).catch(function() {
        window.scrollTo({ top: _savedScrollY, behavior: 'instant' });
      });
    }).catch(function(err) {
      console.error('saveEqItem error:', err);
      alert('Ошибка сохранения: ' + (err && err.message ? err.message : String(err)));
      if (btn) btn.disabled = false;
    });
  }

  function deleteEqItem(id) {
    if (!confirm('Удалить позицию?')) return;
    api('DELETE', '/admin/oc-library/' + id).then(function() {
      loadOcLibrary();
    });
  }

  function bulkDeleteEq() {
    if (!_oc_selected.length) return;
    if (!confirm('Удалить ' + _oc_selected.length + ' позиций?')) return;
    api('POST', '/admin/oc-library/bulk-delete', { ids: _oc_selected }).then(function() {
      _oc_selected = [];
      loadOcLibrary();
    });
  }
