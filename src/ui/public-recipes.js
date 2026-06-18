// src/ui/public-recipes.js — public author recipe catalog and sales preview
const API = import.meta.env.VITE_API_URL || '';
const CART_KEY = 'mbs_public_recipe_cart_v1';

const catalogState = {
  recipes: [],
  meta: null,
  query: '',
  author: '',
  category: '',
  price: '',
  championship: '',
  sort: 'newest',
  cart: loadCart(),
};
let queryRenderTimer = null;

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

function money(value) {
  return `${Number(value || 0).toLocaleString('ru-RU')} ₽`;
}

function recipeHref(r) {
  return `/recipes/${encodeURIComponent(r.public_slug || r.id)}`;
}

function loadCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.map(Number).filter(Boolean) : [];
  } catch (_) {
    return [];
  }
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(catalogState.cart));
}

function publicStyles() {
  if (document.getElementById('public-recipes-styles')) return;
  const s = document.createElement('style');
  s.id = 'public-recipes-styles';
  s.textContent = `
    :root {
      --pr-green-dark:#417033;
      --pr-green:#4F883E;
      --pr-green-light:#B6D8AB;
      --pr-bg-green:#E7F2E3;
      --pr-red:#CC2841;
      --pr-bg:#F5F5F5;
      --pr-black:#1F1F1F;
      --pr-gray:#555555;
      --pr-line:#d4e7cd;
    }
    .public-recipes-shell { background:#fff; color:var(--pr-black); font-family:Mulish,system-ui,sans-serif; }
    .public-recipes { max-width:1100px; margin:0 auto; padding:34px 18px 84px; }
    .public-recipes-hero { background:linear-gradient(135deg,#f7f7f7 0%,#eef6eb 100%); border-radius:24px; padding:42px; margin-bottom:24px; display:grid; grid-template-columns:minmax(0,1fr) 300px; gap:28px; align-items:end; }
    .public-pill { display:inline-flex; align-items:center; gap:8px; background:rgba(231,242,227,.95); color:var(--pr-green-dark); border-radius:999px; padding:8px 15px; font-size:13px; font-weight:900; margin-bottom:16px; }
    .public-recipes h1 { margin:0; color:var(--pr-black); font-size:52px; font-weight:900; line-height:.96; letter-spacing:-.04em; max-width:760px; }
    .public-recipes-lead { margin:18px 0 0; color:var(--pr-gray); font-size:18px; font-weight:600; line-height:1.45; max-width:680px; }
    .public-hero-card { background:#fff; border:1px solid var(--pr-line); border-radius:18px; padding:18px; box-shadow:0 10px 30px rgba(65,112,51,.12); }
    .public-hero-price { font-size:34px; font-weight:900; color:var(--pr-green-dark); line-height:1; }
    .public-hero-note { margin-top:8px; color:var(--pr-gray); font-size:13px; font-weight:700; line-height:1.4; }
    .public-toolbar { display:grid; grid-template-columns:2fr 1fr 1fr 1fr 1fr; gap:10px; margin:0 0 18px; }
    .public-toolbar input,.public-toolbar select,.public-order-card input,.public-order-card textarea { width:100%; box-sizing:border-box; border:1.5px solid var(--pr-line); border-radius:14px; background:#fff; padding:13px 14px; color:var(--pr-black); font:700 14px Mulish,sans-serif; outline:none; }
    .public-toolbar input:focus,.public-toolbar select:focus,.public-order-card input:focus,.public-order-card textarea:focus { border-color:var(--pr-green); box-shadow:0 0 0 3px rgba(79,136,62,.12); }
    .public-catalog-layout { display:grid; grid-template-columns:minmax(0,1fr) 320px; gap:20px; align-items:start; }
    .public-recipes-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; }
    .public-recipe-card { background:#fff; border:1px solid var(--pr-line); border-radius:18px; overflow:hidden; color:inherit; text-decoration:none; box-shadow:0 3px 18px rgba(31,31,31,.05); display:flex; flex-direction:column; min-width:0; }
    .public-recipe-media { display:block; width:100%; aspect-ratio:4/3; object-fit:cover; background:#f4f4f4; }
    .public-recipe-body { padding:16px; display:flex; flex-direction:column; gap:12px; flex:1; }
    .public-recipe-title { font-size:20px; font-weight:900; color:var(--pr-black); margin:0; line-height:1.15; }
    .public-recipe-meta { display:flex; gap:7px; flex-wrap:wrap; color:var(--pr-gray); font-size:12px; font-weight:800; }
    .public-recipe-chip { border-radius:999px; background:var(--pr-bg-green); color:var(--pr-green-dark); padding:6px 10px; }
    .public-recipe-desc { color:var(--pr-gray); font-size:14px; font-weight:600; line-height:1.45; margin:0; flex:1; }
    .public-recipe-author { display:flex; align-items:center; gap:10px; color:var(--pr-black); min-width:0; }
    .public-recipe-author-avatar,.public-recipe-author-initial { width:40px; height:40px; border-radius:50%; flex:0 0 auto; }
    .public-recipe-author-avatar { object-fit:cover; background:var(--pr-bg-green); border:1px solid var(--pr-line); }
    .public-recipe-author-initial { display:grid; place-items:center; background:var(--pr-bg-green); color:var(--pr-green-dark); font-weight:900; }
    .public-recipe-author b { display:block; color:var(--pr-black); font-size:14px; line-height:1.2; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .public-recipe-author span { display:block; color:var(--pr-gray); font-size:12px; line-height:1.3; margin-top:2px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
    .public-recipe-foot { display:flex; justify-content:space-between; gap:10px; align-items:center; padding-top:2px; }
    .public-recipe-price { font-size:20px; font-weight:900; color:var(--pr-green-dark); white-space:nowrap; }
    .public-actions { display:flex; gap:8px; flex-wrap:wrap; }
    .public-btn { border:1.5px solid var(--pr-line); background:#fff; color:var(--pr-black); border-radius:12px; padding:11px 14px; font:900 13px Mulish,sans-serif; cursor:pointer; text-decoration:none; display:inline-flex; align-items:center; justify-content:center; gap:8px; min-height:42px; box-sizing:border-box; }
    .public-btn:hover { border-color:var(--pr-green); }
    .public-btn-primary { background:var(--pr-red); border-color:var(--pr-red); color:#fff !important; }
    .public-btn-green { background:var(--pr-green); border-color:var(--pr-green); color:#fff !important; }
    .public-btn-ghost { color:var(--pr-green-dark); }
    .public-order-card { background:#fff; border:1px solid var(--pr-line); border-radius:18px; padding:16px; position:sticky; top:86px; box-shadow:0 3px 18px rgba(31,31,31,.05); }
    .public-order-card h3 { margin:0 0 6px; color:var(--pr-black); font-size:20px; font-weight:900; }
    .public-order-muted { margin:0 0 14px; color:var(--pr-gray); font-size:13px; font-weight:600; line-height:1.45; }
    .public-cart-list { display:grid; gap:8px; margin:12px 0 14px; }
    .public-cart-item { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:8px; align-items:center; padding:10px; border:1px solid var(--pr-line); border-radius:12px; background:#fafafa; }
    .public-cart-item b { display:block; font-size:13px; line-height:1.2; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .public-cart-item span { color:var(--pr-green-dark); font-weight:900; font-size:12px; }
    .public-cart-remove { border:0; background:transparent; color:var(--pr-gray); font-size:20px; cursor:pointer; line-height:1; }
    .public-order-card textarea { min-height:84px; resize:vertical; }
    .public-order-total { display:flex; justify-content:space-between; border-top:1px solid var(--pr-line); padding-top:12px; margin-top:8px; color:var(--pr-black); font-weight:900; }
    .public-order-msg { margin-top:10px; color:var(--pr-green-dark); font-size:13px; font-weight:900; line-height:1.4; }
    .public-empty { border:1.5px dashed var(--pr-line); border-radius:18px; padding:28px; color:var(--pr-gray); font-weight:700; text-align:center; }
    .public-recipe-detail { display:grid; grid-template-columns:minmax(0,1fr) 330px; gap:20px; align-items:start; }
    .public-recipe-hero { background:#fff; border:1px solid var(--pr-line); border-radius:20px; overflow:hidden; }
    .public-recipe-hero img { width:100%; max-height:520px; object-fit:cover; display:block; background:#f4f4f4; }
    .public-recipe-hero-body { padding:22px; }
    .public-recipe-hero-body h1 { font-size:44px; margin-bottom:12px; }
    .public-detail-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin:16px 0; }
    .public-detail-fact { border:1px solid var(--pr-line); background:#fff; border-radius:14px; padding:14px; }
    .public-detail-fact span { display:block; color:var(--pr-gray); font-size:12px; font-weight:900; text-transform:uppercase; margin-bottom:4px; }
    .public-detail-fact b { color:var(--pr-black); font-size:16px; font-weight:900; }
    .public-included { background:var(--pr-bg-green); border:1px solid var(--pr-line); border-radius:16px; padding:16px; margin-top:16px; }
    .public-included h3,.public-related h3 { margin:0 0 10px; color:var(--pr-green-dark); font-size:18px; font-weight:900; }
    .public-included ul { margin:0; padding-left:18px; color:var(--pr-black); font-weight:700; line-height:1.55; }
    .public-related { margin-top:20px; }
    .public-related-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
    .public-back { display:inline-flex; margin-bottom:14px; color:var(--pr-green-dark); font-weight:900; text-decoration:none; }
    @media(max-width:900px) {
      .public-recipes { padding:20px 14px 72px; }
      .public-recipes-hero { grid-template-columns:1fr; padding:26px 18px; border-radius:20px; }
      .public-recipes h1 { font-size:38px; letter-spacing:-.03em; }
      .public-recipes-lead { font-size:15px; }
      .public-toolbar { grid-template-columns:1fr; }
      .public-catalog-layout,.public-recipe-detail { grid-template-columns:1fr; }
      .public-recipes-grid,.public-related-grid { grid-template-columns:1fr; }
      .public-order-card { position:static; }
      .public-recipe-card { border-radius:16px; }
      .public-recipe-foot { display:grid; }
      .public-actions,.public-actions .public-btn { width:100%; }
      .public-detail-grid { grid-template-columns:1fr; }
      .public-recipe-hero-body h1 { font-size:32px; }
    }
  `;
  document.head.appendChild(s);
}

