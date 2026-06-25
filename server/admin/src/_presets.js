  // ── PRESETS FUNCTIONS ───────────────────────────────────────────
  function loadPresets(fmt) {
    _preset_format = fmt || _preset_format;
    _preset_lib_sub = '';
    _preset_lib_cat = '';
    // Обновить визуальный статус кнопок формата
    document.querySelectorAll('.adm-preset-fmt').forEach(function(b) {
      b.classList.toggle('active', b.dataset.pfmt === _preset_format);
    });
    var listEl = document.getElementById('adm-preset-list');
    if (listEl) listEl.innerHTML = '<div class="adm-preset-empty">Загрузка...</div>';
    var libEl = document.getElementById('adm-preset-lib-list');
    if (libEl) libEl.innerHTML = '<div class="adm-preset-empty">Загрузка...</div>';
    var doLoad = function() {
      api('GET', '/admin/oc-presets/' + _preset_format).then(function(data) {
        _preset_items = data || [];
        _presetClearDirty();
        renderPresets();
        renderPresetLibrary();
        _updateFormatBadges();
      }).catch(function() {
        _preset_items = [];
        _presetClearDirty();
        renderPresets();
        renderPresetLibrary();
      });
    };
    // Если библиотека ещё не загружена — загрузить сначала
    if (!_oc_items.length) {
      loadOcLibrary().then(doLoad);
    } else {
      doLoad();
    }
  }

  function _presetMarkDirty() {
    var btn = document.getElementById('adm-preset-save-btn');
    if (btn) btn.classList.add('dirty');
  }

  function _presetClearDirty() {
    var btn = document.getElementById('adm-preset-save-btn');
    if (btn) btn.classList.remove('dirty');
  }

  function renderPresets() {
    var total = _preset_items.reduce(function(s, it) { return s + (it.price || 0) * (it.qty || 1); }, 0);
    var cnt = document.getElementById('adm-preset-count');
    if (cnt) cnt.textContent = _preset_items.length + ' поз.';
    var totalEl = document.getElementById('adm-preset-total');
    if (totalEl) totalEl.textContent = total ? '≈ ' + total.toLocaleString('ru-RU') + ' ₽' : '';
    // Обновить кнопки форматов со счётчиком
    document.querySelectorAll('.adm-preset-fmt').forEach(function(b) {
      var fmt = b.dataset.pfmt;
      var isCur = fmt === _preset_format;
      var cntSpan = b.querySelector('.adm-preset-fmt-cnt');
      if (isCur && cntSpan) cntSpan.textContent = _preset_items.length ? '(' + _preset_items.length + ')' : '';
    });
    var list = document.getElementById('adm-preset-list');
    if (!list) return;
    if (!_preset_items.length) {
      list.innerHTML = '<div class="adm-preset-empty">Пресет пуст — добавьте позиции из библиотеки →</div>';
      return;
    }
    var catOrder = [];
    var catGroups = {};
    _preset_items.forEach(function(it, i) {
      var cat = it.category || 'equipment';
      if (!catGroups[cat]) {
        catGroups[cat] = [];
        catOrder.push(cat);
      }
      catGroups[cat].push({ item: it, idx: i });
    });
    list.innerHTML = catOrder.map(function(cat) {
      var group = catGroups[cat];
      var groupTotal = group.reduce(function(s, row) {
        return s + ((row.item.price || 0) * (row.item.qty || 1));
      }, 0);
      var groupHead = '<div class="adm-preset-current-cat-head">' +
        '<span>' + _catLabel(cat) + '</span>' +
        '<span>' + group.length + ' поз.' + (groupTotal ? ' · ' + groupTotal.toLocaleString('ru-RU') + ' ₽' : '') + '</span>' +
        '</div>';
      return groupHead + group.map(function(row) {
      var it = row.item;
      var i = row.idx;
      var thumb = it.photo
        ? '<img class="adm-preset-thumb" src="' + it.photo + '" onerror="this.style.display=\'none\'">' 
        : '<div class="adm-preset-thumb-empty">🖼</div>';
      var lineTotal = it.price ? (it.price * (it.qty || 1)).toLocaleString('ru-RU') + ' ₽' : '';
      var unitPrice = it.price ? it.price.toLocaleString('ru-RU') + ' ₽ × ' + (it.qty || 1) : '';
      return '<div class="adm-preset-row" draggable="true" data-drag-idx="' + i + '">' +
        '<span class="adm-preset-drag-handle" title="Перетащить">⠿</span>' +
        thumb +
        '<div class="adm-preset-name-wrap">' +
          '<div class="adm-preset-name">' + (it.name || '') +
            (it.category && it.category !== 'equipment' ? ' <span class="adm-preset-cat-badge">' + _catLabel(it.category) + '</span>' : '') +
          '</div>' +
          (it.price ? '<div class="adm-preset-row-price">' + unitPrice + ' = ' + lineTotal + '</div>' : '') +
        '</div>' +
        '<input class="adm-preset-qty" type="number" min="1" max="99" value="' + (it.qty || 1) + '" data-preset-idx="' + i + '">' +
        '<button class="adm-preset-remove" data-preset-remove="' + i + '" title="Удалить из пресета">✕</button>' +
        '</div>';
      }).join('');
    }).join('');
    // Drag-and-drop
    list.querySelectorAll('.adm-preset-row[draggable]').forEach(function(row) {
      row.addEventListener('dragstart', function(ev) {
        ev.dataTransfer.setData('text/plain', row.dataset.dragIdx);
        row.style.opacity = '.45';
      });
      row.addEventListener('dragend', function() { row.style.opacity = ''; });
      row.addEventListener('dragover', function(ev) { ev.preventDefault(); row.classList.add('drag-over'); });
      row.addEventListener('dragleave', function() { row.classList.remove('drag-over'); });
      row.addEventListener('drop', function(ev) {
        ev.preventDefault();
        row.classList.remove('drag-over');
        var fromIdx = parseInt(ev.dataTransfer.getData('text/plain'));
        var toIdx = parseInt(row.dataset.dragIdx);
        if (fromIdx === toIdx) return;
        var moved = _preset_items.splice(fromIdx, 1)[0];
        _preset_items.splice(toIdx, 0, moved);
        _presetMarkDirty();
        renderPresets();
        renderPresetLibrary();
      });
    });
  }  // Русские названия категорий
  var _catLabels = {
    'renovation':  'Ремонт и отделка',
    'equipment':   'Оборудование',
    'furniture':   'Мебель и интерьер',
    'automation':  'Автоматизация',
    'stock':       'Стартовый склад',
    'branding':    'Брендинг',
    'legal':       'Юридическое оформление',
    'marketing':   'Маркетинг запуска',
    'rent':        'Депозит / аванс аренды',
    'uniform':     'Форма и инвентарь',
    'training':    'Обучение персонала',
    'reserve':     'Оборотный резерв',
    'consumables': 'Расходники',
    'accessories': 'Аксессуары',
    'drinks':      'Напитки',
    'food':        'Еда',
    'packaging':   'Упаковка',
    'other':       'Другое'
  };
  function _catLabel(cat) { return _catLabels[cat] || cat || 'Другое'; }

  function renderPresetLibrary() {
    var q = ((document.getElementById('adm-preset-search') || {}).value || '').toLowerCase();
    // Все публичные позиции (все категории)
    var allItems = _oc_items.filter(function(it) { return it.is_public !== 0; });
    // Собрать уникальные категории и их кол-во
    var cats = {};
    allItems.forEach(function(it) {
      var c = it.category || 'equipment';
      cats[c] = (cats[c] || 0) + 1;
    });
    // Вкладки категорий
    var tabsEl = document.getElementById('adm-preset-subcat-tabs');
    if (tabsEl) {
      var tabHtml = '<button class="adm-lib-tab' + (!_preset_lib_cat ? ' active' : '') + '" data-pcat="">Все <span class="tab-cnt">' + allItems.length + '</span></button>';
      Object.keys(cats).sort().forEach(function(cat) {
        tabHtml += '<button class="adm-lib-tab' + (_preset_lib_cat === cat ? ' active' : '') + '" data-pcat="' + cat + '">' + _catLabel(cat) + ' <span class="tab-cnt">' + cats[cat] + '</span></button>';
      });
      tabsEl.innerHTML = tabHtml;
    }
    // Фильтрация
    var items = allItems.filter(function(it) {
      if (q && !(it.name || '').toLowerCase().includes(q)) return false;
      if (_preset_lib_cat && (it.category || 'equipment') !== _preset_lib_cat) return false;
      if (_preset_hide_added && _preset_items.some(function(p) { return p.lib_item_id === it.id; })) return false;
      return true;
    });
    var libEl = document.getElementById('adm-preset-lib-list');
    if (!libEl) return;
    if (!items.length) { libEl.innerHTML = '<div class="adm-preset-empty">Ничего не найдено</div>'; return; }
    // Группировка: сначала по category, внутри — по subcategory
    var catGroups = {};
    items.forEach(function(it) {
      var cat = it.category || 'equipment';
      var sub = it.subcategory || 'Другое';
      if (!catGroups[cat]) catGroups[cat] = {};
      if (!catGroups[cat][sub]) catGroups[cat][sub] = [];
      catGroups[cat][sub].push(it);
    });
    var html = '';
    var catKeys = Object.keys(catGroups).sort();
    catKeys.forEach(function(cat) {
      // Заголовок категории — только если показываем «Все» и категорий > 1
      if (!_preset_lib_cat && catKeys.length > 1) {
        html += '<div class="adm-preset-lib-cat-head">' + _catLabel(cat) + '</div>';
      }
      var subGroups = catGroups[cat];
      Object.keys(subGroups).sort().forEach(function(sub) {
        html += '<div class="adm-preset-lib-group">' + sub + '</div>';
        subGroups[sub].forEach(function(it) {
          var inPreset = _preset_items.some(function(p) { return p.lib_item_id === it.id; });
          var thumb = it.photo ? '<img class="adm-preset-thumb-sm" src="' + it.photo + '" onerror="this.style.display=\'none\'">' : '';
          var price = it.price ? '<span class="adm-preset-lib-price"> · ' + it.price.toLocaleString('ru-RU') + ' ₽</span>' : '';
          html += '<div class="adm-preset-lib-item">' +
            thumb +
            '<div class="adm-preset-lib-name">' + (it.name || '') + price + '</div>' +
            (inPreset
              ? '<span class="adm-preset-in-badge" title="Уже в пресете">В пресете</span>'
              : '<button class="adm-preset-add-btn" data-plib-id="' + it.id + '" title="Добавить в пресет">+</button>') +
            '</div>';
        });
      });
    });
    libEl.innerHTML = html;
  }

  function savePreset() {
    var btn = document.getElementById('adm-preset-save-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Сохранение...'; }
    api('POST', '/admin/oc-presets/' + _preset_format, {
      items: _preset_items.map(function(it) { return { lib_item_id: it.lib_item_id, qty: it.qty || 1 }; })
    }).then(function() {
      if (btn) { btn.disabled = false; btn.textContent = '💾 Сохранить'; }
      _presetClearDirty();
      _updateFormatBadges();
      var labels = { kiosk: 'Киоск', island: 'Остров', full: 'Полноформат' };
      toast('✅ Пресет «' + (labels[_preset_format] || _preset_format) + '» сохранён');
    }).catch(function(e) {
      if (btn) { btn.disabled = false; btn.textContent = '💾 Сохранить'; }
      toast('❌ Ошибка: ' + (e.message || 'Неизвестно'));
    });
  }

  function confirm_(title, text, onOk, okLabel, okColor) {
    document.getElementById('adm-confirm-title').textContent = title;
    document.getElementById('adm-confirm-text').textContent  = text;
    var okBtn = document.getElementById('adm-confirm-ok');
    okBtn.textContent = okLabel || 'Подтвердить';
    okBtn.style.background = okColor || '#c44';
    okBtn.onclick = function() {
      document.getElementById('adm-confirm').classList.remove('show');
      onOk();
    };
    document.getElementById('adm-confirm').classList.add('show');
  }

  function clearPreset() {
    if (!_preset_items.length) return;
    confirm_('Очистить пресет', 'Удалить все ' + _preset_items.length + ' позиций из пресета?', function() {
      _preset_items = [];
      _presetMarkDirty();
      renderPresets();
      renderPresetLibrary();
    });
  }

  function copyPreset(fromFmt) {
    if (fromFmt === _preset_format) { toast('Это тот же формат'); return; }
    var labels = { kiosk: 'Киоск', island: 'Остров', full: 'Полноформат' };
    api('GET', '/admin/oc-presets/' + fromFmt).then(function(data) {
      if (!data || !data.length) { toast('Пресет «' + (labels[fromFmt] || fromFmt) + '» пуст'); return; }
      confirm_('Скопировать пресет', 'Заменить текущий пресет данными из «' + (labels[fromFmt] || fromFmt) + '»? (' + data.length + ' позиций)', function() {
        _preset_items = data.map(function(it) { return Object.assign({}, it); });
        _presetMarkDirty();
        renderPresets();
        renderPresetLibrary();
        toast('📋 Скопировано из «' + (labels[fromFmt] || fromFmt) + '» — не забудьте сохранить');
      }, 'Скопировать', '#417033');
    }).catch(function() { toast('❌ Не удалось загрузить пресет'); });
  }

  // Обновить счётчики на кнопках форматов (загружаем кол-во из БД)
  var _fmtCounts = {};
  function _updateFormatBadges() {
    _fmtCounts[_preset_format] = _preset_items.length;
    var fmts = ['kiosk', 'island', 'full'];
    fmts.forEach(function(fmt) {
      var el = document.getElementById('adm-fmt-cnt-' + fmt);
      if (!el) return;
      var n = _fmtCounts[fmt];
      el.textContent = n != null ? (n ? '(' + n + ')' : '') : '';
    });
    // Подгрузить count для остальных форматов (без items)
    fmts.filter(function(f) { return f !== _preset_format && _fmtCounts[f] == null; }).forEach(function(fmt) {
      api('GET', '/admin/oc-presets/' + fmt).then(function(data) {
        _fmtCounts[fmt] = (data || []).length;
        var el = document.getElementById('adm-fmt-cnt-' + fmt);
        if (el) el.textContent = _fmtCounts[fmt] ? '(' + _fmtCounts[fmt] + ')' : '';
      }).catch(function() {});
    });
  }
