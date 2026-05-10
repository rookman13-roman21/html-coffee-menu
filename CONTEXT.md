# CONTEXT — MBS* Coffee Menu

> CFO-инструментарий для владельца кофейни. SPA на Vite + ES-модули.
> Последнее обновление: 10 мая 2026 (сессия 26)

---

## 1. Назначение проекта

**Аудитория:** будущие и действующие владельцы кофеен (студенты MBS).

**Задача:** дать финансовый инструмент, который открывается двойным кликом в браузере и позволяет:
- рассчитать себестоимость каждого напитка из рецептуры
- сделать ABC-анализ меню по марже
- спланировать выручку и прибыль от продаж
- построить финмодель (ТБУ + сценарии) на основе реального плана продаж

---

## 2. Файловая структура

```
HTML_coffee_menu/
├── index.html          # Разметка + <script type="module" src="/src/main.js">
├── styles.css          # Все стили (CSS Variables, Grid, Flexbox, Dark theme, Print)
├── vite.config.js      # Vite 5.4 конфиг (root: '.', outDir: 'dist')
├── package.json        # devDependency: vite
├── build.py            # Одноразовый скрипт (исторический артефакт)
├── CONTEXT.md          # Этот файл
├── images/             # Фотографии напитков (16 .jpg)
├── dist/               # Сборка Vite (gitignore)
└── src/                # ES-модули (30 файлов, точка входа — main.js)
    ├── main.js         # Единственная точка входа Vite; INIT, window.*, switchTab
    ├── data/
    │   ├── constants.js    # GROUP_LABEL, SALES_PRESETS, FIXED_COSTS_DEF, nextDrinkId/SemiId/MatKey
    │   ├── drinks.js       # DRINKS, DRINKS_ORIG, DRINK_IMAGES, DRINK_QUALITY
    │   └── mat.js          # MAT, MAT_ORIG
    ├── state/
    │   ├── store.js        # S, Loc, DEFAULTS, activeLoc, saveState, loadState, resetGlobalsToBase
    │   └── ui-state.js     # dirty, sortState, salesSortState, _matActiveCat, PS_DEFAULTS
    ├── utils/
    │   ├── calc.js         # calcCost, calcIngCost, calcSemiCostPerUnit, enrich, withABC, ...
    │   ├── format.js       # rub, pct, int, fcBarHtml, riskBadge, fcCombinedHtml, abcBadge, fcCls
    │   └── image.js        # getDrinkImage
    ├── render/
    │   ├── dashboard.js    # renderDashboard
    │   ├── cost.js         # renderCost
    │   ├── sales.js        # renderSales
    │   ├── finmodel.js     # renderFinModel
    │   └── recipes.js      # renderRecipes
    ├── modals/
    │   ├── drink.js        # openAddDrink, openEditDrink, saveDrink, deleteDrink, resetDrink
    │   ├── mat.js          # openAddMat, openEditMat, saveMat, deleteMat, cancelMat
    │   └── semi.js         # openAddSemi, openEditSemi, saveSemi, deleteSemi
    ├── export/
    │   ├── csv.js          # exportCSV, exportDashboard, exportSales
    │   └── techcards.js    # _techCardCSS, _buildTechCardBlock, _buildSemiTechCardBlock, exportTechCards, mvdDownload*
    └── ui/
        ├── updaters.js     # switchTab, flashCells, renderTab, markDirty
        ├── events.js       # burgerNav, modalDirty, safeClose, Escape, keyboard nav
        ├── modals.js       # openModal, closeModal, safeCloseModal, _unsaved warning
        ├── ingredients.js  # addIngRow, matOptions, _onIngMatChange, _ingPlaceholder
        ├── cost-table.js   # openCostEditor, _syncTargetFCInputs, setMatCat
        ├── locations.js    # renderLocSwitcherUI, renderLocList, modal-loc
        ├── misc.js         # exportFullPDF/XLSX, exportMaterialsPDF/XLSX, exportSuppliersPDF/XLSX,
        │                   # buildBEPChart, buildSeasonalChart, openDropCandidates, openPriceHistory
        ├── payroll.js      # renderPayroll, calcPositionCosts, renderPayrollSummary
        ├── recipe-view.js  # openViewDrink
        ├── sort.js         # setSort, sortDrinks, thSort, setSalesSort, thSalesSort, ...
        └── suppliers.js    # renderSupplierBook, openSupplierModal, saveSupplier
```

**Сборка Vite:**
- Dev: `npm run dev` → `localhost:5173`
- Build: `npm run build` → `dist/` (33 модуля, ~227 kB, 381ms)
- `index.html` содержит только `<script type="module" src="/src/main.js">` + CDN ExcelJS

---

## 3. Стек

| Слой | Технология |
|------|-----------|
| Разметка | HTML5 |
| Стили | CSS (CSS Variables, CSS Grid, Flexbox, `@media print`) — `styles.css` |
| Логика | Vanilla JS ES-модули — `src/` (30 файлов, точка входа `src/main.js`) |
| Сборка | **Vite 5.4** (`vite.config.js`; dev: `localhost:5173`, build: `dist/`) |
| Excel-экспорт | ExcelJS 4.4 (CDN `<script>` в `index.html`; **не npm**) |
| Шрифт | Mulish (Google Fonts, CDN) |
| Иконки | Lucide (CDN, UMD) |
| Зависимости runtime | **нет** (кроме CDN-ресурсов) |

---

## 4. Дизайн-токены (CSS-переменные)

```css
--navy:   #417033   /* тёмно-зелёный, заголовки, шапка, акцент */
--green:  #4F883E   /* основной зелёный, шапки таблиц */
--light:  #E7F2E3   /* светло-зелёный фон карточек "hi" */
--soft:   #B6D8AB   /* полосы ABC-A, прогресс-бары good */
--red:    #CC2841   /* риск, отрицательные значения */
--red-bg: #F8DDE1   /* фон карточек danger/пессимистичного сценария */
--border: #cde3c5   /* рамки карточек и таблиц */
--muted:  #6b7280   /* вторичный текст, подписи */
--font:   'Mulish', sans-serif
```

---

## 5. Архитектура JS

### 5.1 DATA (источник истины)

**`MAT`** — объект-словарь сырья (18 базовых позиций + `custom_N` при добавлении пользователем):
```js
MAT = {
  coffee:        { name, unit, price, size },  // price = ₽ за 1 unit, size = г/мл/шт в 1 unit
  filter_coffee,                               // зерно под фильтр (отдельный ключ, p=4000₽/кг)
  milk, cream, cocoa, matcha, sugar, sugar_van, sugar_org,
  cup250, cup350, cup450, cup_p300, cup_p500,
  orange, tea, tonic, lime
}
```

**`SEMI`** — массив полуфабрикатов (создаются пользователем):
```js
SEMI = [
  { id, name, unit: 'мл'|'г'|'шт', yield: number, process: string,
    recipe: [{mat, amt, loss?}] }
]
```
- `id` — автоинкремент от `nextSemiId` (начинается с 1)
- `unit` / `yield` — единица и объём одной партии выхода
- `recipe` — только сырьё из MAT (не рекурсивно, п/ф не могут содержать п/ф)

**`nextSemiId`** — автоинкремент id для полуфабрикатов

**`DRINKS`** — массив 30 базовых напитков (ids 0–29; + кастомные при добавлении):
```js
{ id, group, name, vol, recipe: [{mat?, semi?, amt, loss?}], price, custom? }
```
- `group`: `'hot'` | `'tea'` | `'cold'` | `'filter'`
- ids 27–29: Фильтр-кофе 250/350/350 (группа `'filter'`, ингредиент `filter_coffee`)
- `recipe.loss` — коэффициент потерь при обработке (например, апельсин `loss:0.5`)
- `recipe.mat` — ключ сырья из MAT **или** `recipe.semi` — id полуфабриката из SEMI
- `price` — базовая цена продажи (переопределяется через `S.salePrices`)
- `custom: true` — признак пользовательского напитка (сохраняется в localStorage)

**`FIXED_COSTS_DEF`** — 6 статей постоянных расходов (шаблон)

**`GROUP_LABEL`** — словарь меток групп:
```js
{ hot: 'Горячие кофейные', tea: 'Чай и матча', cold: 'Холодные напитки', filter: 'Фильтр-кофе' }
```

**`DEFAULTS`** — снимок исходных цен/цен продажи/порций для кнопки «Сброс»

**`SALES_PRESETS`** — 4 пресета плана продаж: `normal` / `quiet` / `summer` / `winter`

**`nextDrinkId`** — автоинкремент id для новых напитков (начинается с 30)

**`nextMatKey`** — суффикс для ключей кастомного сырья (`custom_1`, `custom_2`, ...)

---

### 5.2 STATE (`S`)

```js
S = {
  prices,           // текущие цены сырья { mat_key: number }
  salePrices,       // цены продажи напитков { id: number }
  portions,         // порций/день { id: number }
  days,             // дней в месяце (default: 30)
  targetFC,         // целевой food-cost % (default: 0.25)
  fixedCosts,       // массив { name, value } — постоянные расходы
  taxMode,          // 'none' | 'usn6' | 'usn15' — налоговый режим
  investment,       // стартовые вложения ₽ (для расчёта окупаемости)
  payrollPositions, // [ { id, name, rate, hours, shifts, count, empType } ] — ФОТ по должностям
  payrollSettings,  // { mrot, ndfl, ins } — настройки расчёта ФОТ
  seasonality,      // [×1..×N] × 12 месяцев — сезонный коэффициент выручки
  suppliers,        // { mat_key: { name, phone, note, site } } — поставщик к ингредиенту
  supplierBook,     // [ { id, name, phone, note, site } ] — общий справочник поставщиков
  priceLog,         // [ { matKey, oldPrice, newPrice, date } ] — лог изменений цен сырья
  activePreset,     // string | null — ключ активного пресета плана продаж
}
```

**Поставщики по умолчанию** (привязаны к ингредиентам):
- `coffee`, `filter_coffee` → Rockets.coffee (+7 925 386-74-20)
- `tonic` → Rocket Tonic (+7 800 201-79-69)
- `cocoa` → Unicava (+7 922 027-11-17)
- `milk`, `cream` → Петмол (+7 999 233-30-04)

**Справочник поставщиков (5 записей):** Rockets.coffee, Tasty coffee, Rocket Tonic, Unicava, Петмол

---

### 5.3 CALCULATIONS

