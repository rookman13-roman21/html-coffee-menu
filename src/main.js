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
  addonSalesMetrics, addonSaleUnits, normalizeAddonSale,
  getEffectiveCosts,
} from './utils/calc.js';

import {
  DRINK_IMAGES, getDrinkImage, _compressImageDataURL,
} from './utils/image.js';

import {
  saveState, loadState, flushServerSync,
  loadLocIndex, saveLocIndex, migrateOldState, clearLocStorage,
  activeLoc, getOrgInfo,
  S, Loc, DEFAULTS, resetGlobalsToBase, locDataKey, _wif,
  LOC_INDEX_KEY, LOC_ACTIVE_KEY, LOC_DATA_PREFIX, OLD_STATE_KEY,
  restoreFromServer,
} from './state/store.js';

import {
  isLoggedIn, showAuthScreen, logout, fetchState, getUser,
  refreshCurrentUser, getAllowedTabs, firstAllowedTab,
  hasAccess, hasAnyProductAccess, canAccessTab,
  getActiveWorkspaceId, setActiveWorkspaceId, getCurrentWorkspace, getWorkspaces,
  fetchWorkspaces, createWorkspace, fetchWorkspaceMembers, createWorkspaceInvite,
  acceptWorkspaceInvite, fetchWorkspaceActivity, logWorkspaceActivity,
  fetchWorkspaceSnapshots, createWorkspaceSnapshot, restoreWorkspaceSnapshot,
  removeWorkspaceMember, revokeWorkspaceInvite,
  isWorkspaceOwner, requireWorkspaceOwner,
} from './ui/auth.js';
import {
  isAuthorMode, filterAuthorServerSuppliers,
} from './access/author-layer.js';
import { tabFromPath, syncUrlForTab } from './access/app-routes.js';

import {
  authorCanPublish, renderAuthorWorkspace, renderAuthorProfile, loadAuthorWorkspace,
  saveAuthorProfile, uploadAuthorAvatar, submitRecipeForPublication, authorPublicationForDrink,
  authorRecipeProgress, authorHasMixologyParticipation,
  saveAuthorDraftForDrink, deleteAuthorDraftForDrink, uploadAuthorRecipeImage,
  saveAuthorIngredient, deleteAuthorIngredient,
  saveAuthorSemiForItem, deleteAuthorSemiForItem,
  openAuthorTermsModal, closeAuthorTermsModal,
  openAuthorProfileModal, closeAuthorProfileModal,
  openAuthorPublicationView, openAuthorPublicationEdit,
  resubmitAuthorPublication,
  connectAuthorTelegram, disconnectAuthorTelegram, toggleAuthorTelegramNotifications,
  refreshAuthorTelegramStatus,
  openAuthorPublicationHistory, closeAuthorPublicationHistory, setAuthorPublicationFilter,
} from './ui/author.js';

import {
  isPublicRecipesRoute, renderPublicRecipesApp, submitPublicRecipeOrder,
} from './ui/public-recipes.js';

import {
  renderSettings, settingsSetSection, settingsRenameProject, settingsCreateWorkspace,
  settingsSwitchWorkspace, settingsSendInvite, settingsRemoveMember, settingsRevokeInvite,
  settingsCopyValue, settingsSwitchLocation, settingsSetActivityFilter,
  settingsCreateSnapshot, settingsRestoreSnapshot,
} from './render/settings.js';

import {
  _editMatKey, _pendingMatSelectEl, _pendingSemiMatSelectEl,
  searchQuery, _renderTimer,
  dirty, sortState, salesSortState, salesSearch,
  _matActiveCat, _matCollapsed, _semiCollapsed, _semiSectionCollapsed, _supCollapsed, _ingCollapsed,
  recipeSearch, recipeSort, recipeGroup,
  _mvdId, _matPriceBeforeEdit, _fceIdx,
  PS_DEFAULTS, MAT_CATEGORY, CAT_LABELS,
  _supplierEditKey, _supplierFromList, _supBookEditId,
  supListSearch, supListFilter, _supQuickKey, _supQuickEl,
  _EDITABLE_MODALS, _dirtyModalSet,
} from './state/ui-state.js';

import {
  renderDashboard, filterDashboard, setDashGroup, toggleDashIntro, toggleTop10, initTop10Collapse,
  OC_CATS, OC_FORMATS, OC_TEMPLATES,
  ocAddRow, ocDeleteRow, ocUpdateField, ocLoadTemplate, ocSetFormat, ocSetCurrency, ocUpdateRate,
  ocSetCategorySort, ocToggleCategorySort, ocSetCategorySearch, ocSetCategoryCollapseAll,
  ocToggleCat, ocMoveRow, ocClearAll,
  ocOpenItem, ocItemSave, ocItemDelete, ocItemCancel,
  ocAiFill, ocSetApiKey,
  ocOpenLibrary, oclibShowCats, oclibOpenCat, oclibSearch, oclibSelect,
  ociSubcatChange,
  ocPhotoFileChange,
  _ocCalcTotal, _ocFmtAmt,
} from './render/dashboard.js';

