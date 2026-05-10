// src/data/mat.js
// Справочник сырья: категории, состав, КБЖУ

export const MAT_CATEGORIES = {
  coffee:  { label: '☕ Кофе', order: 1 },
  dairy:   { label: '🥛 Молочная продукция', order: 2 },
  tea:     { label: '🍵 Чай, матча и травы', order: 3 },
  bakery:  { label: '🧂 Бакалея', order: 4 },
  drinks:  { label: '🧃 Напитки', order: 5 },
  fruits:  { label: '🍊 Фрукты и ягоды', order: 6 },
  supplies:{ label: '📦 Расходники', order: 7 },
  other:   { label: '📁 Прочее', order: 8 },
};

export const MAT = {
  coffee:        { name: 'Зерно эспрессо',          unit: '1 кг',      price: 2000, size: 1000, category: 'coffee' },
  filter_coffee: { name: 'Зерно под фильтр',         unit: '1 кг',      price: 4000, size: 1000, category: 'coffee' },
  milk:      { name: 'Молоко',                  unit: '1 л',       price: 130,  size: 1000, category: 'dairy' },
  cream:     { name: 'Сливки 10%',              unit: '1 л',       price: 250,  size: 1000, category: 'dairy' },
  cocoa:     { name: 'Какао порошок',           unit: '1 кг',      price: 2500, size: 1000, category: 'bakery' },
  matcha:    { name: 'Матча',                   unit: '1 кг',      price: 8000, size: 1000, category: 'tea' },
  sugar:     { name: 'Сахар песок',             unit: '1 кг',      price: 56,   size: 1000, category: 'bakery' },
  sugar_van: { name: 'Сахар ванильный',         unit: '1 кг',      price: 140,  size: 1000, category: 'bakery' },
  sugar_org: { name: 'Сахар апельсиновый',      unit: '1 кг',      price: 90,   size: 1000, category: 'bakery' },
  cup250:    { name: 'Стакан 250 мл + крышка',  unit: '1 шт',      price: 9,    size: 1,    category: 'supplies' },
  cup350:    { name: 'Стакан 350 мл + крышка',  unit: '1 шт',      price: 11,   size: 1,    category: 'supplies' },
  cup450:    { name: 'Стакан 450 мл + крышка',  unit: '1 шт',      price: 13,   size: 1,    category: 'supplies' },
  cup_p300:  { name: 'Стакан пластик 300 мл',   unit: '1 шт',      price: 11,   size: 1,    category: 'supplies' },
  cup_p500:  { name: 'Стакан пластик 500 мл',   unit: '1 шт',      price: 13,   size: 1,    category: 'supplies' },
  orange:    { name: 'Апельсины',               unit: '1 кг',      price: 150,  size: 1000, category: 'fruits' },
  tea:       { name: 'Чай в ассортименте',      unit: '1 кг',      price: 2300, size: 1000, category: 'tea' },
  tonic:     { name: 'Рокет тоник 250 мл',      unit: '1 бут.',    price: 120,  size: 250,  category: 'drinks' },
  lime:      { name: 'Лайм',                    unit: '1 кг',      price: 290,  size: 1000, category: 'fruits' },
};

export const MAT_NUTRITION = {
  coffee:        { kcal: 2,   protein: 0.1, fat: 0,    carbs: 0    },
  filter_coffee: { kcal: 2,   protein: 0.1, fat: 0,    carbs: 0    },
  milk:          { kcal: 52,  protein: 2.8, fat: 2.5,  carbs: 4.7  },
  cream:         { kcal: 119, protein: 2.7, fat: 10.0, carbs: 4.0  },
  cocoa:         { kcal: 289, protein: 19.6,fat: 13.7, carbs: 10.0 },
  matcha:        { kcal: 324, protein: 23.0,fat: 5.0,  carbs: 38.0 },
  sugar:         { kcal: 399, protein: 0,   fat: 0,    carbs: 99.8 },
  sugar_van:     { kcal: 397, protein: 0,   fat: 0,    carbs: 99.0 },
  sugar_org:     { kcal: 395, protein: 0,   fat: 0,    carbs: 98.0 },
  orange:        { kcal: 47,  protein: 0.9, fat: 0.2,  carbs: 11.0 },
  tea:           { kcal: 1,   protein: 0.1, fat: 0,    carbs: 0.1  },
  tonic:         { kcal: 30,  protein: 0,   fat: 0,    carbs: 7.5  },
  lime:          { kcal: 30,  protein: 0.7, fat: 0.2,  carbs: 7.4  },
};

export const MAT_ORIG = JSON.parse(JSON.stringify(MAT));
export const BASE_MAT_KEYS = new Set(Object.keys(MAT_ORIG));
