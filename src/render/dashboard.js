// ════════════════════════════════════════════════════════════════════
//  RENDER — DASHBOARD  (src/render/dashboard.js)
//  Калькулятор стартовых вложений в открытие кофейни
// ════════════════════════════════════════════════════════════════════

import { S, saveState } from '../state/store.js';
import { rub } from '../utils/format.js';

// ─── Stub exports (совместимость с updaters.js / main.js) ────────────
export function filterDashboard() {}
export function setDashGroup() {}
export function toggleDashIntro() {}
export function toggleTop10() {}
export function initTop10Collapse() {}

// ─── Категории расходов ──────────────────────────────────────────────
export const OC_CATS = {
  renovation:  { icon: '🏗',  label: 'Ремонт и отделка' },
  equipment:   { icon: '☕',  label: 'Оборудование' },
  furniture:   { icon: '🪑',  label: 'Мебель и интерьер' },
  automation:  { icon: '💻',  label: 'Автоматизация' },
  stock:       { icon: '📦',  label: 'Стартовый склад' },
  branding:    { icon: '🎨',  label: 'Брендинг' },
  legal:       { icon: '📋',  label: 'Юридическое оформление' },
  marketing:   { icon: '📣',  label: 'Маркетинг запуска' },
  rent:        { icon: '🏠',  label: 'Депозит / аванс аренды' },
  uniform:     { icon: '👕',  label: 'Форма и инвентарь' },
  training:    { icon: '🎓',  label: 'Обучение персонала' },
  reserve:     { icon: '💰',  label: 'Оборотный резерв' },
};

export const OC_FORMATS = {
  kiosk:  { label: 'Киоск',       icon: '🏪', desc: '4–8 м² · ~500–900 тыс. ₽' },
  island: { label: 'Остров в ТЦ', icon: '🛍', desc: '8–15 м² · ~800 тыс. — 1,5 млн ₽' },
  full:   { label: 'Кофейня',     icon: '☕', desc: '20–40 м² · ~1,5–3 млн ₽' },
};

// ─── Шаблоны ─────────────────────────────────────────────────────────
const _t = (cat, name, price, qty, url = '') => ({ category: cat, name, price, qty, url, note: '' });

