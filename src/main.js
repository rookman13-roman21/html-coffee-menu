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
//   ⬜ src/utils/calc.js    — calcCost, calcNutrition, enrich, withABC
//   ⬜ src/utils/image.js   — _compressImageDataURL
//   ⬜ src/state/store.js   — S, Loc, saveState, loadState
//   ⬜ src/render/*.js      — renderDashboard, renderCost, renderSales, renderFinModel, renderRecipes
//   ⬜ src/export/*.js      — pdf.js, excel.js
//   ⬜ src/modals/*.js      — drink.js, material.js, semi.js
// ════════════════════════════════════════════════════════════════════

import {
  rub, rubSemi, pct, int,
  fcCls, riskBadge, abcBadge, fcCombinedHtml,
} from './utils/format.js';

// ─── Реэкспорт в window для обратной совместимости с public/app.js ──
// Пока app.js не переведён на import — эти функции должны быть глобальными.
// Когда app.js полностью разобьётся на модули — этот блок удалится.
Object.assign(window, {
  rub, rubSemi, pct, int,
  fcCls, riskBadge, abcBadge, fcCombinedHtml,
});
