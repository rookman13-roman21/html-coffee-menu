  // ── UTILS ──────────────────────────────────────────────────────
  function toast(msg, dur) {
    var t = document.getElementById('adm-toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._t);
    t._t = setTimeout(function(){ t.classList.remove('show'); }, dur || 3000);
  }

  function api(method, path, body) {
    var opts = { method: method, headers: { 'Content-Type': 'application/json' } };
    if (_token) opts.headers['Authorization'] = 'Bearer ' + _token;
    if (body) opts.body = JSON.stringify(body);
    return fetch(API + path, opts).then(function(r){
      if (r.status === 401) { doLogout(); throw new Error('401'); }
      return r.json().catch(function(){ return {}; }).then(function(data) {
        if (!r.ok) {
          var detail = data.detail;
          if (detail && typeof detail === 'object') {
            var labels = detail.missing_labels || detail.missing || [];
            throw new Error((detail.message || ('HTTP ' + r.status)) + (labels.length ? ': ' + labels.join(', ') : ''));
          }
          throw new Error(detail || ('HTTP ' + r.status));
        }
        return data;
      });
    });
  }

  function fmtDate(s) {
    if (!s) return '—';
    var d = new Date(s);
    return d.toLocaleDateString('ru-RU', { day:'2-digit', month:'2-digit', year:'numeric' }) +
      ' ' + d.toLocaleTimeString('ru-RU', { hour:'2-digit', minute:'2-digit' });
  }

  var _AV_COLORS = ['#417033','#e07b00','#6c3fc5','#c44','#1a69bb','#888'];
  function avatar(u) {
    var ch = ((u.name && u.name[0]) || u.email[0] || '?').toUpperCase();
    var col = _AV_COLORS[(u.id || 0) % _AV_COLORS.length];
    return '<span class="adm-av" style="background:' + col + '">' + ch + '</span>';
  }

  function isOnline(u) {
    if (!u.last_login_at) return false;
    return (Date.now() - new Date(u.last_login_at).getTime()) < 86400000;
  }

  function updateStats() {
    var active = _users.filter(function(u){ return u.is_active; }).length;
    var online = _users.filter(isOnline).length;
    document.getElementById('adm-s-total').textContent  = _users.length;
    document.getElementById('adm-s-active').textContent = active;
    document.getElementById('adm-s-wait').textContent   = _users.length - active;
    document.getElementById('adm-s-admin').textContent  = _users.filter(function(u){ return u.is_admin; }).length;
    document.getElementById('adm-s-online').textContent = online;
  }