function setupPublicShell() {
  publicStyles();
  document.body.classList.add('public-recipes-shell');
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
  try {
    const [recipesRes, metaRes] = await Promise.all([
      fetch(`${API}/api/public/author-recipes`),
      fetch(`${API}/api/public/author-recipes/meta`),
    ]);
    catalogState.recipes = recipesRes.ok ? await recipesRes.json() : [];
    catalogState.meta = metaRes.ok ? await metaRes.json() : null;
    renderCatalog(main);
  } catch (e) {
    main.innerHTML = '<section class="public-recipes"><div class="public-empty">Не удалось загрузить каталог. Попробуйте обновить страницу.</div></section>';
  }
}

function renderCatalog(main) {
  const recipes = filteredRecipes();
  main.innerHTML = `
    <section class="public-recipes">
      <div class="public-recipes-hero">
        <div>
          <span class="public-pill">MBS* авторские рецепты</span>
          <h1>Летний дроп напитков 2026</h1>
          <p class="public-recipes-lead">Готовые авторские рецепты от участников и призёров MBS MIXOLOGY CUP. Выберите напитки для меню, оставьте заявку, и команда школы поможет оформить покупку.</p>
        </div>
        <aside class="public-hero-card">
          <div class="public-hero-price">${money(catalogMinPrice())}</div>
          <div class="public-hero-note">Стоимость зависит от статуса автора и рецепта. Полную техкарту вы получаете после оформления покупки.</div>
        </aside>
      </div>
      ${filtersMarkup()}
      <div class="public-catalog-layout">
        <div>
          <div class="public-recipes-grid" id="public-recipes-grid">
            ${recipes.length ? recipes.map(recipeCard).join('') : '<div class="public-empty">По выбранным фильтрам рецептов не найдено.</div>'}
          </div>
        </div>
        ${cartMarkup()}
      </div>
    </section>
  `;
  syncFilterControls();
}

