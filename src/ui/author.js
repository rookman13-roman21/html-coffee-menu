// src/ui/author.js — author recipe publishing workspace
import { getToken, hasAccess } from './auth.js';

const API = import.meta.env.VITE_API_URL || '';

let _authorLoaded = false;
let _authorLoading = false;
let _authorProfile = null;
let _authorRecipes = [];
let _authorDrafts = [];
let _authorIngredients = [];
let _authorSemis = [];
let _authorPublicationFilter = 'attention';

function _authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

function _authUploadHeaders() {
  return {
    Authorization: `Bearer ${getToken()}`,
  };
}

function _assetUrl(src) {
  if (!src) return '';
  if (/^https?:\/\//i.test(src) || src.startsWith('data:')) return src;
  return `${API}${src}`;
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

function _statusHint(status) {
  const hints = {
    submitted: 'Команда Moscow Barista School проверяет состав, описание, фото и готовность рецепта к публикации.',
    published: 'Рецепт опубликован на витрине и доступен покупателям.',
    rejected: 'Рецепт требует доработки. Посмотрите комментарий и отправьте обновлённую версию повторно.',
    archived: 'Рецепт снят с публикации и не показывается покупателям.',
  };
  return hints[status] || 'Статус публикации будет обновляться после проверки.';
}

function _reviewFlagLabel(flag) {
  const labels = {
    basics: 'Основные данные',
    ingredients: 'Ингредиенты',
    photo: 'Фото',
    process: 'Процесс',
    equipment: 'Оборудование',
    serving: 'Подача и срок',
    organoleptic: 'Органолептика',
    description: 'Описание для витрины',
  };
  return labels[flag] || flag;
}

function _authorEventLabel(type) {
  const labels = {
    submitted: 'Отправлено на проверку',
    published: 'Опубликовано',
    rejected: 'Возвращено на доработку',
    archived: 'Публикация снята',
    review_saved: 'Проверка обновлена',
  };
  return labels[type] || type || 'Обновление';
}

function _reviewFlagsMarkup(flags = []) {
  const clean = (flags || []).map(flag => String(flag || '').trim()).filter(Boolean);
  if (!clean.length) return '';
  return `
    <div class="author-pub-review-flags">
      <b>Что нужно поправить</b>
      <div>${clean.map(flag => `<span>${_esc(_reviewFlagLabel(flag))}</span>`).join('')}</div>
    </div>
  `;
}

function _publicationEventsMarkup(events = []) {
  const clean = (events || []).filter(event => event?.event_type).slice(0, 3);
  if (!clean.length) return '';
  return `
    <div class="author-pub-events">
      ${clean.map(event => `
        <span>${_esc(_authorEventLabel(event.event_type))}${event.version ? ` · v${_esc(event.version)}` : ''}</span>
      `).join('')}
    </div>
  `;
}

function _publicationEventsListMarkup(events = []) {
  const clean = (events || []).filter(event => event?.event_type);
  if (!clean.length) return '<div class="author-empty">История пока пустая.</div>';
  return `
    <div class="author-history-list">
      ${clean.map(event => `
        <div class="author-history-item">
          <b>${_esc(_authorEventLabel(event.event_type))}${event.version ? ` · v${_esc(event.version)}` : ''}</b>
          <span>${_esc(_formatAuthorDate(event.created_at) || 'Дата не указана')}</span>
          ${event.comment ? `<p>${_esc(event.comment)}</p>` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

function _groupName(group) {
  const labels = {
    hot: 'Горячие кофейные',
    tea: 'Чай и матча',
    cold: 'Холодные',
    filter: 'Фильтр-кофе',
    author: 'Авторские',
  };
  return labels[group] || group || 'Группа не указана';
}

function _rub(value) {
  return window.rub ? window.rub(Number(value || 0)) : `${Math.round(Number(value || 0)).toLocaleString('ru-RU')} ₽`;
}

function _formatAuthorDate(value) {
  if (!value) return '';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
}

const RECIPE_PROGRESS_LABELS = {
  basics: 'название, цена и объём',
  ingredients: 'ингредиенты',
  photo: 'фото напитка',
  process: 'процесс приготовления',
  equipment: 'оборудование',
  serving: 'подача и срок',
  organoleptic: 'органолептика',
};

function _publicationCounts() {
  return {
    attention: _authorRecipes.filter(r => r.status === 'rejected').length,
    submitted: _authorRecipes.filter(r => r.status === 'submitted').length,
    published: _authorRecipes.filter(r => r.status === 'published').length,
    archived: _authorRecipes.filter(r => r.status === 'archived').length,
    all: _authorRecipes.length,
  };
}

function _filteredAuthorPublications() {
  if (_authorPublicationFilter === 'attention') return _authorRecipes.filter(r => r.status === 'rejected');
  if (_authorPublicationFilter === 'all') return _authorRecipes;
  return _authorRecipes.filter(r => r.status === _authorPublicationFilter);
}

function _publicationEmptyText() {
  const messages = {
    attention: 'Сейчас нет рецептов, которые требуют доработки.',
    submitted: 'Нет рецептов на проверке.',
    published: 'Пока нет опубликованных рецептов.',
    archived: 'Нет снятых публикаций.',
    all: 'Пока нет рецептов на публикации.',
  };
  return messages[_authorPublicationFilter] || messages.all;
}

function _renderAuthorPublicationTabs() {
  const counts = _publicationCounts();
  const tabs = [
    ['attention', 'Требуют внимания'],
    ['submitted', 'На проверке'],
    ['published', 'Опубликованы'],
    ['archived', 'Сняты'],
    ['all', 'Все'],
  ];
  return `
    <div class="author-pub-tabs" role="tablist" aria-label="Статусы публикаций">
      ${tabs.map(([key, label]) => `
        <button type="button" class="${key === _authorPublicationFilter ? 'active' : ''}" onclick="setAuthorPublicationFilter('${key}')">
          ${_esc(label)}
          <span>${counts[key]}</span>
        </button>
      `).join('')}
    </div>
  `;
}

function _findAuthorDrinkForPublication(pub) {
  const localId = String(pub?.recipe_local_id || '');
  const drinks = window.DRINKS || [];
  const fromDrinks = drinks.find(d => localId && String(d.id) === localId) ||
    drinks.find(d => String(d.name || '').trim().toLowerCase() === String(pub?.title || '').trim().toLowerCase()) ||
    null;
  if (fromDrinks) return fromDrinks;
  const draftRecord = _authorDrafts.find(record => {
    const drink = record?.drink || {};
    return (localId && (
      String(record.client_id || '') === localId ||
      String(drink.id || '') === localId ||
      String(drink._legacyLocalId || '') === localId
    )) ||
      String(drink.name || '').trim().toLowerCase() === String(pub?.title || '').trim().toLowerCase();
  });
  return draftRecord ? _draftDrink(draftRecord) : null;
}

function _publicationImageUrl(pub, localDrink) {
  const recipe = pub?.recipe || {};
  return _assetUrl(
    pub?.image_url ||
    recipe.image_url ||
    recipe.image ||
    recipe.draft?.image ||
    localDrink?.image ||
    ''
  );
}

function _fallbackPublicationDrink(pub) {
  const localDrink = _findAuthorDrinkForPublication(pub);
  if (localDrink) return localDrink;
  const recipe = pub?.recipe || {};
  const fallbackId = Number(pub?.recipe_local_id) || (900000000 + Number(pub?.id || 0));
  const draft = recipe.draft || {};
  const drink = {
    ...draft,
    id: fallbackId,
    _authorPublicationFallback: true,
    custom: true,
    name: pub?.title || draft.name || 'Авторский рецепт',
    group: pub?.group_name || draft.group || 'author',
    vol: Number(pub?.volume_ml || draft.vol || 0),
    price: Number(pub?.price || draft.price || 0),
    recipe: recipe.ingredients || draft.recipe || [],
    equipment: recipe.equipment || draft.equipment || [],
    process: recipe.process || draft.process || pub?.public_description || '',
    image: _publicationImageUrl(pub, draft),
    videoUrl: pub?.video_url || draft.videoUrl || '',
    storage_temp: recipe.storage_temp || draft.storage_temp || '',
    storage_life: recipe.storage_life || draft.storage_life || '',
    appearance: recipe.appearance || draft.appearance || '',
    taste: recipe.taste || draft.taste || '',
    consistency: recipe.consistency || draft.consistency || '',
  };
  if (!window.DRINKS) return drink;
  const idx = window.DRINKS.findIndex(d => Number(d.id) === Number(fallbackId));
  if (idx >= 0) window.DRINKS[idx] = { ...window.DRINKS[idx], ...drink };
  else window.DRINKS.push(drink);
  if (window.S?.salePrices) window.S.salePrices[fallbackId] = Number(pub?.price || 0);
  if (window.S?.portions && window.S.portions[fallbackId] == null) window.S.portions[fallbackId] = 5;
  return drink;
}

function _publicationById(publicationId) {
  return _authorRecipes.find(r => Number(r.id) === Number(publicationId));
}

function _publicationRecipe(pub, localDrink) {
  const recipe = pub?.recipe || {};
  return {
    ingredients: recipe.ingredients || localDrink?.recipe || [],
    equipment: recipe.equipment || localDrink?.equipment || [],
    process: recipe.process || localDrink?.process || '',
  };
}

function _equipmentNames(items = []) {
  return (items || [])
    .map(item => (typeof item === 'string' ? item : item?.name))
    .map(name => String(name || '').trim())
    .filter(Boolean);
}

function _ingredientLabel(row) {
  if (!row) return '';
  if (row.semi != null) {
    const semi = (window.SEMI || []).find(item => Number(item.id) === Number(row.semi));
    return semi?.name || 'Полуфабрикат';
  }
  if (row.mat) return window.MAT?.[row.mat]?.name || row.mat;
  return '';
}

function _ingredientUnit(row) {
  if (!row) return '';
  if (row.semi != null) {
    const semi = (window.SEMI || []).find(item => Number(item.id) === Number(row.semi));
    return semi?.unit || '';
  }
  return window.MAT?.[row.mat]?.unit || 'г';
}

function _ingredientRows(ingredients = []) {
  return (ingredients || [])
    .filter(row => _ingredientLabel(row) && Number(row.amt || 0) > 0)
    .slice(0, 4)
    .map(row => {
      const amount = Number(row.amt || 0);
      const displayAmount = Number.isInteger(amount) ? amount : Number(amount.toFixed(1));
      return `<span>${_esc(_ingredientLabel(row))} · ${_esc(displayAmount)} ${_esc(_ingredientUnit(row))}</span>`;
    })
    .join('');
}

export function authorRecipeProgress(drink = {}) {
  const price = Number((window.S?.salePrices || {})[drink.id] ?? drink.price ?? 0);
  const ingredients = drink.recipe || drink.ingredients || [];
  const equipment = _equipmentNames(drink.equipment || drink.recipeEquipment || []);
  const checks = [
    ['basics', !!(String(drink.name || '').trim() && String(drink.group || '').trim() && Number(drink.vol || 0) > 0 && price > 0)],
    ['ingredients', ingredients.some(row => (row.mat || row.semi != null) && Number(row.amt || 0) > 0)],
    ['photo', !!_authorRecipeImageUrl(drink)],
    ['process', !!String(drink.process || '').trim()],
    ['equipment', equipment.length > 0],
    ['serving', !!(String(drink.storage_temp || '').trim() && String(drink.storage_life || '').trim())],
    ['organoleptic', !!(String(drink.appearance || '').trim() && String(drink.taste || '').trim() && String(drink.consistency || '').trim())],
  ];
  const done = checks.filter(([, ok]) => ok).length;
  const total = checks.length;
  return {
    done,
    total,
    percent: Math.round((done / total) * 100),
    missing: checks.filter(([, ok]) => !ok).map(([key]) => RECIPE_PROGRESS_LABELS[key] || key),
  };
}

function _publicationChecklist(pub, localDrink, recipe, equipment) {
  const items = [
    ['Основные данные', !!(pub?.title && pub?.group_name && Number(pub?.price || 0) > 0 && Number(pub?.volume_ml || 0) > 0)],
    ['Ингредиенты', (recipe.ingredients || []).some(row => (row.mat || row.semi != null) && Number(row.amt || 0) > 0)],
    ['Фото', !!(pub?.image_url || recipe.image_url || recipe.image || localDrink?.image)],
    ['Процесс', !!String(recipe.process || '').trim()],
    ['Оборудование', equipment.length > 0],
    ['Органолептика', !!((recipe.appearance || localDrink?.appearance) && (recipe.taste || localDrink?.taste) && (recipe.consistency || localDrink?.consistency))],
    ['Подача и срок', !!((recipe.storage_temp || localDrink?.storage_temp) && (recipe.storage_life || localDrink?.storage_life))],
  ];
  return items.map(([label, ok]) => `
    <span class="author-pub-check ${ok ? 'is-ok' : 'is-missing'}">
      <i data-lucide="${ok ? 'check' : 'minus'}" class="icon"></i>${_esc(label)}
    </span>
  `).join('');
}

export function authorCanPublish() {
  return hasAccess('author');
}

export function authorPublicationForDrink(drinkId) {
  return _authorRecipes.find(r => String(r.recipe_local_id) === String(drinkId));
}

function _draftDrink(record) {
  const drink = record?.drink || {};
  return {
    ...drink,
    id: Number(record.client_id || drink.id),
    _authorDraftId: Number(record.id || drink._authorDraftId),
    _authorDraft: true,
    custom: true,
  };
}

function _syncAuthorDraftsToDrinks(records = []) {
  if (!window.DRINKS || !window.S) return;
  for (let i = window.DRINKS.length - 1; i >= 0; i--) {
    if (window.DRINKS[i]?._authorDraft) window.DRINKS.splice(i, 1);
  }
  records.forEach(record => {
    const drink = _draftDrink(record);
    if (!drink.id) return;
    window.DRINKS.push(drink);
    window.S.salePrices[drink.id] = Number(drink.price || 0);
    if (window.S.portions[drink.id] == null) window.S.portions[drink.id] = 5;
  });
}

function _syncAuthorIngredientsToMat(records = []) {
  if (!window.MAT || !window.S) return;
  Object.keys(window.MAT).forEach(key => {
    if (window.MAT[key]?._authorIngredient) delete window.MAT[key];
  });
  records.forEach(record => {
    const key = record?.key || '';
    if (!key) return;
    const ingredient = {
      ...(record.ingredient || {}),
      custom: true,
      _authorIngredient: true,
    };
    window.MAT[key] = ingredient;
    if (window.S.prices[key] == null) {
      window.S.prices[key] = Number(ingredient.price || 0);
    }
    if (record.supplier && Object.keys(record.supplier).length) {
      if (!window.S.suppliers) window.S.suppliers = {};
      window.S.suppliers[key] = record.supplier;
    }
  });
}

function _syncAuthorSemisToState(records = []) {
  if (!window.SEMI) return;
  for (let i = window.SEMI.length - 1; i >= 0; i--) {
    if (window.SEMI[i]?._authorSemi) window.SEMI.splice(i, 1);
  }
  records.forEach(record => {
    const semi = record?.semi || {};
    if (!semi.id) return;
    window.SEMI.push({
      ...semi,
      id: Number(record.client_id || semi.id),
      _authorSemiId: Number(record.id || semi._authorSemiId),
      _authorSemi: true,
    });
    if (window.nextSemiId <= Number(record.client_id || semi.id)) {
      window.nextSemiId = Number(record.client_id || semi.id) + 1;
    }
  });
}

function _authorDraftBody(drink) {
  const price = Number((window.S && window.S.salePrices && window.S.salePrices[drink.id]) ?? drink.price ?? 0);
  const draft = {
    ...drink,
    price,
    custom: true,
  };
  return {
    title: drink.name || '',
    group_name: drink.group || '',
    volume_ml: Number(drink.vol || 0),
    price,
    draft,
  };
}

function _authorIngredientBody(key) {
  const ingredient = {
    ...(window.MAT?.[key] || {}),
    price: Number(window.S?.prices?.[key] ?? window.MAT?.[key]?.price ?? 0),
    custom: true,
  };
  const supplier = (window.S?.suppliers || {})[key] || {};
  return {
    key,
    ingredient,
    supplier,
  };
}

function _authorSemiBody(semi) {
  const payload = {
    ...(semi || {}),
    _authorSemi: true,
  };
  if (!payload._authorSemiId && payload.id) {
    payload._legacyLocalId = payload.id;
  }
  return {
    semi: payload,
  };
}

function _authorRecipeImageUrl(drink) {
  return String(drink?.image_url || drink?.image || drink?.draft?.image || '').trim();
}

function _authorIngredientPayload(ingredients = []) {
  return (ingredients || []).map(ing => {
    const row = { ...ing };
    if (row.semi != null) {
      const semi = (window.SEMI || []).find(item => Number(item.id) === Number(row.semi));
      if (semi) {
        row.name = semi.name || '';
        row.unit = semi.unit || '';
      }
    } else if (row.mat) {
      const mat = window.MAT?.[row.mat] || {};
      row.name = mat.name || row.mat;
      row.unit = mat.unit || 'г';
    }
    return row;
  });
}

function _authorRecipeSnapshot(drink, equipment = [], price = 0) {
  const imageUrl = _authorRecipeImageUrl(drink);
  const videoUrl = String(drink?.videoUrl || drink?.video_url || '').trim();
  return {
    imageUrl,
    videoUrl,
    recipe: {
      title: drink?._serverName || drink?.name || '',
      group: drink?.group || '',
      volume_ml: Number(drink?.vol || 0),
      price: Number(price || drink?._serverPrice || drink?.price || 0),
      ingredients: _authorIngredientPayload(drink?.recipe || []),
      equipment,
      process: drink?.process || '',
      quality: drink?.quality || '',
      storage_temp: drink?.storage_temp || '',
      storage_life: drink?.storage_life || '',
      appearance: drink?.appearance || '',
      taste: drink?.taste || '',
      consistency: drink?.consistency || '',
      image_url: imageUrl,
      image: imageUrl,
      video_url: videoUrl,
    },
  };
}

function _replaceLocalDraft(oldId, record) {
  if (!window.DRINKS || !window.S) return _draftDrink(record);
  const drink = _draftDrink(record);
  const idx = window.DRINKS.findIndex(d =>
    Number(d.id) === Number(oldId) ||
    (drink._authorDraftId && Number(d._authorDraftId) === Number(drink._authorDraftId))
  );
  if (idx >= 0) window.DRINKS[idx] = drink;
  else window.DRINKS.push(drink);
  if (Number(oldId) !== Number(drink.id)) {
    delete window.S.salePrices[oldId];
    delete window.S.portions[oldId];
  }
  window.S.salePrices[drink.id] = Number(drink.price || 0);
  if (window.S.portions[drink.id] == null) window.S.portions[drink.id] = 5;
  return drink;
}

function _replaceSemiRefs(oldId, newId) {
  if (!oldId || !newId || Number(oldId) === Number(newId)) return;
  (window.DRINKS || []).forEach(drink => {
    (drink.recipe || []).forEach(row => {
      if (Number(row.semi) === Number(oldId)) row.semi = Number(newId);
    });
  });
  _authorDrafts.forEach(record => {
    const recipe = record?.drink?.recipe || [];
    recipe.forEach(row => {
      if (Number(row.semi) === Number(oldId)) row.semi = Number(newId);
    });
  });
}

function _replaceLocalSemi(oldId, record) {
  if (!window.SEMI) return record?.semi || null;
  const semi = {
    ...(record?.semi || {}),
    id: Number(record?.client_id || record?.semi?.id),
    _authorSemiId: Number(record?.id || record?.semi?._authorSemiId),
    _authorSemi: true,
  };
  const idx = window.SEMI.findIndex(item =>
    Number(item.id) === Number(oldId) ||
    (semi._authorSemiId && Number(item._authorSemiId) === Number(semi._authorSemiId))
  );
  if (idx >= 0) window.SEMI[idx] = semi;
  else window.SEMI.push(semi);
  _replaceSemiRefs(oldId, semi.id);
  if (window.nextSemiId <= semi.id) window.nextSemiId = semi.id + 1;
  return semi;
}

async function _migrateLocalAuthorDrinks() {
  if (!window.DRINKS || !authorCanPublish()) return;
  const localDrinks = window.DRINKS.filter(d => d.custom && !d._authorDraft);
  if (!localDrinks.length) return;
  for (const drink of localDrinks) {
    const duplicate = _authorDrafts.some(record => {
      const serverDrink = record?.drink || {};
      return String(serverDrink.name || '').trim().toLowerCase() === String(drink.name || '').trim().toLowerCase();
    });
    if (!duplicate) await saveAuthorDraftForDrink(drink, { silent: true });
    const idx = window.DRINKS.findIndex(d => Number(d.id) === Number(drink.id) && !d._authorDraft);
    if (idx >= 0) window.DRINKS.splice(idx, 1);
  }
  if (window.saveState) window.saveState();
}

async function _migrateLocalAuthorSemis() {
  if (!window.SEMI || !authorCanPublish()) return;
  const localSemis = window.SEMI.filter(semi => !semi._authorSemi);
  if (!localSemis.length) return;
  for (const semi of localSemis) {
    const duplicate = _authorSemis.find(record => {
      const serverSemi = record?.semi || {};
      return String(serverSemi.name || '').trim().toLowerCase() === String(semi.name || '').trim().toLowerCase();
    });
    if (duplicate) {
      _replaceSemiRefs(semi.id, duplicate.client_id);
    } else {
      await saveAuthorSemiForItem(semi, { silent: true });
    }
    const idx = window.SEMI.findIndex(item => Number(item.id) === Number(semi.id) && !item._authorSemi);
    if (idx >= 0) window.SEMI.splice(idx, 1);
  }
  if (window.saveState) window.saveState();
}

async function _migrateLocalAuthorIngredients() {
  if (!window.MAT || !authorCanPublish()) return;
  const localKeys = Object.entries(window.MAT)
    .filter(([, mat]) => mat?.custom && !mat?._authorIngredient)
    .map(([key]) => key);
  if (!localKeys.length) return;
  for (const key of localKeys) {
    await saveAuthorIngredient(key, { silent: true });
  }
  if (window.saveState) window.saveState();
}

function _firstAuthorDraftDrink() {
  return (_authorDrafts || []).map(_draftDrink).find(drink => drink?.id) || null;
}

function _renderLaunchStep(ok, label, hint) {
  return `
    <div class="author-launch-step ${ok ? 'is-done' : ''}">
      <span><i data-lucide="${ok ? 'check' : 'circle'}" class="icon"></i></span>
      <div>
        <b>${_esc(label)}</b>
        <em>${_esc(hint)}</em>
      </div>
    </div>
  `;
}

function _renderAuthorLaunchGuide() {
  if (_authorLoading && !_authorLoaded) return '';
  const profile = _authorProfile || {};
  const draft = _firstAuthorDraftDrink();
  const publication = draft ? authorPublicationForDrink(draft.id) : null;
  const progress = draft ? authorRecipeProgress(draft) : null;
  const profileDone = !!(profile.first_name && profile.last_name && profile.phone);
  const avatarDone = !!profile.avatar_url;
  const recipeReady = !!progress && progress.done === progress.total;
  const submitted = !!publication && ['submitted', 'published'].includes(publication.status);
  const rejected = publication?.status === 'rejected';
  const cta = !draft
    ? `<button class="btn btn-green" type="button" onclick="openAddDrink({ name: 'Мой напиток Mixology Cup', group: 'author' })"><i data-lucide="sparkles" class="icon"></i> Создать рецепт Mixology Cup</button>`
    : submitted
      ? `<button class="btn btn-outline" type="button" onclick="switchTab('recipes')"><i data-lucide="list-checks" class="icon"></i> Открыть рецепты</button>`
      : !recipeReady || rejected
      ? `<button class="btn btn-green" type="button" onclick="openEditDrink(${Number(draft.id)})"><i data-lucide="pencil" class="icon"></i> Продолжить рецепт</button>`
      : `<button class="btn btn-green" type="button" onclick="submitRecipeForPublication(${Number(draft.id)})"><i data-lucide="send" class="icon"></i> Отправить на проверку</button>`;
  const missing = progress?.missing?.length
    ? `<div class="author-launch-missing">Не хватает: ${_esc(progress.missing.slice(0, 4).join(', '))}${progress.missing.length > 4 ? '...' : ''}</div>`
    : '';
  return `
    <div class="author-launch-card">
      <div class="author-launch-main">
        <div>
          <div class="author-launch-kicker">Первый рецепт</div>
          <h4>Подготовьте напиток с Mixology Cup к публикации</h4>
          <p>Заполните профиль и карточку рецепта. После отправки команда Moscow Barista School проверит материалы и подготовит публикацию на витрине.</p>
        </div>
        <div class="author-launch-action">${cta}</div>
      </div>
      <div class="author-launch-steps">
        ${_renderLaunchStep(profileDone, 'Профиль автора', profileDone ? 'ФИО и телефон заполнены.' : 'Заполните ФИО и телефон.')}
        ${_renderLaunchStep(avatarDone, 'Фото автора', avatarDone ? 'Фото загружено.' : 'Добавьте фото для карточки автора.')}
        ${_renderLaunchStep(!!draft, 'Черновик рецепта', draft ? 'Черновик создан.' : 'Начните с рецепта чемпионатного напитка.')}
        ${_renderLaunchStep(recipeReady, 'Готовность рецепта', progress ? `${progress.done} из ${progress.total} блоков заполнено.` : 'Пока нет черновика.')}
        ${_renderLaunchStep(submitted, 'Отправка на проверку', submitted ? _statusLabel(publication.status) : 'Отправьте рецепт, когда все блоки заполнены.')}
      </div>
      ${progress ? `
        <div class="author-launch-progress">
          <div><span>Готовность рецепта</span><b>${progress.done}/${progress.total}</b></div>
          <div class="author-progress-bar"><i style="width:${progress.percent}%"></i></div>
          ${missing}
        </div>
      ` : ''}
    </div>
  `;
}

function _renderAuthorAttention() {
  const rejected = _authorRecipes.filter(r => r.status === 'rejected');
  if (!rejected.length) {
    return `
      <div class="author-mini-card author-attention-card is-clear">
        <div>
          <b>Сейчас ничего не требует внимания</b>
          <span>Если команда вернёт рецепт на доработку, он появится здесь первым.</span>
        </div>
      </div>
    `;
  }
  return `
    <div class="author-mini-card author-attention-card">
      <div>
        <b>${rejected.length === 1 ? '1 рецепт требует доработки' : `${rejected.length} рецепта требуют доработки`}</b>
        <span>Посмотрите комментарии проверки и отправьте обновлённую версию повторно.</span>
      </div>
      <div class="author-attention-list">
        ${rejected.slice(0, 3).map(r => `
          <button type="button" onclick="setAuthorPublicationFilter('attention')">
            ${_esc(r.title || 'Без названия')}
            <span>${_esc((r.review_flags || []).map(_reviewFlagLabel).slice(0, 2).join(', ') || 'Комментарий проверки')}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function _renderAuthorContractBlock() {
  const hasPublished = _authorRecipes.some(r => r.status === 'published');
  return `
    <div class="author-mini-card">
      <div class="author-mini-card-head">
        <div>
          <b>Данные для договора</b>
          <span>${hasPublished ? 'Договор ГПХ оформляется перед продажей и публикацией материалов.' : 'Понадобятся после согласования первого рецепта.'}</span>
        </div>
        <span class="author-mini-status ${hasPublished ? 'is-next' : ''}">${hasPublished ? 'Следующий этап' : 'Пока не требуется'}</span>
      </div>
    </div>
  `;
}

function _renderAuthorFinanceBlock() {
  const published = _authorRecipes.filter(r => r.status === 'published').length;
  return `
    <div class="author-mini-card">
      <div class="author-mini-card-head">
        <div>
          <b>Финансы</b>
          <span>${published ? 'Начисления появятся здесь после первых оплаченных продаж.' : 'Пока нет опубликованных рецептов и продаж.'}</span>
        </div>
        <span class="author-mini-status">0 ₽</span>
      </div>
      <div class="author-finance-note">Выплаты авторского вознаграждения проходят с 5 по 10 число следующего месяца.</div>
    </div>
  `;
}

function _renderAuthorPublicationRows() {
  const recipes = _filteredAuthorPublications();
  return recipes.length
    ? recipes.map(r => _renderAuthorPublicationCard(r)).join('')
    : `<div class="author-status-empty">${_esc(_publicationEmptyText())}</div>`;
}

function _renderAuthorPublicationCard(r) {
  const localDrink = _findAuthorDrinkForPublication(r);
  const recipe = _publicationRecipe(r, localDrink);
  const equipment = _equipmentNames(recipe.equipment);
  const imageUrl = _publicationImageUrl(r, localDrink);
  const date = _formatAuthorDate(r.updated_at || r.created_at);
  const publicUrl = r.status === 'published' && r.public_slug ? `/recipes/${_esc(r.public_slug)}` : '';
  const canOpenFallback = Number(r.id || 0) > 0;
  const ingredientCount = (recipe.ingredients || []).filter(row => _ingredientLabel(row)).length;
  return `
    <article class="author-pub-card">
      <div class="author-pub-main">
        <div class="author-pub-image ${imageUrl ? '' : 'is-empty'}">
          ${imageUrl ? `<img src="${_esc(imageUrl)}" alt="${_esc(r.title)}">` : '<i data-lucide="image" class="icon"></i>'}
        </div>
        <div class="author-pub-content">
          <div class="author-pub-top">
            <div>
              <h4>${_esc(r.title || 'Без названия')}</h4>
              <div class="author-pub-meta">
                <span>${_esc(_groupName(r.group_name || localDrink?.group))}</span>
                <span>${Number(r.volume_ml || localDrink?.vol || 0) || 0} мл</span>
                <span>${_rub(r.price || localDrink?.price || 0)}</span>
                ${date ? `<span>Обновлено ${_esc(date)}</span>` : ''}
              </div>
            </div>
            <span class="author-pub-status status-${_esc(r.status || 'submitted')}">${_esc(_statusLabel(r.status))}</span>
          </div>
          <p class="author-pub-hint">${_esc(_statusHint(r.status))}</p>
          ${r.review_comment ? `<div class="author-pub-review"><b>Комментарий проверки</b><span>${_esc(r.review_comment)}</span></div>` : ''}
          ${r.status === 'rejected' ? _reviewFlagsMarkup(r.review_flags || []) : ''}
          ${_publicationEventsMarkup(r.events || [])}
          <div class="author-pub-stats">
            <span><b>${ingredientCount}</b> ингредиентов</span>
            <span><b>${equipment.length}</b> оборудования</span>
            <span>${r.video_url ? 'Видео добавлено' : 'Видео не добавлено'}</span>
          </div>
          <details class="author-pub-details">
            <summary>Краткая готовность рецепта</summary>
            ${equipment.length ? `<div class="author-pub-equipment">${equipment.slice(0, 5).map(name => `<span>${_esc(name)}</span>`).join('')}</div>` : ''}
            ${ingredientCount ? `<div class="author-pub-ingredients">${_ingredientRows(recipe.ingredients)}</div>` : ''}
            <div class="author-pub-checklist">${_publicationChecklist(r, localDrink, recipe, equipment)}</div>
          </details>
          <div class="author-pub-actions">
            ${publicUrl ? `<a class="btn btn-outline" href="${publicUrl}" target="_blank" rel="noopener"><i data-lucide="external-link" class="icon"></i> Открыть на витрине</a>` : ''}
            ${canOpenFallback ? `<button class="btn btn-outline" type="button" onclick="openAuthorPublicationView(${Number(r.id)})"><i data-lucide="eye" class="icon"></i> Посмотреть карточку</button>` : ''}
            ${canOpenFallback ? `<button class="btn btn-outline" type="button" onclick="openAuthorPublicationHistory(${Number(r.id)})"><i data-lucide="history" class="icon"></i> История</button>` : ''}
            ${canOpenFallback && !['published', 'archived'].includes(r.status) ? `<button class="btn btn-green" type="button" onclick="openAuthorPublicationEdit(${Number(r.id)})"><i data-lucide="pencil" class="icon"></i> Редактировать рецепт</button>` : ''}
          </div>
        </div>
      </div>
    </article>
  `;
}

function _renderAuthorHistoryModal() {
  return `
    <div class="author-history-modal" id="author-history-modal" style="display:none" onclick="if(event.target===this)closeAuthorPublicationHistory()">
      <div class="author-history-dialog">
        <div class="author-history-head">
          <div>
            <h3 id="author-history-title">История рецепта</h3>
            <p id="author-history-subtitle">Статусы и действия по публикации.</p>
          </div>
          <button class="modal-close" onclick="closeAuthorPublicationHistory()">&times;</button>
        </div>
        <div class="author-history-body" id="author-history-body"></div>
      </div>
    </div>
  `;
}

export function openAuthorPublicationView(publicationId) {
  const publication = _publicationById(publicationId);
  if (!publication) return _notify('Публикация не найдена');
  const drink = _fallbackPublicationDrink(publication);
  if (!drink?.id || !window.openViewDrink) return _notify('Не удалось открыть карточку рецепта');
  window.openViewDrink(drink.id);
}

export function openAuthorPublicationEdit(publicationId) {
  const publication = _publicationById(publicationId);
  if (!publication) return _notify('Публикация не найдена');
  const drink = _fallbackPublicationDrink(publication);
  if (!drink?.id || !window.openEditDrink) return _notify('Не удалось открыть редактирование рецепта');
  window.openEditDrink(drink.id);
}

export function setAuthorPublicationFilter(filter) {
  const allowed = ['attention', 'submitted', 'published', 'archived', 'all'];
  _authorPublicationFilter = allowed.includes(filter) ? filter : 'attention';
  const root = document.getElementById('tab-authorProfile');
  if (root && window.activeTab === 'authorProfile') {
    renderAuthorProfile();
    return;
  }
  const list = document.getElementById('author-recipes-list');
  const tabs = document.getElementById('author-recipes-tabs');
  if (tabs) tabs.innerHTML = _renderAuthorPublicationTabs();
  if (list) list.innerHTML = _renderAuthorPublicationRows();
  if (window.lucide) lucide.createIcons();
}

export function openAuthorPublicationHistory(publicationId) {
  const publication = _publicationById(publicationId);
  const modal = document.getElementById('author-history-modal');
  const body = document.getElementById('author-history-body');
  const title = document.getElementById('author-history-title');
  const subtitle = document.getElementById('author-history-subtitle');
  if (!publication || !modal || !body) return _notify('История публикации не найдена');
  if (title) title.textContent = publication.title || 'История рецепта';
  if (subtitle) subtitle.textContent = `${_statusLabel(publication.status)} · ${_groupName(publication.group_name)}`;
  body.innerHTML = `
    <div class="author-history-summary">
      <span>Текущий статус</span>
      <b>${_esc(_statusLabel(publication.status))}</b>
    </div>
    ${publication.review_comment ? `<div class="author-pub-review"><b>Комментарий проверки</b><span>${_esc(publication.review_comment)}</span></div>` : ''}
    ${_reviewFlagsMarkup(publication.review_flags || [])}
    ${_publicationEventsListMarkup(publication.events || [])}
  `;
  modal.style.display = 'flex';
  document.body.classList.add('modal-open');
  document.addEventListener('keydown', _authorHistoryEsc);
  if (window.lucide) lucide.createIcons({ nodes: [modal] });
}

export function closeAuthorPublicationHistory() {
  const modal = document.getElementById('author-history-modal');
  if (!modal) return;
  modal.style.display = 'none';
  document.body.classList.remove('modal-open');
  document.removeEventListener('keydown', _authorHistoryEsc);
}

function _authorHistoryEsc(e) {
  if (e.key === 'Escape') closeAuthorPublicationHistory();
}

function _renderAuthorTerms() {
  return `
    <div class="author-card author-terms-card">
      <div class="author-terms-summary">
        <div>
          <div class="author-card-title">Условия сотрудничества</div>
          <h4>35% авторского вознаграждения с продаж рецептов</h4>
          <div class="author-terms-chips">
            <span>Договор ГПХ</span>
            <span>Выплаты 5-10 числа</span>
            <span>НДФЛ удерживается из вознаграждения</span>
          </div>
        </div>
        <button class="btn btn-outline" onclick="openAuthorTermsModal()"><i data-lucide="file-text" class="icon"></i> Посмотреть условия</button>
      </div>
    </div>
    <div class="author-terms-modal" id="author-terms-modal" style="display:none" onclick="if(event.target===this)closeAuthorTermsModal()">
      <div class="author-terms-dialog">
        <div class="author-terms-dialog-head">
          <div>
            <h3>Условия сотрудничества</h3>
            <p>Информационный блок для авторов рецептов.</p>
          </div>
          <button class="modal-close" onclick="closeAuthorTermsModal()">&times;</button>
        </div>
        ${_renderAuthorTermsBody()}
      </div>
    </div>
  `;
}

function _renderAuthorTermsBody() {
  return `
    <div class="author-terms-body">
      <div class="author-terms-text">
        <p>Moscow Barista School помогает авторам монетизировать авторские рецепты через платформу школы. Автор готовит рецепт и отправляет его на проверку, а команда школы берёт на себя модерацию, публикацию на сайте, продвижение, анонсы, приём оплат от покупателей и сопровождение продажи.</p>
        <p>После проверки рецепта мы заключаем с автором договор ГПХ. Публикация рецепта на витрине происходит после оформления договора и согласования материалов.</p>
        <p>Авторское вознаграждение составляет 35% от каждой фактически оплаченной продажи рецепта. Вознаграждение начисляется только по оплатам, которые не были отменены или возвращены покупателю.</p>
        <p>Moscow Barista School выступает налоговым агентом: удерживает НДФЛ из суммы авторского вознаграждения и перечисляет его в бюджет. Остальные обязательные начисления по договору, если они применимы, школа оплачивает за свой счёт.</p>
        <p>Выплата авторского вознаграждения производится один раз в месяц, с 5 по 10 число следующего месяца, за продажи предыдущего месяца.</p>
      </div>
      <div class="author-terms-examples">
        <div class="author-terms-example">
          <b>Если рецепт продан за 1 000 ₽</b>
          <span>35% авторского вознаграждения = 350 ₽</span>
          <span>НДФЛ 13% = 45,50 ₽</span>
          <strong>К выплате автору = 304,50 ₽</strong>
        </div>
        <div class="author-terms-example">
          <b>Если за месяц рецепт продан на 20 000 ₽</b>
          <span>35% авторского вознаграждения = 7 000 ₽</span>
          <span>НДФЛ 13% = 910 ₽</span>
          <strong>К выплате автору = 6 090 ₽</strong>
        </div>
      </div>
      <p class="author-terms-note">Расчёты приведены как пример для налогового резидента РФ при ставке НДФЛ 13%. Фактический размер удержаний может зависеть от налогового статуса автора и действующего законодательства. Публикация рецепта не гарантирует определённый объём продаж.</p>
    </div>
  `;
}

export function openAuthorTermsModal() {
  const modal = document.getElementById('author-terms-modal');
  if (!modal) return;
  modal.style.display = 'flex';
  document.body.classList.add('modal-open');
  document.addEventListener('keydown', _authorTermsEsc);
  if (window.lucide) lucide.createIcons({ nodes: [modal] });
}

export function closeAuthorTermsModal() {
  const modal = document.getElementById('author-terms-modal');
  if (!modal) return;
  modal.style.display = 'none';
  document.body.classList.remove('modal-open');
  document.removeEventListener('keydown', _authorTermsEsc);
}

function _authorTermsEsc(e) {
  if (e.key === 'Escape') closeAuthorTermsModal();
}

function _renderAuthorProfileMarkup() {
  const profile = _authorProfile || {};
  const avatarUrl = _assetUrl(profile.avatar_url || '');
  const rows = _authorLoading && !_authorLoaded
    ? '<div class="author-empty">Загрузка...</div>'
    : _renderAuthorPublicationRows();
  const tabs = _authorLoading && !_authorLoaded ? '' : _renderAuthorPublicationTabs();
  const attention = _authorLoading && !_authorLoaded ? '' : _renderAuthorAttention();
  return `
    <section class="author-workspace" id="author-workspace">
      <div class="author-head">
        <div>
          <h3>Профиль автора</h3>
          <p>Личные данные, публикации и условия сотрудничества.</p>
        </div>
        <button class="btn btn-outline" onclick="loadAuthorWorkspace(true)" title="Обновить"><i data-lucide="refresh-cw" class="icon"></i></button>
      </div>
      ${attention}
      ${_renderAuthorLaunchGuide()}
      <div class="author-grid">
        <div class="author-profile-side">
          <div class="author-card">
            <div class="author-card-title">Профиль</div>
            <div class="author-avatar-editor">
              <div class="author-avatar-preview ${avatarUrl ? '' : 'is-empty'}">
                ${avatarUrl ? `<img src="${_esc(avatarUrl)}" alt="Фото автора">` : '<i data-lucide="user" class="icon"></i>'}
              </div>
              <div class="author-avatar-actions">
                <b>Фото автора</b>
                <span>Эта фотография будет видна покупателям в карточках рецептов.</span>
                <label class="btn btn-outline author-avatar-btn">
                  <i data-lucide="image-plus" class="icon"></i>
                  Загрузить фото
                  <input type="file" accept="image/png,image/jpeg,image/webp" onchange="uploadAuthorAvatar(this)" hidden>
                </label>
              </div>
            </div>
            <div class="author-fields">
              <label>
                <span>Фамилия</span>
                <input id="author-last-name" placeholder="Иванов" value="${_esc(profile.last_name || '')}">
              </label>
              <label>
                <span>Имя</span>
                <input id="author-first-name" placeholder="Иван" value="${_esc(profile.first_name || '')}">
              </label>
              <label>
                <span>Отчество</span>
                <input id="author-patronymic" placeholder="Иванович" value="${_esc(profile.patronymic || '')}">
              </label>
              <label>
                <span>Телефон</span>
                <input id="author-phone" placeholder="Телефон" value="${_esc(profile.phone || '')}">
              </label>
              <label class="author-field-wide">
                <span>Коротко об авторе</span>
                <textarea id="author-bio" placeholder="Напишите ваши регалии, опыт, достижения и специализацию. Этот текст увидят покупатели в карточках рецептов и профиле автора.">${_esc(profile.bio || '')}</textarea>
              </label>
            </div>
            <button class="btn btn-green" onclick="saveAuthorProfile()">Сохранить профиль</button>
          </div>
          ${_renderAuthorContractBlock()}
          ${_renderAuthorFinanceBlock()}
        </div>
        <div class="author-card">
          <div class="author-card-title">Публикации</div>
          <div id="author-recipes-tabs">${tabs}</div>
          <div id="author-recipes-list">${rows}</div>
        </div>
      </div>
      ${_renderAuthorTerms()}
      ${_renderAuthorHistoryModal()}
    </section>
  `;
}

export function renderAuthorWorkspace() {
  if (!authorCanPublish()) return '';
  setTimeout(() => loadAuthorWorkspace(), 0);
  return _renderAuthorProfileMarkup();
}

export function renderAuthorProfile() {
  const root = document.getElementById('tab-authorProfile');
  if (!root) return;
  if (!authorCanPublish()) {
    root.innerHTML = '';
    return;
  }
  setTimeout(() => loadAuthorWorkspace(), 0);
  root.innerHTML = `
    <div class="page-title">
      <span class="page-title-left"><i data-lucide="user" class="icon"></i> Мой профиль</span>
    </div>
    ${_renderAuthorProfileMarkup()}
  `;
  if (window.lucide) lucide.createIcons({ nodes: [root] });
}

export async function loadAuthorWorkspace(force = false) {
  if (!authorCanPublish()) return;
  if (_authorLoading || (_authorLoaded && !force)) return;
  _authorLoading = true;
  try {
    const [profileRes, recipesRes, ingredientsRes, semisRes, draftsRes] = await Promise.all([
      fetch(`${API}/api/author/profile`, { headers: _authHeaders() }),
      fetch(`${API}/api/author/recipes`, { headers: _authHeaders() }),
      fetch(`${API}/api/author/ingredients`, { headers: _authHeaders() }),
      fetch(`${API}/api/author/semis`, { headers: _authHeaders() }),
      fetch(`${API}/api/author/drafts`, { headers: _authHeaders() }),
    ]);
    if (!profileRes.ok || !recipesRes.ok || !ingredientsRes.ok || !semisRes.ok || !draftsRes.ok) throw new Error('Не удалось загрузить кабинет автора');
    _authorProfile = await profileRes.json();
    _authorRecipes = await recipesRes.json();
    _authorIngredients = await ingredientsRes.json();
    _authorSemis = await semisRes.json();
    _authorDrafts = await draftsRes.json();
    _authorSemis.forEach(record => {
      const legacyId = record?.semi?._legacyLocalId;
      if (legacyId) _replaceSemiRefs(legacyId, record.client_id);
    });
    _syncAuthorIngredientsToMat(_authorIngredients);
    _syncAuthorSemisToState(_authorSemis);
    await _migrateLocalAuthorIngredients();
    await _migrateLocalAuthorSemis();
    _syncAuthorDraftsToDrinks(_authorDrafts);
    await _migrateLocalAuthorDrinks();
    _authorLoaded = true;
    if (window.activeTab === 'recipes' && window.renderRecipes) window.renderRecipes();
    if (window.activeTab === 'authorProfile' && window.renderTab) window.renderTab('authorProfile');
  } catch (e) {
    console.error('[author workspace]', e);
  } finally {
    _authorLoading = false;
  }
}

export async function saveAuthorSemiForItem(semi, { silent = false } = {}) {
  if (!semi || !authorCanPublish()) return null;
  const semiId = Number(semi._authorSemiId || 0);
  const url = semiId ? `${API}/api/author/semis/${semiId}` : `${API}/api/author/semis`;
  const method = semiId ? 'PUT' : 'POST';
  const r = await fetch(url, {
    method,
    headers: _authHeaders(),
    body: JSON.stringify(_authorSemiBody(semi)),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.detail || 'Не удалось сохранить полуфабрикат автора');
  const savedSemi = _replaceLocalSemi(semi.id, data);
  _authorSemis = _authorSemis.filter(record => Number(record.id) !== Number(data.id));
  _authorSemis.unshift(data);
  if (window.saveState) window.saveState();
  if (!silent && window.renderCost) window.renderCost();
  return savedSemi;
}

export async function deleteAuthorSemiForItem(semi, { silent = false } = {}) {
  const semiId = Number(semi?._authorSemiId || 0);
  if (!semiId || !authorCanPublish()) return;
  const r = await fetch(`${API}/api/author/semis/${semiId}`, {
    method: 'DELETE',
    headers: _authHeaders(),
  });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.detail || 'Не удалось удалить полуфабрикат автора');
  }
  _authorSemis = _authorSemis.filter(record => Number(record.id) !== semiId);
  if (!silent && window.renderCost) window.renderCost();
}

export async function saveAuthorIngredient(key, { silent = false } = {}) {
  if (!key || !window.MAT?.[key] || !authorCanPublish()) return null;
  const r = await fetch(`${API}/api/author/ingredients/${encodeURIComponent(key)}`, {
    method: 'PUT',
    headers: _authHeaders(),
    body: JSON.stringify(_authorIngredientBody(key)),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.detail || 'Не удалось сохранить ингредиент автора');
  _authorIngredients = _authorIngredients.filter(record => record.key !== data.key);
  _authorIngredients.unshift(data);
  _syncAuthorIngredientsToMat(_authorIngredients);
  if (window.saveState) window.saveState();
  if (!silent && window.renderCost) window.renderCost();
  return data;
}

export async function deleteAuthorIngredient(key, { silent = false } = {}) {
  if (!key || !authorCanPublish()) return;
  const r = await fetch(`${API}/api/author/ingredients/${encodeURIComponent(key)}`, {
    method: 'DELETE',
    headers: _authHeaders(),
  });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.detail || 'Не удалось удалить ингредиент автора');
  }
  _authorIngredients = _authorIngredients.filter(record => record.key !== key);
  if (!silent && window.renderCost) window.renderCost();
}

export async function saveAuthorDraftForDrink(drink, { silent = false } = {}) {
  if (!drink || !authorCanPublish()) return null;
  const body = _authorDraftBody(drink);
  const draftId = Number(drink._authorDraftId || 0);
  const url = draftId ? `${API}/api/author/drafts/${draftId}` : `${API}/api/author/drafts`;
  const method = draftId ? 'PUT' : 'POST';
  const r = await fetch(url, {
    method,
    headers: _authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.detail || 'Не удалось сохранить черновик автора');
  const savedDrink = _replaceLocalDraft(drink.id, data);
  _authorDrafts = _authorDrafts.filter(record => Number(record.id) !== Number(data.id));
  _authorDrafts.unshift(data);
  if (window.saveState) window.saveState();
  if (!silent && window.renderRecipes) window.renderRecipes();
  return savedDrink;
}

export async function deleteAuthorDraftForDrink(drink, { silent = false } = {}) {
  const draftId = Number(drink?._authorDraftId || 0);
  if (!draftId || !authorCanPublish()) return;
  const r = await fetch(`${API}/api/author/drafts/${draftId}`, {
    method: 'DELETE',
    headers: _authHeaders(),
  });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.detail || 'Не удалось удалить черновик автора');
  }
  _authorDrafts = _authorDrafts.filter(record => Number(record.id) !== draftId);
  if (!silent && window.renderRecipes) window.renderRecipes();
}

export async function saveAuthorProfile() {
  const body = {
    first_name: document.getElementById('author-first-name')?.value || '',
    last_name: document.getElementById('author-last-name')?.value || '',
    patronymic: document.getElementById('author-patronymic')?.value || '',
    phone: document.getElementById('author-phone')?.value || '',
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

export async function uploadAuthorAvatar(input) {
  const file = input?.files?.[0];
  if (!file) return;
  if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
    input.value = '';
    return _notify('Можно загрузить только JPG, PNG или WebP');
  }
  if (file.size > 5 * 1024 * 1024) {
    input.value = '';
    return _notify('Фото должно быть не больше 5 МБ');
  }
  const form = new FormData();
  form.append('file', file);
  try {
    const r = await fetch(`${API}/api/author/profile/avatar`, {
      method: 'POST',
      headers: _authUploadHeaders(),
      body: form,
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.detail || 'Не удалось загрузить фото');
    _authorLoaded = false;
    await loadAuthorWorkspace(true);
    _notify('Фото автора загружено');
  } catch (e) {
    _notify(e.message);
  } finally {
    input.value = '';
  }
}

export async function uploadAuthorRecipeImage(file) {
  if (!file) return '';
  if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
    throw new Error('Можно загрузить только JPG, PNG или WebP');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Фото должно быть не больше 5 МБ');
  }
  const form = new FormData();
  form.append('file', file);
  const r = await fetch(`${API}/api/author/recipe-image`, {
    method: 'POST',
    headers: _authUploadHeaders(),
    body: form,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.detail || 'Не удалось загрузить фото рецепта');
  return data.image_url || '';
}

function _hasValidRecipeIngredient(recipe = []) {
  return (recipe || []).some(row => {
    const hasItem = row && (row.mat || row.semi != null);
    return hasItem && Number(row.amt || 0) > 0;
  });
}

function _textFilled(value) {
  return String(value || '').trim().length > 0;
}

export function validateAuthorRecipeForPublication(drink, price, equipment = []) {
  const missing = [];
  const add = (field, label) => missing.push({ field, label });

  if (!_textFilled(drink?._serverName || drink?.name)) add('name', 'Название');
  if (!_textFilled(drink?.group)) add('group', 'Группа');
  if (!(Number(price || 0) > 0)) add('price', 'Рекомендуемая цена продажи');
  if (!(Number(drink?.vol || 0) > 0)) add('volume', 'Объём');
  if (!_hasValidRecipeIngredient(drink?.recipe || [])) add('ingredients', 'Ингредиенты');
  if (!_textFilled(drink?.image)) add('image', 'Изображение');
  if (!_textFilled(drink?.process)) add('process', 'Процесс приготовления');
  if (!equipment.length) add('equipment', 'Оборудование для приготовления');
  if (!_textFilled(drink?.storage_temp)) add('storage_temp', 'Температура подачи');
  if (!_textFilled(drink?.storage_life)) add('storage_life', 'Срок реализации');
  if (!_textFilled(drink?.appearance)) add('appearance', 'Органолептические показатели: внешний вид');
  if (!_textFilled(drink?.taste)) add('taste', 'Вкус и запах');
  if (!_textFilled(drink?.consistency)) add('consistency', 'Консистенция');

  return missing;
}

function _authorApiError(data, fallback) {
  const detail = data?.detail;
  if (detail && typeof detail === 'object') {
    const labels = detail.missing_labels || detail.missing || [];
    return `${detail.message || fallback}${labels.length ? `:\n\n${labels.map(label => `• ${label}`).join('\n')}` : ''}`;
  }
  return detail || fallback;
}

export async function submitRecipeForPublication(drinkId) {
  if (!authorCanPublish()) return _notify('Доступ автора не выдан');
  let d = (window.DRINKS || []).find(x => Number(x.id) === Number(drinkId) && x.custom) ||
    (window.DRINKS || []).find(x => Number(x.id) === Number(drinkId));
  if (!d) return _notify('Рецепт не найден');
  const price = d._serverPrice != null ? d._serverPrice : ((window.S && window.S.salePrices && window.S.salePrices[d.id]) || 0);
  const equipment = (d.equipment || []).map(item => ({
    id: item.id || String(item.name || item).trim().toLowerCase(),
    name: item.name || item,
  })).filter(item => item.name);
  const missing = validateAuthorRecipeForPublication(d, price, equipment);
  if (missing.length) {
    const labels = missing.map(item => item.label);
    _notify(`Заполните обязательные поля для публикации:\n\n${labels.map(label => `• ${label}`).join('\n')}`);
    if (window.openEditDrink) {
      window.openEditDrink(d.id);
      setTimeout(() => {
        if (window.markDrinkPublicationMissing) {
          window.markDrinkPublicationMissing(missing.map(item => item.field), labels);
        }
      }, 0);
    }
    return;
  }
  try {
    const savedDrink = await saveAuthorDraftForDrink(d, { silent: true });
    if (savedDrink) d = savedDrink;
  } catch (e) {
    _notify(e.message || 'Не удалось сохранить актуальную версию рецепта перед отправкой');
    return;
  }
  const description = prompt('Короткое описание для витрины рецептов', d.process || '') || '';
  const snapshot = _authorRecipeSnapshot(d, equipment, price);
  const body = {
    recipe_local_id: String(d.id),
    title: d._serverName || d.name,
    group_name: d.group || '',
    volume_ml: Number(d.vol || 0),
    price: Number(price || 0),
    cost: Number(window.calcCost ? window.calcCost(d) : 0),
    recipe: snapshot.recipe,
    public_description: description,
    image_url: snapshot.imageUrl,
    video_url: snapshot.videoUrl,
  };
  try {
    const r = await fetch(`${API}/api/author/recipes`, {
      method: 'POST',
      headers: _authHeaders(),
      body: JSON.stringify(body),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(_authorApiError(data, 'Не удалось отправить рецепт'));
    _authorLoaded = false;
    await loadAuthorWorkspace(true);
    _notify('Рецепт отправлен на модерацию');
  } catch (e) {
    _notify(e.message);
  }
}
