// ════════════════════════════════════════════════════════════════════
//  ENTRY POINT  (Vite — src/main.js)
// ════════════════════════════════════════════════════════════════════
//
//  Стратегия рефакторинга: постепенно выносим логику из public/app.js
//  в ES-модули в src/. public/app.js пока остаётся и подключается
//  через <script src="/app.js"> в index.html.
//
//  Перенесённые модули экспортируются и дублируются в window.*
//  для обратной совместимости с app.js (он ждёт глобальные функции).
//
//  Статус модулей:
//   ✅ src/utils/format.js  — rub, rubSemi, pct, int, fcCls, riskBadge, abcBadge, fcCombinedHtml
//   ✅ src/utils/calc.js    — calcCost, calcNutrition, enrich, withABC, bepCalc и др.
//   ✅ src/utils/image.js   — DRINK_IMAGES, getDrinkImage, _compressImageDataURL
//   ✅ src/state/store.js   — saveState, loadState, loadLocIndex, saveLocIndex, migrateOldState, activeLoc, getOrgInfo
  // ✅ src/render/cost.js — renderCost
  // ✅ src/render/sales.js — renderSales
  // ✅ src/render/recipes.js — renderRecipes
  // ✅ src/render/finmodel.js — renderFinModel
//   ✅ src/export/techcards.js — exportTechCards, exportSemiTechCards, mvdDownloadPDF/Semi/Excel
//   ⬜ src/export/excel.js
//   ✅ src/modals/drink.js   — openAddDrink, openEditDrink, saveDrink, deleteDrink, resetDrink
//   ✅ src/modals/semi.js    — openAddSemi, openEditSemi, saveSemi, deleteSemi
//   ✅ src/modals/mat.js     — openEditMat, saveMat, cancelMat, deleteMat
//   ✅ src/export/csv.js     — exportCSV, exportDashboard, exportSales
//   ✅ src/ui/sort.js        — sortDrinks, setSort, thSort, filterSales, setSalesSort
//   ✅ src/ui/updaters.js    — onMatPrice, onSalePrice, onPortions, renderTab, resetAll...
//   ✅ src/ui/payroll.js     — calcPositionCosts, payrollTotal, onPayrollPos...
//   ✅ src/ui/locations.js   — switchLocation, openAddLocation, saveLocation...
//   ✅ src/ui/modals.js      — openModal, closeModal, safeCloseModal...
//   ✅ src/ui/cost-table.js  — setMatCat, toggleMatCat, openMatUsage...
//   ✅ src/ui/ingredients.js — matOptions, addIngRow, _searchClear...
//   ✅ src/ui/suppliers.js   — openSupplierModal, saveSupplier...
//   ✅ src/ui/recipe-view.js — openViewDrink, setRecipeGroup, filterRecipes...
//   ✅ src/ui/misc.js        — openTemplatesModal, generateInsights, exportFullPDF...
//   ✅ src/data/mat.js       — MAT_CATEGORIES, MAT, MAT_NUTRITION, MAT_ORIG, BASE_MAT_KEYS
//   ✅ src/data/drinks.js    — DRINKS, GROUP_LABEL, DRINK_QUALITY, DRINKS_ORIG, BASE_DRINK_IDS
//   ✅ src/data/constants.js — SALES_PRESETS, FIXED_COSTS_CATS, FIXED_COSTS_DEF, MENU_TEMPLATES
// ════════════════════════════════════════════════════════════════════

import { MAT_CATEGORIES, MAT, MAT_NUTRITION, MAT_ORIG, BASE_MAT_KEYS } from './data/mat.js';
import { DRINKS, GROUP_LABEL, DRINK_QUALITY, DRINKS_ORIG, BASE_DRINK_IDS } from './data/drinks.js';
import { SALES_PRESETS, FIXED_COSTS_CATS, _nextCostId, FIXED_COSTS_DEF, MENU_TEMPLATES } from './data/constants.js';

import {
  rub, rubSemi, pct, int,
  fcCls, riskBadge, abcBadge, fcCombinedHtml,
} from './utils/format.js';