| Функция | Что делает |
|---------|-----------|
| `calcCost(drink)` | Себестоимость напитка из рецептуры (с учётом loss; поддерживает `{semi}` и `{mat}`) |
| `calcIngCost(ing)` | Себестоимость одного ингредиента (поддерживает `{semi}` и `{mat}`) |
| `calcSemiCostPerUnit(semi)` | Себестоимость 1 единицы выхода полуфабриката: сумма сырья / yield |
| `enrich()` | Возвращает массив drinks + `{cost, price, profit, fc, rec}` |
| `withABC(drinks)` | Добавляет поле `abc: 'A'|'B'|'C'` (20/30/50% по прибыли) |
| `avgMetrics(drinks)` | Простые средние (avgCost, avgPrice, avgProfit, avgFC) |
| `weightedMetrics(drinks)` | **Взвешенные** средние по реальным порциям из плана продаж |
| `salesMetrics(drinks)` | Итоги плана: totalPort, totRevDay/Mon, totPrfDay/Mon |
| `bepCalc(drinks)` | ТБУ от взвешенных показателей: cupsMonth, cupsDay, revBEP |

**Формула себестоимости ингредиента:**
```
cost = (price_per_unit / size_g) * amt_g
если loss: cost = cost / (1 - loss)
```

**ABC-классификация** (по убыванию прибыли/чашку):
- A = топ 20% → приоритет продаж
- B = следующие 30% → рабочий ассортимент
- C = оставшиеся 50% → пересмотреть цену или себестоимость

---

### 5.4 РЕНДЕР-ФУНКЦИИ

Каждая вкладка — отдельная функция, которая пишет `innerHTML` в `<div id="tab-*">`.

| Функция | Вкладка |
|---------|---------|
| `renderDashboard()` | 📊 Обзор меню |
| `renderCost()` | 🧮 Себестоимость |
| `renderSales()` | 🛒 План продаж |
| `renderFinModel()` | 💰 Финмодель |
| `renderRecipes()` | 📋 Рецептуры |

**Паттерн ленивого рендера:**
```js
const dirty = { dashboard:true, cost:true, sales:true, finmodel:true, recipes:true };
// При переходе на вкладку — рендер только если dirty=true
// После рендера dirty=false
```

---

### 5.5 FORMAT HELPERS

```js
rub(v)             // → "1 234 ₽"
pct(v)             // → "26.1%"  (v = 0..1)
int(v)             // → "1 234"
fcBarHtml(fc)      // → HTML с цветным текстом + прогресс-бар (зел/жёлт/красн)
riskBadge(fc)      // → <span class="risk risk-*">🟢/🟡/🔴</span>
fcCombinedHtml(fc) // → riskBadge + fcBarHtml в одном flex-контейнере (используется в таблицах)
abcBadge(abc)      // → <span class="abc abc-A/B/C">A</span>
fcCls(fc)          // → 'good' | 'ok' | 'bad' (пороги: 0.25 / 0.30)
```

---

### 5.6 SORT

```js
// Дашборд
const sortState = { col: 'profit', dir: 'desc' };
function setSort(col)           // клик по заголовку → toggle asc/desc
function sortDrinks(drinks)     // сортирует по sortState
function thSort(col, label, cls, tip) // генерирует <th> с onclick, стрелкой и тултипом

// Себестоимость — сортировка встроена в renderCost() напрямую (нет отдельного sortState)

// План продаж (поддерживает сортировку по revMon, prfMon и др.)
const salesSortState = { col: 'name', dir: 'asc' };
function setSalesSort(col) / thSalesSort() / filterSales(val)

// Рецептуры
let recipeSort = 'group';   // 'group' | 'name' | 'fc' | 'profit'
let recipeGroup = 'all';    // 'all' | 'hot' | 'tea' | 'cold' | 'filter'
function setRecipeSort(s) / setRecipeGroup(g) / filterRecipes(val)
```

---

### 5.7 EXPORT CSV

```js
exportCSV(filename, headers, rows)  // скачивает .csv с BOM (для Excel)
exportDashboard()                   // из вкладки Дашборд
exportSales()                       // из вкладки План продаж
```

---

### 5.8 МОДАЛЬНЫЕ ОКНА

**modal-drink** — добавить / редактировать напиток:
```js
openAddDrink()          // открыть в режиме "новый"
openEditDrink(id)       // открыть в режиме "редактировать"
saveDrink()             // сохранить в DRINKS + S.salePrices
deleteDrink(id)         // удалить из DRINKS + S
resetDrink(id)          // сбросить к DRINKS_ORIG (только базовые)
addIngRow(mat, amt, loss) // добавить строку ингредиента в форму
```

**modal-mat** — добавить новое сырьё:
```js
saveMat()               // добавить в MAT + S.prices с ключом 'custom_N'
deleteMat(key)          // проверяет использование в рецептурах → удаляет
```

**modal-semi** — добавить / редактировать полуфабрикат:
```js
openAddSemi()                        // открыть в режиме "новый"
openEditSemi(id)                     // открыть в режиме "редактировать"
saveSemi()                           // create/update в SEMI → renderCost()
deleteSemi(id)                       // проверяет использование в напитках → удаляет
addSemiIngRow(matKey, amt, loss)     // добавить строку MAT-ингредиента в форму п/ф
matOnlyOptions(selected)             // <option> только из MAT (без SEMI)
```

Особенности `modal-semi`:
- Live-расчёт стоимости: плашка `#ms-cost-preview` — «Себест. сырья: X ₽ · Y ₽/ед.»; обновляется через `_updateSemiCostPreview()` при изменении любого поля
- Поле кол-ва: `type="text" inputmode="decimal"` — placeholder зависит от единицы сырья

---

### 5.9 PERSIST & THEME

```js
saveState()   // сериализует S + customDrinks + customMats → localStorage('mbs_coffee_s')
loadState()   // восстанавливает при старте; не перезаписывает дефолты если в localStorage пустой объект/массив
toggleTheme() // dark/light; обновляет data-lucide на theme-icon; сохраняет в localStorage
toggleBurger() // мобильное меню
closeOnboarding() // скрывает онбординг; сохраняет флаг в localStorage
```

---

### 5.10 ФИНМОДЕЛЬ — ДОПОЛНИТЕЛЬНЫЙ ФУНКЦИОНАЛ

**P&L (отчёт о прибылях и убытках):**
- Выручка → Себестоимость сырья → Валовая прибыль → Постоянные расходы → EBIT → Налог → Чистая прибыль

**Налоговые режимы (`taxMode`):**
- `none` — без налога
- `usn6` — УСН 6% от выручки
- `usn15` — УСН 15% от (доходы − расходы)

**Окупаемость инвестиций:**
```
paybackMon = investment / baseNet (мес.)
```

**«А что если?» (What-if калькулятор):**
- Слайдер −30%..+30% → пересчитывает средний чек, FC%, ТБУ, чистую прибыль

**Статьи постоянных расходов:**
```js
addFixedCost()       // добавить статью
delFixedCost(i)      // удалить (минимум 1 статья)
onFixedCostName(i,v) // переименовать inline
```

**`buildBEPChart()`** — SVG-функция (~130 строк). Рисует диаграмму ТБУ: выручка vs расходы, зоны убытка/прибыли, маркер ТБУ, линия плана. **Написана, но не вызывается** — намеренно отключена.

---

### 5.11 RESET

```js
resetAll()  // confirm → восстанавливает S из DEFAULTS + FIXED_COSTS_DEF + очищает localStorage
```

---

## 6. Вкладки — детальное описание

### 📊 Дашборд
- 8 KPI-плашек: кол-во напитков, средний чек, прибыль/чашка, FC%, целевой FC%, класс A (топ 20%), риск FC>30%, на грани FC 25-30%
- Мини-бар-чарт Топ-10 по прибыли (HTML div, без SVG)
- Таблица рейтинга: сортировка по клику, FC-бар, ABC-бейдж, inline-редактирование, кнопка удаления для кастомных
- Поиск по названию
- Легенда ABC
- Кнопки: «⬇ CSV»

### 🧮 Себестоимость
- Сетка редактируемых цен на сырьё (при изменении → дебаунс-пересчёт) — **сворачивается** кнопкой «Цены на сырьё ▲/▼»
- Кнопка «+ Сырьё» → modal-mat
- **Секция полуфабрикатов** — карточки SEMI с себестоимостью/ед., кнопки редактирования и удаления; **сворачивается** кнопкой «Полуфабрикаты ▲/▼»; кнопка «+ Полуфабрикат» → modal-semi
- Целевой FC% (редактируемый) → обновляет колонку «Рекомендуемая цена»
- Таблица: Напиток / Себест. / FC% (объединённый: значок+%+полоска) / Ваша цена / Рекомендуемая / Прибыль / кнопка
  - Рекомендуемая цена подсвечивается жёлтым (`#fffbe6`) + ⚠️ только если `FC% > targetFC + 10пп`
  - Кнопка «↺» в строке: сброс к исходной рецептуре и цене
- Поиск + сортировка

### 🛒 План продаж
- **KPI-строка 1** `.sales-kpi-row1`: «Выручка/мес», «Прибыль/мес» (зелёная), «Чашек/день»
- **KPI-строка 2** `.sales-kpi-row2`: «Food-cost %» (цвет по порогу), «Средний чек», блок «Дней в месяце + кнопки ±10%»
- Редактируемые порции/день (oninput + дебаунс 400мс)
- Таблица **4 колонки**: Напиток / Порций/день / Выручка/мес ₽ / Прибыль/мес ₽
- ИТОГО-строка в tfoot
- Пресет-селект + поиск по названию + сортировка по 4 столбцам
- Кнопки «⬇ CSV»

### 💰 Финмодель
- Редактируемые статьи постоянных расходов (inline + delete)
- Режим налогообложения (select)
- Стартовые вложения + расчёт окупаемости
- Взвешенные KPI-плашки из плана продаж
- «А что если?» — слайдер изменения цен
- Сценарии ×0.5/×1.0/×2.0 от базового плана
- P&L-таблица (7 строк)

### 📋 Рецептуры
- Фильтр по группе (hot / tea / cold / filter) + поиск + сортировка (4 режима)
- Карточки: ингредиенты с пропорциональными полосами, доля %, стоимость ₽
- ABC-бейдж, FC%, кнопка редактирования для кастомных напитков
- Итоги: себестоимость / цена продажи / прибыль
- Кнопки: «+ Напиток», «PDF техкарт»

---

## 7. Связи между вкладками

```
Цены сырья (🧮) ──────┐
Цены продажи (🧮) ─────┼─→ enrich() → всё пересчитывается
Целевой FC% (🧮) ──────┘

Порции/день (🛒) ──────────→ salesMetrics() → weightedMetrics()
                                     ↓
                              💰 Финмодель (ТБУ + сценарии + P&L)
```

---

## 8. Известные особенности и решения