function filtersMarkup() {
  const meta = catalogState.meta || {};
  const authors = meta.authors || [];
  const categories = meta.categories || [];
  return `
    <div class="public-toolbar">
      <input id="pr-search" placeholder="Поиск по названию или описанию" value="${esc(catalogState.query)}" oninput="window.publicRecipeSetFilter('query', this.value)">
      <select id="pr-author" onchange="window.publicRecipeSetFilter('author', this.value)">
        <option value="">Все авторы</option>
        ${authors.map(a => `<option value="${esc(a.name)}">${esc(a.name)} (${Number(a.count || 0)})</option>`).join('')}
      </select>
      <select id="pr-category" onchange="window.publicRecipeSetFilter('category', this.value)">
        <option value="">Все категории</option>
        ${categories.map(c => `<option value="${esc(c.name)}">${esc(c.name)} (${Number(c.count || 0)})</option>`).join('')}
      </select>
      <select id="pr-price" onchange="window.publicRecipeSetFilter('price', this.value)">
        <option value="">Любая цена</option>
        <option value="6000">до 6 000 ₽</option>
        <option value="8000">до 8 000 ₽</option>
        <option value="12000">до 12 000 ₽</option>
      </select>
      <select id="pr-sort" onchange="window.publicRecipeSetFilter('sort', this.value)">
        <option value="newest">Сначала новые</option>
        <option value="price_asc">Цена по возрастанию</option>
        <option value="price_desc">Цена по убыванию</option>
        <option value="title">По названию</option>
      </select>
    </div>
    <div class="public-toolbar" style="grid-template-columns:1fr auto;align-items:center">
      <select id="pr-championship" onchange="window.publicRecipeSetFilter('championship', this.value)">
        <option value="">Все рецепты</option>
        <option value="mixology">MBS MIXOLOGY CUP</option>
      </select>
      <button class="public-btn public-btn-ghost" onclick="window.publicRecipeClearFilters()">Сбросить фильтры</button>
    </div>
  `;
}