import {
  renderCost, filterSupCost, filterIngCost, filterSemiCost,
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
  onDrinkEquipmentSelect, addDrinkEquipmentCustom, removeDrinkEquipment,
  openDrinkEquipmentCustomPopover, closeDrinkEquipmentCustomPopover,
  renderDrinkEquipment, getDrinkEquipmentSelection, setDrinkEquipmentSelection,
  markDrinkPublicationMissing,
} from './modals/drink.js';

import {
  openAddSemi, openEditSemi, saveSemi, deleteSemi,
  addSemiIngRow, onSemiImgChange, clearSemiImg,
  _updateSemiCostPreview, _onSemiMatChange, _autoFillSemiYield,
  _updateSemiIngCost, _autoCalcSemiIngYield,
  openAddSemiCategory, saveSemiCategory, _refreshSemiCategorySelect,
  openEditSemiCategory, deleteSemiCategory,
} from './modals/semi.js';

import {
  openEditMat, saveMat, cancelMat, deleteMat, matOnlyOptions,
  deleteEditingMat, onMatPurchaseUrlInput,
  openAddCategory, saveCategory, _refreshMatCategorySelect,
  openEditCategory, deleteCategory,
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
  addAddonSale, applyAddonSalesPreset, setAddonFilter, scrollToAddonSales,
  onSalesChecksPerDay, onAddonSale, deleteAddonSale,
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
  saveLocation, authorOpenTechcardSettings, authorOpenTermsFromMenu,
  switchWorkspace, createWorkspaceFromMenu, openProjectSettingsFromMenu, renameCurrentWorkspaceFromMenu, openWorkspaceTeamModal,
  sendWorkspaceInviteFromModal, inviteAnotherFromModal, copyWorkspaceInviteLink,
  removeWorkspaceMemberFromModal, revokeWorkspaceInviteFromModal,
  openWorkspaceActivityModal, openWorkspaceSnapshotsModal,
  createWorkspaceSnapshotFromModal, restoreWorkspaceSnapshotFromModal,
  closeWorkspaceModal,
} from './ui/locations.js';

import {
  openModal, closeModal, safeCloseModal,
  _markModalDirty, _clearModalDirty, _isModalDirty,
  _showUnsavedWarning, _dismissUnsavedWarning, _forceCloseModal,
  showAlert, showConfirm, showPrompt,
  closeOnboarding, toggleTheme, toggleBurger,
} from './ui/modals.js';

import {
  setMatCat, toggleMatCat, toggleSemiCat,
  toggleSupSection, toggleIngSection, toggleSemiSection,
  scrollCostTo, openMatUsage, _buildMatUsageMap, _buildSemiUsageMap,
  addFixedCost, addFixedCostInCat, delFixedCost,
  onTaxMode, onInvestment, toggleFcCat,
  openCostEditor, closeCostEditor, saveCostEditor, deleteCostFromEditor,
  _fceTypeChange, _fceShareToggle, _fceShareUpdate, _fcePctHint,
  initFcOpenCatsKeeper,
} from './ui/cost-table.js';

import {
  matOptions, _ingPlaceholder, _ingStep,
  _onIngMatChange, _calcIngRowCost, _updateIngRowCost, addIngRow, _autoCalcDrinkIngYield,
  _searchClear, openSupQuickDrop, _fillMatSupBookSelect, _onMatSupBookChange,
} from './ui/ingredients.js';

import {
  openSupplierInfo, siOpenEdit, siCopyPhone, siDeleteSupplier,
  openSupplierModal, editSupFromList,
  cancelSupplierModal, saveSupplier, openSuppliersList, renderSuppliersList,
  openSupplierBookModal, saveSupplierBook, cancelSupplierBookModal, deleteSupplierBook,
} from './ui/suppliers.js';

import {
  openViewDrink, openViewSemi, mvdOpenEdit, mvdToggleDownload, _mvdGetData,
  mvdSemiDownloadPDF, mvdSemiDownloadXLSX,
  setRecipeSort, setRecipeGroup, filterRecipes,
  openVideoModal, closeVideoModal,
  openViewMat, mmvOpenEdit,
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
  exportOpeningCostsPDF, exportOpeningCostsXLSX,
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
  addonSalesMetrics, addonSaleUnits, normalizeAddonSale,
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
  _matActiveCat, _matCollapsed, _semiCollapsed, _semiSectionCollapsed, _supCollapsed, _ingCollapsed,
  recipeSearch, recipeSort, recipeGroup,
  _mvdId, _matPriceBeforeEdit, _fceIdx,
  PS_DEFAULTS, MAT_CATEGORY, CAT_LABELS,
  _supplierEditKey, _supplierFromList, _supBookEditId,
  supListSearch, supListFilter, _supQuickKey, _supQuickEl,
  _EDITABLE_MODALS, _dirtyModalSet,
});

