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
//   // ✅ src/render/dashboard.js — renderDashboard, filterDashboard, toggleDashIntro
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
// ════════════════════════════════════════════════════════════════════

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
} from './state/store.js';

import {
  renderDashboard, filterDashboard, toggleDashIntro,
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
  mvdDownloadPDF, mvdDownloadSemiPDF, mvdDownloadExcel,
} from './export/techcards.js';

import {
  openAddDrink, openEditDrink, saveDrink, deleteDrink, resetDrink,
  mdDeleteAction, onDrinkImgChange, clearDrinkImg,
} from './modals/drink.js';

import {
  openAddSemi, openEditSemi, saveSemi, deleteSemi,
  addSemiIngRow, onSemiImgChange, clearSemiImg,
  _updateSemiCostPreview, _onSemiMatChange, _autoFillSemiYield,
} from './modals/semi.js';

import {
  openEditMat, saveMat, cancelMat, deleteMat, matOnlyOptions,
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
  onFixedCost, onFixedCostName, addFixedCost, addFixedCostInCat, delFixedCost,
  onTaxMode, onInvestment,
  openCostEditor, closeCostEditor, saveCostEditor, deleteCostFromEditor,
  toggleFcCat, flashCells, resetAll, switchTab,
} from './ui/updaters.js';

import {
  calcPositionCosts, payrollPositionTotal, payrollTotal, payrollTotals,
  empTypeTip, onPayrollPos, addPayrollPosition, deletePayrollPosition,
  scrollToPayroll,
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
  closeOnboarding, toggleTheme, toggleBurger,
} from './ui/modals.js';

import {
  setMatCat, toggleMatCat, toggleSemiCat,
  toggleSupSection, toggleIngSection, toggleSemiSection,
  scrollCostTo, openMatUsage, _buildMatUsageMap, _buildSemiUsageMap,
} from './ui/cost-table.js';

import {
  matOptions, _ingPlaceholder, _ingStep,
  _onIngMatChange, _calcIngRowCost, _updateIngRowCost, addIngRow,
  _searchClear, openSupQuickDrop, _fillMatSupBookSelect, _onMatSupBookChange,
} from './ui/ingredients.js';

import {
  openSupplierInfo, siOpenEdit, openSupplierModal, editSupFromList,
  cancelSupplierModal, saveSupplier, openSuppliersList, renderSuppliersList,
  openSupplierBookModal, cancelSupplierBookModal, exportSuppliersPDF,
} from './ui/suppliers.js';

import {
  openViewDrink, mvdOpenEdit, mvdToggleDownload, _mvdGetData,
  setRecipeSort, setRecipeGroup, filterRecipes,
  toggleRecipesIntro, toggleSupIntro, toggleSalesIntro, toggleFinIntro,
} from './ui/recipe-view.js';

import {
  openTemplatesModal, chooseTemplate, applyTemplateData,
  generateInsights, toggleSeasonality, openDropCandidates,
  onWhatIf, exportFullPDF, exportMaterialsPDF, buildBEPChart,
  applyPayrollToFixed, onPayrollSetting, togglePayrollSettings, toggleFixedHint,
  _matDisplayUnit,
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

// ─── Остальное — не перезаписываем то, что уже определено app.js ────
const _srcExports = {
  // render/dashboard
  renderDashboard, filterDashboard, toggleDashIntro,
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
  mvdDownloadPDF, mvdDownloadSemiPDF, mvdDownloadExcel,
  // modals/drink
  openAddDrink, openEditDrink, saveDrink, deleteDrink, resetDrink,
  mdDeleteAction, onDrinkImgChange, clearDrinkImg,
  // modals/semi
  openAddSemi, openEditSemi, saveSemi, deleteSemi,
  addSemiIngRow, onSemiImgChange, clearSemiImg,
  _updateSemiCostPreview, _onSemiMatChange, _autoFillSemiYield,
  // modals/mat
  openEditMat, saveMat, cancelMat, deleteMat, matOnlyOptions,
  // export/csv
  exportCSV, exportDashboard, exportSales,
  // ui/sort
  sortDrinks, setSort, thSort, setSalesSort, thSalesSort, filterSales,
  // ui/updaters
  markDirty, markDirtyDebounce, renderActive, renderTab,
  onMatPriceFocus, onMatPriceInput, onMatPriceCommit, onMatPrice,
  onSalePrice, onTargetFCSilent, onTargetFC, onPortions, onDays,
  applySalesPreset, scaleSalesPortions,
  onFixedCost, onFixedCostName, addFixedCost, addFixedCostInCat, delFixedCost,
  onTaxMode, onInvestment,
  openCostEditor, closeCostEditor, saveCostEditor, deleteCostFromEditor,
  toggleFcCat, flashCells, resetAll, switchTab,
  // ui/payroll
  calcPositionCosts, payrollPositionTotal, payrollTotal, payrollTotals,
  empTypeTip, onPayrollPos, addPayrollPosition, deletePayrollPosition,
  scrollToPayroll,
  // ui/locations
  renderLocSwitcherUI, renderLocList, toggleLocMenu, toggleExportMenu,
  switchLocation, openAddLocation, renameActiveLocation, deleteActiveLocation,
  saveLocation,
  // ui/modals
  openModal, closeModal, safeCloseModal,
  _markModalDirty, _clearModalDirty, _isModalDirty,
  _showUnsavedWarning, _dismissUnsavedWarning, _forceCloseModal,
  closeOnboarding, toggleTheme, toggleBurger,
  // ui/cost-table
  setMatCat, toggleMatCat, toggleSemiCat,
  toggleSupSection, toggleIngSection, toggleSemiSection,
  scrollCostTo, openMatUsage, _buildMatUsageMap, _buildSemiUsageMap,
  // ui/ingredients
  matOptions, _ingPlaceholder, _ingStep,
  _onIngMatChange, _calcIngRowCost, _updateIngRowCost, addIngRow,
  _searchClear, openSupQuickDrop, _fillMatSupBookSelect, _onMatSupBookChange,
  // ui/suppliers
  openSupplierInfo, siOpenEdit, openSupplierModal, editSupFromList,
  cancelSupplierModal, saveSupplier, openSuppliersList, renderSuppliersList,
  openSupplierBookModal, cancelSupplierBookModal, exportSuppliersPDF,
  // ui/recipe-view
  openViewDrink, mvdOpenEdit, mvdToggleDownload, _mvdGetData,
  setRecipeSort, setRecipeGroup, filterRecipes,
  toggleRecipesIntro, toggleSupIntro, toggleSalesIntro, toggleFinIntro,
  // ui/misc
  openTemplatesModal, chooseTemplate, applyTemplateData,
  generateInsights, toggleSeasonality, openDropCandidates,
  onWhatIf, exportFullPDF, exportMaterialsPDF, buildBEPChart,
  applyPayrollToFixed, onPayrollSetting, togglePayrollSettings, toggleFixedHint,
  _matDisplayUnit,
  // state/store
  saveState, loadState,
  loadLocIndex, saveLocIndex, migrateOldState,
  activeLoc, getOrgInfo,
};
// Не перезаписываем то, что уже определено app.js
Object.entries(_srcExports).forEach(([k, v]) => {
  if (window[k] === undefined) window[k] = v;
});
