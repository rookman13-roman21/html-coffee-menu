// src/ui/auth.js — JWT auth gate for Coffee Menu SaaS
// API base — same origin in prod, configurable via import.meta.env in dev
const API = import.meta.env.VITE_API_URL || '';

const TOKEN_KEY = 'cm_token';
const USER_KEY  = 'cm_user';

export function getToken()  { return localStorage.getItem(TOKEN_KEY); }
export function getUser()   { try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; } }
export function isLoggedIn(){ return !!getToken(); }

function saveAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY,  JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/** Загрузить стейт с сервера. Возвращает объект state или null */
export async function fetchState() {
  const token = getToken();
  if (!token) return null;
  try {
    const r = await fetch(`${API}/api/state`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (r.status === 401) { clearAuth(); return null; }
    if (!r.ok) return null;
    const d = await r.json();
    return d.state || null;
  } catch { return null; }
}

/** Сохранить стейт на сервер. Тихо при ошибке. */
export async function pushState(state) {
  const token = getToken();
  if (!token) return;
  try {
    await fetch(`${API}/api/state`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ state })
    });
  } catch { /* silent — state already in localStorage */ }
}

/** Выполнить login/register. mode = 'login' | 'register' */
async function authRequest(mode, email, password) {
  const r = await fetch(`${API}/api/auth/${mode}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const d = await r.json();
  if (!r.ok) {
    const detail = d.detail || d.message || 'Ошибка';
    const msg = Array.isArray(detail)
      ? detail.map(e => e.msg || JSON.stringify(e)).join('; ')
      : (typeof detail === 'string' ? detail : JSON.stringify(detail));
    throw new Error(msg);
  }
  return d; // { access_token, user }
}

// ─── UI ────────────────────────────────────────────────────────────────────────

function injectStyles() {
  if (document.getElementById('auth-styles')) return;
  const s = document.createElement('style');
  s.id = 'auth-styles';
  s.textContent = `
    #auth-overlay {
      position: fixed; inset: 0; z-index: 9999;
      background: #f5f4f0;
      display: flex; align-items: center; justify-content: center;
      padding: 16px;
      font-family: inherit;
    }
    .auth-card {
      background: #fff;
      border-radius: 20px;
      box-shadow: 0 8px 40px rgba(0,0,0,.10);
      padding: 36px 32px 32px;
      width: 100%; max-width: 400px;
    }
    .auth-logo {
      font-size: 22px; font-weight: 800; color: #1a1a1a;
      margin: 0 0 4px; letter-spacing: -.02em;
    }
    .auth-sub {
      font-size: 13px; color: #888; margin: 0 0 28px;
    }
    .auth-tabs {
      display: flex; gap: 0;
      background: #f5f4f0; border-radius: 10px;
      padding: 3px; margin-bottom: 24px;
    }
    .auth-tab {
      flex: 1; padding: 8px 0; border: none; cursor: pointer;
      background: none; border-radius: 8px;
      font-size: 13px; font-weight: 600; color: #888;
      font-family: inherit; transition: all .15s;
    }
    .auth-tab.active {
      background: #fff; color: #1a1a1a;
      box-shadow: 0 1px 6px rgba(0,0,0,.08);
    }
    .auth-field { margin-bottom: 14px; }
    .auth-field label { display: block; font-size: 12px; font-weight: 600; color: #555; margin-bottom: 5px; }
    .auth-field input {
      width: 100%; box-sizing: border-box;
      border: 1.5px solid #e0ddd8; border-radius: 10px;
      padding: 10px 12px; font-size: 14px; font-family: inherit;
      background: #faf9f7; color: #1a1a1a; outline: none;
      transition: border-color .15s, box-shadow .15s;
    }
    .auth-field input:focus {
      border-color: #417033; background: #fff;
      box-shadow: 0 0 0 3px rgba(65,112,51,.10);
    }
    .auth-btn {
      width: 100%; padding: 12px; border: none; border-radius: 12px;
      background: #417033; color: #fff;
      font-size: 14px; font-weight: 700; font-family: inherit;
      cursor: pointer; margin-top: 4px;
      transition: opacity .15s, transform .12s;
    }
    .auth-btn:hover { opacity: .88; transform: translateY(-1px); }
    .auth-btn:active { transform: translateY(0); }
    .auth-btn:disabled { opacity: .5; cursor: not-allowed; transform: none; }
    .auth-error {
      background: #fef2f2; border: 1.5px solid #fca5a5;
      border-radius: 10px; padding: 10px 12px;
      font-size: 13px; color: #b91c1c; margin-top: 12px;
      display: none;
    }
    .auth-error.visible { display: block; }
    .auth-success {
      background: #f0fdf4; border: 1.5px solid #86efac;
      border-radius: 10px; padding: 10px 12px;
      font-size: 13px; color: #166534; margin-top: 12px;
      display: none;
    }
    .auth-success.visible { display: block; }
    .auth-pending-notice {
      background: #fffbeb; border: 1.5px solid #fcd34d;
      border-radius: 10px; padding: 12px 14px;
      font-size: 13px; color: #92400e; margin-top: 12px;
      display: none; line-height: 1.5;
    }
    .auth-pending-notice.visible { display: block; }
  `;
  document.head.appendChild(s);
}

/** Показать форму входа/регистрации. Вернуть Promise<state|null> */
export function showAuthScreen() {
  return new Promise(resolve => {
    injectStyles();

    const overlay = document.createElement('div');
    overlay.id = 'auth-overlay';
    overlay.innerHTML = `
      <div class="auth-card">
        <p class="auth-logo">☕ Coffee Menu</p>
        <p class="auth-sub">Управление кофейней — вход в аккаунт</p>
        <div class="auth-tabs">
          <button class="auth-tab active" data-tab="login">Войти</button>
          <button class="auth-tab" data-tab="register">Регистрация</button>
        </div>
        <div id="auth-form">
          <div class="auth-field">
            <label>Email</label>
            <input type="email" id="auth-email" placeholder="you@example.com" autocomplete="email">
          </div>
          <div class="auth-field">
            <label>Пароль</label>
            <input type="password" id="auth-password" placeholder="••••••••" autocomplete="current-password">
          </div>
          <button class="auth-btn" id="auth-submit">Войти</button>
          <div class="auth-error" id="auth-error"></div>
          <div class="auth-success" id="auth-success"></div>
          <div class="auth-pending-notice" id="auth-pending">
            ⏳ Аккаунт создан и ожидает активации администратором.<br>
            Обычно это занимает до нескольких часов.
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    let currentMode = 'login';

    const emailEl    = overlay.querySelector('#auth-email');
    const passEl     = overlay.querySelector('#auth-password');
    const submitBtn  = overlay.querySelector('#auth-submit');
    const errorEl    = overlay.querySelector('#auth-error');
    const successEl  = overlay.querySelector('#auth-success');
    const pendingEl  = overlay.querySelector('#auth-pending');

    function setMode(mode) {
      currentMode = mode;
      overlay.querySelectorAll('.auth-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === mode);
      });
      submitBtn.textContent = mode === 'login' ? 'Войти' : 'Зарегистрироваться';
      errorEl.classList.remove('visible');
      successEl.classList.remove('visible');
      pendingEl.classList.remove('visible');
    }

    overlay.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => setMode(tab.dataset.tab));
    });

    // Enter key
    [emailEl, passEl].forEach(el => {
      el.addEventListener('keydown', e => { if (e.key === 'Enter') submitBtn.click(); });
    });

    submitBtn.addEventListener('click', async () => {
      const email    = emailEl.value.trim();
      const password = passEl.value;

      errorEl.classList.remove('visible');
      successEl.classList.remove('visible');
      pendingEl.classList.remove('visible');

      if (!email || !password) {
        errorEl.textContent = 'Заполните email и пароль';
        errorEl.classList.add('visible');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = '...';

      try {
        if (currentMode === 'register') {
          await authRequest('register', email, password);
          pendingEl.classList.add('visible');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Зарегистрироваться';
          return;
        }

        // login
        const d = await authRequest('login', email, password);
        saveAuth(d.token, d.user);

        // загружаем стейт с сервера
        const state = await fetchState();
        overlay.remove();
        resolve(state);

      } catch (e) {
        errorEl.textContent = e.message;
        errorEl.classList.add('visible');
        submitBtn.disabled = false;
        submitBtn.textContent = currentMode === 'login' ? 'Войти' : 'Зарегистрироваться';
      }
    });

    emailEl.focus();
  });
}

/** Выход — очистить токен и перезагрузить */
export function logout() {
  clearAuth();
  location.reload();
}