// ─── state/store — удалены из app.js — назначаем безусловно ─────────────────
const _storeExports = {
  loadLocIndex, saveLocIndex, migrateOldState, clearLocStorage,
  activeLoc, getOrgInfo,
  saveState, loadState, flushServerSync,
  S, Loc, DEFAULTS, resetGlobalsToBase, locDataKey, restoreFromServer, _wif,
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
  OC_CATS, OC_FORMATS, OC_TEMPLATES,
  ocAddRow, ocDeleteRow, ocUpdateField, ocLoadTemplate, ocSetFormat, ocSetCurrency, ocUpdateRate,
  ocSetCategorySort, ocToggleCategorySort, ocSetCategorySearch, ocSetCategoryCollapseAll,
  ocToggleCat, ocMoveRow, ocClearAll,
  ocOpenItem, ocItemSave, ocItemDelete, ocItemCancel, ocAiFill, ocSetApiKey,
  ocOpenLibrary, oclibShowCats, oclibOpenCat, oclibSearch, oclibSelect,
  ociSubcatChange,
  ocPhotoFileChange,
  _ocCalcTotal, _ocFmtAmt,
  // render/cost
  renderCost, filterSupCost, filterIngCost, filterSemiCost,
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
  onDrinkEquipmentSelect, addDrinkEquipmentCustom, removeDrinkEquipment,
  openDrinkEquipmentCustomPopover, closeDrinkEquipmentCustomPopover,
  renderDrinkEquipment, getDrinkEquipmentSelection, setDrinkEquipmentSelection,
  markDrinkPublicationMissing,
  // modals/semi
  openAddSemi, openEditSemi, saveSemi, deleteSemi,
  addSemiIngRow, onSemiImgChange, clearSemiImg,
  _updateSemiCostPreview, _onSemiMatChange, _autoFillSemiYield,
  _updateSemiIngCost, _autoCalcSemiIngYield,
  openAddSemiCategory, saveSemiCategory,
  openEditSemiCategory, deleteSemiCategory,
  // modals/mat
  openEditMat, saveMat, cancelMat, deleteMat, matOnlyOptions,
  deleteEditingMat, onMatPurchaseUrlInput,
  openAddCategory, saveCategory,
  openEditCategory, deleteCategory,
  // export/csv
  exportCSV, exportDashboard, exportSales,
  // ui/sort
  sortDrinks, setSort, thSort, setSalesSort, thSalesSort, filterSales,
  // ui/updaters
  markDirty, markDirtyDebounce, renderActive, renderTab,
  onMatPriceFocus, onMatPriceInput, onMatPriceCommit, onMatPrice,
  onSalePrice, onTargetFCSilent, onTargetFC, onPortions, onDays,
  applySalesPreset, scaleSalesPortions,
  addAddonSale, applyAddonSalesPreset, setAddonFilter, scrollToAddonSales,
  onSalesChecksPerDay, onAddonSale, deleteAddonSale,
  onFixedCost, onFixedCostName,
  flashCells, resetAll, switchTab,
  getUser,
  getActiveWorkspaceId, setActiveWorkspaceId, getCurrentWorkspace, getWorkspaces,
  fetchWorkspaces, createWorkspace, fetchWorkspaceMembers, createWorkspaceInvite,
  acceptWorkspaceInvite, fetchWorkspaceActivity, logWorkspaceActivity,
  fetchWorkspaceSnapshots, createWorkspaceSnapshot, restoreWorkspaceSnapshot,
  removeWorkspaceMember, revokeWorkspaceInvite,
  isWorkspaceOwner, requireWorkspaceOwner,
  authorCanPublish, renderAuthorWorkspace, renderAuthorProfile, loadAuthorWorkspace,
  saveAuthorProfile, uploadAuthorAvatar, submitRecipeForPublication, authorPublicationForDrink,
  authorRecipeProgress, authorHasMixologyParticipation,
  saveAuthorDraftForDrink, deleteAuthorDraftForDrink, uploadAuthorRecipeImage,
  saveAuthorIngredient, deleteAuthorIngredient,
  saveAuthorSemiForItem, deleteAuthorSemiForItem,
  openAuthorTermsModal, closeAuthorTermsModal,
  openAuthorProfileModal, closeAuthorProfileModal,
  openAuthorPublicationView, openAuthorPublicationEdit,
  resubmitAuthorPublication,
  connectAuthorTelegram, disconnectAuthorTelegram, toggleAuthorTelegramNotifications,
  refreshAuthorTelegramStatus,
  openAuthorPublicationHistory, closeAuthorPublicationHistory, setAuthorPublicationFilter,
  submitPublicRecipeOrder,
  // render/settings
  renderSettings, settingsSetSection, settingsRenameProject, settingsCreateWorkspace,
  settingsSwitchWorkspace, settingsSendInvite, settingsRemoveMember, settingsRevokeInvite,
  settingsCopyValue, settingsSwitchLocation, settingsSetActivityFilter,
  settingsCreateSnapshot, settingsRestoreSnapshot,
  // ui/payroll
  calcPositionCosts, payrollPositionTotal, payrollTotal, payrollTotals,
  empTypeTip, onPayrollPos, addPayrollPosition, deletePayrollPosition,
  scrollToPayroll, EMP_TYPE_LABELS, PS,
  _refreshPayrollRow, _refreshPayrollSummary,
  // ui/locations
  renderLocSwitcherUI, renderLocList, toggleLocMenu, toggleExportMenu,
  switchLocation, openAddLocation, renameActiveLocation, deleteActiveLocation,
  saveLocation, authorOpenTechcardSettings, authorOpenTermsFromMenu,
  switchWorkspace, createWorkspaceFromMenu, openProjectSettingsFromMenu, renameCurrentWorkspaceFromMenu, openWorkspaceTeamModal,
  sendWorkspaceInviteFromModal, inviteAnotherFromModal, copyWorkspaceInviteLink,
  removeWorkspaceMemberFromModal, revokeWorkspaceInviteFromModal,
  openWorkspaceActivityModal, openWorkspaceSnapshotsModal,
  createWorkspaceSnapshotFromModal, restoreWorkspaceSnapshotFromModal,
  closeWorkspaceModal,
  // ui/modals
  openModal, closeModal, safeCloseModal,
  _markModalDirty, _clearModalDirty, _isModalDirty,
  _showUnsavedWarning, _dismissUnsavedWarning, _forceCloseModal,
  showAlert, showConfirm, showPrompt,
  closeOnboarding, toggleTheme, toggleBurger,
  // ui/cost-table
  setMatCat, toggleMatCat, toggleSemiCat,
  toggleSupSection, toggleIngSection, toggleSemiSection,
  scrollCostTo, openMatUsage, _buildMatUsageMap, _buildSemiUsageMap,
  addFixedCost, addFixedCostInCat, delFixedCost,
  onTaxMode, onInvestment, toggleFcCat,
  openCostEditor, closeCostEditor, saveCostEditor, deleteCostFromEditor,
  _fceTypeChange, _fceShareToggle, _fceShareUpdate, _fcePctHint,
  // ui/ingredients
  matOptions, _ingPlaceholder, _ingStep,
  _onIngMatChange, _calcIngRowCost, _updateIngRowCost, addIngRow, _autoCalcDrinkIngYield,
  _searchClear, openSupQuickDrop, _fillMatSupBookSelect, _onMatSupBookChange,
  // ui/suppliers
  openSupplierInfo, siOpenEdit, siCopyPhone, siDeleteSupplier,
  openSupplierModal, editSupFromList,
  cancelSupplierModal, saveSupplier, openSuppliersList, renderSuppliersList,
  openSupplierBookModal, saveSupplierBook, cancelSupplierBookModal, deleteSupplierBook,
  // ui/recipe-view
  openViewDrink, openViewSemi, mvdOpenEdit, mvdToggleDownload, _mvdGetData,
  mvdSemiDownloadPDF, mvdSemiDownloadXLSX,
  setRecipeSort, setRecipeGroup, filterRecipes,
  openVideoModal, closeVideoModal,
  openViewMat, mmvOpenEdit,
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
  exportOpeningCostsPDF, exportOpeningCostsXLSX,
  // state/store
  // saveState/loadState перенесены в _storeExports выше
};
// Не перезаписываем то, что уже определено app.js
Object.entries(_srcExports).forEach(([k, v]) => {
  if (window[k] === undefined) window[k] = v;
});

