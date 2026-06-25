  // ── DRAWER ─────────────────────────────────────────────────────
  function _escHtml(s) { return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function _saveNotes(userId, text, statusEl) {
    api('PATCH', '/admin/users/' + userId, { notes: text })
      .then(function(d) {
        var u = _users.find(function(x){ return x.id === userId; });
        if (u) { u.notes = text; if (d.notes_updated_at) u.notes_updated_at = d.notes_updated_at; }
        if (statusEl) {
          var ts = d.notes_updated_at ? ' · ' + fmtDate(d.notes_updated_at) : '';
          statusEl.textContent = '✓ Сохранено' + ts;
          setTimeout(function(){ statusEl.textContent = ''; }, 4000);
        }
      })
      .catch(function() { if (statusEl) statusEl.textContent = '✗ Ошибка'; });
  }

  function _hasAccess(u, key) {
    if (u.is_admin) return true;
    if (u.access && typeof u.access[key] !== 'undefined') return !!u.access[key];
    if (key === 'author') return !!u.access_author;
    return key === 'drinks' ? !!u.access_drinks : !!u.access_finance;
  }

  function _saveAccess(userId, key, enabled, statusEl) {
    var body = {};
    body[key === 'drinks' ? 'access_drinks' : key === 'finance' ? 'access_finance' : 'access_author'] = !!enabled;
    if (statusEl) statusEl.textContent = 'Сохраняем...';
    api('PATCH', '/admin/users/' + userId, body)
      .then(function(d) {
        var u = _users.find(function(x){ return x.id === userId; });
        if (u) {
          u.access = d.access || u.access || {};
          if (d.access) {
            u.access_drinks = !!d.access.drinks;
            u.access_finance = !!d.access.finance;
            u.access_author = !!d.access.author;
          } else if (key === 'drinks') {
            u.access_drinks = !!enabled;
          } else if (key === 'finance') {
            u.access_finance = !!enabled;
          } else {
            u.access_author = !!enabled;
          }
          u.access.drinks = u.access_drinks;
          u.access.finance = u.access_finance;
          u.access.author = u.access_author;
          openDrawer(u);
        }
        render();
        if (statusEl) statusEl.textContent = '✓ Сохранено';
        if (key === 'author' && enabled) {
          toast('✅ Доступ автора включён. Синхронизация с Битрикс запущена.');
          if (typeof loadAuthors === 'function') setTimeout(loadAuthors, 800);
        } else {
          toast('✅ Доступ обновлён');
        }
      })
      .catch(function(e) {
        if (statusEl) statusEl.textContent = '✗ Ошибка';
        toast('❌ ' + e.message);
      });
  }

  function drawerRow(icon, label, val) {
    return '<div class="adm-drawer-row"><div class="adm-drawer-row-icon">' + icon + '</div><div class="adm-drawer-row-content"><div class="adm-drawer-row-label">' + label + '</div><div class="adm-drawer-row-val">' + val + '</div></div></div>';
  }

  function openDrawer(u) {
    var colors = _AV_COLORS;
    var col = colors[(u.id || 0) % colors.length];
    var ch = ((u.name && u.name[0]) || u.email[0] || '?').toUpperCase();
    document.getElementById('adm-drawer-av').style.background = col;
    document.getElementById('adm-drawer-av').textContent = ch;
    document.getElementById('adm-drawer-name').textContent = u.name || '—';
    document.getElementById('adm-drawer-email').textContent = u.email || '';

    var regSourceLabel = u.reg_source === 'yandex'
      ? '<span style="display:inline-flex;align-items:center;gap:6px;font-weight:700;color:#b45e00">🟡 Яндекс ID</span>'
      : '<span style="display:inline-flex;align-items:center;gap:6px;font-weight:700;color:#1a69bb">✉️ Email / Пароль</span>';
    var onlineLabel = isOnline(u)
      ? '<span class="adm-badge online" style="font-size:12px">● Онлайн (24ч)</span>'
      : '<span style="color:var(--adm-muted);font-size:13px;font-weight:600">Оффлайн</span>';
    var statusLabel = u.is_active
      ? '<span class="adm-badge active">✓ Активен</span>'
      : '<span class="adm-badge inactive">⏳ Ожидает активации</span>';
    var roleLabel = u.is_admin
      ? '<span class="adm-badge admin">👑 Администратор</span>'
      : '<span style="color:var(--adm-muted);font-size:13px;font-weight:600">Пользователь</span>';
    var consentLabel = u.consent
      ? '<span class="adm-badge active">✅ Получено' + (u.consent_at ? ' · ' + fmtDate(u.consent_at) : '') + '</span>'
      : '<span class="adm-badge inactive">❌ Не получено</span>';
    var drinksOn = _hasAccess(u, 'drinks');
    var financeOn = _hasAccess(u, 'finance');
    var authorOn = _hasAccess(u, 'author');
    var adminAccessNote = u.is_admin ? '<div class="adm-access-note">Администратор всегда видит все разделы.</div>' : '';

    document.getElementById('adm-drawer-body').innerHTML =
      drawerRow('📧', 'Email', '<span style="color:var(--adm-navy);font-weight:700">' + (u.email || '—') + '</span>') +
      drawerRow('👤', 'Имя', u.name || '<span style="color:var(--adm-muted)">Не указано</span>') +
      drawerRow('📱', 'Телефон', u.phone || '<span style="color:var(--adm-muted)">Не указан</span>') +
      drawerRow('🔐', 'Способ входа', regSourceLabel) +
      drawerRow('🔘', 'Статус', statusLabel) +
      drawerRow('🏷️', 'Роль', roleLabel) +
      '<div class="adm-drawer-row adm-drawer-access-row"><div class="adm-drawer-row-icon">🧩</div><div class="adm-drawer-row-content"><div class="adm-drawer-row-label">Доступ к платформе</div>' +
        '<label class="adm-access-toggle"><span><b>Напитки</b><em>Поставщики и рецептуры</em></span><input type="checkbox" id="adm-access-drinks" data-access-key="drinks" ' + (drinksOn ? 'checked' : '') + (u.is_admin ? ' disabled' : '') + '></label>' +
        '<label class="adm-access-toggle"><span><b>Финансы</b><em>Бюджет, план продаж и финмодель</em></span><input type="checkbox" id="adm-access-finance" data-access-key="finance" ' + (financeOn ? 'checked' : '') + (u.is_admin ? ' disabled' : '') + '></label>' +
        '<label class="adm-access-toggle"><span><b>Автор рецептов</b><em>Профиль автора и публикация на витрину</em></span><input type="checkbox" id="adm-access-author" data-access-key="author" ' + (authorOn ? 'checked' : '') + (u.is_admin ? ' disabled' : '') + '></label>' +
        adminAccessNote +
        '<div id="adm-access-status" class="adm-drawer-notes-status"></div></div></div>' +
      drawerRow('📋', 'Согласие ПД', consentLabel) +
      drawerRow('📅', 'Регистрация', '<span style="color:var(--adm-muted)">' + fmtDate(u.created_at) + '</span>') +
      drawerRow('🕐', 'Последний вход', '<span style="color:var(--adm-muted)">' + fmtDate(u.last_login_at) + '</span>') +
      drawerRow('💻', 'Активность', onlineLabel) +
      '<div class="adm-drawer-row adm-drawer-notes-row"><div class="adm-drawer-row-icon">📝</div><div class="adm-drawer-row-content"><div class="adm-drawer-row-label">Комментарий</div><textarea id="adm-drawer-notes" class="adm-drawer-notes-ta" placeholder="Заметки о пользователе…" maxlength="1000">' + _escHtml(u.notes || '') + '</textarea><div id="adm-drawer-notes-status" class="adm-drawer-notes-status"></div></div></div>';

    // Сохранение заметки при blur
    var notesTa = document.getElementById('adm-drawer-notes');
    var notesStatus = document.getElementById('adm-drawer-notes-status');
    if (u.notes_updated_at) notesStatus.textContent = 'Изменено: ' + fmtDate(u.notes_updated_at);
    var _notesTimer = null;
    notesTa.addEventListener('input', function() {
      notesStatus.textContent = '';
      clearTimeout(_notesTimer);
      _notesTimer = setTimeout(function() { _saveNotes(u.id, notesTa.value, notesStatus); }, 1200);
    });
    notesTa.addEventListener('blur', function() {
      clearTimeout(_notesTimer);
      _saveNotes(u.id, notesTa.value, notesStatus);
    });

    document.querySelectorAll('#adm-drawer [data-access-key]').forEach(function(inp) {
      inp.addEventListener('change', function() {
        _saveAccess(u.id, inp.dataset.accessKey, inp.checked, document.getElementById('adm-access-status'));
      });
    });

    var footer = document.getElementById('adm-drawer-footer');
    footer.innerHTML =
      (u.is_active
        ? '<button class="adm-drawer-btn off" data-id="' + u.id + '" data-act="deactivate">🚫 Заблокировать</button>'
        : '<button class="adm-drawer-btn on" data-id="' + u.id + '" data-act="activate">✅ Активировать</button>') +
      '<button class="adm-drawer-btn reset" data-id="' + u.id + '" data-email="' + (u.email||'').replace(/"/g,'&quot;') + '" data-act="resetpw">🔑 Сброс пароля</button>' +
      (!u.is_admin ? '<button class="adm-drawer-btn adm" data-id="' + u.id + '" data-act="makeadmin">👑 Сделать админом</button>' : '') +
      '<button class="adm-drawer-btn del" data-id="' + u.id + '" data-email="' + (u.email||'').replace(/"/g,'&quot;') + '" data-act="delete">🗑️ Удалить пользователя</button>';

    document.getElementById('adm-drawer').classList.add('open');
    document.getElementById('adm-drawer-backdrop').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    document.getElementById('adm-drawer').classList.remove('open');
    document.getElementById('adm-drawer-backdrop').classList.remove('open');
    document.body.style.overflow = '';
  }
