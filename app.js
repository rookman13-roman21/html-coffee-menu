// ════════════════════════════════════════════════════════════════════
//  DATA
// ════════════════════════════════════════════════════════════════════

const MAT = {
  coffee:        { name: 'Зерно эспрессо',          unit: '1 кг',      price: 2000, size: 1000 },
  filter_coffee: { name: 'Зерно под фильтр',         unit: '1 кг',      price: 4000, size: 1000 },
  milk:      { name: 'Молоко',                  unit: '1 л',       price: 130,  size: 1000 },
  cream:     { name: 'Сливки 10%',              unit: '1 л',       price: 199,  size: 1000 },
  cocoa:     { name: 'Какао порошок',           unit: '1 кг',      price: 2500, size: 1000 },
  matcha:    { name: 'Матча',                   unit: '1 кг',      price: 8000, size: 1000 },
  sugar:     { name: 'Сахар песок',             unit: '1 кг',      price: 56,   size: 1000 },
  sugar_van: { name: 'Сахар ванильный',         unit: '1 кг',      price: 140,  size: 1000 },
  sugar_org: { name: 'Сахар апельсиновый',      unit: '1 кг',      price: 90,   size: 1000 },
  cup250:    { name: 'Стакан 250 мл + крышка',  unit: '1 шт',      price: 9,    size: 1 },
  cup350:    { name: 'Стакан 350 мл + крышка',  unit: '1 шт',      price: 11,   size: 1 },
  cup450:    { name: 'Стакан 450 мл + крышка',  unit: '1 шт',      price: 13,   size: 1 },
  cup_p300:  { name: 'Стакан пластик 300 мл',   unit: '1 шт',      price: 11,   size: 1 },
  cup_p500:  { name: 'Стакан пластик 500 мл',   unit: '1 шт',      price: 13,   size: 1 },
  orange:    { name: 'Апельсины',               unit: '1 кг',      price: 150,  size: 1000 },
  tea:       { name: 'Чай в ассортименте',      unit: '1 кг',      price: 2300, size: 1000 },
  tonic:     { name: 'Рокет тоник 250 мл',      unit: '1 бут.',    price: 120,  size: 250 },
  lime:      { name: 'Лайм',                    unit: '1 кг',      price: 290,  size: 1000 },
};

// recipe: [ { mat, amt, loss? } ]
//   mat  — ключ в MAT
//   amt  — количество (г / мл / шт)
//   loss — потери при обработке (0..1), для фреша
const DRINKS = [
  // ГОРЯЧИЕ КОФЕЙНЫЕ
  { id:0,  group:'hot',  name:'Эспрессо',              vol:50,
    recipe:[{mat:'coffee',amt:19},{mat:'cup250',amt:1}], price:190 },
  { id:1,  group:'hot',  name:'Американо 200',          vol:200,
    recipe:[{mat:'coffee',amt:19},{mat:'cup250',amt:1}], price:190 },
  { id:2,  group:'hot',  name:'Американо 400',          vol:400,
    recipe:[{mat:'coffee',amt:38},{mat:'cup450',amt:1}], price:360 },
  { id:3,  group:'hot',  name:'Капучино 200',           vol:200,
    recipe:[{mat:'coffee',amt:19},{mat:'milk',amt:170},{mat:'cup250',amt:1}], price:280 },
  { id:4,  group:'hot',  name:'Капучино 300',           vol:300,
    recipe:[{mat:'coffee',amt:19},{mat:'milk',amt:250},{mat:'cup350',amt:1}], price:330 },
  { id:5,  group:'hot',  name:'Латте 300',              vol:300,
    recipe:[{mat:'coffee',amt:19},{mat:'milk',amt:250},{mat:'cup350',amt:1}], price:330 },
  { id:6,  group:'hot',  name:'Латте 400',              vol:400,
    recipe:[{mat:'coffee',amt:19},{mat:'milk',amt:350},{mat:'cup450',amt:1}], price:390 },
  { id:7,  group:'hot',  name:'Флэт уайт 200',          vol:200,
    recipe:[{mat:'coffee',amt:19},{mat:'milk',amt:170},{mat:'cup250',amt:1}], price:300 },
  { id:8,  group:'hot',  name:'Моккачино 300',          vol:300,
    recipe:[{mat:'coffee',amt:19},{mat:'milk',amt:150},{mat:'cocoa',amt:15},{mat:'cup350',amt:1}], price:450 },
  { id:9,  group:'hot',  name:'Моккачино 400',          vol:400,
    recipe:[{mat:'coffee',amt:19},{mat:'milk',amt:220},{mat:'cocoa',amt:20},{mat:'cup450',amt:1}], price:500 },
  { id:10, group:'hot',  name:'Раф ванильный 300',      vol:300,
    recipe:[{mat:'coffee',amt:19},{mat:'cream',amt:250},{mat:'sugar_van',amt:10},{mat:'cup350',amt:1}], price:450 },
  { id:11, group:'hot',  name:'Раф ванильный 400',      vol:400,
    recipe:[{mat:'coffee',amt:19},{mat:'cream',amt:350},{mat:'sugar_van',amt:10},{mat:'cup450',amt:1}], price:450 },
  { id:12, group:'hot',  name:'Раф апельсиновый 300',   vol:300,
    recipe:[{mat:'coffee',amt:19},{mat:'cream',amt:250},{mat:'sugar_org',amt:10},{mat:'cup350',amt:1}], price:380 },
  { id:13, group:'hot',  name:'Раф апельсиновый 400',   vol:400,
    recipe:[{mat:'coffee',amt:19},{mat:'cream',amt:350},{mat:'sugar_org',amt:10},{mat:'cup450',amt:1}], price:400 },
  { id:14, group:'hot',  name:'Какао 300',              vol:300,
    recipe:[{mat:'milk',amt:200},{mat:'cocoa',amt:13},{mat:'sugar',amt:10},{mat:'cup350',amt:1}], price:350 },
  { id:15, group:'hot',  name:'Какао 400',              vol:400,
    recipe:[{mat:'milk',amt:300},{mat:'cocoa',amt:18},{mat:'sugar',amt:12},{mat:'cup450',amt:1}], price:390 },
  { id:16, group:'hot',  name:'Ванильное облако 300',   vol:300,
    recipe:[{mat:'coffee',amt:19},{mat:'milk',amt:100},{mat:'sugar_van',amt:5},{mat:'cup350',amt:1}], price:330 },
  // ЧАЙ И МАТЧА
  { id:17, group:'tea',  name:'Чай в ассортименте 400', vol:400,
    recipe:[{mat:'tea',amt:13},{mat:'cup450',amt:1}], price:390 },
  { id:18, group:'tea',  name:'Матча 300',              vol:300,
    recipe:[{mat:'matcha',amt:5},{mat:'milk',amt:70},{mat:'cup350',amt:1}], price:330 },
  { id:19, group:'tea',  name:'Матча 400',              vol:400,
    recipe:[{mat:'matcha',amt:7},{mat:'milk',amt:107},{mat:'cup450',amt:1}], price:390 },
  // ХОЛОДНЫЕ
  { id:20, group:'cold', name:'Айс-латте 300',          vol:300,
    recipe:[{mat:'coffee',amt:19},{mat:'milk',amt:200},{mat:'cup_p300',amt:1}], price:330 },
  { id:21, group:'cold', name:'Айс-латте 500',          vol:500,
    recipe:[{mat:'coffee',amt:19},{mat:'milk',amt:300},{mat:'cup_p500',amt:1}], price:420 },
  { id:22, group:'cold', name:'Айс-какао 300',          vol:300,
    recipe:[{mat:'milk',amt:200},{mat:'cocoa',amt:10},{mat:'cup_p300',amt:1}], price:400 },
  { id:23, group:'cold', name:'Айс-какао 500',          vol:500,
    recipe:[{mat:'milk',amt:300},{mat:'cocoa',amt:15},{mat:'cup_p500',amt:1}], price:400 },
  { id:24, group:'cold', name:'Бамбл 300',              vol:300,
    recipe:[{mat:'coffee',amt:19},{mat:'orange',amt:580,loss:0.5},{mat:'cup_p300',amt:1}], price:400 },
  { id:25, group:'cold', name:'Бамбл 500',              vol:500,
    recipe:[{mat:'coffee',amt:19},{mat:'orange',amt:490,loss:0.5},{mat:'cup_p500',amt:1}], price:420 },
  { id:26, group:'cold', name:'Эспрессо-тоник 300',     vol:300,
    recipe:[{mat:'coffee',amt:19},{mat:'tonic',amt:250},{mat:'lime',amt:14},{mat:'cup_p300',amt:1}], price:350 },
  // ФИЛЬТР-КОФЕ
  { id:27, group:'filter', name:'Фильтр-кофе 200', vol:200,
    recipe:[{mat:'filter_coffee',amt:14},{mat:'cup250',amt:1}], price:250 },
  { id:28, group:'filter', name:'Фильтр-кофе 300', vol:300,
    recipe:[{mat:'filter_coffee',amt:20},{mat:'cup350',amt:1}], price:320 },
  { id:29, group:'filter', name:'Пуровер 270',      vol:270,
    recipe:[{mat:'filter_coffee',amt:18},{mat:'cup350',amt:1}], price:350 },
];

// ─── Пресеты плана продаж ────────────────────────────────────────
// Ключи = id напитка, значения = порций/день
const SALES_PRESETS = {
  normal: { label:'☕ Обычный день', portions:{0:5,1:10,2:15,3:20,4:15,5:15,6:10,7:8,8:5,9:3,10:8,11:5,12:5,13:3,14:5,15:3,16:3,17:8,18:8,19:5,20:10,21:8,22:5,23:3,24:5,25:3,26:5,27:3,28:2,29:2} },
  quiet:  { label:'🌿 Тихий день',   portions:{0:3,1:5,2:8,3:10,4:8,5:8,6:5,7:4,8:3,9:2,10:4,11:3,12:3,13:2,14:3,15:2,16:2,17:5,18:4,19:3,20:5,21:4,22:3,23:2,24:3,25:2,26:3,27:1,28:1,29:1} },
  summer: { label:'🔥 Летний сезон', portions:{0:4,1:8,2:12,3:15,4:12,5:10,6:8,7:6,8:4,9:2,10:5,11:3,12:4,13:2,14:2,15:1,16:2,17:5,18:10,19:7,20:25,21:20,22:12,23:8,24:15,25:10,26:15,27:4,28:3,29:3} },
  winter: { label:'❄️ Зимний спад',  portions:{0:4,1:8,2:12,3:18,4:14,5:14,6:9,7:7,8:5,9:3,10:8,11:5,12:4,13:3,14:7,15:5,16:3,17:12,18:6,19:4,20:2,21:2,22:1,23:0,24:1,25:0,26:1,27:2,28:2,29:1} },
};

const FIXED_COSTS_DEF = [
  { name:'Аренда помещения',          value:80000 },
  { name:'Коммунальные платежи',      value:15000 },
  { name:'Амортизация оборудования',  value:20000 },
  { name:'Маркетинг и реклама',       value:15000 },
  { name:'Расходники (не сырьё)',     value:10000 },
  { name:'Прочие постоянные',         value:10000 },
];

const GROUP_LABEL = { hot:'<i data-lucide="coffee" class="icon"></i> Горячие кофейные', tea:'<i data-lucide="leaf" class="icon"></i> Чай и матча', cold:'<i data-lucide="snowflake" class="icon"></i> Холодные напитки', filter:'<i data-lucide="filter" class="icon"></i> Фильтр-кофе' };

let nextDrinkId = 27; // auto-increment id for new drinks
let nextMatKey  = 1;  // suffix for custom mat keys

// Убедимся что id не пересекаются с базовыми
DRINKS.forEach(d => { if (d.id >= nextDrinkId) nextDrinkId = d.id + 1; });

// Снимок исходных базовых напитков для функции «Сбросить изменения»
const DRINKS_ORIG = DRINKS.map(d => ({...d, recipe: d.recipe.map(r=>({...r}))}));
// Снимок базового сырья (для сброса локации)
const MAT_ORIG = JSON.parse(JSON.stringify(MAT));
const BASE_DRINK_IDS = new Set(DRINKS_ORIG.map(d => d.id));
const BASE_MAT_KEYS  = new Set(Object.keys(MAT_ORIG));

// ═══════════════════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════════════════
const DEFAULTS = {
  prices:     Object.fromEntries(Object.entries(MAT).map(([k,v])=>[k,v.price])),
  salePrices: Object.fromEntries(DRINKS.map(d=>[d.id, d.price])),
  portions:   Object.fromEntries(DRINKS.map(d=>[d.id, 10])),
};

const S = {
  prices:     {...DEFAULTS.prices},
  salePrices: {...DEFAULTS.salePrices},
  portions:   {...DEFAULTS.portions},
  days:       30,
  targetFC:   0.25,
  fixedCosts: FIXED_COSTS_DEF.map(c=>({...c})),
  taxMode:    'none',
  investment: 0,
  payroll:    { rate: 250, hours: 12, shifts: 30, count: 2 }, // legacy
  payrollPositions: [
    { id:1, name:'Управляющий',   rate:400, hours:12, shifts:22, count:1, empType:'white' },
    { id:2, name:'Шеф-бариста', rate:350, hours:10, shifts:22, count:1, empType:'grey'  },
    { id:3, name:'Бариста',       rate:250, hours:10, shifts:22, count:2, empType:'black' },
  ],
  payrollSettings: { mrot: 22440, ndfl: 13, ins: 30 },
  payrollSettingsOpen: false,
  seasonality: [1,1,1,1,1,1,1,1,1,1,1,1], // Янв-Дек: множитель выручки/объёма
  seasonalityOpen: false,
  suppliers: {
    coffee:        { name: 'Rockets.coffee',  phone: '+7 925 386-74-20', note: '', site: 'https://b2b.rockets.coffee/' },
    filter_coffee: { name: 'Rockets.coffee',  phone: '+7 925 386-74-20', note: '', site: 'https://b2b.rockets.coffee/' },
    tonic:         { name: 'Rocket Tonic',    phone: '+7 800 201-79-69', note: '', site: 'https://rocket-tonic.com/' },
    cocoa:         { name: 'Unicava',         phone: '+7 922 027-11-17', note: '', site: 'https://www.cacava-opt.ru/' },
    milk:          { name: 'Петмол',          phone: '+7 999 233-30-04', note: '', site: 'https://mypetmol.ru/' },
    cream:         { name: 'Петмол',          phone: '+7 999 233-30-04', note: '', site: 'https://mypetmol.ru/' },
  },
  supplierBook: [
    { id:1, name: 'Rockets.coffee', phone: '+7 925 386-74-20', note: 'Зерно эспрессо и фильтр-кофе', site: 'https://b2b.rockets.coffee/' },
    { id:2, name: 'Tasty coffee',   phone: '+7 800 333-49-80', note: 'Зерно эспрессо и фильтр-кофе', site: 'https://shop.tastycoffee.ru/' },
    { id:3, name: 'Rocket Tonic',   phone: '+7 800 201-79-69', note: 'Напитки (тоник)',               site: 'https://rocket-tonic.com/' },
    { id:4, name: 'Unicava',        phone: '+7 922 027-11-17', note: 'Какао',                         site: 'https://www.cacava-opt.ru/' },
    { id:5, name: 'Петмол',         phone: '+7 999 233-30-04', note: 'Молоко и сливки',               site: 'https://mypetmol.ru/' },
  ], // [ { id, name, phone, note, site } ] — справочник без привязки
  priceLog:      [], // [{ matKey, oldPrice, newPrice, date }]
};

let activeTab = 'dashboard';
let searchQuery = '';
let _renderTimer = null;
const dirty = { dashboard:true, cost:true, sales:true, finmodel:true, recipes:true };

// ════════════════════════════════════════════════════════════════════
//  CALCULATIONS
// ════════════════════════════════════════════════════════════════════
function calcCost(drink) {
  return drink.recipe.reduce((sum, ing) => {
    const m = MAT[ing.mat];
    let c = (S.prices[ing.mat] / m.size) * ing.amt;
    if (ing.loss) c = c / (1 - ing.loss);
    return sum + c;
  }, 0);
}

function calcIngCost(ing) {
  const m = MAT[ing.mat];
  let c = (S.prices[ing.mat] / m.size) * ing.amt;
  if (ing.loss) c = c / (1 - ing.loss);
  return c;
}

function enrich() {
  return DRINKS.map(d => {
    const cost   = calcCost(d);
    const price  = S.salePrices[d.id];
    const profit = price - cost;
    const fc     = price > 0 ? cost / price : 0;
    const rec    = Math.ceil(cost / S.targetFC / 10) * 10;
    return { ...d, cost, price, profit, fc, rec };
  });
}

function withABC(drinks) {
  const sorted = [...drinks].sort((a,b) => b.profit - a.profit);
  const n = sorted.length;
  const nA  = Math.round(n * 0.2);
  const nAB = Math.round(n * 0.5);
  const totalProfit = sorted.reduce((s,d) => s + Math.max(d.profit, 0), 0);
  const map = {}, tipMap = {};
  sorted.forEach((d,i) => {
    const cls   = i < nA ? 'A' : i < nAB ? 'B' : 'C';
    const share = totalProfit > 0 ? (Math.max(d.profit,0) / totalProfit * 100).toFixed(1) : '0.0';
    map[d.id]   = cls;
    const rec   = cls === 'A'
      ? `Класс A — топ-20% по прибыли. Позиция #${i+1} из ${n}. Доля в марже меню: ${share}%. Рекомендация: продвигать активнее, держать в меню.`
      : cls === 'B'
      ? `Класс B — средняя зона (30% ассортимента). Позиция #${i+1} из ${n}. Доля в марже: ${share}%. Рекомендация: рабочий ассортимент, можно поднять цену.`
      : `Класс C — нижние 50% по прибыли. Позиция #${i+1} из ${n}. Доля в марже: ${share}%. Рекомендация: пересмотреть цену или снизить себестоимость.`;
    tipMap[d.id] = rec;
  });
  return drinks.map(d => ({ ...d, abc: map[d.id], abcTip: tipMap[d.id] }));
}

function avgMetrics(drinks) {
  const n = drinks.length || 1;
  const avgCost   = drinks.reduce((s,d)=>s+d.cost,   0) / n;
  const avgPrice  = drinks.reduce((s,d)=>s+d.price,  0) / n;
  const avgProfit = drinks.reduce((s,d)=>s+d.profit, 0) / n;
  const avgFC     = avgCost / avgPrice;
  return { avgCost, avgPrice, avgProfit, avgFC };
}

// Weighted average by actual portions from sales plan
function weightedMetrics(drinks) {
  const totalPorts = Object.values(S.portions).reduce((s,v)=>s+v, 0);
  if (totalPorts === 0) return avgMetrics(drinks);
  let wCost = 0, wPrice = 0, wProfit = 0;
  drinks.forEach(d => {
    const p = S.portions[d.id] || 0;
    wCost   += d.cost   * p;
    wPrice  += d.price  * p;
    wProfit += d.profit * p;
  });
  const avgCost   = wCost   / totalPorts;
  const avgPrice  = wPrice  / totalPorts;
  const avgProfit = wProfit / totalPorts;
  const avgFC     = avgCost / avgPrice;
  return { avgCost, avgPrice, avgProfit, avgFC };
}

// Total sales metrics for current plan
function salesMetrics(drinks) {
  const totalPort = Object.values(S.portions).reduce((s,v)=>s+v, 0);
  const totRevDay = drinks.reduce((s,d)=>s+d.price*S.portions[d.id], 0);
  const totPrfDay = drinks.reduce((s,d)=>s+d.profit*S.portions[d.id], 0);
  return { totalPort, totRevDay, totPrfDay,
           totRevMon: totRevDay * S.days,
           totPrfMon: totPrfDay * S.days };
}

function bepCalc(drinks) {
  const fixedFromCosts = S.fixedCosts.reduce((s,c)=>s+c.value, 0);
  // Автоматически добавляем ФОТ если его нет в списке расходов
  const fotInFixed = S.fixedCosts.some(c => /фот|зарплат|зп|оплата.?труда/i.test(c.name));
  const payroll = fotInFixed ? 0 : (typeof payrollTotal === 'function' ? payrollTotal() : 0);
  const totalFixed = fixedFromCosts + payroll;
  const { avgProfit, avgPrice } = weightedMetrics(drinks);
  const cupsMonth = avgProfit > 0 ? Math.ceil(totalFixed / avgProfit) : 0;
  const cupsDay   = Math.ceil(cupsMonth / 30);
  return { totalFixed, fixedFromCosts, payroll, cupsMonth, cupsDay, revBEP: cupsMonth * avgPrice };
}

// ════════════════════════════════════════════════════════════════════
//  FORMAT HELPERS
// ════════════════════════════════════════════════════════════════════
const rub = v => Math.round(v).toLocaleString('ru') + '\u00a0₽';
const pct = v => (v * 100).toFixed(1) + '%';
const int = v => Math.round(v).toLocaleString('ru');

function fcCls(fc) { return fc <= 0.25 ? 'good' : fc <= 0.30 ? 'ok' : 'bad'; }
function riskBadge(fc) {
  const c = fcCls(fc);
  const label = c === 'good' ? '🟢 Отлично' : c === 'ok' ? '🟡 Норма' : '🔴 Риск';
  const cls   = c === 'good' ? 'risk-good' : c === 'ok' ? 'risk-ok' : 'risk-bad';
  return `<span class="risk ${cls}">${label}</span>`;
}
function abcBadge(abc, tip='') {
  const tipAttr = tip ? ` data-tip="${tip}"` : '';
  return `<span class="abc abc-${abc}"${tipAttr}>${abc}</span>`;
}