function syncFilterControls() {
  const pairs = [
    ['pr-author', catalogState.author],
    ['pr-category', catalogState.category],
    ['pr-price', catalogState.price],
    ['pr-championship', catalogState.championship],
    ['pr-sort', catalogState.sort],
  ];
  pairs.forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  });
}

function filteredRecipes() {
  const q = catalogState.query.trim().toLowerCase();
  let items = [...catalogState.recipes].filter(r => {
    const authorName = (r.author || {}).name || 'Moscow Barista School';
    const text = [r.title, r.public_description, authorName, r.category].join(' ').toLowerCase();
    if (q && !text.includes(q)) return false;
    if (catalogState.author && authorName !== catalogState.author) return false;
    if (catalogState.category && r.category !== catalogState.category) return false;
    if (catalogState.championship === 'mixology' && !r.is_mixology) return false;
    if (catalogState.price && Number(r.price || 0) > Number(catalogState.price)) return false;
    return true;
  });
  if (catalogState.sort === 'price_asc') items.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  if (catalogState.sort === 'price_desc') items.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
  if (catalogState.sort === 'title') items.sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''), 'ru'));
  return items;
}

function catalogMinPrice() {
  const prices = catalogState.recipes.map(r => Number(r.price || 0)).filter(Boolean);
  return prices.length ? Math.min(...prices) : 6000;
}

function recipeCard(r) {
  const author = r.author || {};
  const authorName = author.name || 'Moscow Barista School';
  const avatar = assetUrl(author.avatar_url || '');
  const inCart = catalogState.cart.includes(Number(r.id));
  return `
    <article class="public-recipe-card">
      <a href="${recipeHref(r)}" aria-label="${esc(r.title)}">
        ${r.image_url ? `<img class="public-recipe-media" src="${esc(assetUrl(r.image_url))}" alt="${esc(r.title)}">` : `<div class="public-recipe-media"></div>`}
      </a>
      <div class="public-recipe-body">
        <div class="public-recipe-meta">
          ${r.category ? `<span class="public-recipe-chip">${esc(r.category)}</span>` : ''}
          ${r.volume_ml ? `<span class="public-recipe-chip">${Number(r.volume_ml)} мл</span>` : ''}
          ${r.is_mixology ? '<span class="public-recipe-chip">MBS MIXOLOGY CUP</span>' : ''}
        </div>
        <h2 class="public-recipe-title">${esc(r.title)}</h2>
        <div class="public-recipe-author">
          ${avatar ? `<img class="public-recipe-author-avatar" src="${esc(avatar)}" alt="${esc(authorName)}">` : `<span class="public-recipe-author-initial">${esc(authorName.charAt(0) || 'M')}</span>`}
          <div>
            <b>${esc(authorName)}</b>
            ${author.bio ? `<span>${esc(author.bio)}</span>` : ''}
          </div>
        </div>
        <p class="public-recipe-desc">${esc(r.public_description || '')}</p>
        <div class="public-recipe-foot">
          <div class="public-recipe-price">${money(r.price)}</div>
          <div class="public-actions">
            <a class="public-btn" href="${recipeHref(r)}">Подробнее</a>
            <button class="public-btn ${inCart ? 'public-btn-green' : 'public-btn-primary'}" onclick="window.publicRecipeToggleCart(${Number(r.id)})">${inCart ? 'В корзине' : 'В корзину'}</button>
          </div>
        </div>
      </div>
    </article>
  `;
}