import {
  _semiUnitFactor, _semiDrinkFactor,
  calcSemiCostPerUnit, calcCost, calcIngCost, calcNutrition,
  enrich, withABC,
  avgMetrics, weightedMetrics, salesMetrics, bepCalc,
  getEffectiveCosts,
} from './utils/calc.js';

import {
  DRINK_IMAGES, getDrinkImage, _compressImageDataURL,
} from './utils/image.js';

import {
  saveState, loadState,
  loadLocIndex, saveLocIndex, migrateOldState,
  activeLoc, getOrgInfo,
  S, Loc, DEFAULTS, resetGlobalsToBase, locDataKey, _wif,
  LOC_INDEX_KEY, LOC_ACTIVE_KEY, LOC_DATA_PREFIX, OLD_STATE_KEY,
} from './state/store.js';

import {
  _editMatKey, _pendingMatSelectEl, _pendingSemiMatSelectEl,
  searchQuery, _renderTimer,
  dirty, sortState, salesSortState, salesSearch,
  _matActiveCat, _matCollapsed, _semiCollapsed, _supCollapsed, _ingCollapsed,
  recipeSearch, recipeSort, recipeGroup,
  _mvdId, _matPriceBeforeEdit, _fceIdx,
  PS_DEFAULTS, MAT_CATEGORY, CAT_LABELS,
  _supplierEditKey, _supplierFromList, _supBookEditId,
  supListSearch, supListFilter, _supQuickKey, _supQuickEl,
  _EDITABLE_MODALS, _dirtyModalSet,
} from './state/ui-state.js';

import {
  renderDashboard, filterDashboard, setDashGroup, toggleDashIntro, toggleTop10, initTop10Collapse,
} from './render/dashboard.js';

import {
  renderCost,
} from './render/cost.js';

import {
  renderSales,
} from './render/sales.js';

import {
  renderRecipes,
} from './render/recipes.js';

import {
  renderFinModel,
} from './render/finmodel.js';

import {
  exportTechCards, exportSemiTechCards,
  exportSingleSemiPDF, exportSingleSemiXLSX,
  mvdDownloadPDF, mvdDownloadSemiPDF, mvdDownloadExcel,
  _buildTechCardBlock, _openTechCardsWindow, _buildSemiTechCardBlock,
  _printViaIframe,
} from './export/techcards.js';

import {
  openAddDrink, openEditDrink, saveDrink, deleteDrink, resetDrink,
  mdDeleteAction, onDrinkImgChange, clearDrinkImg,
} from './modals/drink.js';

import {
  openAddSemi, openEditSemi, saveSemi, deleteSemi,
  addSemiIngRow, onSemiImgChange, clearSemiImg,
  _updateSemiCostPreview, _onSemiMatChange, _autoFillSemiYield,
  _updateSemiIngCost, _autoCalcSemiIngYield,
} from './modals/semi.js';

import {
  openEditMat, saveMat, cancelMat, deleteMat, matOnlyOptions,
  deleteEditingMat, onMatPurchaseUrlInput,
} from './modals/mat.js';

import {
  exportCSV, exportDashboard, exportSales,
} from './export/csv.js';

import {
  sortDrinks, setSort, thSort,
  setSalesSort, thSalesSort, filterSales,
} from './ui/sort.js';

import {
  markDirty, markDirtyDebounce, renderActive, renderTab,
  onMatPriceFocus, onMatPriceInput, onMatPriceCommit, onMatPrice,
  onSalePrice, onTargetFCSilent, onTargetFC, onPortions, onDays,
  applySalesPreset, scaleSalesPortions,
  onFixedCost, onFixedCostName,
  flashCells, resetAll, switchTab,
} from './ui/updaters.js';

import {
  calcPositionCosts, payrollPositionTotal, payrollTotal, payrollTotals,
  empTypeTip, onPayrollPos, addPayrollPosition, deletePayrollPosition,
  scrollToPayroll, EMP_TYPE_LABELS, PS,
  _refreshPayrollRow, _refreshPayrollSummary,
} from './ui/payroll.js';

import {
  renderLocSwitcherUI, renderLocList, toggleLocMenu, toggleExportMenu,
  switchLocation, openAddLocation, renameActiveLocation, deleteActiveLocation,
  saveLocation,
} from './ui/locations.js';

