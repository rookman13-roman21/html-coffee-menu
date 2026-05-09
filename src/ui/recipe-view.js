// src/ui/recipe-view.js
// Просмотр карточки напитка (попап рецептуры) + фильтры вкладки Рецептуры

export function openViewDrink(id)     { return window.openViewDrink(id); }
export function mvdOpenEdit()         { return window.mvdOpenEdit(); }
export function mvdToggleDownload(e)  { return window.mvdToggleDownload(e); }
export function _mvdGetData()         { return window._mvdGetData(); }
export function setRecipeSort(s)      { return window.setRecipeSort(s); }
export function setRecipeGroup(g)     { return window.setRecipeGroup(g); }
export function filterRecipes(val)    { return window.filterRecipes(val); }
export function toggleRecipesIntro()  { return window.toggleRecipesIntro(); }
export function toggleSupIntro()      { return window.toggleSupIntro(); }
export function toggleSalesIntro()    { return window.toggleSalesIntro(); }
export function toggleFinIntro()      { return window.toggleFinIntro(); }
