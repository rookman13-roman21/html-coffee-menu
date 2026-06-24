// ════════════════════════════════════════════════════════════════════
//  RENDER — DASHBOARD  (src/render/dashboard.js)
//  Калькулятор стартовых вложений в открытие кофейни
// ════════════════════════════════════════════════════════════════════

import { S, saveState } from '../state/store.js';
import { rub } from '../utils/format.js';
import { isWorkspaceOwner, requireWorkspaceOwner } from '../ui/auth.js';

// ─── Stub exports (совместимость с updaters.js / main.js) ────────────
export function filterDashboard() {}
export function setDashGroup() {}
export function toggleDashIntro() {
  S.dashHintOpen = !S.dashHintOpen;
  saveState();
  renderDashboard();
  if (window.lucide) lucide.createIcons();
}
export function toggleTop10() {}
export function initTop10Collapse() {}

// ─── Категории расходов ──────────────────────────────────────────────
const _ico = d => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;flex-shrink:0">${d}</svg>`;

export const OC_CATS = {
  renovation:  { icon: _ico('<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>'),  label: 'Ремонт и отделка' },
  equipment:   { icon: _ico('<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/>'),   label: 'Оборудование' },
  furniture:   { icon: _ico('<rect x="2" y="12" width="20" height="8" rx="2"/><rect x="4" y="6" width="4" height="8" rx="1"/><rect x="16" y="6" width="4" height="8" rx="1"/>'),   label: 'Мебель и интерьер' },
  automation:  { icon: _ico('<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>'),  label: 'Автоматизация' },
  stock:       { icon: _ico('<path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" x2="12" y1="22" y2="12"/>'),       label: 'Стартовый склад' },
  branding:    { icon: _ico('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'),    label: 'Брендинг' },
  legal:       { icon: _ico('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/>'),       label: 'Юридическое оформление' },
  marketing:   { icon: _ico('<path d="M3 11l18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>'),   label: 'Маркетинг запуска' },
  rent:        { icon: _ico('<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'),        label: 'Депозит / аванс аренды' },
  uniform:     { icon: _ico('<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/>'),     label: 'Форма и инвентарь' },
  training:    { icon: _ico('<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>'),    label: 'Обучение персонала' },
  reserve:     { icon: _ico('<circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/>'),     label: 'Оборотный резерв' },
};

export const OC_FORMATS = {
  kiosk:  { label: 'Киоск',       icon: '🏪', desc: '4–8 м² · ~1,5–2 млн ₽' },
  island: { label: 'Остров в ТЦ', icon: '🛍', desc: '6–15 м² · ~2–3,5 млн ₽' },
  full:   { label: 'Кофейня',     icon: '☕', desc: '30–50 м² · ~6–9 млн ₽' },
};

// ─── Шаблоны ─────────────────────────────────────────────────────────
const _t = (cat, name, price, qty, url = '') => ({ category: cat, name, price, qty, url, note: '' });

// Оборудование для шаблона «Киоск» — имя → qty (строгий whitelist)
const OC_KIOSK_EQUIPMENT = {
  'Весы с таймером Timemore Black Mirror Basic 2':      1,
  'Врезной ринзер для питчера Inox':                    1,
  'Нок Бокс из нержавеющей стали 150х150мм':           2,
  'Диспенсер для стаканов Doppio 4 секции':             1,
  'Блендер Nutribullet NBF550DG':                       1,
  'Витрина холодильная EQTA Gusto К 850 Д':            1,
  'Водонагреватель Marco MT8':                          1,
  'HIWATER RO 400 LITE':                                1,
  'Гриль прижимной Airhot CGL':                        1,
  'Контейнер для мусора Rubbermaid Slim Jim':           1,
  'Микроволновая печь LG MS-2042DB':                   1,
  'Кофеварка Marco Bru F60M':                           1,
  'Кофемашина Sanremo D8.2 PRO':                        1,
  'Кофемолка EUREKA DROGHERIA/4 85':                   1,
  'Льдогенератор Brema CB 416A HC B-QUBE':             1,
  'Морозильник Бирюса M6048':                          1,
  'Соковыжималка Bork Z800':                           1,
  'Холодильный шкаф Бирюса В152':                      1,
};

export const OC_TEMPLATES = {
  kiosk: [
    _t('renovation', 'Электромонтажные работы',          70000,  1),
    _t('renovation', 'Водоснабжение и канализация',       55000,  1),
    _t('renovation', 'Покраска / брендирование фасада',  100000,  1),
    _t('equipment',  'Весы с таймером Timemore Black Mirror Basic 2', 5350,   1),
    _t('equipment',  'Врезной ринзер для питчера Inox',               4000,   1),
    _t('equipment',  'Нок Бокс из нержавеющей стали 150х150мм',       5000,   2),
    _t('equipment',  'Диспенсер для стаканов Doppio 4 секции',        1734,   1),
    _t('equipment',  'Блендер Nutribullet NBF550DG',                   5990,   1),
    _t('equipment',  'Витрина холодильная EQTA Gusto К 850 Д',       75849,   1),
    _t('equipment',  'Водонагреватель Marco MT8',                    103645,   1),
    _t('equipment',  'HIWATER RO 400 LITE',                           89000,   1, 'https://hiwater.ru/tproduct/461566380-928876245663-hiwater-ro-400-lite'),
    _t('equipment',  'Гриль прижимной Airhot CGL',                   11426,   1),
    _t('equipment',  'Контейнер для мусора Rubbermaid Slim Jim',      18331,   1),
    _t('equipment',  'Микроволновая печь LG MS-2042DB',               7050,   1),
    _t('equipment',  'Кофеварка Marco Bru F60M',                      61275,   1),
    _t('equipment',  'Кофемашина Sanremo D8.2 PRO',                  652000,   1, 'https://baristaschool.ru/mixology_drinks/tproduct/1196237361-826720707702-kofemashina-sanremo-d8-pro-2-visokie-gru'),
    _t('equipment',  'Кофемолка EUREKA DROGHERIA/4 85',              110270,   1),
    _t('equipment',  'Льдогенератор Brema CB 416A HC B-QUBE',        160084,   1),
    _t('equipment',  'Морозильник Бирюса M6048',                      22794,   1),
    _t('equipment',  'Соковыжималка Bork Z800',                       33000,   1),
    _t('equipment',  'Холодильный шкаф Бирюса В152',                  29070,   1),
    _t('furniture',  'Стойка под оборудование (готовая)',360000,  1),
    _t('furniture',  'Барная полка / витрина',            55000,  1),
    _t('automation', 'POS-терминал (онлайн-касса)',       25000,  1),
    _t('automation', 'Принтер чеков',                      8000,  1),
    _t('automation', 'Эквайринг (подключение)',             5000,  1),
    _t('stock',      'Кофе зерновой (старт 30 кг)',         2000, 30, 'https://b2b.rockets.coffee'),
    _t('stock',      'Молоко и альтмолоко',                  120,200),
    _t('stock',      'Сиропы, топпинги, добавки',            900,  5),
    _t('stock',      'Стаканы, крышки, трубочки',          20000,  1),
    _t('branding',   'Разработка логотипа',               25000,  1),
    _t('branding',   'Дизайн меню и наклеек',             15000,  1),
    _t('legal',      'Регистрация ИП / ООО',               4000,  1),
    _t('legal',      'Санитарные книжки сотрудников',      4000,  2),
    _t('marketing',  'Печать рекламных материалов',       15000,  1),
    _t('marketing',  'Таргетированная реклама (запуск)',  20000,  1),
    _t('rent',       'Депозит аренды (2 месяца)',         80000,  2),
    _t('uniform',    'Фирменные фартуки',                  5000,  3),
    _t('training',   'Обучение бариста',                  15000,  1),
    _t('reserve',    'Оборотный резерв (3 месяца)',       150000,  3),
  ],
  island: [
    _t('renovation', 'Проектирование и дизайн острова',   40000,  1),
    _t('renovation', 'Электромонтажные работы',           45000,  1),
    _t('renovation', 'Водоснабжение и канализация',       35000,  1),
    _t('renovation', 'Вентиляция',                        30000,  1),
    _t('equipment',  'Кофемашина (2 группы)',             320000, 1, 'https://b2b.rockets.coffee'),
    _t('equipment',  'Кофегриндер основной',              60000,  1),
    _t('equipment',  'Кофегриндер on-demand',             40000,  1),
    _t('equipment',  'Холодильный шкаф 120 л',            55000,  1),
    _t('equipment',  'Льдогенератор',                     30000,  1),
    _t('equipment',  'Бойлер / колонка для кипятка',      15000,  1),
    _t('equipment',  'Блендер профессиональный',          25000,  1),
    _t('furniture',  'Барная стойка (изготовление)',     150000,  1),
    _t('furniture',  'Стеллаж / витрина',                 40000,  1),
    _t('furniture',  'Высокие табуреты',                   3000,  4),
    _t('automation', 'POS-терминал (онлайн-касса)',       30000,  1),
    _t('automation', 'Дисплей для покупателя',             8000,  1),
    _t('automation', 'Принтер чеков',                      8000,  1),
    _t('automation', 'Эквайринг (подключение)',             5000,  1),
    _t('stock',      'Кофе зерновой (старт 8 кг)',          8000,  8, 'https://b2b.rockets.coffee'),
    _t('stock',      'Молоко и альтмолоко',                3000, 15),
    _t('stock',      'Сиропы, топпинги, добавки',         35000,  1),
    _t('stock',      'Стаканы, крышки, трубочки',         30000,  1),
    _t('branding',   'Разработка логотипа и айдентики',   30000,  1),
    _t('branding',   'Брендбук',                          20000,  1),
    _t('branding',   'Дизайн меню и POS-материалов',      15000,  1),
    _t('legal',      'Регистрация ИП / ООО',               4000,  1),
    _t('legal',      'Санитарные книжки',                  3000,  3),
    _t('marketing',  'Печать рекламных материалов',       15000,  1),
    _t('marketing',  'Таргетированная реклама (запуск)',  30000,  1),
    _t('marketing',  'Съёмка для соцсетей',               15000,  1),
    _t('rent',       'Депозит аренды (2 месяца)',        100000,  1),
    _t('uniform',    'Фирменные фартуки и футболки',       3000,  4),
    _t('training',   'Обучение бариста (курс)',            20000,  2),
    _t('reserve',    'Оборотный резерв (3 месяца)',       150000, 1),
  ],
  full: [
    _t('renovation', 'Дизайн-проект интерьера',           80000,  1),
    _t('renovation', 'Электромонтажные работы',           80000,  1),
    _t('renovation', 'Водоснабжение и канализация',       60000,  1),
    _t('renovation', 'Вентиляция и вытяжка',              80000,  1),
    _t('renovation', 'Чистовая отделка (пол, стены)',    200000,  1),
    _t('renovation', 'Потолок / освещение',               60000,  1),
    _t('equipment',  'Кофемашина (2 группы, профи)',     450000,  1, 'https://b2b.rockets.coffee'),
    _t('equipment',  'Кофегриндер основной',              80000,  1),
    _t('equipment',  'Кофегриндер on-demand',             50000,  1),
    _t('equipment',  'Холодильный шкаф 300 л',            90000,  1),
    _t('equipment',  'Льдогенератор',                     40000,  1),
    _t('equipment',  'Бойлер / диспенсер',                20000,  1),
    _t('equipment',  'Блендер профессиональный',          30000,  1),
    _t('equipment',  'Посудомоечная машина',              70000,  1),
    _t('equipment',  'Кофемолка для фильтра',             30000,  1),
    _t('furniture',  'Барная стойка (изготовление)',     250000,  1),
    _t('furniture',  'Столы',                             15000,  6),
    _t('furniture',  'Стулья',                             5000, 16),
    _t('furniture',  'Диваны / мягкая зона',              40000,  2),
    _t('furniture',  'Витрина для выпечки',               35000,  1),
    _t('automation', 'POS-система (программа + терминал)',45000,  1),
    _t('automation', 'Дисплей покупателя',                10000,  1),
    _t('automation', 'Принтер чеков',                      8000,  1),
    _t('automation', 'Эквайринг (подключение)',             5000,  1),
    _t('automation', 'Камеры видеонаблюдения',             8000,  3),
    _t('stock',      'Кофе зерновой (старт 15 кг)',        8000, 15, 'https://b2b.rockets.coffee'),
    _t('stock',      'Молоко и альтмолоко',                3000, 25),
    _t('stock',      'Сиропы, топпинги, добавки',         50000,  1),
    _t('stock',      'Стаканы, крышки, трубочки',         40000,  1),
    _t('stock',      'Выпечка / кондитерка (открытие)',   30000,  1),
    _t('branding',   'Разработка логотипа и айдентики',   50000,  1),
    _t('branding',   'Брендбук',                          40000,  1),
    _t('branding',   'Дизайн меню и упаковки',            25000,  1),
    _t('branding',   'Вывеска наружная',                  30000,  1),
    _t('legal',      'Регистрация ИП / ООО',               4000,  1),
    _t('legal',      'Регистрация товарного знака',       33000,  1),
    _t('legal',      'Санитарные книжки сотрудников',      3000,  4),
    _t('legal',      'Разработка меню (тех. карты)',      15000,  1),
    _t('marketing',  'Съёмка для соцсетей',               20000,  1),
    _t('marketing',  'Таргетированная реклама',           50000,  1),
    _t('marketing',  'Печать меню и рекламных матер.',    20000,  1),
    _t('marketing',  'Открытие / ивент-программа',        30000,  1),
    _t('rent',       'Депозит аренды (2 месяца)',        200000,  1),
    _t('uniform',    'Фирменная форма сотрудников',        4000,  5),
    _t('training',   'Обучение бариста',                  20000,  3),
    _t('reserve',    'Оборотный резерв (3 месяца)',       250000, 1),
  ],
};

