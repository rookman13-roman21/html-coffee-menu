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
//   ⬜ src/render/*.js      — renderDashboard, renderCost, renderSales, renderFinModel, renderRecipes
//   ⬜ src/export/*.js      — pdf.js, excel.js
//   ⬜ src/modals/*.js      — drink.js, material.js, semi.js
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
} from './utils/calc.js';

import {
  DRINK_IMAGES, getDrinkImage, _compressImageDataURL,
} from './utils/image.js';

import {
  saveState, loadState,
  loadLocIndex, saveLocIndex, migrateOldState,
  activeLoc, getOrgInfo,
} from './state/store.js';

// ─── Реэкспорт в window для обратной совместимости с public/app.js ──
// Пока app.js не переведён на import — эти функции должны быть глобальными.
// Когда app.js полностью разобьётся на модули — этот блок удалится.
Object.assign(window, {
  // format
  rub, rubSemi, pct, int,
  fcCls, riskBadge, abcBadge, fcCombinedHtml,
  // calc
  _semiUnitFactor, _semiDrinkFactor,
  calcSemiCostPerUnit, calcCost, calcIngCost, calcNutrition,
  enrich, withABC,
  avgMetrics, weightedMetrics, salesMetrics, bepCalc,
  // image
  DRINK_IMAGES, getDrinkImage, _compressImageDataURL,
  // state/store
  saveState, loadState,
  loadLocIndex, saveLocIndex, migrateOldState,
  activeLoc, getOrgInfo,
});