import {
  openModal, closeModal, safeCloseModal,
  _markModalDirty, _clearModalDirty, _isModalDirty,
  _showUnsavedWarning, _dismissUnsavedWarning, _forceCloseModal,
  showAlert, showConfirm,
  closeOnboarding, toggleTheme, toggleBurger,
} from './ui/modals.js';

import {
  setMatCat, toggleMatCat, toggleSemiCat,
  toggleSupSection, toggleIngSection, toggleSemiSection,
  scrollCostTo, openMatUsage, _buildMatUsageMap, _buildSemiUsageMap,
  addFixedCost, addFixedCostInCat, delFixedCost,
  onTaxMode, onInvestment, toggleFcCat,
  openCostEditor, closeCostEditor, saveCostEditor, deleteCostFromEditor,
} from './ui/cost-table.js';

import {
  matOptions, _ingPlaceholder, _ingStep,
  _onIngMatChange, _calcIngRowCost, _updateIngRowCost, addIngRow, _autoCalcDrinkIngYield,
  _searchClear, openSupQuickDrop, _fillMatSupBookSelect, _onMatSupBookChange,
} from './ui/ingredients.js';

import {
  openSupplierInfo, siOpenEdit, openSupplierModal, editSupFromList,
  cancelSupplierModal, saveSupplier, openSuppliersList, renderSuppliersList,
  openSupplierBookModal, cancelSupplierBookModal, deleteSupplierBook,
} from './ui/suppliers.js';

import {
  openViewDrink, openViewSemi, mvdOpenEdit, mvdToggleDownload, _mvdGetData,
  mvdSemiDownloadPDF, mvdSemiDownloadXLSX,
  setRecipeSort, setRecipeGroup, filterRecipes,
  openVideoModal, closeVideoModal,
  toggleRecipesIntro, toggleSupIntro, toggleSalesIntro, toggleFinIntro,
} from './ui/recipe-view.js';

import {
  openTemplatesModal, chooseTemplate, applyTemplateData,
  generateInsights, toggleSeasonality, openDropCandidates, _confirmDeleteDropDrink,
  onWhatIf, exportFullPDF, exportFullXLSX, exportMaterialsPDF, exportMaterialsXLSX,
  buildBEPChart, applyPayrollToFixed, onPayrollSetting, togglePayrollSettings,
  toggleFixedHint, _matDisplayUnit, buildSeasonalChart, recalcWhatIf3,
  onWhatIf3, resetWhatIf3, openPriceHistory,
  onSeasonalMonth, openSeasonDrawer, closeSeasonDrawer, onSeasonDrawerChange,
  applySeasonPreset, _updateDrawerRangeColor, onFixedCostVariable,
  exportSuppliersPDF, exportSuppliersXLSX,
} from './ui/misc.js';

// ─── Реэкспорт в window для обратной совместимости с public/app.js ──
//
// ⚠️  ВАЖНО: app.js объявляет MAT, S, DRINKS, SEMI, Loc через const/let —
//     они НЕ попадают в window.*. Наши функции из src/ читают window.MAT
//     и т.д., поэтому они сломают рендеры, если перезапишут рабочие версии
//     из app.js (которые замыкаются на локальные const-переменные).
//
//  Стратегия переходного периода:
//   • Пока функция есть в app.js — НЕ перезаписываем её на window.
//   • Присваиваем в window только то, чего ещё нет (window[k] === undefined).
//   • Когда функция УДАЛЕНА из app.js — она автоматически начнёт браться
//     отсюда (window[k] будет undefined → присвоится наша версия).
//
// ─── Форматирование — назначаем ВСЕГДА (app.js их больше не определяет) ──
const _formatExports = {
  rub, rubSemi, pct, int,
  fcCls, riskBadge, abcBadge, fcCombinedHtml,
};
Object.assign(window, _formatExports);

const _calcExports = {
  _semiUnitFactor, _semiDrinkFactor,
  calcSemiCostPerUnit, calcCost, calcIngCost, calcNutrition,
  enrich, withABC,
  avgMetrics, weightedMetrics, salesMetrics, bepCalc,
  getEffectiveCosts,
};
Object.assign(window, _calcExports);

