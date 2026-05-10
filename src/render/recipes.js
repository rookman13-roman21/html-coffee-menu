// ════════════════════════════════════════════════════════════════════
//  RENDER — RECIPES  (src/render/recipes.js)
//
//  Все данные читаются из window.* — доступны после Object.assign
//  в конце public/app.js.
// ════════════════════════════════════════════════════════════════════

export function renderRecipes() {
  const {
    recipeSort, recipeGroup, recipeSearch,
    setRecipeSort, setRecipeGroup, filterRecipes,
    openAddDrink, exportTechCards,
    toggleRecipesIntro,
    _searchClear,
  } = window;

  const sortLabels = [
    { k: 'group',  l: 'По группам' },
    { k: 'name',   l: 'По алфавиту' },
    { k: 'fc',     l: 'По FC% ↓' },
    { k: 'profit', l: 'По прибыли ↓' },
  ];
  const groupFilters = [
    { k: 'all',    l: 'Все' },
    { k: 'hot',    l: '<i data-lucide="coffee" class="icon"></i> Горячие' },
    { k: 'tea',    l: '<i data-lucide="leaf" class="icon"></i> Чай' },
    { k: 'cold',   l: '<i data-lucide="snowflake" class="icon"></i> Холодные' },
    { k: 'filter', l: '<i data-lucide="droplets" class="icon"></i> Пуровер' },
    { k: 'author', l: '<i data-lucide="sparkles" class="icon"></i> Авторские' },
  ];
  const sortOptions = sortLabels.map(s =>
    `<option value="${s.k}"${recipeSort === s.k ? ' selected' : ''}>${s.l}</option>`
  ).join('');
  const sortSelect = `<select id="recipe-sort-select" class="recipe-sort-select" onchange="setRecipeSort(this.value)">${sortOptions}</select>`;
  const filterBtns = groupFilters.map(g =>
    `<button class="recipe-filter-btn${recipeGroup === g.k ? ' active' : ''}" data-grp="${g.k}" onclick="setRecipeGroup('${g.k}')">${g.l}</button>`
  ).join('');

  document.getElementById('tab-recipes').innerHTML = `
    <div class="page-title">
      <span class="page-title-left"><i data-lucide="clipboard-list" class="icon"></i> Рецептуры</span>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="btn btn-outline recipes-intro-toggle" id="recipes-intro-btn-hdr" onclick="toggleRecipesIntro()" title="Подсказка"><i data-lucide="info" class="icon"></i></button>
        <button class="btn btn-green" onclick="openAddDrink()"><i data-lucide="plus" class="icon"></i> <span class="recipes-btn-txt">Напиток</span></button>
        <button class="btn btn-outline" onclick="exportTechCards()" title="Экспорт техкарт по ГОСТ Р 53105 в PDF"><i data-lucide="download" class="icon"></i></button>
      </div>
    </div>
    <div class="tab-intro" id="recipes-intro">
      <div class="tab-intro-icon"><i data-lucide="clipboard-list" class="icon icon-lg"></i></div>
      <div>
        <div class="tab-intro-title">Рецептуры</div>
        <div class="tab-intro-text">
          Здесь хранятся рецептуры всех напитков: состав, граммовки ингредиентов и себестоимость каждой позиции.
          Карточка показывает, из чего складывается цена напитка и какую долю занимает каждый ингредиент.
          При изменении цен на сырьё во вкладке «Поставщики» карточки пересчитываются автоматически.
        </div>
        <div class="tab-intro-steps">
          <span class="tab-intro-step">📋 Клик на карточку — открыть полную техкарту с процессом приготовления</span>
          <span class="tab-intro-step">✏️ Иконка редактирования — изменить рецептуру или добавить новый напиток</span>
          <span class="tab-intro-step">🔍 Поиск и фильтры — быстро найти нужный напиток по группе или названию</span>
          <span class="tab-intro-step">📄 PDF техкарт — выгрузить технологические карты по ГОСТ Р 53105</span>
        </div>
      </div>
    </div>
    <div class="recipes-toolbar">
      <div class="recipes-toolbar-row recipes-toolbar-main">
        <div class="search-wrap" style="margin-bottom:0;flex-shrink:0;min-width:180px;max-width:220px">
          <span class="search-icon"><i data-lucide="search" class="icon"></i></span>
          <input class="search-inp" id="recipe-search" type="text" placeholder="Поиск..."
            value="${recipeSearch}" oninput="filterRecipes(this.value);_searchClear(this)">
          <button class="search-clear${recipeSearch ? ' visible' : ''}" title="Очистить"
            onclick="filterRecipes('');var el=document.getElementById('recipe-search');el.value='';_searchClear(el)">✕</button>
        </div>
        <div class="recipe-filter-btns">${filterBtns}</div>
        <div class="recipes-toolbar-sort" style="margin-left:auto;flex-shrink:0">${sortSelect}</div>
      </div>
    </div>
    <div class="recipe-groups"></div>
  `;
  filterRecipes();
}
