# CONTEXT — MBS* Coffee Menu

> CFO-инструментарий для владельца кофейни. Один HTML-файл без зависимостей и сборки.
> Последнее обновление: 8 мая 2026 (сессия 14)

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
├── index.html      # Разметка + подключение файлов
├── styles.css      # Все стили (CSS Variables, Grid, Flexbox, Dark theme, Print)
├── app.js          # Вся логика (данные, расчёты, рендер, стейт)
├── build.py        # Одноразовый скрипт: разбил монолитный index.html на файлы
└── CONTEXT.md      # Этот файл
```

Нет npm, нет сборки, нет API. Открывается локально через `open index.html`.

---

## 3. Стек

| Слой | Технология |
|------|-----------|
| Разметка | HTML5 |
| Стили | CSS (CSS Variables, CSS Grid, Flexbox, `@media print`) — `styles.css` |
| Логика | Vanilla JS — `app.js` |
| Шрифт | Mulish (Google Fonts, CDN) |
| Иконки | Lucide (CDN, UMD) |
| Зависимости runtime | **нет** |

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
- Редактируемые порции/день (oninput + дебаунс 400мс)
- Выручка и прибыль за день и месяц (авторасчёт)
- Мини-бар доли в выручке (%)
- ИТОГО-строка в tfoot
- 6 KPI-плашек по портфелю (взвешенный FC%, средний чек, ср. прибыль/чашка, ...)
- Поиск + сортировка по 7 столбцам
- 4 кнопки пресетов (Обычный / Тихий / Летний / Зимний) — активный подсвечивается зелёным (`S.activePreset`)
- Кнопка «⬇ CSV»

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
