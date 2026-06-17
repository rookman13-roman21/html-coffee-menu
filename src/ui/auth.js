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

export async function refreshCurrentUser() {
  const token = getToken();
  if (!token) return null;
  try {
    const r = await fetch(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (r.status === 401 || r.status === 403) { clearAuth(); return null; }
    if (!r.ok) return getUser();
    const user = await r.json();
    saveAuth(token, user);
    return user;
  } catch {
    return getUser();
  }
}

export const ACCESS_TABS = {
  drinks: ['cost', 'recipes'],
  finance: ['dashboard', 'sales', 'finmodel'],
};

export function hasAccess(key) {
  const user = getUser();
  if (!user || user.is_admin) return true;
  if (user.access && typeof user.access[key] !== 'undefined') return !!user.access[key];
  const legacyKey = key === 'drinks' ? 'access_drinks' : 'access_finance';
  if (typeof user[legacyKey] !== 'undefined') return !!user[legacyKey];
  return true;
}

export function canAccessTab(tab) {
  if (ACCESS_TABS.drinks.includes(tab)) return hasAccess('drinks') || hasAccess('author');
  if (ACCESS_TABS.finance.includes(tab)) return hasAccess('finance');
  return true;
}

export function getAllowedTabs() {
  return ['dashboard', 'cost', 'sales', 'finmodel', 'recipes'].filter(canAccessTab);
}

export function firstAllowedTab() {
  const allowed = getAllowedTabs();
  if (!allowed.length) return null;
  if (allowed.includes('dashboard')) return 'dashboard';
  if (allowed.includes('recipes')) return 'recipes';
  return allowed[0];
}

export function hasAnyProductAccess() {
  return hasAccess('drinks') || hasAccess('finance') || hasAccess('author');
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
async function authRequest(mode, email, password, name, consent = false, phone = '') {
  const body = { email, password };
  if (mode === 'register' && name) body.name = name;
  if (mode === 'register') body.consent = consent;
  if (mode === 'register' && phone) body.phone = phone;
  const r = await fetch(`${API}/api/auth/${mode}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
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
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      display: flex; align-items: flex-start; justify-content: center;
      padding: 24px 16px;
      font-family: inherit;
    }
    .auth-card {
      background: #fff;
      border-radius: 20px;
      box-shadow: 0 8px 40px rgba(0,0,0,.10);
      padding: 36px 32px 32px;
      width: 100%; max-width: 400px;
      margin: auto;
    }
    #auth-name-field, #auth-phone-field, #auth-consent-field {
      overflow: hidden;
      max-height: 0;
      opacity: 0;
      transition: max-height .2s ease, opacity .15s ease, margin .2s ease;
      margin-bottom: 0;
    }
    #auth-name-field.visible, #auth-phone-field.visible {
      max-height: 80px;
      opacity: 1;
      margin-bottom: 16px;
    }
    #auth-consent-field {
      overflow: hidden;
      max-height: 0;
      opacity: 0;
      transition: max-height .25s ease, opacity .2s ease, margin .25s ease;
      margin-bottom: 0;
    }
    #auth-consent-field.visible {
      max-height: 120px;
      opacity: 1;
      margin-bottom: 16px;
    }
    .auth-consent-label {
      display: flex; align-items: flex-start; gap: 10px;
      font-size: 13px; color: #555; line-height: 1.5; cursor: pointer;
    }
    .auth-consent-label input[type=checkbox] {
      margin-top: 2px; flex-shrink: 0;
      width: 16px; height: 16px; accent-color: #417033; cursor: pointer;
    }
    .auth-consent-label a { color: #417033; text-decoration: underline; text-underline-offset: 2px; }
    .auth-consent-label a:hover { opacity: .75; }
    .auth-logo {
      margin: 0 0 8px; line-height: 0;
    }
    .auth-logo img {
      height: 38px; width: auto;
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
    .auth-link-btn {
      background: none; border: none; padding: 0;
      font-size: 13px; color: #417033; cursor: pointer;
      font-family: inherit; font-weight: 600;
      text-decoration: underline; text-underline-offset: 2px;
    }
    .auth-link-btn:hover { opacity: .75; }
    .auth-forgot-row {
      text-align: right; margin-top: 6px;
    }
    .auth-divider {
      display: flex; align-items: center; gap: 10px;
      margin: 16px 0; color: #bbb; font-size: 12px;
    }
    .auth-divider::before, .auth-divider::after {
      content: ''; flex: 1; height: 1px; background: #e8e6e1;
    }
    .auth-ya-btn {
      width: 100%; padding: 11px; border: 1.5px solid #e0ddd8;
      border-radius: 12px; background: #fff; color: #1a1a1a;
      font-size: 14px; font-weight: 600; font-family: inherit;
      cursor: pointer; display: flex; align-items: center;
      justify-content: center; gap: 9px;
      transition: border-color .15s, box-shadow .15s;
    }
    .auth-ya-btn:hover { border-color: #fc3f1d; box-shadow: 0 0 0 3px rgba(252,63,29,.1); }
    .auth-ya-btn svg { flex-shrink: 0; }
    .auth-footer {
      margin-top: 24px; padding-top: 16px;
      border-top: 1px solid #f0ede8;
      font-size: 11px; color: #aaa; line-height: 1.7;
      text-align: center;
    }
    .auth-footer-docs {
      display: flex; flex-wrap: wrap; justify-content: center; gap: 4px 12px;
      margin-top: 6px;
    }
    .auth-footer-docs a {
      color: #999; text-decoration: underline; text-underline-offset: 2px;
      font-size: 11px; white-space: nowrap;
    }
    .auth-footer-docs a:hover { color: #417033; }
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
        <p class="auth-logo"><img src="https://static.tildacdn.com/tild6131-3765-4030-a666-656363633265/_1_1.svg" alt="Moscow Barista School"></p>
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
          <div class="auth-field" id="auth-name-field">
            <label>Как вас зовут?</label>
            <input type="text" id="auth-name" placeholder="Ваше имя" autocomplete="name">
          </div>
          <div class="auth-field" id="auth-phone-field">
            <label>Номер телефона</label>
            <input type="tel" id="auth-phone" placeholder="+7 (___) ___-__-__" autocomplete="tel" inputmode="tel">
          </div>
          <div class="auth-field">
            <label>Пароль</label>
            <input type="password" id="auth-password" placeholder="••••••••" autocomplete="current-password">
          </div>
          <div class="auth-forgot-row" id="auth-forgot-row">
            <button class="auth-link-btn" id="auth-forgot-btn" type="button">Забыли пароль?</button>
          </div>
          <div id="auth-consent-field">
            <label class="auth-consent-label">
              <input type="checkbox" id="auth-consent">
              <span>Я даю своё <a href="https://docs.google.com/document/d/13Q2Qwov_B2vzTI5qh2c3MNOZ-B3gVtDW9T3vyFkAKY0/preview" target="_blank" rel="noopener">Согласие</a> на обработку персональных данных и ознакомлен с <a href="https://docs.google.com/document/d/1VvQ_XvR-FIq3Xaleas07I-9pfAomrfUNFqPqWFE4H1U/preview" target="_blank" rel="noopener">Политикой обработки персональных данных</a> и <a href="https://docs.google.com/document/d/1JgElyS6jSWw8L-h7ZnTpJRtDN56WyVzhm7m7buY-yJA/preview" target="_blank" rel="noopener">Офертой</a></span>
            </label>
          </div>
          <button class="auth-btn" id="auth-submit">Войти</button>
          <div class="auth-error" id="auth-error"></div>
          <div class="auth-success" id="auth-success"></div>
          <div class="auth-pending-notice" id="auth-pending">
            ⏳ Аккаунт создан и ожидает активации администратором.<br>
            Обычно это занимает до нескольких часов.
          </div>
          <div class="auth-divider">или</div>
          <button class="auth-ya-btn" id="auth-ya-btn" type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="12" fill="#FC3F1D"/><path d="M13.32 6.4H12.1c-1.68 0-2.56.84-2.56 2.1 0 1.4.62 2.06 1.86 2.9l1.04.7-2.96 4.5H7.8l2.74-4.14c-1.58-1.1-2.46-2.16-2.46-3.9 0-2.18 1.52-3.66 3.98-3.66h2.38v11.7H13.32V6.4Z" fill="#fff"/></svg>
            Войти через Яндекс ID
          </button>
        </div>

        <!-- Forgot password panel -->
        <div id="auth-forgot-panel" style="display:none">
          <p style="font-size:14px;color:#555;margin:0 0 20px;line-height:1.5">
            Введите ваш email — пришлём ссылку для сброса пароля.
          </p>
          <div class="auth-field">
            <label>Email</label>
            <input type="email" id="auth-forgot-email" placeholder="you@example.com" autocomplete="email" autocapitalize="none" autocorrect="off">
          </div>
          <button class="auth-btn" id="auth-forgot-submit">Отправить ссылку</button>
          <div class="auth-error" id="auth-forgot-error"></div>
          <div class="auth-success" id="auth-forgot-success"></div>
          <div style="text-align:center;margin-top:14px">
            <button class="auth-link-btn" id="auth-forgot-back">← Назад к входу</button>
          </div>
        </div>

        <!-- Reset password panel -->
        <div id="auth-reset-panel" style="display:none">
          <p style="font-size:14px;color:#555;margin:0 0 20px;line-height:1.5">
            Придумайте новый пароль (минимум 6 символов).
          </p>
          <div class="auth-field">
            <label>Новый пароль</label>
            <input type="password" id="auth-reset-pass" placeholder="••••••••" autocomplete="new-password">
          </div>
          <div class="auth-field">
            <label>Повторите пароль</label>
            <input type="password" id="auth-reset-pass2" placeholder="••••••••" autocomplete="new-password">
          </div>
          <button class="auth-btn" id="auth-reset-submit">Сохранить пароль</button>
          <div class="auth-error" id="auth-reset-error"></div>
          <div class="auth-success" id="auth-reset-success"></div>
        </div>

        <!-- Footer -->
        <div class="auth-footer">
          <div>ИП Суслин Роман Викторович · ИНН 744517097939 · ОГРН 318745600110807</div>
          <div class="auth-footer-docs">
            <a href="https://docs.google.com/document/d/1VvQ_XvR-FIq3Xaleas07I-9pfAomrfUNFqPqWFE4H1U/preview" target="_blank" rel="noopener">Политика персональных данных</a>
            <a href="https://docs.google.com/document/d/1JgElyS6jSWw8L-h7ZnTpJRtDN56WyVzhm7m7buY-yJA/preview" target="_blank" rel="noopener">Оферта</a>
            <a href="https://docs.google.com/document/d/13Q2Qwov_B2vzTI5qh2c3MNOZ-B3gVtDW9T3vyFkAKY0/preview" target="_blank" rel="noopener">Согласие на обработку данных</a>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    let currentMode = 'login';

    const emailEl    = overlay.querySelector('#auth-email');
    const nameEl     = overlay.querySelector('#auth-name');
    const nameField  = overlay.querySelector('#auth-name-field');
    const phoneEl    = overlay.querySelector('#auth-phone');
    const phoneField = overlay.querySelector('#auth-phone-field');
    const passEl     = overlay.querySelector('#auth-password');

    // Нормализация телефона: всегда +7, игнорировать 8/7 в начале
    function normalizePhone(raw) {
      let digits = raw.replace(/\D/g, '');
      if (digits.startsWith('8') || digits.startsWith('7')) digits = digits.slice(1);
      digits = digits.slice(0, 10);
      if (!digits) return '+7';
      let out = '+7';
      if (digits.length > 0) out += ' (' + digits.slice(0, 3);
      if (digits.length >= 3) out += ') ' + digits.slice(3, 6);
      else if (digits.length > 3) out += ') ';
      if (digits.length >= 6) out += '-' + digits.slice(6, 8);
      if (digits.length >= 8) out += '-' + digits.slice(8, 10);
      return out;
    }
    phoneEl.addEventListener('focus', () => {
      if (!phoneEl.value) phoneEl.value = '+7 ';
    });
    phoneEl.addEventListener('blur', () => {
      if (phoneEl.value === '+7 ' || phoneEl.value === '+7') phoneEl.value = '';
    });
    phoneEl.addEventListener('input', () => {
      const prev = phoneEl.value;
      const sel  = phoneEl.selectionStart;
      const norm = normalizePhone(prev);
      phoneEl.value = norm;
      const delta = norm.length - prev.length;
      try { phoneEl.setSelectionRange(sel + delta, sel + delta); } catch(e) {}
    });
    phoneEl.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData).getData('text');
      phoneEl.value = normalizePhone(pasted);
    });
    const submitBtn  = overlay.querySelector('#auth-submit');
    const errorEl    = overlay.querySelector('#auth-error');
    const successEl  = overlay.querySelector('#auth-success');
    const pendingEl  = overlay.querySelector('#auth-pending');

    function setMode(mode) {
      currentMode = mode;
      overlay.querySelectorAll('.auth-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === mode);
      });
      nameField.classList.toggle('visible', mode === 'register');
      phoneField.classList.toggle('visible', mode === 'register');
      overlay.querySelector('#auth-consent-field').classList.toggle('visible', mode === 'register');
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
          const name = nameEl.value.trim();
          const phone = normalizePhone(phoneEl.value.trim());
          const consent = overlay.querySelector('#auth-consent');
          if (!consent.checked) {
            errorEl.textContent = 'Необходимо согласие на обработку персональных данных';
            errorEl.classList.add('visible');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Зарегистрироваться';
            return;
          }
          const d = await authRequest('register', email, password, name, true, phone);
          if (d && d.token && d.user) {
            saveAuth(d.token, d.user);
            const state = await fetchState();
            overlay.remove();
            window._initApp(state);
            return;
          }
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

    // Yandex OAuth
    overlay.querySelector('#auth-ya-btn').addEventListener('click', () => {
      window.location.href = `${API}/api/auth/yandex`;
    });

    // Обработка редиректа после OAuth (oauth_token в URL)
    const _oauthToken = new URLSearchParams(window.location.search).get('oauth_token');
    const _oauthUser  = new URLSearchParams(window.location.search).get('oauth_user');
    if (_oauthToken && _oauthUser) {
      try {
        const _user = JSON.parse(decodeURIComponent(_oauthUser));
        saveAuth(_oauthToken, _user);
        // Убираем параметры из URL
        window.history.replaceState({}, '', window.location.pathname);
        fetchState().then(state => { overlay.remove(); resolve(state); });
        return;
      } catch { /* ignore, show form */ }
    }
    const _authError = new URLSearchParams(window.location.search).get('auth_error');
    if (_authError) {
      const _errMsg = _authError === 'account_inactive' ? 'Аккаунт ожидает активации администратором' : 'Ошибка входа через Яндекс';
      errorEl.textContent = _errMsg;
      errorEl.classList.add('visible');
      window.history.replaceState({}, '', window.location.pathname);
    }
    const forgotBtn    = overlay.querySelector('#auth-forgot-btn');
    const forgotPanel  = overlay.querySelector('#auth-forgot-panel');
    const mainForm     = overlay.querySelector('#auth-form');
    const tabsEl       = overlay.querySelector('.auth-tabs');
    const forgotEmailEl = overlay.querySelector('#auth-forgot-email');
    const forgotSubmit = overlay.querySelector('#auth-forgot-submit');
    const forgotError  = overlay.querySelector('#auth-forgot-error');
    const forgotSuccess= overlay.querySelector('#auth-forgot-success');
    const forgotBack   = overlay.querySelector('#auth-forgot-back');

    function showForgotPanel() {
      mainForm.style.display = 'none';
      tabsEl.style.display = 'none';
      forgotPanel.style.display = '';
      forgotEmailEl.value = emailEl.value || '';
      forgotEmailEl.focus();
    }

    function showMainPanel() {
      forgotPanel.style.display = 'none';
      tabsEl.style.display = '';
      mainForm.style.display = '';
      emailEl.focus();
    }

    forgotBtn.addEventListener('click', showForgotPanel);
    forgotBack.addEventListener('click', showMainPanel);

    forgotSubmit.addEventListener('click', async () => {
      const email = forgotEmailEl.value.trim().toLowerCase();
      forgotError.classList.remove('visible');
      forgotSuccess.classList.remove('visible');
      if (!email) {
        forgotError.textContent = 'Введите email';
        forgotError.classList.add('visible');
        return;
      }
      forgotSubmit.disabled = true;
      forgotSubmit.textContent = '...';
      try {
        const r = await fetch(`${API}/api/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const d = await r.json();
        if (d.email_sent === false) {
          forgotSuccess.textContent = 'Ссылка создана. Обратитесь к администратору для её получения.';
        } else {
          forgotSuccess.textContent = 'Ссылка отправлена на ' + email + '. Проверьте почту.';
        }
        forgotSuccess.classList.add('visible');
      } catch (e) {
        forgotError.textContent = 'Ошибка сети';
        forgotError.classList.add('visible');
      } finally {
        forgotSubmit.disabled = false;
        forgotSubmit.textContent = 'Отправить ссылку';
      }
    });

    forgotEmailEl.addEventListener('keydown', e => { if (e.key === 'Enter') forgotSubmit.click(); });

    // ─── RESET PASSWORD (по токену из URL) ──────────────────────────────────
    const resetPanel  = overlay.querySelector('#auth-reset-panel');
    const resetPass   = overlay.querySelector('#auth-reset-pass');
    const resetPass2  = overlay.querySelector('#auth-reset-pass2');
    const resetSubmit = overlay.querySelector('#auth-reset-submit');
    const resetError  = overlay.querySelector('#auth-reset-error');
    const resetSuccess= overlay.querySelector('#auth-reset-success');

    const urlParams   = new URLSearchParams(window.location.search);
    const resetToken  = urlParams.get('reset_token');

    if (resetToken) {
      // Показываем форму сброса сразу
      mainForm.style.display = 'none';
      tabsEl.style.display = 'none';
      resetPanel.style.display = '';
      overlay.querySelector('.auth-sub').textContent = 'Создайте новый пароль';
      resetPass.focus();
    }

    resetSubmit.addEventListener('click', async () => {
      const p1 = resetPass.value;
      const p2 = resetPass2.value;
      resetError.classList.remove('visible');
      resetSuccess.classList.remove('visible');
      if (!p1 || p1.length < 6) {
        resetError.textContent = 'Пароль минимум 6 символов';
        resetError.classList.add('visible');
        return;
      }
      if (p1 !== p2) {
        resetError.textContent = 'Пароли не совпадают';
        resetError.classList.add('visible');
        return;
      }
      resetSubmit.disabled = true;
      resetSubmit.textContent = '...';
      try {
        const r = await fetch(`${API}/api/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: resetToken, password: p1 })
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.detail || 'Ошибка');
        resetSuccess.textContent = '✓ Пароль изменён! Переходим к входу...';
        resetSuccess.classList.add('visible');
        // Убираем токен из URL
        window.history.replaceState({}, '', window.location.pathname);
        setTimeout(() => {
          resetPanel.style.display = 'none';
          tabsEl.style.display = '';
          mainForm.style.display = '';
          overlay.querySelector('.auth-sub').textContent = 'Управление кофейней — вход в аккаунт';
          setMode('login');
          emailEl.focus();
        }, 2000);
      } catch (e) {
        resetError.textContent = e.message;
        resetError.classList.add('visible');
        resetSubmit.disabled = false;
        resetSubmit.textContent = 'Сохранить пароль';
      }
    });

    [resetPass, resetPass2].forEach(el => {
      el.addEventListener('keydown', e => { if (e.key === 'Enter') resetSubmit.click(); });
    });
  });
}

/** Выход — очистить токен и перезагрузить */
export function logout() {
  clearAuth();
  location.reload();
}