function fcBarHtml(fc) {
  const cls = fcCls(fc);
  const clr = cls==='bad' ? 'var(--red)' : cls==='ok' ? '#7a5800' : 'var(--navy)';
  const w   = Math.min(fc / 0.40 * 100, 100).toFixed(0);
  return `<div class="fc-bar-wrap">
    <span style="font-weight:700;color:${clr}">${pct(fc)}</span>
    <div class="fc-bar"><div class="fc-bar-fill ${cls}" style="width:${w}%"></div></div>
  </div>`;
}
function fcCombinedHtml(fc) {
  const cls = fcCls(fc);
  const clr = cls==='bad' ? 'var(--red)' : cls==='ok' ? '#7a5800' : 'var(--navy)';
  const icon = cls==='good' ? '🟢' : cls==='ok' ? '🟡' : '🔴';
  const w   = Math.min(fc / 0.40 * 100, 100).toFixed(0);
  return `<div class="fc-combined">
    <span class="fc-combined-icon">${icon}</span>
    <span class="fc-combined-pct" style="color:${clr}">${pct(fc)}</span>
    <div class="fc-bar"><div class="fc-bar-fill ${cls}" style="width:${w}%"></div></div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════════
//  EXPORT CSV
// ═══════════════════════════════════════════════════════════════════
function exportCSV(filename, headers, rows) {
  const csv = '\uFEFF' + [headers.join(';'), ...rows.map(r=>r.join(';'))].join('\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([csv], {type:'text/csv;charset=utf-8;'})),
    download: filename
  });
  a.click(); URL.revokeObjectURL(a.href);
}
function exportDashboard() {
  const drinks = withABC(enrich());
  exportCSV('mbs-dashboard.csv',
    ['Напиток','Цена ₽','Себест. ₽','Прибыль ₽','FC%','ABC'],
    sortDrinks(drinks).map(d => [d.name, Math.round(d.price), Math.round(d.cost), Math.round(d.profit), pct(d.fc), d.abc])
  );
}
function exportSales() {
  const drinks = enrich();
  exportCSV('mbs-sales.csv',
    ['Напиток','Цена','Себест.','Прибыль/шт','Порций/день','Выручка/день','Прибыль/день','Выручка/мес','Прибыль/мес'],
    drinks.map(d => { const p=S.portions[d.id],rD=d.price*p,pD=d.profit*p; return [d.name,Math.round(d.price),Math.round(d.cost),Math.round(d.profit),p,Math.round(rD),Math.round(pD),Math.round(rD*S.days),Math.round(pD*S.days)]; })
  );
}

// ═══════════════════════════════════════════════════════════════════
//  SORT (dashboard table)
// ═══════════════════════════════════════════════════════════════════
const sortState     = { col: 'profit', dir: 'desc' };
const costSortState  = { col: 'name',   dir: 'asc'  };
const salesSortState = { col: 'name',   dir: 'asc'  };
let   costSearch     = '';
let   salesSearch    = '';
function sortDrinks(drinks) {
  const { col, dir } = sortState;
  return [...drinks].sort((a,b) => {
    const av = a[col], bv = b[col];
    const r  = typeof av === 'string' ? av.localeCompare(bv,'ru') : av > bv ? 1 : av < bv ? -1 : 0;
    return dir === 'asc' ? r : -r;
  });
}
function setSort(col) {
  if (sortState.col === col) sortState.dir = sortState.dir === 'asc' ? 'desc' : 'asc';
  else { sortState.col = col; sortState.dir = 'desc'; }
  renderDashboard();
}
function thSort(col, label, cls='', tip='') {
  const active = sortState.col === col;
  const arrow  = active ? (sortState.dir==='asc' ? '↑' : '↓') : '↕';
  const sc     = active ? `sortable sort-${sortState.dir}` : 'sortable';
  const tipCls = tip ? ' tip' : '';
  const tipAttr= tip ? ` data-tip="${tip}"` : '';
  return `<th class="${sc} ${cls}${tipCls}"${tipAttr} onclick="setSort('${col}')">${label} <span class="sort-arrow">${arrow}</span></th>`;
}

function setCostSort(col) {
  if (costSortState.col === col) costSortState.dir = costSortState.dir === 'asc' ? 'desc' : 'asc';
  else { costSortState.col = col; costSortState.dir = col === 'name' ? 'asc' : 'desc'; }
  filterCost(costSearch);
}
function thCostSort(col, label, cls='', tip='') {
  const active = costSortState.col === col;
  const arrow  = active ? (costSortState.dir==='asc' ? '↑' : '↓') : '↕';
  const sc     = active ? `sortable sort-${costSortState.dir}` : 'sortable';
  const tipCls = tip ? ' tip' : '';
  const tipAttr= tip ? ` data-tip="${tip}"` : '';
  return `<th class="${sc} ${cls}${tipCls}"${tipAttr} onclick="setCostSort('${col}')">${label} <span class="sort-arrow">${arrow}</span></th>`;
}
function toggleMatPanel() {
  const panel = document.getElementById('mat-panel');
  const arrow = document.getElementById('mat-toggle-arrow');
  if (!panel) return;
  const open = panel.style.display === 'none' || panel.style.display === '';
  panel.style.display = open ? 'block' : 'none';
  if (arrow) arrow.textContent = open ? '▲' : '▼';
}

function filterCost(val) {
  costSearch = val;
  const drinks = enrich();
  const { col, dir } = costSortState;
  const sorted = [...drinks].sort((a,b) => {
    const av = a[col], bv = b[col];
    const r  = typeof av === 'string' ? av.localeCompare(bv,'ru') : av > bv ? 1 : av < bv ? -1 : 0;
    return dir === 'asc' ? r : -r;
  });
  const filtered = costSearch
    ? sorted.filter(d => d.name.toLowerCase().includes(costSearch.toLowerCase()))
    : sorted;
  let lastGroup = null;
  const rows = filtered.map(d => {
    let grRow = '';
    if (!costSearch && d.group !== lastGroup) {
      lastGroup = d.group;
      grRow = `<tr class="group-row"><td colspan="8">${GROUP_LABEL[d.group]}</td></tr>`;
    }
    const fc = d.fc;
    const recHighlight = d.fc > S.targetFC + 0.10 ? 'style="color:#7a5800;font-weight:800;background:#fffbe6"' : 'style="color:var(--navy);font-weight:700"';
    const actionBtn = d.custom
      ? `<td><button class="btn btn-outline" style="padding:3px 8px;font-size:11px;color:var(--red);border-color:#f4b8c4" onclick="deleteDrink(${d.id})" title="Удалить напиток"><i data-lucide="trash-2" class="icon"></i></button></td>`
      : d.modified
        ? `<td><button class="btn btn-outline" style="padding:3px 8px;font-size:11px;color:var(--muted)" onclick="resetDrink(${d.id})" title="Вернуть исходную рецептуру и цену"><i data-lucide="rotate-ccw" class="icon"></i></button></td>`
        : '<td></td>';
    return grRow + `<tr>
      <td class="fw7" style="cursor:pointer" onclick="openEditDrink(${d.id})">${d.name}${(d.custom||d.modified)?'<i data-lucide="pencil" class="icon" style="margin-left:5px;color:var(--muted)"></i>':''}</td>
      <td class="ta-r">${rub(d.cost)}</td>
      <td>${fcCombinedHtml(fc)}</td>
      <td class="ta-r">
        <input class="inp white" type="number" min="1"
          value="${d.price}"
          onchange="onSalePrice(${d.id},this.value)"> ₽
      </td>
      <td class="ta-r" ${recHighlight}>${rub(d.rec)}${d.fc > S.targetFC + 0.10 ? ' <span title="FC% существенно выше целевого" style="font-size:12px">⚠️</span>' : ''}</td>
      <td class="ta-r num-pos">${rub(d.profit)}</td>
      ${actionBtn}
    </tr>`;
  }).join('');
  const tb = document.querySelector('#tab-cost tbody');
  if (tb) { tb.innerHTML = rows; if (window.lucide) lucide.createIcons({ nodes: [tb] }); }
}

function setSalesSort(col) {
  if (salesSortState.col === col) salesSortState.dir = salesSortState.dir === 'asc' ? 'desc' : 'asc';
  else { salesSortState.col = col; salesSortState.dir = col === 'name' ? 'asc' : 'desc'; }
  filterSales(salesSearch);
}
function thSalesSort(col, label, cls='', tip='') {
  const active = salesSortState.col === col;
  const arrow  = active ? (salesSortState.dir==='asc' ? '↑' : '↓') : '↕';
  const sc     = active ? `sortable sort-${salesSortState.dir}` : 'sortable';
  const tipCls = tip ? ' tip' : '';
  const tipAttr= tip ? ` data-tip="${tip}"` : '';
  return `<th class="${sc} ${cls}${tipCls}"${tipAttr} onclick="setSalesSort('${col}')">${label} <span class="sort-arrow">${arrow}</span></th>`;
}
function filterSales(val) {
  salesSearch = val;
  const drinks  = enrich();
  const { col, dir } = salesSortState;
  const sorted  = [...drinks].sort((a,b) => {
    const aVal = col === 'revMon'  ? a.price * (S.portions[a.id]||0) * S.days
               : col === 'prfMon'  ? a.profit * (S.portions[a.id]||0) * S.days
               : col === 'revDay'  ? a.price * (S.portions[a.id]||0)
               : col === 'prfDay'  ? a.profit * (S.portions[a.id]||0)
               : col === 'portions'? (S.portions[a.id]||0)
               : a[col];
    const bVal = col === 'revMon'  ? b.price * (S.portions[b.id]||0) * S.days
               : col === 'prfMon'  ? b.profit * (S.portions[b.id]||0) * S.days
               : col === 'revDay'  ? b.price * (S.portions[b.id]||0)
               : col === 'prfDay'  ? b.profit * (S.portions[b.id]||0)
               : col === 'portions'? (S.portions[b.id]||0)
               : b[col];
    const r = typeof aVal === 'string' ? aVal.localeCompare(bVal,'ru') : aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    return dir === 'asc' ? r : -r;
  });
  const filtered = salesSearch
    ? sorted.filter(d => d.name.toLowerCase().includes(salesSearch.toLowerCase()))
    : sorted;

  // итоги по отфильтрованным
  const ftPort   = filtered.reduce((s,d) => s + (S.portions[d.id]||0), 0);
  const ftRevDay = filtered.reduce((s,d) => s + d.price  * (S.portions[d.id]||0), 0);
  const ftPrfDay = filtered.reduce((s,d) => s + d.profit * (S.portions[d.id]||0), 0);
  const ftRevMon = ftRevDay * S.days;
  const ftPrfMon = ftPrfDay * S.days;

  let lastGroup = null;
  const rows = filtered.map(d => {
    const p      = S.portions[d.id]||0;
    const revD   = d.price  * p;
    const prfD   = d.profit * p;
    const revM   = revD * S.days;
    const sharePct = ftRevMon > 0 ? revM / ftRevMon * 100 : 0;
    const barW   = Math.round(sharePct);
    const zeroCls = p === 0 ? ' style="opacity:.45"' : '';
    let grRow = '';
    if (!salesSearch && d.group !== lastGroup) {
      lastGroup = d.group;
      grRow = `<tr class="group-row"><td colspan="10">${GROUP_LABEL[d.group]}</td></tr>`;
    }
    return grRow + `<tr${zeroCls}>
      <td class="fw7">${d.name}${p===0 ? ' <span style="font-size:10px;color:var(--muted)">—</span>' : ''}</td>
      <td class="ta-r">${rub(d.price)}</td>
      <td class="ta-r">${rub(d.cost)}</td>
      <td class="ta-r fw7">${rub(d.profit)}</td>
      <td class="ta-c">
        <input class="inp sm" type="number" min="0" style="background:var(--light)"
          value="${p}"
          data-portions-id="${d.id}"
          oninput="onPortions(${d.id},this.value)">
      </td>
      <td class="ta-r">${rub(revD)}</td>
      <td class="ta-r num-pos">${rub(prfD)}</td>
      <td class="ta-r">${rub(revM)}</td>
      <td class="ta-r num-pos fw7">${rub(prfD * S.days)}</td>
      <td style="width:80px;padding-right:10px">
        <div style="height:8px;background:#e5e7eb;border-radius:4px;overflow:hidden">
          <div style="width:${barW}%;height:100%;background:var(--soft);border-radius:4px;transition:width .3s"></div>
        </div>
        <div style="font-size:10px;color:var(--muted);margin-top:2px;text-align:right">${sharePct.toFixed(1)}%</div>
      </td>
    </tr>`;
  }).join('');

  const tb   = document.querySelector('#tab-sales tbody');
  const foot = document.querySelector('#tab-sales tfoot');
  if (tb)   tb.innerHTML = rows;
  if (foot) foot.innerHTML = `
    <tr style="background:var(--navy);color:white;font-weight:800;font-size:14px;box-shadow:0 -2px 8px rgba(0,0,0,.15)">
      <td>ИТОГО${salesSearch ? ' <span style="font-size:11px;opacity:.7">(фильтр)</span>' : ''}</td>
      <td></td><td></td><td></td>
      <td class="ta-c" style="font-size:18px">${int(ftPort)}</td>
      <td class="ta-r">${rub(ftRevDay)}</td>
      <td class="ta-r">${rub(ftPrfDay)}</td>
      <td class="ta-r">${rub(ftRevMon)}</td>
      <td class="ta-r">${rub(ftPrfMon)}</td>
      <td></td>
    </tr>`;
}

// ═══════════════════════════════════════════════════════════════════
//  RESET
// ═══════════════════════════════════════════════════════════════════
function resetAll() {
  if (!confirm('Сбросить все цены и количества к исходным значениям этой точки?')) return;
  Object.assign(S.prices,     DEFAULTS.prices);
  Object.assign(S.salePrices, DEFAULTS.salePrices);
  Object.assign(S.portions,   DEFAULTS.portions);
  S.days = 30; S.targetFC = 0.25;
  S.fixedCosts = FIXED_COSTS_DEF.map(c=>({...c}));
  S.taxMode = 'none'; S.investment = 0;
  S.payroll   = { rate: 250, hours: 12, shifts: 30, count: 2 };
  S.payrollPositions = [
    { id:1, name:'Управляющий',   rate:400, hours:12, shifts:22, count:1, empType:'white' },
    { id:2, name:'Шеф-бариста', rate:350, hours:10, shifts:22, count:1, empType:'grey'  },
    { id:3, name:'Бариста',       rate:250, hours:10, shifts:22, count:2, empType:'black' },
  ];
  S.payrollSettings = { mrot: 22440, ndfl: 13, ins: 30 };
  S.payrollSettingsOpen = false;
  S.seasonality = [1,1,1,1,1,1,1,1,1,1,1,1];
  S.seasonalityOpen = false;
  S.suppliers = {};
  for (let i = DRINKS.length - 1; i >= 0; i--) {
    if (DRINKS[i].custom) DRINKS.splice(i, 1);
    else if (DRINKS[i].modified) {
      const orig = DRINKS_ORIG.find(o => o.id === DRINKS[i].id);
      if (orig) DRINKS[i] = {...orig, recipe: orig.recipe.map(r=>({...r}))};
    }
  }
  Object.keys(MAT).forEach(k => { if (!BASE_MAT_KEYS.has(k)) delete MAT[k]; });
  saveState();
  searchQuery = '';
  Object.keys(dirty).forEach(k=>dirty[k]=true);
  renderActive();
}

// ════════════════════════════════════════════════════════════════════
//  FLASH (visual feedback on recalc)
// ════════════════════════════════════════════════════════════════════
function flashCells() {
  // Подсвечиваем все td с числами в активной вкладке
  const tab = document.getElementById('tab-' + activeTab);
  if (!tab) return;
  tab.querySelectorAll('tbody td:not(:first-child), .kpi-value').forEach(el => {
    el.classList.remove('flash');
    // запуск через 1 мс чтобы CSS reflow
    void el.offsetWidth;
    el.classList.add('flash');
  });
}

// ════════════════════════════════════════════════════════════════════
//  LOCATIONS (multi-coffeeshop support)
// ════════════════════════════════════════════════════════════════════
const Loc = { list: [], activeId: null };
const LOC_INDEX_KEY  = 'mbs_locations';
const LOC_ACTIVE_KEY = 'mbs_active_loc';
const LOC_DATA_PREFIX= 'mbs_loc_';
const OLD_STATE_KEY  = 'mbs_coffee_s';

function locDataKey(id) { return LOC_DATA_PREFIX + id; }

function loadLocIndex() {
  try {
    const raw = localStorage.getItem(LOC_INDEX_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length) Loc.list = arr;
    }
    const aid = localStorage.getItem(LOC_ACTIVE_KEY);
    if (aid && Loc.list.some(l => l.id === aid)) Loc.activeId = aid;
  } catch(e) {}
}
function saveLocIndex() {
  try {
    localStorage.setItem(LOC_INDEX_KEY, JSON.stringify(Loc.list));
    if (Loc.activeId) localStorage.setItem(LOC_ACTIVE_KEY, Loc.activeId);
  } catch(e) {}
}
function migrateOldState() {
  try {
    const old = localStorage.getItem(OLD_STATE_KEY);
    const id = 'loc_default';
    Loc.list = [{ id, name: 'Моя кофейня', icon: '☕' }];
    Loc.activeId = id;
    if (old) localStorage.setItem(locDataKey(id), old);
    localStorage.removeItem(OLD_STATE_KEY);
    saveLocIndex();
  } catch(e) {}
}
function resetGlobalsToBase() {
  DRINKS.length = 0;
  DRINKS_ORIG.forEach(d => DRINKS.push({...d, recipe: d.recipe.map(r=>({...r}))}));
  nextDrinkId = Math.max(...DRINKS.map(d=>d.id), 26) + 1;
  Object.keys(MAT).forEach(k => delete MAT[k]);
  Object.entries(MAT_ORIG).forEach(([k,v]) => { MAT[k] = {...v}; });
  S.prices     = {...DEFAULTS.prices};
  S.salePrices = {...DEFAULTS.salePrices};
  S.portions   = {...DEFAULTS.portions};
  S.days = 30; S.targetFC = 0.25;
  S.fixedCosts = FIXED_COSTS_DEF.map(c=>({...c}));
  S.taxMode = 'none'; S.investment = 0;
  S.payroll   = { rate: 250, hours: 12, shifts: 30, count: 2 };
  S.payrollPositions = [
    { id:1, name:'Управляющий',   rate:400, hours:12, shifts:22, count:1, empType:'white' },
    { id:2, name:'Шеф-бариста', rate:350, hours:10, shifts:22, count:1, empType:'grey'  },
    { id:3, name:'Бариста',       rate:250, hours:10, shifts:22, count:2, empType:'black' },
  ];
  S.payrollSettings = { mrot: 22440, ndfl: 13, ins: 30 };
  S.payrollSettingsOpen = false;
  S.seasonality = [1,1,1,1,1,1,1,1,1,1,1,1];
  S.seasonalityOpen = false;
  S.suppliers = {};
  S.priceLog  = [];
  nextMatKey = 1;
}
function activeLoc() { return Loc.list.find(l => l.id === Loc.activeId); }

function renderLocSwitcherUI() {
  const loc = activeLoc();
  const nameEl = document.getElementById('loc-name');
  const iconEl = document.getElementById('loc-icon');
  if (loc && nameEl) nameEl.textContent = loc.name;
  if (loc && iconEl) iconEl.textContent = loc.icon || '☕';
  renderLocList();
}
function renderLocList() {
  const list = document.getElementById('loc-list');
  if (!list) return;
  list.innerHTML = Loc.list.map(l =>
    `<button class="loc-menu-item ${l.id===Loc.activeId?'active':''}" onclick="switchLocation('${l.id}')">
      <span class="loc-emoji">${l.icon||'☕'}</span>
      <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${l.name}</span>
      ${l.id===Loc.activeId?'<i data-lucide="check" class="icon" style="color:var(--green)"></i>':''}
    </button>`
  ).join('');
  if (window.lucide) lucide.createIcons();
}
function toggleLocMenu(e) {
  if (e) e.stopPropagation();
  document.getElementById('loc-menu').classList.toggle('open');
  document.getElementById('export-menu')?.classList.remove('open');
}
function toggleExportMenu(e) {
  if (e) e.stopPropagation();
  document.getElementById('export-menu').classList.toggle('open');
  document.getElementById('loc-menu')?.classList.remove('open');
}
document.addEventListener('click', () => {
  document.getElementById('loc-menu')?.classList.remove('open');
  document.getElementById('export-menu')?.classList.remove('open');
});

function switchLocation(id) {
  if (!id || id === Loc.activeId) { document.getElementById('loc-menu')?.classList.remove('open'); return; }
  saveState();
  Loc.activeId = id;
  saveLocIndex();
  resetGlobalsToBase();
  loadState();
  searchQuery = '';
  Object.keys(dirty).forEach(k=>dirty[k]=true);
  renderActive();
  renderLocSwitcherUI();
  document.getElementById('loc-menu')?.classList.remove('open');
}

let _locModalMode = 'add'; // 'add' | 'rename' | 'template'
let _locTemplateId = null;

function openAddLocation() {
  _locModalMode = 'add'; _locTemplateId = null;
  document.getElementById('modal-loc-title').innerHTML = '<i data-lucide="plus" class="icon"></i> Новая точка';
  document.getElementById('ml-icon').value = '☕';
  document.getElementById('ml-name').value = '';
  const sel = document.getElementById('ml-clone');
  sel.innerHTML = '<option value="">— Пустая (с базовым меню) —</option>'
    + Loc.list.map(l => `<option value="${l.id}">${l.icon||'☕'} ${l.name}</option>`).join('');
  document.getElementById('ml-clone-wrap').style.display = '';
  document.getElementById('loc-menu')?.classList.remove('open');
  openModal('modal-loc');
  if (window.lucide) lucide.createIcons();
}
function renameActiveLocation() {
  const loc = activeLoc(); if (!loc) return;
  _locModalMode = 'rename'; _locTemplateId = null;
  document.getElementById('modal-loc-title').innerHTML = '<i data-lucide="pencil" class="icon"></i> Переименовать точку';
  document.getElementById('ml-icon').value = loc.icon || '☕';
  document.getElementById('ml-name').value = loc.name;
  document.getElementById('ml-clone-wrap').style.display = 'none';
  document.getElementById('loc-menu')?.classList.remove('open');
  openModal('modal-loc');
  if (window.lucide) lucide.createIcons();
}
function deleteActiveLocation() {
  if (Loc.list.length <= 1) { alert('Нельзя удалить единственную точку. Сначала добавьте ещё одну.'); return; }
  const loc = activeLoc(); if (!loc) return;
  if (!confirm(`Удалить «${loc.name}»? Все её данные будут безвозвратно потеряны.`)) return;
  try { localStorage.removeItem(locDataKey(loc.id)); } catch(e) {}
  Loc.list = Loc.list.filter(l => l.id !== loc.id);
  Loc.activeId = Loc.list[0].id;
  saveLocIndex();
  resetGlobalsToBase();
  loadState();
  searchQuery = '';
  Object.keys(dirty).forEach(k=>dirty[k]=true);
  renderActive();
  renderLocSwitcherUI();
  document.getElementById('loc-menu')?.classList.remove('open');
}
function saveLocation() {
  const name = document.getElementById('ml-name').value.trim();
  const icon = document.getElementById('ml-icon').value.trim() || '☕';
  if (!name) { alert('Введите название точки'); return; }

  if (_locModalMode === 'rename') {
    const loc = activeLoc(); if (loc) { loc.name = name; loc.icon = icon; }
    saveLocIndex();
    renderLocSwitcherUI();
    closeModal('modal-loc');
    return;
  }

  const id = 'loc_' + Date.now() + '_' + Math.random().toString(36).slice(2,7);
  Loc.list.push({ id, name, icon });
  saveState(); // Сохранили текущую перед уходом
  Loc.activeId = id;
  saveLocIndex();

  if (_locModalMode === 'template' && _locTemplateId) {
    resetGlobalsToBase();
    applyTemplateData(_locTemplateId);
  } else {
    const cloneFrom = document.getElementById('ml-clone').value;
    if (cloneFrom) {
      try {
        const src = localStorage.getItem(locDataKey(cloneFrom));
        if (src) localStorage.setItem(locDataKey(id), src);
      } catch(e) {}
      resetGlobalsToBase();
      loadState();
    } else {
      resetGlobalsToBase();
    }
  }

  saveState();
  searchQuery = '';
  Object.keys(dirty).forEach(k=>dirty[k]=true);
  renderActive();
  renderLocSwitcherUI();
  closeModal('modal-loc');
}

// ════════════════════════════════════════════════════════════════════
//  MENU TEMPLATES
// ════════════════════════════════════════════════════════════════════
const MENU_TEMPLATES = {
  specialty: {
    name: 'Specialty кофейня',
    icon: '✨',
    desc: 'Авторские напитки, премиальное зерно, фильтр-кофе. Высокая маржа, средний чек выше.',
    meta: '~14 напитков · средний чек 380₽',
    keepIds: [0,1,3,4,5,6,7,10,11,16,17,18,19,20,27,28,29],
    priceMul: 1.20,
    portions: { 0:5, 1:8, 3:12, 4:18, 5:15, 6:10, 7:8, 10:6, 11:8, 16:5, 17:6, 18:5, 19:7, 20:8, 27:4, 28:3, 29:3 },
    fixedCostsMul: 1.0,
  },
  togo: {
    name: 'Кофе с собой',
    icon: '🥤',
    desc: 'Формат to-go: только базовые напитки, упор на скорость и оборот. Низкие постоянные расходы.',
    meta: '~10 напитков · оборот высокий',
    keepIds: [0,1,3,4,5,6,14,17,20,22,24,27,28],
    priceMul: 0.85,
    portions: { 0:6, 1:15, 3:20, 4:25, 5:22, 6:18, 14:8, 17:10, 20:15, 22:8, 24:10, 27:3, 28:2 },
    fixedCostsMul: 0.55,
  },
  kitchen: {
    name: 'Кофейня + кухня',
    icon: '🥐',
    desc: 'Полный ассортимент с холодными напитками. Расширенное меню, высокие постоянные расходы.',
    meta: 'Все 30 напитков · большая команда',
    keepIds: null, // все
    priceMul: 1.10,
    portions: null, // оставить дефолт
    fixedCostsMul: 1.4,
  }
};
function openTemplatesModal() {
  const grid = document.getElementById('templates-grid');
  grid.innerHTML = Object.entries(MENU_TEMPLATES).map(([id,t]) =>
    `<button class="template-card" onclick="chooseTemplate('${id}')">
      <div class="tpl-icon">${t.icon}</div>
      <div class="tpl-name">${t.name}</div>
      <div class="tpl-desc">${t.desc}</div>
      <div class="tpl-meta">${t.meta}</div>
    </button>`
  ).join('');
  document.getElementById('loc-menu')?.classList.remove('open');
  openModal('modal-templates');
  if (window.lucide) lucide.createIcons();
}
function chooseTemplate(id) {
  const tpl = MENU_TEMPLATES[id]; if (!tpl) return;
  closeModal('modal-templates');
  _locModalMode = 'template'; _locTemplateId = id;
  document.getElementById('modal-loc-title').innerHTML = `<i data-lucide="sparkles" class="icon"></i> Точка по шаблону «${tpl.name}»`;
  document.getElementById('ml-icon').value = tpl.icon;
  document.getElementById('ml-name').value = tpl.name;
  document.getElementById('ml-clone-wrap').style.display = 'none';
  openModal('modal-loc');
  if (window.lucide) lucide.createIcons();
}
function applyTemplateData(id) {
  const tpl = MENU_TEMPLATES[id]; if (!tpl) return;
  // Фильтруем напитки
  if (tpl.keepIds) {
    const keep = new Set(tpl.keepIds);
    for (let i = DRINKS.length - 1; i >= 0; i--) {
      if (!keep.has(DRINKS[i].id)) DRINKS.splice(i, 1);
    }
    Object.keys(S.salePrices).forEach(k => { if (!keep.has(+k)) delete S.salePrices[k]; });
    Object.keys(S.portions).forEach(k => { if (!keep.has(+k)) delete S.portions[k]; });
  }
  // Цены × множитель
  if (tpl.priceMul && tpl.priceMul !== 1) {
    DRINKS.forEach(d => {
      const base = S.salePrices[d.id] ?? d.price;
      S.salePrices[d.id] = Math.round(base * tpl.priceMul / 10) * 10;
    });
  }
  // Порции
  if (tpl.portions) {
    DRINKS.forEach(d => {
      if (tpl.portions[d.id] != null) S.portions[d.id] = tpl.portions[d.id];
      else S.portions[d.id] = 5;
    });
  }
  // Fixed costs × множитель
  if (tpl.fixedCostsMul && tpl.fixedCostsMul !== 1) {
    S.fixedCosts = S.fixedCosts.map(c => ({...c, value: Math.round(c.value * tpl.fixedCostsMul)}));
  }
}

// ════════════════════════════════════════════════════════════════════
//  INSIGHTS (smart hints on dashboard)
// ════════════════════════════════════════════════════════════════════
function generateInsights(drinks) {
  const out = [];
  if (!drinks.length) return out;
  const { avgFC, avgProfit } = avgMetrics(drinks);
  const riskCnt = drinks.filter(d => d.fc > 0.30).length;
  const aCnt    = drinks.filter(d => d.abc==='A').length;
  const cCnt    = drinks.filter(d => d.abc==='C').length;
  const worst   = [...drinks].sort((a,b)=>b.fc-a.fc)[0];
  const totalPort = Object.values(S.portions).reduce((s,v)=>s+v, 0);

  // Средний FC vs benchmark 25-30%
  if (avgFC <= 0.25) {
    out.push({ level:'good', icon:'✅', title:`Средний FC ${pct(avgFC)} — отлично`,
      text:'Ваш средний фуд-кост ниже бенчмарка отрасли (25–30%). Маржа стабильно высокая.' });
  } else if (avgFC <= 0.30) {
    out.push({ level:'good', icon:'👌', title:`Средний FC ${pct(avgFC)} — норма`,
      text:'Бенчмарк отрасли — 25–30%. Вы в рынке. Можно оптимизировать топ-3 худших позиций.' });
  } else if (avgFC <= 0.35) {
    out.push({ level:'warn', icon:'⚠️', title:`Средний FC ${pct(avgFC)} — выше нормы`,
      text:'Бенчмарк 25–30%. Поднимите цены на класс A или пересмотрите рецептуры дорогих позиций.' });
  } else {
    out.push({ level:'danger', icon:'🚨', title:`Средний FC ${pct(avgFC)} — критично`,
      text:'Маржа сжата. Срочно нужен пересмотр цен сырья (закупка) или цен продажи.' });
  }

  // Доля A-класса
  const aShare = aCnt / drinks.length;
  if (aShare >= 0.18 && aShare <= 0.25) {
    out.push({ level:'good', icon:'⭐', title:`Класс A: ${aCnt} напитков (${(aShare*100).toFixed(0)}%)`,
      text:'Здоровое распределение. Топ-20% генерируют основную прибыль — сфокусируйте маркетинг на них.' });
  }

  // Риск напитков
  if (riskCnt > 0) {
    out.push({ level: riskCnt >= drinks.length * 0.3 ? 'danger' : 'warn',
      icon:'🔴', title:`${riskCnt} напитков с FC > 30%`,
      text:`Эти позиции «съедают» маржу. Хуже всех: «${worst.name}» (${pct(worst.fc)}). Поднимите цену или удешевите рецепт.` });
  }

  // Класс C — балласт
  if (cCnt >= drinks.length * 0.55) {
    out.push({ level:'warn', icon:'🪫', title:`Класс C: ${cCnt} напитков`,
      text:'Слишком большой «хвост» неприбыльных позиций. Подумайте об удалении 2–3 самых слабых для упрощения меню.' });
  }

  // План продаж
  if (totalPort === 0) {
    out.push({ level:'warn', icon:'📋', title:'План продаж не заполнен',
      text:'Зайдите во вкладку «План продаж» и укажите ожидаемые порции по каждому напитку — расчёты BEP оживут.' });
  } else {
    const bep = bepCalc(drinks);
    const ratio = totalPort / (bep.cupsDay || 1);
    if (ratio < 1) {
      out.push({ level:'warn', icon:'⚖️', title:`До BEP не хватает ${bep.cupsDay - totalPort} чашек/день`,
        text:`План: ${totalPort} ч/д. Точка безубыточности: ${bep.cupsDay} ч/д. Нужен либо рост трафика, либо повышение чека.` });
    } else if (ratio >= 1.5) {
      out.push({ level:'good', icon:'🚀', title:`План в ${ratio.toFixed(1)}× выше BEP`,
        text:`Текущий план продаж покрывает точку безубыточности с большим запасом — отличная финансовая устойчивость.` });
    } else {
      out.push({ level:'good', icon:'✅', title:`План на ${((ratio-1)*100).toFixed(0)}% выше BEP`,
        text:`Точка безубыточности перекрыта. Запас прочности есть, но небольшой.` });
    }
  }

  return out;
}

// ════════════════════════════════════════════════════════════════════
//  EXPORT — PDF (full report) & XLSX
// ════════════════════════════════════════════════════════════════════
function exportFullPDF() {
  document.getElementById('export-menu')?.classList.remove('open');
  const loc = activeLoc();
  const drinks = withABC(enrich());
  const { avgPrice, avgProfit, avgFC } = avgMetrics(drinks);
  const sales = salesMetrics(drinks);
  const bep = bepCalc(drinks);
  const today = new Date().toLocaleDateString('ru');
  const locName = loc?.name || 'Кофейня';
  const totalFixed = S.fixedCosts.reduce((s,c)=>s+c.value,0);

  const kpiRows = [
    ['Напитков в меню', drinks.length, 'Средний чек', Math.round(avgPrice) + ' ₽'],
    ['Прибыль / чашка', Math.round(avgProfit) + ' ₽', 'Средний FC%', (avgFC*100).toFixed(1) + '%'],
    ['Выручка / день', Math.round(sales.totRevDay).toLocaleString('ru') + ' ₽', 'Прибыль / день', Math.round(sales.totPrfDay).toLocaleString('ru') + ' ₽'],
    ['Выручка / месяц', Math.round(sales.totRevMon).toLocaleString('ru') + ' ₽', 'Прибыль / месяц', Math.round(sales.totPrfMon).toLocaleString('ru') + ' ₽'],
    ['BEP (чашек/день)', bep.cupsDay, 'BEP выручка / мес', Math.round(bep.revBEP).toLocaleString('ru') + ' ₽'],
  ];

  const drinkRows = sortDrinks(drinks).map(d =>
    `<tr><td>${d.name}</td><td class="r">${Math.round(d.price)} ₽</td><td class="r">${Math.round(d.cost)} ₽</td><td class="r">${Math.round(d.profit)} ₽</td><td class="c">${(d.fc*100).toFixed(1)}%</td><td class="c abc-${d.abc?.toLowerCase()}">${d.abc||'—'}</td></tr>`
  ).join('');

  const planRows = drinks.map(d => {
    const p = S.portions[d.id] || 0;
    return `<tr><td>${d.name}</td><td class="r">${Math.round(d.price)} ₽</td><td class="c">${p}</td><td class="r">${Math.round(d.price*p).toLocaleString('ru')} ₽</td><td class="r">${Math.round(d.profit*p).toLocaleString('ru')} ₽</td><td class="r">${Math.round(d.price*p*S.days).toLocaleString('ru')} ₽</td><td class="r">${Math.round(d.profit*p*S.days).toLocaleString('ru')} ₽</td></tr>`;
  }).join('');

  const costsRows = S.fixedCosts.map(c =>
    `<tr><td>${c.name}</td><td class="r">${Math.round(c.value).toLocaleString('ru')} ₽</td></tr>`
  ).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Финансовый отчёт — ${locName}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #222; }
  @page { size: A4; margin: 15mm 12mm; }
  .cover { background: #41703380; color: #fff; padding: 20px 24px 18px; margin-bottom: 18px; border-radius: 4px; }
  .cover h1 { font-size: 17pt; margin-bottom: 4px; }
  .cover p { font-size: 10pt; opacity: .85; }
  h2 { font-size: 12pt; color: #417033; margin: 18px 0 7px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
  th { background: #417033; color: #fff; padding: 5px 7px; text-align: left; font-size: 9pt; }
  td { padding: 4px 7px; border-bottom: 1px solid #ddd; font-size: 9pt; }
  tr:nth-child(even) td { background: #f5faf3; }
  .kpi td:nth-child(odd) { font-weight: bold; background: #e7f2e3; width: 22%; }
  .kpi td:nth-child(even) { width: 28%; }
  .r { text-align: right; }
  .c { text-align: center; }
  .abc-a { color: #1a7a1a; font-weight: bold; }
  .abc-b { color: #b87e00; font-weight: bold; }
  .abc-c { color: #c0392b; font-weight: bold; }
  .total td { font-weight: bold; background: #e7f2e3 !important; }
  .page-break { page-break-before: always; }
  @media print { .cover { -webkit-print-color-adjust: exact; print-color-adjust: exact; } th { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body>
<div class="cover"><h1>MBS Coffee Menu — финансовый отчёт</h1><p>${locName} &nbsp;·&nbsp; ${today}</p></div>

<h2>Ключевые показатели</h2>
<table class="kpi"><tbody>${kpiRows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('')}</tbody></table>

<h2>Рейтинг напитков</h2>
<table><thead><tr><th>Напиток</th><th>Цена</th><th>Себест.</th><th>Прибыль</th><th>FC%</th><th>ABC</th></tr></thead><tbody>${drinkRows}</tbody></table>

<div class="page-break"></div>
<h2>План продаж</h2>
<table><thead><tr><th>Напиток</th><th>Цена</th><th>Порций/день</th><th>Выручка/день</th><th>Прибыль/день</th><th>Выручка/мес</th><th>Прибыль/мес</th></tr></thead><tbody>${planRows}</tbody></table>

<h2>Постоянные расходы</h2>
<table><thead><tr><th>Статья</th><th>Сумма / мес</th></tr></thead><tbody>${costsRows}<tr class="total"><td>ИТОГО</td><td class="r">${Math.round(totalFixed).toLocaleString('ru')} ₽</td></tr></tbody></table>
</body></html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.onload = () => w.print();
}

function exportFullXLSX() {
  document.getElementById('export-menu')?.classList.remove('open');
  if (!window.XLSX) { alert('Библиотека XLSX не загрузилась. Проверьте интернет.'); return; }
  const loc = activeLoc();
  const drinks = withABC(enrich());
  const sales = salesMetrics(drinks);
  const { avgPrice, avgProfit, avgFC } = avgMetrics(drinks);
  const bep = bepCalc(drinks);

  const wb = XLSX.utils.book_new();

  // Dashboard
  const dashRows = [
    ['MBS Coffee Menu — отчёт'],
    ['Точка', loc?.name || ''],
    ['Дата', new Date().toLocaleDateString('ru')],
    [],
    ['Напитков в меню', drinks.length],
    ['Средний чек, ₽', Math.round(avgPrice)],
    ['Прибыль / чашка, ₽', Math.round(avgProfit)],
    ['Средний FC%', +(avgFC*100).toFixed(1)],
    ['Выручка / день, ₽', Math.round(sales.totRevDay)],
    ['Прибыль / день, ₽', Math.round(sales.totPrfDay)],
    ['Выручка / мес, ₽', Math.round(sales.totRevMon)],
    ['Прибыль / мес, ₽', Math.round(sales.totPrfMon)],
    ['BEP, чашек/день', bep.cupsDay],
    ['BEP выручка / мес, ₽', Math.round(bep.revBEP)],
    [],
    ['Напиток','Группа','Цена','Себестоимость','Прибыль','FC%','ABC','Порций/день'],
    ...sortDrinks(drinks).map(d => [
      d.name, d.group, Math.round(d.price), Math.round(d.cost), Math.round(d.profit),
      +(d.fc*100).toFixed(1), d.abc, S.portions[d.id]||0
    ])
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dashRows), 'Дашборд');

  // Себестоимость
  const costRows = [
    ['Напиток','Группа','Объём, мл','Цена, ₽','Себест., ₽','Прибыль, ₽','FC%','Реком. цена'],
    ...drinks.map(d => [
      d.name, d.group, d.vol, Math.round(d.price), Math.round(d.cost),
      Math.round(d.profit), +(d.fc*100).toFixed(1), d.rec
    ])
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(costRows), 'Себестоимость');

  // Сырьё
  const matRows = [
    ['Ключ','Название','Единица','Цена, ₽','Размер'],
    ...Object.entries(MAT).map(([k,m]) => [k, m.name, m.unit, S.prices[k] ?? m.price, m.size])
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(matRows), 'Сырьё');

  // Sales
  const salesRows = [
    ['Напиток','Цена','Себест.','Прибыль/шт','Порций/день','Выручка/день','Прибыль/день','Выручка/мес','Прибыль/мес'],
    ...drinks.map(d => {
      const p = S.portions[d.id]||0;
      return [d.name, Math.round(d.price), Math.round(d.cost), Math.round(d.profit), p,
              Math.round(d.price*p), Math.round(d.profit*p),
              Math.round(d.price*p*S.days), Math.round(d.profit*p*S.days)];
    })
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(salesRows), 'План продаж');

  // Финмодель
  const finRows = [
    ['Постоянные расходы'],
    ['Статья','Сумма / мес'],
    ...S.fixedCosts.map(c => [c.name, Math.round(c.value)]),
    ['ИТОГО', S.fixedCosts.reduce((s,c)=>s+c.value,0)],
    [],
    ['Параметры'],
    ['Дней в месяце', S.days],
    ['Целевой FC%', +(S.targetFC*100).toFixed(1)],
    ['Налоговый режим', S.taxMode],
    ['Инвестиции, ₽', S.investment],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(finRows), 'Финмодель');

  const today = new Date().toISOString().slice(0,10);
  XLSX.writeFile(wb, `mbs-${(loc?.name||'cafe').replace(/\s+/g,'_')}-${today}.xlsx`);
}

// ════════════════════════════════════════════════════════════════════
//  PERSIST & THEME
// ════════════════════════════════════════════════════════════════════
function saveState() {
  if (!Loc.activeId) return;
  try {
    localStorage.setItem(locDataKey(Loc.activeId), JSON.stringify({
      prices: S.prices, salePrices: S.salePrices, portions: S.portions,
      days: S.days, targetFC: S.targetFC, fixedCosts: S.fixedCosts,
      taxMode: S.taxMode, investment: S.investment,
      payrollPositions: S.payrollPositions,
      payrollSettings: S.payrollSettings, payrollSettingsOpen: S.payrollSettingsOpen,
      seasonality: S.seasonality, seasonalityOpen: S.seasonalityOpen,
      wif: { price: _wif.price, cost: _wif.cost, traffic: _wif.traffic },
      suppliers: S.suppliers, supplierBook: S.supplierBook, priceLog: S.priceLog,
      customDrinks: DRINKS.filter(d => d.custom),
      modifiedDrinks: DRINKS.filter(d => d.modified).map(d => ({id:d.id,name:d.name,group:d.group,vol:d.vol,recipe:d.recipe})),
      customMats: Object.entries(MAT).filter(([,v])=>v.custom).map(([k,v])=>({key:k,...v}))
    }));
  } catch(e) {}
}
function loadState() {
  if (!Loc.activeId) return;
  try {
    const raw = localStorage.getItem(locDataKey(Loc.activeId));
    if (!raw) return;
    const sv = JSON.parse(raw);
    if (sv.prices)      Object.assign(S.prices, sv.prices);
    if (sv.salePrices)  Object.assign(S.salePrices, sv.salePrices);
    if (sv.portions)    Object.assign(S.portions, sv.portions);
    if (sv.days != null)     S.days = sv.days;
    if (sv.targetFC != null) S.targetFC = sv.targetFC;
    if (sv.fixedCosts)       S.fixedCosts = sv.fixedCosts;
    if (sv.taxMode)          S.taxMode = sv.taxMode;
    if (sv.investment != null) S.investment = sv.investment;
    if (sv.payroll && !sv.payrollPositions) {
      // Миграция со старого формата
      S.payrollPositions = [{ id:1, name:'Бариста', rate: sv.payroll.rate||250, hours: sv.payroll.hours||12, shifts: sv.payroll.shifts||30, count: sv.payroll.count||2 }];
    }
    if (sv.payrollPositions) S.payrollPositions = sv.payrollPositions;
    if (sv.payrollSettings)  Object.assign(S.payrollSettings, sv.payrollSettings);
    if (sv.payrollSettingsOpen != null) S.payrollSettingsOpen = sv.payrollSettingsOpen;
    if (sv.seasonality) S.seasonality = sv.seasonality;
    if (sv.seasonalityOpen != null) S.seasonalityOpen = sv.seasonalityOpen;
    if (sv.wif) { _wif.price = sv.wif.price||0; _wif.cost = sv.wif.cost||0; _wif.traffic = sv.wif.traffic||0; }
    if (sv.suppliers && Object.keys(sv.suppliers).length > 0) S.suppliers = sv.suppliers;
    if (sv.supplierBook && sv.supplierBook.length > 0) S.supplierBook = sv.supplierBook;
    if (sv.priceLog)     S.priceLog     = sv.priceLog;
    if (sv.customMats) {
      sv.customMats.forEach(m => {
        const {key,...rest} = m;
        MAT[key] = {...rest, custom:true};
        if (!S.prices[key]) S.prices[key] = rest.price;
      });
    }
    if (sv.customDrinks) {
      sv.customDrinks.forEach(d => {
        if (!DRINKS.find(x=>x.id===d.id)) {
          DRINKS.push(d);
          if (nextDrinkId <= d.id) nextDrinkId = d.id + 1;
        }
        if (S.salePrices[d.id] == null) S.salePrices[d.id] = d.price;
        if (S.portions[d.id]   == null) S.portions[d.id]   = 5;
      });
    }
    if (sv.modifiedDrinks) {
      sv.modifiedDrinks.forEach(md => {
        const idx = DRINKS.findIndex(x => x.id === md.id);
        if (idx >= 0) DRINKS[idx] = {...DRINKS[idx], name:md.name, group:md.group, vol:md.vol, recipe:md.recipe, modified:true};
      });
    }
  } catch(e) {}
}
function toggleTheme() {
  const dark = document.body.classList.toggle('dark');
  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.setAttribute('data-lucide', dark ? 'sun' : 'moon');
    if (window.lucide) lucide.createIcons({ nodes: [icon] });
  }
  try { localStorage.setItem('mbs_theme', dark ? 'dark' : 'light'); } catch(e) {}
}
function toggleBurger() {
  const nav = document.getElementById('main-nav');
  nav.classList.toggle('open');
}
// Закрывать бургер при клике на нав-кнопку
document.addEventListener('click', e => {
  if (e.target.matches('.nav-btn')) document.getElementById('main-nav').classList.remove('open');
});

// ════════════════════════════════════════════════════════════════════
//  ONBOARDING
// ════════════════════════════════════════════════════════════════════
function closeOnboarding() {
  document.getElementById('onboarding').style.display = 'none';
  try { localStorage.setItem('mbs_onboard', '1'); } catch(e) {}
}

// ════════════════════════════════════════════════════════════════════
//  MODAL HELPERS
// ════════════════════════════════════════════════════════════════════
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
// Закрыть модал при клике на фон
document.addEventListener('click', e => {
  ['modal-drink','modal-mat','modal-templates','modal-loc','modal-supplier','modal-supplier-book','modal-price-hist','modal-drop','modal-suppliers-list'].forEach(id => {
    const bg = document.getElementById(id);
    if (e.target === bg) closeModal(id);
  });
});

// ════════════════════════════════════════════════════════════════════
//  ADD/EDIT DRINK MODAL
// ════════════════════════════════════════════════════════════════════
function matOptions(selectedKey='') {
  return Object.entries(MAT).map(([k,m]) =>
    `<option value="${k}" ${k===selectedKey?'selected':''}>${m.name}</option>`
  ).join('');
}
function addIngRow(matKey='', amt='', loss='') {
  const row = document.createElement('div');
  row.className = 'modal-ing-row';
  row.innerHTML = `
    <select class="modal-select">${matOptions(matKey)}</select>
    <input class="modal-inp" type="number" min="0" placeholder="г / мл / шт" value="${amt}">
    <input class="modal-inp" type="number" min="0" max="0.99" step="0.01" placeholder="0.05" value="${loss}">
    <button class="modal-ing-del" title="Удалить ингредиент" onclick="this.closest('.modal-ing-row').remove()"><i data-lucide="trash-2" class="icon"></i></button>
  `;
  document.getElementById('md-ings').appendChild(row);
  if (window.lucide) lucide.createIcons({ nodes: [row] });
}
function openAddDrink() {
  document.getElementById('modal-drink-title').innerHTML = '<i data-lucide="plus" class="icon"></i> Новый напиток';
  if (window.lucide) lucide.createIcons({ nodes: [document.getElementById('modal-drink-title')] });
  document.getElementById('md-delete-btn').style.display = 'none';
  document.getElementById('md-name').value  = '';
  document.getElementById('md-price').value = '';
  document.getElementById('md-vol').value   = '';
  document.getElementById('md-group').value = 'hot';
  document.getElementById('md-edit-id').value = '';
  document.getElementById('md-ings').innerHTML = '';
  addIngRow(); addIngRow();
  openModal('modal-drink');
}
function openEditDrink(id) {
  const d = DRINKS.find(x=>x.id===id);
  if (!d) return;
  document.getElementById('modal-drink-title').innerHTML = '<i data-lucide="pencil" class="icon"></i> Редактировать напиток';
  if (window.lucide) lucide.createIcons({ nodes: [document.getElementById('modal-drink-title')] });
  document.getElementById('md-name').value  = d.name;
  document.getElementById('md-price').value = S.salePrices[id];
  document.getElementById('md-vol').value   = d.vol;
  document.getElementById('md-group').value = d.group;
  document.getElementById('md-edit-id').value = id;
  document.getElementById('md-ings').innerHTML = '';
  d.recipe.forEach(r => addIngRow(r.mat, r.amt, r.loss||''));
  // показать кнопку удаления/сброса
  const delBtn = document.getElementById('md-delete-btn');
  const delLabel = document.getElementById('md-delete-label');
  if (d.custom) {
    delBtn.style.display = '';
    delBtn.style.color = 'var(--red)';
    delBtn.style.borderColor = '#f4b8c4';
    delLabel.textContent = 'Удалить';
    delBtn.dataset.action = 'delete';
  } else if (d.modified) {
    delBtn.style.display = '';
    delBtn.style.color = 'var(--muted)';
    delBtn.style.borderColor = '';
    delLabel.textContent = 'Сбросить';
    delBtn.dataset.action = 'reset';
  } else {
    delBtn.style.display = 'none';
  }
  if (window.lucide) lucide.createIcons({ nodes: [delBtn] });
  openModal('modal-drink');
}
function saveDrink() {
  const name  = document.getElementById('md-name').value.trim();
  const price = parseFloat(document.getElementById('md-price').value);
  const vol   = parseInt(document.getElementById('md-vol').value) || 0;
  const group = document.getElementById('md-group').value;
  const editId = document.getElementById('md-edit-id').value;
  if (!name || !(price>0)) { alert('Заполните название и цену'); return; }
  const recipe = [];
  document.querySelectorAll('#md-ings .modal-ing-row').forEach(row => {
    const selMat  = row.querySelector('select');
    const inputs  = row.querySelectorAll('input');
    const inpAmt  = inputs[0];
    const inpLoss = inputs[1];
    const amt = parseFloat(inpAmt.value);
    if (!selMat.value || !(amt>0)) return;
    const ing = { mat: selMat.value, amt };
    const l = parseFloat(inpLoss.value);
    if (l > 0 && l < 1) ing.loss = l;
    recipe.push(ing);
  });
  if (recipe.length === 0) { alert('Добавьте хотя бы один ингредиент'); return; }
  if (editId !== '') {
    const id = parseInt(editId);
    const idx = DRINKS.findIndex(x=>x.id===id);
    if (idx >= 0) {
      const wasCustom = DRINKS[idx].custom || false;
      // базовый напиток → modified; кастомный → остаётся custom
      DRINKS[idx] = {...DRINKS[idx], name, group, vol, recipe,
        custom: wasCustom,
        modified: !wasCustom || undefined
      };
    }
    S.salePrices[id] = price;
  } else {
    const id = nextDrinkId++;
    DRINKS.push({ id, group, name, vol, recipe, price, custom:true });
    S.salePrices[id] = price;
    S.portions[id]   = 5;
  }
  closeModal('modal-drink');
  markDirtyDebounce();
  saveState();
}
function deleteDrink(id) {
  if (!confirm('Удалить напиток?')) return;
  const idx = DRINKS.findIndex(d=>d.id===id);
  if (idx>=0) DRINKS.splice(idx,1);
  delete S.salePrices[id];
  delete S.portions[id];
  markDirtyDebounce();
  saveState();
}
function mdDeleteAction() {
  const id = parseInt(document.getElementById('md-edit-id').value);
  const action = document.getElementById('md-delete-btn').dataset.action;
  closeModal('modal-drink');
  if (action === 'delete') deleteDrink(id);
  else if (action === 'reset') resetDrink(id);
}
function resetDrink(id) {
  if (!confirm('Вернуть напиток к исходным значениям?')) return;
  const orig = DRINKS_ORIG.find(d => d.id === id);
  if (!orig) return;
  const idx = DRINKS.findIndex(d => d.id === id);
  if (idx >= 0) DRINKS[idx] = {...orig}; // снимает флаг modified
  S.salePrices[id] = orig.price;
  markDirtyDebounce();
  saveState();
}

// ════════════════════════════════════════════════════════════════════
//  ADD MATERIAL MODAL
// ════════════════════════════════════════════════════════════════════
function saveMat() {
  const name  = document.getElementById('mm-name').value.trim();
  const unit  = document.getElementById('mm-unit').value || 'шт';
  const price = parseFloat(document.getElementById('mm-price').value);
  const size  = parseFloat(document.getElementById('mm-size').value);
  if (!name || !(price>0) || !(size>0)) { alert('Заполните все поля'); return; }
  const key = 'custom_' + (nextMatKey++);
  MAT[key] = { name, unit, price, size, custom:true };
  S.prices[key] = price;
  closeModal('modal-mat');
  // очищаем форму для следующего открытия
  document.getElementById('mm-name').value  = '';
  document.getElementById('mm-unit').value  = 'шт';
  document.getElementById('mm-price').value = '';
  document.getElementById('mm-size').value  = '';
  markDirtyDebounce();
  saveState();
}
function deleteMat(key) {
  const used = DRINKS.some(d => d.recipe.some(r => r.mat === key));
  if (used) { alert('Сырьё используется в рецептурах — сначала удалите напитки с этим сырьём'); return; }
  if (!confirm('Удалить позицию сырья?')) return;
  delete MAT[key];
  delete S.prices[key];
  markDirtyDebounce();
  saveState();
}

// ════════════════════════════════════════════════════════════════════
//  RENDER — DASHBOARD
// ════════════════════════════════════════════════════════════════════
function renderDashboard() {
  const drinks = withABC(enrich());
  const { avgCost, avgPrice, avgProfit, avgFC } = avgMetrics(drinks);
  const riskCnt = drinks.filter(d=>d.fc>0.30).length;
  const okCnt   = drinks.filter(d=>d.fc>0.25&&d.fc<=0.30).length;
  const aCnt    = drinks.filter(d=>d.abc==='A').length;
  const sorted  = sortDrinks(drinks);
  const filtered = searchQuery
    ? sorted.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : sorted;

  // Mini bar chart top-10
  const top10 = [...drinks].sort((a,b) => b.profit - a.profit).slice(0, 10);
  const maxPr = top10[0]?.profit || 1;
  const chartHtml = top10.map(d => {
    const w  = Math.round(d.profit / maxPr * 100);
    const bc = d.abc==='A' ? 'var(--soft)' : d.abc==='B' ? '#ffd84a' : 'var(--red-bg)';
    const vc = d.abc==='A' ? 'var(--navy)' : d.abc==='B' ? '#7a5800' : 'var(--red)';
    return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
      <div style="width:170px;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex-shrink:0;font-weight:600">${d.name}</div>
      <div style="flex:1;height:14px;background:#e5e7eb;border-radius:4px;overflow:hidden">
        <div style="width:${w}%;height:100%;background:${bc};border-radius:4px;transition:width .4s"></div>
      </div>
      <div style="width:60px;font-size:12px;font-weight:800;color:${vc};text-align:right">${Math.round(d.profit)}\u00a0₽</div>
    </div>`;
  }).join('');

  const rows = filtered.map(d => {
    const profCls = d.profit >= avgProfit ? 'num-pos' : '';
    const actionBtn = d.custom
      ? `<button class="btn btn-outline" style="padding:3px 8px;font-size:11px;color:var(--red);border-color:#f4b8c4" onclick="event.stopPropagation();deleteDrink(${d.id})" title="Удалить напиток"><i data-lucide="trash-2" class="icon"></i></button>`
      : d.modified
        ? `<button class="btn btn-outline" style="padding:3px 8px;font-size:11px;color:var(--muted)" onclick="event.stopPropagation();resetDrink(${d.id})" title="Вернуть к исходному"><i data-lucide="rotate-ccw" class="icon"></i></button>`
        : '';
    return `<tr style="cursor:pointer" onclick="openEditDrink(${d.id})">
      <td class="fw7">${d.name}${(d.custom||d.modified)?'<i data-lucide="pencil" class="icon" style="margin-left:5px;color:var(--muted)"></i>':''}</td>
      <td class="ta-r">${rub(d.price)}</td>
      <td class="ta-r">${rub(d.cost)}</td>
      <td class="ta-r ${profCls}">${rub(d.profit)}</td>
      <td>${fcCombinedHtml(d.fc)}</td>
      <td class="ta-c">${abcBadge(d.abc, d.abcTip)}</td>
      <td onclick="event.stopPropagation()">${actionBtn}</td>
    </tr>`;
  }).join('');

  document.getElementById('tab-dashboard').innerHTML = `
    <div class="page-title">
      <span class="page-title-left"><i data-lucide="layout-dashboard" class="icon"></i> Обзор меню</span>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-outline" onclick="openAddDrink()"><i data-lucide="plus" class="icon"></i> Напиток</button>
        <button class="btn btn-outline" onclick="openDropCandidates()" title="Найти позиции с низкой эффективностью"><i data-lucide="scissors" class="icon"></i> Кандидаты на удаление</button>
        <button class="btn btn-outline" onclick="exportDashboard()">⬇ CSV</button>
      </div>
    </div>
    <div class="tab-intro">
      <div class="tab-intro-icon"><i data-lucide="layout-dashboard" class="icon icon-lg"></i></div>
      <div>
        <div class="tab-intro-title">Что это?</div>
        <div class="tab-intro-text">
          Главный экран для быстрой оценки меню. Показывает ключевые показатели и рейтинг напитков по прибыли с чашки.
          <strong>FC%</strong> (фуд-кост) — доля себестоимости в цене продажи: чем ниже — тем выгоднее позиция.
        </div>
        <div class="tab-intro-steps">
          <span class="tab-intro-step">клик на заголовок → сортировка</span>
          <span class="tab-intro-step">🟢 FC ≤25% — отлично</span>
          <span class="tab-intro-step">🟡 26–30% — норма</span>
          <span class="tab-intro-step">🔴 >30% — риск</span>
          <span class="tab-intro-step">Целевой FC% — редактируется прямо в карточке</span>
        </div>
      </div>
    </div>
    <div class="kpi-grid">
      <div class="kpi-card accent"><div class="kpi-label">Напитков в меню</div><div class="kpi-value">${drinks.length}</div></div>
      <div class="kpi-card"><div class="kpi-label">Средний чек</div><div class="kpi-value">${rub(avgPrice)}</div></div>
      <div class="kpi-card"><div class="kpi-label">Прибыль / чашка</div><div class="kpi-value">${rub(avgProfit)}</div></div>
      <div class="kpi-card"><div class="kpi-label">Средний FC%</div><div class="kpi-value">${pct(avgFC)}</div></div>
      <div class="kpi-card kpi-card--editable" title="Нажмите для изменения">
        <div class="kpi-label">Целевой FC%</div>
        <div class="kpi-value kpi-value--input">
          <input type="number" id="kpi-target-fc" class="kpi-inp" min="5" max="60" step="1"
            value="${Math.round(S.targetFC*100)}"
            oninput="onTargetFCSilent(this.value)"
            onblur="onTargetFC(this.value)"
            onclick="event.stopPropagation()"
            title="Целевой food-cost %">
          <span class="kpi-inp-unit">%</span>
        </div>
      </div>
    </div>
    <div class="section-title"><i data-lucide="trending-down" class="icon"></i> Топ-10 по прибыли с чашки</div>
    <div class="panel" style="margin-bottom:20px">${chartHtml}</div>
    <div class="section-title"><i data-lucide="clipboard-list" class="icon"></i> Рейтинг напитков — кликните заголовок для сортировки</div>
    <div class="search-wrap">
      <span class="search-icon"><i data-lucide="search" class="icon"></i></span>
      <input class="search-inp" id="dash-search" type="text" placeholder="Поиск по названию..."
        value="${searchQuery}" oninput="filterDashboard(this.value)">
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr>
          ${thSort('name','Напиток','','')}
          ${thSort('price','Цена ₽','ta-r','Цена продажи гостю. Редактируется во вкладке «Себестоимость»')}
          ${thSort('cost','Себест. ₽','ta-r','Сумма затрат на сырьё для одной порции. Меняется при изменении цен сырья')}
          ${thSort('profit','Прибыль ₽','ta-r','Цена − Себестоимость. Зелёные — выше среднего по меню')}
          ${thSort('fc','FC%','','Food-cost: значок статуса + % + полоса. 🟢≤25% 🟡26–30% 🔴>30%')}
          ${thSort('abc','ABC','ta-c','ABC-класс по прибыли: A = топ 20%, B = следующие 30%, C = остальные 50%')}
          <th></th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="panel" style="font-size:13px;color:var(--muted)">
      <strong style="color:var(--navy);margin-right:8px">ABC-классификация:</strong>
      ${abcBadge('A')} <span style="margin-right:16px">Топ-20% по прибыли — приоритет продаж</span>
      ${abcBadge('B')} <span style="margin-right:16px">Следующие 30% — рабочий ассортимент</span>
      ${abcBadge('C')} Остальные 50% — пересмотреть цену или себестоимость
    </div>
  `;
}

