  // ── RENDER ─────────────────────────────────────────────────────
  function sortedFiltered() {
    var q = (document.getElementById('adm-search').value || '').toLowerCase();
    var rows = _users.filter(function(u) {
      if (!((u.email||'').toLowerCase().includes(q) || (u.name||'').toLowerCase().includes(q))) return false;
      if (_filter === 'active') return u.is_active;
      if (_filter === 'wait')   return !u.is_active;
      if (_filter === 'admin')  return u.is_admin;
      if (_filter === 'online') return isOnline(u);
      return true;
    });
    var col = _sort.col, dir = _sort.dir;
    rows.sort(function(a, b) {
      var av = a[col] || '', bv = b[col] || '';
      if (typeof av === 'boolean') { av = av ? 1 : 0; bv = bv ? 1 : 0; }
      return av < bv ? -dir : av > bv ? dir : 0;
    });
    return rows;
  }

  function hasAccess(u, key) {
    if (u.is_admin) return true;
    if (u.access && typeof u.access[key] !== 'undefined') return !!u.access[key];
    if (key === 'author') return !!u.access_author;
    return key === 'drinks' ? !!u.access_drinks : !!u.access_finance;
  }

  function accessBadges(u) {
    var drinks = hasAccess(u, 'drinks');
    var finance = hasAccess(u, 'finance');
    var author = hasAccess(u, 'author');
    return '<div class="adm-access-badges">' +
      '<span class="adm-access-badge ' + (drinks ? 'on' : 'off') + '">Напитки</span>' +
      '<span class="adm-access-badge ' + (finance ? 'on' : 'off') + '">Финансы</span>' +
      '<span class="adm-access-badge ' + (author ? 'on' : 'off') + '">Автор</span>' +
    '</div>';
  }

  function render() {
    var rows = sortedFiltered();
    var total = rows.length;
    var start = (_page - 1) * _perPage;
    var pageRows = rows.slice(start, start + _perPage);

    // Update sort indicators in thead
    var ths = document.querySelectorAll('table.adm-table th[data-sort]');
    ths.forEach(function(th) {
      var c = th.dataset.sort;
      var label = th.dataset.label || (th.dataset.label = th.textContent.replace(/ [▲▼]$/, '').trim());
      th.textContent = label + (c === _sort.col ? (_sort.dir === 1 ? ' ▲' : ' ▼') : '');
    });

    var tbody = document.getElementById('adm-tbody');
    tbody.innerHTML = pageRows.length ? pageRows.map(function(u, i) {
      var onlineDot = isOnline(u) ? ' <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#2d8a56;margin-left:4px;vertical-align:middle" title="Онлайн"></span>' : '';
      return '<tr data-uid="' + u.id + '">' +
        '<td style="color:var(--adm-muted);font-size:12px">' + (start + i + 1) + '</td>' +
        '<td><div style="display:flex;align-items:center;gap:8px">' + avatar(u) + '<div><div style="font-weight:700;font-size:13px">' + (u.email || '') + onlineDot + '</div><div style="font-size:11px;color:var(--adm-muted)">' + (u.name || '—') + '</div></div></div></td>' +
        '<td><span class="adm-badge ' + (u.is_active ? 'active' : 'inactive') + '">' + (u.is_active ? '✓ Активен' : '⏳ Ожидает') + '</span></td>' +
        '<td>' + accessBadges(u) + '</td>' +
        '<td><div class="adm-row-actions">' +
          (u.is_active
            ? '<button class="adm-icon-btn off" title="Заблокировать" data-id="' + u.id + '" data-act="deactivate">🚫</button>'
            : '<button class="adm-icon-btn" title="Активировать" data-id="' + u.id + '" data-act="activate">✅</button>') +
          '<button class="adm-icon-btn" title="Детали" data-id="' + u.id + '" data-act="details">👁</button>' +
        '</div></td>' +
      '</tr>';
    }).join('') : '<tr><td colspan="5" style="text-align:center;color:var(--adm-muted);padding:32px">Нет пользователей</td></tr>';;

    document.getElementById('adm-loading').style.display = 'none';
    document.getElementById('adm-table').style.display = 'table';
    renderPagination(total);
  }

  function renderPagination(total) {
    var pages = Math.ceil(total / _perPage);
    var pag = document.getElementById('adm-pagination');
    if (!pag) return;
    if (pages <= 1) { pag.innerHTML = ''; return; }
    var start = (_page - 1) * _perPage + 1;
    var end = Math.min(_page * _perPage, total);
    var html = '<button class="adm-pag-btn" id="adm-pag-prev" ' + (_page <= 1 ? 'disabled' : '') + '>←</button>';
    for (var p = 1; p <= pages; p++) {
      html += '<button class="adm-pag-btn' + (p === _page ? ' active' : '') + '" data-pg="' + p + '">' + p + '</button>';
    }
    html += '<button class="adm-pag-btn" id="adm-pag-next" ' + (_page >= pages ? 'disabled' : '') + '>→</button>';
    html += '<span id="adm-pag-info">Показано ' + start + '–' + end + ' из ' + total + '</span>';
    pag.innerHTML = html;
  }

  function exportCsv() {
    var rows = sortedFiltered();
    var header = ['ID','Email','Имя','Телефон','Способ входа','Активен','Админ','Напитки','Финансы','Автор','Согласие ПД','Регистрация','Последний вход'];
    var lines = [header.join(';')];
    rows.forEach(function(u) {
      lines.push([
        u.id, u.email, u.name || '',
        u.phone || '',
        u.reg_source === 'yandex' ? 'Яндекс ID' : 'Email / Пароль',
        u.is_active ? 'да' : 'нет',
        u.is_admin  ? 'да' : 'нет',
        hasAccess(u, 'drinks') ? 'да' : 'нет',
        hasAccess(u, 'finance') ? 'да' : 'нет',
        hasAccess(u, 'author') ? 'да' : 'нет',
        u.consent   ? 'да' : 'нет',
        u.created_at || '', u.last_login_at || ''
      ].join(';'));
    });
    var bom = '\uFEFF';
    var blob = new Blob([bom + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'users.csv'; a.click();
    URL.revokeObjectURL(url);
  }