// ─── Утилиты ──────────────────────────────────────────────────────────
let _ocIdSeed = 1;
function _ocNextId() { return 'oc_' + (++_ocIdSeed) + '_' + Date.now(); }

export function _ocCalcTotal(costs) {
  return (costs || []).reduce((sum, r) => sum + (r.price * r.qty), 0);
}

function _ocMeta() { return S.openingMeta || {}; }

// ─── Плейсхолдеры по категориям ──────────────────────────────────────
const OC_PLACEHOLDERS = {
  renovation: 'Ремонт стен и потолка',
  equipment:  'Кофемашина La Marzocco',
  furniture:  'Барная стойка (изготовление)',
  automation: 'POS-система iiko / r_keeper',
  stock:      'Кофе зерновой 5 кг',
  branding:   'Разработка логотипа',
  legal:      'Регистрация ИП',
  marketing:  'Таргетированная реклама (запуск)',
  rent:       'Депозит аренды 2 месяца',
  uniform:    'Фирменные фартуки и футболки',
  training:   'Обучение бариста (курс)',
  reserve:    'Оборотный резерв на 3 месяца',
};

export function _ocFmtAmt(amount) {
  const meta = _ocMeta();
  const cur = meta.currency || 'RUB';
  if (cur === 'RUB') return rub(amount);
  const rate = cur === 'USD' ? (meta.usdRate || 90) : (meta.eurRate || 98);
  const sym  = cur === 'USD' ? '$' : '€';
  const val  = amount / rate;
  const fmt  = val >= 1000
    ? (val / 1000).toFixed(1).replace('.', ',') + ' тыс.'
    : Math.round(val).toLocaleString('ru');
  return `~${sym}${fmt}`;
}

function _ocDispPrice(item) {
  const meta = _ocMeta();
  const cur  = meta.currency || 'RUB';
  if (cur === 'RUB') return item.price;
  const rate = cur === 'USD' ? (meta.usdRate || 90) : (meta.eurRate || 98);
  return Math.round(item.price / rate);
}

function _ocFlashSaved() {
  const el = document.getElementById('oc-saved-badge');
  if (!el) return;
  el.classList.add('visible');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('visible'), 2000);
}

function _ocSyncInvestment() {
  S.investment = _ocCalcTotal(S.openingCosts);
  saveState();
  _ocFlashSaved();
}

function _ocActivitySummary(verb, item = {}) {
  const cat = OC_CATS[item.category]?.label || item.category || 'Без категории';
  const name = (item.name || '').trim() || 'без названия';
  const total = (Number(item.price) || 0) * (Number(item.qty) || 0);
  const amount = total > 0 ? ` · ${_ocFmtAmt(total)}` : '';
  return `${verb}: ${cat} · ${name}${amount}`;
}

function _ocActivitySnapshot(item = {}) {
  return JSON.stringify({
    category: item.category || '',
    name: item.name || '',
    price: Number(item.price) || 0,
    qty: Number(item.qty) || 0,
    url: item.url || '',
    note: item.note || '',
    subcategory: item.subcategory || '',
  });
}

const _ocPendingCreateIds = new Set();

// ─── Операции с записями (экспортируются в window через main.js) ─────
export function ocAddRow(category) {
  if (!S.openingCosts) S.openingCosts = [];
  const id = _ocNextId();
  const item = { id, category, name: '', price: 0, qty: 1, url: '', note: '' };
  S.openingCosts.push(item);
  _ocPendingCreateIds.add(String(id));
  _ocSyncInvestment();
  renderDashboard();
  setTimeout(() => ocOpenItem(id), 40);
}

export function ocDeleteRow(id) {
  const item = (S.openingCosts || []).find(r => r.id === id);
  S.openingCosts = (S.openingCosts || []).filter(r => r.id !== id);
  _ocSyncInvestment();
  window.logWorkspaceActivity?.('opening_costs_changed', 'opening_cost', id, _ocActivitySummary('Удалена позиция', item || {}));
  renderDashboard();
}

export function ocUpdateField(id, field, rawVal) {
  const item = (S.openingCosts || []).find(r => r.id === id);
  if (!item) return;
  if (field === 'price' || field === 'qty') {
    let val = parseFloat(rawVal) || 0;
    if (field === 'price') {
      const meta = _ocMeta();
      const cur  = meta.currency || 'RUB';
      if (cur !== 'RUB') {
        const rate = cur === 'USD' ? (meta.usdRate || 90) : (meta.eurRate || 98);
        val = Math.round(val * rate);
      }
    }
    item[field] = val;
  } else {
    item[field] = rawVal;
  }
  _ocSyncInvestment();
  window.clearTimeout(window._workspaceOcLogTimer);
  window._workspaceOcLogTimer = window.setTimeout(() => {
    window.logWorkspaceActivity?.('opening_costs_changed', 'opening_cost', id, _ocActivitySummary('Изменена позиция', item));
  }, 1200);
  // Обновляем только ячейку итога и KPI без полного ре-рендера
  const rowEl = document.querySelector(`[data-oc-id="${id}"]`);
  if (rowEl) {
    const tot = rowEl.querySelector('.oc-row-total');
    if (tot) tot.textContent = _ocFmtAmt(item.price * item.qty);
    // Обновляем иконку ссылки без ре-рендера
    if (field === 'url') {
      const wrap = rowEl.querySelector('.oc-row-url-wrap');
      if (wrap) {
        let a = wrap.querySelector('.oc-url-open');
        if (item.url && !a) {
          a = document.createElement('a');
          a.className = 'oc-url-open';
          a.target = '_blank';
          a.title = 'Открыть ссылку';
          a.innerHTML = '<i data-lucide="external-link" class="icon"></i>';
          wrap.appendChild(a);
          if (window.lucide) lucide.createIcons({ nodes: [a] });
        } else if (!item.url && a) {
          a.remove();
        }
        if (a && item.url) a.href = item.url;
      }
    }
  }
  _ocUpdateKPIBar();
}