// Оборачиваем window.renderFinModel так, чтобы открытые категории
// постоянных расходов не сворачивались при любом ре-рендере
initFcOpenCatsKeeper();

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

// Карточка пользователя в дропдауне "Моя кофейня"
function _renderUserCard() {
  const user = getUser();
  const card = document.getElementById('loc-user-card');
  if (!card) return;
  if (!user) { card.innerHTML = ''; return; }
  const initial = (user.name || user.email || '?')[0].toUpperCase();
  card.innerHTML = `
    <div class="loc-user-card">
      <div class="loc-user-avatar">${initial}</div>
      <div class="loc-user-info">
        <div class="loc-user-name">${user.name || ''}</div>
        <div class="loc-user-email">${user.email || ''}</div>
      </div>
      <button class="loc-user-logout" onclick="window._authLogout()">Выйти</button>
    </div>
    <div class="loc-menu-divider"></div>
  `;
}
_renderUserCard();
window._authLogout = logout;

function _applyAccessUI() {
  const allowed = _getAllowedTabsForMode();
  document.querySelectorAll('.nav-btn, .mobile-tab').forEach(btn => {
    const tab = btn.dataset.tab;
    btn.style.display = !tab || allowed.includes(tab) ? '' : 'none';
  });
  const exportWrap = document.getElementById('export-wrap');
  if (exportWrap) exportWrap.style.display = (!isAuthorMode() && hasAccess('drinks') && hasAccess('finance')) ? '' : 'none';
  const resetBtn = document.querySelector('.btn-reset');
  if (resetBtn) resetBtn.style.display = (!isAuthorMode() && hasAccess('drinks') && hasAccess('finance') && isWorkspaceOwner()) ? '' : 'none';
}

