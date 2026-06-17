// src/ui/public-recipes.js — public author recipe showcase
const API = import.meta.env.VITE_API_URL || '';

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function assetUrl(src) {
  if (!src) return '';
  if (/^https?:\/\//i.test(src) || src.startsWith('data:')) return src;
  return `${API}${src}`;
}

function publicStyles() {
  if (document.getElementById('public-recipes-styles')) return;
  const s = document.createElement('style');
  s.id = 'public-recipes-styles';
  s.textContent = `
    .public-recipes { max-width:1120px; margin:0 auto; padding:32px 18px 80px; }
    .public-recipes-head { display:flex; justify-content:space-between; gap:18px; align-items:flex-end; margin-bottom:24px; }
    .public-recipes h1 { margin:0; color:var(--navy); font-size:34px; line-height:1.1; }
    .public-recipes-sub { margin:8px 0 0; color:var(--muted); font-size:15px; max-width:620px; line-height:1.5; }
    .public-recipes-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:16px; }
    .public-recipe-card { background:#fff; border:1px solid var(--border); border-radius:12px; overflow:hidden; color:inherit; text-decoration:none; box-shadow:0 2px 12px rgba(0,0,0,.05); }
    .public-recipe-card img { width:100%; aspect-ratio:4/3; object-fit:cover; display:block; background:#f4f4f4; }
    .public-recipe-body { padding:14px; }
    .public-recipe-title { font-size:17px; font-weight:900; color:var(--navy); margin:0 0 6px; }
    .public-recipe-meta { display:flex; gap:8px; flex-wrap:wrap; color:var(--muted); font-size:12px; margin-bottom:10px; }
    .public-recipe-desc { color:var(--text); font-size:13px; line-height:1.5; margin:0 0 12px; }
    .public-recipe-author { display:flex; align-items:center; gap:9px; margin:10px 0 12px; color:var(--text); }
    .public-recipe-author-avatar { width:34px; height:34px; border-radius:50%; object-fit:cover; background:#e7f2e3; border:1px solid var(--border); flex:0 0 auto; }
    .public-recipe-author-initial { width:34px; height:34px; border-radius:50%; display:grid; place-items:center; background:#e7f2e3; color:#417033; font-weight:900; flex:0 0 auto; }
    .public-recipe-author b { display:block; color:var(--navy); font-size:13px; line-height:1.2; }
    .public-recipe-author span { display:block; color:var(--muted); font-size:12px; line-height:1.35; margin-top:2px; }
    .public-recipe-price { font-weight:900; color:#417033; }
    .public-recipe-detail { display:grid; grid-template-columns:minmax(0,1fr) 360px; gap:22px; align-items:start; }
    .public-recipe-hero { background:#fff; border:1px solid var(--border); border-radius:12px; overflow:hidden; }
    .public-recipe-hero img { width:100%; max-height:460px; object-fit:cover; display:block; background:#f4f4f4; }
    .public-recipe-hero-body { padding:18px; }
    .public-order-card { background:#fff; border:1px solid var(--border); border-radius:12px; padding:16px; position:sticky; top:86px; }
    .public-order-card h3 { margin:0 0 12px; color:var(--navy); }
    .public-order-card input,.public-order-card textarea { width:100%; box-sizing:border-box; border:1.5px solid #e0ddd8; border-radius:9px; padding:10px 12px; margin-bottom:9px; font:600 13px Mulish,sans-serif; }
    .public-order-card textarea { min-height:86px; resize:vertical; }
    .public-order-msg { margin-top:10px; color:#417033; font-size:13px; font-weight:800; }
    @media(max-width:820px){ .public-recipes-head{display:block}.public-recipe-detail{grid-template-columns:1fr}.public-order-card{position:static} }
  `;
  document.head.appendChild(s);
}

function setupPublicShell() {
  publicStyles();
  document.querySelectorAll('.nav-btn,.mobile-tabbar,.btn-reset,.export-wrap,.loc-switcher').forEach(el => {
    if (el) el.style.display = 'none';
  });
  const main = document.querySelector('.main');
  if (main) main.innerHTML = '<section class="public-recipes"><p>Загрузка...</p></section>';
  return main;
}

export function isPublicRecipesRoute() {
  return location.pathname === '/recipes' || location.pathname.startsWith('/recipes/');
}

export async function renderPublicRecipesApp() {
  const main = setupPublicShell();
  if (!main) return;
  const parts = location.pathname.split('/').filter(Boolean);
  const slug = parts.length > 1 ? parts[1] : '';
  if (slug) return renderPublicRecipeDetail(main, slug);
  const r = await fetch(`${API}/api/public/author-recipes`);
  const recipes = r.ok ? await r.json() : [];
  main.innerHTML = `
    <section class="public-recipes">
      <div class="public-recipes-head">
        <div>
          <h1>Авторские рецепты</h1>
          <p class="public-recipes-sub">Рецепты миксологов Московской школы бариста и участников MBS* MIXOLOGY CUP.</p>
        </div>
      </div>
      <div class="public-recipes-grid">
        ${recipes.length ? recipes.map(recipeCard).join('') : '<p style="color:var(--muted)">Опубликованных рецептов пока нет.</p>'}
      </div>
    </section>
  `;
}

function recipeCard(r) {
  const author = r.author || {};
  const authorName = author.name || 'Moscow Barista School';
  const avatar = assetUrl(author.avatar_url || '');
  return `
    <a class="public-recipe-card" href="/recipes/${esc(r.public_slug || r.id)}">
      ${r.image_url ? `<img src="${esc(r.image_url)}" alt="${esc(r.title)}">` : ''}
      <div class="public-recipe-body">
        <h2 class="public-recipe-title">${esc(r.title)}</h2>
        <div class="public-recipe-meta">
          ${r.volume_ml ? `<span>${Number(r.volume_ml)} мл</span>` : ''}
        </div>
        <div class="public-recipe-author">
          ${avatar ? `<img class="public-recipe-author-avatar" src="${esc(avatar)}" alt="${esc(authorName)}">` : `<span class="public-recipe-author-initial">${esc(authorName.charAt(0) || 'M')}</span>`}
          <div>
            <b>${esc(authorName)}</b>
            ${author.bio ? `<span>${esc(author.bio)}</span>` : ''}
          </div>
        </div>
        <p class="public-recipe-desc">${esc(r.public_description || '')}</p>
        <div class="public-recipe-price">${Number(r.price || 0).toLocaleString('ru-RU')} ₽</div>
      </div>
    </a>
  `;
}

async function renderPublicRecipeDetail(main, slug) {
  const r = await fetch(`${API}/api/public/author-recipes/${encodeURIComponent(slug)}`);
  if (!r.ok) {
    main.innerHTML = '<section class="public-recipes"><h1>Рецепт не найден</h1><p><a href="/recipes">Вернуться к витрине</a></p></section>';
    return;
  }
  const recipe = await r.json();
  const author = recipe.author || {};
  const authorName = author.name || 'Moscow Barista School';
  const avatar = assetUrl(author.avatar_url || '');
  main.innerHTML = `
    <section class="public-recipes">
      <p><a href="/recipes">← Все рецепты</a></p>
      <div class="public-recipe-detail">
        <article class="public-recipe-hero">
          ${recipe.image_url ? `<img src="${esc(recipe.image_url)}" alt="${esc(recipe.title)}">` : ''}
          <div class="public-recipe-hero-body">
            <h1>${esc(recipe.title)}</h1>
            <p class="public-recipes-sub">${esc(recipe.public_description || '')}</p>
            <div class="public-recipe-author">
              ${avatar ? `<img class="public-recipe-author-avatar" src="${esc(avatar)}" alt="${esc(authorName)}">` : `<span class="public-recipe-author-initial">${esc(authorName.charAt(0) || 'M')}</span>`}
              <div>
                <b>${esc(authorName)}</b>
                ${author.bio ? `<span>${esc(author.bio)}</span>` : ''}
              </div>
            </div>
            <div class="public-recipe-meta">
              ${recipe.volume_ml ? `<span>${Number(recipe.volume_ml)} мл</span>` : ''}
              <span>${Number(recipe.price || 0).toLocaleString('ru-RU')} ₽</span>
            </div>
          </div>
        </article>
        <aside class="public-order-card">
          <h3>Заказать рецепт</h3>
          <input id="po-name" placeholder="Имя">
          <input id="po-phone" placeholder="Телефон">
          <input id="po-email" placeholder="Email">
          <textarea id="po-comment" placeholder="Комментарий"></textarea>
          <button class="btn-primary" onclick="window.submitPublicRecipeOrder(${recipe.id})">Отправить заявку</button>
          <div class="public-order-msg" id="po-msg"></div>
        </aside>
      </div>
    </section>
  `;
}

export async function submitPublicRecipeOrder(recipeId) {
  const msg = document.getElementById('po-msg');
  if (msg) msg.textContent = 'Отправляем...';
  const body = {
    customer_name: document.getElementById('po-name')?.value || '',
    customer_phone: document.getElementById('po-phone')?.value || '',
    customer_email: document.getElementById('po-email')?.value || '',
    comment: document.getElementById('po-comment')?.value || '',
    source: location.hostname || 'barista-school.online',
  };
  const r = await fetch(`${API}/api/public/author-recipes/${recipeId}/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (msg) msg.textContent = r.ok ? 'Заявка отправлена. Мы свяжемся с вами.' : 'Не удалось отправить заявку.';
}