| Проблема | Решение |
|---------|---------|
| Sticky thead конфликтовал со sticky header | `thead { position: sticky; top: 0 }` — sticky на элементе thead, а не на th; работает во всех браузерах включая Safari |
| `border-collapse: collapse` ломал z-index у sticky | Переход на `border-collapse: separate; border-spacing: 0` + `border-bottom` на `td` |
| KPI-значения с длинным текстом переполнялись | `clamp(20px, 2.2vw, 26px)` + `word-break: break-word`; текст убран из `kpi-value` в `kpi-label` |
| Тултипы обрезались в overflow:auto таблице | `[data-tip]::after { position: fixed }` + JS-позиционирование через `mouseover` с `--tip-x`/`--tip-y` |
| Тултип вылезал за нижний край экрана | JS проверяет `spaceBelow < 130` → флип вверх через `--tip-anchor` |
| Инициализация тёмной темы ломала theme-icon | `element.setAttribute('data-lucide', 'sun')` вместо `textContent = '☀️'` |
| Финмодель не учитывала реальный план | Замена `avgMetrics` на `weightedMetrics` + `salesMetrics` |
| Сценарии с ручным вводом чашек | Заменены на множители ×0.5/×1.0/×2.0 от плана |
| Экспорт CSV в Excel (кодировка) | BOM (`\uFEFF`) + разделитель `;` |
| Потери при отжиме/обработке | `loss` в рецептуре: `cost / (1 - loss)` |
| Спиннер `input[type=number]` ломался на 2-й клик | `oninput` + дебаунс 400мс — DOM не пересоздаётся пока пользователь кликает |
| Выделение текста в ячейках при быстром клике | `user-select:none` на `td` + `user-select:auto` на `td input` |
| FC% не двигался через text-align (flex-контейнер внутри td) | `justify-content: flex-end` на `.fc-combined` + `text-align: right; padding-right: 24px` на `td` |
| Поставщики из localStorage перезаписывали дефолты | `loadState()`: проверка на непустой объект/массив перед применением |
| Чёрный экран при печати в Safari (`file://`) | Blob URL и popup `window.print()` не работают в Safari на `file://`. Решение: `_printViaIframe(html)` — скрытый iframe в текущем документе, `iframe.contentWindow.print()` из родительского контекста |
| Белый лист при скачивании PDF в Safari | Blob URL замораживал страницу при открытии диалога → `_printViaIframe` без Blob |
| `type="number"` placeholder не показывается в Safari | `type="text" inputmode="decimal"` — placeholder всегда виден, `parseFloat()` при сохранении |
| `unit` хранится как `'1 кг'`/`'1 л'` (не просто `'кг'`) | Проверка через `.includes('кг')` / `.includes('л')` для определения формата placeholder |
| iOS Safari зумирует страницу при фокусе | `font-size: 16px !important` на все `input/select/textarea` внутри `@media (max-width: 768px)` |
| `position: fixed` не работает внутри `position: sticky` на iOS | `#loc-menu` и `#export-menu` вынесены из хедера в DOM после `</header>`; JS позиционирует через `getBoundingClientRect()` |
| На мобиле выпадалка «Моя кофейня» открывалась внизу экрана | `top: 58px !important` в мобильном медиа-запросе — меню прижато к шапке |
| `.btn-green` не был определён в CSS | Добавлен `.btn-green { background: var(--green); color: #fff; border: none; }` + hover + dark override |
| Десктопная строка ингредиента переносилась на 2-й ряд | Мобильный `@media` устанавливал `grid-row: 2` → десктоп должен явно указывать `grid-row: 1` на всех 5 дочерних. Переключить с `nth-of-type` на `nth-child`. |
| Предупреждение о несохранённых изменениях показывалось при открытии модала | `_markModalDirty` вызывался в `openEditDrink`/`openEditSemi` — убрать эти вызовы; метить dirty только через делегированный `input`/`change` на документе |
| Предупреждение не адаптировалось под тёмную тему | Инлайн-стили заменены на CSS-классы (`._unsaved-box` и др.) с правилами `body.dark` |
| Настройки налогообложения (МРОТ/НДФЛ/взносы) не пересчитывали ФОТ | `_refreshPayrollRow` не была выставлена в `window` → добавлена в `_srcExports` через `main.js` |
| Легенда ABC выводилась в одну строку на мобильном | В `renderDashboard`: заголовок `display:block`, каждый пункт в отдельном `<div>`, обёртка `flex-direction:column` |
| Фокус слетал с инпутов МРОТ/НДФЛ/взносы при каждой нажатой клавише | `oninput` → `onchange` в трёх инпутах `finmodel.js` — ре-рендер только при уходе из поля |
| Настройки налогообложения (МРОТ/НДФЛ/взносы) не пересчитывались после ввода | `_refreshPayrollRow` не была выставлена в `window` → добавлены в `_srcExports` через `main.js` |
| Легенда ABC выводилась в одну строку на мобильном | В `renderDashboard`: заголовок `display:block`, каждый пункт в отдельном `<div>`, обёртка `flex-direction:column` |
| Фокус слетал с инпутов МРОТ/НДФЛ/взносы при каждой нажатой клавише | `oninput` → `onchange` в трёх инпутах `finmodel.js` — ре-рендер происходит только при уходе из поля |

---

## 9. Как расширять проект

### Добавить новый напиток
```js
// В массив DRINKS добавить объект:
{ id: 30, group: 'cold', name: 'Новый напиток', vol: 300,
  recipe: [{mat: 'coffee', amt: 19}, {mat: 'cup_p300', amt: 1}],
  price: 350 }
// S.portions[30] добавится автоматически через DEFAULTS
```

### Добавить новое сырьё
```js
// В MAT добавить запись:
newMat: { name: 'Название', unit: '1 кг', price: 500, size: 1000 }
```

### Изменить пороги ABC
```js
// В функции withABC():
const nA  = Math.round(n * 0.2);   // % для класса A
const nAB = Math.round(n * 0.5);   // % для классов A+B
```

### Изменить пороги FC%
```js
// В функции fcCls():
return fc <= 0.25 ? 'good' : fc <= 0.30 ? 'ok' : 'bad';
```

### Включить график ТБУ
```js
// В renderFinModel(), после блока bepFormula, добавить:
`<div class="panel" style="padding:16px;margin-bottom:20px">
  ${buildBEPChart(bep.cupsMonth, bep.revBEP, avgPrice, avgCost, totalFixed, totalPort * S.days)}
</div>`
```

---

## 10. Сессии разработки

### Сессия 1 (5 мая 2026) — создание проекта
- Создана структура HTML + CSS + JS в одном файле
- Реализованы 4 вкладки: Дашборд, Себестоимость, План продаж, Финмодель
- Базовые 27 напитков с рецептурами и 17 позиций сырья
- MBS-дизайн: Mulish, CSS-переменные

### Сессия 2 (5 мая 2026) — полировка + новый функционал
- Переименовано: «MBS* Coffee Menu»
- KPI-лейблы: убраны uppercase, уменьшена min-width
- Добавлен FC-прогрессбар (`fcBarHtml`)
- Сортировка по заголовкам таблицы (Дашборд)
- Кнопка Reset (шапка)
- Финмодель связана с планом продаж через `weightedMetrics` / `salesMetrics`
- Сценарии переработаны: ×0.5/×1.0/×2.0 от базового плана
- Добавлена вкладка 📋 Рецептуры с карточками и полосами
- Экспорт CSV (Дашборд + План продаж)

### Сессия 3 (6 мая 2026) — тултипы, описания вкладок, выделение текста
- `.tab-intro` блок в каждой вкладке: иконка + заголовок + текст + шаги
- Тултипы на всех заголовках таблиц (`data-tip` + `.tip` класс)
- `user-select: none` на ячейках таблиц без наследования в инпуты

### Сессия 4 (6 мая 2026) — крупный функциональный апгрейд
- 💾 **localStorage** — `saveState()` / `loadState()`
- 🔍 **Поиск** — фильтрация в Дашборде, Себестоимости, Плане продаж, Рецептурах
- 📉 **Мини-бар-чарт** — Топ-10 по прибыли на Дашборде
- 🌙 **Тёмная тема** — `toggleTheme()`, сохраняется в localStorage
- 🖨 **Печать** — `@media print`
- 🧾 **Налоги** — `taxMode`: none / usn6 / usn15
- 💰 **Инвестиции + окупаемость**
- 📊 **P&L-таблица** в Финмодели
- 🎚 **«А что если?»** — слайдер изменения цен
- ✏️ **CRUD напитков и сырья** — модальные окна add/edit/delete
- ✏️ **Редактируемые названия статей расходов**

### Сессия 5 (6 мая 2026) — исправление спиннера числовых полей
- `oninput` + дебаунс 400мс для порций/день
- Убраны все `e.preventDefault()` на `mousedown`
- CSS-каскад `user-select` для td/input

### Сессия 6 (6 мая 2026) — баги, вёрстка, тултипы
- Исправлен баг: `toggleTheme()` при инициализации использовал `textContent` и уничтожал `<i id="theme-icon">` → заменён на `setAttribute('data-lucide', 'sun')`
- Исправлен `build.py`: защита от повторного запуска + `import os` наверх
- Исправлена опечатка «фисташювый» → «фисташковый»
- Удалён дублирующийся CSS-класс `.cost-del-btn:hover`
- Тултипы унифицированы: единый механизм `[data-tip]::after { position: fixed }` для всех элементов; добавлен авто-флип вверх если мало места снизу
- KPI-карточка «Класс A»: текст «напитков» убран из `kpi-value` → не переносится
- Sticky-заголовки таблиц: `border-collapse: separate` + `thead { position: sticky }` (не `th`) — работает во всех браузерах включая Safari

### Сессия 7 (6 мая 2026) — сортировка и поиск во всех вкладках, resetDrink, график ТБУ
- **Сортировка** добавлена в Себестоимость (`costSortState`, `setCostSort`, `thCostSort`, `filterCost`) и План продаж (`salesSortState`, `setSalesSort`, `thSalesSort`, `filterSales`) — сортировка по 6–7 столбцам каждая
- **Поиск** расширен на вкладки Себестоимость, Рецептуры (`recipeSearch`)
- **Фильтр по группам** в Рецептурах (`recipeGroup`: all / hot / tea / cold)
- **Сортировка в Рецептурах** — 4 режима: по группам, алфавиту, FC%, прибыли
- **`resetDrink(id)`** — сброс изменённого напитка к исходным значениям (`DRINKS_ORIG`); кнопка «Сбросить» в модале
- **Флаг `modified`** на базовых напитках после редактирования — показывается иконка карандаша и кнопка сброса
- **`buildBEPChart()`** — SVG-функция (~130 строк): диаграмма ТБУ с зонами убытка/прибыли, маркером точки БУ с тултипом при наведении, линией плана, легендой, подписями осей. Написана, **в `renderFinModel` не вызывается** — намеренно отключена (включить см. раздел 9)
- **`nextMatKey`** — автоинкремент суффикса для кастомного сырья (`custom_1`, `custom_2`, …)
- **`DRINKS_ORIG`** — иммутабельный снимок базовых напитков при старте для функции сброса
- **`MAT_ORIG`** — иммутабельный снимок базового сырья при старте