function filterDashboard(val) {
  searchQuery = val;
  const drinks = withABC(enrich());
  const { avgProfit } = avgMetrics(drinks);
  const sorted   = sortDrinks(drinks);
  const filtered = searchQuery
    ? sorted.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : sorted;
  const rows = filtered.map(d => {
    const profCls = d.profit >= avgProfit ? 'num-pos' : '';
    const actionBtn = d.custom
      ? `<button class="btn btn-outline" style="padding:3px 8px;font-size:11px;color:var(--red);border-color:#f4b8c4" onclick="event.stopPropagation();deleteDrink(${d.id})" title="Удалить напиток"><i data-lucide="trash-2" class="icon"></i></button>`
      : d.modified
        ? `<button class="btn btn-outline" style="padding:3px 8px;font-size:11px;color:var(--muted)" onclick="event.stopPropagation();resetDrink(${d.id})" title="Вернуть к исходному"><i data-lucide="rotate-ccw" class="icon"></i></button>`
        : '';
    return `<tr style="cursor:pointer" onclick="openEditDrink(${d.id})">
      <td class="fw7">${d.name}${(d.custom||d.modified)?'<i data-lucide="pencil" class="icon" style="margin-left:5px;color:var(--muted)"></i>':''}</td>
      <td class="ta-r">${rub(d.price)}</td>
      <td class="ta-r">${rub(d.cost)}</td>
      <td class="ta-r ${profCls}">${rub(d.profit)}</td>
      <td>${fcCombinedHtml(d.fc)}</td>
      <td class="ta-c">${abcBadge(d.abc, d.abcTip)}</td>
      <td onclick="event.stopPropagation()">${actionBtn}</td>
    </tr>`;
  }).join('');
  const tb = document.querySelector('#tab-dashboard tbody');
  if (tb) { tb.innerHTML = rows; if (window.lucide) lucide.createIcons({ nodes: [tb] }); }
}