function _getAllowedTabsForMode() {
  return isAuthorMode() ? ['cost', 'recipes', 'authorProfile'] : getAllowedTabs();
}

function _canAccessTabForMode(tab) {
  return isAuthorMode() ? ['cost', 'recipes', 'authorProfile'].includes(tab) : canAccessTab(tab);
}

function _firstAllowedTabForMode() {
  return isAuthorMode() ? 'recipes' : firstAllowedTab();
}

function _showNoAccessScreen() {
  _applyAccessUI();
  try {
    clearLocStorage();
    const nameEl = document.getElementById('loc-name');
    const iconEl = document.getElementById('loc-icon');
    if (nameEl) nameEl.textContent = 'Нет проекта';
    if (iconEl) iconEl.textContent = '🔒';
    renderLocSwitcherUI();
  } catch(e) {}
  const main = document.querySelector('.main');
  if (!main) return;
  const user = getUser();
  const isGuest = user && user.account_role === 'guest' && !user.can_create_workspaces;
  main.innerHTML = `
    <section class="access-empty-screen">
      <div class="access-empty-card">
        <div class="access-empty-icon">🧩</div>
        <h1>${isGuest ? 'Нет доступных проектов' : 'Доступ к разделам ещё не выдан'}</h1>
        <p>${isGuest ? 'Попросите владельца проекта отправить новое приглашение или используйте аккаунт с платным тарифом.' : 'Аккаунт активен. Администратор Московской школы бариста скоро включит нужные разделы платформы.'}</p>
        <button class="btn-primary" onclick="window._authLogout()">Выйти</button>
      </div>
    </section>
  `;
  const mobileTabbar = document.getElementById('mobile-tabbar');
  if (mobileTabbar) mobileTabbar.style.display = 'none';
}

window.addEventListener('workspace:access-lost', () => {
  if (!isLoggedIn()) {
    showAuthScreen().then(serverState => _initApp(serverState));
    return;
  }
  fetchState().then(serverState => _initApp(serverState));
});