function selectedCartItems() {
  return catalogState.cart
    .map(id => catalogState.recipes.find(r => Number(r.id) === Number(id)))
    .filter(Boolean);
}

function cartMarkup() {
  const items = selectedCartItems();
  const total = items.reduce((sum, item) => sum + Number(item.price || 0), 0);
  return `
    <aside class="public-order-card" id="public-cart">
      <h3>Корзина рецептов</h3>
      <p class="public-order-muted">Оставьте контакты, и команда Московской школы бариста поможет оформить покупку рецептов.</p>
      <div class="public-cart-list">
        ${items.length ? items.map(item => `
          <div class="public-cart-item">
            <div><b>${esc(item.title)}</b><span>${money(item.price)}</span></div>
            <button class="public-cart-remove" onclick="window.publicRecipeToggleCart(${Number(item.id)})" aria-label="Удалить">&times;</button>
          </div>
        `).join('') : '<div class="public-empty" style="padding:16px">Выберите рецепты из каталога.</div>'}
      </div>
      <div class="public-order-total"><span>Итого</span><span>${money(total)}</span></div>
      <input id="po-name" placeholder="Имя">
      <input id="po-phone" placeholder="Телефон">
      <input id="po-email" placeholder="Email">
      <textarea id="po-comment" placeholder="Комментарий"></textarea>
      <button class="public-btn public-btn-primary" style="width:100%;margin-top:6px" onclick="window.submitPublicRecipeOrder()">Отправить заявку</button>
      <div class="public-order-msg" id="po-msg"></div>
    </aside>
  `;
}

async function renderPublicRecipeDetail(main, slug) {
  try {
    const r = await fetch(`${API}/api/public/author-recipes/${encodeURIComponent(slug)}`);
    if (!r.ok) {
      main.innerHTML = '<section class="public-recipes"><h1>Рецепт не найден</h1><p><a class="public-back" href="/recipes">Вернуться к каталогу</a></p></section>';
      return;
    }
    const recipe = await r.json();
    const related = Array.isArray(recipe.related) ? recipe.related : [];
    if (!catalogState.recipes.some(item => Number(item.id) === Number(recipe.id))) {
      catalogState.recipes = [recipe, ...related];
    }
    main.innerHTML = `
      <section class="public-recipes">
        <a class="public-back" href="/recipes">← Все рецепты</a>
        <div class="public-recipe-detail">
          <article class="public-recipe-hero">
            ${recipe.image_url ? `<img src="${esc(assetUrl(recipe.image_url))}" alt="${esc(recipe.title)}">` : ''}
            <div class="public-recipe-hero-body">
              <span class="public-pill">${esc(recipe.category || 'Авторский рецепт')}</span>
              <h1>${esc(recipe.title)}</h1>
              <p class="public-recipes-lead">${esc(recipe.public_description || '')}</p>
              ${authorMarkup(recipe.author || {})}
              <div class="public-detail-grid">
                <div class="public-detail-fact"><span>Цена</span><b>${money(recipe.price)}</b></div>
                <div class="public-detail-fact"><span>Объём</span><b>${Number(recipe.volume_ml || 0)} мл</b></div>
                <div class="public-detail-fact"><span>Формат</span><b>PDF техкарта</b></div>
              </div>
              <div class="public-included">
                <h3>Что входит в покупку</h3>
                <ul>
                  <li>Полная технологическая карта напитка</li>
                  <li>Состав, граммовки, оборудование и процесс приготовления</li>
                  <li>Рекомендации по подаче, срокам реализации и внедрению в меню</li>
                </ul>
              </div>
              ${related.length ? `<div class="public-related"><h3>Ещё рецепты автора</h3><div class="public-related-grid">${related.map(recipeCard).join('')}</div></div>` : ''}
            </div>
          </article>
          ${cartMarkup()}
        </div>
      </section>
    `;
  } catch (e) {
    main.innerHTML = '<section class="public-recipes"><div class="public-empty">Не удалось загрузить рецепт. Попробуйте обновить страницу.</div></section>';
  }
}

