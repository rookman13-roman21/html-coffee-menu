// src/ui/author.js — author recipe publishing workspace
import { getToken, hasAccess } from './auth.js';

const API = import.meta.env.VITE_API_URL || '';

let _authorLoaded = false;
let _authorLoading = false;
let _authorProfile = null;
let _authorRecipes = [];

function _authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

function _esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function _notify(msg) {
  if (window.showAlert) window.showAlert(msg);
  else alert(msg);
}

function _statusLabel(status) {
  const labels = {
    submitted: 'На проверке',
    published: 'Опубликован',
    rejected: 'На доработке',
    archived: 'Снят',
  };
  return labels[status] || status || 'Черновик';
}

export function authorCanPublish() {
  return hasAccess('author');
}

export function authorPublicationForDrink(drinkId) {
  return _authorRecipes.find(r => String(r.recipe_local_id) === String(drinkId));
}

export function renderAuthorWorkspace() {
  if (!authorCanPublish()) return '';
  setTimeout(() => loadAuthorWorkspace(), 0);
  const profile = _authorProfile || {};
  const rows = _authorRecipes.length
    ? _authorRecipes.map(r => `
      <div class="author-recipe-row">
        <div>
          <b>${_esc(r.title)}</b>
          <span>${_esc(_statusLabel(r.status))}${r.review_comment ? ' · ' + _esc(r.review_comment) : ''}</span>
        </div>
        ${r.status === 'published' && r.public_slug ? `<a href="/recipes/${_esc(r.public_slug)}" target="_blank" rel="noopener">Открыть</a>` : ''}
      </div>
    `).join('')
    : '<div class="author-empty">Пока нет рецептов на публикации.</div>';
  return `
    <section class="author-workspace" id="author-workspace">
      <div class="author-head">
        <div>
          <h3>Кабинет автора</h3>
          <p>Профиль и публикации авторских рецептов.</p>
        </div>
        <button class="btn btn-outline" onclick="loadAuthorWorkspace(true)" title="Обновить"><i data-lucide="refresh-cw" class="icon"></i></button>
      </div>
      <div class="author-grid">
        <div class="author-card">
          <div class="author-card-title">Профиль</div>
          <div class="author-fields">
            <input id="author-full-name" placeholder="ФИО для документов" value="${_esc(profile.full_name || '')}">
            <input id="author-public-name" placeholder="Публичное имя" value="${_esc(profile.public_name || '')}">
            <input id="author-phone" placeholder="Телефон" value="${_esc(profile.phone || '')}">
            <input id="author-telegram" placeholder="Telegram" value="${_esc(profile.telegram || '')}">
            <textarea id="author-bio" placeholder="Коротко об авторе">${_esc(profile.bio || '')}</textarea>
          </div>
          <button class="btn btn-green" onclick="saveAuthorProfile()">Сохранить профиль</button>
        </div>
        <div class="author-card">
          <div class="author-card-title">Публикации</div>
          <div id="author-recipes-list">${_authorLoading && !_authorLoaded ? '<div class="author-empty">Загрузка...</div>' : rows}</div>
        </div>
      </div>
    </section>
  `;
}

export async function loadAuthorWorkspace(force = false) {
  if (!authorCanPublish()) return;
  if (_authorLoading || (_authorLoaded && !force)) return;
  _authorLoading = true;
  try {
    const [profileRes, recipesRes] = await Promise.all([
      fetch(`${API}/api/author/profile`, { headers: _authHeaders() }),
      fetch(`${API}/api/author/recipes`, { headers: _authHeaders() }),
    ]);
    if (!profileRes.ok || !recipesRes.ok) throw new Error('Не удалось загрузить кабинет автора');
    _authorProfile = await profileRes.json();
    _authorRecipes = await recipesRes.json();
    _authorLoaded = true;
    if (window.activeTab === 'recipes' && window.renderRecipes) window.renderRecipes();
  } catch (e) {
    console.error('[author workspace]', e);
  } finally {
    _authorLoading = false;
  }
}

export async function saveAuthorProfile() {
  const body = {
    full_name: document.getElementById('author-full-name')?.value || '',
    public_name: document.getElementById('author-public-name')?.value || '',
    phone: document.getElementById('author-phone')?.value || '',
    telegram: document.getElementById('author-telegram')?.value || '',
    bio: document.getElementById('author-bio')?.value || '',
    email: (window.getUser && window.getUser()?.email) || '',
  };
  try {
    const r = await fetch(`${API}/api/author/profile`, {
      method: 'PUT',
      headers: _authHeaders(),
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error('Не удалось сохранить профиль');
    _authorLoaded = false;
    await loadAuthorWorkspace(true);
    _notify('Профиль автора сохранён');
  } catch (e) {
    _notify(e.message);
  }
}

export async function submitRecipeForPublication(drinkId) {
  if (!authorCanPublish()) return _notify('Доступ автора не выдан');
  const d = (window.DRINKS || []).find(x => Number(x.id) === Number(drinkId));
  if (!d) return _notify('Рецепт не найден');
  const description = prompt('Короткое описание для витрины рецептов', d.process || '') || '';
  const price = d._serverPrice != null ? d._serverPrice : ((window.S && window.S.salePrices && window.S.salePrices[d.id]) || 0);
  const recipe = {
    ingredients: (d.recipe || []).map(ing => ({ ...ing })),
    process: d.process || '',
    quality: d.quality || '',
  };
  const body = {
    recipe_local_id: String(d.id),
    title: d._serverName || d.name,
    group_name: d.group || '',
    volume_ml: Number(d.vol || 0),
    price: Number(price || 0),
    cost: Number(window.calcCost ? window.calcCost(d) : 0),
    recipe,
    public_description: description,
    image_url: d.image || '',
    video_url: d.videoUrl || '',
  };
  try {
    const r = await fetch(`${API}/api/author/recipes`, {
      method: 'POST',
      headers: _authHeaders(),
      body: JSON.stringify(body),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.detail || 'Не удалось отправить рецепт');
    _authorLoaded = false;
    await loadAuthorWorkspace(true);
    _notify('Рецепт отправлен на модерацию');
  } catch (e) {
    _notify(e.message);
  }
}
