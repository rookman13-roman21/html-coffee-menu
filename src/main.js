// ════════════════════════════════════════════════════════════════════
//  ENTRY POINT  (Vite — src/main.js)
// ════════════════════════════════════════════════════════════════════
//
//  Этот файл — будущий центр всех модулей.
//  Сейчас он просто подгружает монолитный app.js как глобальный скрипт,
//  сохраняя все inline-обработчики onclick="saveDrink()" рабочими.
//
//  Порядок выполнения:
//   1. CDN-скрипты в <head> (lucide, exceljs) — блокирующие, запускаются первыми
//   2. <script type="module" src="/src/main.js"> — deferred, запускается после DOM
//   3. main.js динамически добавляет /app.js → все функции идут в window
//
//  Следующие шаги рефакторинга (по одному):
//   - import * as lucide from 'lucide'  → убрать CDN
//   - import ExcelJS from 'exceljs'     → убрать CDN
//   - вынести state/store.js            → import из app.js
//   - вынести utils/calc.js             → import из app.js
//   - ...и так далее
// ════════════════════════════════════════════════════════════════════

// Загружаем app.js как обычный (не-модульный) скрипт,
// чтобы все его функции автоматически попали в window.
// DOM уже готов, т.к. module-скрипты deferred.
const script = document.createElement('script');
script.src = '/app.js';
document.head.appendChild(script);
