// src/data/constants.js
// Константы: пресеты продаж, статьи затрат, шаблоны меню

export const SALES_PRESETS = {
  normal: { label:'☕ Обычный день', portions:{0:5,1:10,2:15,3:20,4:15,5:15,6:10,7:8,8:5,9:3,10:8,11:5,12:5,13:3,14:5,15:3,16:3,17:8,18:8,19:5,20:10,21:8,22:5,23:3,24:5,25:3,26:5,27:3,28:2,29:2} },
  quiet:  { label:'🌿 Тихий день',   portions:{0:3,1:5,2:8,3:10,4:8,5:8,6:5,7:4,8:3,9:2,10:4,11:3,12:3,13:2,14:3,15:2,16:2,17:5,18:4,19:3,20:5,21:4,22:3,23:2,24:3,25:2,26:3,27:1,28:1,29:1} },
  summer: { label:'🔥 Летний сезон', portions:{0:4,1:8,2:12,3:15,4:12,5:10,6:8,7:6,8:4,9:2,10:5,11:3,12:4,13:2,14:2,15:1,16:2,17:5,18:10,19:7,20:25,21:20,22:12,23:8,24:15,25:10,26:15,27:4,28:3,29:3} },
  winter: { label:'❄️ Зимний спад',  portions:{0:4,1:8,2:12,3:18,4:14,5:14,6:9,7:7,8:5,9:3,10:8,11:5,12:4,13:3,14:7,15:5,16:3,17:12,18:6,19:4,20:2,21:2,22:1,23:0,24:1,25:0,26:1,27:2,28:2,29:1} },
};

export const FIXED_COSTS_CATS = [
  { id:'rent',  label:'Аренда и помещение' },
  { id:'staff', label:'Персонал' },
  { id:'equip', label:'Оборудование' },
  { id:'ops',   label:'Операционные' },
  { id:'mkt',   label:'Маркетинг' },
  { id:'admin', label:'Административные' },
  { id:'other', label:'Прочее' },
];

export let _nextCostId = 200;
export const FIXED_COSTS_DEF = [
  { id:1,  name:'Аренда помещения',            category:'rent',  value:80000, isVariable:false },
  { id:2,  name:'Коммунальные услуги',          category:'rent',  value:15000, isVariable:false },
  { id:3,  name:'Интернет и телефония',         category:'rent',  value:3000,  isVariable:false },
  { id:4,  name:'Вывоз мусора / клининг',       category:'rent',  value:5000,  isVariable:false },
  { id:5,  name:'ФОТ (зарплаты)',               category:'staff', value:0,     isVariable:false },
  { id:6,  name:'Обучение / аттестация',        category:'staff', value:3000,  isVariable:false },
  { id:7,  name:'Амортизация оборудования',     category:'equip', value:20000, isVariable:false },
  { id:8,  name:'Техобслуживание / ремонт',     category:'equip', value:5000,  isVariable:false },
  { id:9,  name:'Расходники (стаканы, крышки)', category:'ops',   value:10000, isVariable:true  },
  { id:10, name:'Хозтовары (моющие, салфетки)', category:'ops',   value:3000,  isVariable:true  },
  { id:11, name:'Реклама (таргет, Яндекс)',     category:'mkt',   value:10000, isVariable:false },
  { id:12, name:'SMM / контент',                category:'mkt',   value:5000,  isVariable:false },
  { id:13, name:'Программа лояльности / промо', category:'mkt',   value:3000,  isVariable:true  },
  { id:14, name:'Бухгалтерия / аутсорс',        category:'admin', value:5000,  isVariable:false },
  { id:15, name:'Эквайринг',                    category:'admin', value:0,     isVariable:true, isPercent:true, pct:2.0, pctShare:90 },
  { id:16, name:'Касса / ОФД / ЕГАИС',          category:'admin', value:3000,  isVariable:false },
  { id:17, name:'Прочие административные',      category:'admin', value:5000,  isVariable:false },
  { id:18, name:'Страховка',                    category:'other', value:2000,  isVariable:false },
  { id:19, name:'Лицензии / разрешения',        category:'other', value:1000,  isVariable:false },
  { id:20, name:'Непредвиденные расходы',       category:'other', value:5000,  isVariable:false },
];

export const MENU_TEMPLATES = {
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