### Сессия 8 (7 мая 2026) — поставщики, пресеты, FC% колонка, фильтр-кофе

**Новое сырьё и напитки:**
- `filter_coffee` добавлен в MAT как отдельный ингредиент (зерно под фильтр, 4000₽/кг)
- Группа `filter` добавлена в GROUP_LABEL
- Напитки 27–29: «Фильтр-кофе 250», «Фильтр-кофе 350», «Фильтр-кофе (авторский)» — используют `filter_coffee`
- `nextDrinkId` начинается с 30 (не с 27)

**Поставщики:**
- `S.suppliers` — словарь привязки ингредиента к поставщику; заполнен дефолтными данными для 6 ключей
- `S.supplierBook` — справочник 5 поставщиков (Rockets.coffee, Tasty coffee, Rocket Tonic, Unicava, Петмол)
- Логика `loadState()`: не перезаписывать дефолты если в localStorage пустой объект/массив

**Активный пресет плана продаж:**
- `S.activePreset` — ключ текущего активного пресета; устанавливается в `applySalesPreset(key)`
- В `renderSales()`: активная кнопка пресета подсвечивается зелёным (`background: var(--green); color: #fff`)

**FC% колонка (таблицы себестоимости и дашборда):**
- `fcCombinedHtml(fc)` — объединяет `riskBadge` + `fcBarHtml` в один flex-контейнер
- Колонки Статус и FC% объединены в одну: `filterCost` colspan=8, `renderCost` colspan=7
- CSS: заголовок по центру, значение вправо (`justify-content: flex-end` на `.fc-combined`)

**Рекомендуемая цена в таблице себестоимости:**
- Подсветка `background: #fffbe6` + ⚠️ если `d.fc > S.targetFC + 0.10`
- Tooltip кнопки сброса: «Вернуть исходную рецептуру и цену»

**Исправление синтаксической ошибки:**
- В `renderCost()`: пропущен закрывающий `` ` `` шаблонной строки `_costEl.innerHTML` — исправлено; страница не открывалась

### Сессия 9 (7 мая 2026) — рефакторинг техкарт + Excel по ГОСТ + футер MBS

**Рефакторинг печати техкарт:**
- Вынесены общие части в три функции:
  - `_techCardCSS()` — CSS для всех PDF техкарт (A4, ГОСТ-стиль, print-bar, .mbs-footer)
  - `_buildTechCardBlock(d, orgName, cardNum, isLast)` — генерирует HTML одной техкарты: фото + «Утверждаю», 9 ГОСТ-блоков (шапка, рецептура брутто/нетто/потери, технология, качество, подписи)
  - `_openTechCardsWindow(title, hint, pages, autoprint)` — открывает попап с техкартами

**Excel техкарты (ExcelJS 4.4, CDN):**
- `mvdDownloadExcel()` — ГОСТ-структура на одном листе:
  - Шапка: A1:C6 фото, D1:H6 «Утверждаю»; слияние ячеек
  - 9 блоков: общие сведения, рецептура, технология, показатели качества, пищевая ценность, подписи
  - `autoH(text, colWidthChars, minH)` — автовысота строк по тексту
  - `wrapText: true` на всех длинных ячейках
- SheetJS остался для `exportFullXLSX` (общий Excel всей базы)

**Футер «Московская школа бариста · baristaschool.ru»:**
- Добавлен во все PDF-документы: `.mbs-footer` div в конце body
- Добавлен в Excel: последняя строка, серый курсив

### Сессия 10 (7 мая 2026) — исправление печати в Safari (чёрный экран + белый лист)

**Проблема:** Safari на `file://` при вызове `window.print()` из popup-окна замораживал документ → чёрный экран; Blob URL вызывал белый лист.

**Причина:** Safari не поддерживает `window.print()` из popup-окна на `file://` протоколе.

**Решение — `_printViaIframe(html, filename)`:**
```js
// Создаём скрытый iframe в текущей странице (не попап!)
const iframe = document.createElement('iframe');
iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
document.body.appendChild(iframe);
// Пишем HTML
const doc = iframe.contentWindow.document;
doc.open(); doc.write(html); doc.close();
// Ждём загрузки картинок → print из родительского контекста
iframe.contentWindow.print();
setTimeout(() => iframe.remove(), 2000);
```

**Почему это работает в Safari:**
- `iframe.contentWindow.print()` вызывается из контекста основной страницы — Safari обрабатывает корректно
- Нет Blob URL (они замораживают страницу при печати)
- Нет popup (заблокирован браузером / даёт чёрный экран)
- Страховка: если картинки не загрузились за 3 сек — печать запускается принудительно

**Что изменено:**
- `_openTechCardsWindow` → убраны popup и Blob URL, вызывает `_printViaIframe(html)`; убрана кнопка print-bar (не нужна — диалог открывается сразу)
- `exportFullPDF` → заменён `window.open + document.write` на `_printViaIframe(html, 'mbs-finmodel')`
- Все три функции печати (`exportFullPDF`, `mvdDownloadPDF`, `exportTechCards`) теперь используют единый `_printViaIframe`

**Ключевое правило для будущего:**
> ⚠️ На `file://` в Safari НЕЛЬЗЯ использовать Blob URL или `window.print()` из popup.
> Всегда использовать `_printViaIframe(html)` — скрытый iframe в текущем документе.

### Сессия 11 (7 мая 2026) — полуфабрикаты (полная реализация)

**Новые глобальные данные:**
- `SEMI = []` — массив полуфабрикатов: `{id, name, unit, yield, process, recipe:[{mat,amt,loss?}]}`
- `nextSemiId = 1` — автоинкремент id

**Расчёты:**
- `calcSemiCostPerUnit(semi)` — себестоимость 1 единицы выхода: `∑ calcIngCost(r) / yield`
- `calcCost(drink)` — обновлён: поддерживает `{semi, amt, loss}` в рецептуре через рекурсивный вызов `calcSemiCostPerUnit`
- `calcIngCost(ing)` — обновлён аналогично

**Рецептуры напитков:**
- `matOptions(selected)` — перестроен: значения `"mat:key"` / `"semi:id"`, полуфабрикаты в `<optgroup>`
- `addIngRow(selected, amt, loss)` — принимает `"mat:key"` или `"semi:id"`, legacy-ключ автоконвертируется
- `openEditDrink(id)` — загружает ингредиенты с `r.semi != null ? "semi:${r.semi}" : "mat:${r.mat}"`
- `saveDrink()` — парсит `type:key` → `{semi: parseInt(key)}` или `{mat: key}`

**Persist:**
- `saveState()` — добавлено `semiItems: SEMI`
- `loadState()` — восстанавливает `SEMI` и `nextSemiId` из `sv.semiItems`

**CRUD полуфабрикатов:**
- `openAddSemi()` / `openEditSemi(id)` / `saveSemi()` / `deleteSemi(id)`
- `addSemiIngRow(matKey, amt, loss)` — строка MAT-ингредиента только из MAT
- `matOnlyOptions(selected)` — `<option>` только из MAT
- `_updateSemiCostPreview()` — live-расчёт стоимости в модале
- `_onSemiMatChange(selectEl)` — обновляет placeholder/step при смене сырья

**Секция полуфабрикатов в `renderCost`:**
- Сворачиваемая панель (`_semiPanelOpen`, `toggleSemiPanel()`) с ▲/▼
- Карточки: название, выход, **себестоимость/ед. выделена зелёным**
- Кнопки редактирования и удаления прямо в карточке

**modal-semi в index.html:**
- Поля: название, единица выхода, выход, список ингредиентов, описание/процесс
- Плашка `#ms-cost-preview` — live-расчёт себестоимости
- Поля `ms-unit` и `ms-yield` имеют `onchange`/`oninput` для обновления preview

**openViewDrink:**
- Ингредиент `{semi}` показывается с именем и бейджем «п/ф» (зелёный)

**_buildTechCardBlock:**
- Строки рецептуры: п/ф отмечены `[п/ф]` надстрочно
- Блок «Используемые полуфабрикаты» — расшифрованный состав каждого п/ф с таблицей и описанием

**closeModal backdrop:**
- Добавлен `'modal-semi'` в список модалов с закрытием по клику на фон

### Сессия 12 (7 мая 2026) — умный placeholder для кол-ва ингредиента

**Проблема:** пользователь не понимал, в каких единицах вводить кол-во. Например, для сырья `'Зерно эспрессо (1 кг)'` непонятно — вводить граммы или килограммы.

**Решение:** placeholder в поле кол-ва зависит от единицы сырья:
- `unit` содержит `'кг'` или `'л'` → placeholder `0.000` (подсказывает 3 знака после запятой)
- всё остальное (г, мл, шт) → placeholder `0`

**Ключевой факт:** `MAT[key].unit` хранится как `'1 кг'`, `'1 л'`, `'1 шт'` (с числом!). Поэтому используется `.includes('кг')` / `.includes('л')`, а не строгое `===`.

**Функции:**
- `_semiIngPlaceholder(matKey)` — placeholder для модала полуфабриката
- `_semiIngStep(matKey)` — шаг (`0.001` для кг/л, `1` для остальных)
- `_ingPlaceholder(val)` — placeholder для модала напитка (val = `"mat:key"` или `"semi:id"`)
- `_ingStep(val)` — шаг для модала напитка
- `_onSemiMatChange(selectEl)` — обновляет placeholder и step при смене сырья (п/ф)
- `_onIngMatChange(selectEl)` — обновляет placeholder и step при смене сырья (напиток)

**Поле кол-ва переведено на `type="text" inputmode="decimal"`** — `type="number"` в Safari не показывал placeholder. `parseFloat()` при сохранении корректно парсит текстовое значение.

**Правило для будущего:**
> ⚠️ `type="number"` placeholder не отображается в Safari (особенно на `file://`).
> Для числовых полей с placeholder использовать `type="text" inputmode="decimal"`.


### Сессия 13 (8 мая 2026) — чистка кода, перенос кнопки, удаление ТБУ

**Исправление `_syncTargetFCInputs` (commit `76d2204`):**
- Функция синхронизировала значение целевого FC% только в одном поле; исправлена для синхронизации во всех инпутах сразу

**Удаление мёртвого кода (commit `6ff1121`, −82 строки):**
- Удалены: `costSortState`, `filterCost`, `thCostSort` — сортировка/поиск по себестоимости, отдельный стейт больше не нужен
- Удалены: `toggleMatPanel`, `toggleSemiPanel`, `_matPanelOpen`, `_semiPanelOpen` — сворачиваемые панели сырья и п/ф убраны из вёрстки
- Удалена переменная `costSearch` (поиск по себестоимости)
- `_matActiveCat` и `setMatCat()` **оставлены** (используются в renderCost)

