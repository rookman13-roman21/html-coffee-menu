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
const _srcExports = {
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
  // state/store
  saveState, loadState,
  loadLocIndex, saveLocIndex, migrateOldState,
  activeLoc, getOrgInfo,
};
// Не перезаписываем то, что уже определено app.js
Object.entries(_srcExports).forEach(([k, v]) => {
  if (window[k] === undefined) window[k] = v;
});