// ════════════════════════════════════════════════════════════════════
//  RENDER — COST CALCULATOR
// ════════════════════════════════════════════════════════════════════
function renderCost() {
  const drinks = enrich();

  const matInputs = Object.entries(MAT).map(([key,m]) => {
    const sup = (S.suppliers || {})[key];
    const supTitle = sup ? `${sup.name||''}${sup.phone?' · '+sup.phone:''}${sup.note?' · '+sup.note:''}` : 'Указать поставщика';
    const supClr = sup ? 'var(--green)' : 'var(--muted)';
    return `
    <div class="mat-item">
      <div style="min-width:0">
        <div class="mat-name" title="${m.name}">${m.name}</div>
        <div class="mat-unit">${m.unit}${sup?` · <span style="color:var(--green);font-weight:700" title="${(sup.phone||'')} ${(sup.note||'')}">${sup.name||'поставщик'}</span>`:''}</div>
      </div>
      <div class="mat-controls">
        <input class="inp sm" type="number" min="1"
          id="mat-inp-${key}"
          value="${S.prices[key]}"
          oninput="onMatPrice('${key}',this.value)">
        <span style="font-size:12px;color:var(--muted);flex-shrink:0">₽</span>
        <button class="mat-del" onclick="openSupplierModal('${key}')" title="${supTitle}" style="color:${supClr}"><i data-lucide="truck" class="icon"></i></button>
        <button class="mat-del" onclick="openPriceHistory('${key}')" title="История цен"><i data-lucide="history" class="icon"></i></button>
        ${m.custom ? `<button class="mat-del" onclick="deleteMat('${key}')" title="Удалить"><i data-lucide="trash-2" class="icon"></i></button>` : '<span style="width:20px"></span>'}
      </div>
    </div>
  `;}).join('');

  // начальный рендер строк через filterCost-логику
  const { col, dir } = costSortState;
  const sortedDrinks = [...drinks].sort((a,b) => {
    const av = a[col], bv = b[col];
    const r  = typeof av === 'string' ? av.localeCompare(bv,'ru') : av > bv ? 1 : av < bv ? -1 : 0;
    return dir === 'asc' ? r : -r;
  });
  const filteredDrinks = costSearch
    ? sortedDrinks.filter(d => d.name.toLowerCase().includes(costSearch.toLowerCase()))
    : sortedDrinks;
  let lastGroup = null;
  const rows = filteredDrinks.map(d => {
    let grRow = '';
    if (!costSearch && d.group !== lastGroup) {
      lastGroup = d.group;
      grRow = `<tr class="group-row"><td colspan="7">${GROUP_LABEL[d.group]}</td></tr>`;
    }
    const fc = d.fc;
    const recHighlight = d.fc > S.targetFC + 0.10 ? 'style="color:#7a5800;font-weight:800;background:#fffbe6"' : 'style="color:var(--navy);font-weight:700"';
    const actionBtn = d.custom
      ? `<td><button class="btn btn-outline" style="padding:3px 8px;font-size:11px;color:var(--red);border-color:#f4b8c4" onclick="deleteDrink(${d.id})" title="Удалить напиток"><i data-lucide="trash-2" class="icon"></i></button></td>`
      : d.modified
        ? `<td><button class="btn btn-outline" style="padding:3px 8px;font-size:11px;color:var(--muted)" onclick="resetDrink(${d.id})" title="Вернуть исходную рецептуру и цену"><i data-lucide="rotate-ccw" class="icon"></i></button></td>`
        : '<td></td>';
    return grRow + `<tr>
      <td class="fw7" style="cursor:pointer" onclick="openEditDrink(${d.id})">${d.name}${(d.custom||d.modified)?'<i data-lucide="pencil" class="icon" style="margin-left:5px;color:var(--muted)"></i>':''}</td>
      <td class="ta-r">${rub(d.cost)}</td>
      <td>${fcCombinedHtml(fc)}</td>
      <td class="ta-r">
        <input class="inp white" type="number" min="1"
          value="${d.price}"
          onchange="onSalePrice(${d.id},this.value)"> ₽
      </td>
      <td class="ta-r" ${recHighlight}>${rub(d.rec)}${d.fc > S.targetFC + 0.10 ? ' <span title="FC% существенно выше целевого" style="font-size:12px">⚠️</span>' : ''}</td>
      <td class="ta-r num-pos">${rub(d.profit)}</td>
      ${actionBtn}
    </tr>`;
  }).join('');

  const _costEl = document.getElementById('tab-cost');
  const _costScroll = _costEl ? _costEl.scrollTop : 0;
  const _costTableWrap = document.getElementById('cost-table-wrap');
  const _costTableScroll = _costTableWrap ? _costTableWrap.scrollTop : 0;
  _costEl.innerHTML = `
    <div class="page-title">
      <span><i data-lucide="calculator" class="icon"></i> Калькулятор себестоимости</span>
      <button class="btn btn-outline" onclick="openModal('modal-mat')"><i data-lucide="plus" class="icon"></i> Сырьё</button>
    </div>
    <div class="tab-intro">
      <div class="tab-intro-icon"><i data-lucide="calculator" class="icon icon-lg"></i></div>
      <div>
        <div class="tab-intro-title">Что здесь?</div>
        <div class="tab-intro-text">
          Измените цену любого сырья → все напитки пересчитаются мгновенно.
          Измените цену продажи напитка → FC% пересчитается авто.
          <strong>Рекомендуемая цена</strong> — минимальная цена для достижения вашего целевого FC%.
        </div>
        <div class="tab-intro-steps">
          <span class="tab-intro-step">1. Измените цены сырья</span>
          <span class="tab-intro-step">2. Установите целевой FC%</span>
          <span class="tab-intro-step">3. Откорректируйте цены продажи</span>
        </div>
      </div>
    </div>
    <div class="section-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <button class="btn btn-outline" id="mat-toggle-btn" onclick="toggleMatPanel()" style="gap:8px">
          <i data-lucide="banknote" class="icon"></i> Цены на сырьё
          <span style="background:var(--border);border-radius:20px;padding:1px 7px;font-size:11px;font-weight:700">${Object.keys(MAT).length}</span>
          <span id="mat-toggle-arrow" style="font-size:11px;opacity:.5">▼</span>
        </button>
        <button class="btn btn-outline" onclick="openSuppliersList()"><i data-lucide="truck" class="icon"></i> Все поставщики</button>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <span class="fw7" style="color:var(--navy);font-size:13px">Целевой FC%:</span>
        <input class="inp sm" type="number" min="5" max="60" step="1"
          id="cost-target-fc"
          value="${Math.round(S.targetFC*100)}"
          oninput="onTargetFCSilent(this.value)"
          onblur="onTargetFC(this.value)"
          style="width:52px"> <span style="font-size:13px;font-weight:700;color:var(--navy)">%</span>
        <span class="hint" style="margin:0;font-size:12px">Рек. цена = Себест. ÷ ${pct(S.targetFC)}</span>
      </div>
    </div>
    <div id="mat-panel" style="display:none">
      <div class="mat-grid">${matInputs}</div>
    </div>
    <div class="section-title" style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
      <span><i data-lucide="list" class="icon"></i> Таблица напитков</span>
      <div class="search-wrap" style="margin:0;max-width:260px;flex:1">
        <span class="search-icon"><i data-lucide="search" class="icon"></i></span>
        <input class="search-inp" id="cost-search" type="text" placeholder="Поиск по названию..."
          value="${costSearch}" oninput="filterCost(this.value)">
      </div>
    </div>
    <div class="table-wrap" id="cost-table-wrap">
      <table>
        <thead>
          <tr>
            ${thCostSort('name','Напиток','','Название напитка')}
            ${thCostSort('cost','Себест. ₽','ta-r','Сумма затрат на сырьё для одной порции')}
            ${thCostSort('fc','FC%','','Food-cost: значок + % + полоса. 🟢≤25% 🟡26–30% 🔴>30%')}
            <th class="ta-r tip" data-tip="Введите фактическую цену продажи. Нажмите Enter — всё пересчитается">Ваша цена ₽</th>
            ${thCostSort('rec','Рекомендуемая ₽','ta-r','Минимальная цена для целевого FC%. Подсвечена жёлтым, если ваша цена ниже')}
            ${thCostSort('profit','Прибыль ₽','ta-r','Цена − Себестоимость = прибыль с одной порции')}
            <th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
  if (window.lucide) lucide.createIcons();
  if (_costScroll) _costEl.scrollTop = _costScroll;
  const _costTW = document.getElementById('cost-table-wrap');
  if (_costTW && _costTableScroll) _costTW.scrollTop = _costTableScroll;
}

// ════════════════════════════════════════════════════════════════════
//  RENDER — SALES PLAN
// ════════════════════════════════════════════════════════════════════
function renderSales() {
  const drinks = enrich();
  const { totalPort, totRevDay, totPrfDay, totRevMon, totPrfMon } = salesMetrics(drinks);
  const wFC       = totRevMon > 0 ? 1 - totPrfMon / totRevMon : 0;
  const avgChk    = totalPort > 0 ? totRevDay / totalPort : 0;
  const avgPrfCup = totalPort > 0 ? totPrfDay / totalPort : 0;

  const _salesEl = document.getElementById('tab-sales');
  const _salesScroll = _salesEl ? _salesEl.scrollTop : 0;
  const _salesTableWrap = document.getElementById('sales-table-wrap');
  const _salesTableScroll = _salesTableWrap ? _salesTableWrap.scrollTop : 0;
  _salesEl.innerHTML = `
    <div class="page-title">
      <span class="page-title-left"><i data-lucide="shopping-cart" class="icon"></i> Планирование продаж</span>
      <button class="btn btn-outline" onclick="exportSales()">⬇ Скачать CSV</button>
    </div>
    <div class="tab-intro">
      <div class="tab-intro-icon"><i data-lucide="shopping-cart" class="icon icon-lg"></i></div>
      <div>
        <div class="tab-intro-title">План продаж</div>
        <div class="tab-intro-text">
          Укажите среднее количество порций в день для каждого напитка.
          Используйте <strong>пресеты</strong> для быстрого старта или кнопки <strong>масштаба</strong> для корректировки.
          Данные автоматически попадают в <strong>Финмодель</strong>.
        </div>
        <div class="tab-intro-steps">
          <span class="tab-intro-step">1. Выбери пресет или заполни вручную</span>
          <span class="tab-intro-step">2. Скорректируй масштабом ±%</span>
          <span class="tab-intro-step">3. Финмодель пересчитается автоматически</span>
        </div>
      </div>
    </div>
    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:16px;background:var(--gray);border-radius:12px;padding:10px 14px">
      <span style="font-size:12px;font-weight:700;color:var(--muted);white-space:nowrap;margin-right:2px">Пресеты:</span>
      ${Object.entries(SALES_PRESETS).map(([k,p])=>{
        const isActive = S.activePreset === k;
        return `<button class="btn btn-outline" style="font-size:12px;padding:5px 12px;white-space:nowrap${isActive ? ';background:var(--green);color:#fff;border-color:var(--green)' : ''}" onclick="applySalesPreset('${k}')">${p.label}</button>`;
      }).join('')}
      <div style="width:1px;height:24px;background:var(--border);margin:0 4px;flex-shrink:0"></div>
      <span style="font-size:12px;font-weight:700;color:var(--muted);white-space:nowrap">Масштаб:</span>
      <button class="btn btn-outline" style="font-size:12px;padding:5px 12px;color:var(--red);white-space:nowrap" onclick="scaleSalesPortions(0.75)">−25%</button>
      <button class="btn btn-outline" style="font-size:12px;padding:5px 12px;color:var(--red);white-space:nowrap" onclick="scaleSalesPortions(0.90)">−10%</button>
      <button class="btn btn-outline" style="font-size:12px;padding:5px 12px;color:var(--green);white-space:nowrap" onclick="scaleSalesPortions(1.10)">+10%</button>
      <button class="btn btn-outline" style="font-size:12px;padding:5px 12px;color:var(--green);white-space:nowrap" onclick="scaleSalesPortions(1.25)">+25%</button>
    </div>
    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:12px">
      <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
        <span class="fw7" style="color:var(--navy);font-size:13px">Дней в месяце:</span>
        <input class="inp sm" type="number" min="1" max="31"
          value="${S.days}" onchange="onDays(this.value)">
      </div>
      <div class="search-wrap" style="margin-bottom:0;flex:1;min-width:160px;max-width:280px">
        <span class="search-icon"><i data-lucide="search" class="icon"></i></span>
        <input class="search-inp" id="sales-search" type="text" placeholder="Поиск по названию..."
          value="${salesSearch}" oninput="filterSales(this.value)">
      </div>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px">
      <div style="flex:1;min-width:160px;background:var(--light);border:1.5px solid var(--border);border-radius:10px;padding:10px 16px">
        <div style="font-size:11px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px">Выручка / мес</div>
        <div style="font-size:20px;font-weight:800;color:var(--navy)">${rub(totRevMon)}</div>
      </div>
      <div style="flex:1;min-width:160px;background:var(--light);border:1.5px solid var(--green);border-radius:10px;padding:10px 16px">
        <div style="font-size:11px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px">Прибыль / мес</div>
        <div style="font-size:20px;font-weight:800;color:var(--green)">${rub(totPrfMon)}</div>
      </div>
      <div style="flex:0 0 auto;min-width:110px;background:var(--light);border:1.5px solid var(--border);border-radius:10px;padding:10px 16px">
        <div style="font-size:11px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px">Чашек / день</div>
        <div style="font-size:20px;font-weight:800;color:var(--navy)">${int(totalPort)}</div>
      </div>
      <div style="flex:0 0 auto;min-width:110px;background:var(--light);border:1.5px solid ${wFC>0.3?'var(--red)':wFC>0.25?'#b38600':'var(--green)'};border-radius:10px;padding:10px 16px">
        <div style="font-size:11px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px">Food-cost %</div>
        <div style="font-size:20px;font-weight:800;color:${wFC>0.3?'var(--red)':wFC>0.25?'#b38600':'var(--green)'}">${pct(wFC)}</div>
      </div>
      <div style="flex:0 0 auto;min-width:120px;background:var(--light);border:1.5px solid var(--border);border-radius:10px;padding:10px 16px">
        <div style="font-size:11px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px">Средний чек</div>
        <div style="font-size:20px;font-weight:800;color:var(--navy)">${rub(avgChk)}</div>
      </div>
    </div>
    <div class="table-wrap" id="sales-table-wrap">
      <table>
        <thead><tr>
          ${thSalesSort('name','Напиток','','Название напитка')}
          ${thSalesSort('price','Цена ₽','ta-r','Цена продажи гостю')}
          ${thSalesSort('cost','Себест. ₽','ta-r','Сумма затрат на сырьё для одной порции')}
          ${thSalesSort('profit','Прибыль/шт ₽','ta-r','Цена − Себест. = прибыль с одной порции')}
          ${thSalesSort('portions','Порций/день','ta-c','Среднее количество порций в день')}
          ${thSalesSort('revDay','Выручка/день ₽','ta-r','Цена × Порций/день')}
          ${thSalesSort('prfDay','Прибыль/день ₽','ta-r','Прибыль/шт × Порций/день')}
          ${thSalesSort('revMon','Выручка/мес ₽','ta-r','Выручка/день × Дней в месяце')}
          ${thSalesSort('prfMon','Прибыль/мес ₽','ta-r','Прибыль/день × Дней в месяце. Попадает в финмодель')}
          <th class="tip" data-tip="Доля напитка в общей выручке за месяц">Доля</th>
        </tr></thead>
        <tbody></tbody>
        <tfoot style="position:sticky;bottom:0;z-index:2"></tfoot>
      </table>
    </div>
  `;
  filterSales(salesSearch);
  if (_salesScroll) _salesEl.scrollTop = _salesScroll;
  const _salesTW = document.getElementById('sales-table-wrap');
  if (_salesTW && _salesTableScroll) _salesTW.scrollTop = _salesTableScroll;
}

// ════════════════════════════════════════════════════════════════════
//  RENDER — FINANCIAL MODEL
// ════════════════════════════════════════════════════════════════════
function buildBEPChart(cupsMonth, revBEP, avgPrice, avgCost, totalFixed, planCups) {
  const W=600, H=268, PL=70, PR=16, PT=28, PB=52;
  const cw = W-PL-PR, ch = H-PT-PB;
  const dark = document.body.classList.contains('dark');

  const clrRev       = dark ? '#89d185' : '#417033';
  const clrCost      = dark ? '#f48771' : '#d9534f';
  const clrProfit    = dark ? 'rgba(137,209,133,.16)' : 'rgba(65,112,51,.10)';
  const clrLoss      = dark ? 'rgba(244,135,113,.13)' : 'rgba(217,83,79,.08)';
  const clrPlan      = dark ? '#4fc3f7' : '#0077b6';
  const clrBEP       = dark ? '#d7ba7d' : '#b38600';
  const clrGrid      = dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)';
  const clrTxt       = dark ? '#6e7681' : '#9ca3af';
  const clrTxtStrong = dark ? '#aaaaaa' : '#5a6270';
  const clrAxis      = dark ? 'rgba(255,255,255,.14)' : 'rgba(0,0,0,.12)';
  const clrCalloutBg = dark ? '#2a2a2a' : '#ffffff';
  const clrCalloutBorder = dark ? 'rgba(215,186,125,.6)' : 'rgba(179,134,0,.4)';
  const clrPlanCalloutBg = dark ? '#1a2a33' : '#f0f8ff';
  const clrPlanCalloutBorder = dark ? 'rgba(79,195,247,.5)' : 'rgba(0,119,182,.3)';
  const bg           = dark ? '#252526' : '#ffffff';
  const ff = 'system-ui,sans-serif';

  const fmt = v => v >= 1e6 ? (v/1e6).toFixed(1)+'М₽' : v >= 1e3 ? Math.round(v/1e3)+'к₽' : Math.round(v)+'₽';
  const fmtC = v => v >= 1e6 ? (v/1e6).toFixed(1)+'м' : v >= 1e3 ? Math.round(v/1e3)+'к' : Math.round(v);

  const cupsMax = Math.max(cupsMonth * 2.6, planCups * 1.4, 10);
  const yMax    = Math.max(avgPrice * cupsMax, totalFixed + avgCost * cupsMax) * 1.1;

  const cx = c => PL + (c / cupsMax) * cw;
  const cy = v => PT + ch - Math.max(0, Math.min(1, v / yMax)) * ch;

  const rx0 = cx(0), ry0 = cy(0), rxM = cx(cupsMax), ryM = cy(avgPrice * cupsMax);
  const costX0 = cx(0), costY0 = cy(totalFixed), costXM = cx(cupsMax), costYM = cy(totalFixed + avgCost * cupsMax);
  const bx = cx(cupsMonth), by = cy(revBEP);
  const px = planCups > 0 ? cx(planCups) : null;

  const lossPoly = `${cx(0)},${cy(0)} ${bx},${by} ${cx(0)},${cy(totalFixed)}`;
  const profPoly = `${bx},${by} ${rxM},${ryM} ${rxM},${costYM} ${bx},${by}`;

  // Сетка
  const gridLines = [1,2,3,4].map(i => {
    const yv = (yMax / 4) * i;
    return `<line x1="${PL}" y1="${cy(yv)}" x2="${PL+cw}" y2="${cy(yv)}" stroke="${clrGrid}" stroke-width="1"/>`;
  }).join('');
  const vGridLines = [1,2,3,4].map(i => {
    const x = cx((cupsMax / 4) * i);
    return `<line x1="${x}" y1="${PT}" x2="${x}" y2="${PT+ch}" stroke="${clrGrid}" stroke-width="1"/>`;
  }).join('');

  // Подписи Y — с символом ₽
  const yLabels = [0,1,2,3,4].map(i => {
    const v = (yMax / 4) * i;
    return `<text x="${PL-8}" y="${cy(v)+4}" text-anchor="end" font-size="10" font-family="${ff}" fill="${clrTxt}">${fmtC(v)}₽</text>`;
  }).join('');

  // Подписи X
  const xLabels = [0,1,2,3,4].map(i => {
    const v = Math.round((cupsMax / 4) * i);
    return `<text x="${cx(v)}" y="${PT+ch+15}" text-anchor="middle" font-size="10" font-family="${ff}" fill="${clrTxt}">${v}</text>`;
  }).join('');

  // Названия осей
  const yAxisTitle = `<text transform="rotate(-90 14 ${PT+ch/2})" x="14" y="${PT+ch/2+4}" text-anchor="middle" font-size="10" font-family="${ff}" font-weight="600" fill="${clrTxtStrong}">Сумма, ₽</text>`;
  const xAxisTitle = `<text x="${PL+cw/2}" y="${H-4}" text-anchor="middle" font-size="10" font-family="${ff}" font-weight="600" fill="${clrTxtStrong}">Чашек в месяц</text>`;

  // Подписи зон — лёгкий watermark-текст, не перекрывает данные
  const zoneLabels = `
    <text x="${(PL + bx) / 2}" y="${Math.max(PT+16, Math.min(PT+ch-10, (PT+ch+by)/2-6))}" text-anchor="middle"
      font-size="10" font-family="${ff}" font-weight="700" fill="${clrCost}" opacity=".4">УБЫТОК</text>
    <text x="${(bx+PL+cw)/2}" y="${Math.max(PT+16, Math.min(PT+ch-10, (PT+by)/2+14))}" text-anchor="middle"
      font-size="10" font-family="${ff}" font-weight="700" fill="${clrRev}" opacity=".4">ПРИБЫЛЬ</text>
  `;

  // Линия плана — всегда видна, подсказка появляется при наведении
  const planLine = px !== null ? (() => {
    const labelRight = px < PL + cw * 0.75;
    const cX = labelRight ? px + 14 : px - 14;
    const cAnchor = labelRight ? 'start' : 'end';
    const cW = 70, cH = 32;
    const cLeft = labelRight ? cX : cX - cW;
    return `
      <line x1="${px}" y1="${PT}" x2="${px}" y2="${PT+ch}" stroke="${clrPlan}" stroke-width="1.5" stroke-dasharray="5,3" opacity=".8"/>
      <g class="bep-plan-hotspot" style="cursor:pointer">
        <rect x="${px-10}" y="${PT}" width="20" height="${ch}" fill="transparent"/>
        <g class="bep-plan-tip">
          <rect x="${cLeft}" y="${PT+6}" width="${cW}" height="${cH}" rx="5"
            fill="${clrPlanCalloutBg}" stroke="${clrPlanCalloutBorder}" stroke-width="1.5"
            filter="drop-shadow(0 2px 6px rgba(0,0,0,.12))"/>
          <text x="${cLeft + cW/2}" y="${PT+19}" text-anchor="middle" font-size="9" font-family="${ff}" font-weight="700" fill="${clrPlan}">Ваш план</text>
          <text x="${cLeft + cW/2}" y="${PT+31}" text-anchor="middle" font-size="10" font-family="${ff}" font-weight="800" fill="${clrPlan}">${Math.round(planCups)} чаш/мес</text>
        </g>
      </g>
    `;
  })() : '';

  // Точка ТБУ — маркер всегда виден, подсказка появляется при наведении
  const calloutW = 100, calloutH = 52;
  const calloutRight = bx < PL + cw * 0.52;
  const calloutX = calloutRight ? bx + 16 : bx - calloutW - 16;
  const calloutY = Math.max(PT + 4, Math.min(PT + ch - calloutH - 4, by - calloutH/2));
  const connLineX2 = calloutRight ? calloutX : calloutX + calloutW;
  const bepCallout = `
    <line x1="${bx}" y1="${by+7}" x2="${bx}" y2="${PT+ch}" stroke="${clrBEP}" stroke-width="1" stroke-dasharray="3,2" opacity=".45"/>
    <g class="bep-hotspot" style="cursor:pointer">
      <circle cx="${bx}" cy="${by}" r="18" fill="transparent"/>
      <circle cx="${bx}" cy="${by}" r="7" fill="${clrBEP}" stroke="${bg}" stroke-width="2.5"/>
      <circle cx="${bx}" cy="${by}" r="3" fill="${bg}"/>
      <g class="bep-tip">
        <line x1="${bx}" y1="${by}" x2="${connLineX2}" y2="${calloutY + calloutH/2}" stroke="${clrBEP}" stroke-width="1" stroke-dasharray="3,2" opacity=".5"/>
        <rect x="${calloutX}" y="${calloutY}" width="${calloutW}" height="${calloutH}" rx="7"
          fill="${clrCalloutBg}" stroke="${clrCalloutBorder}" stroke-width="1.5"
          filter="drop-shadow(0 3px 8px rgba(0,0,0,.15))"/>
        <text x="${calloutX + calloutW/2}" y="${calloutY + 13}" text-anchor="middle"
          font-size="9" font-family="${ff}" font-weight="800" fill="${clrBEP}">Точка безубыточности</text>
        <line x1="${calloutX+8}" y1="${calloutY+18}" x2="${calloutX+calloutW-8}" y2="${calloutY+18}"
          stroke="${clrBEP}" stroke-width=".5" opacity=".35"/>
        <text x="${calloutX+8}" y="${calloutY+30}" font-size="9" font-family="${ff}" fill="${clrTxtStrong}">Чашек/мес:</text>
        <text x="${calloutX+calloutW-8}" y="${calloutY+30}" text-anchor="end"
          font-size="10" font-family="${ff}" font-weight="700" fill="${clrBEP}">${Math.round(cupsMonth)}</text>
        <text x="${calloutX+8}" y="${calloutY+44}" font-size="9" font-family="${ff}" fill="${clrTxtStrong}">Выручка:</text>
        <text x="${calloutX+calloutW-8}" y="${calloutY+44}" text-anchor="end"
          font-size="10" font-family="${ff}" font-weight="700" fill="${clrBEP}">${fmt(revBEP)}</text>
      </g>
    </g>
  `;

  // Подписи конца линий
  const lineLabels = `
    <text x="${rxM-4}" y="${ryM-7}" text-anchor="end" font-size="9" font-family="${ff}" font-weight="700" fill="${clrRev}">Выручка</text>
    <text x="${costXM-4}" y="${costYM-7}" text-anchor="end" font-size="9" font-family="${ff}" font-weight="700" fill="${clrCost}">Расходы</text>
  `;

  // Легенда снизу по центру
  const legCY = PT + ch + 32;
  const legItems = [
    { type:'line', color:clrRev,  dash:false, label:'Выручка' },
    { type:'line', color:clrCost, dash:true,  label:'Расходы' },
    { type:'rect', color:clrProfit, border:clrRev,  label:'Прибыль' },
    { type:'rect', color:clrLoss,   border:clrCost, label:'Убыток' },
  ];
  const legSpacing = 80, legTotalW = legSpacing * legItems.length - 16;
  const legStart = (W - legTotalW) / 2;
  const legend = legItems.map((item, i) => {
    const lx = legStart + i * legSpacing;
    const icon = item.type === 'line'
      ? `<line x1="${lx}" y1="${legCY}" x2="${lx+16}" y2="${legCY}" stroke="${item.color}" stroke-width="2" ${item.dash?'stroke-dasharray="5,3"':''}/>`
      : `<rect x="${lx}" y="${legCY-5}" width="12" height="8" rx="2" fill="${item.color}" stroke="${item.border}" stroke-width="1"/>`;
    return `${icon}<text x="${lx+20}" y="${legCY+4}" font-size="10" font-family="${ff}" fill="${clrTxtStrong}">${item.label}</text>`;
  }).join('');

  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block;overflow:visible" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <clipPath id="chart-clip"><rect x="${PL}" y="${PT}" width="${cw}" height="${ch}"/></clipPath>
      <linearGradient id="grad-rev" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${clrRev}" stop-opacity=".15"/>
        <stop offset="100%" stop-color="${clrRev}" stop-opacity="0"/>
      </linearGradient>
      <style>
        .bep-tip { visibility: hidden; pointer-events: none; }
        .bep-hotspot:hover .bep-tip { visibility: visible; }
        .bep-plan-tip { visibility: hidden; pointer-events: none; }
        .bep-plan-hotspot:hover .bep-plan-tip { visibility: visible; }
      </style>
    </defs>
    ${yAxisTitle}${xAxisTitle}
    ${gridLines}${vGridLines}
    <g clip-path="url(#chart-clip)">
      <polygon points="${lossPoly}" fill="${clrLoss}"/>
      <polygon points="${profPoly}" fill="${clrProfit}"/>
      <polygon points="${rx0},${ry0} ${rxM},${ryM} ${rxM},${PT+ch} ${rx0},${PT+ch}" fill="url(#grad-rev)" opacity=".7"/>
      <line x1="${rx0}" y1="${ry0}" x2="${rxM}" y2="${ryM}" stroke="${clrRev}" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="${costX0}" y1="${costY0}" x2="${costXM}" y2="${costYM}" stroke="${clrCost}" stroke-width="2" stroke-dasharray="7,4" stroke-linecap="round"/>
      ${zoneLabels}
    </g>
    ${planLine}
    <line x1="${PL}" y1="${PT}" x2="${PL}" y2="${PT+ch}" stroke="${clrAxis}" stroke-width="1.5"/>
    <line x1="${PL}" y1="${PT+ch}" x2="${PL+cw}" y2="${PT+ch}" stroke="${clrAxis}" stroke-width="1.5"/>
    ${yLabels}${xLabels}
    ${lineLabels}
    ${bepCallout}
    ${legend}
  </svg>`;
}
function onWhatIf(v) {
  const shift = parseInt(v);
  const el = document.getElementById('whatif-pct');
  if (el) el.textContent = (shift >= 0 ? '+' : '') + shift + '%';
  const res = document.getElementById('whatif-result');
  if (!res) return;
  const mult = 1 + shift / 100;
  const drinks = enrich();
  const bepBase = bepCalc(drinks);
  const totalFixed = bepBase.totalFixed;
  const taxMode = S.taxMode || 'none';
  function calcTax(rev, varC, fixed) {
    if (taxMode === 'usn6')  return rev * 0.06;
    if (taxMode === 'usn15') return Math.max(0, (rev - varC - fixed) * 0.15);
    return 0;
  }
  const totRev2 = drinks.reduce((s,d) => s + S.salePrices[d.id] * mult * S.portions[d.id], 0) * S.days;
  const varCosts2 = drinks.reduce((s,d) => s + d.cost * S.portions[d.id], 0) * S.days;
  const net2 = totRev2 - varCosts2 - totalFixed - calcTax(totRev2, varCosts2, totalFixed);
  const avgPrice2 = drinks.length > 0 ? totRev2 / (drinks.reduce((s,d)=>s+S.portions[d.id],0)*S.days||1) : 0;
  const newFC = totRev2 > 0 ? varCosts2 / totRev2 : 0;
  const newBEP = (1 - newFC) > 0 ? totalFixed / (1 - newFC) : 0;
  const netClr = net2 >= 0 ? 'var(--green)' : 'var(--red)';
  res.innerHTML = [
    `<div style="flex:1;min-width:130px;background:var(--gray);border-radius:9px;padding:10px 13px">
      <div style="font-size:10px;font-weight:700;color:var(--muted);margin-bottom:3px">Средний чек</div>
      <div style="font-weight:800;font-size:17px">${rub(avgPrice2)}</div></div>`,
    `<div style="flex:1;min-width:130px;background:var(--gray);border-radius:9px;padding:10px 13px">
      <div style="font-size:10px;font-weight:700;color:var(--muted);margin-bottom:3px">FC%</div>
      <div style="font-weight:800;font-size:17px">${pct(newFC)}</div></div>`,
    `<div style="flex:1;min-width:130px;background:var(--gray);border-radius:9px;padding:10px 13px">
      <div style="font-size:10px;font-weight:700;color:var(--muted);margin-bottom:3px">Выручка ТБУ</div>
      <div style="font-weight:800;font-size:17px">${rub(newBEP)}</div></div>`,
    `<div style="flex:1;min-width:130px;background:var(--gray);border-radius:9px;padding:10px 13px">
      <div style="font-size:10px;font-weight:700;color:var(--muted);margin-bottom:3px">Чистая прибыль</div>
      <div style="font-weight:800;font-size:17px;color:${netClr}">${rub(net2)}</div></div>`,
  ].join('');
}