const _imageExports = {
  DRINK_IMAGES, getDrinkImage, _compressImageDataURL,
};
Object.assign(window, _imageExports);

// ─── state/ui-state — удалены из app.js — назначаем безусловно ───────────
Object.assign(window, {
  _editMatKey, _pendingMatSelectEl, _pendingSemiMatSelectEl,
  searchQuery, _renderTimer,
  dirty, sortState, salesSortState, salesSearch,
  _matActiveCat, _matCollapsed, _semiCollapsed, _supCollapsed, _ingCollapsed,
  recipeSearch, recipeSort, recipeGroup,
  _mvdId, _matPriceBeforeEdit, _fceIdx,
  PS_DEFAULTS, MAT_CATEGORY, CAT_LABELS,
  _supplierEditKey, _supplierFromList, _supBookEditId,
  supListSearch, supListFilter, _supQuickKey, _supQuickEl,
  _EDITABLE_MODALS, _dirtyModalSet,
});

// ─── state/store — удалены из app.js — назначаем безусловно ─────────────────
const _storeExports = {
  loadLocIndex, saveLocIndex, migrateOldState,
  activeLoc, getOrgInfo,
  saveState, loadState,
  S, Loc, DEFAULTS, resetGlobalsToBase, locDataKey, _wif,
  LOC_INDEX_KEY, LOC_ACTIVE_KEY, LOC_DATA_PREFIX, OLD_STATE_KEY,
};
Object.assign(window, _storeExports);

// ─── data/* — данные (удалены из app.js) — назначаем безусловно ──────────
Object.assign(window, {
  MAT_CATEGORIES, MAT, MAT_NUTRITION, MAT_ORIG, BASE_MAT_KEYS,
  DRINKS, GROUP_LABEL, DRINK_QUALITY, DRINKS_ORIG, BASE_DRINK_IDS,
  SALES_PRESETS, FIXED_COSTS_CATS, _nextCostId, FIXED_COSTS_DEF, MENU_TEMPLATES,
});