function _renderOnboardingForAccess() {
  const root = document.getElementById('onboarding');
  if (!root) return;
  const title = root.querySelector('.onboard-title');
  const sub = root.querySelector('.onboard-sub');
  const steps = root.querySelector('.onboard-steps');
  const drinks = hasAccess('drinks');
  const finance = hasAccess('finance');
  const author = hasAccess('author');
  const authorMode = isAuthorMode();
  let data;
  if (authorMode) {
    data = {
      key: 'author',
      title: 'Кабинет автора рецептов',
      sub: 'Здесь можно подготовить авторский рецепт и отправить его на публикацию после проверки.',
      steps: [
        ['user', 'Профиль автора', 'заполните публичное имя и данные для связи'],
        ['clipboard-list', 'Рецептуры', 'подготовьте рецепт и описание для витрины'],
        ['send', 'Публикация', 'отправьте рецепт на модерацию администратору'],
      ],
    };
  } else if (drinks && finance) {
    data = {
      key: 'all',
      title: 'Инструментарий кофейни',
      sub: 'У вас открыт полный набор: напитки, поставщики, бюджет, план продаж и финмодель.',
      steps: [
        ['truck', 'Поставщики', 'ведите сырьё, цены, контакты и базу поставщиков'],
        ['clipboard-list', 'Рецептуры', 'создавайте напитки, техкарты и PDF-выгрузки'],
        ['layout-dashboard', 'Бюджет', 'считайте стартовые вложения и структуру расходов'],
        ['shopping-cart', 'План продаж', 'задавайте порции и прогнозируйте выручку'],
        ['banknote', 'Финмодель', 'смотрите точку безубыточности, ФОТ, налоги и сценарии'],
      ],
    };
  } else if (drinks || author) {
    data = {
      key: author && !drinks ? 'author' : 'drinks',
      title: author && !drinks ? 'Кабинет автора рецептов' : 'Рабочее место для напитков',
      sub: author && !drinks
        ? 'Здесь можно подготовить авторский рецепт и отправить его на публикацию после проверки.'
        : 'У вас открыт слой напитков: поставщики, ингредиенты, полуфабрикаты и рецептуры.',
      steps: author && !drinks
        ? [
            ['user', 'Профиль автора', 'заполните публичное имя и данные для связи'],
            ['clipboard-list', 'Рецептуры', 'подготовьте рецепт и описание для витрины'],
            ['send', 'Публикация', 'отправьте рецепт на модерацию администратору'],
          ]
        : [
            ['truck', 'Поставщики', 'добавляйте поставщиков, контакты, сайты и условия'],
            ['package', 'Ингредиенты', 'ведите сырьё, цены и историю изменений'],
            ['layers', 'Полуфабрикаты', 'собирайте заготовки и вложенные рецептуры'],
            ['clipboard-list', 'Рецептуры', 'создавайте напитки и выгружайте техкарты'],
          ],
    };
  } else {
    data = {
      key: 'finance',
      title: 'Финансовый блок кофейни',
      sub: 'У вас открыт слой финансов: бюджет открытия, план продаж и финансовая модель.',
      steps: [
        ['layout-dashboard', 'Бюджет', 'соберите стартовые вложения по категориям'],
        ['shopping-cart', 'План продаж', 'задайте порции, цены и месячную выручку'],
        ['banknote', 'Финмодель', 'посчитайте расходы, ФОТ, налоги и прибыль'],
        ['trending-up', 'Сценарии', 'сравните базовый, осторожный и оптимистичный планы'],
      ],
    };
  }
  window._onboardingKey = 'mbs_onboard_v2_' + data.key;
  if (title) title.textContent = data.title;
  if (sub) sub.textContent = data.sub;
  if (steps) {
    steps.innerHTML = data.steps.map((step, idx) => `
      <div class="onboard-step">
        <div class="onboard-step-num">${idx + 1}</div>
        <div class="onboard-step-text"><strong><i data-lucide="${step[0]}" class="icon"></i> ${step[1]}</strong> — ${step[2]}</div>
      </div>
    `).join('');
  }
}