function renderFinModel() {
  // Удалить дублирующие статьи ФОТ бариста/смены и Налоги и взносы (они уже отражены в калькуляторе ФОТ)
  const dupPattern = /фот.*(бариста|смен)|налоги\s*(и|&)\s*взносы/i;
  const hadDups = S.fixedCosts.some(c => dupPattern.test(c.name));
  if (hadDups) {
    S.fixedCosts = S.fixedCosts.filter(c => !dupPattern.test(c.name));
    saveState();
  }

  const drinks = enrich();
  const bep = bepCalc(drinks);
  const { avgCost, avgPrice, avgProfit, avgFC } = weightedMetrics(drinks);
  const { totalPort, totRevMon, totPrfMon } = salesMetrics(drinks);
  const totalFixed = bep.totalFixed;
  const varCostsMon = drinks.reduce((s,d) => s + d.cost * S.portions[d.id], 0) * S.days;
  const taxMode = S.taxMode || 'none';

  function calcTax(rev, varC, fixed) {
    if (taxMode === 'usn6')  return rev * 0.06;
    if (taxMode === 'usn15') return Math.max(0, (rev - varC - fixed) * 0.15);
    return 0;
  }
  const TAX_LABELS = { none:'Без налога', usn6:'УСН 6%', usn15:'УСН 15%' };

  // Запас прочности
  const safetyAbs    = totRevMon - bep.revBEP;
  const safetyPct    = totRevMon > 0 ? safetyAbs / totRevMon * 100 : 0;
  const bepProgress  = bep.revBEP > 0 ? Math.min(totRevMon / bep.revBEP * 100, 100) : 100;
  const bepPClr      = bepProgress >= 100 ? 'var(--green)' : bepProgress >= 70 ? '#b38600' : 'var(--red)';
  const safetyCls    = safetyAbs >= 0 ? 'num-pos' : 'num-neg';

  // Окупаемость — вычислим через те же составляющие что и P&L
  // (переменные статьи из fixedCosts + только постоянные + ФОТ + налог)
  const _fcOnly    = S.fixedCosts.filter(c=>!c.isVariable).reduce((s,c)=>s+c.value,0);
  const _varExtra  = S.fixedCosts.filter(c=>c.isVariable).reduce((s,c)=>s+c.value,0);
  const _fotAmt    = S.fixedCosts.some(c=>/фот|зарплат|зп|оплата.?труда/i.test(c.name)) ? 0 : (typeof payrollTotal==='function'?payrollTotal():0);
  const _ebit      = (totRevMon - varCostsMon - _varExtra) - _fcOnly - _fotAmt;
  const _tax       = calcTax(totRevMon, varCostsMon + _varExtra, _fcOnly + _fotAmt);
  const baseNet    = _ebit - _tax;
  const investment = S.investment || 0;
  const paybackMon = investment > 0 && baseNet > 0 ? (investment / baseNet) : null;

  const costInputs = S.fixedCosts.map((c,i) => `
    <div class="cost-item">
      <button class="cost-del-btn" onclick="delFixedCost(${i})" title="Удалить"><i data-lucide="x" class="icon" style="width:12px;height:12px"></i></button>
      <input class="inp-name" type="text"
        value="${c.name.replace(/"/g,'&quot;')}"
        onfocus="this.style.borderColor='var(--green)';this.style.background='var(--light)'"
        onblur="this.style.borderColor='transparent';this.style.background='transparent'"
        onchange="onFixedCostName(${i},this.value)">
      <div class="inp-amount-wrap">
        <input class="inp md" type="number" min="0" step="1000"
          value="${c.value}" onchange="onFixedCost(${i},this.value)">
        <span style="font-size:12px;color:var(--muted)">₽</span>
      </div>
      <label class="cost-var-label" title="Переменная статья: в сценариях масштабируется с объёмом">
        <input type="checkbox" ${c.isVariable?'checked':''} onchange="onFixedCostVariable(${i},this.checked)">
        <span>перем.</span>
      </label>
    </div>
  `).join('');

  const varFixed  = S.fixedCosts.filter(c=>c.isVariable).reduce((s,c)=>s+c.value,0);
  const pureFixed  = totalFixed - varFixed;

  const SCEN = [
    { name:'Пессимистичный', mult:0.5,  cls:'pess', icon:'trending-down' },
    { name:'Базовый план',   mult:1.0,  cls:'base', icon:'bar-chart-2' },
    { name:'Оптимистичный',  mult:2.0,  cls:'opt',  icon:'trending-up' },
  ];

  const scenarioCards = SCEN.map(sc => {
    const revMon  = totRevMon * sc.mult;
    const varMon  = varCostsMon * sc.mult;
    const fixed   = pureFixed + varFixed * sc.mult; // переменные расходы масштабируются
    const margin  = revMon - varMon;
    const tax     = calcTax(revMon, varMon, fixed);
    const net     = margin - fixed - tax;
    const cups    = Math.round(totalPort * sc.mult);
    const fcW     = revMon > 0 ? varMon / revMon : 0;
    const rentab  = revMon > 0 ? net / revMon * 100 : 0;
    const profCls = net >= 0 ? 'profit-pos' : 'profit-neg';
    const netIcon = net >= 0
      ? `<i data-lucide="check-circle" class="icon" style="width:18px;height:18px"></i>`
      : `<i data-lucide="x-circle" class="icon" style="width:18px;height:18px"></i>`;
    const fixedNote = varFixed > 0 ? ` <span style="font-size:10px;opacity:.6">(перем: ${rub(varFixed*sc.mult)})</span>` : '';
    return `
      <div class="scenario-card sc-${sc.cls}">
        <div class="sc-title"><i data-lucide="${sc.icon}" class="icon"></i> ${sc.name} <span style="font-size:11px;opacity:.6">×${sc.mult}</span></div>
        <div class="sc-row"><span data-tip="Количество чашек в день&#10;из плана умноженное на ${sc.mult}">Чашек/день</span><span class="sv">${int(cups)}</span></div>
        <div class="sc-row"><span data-tip="Общая выручка за месяц&#10;= чашек/день × средний чек × дни">Выручка/мес</span><span class="sv">${rub(revMon)}</span></div>
        <div class="sc-row"><span data-tip="Стоимость сырья за месяц&#10;(ингредиенты + потери при приготовке)">Себест. сырья</span><span class="sv">${rub(varMon)}</span></div>
        <div class="sc-row"><span data-tip="Food Cost % — доля себестоимости сырья в выручке&#10;Норма для HoReCa: 20–28%">FC%</span><span class="sv">${pct(fcW)}</span></div>
        <div class="sc-row"><span data-tip="Выручка минус себестоимость сырья.&#10;Из этого покрываются пост. расходы и формируется прибыль.">Маржа</span><span class="sv">${rub(margin)}</span></div>
        <div class="sc-row"><span data-tip="Постоянные расходы не зависят от объёма продаж.&#10;Аренда, ФОТ, амортизация..">Пост. расходы</span><span class="sv">${rub(fixed)}${fixedNote}</span></div>
        ${tax > 0 ? `<div class="sc-row"><span>Налог (${TAX_LABELS[taxMode]})</span><span class="sv">${rub(tax)}</span></div>` : ''}
        <div class="sc-row" style="opacity:.65;font-size:11px"><span data-tip="Чистая прибыль ÷ выручка × 100.&#10;Норма для кофейни: 10–20%">Рентабельность</span><span>${rentab.toFixed(1)}%</span></div>
        <div class="sc-profit ${profCls}">${netIcon} ${rub(net)}</div>
      </div>
    `;
  }).join('');

  // Бенчмарк FC%
  const fcBench = avgFC <= 0.20 ? { lbl:'отлично', clr:'var(--green)' }
                : avgFC <= 0.28 ? { lbl:'норма HoReCa', clr:'var(--green)' }
                : avgFC <= 0.33 ? { lbl:'выше нормы', clr:'#b38600' }
                :                 { lbl:'критически высоко', clr:'var(--red)' };
  // Формула ТБУ
  const bepFormula = avgPrice > 0
    ? `Формула: ${rub(totalFixed)} ÷ (${rub(avgPrice)} − ${rub(avgCost)}) = ${int(bep.cupsMonth)} чашек/мес`
    : '';
  // P&L строки
  // Разделяем fixedCosts на постоянные и переменные
  const fixedOnlyCosts    = S.fixedCosts.filter(c => !c.isVariable);
  const variableExtraCosts = S.fixedCosts.filter(c => c.isVariable);
  const fixedOnlyTotal    = fixedOnlyCosts.reduce((s,c) => s+c.value, 0);
  const variableExtraTotal = variableExtraCosts.reduce((s,c) => s+c.value, 0);
  // ФОТ из калькулятора (объявляем заранее, чтобы использовать в gross/ebit)
  const payrollTotVal2 = payrollTotal();
  const fotInFixed2 = S.fixedCosts.some(c => /фот|зарплат|зп|оплата.?труда/i.test(c.name));
  const fotAmount = fotInFixed2 ? 0 : payrollTotVal2;
  // Итого переменные расходы (сырьё + переменные статьи из списка расходов)
  const totalVarCosts = varCostsMon + variableExtraTotal;
  const gross   = totRevMon - varCostsMon;          // Валовая прибыль = Выручка − себестоимость сырья
  const grossAdj = gross - variableExtraTotal;       // После вычета переменных операц. расходов
  const ebit    = grossAdj - fixedOnlyTotal - fotAmount;
  const taxBase = calcTax(totRevMon, totalVarCosts, fixedOnlyTotal + fotAmount);

  const mkRow = (r) => {
    const pctFmt = r.pct100 ? '100%' : r.pct != null ? (r.pct*100).toFixed(1)+'%' : '';
    const clr    = r.val < 0 ? 'color:var(--red)' : r.accent ? (baseNet>=0?'color:var(--navy)':'color:var(--red)') : '';
    const fw     = r.bold ? 'font-weight:800' : '';
    const bg     = r.bold ? 'background:var(--gray)' : r.sub ? 'background:var(--light)' : '';
    const indent = r.sub ? 'padding:7px 14px 7px 32px;font-size:12px;color:var(--muted)' : `padding:9px 14px;${fw}`;
    return `<tr style="${bg};border-bottom:1px solid var(--border)">
      <td style="${indent}" ${r.tip?`data-tip="${r.tip}"`:''}>${r.lbl}</td>
      <td style="padding:9px 14px;text-align:right;${fw};${clr};${r.sub?'font-size:12px':''}">${rub(r.val)}</td>
      <td style="padding:9px 14px;text-align:right;font-size:11px;opacity:.65;${clr}">${pctFmt}</td>
    </tr>`;
  };

  // Строка ФОТ из калькулятора (если не дублируется в fixedCosts)
  const payrollDetailRow = (payrollTotVal2 > 0 && !fotInFixed2)
    ? [mkRow({ lbl:'· ФОТ (из калькулятора)', val:-payrollTotVal2, pct:totRevMon>0?payrollTotVal2/totRevMon:0, sub:true, tip:'Итого нагрузка на работодателя из калькулятора ФОТ — учитывается автоматически' })]
    : [];

  // Строки расшифровки: только постоянные
  const fixedDetailRows = fixedOnlyCosts.map(c => mkRow({
    lbl: `· ${c.name}`,
    val: -c.value,
    pct: totRevMon > 0 ? c.value / totRevMon : 0,
    sub: true,
  }));

  // Строки расшифровки: переменные статьи из раздела расходов
  const varExtraDetailRows = variableExtraCosts.map(c => mkRow({
    lbl: `· ${c.name}`,
    val: -c.value,
    pct: totRevMon > 0 ? c.value / totRevMon : 0,
    sub: true,
    tip: 'Переменная статья (отмечена как «перем.»)',
  }));

  const plRows = [
    mkRow({ lbl:'Выручка от продаж',          val: totRevMon,            pct100:true, tip:'Цена × порции × дни' }),
    mkRow({ lbl:'− Себестоимость сырья',       val:-varCostsMon,          pct:varCostsMon/totRevMon, tip:'FC% — доля себестоимости напитков в выручке' }),
    mkRow({ lbl:'Валовая прибыль',             val: gross,                pct:gross/totRevMon, bold:true, tip:'Выручка − себестоимость сырья' }),
    ...(variableExtraCosts.length > 0 ? [
      mkRow({ lbl:'− Переменные операц. расходы', val:-variableExtraTotal, pct:variableExtraTotal/totRevMon, bold:false, tip:'Статьи, отмеченные как «перем.» — растут вместе с трафиком' }),
      ...varExtraDetailRows,
    ] : []),
    mkRow({ lbl:'− Постоянные расходы',        val:-(fixedOnlyTotal + fotAmount), pct:(fixedOnlyTotal + fotAmount)/totRevMon, bold:false, tip:'Статьи без галочки «перем.»' }),
    ...fixedDetailRows,
    ...payrollDetailRow,
    mkRow({ lbl:'EBIT (операц. прибыль)',      val: ebit,                 pct:ebit/totRevMon, bold:true, tip:'Прибыль до уплаты налогов' }),
    ...(taxBase > 0 ? [mkRow({ lbl:`− Налог (${TAX_LABELS[taxMode]})`, val:-taxBase, pct:taxBase/totRevMon, tip:'Налоговый режим: ' + TAX_LABELS[taxMode] })] : []),
    mkRow({ lbl:'Чистая прибыль',              val: baseNet,              pct:baseNet/totRevMon, bold:true, accent:true, tip:'EBIT − налог' }),
  ].join('');

  // Предупреждения
  const warnings = [];
  const zeroDrinks = DRINKS.filter(d => !(S.portions[d.id] > 0));
  if (zeroDrinks.length > DRINKS.length * 0.3) {
    warnings.push(`<div class="fin-warn fin-warn-orange"><i data-lucide="alert-triangle" class="icon"></i> ${zeroDrinks.length} напитков без порций/день — не учтены в ТБУ и выручке. <a class="fin-warn-link" onclick="switchTab('sales')">Заполнить план продаж</a></div>`);
  }
  if (S.fixedCosts.length < 3) {
    warnings.push(`<div class="fin-warn fin-warn-info"><i data-lucide="info" class="icon"></i> Указано только ${S.fixedCosts.length} статьи расходов. Добавьте аренду, коммуналку, ФОТ — окупаемость будет посчитана неточно.</div>`);
  }
  const warningsBanner = warnings.length ? `<div class="fin-warnings">${warnings.join('')}</div>` : '';

  document.getElementById('tab-finmodel').innerHTML = `
    <div class="page-title"><span class="page-title-left"><i data-lucide="banknote" class="icon"></i> Финансовая модель</span></div>
    <div class="tab-intro">
      <div class="tab-intro-icon"><i data-lucide="banknote" class="icon icon-lg"></i></div>
      <div>
        <div class="tab-intro-title">Что здесь?</div>
        <div class="tab-intro-text">
          Показывает точку безубыточности и три сценария на основе вашего <strong>реального плана продаж</strong>.
          Заполните исходные данные — сразу увидите P&amp;L, ТБУ и прогноз на год.
        </div>
        <div class="tab-intro-steps">
          <span class="tab-intro-step">1. Введите расходы и ФОТ</span>
          <span class="tab-intro-step">2. Смотрите P&amp;L и ТБУ</span>
          <span class="tab-intro-step">3. Смоделируйте сценарии</span>
          <span class="tab-intro-step">4. Прогноз на 12 месяцев</span>
        </div>
      </div>
    </div>

    <!-- ───────────────────────────────────────────── БЛОК 1: ИСХОДНЫЕ ДАННЫЕ -->
    <div class="finblock-hd finblock-hd-1">
      <span class="finblock-num">1</span>
      <i data-lucide="database" class="icon"></i> Исходные данные
    </div>

    <div class="section-title"><i data-lucide="pin" class="icon"></i> Постоянные расходы (₽/мес)</div>
    <div class="hint" style="margin-bottom:12px">
      <i data-lucide="info" class="icon"></i>
      Введите расходы, которые платите каждый месяц независимо от объёма продаж: аренда, коммуналка, интернет, амортизация.
      <br><br>
      <strong>Галочка «перем.»</strong> — отмечайте расходы, которые <em>растут вместе с трафиком</em>: расходники, комиссия агрегаторов и т.п.
      Такие статьи будут масштабироваться в <strong>сценариях</strong> (×0.5 / ×2.0) и на <strong>графике сезонности</strong> —
      в слабые месяцы они уменьшатся, в сильные вырастут. На базовый план и ТБУ галочка не влияет.
    </div>
    <div class="costs-grid">${costInputs}</div>
    <button class="btn btn-outline" style="margin:4px 0 16px;font-size:13px;display:inline-flex;align-items:center;gap:5px" onclick="addFixedCost()">
      <i data-lucide="plus" class="icon"></i> Добавить статью
    </button>
    <div class="panel-dark" style="margin-bottom:20px">
      <div class="pd-label">ИТОГО постоянные расходы</div>
      <div class="pd-value">${rub(totalFixed)}</div>
    </div>

    <div style="display:flex;flex-wrap:wrap;gap:14px;align-items:stretch;margin-bottom:24px">
      <div class="fin-param-card">
        <div class="fin-param-label" data-tip="УСН 6% — налог со всей выручки.&#10;УСН 15% — налог с (доходы − расходы).&#10;Выберите свой режим налогообложения."><i data-lucide="receipt" class="icon"></i> Режим налогообложения</div>
        <select class="modal-select" style="width:100%;font-size:13px" onchange="onTaxMode(this.value)">
          <option value="none"  ${taxMode==='none'  ?'selected':''}>Без налога</option>
          <option value="usn6"  ${taxMode==='usn6'  ?'selected':''}>УСН 6% — доходы</option>
          <option value="usn15" ${taxMode==='usn15' ?'selected':''}>УСН 15% — доходы − расходы</option>
        </select>
      </div>
      <div class="fin-param-card">
        <div class="fin-param-label" data-tip="Сумма денег, вложенных в запуск:&#10;оборудование, ремонт, первый депозит...&#10;Срок окупаемости = инвестиции ÷ чистая прибыль."><i data-lucide="landmark" class="icon"></i> Стартовые вложения, ₽</div>
        <div style="display:flex;align-items:center;gap:6px">
          <input class="inp" type="number" min="0" step="50000" style="flex:1;text-align:right"
            value="${investment}" onchange="onInvestment(this.value)" placeholder="0">
          <span style="font-size:12px;color:var(--muted)">₽</span>
        </div>
        ${paybackMon !== null
          ? `<div style="font-size:12px;margin-top:4px"><i data-lucide="clock" class="icon"></i> Окупаемость: <strong style="color:var(--navy)">${paybackMon.toFixed(1)} мес.</strong></div>`
          : investment > 0 && baseNet <= 0
            ? `<div style="font-size:12px;margin-top:4px;color:var(--red)"><i data-lucide="alert-circle" class="icon"></i> Убыток — окупаемости нет</div>`
            : `<div style="font-size:12px;margin-top:4px;color:var(--muted)">Введите сумму инвестиций</div>`
        }
      </div>
    </div>

    <div class="section-title" style="display:flex;align-items:center;justify-content:space-between"><span><i data-lucide="users" class="icon"></i> Калькулятор ФОТ <span style="font-size:12px;font-weight:500;color:var(--muted);margin-left:6px">фонд оплаты труда</span></span><button class="btn btn-outline" style="font-size:12px;padding:5px 12px" onclick="addPayrollPosition()"><i data-lucide="plus" class="icon"></i> Добавить должность</button></div>
    <div class="panel" style="padding:0;margin-bottom:8px;overflow:hidden">
      <div class="payroll-table-wrap">
        <table class="payroll-table">
          <colgroup>
            <col style="min-width:120px">
            <col style="width:82px">
            <col style="width:78px">
            <col style="width:78px">
            <col style="width:62px">
            <col style="width:128px">
            <col style="width:96px">
            <col style="width:80px">
            <col style="width:36px">
          </colgroup>
          <thead>
            <tr>
              <th>Должность</th>
              <th class="ta-r">Ставка ₽/ч</th>
              <th class="ta-r">Час/см.</th>
              <th class="ta-r">Смен/мес</th>
              <th class="ta-r">Кол.</th>
              <th>Оформление</th>
              <th class="ta-r">Налоги/взносы</th>
              <th class="ta-r">Итого/мес</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${(S.payrollPositions||[]).map(p => {
              const c = calcPositionCosts(p);
              const type = p.empType || 'black';
              const sel = ['white','grey','black'].map(t =>
                `<option value="${t}"${type===t?' selected':''}>${EMP_TYPE_LABELS[t]}</option>`
              ).join('');
              return `<tr>
                <td><input class="inp payroll-inp-name" id="pr-name-${p.id}" type="text" value="${p.name}" oninput="onPayrollPos(${p.id},'name',this.value)"></td>
                <td><input class="inp payroll-inp" id="pr-rate-${p.id}" type="number" min="0" step="10" value="${p.rate}" oninput="onPayrollPos(${p.id},'rate',this.value)" onchange="renderFinModel();if(window.lucide)lucide.createIcons()"></td>
                <td><input class="inp payroll-inp" id="pr-hours-${p.id}" type="number" min="0" max="24" step="1" value="${p.hours}" oninput="onPayrollPos(${p.id},'hours',this.value)" onchange="renderFinModel();if(window.lucide)lucide.createIcons()"></td>
                <td><input class="inp payroll-inp" id="pr-shifts-${p.id}" type="number" min="0" step="1" value="${p.shifts}" oninput="onPayrollPos(${p.id},'shifts',this.value)" onchange="renderFinModel();if(window.lucide)lucide.createIcons()"></td>
                <td><input class="inp payroll-inp" id="pr-count-${p.id}" type="number" min="1" step="1" value="${p.count}" oninput="onPayrollPos(${p.id},'count',this.value)" onchange="renderFinModel();if(window.lucide)lucide.createIcons()"></td>
                <td>
                  <select class="payroll-emp-select" title="${empTypeTip(type)}" onchange="onPayrollPos(${p.id},'empType',this.value)" data-emptype="${type}">
                    ${sel}
                  </select>
                </td>
                <td class="ta-r payroll-tax-cell" id="pr-tax-${p.id}" title="${empTypeTip(type)}">${c.taxes>0?'+'+rub(c.taxes):'—'}</td>
                <td class="ta-r fw7" id="pr-total-${p.id}">${rub(c.total)}</td>
                <td><button class="mat-del" onclick="deletePayrollPosition(${p.id})" title="Удалить"><i data-lucide="trash-2" class="icon"></i></button></td>
              </tr>`;
            }).join('')}
          </tbody>
          <tfoot>
            <tr class="payroll-total-row">
              <td colspan="6">ИТОГО ФОТ / месяц</td>
              <td class="ta-r" id="pr-sum-taxes-tfoot">${rub(payrollTotals().taxes)}</td>
              <td class="ta-r" id="payroll-grand-total">${rub(payrollTotals().total)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div class="payroll-summary">
        <div class="payroll-sum-item">
          <div class="payroll-sum-label">Выплата сотрудникам</div>
          <div class="payroll-sum-val" id="pr-sum-employee">${rub(payrollTotals().toEmployee)}</div>
        </div>
        <div class="payroll-sum-sep">⊕</div>
        <div class="payroll-sum-item">
          <div class="payroll-sum-label">Налоги и взносы</div>
          <div class="payroll-sum-val tax-color" id="pr-sum-taxes">${rub(payrollTotals().taxes)}</div>
        </div>
        <div class="payroll-sum-sep">=</div>
        <div class="payroll-sum-item payroll-sum-total">
          <div class="payroll-sum-label">Нагрузка на работодателя</div>
          <div class="payroll-sum-val">${rub(payrollTotals().total)}</div>
        </div>
      </div>
      ${totRevMon > 0 ? (() => {
        const fotPct = payrollTotals().total / totRevMon * 100;
        const fotClr = fotPct < 25 ? 'var(--green)' : fotPct <= 35 ? '#b38600' : 'var(--red)';
        return `<div class="payroll-bench">
          <i data-lucide="info" class="icon" style="width:13px;height:13px"></i>
          ФОТ % от выручки:&nbsp;<strong style="color:${fotClr}">${fotPct.toFixed(1)}%</strong>
          <span class="payroll-bench-norm">норма HoReCa: 25–35%</span>
        </div>`;
      })() : ''}
      <div style="display:flex;justify-content:flex-end;align-items:center;padding:10px 14px;border-top:1px solid var(--border)">
        <span style="font-size:11px;color:var(--muted);font-style:italic"><i data-lucide="check-circle" class="icon" style="width:12px;height:12px;color:var(--green)"></i> ФОТ учитывается в расчётах автоматически</span>
      </div>
    </div>
    <!-- Настройки налогообложения ФОТ -->
    <div class="pts-wrap" style="margin-bottom:20px">
      <button class="pts-toggle" onclick="togglePayrollSettings()">
        <i data-lucide="settings-2" class="icon"></i>
        Настройки налогообложения
        <span class="pts-toggle-hint">МРОТ, НДФЛ, взносы</span>
        <i data-lucide="${S.payrollSettingsOpen?'chevron-up':'chevron-down'}" class="icon" style="margin-left:auto"></i>
      </button>
      ${S.payrollSettingsOpen ? `
      <div class="pts-body">
        <div class="pts-schemes">
          <div class="pts-scheme pts-scheme-white">
            <div class="pts-scheme-head"><span class="pts-dot" style="background:var(--green)"></span>Официально (белая)</div>
            <div class="pts-scheme-desc">Трудовой договор, официальный расчётный листок. Ставка в калькуляторе = начисленная зарплата (гросс).</div>
            <div class="pts-scheme-formula">
              <div>На руки: ставка − НДФЛ&nbsp;<strong>${PS().ndfl}%</strong></div>
              <div>Взносы: ставка × <strong>${PS().ins}%</strong> (платит работодатель)</div>
              <div>Расходы работодателя: ставка × ${(1 + PS().ins/100).toFixed(2)}</div>
            </div>
          </div>
          <div class="pts-scheme pts-scheme-grey">
            <div class="pts-scheme-head"><span class="pts-dot" style="background:#e6a817"></span>Серая схема (МРОТ + кэш)</div>
            <div class="pts-scheme-desc">Официально оформляется только МРОТ. Налоги платятся только с него. Остаток выдаётся наличными.</div>
            <div class="pts-scheme-formula">
              <div>Офиц. часть: МРОТ (${PS().mrot.toLocaleString('ru')} ₽) × кол-во</div>
              <div>Налоги: с МРОТ × (НДФЛ ${PS().ndfl}% + взносы ${PS().ins}%)</div>
              <div>Кэш: ставка − МРОТ × кол-во (без налогов)</div>
            </div>
          </div>
          <div class="pts-scheme pts-scheme-black">
            <div class="pts-scheme-head"><span class="pts-dot" style="background:var(--muted)"></span>Неофициально (чёрная)</div>
            <div class="pts-scheme-desc">Вся сумма выдаётся наличными. Никаких отчислений. Расходы = выплате сотруднику.</div>
            <div class="pts-scheme-formula">
              <div>На руки: вся ставка</div>
              <div>Налоги: 0 ₽</div>
            </div>
          </div>
        </div>
        <div class="pts-rates">
          <div class="pts-rate-group">
            <label class="pts-rate-label">МРОТ (ваш регион), ₽
              <span class="pts-rate-hint">Федеральный — 22 440 ₽. В регионах может быть ниже.</span>
            </label>
            <input class="inp" type="number" min="0" step="100" value="${PS().mrot}" oninput="onPayrollSetting('mrot',this.value)" style="max-width:160px;text-align:right">
          </div>
          <div class="pts-rate-group">
            <label class="pts-rate-label">НДФЛ, %
              <span class="pts-rate-hint">Стандартная ставка — 13%. С 2025 г. при доходе от 2.4 млн — 15%.</span>
            </label>
            <input class="inp" type="number" min="0" max="50" step="0.1" value="${PS().ndfl}" oninput="onPayrollSetting('ndfl',this.value)" style="max-width:120px;text-align:right">
          </div>
          <div class="pts-rate-group">
            <label class="pts-rate-label">Страховые взносы, %
              <span class="pts-rate-hint">Стандарт — 30%. Для МСП с зарплат свыше МРОТ — 15% (льготный тариф).</span>
            </label>
            <input class="inp" type="number" min="0" max="100" step="0.1" value="${PS().ins}" oninput="onPayrollSetting('ins',this.value)" style="max-width:120px;text-align:right">
          </div>
        </div>
      </div>
      ` : ''}
    </div>

    <!-- ───────────────────────────────────────────── БЛОК 2: РЕЗУЛЬТАТЫ -->
    <div class="finblock-hd finblock-hd-2">
      <span class="finblock-num">2</span>
      <i data-lucide="trending-up" class="icon"></i> Результаты
    </div>

    ${warningsBanner}

    <div class="section-title" style="margin-top:8px"><i data-lucide="file-text" class="icon"></i> P&amp;L — Отчёт о прибылях и убытках <span style="font-size:12px;font-weight:500;color:var(--muted);margin-left:4px">(базовый план)</span></div>
    <div class="panel" style="padding:0;overflow:hidden;margin-bottom:24px">
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead><tr style="background:var(--gray)">
          <th style="padding:10px 14px;text-align:left;font-weight:700">Статья</th>
          <th style="padding:10px 14px;text-align:right;font-weight:700">Сумма / мес</th>
          <th style="padding:10px 14px;text-align:right;font-weight:700">%</th>
        </tr></thead>
        <tbody>${plRows}</tbody>
      </table>
    </div>



    <!-- ───────────────────────────────────────────── БЛОК 3: МОДЕЛИРОВАНИЕ -->
    <div class="finblock-hd finblock-hd-3">
      <span class="finblock-num">3</span>
      <i data-lucide="sliders" class="icon"></i> Моделирование
    </div>

    <div class="section-title"><i data-lucide="sliders" class="icon"></i> Pricing wizard — «А что если?» <span style="font-size:12px;font-weight:500;color:var(--muted);margin-left:6px">смоделируйте изменение цен и трафика</span></div>
    <div class="panel" style="padding:16px 18px;margin-bottom:24px">
      <div class="whatif-grid">
        <div class="whatif-slider">
          <div class="whatif-slider-head">
            <span><i data-lucide="tag" class="icon" style="color:var(--green)"></i> <strong>Цены продажи</strong></span>
            <strong id="wif-price-val" style="color:var(--navy)">${(_wif.price>=0?'+':'')+_wif.price}%</strong>
          </div>
          <input type="range" id="wif-price" min="-50" max="50" step="1" value="${_wif.price}" oninput="onWhatIf3('price',this.value)">
          <div class="whatif-marks"><span>−50%</span><span>0</span><span>+50%</span></div>
        </div>
        <div class="whatif-slider">
          <div class="whatif-slider-head">
            <span><i data-lucide="package" class="icon" style="color:#b38600"></i> <strong>Цены сырья</strong></span>
            <strong id="wif-cost-val" style="color:var(--navy)">${(_wif.cost>=0?'+':'')+_wif.cost}%</strong>
          </div>
          <input type="range" id="wif-cost" min="-50" max="50" step="1" value="${_wif.cost}" oninput="onWhatIf3('cost',this.value)">
          <div class="whatif-marks"><span>−50%</span><span>0</span><span>+50%</span></div>
        </div>
        <div class="whatif-slider">
          <div class="whatif-slider-head">
            <span><i data-lucide="users" class="icon" style="color:var(--red)"></i> <strong>Трафик / порции</strong></span>
            <strong id="wif-traffic-val" style="color:var(--navy)">${(_wif.traffic>=0?'+':'')+_wif.traffic}%</strong>
          </div>
          <input type="range" id="wif-traffic" min="-50" max="50" step="5" value="${_wif.traffic}" oninput="onWhatIf3('traffic',this.value)">
          <div class="whatif-marks"><span>−50%</span><span>0</span><span>+50%</span></div>
        </div>
      </div>
      <div id="whatif-result" style="display:flex;flex-wrap:wrap;gap:10px;margin-top:14px"></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;flex-wrap:wrap;gap:8px">
        <div class="hint" style="margin:0"><i data-lucide="info" class="icon"></i> Двигайте слайдеры — сразу увидите как меняются маржа, ТБУ и прибыль</div>
        <button class="btn btn-outline" style="padding:5px 12px;font-size:12px" onclick="resetWhatIf3()"><i data-lucide="rotate-ccw" class="icon"></i> Сбросить</button>
      </div>
    </div>

    <div class="section-title"><i data-lucide="trending-up" class="icon"></i> Сценарии относительно вашего базового плана</div>
    <div class="panel" style="margin-bottom:16px;font-size:13px;color:var(--muted)">
      Базовый план: <strong style="color:var(--navy)">${int(totalPort)} чашек/день · Выручка ${rub(totRevMon)}/мес</strong>
      → Чистая прибыль: <strong class="${baseNet>=0?'num-pos':'num-neg'}">${rub(baseNet)}</strong>
    </div>
    <div class="scenario-grid">${scenarioCards}</div>

    <!-- ───────────────────────────────────────────── БЛОК 4: ПРОГНОЗ НА ГОД -->
    <div class="finblock-hd finblock-hd-4">
      <span class="finblock-num">4</span>
      <i data-lucide="calendar" class="icon"></i> Прогноз на год
    </div>

    <div class="section-title"><i data-lucide="calendar" class="icon"></i> Сезонность <span style="font-size:12px;font-weight:500;color:var(--muted);margin-left:6px">прогноз прибыли по 12 месяцам</span></div>
    <div class="pts-wrap" style="margin-bottom:20px">
      <button class="pts-toggle" onclick="toggleSeasonality()">
        <i data-lucide="sliders" class="icon"></i>
        Коэффициенты сезонности (слайдеры)
        <span class="pts-toggle-hint">коэфф. 1.0 = базовый месяц</span>
        <i data-lucide="${S.seasonalityOpen?'chevron-up':'chevron-down'}" class="icon" style="margin-left:auto"></i>
      </button>
      ${S.seasonalityOpen ? `<div class="pts-body">
        <div class="season-months">
          ${['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'].map((m,i) => `
          <div class="season-month-item">
            <div class="season-month-label">${m}</div>
            <input type="range" class="season-range" min="0.3" max="2.0" step="0.05" value="${(S.seasonality||Array(12).fill(1))[i]}" oninput="onSeasonalMonth(${i},this.value)">
            <div class="season-month-val" id="sm-val-${i}">${Math.round(((S.seasonality||Array(12).fill(1))[i])*100)}%</div>
          </div>`).join('')}
        </div>
        <div class="hint" style="margin-top:12px"><i data-lucide="info" class="icon"></i> 100% = базовый месяц. 80% = слабый месяц (−20%). 130% = сильный месяц (+30%). Переменные расходы (отмеченные выше) тоже масштабируются.</div>
      </div>` : ''}
    </div>

    <div class="section-title"><i data-lucide="bar-chart" class="icon"></i> Чистая прибыль / 12 месяцев</div>
    <div class="panel" style="padding:14px 18px 10px;overflow:hidden;margin-bottom:24px">
      <div id="seasonal-chart">
        ${buildSeasonalChart(totRevMon, varCostsMon, totalFixed, calcTax)}
      </div>
    </div>
  `;
  // Инициализируем результат What-if со стартовыми значениями
  recalcWhatIf3();
}