**Перенос кнопки «+ Напиток» (commit `cad73b4`):**
- Убрана из `renderDashboard()` — на дашборде кнопки добавления напитка больше нет
- Добавлена в `renderRecipes()` рядом с «PDF техкарт» — обёрнуты в `<div style="display:flex;gap:8px">`

**Удаление блока ТБУ из Финмодели (commit `ee7500f`, −26 строк):**
- Убран весь блок «Точка безубыточности (ТБУ)»: заголовок section-title, панель с тремя плашками (чашек/день, выручка/мес, запас прочности), прогресс-бар покрытия и подсказка bepFormula
- Расчёты ТБУ (`bepCalc`, `bep.*`) **остались** в коде — используются в сценариях и What-if
- `buildBEPChart()` по-прежнему существует, но не вызывается (намеренно)

### Сессия 14 — техкарты по ГОСТ + реквизиты организации + органолептика напитков

**Поля органолептики и хранения в модалке напитка (`modal-drink`):**
- Добавлены 5 новых полей: `md-storage-temp` (Температура подачи), `md-storage-life` (Срок реализации), `md-appearance`, `md-taste`, `md-consistency` (textarea, resize:vertical)
- Соответствующие поля в объекте напитка: `storage_temp`, `storage_life`, `appearance`, `taste`, `consistency`
- При редактировании старого напитка органолептика подтягивается из легаси-объекта `DRINK_QUALITY[d.id]` (фолбэк)
- Дефолты по группе: горячие/чай — «не ниже 60°C» / «15 минут»; холодные — «не выше +10°C» / «30 минут»

**Те же 5 полей для модалки полуфабриката (`modal-semi`):**
- Поля: `ms-storage-temp`, `ms-storage-life`, `ms-appearance`, `ms-taste`, `ms-consistency`
- Удалён автозаполнитель `_autoFillSemiYield` — выход вводится вручную
- В CSS добавлено `textarea.modal-inp { height: auto; line-height: 1.5; padding: 8px 12px; }`

**Реквизиты организации (новый раздел в модалке локации `modal-loc`):**
- Поля: `legalName` (Юр. название ИП/ООО), `ceoTitle` (Должность), `ceoName` (ФИО), `address` (Адрес)
- Хранятся в объекте `Loc.list[i]` рядом с `name` и `icon`
- Хелпер `getOrgInfo()` возвращает `{ name, legalName, ceoTitle, ceoName, address }` с дефолтами
- Используются во всех PDF-техкартах автоматически

**Техкарты по ГОСТ Р 53105-2008 + ТР ТС 021/2011 (`_buildTechCardBlock`):**
Структура карты переработана под требования эксперта Роспотребнадзора:
1. **Шапка** — слева: ИП/ООО, коммерч. название, адрес. Справа: «УТВЕРЖДАЮ» + должность + ФИО + дата
2. **Таблица info** — наименование, группа, выход, дата, срок реализации, температура подачи, условия хранения сырья
3. **Раздел 1. Характеристика сырья** — статичный текст про ТР ТС 021/2011
4. **Раздел 2. Рецептура** — таблица брутто/нетто/потери/стоимость
5. **Раздел 3. Технология приготовления** — текст из `d.process` или дефолт по группе
6. **Раздел 4. Требования к оформлению и подаче** — динамический текст с подстановкой объёма, температуры, срока
7. **Раздел 5. Показатели качества и безопасности** — таблица органолептики + строка про ТР ТС 021/2011 п.6.2
8. **Раздел 6. Пищевая ценность** — таблица Белки/Жиры/Углеводы/Ккал из `calcNutrition(d)`

**Сигнатура `_buildTechCardBlock(d, org, cardNum, isLast)`** — теперь принимает объект `org` вместо строки `orgName` (обратная совместимость через `typeof org === 'string'`).

**Аналогично для полуфабрикатов** — `_buildSemiTechCardBlock` использует `s.storage_temp`, `s.storage_life`, `s.appearance`, `s.taste`, `s.consistency`.

**Исправление расчёта стоимости полуфабрикатов в PDF** (показывал «0 ₽»):
- `calcIngCost(r)` для ингредиентов полуфабриката не применял `_semiUnitFactor` (коэффициент кг→г, л→мл)
- Введена локальная `_semiIngCostPDF(r)` с правильной формулой (как в `calcSemiCostPerUnit`)

**Прочие UX-исправления:**
- Кнопки очистки у всех 4 поисковых полей через JS-класс `.visible` (CSS `:has()` нестабильно)
- Авто-замена запятой на точку в полях количества ингредиентов (`oninput`)
- Блок описания режима налогообложения под селектором tax mode
- Исправлен рецепт «Какао 300» (молоко 200→250)

**Критическая ошибка инициализации (исправлена):**
- При обновлении страницы дашборд показывал белый экран
- Причина: `['dashboard','cost','sales','finmodel','recipes'].forEach(t => renderTab(t))` рендерил все 5 вкладок при старте
- Решение: рендерить только активную вкладку через `switchTab(activeTab)`; остальные — лениво при первом переключении (флаг `dirty[tab]`)
- Добавлен `try/catch` в `renderTab()` с `console.error`
- ВНИМАНИЕ: INIT-блок **НЕ оборачивать в DOMContentLoaded** — `<script>` находится в конце `<body>`, событие уже произошло

**Опечатки в полях `calcNutrition` (исправлено):**
- Возвращает `{ protein, carbs, fat, kcal }` (не `prot`/`carb`)
- Использовать `nut.protein`, `nut.carbs` в любых новых местах вывода

---

### Сессия 14 — Дополнение: баг с nameEl в renderLocSwitcherUI

**Критический баг инициализации (исправлен):**
- `renderLocSwitcherUI()` использовала `nameEl` без объявления — `ReferenceError: nameEl is not defined`
- Ошибка происходила в INIT-блоке ДО вызова `switchTab(activeTab)` — весь скрипт останавливался
- Результат: всегда отображался `tab-dashboard` (захардкожен в HTML как `class="tab active"`), пустой и не прогруженный
- Симптом у пользователя: «скидывает на первую вкладку Дашборд, которая не грузится» — на любой сохранённой вкладке

**Исправление — добавить объявление `nameEl` внутри функции:**
```js
function renderLocSwitcherUI() {
  const loc = activeLoc();
  const nameEl = document.getElementById('loc-name');  // было забыто!
  const iconEl = document.getElementById('loc-icon');
  if (loc && nameEl) nameEl.textContent = loc.name;
  if (loc && iconEl) iconEl.textContent = loc.icon || 'кофе';
  renderLocList();
}
```

**В INIT-блоке вызов обёрнут в try/catch:**
```js
try { renderLocSwitcherUI(); } catch(e) { console.error('[renderLocSwitcherUI]', e); }
```

**Правила на будущее:**
- Любые `document.getElementById(...)` внутри функций должны объявляться локально через `const el = ...`
- INIT-блок критичен — любая необработанная ошибка гасит всю инициализацию включая `switchTab()`
- Все вызовы в INIT-блоке оборачивать в try/catch

---

### Сессия 15 (8 мая 2026) — новая вёрстка вкладки «План продаж»

**Новая 2-строчная KPI-секция (коммит `267d02f`):**

Вместо одной горизонтальной строки — два ряда KPI:
- **Строка 1** `.sales-kpi-row1`: 3 карточки — «Выручка / мес» (широкая), «Прибыль / мес» (широкая, зелёная), «Чашек / день» (компактная)
- **Строка 2** `.sales-kpi-row2`: 4 элемента — «Food-cost %» (граница меняет цвет по порогу), «Средний чек», блок «Дней в месяце + ±10%»

**Таблица плана продаж — 4 колонки:**
- Убраны колонки «Выручка/день» и «Прибыль/день» — перегружали экран
- Оставлены: **Напиток** / **Порций/день** / **Выручка/мес ₽** / **Прибыль/мес ₽**
- `filterSales` пересчитан под 4 колонки (`colspan=4`)

**Новые CSS-классы:**
- `.sales-kpi-row1`, `.sales-kpi-row2` — flex-строки KPI
- `.sales-kpi-card` — базовая карточка
- `.sales-kpi-wide` — широкая карточка (flex: 2)
- `.sales-kpi-compact` — компактная (flex: 1)
- `.sales-kpi-green` — зелёная рамка (прибыль)
- `.sales-days-scale` — блок «Дней + кнопки»
- `.sales-scale-btn.red/.green` — кнопки −10% / +10%

---

### Сессия 16 (8 мая 2026) — dark mode фиксы

**`.btn-green` не существовал в CSS (коммит `f47df2b`):**
- Кнопки «+ Поставщик», «+ Сырьё», «+ Полуфабрикат», «+ Напиток» использовали класс `.btn-green` в app.js — но он не был определён в styles.css
- Добавлены правила:
  ```css
  .btn-green { background: var(--green); color: #fff; border: none; }
  .btn-green:hover { opacity: .88; }
  body.dark .btn-green { background: var(--green); color: #fff; }
  ```

**`.sales-preset-select` в тёмной теме (коммит `f47df2b`):**
- Имел `background: #fff` без dark override → белый фон в тёмной теме
- Добавлено: `body.dark .sales-preset-select { background: #3c3c3c; color: #d4d4d4; border-color: #454545; }`

---

### Сессия 17 (8 мая 2026) — мобильные UX-фиксы

**Предотвращение zoom на iOS при фокусе (коммит `36c6709`):**
- iOS Safari зумирует страницу при фокусе на полях с `font-size < 16px`
- Добавлен универсальный override внутри `@media (max-width: 768px)`:
  ```css
  input, select, textarea,
  .inp, .modal-inp, .modal-select, .sales-preset-select {
    font-size: 16px !important;
  }
  ```
- Удалены дублирующие `font-size: 15px/16px` из отдельных мобильных правил

**Исправление выпадающего меню «Моя кофейня» на iOS (коммиты `7d4f586`, `d745b1d`):**

Причина бага: `position: fixed` внутри `position: sticky` не работает на iOS Safari.
- `#loc-menu` и `#export-menu` **вынесены из хедера** в DOM — сразу после `</header>`
- CSS: `position: fixed` для обоих меню; z-index: 250 (десктоп), 350 (мобайл)
- На десктопе: `toggleLocMenu()` и `toggleExportMenu()` вычисляют позицию через `.getBoundingClientRect()` и устанавливают `top`/`left`/`right` динамически
- На мобайле: `top: 58px !important` — меню открывается прямо под шапкой

**Обновлённые функции JS:**
```js
function toggleLocMenu(e) {
  // desktop: позиционирует по getBoundingClientRect() от #loc-switcher
  // mobile: css top:58px через !important
}
function toggleExportMenu(e) {
  // desktop: позиционирует справа, привязка к #export-wrap
}
```