export const OC_TEMPLATES = {
  kiosk: [
    _t('renovation', 'Электромонтажные работы',          30000,  1),
    _t('renovation', 'Водоснабжение и канализация',       25000,  1),
    _t('renovation', 'Покраска / брендирование фасада',   20000,  1),
    _t('equipment',  'Кофемашина (2 группы)',             280000, 1, 'https://b2b.rockets.coffee'),
    _t('equipment',  'Кофегриндер основной',              55000,  1),
    _t('equipment',  'Кофегриндер on-demand',             30000,  1),
    _t('equipment',  'Холодильный шкаф 60 л',             35000,  1),
    _t('equipment',  'Льдогенератор',                     25000,  1),
    _t('equipment',  'Бойлер / колонка для кипятка',      12000,  1),
    _t('furniture',  'Стойка под оборудование (готовая)', 60000,  1),
    _t('furniture',  'Барная полка / витрина',            25000,  1),
    _t('automation', 'POS-терминал (онлайн-касса)',       25000,  1),
    _t('automation', 'Принтер чеков',                      8000,  1),
    _t('automation', 'Эквайринг (подключение)',             5000,  1),
    _t('stock',      'Кофе зерновой (старт 5 кг)',          8000,  5, 'https://b2b.rockets.coffee'),
    _t('stock',      'Молоко и альтмолоко',                3000, 10),
    _t('stock',      'Сиропы, топпинги, добавки',         25000,  1),
    _t('stock',      'Стаканы, крышки, трубочки',         20000,  1),
    _t('branding',   'Разработка логотипа',               15000,  1),
    _t('branding',   'Дизайн меню и наклеек',             10000,  1),
    _t('legal',      'Регистрация ИП / ООО',               4000,  1),
    _t('legal',      'Санитарные книжки сотрудников',      3000,  2),
    _t('marketing',  'Печать рекламных материалов',       10000,  1),
    _t('marketing',  'Таргетированная реклама (запуск)',  20000,  1),
    _t('rent',       'Депозит аренды (2 месяца)',         60000,  1),
    _t('uniform',    'Фирменные фартуки',                  2000,  3),
    _t('training',   'Обучение бариста',                  15000,  1),
    _t('reserve',    'Оборотный резерв (3 месяца)',       100000, 1),
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

// ─── Операции с записями (экспортируются в window через main.js) ─────
export function ocAddRow(category) {
  if (!S.openingCosts) S.openingCosts = [];
  const id = _ocNextId();
  S.openingCosts.push({ id, category, name: '', price: 0, qty: 1, url: '', note: '' });
  _ocSyncInvestment();
  renderDashboard();
  setTimeout(() => ocOpenItem(id), 40);
}

export function ocDeleteRow(id) {
  S.openingCosts = (S.openingCosts || []).filter(r => r.id !== id);
  _ocSyncInvestment();
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
    () => {
      const tpl = OC_TEMPLATES[format] || [];
      S.openingCosts = tpl.map((item, i) => ({ ...item, id: 'tpl_' + i + '_' + Date.now() }));
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
  window.showConfirm(
    'Очистить все статьи расходов?<br><span style="font-size:12px;color:var(--muted)">Действие нельзя отменить.</span>',
    () => { S.openingCosts = []; _ocSyncInvestment(); renderDashboard(); }
  );
}

export function ocOpenItem(id) {
  const item = (S.openingCosts || []).find(r => r.id === id);
  if (!item) return;
  const meta = _ocMeta();
  const cur  = meta.currency || 'RUB';
  const sym  = cur === 'USD' ? '$' : cur === 'EUR' ? '€' : '₽';
  const info = OC_CATS[item.category];

  document.getElementById('oci-title').textContent     = item.name || 'Без названия';
  document.getElementById('oci-cat-label').textContent = info ? info.icon + '\u2009' + info.label : '';
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
  const subcatInp = document.getElementById('oci-subcategory');
  if (subcatInp) subcatInp.value = item.subcategory || '';

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
  modalEl.removeEventListener('keydown', modalEl._ociKeyHandler || (() => {}));
  modalEl._ociKeyHandler = onKey;
  modalEl.addEventListener('keydown', onKey);

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
  item.subcategory = (document.getElementById('oci-subcategory')?.value || '').trim();
  const photoImg   = document.getElementById('oci-photo-img');
  const pSrc = photoImg?.getAttribute('data-user-url') || (photoImg?.src && !photoImg.src.endsWith(location.href.replace(/#.*/, '') + '#') ? photoImg.src : '');
  item.photo = pSrc || '';

  const rawPrice = parseFloat(document.getElementById('oci-price').value) || 0;
  item.price = cur === 'RUB' ? rawPrice
    : Math.round(rawPrice * (cur === 'USD' ? (meta.usdRate || 90) : (meta.eurRate || 98)));

  _ocSyncInvestment();
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
export function ocSetApiKey() {
  const current = localStorage.getItem('oc_openai_key') || '';
  const key = prompt('Введите ваш OpenAI API ключ (sk-...):\n\nКлюч сохраняется только в вашем браузере (localStorage).', current);
  if (key === null) return; // отмена
  if (key.trim()) {
    localStorage.setItem('oc_openai_key', key.trim());
    alert('✅ API ключ сохранён');
  } else {
    localStorage.removeItem('oc_openai_key');
    alert('Ключ удалён');
  }
}

export async function ocAiFill() {
  const apiKey = localStorage.getItem('oc_openai_key');
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
  "subcategory": "тип оборудования: одно из — Кофемашина, Кофемолка, Ледогенератор, Холодильник, Посудомоечная машина, Блендер, Водонагреватель/бойлер, Кассовое оборудование, Вытяжка/вентиляция, Другое",
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
      const subcatInp = document.getElementById('oci-subcategory');
      if (subcatInp) subcatInp.value = parsed.subcategory;
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

// ─── Рендер секции категории ─────────────────────────────────────────
function _renderCatSection(cat, items) {
  const info      = OC_CATS[cat];
  const catTotal  = items.reduce((s, r) => s + r.price * r.qty, 0);
  const collapsed = !!(S.openingMeta?.collapsed?.[cat]);
  return `
    <div class="oc-cat-section${collapsed ? ' collapsed' : ''}" data-cat="${cat}">
      <div class="oc-cat-header" onclick="ocToggleCat('${cat}')" style="cursor:pointer">
        <span class="oc-cat-icon">${info.icon}</span>
        <span class="oc-cat-label">${info.label}</span>
        <span class="oc-cat-count">${items.length} поз.</span>
        <span class="oc-cat-total${catTotal > 0 ? ' has-value' : ''}" id="oc-cat-total-${cat}">${catTotal > 0 ? _ocFmtAmt(catTotal) : ''}</span>
        <button class="oc-add-in-cat btn btn-sm btn-outline" onclick="event.stopPropagation();ocAddRow('${cat}')">
          <i data-lucide="plus" class="icon"></i> Добавить
        </button>
        <i data-lucide="chevron-down" class="icon oc-cat-chevron" style="${collapsed ? 'transform:rotate(-90deg)' : ''}"></i>
      </div>
      <div class="oc-cat-rows">
        ${items.map(_renderRow).join('')}
      </div>
    </div>`;
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
  const sections = hasCosts
    ? Object.entries(byCat).filter(([, items]) => items.length > 0)
        .map(([c, items]) => _renderCatSection(c, items)).join('')
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
          <button class="btn btn-outline" onclick="exportOpeningCostsPDF()">
            <i data-lucide="file-text" class="icon"></i> PDF
          </button>
          <button class="btn btn-outline" onclick="exportOpeningCostsXLSX()">
            <i data-lucide="table-2" class="icon"></i> Excel
          </button>
          ${costs.length > 0 ? `<button class="btn btn-outline oc-clear-btn" onclick="ocClearAll()" title="Очистить всё"><i data-lucide="trash-2" class="icon"></i></button>` : ''}
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

      <!-- Кнопка шаблона -->
      <div class="oc-tpl-bar">
        <button class="btn btn-primary oc-tpl-main" id="oc-tpl-btn" onclick="ocLoadTemplate('${format}')">
          <i data-lucide="sparkles" class="icon"></i>
          Загрузить шаблон «${OC_FORMATS[format].label}»
        </button>
        <span class="oc-tpl-note" id="oc-tpl-note">${OC_FORMATS[format].desc}</span>
      </div>

      <!-- Секции категорий -->
      <div class="oc-sections">${sections}</div>

      <!-- Добавить статью по категории -->
      <div class="oc-addcat-bar">
        <span class="oc-addcat-label">Добавить статью в категорию:</span>
        <div class="oc-addcat-btns">${addCatBtns}</div>
      </div>

    </div>`;

  if (window.lucide) lucide.createIcons();
  _ocInitDrag();
}