// ════════════════════════════════════════════════════════════════════
//  RENDER — RECIPES
// ════════════════════════════════════════════════════════════════════
let recipeSearch = '';
let recipeSort   = 'group';  // group | name | fc | profit
let recipeGroup  = 'all';    // all | hot | tea | cold

function setRecipeSort(s)  { recipeSort  = s; filterRecipes(); }
function setRecipeGroup(g) { recipeGroup = g; filterRecipes(); }
function filterRecipes(val) {
  if (val !== undefined) recipeSearch = val;
  const enriched = enrich();
  const abcMap = {};
  const abcTipMap = {};
  withABC(enriched).forEach(d => { abcMap[d.id] = d.abc; abcTipMap[d.id] = d.abcTip; });

  let list = DRINKS.filter(d => {
    if (recipeGroup !== 'all' && d.group !== recipeGroup) return false;
    if (recipeSearch && !d.name.toLowerCase().includes(recipeSearch.toLowerCase())) return false;
    return true;
  });

  // сортировка
  if (recipeSort === 'name') {
    list = list.slice().sort((a,b) => a.name.localeCompare(b.name,'ru'));
  } else if (recipeSort === 'fc') {
    list = list.slice().sort((a,b) => {
      const fa = calcCost(a) / (S.salePrices[a.id]||1);
      const fb = calcCost(b) / (S.salePrices[b.id]||1);
      return fb - fa;
    });
  } else if (recipeSort === 'profit') {
    list = list.slice().sort((a,b) => {
      const pa = (S.salePrices[a.id]||0) - calcCost(a);
      const pb = (S.salePrices[b.id]||0) - calcCost(b);
      return pb - pa;
    });
  }
  // recipeSort === 'group' — порядок из массива DRINKS (по группам)

  const useGroups = recipeSort === 'group' && recipeGroup === 'all';

  function buildCard(d) {
    const ings = d.recipe
      .filter(ing => MAT[ing.mat])
      .map(ing => ({ name: MAT[ing.mat].name, amt: ing.amt, unit: MAT[ing.mat].unit, cost: calcIngCost(ing) }));
    const totalCost = ings.reduce((s,i) => s + i.cost, 0);
    const price = S.salePrices[d.id];
    const fc = price > 0 ? totalCost / price : 0;
    const maxCost = Math.max(...ings.map(i => i.cost), 0.01);
    const ingRows = ings.map(ing => {
      const w     = (ing.cost / maxCost * 100).toFixed(0);
      const share = totalCost > 0 ? (ing.cost / totalCost * 100).toFixed(0) : 0;
      return `<div class="recipe-ing">
        <span class="recipe-ing-name">${ing.name}</span>
        <span style="font-size:10px;color:var(--muted);flex-shrink:0">${ing.amt} ${ing.unit}</span>
        <div class="recipe-bar-bg"><div class="recipe-bar-fill" style="width:${w}%"></div></div>
        <span class="recipe-ing-share">${share}%</span>
        <span class="recipe-ing-cost">${rub(ing.cost)}</span>
      </div>`;
    }).join('');
    const fcClr  = fc <= 0.25 ? 'var(--green)' : fc <= 0.30 ? '#b38600' : 'var(--red)';
    const editBtn = (d.custom || d.modified)
      ? `<button class="btn btn-outline" style="padding:2px 8px;font-size:11px" onclick="openEditDrink(${d.id})" title="Редактировать">&#9998;</button>`
      : '';
    const resetBtn = d.modified
      ? `<button class="btn btn-outline" style="padding:2px 8px;font-size:11px;color:var(--muted)" onclick="resetDrink(${d.id})" title="Вернуть к исходному"><i data-lucide="rotate-ccw" class="icon"></i></button>`
      : '';
    return `<div class="recipe-card">
      <div class="recipe-card-title">
        <span>${d.name}</span>
        <div style="display:flex;align-items:center;gap:6px">${abcBadge(abcMap[d.id]||'C', abcTipMap[d.id]||'')}${editBtn}${resetBtn}</div>
      </div>
      <div class="recipe-card-sub">
        <span>${d.vol} мл</span>
        <span>·</span>
        <span style="color:${fcClr};font-weight:700">FC ${pct(fc)}</span>
        ${fcBarHtml(fc)}
      </div>
      ${ingRows}
      <div class="recipe-total"><span>Себестоимость</span><span>${rub(totalCost)}</span></div>
      <div class="recipe-total" style="font-weight:400;font-size:12px;color:var(--muted)"><span>Цена продажи</span><span>${rub(price)}</span></div>
      <div class="recipe-total" style="color:var(--navy)"><span>Прибыль</span><span>${rub(price - totalCost)}</span></div>
    </div>`;
  }

  let html = '';
  if (!list.length) {
    html = `<p style="padding:32px;text-align:center;color:var(--muted)">Ничего не найдено — измените поиск или фильтр</p>`;
  } else if (useGroups) {
    ['hot','tea','cold','filter'].forEach(grp => {
      const grpList = list.filter(d => d.group === grp);
      if (!grpList.length) return;
      html += `<div class="recipe-group-title">${GROUP_LABEL[grp]}</div>`;
      html += `<div class="recipe-grid">${grpList.map(buildCard).join('')}</div>`;
    });
  } else {
    html = `<div class="recipe-grid">${list.map(buildCard).join('')}</div>`;
  }

  const container = document.querySelector('#tab-recipes .recipe-groups');
  if (container) container.innerHTML = html;
}