export function ocLoadTemplate(format) {
  window.showConfirm(
    `Загрузить шаблон «${OC_FORMATS[format]?.label}»?<br><span style="font-size:12px;color:var(--muted)">Текущий список будет заменён.</span>`,
    async () => {
      const tpl = OC_TEMPLATES[format] || [];
      // base вычисляется ПОСЛЕ загрузки libEquipment — см. ниже
      let base = [];

      // Загружаем оборудование из библиотеки
      let libEquipment = [];
      try {
        // Сначала пробуем пресет для данного формата
        const presetR = await fetch('https://barista-school.online/api/oc-presets/' + format + '?t=' + Date.now());
        if (presetR.ok) {
          const presetData = await presetR.json();
          if (Array.isArray(presetData) && presetData.length > 0) {
            libEquipment = presetData.map(i => ({
              category:    i.category || 'equipment',
              subcategory: i.subcategory || '',
              name: i.name,
              price: i.price || 0,
              qty: i.qty || 1,
              url: i.url || '',
              photo: i.photo || '',
              description: i.description || '',
              promo_code: i.promo_code || '',
              promo_expires: i.promo_expires || '',
              is_featured: i.is_featured || 0,
              note: '',
            }));
          }
        }
      } catch (_) { /* fallback ниже */ }

      // Если пресет пустой — загружаем из библиотеки (старый fallback)
      if (!libEquipment.length) {
        try {
          const r = await fetch('https://barista-school.online/api/oc-library?category=equipment&t=' + Date.now());
          if (r.ok) {
            const data = await r.json(); // { subcategory: [{name,price,url,is_featured,...}] }
            _oclibData = data; // обновляем кэш
            const allItems = Object.entries(data).flatMap(([subcat, items]) =>
              items.filter(i => i.is_public !== 0).map(i => ({ ...i, subcategory: subcat }))
            );
            if (format === 'kiosk') {
              // Киоск: строгий whitelist по имени + кастомный qty
              const seen = new Set();
              libEquipment = allItems
                .filter(i => OC_KIOSK_EQUIPMENT.hasOwnProperty(i.name) && !seen.has(i.name) && seen.add(i.name))
                .map(i => ({
                  category: i.category || 'equipment',
                  subcategory: i.subcategory || '',
                  name: i.name,
                  price: i.price || 0,
                  qty: OC_KIOSK_EQUIPMENT[i.name] || 1,
                  url: i.url || '',
                  photo: i.photo || '',
                  description: i.description || '',
                  promo_code: i.promo_code || '',
                  promo_expires: i.promo_expires || '',
                  is_featured: i.is_featured || 0,
                  note: '',
                }));
            } else {
              // Остальные форматы: берём featured, иначе все публичные
              const featured = allItems.filter(i => i.is_featured);
              const source = featured.length ? featured : allItems;
              libEquipment = source.map(i => ({
                category: i.category || 'equipment',
                subcategory: i.subcategory || '',
                name: i.name,
                price: i.price || 0,
                qty: 1,
                url: i.url || '',
                photo: i.photo || '',
                description: i.description || '',
                promo_code: i.promo_code || '',
                promo_expires: i.promo_expires || '',
                is_featured: i.is_featured || 0,
                note: '',
              }));
            }
          }
        } catch (_) { /* fallback к захардкоженным */ }
      }

      // Если и библиотека пустая — используем статику из шаблона
      if (!libEquipment.length) {
        libEquipment = tpl.filter(item => item.category === 'equipment');
      }

      // Исключаем из шаблона категории, которые уже покрыты libEquipment
      const libCats = new Set(libEquipment.map(i => i.category || 'equipment'));
      base = tpl.filter(item => !libCats.has(item.category || 'equipment'));
      const merged = [...libEquipment, ...base];
      S.openingCosts = merged.map((item, i) => ({ ...item, id: 'tpl_' + i + '_' + Date.now() }));
      S.openingMeta  = { ...(S.openingMeta || {}), format };
      _ocSyncInvestment();
      renderDashboard();
    }
  );
}

export function ocSetFormat(format) {
  S.openingMeta = { ...(S.openingMeta || {}), format };
  saveState();
  document.querySelectorAll('.oc-fmt-btn').forEach(b => b.classList.toggle('active', b.dataset.fmt === format));
  // Обновляем кнопку шаблона
  const tBtn = document.getElementById('oc-tpl-btn');
  const tNote = document.getElementById('oc-tpl-note');
  if (tBtn)  tBtn.setAttribute('onclick', `ocLoadTemplate('${format}')`);
  if (tBtn)  tBtn.innerHTML = `<i data-lucide="sparkles" class="icon"></i> Загрузить шаблон «${OC_FORMATS[format].label}»`;
  if (tNote) tNote.textContent = OC_FORMATS[format].desc;
  if (window.lucide) lucide.createIcons({ nodes: tBtn ? [tBtn] : [] });
}

export function ocSetCurrency(cur) {
  S.openingMeta = { ...(S.openingMeta || {}), currency: cur };
  saveState();
  renderDashboard();
}

export function ocSetCategorySort(sort) {
  const allowed = ['manual', 'cost_desc', 'cost_asc', 'count_desc', 'count_asc', 'name_asc'];
  S.openingMeta = { ...(S.openingMeta || {}), categorySort: allowed.includes(sort) ? sort : 'manual' };
  saveState();
  renderDashboard();
}

export function ocToggleCategorySort(kind) {
  const meta = S.openingMeta || {};
  let next = 'manual';
  if (kind === 'cost') next = meta.categorySort === 'cost_desc' ? 'cost_asc' : 'cost_desc';
  else if (kind === 'count') next = meta.categorySort === 'count_desc' ? 'count_asc' : 'count_desc';
  S.openingMeta = { ...meta, categorySort: next };
  saveState();
  renderDashboard();
}

export function ocSetCategorySearch(value) {
  const search = String(value || '');
  S.openingMeta = { ...(S.openingMeta || {}), categorySearch: search };
  saveState();
  renderDashboard();
  setTimeout(() => {
    const input = document.getElementById('oc-search-input');
    if (!input) return;
    input.focus();
    input.setSelectionRange(search.length, search.length);
  }, 0);
}

export function ocSetCategoryCollapseAll(collapsed) {
  const next = {};
  Object.keys(OC_CATS).forEach(cat => { next[cat] = !!collapsed; });
  S.openingMeta = { ...(S.openingMeta || {}), collapsed: next };
  saveState();
  renderDashboard();
}

export function ocUpdateRate(cur, val) {
  const rate = parseFloat(val) || (cur === 'USD' ? 90 : 98);
  const key  = cur === 'USD' ? 'usdRate' : 'eurRate';
  S.openingMeta = { ...(S.openingMeta || {}), [key]: rate };
  saveState();
  renderDashboard();
}

export function ocToggleCat(cat) {
  const m = S.openingMeta || {};
  const collapsed = { ...(m.collapsed || {}) };
  collapsed[cat] = !collapsed[cat];
  S.openingMeta = { ...m, collapsed };
  saveState();
  const section = document.querySelector(`.oc-cat-section[data-cat="${cat}"]`);
  if (section) {
    const isCol = !!collapsed[cat];
    section.classList.toggle('collapsed', isCol);
    const chevron = section.querySelector('.oc-cat-chevron');
    if (chevron) chevron.style.transform = isCol ? 'rotate(-90deg)' : '';
  }
}

export function ocMoveRow(id, newCat) {
  const item = (S.openingCosts || []).find(r => r.id === id);
  if (!item || item.category === newCat) return;
  item.category = newCat;
  _ocSyncInvestment();
  renderDashboard();
}

export function ocClearAll() {
  if (!requireWorkspaceOwner('Очистка всех статей бюджета доступна только владельцу проекта.')) return;
  window.showConfirm(
    'Очистить все статьи расходов?<br><span style="font-size:12px;color:var(--muted)">Действие нельзя отменить.</span>',
    () => {
      const count = Array.isArray(S.openingCosts) ? S.openingCosts.length : 0;
      S.openingCosts = [];
      _ocSyncInvestment();
      window.logWorkspaceActivity?.('opening_costs_changed', 'opening_costs', 'all', `Очищен бюджет открытия: удалено ${count} позиций`, { count });
      renderDashboard();
    }
  );
}

function _ociRenderPromoBlock(libItem) {
  const promoBox = document.getElementById('oci-promo-block');
  if (!promoBox) return;
  const desc = libItem && libItem.description ? libItem.description.trim() : '';
  const code = libItem && libItem.promo_code ? libItem.promo_code.trim() : '';
  const exp  = libItem && libItem.promo_expires ? libItem.promo_expires.trim() : '';
  if (!desc && !code) { promoBox.style.display = 'none'; return; }
  let html = '';
  if (desc) html += `<p class="oci-promo-desc">${desc}</p>`;
  if (code) {
    let expHtml = '';
    if (exp) {
      const d = new Date(exp);
      const fmt = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
      expHtml = `<span class="oci-promo-exp">Действует до ${fmt}</span>`;
    }
    html += `<div class="oci-promo-code-row">
      <div class="oci-promo-code-pill" title="Нажмите, чтобы скопировать" onclick="navigator.clipboard.writeText('${code}').then(()=>{const b=this.querySelector('.oci-promo-copy-btn');b.textContent='✓ Скопировано';b.style.background='#86efac';setTimeout(()=>{b.textContent='Скопировать';b.style.background=''},1800)})">
        <span class="oci-promo-code">${code}</span>
        <button class="oci-promo-copy-btn">Скопировать</button>
      </div>
    </div>
    ${expHtml}`;
  }
  promoBox.innerHTML = '<div class="oci-promo-header"><span>🏷️</span> Промокод партнёра</div>' + html;
  promoBox.style.display = '';
}