---

### Сессия 18 (8 мая 2026) — inputmode для всех числовых полей

**Цель:** на мобиле открывать правильную клавиатуру для каждого поля ввода.

**Правило:**
| `inputmode` | Клавиатура | Где используется |
|---|---|---|
| `numeric` | Только цифры (без точки) | Целые числа: цена, объём, кол-во, ставки, МРОТ |
| `decimal` | Цифры + точка/запятая | Дробные: БЖУ, выход п/ф, %, НДФЛ, страховые |
| `tel` | Телефонная (цифры + + # *) | Поля телефона поставщиков |

**Что добавлено/изменено:**

*index.html:*
- `md-price` (цена напитка) → `inputmode="numeric"`
- `md-vol` (объём мл) → сначала `numeric`, потом исправлено на `decimal` (объём может быть дробным)
- `mm-price`, `mm-size` (цена/объём сырья) → `numeric`
- `mm-kcal` → `numeric`; `mm-protein`, `mm-fat`, `mm-carbs` → `decimal`
- `ms-yield` (выход полуфабриката) → `decimal`
- `sup-phone`, `sup-book-phone`, `mm-sup-phone` — `type="text"` → `type="tel" inputmode="tel"`

*app.js:*
- Потери `%` в строках ингредиентов → `numeric`
- `kpi-target-fc` (целевой FC%) → `numeric`
- Стартовые вложения → `numeric`
- ФОТ: ставка, часы, смены, кол-во → `numeric`
- МРОТ → `numeric`; НДФЛ, страховые → `decimal`
- Статьи расходов: сумма → `numeric`; % от выручки → `decimal`; доля % → `numeric`

**Уже было правильно (не изменялось):**
- Поля кол-ва ингредиентов (`.ing-amt`, `.ing-yield`) — `type="text" inputmode="decimal"` ✅
- Поле порций/день в таблице продаж — `inputmode="numeric"` ✅
- Цена сырья в таблице — `inputmode="numeric"` ✅
- Цена продажи (inline) — `inputmode="numeric"` ✅
- Дни в месяце — `inputmode="numeric"` ✅


---

### Сессия 19 (9 мая 2026) — глобальный аудит app.js: 7 правок в DATA-секции

**Цель:** полный аудит всех 6330 строк `app.js` — поиск логических ошибок, расхождений данных, опечаток в рецептурах.

**Коммит:** `1e62dbd` — «fix: recipe/process audit - 7 corrections (id:2,15,16,18,19,23,25)»

---

#### Найденные и исправленные ошибки (DATA-секция, строки 1–200)

**id:2 — Капучино 300** (горячие):
- `cup350` → `cup300` (стакан 300 мл, не 350)
- `vol: 350` → `vol: 300`

**id:15 — Раф классический**:
- `cream: 30` → `cream: 35` (сливки занижены; стандарт 30–35 мл)

**id:16 — Раф фисташковый** (опечатка в `process`):
- «Добавьте ваниль...» → «Добавьте фисташку...» — описание технологии приготовления

**id:18 — Флэт уайт 160 мл**:
- `cup250` → `cup_p300` (бумажный стакан с крышкой, не фарфоровый cup250)
- `vol: 200` → `vol: 160`

**id:19 — Латте матча 350 мл**:
- `vol: 300` → `vol: 350` (несоответствие объёма названию)
- `cup350` → `cup_p300` (бумажный стакан для матча-латте)

**id:23 — Лимонад апельсиновый 400 мл**:
- `cup350` → `cup450` (400 мл не влезает в стакан 350)
- `orange: 2` → `orange: 1.5` (2 апельсина на порцию — перерасход)

**id:25 — Холодный чай персиковый 400 мл**:
- `cup350` → `cup450` (аналогично id:23)

---

#### Аудит остального кода (строки 200–6330) — ошибок не найдено

| Блок | Строки | Результат |
|------|--------|-----------|
| Render-функции, helpers, sort | 200–1450 | ✅ чисто |
| XLSX export, saveState/loadState | 1450–2050 | ✅ чисто |
| Modals CRUD (напитки, сырьё, п/ф) | 2050–3000 | ✅ чисто |
| renderCost, renderSales | 3000–3700 | ✅ чисто |
| renderFinModel, BEP chart | 3700–4500 | ✅ чисто |
| Tech cards PDF/Excel, filterRecipes | 4500–5100 | ✅ чисто |
| Payroll, state updaters, openCostEditor | 5100–5450 | ✅ чисто |
| Suppliers, WhatIf, Seasonality, Init | 5450–6330 | ✅ чисто |

**Примечания:**
- `calcPositionCosts()` — схемы белая/серая/чёрная ФОТ рассчитываются корректно
- `recalcWhatIf3()` — переменные расходы масштабируются с трафиком, постоянные — нет
- `buildSeasonalChart()` — `totalYear`, `bestMonth`, `worstMonth` корректны
- `openDropCandidates()` — критерии score логически верны

---

#### Техническое примечание: обходной путь для git push

`run_in_terminal` для git-команд падает с regex overflow (сторонний терминал содержит `group-course-block.html`). Рабочий обходной путь — bash-скрипт через create_file + run_in_terminal.


---

### Сессия 20 (9 мая 2026) — изображения, логотип, подвал, мобильное меню

---

#### 1. Система изображений для напитков

**Инфраструктура уже существовала** (обнаружено в ходе аудита):
- `d.image` поддерживается в `filterRecipes()`, `openViewDrink()`, `_buildTechCardBlock()`
- CSS классы `.recipe-card-img`, `.mvd-photo-wrap` уже присутствовали
- Modal upload UI (FileReader → base64) уже был реализован

**Сделано:**
- Создана папка `images/` в репозитории
- Добавлен объект `DRINK_IMAGES` (app.js) — маппинг id напитка → путь к файлу
- Добавлена функция `getDrinkImage(d)` — возвращает `d.image || DRINK_IMAGES[d.id] || null`
- Все 3 места рендеринга обновлены: используют `getDrinkImage(d)` + `onerror` (скрывает если файл не найден)
- Все 30 напитков получили логичные имена файлов на русском (пары 300/400 мл — общее фото)

**Файлы добавлены пользователем (16 шт):**
`Эспрессо.jpg`, `Американо.jpg`, `Капучино.jpg`, `Латте.jpg`, `Флэт уайт.jpg`,
`Моккачино.jpg`, `Раф ванильный.jpg`, `Раф апельсиновый.jpg`, `Какао.jpg`,
`Ванильное облако.jpg`, `Зелёный чай.jpg`, `Чай.jpg`, `Матча.jpg`,
`Айс-латте.jpg`, `Бамбл.jpg`, `Эспрессо -тоник.jpg` (с пробелом — исправлено в маппинге)

**Без фото:** Айс-какао, Фильтр-кофе, Пуровер — скрываются автоматически через `onerror`

**Коммиты:** `aea265b`, `d6e6633`

---

#### 2. Логотип в шапке

- Убрана иконка кофе и текст «MBS* Coffee Menu»
- **Десктоп:** `moscow barista school logo.svg` (высота 36px)
- **Мобильный** (≤768px): `MBS logo.svg` (высота 28px) — CSS `content:` override в `@media`
- На экране онбординга: логотип `moscow barista school logo.svg` вместо иконки+текста

**Коммиты:** `7176a3c`, `92099b3`

---

#### 3. Подвал (footer)

**Структура:**
- Десктоп: 3 колонки — Контакты | Логотип + соцсети | Адрес
- Мобильный: тёмная полоса — логотип MBS + 4 иконки (телефон, Instagram, Telegram, карта) + адрес

**Контакты:**
- Телефон: +7 995 999-28-36
- Сайт: baristaschool.ru
- Instagram: instagram.com/barista_school
- Telegram: t.me/moscowbaristaschool
- Адрес: м. Бауманская, Нижняя Красносельская 35 стр. 50
- Яндекс.Карты: yandex.ru/maps/org/206204133172

**Проблемы и исправления по итерациям:**
1. Иконки не отображались → заменены `<i data-lucide>` на inline SVG (footer был после `<script>`)
2. Footer перенесён ДО `<script src="app.js">` — иконки начали работать
3. Мобильный footer перекрывался таббаром → `padding-bottom: calc(72px + env(safe-area-inset-bottom))`
4. Цвет подвала: тёмный `#1e2820` → `var(--navy)` (как шапка) — согласованность
5. Зелёные тексты не читались на зелёном фоне → все тексты/иконки переведены в белый
6. Тёмная тема: подвал оставался зелёным (`--navy` в dark = `#89d185`) → `body.dark .footer-desktop/mobile { background: #252526 !important }`
7. Иконка адреса убрана (была «съехавшая»)
8. Год: 2025 → 2026

**Финальное состояние:**
- Светлая тема: фон `var(--navy)` (#417033) = шапка, тексты белые
- Тёмная тема: фон `#252526` = как все блоки

**Коммиты:** `140fe45`, `3ff13d5`, `fffa035`, `a9b149a`, `f024ab9`, `5783796`, `723d457`

---

#### 4. Мобильное нижнее меню (таббар)

**До:** простая плашка `var(--navy)` с тонкой белой линией на активной вкладке

**После (редизайн):**
- Стеклянный фон: `rgba(55, 90, 43, 0.92)` + `backdrop-filter: blur(16px)`
- Тонкая верхняя граница: `rgba(255,255,255,.08)`
- Активная вкладка: pill-подсветка `rgba(255,255,255,.14)` + `border-radius: 12px`
- Активная иконка: поднимается `translateY(-1px)` + мягкое свечение `drop-shadow`
- Неактивные: `rgba(255,255,255,.5)`, плавная анимация `.2s`
- Gap между кнопками, `border-radius` у каждой кнопки
- Тёмная тема: `rgba(30,30,30,.92)` с blur

**Коммит:** `b4e3685`

---

#### Итоговые коммиты сессии 20

| Коммит | Описание |
|--------|----------|
| `aea265b` | feat: add images/ folder + DRINK_IMAGES mapping |
| `d6e6633` | feat: add drink images (16 photos) + fix espresso-tonic filename |
| `7176a3c` | feat: replace header text with MBS logo SVG |
| `92099b3` | feat: use MBS logo.svg in mobile header |
| `140fe45` | feat: add footer — desktop card + mobile dark bar |
| `3ff13d5` | fix: footer icons via inline SVG, dark desktop, mobile above tabbar |
| `fffa035` | fix: footer year 2026, restore dark desktop CSS, fix addr icon |
| `a9b149a` | fix: footer matches header color, remove addr icon |
| `f024ab9` | fix: footer all text/icons white for readability on green bg |
| `5783796` | fix: footer dark theme uses dark gray #252526 |
| `723d457` | fix: footer dark theme force gray bg (!important) |
| `b4e3685` | feat: redesign mobile tabbar — glass blur, pill active state |



---

### Сессия 21 (9 мая 2026) — мобильный UX: клик по строке, создание ингредиента, мобильная вёрстка строк

---

#### 1. Клик по строке для редактирования (без кнопки карандаша)

**Коммит:** `3ab8cf2`

- **Полуфабрикаты** (`<tr>`): карандаш-кнопка убрана — `<tr>` уже имел `onclick="openEditSemi(…)"`
- **Сырьё** (`.mat-row-custom`): добавлен `onclick="openEditMat('${key}')"` на `<tr>`, `event.stopPropagation()` на кнопках цены/удаления/инпуте цены
- CSS: `.mat-row-custom:hover td { background: var(--light); }` + `cursor: pointer`

---

#### 2. Создание ингредиента прямо из дропдауна рецептуры напитка

**Коммит:** `2e8c324`

- `matOptions(selected)`: добавлена опция `＋ Создать ингредиент...` (value=`__create_mat__`) в начале списка
- `_onIngMatChange(selectEl)`: перехватывает `__create_mat__`, сохраняет `selectEl` в глобальный `_pendingMatSelectEl`, открывает `modal-mat`
- `saveMat()`: после сохранения — если `_pendingMatSelectEl` установлен, обновляет тот select новым ингредиентом и сбрасывает переменную
- `cancelMat()`: сбрасывает `_pendingMatSelectEl`, закрывает `modal-mat`
- CSS: `#modal-mat.open { z-index: 1100 }` — стакируется поверх `modal-drink` (z-index 1000)
- `index.html`: кнопки закрытия `modal-mat` заменены с `closeModal('modal-mat')` на `cancelMat()`

---

#### 3. Placeholder и пунктирная граница для пустых строк ингредиентов

**Коммит:** `eb1bf3c`

- `matOptions(selected)`: добавлена `<option disabled>— Выберите ингредиент —</option>` (selected когда нет выбранного)
- `addIngRow()`: новая строка получает класс `ing-select-empty` при отсутствии выбора
- CSS: `.ing-select-empty { color: var(--muted); border-style: dashed; }`
- `_onIngMatChange()`: убирает класс `ing-select-empty` после выбора, сохраняет `dataset.prev`

---

#### 4. Фикс скролла/позиции на iOS Safari при открытии модальных окон

**Коммит:** `a7a924c`

**Проблема:** `body { position: fixed }` сбрасывал позицию прокрутки — после закрытия модала страница прыгала в начало.

**Решение:**
- `openModal()`: заменено `body.style.position = 'fixed'` на `document.documentElement.classList.add('modal-open')`; сохраняется `scrollY` в `documentElement.dataset.scrollY`
- `closeModal()`: читает `documentElement.dataset.scrollY`, восстанавливает `window.scrollTo`, убирает класс `modal-open`
- CSS: `html.modal-open { overflow: hidden; }` (не body)

---

#### 5. КБЖУ перенесён выше блока поставщика в modal-mat

**Коммит:** `767b198`

- В `index.html` (`modal-mat`): `<details>` с КБЖУ теперь стоит **перед** блоком поставщика
- Блок «Нет нужного? Завести нового поставщика» раскрывается вниз к подвалу модала

---

#### 6. Модальные окна — flex-layout на мобильном: скролл внутри, футер прижат к низу

**Коммит:** `ebdb766`

**HTML (`index.html`):**
- Контент `modal-drink`, `modal-mat`, `modal-semi`, `modal-drink-view` обёрнут в `<div class="modal-body">`

**CSS (мобильный, ≤768px):**
- `.modal { display: flex; flex-direction: column; overflow: hidden; }`
- `.modal-title { flex-shrink: 0; border-bottom: 1px solid var(--border); }`
- `.modal-body { flex: 1; overflow-y: auto; padding: 16px; }`
- `.modal-footer { flex-shrink: 0; border-top: 1px solid var(--border); }`
- Убран `position: sticky` с `.modal-footer` на мобильном

**CSS (десктоп):**
- `.modal-body { display: contents; }` — прозрачная обёртка, дети «выпадают» в поток модала

---

#### 7. Строка ингредиента на мобильном — CSS Grid, метки через `::before`

**Финальный коммит:** `32ee8db`

**Структура строки (`addIngRow` в app.js):**

```
<select class="modal-select ing-mat-select …">…</select>
<button class="modal-ing-del">🗑</button>
<div class="ing-inp-wrap" data-label="Кол-во"><input …></div>
<div class="ing-inp-wrap" data-label="Потери"><input …></div>
<span class="ing-cost-hint"></span>
```

**Десктоп CSS:** `.ing-inp-wrap { display: contents; }` — дети в 5-колоночный grid родителя

**Мобильный CSS (≤768px):**
- `modal-ing-row` = CSS Grid `1fr 44px`, 3 ряда:
  - Ряд 1: select (col 1) + trash (col 2)
  - Ряд 2: ing-inp-wrap:nth-of-type(1) (col 1) + ing-inp-wrap:nth-of-type(2) (col 2)
  - Ряд 3: ing-cost-hint (col 1/-1)
- `.ing-inp-wrap::before { content: attr(data-label); }` — метки «Кол-во» / «Потери»

**Вспомогательное:**
- `_onIngMatChange()`: ищет поле кол-ва через `row.querySelector('.ing-inp-wrap input')`
- Промежуточные итерации (`4214a31`, `ab51a80`, `bdae501`, `a11a93c`) — попытки с обёртками div; финально — `display: contents` на десктопе и CSS Grid на мобильном без лишних обёрток

---

#### Итоговые коммиты сессии 21

| Коммит | Описание |
|--------|----------|
| `3ab8cf2` | ux: click row to edit ingredient/semi, remove pencil buttons |
| `2e8c324` | feat: create ingredient directly from recipe card dropdown |
| `eb1bf3c` | ux: ingredient select placeholder + dashed border for empty rows |
| `a7a924c` | fix: iOS Safari touch coords — html overflow:hidden instead of body fixed |
| `767b198` | ux: move KBZHU block above supplier in mat modal |
| `ebdb766` | fix: modal flex layout on mobile — scrollable body, footer pinned |
| `4214a31` | ux: add qty/loss labels in ingredient rows on mobile |
| `ab51a80` | fix: ingredient row mobile layout — trash inline with inputs |
| `bdae501` | fix: ing row mobile — select+trash on top, labeled qty/loss below |
| `a11a93c` | fix: ing row full width on mobile |
| `32ee8db` | fix: ing row mobile — CSS grid, no wrapper divs, labels via ::before |

---

### Сессия 22 (9 мая 2026) — фикс десктопной вёрстки строки ингредиента

**Коммит:** `e1ffd59`

**Проблема:** после мобильных правок сессии 21 десктопная строка ингредиента ломалась — элементы переносились на вторую строку вместо одной горизонтальной линии.

**Причина:** мобильный `@media` устанавливал явный `grid-row: 2` на `nth-child(3)` и `nth-child(4)`. Десктопные правила не имели `grid-row: 1` — grid auto-placement сохранял row-2 из медиа-каскада.

**Структура строки (напоминание):**
```
child 1: <select class="modal-select">    → grid-column: 1
child 2: <button class="modal-ing-del">  → grid-column: 5
child 3: <div class="ing-inp-wrap" data-label="Кол-во"> → grid-column: 2
child 4: <div class="ing-inp-wrap" data-label="Потери"> → grid-column: 3
child 5: <span class="ing-cost-hint">    → grid-column: 4
```

**Десктопный grid:** `grid-template-columns: 1fr 90px 90px 52px 32px`

**Финальный CSS десктопа (вне media-query):**
```css
.modal-ing-row {
  display: grid;
  grid-template-columns: 1fr 90px 90px 52px 32px;
  gap: 8px;
  align-items: center;
  margin-bottom: 6px;
}
.ing-inp-wrap { display: block; }
.modal-ing-row > :nth-child(1) { grid-column: 1; grid-row: 1; }
.modal-ing-row > :nth-child(2) { grid-column: 5; grid-row: 1; }
.modal-ing-row > :nth-child(3) { grid-column: 2; grid-row: 1; }
.modal-ing-row > :nth-child(4) { grid-column: 3; grid-row: 1; }
.modal-ing-row > :nth-child(5) { grid-column: 4; grid-row: 1; }
.modal-ing-row .modal-inp, .modal-ing-row .modal-select { width: 100%; margin: 0; }
.modal-ing-row .ing-inp-wrap .modal-inp { width: 100%; margin: 0; }
```

**Ключевые правила:**
- `grid-row: 1` явно на всех 5 дочерних элементах — нейтрализует row-2 из мобильного каскада
- Переход с `nth-of-type` на `nth-child` — надёжнее для смешанных типов элементов (div/span/button/select)
- `display: block` на `.ing-inp-wrap` (не `display: contents`) — избегает ненадёжного поведения contents в некоторых браузерах

**Мобильный CSS (НЕ изменялся):**
```css
@media (max-width: 768px) {
  .modal-ing-row { grid-template-columns: 1fr 44px; grid-template-rows: auto auto auto; }
  .modal-ing-row > :nth-child(3) { grid-column: 1; grid-row: 2; }
  .modal-ing-row > :nth-child(4) { grid-column: 2; grid-row: 2; }
  .modal-ing-row .ing-inp-wrap { display: flex; flex-direction: column; gap: 3px; }
  .modal-ing-row .ing-inp-wrap::before { content: attr(data-label); … }
  .modal-ing-row .ing-cost-hint { grid-column: 1/-1; grid-row: 3; }
}
```

**Итог:** десктоп — одна строка: Ингредиент | Кол-во | Потери | Цена | 🗑. Мобильный — 3 ряда с метками. Оба работают корректно.


---

### Сессия 23 (9 мая 2026) — защита модалов от случайного закрытия

**Цель:** предупреждать пользователя перед закрытием модала, если в форме были изменения.

#### Система «dirty tracking»

```js
const _EDITABLE_MODALS = new Set(['modal-drink','modal-semi','modal-mat','modal-supplier','modal-supplier-book','modal-loc']);
const _dirtyModalSet   = new Set();
```

API: `_markModalDirty(id)` / `_clearModalDirty(id)` / `_isModalDirty(id)`

Делегированные слушатели на документе — любое `input`/`change` внутри `.modal-bg` → `_markModalDirty(modal.id)`. При открытии модала (`openEditDrink`, `openEditSemi`) `_markModalDirty` **не вызывается** — dirty только от реальных действий пользователя.

#### Перехват закрытия

`closeModal(id)` — первым делом проверяет `_isModalDirty(id)`, показывает `_showUnsavedWarning(id)` и делает `return` (модал остаётся открытым). Аналогично `safeCloseModal(id)` — для кнопок «×»/«Отмена»/Escape.

Клик по backdrop: делегированный `document.addEventListener('click', ...)` вызывает `safeCloseModal(e.target.id)`.

#### Оверлей предупреждения

HTML с классами `._unsaved-box`, `._unsaved-stay`, `._unsaved-close`. Функции: `_dismissUnsavedWarning()`, `_forceCloseModal(id)` (clear + close).

Все функции сохранения/удаления вызывают `_clearModalDirty(id)` до `closeModal`.

Кнопки «×»/«Отмена» в `modal-drink`, `modal-semi`, `modal-loc`, `modal-supplier` → `safeCloseModal('...')`.

#### Коммиты

| Коммит | Описание |
|--------|---------|
| `dee65c2` | feat: warn before closing modals with unsaved changes |
| `c2d2555` | feat: custom inline unsaved warning bar |
| `3fc7c86` | fix: warning as centered overlay |
| `42be2ab` | fix: dirty check inside closeModal itself |
| `957e83e` | fix: don't mark dirty on modal open — only on actual user input |

---

### Сессия 24 (9 мая 2026) — адаптация предупреждения под тёмную тему

**Коммит:** `1dadd82`

Инлайн-стили оверлея вынесены в CSS-классы `styles.css`. Добавлены правила `body.dark`:

```css
body.dark ._unsaved-box   { background: #1e1e1e; box-shadow: 0 8px 40px rgba(0,0,0,.55); }
body.dark ._unsaved-title { color: #e8e8e8; }
body.dark ._unsaved-sub   { color: #888; }
body.dark ._unsaved-stay  { background: #2a2a2a; border-color: #444; color: #d4d4d4; }
body.dark ._unsaved-stay:hover  { background: #333; border-color: #666; }
body.dark ._unsaved-close { background: #c0392b; }
body.dark ._unsaved-close:hover { background: #a93226; }
```

Добавлены hover-эффекты для светлой темы (`._unsaved-stay:hover`, `._unsaved-close:hover`).


---

### Сессия 25 (10 мая 2026) — рефакторинг монолита app.js → ES-модули (Vite)

**Цель:** разбить монолит `public/app.js` (7286 строк) на 30 ES-модулей в `src/`, добавить сборку через Vite 5.4.

---

#### Результат

- **Удалён:** `public/app.js` (коммит `05a6bf2`)
- **Создано:** 30 файлов в `src/` (дерево см. раздел 2)
- **Сборка:** 33 модуля, ~227.57 kB, 381ms — зелёная
- **Коммиты:** 20 штук (`9bfb9be` → `b06994b`)

---

#### Паттерн выставления функций в `window`

Все функции, которые вызываются из inline-обработчиков HTML (`onclick="..."`, `oninput="..."`), должны быть глобальными. В `src/main.js` они выставляются двумя способами:

```js
// 1. Явный Object.assign для ключевых функций
Object.assign(window, { switchTab, renderTab, ... });

// 2. Массовый экспорт через _srcExports
import * as _srcExports from './ui/misc.js';
Object.entries(_srcExports).forEach(([k, v]) => { window[k] = v; });
```

**Правило:** если добавляется новая функция, вызываемая из HTML — либо добавить явно в `Object.assign`, либо убедиться, что файл попадает в `_srcExports`.

---

#### Инициализация в `main.js`

```js
// Восстанавливаем активную вкладку из localStorage
const _savedTab = localStorage.getItem('mbs_active_tab') || 'dashboard';
window.activeTab = _savedTab;   // ← ОБЯЗАТЕЛЬНО до switchTab()

loadLocIndex();
SEMI.push(...loadSemiItems());
try { renderLocSwitcherUI(); } catch(e) { console.error(e); }
switchTab(_savedTab);           // ← использует window.activeTab
initTooltips();
initKeyboardNav();
```

---

#### Исправленные runtime-баги (коммит `b06994b`)

| Баг | Причина | Исправление |
|-----|---------|------------|
| Бесконечная рекурсия `switchTab` | `src/ui/updaters.js` вызывал `window.switchTab(tab)` вместо реальной реализации | Заменён на настоящую реализацию: переключение `.active`-классов + `window.activeTab = tab` + `localStorage` |
| `window.activeTab` не устанавливался | Нигде не присваивался до `switchTab()`, `flashCells()` читал `undefined` | Добавлено `window.activeTab = _savedTab` в `main.js` до вызова `switchTab()` |
| Налог не считался в PDF-экспорте | В `src/ui/misc.js`: `typeof calcTax === 'function'` всегда `false` (`calcTax` — локальная функция рендер-модуля, не глобальная) | Заменён на инлайн-расчёт через `window.S.taxMode` напрямую в `exportFullPDF` и `exportMaterialsPDF` |

**Ключевой факт:** `calcTax` — это локальная функция внутри каждого рендер-модуля (`render/finmodel.js`), она **не** выставляется в `window`. При написании нового кода в `misc.js` использовать инлайн-расчёт налога или импортировать явно.

---

#### Архитектурные правила после рефакторинга

1. **`src/main.js`** — единственная точка входа. Импортирует все модули, выставляет `window.*`, вызывает INIT.
2. **Нет циклических импортов.** Зависимости: `data/` ← `state/` ← `utils/` ← `render/` ← `ui/`.
3. **`window.activeTab`** устанавливается в `main.js` и обновляется в `switchTab()` (`ui/updaters.js`).
4. **ExcelJS** подключён CDN-тегом в `index.html` — **не** через `import`. Доступен как глобальный `ExcelJS`.
5. **`public/app.js` удалён** — не восстанавливать. Весь код живёт в `src/`.

---

#### Коммиты сессии 25

| Коммит | Описание |
|--------|----------|
| `9bfb9be` | refactor: move generateInsights → src/ui/misc.js |
| `d8606f4` | refactor: move exportFullPDF/XLSX → src/ui/misc.js |
| `e3e68d6` | refactor: move exportSuppliersPDF/XLSX + exportMaterialsPDF/XLSX → src/ui/misc.js |
| `663dff1` | refactor: move payroll/seasonality/dropCandidates/onWhatIf → src/ui/misc.js |
| `513f813` | refactor: move buildBEPChart → src/ui/misc.js |
| `ec9a406` | refactor: replace _matDisplayUnit proxy with real impl in misc.js |
| `7351b54` | refactor: move supplier modal/list functions → src/ui/suppliers.js |
| `e813200` | refactor: move payroll functions → src/ui/payroll.js |
| `c083517` | refactor: move cost-table UI + cost editor → src/ui/cost-table.js |
| `45fb353` | refactor: move openPriceHistory/onWhatIf3/seasonal → src/ui/misc.js |
| `2d5cbed` | recipe-view.js + techcards.js: openViewDrink/mvd/techCards blocks |
| `41850bc` | modals/drink/mat/semi + ui/modals/ingredients: move 50 funcs |
| `1e894c4` | app.js: remove 46 already-migrated funcs (−1637 lines) |
| `7ca0205` | data: extract MAT/DRINKS/constants → src/data/*.js |
| `22bab6b` | state: S/Loc/DEFAULTS/resetGlobalsToBase → store.js |
| `0ce7caa` | fix: export _wif/EMP_TYPE_LABELS to window; clean Object.assign |
| `5ce7bd8` | refactor: INIT/tooltip/kb-nav → src/main.js |
| `d3742aa` | refactor: UI state → src/state/ui-state.js |
| `05a6bf2` | refactor: event wiring → src/ui/events.js; **delete public/app.js** |
| `b06994b` | fix: 3 runtime bugs — switchTab recursion, window.activeTab, calcTax in PDF export |


---

### Сессия 26 (10 мая 2026) — три хотфикса: ФОТ, ABC-легенда, фокус инпутов

#### 1. Настройки налогообложения не пересчитывали ФОТ (коммит `94d13ce`)

**Проблема:** изменение МРОТ, НДФЛ% и страховых взносов в блоке «Настройки налогообложения» не давало эффекта — строки позиций ФОТ и итоговая сумма не обновлялись.

**Причина:** `onPayrollSetting()` в `src/ui/misc.js` вызывала `window._refreshPayrollRow(p.id)` и `window._refreshPayrollSummary()`, однако эти функции не были выставлены в `window` — они существовали только как локальные экспорты `src/ui/payroll.js`.

**Исправление:** в `src/main.js` добавлены импорт и выставление в `window`:
```js
import { ..., _refreshPayrollRow, _refreshPayrollSummary } from './ui/payroll.js';
window._refreshPayrollRow    = _refreshPayrollRow;
window._refreshPayrollSummary = _refreshPayrollSummary;
```

---

#### 2. ABC-легенда в одну строку на мобильном (коммит `01e045a`)

**Проблема:** на узком экране три пункта легенды ABC (A / B / C) отображались в одну горизонтальную строку — текст обрезался.

**Исправление** в `src/render/dashboard.js`:
- Заголовок «Легенда ABC» — `display:block` (не inline)
- Каждый пункт вынесен в отдельный `<div>` вместо `<span>`
- Обёртка легенды: `flex-direction:column; gap:4px`

---

#### 3. Фокус слетал при вводе в поля МРОТ/НДФЛ/взносы (коммит `fb0cbb7`)

**Проблема:** при каждом нажатии клавиши в инпутах МРОТ, НДФЛ%, страховых взносов — фокус уходил с поля, невозможно было ввести многозначное число.

**Причина:** инпуты имели `oninput="onPayrollSetting(...)"` → внутри вызывался `window.renderFinModel()` (полный ре-рендер финмодели) → текущий `<input>` уничтожался и пересоздавался → фокус терялся.

**Исправление** в `src/render/finmodel.js` — `oninput` → `onchange` на трёх инпутах:
```html
<!-- БЫЛО -->
<input ... oninput="onPayrollSetting('mrot',this.value)">
<input ... oninput="onPayrollSetting('ndfl',this.value)">
<input ... oninput="onPayrollSetting('ins',this.value)">

<!-- СТАЛО -->
<input ... onchange="onPayrollSetting('mrot',this.value)">
<input ... onchange="onPayrollSetting('ndfl',this.value)">
<input ... onchange="onPayrollSetting('ins',this.value)">
```

**Результат:** ре-рендер происходит только при уходе из поля (Tab / Enter / клик в другое место). Ввод многозначных чисел работает без потери фокуса.

**Правило для будущего:**
> ⚠️ Если `oninput` вызывает функцию с полным ре-рендером DOM — заменить на `onchange`. Иначе фокус теряется при каждом нажатии клавиши.

---

#### Коммиты сессии 26

| Коммит | Описание |
|--------|----------|
| `94d13ce` | fix: export _refreshPayrollRow/_refreshPayrollSummary to window |
| `01e045a` | fix: ABC legend — each item on new line (mobile) |
| `fb0cbb7` | fix: oninput→onchange in payroll settings inputs (focus loss) |