function renderRecipes() {
  const sortLabels = [
    { k:'group',  l:'По группам' },
    { k:'name',   l:'По алфавиту' },
    { k:'fc',     l:'По FC% ↓' },
    { k:'profit', l:'По прибыли ↓' },
  ];
  const groupFilters = [
    { k:'all', l:'Все' },
    { k:'hot', l:'<i data-lucide="coffee" class="icon"></i> Горячие' },
    { k:'tea', l:'<i data-lucide="leaf" class="icon"></i> Чай' },
    { k:'cold',l:'<i data-lucide="snowflake" class="icon"></i> Холодные' },
    { k:'filter',l:'<i data-lucide="filter" class="icon"></i> Фильтр' },
  ];
  const sortBtns = sortLabels.map(s =>
    `<button class="recipe-sort-btn${recipeSort===s.k?' active':''}" onclick="setRecipeSort('${s.k}')">${s.l}</button>`
  ).join('');
  const filterBtns = groupFilters.map(g =>
    `<button class="recipe-filter-btn${recipeGroup===g.k?' active':''}" onclick="setRecipeGroup('${g.k}')">${g.l}</button>`
  ).join('');

  document.getElementById('tab-recipes').innerHTML = `
    <div class="page-title">
      <span class="page-title-left"><i data-lucide="clipboard-list" class="icon"></i> Рецептуры и структура себестоимости</span>
      <button class="btn btn-outline" onclick="exportTechCards()" title="Экспорт техкарт по ГОСТ Р 53105 в PDF"><i data-lucide="file-text" class="icon"></i> PDF техкарт</button>
    </div>
    <div class="tab-intro">
      <div class="tab-intro-icon"><i data-lucide="clipboard-list" class="icon icon-lg"></i></div>
      <div>
        <div class="tab-intro-title">Что здесь?</div>
        <div class="tab-intro-text">
          Карточка каждого напитка с разбивкой себестоимости по ингредиентам.
          <strong>Полоса</strong> показывает долю каждого ингредиента в общей себестоимости. Измените цены сырья — карточки обновятся.
        </div>
      </div>
    </div>
    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:14px;margin-bottom:16px">
      <div class="search-wrap" style="margin-bottom:0;min-width:200px;max-width:320px">
        <span class="search-icon"><i data-lucide="search" class="icon"></i></span>
        <input class="search-inp" id="recipe-search" type="text" placeholder="Поиск по названию..."
          value="${recipeSearch}" oninput="filterRecipes(this.value)">
      </div>
      <div class="recipe-filter-btns">${filterBtns}</div>
      <div style="display:flex;align-items:center;gap:8px;margin-left:auto">
        <span style="font-size:12px;color:var(--muted);font-weight:600">Сорт:</span>
        <div class="recipe-sort-btns">${sortBtns}</div>
      </div>
    </div>
    <div class="recipe-groups"></div>
  `;
  filterRecipes();
}

// ════════════════════════════════════════════════════════════════════
//  STATE UPDATERS
// ════════════════════════════════════════════════════════════════════
function markDirty()    { Object.keys(dirty).forEach(k=>dirty[k]=true); renderActive(); }
function debounce(fn, ms=400) { clearTimeout(_renderTimer); _renderTimer = setTimeout(fn, ms); }
function markDirtyDebounce() {
  Object.keys(dirty).forEach(k=>dirty[k]=true);
  debounce(() => {
    const ae = document.activeElement;
    const focusId  = ae?.id || null;
    const focusSel = ae?.selectionStart ?? null;
    const focusEnd = ae?.selectionEnd ?? null;
    renderActive();
    flashCells();
    saveState();
    if (focusId) {
      const el = document.getElementById(focusId);
      if (el) {
        el.focus();
        if (focusSel !== null) { try { el.setSelectionRange(focusSel, focusEnd); } catch(e){} }
      }
    }
  });
}
function renderActive() { renderTab(activeTab); dirty[activeTab]=false; }
function renderTab(tab) {
  if      (tab==='dashboard') renderDashboard();
  else if (tab==='cost')      renderCost();
  else if (tab==='sales')     renderSales();
  else if (tab==='finmodel')  renderFinModel();
  else if (tab==='recipes')   renderRecipes();
  if (window.lucide) lucide.createIcons();
}

function onMatPrice(key, v)  {
  const n = parseFloat(v);
  if (!(n > 0)) return;
  const old = S.prices[key];
  if (old !== n) {
    if (!Array.isArray(S.priceLog)) S.priceLog = [];
    S.priceLog.push({ matKey: key, oldPrice: old, newPrice: n, date: new Date().toISOString() });
    if (S.priceLog.length > 500) S.priceLog = S.priceLog.slice(-500); // лимит
  }
  S.prices[key] = n;
  markDirtyDebounce();
}
function onSalePrice(id, v)  { const n=parseFloat(v); if(n>0){ S.salePrices[id]=n; markDirtyDebounce(); } }
function onTargetFCSilent(v) { const n=parseFloat(v)/100; if(n>0&&n<1){ S.targetFC=n; } }
function onTargetFC(v)       { const n=parseFloat(v)/100; if(n>0&&n<1){ S.targetFC=n; markDirtyDebounce(); } }
function onPortions(id, v)   { const n=parseInt(v); if(n>=0){ S.portions[id]=n; dirty.finmodel=true; debounce(()=>{ renderSales(); saveState(); }); } }
function onDays(v)           { const n=parseInt(v); if(n>0){ S.days=n; dirty.finmodel=true; debounce(()=>{ renderSales(); saveState(); }); } }

// ─── Пресеты и масштабирование плана продаж ──────────────────────
function applySalesPreset(key) {
  const preset = SALES_PRESETS[key];
  if (!preset) return;
  S.activePreset = key;
  const baseIds = new Set(DRINKS.map(d => d.id));
  Object.entries(preset.portions).forEach(([id, val]) => {
    if (baseIds.has(Number(id))) S.portions[Number(id)] = val;
  });
  dirty.finmodel = true;
  renderSales(); saveState();
}

function scaleSalesPortions(factor) {
  Object.keys(S.portions).forEach(id => {
    S.portions[Number(id)] = Math.max(0, Math.round(S.portions[Number(id)] * factor));
  });
  dirty.finmodel = true;
  renderSales(); saveState();
}
function onFixedCost(i, v)   { const n=parseFloat(v); if(n>=0){ S.fixedCosts[i].value=n; debounce(()=>{ renderFinModel(); saveState(); }); } }
function onFixedCostName(i, v) { if(v.trim()){ S.fixedCosts[i].name=v.trim(); saveState(); } }
function addFixedCost() { S.fixedCosts.push({ name:'Новая статья', value:0 }); renderFinModel(); saveState(); if(window.lucide) lucide.createIcons(); }
function delFixedCost(i) { if(S.fixedCosts.length > 1) { S.fixedCosts.splice(i,1); renderFinModel(); saveState(); if(window.lucide) lucide.createIcons(); } }
function onTaxMode(v) { S.taxMode = v; renderFinModel(); saveState(); if(window.lucide) lucide.createIcons(); }
function onInvestment(v) { const n=parseFloat(v); if(n>=0){ S.investment=n; renderFinModel(); saveState(); if(window.lucide) lucide.createIcons(); } }

// ════════════════════════════════════════════════════════════════════
//  PAYROLL CALCULATOR
// ════════════════════════════════════════════════════════════════════
// Дефолтные значения налоговых ставок (используются при отсутствии настроек)
const PS_DEFAULTS = { mrot: 22440, ndfl: 13, ins: 30 };
// Возвращает текущие налоговые настройки (из S или дефолтные)
function PS() {
  return Object.assign({}, PS_DEFAULTS, S.payrollSettings || {});
}

function calcPositionCosts(p) {
  const ps    = PS();
  const mrot  = ps.mrot;
  const ndfl  = ps.ndfl / 100;
  const ins   = ps.ins  / 100;
  const gross = (p.rate||0) * (p.hours||0) * (p.shifts||0) * (p.count||0);
  const type  = p.empType || 'black';
  if (type === 'white') {
    const ndflAmt = Math.round(gross * ndfl);
    const insAmt  = Math.round(gross * ins);
    return { toEmployee: gross - ndflAmt, taxes: ndflAmt + insAmt, total: gross + insAmt };
  }
  if (type === 'grey') {
    const officialBase = mrot * (p.count || 1);
    const official  = Math.min(gross, officialBase);
    const cashPart  = Math.max(0, gross - officialBase);
    const ndflAmt   = Math.round(official * ndfl);
    const insAmt    = Math.round(official * ins);
    return { toEmployee: (official - ndflAmt) + cashPart, taxes: ndflAmt + insAmt, total: official + insAmt + cashPart };
  }
  // black
  return { toEmployee: gross, taxes: 0, total: gross };
}

function payrollPositionTotal(p) {
  return calcPositionCosts(p).total;
}
function payrollTotal() {
  return (S.payrollPositions||[]).reduce((s,p) => s + payrollPositionTotal(p), 0);
}
function payrollTotals() {
  const res = { toEmployee:0, taxes:0, total:0 };
  (S.payrollPositions||[]).forEach(p => {
    const c = calcPositionCosts(p);
    res.toEmployee += c.toEmployee;
    res.taxes      += c.taxes;
    res.total      += c.total;
  });
  return res;
}

const EMP_TYPE_LABELS = { white:'Официально', grey:'Серая схема', black:'Неофициально' };
function empTypeTip(type) {
  const ps = PS();
  if (type === 'white') return `Трудовой договор. Ставка = гросс. Работник получает гросс − НДФЛ ${ps.ndfl}%. Работодатель: +${ps.ins}% взносы.`;
  if (type === 'grey')  return `Официально только МРОТ (${ps.mrot.toLocaleString('ru')} ₽) × кол-во. НДФЛ ${ps.ndfl}% + взносы ${ps.ins}% с МРОТ. Остальное — наличными.`;
  return 'Вся сумма — на руки. Никаких налогов.';
}
const EMP_TYPE_CLR = { white:'var(--green)', grey:'#e6a817', black:'var(--muted)' };

function onPayrollPos(id, field, v) {
  const pos = (S.payrollPositions||[]).find(p => p.id === id);
  if (!pos) return;
  if (field === 'name' || field === 'empType') {
    pos[field] = v;
    if (field === 'empType') { renderFinModel(); saveState(); if(window.lucide) lucide.createIcons(); }
    else saveState();
    return;
  }
  const n = parseFloat(v);
  if (!(n >= 0)) return;
  pos[field] = n;
  _refreshPayrollRow(id);
  saveState();
}
function _refreshPayrollRow(id) {
  const pos = (S.payrollPositions||[]).find(p => p.id === id);
  if (!pos) return;
  const c = calcPositionCosts(pos);
  const rowTotal = document.getElementById(`pr-total-${id}`);
  if (rowTotal) rowTotal.textContent = rub(c.total);
  const rowTax = document.getElementById(`pr-tax-${id}`);
  if (rowTax) rowTax.textContent = c.taxes > 0 ? `+${rub(c.taxes)}` : '—';
  _refreshPayrollSummary();
}
function _refreshPayrollSummary() {
  const t = payrollTotals();
  const s = document.getElementById('pr-sum-employee'); if (s) s.textContent = rub(t.toEmployee);
  const x = document.getElementById('pr-sum-taxes');    if (x) x.textContent = rub(t.taxes);
  const g = document.getElementById('payroll-grand-total'); if (g) g.textContent = rub(t.total);
}
function addPayrollPosition() {
  if (!S.payrollPositions) S.payrollPositions = [];
  const maxId = S.payrollPositions.reduce((m,p) => Math.max(m, p.id||0), 0);
  S.payrollPositions.push({ id: maxId+1, name:'Новая должность', rate:250, hours:12, shifts:26, count:1, empType:'black' });
  renderFinModel();
  saveState();
  if (window.lucide) lucide.createIcons();
  const last = S.payrollPositions[S.payrollPositions.length-1];
  const el = document.getElementById(`pr-name-${last.id}`);
  if (el) { el.focus(); el.select(); }
}
function deletePayrollPosition(id) {
  if (!S.payrollPositions || S.payrollPositions.length <= 1) return;
  S.payrollPositions = S.payrollPositions.filter(p => p.id !== id);
  renderFinModel();
  saveState();
  if (window.lucide) lucide.createIcons();
}
function applyPayrollToFixed() {
  const tot = payrollTotal();
  if (!tot) { alert('Добавьте хотя бы одну должность'); return; }
  let idx = S.fixedCosts.findIndex(c => /фот|зарплат|зп|оплата труда/i.test(c.name));
  if (idx < 0) {
    S.fixedCosts.unshift({ name: 'ФОТ (персонал)', value: tot });
  } else {
    S.fixedCosts[idx].value = tot;
  }
  renderFinModel();
  saveState();
  if (window.lucide) lucide.createIcons();
}
function onPayrollSetting(key, v) {
  if (!S.payrollSettings) S.payrollSettings = {};
  const n = parseFloat(v);
  if (isNaN(n) || n < 0) return;
  S.payrollSettings[key] = n;
  saveState();
  // Пересчитаем все строки таблицы
  (S.payrollPositions||[]).forEach(p => _refreshPayrollRow(p.id));
  // Обновить формулы в блоке настроек (если раскрыт)
  const wb = document.querySelector('.pts-body');
  if (wb) { renderFinModel(); if (window.lucide) lucide.createIcons(); }
}
function togglePayrollSettings() {
  S.payrollSettingsOpen = !S.payrollSettingsOpen;
  saveState();
  renderFinModel();
  if (window.lucide) lucide.createIcons();
}

// ════════════════════════════════════════════════════════════════════
//  SUPPLIERS & PRICE HISTORY
// ════════════════════════════════════════════════════════════════════
const MAT_CATEGORY = {
  coffee:'coffee', milk:'dairy', cream:'dairy',
  cocoa:'other', matcha:'tea', tea:'tea',
  sugar:'sugar', sugar_van:'sugar', sugar_org:'sugar',
  cup250:'pack', cup350:'pack', cup450:'pack', cup_p300:'pack', cup_p500:'pack',
  orange:'other', tonic:'other', lime:'other',
};
const CAT_LABELS = { all:'Все', coffee:'Зерно', dairy:'Молочное', tea:'Чай/Матча', sugar:'Сахар', pack:'Упаковка', other:'Прочее', nomat:'Без сырья' };

let _supplierEditKey = null;
let _supplierFromList = false;
let _supBookEditId = null;
let supListSearch = '';
let supListFilter = 'all';

function openSupplierModal(key) {
  if (!MAT[key]) return;
  _supplierEditKey = key;
  const s = (S.suppliers && S.suppliers[key]) || {};
  document.getElementById('sup-mat-name').textContent = MAT[key].name;
  document.getElementById('sup-name').value  = s.name  || '';
  document.getElementById('sup-phone').value = s.phone || '';
  document.getElementById('sup-note').value  = s.note  || '';
  document.getElementById('sup-site').value  = s.site  || '';
  openModal('modal-supplier');
  if (window.lucide) lucide.createIcons();
}
function editSupFromList(matKey) {
  _supplierFromList = true;
  openSupplierModal(matKey);
}
function cancelSupplierModal() {
  const fromList = _supplierFromList;
  _supplierFromList = false;
  closeModal('modal-supplier');
  if (fromList) openSuppliersList();
}
function saveSupplier() {
  if (!_supplierEditKey) return;
  if (!S.suppliers) S.suppliers = {};
  const name  = document.getElementById('sup-name').value.trim();
  const phone = document.getElementById('sup-phone').value.trim();
  const note  = document.getElementById('sup-note').value.trim();
  const site  = document.getElementById('sup-site').value.trim();
  if (!name && !phone && !note && !site) {
    delete S.suppliers[_supplierEditKey];
  } else {
    S.suppliers[_supplierEditKey] = { name, phone, note, site };
  }
  saveState();
  const fromList = _supplierFromList;
  _supplierFromList = false;
  closeModal('modal-supplier');
  renderCost();
  if (fromList) openSuppliersList();
}

// ── Список поставщиков
function openSuppliersList() {
  supListSearch = '';
  supListFilter = 'all';
  const inp = document.getElementById('sup-list-search');
  if (inp) inp.value = '';
  renderSuppliersList();
  openModal('modal-suppliers-list');
  if (window.lucide) lucide.createIcons();
}
function renderSuppliersList() {
  const sups = S.suppliers || {};
  const book = S.supplierBook || [];

  // Группируем mat-linked по имени
  const byName = {};
  Object.entries(sups).forEach(([key, v]) => {
    if (!v || (!v.name && !v.phone && !v.note)) return;
    const nm = v.name || '(без названия)';
    if (!byName[nm]) byName[nm] = { name: nm, phone: v.phone||'', note: v.note||'', site: v.site||'', mats: [], matKeys: [], bookId: null };
    if (MAT[key]) byName[nm].mats.push({ label: MAT[key].name, key });
    byName[nm].matKeys.push(key);
    if (!byName[nm].phone && v.phone) byName[nm].phone = v.phone;
    if (!byName[nm].note  && v.note)  byName[nm].note  = v.note;
    if (!byName[nm].site  && v.site)  byName[nm].site  = v.site;
  });
  book.forEach(b => { if (byName[b.name]) byName[b.name].bookId = b.id; });

  let groups = Object.values(byName).map(g => ({ ...g, isBookOnly: false }));
  book.forEach(b => {
    if (!byName[b.name])
      groups.push({ name: b.name, phone: b.phone||'', note: b.note||'', site: b.site||'', mats: [], matKeys: [], bookId: b.id, isBookOnly: true });
  });

  // Поиск
  const q = supListSearch.toLowerCase();
  let filtered = q
    ? groups.filter(g =>
        g.name.toLowerCase().includes(q) ||
        g.phone.toLowerCase().includes(q) ||
        g.note.toLowerCase().includes(q) ||
        g.mats.some(m => m.label.toLowerCase().includes(q)))
    : groups;

  // Фильтр по категории
  if (supListFilter === 'nomat') {
    filtered = filtered.filter(g => g.mats.length === 0);
  } else if (supListFilter !== 'all') {
    filtered = filtered.filter(g =>
      g.mats.some(m => (MAT_CATEGORY[m.key] || 'other') === supListFilter));
  }

  // Статистика
  const filledMat = Object.entries(sups).filter(([,v]) => v && (v.name||v.phone||v.note)).length;
  const totalMats = Object.keys(MAT).length;
  document.getElementById('sup-list-stats').innerHTML =
    `Поставщиков: <b>${groups.length}</b> &nbsp;·&nbsp; Позиций сырья заполнено: <b>${filledMat}</b> из <b>${totalMats}</b>`;

  // Чипы фильтра
  document.getElementById('sup-filter-chips').innerHTML =
    ['all','coffee','dairy','tea','sugar','pack','other','nomat'].map(c =>
      `<button class="filter-chip${supListFilter===c?' active':''}" onclick="supListFilter='${c}';renderSuppliersList()">${CAT_LABELS[c]}</button>`
    ).join('');

  // Карточки
  let body = '';
  if (!filtered.length) {
    body = `<div style="padding:28px;text-align:center;color:var(--muted)">${
      supListFilter !== 'all' || q
        ? 'Ничего не найдено'
        : 'Поставщики ещё не добавлены.<br>Нажмите <b>+ Добавить</b> или значок 🚚 у любого сырья.'
    }</div>`;
  } else {
    body = filtered.map(g => {
      const matTags = g.mats.map(m =>
        `<span class="sup-mat-tag" title="Изменить для ${m.label}" onclick="editSupFromList('${m.key}')">${m.label}</span>`
      ).join('');
      const noMatBadge = g.isBookOnly ? `<span class="sup-book-badge">Без сырья</span>` : '';
      const editAction = g.isBookOnly
        ? `openSupplierBookModal('${g.bookId}')`
        : `editSupFromList('${g.matKeys[0]}')`;
      return `<div class="sup-card">
        <div class="sup-card-header">
          <span class="sup-card-name"><i data-lucide="building-2" class="icon"></i> ${g.name}</span>
          ${g.phone ? `<a class="sup-card-phone" href="tel:${g.phone}">${g.phone}</a>` : ''}
          <button class="btn btn-outline sup-edit-btn" onclick="${editAction}"><i data-lucide="pencil" class="icon"></i> Изменить</button>
        </div>
        ${g.note ? `<div class="sup-card-note">${g.note}</div>` : ''}
        ${g.site ? `<div class="sup-card-note"><a href="${g.site}" target="_blank" style="color:var(--green);text-decoration:none">🌐 ${g.site}</a></div>` : ''}
        <div class="sup-card-mats">${matTags}${noMatBadge}</div>
      </div>`;
    }).join('');
  }
  document.getElementById('sup-list-body').innerHTML = body;
  if (window.lucide) lucide.createIcons();
}

