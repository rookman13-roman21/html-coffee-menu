  // ── LOAD ───────────────────────────────────────────────────────
  function load() {
    document.getElementById('adm-loading').style.display = 'block';
    document.getElementById('adm-table').style.display = 'none';
    api('GET', '/admin/users')
      .then(function(users) { _users = users; render(); updateStats(); })
      .catch(function(e) { toast('❌ Ошибка загрузки: ' + e.message); });
  }

  // ── AUTH ───────────────────────────────────────────────────────
  function showPanel(email) {
    document.getElementById('adm-me').textContent = email;
    document.getElementById('adm-login').style.display = 'none';
    document.getElementById('adm-panel').style.display = 'block';
    load();
  }

  function doLogout() {
    _token = ''; localStorage.removeItem('adm_token');
    document.getElementById('adm-panel').style.display = 'none';
    document.getElementById('adm-login').style.display = 'block';
  }

  function doLogin() {
    var btn = document.getElementById('adm-login-btn');
    var err = document.getElementById('adm-login-err');
    var email = document.getElementById('adm-email').value.trim().toLowerCase();
    var pass  = document.getElementById('adm-pass').value;
    err.textContent = '';
    if (!email || !pass) { err.textContent = 'Введите email и пароль'; return; }
    btn.disabled = true; btn.textContent = 'Вход…';
    api('POST', '/auth/login', { email: email, password: pass })
      .then(function(d) {
        if (!d.token) throw new Error(d.detail || d.message || 'Неверные данные');
        _token = d.token;
        localStorage.setItem('adm_token', _token);
        return api('GET', '/auth/me');
      })
      .then(function(me) {
        if (!me.is_admin) { err.textContent = '⛔ Нет прав администратора'; _token = ''; localStorage.removeItem('adm_token'); return; }
        showPanel(me.email);
      })
      .catch(function(e) { err.textContent = '❌ ' + (e.message || 'Ошибка входа'); })
      .finally(function() { btn.disabled = false; btn.textContent = 'Войти'; });
  }