// ─── Остальное — не перезаписываем то, что уже определено app.js ────
const _srcExports = {
  // render/dashboard
  renderDashboard, filterDashboard, setDashGroup, toggleDashIntro, toggleTop10, initTop10Collapse,
  // render/cost
  renderCost,
  // render/sales
  renderSales,
  // render/recipes
  renderRecipes,
  // render/finmodel
  renderFinModel,
  // export/techcards
  exportTechCards, exportSemiTechCards,
  exportSingleSemiPDF, exportSingleSemiXLSX,
  mvdDownloadPDF, mvdDownloadSemiPDF, mvdDownloadExcel,
  _buildTechCardBlock, _openTechCardsWindow, _buildSemiTechCardBlock,
  _printViaIframe,
  // modals/drink
  openAddDrink, openEditDrink, saveDrink, deleteDrink, resetDrink,
  mdDeleteAction, onDrinkImgChange, clearDrinkImg,
  // modals/semi
  openAddSemi, openEditSemi, saveSemi, deleteSemi,
  addSemiIngRow, onSemiImgChange, clearSemiImg,
  _updateSemiCostPreview, _onSemiMatChange, _autoFillSemiYield,
  _updateSemiIngCost, _autoCalcSemiIngYield,
  // modals/mat
  openEditMat, saveMat, cancelMat, deleteMat, matOnlyOptions,
  deleteEditingMat, onMatPurchaseUrlInput,
  // export/csv
  exportCSV, exportDashboard, exportSales,
  // ui/sort
  sortDrinks, setSort, thSort, setSalesSort, thSalesSort, filterSales,
  // ui/updaters
  markDirty, markDirtyDebounce, renderActive, renderTab,
  onMatPriceFocus, onMatPriceInput, onMatPriceCommit, onMatPrice,
  onSalePrice, onTargetFCSilent, onTargetFC, onPortions, onDays,
  applySalesPreset, scaleSalesPortions,
  onFixedCost, onFixedCostName,
  flashCells, resetAll, switchTab,
  // ui/payroll
  calcPositionCosts, payrollPositionTotal, payrollTotal, payrollTotals,
  empTypeTip, onPayrollPos, addPayrollPosition, deletePayrollPosition,
  scrollToPayroll, EMP_TYPE_LABELS, PS,
  _refreshPayrollRow, _refreshPayrollSummary,
  // ui/locations
  renderLocSwitcherUI, renderLocList, toggleLocMenu, toggleExportMenu,
  switchLocation, openAddLocation, renameActiveLocation, deleteActiveLocation,
  saveLocation,
  // ui/modals
  openModal, closeModal, safeCloseModal,
  _markModalDirty, _clearModalDirty, _isModalDirty,
  _showUnsavedWarning, _dismissUnsavedWarning, _forceCloseModal,
  showAlert, showConfirm,
  closeOnboarding, toggleTheme, toggleBurger,
  // ui/cost-table
  setMatCat, toggleMatCat, toggleSemiCat,
  toggleSupSection, toggleIngSection, toggleSemiSection,
  scrollCostTo, openMatUsage, _buildMatUsageMap, _buildSemiUsageMap,
  addFixedCost, addFixedCostInCat, delFixedCost,
  onTaxMode, onInvestment, toggleFcCat,
  openCostEditor, closeCostEditor, saveCostEditor, deleteCostFromEditor,
  // ui/ingredients
  matOptions, _ingPlaceholder, _ingStep,
  _onIngMatChange, _calcIngRowCost, _updateIngRowCost, addIngRow, _autoCalcDrinkIngYield,
  _searchClear, openSupQuickDrop, _fillMatSupBookSelect, _onMatSupBookChange,
  // ui/suppliers
  openSupplierInfo, siOpenEdit, openSupplierModal, editSupFromList,
  cancelSupplierModal, saveSupplier, openSuppliersList, renderSuppliersList,
  openSupplierBookModal, cancelSupplierBookModal, deleteSupplierBook, exportSuppliersPDF, exportSuppliersXLSX,
  // ui/recipe-view
  openViewDrink, openViewSemi, mvdOpenEdit, mvdToggleDownload, _mvdGetData,
  mvdSemiDownloadPDF, mvdSemiDownloadXLSX,
  setRecipeSort, setRecipeGroup, filterRecipes,
  openVideoModal, closeVideoModal,
  toggleRecipesIntro, toggleSupIntro, toggleSalesIntro, toggleFinIntro,
  // ui/misc
  openTemplatesModal, chooseTemplate, applyTemplateData,
  generateInsights, toggleSeasonality, openDropCandidates, _confirmDeleteDropDrink,
  onWhatIf, exportFullPDF, exportFullXLSX, exportMaterialsPDF, exportMaterialsXLSX,
  buildBEPChart, applyPayrollToFixed, onPayrollSetting, togglePayrollSettings,
  toggleFixedHint, _matDisplayUnit, buildSeasonalChart, recalcWhatIf3,
  onWhatIf3, resetWhatIf3, openPriceHistory,
  onSeasonalMonth, openSeasonDrawer, closeSeasonDrawer, onSeasonDrawerChange,
  applySeasonPreset, _updateDrawerRangeColor, onFixedCostVariable,
  exportSuppliersPDF, exportSuppliersXLSX,
  // state/store
  // saveState/loadState перенесены в _storeExports выше
};
// Не перезаписываем то, что уже определено app.js
Object.entries(_srcExports).forEach(([k, v]) => {
  if (window[k] === undefined) window[k] = v;
});

// ════════════════════════════════════════════════════════════════════
//  RUNTIME COUNTERS & SEMI (перенесено из app.js)
//  Должно быть ДО INIT — loadState читает window.SEMI/nextSemiId
// ════════════════════════════════════════════════════════════════════
const SEMI = [];
window.SEMI        = SEMI;
window.nextSemiId  = 1;
window.nextDrinkId = DRINKS.reduce((max, d) => Math.max(max, d.id + 1), 27);
window.nextMatKey  = 1;

