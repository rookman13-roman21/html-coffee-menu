  // ── SUPPLIERS FUNCTIONS ─────────────────────────────────────────
  function loadSuppliers() {
    var loading = document.getElementById('adm-sup-loading');
    var table = document.getElementById('adm-sup-table');
    if (loading) loading.style.display = '';
    if (table) table.style.display = 'none';
    return api('GET', '/admin/suppliers').then(function(data) {
      if (loading) loading.style.display = 'none';
      if (table) table.style.display = '';
      _sup_items = data || [];
      renderSuppliers();
    });
  }

  var _sup_filter = 'all';
  function renderSuppliers() {
    var q = (document.getElementById('adm-sup-search') || {}).value || '';
    var filtered = _sup_items.filter(function(it) {
      var matchQ = !q || (it.name || '').toLowerCase().includes(q.toLowerCase()) || (it.tags || '').toLowerCase().includes(q.toLowerCase());
      if (!matchQ) return false;
      if (_sup_filter === 'featured') return !!it.is_featured;
      if (_sup_filter === 'public') return !!it.is_public;
      if (_sup_filter === 'hidden') return !it.is_public;
      return true;
    });
    var tbody = document.getElementById('adm-sup-tbody');
    if (!tbody) return;
    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--adm-muted)">Нет поставщиков</td></tr>';
      return;
    }
    tbody.innerHTML = filtered.map(function(it) {
      var logo = it.logo_url
        ? '<img src="' + it.logo_url + '" style="width:40px;height:40px;object-fit:contain;border-radius:8px;border:1px solid var(--adm-border);" onerror="this.style.display=\'none\'">' 
        : '<div style="width:40px;height:40px;background:var(--adm-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">🏭</div>';
      var featured = it.is_featured
        ? '<span style="background:#fff3cd;color:#856404;border-radius:6px;padding:2px 7px;font-size:11px;font-weight:700;">⭐ Партнёр</span>'
        : '<span style="color:var(--adm-muted);font-size:12px;">—</span>';
      var pubBadge = it.is_public
        ? '<span style="background:#d4edda;color:#155724;border-radius:6px;padding:2px 7px;font-size:11px;font-weight:700;">✅ Да</span>'
        : '<span style="background:#f8d7da;color:#721c24;border-radius:6px;padding:2px 7px;font-size:11px;font-weight:700;">❌ Нет</span>';
      var subInfo = [];
      if (it.phone) subInfo.push(it.phone);
      if (it.site) subInfo.push('<a href="' + it.site + '" target="_blank" style="color:var(--adm-green);text-decoration:none;" title="' + it.site + '">🔗 Сайт</a>');
      if (it.promo_code) subInfo.push('<span style="background:var(--adm-light);color:var(--adm-green);border-radius:4px;padding:1px 5px;font-size:11px;font-weight:700;">' + it.promo_code + '</span>');
      if (it.tags) subInfo.push('<span style="color:var(--adm-muted);font-size:11px;">' + it.tags + '</span>');
      return '<tr>' +
        '<td>' + logo + '</td>' +
        '<td><strong>' + (it.name || '') + '</strong>' + (subInfo.length ? '<div style="margin-top:3px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:12px;">' + subInfo.join('') + '</div>' : '') + '</td>' +
        '<td>' + featured + '</td>' +
        '<td>' + pubBadge + '</td>' +
        '<td style="text-align:right">' +
          '<button class="adm-row-btn" data-sup-edit="' + it.id + '">✏️</button> ' +
          '<button class="adm-row-btn del" data-sup-del="' + it.id + '">🗑</button>' +
        '</td>' +
      '</tr>';
    }).join('');
  }  function openSupDrawer(id) {
    _sup_edit_id = id || null;
    var it = id ? _sup_items.find(function(x) { return x.id === id; }) : null;
    var drawerEl = document.getElementById('adm-sup-drawer');
    if (!drawerEl) return;
    drawerEl.querySelector('#adm-sup-drawer-title').textContent = id ? 'Редактировать поставщика' : 'Новый поставщик';
    drawerEl.querySelector('#adm-sup-name').value = it ? it.name : '';
    drawerEl.querySelector('#adm-sup-phone').value = it ? (it.phone || '') : '';
    drawerEl.querySelector('#adm-sup-site').value = it ? (it.site || '') : '';
    drawerEl.querySelector('#adm-sup-note').value = it ? (it.note || '') : '';
    drawerEl.querySelector('#adm-sup-logo_url').value = it ? (it.logo_url || '') : '';
    drawerEl.querySelector('#adm-sup-promo_code').value = it ? (it.promo_code || '') : '';
    drawerEl.querySelector('#adm-sup-promo_expires').value = it ? (it.promo_expires || '') : '';
    drawerEl.querySelector('#adm-sup-promo_desc').value = it ? (it.promo_desc || '') : '';
    drawerEl.querySelector('#adm-sup-tags').value = it ? (it.tags || '') : '';
    drawerEl.querySelector('#adm-sup-sort_order').value = it ? (it.sort_order || 0) : 0;
    drawerEl.querySelector('#adm-sup-is_public').checked = it ? !!it.is_public : true;
    drawerEl.querySelector('#adm-sup-is_featured').checked = it ? !!it.is_featured : false;
    var prev = drawerEl.querySelector('#adm-sup-logo-preview');
    if (prev) {
      var logoUrl = it ? (it.logo_url || '') : '';
      if (logoUrl) { prev.src = logoUrl; prev.style.display = 'block'; prev.onerror = function(){ prev.style.display='none'; }; }
      else prev.style.display = 'none';
    }
    drawerEl.classList.add('open');
    document.getElementById('adm-sup-drawer-backdrop').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeSupDrawer() {
    var drawerEl = document.getElementById('adm-sup-drawer');
    if (drawerEl) drawerEl.classList.remove('open');
    var bdEl = document.getElementById('adm-sup-drawer-backdrop');
    if (bdEl) bdEl.classList.remove('open');
    document.body.style.overflow = '';
    // Сбрасываем состояние кнопки — drawer переиспользуется для разных поставщиков
    var saveBtn = document.getElementById('adm-sup-save-btn');
    if (saveBtn) saveBtn.disabled = false;
  }

  function saveSupItem() {
    var drawerEl = document.getElementById('adm-sup-drawer');
    if (!drawerEl) return;
    var btn = drawerEl.querySelector('#adm-sup-save-btn');
    var name = drawerEl.querySelector('#adm-sup-name').value.trim();
    if (!name) { alert('Укажите название поставщика'); return; }
    if (btn) btn.disabled = true;
    var body = {
      name: name,
      phone: drawerEl.querySelector('#adm-sup-phone').value.trim(),
      site: drawerEl.querySelector('#adm-sup-site').value.trim(),
      note: drawerEl.querySelector('#adm-sup-note').value.trim(),
      logo_url: drawerEl.querySelector('#adm-sup-logo_url').value.trim(),
      promo_code: drawerEl.querySelector('#adm-sup-promo_code').value.trim(),
      promo_expires: drawerEl.querySelector('#adm-sup-promo_expires').value.trim(),
      promo_desc: drawerEl.querySelector('#adm-sup-promo_desc').value.trim(),
      tags: drawerEl.querySelector('#adm-sup-tags').value.trim(),
      sort_order: parseInt(drawerEl.querySelector('#adm-sup-sort_order').value) || 0,
      is_public: drawerEl.querySelector('#adm-sup-is_public').checked ? 1 : 0,
      is_featured: drawerEl.querySelector('#adm-sup-is_featured').checked ? 1 : 0
    };
    var method = _sup_edit_id ? 'PUT' : 'POST';
    var path = _sup_edit_id ? '/admin/suppliers/' + _sup_edit_id : '/admin/suppliers';
    api(method, path, body).then(function(d) {
      if (!d || d.ok === false || d.detail) throw new Error(d && (d.detail || JSON.stringify(d)) || 'Ошибка');
      closeSupDrawer();
      loadSuppliers();
    }).catch(function(err) {
      alert('Ошибка сохранения: ' + (err && err.message ? err.message : String(err)));
      if (btn) btn.disabled = false;
    });
  }

  function deleteSupItem(id) {
    if (!confirm('Удалить поставщика?')) return;
    api('DELETE', '/admin/suppliers/' + id).then(function() { loadSuppliers(); });
  }