export function ocOpenItem(id) {
  const item = (S.openingCosts || []).find(r => r.id === id);
  if (!item) return;
  const meta = _ocMeta();
  const cur  = meta.currency || 'RUB';
  const sym  = cur === 'USD' ? '$' : cur === 'EUR' ? '€' : '₽';
  const info = OC_CATS[item.category];

  document.getElementById('oci-title').textContent = item.name || 'Без названия';
  // Обновляет badge ⭐ — вызывается сразу и повторно после загрузки библиотеки
  const _refreshCatLabel = (featured) => {
    const el = document.getElementById('oci-cat-label');
    if (el) el.innerHTML = (info ? info.icon + '\u2009' + info.label : '') +
      (featured ? ' <span class="oci-featured-badge">⭐ Рекомендуем</span>' : '');
  };
  // Проверяем item.is_featured, затем ищем по имени в _oclibData (кэш)
  const _libFeatured = () => {
    if (!_oclibData || !item.name) return false;
    return Object.values(_oclibData).flat().some(i => i.name === item.name && i.is_featured);
  };
  _refreshCatLabel(item.is_featured || _libFeatured());
  // Если данных библиотеки нет — грузим в фоне и обновляем badge
  if (!item.is_featured && !_oclibData) {
    fetch(`https://barista-school.online/api/oc-library?category=${item.category || 'equipment'}&t=` + Date.now())
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) { _oclibData = data; _refreshCatLabel(item.is_featured || _libFeatured()); _ociRenderPromoBlock(_libPromo()); } })
      .catch(() => {});
  }
  document.getElementById('oci-name').value            = item.name || '';
  document.getElementById('oci-qty').value             = item.qty;

  const priceInp = document.getElementById('oci-price');
  priceInp.value = _ocDispPrice(item);
  priceInp.step  = cur === 'RUB' ? '500' : '1';
  document.getElementById('oci-price-label').textContent = `Цена, ${sym}`;
  document.getElementById('oci-total').textContent = _ocFmtAmt(item.price * item.qty);

  document.getElementById('oci-url').value = item.url || '';
  const urlBtn = document.getElementById('oci-url-open');
  urlBtn.href         = item.url || '#';
  urlBtn.style.display = item.url ? '' : 'none';

  // Подкатегория (тип оборудования) — показываем только для equipment
  const subcatRow = document.getElementById('oci-subcategory-row');
  if (subcatRow) subcatRow.style.display = item.category === 'equipment' ? '' : 'none';
  _ociSetSubcat(item.subcategory || '');

  // Фото-превью / плейсхолдер
  const photoBox   = document.getElementById('oci-photo-preview');
  const photoPlaceholder = document.getElementById('oci-photo-placeholder');
  const photoImg   = document.getElementById('oci-photo-img');
  if (photoImg) {
    if (item.photo) {
      photoImg.src = item.photo;
      if (photoBox) photoBox.style.display = '';
      if (photoPlaceholder) photoPlaceholder.style.display = 'none';
    } else {
      photoImg.src = '';
      if (photoBox) photoBox.style.display = 'none';
      if (photoPlaceholder) photoPlaceholder.style.display = '';
    }
  }

  // Категории select
  const catSel = document.getElementById('oci-cat');
  catSel.innerHTML = Object.entries(OC_CATS).map(([c, inf]) =>
    `<option value="${c}"${c === item.category ? ' selected' : ''}>${inf.icon} ${inf.label}</option>`
  ).join('');

  const updateTotal = () => {
    const qty = parseFloat(document.getElementById('oci-qty').value) || 0;
    const pr  = parseFloat(document.getElementById('oci-price').value) || 0;
    const rawPrice = cur === 'RUB' ? pr : pr * (cur === 'USD' ? (meta.usdRate || 90) : (meta.eurRate || 98));
    document.getElementById('oci-total').textContent = _ocFmtAmt(qty * rawPrice);
  };
  document.getElementById('oci-qty').oninput   = updateTotal;
  document.getElementById('oci-price').oninput = () => {
    document.getElementById('oci-price').classList.remove('oci-price-missing');
    updateTotal();
  };
  document.getElementById('oci-url').oninput = () => {
    const v = document.getElementById('oci-url').value.trim();
    const btn = document.getElementById('oci-url-open');
    btn.href         = v || '#';
    btn.style.display = v ? '' : 'none';
  };

  // При смене категории — показывать/скрывать поле подкатегории
  document.getElementById('oci-cat').onchange = (e) => {
    const subcatRow = document.getElementById('oci-subcategory-row');
    if (subcatRow) subcatRow.style.display = e.target.value === 'equipment' ? '' : 'none';
  };

  // Enter = Сохранить (кроме textarea)
  const onKey = (e) => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); ocItemSave(); } };
  const modalEl = document.getElementById('modal-oc-item');
  if (modalEl) {
    modalEl.dataset.ocOriginal = _ocActivitySnapshot(item);
    modalEl.dataset.ocWasNew = _ocPendingCreateIds.has(String(id)) ? '1' : '0';
  }
  modalEl.removeEventListener('keydown', modalEl._ociKeyHandler || (() => {}));
  modalEl._ociKeyHandler = onKey;
  modalEl.addEventListener('keydown', onKey);

  // Показывать кнопку AI только если задан API-ключ
  const aiBtnEl = document.getElementById('oci-ai-btn');
  if (aiBtnEl) aiBtnEl.style.display = _ocOpenAiKey ? '' : 'none';

  // Промо-блок партнёра
  const _libPromo = () => {
    if (!_oclibData || !item.name) return null;
    for (const arr of Object.values(_oclibData)) {
      const found = arr.find(i => i.name === item.name);
      if (found) return found;
    }
    return null;
  };
  const promoBox = document.getElementById('oci-promo-block');
  if (promoBox) promoBox.style.display = 'none';
  // Сначала пробуем данные прямо из item (сохранены при загрузке шаблона)
  const itemAsMeta = (item.description || item.promo_code)
    ? { description: item.description, promo_code: item.promo_code, promo_expires: item.promo_expires }
    : null;
  const libMeta = itemAsMeta || _libPromo();
  if (libMeta) {
    _ociRenderPromoBlock(libMeta);
  } else if (!_oclibData) {
    fetch(`https://barista-school.online/api/oc-library?category=${item.category || 'equipment'}&t=` + Date.now())
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) { _oclibData = data; _ociRenderPromoBlock(_libPromo()); } })
      .catch(() => {});
  }

  document.getElementById('modal-oc-item').dataset.editId = id;
  if (window.openModal) openModal('modal-oc-item');
  // Автофокус на поле Название
  setTimeout(() => {
    const inp = document.getElementById('oci-name');
    if (inp) { inp.focus(); inp.select(); }
  }, 80);
}

export function ocItemDelete() {
  const modal = document.getElementById('modal-oc-item');
  const id    = modal?.dataset.editId;
  if (!id) return;
  if (window.closeModal) closeModal('modal-oc-item');
  ocDeleteRow(id);
}

export function ocItemCancel() {
  const modal = document.getElementById('modal-oc-item');
  const id    = modal?.dataset.editId;
  if (id) {
    const item = (S.openingCosts || []).find(r => r.id === id);
    // Если позиция новая и название не введено — удаляем без следа
    if (item && !item.name.trim()) {
      S.openingCosts = (S.openingCosts || []).filter(r => r.id !== id);
      _ocPendingCreateIds.delete(String(id));
      _ocSyncInvestment();
    }
  }
  if (window.closeModal) closeModal('modal-oc-item');
  renderDashboard();
}