// ════════════════════════════════════════════════════════════════════
//  INIT (перенесено из app.js)
// ════════════════════════════════════════════════════════════════════
loadLocIndex();
if (!Loc.list.length) {
  try {
    if (localStorage.getItem(OLD_STATE_KEY)) migrateOldState();
  } catch(e) {}
}
if (!Loc.list.length) {
  Loc.list = [{ id: 'loc_default', name: 'Моя кофейня', icon: '☕' }];
  Loc.activeId = 'loc_default';
  saveLocIndex();
}
if (!Loc.activeId) { Loc.activeId = Loc.list[0].id; saveLocIndex(); }
loadState();

try { renderLocSwitcherUI(); } catch(e) { console.error('[renderLocSwitcherUI]', e); }
try {
  if (localStorage.getItem('mbs_theme') === 'dark') {
    document.body.classList.add('dark');
    const icon = document.getElementById('theme-icon');
    if (icon) icon.setAttribute('data-lucide', 'sun');
  }
  if (!localStorage.getItem('mbs_onboard')) {
    document.getElementById('onboarding').style.display = 'block';
  }
} catch(e) {}

// Восстанавливаем activeTab из localStorage
const _savedTab = (() => {
  try {
    const saved = localStorage.getItem('mbs_active_tab');
    const valid = ['dashboard','cost','sales','finmodel','recipes'];
    return (saved && valid.includes(saved)) ? saved : 'dashboard';
  } catch(e) { return 'dashboard'; }
})();

// Рендерим вкладки
window.activeTab = _savedTab;
const _dirty = window.dirty || { dashboard:true, cost:true, sales:true, finmodel:true, recipes:true };
Object.keys(_dirty).forEach(k => _dirty[k] = true);
switchTab(_savedTab);
if (window.lucide) window.lucide.createIcons();

// ════════════════════════════════════════════════════════════════════
//  TOOLTIP (перенесено из app.js)
// ════════════════════════════════════════════════════════════════════
(function() {
  const box = document.getElementById('tip-box');
  if (!box) return;
  let currentEl = null;

  function show(el, cx, cy) {
    if (currentEl !== el) {
      currentEl = el;
      box.textContent = el.dataset.tip;
      box.classList.remove('tip-visible');
      box.style.left = '-9999px';
      box.style.top  = '-9999px';
    }
    const bw = box.offsetWidth  || 240;
    const bh = box.offsetHeight || 40;
    const gap = 14;
    const ty = (window.innerHeight - cy < bh + gap + 16)
      ? cy - bh - gap
      : cy + gap;
    const tx = Math.max(8, Math.min(cx - bw / 2, window.innerWidth - bw - 8));
    box.style.left = tx + 'px';
    box.style.top  = ty + 'px';
    box.classList.add('tip-visible');
  }

  function hide() {
    currentEl = null;
    box.classList.remove('tip-visible');
  }

  document.addEventListener('pointermove', e => {
    const el = e.target.closest('[data-tip]');
    if (el && el.dataset.tip) show(el, e.clientX, e.clientY);
    else hide();
  });
  document.addEventListener('pointerleave', hide);
  document.addEventListener('pointerdown',  hide);
  document.addEventListener('scroll', hide, true);
})();

// ════════════════════════════════════════════════════════════════════
//  KEYBOARD NAV + MOBILE FOCUS (перенесено из app.js)
// ════════════════════════════════════════════════════════════════════
let _kbNav = false;
document.addEventListener('keydown',   () => { _kbNav = true;  }, true);
document.addEventListener('mousedown', () => { _kbNav = false; }, true);
document.addEventListener('focus', e => {
  if (e.target.matches('.inp') && _kbNav) e.target.select();
}, true);

if ('ontouchstart' in window) {
  document.addEventListener('focus', e => {
    const el = e.target;
    if (!el.matches('input, textarea') || _kbNav) return;
    const val = el.value;
    const origType = el.type;
    if (origType === 'number') el.type = 'text';
    requestAnimationFrame(() => {
      try {
        const len = el.value.length;
        el.setSelectionRange(len, len);
      } catch(_) {}
      if (origType === 'number') {
        el.type = 'number';
        el.value = val;
      }
    });
  }, true);
}

// ════════════════════════════════════════════════════════════════════
//  GLOBAL EVENT WIRING (перенесено из public/app.js)
// ════════════════════════════════════════════════════════════════════
import './ui/events.js';