// ── Справочник поставщиков (без привязки к сырью)
function openSupplierBookModal(id) {
  _supBookEditId = id || null;
  if (id) {
    const entry = (S.supplierBook||[]).find(b => String(b.id) === String(id));
    if (!entry) return;
    document.getElementById('sup-book-title').textContent = 'Редактировать поставщика';
    document.getElementById('sup-book-name').value  = entry.name  || '';
    document.getElementById('sup-book-phone').value = entry.phone || '';
    document.getElementById('sup-book-note').value  = entry.note  || '';
    document.getElementById('sup-book-site').value  = entry.site  || '';
    document.getElementById('sup-book-del-btn').style.display = '';
  } else {
    document.getElementById('sup-book-title').textContent = 'Новый поставщик';
    document.getElementById('sup-book-name').value  = '';
    document.getElementById('sup-book-phone').value = '';
    document.getElementById('sup-book-note').value  = '';
    document.getElementById('sup-book-site').value  = '';
    document.getElementById('sup-book-del-btn').style.display = 'none';
  }
  openModal('modal-supplier-book');
  if (window.lucide) lucide.createIcons();
}
function cancelSupplierBookModal() {
  closeModal('modal-supplier-book');
  openSuppliersList();
}
function saveSupplierBook() {
  const name  = document.getElementById('sup-book-name').value.trim();
  const phone = document.getElementById('sup-book-phone').value.trim();
  const note  = document.getElementById('sup-book-note').value.trim();
  const site  = document.getElementById('sup-book-site').value.trim();
  if (!name) { document.getElementById('sup-book-name').focus(); return; }
  if (!S.supplierBook) S.supplierBook = [];
  if (_supBookEditId) {
    const idx = S.supplierBook.findIndex(b => String(b.id) === String(_supBookEditId));
    if (idx >= 0) S.supplierBook[idx] = { ...S.supplierBook[idx], name, phone, note, site };
  } else {
    const maxId = S.supplierBook.reduce((m,b) => Math.max(m, b.id||0), 0);
    S.supplierBook.push({ id: maxId + 1, name, phone, note, site });
  }
  saveState();
  closeModal('modal-supplier-book');
  openSuppliersList();
}
function deleteSupplierBook() {
  if (!_supBookEditId || !S.supplierBook) return;
  if (!confirm('Удалить поставщика из справочника?')) return;
  S.supplierBook = S.supplierBook.filter(b => String(b.id) !== String(_supBookEditId));
  saveState();
  closeModal('modal-supplier-book');
  openSuppliersList();
}

function openPriceHistory(key) {
  if (!MAT[key]) return;
  const log = (S.priceLog || []).filter(e => e.matKey === key).slice().reverse();
  const rows = log.length
    ? log.map(e => {
        const diff  = e.newPrice - (e.oldPrice||0);
        const pctD  = e.oldPrice ? (diff/e.oldPrice*100).toFixed(1) : '—';
        const clr   = diff > 0 ? 'var(--red)' : diff < 0 ? 'var(--green)' : 'var(--muted)';
        const sign  = diff > 0 ? '+' : '';
        const date  = new Date(e.date).toLocaleString('ru', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' });
        return `<tr>
          <td style="padding:6px 10px;font-size:12px">${date}</td>
          <td style="padding:6px 10px;text-align:right">${rub(e.oldPrice||0)}</td>
          <td style="padding:6px 10px;text-align:right;font-weight:700">${rub(e.newPrice)}</td>
          <td style="padding:6px 10px;text-align:right;color:${clr};font-weight:700">${sign}${rub(diff)} (${sign}${pctD}%)</td>
        </tr>`;
      }).join('')
    : `<tr><td colspan="4" style="padding:18px;text-align:center;color:var(--muted)">Изменений цены ещё не было</td></tr>`;
  document.getElementById('phist-mat-name').textContent = MAT[key].name;
  document.getElementById('phist-rows').innerHTML = rows;
  openModal('modal-price-hist');
  if (window.lucide) lucide.createIcons();
}

// ════════════════════════════════════════════════════════════════════
//  WHAT-IF — 3 sliders (price / cost / traffic)
// ════════════════════════════════════════════════════════════════════
const _wif = { price: 0, cost: 0, traffic: 0 };
function onWhatIf3(field, v) {
  _wif[field] = parseInt(v);
  document.getElementById('wif-' + field + '-val').textContent = (_wif[field]>=0?'+':'') + _wif[field] + '%';
  saveState();
  recalcWhatIf3();
}
function resetWhatIf3() {
  _wif.price = _wif.cost = _wif.traffic = 0;
  ['price','cost','traffic'].forEach(f => {
    const el = document.getElementById('wif-' + f);
    if (el) el.value = 0;
    const v = document.getElementById('wif-' + f + '-val');
    if (v) v.textContent = '0%';
  });
  recalcWhatIf3();
}
function recalcWhatIf3() {
  const out = document.getElementById('whatif-result');
  if (!out) return;
  const drinks = enrich();
  const totalFixed = S.fixedCosts.reduce((s,c)=>s+c.value,0);
  const taxMode = S.taxMode || 'none';
  const calcTax = (rev, varC) =>
    taxMode==='usn6' ? rev*0.06 : taxMode==='usn15' ? Math.max(0,(rev-varC-totalFixed)*0.15) : 0;

  const mPrice   = 1 + _wif.price/100;
  const mCost    = 1 + _wif.cost/100;
  const mTraffic = 1 + _wif.traffic/100;

  // Базовые
  const baseRev = drinks.reduce((s,d)=>s + d.price * S.portions[d.id], 0) * S.days;
  const baseVar = drinks.reduce((s,d)=>s + d.cost  * S.portions[d.id], 0) * S.days;
  const baseNet = baseRev - baseVar - totalFixed - calcTax(baseRev, baseVar);
  const basePort= Object.values(S.portions).reduce((s,v)=>s+v,0);

  // С учётом коэффициентов
  const rev2  = baseRev * mPrice * mTraffic;
  const var2  = baseVar * mCost  * mTraffic;
  const net2  = rev2 - var2 - totalFixed - calcTax(rev2, var2);
  const port2 = basePort * mTraffic;
  const fc2   = rev2>0 ? var2/rev2 : 0;
  const bep2  = (1-fc2)>0 ? totalFixed/(1-fc2) : 0;
  const avgChk= port2>0 ? rev2/(port2*S.days) : 0;
  const cover = bep2>0 ? rev2/bep2*100 : 100;

  const delta = net2 - baseNet;
  const dClr  = delta>0 ? 'var(--green)' : delta<0 ? 'var(--red)' : 'var(--muted)';
  const sign  = delta>0 ? '+' : '';
  const netClr = net2>=0 ? 'var(--navy)' : 'var(--red)';

  out.innerHTML = `
    <div style="flex:1;min-width:130px;background:var(--gray);border-radius:9px;padding:10px 13px">
      <div style="font-size:10px;font-weight:700;color:var(--muted);margin-bottom:3px">Средний чек</div>
      <div style="font-weight:800;font-size:17px">${rub(avgChk)}</div>
    </div>
    <div style="flex:1;min-width:130px;background:var(--gray);border-radius:9px;padding:10px 13px">
      <div style="font-size:10px;font-weight:700;color:var(--muted);margin-bottom:3px">FC%</div>
      <div style="font-weight:800;font-size:17px">${pct(fc2)}</div>
    </div>
    <div style="flex:1;min-width:130px;background:var(--gray);border-radius:9px;padding:10px 13px">
      <div style="font-size:10px;font-weight:700;color:var(--muted);margin-bottom:3px">Выручка / мес</div>
      <div style="font-weight:800;font-size:17px">${rub(rev2)}</div>
    </div>
    <div style="flex:1;min-width:130px;background:var(--gray);border-radius:9px;padding:10px 13px">
      <div style="font-size:10px;font-weight:700;color:var(--muted);margin-bottom:3px">Выручка ТБУ</div>
      <div style="font-weight:800;font-size:17px">${rub(bep2)}</div>
      <div style="font-size:10px;color:var(--muted);margin-top:2px">покрытие ${cover.toFixed(0)}%</div>
    </div>
    <div style="flex:1.4;min-width:160px;background:var(--light);border-radius:9px;padding:10px 13px">
      <div style="font-size:10px;font-weight:700;color:var(--muted);margin-bottom:3px">Чистая прибыль / мес</div>
      <div style="font-weight:800;font-size:18px;color:${netClr}">${rub(net2)}</div>
      <div style="font-size:11px;font-weight:700;color:${dClr};margin-top:2px">${sign}${rub(delta)} к базе</div>
    </div>`;
}
// Совместимость со старым обработчиком (если где-то остался)
function onWhatIf(v) { onWhatIf3('price', v); }

// ════════════════════════════════════════════════════════════════════
//  SEASONAL 12-MONTH CHART
// ════════════════════════════════════════════════════════════════════
function buildSeasonalChart(totRevMon, varCostsMon, totalFixed, calcTax) {
  const MONTHS = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
  const season = S.seasonality || Array(12).fill(1);
  const varFixed  = (S.fixedCosts||[]).filter(c=>c.isVariable).reduce((s,c)=>s+c.value,0);
  const pureFixed = totalFixed - varFixed;
  const data = season.map((k,i) => {
    const rev=totRevMon*k, varC=varCostsMon*k, fixed=pureFixed+varFixed*k;
    const tax=calcTax(rev,varC,fixed);
    return { m:MONTHS[i], k, net:rev-varC-fixed-tax };
  });
  const dark=document.body.classList.contains('dark');
  const ff='system-ui,sans-serif';
  const W=580,H=190,PL=62,PR=12,PT=16,PB=30;
  const cw=W-PL-PR, ch=H-PT-PB, n=12;
  const barW=Math.floor(cw/n*0.7), gap=cw/n;
  const maxN=Math.max(...data.map(d=>d.net),0), minN=Math.min(...data.map(d=>d.net),0);
  const range=maxN-minN||1;
  const cy=v=>PT+ch-((v-minN)/range)*ch;
  const cx=i=>PL+gap*(i+0.5);
  const zero=cy(0);
  const clrPos=dark?'#89d185':'#417033', clrNeg=dark?'#f48771':'#d9534f';
  const clrGrid=dark?'rgba(255,255,255,.06)':'rgba(0,0,0,.05)';
  const clrTxt=dark?'#999':'#888', clrAxis=dark?'rgba(255,255,255,.18)':'rgba(0,0,0,.14)';
  const gridPts=[0]; if(maxN>0)gridPts.push(maxN); if(minN<0)gridPts.push(minN);
  const gridSvg=[...new Set(gridPts)].map(v=>{
    const y=cy(v); const fv=a=>Math.abs(a)>=1e6?(a/1e6).toFixed(1)+'М':Math.abs(a)>=1e3?Math.round(a/1e3)+'к':Math.round(a);
    return `<line x1="${PL}" y1="${y}" x2="${PL+cw}" y2="${y}" stroke="${clrGrid}" stroke-width="1"/>
    <text x="${PL-5}" y="${y+4}" text-anchor="end" font-size="9" font-family="${ff}" fill="${clrTxt}">${fv(v)}₽</text>`;
  }).join('');
  const barsSvg=data.map((d,i)=>{
    const x=cx(i), pos=d.net>=0;
    const bt=pos?cy(d.net):zero, bb=pos?zero:cy(d.net), h=Math.max(Math.abs(bb-bt),2);
    const clr=pos?clrPos:clrNeg, labelY=pos?bt-4:bt+h+11;
    const fv=v=>Math.abs(v)>=1e6?(v/1e6).toFixed(1)+'М':Math.abs(v)>=1e3?Math.round(v/1e3)+'к':Math.round(v);
    return `<rect x="${x-barW/2}" y="${bt}" width="${barW}" height="${h}" rx="2" fill="${clr}" opacity="${d.k===1?'0.82':'0.65'}"/>
    <text x="${x}" y="${PT+ch+12}" text-anchor="middle" font-size="9" font-family="${ff}" fill="${clrTxt}">${d.m}</text>
    <text x="${x}" y="${labelY}" text-anchor="middle" font-size="8" font-family="${ff}" font-weight="700" fill="${clr}">${fv(d.net)}₽</text>`;
  }).join('');
  const zeroLine=`<line x1="${PL}" y1="${zero}" x2="${PL+cw}" y2="${zero}" stroke="${clrAxis}" stroke-width="1.5"/>`;
  const axisY=`<line x1="${PL}" y1="${PT}" x2="${PL}" y2="${PT+ch}" stroke="${clrAxis}" stroke-width="1.5"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block;overflow:visible" xmlns="http://www.w3.org/2000/svg">
    ${gridSvg}${axisY}${zeroLine}${barsSvg}</svg>`;
}

// ════════════════════════════════════════════════════════════════════
//  SEASONALITY + FIXED-COST VARIABLE HANDLERS
// ════════════════════════════════════════════════════════════════════
function onSeasonalMonth(i, v) {
  if (!S.seasonality) S.seasonality = Array(12).fill(1);
  S.seasonality[i] = parseFloat(v);
  const lbl = document.getElementById('sm-val-'+i);
  if (lbl) lbl.textContent = Math.round(parseFloat(v)*100) + '%';
  // перерисовать только чарт
  const chartEl = document.getElementById('seasonal-chart');
  if (chartEl) {
    const drinks = enrich();
    const varCostsMon = drinks.reduce((s,d)=>s+d.cost*S.portions[d.id],0)*S.days;
    const totRevMon   = drinks.reduce((s,d)=>s+d.price*S.portions[d.id],0)*S.days;
    const totalFixed  = S.fixedCosts.reduce((s,c)=>s+c.value,0);
    const taxMode = S.taxMode||'none';
    const calcTaxLocal = (rev,varC,fixed) => taxMode==='usn6'?rev*0.06:taxMode==='usn15'?Math.max(0,(rev-varC-fixed)*0.15):0;
    chartEl.innerHTML = buildSeasonalChart(totRevMon, varCostsMon, totalFixed, calcTaxLocal);
  }
  saveState();
}
function toggleSeasonality() {
  S.seasonalityOpen = !S.seasonalityOpen;
  saveState();
  renderFinModel();
  if (window.lucide) lucide.createIcons();
}
function onFixedCostVariable(i, checked) {
  S.fixedCosts[i].isVariable = !!checked;
  saveState();
  renderFinModel();
  if (window.lucide) lucide.createIcons();
}

// ════════════════════════════════════════════════════════════════════
//  MENU CLEANUP — drop candidates
// ════════════════════════════════════════════════════════════════════
function openDropCandidates() {
  const drinks = withABC(enrich());
  const candidates = drinks.map(d => {
    const port = S.portions[d.id] || 0;
    let score = 0;
    const reasons = [];
    if (d.abc === 'C') { score += 3; reasons.push('класс C'); }
    if (d.fc > 0.30)   { score += 2; reasons.push(`FC ${pct(d.fc)}`); }
    if (port <= 3)     { score += 2; reasons.push(`всего ${port} порц/день`); }
    if (d.profit < 50) { score += 1; reasons.push(`прибыль ${rub(d.profit)}`); }
    return { ...d, port, score, reasons };
  })
  .filter(d => d.score >= 3)
  .sort((a,b) => b.score - a.score || a.profit - b.profit);

  const grid = document.getElementById('drop-grid');
  if (!candidates.length) {
    grid.innerHTML = `<div style="padding:32px;text-align:center;color:var(--muted)">
      <div style="font-size:42px;margin-bottom:8px">🎉</div>
      <div style="font-weight:700;color:var(--green);margin-bottom:6px">Меню оптимизировано!</div>
      <div>Кандидатов на удаление не найдено — все позиции работают.</div>
    </div>`;
  } else {
    grid.innerHTML = `
      <div style="font-size:13px;color:var(--muted);margin-bottom:12px">
        Найдено <strong style="color:var(--red)">${candidates.length}</strong> позиций для пересмотра. Критерии: класс C, FC&gt;30%, &lt;3 порц/день, прибыль &lt;50₽.
      </div>
      <div class="table-wrap" style="max-height:60vh">
        <table>
          <thead><tr>
            <th>Напиток</th>
            <th class="ta-c">Score</th>
            <th>Причины</th>
            <th class="ta-r">FC%</th>
            <th class="ta-r">Прибыль</th>
            <th class="ta-c">Порц/день</th>
            <th></th>
          </tr></thead>
          <tbody>${candidates.map(d => {
            const sevClr = d.score >= 6 ? 'var(--red)' : d.score >= 4 ? '#b38600' : 'var(--navy)';
            return `<tr>
              <td class="fw7">${d.name}</td>
              <td class="ta-c"><span style="background:${sevClr};color:white;padding:2px 8px;border-radius:8px;font-weight:800;font-size:12px">${d.score}</span></td>
              <td style="font-size:12px;color:var(--muted)">${d.reasons.join(' · ')}</td>
              <td class="ta-r">${pct(d.fc)}</td>
              <td class="ta-r">${rub(d.profit)}</td>
              <td class="ta-c">${d.port}</td>
              <td>${d.custom
                ? `<button class="btn btn-outline" style="padding:3px 10px;font-size:11px;color:var(--red);border-color:#f4b8c4" onclick="if(confirm('Удалить «${d.name.replace(/'/g,"\\\\'")}» из меню?')){deleteDrink(${d.id});openDropCandidates();}">Удалить</button>`
                : `<span style="font-size:11px;color:var(--muted)">базовый</span>`}</td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>
      <div class="hint" style="margin-top:14px"><i data-lucide="info" class="icon"></i> Базовые напитки нельзя удалить, но вы можете отредактировать их (рецепт/цену) или просто игнорировать в плане продаж.</div>`;
  }
  openModal('modal-drop');
  if (window.lucide) lucide.createIcons();
}

// ════════════════════════════════════════════════════════════════════
//  TECH CARDS PDF (по ГОСТ Р 53105 / СанПиН)
// ════════════════════════════════════════════════════════════════════
function exportTechCards() {
  const loc = activeLoc();
  const orgName = loc?.name || 'Кофейня';
  const today = new Date().toLocaleDateString('ru');
  const year = new Date().getFullYear();

  let list = DRINKS.slice();
  if (recipeGroup !== 'all') list = list.filter(d => d.group === recipeGroup);
  if (recipeSearch) list = list.filter(d => d.name.toLowerCase().includes(recipeSearch.toLowerCase()));
  if (!list.length) { alert('Нет напитков для печати с текущими фильтрами.'); return; }

  const groupNames = { hot:'Горячие кофейные', tea:'Чай и матча', cold:'Холодные напитки', filter:'Фильтр-кофе' };

  const pages = list.map((d, idx) => {
    const recipeRows = d.recipe.filter(r => MAT[r.mat]).map(r => {
      const m = MAT[r.mat];
      const loss = r.loss ? (r.loss * 100).toFixed(0) + '%' : '—';
      const brutto = r.loss ? (r.amt / (1 - r.loss)).toFixed(1) : r.amt.toString();
      const cost = calcIngCost(r);
      return `<tr><td>${m.name}</td><td class="c">${m.unit.replace(/^1\s*/,'')}</td><td class="r">${brutto}</td><td class="r">${r.amt}</td><td class="c">${loss}</td><td class="r b">${Math.round(cost)} ₽</td></tr>`;
    }).join('');
    const totalCost = d.recipe.filter(r=>MAT[r.mat]).reduce((s,r)=>s+calcIngCost(r),0);

    const techText = d.group === 'hot'
      ? 'В подготовленную чашку приготовить эспрессо (одинарный/двойной согласно рецептуре). Вспенить молоко/сливки до температуры 60–65°C. Соединить компоненты согласно технологии напитка. При необходимости добавить сиропы/добавки. Подавать немедленно при температуре 60–65°C.'
      : d.group === 'tea'
      ? 'Чай: заварить кипятком (95°C) согласно дозировке, настаивать 3–5 минут. Матча: венчиком взбить порошок матча с горячей водой (80°C) до однородной пены, добавить молоко температурой 60°C. Подавать при температуре 60–65°C.'
      : 'Все компоненты предварительно охладить до +4°C. В стакан со льдом (3–4 кубика) последовательно влить ингредиенты согласно рецептуре. Перемешать барной ложкой. Подавать немедленно при температуре +4…+8°C.';

    const isCold = d.group === 'cold';

    return `<div class="card${idx < list.length-1 ? ' pb' : ''}">
  <div class="card-header">
    <div class="approve">
      <div><b>Утверждаю:</b> руководитель ${orgName}</div>
      <div style="margin-top:10px">_______________________</div>
      <div style="margin-top:6px">«__» ____________ ${year} г.</div>
    </div>
  </div>
  <h1>ТЕХНОЛОГИЧЕСКАЯ КАРТА № ${d.id + 1}</h1>
  <p class="gost">(по ГОСТ Р 53105-2008)</p>

  <table class="info">
    <tr><td class="lbl">Наименование изделия</td><td>${d.name}</td></tr>
    <tr><td class="lbl">Группа</td><td>${groupNames[d.group]||'—'}</td></tr>
    <tr><td class="lbl">Выход готового изделия</td><td>${d.vol} мл (1 порция)</td></tr>
    <tr><td class="lbl">Дата составления</td><td>${today}</td></tr>
    <tr><td class="lbl">Срок реализации</td><td>${isCold ? '30 минут с момента приготовления' : '15 минут с момента приготовления'}</td></tr>
    <tr><td class="lbl">Условия хранения сырья</td><td>+2…+6 °C для молочных продуктов, сухие при +18 °C</td></tr>
  </table>

  <h2>РЕЦЕПТУРА</h2>
  <table>
    <thead><tr><th>Сырьё / полуфабрикат</th><th>Ед.</th><th>Брутто</th><th>Нетто</th><th>Потери</th><th>Стоимость</th></tr></thead>
    <tbody>${recipeRows}
    <tr class="total"><td colspan="5">ИТОГО</td><td class="r b">${Math.round(totalCost)} ₽</td></tr>
    </tbody>
  </table>

  <h2>ТЕХНОЛОГИЯ ПРИГОТОВЛЕНИЯ</h2>
  <p class="tech">${techText}</p>

  <h2>ПОКАЗАТЕЛИ КАЧЕСТВА И БЕЗОПАСНОСТИ</h2>
  <table class="qa">
    <tr><td class="lbl">Внешний вид</td><td>${isCold ? 'Однородный напиток со льдом, без расслоения' : 'Однородный напиток с устойчивой пеной'}</td></tr>
    <tr><td class="lbl">Консистенция</td><td>${isCold ? 'Жидкая, прохладная' : 'Жидкая, кремовая текстура у пены'}</td></tr>
    <tr><td class="lbl">Цвет</td><td>Соответствует рецептурным компонентам</td></tr>
    <tr><td class="lbl">Вкус и запах</td><td>Свойственный использованным продуктам, без посторонних привкусов и запахов</td></tr>
  </table>

  <div class="sign">
    <span>Технолог: ____________________</span>
    <span>Зав. производством: ____________________</span>
  </div>
</div>`;
  }).join('\n');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Технологические карты — ${orgName}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; color: #222; }
  @page { size: A4; margin: 15mm 12mm; }
  .card { padding: 0 0 10px; }
  .pb { page-break-after: always; }
  .card-header { display: flex; justify-content: flex-end; margin-bottom: 10px; }
  .approve { text-align: left; border: 1px solid #aaa; padding: 8px 12px; font-size: 9pt; min-width: 220px; }
  h1 { text-align: center; font-size: 13pt; margin: 8px 0 2px; }
  .gost { text-align: center; font-size: 9pt; color: #555; margin-bottom: 12px; }
  h2 { font-size: 10pt; color: #417033; margin: 12px 0 5px; text-transform: uppercase; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 9pt; }
  th { background: #417033; color: #fff; padding: 4px 6px; text-align: left; }
  td { padding: 3px 6px; border: 1px solid #ccc; }
  table.info td, table.qa td { border: 1px solid #bbb; }
  .lbl { font-weight: bold; background: #f0f5ee; width: 38%; }
  .r { text-align: right; }
  .c { text-align: center; }
  .b { font-weight: bold; }
  tr.total td { font-weight: bold; background: #f0f5ee; }
  .tech { line-height: 1.5; margin-bottom: 8px; }
  .sign { display: flex; justify-content: space-between; margin-top: 20px; font-size: 9pt; }
  @media print { th { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .lbl { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body>
${pages}
</body></html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.onload = () => w.print();
}

// ════════════════════════════════════════════════════════════════════
//  TAB NAVIGATION
// ════════════════════════════════════════════════════════════════════
function switchTab(tab) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.mobile-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  activeTab = tab;
  document.getElementById('tab-' + activeTab).classList.add('active');
  if (dirty[activeTab]) { renderTab(activeTab); dirty[activeTab] = false; }
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

const mobileTabbar = document.getElementById('mobile-tabbar');
if (mobileTabbar) {
  mobileTabbar.addEventListener('click', e => {
    const btn = e.target.closest('.mobile-tab');
    if (btn) switchTab(btn.dataset.tab);
  });
}

// ════════════════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════════════════
// Восстанавливаем сохранённое состояние
loadLocIndex();
// Миграция со старого формата (mbs_coffee_s) → loc_default
if (!Loc.list.length) {
  try {
    if (localStorage.getItem(OLD_STATE_KEY)) migrateOldState();
  } catch(e) {}
}
// Если всё ещё нет локаций — создаём дефолтную
if (!Loc.list.length) {
  Loc.list = [{ id: 'loc_default', name: 'Моя кофейня', icon: '☕' }];
  Loc.activeId = 'loc_default';
  saveLocIndex();
}
if (!Loc.activeId) { Loc.activeId = Loc.list[0].id; saveLocIndex(); }
loadState();
renderLocSwitcherUI();
try {
  if (localStorage.getItem('mbs_theme') === 'dark') {
    document.body.classList.add('dark');
    const icon = document.getElementById('theme-icon');
    if (icon) icon.setAttribute('data-lucide', 'sun');
  }
  // Онбординг при первом визите
  if (!localStorage.getItem('mbs_onboard')) {
    document.getElementById('onboarding').style.display = 'block';
  }
} catch(e) {}

['dashboard','cost','sales','finmodel','recipes'].forEach(t => { renderTab(t); dirty[t]=false; });
if (window.lucide) lucide.createIcons();

// Tooltip: единый div#tip-box, следует за курсором — без CSS ::after и race condition
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
    // позиционируем по курсору
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

// Выделяем содержимое поля только при Tab-навигации (не при клике/спиннере)
let _kbNav = false;
document.addEventListener('keydown',   () => { _kbNav = true;  }, true);
document.addEventListener('mousedown', () => { _kbNav = false; }, true);
document.addEventListener('focus', e => {
  if (e.target.matches('.inp') && _kbNav) e.target.select();
}, true);