export function ocItemSave() {
  const modal = document.getElementById('modal-oc-item');
  const id    = modal?.dataset.editId;
  const item  = (S.openingCosts || []).find(r => r.id === id);
  if (!item) return;
  const meta = _ocMeta();
  const cur  = meta.currency || 'RUB';

  item.name        = document.getElementById('oci-name').value.trim();
  item.qty         = parseFloat(document.getElementById('oci-qty').value) || 1;
  item.category    = document.getElementById('oci-cat').value;
  item.url         = document.getElementById('oci-url').value.trim();
  item.subcategory = _ociGetSubcat();
  // Если пришёл из библиотеки — запомнить is_featured
  if (modal.dataset.libFeatured !== undefined && modal.dataset.libFeatured !== '') {
    item.is_featured = modal.dataset.libFeatured === '1' ? 1 : (item.is_featured || 0);
    delete modal.dataset.libFeatured;
  }
  const photoImg   = document.getElementById('oci-photo-img');
  const pSrc = photoImg?.getAttribute('data-user-url') || (photoImg?.src && !photoImg.src.endsWith(location.href.replace(/#.*/, '') + '#') ? photoImg.src : '');
  item.photo = pSrc || '';

  const rawPrice = parseFloat(document.getElementById('oci-price').value) || 0;
  item.price = cur === 'RUB' ? rawPrice
    : Math.round(rawPrice * (cur === 'USD' ? (meta.usdRate || 90) : (meta.eurRate || 98)));

  _ocSyncInvestment();
  const wasNew = modal.dataset.ocWasNew === '1' || _ocPendingCreateIds.has(String(id));
  const original = modal.dataset.ocOriginal || '';
  const nextSnapshot = _ocActivitySnapshot(item);
  if (wasNew) {
    window.logWorkspaceActivity?.('opening_costs_changed', 'opening_cost', id, _ocActivitySummary('Добавлена позиция', item));
    _ocPendingCreateIds.delete(String(id));
  } else if (original && original !== nextSnapshot) {
    window.logWorkspaceActivity?.('opening_costs_changed', 'opening_cost', id, _ocActivitySummary('Изменена позиция', item));
  }
  delete modal.dataset.ocWasNew;
  delete modal.dataset.ocOriginal;
  if (window.closeModal) closeModal('modal-oc-item');
  renderDashboard();
}

// ─── Загрузка фото с устройства ────────────────────────────────────
export function ocPhotoFileChange(input) {
  const file = input?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    const photoImg = document.getElementById('oci-photo-img');
    const photoBox = document.getElementById('oci-photo-preview');
    const photoPlaceholder = document.getElementById('oci-photo-placeholder');
    if (!photoImg) return;
    photoImg.src = dataUrl;
    photoImg.setAttribute('data-user-url', dataUrl);
    if (photoBox) photoBox.style.display = '';
    if (photoPlaceholder) photoPlaceholder.style.display = 'none';
    // сбросить input чтобы можно было загрузить тот же файл повторно
    input.value = '';
  };
  reader.readAsDataURL(file);
}

// ─── AI-заполнение карточки ─────────────────────────────────────────
let _ocOpenAiKey = '';

function _updateApiKeyUi(hasKey) {
  // Кнопка в открытом модале
  const aiBtnEl = document.getElementById('oci-ai-btn');
  if (aiBtnEl) aiBtnEl.style.display = hasKey ? '' : 'none';
  // Метка в loc-menu
  const labelEl = document.getElementById('loc-menu-api-key-label');
  if (labelEl) labelEl.textContent = hasKey ? '✅ OpenAI API ключ настроен' : 'Добавить OpenAI API ключ';
}

export function ocSetApiKey() {
  const key = prompt('Введите ваш OpenAI API ключ (sk-...):\n\nКлюч хранится только в памяти текущей вкладки и сбрасывается после перезагрузки.', _ocOpenAiKey);
  if (key === null) return; // отмена
  if (key.trim()) {
    _ocOpenAiKey = key.trim();
    _updateApiKeyUi(true);
    alert('✅ API ключ добавлен для текущей вкладки');
  } else {
    _ocOpenAiKey = '';
    _updateApiKeyUi(false);
    alert('Ключ удалён');
  }
}

export async function ocAiFill() {
  const apiKey = _ocOpenAiKey;
  if (!apiKey) {
    const go = confirm('Для AI-заполнения нужен OpenAI API ключ.\n\nОткрыть настройку ключа?');
    if (go) ocSetApiKey();
    return;
  }

  const urlVal  = (document.getElementById('oci-url')?.value || '').trim();
  const nameVal = (document.getElementById('oci-name')?.value || '').trim();
  if (!urlVal && !nameVal) {
    alert('Укажите ссылку на товар или название — AI нужна хоть какая-то информация.');
    return;
  }

  const btn = document.getElementById('oci-ai-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="oci-ai-spinner"></span> Загружаю страницу…'; }

  // ─── Шаг 1: запрашиваем мета-данные страницы через наш сервер ────
  let pageContext = '';
  let ogImage = '';
  if (urlVal) {
    try {
      const pr = await fetch(
        `https://barista-school.online/api/proxy-meta?url=${encodeURIComponent(urlVal)}`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (pr.ok) {
        const meta = await pr.json();
        if (meta.ok) {
          ogImage = meta.og_image || '';
          pageContext = [
            meta.og_title    && `Заголовок: ${meta.og_title}`,
            meta.description && `Описание: ${meta.description}`,
            ogImage          && `og:image: ${ogImage}`,
            meta.prices?.length
              ? `Цена товара (руб): ${meta.prices[0]}${meta.prices.length > 1 ? ` (также найдены: ${meta.prices.slice(1).join(', ')})` : ''} — ПЕРВАЯ цена наиболее достоверна, используй её`
              : `Цена на странице не найдена (сайт загружает её через JS) — верни price: 0`,
          ].filter(Boolean).join('\n');
        }
      }
    } catch (_) { /* сервер недоступен — работаем без контекста */ }
  }

  if (btn) btn.innerHTML = '<span class="oci-ai-spinner"></span> Анализирую…';

  // ─── Шаг 2: передаём контекст GPT ────────────────────────────────
  const prompt = `Ты помощник для планирования бюджета кофейни.
Пользователь добавляет позицию оборудования. Вот данные:
- URL товара: ${urlVal || '(не указан)'}
- Текущее название: ${nameVal || '(не указано)'}
${pageContext ? `\nДанные со страницы товара:\n${pageContext}` : ''}

Верни ТОЛЬКО JSON-объект (без markdown, без пояснений) с полями:
{
  "name": "краткое читаемое название товара (до 60 символов)",
  "subcategory": "тип оборудования: одно из — Кофемашина, Кофемолка, Аксессуары бариста (темперы/нок-боксы/весы/дозаторы/ринзеры), Блендер, Холодильник, Витрина (кондитерские и барные витрины), Ледогенератор, Соковыжималка, Посудомоечная машина, Водонагреватель/бойлер, Водоподготовка (фильтры обратного осмоса), Термосы и диспенсеры, Кассовое оборудование, Вытяжка/вентиляция, Другое",
  "price": числовая цена товара в рублях (целое число, без пробелов). Если цена в данных — сумма скидки, рассрочки или ежемесячного платежа, а не полная стоимость — верни 0. Если цена вообще не известна — верни 0,
  "photo": "${ogImage ? ogImage : 'пустая строка'}"
}`;

  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.1,
      }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err?.error?.message || `HTTP ${resp.status}`);
    }
    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content || '';
    const match = text.match(/\{[\s\S]*?\}/);
    if (!match) throw new Error('AI не вернул JSON');
    const parsed = JSON.parse(match[0]);

    if (parsed.name)  { document.getElementById('oci-name').value = parsed.name; document.getElementById('oci-title').textContent = parsed.name; }
    if (parsed.subcategory) {
      _ociSetSubcat(parsed.subcategory);
      const subcatRow = document.getElementById('oci-subcategory-row');
      if (subcatRow) subcatRow.style.display = '';
    }
    const priceInp = document.getElementById('oci-price');
    if (parsed.price && parsed.price > 0) {
      priceInp.value = parsed.price;
      priceInp.classList.remove('oci-price-missing');
      const qty = parseFloat(document.getElementById('oci-qty').value) || 1;
      document.getElementById('oci-total').textContent = _ocFmtAmt(qty * parsed.price);
    } else {
      // Цена не найдена (JS-рендер) — подсвечиваем поле
      priceInp.value = '';
      priceInp.placeholder = 'Введите цену вручную';
      priceInp.classList.add('oci-price-missing');
      setTimeout(() => priceInp.focus(), 100);
    }
    // Фото: og:image берём напрямую из HTML (не через GPT), затем из ответа GPT
    const photoSrc = ogImage || (parsed.photo && parsed.photo !== 'пустая строка' ? parsed.photo : '');
    if (photoSrc) {
      const photoImg2  = document.getElementById('oci-photo-img');
      const photoBox2  = document.getElementById('oci-photo-preview');
      const photoPlaceholder2 = document.getElementById('oci-photo-placeholder');
      if (photoImg2 && photoBox2) {
        photoImg2.src = photoSrc;
        photoImg2.onerror = () => {
          photoBox2.style.display = 'none';
          if (photoPlaceholder2) photoPlaceholder2.style.display = '';
        };
        photoBox2.style.display = '';
        if (photoPlaceholder2) photoPlaceholder2.style.display = 'none';
      }
    }
  } catch (e) {
    alert('Ошибка AI: ' + e.message);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i data-lucide="sparkles" class="icon"></i> Заполнить через AI'; if (window.lucide) lucide.createIcons(); }
  }
}

// ════════════════════════════════════════════════════════════════════
//  БИБЛИОТЕКА ОБОРУДОВАНИЯ
// ════════════════════════════════════════════════════════════════════

const OCLIB_ICONS = {
  'Кофемашина':             'coffee',
  'Кофемолка':              'disc-3',
  'Аксессуары бариста':     'utensils',
  'Блендер':                'zap',
  'Холодильник':            'thermometer-snowflake',
  'Витрина':                'layout-panel-left',
  'Ледогенератор':          'snowflake',
  'Соковыжималка':          'citrus',
  'Посудомоечная машина':   'waves',
  'Водонагреватель/бойлер': 'flame',
  'Водоподготовка':         'droplets',
  'Термосы и диспенсеры':   'flask-conical',
  'Кассовое оборудование':  'scan-barcode',
  'Вытяжка/вентиляция':     'wind',
  'Другое':                 'package',
};
function _oclibIcon(cat) {
  const name = OCLIB_ICONS[cat] || 'package';
  return `<i data-lucide="${name}" class="oclib-icon"></i>`;
}

let _oclibData = null;    // { subcategory: [{name,price,photo,url}, ...] }
let _oclibCurCat = null;  // текущая выбранная подкатегория
let _oclibFilterCat = 'equipment'; // OC_CATS key, по которому отфильтрована библиотека

export async function ocOpenLibrary() {
  if (window.openModal) openModal('modal-oc-library');
  const content = document.getElementById('oclib-content');
  if (!content) return;

  // Делегированный обработчик для кнопок «Выбрать» (один раз)
  if (!content._oclibDelegated) {
    content._oclibDelegated = true;
    content.addEventListener('click', e => {
      const btn = e.target.closest('.oclib-select-btn');
      if (!btn) return;
      const item = JSON.parse(decodeURIComponent(escape(atob(btn.dataset.item))));
      const cat  = decodeURIComponent(btn.dataset.cat);
      oclibSelect(item, cat);
    });
  }

  // Определяем категорию по текущему редактируемому OC-элементу
  const ocCat = document.getElementById('oci-cat')?.value || 'equipment';
  _oclibFilterCat = ocCat;

  // Обновляем заголовок модала, если есть метка категории
  const catInfo = OC_CATS[ocCat];
  const titleEl = document.getElementById('oclib-title');
  if (titleEl && catInfo) {
    titleEl.innerHTML = catInfo.icon + ' ' + catInfo.label + ' — библиотека';
    if (window.lucide) lucide.createIcons({ nodes: titleEl.querySelectorAll('[data-lucide]') });
  }

  content.innerHTML = '<div class="oclib-loading">Загружаю библиотеку…</div>';
  document.getElementById('oclib-search').value = '';
  oclibShowCats(); // сбрасываем в режим подкатегорий

  // Всегда перезапрашиваем, чтобы photo/url были актуальны
  try {
    const r = await fetch(`https://barista-school.online/api/oc-library?category=${ocCat}&t=` + Date.now());
    if (!r.ok) throw new Error('HTTP ' + r.status);
    _oclibData = await r.json();
  } catch (e) {
    content.innerHTML = `<div class="oclib-error">Не удалось загрузить библиотеку: ${e.message}</div>`;
    return;
  }
  _oclibRenderCats();
}

export function oclibShowCats() {
  _oclibCurCat = null;
  const backBtn = document.getElementById('oclib-back-btn');
  const title   = document.getElementById('oclib-title');
  if (backBtn) backBtn.style.display = 'none';
  if (title) {
    const catInfo = OC_CATS[_oclibFilterCat || 'equipment'];
    title.innerHTML = catInfo ? catInfo.icon + ' ' + catInfo.label + ' — библиотека' : '📚 Библиотека';
    if (window.lucide) lucide.createIcons({ nodes: title.querySelectorAll('[data-lucide]') });
  }
  if (_oclibData) _oclibRenderCats();
}