function authorMarkup(author) {
  const authorName = author.name || 'Moscow Barista School';
  const avatar = assetUrl(author.avatar_url || '');
  return `
    <div class="public-recipe-author" style="margin-top:16px">
      ${avatar ? `<img class="public-recipe-author-avatar" src="${esc(avatar)}" alt="${esc(authorName)}">` : `<span class="public-recipe-author-initial">${esc(authorName.charAt(0) || 'M')}</span>`}
      <div>
        <b>${esc(authorName)}</b>
        ${author.bio ? `<span>${esc(author.bio)}</span>` : '<span>Автор рецепта Московской школы бариста</span>'}
      </div>
    </div>
  `;
}

export function publicRecipeSetFilter(key, value) {
  if (!['query', 'author', 'category', 'price', 'championship', 'sort'].includes(key)) return;
  catalogState[key] = value || '';
  trackPublicRecipeEvent('filter_apply', { filter: key, value: catalogState[key] });
  if (key === 'query') {
    clearTimeout(queryRenderTimer);
    queryRenderTimer = setTimeout(() => {
      const main = document.querySelector('.main');
      if (main) renderCatalog(main);
    }, 250);
    return;
  }
  const main = document.querySelector('.main');
  if (main) renderCatalog(main);
}

export function publicRecipeClearFilters() {
  catalogState.query = '';
  catalogState.author = '';
  catalogState.category = '';
  catalogState.price = '';
  catalogState.championship = '';
  catalogState.sort = 'newest';
  trackPublicRecipeEvent('filter_reset', {});
  const main = document.querySelector('.main');
  if (main) renderCatalog(main);
}

export function publicRecipeToggleCart(recipeId) {
  const id = Number(recipeId || 0);
  if (!id) return;
  if (catalogState.cart.includes(id)) {
    catalogState.cart = catalogState.cart.filter(item => item !== id);
    trackPublicRecipeEvent('remove_from_cart', { recipe_id: id });
  } else {
    catalogState.cart.push(id);
    trackPublicRecipeEvent('add_to_cart', { recipe_id: id });
  }
  saveCart();
  const main = document.querySelector('.main');
  if (main) {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length > 1) renderPublicRecipeDetail(main, parts[1]);
    else renderCatalog(main);
  }
}

export async function submitPublicRecipeOrder(recipeId = null) {
  const msg = document.getElementById('po-msg');
  if (msg) msg.textContent = 'Отправляем...';
  const selected = recipeId ? [Number(recipeId)] : catalogState.cart;
  const recipeIds = selected.map(Number).filter(Boolean);
  if (!recipeIds.length) {
    if (msg) msg.textContent = 'Добавьте хотя бы один рецепт в корзину.';
    return;
  }
  const body = {
    recipe_ids: recipeIds,
    customer_name: document.getElementById('po-name')?.value || '',
    customer_phone: document.getElementById('po-phone')?.value || '',
    customer_email: document.getElementById('po-email')?.value || '',
    comment: document.getElementById('po-comment')?.value || '',
    source: `${location.hostname}${location.pathname}`,
  };
  if (!body.customer_name.trim() || !body.customer_phone.trim()) {
    if (msg) msg.textContent = 'Укажите имя и телефон.';
    return;
  }
  try {
    const r = await fetch(`${API}/api/public/author-recipes/cart-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error('order failed');
    catalogState.cart = [];
    saveCart();
    trackPublicRecipeEvent('order_submit', { count: recipeIds.length });
    if (msg) msg.textContent = 'Заявка отправлена. Мы свяжемся с вами.';
    const main = document.querySelector('.main');
    if (main && location.pathname === '/recipes') renderCatalog(main);
  } catch (e) {
    if (msg) msg.textContent = 'Не удалось отправить заявку. Попробуйте ещё раз.';
  }
}

function trackPublicRecipeEvent(name, params = {}) {
  try {
    if (window.ym) window.ym(window.YM_COUNTER_ID || window.yaCounterId, 'reachGoal', `recipe_${name}`, params);
  } catch (_) {}
  try {
    if (window.gtag) window.gtag('event', `recipe_${name}`, params);
  } catch (_) {}
}

if (typeof window !== 'undefined') {
  Object.assign(window, {
    publicRecipeSetFilter,
    publicRecipeClearFilters,
    publicRecipeToggleCart,
    submitPublicRecipeOrder,
  });
}