async function _initApp(serverState) {
  // Обновляем карточку пользователя (актуально после логина)
  _renderUserCard();

  // При смене аккаунта не оставляем в runtime данные предыдущего пользователя.
  Loc.list = [];
  Loc.activeId = null;
  resetGlobalsToBase();

  // Если пришёл стейт с сервера — восстанавливаем в localStorage
  if (serverState) {
    restoreFromServer(serverState);
  }

  _applyAccessUI();
  if (!hasAnyProductAccess()) {
    _showNoAccessScreen();
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  loadLocIndex();
  if (!Loc.list.length) {
    try { migrateOldState(); } catch(e) {}
  }
  if (!Loc.list.length) {
    Loc.list = [{ id: 'loc_default', name: 'Моя кофейня', icon: '☕' }];
    Loc.activeId = 'loc_default';
    saveLocIndex();
  }
  if (!Loc.activeId) { Loc.activeId = Loc.list[0].id; saveLocIndex(); }
  loadState();
  _applyAccessUI();

  // ── Подгружаем публичных поставщиков с сервера (не блокирует старт) ──
  try {
    const _apiBase = import.meta.env.VITE_API_URL || 'https://barista-school.online/api';
    fetch(_apiBase + '/suppliers')
      .then(r => r.ok ? r.json() : [])
      .then(serverSups => {
        if (!Array.isArray(serverSups) || !serverSups.length) return;
        if (!window.S.supplierBook) window.S.supplierBook = [];
        // Мержим: сервер → supplierBook. Если запись с таким именем уже есть — обновляем
        // поля is_featured, logo_url, promo_code и т.д. Пользовательские поля name/phone/note не трогаем.
        const visibleServerSups = filterAuthorServerSuppliers(serverSups);
        visibleServerSups.forEach(srv => {
          const idx = window.S.supplierBook.findIndex(b => b.name === srv.name);
          if (idx >= 0) {
            // Обновляем только серверные расширенные поля
            Object.assign(window.S.supplierBook[idx], {
              is_featured: srv.is_featured,
              logo_url: srv.logo_url || window.S.supplierBook[idx].logo_url || '',
              promo_code: srv.promo_code || '',
              promo_expires: srv.promo_expires || '',
              promo_desc: srv.promo_desc || '',
              tags: srv.tags || '',
              _from_server: true,
            });
          } else {
            window.S.supplierBook.push({
              id: 'srv_' + srv.id,
              name: srv.name,
              phone: srv.phone || '',
              note: srv.note || '',
              site: srv.site || '',
              is_featured: srv.is_featured || 0,
              logo_url: srv.logo_url || '',
              promo_code: srv.promo_code || '',
              promo_expires: srv.promo_expires || '',
              promo_desc: srv.promo_desc || '',
              tags: srv.tags || '',
              _from_server: true,
            });
          }
        });
        // Ре-рендер вкладки Поставщики если открыта
        if (window.activeTab === 'cost') {
          try { window.renderCost && window.renderCost(); } catch(e) {}
        }
      })
      .catch(() => {/* silent fail — используем что есть в localStorage */});
  } catch(e) {}

  // ── Подгружаем серверные override-ы напитков (не блокирует старт) ──
  try {
    const _apiBase2 = import.meta.env.VITE_API_URL || 'https://barista-school.online/api';
    fetch(_apiBase2 + '/drinks/overrides')
      .then(r => r.ok ? r.json() : [])
      .then(overrides => {
        if (!Array.isArray(overrides) || !overrides.length) return;
        overrides.forEach(ov => {
          const idx = DRINKS.findIndex(d => d.id === ov.drink_id);
          if (idx < 0) return;
          DRINKS[idx]._hidden = !!ov.is_hidden;
          if (ov.name  != null) DRINKS[idx]._serverName  = ov.name;
          if (ov.price != null) DRINKS[idx]._serverPrice = ov.price;
          if (ov.image_url) DRINKS[idx].image = ov.image_url;
          else delete DRINKS[idx].image;
        });
        // Ре-рендер Рецептур если открыта
        if (window.activeTab === 'recipes') {
          try { window.renderRecipes && window.renderRecipes(); } catch(e) {}
        }
      })
      .catch(() => {});
  } catch(e) {}

  // ── Подгружаем публичных поставщиков с сервера (не блокирует старт) ──
  try {
    const _apiBase = import.meta.env.VITE_API_URL || 'https://barista-school.online/api';
    fetch(_apiBase + '/suppliers')
      .then(r => r.ok ? r.json() : [])
      .then(serverSups => {
        if (!Array.isArray(serverSups) || !serverSups.length) return;
        if (!window.S.supplierBook) window.S.supplierBook = [];
        // Мержим: сервер → supplierBook. Если запись с таким именем уже есть — обновляем
        // поля is_featured, logo_url, promo_code и т.д. Пользовательские поля name/phone/note не трогаем.
        const visibleServerSups = filterAuthorServerSuppliers(serverSups);
        visibleServerSups.forEach(srv => {
          const idx = window.S.supplierBook.findIndex(b => b.name === srv.name);
          if (idx >= 0) {
            // Обновляем только серверные расширенные поля
            Object.assign(window.S.supplierBook[idx], {
              is_featured: srv.is_featured,
              logo_url: srv.logo_url || window.S.supplierBook[idx].logo_url || '',
              promo_code: srv.promo_code || '',
              promo_expires: srv.promo_expires || '',
              promo_desc: srv.promo_desc || '',
              tags: srv.tags || '',
              _from_server: true,
            });
          } else {
            window.S.supplierBook.push({
              id: 'srv_' + srv.id,
              name: srv.name,
              phone: srv.phone || '',
              note: srv.note || '',
              site: srv.site || '',
              is_featured: srv.is_featured || 0,
              logo_url: srv.logo_url || '',
              promo_code: srv.promo_code || '',
              promo_expires: srv.promo_expires || '',
              promo_desc: srv.promo_desc || '',
              tags: srv.tags || '',
              _from_server: true,
            });
          }
        });
        // Ре-рендер вкладки Поставщики если открыта
        if (window.activeTab === 'cost') {
          try { window.renderCost && window.renderCost(); } catch(e) {}
        }
      })
      .catch(() => {/* silent fail — используем что есть в localStorage */});
  } catch(e) {}

  // ── Подгружаем серверные override-ы напитков (не блокирует старт) ──
  try {
    const _apiBase2 = import.meta.env.VITE_API_URL || 'https://barista-school.online/api';
    fetch(_apiBase2 + '/drinks/overrides')
      .then(r => r.ok ? r.json() : [])
      .then(overrides => {
        if (!Array.isArray(overrides) || !overrides.length) return;
        overrides.forEach(ov => {
          const idx = DRINKS.findIndex(d => d.id === ov.drink_id);
          if (idx < 0) return;
          DRINKS[idx]._hidden = !!ov.is_hidden;
          if (ov.name  != null) DRINKS[idx]._serverName  = ov.name;
          if (ov.price != null) DRINKS[idx]._serverPrice = ov.price;
          if (ov.image_url) DRINKS[idx].image = ov.image_url;
          else delete DRINKS[idx].image;
        });
        // Ре-рендер Рецептур если открыта
        if (window.activeTab === 'recipes') {
          try { window.renderRecipes && window.renderRecipes(); } catch(e) {}
        }
      })
      .catch(() => {});
  } catch(e) {}

  try { renderLocSwitcherUI(); } catch(e) { console.error('[renderLocSwitcherUI]', e); }
  // Обновить метку API ключа в loc-menu
  try {
    const _labelEl = document.getElementById('loc-menu-api-key-label');
    if (_labelEl) _labelEl.textContent = 'Добавить OpenAI API ключ';
  } catch(e) {}
  try {
    if (localStorage.getItem('mbs_theme') === 'dark') {
      document.body.classList.add('dark');
      const icon = document.getElementById('theme-icon');
      if (icon) icon.setAttribute('data-lucide', 'sun');
    }
    _renderOnboardingForAccess();
    const onboardingKey = window._onboardingKey || 'mbs_onboard_v2';
    if (!localStorage.getItem(onboardingKey)) {
      document.getElementById('onboarding').style.display = 'block';
    }
  } catch(e) {}

  // Восстанавливаем activeTab из URL или localStorage
  const _savedTab = (() => {
    try {
      const routed = tabFromPath();
      if (routed && _canAccessTabForMode(routed)) return routed;
      const saved = localStorage.getItem('mbs_active_tab');
      return (saved && _canAccessTabForMode(saved)) ? saved : _firstAllowedTabForMode();
    } catch(e) { return _firstAllowedTabForMode(); }
  })();

  // Рендерим вкладки
  window.activeTab = _savedTab;
  const _dirty = window.dirty || { dashboard:true, cost:true, sales:true, finmodel:true, recipes:true, authorProfile:true, settings:true };
  Object.keys(_dirty).forEach(k => _dirty[k] = true);
  syncUrlForTab(_savedTab, { replace: true });
  switchTab(_savedTab);
  if (window.lucide) window.lucide.createIcons();
}

// ─── Auth gate ────────────────────────────────────────────────────────────────
// Если JWT есть — загружаем стейт с сервера и стартуем
// Если нет — показываем форму входа, ждём токен, потом стартуем
// В режиме разработки (localhost без VITE_API_URL) auth можно пропустить
const _skipAuth = !import.meta.env.VITE_API_URL && location.hostname === 'localhost';

if (isPublicRecipesRoute()) {
  renderPublicRecipesApp();
} else if (_skipAuth) {
  _initApp(null);
} else if (isLoggedIn()) {
  // Уже авторизован — обновляем пользователя и пробуем подтянуть свежий стейт с сервера
  refreshCurrentUser().then(user => {
    if (!user) return showAuthScreen().then(serverState => _initApp(serverState));
    return fetchState().then(serverState => _initApp(serverState));
  });
} else {
  showAuthScreen().then(serverState => _initApp(serverState));
}

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

// ── Дропдаун "+ Добавить" для ингредиентов ──────────────────────────
function toggleAddMatMenu(btn) {
  const menu = document.getElementById('add-mat-menu');
  if (!menu) return;
  const isOpen = menu.style.display !== 'none';
  menu.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) {
    // закрыть при клике вне
    const close = (e) => {
      if (!menu.contains(e.target) && e.target !== btn) {
        menu.style.display = 'none';
        document.removeEventListener('click', close);
      }
    };
    setTimeout(() => document.addEventListener('click', close), 0);
  }
}
function closeAddMatMenu() {
  const menu = document.getElementById('add-mat-menu');
  if (menu) menu.style.display = 'none';
}
function openAddMatModal() {
  _refreshMatCategorySelect();
  // Сбросить форму на «новый ингредиент»
  document.getElementById('mm-modal-title').innerHTML = '<i data-lucide="plus" class="icon"></i> Новая позиция сырья';
  document.getElementById('mm-name').value  = '';
  document.getElementById('mm-unit').value  = 'шт';
  document.getElementById('mm-price').value = '';
  document.getElementById('mm-size').value  = '';
  document.getElementById('mm-category').value = 'other';
  const delBtn = document.getElementById('mm-delete-btn');
  if (delBtn) delBtn.style.display = 'none';
  openModal('modal-mat');
}
Object.assign(window, { toggleAddMatMenu, closeAddMatMenu, openAddMatModal });

// ── Дропдаун "+ Добавить" для полуфабрикатов ────────────────────────
function toggleAddSemiMenu(btn) {
  const menu = document.getElementById('add-semi-menu');
  if (!menu) return;
  const isOpen = menu.style.display !== 'none';
  menu.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) {
    const close = (e) => {
      if (!menu.contains(e.target) && e.target !== btn) {
        menu.style.display = 'none';
        document.removeEventListener('click', close);
      }
    };
    setTimeout(() => document.addEventListener('click', close), 0);
  }
}
function closeAddSemiMenu() {
  const menu = document.getElementById('add-semi-menu');
  if (menu) menu.style.display = 'none';
}
Object.assign(window, { toggleAddSemiMenu, closeAddSemiMenu });