function _oclibRenderCats(filter = '') {
  const content = document.getElementById('oclib-content');
  if (!content || !_oclibData) return;

  const cats = Object.entries(_oclibData)
    .filter(([, items]) => {
      if (!filter) return true;
      return items.some(i => i.name.toLowerCase().includes(filter));
    })
    .sort(([a], [b]) => {
      const order = ['Кофемашина','Кофемолка','Аксессуары бариста','Блендер',
        'Холодильник','Витрина','Ледогенератор','Соковыжималка',
        'Посудомоечная машина','Водонагреватель/бойлер','Водоподготовка',
        'Термосы и диспенсеры','Кассовое оборудование','Вытяжка/вентиляция','Другое'];
      return (order.indexOf(a) + 99) % 99 - (order.indexOf(b) + 99) % 99;
    });

  if (!cats.length) {
    content.innerHTML = '<div class="oclib-empty">Ничего не найдено</div>';
    return;
  }

  if (filter) {
    // При поиске — плоский список по всем категориям
    const allItems = cats.flatMap(([cat, items]) =>
      items.filter(i => i.name.toLowerCase().includes(filter))
           .map(i => ({ ...i, _cat: cat }))
    );
    content.innerHTML = allItems.map(i => _oclibItemHtml(i, i._cat)).join('');
  } else {
    // Без поиска — плитки подкатегорий
    content.innerHTML = `<div class="oclib-cats">${
      cats.map(([cat, items]) => {
        return `<button class="oclib-cat-tile" onclick="oclibOpenCat('${cat.replace(/'/g, "\\'")}')">
          <span class="oclib-cat-icon">${_oclibIcon(cat)}</span>
          <span class="oclib-cat-name">${cat}</span>
          <span class="oclib-cat-count">${items.length} шт.</span>
        </button>`;
      }).join('')
    }</div>`;
  }
  if (window.lucide) lucide.createIcons({ nodes: content.querySelectorAll('[data-lucide]') });
}

export function oclibOpenCat(cat) {
  _oclibCurCat = cat;
  const backBtn = document.getElementById('oclib-back-btn');
  const title   = document.getElementById('oclib-title');
  if (backBtn) backBtn.style.display = '';
  if (title) {
    title.innerHTML = _oclibIcon(cat) + ' ' + cat;
    if (window.lucide) lucide.createIcons({ nodes: title.querySelectorAll('[data-lucide]') });
  }

  const items = _oclibData?.[cat] || [];
  const content = document.getElementById('oclib-content');
  if (!content) return;

  content.innerHTML = items.length
    ? items.map(i => _oclibItemHtml(i, cat)).join('')
    : '<div class="oclib-empty">В этой категории пусто</div>';

  if (window.lucide) lucide.createIcons({ nodes: content.querySelectorAll('[data-lucide]') });
}

export function oclibSearch(val) {
  const q = val.trim().toLowerCase();
  const backBtn = document.getElementById('oclib-back-btn');
  const title   = document.getElementById('oclib-title');
  if (!_oclibData) return;
  if (q) {
    _oclibCurCat = null;
    if (backBtn) backBtn.style.display = 'none';
    if (title) {
      const catInfo = OC_CATS[_oclibFilterCat || 'equipment'];
      title.innerHTML = catInfo ? catInfo.icon + ' ' + catInfo.label + ' — библиотека' : '📚 Библиотека';
      if (window.lucide) lucide.createIcons({ nodes: title.querySelectorAll('[data-lucide]') });
    }
    _oclibRenderCats(q);
  } else {
    oclibShowCats();
  }
}

function _oclibItemHtml(item, cat) {
  const price = item.price ? `<span class="oclib-price">${item.price.toLocaleString('ru-RU')} ₽</span>` : '';
  const photo = item.photo
    ? `<img src="${item.photo}" alt="" class="oclib-item-photo" onerror="this.style.display='none'">`
    : `<span class="oclib-item-no-photo">${_oclibIcon(cat)}</span>`;
  const safeItem = btoa(unescape(encodeURIComponent(JSON.stringify(item))));
  const safeCat  = encodeURIComponent(cat);
  const featBadge = item.is_featured ? `<span class="oclib-featured-badge">⭐ Рекомендуем</span>` : '';
  const promoBadge = item.promo_code ? `<span class="oclib-promo-badge">🏷 Промокод: <b>${item.promo_code}</b></span>` : '';
  return `<div class="oclib-item${item.is_featured ? ' oclib-item-featured' : ''}">
    <div class="oclib-item-thumb">${photo}</div>
    <div class="oclib-item-info">
      ${featBadge}
      <div class="oclib-item-name">${item.name}</div>
      ${price}
      ${promoBadge}
    </div>
    <button class="btn btn-sm btn-primary oclib-select-btn"
      data-item="${safeItem}" data-cat="${safeCat}">
      Выбрать
    </button>
  </div>`;
}

export function oclibSelect(item, cat) {
  // Заполняем поля modal-oc-item
  const nameEl  = document.getElementById('oci-name');
  const priceEl = document.getElementById('oci-price');
  const subcatEl = document.getElementById('oci-subcategory');
  const totalEl = document.getElementById('oci-total');
  const photoImg  = document.getElementById('oci-photo-img');
  const photoBox  = document.getElementById('oci-photo-preview');
  const photoPlaceholder = document.getElementById('oci-photo-placeholder');
  const urlInp    = document.getElementById('oci-url');
  const urlBtn    = document.getElementById('oci-url-open');
  const titleEl   = document.getElementById('oci-title');

  if (nameEl)   { nameEl.value = item.name; }
  if (titleEl)  { titleEl.textContent = item.name; }
  if (subcatEl) { _ociSetSubcat(cat); }
  if (priceEl)  {
    priceEl.value = item.price || '';
    priceEl.classList.remove('oci-price-missing');
  }
  const qty = parseFloat(document.getElementById('oci-qty')?.value) || 1;
  if (totalEl && item.price) totalEl.textContent = (qty * item.price).toLocaleString('ru-RU') + ' ₽';

  if (item.url && urlInp) {
    urlInp.value = item.url;
    if (urlBtn) { urlBtn.href = item.url; urlBtn.style.display = ''; }
  }
  if (item.photo && photoImg && photoBox) {
    photoImg.src = item.photo;
    photoImg.onerror = () => { photoBox.style.display = 'none'; if (photoPlaceholder) photoPlaceholder.style.display = ''; };
    photoBox.style.display = '';
    if (photoPlaceholder) photoPlaceholder.style.display = 'none';
  }

  // Переключаем категорию на соответствующую категорию библиотеки
  const catSel = document.getElementById('oci-cat');
  if (catSel) {
    catSel.value = _oclibFilterCat || 'equipment';
    const subcatRow = document.getElementById('oci-subcategory-row');
    if (subcatRow) subcatRow.style.display = (_oclibFilterCat === 'equipment' || !_oclibFilterCat) ? '' : 'none';
  }

  // Сохраняем is_featured чтобы ocItemSave мог записать в S.openingCosts
  const modalEl2 = document.getElementById('modal-oc-item');
  if (modalEl2) modalEl2.dataset.libFeatured = item.is_featured ? '1' : '0';

  // Рендерим промо-блок сразу при выборе из библиотеки
  _ociRenderPromoBlock(item);

  if (window.closeModal) closeModal('modal-oc-library');
}

// ─── Хелперы для select «Тип оборудования» ──────────────────────────
// Стандартные значения select-а
const _OCI_SUBCAT_OPTIONS = [
  'Кофемашина','Кофемолка','Аксессуары бариста','Блендер','Холодильник',
  'Витрина','Ледогенератор','Соковыжималка','Посудомоечная машина',
  'Водонагреватель/бойлер','Водоподготовка','Термосы и диспенсеры',
  'Кассовое оборудование','Вытяжка/вентиляция','Другое',
];

// Алиасы: значения из БД (мн.ч./сокр.) → канонические опции select-а
const _OCI_SUBCAT_ALIASES = {
  'Кофемашины':     'Кофемашина',
  'Кофемолки':      'Кофемолка',
  'Холодильное':    'Холодильник',
  'Посудомоечное':  'Посудомоечная машина',
  'Блендеры':       'Блендер',
  'Вытяжка':        'Вытяжка/вентиляция',
  'Прочее':         'Другое',
};

/** Установить значение подкатегории (select + custom-инпут) */
function _ociSetSubcat(val) {
  const sel    = document.getElementById('oci-subcategory');
  const custom = document.getElementById('oci-subcategory-custom');
  if (!sel) return;
  if (!val) {
    sel.value = '';
    if (custom) { custom.style.display = 'none'; custom.value = ''; }
    return;
  }
  // Нормализуем значение: мн.ч. / сокращённые формы → стандартные
  const normalized = _OCI_SUBCAT_ALIASES[val] || val;
  // Если значение есть в стандартных — выбираем его
  if (_OCI_SUBCAT_OPTIONS.includes(normalized)) {
    sel.value = normalized;
    if (custom) { custom.style.display = 'none'; custom.value = ''; }
  } else {
    // Кастомная категория — выбираем "Своя…" и заполняем инпут
    sel.value = '__custom__';
    if (custom) { custom.style.display = ''; custom.value = normalized; }
  }
}

/** Прочитать значение подкатегории */
function _ociGetSubcat() {
  const sel    = document.getElementById('oci-subcategory');
  const custom = document.getElementById('oci-subcategory-custom');
  if (!sel) return '';
  if (sel.value === '__custom__') return (custom?.value || '').trim();
  return sel.value;
}

/** onchange на select — показать/скрыть поле кастомной категории */
export function ociSubcatChange(sel) {
  const custom = document.getElementById('oci-subcategory-custom');
  if (!custom) return;
  if (sel.value === '__custom__') {
    custom.style.display = '';
    custom.value = '';
    setTimeout(() => custom.focus(), 50);
  } else {
    custom.style.display = 'none';
    custom.value = '';
  }
}

function _ocInitDrag() {
  let _dragId  = null;
  let _dragCat = null;

  // ─── Drag source: строки ───────────────────────────────────────────
  document.querySelectorAll('.oc-row[draggable]').forEach(row => {
    row.addEventListener('dragstart', e => {
      _dragId  = row.dataset.ocId;
      _dragCat = row.dataset.cat;
      row.classList.add('oc-dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    row.addEventListener('dragend', () => {
      row.classList.remove('oc-dragging');
      document.querySelectorAll('.oc-drag-over, .oc-cat-drop-over')
        .forEach(el => el.classList.remove('oc-drag-over', 'oc-cat-drop-over'));
    });
    // Drop на другую строку — переставить порядок
    row.addEventListener('dragover', e => {
      e.preventDefault();
      document.querySelectorAll('.oc-drag-over').forEach(r => r.classList.remove('oc-drag-over'));
      row.classList.add('oc-drag-over');
    });
    row.addEventListener('drop', e => {
      e.preventDefault();
      if (!_dragId || _dragId === row.dataset.ocId) return;
      const costs = S.openingCosts;
      const fi = costs.findIndex(r => r.id === _dragId);
      const ti = costs.findIndex(r => r.id === row.dataset.ocId);
      if (fi < 0 || ti < 0) return;
      const [moved] = costs.splice(fi, 1);
      // При дропе на строку другой категории — меняем категорию
      moved.category = row.dataset.cat;
      costs.splice(ti, 0, moved);
      saveState();
      renderDashboard();
    });
  });

  // ─── Drop target: заголовки категорий ─────────────────────────────
  document.querySelectorAll('.oc-cat-header').forEach(header => {
    const cat = header.closest('.oc-cat-section')?.dataset.cat;
    if (!cat) return;
    header.addEventListener('dragover', e => {
      if (!_dragId || _dragCat === cat) return;
      e.preventDefault();
      document.querySelectorAll('.oc-cat-drop-over').forEach(el => el.classList.remove('oc-cat-drop-over'));
      header.classList.add('oc-cat-drop-over');
    });
    header.addEventListener('dragleave', () => {
      header.classList.remove('oc-cat-drop-over');
    });
    header.addEventListener('drop', e => {
      e.preventDefault();
      header.classList.remove('oc-cat-drop-over');
      if (!_dragId || _dragCat === cat) return;
      const item = S.openingCosts.find(r => r.id === _dragId);
      if (!item) return;
      item.category = cat;
      saveState();
      renderDashboard();
    });
  });
}

function _ocUpdateKPIBar() {
  const costs = S.openingCosts || [];
  const total = _ocCalcTotal(costs);
  const el = document.getElementById('oc-kpi-total');
  if (el) el.textContent = rub(total);
  const elCur = document.getElementById('oc-kpi-total-cur');
  if (elCur) {
    const meta = _ocMeta();
    if ((meta.currency || 'RUB') !== 'RUB') {
      elCur.textContent = _ocFmtAmt(total);
      elCur.style.display = '';
    } else {
      elCur.style.display = 'none';
    }
  }
  Object.keys(OC_CATS).forEach(cat => {
    const catEl = document.getElementById('oc-cat-total-' + cat);
    if (catEl) {
      const catSum = costs.filter(r => r.category === cat).reduce((s, r) => s + r.price * r.qty, 0);
      catEl.textContent = catSum > 0 ? _ocFmtAmt(catSum) : '';
    }
  });
}

// ─── Рендер одной строки ─────────────────────────────────────────────
function _renderRow(item) {
  const total  = _ocFmtAmt(item.price * item.qty);
  const dispPr = _ocDispPrice(item);
  const meta   = _ocMeta();
  const cur    = meta.currency || 'RUB';
  const sym    = cur === 'USD' ? '$' : cur === 'EUR' ? '€' : '₽';
  const nameHtml = item.name
    ? item.name.replace(/</g,'&lt;').replace(/>/g,'&gt;')
    : '<em class="oc-row-noname">Без названия</em>';

  return `
    <div class="oc-row" data-oc-id="${item.id}" data-cat="${item.category}" draggable="true"
         onclick="ocOpenItem('${item.id}')" title="Нажмите для редактирования">
      <div class="oc-drag-handle" onclick="event.stopPropagation()" title="Перетащить">⠿</div>
      <span class="oc-row-name-text">${nameHtml}</span>
      <div class="oc-row-nums">
        <span class="oc-row-qty-text">${item.qty}</span>
        <span class="oc-row-x">×</span>
        <span class="oc-row-price-text">${dispPr} ${sym}</span>
        <span class="oc-row-eq">=</span>
        <span class="oc-row-total">${total}</span>
      </div>
      ${item.url ? `<a href="${item.url}" target="_blank" class="oc-url-open" onclick="event.stopPropagation()" title="Открыть ссылку"><i data-lucide="external-link" class="icon"></i></a>` : '<span class="oc-url-placeholder"></span>'}
      <button class="oc-row-del btn-icon" onclick="event.stopPropagation();ocDeleteRow('${item.id}')" title="Удалить">
        <i data-lucide="trash-2" class="icon"></i>
      </button>
    </div>`;
}

function _ocMatchSearch(item, query) {
  if (!query) return true;
  const text = [
    item.name,
    item.note,
    item.url,
    item.subcategory,
    OC_CATS[item.category]?.label,
  ].filter(Boolean).join(' ').toLowerCase();
  return text.includes(query);
}

function _ocEscAttr(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function _ocSortLabel(sortMode) {
  if (sortMode === 'cost_desc') return '₽↓';
  if (sortMode === 'cost_asc') return '₽↑';
  if (sortMode === 'count_desc') return 'Поз.↓';
  if (sortMode === 'count_asc') return 'Поз.↑';
  return 'Порядок';
}

// ─── Рендер секции категории ─────────────────────────────────────────
function _renderCatSection(cat, allItems, visibleItems, totalBudget, searchActive) {
  const info       = OC_CATS[cat];
  const catTotal   = allItems.reduce((s, r) => s + r.price * r.qty, 0);
  const noPriceCnt = allItems.filter(r => !(Number(r.price) > 0)).length;
  const share      = totalBudget > 0 ? Math.round((catTotal / totalBudget) * 100) : 0;
  const countText  = searchActive ? `${visibleItems.length}/${allItems.length} поз.` : `${allItems.length} поз.`;
  const collapsed  = !!(S.openingMeta?.collapsed?.[cat]);
  const progressWidth = Math.max(0, Math.min(100, share));
  return `
    <div class="oc-cat-section${collapsed ? ' collapsed' : ''}" data-cat="${cat}">
      <div class="oc-cat-header" onclick="ocToggleCat('${cat}')" style="cursor:pointer">
        <span class="oc-cat-icon">${info.icon}</span>
        <span class="oc-cat-label">${info.label}</span>
        <span class="oc-cat-share">${share}%</span>
        <span class="oc-cat-count">${countText}</span>
        ${noPriceCnt ? `<span class="oc-cat-missing">${noPriceCnt} без цены</span>` : ''}
        <span class="oc-cat-total${catTotal > 0 ? ' has-value' : ''}" id="oc-cat-total-${cat}">${catTotal > 0 ? _ocFmtAmt(catTotal) : ''}</span>
        <button class="oc-add-in-cat btn btn-sm btn-outline" onclick="event.stopPropagation();ocAddRow('${cat}')">
          <i data-lucide="plus" class="icon"></i> Добавить
        </button>
        <i data-lucide="chevron-down" class="icon oc-cat-chevron" style="${collapsed ? 'transform:rotate(-90deg)' : ''}"></i>
      </div>
      <div class="oc-cat-progress"><span style="width:${progressWidth}%"></span></div>
      <div class="oc-cat-rows">
        ${visibleItems.map(_renderRow).join('')}
      </div>
    </div>`;
}

function _ocSortedCategoryEntries(byCat, sortMode) {
  const rows = Object.entries(byCat)
    .map(([cat, items], index) => ({
      cat,
      items,
      index,
      total: items.reduce((s, r) => s + r.price * r.qty, 0),
      count: items.length,
      label: OC_CATS[cat]?.label || cat,
    }))
    .filter(row => row.count > 0);

  const byOriginalOrder = (a, b) => a.index - b.index;
  const sorted = [...rows];
  if (sortMode === 'cost_desc') sorted.sort((a, b) => (b.total - a.total) || byOriginalOrder(a, b));
  else if (sortMode === 'cost_asc') sorted.sort((a, b) => (a.total - b.total) || byOriginalOrder(a, b));
  else if (sortMode === 'count_desc') sorted.sort((a, b) => (b.count - a.count) || byOriginalOrder(a, b));
  else if (sortMode === 'count_asc') sorted.sort((a, b) => (a.count - b.count) || byOriginalOrder(a, b));
  else if (sortMode === 'name_asc') sorted.sort((a, b) => a.label.localeCompare(b.label, 'ru') || byOriginalOrder(a, b));
  return sorted;
}

// ─── Главный рендер ───────────────────────────────────────────────────
export function renderDashboard() {
  const el = document.getElementById('tab-dashboard');
  if (!el) return;

  const costs    = S.openingCosts || [];
  const meta     = S.openingMeta  || {};
  const format   = meta.format   || 'full';
  const currency = meta.currency || 'RUB';
  const usdRate  = meta.usdRate  || 90;
  const eurRate  = meta.eurRate  || 98;
  const categorySort = meta.categorySort || 'manual';
  const categorySearch = String(meta.categorySearch || '').trim();
  const searchQuery = categorySearch.toLowerCase();
  const total    = _ocCalcTotal(costs);

  // Группируем по категориям
  const byCat = {};
  Object.keys(OC_CATS).forEach(c => { byCat[c] = []; });
  costs.forEach(item => {
    if (byCat[item.category]) byCat[item.category].push(item);
    else byCat['reserve'].push(item);
  });

  // Формат-кнопки
  const fmtBtns = Object.entries(OC_FORMATS).map(([id, f]) => `
    <button class="oc-fmt-btn btn btn-sm btn-outline${format === id ? ' active' : ''}" data-fmt="${id}"
      onclick="ocSetFormat('${id}')">
      <span class="oc-fmt-icon">${f.icon}</span>
      <span class="oc-fmt-name">${f.label}</span>
      <span class="oc-fmt-desc">${f.desc}</span>
    </button>`).join('');

  // Валюта-кнопки
  const curBtns = [
    ['RUB', '₽ RUB'],
    ['USD', '$ USD'],
    ['EUR', '€ EUR'],
  ].map(([c, lbl]) => `
    <button class="oc-cur-btn btn btn-sm btn-outline${currency === c ? ' active' : ''}"
      onclick="ocSetCurrency('${c}')">${lbl}</button>`).join('');

  const rateRow = currency !== 'RUB' ? `
    <div class="oc-rate-row">
      <span class="oc-rate-label">$ 1 USD =</span>
      <input class="inp oc-rate-inp" type="number" min="1" step="1" value="${usdRate}"
        onchange="ocUpdateRate('USD',this.value)">
      <span class="oc-rate-label">₽ &nbsp;&nbsp; € 1 EUR =</span>
      <input class="inp oc-rate-inp" type="number" min="1" step="1" value="${eurRate}"
        onchange="ocUpdateRate('EUR',this.value)">
      <span class="oc-rate-label">₽</span>
    </div>` : '';

  // KPI по топ-4 категориям
  const catTops = Object.entries(byCat)
    .map(([c, items]) => ({ c, sum: items.reduce((s, r) => s + r.price * r.qty, 0) }))
    .filter(x => x.sum > 0)
    .sort((a, b) => b.sum - a.sum)
    .slice(0, 4);

  const kpiCats = catTops.map(({ c, sum }) => `
    <div class="oc-kpi-cat">
      <span class="oc-kpi-cat-icon">${OC_CATS[c].icon}</span>
      <span class="oc-kpi-cat-name">${OC_CATS[c].label}</span>
      <span class="oc-kpi-cat-val">${_ocFmtAmt(sum)}</span>
    </div>`).join('');

  // Секции категорий (только непустые)
  const hasCosts = costs.length > 0;
  const visibleByCat = {};
  Object.entries(byCat).forEach(([cat, items]) => {
    visibleByCat[cat] = items.filter(item => _ocMatchSearch(item, searchQuery));
  });
  const hasVisibleCosts = !hasCosts || Object.values(visibleByCat).some(items => items.length > 0);
  const sortText = _ocSortLabel(categorySort);
  const sections = hasCosts
    ? _ocSortedCategoryEntries(byCat, categorySort)
        .filter(({ cat }) => visibleByCat[cat]?.length > 0)
        .map(({ cat, items }) => _renderCatSection(cat, items, visibleByCat[cat], total, !!searchQuery)).join('')
    : `<div class="oc-onboard">
        <div class="oc-onboard-icon">🏗️</div>
        <div class="oc-onboard-title">Начните планирование вложений</div>
        <div class="oc-onboard-sub">Выберите формат кофейни выше и загрузите готовый шаблон — или добавьте статьи вручную по категориям ниже</div>
        <button class="btn btn-primary oc-onboard-btn" onclick="ocLoadTemplate('${format}')">
          <i data-lucide="sparkles" class="icon"></i>
          Загрузить шаблон «${OC_FORMATS[format].label}»
        </button>
      </div>`;

  // Кнопки добавления по категориям
  const addCatBtns = Object.entries(OC_CATS).map(([cat, info]) => `
    <button class="oc-addcat-btn btn btn-sm btn-outline" onclick="ocAddRow('${cat}')">
      ${info.icon} ${info.label}
    </button>`).join('');

  el.innerHTML = `
    <div class="oc-wrap">

      <!-- Шапка -->
      <div class="oc-page-header">
        <div class="oc-page-title">
          <i data-lucide="landmark" class="icon"></i>
          <span>Стартовые вложения</span>
        </div>
        <div class="oc-page-actions">
          <button class="fin-hint-toggle" onclick="toggleDashIntro()"><i data-lucide="${S.dashHintOpen ? 'chevron-up' : 'info'}" class="icon"></i> ${S.dashHintOpen ? 'Скрыть' : 'Как пользоваться?'}</button>
          <button class="btn btn-outline" onclick="exportOpeningCostsPDF()">
            <i data-lucide="file-text" class="icon"></i> PDF
          </button>
          <button class="btn btn-outline" onclick="exportOpeningCostsXLSX()">
            <i data-lucide="table-2" class="icon"></i> Excel
          </button>
          ${costs.length > 0 && isWorkspaceOwner() ? `<button class="btn btn-outline oc-clear-btn" onclick="ocClearAll()" title="Очистить всё"><i data-lucide="trash-2" class="icon"></i></button>` : ''}
        </div>
      </div>

      <!-- Селекторы формата и валюты -->
      <div class="oc-selectors">
        <div class="oc-selector-group">
          <div class="oc-selector-label">Формат точки</div>
          <div class="oc-fmt-btns">${fmtBtns}</div>
        </div>
        <div class="oc-selector-group">
          <div class="oc-selector-label">Валюта отображения</div>
          <div class="oc-cur-btns">${curBtns}</div>
          ${rateRow}
        </div>
      </div>

      <!-- KPI-плашка -->
      <div class="oc-kpi-bar">
        <div class="oc-kpi-main">
          <div class="oc-kpi-label">Итого вложений (₽)<span class="oc-saved-badge" id="oc-saved-badge"><i data-lucide="check" class="icon"></i> Сохранено</span></div>
          <div class="oc-kpi-value" id="oc-kpi-total">${rub(total)}</div>
          ${currency !== 'RUB' ? `<div class="oc-kpi-cur" id="oc-kpi-total-cur">${_ocFmtAmt(total)}</div>` : '<div id="oc-kpi-total-cur" style="display:none"></div>'}
          <div class="oc-kpi-sync">
            <i data-lucide="check-circle" class="icon"></i> Синхронизировано с Финмоделью
          </div>
        </div>
        ${kpiCats ? `<div class="oc-kpi-cats">${kpiCats}</div>` : ''}
      </div>

      ${S.dashHintOpen ? `<div class="hint" style="margin-bottom:16px">
        <i data-lucide="info" class="icon"></i>
        <strong>Стартовые вложения</strong> — калькулятор всех расходов на открытие кофейни. Сумма автоматически синхронизируется с Финмоделью.
        <br><br>
        <strong>Шаблоны</strong> — готовые наборы статей для Киоска, Острова в ТЦ или Кофейни. Загрузите шаблон и отредактируйте под свои условия.
        <br><br>
        <strong>Как работать:</strong> нажмите <em>+ Добавить</em> в нужной категории или кликните на существующую строку для редактирования. В карточке позиции можно выбрать товар из библиотеки — там реальные позиции с ценами и промо-кодами партнёров.
        <br><br>
        <strong>Валюта</strong> — переключите в $ или € если работаете с импортным оборудованием: суммы пересчитаются по заданному курсу, в Финмодель всегда уходят рубли.
      </div>` : ''}

      <!-- Кнопка шаблона -->
      <div class="oc-tpl-bar">
        <button class="btn btn-primary oc-tpl-main" id="oc-tpl-btn" onclick="ocLoadTemplate('${format}')">
          <i data-lucide="sparkles" class="icon"></i>
          Загрузить шаблон «${OC_FORMATS[format].label}»
        </button>
        <span class="oc-tpl-note" id="oc-tpl-note">${OC_FORMATS[format].desc}</span>
      </div>

      ${hasCosts ? `<div class="oc-list-tools">
        <div class="oc-search-box">
          <i data-lucide="search" class="icon"></i>
          <input id="oc-search-input" class="oc-search-input" value="${_ocEscAttr(categorySearch)}" placeholder="Поиск по позициям" oninput="ocSetCategorySearch(this.value)">
          ${categorySearch ? `<button class="oc-search-clear" onclick="ocSetCategorySearch('')" title="Очистить поиск"><i data-lucide="x" class="icon"></i></button>` : ''}
        </div>
        <div class="oc-sort-control" aria-label="Сортировка категорий">
          <span class="oc-sort-label">Сортировка</span>
          <button class="oc-sort-chip${categorySort === 'manual' ? ' active' : ''}" onclick="ocSetCategorySort('manual')" title="Исходный порядок категорий">Порядок</button>
          <button class="oc-sort-chip${categorySort.startsWith('cost_') ? ' active' : ''}" onclick="ocToggleCategorySort('cost')" title="Сортировать по стоимости категории">₽ ${categorySort.startsWith('cost_') ? sortText.replace('₽', '') : '↓'}</button>
          <button class="oc-sort-chip${categorySort.startsWith('count_') ? ' active' : ''}" onclick="ocToggleCategorySort('count')" title="Сортировать по количеству позиций">Поз. ${categorySort.startsWith('count_') ? sortText.replace('Поз.', '') : '↓'}</button>
        </div>
        <div class="oc-collapse-actions">
          <button class="oc-tool-btn" onclick="ocSetCategoryCollapseAll(false)"><i data-lucide="list-tree" class="icon"></i> Развернуть всё</button>
          <button class="oc-tool-btn" onclick="ocSetCategoryCollapseAll(true)"><i data-lucide="chevrons-up" class="icon"></i> Свернуть всё</button>
        </div>
      </div>` : ''}

      <!-- Секции категорий -->
      <div class="oc-sections">${hasVisibleCosts ? sections : `<div class="oc-empty"><div class="oc-empty-title">Ничего не найдено</div><div class="oc-empty-hint">Попробуйте изменить запрос или очистить поиск.</div></div>`}</div>

      <!-- Добавить статью по категории -->
      <div class="oc-addcat-bar">
        <span class="oc-addcat-label">Добавить статью в категорию:</span>
        <div class="oc-addcat-btns">${addCatBtns}</div>
      </div>

    </div>`;

  if (window.lucide) lucide.createIcons();
  _ocInitDrag();
}
