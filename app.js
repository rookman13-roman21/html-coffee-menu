// ════════════════════════════════════════════════════════════════════
//  DATA
// ════════════════════════════════════════════════════════════════════

const MAT_CATEGORIES = {
  coffee:  { label: '☕ Кофе', order: 1 },
  dairy:   { label: '🥛 Молочная продукция', order: 2 },
  tea:     { label: '🍵 Чай, матча и травы', order: 3 },
  bakery:  { label: '🧂 Бакалея', order: 4 },
  drinks:  { label: '🧃 Напитки', order: 5 },
  fruits:  { label: '🍊 Фрукты и ягоды', order: 6 },
  supplies:{ label: '📦 Расходники', order: 7 },
  other:   { label: '📁 Прочее', order: 8 },
};

const MAT = {
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

// КБЖУ на 100 г / 100 мл каждого ингредиента
const MAT_NUTRITION = {
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

// recipe: [ { mat, amt, loss? } ]
//   mat  — ключ в MAT
//   amt  — количество (г / мл / шт)
//   loss — потери при обработке (0..1), для фреша
const DRINKS = [
  // ГОРЯЧИЕ КОФЕЙНЫЕ
  { id:0,  group:'hot',  name:'Эспрессо',              vol:50,
    recipe:[{mat:'coffee',amt:19},{mat:'cup250',amt:1}], price:190,
    videoUrl:'https://youtu.be/5zrVbGNA40I?si=2YyIwkPvF_l3bpuH',
    process:'Прогреть чашку горячей водой. Смолоть 19 г зерна, дозировать в портафильтр, утрамбовать темпером с усилием ~15 кг. Установить портафильтр, включить пролив. Время экстракции: 25–30 сек, выход: 30–35 мл. (36гр). Подавать немедленно.' },
  { id:1,  group:'hot',  name:'Американо 200',          vol:200,
    recipe:[{mat:'coffee',amt:19},{mat:'cup250',amt:1}], price:190,
    process:'Приготовить одинарный эспрессо (19 г / 25–30 сек). В прогретую чашку налить горячую воду 60°C, влить эспрессо сверху — сохраняется крема. Подавать сразу.' },
  { id:2,  group:'hot',  name:'Американо 400',          vol:400,
    recipe:[{mat:'coffee',amt:38},{mat:'cup450',amt:1}], price:360,
    process:'Приготовить двойной эспрессо (38 г / 25–30 сек). В прогретую чашку налить горячую воду 60°C, влить эспрессо сверху — сохраняется крема. Подавать сразу.' },
  { id:3,  group:'hot',  name:'Капучино 200',           vol:200,
    recipe:[{mat:'coffee',amt:19},{mat:'milk',amt:170},{mat:'cup250',amt:1}], price:280,
    videoUrl:'https://youtu.be/ug8rgA3tlWA?si=-AjWGv36E4425tWZ',
    process:'Приготовить эспрессо (19 г). 170 мл холодного молока налить в питчер до нижней части носика. Вспенить капучинатором: погружение 1 см, температура 60°C, текстура «мокрый шёлк». Влить молоко в чашку с эспрессо круговым движением.' },
  { id:4,  group:'hot',  name:'Капучино 300',           vol:300,
    recipe:[{mat:'coffee',amt:19},{mat:'milk',amt:250},{mat:'cup350',amt:1}], price:330,
    videoUrl:'https://youtu.be/ug8rgA3tlWA?si=-AjWGv36E4425tWZ',
    process:'Приготовить двойной эспрессо (19 г). 250 мл холодного молока налить в питчер до нижней части носика. Вспенить капучинатором: погружение 1 см, температура 60°C, текстура «мокрый шёлк». Влить молоко в чашку с эспрессо круговым движением.' },
  { id:5,  group:'hot',  name:'Латте 300',              vol:300,
    recipe:[{mat:'coffee',amt:19},{mat:'milk',amt:250},{mat:'cup350',amt:1}], price:330,
    process:'Приготовить эспрессо (19 г). 250 мл холодного молока вспенить до температуры 60°C, текстура «мокрый шёлк». 2 варианта подачи: — Влить в стакан эспрессо, сверху молоко с небольшим слоем пены. Можно оформить латте-арт. — Влить молоко в стакан немного не доливая до края, сверху в центр влить эспрессо. Можно оформить рисунок этчером.' },
  { id:6,  group:'hot',  name:'Латте 400',              vol:400,
    recipe:[{mat:'coffee',amt:19},{mat:'milk',amt:350},{mat:'cup450',amt:1}], price:390,
    process:'Приготовить двойной эспрессо (19 г). 350 мл холодного молока вспенить до температуры 60°C, текстура «мокрый шёлк». 2 варианта подачи: — Влить в стакан эспрессо, сверху молоко с небольшим слоем пены. Можно оформить латте-арт. — Влить молоко в стакан немного не доливая до края, сверху в центр влить эспрессо. Можно оформить рисунок этчером.' },
  { id:7,  group:'hot',  name:'Флэт уайт 200',          vol:200,
    recipe:[{mat:'coffee',amt:19},{mat:'milk',amt:170},{mat:'cup250',amt:1}], price:300,
    process:'Приготовить двойной эспрессо (19 г, экстракция 25–30 сек). Вспенить 170 мл молока до 60°C, микропена — минимально воздушная. Влить в небольшую чашку 180–200 мл, высокая концентрация кофе относительно молока.' },
  { id:8,  group:'hot',  name:'Моккачино 300',          vol:300,
    recipe:[{mat:'coffee',amt:19},{mat:'milk',amt:250},{mat:'cocoa',amt:15},{mat:'cup350',amt:1}], price:450,
    process:'Приготовить эспрессо (19 г). В прогретую чашку добавить какао-порошок (15 г) и развести небольшим количеством кипятка, чтобы получить насыщенную основу. Влить эспрессо и перемешать. Вспенить 250 мл молока до 60°C, влить сверху. По желанию посыпать какао или оформить латте-арт.' },
  { id:9,  group:'hot',  name:'Моккачино 400',          vol:400,
    recipe:[{mat:'coffee',amt:19},{mat:'milk',amt:330},{mat:'cocoa',amt:20},{mat:'cup450',amt:1}], price:500,
    process:'Приготовить двойной эспрессо (19 г). В прогретую чашку добавить какао-порошок (20 г) и развести небольшим количеством кипятка, чтобы получить насыщенную основу. Влить эспрессо и перемешать. Вспенить 330 мл молока до 60°C, влить сверху. По желанию посыпать какао или оформить латте-арт.' },
  { id:10, group:'hot',  name:'Раф ванильный 300',      vol:300,
    recipe:[{mat:'coffee',amt:19},{mat:'cream',amt:250},{mat:'sugar_van',amt:10},{mat:'cup350',amt:1}], price:450,
    process:'Приготовить эспрессо (19 г). В питчер налить 250 мл сливок 10%, добавить ванильный сахар (10 г), влить горячий эспрессо. Взбить капучинатором до однородной воздушной текстуры 60°C. Перелить в прогретый бокал.' },
  { id:11, group:'hot',  name:'Раф ванильный 400',      vol:400,
    recipe:[{mat:'coffee',amt:19},{mat:'cream',amt:350},{mat:'sugar_van',amt:10},{mat:'cup450',amt:1}], price:450,
    process:'Приготовить двойной эспрессо (19 г). В питчер налить 350 мл сливок 10%, добавить ванильный сахар (10 г), влить горячий эспрессо. Взбить капучинатором до однородной воздушной текстуры 60°C. Перелить в прогретый бокал.' },
  { id:12, group:'hot',  name:'Раф апельсиновый 300',   vol:300,
    recipe:[{mat:'coffee',amt:19},{mat:'cream',amt:250},{mat:'sugar_org',amt:10},{mat:'cup350',amt:1}], price:380,
    process:'Приготовить эспрессо (19 г). В питчер налить 250 мл сливок 10%, добавить апельсиновый сахар (10 г), влить горячий эспрессо. Взбить капучинатором до воздушной текстуры 60°C. Перелить в прогретый бокал.' },
  { id:13, group:'hot',  name:'Раф апельсиновый 400',   vol:400,
    recipe:[{mat:'coffee',amt:19},{mat:'cream',amt:350},{mat:'sugar_org',amt:10},{mat:'cup450',amt:1}], price:400,
    process:'Приготовить двойной эспрессо (19 г). В питчер налить 350 мл сливок 10%, добавить апельсиновый сахар (10 г), влить горячий эспрессо. Взбить капучинатором до воздушной текстуры 60°C. Перелить в прогретый бокал.' },
  { id:14, group:'hot',  name:'Какао 300',              vol:300,
    recipe:[{mat:'milk',amt:250},{mat:'cocoa',amt:13},{mat:'sugar',amt:10},{mat:'cup350',amt:1}], price:350,
    process:'В стакан добавить какао (13 г) и сахар (10 г), развести небольшим количеством кипятка до пасты без комочков. 250 мл холодного молока налить в питчер до нижней части носика. Вспенить капучинатором: погружение 1,5 см, температура 60°C, текстура «мокрый шёлк». Влить в стакан используя технику латте-арт.' },
  { id:15, group:'hot',  name:'Какао 400',              vol:400,
    recipe:[{mat:'milk',amt:350},{mat:'cocoa',amt:18},{mat:'sugar',amt:12},{mat:'cup450',amt:1}], price:390,
    process:'В стакан добавить какао (18 г) и сахар (12 г), развести небольшим количеством кипятка до пасты без комочков. 350 мл холодного молока налить в питчер до нижней части носика. Вспенить капучинатором: погружение 1,5 см, температура 60°C, текстура «мокрый шёлк». Влить в стакан используя технику латте-арт.' },
  { id:16, group:'hot',  name:'Ванильное облако 300',   vol:300,
    recipe:[{mat:'cream',amt:100},{mat:'sugar_van',amt:5},{mat:'cup350',amt:1}], price:330,
    process:'В питчер насыпать ванильный сахар и влить сливки 10%. Всё это взбивают капучинатором до температуры 60°C и переливают в стакан. Можно украсить какао.' },
  // ЧАЙ И МАТЧА
  { id:17, group:'tea',  name:'Чай в ассортименте 400', vol:400,
    recipe:[{mat:'tea',amt:13},{mat:'cup450',amt:1}], price:390,
    process:'Прогреть чайник кипятком, слить воду. Засыпать 13 г чая в заварник или фильтр. Залить 400 мл воды: зелёный и белый — 80°C, чёрный и травяной — 90–95°C. Время заваривания 2–4 минуты в зависимости от сорта. Подавать сразу.' },
  { id:18, group:'tea',  name:'Матча 300',              vol:300,
    recipe:[{mat:'matcha',amt:3},{mat:'milk',amt:250},{mat:'cup350',amt:1}], price:330,
    process:'В питчер добавить 2–3 г матча, влить 50 мл горячей воды 75–80°C (не кипяток — иначе горечь). Взбить венчиком или часен до исчезновения комочков. Вспенить 250 мл молока капучинатором до 60°C. В бокал влить матча-основу, сверху аккуратно влить молоко.' },
  { id:19, group:'tea',  name:'Матча 400',              vol:400,
    recipe:[{mat:'matcha',amt:4},{mat:'milk',amt:350},{mat:'cup450',amt:1}], price:390,
    process:'В питчер добавить 3–4 г матча, влить 50 мл горячей воды 75–80°C (не кипяток — иначе горечь). Взбить венчиком или часен до исчезновения комочков. Вспенить 350 мл молока капучинатором до 60°C. В бокал влить матча-основу, сверху аккуратно влить молоко.' },
  // ХОЛОДНЫЕ
  { id:20, group:'cold', name:'Айс-латте 300',          vol:300,
    recipe:[{mat:'coffee',amt:19},{mat:'milk',amt:200},{mat:'cup_p300',amt:1}], price:330,
    process:'Стакан наполнить льдом до краёв. Влить 200 мл холодного молока. Приготовить эспрессо (19 г, 30–35 мл). Влить горячий эспрессо поверх молока. Подавать с трубочкой, не перемешивая.' },
  { id:21, group:'cold', name:'Айс-латте 500',          vol:500,
    recipe:[{mat:'coffee',amt:19},{mat:'milk',amt:300},{mat:'cup_p500',amt:1}], price:420,
    process:'Стакан наполнить льдом до краёв. Влить 300 мл холодного молока. Приготовить двойной эспрессо (19 г, 50–60 мл). Влить горячий эспрессо поверх молока. Подавать с трубочкой, не перемешивая.' },
  { id:22, group:'cold', name:'Айс-какао 300',          vol:300,
    recipe:[{mat:'milk',amt:200},{mat:'cocoa',amt:10},{mat:'cup_p300',amt:1}], price:400,
    process:'В стакане смешать какао (10 г) с небольшим количеством кипятка до пасты без комочков. Наполнить стакан льдом, влить 200 мл холодного молока, перемешать. Подавать с трубочкой.' },
  { id:23, group:'cold', name:'Айс-какао 500',          vol:500,
    recipe:[{mat:'milk',amt:350},{mat:'cocoa',amt:15},{mat:'cup_p500',amt:1}], price:400,
    process:'В стакане смешать какао (15 г) с небольшим количеством кипятка до пасты без комочков. Наполнить стакан льдом, влить 350 мл холодного молока, перемешать. Подавать с трубочкой.' },
  { id:24, group:'cold', name:'Бамбл 300',              vol:300,
    recipe:[{mat:'coffee',amt:19},{mat:'orange',amt:580,loss:0.5},{mat:'cup_p300',amt:1}], price:400,
    process:'Выжать свежий апельсиновый сок (~290 мл из 580 г апельсинов). Стакан наполнить льдом, влить сок. Приготовить эспрессо (19 г, 30–35 мл). Медленно влить горячий эспрессо поверх сока — эффект «закат». Не перемешивать. Подавать с трубочкой.' },
  { id:25, group:'cold', name:'Бамбл 500',              vol:500,
    recipe:[{mat:'coffee',amt:19},{mat:'orange',amt:700,loss:0.5},{mat:'cup_p500',amt:1}], price:420,
    process:'Выжать свежий апельсиновый сок (~350 мл из 700 г апельсинов). Стакан наполнить льдом, влить сок. Приготовить двойной эспрессо (19 г, 50–60 мл). Медленно влить горячий эспрессо поверх сока — эффект «закат». Не перемешивать. Подавать с трубочкой.' },
  { id:26, group:'cold', name:'Эспрессо-тоник 300',     vol:300,
    recipe:[{mat:'coffee',amt:19},{mat:'tonic',amt:250},{mat:'lime',amt:14},{mat:'cup_p300',amt:1}], price:350,
    process:'Стакан наполнить льдом. Влить охлаждённый тоник Рокет (250 мл) по стенке стакана, чтобы не выбить газ. Приготовить эспрессо (19 г, 30–35 мл). Медленно влить эспрессо поверх тоника — образуется пузырьковая шапка. Добавить дольку лайма (14 г). Не перемешивать, подавать немедленно. (можно подавать с двойным эспрессо)' },
  // ФИЛЬТР-КОФЕ
  { id:27, group:'filter', name:'Фильтр-кофе 200', vol:200,
    recipe:[{mat:'filter_coffee',amt:14},{mat:'cup250',amt:1}], price:250,
    process:'Заготовка: кофе 120 г, вода 2 л, помол средний под фильтр-кофе, температура воды 92–96°C, соотношение 60 г на 1 л воды.\n1. Прогреть термос.\n2. Установить бумажный фильтр и промыть горячей водой.\n3. Засыпать 120 г молотого кофе.\n4. Заварить 2 л воды через фильтр.\n5. Готовый кофе сразу перелить в чистый прогретый термос.\n6. Подписать время приготовления. Подавать в прогретую чашку.' },
  { id:28, group:'filter', name:'Фильтр-кофе 300', vol:300,
    recipe:[{mat:'filter_coffee',amt:20},{mat:'cup350',amt:1}], price:320,
    process:'Заготовка: кофе 120 г, вода 2 л, помол средний под фильтр-кофе, температура воды 92–96°C, соотношение 60 г на 1 л воды.\n1. Прогреть термос.\n2. Установить бумажный фильтр и промыть горячей водой.\n3. Засыпать 120 г молотого кофе.\n4. Заварить 2 л воды через фильтр.\n5. Готовый кофе сразу перелить в чистый прогретый термос.\n6. Подписать время приготовления. Подавать в прогретую чашку.' },
  { id:29, group:'filter', name:'Пуровер 270',      vol:270,
    recipe:[{mat:'filter_coffee',amt:18},{mat:'cup350',amt:1}], price:350,
    process:'Смолоть 18 г зерна (помол средне-крупный). Установить фильтр Hario V60, промыть кипятком, слить. Засыпать кофе. Залить 36 мл воды 93°C для «цветения», подождать 45 сек. Затем три порции по ~78 мл с интервалом 30–40 сек круговыми движениями. Общее время: 3:00–3:30 мин.' },
];

// ─── Изображения напитков (файлы в папке images/) ───────────────
// Одно фото на тип, варианты по объёму используют одно изображение
const DRINK_IMAGES = {
   0: 'images/Эспрессо.jpg',
   1: 'images/Американо.jpg',
   2: 'images/Американо.jpg',
   3: 'images/Капучино.jpg',
   4: 'images/Капучино.jpg',
   5: 'images/Латте.jpg',
   6: 'images/Латте.jpg',
   7: 'images/Флэт уайт.jpg',
   8: 'images/Моккачино.jpg',
   9: 'images/Моккачино.jpg',
  10: 'images/Раф ванильный.jpg',
  11: 'images/Раф ванильный.jpg',
  12: 'images/Раф апельсиновый.jpg',
  13: 'images/Раф апельсиновый.jpg',
  14: 'images/Какао.jpg',
  15: 'images/Какао.jpg',
  16: 'images/Ванильное облако.jpg',
  17: 'images/Чай.jpg',
  18: 'images/Матча.jpg',
  19: 'images/Матча.jpg',
  20: 'images/Айс-латте.jpg',
  21: 'images/Айс-латте.jpg',
  22: 'images/Айс-какао.jpg',
  23: 'images/Айс-какао.jpg',
  24: 'images/Бамбл.jpg',
  25: 'images/Бамбл.jpg',
  26: 'images/Эспрессо -тоник.jpg',
  27: 'images/Фильтр-кофе.jpg',
  28: 'images/Фильтр-кофе.jpg',
  29: 'images/Пуровер.jpg',
};
function getDrinkImage(d) { return d.image || DRINK_IMAGES[d.id] || null; }

// ─── Пресеты плана продаж ────────────────────────────────────────
// Ключи = id напитка, значения = порций/день
const SALES_PRESETS = {
  normal: { label:'☕ Обычный день', portions:{0:5,1:10,2:15,3:20,4:15,5:15,6:10,7:8,8:5,9:3,10:8,11:5,12:5,13:3,14:5,15:3,16:3,17:8,18:8,19:5,20:10,21:8,22:5,23:3,24:5,25:3,26:5,27:3,28:2,29:2} },
  quiet:  { label:'🌿 Тихий день',   portions:{0:3,1:5,2:8,3:10,4:8,5:8,6:5,7:4,8:3,9:2,10:4,11:3,12:3,13:2,14:3,15:2,16:2,17:5,18:4,19:3,20:5,21:4,22:3,23:2,24:3,25:2,26:3,27:1,28:1,29:1} },
  summer: { label:'🔥 Летний сезон', portions:{0:4,1:8,2:12,3:15,4:12,5:10,6:8,7:6,8:4,9:2,10:5,11:3,12:4,13:2,14:2,15:1,16:2,17:5,18:10,19:7,20:25,21:20,22:12,23:8,24:15,25:10,26:15,27:4,28:3,29:3} },
  winter: { label:'❄️ Зимний спад',  portions:{0:4,1:8,2:12,3:18,4:14,5:14,6:9,7:7,8:5,9:3,10:8,11:5,12:4,13:3,14:7,15:5,16:3,17:12,18:6,19:4,20:2,21:2,22:1,23:0,24:1,25:0,26:1,27:2,28:2,29:1} },
};

const FIXED_COSTS_CATS = [
  { id:'rent',  label:'Аренда и помещение' },
  { id:'staff', label:'Персонал' },
  { id:'equip', label:'Оборудование' },
  { id:'ops',   label:'Операционные' },
  { id:'mkt',   label:'Маркетинг' },
  { id:'admin', label:'Административные' },
  { id:'other', label:'Прочее' },
];
let _nextCostId = 200;
const FIXED_COSTS_DEF = [
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

const GROUP_LABEL = { hot:'<i data-lucide="coffee" class="icon"></i> Горячие кофейные', tea:'<i data-lucide="leaf" class="icon"></i> Чай и матча', cold:'<i data-lucide="snowflake" class="icon"></i> Холодные напитки', filter:'<i data-lucide="filter" class="icon"></i> Фильтр-кофе' };

let nextDrinkId = 27; // auto-increment id for new drinks
let nextMatKey  = 1;  // suffix for custom mat keys
let _editMatKey = null;
let _pendingMatSelectEl     = null; // select в строке рецепта напитка, откуда открыли «создать ингредиент»
let _pendingSemiMatSelectEl = null; // select в строке п/ф, откуда открыли «создать ингредиент»

// ─── Полуфабрикаты ───────────────────────────────────────────────
// { id, name, unit:'мл'|'г'|'шт', yield: number, process:'', recipe:[{mat,amt,loss?}] }
let SEMI = [];
let nextSemiId = 1;

// Показатели качества и безопасности для техкарты
// Новые напитки (не в этом объекте) отображаются без этого блока
const DRINK_QUALITY = {
  0:  { appearance: 'Коричнево-чёрный напиток с плотной рыжевато-золотистой крема 5–10 мм', consistency: 'Плотная, устойчивая пена-крема', color: 'Тёмно-коричневый с рыжево-золотистыми прожилками крема', taste: 'Насыщенный, баланс горечи и сладости, типичный кофейный аромат' },
  1:  { appearance: 'Чёрный напиток с тонкой коричневой пенкой на поверхности', consistency: 'Жидкая, однородная', color: 'Тёмно-коричневый, ближе к чёрному', taste: 'Мягкий кофейный, незначительная горечь, без посторонних привкусов' },
  2:  { appearance: 'Чёрный напиток с тонкой коричневой пенкой на поверхности', consistency: 'Жидкая, однородная', color: 'Тёмно-коричневый, ближе к чёрному', taste: 'Мягкий кофейный, незначительная горечь, без посторонних привкусов' },
  3:  { appearance: 'Однородный напиток, слой плотной молочной пены 1–1,5 см', consistency: 'Плотная молочная пена, текстура «мокрый шёлк»', color: 'Бежевый-коричневый с белой пеной', taste: 'Мягкий, обволакивающий, баланс кофе и молока, без посторонней горечи' },
  4:  { appearance: 'Однородный напиток, слой плотной молочной пены 1–1,5 см', consistency: 'Плотная молочная пена, текстура «мокрый шёлк»', color: 'Бежевый-коричневый с белой пеной', taste: 'Мягкий, обволакивающий, баланс кофе и молока, без посторонней горечи' },
  5:  { appearance: 'Однородный напиток, тонкая молочная пена до 0,5 см, возможен латте-арт', consistency: 'Жидкая, однородная, легкая пена', color: 'Коричневый с молочными оттенками, белая пена', taste: 'Мягкий, молочный, слабое кофейное послевкусие, без посторонних привкусов' },
  6:  { appearance: 'Однородный напиток, тонкая молочная пена до 0,5 см, возможен латте-арт', consistency: 'Жидкая, однородная, легкая пена', color: 'Коричневый с молочными оттенками, белая пена', taste: 'Мягкий, молочный, слабое кофейное послевкусие, без посторонних привкусов' },
  7:  { appearance: 'Однородный напиток, слой плотной микропены до 0,5 см', consistency: 'Жидкая, высокая концентрация кофе, минимальная пена', color: 'Коричневый, более тёмный чем у латте, белая полоска', taste: 'Интенсивный кофейный, бархатный, минимально сладкий, без посторонних привкусов' },
  8:  { appearance: 'Однородный напиток, слой плотной молочной пены', consistency: 'Жидкая, незначительно вязкая за счёт какао', color: 'Тёмно-коричневый с шоколадными оттенками', taste: 'Шоколадно-кофейный, сладковатый, баланс горечи и сладости, без посторонних привкусов' },
  9:  { appearance: 'Однородный напиток, слой плотной молочной пены', consistency: 'Жидкая, незначительно вязкая за счёт какао', color: 'Тёмно-коричневый с шоколадными оттенками', taste: 'Шоколадно-кофейный, сладковатый, баланс горечи и сладости, без посторонних привкусов' },
  10: { appearance: 'Однородный воздушный напиток без расслоения', consistency: 'Пышная, кремообразная, устойчивая', color: 'Светло-коричневый, кремовый', taste: 'Сливочно-кофейный с ванильными нотками, мягкий, без посторонних привкусов' },
  11: { appearance: 'Однородный воздушный напиток без расслоения', consistency: 'Пышная, кремообразная, устойчивая', color: 'Светло-коричневый, кремовый', taste: 'Сливочно-кофейный с ванильными нотками, мягкий, без посторонних привкусов' },
  12: { appearance: 'Однородный воздушный напиток без расслоения', consistency: 'Пышная, кремообразная, устойчивая', color: 'Светло-коричневый с тёплым апельсиновым оттенком', taste: 'Сливочно-кофейный с лёгкой цитрусной ноткой, мягкий, без посторонних привкусов' },
  13: { appearance: 'Однородный воздушный напиток без расслоения', consistency: 'Пышная, кремообразная, устойчивая', color: 'Светло-коричневый с тёплым апельсиновым оттенком', taste: 'Сливочно-кофейный с лёгкой цитрусной ноткой, мягкий, без посторонних привкусов' },
  14: { appearance: 'Однородный напиток с плотной молочной пеной', consistency: 'Жидкая, незначительно вязкая за счёт какао', color: 'Тёмно-коричневый, шоколадный, пена белая', taste: 'Насыщенный шоколадный, сладковатый, нежный, без посторонних привкусов' },
  15: { appearance: 'Однородный напиток с плотной молочной пеной', consistency: 'Жидкая, незначительно вязкая за счёт какао', color: 'Тёмно-коричневый, шоколадный, пена белая', taste: 'Насыщенный шоколадный, сладковатый, нежный, без посторонних привкусов' },
  16: { appearance: 'Однородный воздушный напиток без расслоения', consistency: 'Пышная, кремообразная, легкая', color: 'Белоснежный, кремовый', taste: 'Нежный, сливочный с ванильным ароматом, без посторонних привкусов' },
  17: { appearance: 'Прозрачный напиток без мути, осадка допустима для травяных сортов', consistency: 'Жидкая, лёгкая', color: 'От светло-жёлтого (зелёный) до тёмно-красного (чёрный) в зависимости от сорта', taste: 'Свойственный выбранному сорту, без посторонних привкусов и запахов' },
  18: { appearance: 'Однородный напиток, виден переход зелёного в молочный, пена отсутствует', consistency: 'Жидкая, однородная, без комочков', color: 'Ярко-зелёный (матча-слой) плавно переходит в белый', taste: 'Тонкий землистый вкус матча, сладковатое молоко, без горечи' },
  19: { appearance: 'Однородный напиток, виден переход зелёного в молочный, пена отсутствует', consistency: 'Жидкая, однородная, без комочков', color: 'Ярко-зелёный (матча-слой) плавно переходит в белый', taste: 'Тонкий землистый вкус матча, сладковатое молоко, без горечи' },
  20: { appearance: 'Напиток со льдом, виден чёрный эспрессо на поверхности молока', consistency: 'Жидкая, холодная, без расслоения', color: 'Белый снизу, тёмно-коричневый сверху', taste: 'Мягкий, молочно-кофейный, освежающий, без посторонних привкусов' },
  21: { appearance: 'Напиток со льдом, виден чёрный эспрессо на поверхности молока', consistency: 'Жидкая, холодная, без расслоения', color: 'Белый снизу, тёмно-коричневый сверху', taste: 'Мягкий, молочно-кофейный, освежающий, без посторонних привкусов' },
  22: { appearance: 'Однородный напиток со льдом, без расслоения', consistency: 'Жидкая, холодная, незначительно вязкая', color: 'Тёмно-коричневый, шоколадный', taste: 'Насыщенный шоколадный, освежающий, сладковатый, без посторонних привкусов' },
  23: { appearance: 'Однородный напиток со льдом, без расслоения', consistency: 'Жидкая, холодная, незначительно вязкая', color: 'Тёмно-коричневый, шоколадный', taste: 'Насыщенный шоколадный, освежающий, сладковатый, без посторонних привкусов' },
  24: { appearance: 'Двухслойный напиток: апельсиновый сок снизу, тёмно-коричневый эспрессо сверху', consistency: 'Жидкая, холодная, без расслоения', color: 'Апельсиновый с тёмно-коричневым переходом на поверхности', taste: 'Сочный апельсиновый с насыщенным кофе, баланс кислоты и горечи' },
  25: { appearance: 'Двухслойный напиток: апельсиновый сок снизу, тёмно-коричневый эспрессо сверху', consistency: 'Жидкая, холодная, без расслоения', color: 'Апельсиновый с тёмно-коричневым переходом на поверхности', taste: 'Сочный апельсиновый с насыщенным кофе, баланс кислоты и горечи' },
  26: { appearance: 'Газированный напиток со льдом, слой пены при подаче', consistency: 'Жидкая, газированная, освежающая', color: 'Бледно-жёлтый с тёмным коричневым оттенком сверху', taste: 'Горьковато-кислый тоник с насыщенным кофе, цитрусная нотка лайма' },
  27: { appearance: 'Прозрачный напиток янтарно-коричневого цвета, без мути и осадка', consistency: 'Жидкая, однородная, легкая', color: 'Янтарно-коричневый, золотистый', taste: 'Чистый, похожий на терруар, лёгкая кислотность, без горечи и посторонних привкусов' },
  28: { appearance: 'Прозрачный напиток янтарно-коричневого цвета, без мути и осадка', consistency: 'Жидкая, однородная, легкая', color: 'Янтарно-коричневый, золотистый', taste: 'Чистый, похожий на терруар, лёгкая кислотность, без горечи и посторонних привкусов' },
  29: { appearance: 'Прозрачный янтарно-коричневый напиток, без мути и осадка', consistency: 'Жидкая, однородная, чистая', color: 'Янтарно-золотистый, светлый', taste: 'Яркий, фруктовый, с цветочными нотками, лёгкая кислотность, без горечи' },
};

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
    coffee:        { name: 'Rockets.coffee',  phone: '+7 925 386-74-20', note: '', site: 'https://b2b.rockets.coffee' },
    filter_coffee: { name: 'Rockets.coffee',  phone: '+7 925 386-74-20', note: '', site: 'https://b2b.rockets.coffee' },
    tonic:         { name: 'Rocket Tonic',    phone: '+7 800 201-79-69', note: '', site: 'https://rocket-tonic.com' },
    cocoa:         { name: 'Unicava',         phone: '+7 922 027-11-17', note: '', site: 'https://cacava-opt.ru' },
    milk:          { name: 'Петмол',          phone: '+7 999 233-30-04', note: '', site: 'https://mypetmol.ru' },
    cream:         { name: 'Петмол',          phone: '+7 999 233-30-04', note: '', site: 'https://mypetmol.ru' },
  },
  supplierBook: [
    { id:1, name: 'Rockets.coffee', phone: '+7 925 386-74-20', note: 'Зерно для эспрессо, фильтр-кофе, чай, матча и др.', site: 'https://b2b.rockets.coffee/' },
    { id:2, name: 'Tasty coffee',   phone: '+7 800 333-49-80', note: 'Зерно эспрессо и фильтр-кофе',                   site: 'https://shop.tastycoffee.ru/' },
    { id:3, name: 'Rocket Tonic',   phone: '+7 800 201-79-69', note: 'Безалкогольные тоники разных вкусов',                site: 'https://rocket-tonic.com/' },
    { id:4, name: 'Unicava',        phone: '+7 922 027-11-17', note: 'Bean to Bar шоколад и какао на максималках',         site: 'https://www.cacava-opt.ru/' },
    { id:5, name: 'Петмол',         phone: '+7 999 233-30-04', note: 'Молоко и сливки для бариста',                   site: 'https://mypetmol.ru/' },
    { id:6, name: 'Вкусов Лаб',     phone: '+7 965 342-88-99',  note: 'Аутентичные пряности, перец, соль и сахар премиального качества со всего мира.', site: 'https://vkusovlab.ru' },
    { id:7, name: 'Planto',         phone: '+7 800 100-02-01',  note: 'Напитки на растительной основе для бариста',       site: 'https://logikamoloka.ru/beverages/' },
  ], // [ { id, name, phone, note, site } ] — справочник без привязки
  priceLog:      [], // [{ matKey, oldPrice, newPrice, date }]
};

let activeTab = (function() {
  try {
    const saved = localStorage.getItem('mbs_active_tab');
    const valid = ['dashboard','cost','sales','finmodel','recipes'];
    return (saved && valid.includes(saved)) ? saved : 'dashboard';
  } catch(e) { return 'dashboard'; }
})();
let searchQuery = '';
let _renderTimer = null;
const dirty = { dashboard:true, cost:true, sales:true, finmodel:true, recipes:true };

// ════════════════════════════════════════════════════════════════════
//  CALCULATIONS
// ════════════════════════════════════════════════════════════════════
// Себестоимость 1 единицы полуфабриката (г/мл/шт выхода)
function _semiUnitFactor(matKey) {
  const m = MAT[matKey];
  if (!m) return 1;
  const u = (m.unit || '').toLowerCase();
  // Если единица "кг" или "л" — пользователь вводит в кг/л, формула ждёт г/мл
  return (u.includes('кг') || (u === 'л' || u.includes(' л'))) ? 1000 : 1;
}
function _matDisplayUnit(matKey) {
  const m = MAT[matKey];
  if (!m) return '';
  const u = (m.unit || '').toLowerCase();
  if (u.includes('кг')) return 'кг';
  if (u === 'л' || u.includes(' л')) return 'л';
  return 'шт';
}
// Фактор для полуфабрикатов в составе напитка:
// единица г/мл → пользователь вводит кг/л (как сырьё), храним кг/л, умножаем ×1000 при расчёте
function _semiDrinkFactor(semi) {
  if (!semi) return 1;
  const u = (semi.unit || '').toLowerCase();
  return (u === 'г' || u === 'мл' || u.startsWith('г') || u.startsWith('мл')) ? 1000 : 1;
}
function calcSemiCostPerUnit(semi) {
  const total = (semi.recipe || []).reduce((s, r) => {
    if (!MAT[r.mat]) return s;
    let c = ((S.prices[r.mat] || MAT[r.mat].price) / MAT[r.mat].size) * r.amt * _semiUnitFactor(r.mat);
    if (r.loss) c = c / (1 - r.loss);
    return s + c;
  }, 0);
  return semi.yield > 0 ? total / semi.yield : 0;
}

function calcCost(drink) {
  return drink.recipe.reduce((sum, ing) => sum + calcIngCost(ing), 0);
}

function calcIngCost(ing) {
  if (ing.semi != null) {
    const s = SEMI.find(x => x.id === ing.semi);
    if (!s) return 0;
    let c = calcSemiCostPerUnit(s) * ing.amt * _semiDrinkFactor(s);
    if (ing.loss) c = c / (1 - ing.loss);
    return c;
  }
  if (!MAT[ing.mat]) return 0;
  let c = (S.prices[ing.mat] / MAT[ing.mat].size) * ing.amt;
  if (ing.loss) c = c / (1 - ing.loss);
  return c;
}

function calcNutrition(d) {
  let kcal = 0, protein = 0, fat = 0, carbs = 0;
  (d.recipe || []).forEach(ing => {
    const n = MAT_NUTRITION[ing.mat];
    if (!n) return;
    const amt = ing.amt * (1 - (ing.loss || 0));
    kcal    += n.kcal    * amt / 100;
    protein += n.protein * amt / 100;
    fat     += n.fat     * amt / 100;
    carbs   += n.carbs   * amt / 100;
  });
  return { kcal: Math.round(kcal), protein: +protein.toFixed(1), fat: +fat.toFixed(1), carbs: +carbs.toFixed(1) };
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
  const { totRevMon: _bepRev } = salesMetrics(drinks);
  const _bepEff = getEffectiveCosts(_bepRev);
  const fixedFromCosts = _bepEff.reduce((s,c)=>s+c.value, 0);
  // Автоматически добавляем ФОТ если его нет в списке расходов
  const fotInFixed = _bepEff.some(c => /фот|зарплат|зп|оплата.?труда/i.test(c.name));
  const payroll = fotInFixed ? 0 : (typeof payrollTotal === 'function' ? payrollTotal() : 0);
  const totalFixed = fixedFromCosts + payroll;
  const { avgProfit, avgPrice } = weightedMetrics(drinks);
  const cupsMonth = avgProfit > 0 ? Math.ceil(totalFixed / avgProfit) : 0;
  const cupsDay   = Math.ceil(cupsMonth / (S.days || 30));
  return { totalFixed, fixedFromCosts, payroll, cupsMonth, cupsDay, revBEP: cupsMonth * avgPrice };
}

function getEffectiveCosts(revMon) {
  if (revMon === undefined) {
    const { totRevMon } = salesMetrics(enrich());
    revMon = totRevMon;
  }
  const fotVal = typeof payrollTotal === 'function' ? payrollTotal() : 0;
  return S.fixedCosts.map(c => {
    // ФОТ-строка: всегда берём из калькулятора ФОТ
    if (/^фот|зарплат|зп$|оплата.?труда/i.test(c.name.trim())) {
      return { ...c, value: fotVal, _fromPayroll: true };
    }
    if (c.isPercent && c.pct) {
      const share = (c.pctShare != null ? c.pctShare : 100) / 100;
      return { ...c, value: Math.round(revMon * share * c.pct / 100) };
    }
    return c;
  });
}

// ════════════════════════════════════════════════════════════════════
//  FORMAT HELPERS
// ════════════════════════════════════════════════════════════════════
const rub = v => Math.round(v).toLocaleString('ru') + '\u00a0₽';
// Для полуфабрикатов: показывает дробные копейки если значение < 1
const rubSemi = (v, unit='') => {
  if (!isFinite(v) || v === 0) return '0\u00a0₽';
  const suffix = '\u00a0₽' + (unit ? '/' + unit : '');
  if (v >= 1)   return Math.round(v).toLocaleString('ru') + suffix;
  if (v >= 0.1) return v.toFixed(2) + suffix;
  return v.toPrecision(2) + suffix;
};
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

function fcCombinedHtml(fc) {
  const cls = fcCls(fc);
  const clr = cls==='bad' ? 'var(--red)' : cls==='ok' ? '#7a5800' : 'var(--navy)';
  return `<span style="color:${clr};font-weight:700;font-size:13px">${pct(fc)}</span>`;
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
const sortState      = { col: 'profit', dir: 'desc' };
const salesSortState = { col: 'name',   dir: 'asc'  };
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

let _matActiveCat = 'all';
let _matCollapsed  = {}; // { [cat]: true/false }
let _semiCollapsed = false;
let _supCollapsed  = false;
let _ingCollapsed  = false;

function setMatCat(cat) {
  _matActiveCat = cat;
  document.querySelectorAll('.mat-cat-tab').forEach(el => {
    el.classList.toggle('active', el.dataset.cat === cat);
  });
  document.querySelectorAll('tr.mat-cat-header[data-cat]').forEach(el => {
    const c = el.dataset.cat;
    const visible = (cat === 'all' || cat === c);
    el.style.display = visible ? '' : 'none';
    const tbody = document.getElementById('mat-tbody-' + c);
    if (tbody) tbody.style.display = (!visible || _matCollapsed[c]) ? 'none' : '';
  });
}

function toggleMatCat(cat) {
  _matCollapsed[cat] = !_matCollapsed[cat];
  const tbody = document.getElementById('mat-tbody-' + cat);
  const icon  = document.getElementById('mat-cat-icon-' + cat);
  if (tbody) tbody.style.display = _matCollapsed[cat] ? 'none' : '';
  if (icon)  icon.textContent = _matCollapsed[cat] ? '▶' : '▼';
}

function toggleSemiCat() {
  _semiCollapsed = !_semiCollapsed;
  const tbody = document.getElementById('semi-tbody');
  const icon  = document.getElementById('semi-cat-icon');
  if (tbody) tbody.style.display = _semiCollapsed ? 'none' : '';
  if (icon)  icon.textContent = _semiCollapsed ? '▶' : '▼';
}

function toggleSupSection() {
  _supCollapsed = !_supCollapsed;
  const body = document.getElementById('cost-sup-body');
  const icon = document.getElementById('cost-sup-icon');
  if (body) body.style.display = _supCollapsed ? 'none' : '';
  if (icon) icon.textContent = _supCollapsed ? '▶' : '▼';
}

function toggleIngSection() {
  _ingCollapsed = !_ingCollapsed;
  const body = document.getElementById('cost-ing-body');
  const icon = document.getElementById('cost-ing-icon');
  if (body) body.style.display = _ingCollapsed ? 'none' : '';
  if (icon) icon.textContent = _ingCollapsed ? '▶' : '▼';
}

function toggleSemiSection() {
  _semiCollapsed = !_semiCollapsed;
  const body = document.getElementById('cost-semi-body');
  const icon = document.getElementById('cost-semi-icon');
  if (body) body.style.display = _semiCollapsed ? 'none' : '';
  if (icon) icon.textContent = _semiCollapsed ? '▶' : '▼';
}

function scrollCostTo(sectionId) {
  const el = document.getElementById(sectionId);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Попап использования ингредиента / полуфабриката в рецептах ──
function _buildMatUsageMap() {
  // { matKey: [ drinkName, ... ] }
  const map = {};
  const allDrinks = typeof enrich === 'function' ? enrich() : DRINKS;
  allDrinks.forEach(d => {
    (d.recipe || []).forEach(r => {
      if (r.mat) {
        if (!map[r.mat]) map[r.mat] = [];
        map[r.mat].push(d.name);
      }
    });
  });
  return map;
}

function _buildSemiUsageMap() {
  // { semiId: [ drinkName, ... ] }
  const map = {};
  const allDrinks = typeof enrich === 'function' ? enrich() : DRINKS;
  allDrinks.forEach(d => {
    (d.recipe || []).forEach(r => {
      if (r.semi !== undefined && r.semi !== null) {
        const sid = String(r.semi);
        if (!map[sid]) map[sid] = [];
        map[sid].push(d.name);
      }
    });
  });
  // also check SEMI recipes for nested mat/semi usage
  SEMI.forEach(s => {
    (s.recipe || []).forEach(r => {
      if (r.mat) {
        if (!map['mat:' + r.mat]) map['mat:' + r.mat] = [];
        // not shown in mat table — skip
      }
    });
  });
  return map;
}

function openMatUsage(type, key) {
  let name, drinksArr;
  if (type === 'mat') {
    const m = MAT[key];
    name      = m ? m.name : key;
    drinksArr = (window._matUsageMap || {})[key] || [];
  } else {
    const s = SEMI.find(x => String(x.id) === String(key));
    name      = s ? s.name : key;
    drinksArr = (window._semiUsageMap || {})[String(key)] || [];
  }

  const existing = document.getElementById('mat-usage-popup');
  if (existing) existing.remove();
  if (!drinksArr || !drinksArr.length) return;

  const listHtml = drinksArr.map(n =>
    `<div class="usage-popup-item"><i data-lucide="coffee" class="icon" style="width:13px;height:13px;flex-shrink:0"></i> ${n}</div>`
  ).join('');

  const overlay = document.createElement('div');
  overlay.id = 'mat-usage-popup';
  overlay.className = 'usage-popup-overlay';
  overlay.innerHTML = `
    <div class="usage-popup">
      <div class="usage-popup-header">
        <span class="usage-popup-title">Используется в рецептах</span>
        <button class="usage-popup-close" onclick="document.getElementById('mat-usage-popup').remove()">&times;</button>
      </div>
      <div class="usage-popup-ingredient">${name}</div>
      <div class="usage-popup-list">${listHtml}</div>
    </div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  if (window.lucide) lucide.createIcons();
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
      grRow = `<tr class="group-row"><td colspan="4">${GROUP_LABEL[d.group]}</td></tr>`;
    }
    return grRow + `<tr${zeroCls}>
      <td class="fw7">${d.name}${p===0 ? ' <span style="font-size:10px;color:var(--muted)">—</span>' : ''}</td>
      <td class="ta-c">
        <input class="inp sm" type="number" min="0" inputmode="numeric" style="background:var(--light)"
          value="${p}"
          data-portions-id="${d.id}"
          oninput="onPortions(${d.id},this.value)">
      </td>
      <td class="ta-r">${rub(revM)}</td>
      <td class="ta-r num-pos fw7">${rub(prfD * S.days)}</td>
    </tr>`;
  }).join('');

  const tb   = document.querySelector('#tab-sales tbody');
  const foot = document.querySelector('#tab-sales tfoot');
  if (tb)   tb.innerHTML = rows;
  if (foot) foot.innerHTML = `
    <tr style="background:var(--navy);color:white;font-weight:800;font-size:14px;box-shadow:0 -2px 8px rgba(0,0,0,.15)">
      <td>ИТОГО${salesSearch ? ' <span style="font-size:11px;opacity:.7">(фильтр)</span>' : ''}</td>
      <td class="ta-c" style="font-size:18px">${int(ftPort)}</td>
      <td class="ta-r">${rub(ftRevMon)}</td>
      <td class="ta-r">${rub(ftPrfMon)}</td>
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
  S.fixedHintOpen = false;
  S.seasonality = [1,1,1,1,1,1,1,1,1,1,1,1];
  S.seasonalityOpen = false;
  S.suppliers = {};
  S.priceLog  = [];
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
  S.fixedHintOpen = false;
  S.seasonality = [1,1,1,1,1,1,1,1,1,1,1,1];
  S.seasonalityOpen = false;
  S.suppliers = {};
  S.priceLog  = [];
  nextMatKey = 1;
}
function activeLoc() { return Loc.list.find(l => l.id === Loc.activeId); }

function getOrgInfo() {
  const loc = activeLoc() || {};
  return {
    name:      loc.name      || 'Кофейня',
    legalName: loc.legalName || loc.name || 'Кофейня',
    ceoTitle:  loc.ceoTitle  || 'Руководитель',
    ceoName:   loc.ceoName   || '',
    address:   loc.address   || '',
  };
}
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
  const menu = document.getElementById('loc-menu');
  const isOpening = !menu.classList.contains('open');
  if (isOpening && window.innerWidth > 768) {
    const r = document.getElementById('loc-switcher').getBoundingClientRect();
    menu.style.top = (r.bottom + 4) + 'px';
    menu.style.left = r.left + 'px';
    menu.style.right = 'auto';
    menu.style.bottom = 'auto';
  }
  menu.classList.toggle('open');
  document.getElementById('export-menu')?.classList.remove('open');
}
function toggleExportMenu(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('export-menu');
  const isOpening = !menu.classList.contains('open');
  if (isOpening && window.innerWidth > 768) {
    const r = document.getElementById('export-wrap').getBoundingClientRect();
    menu.style.top = (r.bottom + 4) + 'px';
    menu.style.right = (window.innerWidth - r.right) + 'px';
    menu.style.left = 'auto';
    menu.style.bottom = 'auto';
  }
  menu.classList.toggle('open');
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
  document.getElementById('ml-legal-name').value = '';
  document.getElementById('ml-ceo-title').value  = '';
  document.getElementById('ml-ceo-name').value   = '';
  document.getElementById('ml-address').value    = '';
  const sel = document.getElementById('ml-clone');
  sel.innerHTML = '<option value="">— Пустая (с базовым меню) —</option>'
    + Loc.list.map(l => `<option value="${l.id}">${l.icon||'☕'} ${l.name}</option>`).join('');
  document.getElementById('ml-clone-wrap').style.display = '';
  document.getElementById('ml-requisites-wrap').style.display = '';
  document.getElementById('loc-menu')?.classList.remove('open');
  openModal('modal-loc');
  if (window.lucide) lucide.createIcons();
}
function renameActiveLocation() {
  const loc = activeLoc(); if (!loc) return;
  _locModalMode = 'rename'; _locTemplateId = null;
  document.getElementById('modal-loc-title').innerHTML = '<i data-lucide="pencil" class="icon"></i> Переименовать точку';
  document.getElementById('ml-icon').value       = loc.icon       || '☕';
  document.getElementById('ml-name').value       = loc.name;
  document.getElementById('ml-legal-name').value = loc.legalName  || '';
  document.getElementById('ml-ceo-title').value  = loc.ceoTitle   || '';
  document.getElementById('ml-ceo-name').value   = loc.ceoName    || '';
  document.getElementById('ml-address').value    = loc.address    || '';
  document.getElementById('ml-clone-wrap').style.display = 'none';
  document.getElementById('ml-requisites-wrap').style.display = '';
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
    const loc = activeLoc(); if (loc) {
      loc.name      = name;
      loc.icon      = icon;
      loc.legalName = document.getElementById('ml-legal-name').value.trim();
      loc.ceoTitle  = document.getElementById('ml-ceo-title').value.trim();
      loc.ceoName   = document.getElementById('ml-ceo-name').value.trim();
      loc.address   = document.getElementById('ml-address').value.trim();
    }
    saveLocIndex();
    renderLocSwitcherUI();
    _clearModalDirty('modal-loc');
    closeModal('modal-loc');
    return;
  }

  const id = 'loc_' + Date.now() + '_' + Math.random().toString(36).slice(2,7);
  const legalName = document.getElementById('ml-legal-name').value.trim();
  const ceoTitle  = document.getElementById('ml-ceo-title').value.trim();
  const ceoName   = document.getElementById('ml-ceo-name').value.trim();
  const address   = document.getElementById('ml-address').value.trim();
  Loc.list.push({ id, name, icon, legalName, ceoTitle, ceoName, address });
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
  _clearModalDirty('modal-loc');
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
  document.getElementById('ml-requisites-wrap').style.display = '';
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
  const year = new Date().getFullYear();

  // Постоянные расходы (тот же расчёт что в P&L)
  const totRevMon   = sales.totRevMon;
  const _eff1 = getEffectiveCosts(totRevMon);
  const fotInFixed  = _eff1.some(c => /фот|зарплат|зп|оплата.?труда/i.test(c.name));
  const fotAmt      = fotInFixed ? 0 : (typeof payrollTotal === 'function' ? payrollTotal() : 0);
  const varExtra    = _eff1.filter(c=>c.isVariable).reduce((s,c)=>s+c.value,0);
  const fixedOnly   = _eff1.filter(c=>!c.isVariable).reduce((s,c)=>s+c.value,0);
  const totalFixed  = fixedOnly + fotAmt + varExtra;

  // P&L
  const varCostsMon = drinks.reduce((s,d)=>s+(d.cost*(S.portions[d.id]||0)*S.days),0);
  const ebit        = totRevMon - varCostsMon - totalFixed;
  const taxAmt      = (typeof calcTax === 'function') ? calcTax(totRevMon, varCostsMon + varExtra, fixedOnly + fotAmt) : 0;
  const netProfit   = ebit - taxAmt;
  const investment  = S.investment || 0;
  const paybackMon  = investment > 0 && netProfit > 0 ? (investment / netProfit) : null;

  const n = v => Math.round(v).toLocaleString('ru');
  const TAX_LABELS = { none: 'Нет', usn6: 'УСН 6%', usn15: 'УСН 15%' };
  const fcClrPdf = fc => fc <= 0.25 ? '#1a7a1a' : fc <= 0.30 ? '#b87e00' : '#c0392b';
  const fcBgPdf  = fc => fc <= 0.25 ? '#e6f4e6' : fc <= 0.30 ? '#fff8e1' : '#fdecea';
  const netClr   = netProfit >= 0 ? '#1a7a1a' : '#c0392b';
  const netBg    = netProfit >= 0 ? '#e6f4e6' : '#fdecea';

  // ── KPI-карточки ─────────────────────────────────────────────────
  const kpiCards = [
    { label: 'Напитков в меню',      value: drinks.length,                     sub: '' },
    { label: 'Средний чек',          value: n(avgPrice) + ' ₽',                sub: '' },
    { label: 'Прибыль / чашка',      value: n(avgProfit) + ' ₽',               sub: '' },
    { label: 'Средний FC%',          value: (avgFC*100).toFixed(1) + '%',       sub: '', color: fcClrPdf(avgFC), bg: fcBgPdf(avgFC) },
    { label: 'Выручка / день',       value: n(sales.totRevDay) + ' ₽',         sub: '' },
    { label: 'Прибыль / день',       value: n(sales.totPrfDay) + ' ₽',         sub: 'до налогов' },
    { label: 'Выручка / месяц',      value: n(totRevMon) + ' ₽',               sub: '' },
    { label: 'Чистая прибыль / мес', value: n(netProfit) + ' ₽',               sub: '', color: netClr, bg: netBg },
    { label: 'ТБУ (чашек / день)',   value: bep.cupsDay + ' шт.',               sub: '' },
    { label: 'ТБУ (выручка / мес)',  value: n(bep.revBEP) + ' ₽',              sub: 'минимум для покрытия расходов' },
    ...(investment > 0 ? [
      { label: 'Стартовые вложения', value: n(investment) + ' ₽',              sub: '' },
      { label: 'Срок окупаемости',   value: paybackMon ? paybackMon.toFixed(1) + ' мес.' : 'убыток', sub: '', color: paybackMon ? '#1a7a1a' : '#c0392b' },
    ] : []),
  ].map(k => `<div class="kpi-card" style="background:${k.bg||'#f4f8f2'}">
    <div class="kpi-label">${k.label}</div>
    <div class="kpi-value" style="color:${k.color||'#222'}">${k.value}</div>
    ${k.sub ? `<div class="kpi-sub">${k.sub}</div>` : ''}
  </div>`).join('');

  // ── Таблица напитков ─────────────────────────────────────────────
  let lastGroup = null;
  const drinkRows = sortDrinks(drinks).map(d => {
    const gc = fcClrPdf(d.fc); const gb = fcBgPdf(d.fc);
    const abcColors = { A: { c:'#1a7a1a', b:'#e6f4e6' }, B: { c:'#b87e00', b:'#fff8e1' }, C: { c:'#c0392b', b:'#fdecea' } };
    const ac = abcColors[d.abc] || { c:'#555', b:'#f5f5f5' };
    const grp = d.group !== lastGroup ? (lastGroup = d.group, `<tr class="group-sep"><td colspan="7"><span>${GROUP_LABEL[d.group]||d.group}</span></td></tr>`) : '';
    return grp + `<tr>
      <td class="drink-name">${d.name}</td>
      <td class="r">${Math.round(d.price)}</td>
      <td class="r">${Math.round(d.cost)}</td>
      <td class="r fw">${Math.round(d.profit)}</td>
      <td class="c" style="color:${gc};background:${gb};font-weight:700">${(d.fc*100).toFixed(1)}%</td>
      <td class="c" style="color:${ac.c};background:${ac.b};font-weight:800">${d.abc||'—'}</td>
      <td class="r muted">${S.portions[d.id]||0}</td>
    </tr>`;
  }).join('');

  // ── План продаж ───────────────────────────────────────────────────
  const planRows = sortDrinks(drinks).filter(d => (S.portions[d.id]||0) > 0).map(d => {
    const p = S.portions[d.id] || 0;
    return `<tr><td class="drink-name">${d.name}</td><td class="r muted">${Math.round(d.price)}</td><td class="c">${p}</td><td class="r">${n(d.price*p)}</td><td class="r">${n(d.profit*p)}</td><td class="r fw">${n(d.price*p*S.days)}</td><td class="r fw">${n(d.profit*p*S.days)}</td></tr>`;
  }).join('');

  // ── P&L ───────────────────────────────────────────────────────────
  const plItems = [
    { label: 'Выручка от продаж',       val: totRevMon,   bold: false, top: true },
    { label: '− Себестоимость сырья',   val: -varCostsMon, bold: false },
    { label: 'Валовая прибыль',         val: totRevMon - varCostsMon, bold: true },
    ...getEffectiveCosts(totRevMon).map(c => ({ label: `− ${c.name}${c.isVariable?' (перем.)':''}`, val: -c.value })),
    ...(fotAmt > 0 ? [{ label: '− ФОТ (все сотрудники)', val: -fotAmt }] : []),
    { label: 'EBIT (операц. прибыль)', val: ebit, bold: true },
    ...(taxAmt > 0 ? [{ label: `− Налог (${TAX_LABELS[S.taxMode]})`, val: -taxAmt }] : []),
    { label: 'Чистая прибыль',          val: netProfit, bold: true, accent: true },
  ];
  const plRows = plItems.map((r, i) => {
    const isAccent = r.accent;
    const isBold   = r.bold;
    const vClr     = isAccent ? (netProfit >= 0 ? '#1a7a1a' : '#c0392b') : (r.val < 0 ? '#c0392b' : '#222');
    const bg       = isAccent ? (netProfit >= 0 ? '#e6f4e6' : '#fdecea') : (isBold ? '#eef5eb' : (i%2===0?'#fff':'#fafcf9'));
    const fw       = isBold ? '700' : '400';
    const bTop     = r.top ? 'border-top:2px solid #b5d4a8;' : '';
    return `<tr style="background:${bg};${bTop}">
      <td style="padding:5px 8px;font-size:9pt;font-weight:${fw};padding-left:${isBold?'8px':'20px'}">${r.label}</td>
      <td style="padding:5px 8px;text-align:right;font-size:9pt;font-weight:${fw};color:${vClr}">${n(Math.abs(r.val))} ₽</td>
      <td style="padding:5px 8px;text-align:right;font-size:9pt;color:#999">${totRevMon > 0 ? (r.val/totRevMon*100).toFixed(1) + '%' : ''}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Финансовый отчёт — ${locName}</title>
<link href="https://fonts.googleapis.com/css2?family=Mulish:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
* { box-sizing:border-box; margin:0; padding:0; }
body { font-family:'Mulish',Arial,sans-serif; font-size:10pt; color:#222; background:#fff; }
@page { size:A4; margin:12mm 10mm; }

/* Обложка */
.cover { background:#417033; color:#fff; padding:20px 24px 16px; margin-bottom:20px; border-radius:6px; display:flex; justify-content:space-between; align-items:flex-end; }
.cover-left h1 { font-size:16pt; font-weight:800; margin-bottom:4px; }
.cover-left p  { font-size:9.5pt; opacity:.85; }
.cover-right   { text-align:right; font-size:9pt; opacity:.8; line-height:1.8; }

/* Секции */
.section-title { font-size:11pt; font-weight:800; color:#417033; margin:18px 0 8px; padding-bottom:4px; border-bottom:2.5px solid #c5e0b4; display:flex; align-items:center; gap:6px; }
.section-title span { font-size:13pt; }

/* KPI-сетка */
.kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:7px; margin-bottom:16px; }
.kpi-card { border-radius:6px; padding:9px 11px; border:1px solid #dcebd7; }
.kpi-label { font-size:7.5pt; color:#6b7280; font-weight:600; text-transform:uppercase; letter-spacing:.03em; margin-bottom:4px; }
.kpi-value { font-size:13pt; font-weight:800; color:#222; line-height:1.1; }
.kpi-sub   { font-size:7pt; color:#9ca3af; margin-top:2px; }

/* Таблицы */
table { width:100%; border-collapse:collapse; margin-bottom:14px; font-size:8.5pt; }
th { background:#417033; color:#fff; padding:5px 7px; text-align:left; font-weight:700; font-size:8pt; }
th.r, td.r { text-align:right; }
th.c, td.c { text-align:center; }
td { padding:4px 7px; border-bottom:1px solid #e8f0e5; vertical-align:middle; }
tr:nth-child(even) td { background:#fafcf9; }
td.fw  { font-weight:700; }
td.muted { color:#888; }
td.drink-name { max-width:170px; }
.group-sep td { background:#f0f5ee !important; padding:5px 7px; border-bottom:1.5px solid #c8dfc0; }
.group-sep span { font-size:8pt; font-weight:700; color:#417033; text-transform:uppercase; letter-spacing:.05em; }
tfoot tr td { font-weight:700; background:#e7f2e3 !important; border-top:1.5px solid #9ecb8a; }

/* Разрыв */
.pb { page-break-before:always; margin-top:0; }
.hint { font-size:7.5pt; color:#9ca3af; margin:-10px 0 12px; font-style:italic; }

/* Футер */
.mbs-footer { margin-top:24px; padding-top:5px; border-top:1px solid #ddd; text-align:right; font-size:7.5pt; color:#aaa; }

@media print {
  .cover, th, tfoot tr td, .group-sep td { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .kpi-card { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
}
</style></head><body>

<!-- ОБЛОЖКА -->
<div class="cover">
  <div class="cover-left">
    <h1>MBS Coffee Menu</h1>
    <p>Финансовый отчёт &nbsp;·&nbsp; ${locName}</p>
  </div>
  <div class="cover-right">
    <div>${today}</div>
    <div>${S.days} дней в месяце</div>
    <div>${drinks.length} напитков</div>
  </div>
</div>

<!-- KPI -->
<div class="section-title"><span>📊</span> Ключевые показатели</div>
<div class="kpi-grid">${kpiCards}</div>

<!-- РЕЙТИНГ НАПИТКОВ -->
<div class="section-title"><span>☕</span> Рейтинг напитков</div>
<table>
  <thead><tr><th>Напиток</th><th class="r">Цена, ₽</th><th class="r">Себест., ₽</th><th class="r">Прибыль, ₽</th><th class="c">FC%</th><th class="c">ABC</th><th class="r">Порций/д</th></tr></thead>
  <tbody>${drinkRows}</tbody>
</table>

<!-- ПЛАН ПРОДАЖ -->
<div class="section-title pb"><span>📈</span> План продаж <span style="font-size:9pt;font-weight:400;color:#6b7280">(только активные позиции)</span></div>
<p class="hint">${S.days} дней в месяце &nbsp;·&nbsp; показаны только напитки с порциями &gt; 0</p>
<table>
  <thead><tr><th>Напиток</th><th class="r">Цена</th><th class="c">Порц./д</th><th class="r">Выр./день</th><th class="r">Приб./день</th><th class="r">Выр./мес</th><th class="r">Приб./мес</th></tr></thead>
  <tbody>${planRows}</tbody>
  <tfoot><tr><td colspan="3">ИТОГО</td><td class="r">${n(sales.totRevDay)} ₽</td><td class="r">${n(sales.totPrfDay)} ₽</td><td class="r">${n(totRevMon)} ₽</td><td class="r">${n(sales.totPrfMon)} ₽</td></tr></tfoot>
</table>

<!-- P&L -->
<div class="section-title"><span>💰</span> P&amp;L — Отчёт о прибылях и убытках</div>
<p class="hint">Базовый план &nbsp;·&nbsp; Налоговый режим: ${TAX_LABELS[S.taxMode]||S.taxMode}</p>
<table>
  <thead><tr><th>Статья</th><th class="r">Сумма, ₽</th><th class="r">% от выр.</th></tr></thead>
  <tbody>${plRows}</tbody>
</table>
${investment > 0 ? `
<table style="max-width:320px">
  <thead><tr><th colspan="2">Инвестиции и окупаемость</th></tr></thead>
  <tbody>
    <tr><td>Стартовые вложения</td><td class="r fw">${n(investment)} ₽</td></tr>
    <tr><td>Срок окупаемости</td><td class="r fw" style="color:${paybackMon?'#1a7a1a':'#c0392b'}">${paybackMon ? paybackMon.toFixed(1) + ' мес.' : 'убыток'}</td></tr>
  </tbody>
</table>` : ''}

<div class="mbs-footer">Московская школа бариста &nbsp;·&nbsp; baristaschool.ru</div>
</body></html>`;

  _printViaIframe(html, 'mbs-finmodel');
}

async function exportFullXLSX() {
  document.getElementById('export-menu')?.classList.remove('open');
  if (!window.ExcelJS) { alert('Библиотека ExcelJS не загрузилась. Проверьте интернет.'); return; }

  const loc    = activeLoc();
  const drinks = withABC(enrich());
  const sales  = salesMetrics(drinks);
  const { avgPrice, avgProfit, avgFC } = avgMetrics(drinks);
  const bep    = bepCalc(drinks);
  const today  = new Date().toLocaleDateString('ru');
  const todayISO = new Date().toISOString().slice(0, 10);
  const locName  = loc?.name || 'Кофейня';

  // Постоянные расходы / P&L (тот же расчёт что в renderFinModel)
  const totRevMon   = sales.totRevMon;
  const _eff2 = getEffectiveCosts(totRevMon);
  const fotInFixed  = _eff2.some(c => /фот|зарплат|зп|оплата.?труда/i.test(c.name));
  const fotAmt      = fotInFixed ? 0 : (typeof payrollTotal === 'function' ? payrollTotal() : 0);
  const varExtra    = _eff2.filter(c => c.isVariable).reduce((s, c) => s + c.value, 0);
  const fixedOnly   = _eff2.filter(c => !c.isVariable).reduce((s, c) => s + c.value, 0);
  const totalFixed  = fixedOnly + fotAmt + varExtra;
  const varCostsMon = drinks.reduce((s, d) => s + d.cost * (S.portions[d.id] || 0) * S.days, 0);
  const ebit        = totRevMon - varCostsMon - totalFixed;
  const taxAmt      = (typeof calcTax === 'function') ? calcTax(totRevMon, varCostsMon + varExtra, fixedOnly + fotAmt) : 0;
  const netProfit   = ebit - taxAmt;
  const investment  = S.investment || 0;
  const paybackMon  = investment > 0 && netProfit > 0 ? investment / netProfit : null;
  const TAX_LABELS  = { none: 'Нет', usn6: 'УСН 6%', usn15: 'УСН 15%' };

  const wb = new ExcelJS.Workbook();
  wb.creator = 'MBS Coffee Menu';
  wb.created = new Date();

  // ── Палитра ──────────────────────────────────────────────────────
  const C = {
    green:      '417033', greenLight: 'e7f2e3', greenMid: 'c5e0b4',
    greenDark:  '2e5024', white:      'FFFFFF', gray:     'f4f8f2',
    grayBorder: 'd0e4c8', yellow:     'fff8e1', yellowBd: 'ffe082',
    red:        'fdecea', redBd:      'f5c6c6', redText:  'c0392b',
    goodText:   '1a6b1a', warnText:   'b87e00',
    muted:      '9ca3af', dark:       '1e2e1a',
  };
  const fill   = (argb)  => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
  const border = (style = 'thin') => ({ top:{style}, left:{style}, bottom:{style}, right:{style} });
  const borderB = (style = 'thin') => ({ bottom: { style } });
  const font   = (bold = false, sz = 10, color = '222222', italic = false) => ({ name:'Arial', bold, size:sz, color:{ argb:color }, italic });
  const align  = (h = 'left', v = 'middle', wrap = false) => ({ horizontal:h, vertical:v, wrapText:wrap });

  const applyHeader = (row, fg = C.green, fontColor = C.white, sz = 10) => {
    row.eachCell(cell => {
      cell.fill = fill(fg); cell.font = font(true, sz, fontColor);
      cell.alignment = align('center'); cell.border = border();
    });
    row.height = 22;
  };
  const applyDataRow = (row, even = false, boldCols = []) => {
    row.eachCell((cell, c) => {
      cell.fill = fill(even ? C.gray : C.white);
      cell.font = font(boldCols.includes(c), 9);
      cell.border = borderB();
      if (typeof cell.value === 'number') cell.alignment = align('right');
    });
    row.height = 18;
  };
  const applyTotal = (row, fg = C.greenLight) => {
    row.eachCell(cell => {
      cell.fill = fill(fg); cell.font = font(true, 10);
      cell.border = { top:{style:'medium'}, bottom:{style:'medium'} };
      if (typeof cell.value === 'number') cell.alignment = align('right');
    });
    row.height = 20;
  };
  const addSectionTitle = (ws, title, cols) => {
    const r = ws.addRow([title]);
    ws.mergeCells(r.number, 1, r.number, cols);
    r.getCell(1).fill = fill(C.greenDark);
    r.getCell(1).font = font(true, 11, C.white);
    r.getCell(1).alignment = align('left', 'middle');
    r.height = 24;
    return r;
  };

  // ════════════════════════════════════════════════════════════════
  // Лист 1: Дашборд
  // ════════════════════════════════════════════════════════════════
  const wsDash = wb.addWorksheet('Дашборд', { views:[{ state:'frozen', ySplit:3 }] });
  wsDash.columns = [
    { width: 30 }, { width: 18 }, { width: 30 }, { width: 18 },
  ];

  // Заголовок листа
  const titleRow = wsDash.addRow(['MBS Coffee Menu — финансовый отчёт', '', locName, today]);
  wsDash.mergeCells(1, 1, 1, 2);
  titleRow.getCell(1).fill = fill(C.green);
  titleRow.getCell(1).font = font(true, 14, C.white);
  titleRow.getCell(1).alignment = align('left', 'middle');
  titleRow.getCell(3).fill = fill(C.green);
  titleRow.getCell(3).font = font(false, 11, C.greenLight);
  titleRow.getCell(3).alignment = align('right', 'middle');
  titleRow.getCell(4).fill = fill(C.green);
  titleRow.getCell(4).font = font(false, 11, C.greenLight);
  titleRow.getCell(4).alignment = align('right', 'middle');
  titleRow.height = 32;

  wsDash.addRow([]); // spacer

  // KPI-блок
  addSectionTitle(wsDash, '  Ключевые показатели', 4);
  const kpiData = [
    ['Напитков в меню', drinks.length,                'Выручка / мес',       Math.round(totRevMon)],
    ['Средний чек, ₽',  Math.round(avgPrice),         'Прибыль / мес, ₽',   Math.round(sales.totPrfMon)],
    ['Прибыль/чашка, ₽',Math.round(avgProfit),        'Чистая прибыль, ₽',  Math.round(netProfit)],
    ['Средний FC%',      +(avgFC*100).toFixed(1)+'%', 'EBIT, ₽',            Math.round(ebit)],
    ['Выручка / день, ₽',Math.round(sales.totRevDay), 'ТБУ (чашек/день)',   bep.cupsDay],
    ['Прибыль / день, ₽',Math.round(sales.totPrfDay), 'ТБУ (выручка/мес)', Math.round(bep.revBEP)],
    ...(investment > 0 ? [['Инвестиции, ₽', investment, 'Окупаемость', paybackMon ? +paybackMon.toFixed(1) : 'убыток']] : []),
  ];
  kpiData.forEach((r, i) => {
    const row = wsDash.addRow(r);
    const even = i % 2 === 0;
    const bg = even ? C.greenLight : C.white;
    [1,3].forEach(c => { row.getCell(c).fill = fill(bg); row.getCell(c).font = font(true, 9, C.greenDark); row.getCell(c).border = borderB(); });
    [2,4].forEach(c => {
      row.getCell(c).fill = fill(even ? C.gray : C.white);
      row.getCell(c).font = font(false, 10);
      row.getCell(c).alignment = align('right');
      row.getCell(c).border = borderB();
    });
    row.height = 19;
  });

  wsDash.addRow([]); // spacer

  // Таблица напитков
  addSectionTitle(wsDash, '  Рейтинг напитков по прибыли', 4);
  const drinkHeaderRow = wsDash.addRow(['Напиток','Цена, ₽','Себест., ₽','Прибыль, ₽','FC%','ABC','Порций/день','Выручка/мес, ₽']);
  wsDash.columns = [
    { width:32 }, { width:12 }, { width:12 }, { width:14 },
    { width:9  }, { width:7  }, { width:13 }, { width:16 },
  ];
  applyHeader(drinkHeaderRow);
  sortDrinks(drinks).forEach((d, i) => {
    const p = S.portions[d.id] || 0;
    const row = wsDash.addRow([d.name, Math.round(d.price), Math.round(d.cost), Math.round(d.profit), +(d.fc*100).toFixed(1), d.abc, p, Math.round(d.price*p*S.days)]);
    applyDataRow(row, i%2===1, [4]);
    // FC% цветной
    const fcCell = row.getCell(5);
    if (d.fc <= 0.25)      { fcCell.fill = fill('e6f4e6'); fcCell.font = font(true, 9, C.goodText); }
    else if (d.fc <= 0.30) { fcCell.fill = fill(C.yellow); fcCell.font = font(true, 9, C.warnText); }
    else                   { fcCell.fill = fill(C.red);    fcCell.font = font(true, 9, C.redText);  }
    fcCell.numFmt = '0.0"%"'; fcCell.value = +(d.fc*100).toFixed(1);
    // ABC цветной
    const abcCell = row.getCell(6);
    if (d.abc==='A')      { abcCell.fill = fill('e6f4e6'); abcCell.font = font(true, 9, C.goodText); }
    else if (d.abc==='B') { abcCell.fill = fill(C.yellow); abcCell.font = font(true, 9, C.warnText); }
    else                  { abcCell.fill = fill(C.red);    abcCell.font = font(true, 9, C.redText);  }
    abcCell.alignment = align('center');
    // Числа вправо
    [2,3,4,5,7,8].forEach(c => { row.getCell(c).alignment = align('right'); row.getCell(c).numFmt = '#,##0'; });
    row.getCell(5).numFmt = '0.0';
  });
  // Итого
  const dashTotalRow = wsDash.addRow(['ИТОГО', '', '', '', '', '', drinks.reduce((s,d)=>s+(S.portions[d.id]||0),0), Math.round(totRevMon)]);
  applyTotal(dashTotalRow);
  [7,8].forEach(c => { dashTotalRow.getCell(c).alignment = align('right'); dashTotalRow.getCell(c).numFmt = '#,##0'; });

  // ════════════════════════════════════════════════════════════════
  // Лист 2: План продаж
  // ════════════════════════════════════════════════════════════════
  const wsSales = wb.addWorksheet('План продаж', { views:[{ state:'frozen', ySplit:1 }] });
  wsSales.columns = [
    {width:32},{width:11},{width:11},{width:13},{width:13},{width:13},{width:14},{width:15},{width:15},
  ];
  const salesHdr = wsSales.addRow(['Напиток','Цена, ₽','Себест., ₽','Прибыль, ₽','FC%','Порц./день','Выр./день, ₽','Приб./день, ₽','Выр./мес, ₽']);
  applyHeader(salesHdr);
  sortDrinks(drinks).forEach((d, i) => {
    const p = S.portions[d.id] || 0;
    const row = wsSales.addRow([d.name, Math.round(d.price), Math.round(d.cost), Math.round(d.profit), +(d.fc*100).toFixed(1), p, Math.round(d.price*p), Math.round(d.profit*p), Math.round(d.price*p*S.days)]);
    applyDataRow(row, i%2===1, [4]);
    [2,3,4,6,7,8,9].forEach(c => { row.getCell(c).alignment = align('right'); row.getCell(c).numFmt = '#,##0'; });
    row.getCell(5).alignment = align('right'); row.getCell(5).numFmt = '0.0';
    const fcCell = row.getCell(5);
    if (d.fc <= 0.25)      { fcCell.fill = fill('e6f4e6'); fcCell.font = font(false, 9, C.goodText); }
    else if (d.fc <= 0.30) { fcCell.fill = fill(C.yellow); fcCell.font = font(false, 9, C.warnText); }
    else                   { fcCell.fill = fill(C.red);    fcCell.font = font(false, 9, C.redText);  }
  });
  const salesTotRow = wsSales.addRow(['ИТОГО','','','','', drinks.reduce((s,d)=>s+(S.portions[d.id]||0),0), Math.round(sales.totRevDay), Math.round(sales.totPrfDay), Math.round(totRevMon)]);
  applyTotal(salesTotRow);
  [6,7,8,9].forEach(c => { salesTotRow.getCell(c).alignment = align('right'); salesTotRow.getCell(c).numFmt = '#,##0'; });

  // ════════════════════════════════════════════════════════════════
  // Лист 3: P&L
  // ════════════════════════════════════════════════════════════════
  const wsFinance = wb.addWorksheet('P&L — Финансы');
  wsFinance.columns = [ {width:40}, {width:18}, {width:14} ];

  addSectionTitle(wsFinance, '  P&L — Отчёт о прибылях и убытках', 3);
  const plHeader = wsFinance.addRow(['Статья', 'Сумма / мес, ₽', '% от выручки']);
  applyHeader(plHeader);

  const plItems = [
    { label: 'Выручка от продаж',          val: totRevMon,           bold: true },
    { label: '  − Себестоимость сырья',     val: -varCostsMon,        bold: false },
    { label: 'Валовая прибыль',             val: totRevMon-varCostsMon, bold: true, sep: true },
    ...getEffectiveCosts(totRevMon).map(c => ({ label: `  − ${c.name}${c.isVariable?' (перем.)':''}`, val: -c.value })),
    ...(fotAmt > 0 ? [{ label: '  − ФОТ', val: -fotAmt }] : []),
    { label: 'EBIT (операц. прибыль)',      val: ebit,                bold: true, sep: true },
    ...(taxAmt > 0 ? [{ label: `  − Налог (${TAX_LABELS[S.taxMode]})`, val: -taxAmt }] : []),
    { label: 'ЧИСТАЯ ПРИБЫЛЬ',             val: netProfit,           bold: true, accent: true },
  ];

  plItems.forEach((item, i) => {
    const pct = totRevMon > 0 ? +(item.val/totRevMon*100).toFixed(1) : 0;
    const row = wsFinance.addRow([item.label, Math.round(Math.abs(item.val)), pct]);
    row.height = item.bold ? 20 : 17;
    const isAccent = item.accent;
    if (isAccent) {
      const bg = netProfit >= 0 ? 'e6f4e6' : C.red;
      const tc = netProfit >= 0 ? C.goodText : C.redText;
      row.eachCell(cell => { cell.fill = fill(bg); cell.font = font(true, 11, tc); cell.border = { top:{style:'medium'}, bottom:{style:'double'} }; });
    } else if (item.bold) {
      row.eachCell(cell => { cell.fill = fill(C.greenLight); cell.font = font(true, 10); if (item.sep) cell.border = { top:{style:'thin', color:{argb:C.greenMid}} }; });
    } else {
      row.eachCell((cell, c) => { cell.fill = fill(i%2===0 ? C.white : C.gray); cell.font = font(false, 9); });
    }
    row.getCell(1).alignment = align('left', 'middle');
    row.getCell(2).alignment = align('right');
    row.getCell(2).numFmt = '#,##0';
    row.getCell(3).alignment = align('right');
    row.getCell(3).numFmt = '0.0';
    if (item.val < 0 && !item.bold) row.getCell(2).font = { ...row.getCell(2).font, color: { argb: C.redText } };
  });

  wsFinance.addRow([]);
  addSectionTitle(wsFinance, '  Параметры', 3);
  const params = [
    ['Дней в месяце', S.days, ''],
    ['Целевой FC%', +(S.targetFC*100).toFixed(1), '%'],
    ['Налоговый режим', TAX_LABELS[S.taxMode] || S.taxMode, ''],
    ...(investment > 0 ? [['Инвестиции, ₽', investment, ''], ['Срок окупаемости, мес', paybackMon ? +paybackMon.toFixed(1) : '—', '']] : []),
  ];
  params.forEach((r, i) => {
    const row = wsFinance.addRow(r);
    row.getCell(1).fill = fill(i%2===0 ? C.greenLight : C.white); row.getCell(1).font = font(true, 9);
    row.getCell(2).fill = fill(i%2===0 ? C.gray : C.white); row.getCell(2).font = font(false, 10); row.getCell(2).alignment = align('right');
    row.getCell(2).numFmt = '#,##0'; row.height = 18;
  });

  // ════════════════════════════════════════════════════════════════
  // Лист 4: Себестоимость
  // ════════════════════════════════════════════════════════════════
  const wsCost = wb.addWorksheet('Себестоимость', { views:[{ state:'frozen', ySplit:1 }] });
  wsCost.columns = [ {width:32},{width:10},{width:11},{width:11},{width:12},{width:12},{width:12} ];
  const costHdr = wsCost.addRow(['Напиток','Группа','Объём, мл','Цена, ₽','Себест., ₽','Прибыль, ₽','FC%']);
  applyHeader(costHdr);
  const sortedForCost = [...drinks].sort((a,b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name,'ru'));
  let lastGrp = null;
  sortedForCost.forEach((d, i) => {
    if (d.group !== lastGrp) {
      lastGrp = d.group;
      const grpRow = wsCost.addRow([GROUP_LABEL[d.group]||d.group]);
      wsCost.mergeCells(grpRow.number, 1, grpRow.number, 7);
      grpRow.getCell(1).fill = fill(C.greenMid); grpRow.getCell(1).font = font(true, 9, C.greenDark);
      grpRow.height = 16;
    }
    const row = wsCost.addRow([d.name, d.group, d.vol, Math.round(d.price), Math.round(d.cost), Math.round(d.profit), +(d.fc*100).toFixed(1)]);
    applyDataRow(row, i%2===1);
    [4,5,6].forEach(c => { row.getCell(c).alignment = align('right'); row.getCell(c).numFmt = '#,##0'; });
    row.getCell(3).alignment = align('right');
    row.getCell(7).alignment = align('right');
    row.getCell(7).numFmt = '0.0';
    const fcCell = row.getCell(7);
    if (d.fc <= 0.25)      { fcCell.fill = fill('e6f4e6'); fcCell.font = font(false, 9, C.goodText); }
    else if (d.fc <= 0.30) { fcCell.fill = fill(C.yellow); fcCell.font = font(false, 9, C.warnText); }
    else                   { fcCell.fill = fill(C.red);    fcCell.font = font(false, 9, C.redText);  }
  });

  // ════════════════════════════════════════════════════════════════
  // Сохранить
  // ════════════════════════════════════════════════════════════════
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url  = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `mbs-${locName.replace(/\s+/g,'_')}-${todayISO}.xlsx`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

// ════════════════════════════════════════════════════════════════════
//  EXPORT — Поставщики (PDF + XLSX)
// ════════════════════════════════════════════════════════════════════

function exportSuppliersPDF() {
  const book   = S.supplierBook || [];
  const sups   = S.suppliers   || {};
  const today  = new Date().toLocaleDateString('ru');
  const loc    = activeLoc();
  const locName = loc?.name || 'Кофейня';

  // Собираем поставщиков с привязанными ингредиентами
  const byName = {};
  Object.entries(sups).forEach(([key, v]) => {
    if (!v || !v.name) return;
    if (!byName[v.name]) byName[v.name] = { ...v, mats: [] };
    if (MAT[key]) byName[v.name].mats.push(MAT[key].name);
  });
  book.forEach(b => {
    if (!byName[b.name]) byName[b.name] = { name: b.name, phone: b.phone||'', note: b.note||'', site: b.site||'', mats: [] };
    else {
      if (!byName[b.name].phone && b.phone) byName[b.name].phone = b.phone;
      if (!byName[b.name].note  && b.note)  byName[b.name].note  = b.note;
      if (!byName[b.name].site  && b.site)  byName[b.name].site  = b.site;
    }
  });
  const list = Object.values(byName);

  const rows = list.map((s, i) => `
    <tr>
      <td class="num">${i+1}</td>
      <td class="bold">${s.name}</td>
      <td>${s.phone || '—'}</td>
      <td>${s.note  || '—'}</td>
      <td>${s.site  ? `<span style="color:#417033">${s.site.replace(/^https?:\/\//,'')}</span>` : '—'}</td>
      <td>${s.mats.length ? s.mats.join(', ') : '—'}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Поставщики — ${locName}</title>
<link href="https://fonts.googleapis.com/css2?family=Mulish:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Mulish',Arial,sans-serif;font-size:10pt;color:#222;background:#fff}
@page{size:A4 landscape;margin:10mm}
.cover{background:#417033;color:#fff;padding:16px 20px;margin-bottom:16px;border-radius:6px;display:flex;justify-content:space-between;align-items:flex-end}
.cover h1{font-size:15pt;font-weight:800}
.cover p{font-size:9pt;opacity:.85;margin-top:3px}
.cover-right{text-align:right;font-size:9pt;opacity:.8}
table{width:100%;border-collapse:collapse;font-size:9pt}
th{background:#417033;color:#fff;padding:6px 8px;text-align:left;font-weight:700}
td{padding:5px 8px;border-bottom:1px solid #e4ede0;vertical-align:top}
tr:nth-child(even) td{background:#fafcf9}
td.num{color:#999;width:28px;text-align:center}
td.bold{font-weight:700}
.footer{margin-top:16px;text-align:right;font-size:8pt;color:#aaa;border-top:1px solid #ddd;padding-top:4px}
@media print{.cover,th{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="cover">
  <div><h1>Список поставщиков</h1><p>${locName} &nbsp;·&nbsp; ${today}</p></div>
  <div class="cover-right">${list.length} поставщиков</div>
</div>
<table>
  <thead><tr><th>#</th><th>Название</th><th>Телефон / email</th><th>Заметка</th><th>Сайт</th><th>Ингредиенты</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="footer">Московская школа бариста &nbsp;·&nbsp; baristaschool.ru</div>
</body></html>`;

  _printViaIframe(html, 'mbs-suppliers');
}

async function exportSuppliersXLSX() {
  if (!window.ExcelJS) { alert('Библиотека ExcelJS не загрузилась.'); return; }
  const book   = S.supplierBook || [];
  const sups   = S.suppliers   || {};
  const loc    = activeLoc();
  const locName = loc?.name || 'Кофейня';
  const todayISO = new Date().toISOString().slice(0,10);

  const byName = {};
  Object.entries(sups).forEach(([key, v]) => {
    if (!v || !v.name) return;
    if (!byName[v.name]) byName[v.name] = { ...v, mats: [] };
    if (MAT[key]) byName[v.name].mats.push(MAT[key].name);
  });
  book.forEach(b => {
    if (!byName[b.name]) byName[b.name] = { name: b.name, phone: b.phone||'', note: b.note||'', site: b.site||'', mats: [] };
    else {
      if (!byName[b.name].phone && b.phone) byName[b.name].phone = b.phone;
      if (!byName[b.name].note  && b.note)  byName[b.name].note  = b.note;
      if (!byName[b.name].site  && b.site)  byName[b.name].site  = b.site;
    }
  });
  const list = Object.values(byName);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'MBS Coffee Menu';
  const ws = wb.addWorksheet('Поставщики');
  ws.columns = [
    { header: '№',            key: 'n',     width: 5  },
    { header: 'Название',     key: 'name',  width: 28 },
    { header: 'Телефон',      key: 'phone', width: 20 },
    { header: 'Заметка',      key: 'note',  width: 36 },
    { header: 'Сайт',         key: 'site',  width: 30 },
    { header: 'Ингредиенты',  key: 'mats',  width: 42 },
  ];
  // Заголовок
  const hRow = ws.getRow(1);
  hRow.eachCell(cell => {
    cell.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:'417033' } };
    cell.font = { name:'Arial', bold:true, size:10, color:{ argb:'FFFFFF' } };
    cell.alignment = { vertical:'middle', horizontal:'center' };
  });
  hRow.height = 20;
  list.forEach((s, i) => {
    const r = ws.addRow({ n: i+1, name: s.name, phone: s.phone||'', note: s.note||'', site: s.site||'', mats: s.mats.join(', ') });
    r.height = 18;
    r.eachCell(cell => {
      cell.border = { bottom: { style:'thin', color:{ argb:'d0e4c8' } } };
      cell.alignment = { vertical:'middle', wrapText:true };
    });
    if (i % 2 === 1) r.eachCell(c => { c.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:'f4f8f2' } }; });
  });
  const buf  = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url  = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `mbs-suppliers-${locName.replace(/\s+/g,'_')}-${todayISO}.xlsx`;
  a.click(); setTimeout(() => URL.revokeObjectURL(url), 3000);
}

// ════════════════════════════════════════════════════════════════════
//  EXPORT — Ингредиенты + Полуфабрикаты (PDF + XLSX)
// ════════════════════════════════════════════════════════════════════

function exportMaterialsPDF() {
  const today   = new Date().toLocaleDateString('ru');
  const loc     = activeLoc();
  const locName = loc?.name || 'Кофейня';
  const sups    = S.suppliers || {};

  // Ингредиенты по категориям
  const catOrder = Object.keys(MAT_CATEGORIES).sort((a,b) => (MAT_CATEGORIES[a].order||99)-(MAT_CATEGORIES[b].order||99));
  let matRows = '';
  let globalN = 0;
  catOrder.forEach(cat => {
    const items = Object.entries(MAT).filter(([,m]) => (m.category||'other') === cat);
    if (!items.length) return;
    const catLabel = (MAT_CATEGORIES[cat]||{label:cat}).label;
    matRows += `<tr class="cat-row"><td colspan="7">${catLabel}</td></tr>`;
    items.forEach(([key, m]) => {
      globalN++;
      const sup = sups[key];
      matRows += `<tr>
        <td class="num">${globalN}</td>
        <td class="bold">${m.name}</td>
        <td class="c">${m.unit}</td>
        <td class="r">${m.size ? m.size : '—'}</td>
        <td class="r">${m.price ? Math.round(m.price)+' ₽' : '—'}</td>
        <td>${sup ? sup.name : '—'}</td>
      </tr>`;
    });
  });

  // Полуфабрикаты
  let semiRows = SEMI.map((s, i) => {
    const cost = (s.recipe||[]).reduce((sum, r) => {
      if (r.mat && MAT[r.mat]) {
        const pricePerUnit = MAT[r.mat].price / (MAT[r.mat].size || 1);
        const amt = r.amt * (1 + (r.loss||0)/100);
        return sum + pricePerUnit * amt;
      }
      return sum;
    }, 0);
    const costPer = s.yield ? cost / s.yield : 0;
    return `<tr>
      <td class="num">${i+1}</td>
      <td class="bold">${s.name}</td>
      <td class="c">${s.unit||'г'}</td>
      <td class="r">${s.yield||'—'}</td>
      <td class="r">${costPer ? costPer.toFixed(2)+' ₽/'+s.unit : '—'}</td>
      <td>${(s.recipe||[]).map(r => r.mat && MAT[r.mat] ? MAT[r.mat].name : '—').join(', ')}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Ингредиенты — ${locName}</title>
<link href="https://fonts.googleapis.com/css2?family=Mulish:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Mulish',Arial,sans-serif;font-size:9.5pt;color:#222;background:#fff}
@page{size:A4 landscape;margin:10mm}
.cover{background:#417033;color:#fff;padding:14px 20px;margin-bottom:14px;border-radius:6px;display:flex;justify-content:space-between;align-items:flex-end}
.cover h1{font-size:14pt;font-weight:800}.cover p{font-size:9pt;opacity:.85;margin-top:3px}
.cover-right{text-align:right;font-size:9pt;opacity:.8}
.sec-title{font-size:11pt;font-weight:800;color:#417033;margin:14px 0 6px;padding-bottom:3px;border-bottom:2px solid #c5e0b4}
table{width:100%;border-collapse:collapse;font-size:8.5pt;margin-bottom:10px}
th{background:#417033;color:#fff;padding:5px 7px;text-align:left;font-weight:700}
th.r,td.r{text-align:right}th.c,td.c{text-align:center}
td{padding:4px 7px;border-bottom:1px solid #e4ede0;vertical-align:middle}
tr:nth-child(even) td{background:#fafcf9}
td.num{color:#999;width:26px;text-align:center}
td.bold{font-weight:700}
.cat-row td{background:#eef5eb!important;font-weight:700;font-size:8pt;color:#417033;text-transform:uppercase;letter-spacing:.04em;padding:4px 7px}
.footer{margin-top:14px;text-align:right;font-size:8pt;color:#aaa;border-top:1px solid #ddd;padding-top:4px}
@media print{.cover,th,.cat-row td{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="cover">
  <div><h1>Ингредиенты и полуфабрикаты</h1><p>${locName} &nbsp;·&nbsp; ${today}</p></div>
  <div class="cover-right">${Object.keys(MAT).length} ингредиентов &nbsp;·&nbsp; ${SEMI.length} полуфабрикатов</div>
</div>
<div class="sec-title">☕ Ингредиенты</div>
<table>
  <thead><tr><th>#</th><th>Название</th><th class="c">Ед.</th><th class="r">Объём ед.</th><th class="r">Цена ед.</th><th>Поставщик</th></tr></thead>
  <tbody>${matRows}</tbody>
</table>
${SEMI.length ? `
<div class="sec-title" style="page-break-before:auto">🥣 Полуфабрикаты</div>
<table>
  <thead><tr><th>#</th><th>Название</th><th class="c">Ед.</th><th class="r">Выход</th><th class="r">Себест./ед.</th><th>Состав</th></tr></thead>
  <tbody>${semiRows}</tbody>
</table>` : ''}
<div class="footer">Московская школа бариста &nbsp;·&nbsp; baristaschool.ru</div>
</body></html>`;

  _printViaIframe(html, 'mbs-materials');
}

async function exportMaterialsXLSX() {
  if (!window.ExcelJS) { alert('Библиотека ExcelJS не загрузилась.'); return; }
  const loc      = activeLoc();
  const locName  = loc?.name || 'Кофейня';
  const todayISO = new Date().toISOString().slice(0,10);
  const sups     = S.suppliers || {};

  const wb = new ExcelJS.Workbook();
  wb.creator = 'MBS Coffee Menu';

  // ── Лист 1: Ингредиенты ─────────────────────────────────────────
  const ws1 = wb.addWorksheet('Ингредиенты');
  ws1.columns = [
    { header:'№',           key:'n',       width:5  },
    { header:'Категория',   key:'cat',     width:18 },
    { header:'Название',    key:'name',    width:28 },
    { header:'Ед.',         key:'unit',    width:8  },
    { header:'Объём ед.',   key:'size',    width:12 },
    { header:'Цена ед., ₽', key:'price',   width:14 },
    { header:'Поставщик',   key:'sup',     width:24 },
  ];
  const fillG  = argb => ({ type:'pattern', pattern:'solid', fgColor:{ argb } });
  const fnt    = (bold, sz=10, color='222222') => ({ name:'Arial', bold, size:sz, color:{ argb:color } });
  const hRow1  = ws1.getRow(1);
  hRow1.eachCell(c => { c.fill=fillG('417033'); c.font=fnt(true,10,'FFFFFF'); c.alignment={vertical:'middle',horizontal:'center'}; });
  hRow1.height = 20;

  const catOrder = Object.keys(MAT_CATEGORIES).sort((a,b)=>(MAT_CATEGORIES[a].order||99)-(MAT_CATEGORIES[b].order||99));
  let globalN = 0;
  catOrder.forEach(cat => {
    const items = Object.entries(MAT).filter(([,m]) => (m.category||'other') === cat);
    if (!items.length) return;
    const catLabel = (MAT_CATEGORIES[cat]||{label:cat}).label;
    // Строка-заголовок категории
    const cr = ws1.addRow({ n:'', cat: catLabel.toUpperCase(), name:'', unit:'', size:'', price:'', ppu:'', sup:'' });
    cr.eachCell(c => { c.fill=fillG('eef5eb'); c.font=fnt(true,9,'417033'); });
    cr.height = 16;
    ws1.mergeCells(cr.number, 2, cr.number, 8);

    items.forEach(([key, m]) => {
      globalN++;
      const sup  = sups[key];
      const r    = ws1.addRow({ n:globalN, cat:'', name:m.name, unit:m.unit, size:m.size||'', price:m.price||'', sup:sup?sup.name:'' });
      r.height   = 17;
      r.eachCell(c => { c.border={ bottom:{style:'thin',color:{argb:'d0e4c8'}} }; c.alignment={vertical:'middle'}; });
      if (globalN%2===0) r.eachCell(c=>{ c.fill=fillG('f4f8f2'); });
      // Числа — формат
      r.getCell('price').numFmt = '#,##0.00';
      r.getCell('n').alignment  = { horizontal:'center', vertical:'middle' };
      r.getCell('unit').alignment = { horizontal:'center', vertical:'middle' };
    });
  });

  // ── Лист 2: Полуфабрикаты ────────────────────────────────────────
  if (SEMI.length) {
    const ws2 = wb.addWorksheet('Полуфабрикаты');
    ws2.columns = [
      { header:'№',            key:'n',    width:5  },
      { header:'Название',     key:'name', width:28 },
      { header:'Ед.',          key:'unit', width:8  },
      { header:'Выход',        key:'yld',  width:10 },
      { header:'Себест./ед.',  key:'cost', width:14 },
      { header:'Состав',       key:'comp', width:48 },
    ];
    const hRow2 = ws2.getRow(1);
    hRow2.eachCell(c => { c.fill=fillG('417033'); c.font=fnt(true,10,'FFFFFF'); c.alignment={vertical:'middle',horizontal:'center'}; });
    hRow2.height = 20;
    SEMI.forEach((s, i) => {
      const cost = (s.recipe||[]).reduce((sum, r) => {
        if (r.mat && MAT[r.mat]) {
          const ppu = MAT[r.mat].price / (MAT[r.mat].size||1);
          return sum + ppu * r.amt * (1+(r.loss||0)/100);
        }
        return sum;
      }, 0);
      const costPer = s.yield ? +(cost/s.yield).toFixed(2) : '';
      const comp    = (s.recipe||[]).map(r => r.mat&&MAT[r.mat]?MAT[r.mat].name:'?').join(', ');
      const r = ws2.addRow({ n:i+1, name:s.name, unit:s.unit||'г', yld:s.yield||'', cost:costPer, comp });
      r.height=17;
      r.eachCell(c=>{ c.border={bottom:{style:'thin',color:{argb:'d0e4c8'}}}; c.alignment={vertical:'middle',wrapText:true}; });
      if (i%2===1) r.eachCell(c=>{ c.fill=fillG('f4f8f2'); });
      r.getCell('cost').numFmt='#,##0.00';
      r.getCell('n').alignment={horizontal:'center',vertical:'middle'};
    });
  }

  const buf  = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href=url;
  a.download = `mbs-materials-${locName.replace(/\s+/g,'_')}-${todayISO}.xlsx`;
  a.click(); setTimeout(()=>URL.revokeObjectURL(url),3000);
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
      fixedHintOpen: S.fixedHintOpen,
      seasonality: S.seasonality, seasonalityOpen: S.seasonalityOpen,
      wif: { price: _wif.price, cost: _wif.cost, traffic: _wif.traffic },
      suppliers: S.suppliers, supplierBook: S.supplierBook, priceLog: S.priceLog,
      customDrinks: DRINKS.filter(d => d.custom),
      modifiedDrinks: DRINKS.filter(d => d.modified).map(d => ({id:d.id,name:d.name,group:d.group,vol:d.vol,recipe:d.recipe})),
      drinkPatches: DRINKS.reduce((acc, d) => {
        const patch = {};
        if (d.image)    patch.image    = d.image;
        if (d.process)  patch.process  = d.process;
        if (d.videoUrl) patch.videoUrl = d.videoUrl;
        if (Object.keys(patch).length) acc[d.id] = patch;
        return acc;
      }, {}),
      customMats: Object.entries(MAT).filter(([,v])=>v.custom).map(([k,v])=>({key:k,...v})),
      semiItems: SEMI,
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
    if (sv.fixedCosts) {
      S.fixedCosts = sv.fixedCosts;
      // Миграция: добавляем category/id если нет
      S.fixedCosts.forEach((c, i) => {
        if (!c.id) c.id = 1000 + i;
        if (!c.category) c.category = 'other';
      });
    }
    if (sv.taxMode)          S.taxMode = sv.taxMode;
    if (sv.investment != null) S.investment = sv.investment;
    if (sv.payroll && !sv.payrollPositions) {
      // Миграция со старого формата
      S.payrollPositions = [{ id:1, name:'Бариста', rate: sv.payroll.rate||250, hours: sv.payroll.hours||12, shifts: sv.payroll.shifts||30, count: sv.payroll.count||2 }];
    }
    if (sv.payrollPositions) S.payrollPositions = sv.payrollPositions;
    if (sv.payrollSettings)  Object.assign(S.payrollSettings, sv.payrollSettings);
    if (sv.payrollSettingsOpen != null) S.payrollSettingsOpen = sv.payrollSettingsOpen;
    if (sv.fixedHintOpen != null) S.fixedHintOpen = sv.fixedHintOpen;
    if (sv.seasonality) S.seasonality = sv.seasonality;
    if (sv.seasonalityOpen != null) S.seasonalityOpen = sv.seasonalityOpen;
    if (sv.wif) { _wif.price = sv.wif.price||0; _wif.cost = sv.wif.cost||0; _wif.traffic = sv.wif.traffic||0; }
    if (sv.suppliers && Object.keys(sv.suppliers).length > 0) S.suppliers = sv.suppliers;
    if (sv.supplierBook && sv.supplierBook.length > 0) S.supplierBook = sv.supplierBook;
    // Миграция: добавляем системных поставщиков если их ещё нет в книге
    const _sysSuppliers = [
      { id:6, name: 'Вкусов Лаб', phone: '+7 965 342-88-99', note: 'Аутентичные пряности, перец, соль и сахар премиального качества со всего мира.', site: 'https://vkusovlab.ru' },
      { id:7, name: 'Planto', phone: '+7 800 100-02-01', note: 'Напитки на растительной основе для бариста', site: 'https://logikamoloka.ru/beverages/' },
    ];
    _sysSuppliers.forEach(sys => {
      if (!S.supplierBook.find(b => b.name === sys.name)) {
        const maxId = S.supplierBook.reduce((m, b) => Math.max(m, b.id||0), 0);
        S.supplierBook.push({ ...sys, id: Math.max(sys.id, maxId + 1) });
      }
    });
    // Миграция: обновляем телефоны существующих поставщиков
    const _phoneUpdates = {
      'Вкусов Лаб': '+7 965 342-88-99',
      'Planto':      '+7 800 100-02-01',
    };
    S.supplierBook.forEach(b => {
      if (_phoneUpdates[b.name]) b.phone = _phoneUpdates[b.name];
    });
    const _noteUpdates = {
      'Rockets.coffee': 'Зерно для эспрессо, фильтр-кофе, чай, матча и др.',
      'Rocket Tonic':   'Безалкогольные тоники разных вкусов',
      'Unicava':        'Bean to Bar шоколад и какао на максималках',
      'Петмол':         'Молоко и сливки для бариста',
    };
    S.supplierBook.forEach(b => {
      if (_noteUpdates[b.name]) b.note = _noteUpdates[b.name];
    });
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
    if (sv.drinkPatches) {
      Object.entries(sv.drinkPatches).forEach(([idStr, patch]) => {
        const idx = DRINKS.findIndex(x => x.id === Number(idStr));
        if (idx >= 0) DRINKS[idx] = {...DRINKS[idx], ...patch};
      });
    }
    if (sv.semiItems && sv.semiItems.length > 0) {
      SEMI = sv.semiItems;
      nextSemiId = Math.max(...SEMI.map(s => s.id), 0) + 1;
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
function openModal(id)  {
  const el = document.getElementById(id);
  el.classList.add('open');
  // Сброс скролла модалки в начало
  const modalEl = el.querySelector('.modal');
  if (modalEl) modalEl.scrollTop = 0;
  if (id === 'modal-mat') { _fillMatSupBookSelect(); lucide.createIcons(); }
  // Блокируем скролл фона без position:fixed (иначе iOS Safari сдвигает координаты тачей)
  if (!document.documentElement.classList.contains('modal-open')) {
    document.documentElement.dataset.scrollY = window.scrollY;
    document.documentElement.classList.add('modal-open');
  }
}
function closeModal(id) {
  // Защита: если есть несохранённые изменения — показать предупреждение вместо закрытия
  if (_isModalDirty && _isModalDirty(id)) {
    _showUnsavedWarning(id);
    return;
  }
  document.getElementById(id).classList.remove('open');
  // Разблокируем фон только если больше нет открытых модалов
  if (!document.querySelector('.modal-bg.open')) {
    const scrollY = parseInt(document.documentElement.dataset.scrollY || '0');
    document.documentElement.classList.remove('modal-open');
    window.scrollTo(0, scrollY);
  }
  _clearModalDirty(id);
}

// ─── Защита от потери данных при случайном закрытии модала ──────────
const _EDITABLE_MODALS = new Set([
  'modal-drink','modal-semi','modal-mat',
  'modal-supplier','modal-supplier-book','modal-loc'
]);
const _dirtyModalSet = new Set();
function _markModalDirty(id)  { if (_EDITABLE_MODALS.has(id)) _dirtyModalSet.add(id); }
function _clearModalDirty(id) { _dirtyModalSet.delete(id); }
function _isModalDirty(id)    { return _dirtyModalSet.has(id); }

function safeCloseModal(id) {
  if (_isModalDirty(id)) {
    _showUnsavedWarning(id);
    return;
  }
  // Специальные cancel-функции
  if (id === 'modal-mat')           { cancelMat(true); return; }
  if (id === 'modal-supplier-book') { cancelSupplierBookModal(true); return; }
  closeModal(id);
}

// Показывает кастомный мини-диалог поверх модала (по центру экрана)
function _showUnsavedWarning(id) {
  if (document.getElementById('_unsaved-overlay')) return; // не дублируем
  const overlay = document.createElement('div');
  overlay.id = '_unsaved-overlay';
  overlay.innerHTML = `
    <div class="_unsaved-box">
      <div class="_unsaved-icon">⚠️</div>
      <div class="_unsaved-title">Есть несохранённые изменения</div>
      <div class="_unsaved-sub">Если закрыть сейчас — данные потеряются</div>
      <div class="_unsaved-btns">
        <button class="_unsaved-stay"  onclick="_dismissUnsavedWarning()">← Остаться</button>
        <button class="_unsaved-close" onclick="_forceCloseModal('${id}')">Закрыть</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}
function _dismissUnsavedWarning() {
  const el = document.getElementById('_unsaved-overlay');
  if (el) el.remove();
}
function _forceCloseModal(id) {
  _dismissUnsavedWarning();
  _clearModalDirty(id); // снимаем dirty чтобы closeModal не заблокировал
  if (id === 'modal-mat')           { cancelMat(true); return; }
  if (id === 'modal-supplier-book') { cancelSupplierBookModal(true); return; }
  closeModal(id);
}

// Делегированный слушатель: любое изменение в открытом модале → dirty
document.addEventListener('input',  e => { const m = e.target.closest('.modal-bg'); if (m) _markModalDirty(m.id); }, true);
document.addEventListener('change', e => { const m = e.target.closest('.modal-bg'); if (m) _markModalDirty(m.id); }, true);

// Клик по подложке (не по контенту модала) → safeClose
document.addEventListener('click', e => {
  if (!e.target.classList.contains('modal-bg')) return;
  safeCloseModal(e.target.id);
});

// Заполняем дропдаун книжки поставщиков в modal-mat
function _fillMatSupBookSelect() {
  const sel = document.getElementById('mm-sup-book');
  if (!sel) return;
  const book = S.supplierBook || [];
  sel.innerHTML = '<option value="">— Не указан —</option>' +
    book.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
}
function _onMatSupBookChange(sel) {
  const id = parseInt(sel.value);
  const book = S.supplierBook || [];
  const b = book.find(x => x.id === id);
  const wrap = document.getElementById('mm-sup-custom-wrap');
  if (!b) {
    // Сброс — сворачиваем блок «Завести нового»
    if (wrap) wrap.removeAttribute('open');
    document.getElementById('mm-sup-name').value  = '';
    document.getElementById('mm-sup-phone').value = '';
    document.getElementById('mm-sup-note').value  = '';
    return;
  }
  // Выбрали из справочника — раскрываем детали чтобы показать данные
  if (wrap) wrap.setAttribute('open', '');
  document.getElementById('mm-sup-name').value  = b.name  || '';
  document.getElementById('mm-sup-phone').value = b.phone || '';
  document.getElementById('mm-sup-note').value  = b.note  || '';
}

// Быстрая замена поставщика прямо из карточки сырья
let _supQuickKey = null;
let _supQuickEl  = null;
function openSupQuickDrop(key, btnEl) {
  _supQuickKey = key;
  _supQuickEl  = btnEl;
  const book = S.supplierBook || [];
  const cur  = (S.suppliers || {})[key] || {};

  // Удаляем старый дроп
  let old = document.getElementById('sup-quick-drop');
  if (old) old.remove();

  const drop = document.createElement('div');
  drop.id = 'sup-quick-drop';
  drop.style.cssText = 'position:fixed;z-index:9999;background:var(--white);border:1.5px solid var(--border);border-radius:10px;box-shadow:0 4px 24px rgba(0,0,0,.35);min-width:220px;max-height:320px;overflow-y:auto;padding:6px 0';

  const items = [
    { id: '__clear__', label: '— Не указан', sub: '' },
    { id: '__custom__', label: 'Указать вручную…', sub: '' },
    ...book.map(b => ({ id: b.id, label: b.name, sub: b.phone || '' }))
  ];
  items.forEach(item => {
    const div = document.createElement('div');
    div.style.cssText = 'padding:8px 14px;cursor:pointer;font-size:13px;display:flex;flex-direction:column;gap:1px';
    div.innerHTML = `<span style="font-weight:600;color:var(--text)">${item.label}</span>${item.sub ? `<span style="font-size:11px;color:var(--muted)">${item.sub}</span>` : ''}`;
    if (cur.name && item.label === cur.name) div.style.background = 'var(--light)';
    div.addEventListener('mouseenter', () => div.style.background = 'var(--light)');
    div.addEventListener('mouseleave', () => div.style.background = cur.name === item.label ? 'var(--light)' : '');
    div.addEventListener('click', () => {
      drop.remove();
      document.removeEventListener('click', _supQuickClose, true);
      if (item.id === '__clear__') {
        if (S.suppliers) delete S.suppliers[key];
        saveState(); renderCost();
      } else if (item.id === '__custom__') {
        openSupplierModal(key);
      } else {
        if (!S.suppliers) S.suppliers = {};
        const b = book.find(x => x.id === item.id);
        if (b) S.suppliers[key] = { name: b.name, phone: b.phone || '', note: b.note || '', site: b.site || '' };
        saveState(); renderCost();
      }
    });
    drop.appendChild(div);
  });

  document.body.appendChild(drop);
  // Позиционируем под кнопкой
  const r = btnEl.getBoundingClientRect();
  const dw = drop.offsetWidth || 220;
  let left = r.left;
  if (left + dw > window.innerWidth - 8) left = window.innerWidth - dw - 8;
  drop.style.top  = (r.bottom + 4) + 'px';
  drop.style.left = left + 'px';

  setTimeout(() => document.addEventListener('click', _supQuickClose, true), 0);
  // Закрывать при скролле страницы (но не самого дропдауна)
  const _supScrollClose = (e) => {
    if (!drop.contains(e.target)) {
      drop.remove();
      document.removeEventListener('click', _supQuickClose, true);
      document.removeEventListener('scroll', _supScrollClose, true);
    }
  };
  setTimeout(() => document.addEventListener('scroll', _supScrollClose, true), 0);
}
function _supQuickClose(e) {
  const drop = document.getElementById('sup-quick-drop');
  if (drop && !drop.contains(e.target)) {
    drop.remove();
    document.removeEventListener('click', _supQuickClose, true);
  }
}
// Закрыть модал при клике на фон
document.addEventListener('click', e => {
  ['modal-drink','modal-mat','modal-semi','modal-templates','modal-loc','modal-supplier','modal-supplier-book','modal-price-hist','modal-drop','modal-suppliers-list','modal-drink-view'].forEach(id => {
    const bg = document.getElementById(id);
    if (e.target === bg) closeModal(id);
  });
});

// Закрыть верхний открытый модал по Escape
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  // Ищем открытый с наибольшим z-index (modal-mat поверх остальных)
  const all = ['modal-mat','modal-drink','modal-semi','modal-supplier','modal-supplier-book',
                'modal-loc','modal-templates','modal-price-hist','modal-drop',
                'modal-suppliers-list','modal-drink-view'];
  for (const id of all) {
    const el = document.getElementById(id);
    if (el && el.classList.contains('open')) {
      safeCloseModal(id);
      return;
    }
  }
});

// ════════════════════════════════════════════════════════════════════
//  ADD/EDIT DRINK MODAL
// ════════════════════════════════════════════════════════════════════
// Значение select для MAT: "mat:coffee", для SEMI: "semi:5"
function matOptions(selected='') {
  const placeholderOpt = `<option value="" disabled ${!selected ? 'selected' : ''} style="color:var(--muted)">— Выберите ингредиент —</option>`;
  const createOpt = `<option value="__create_mat__" style="font-weight:700;color:var(--green)">＋ Создать ингредиент...</option>`;
  // Группируем MAT по категориям
  const groups = {};
  Object.entries(MAT).forEach(([k, m]) => {
    const cat = m.category || 'other';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push([k, m]);
  });
  const sortedCats = Object.keys(groups).sort((a, b) =>
    ((MAT_CATEGORIES[a]||{order:99}).order) - ((MAT_CATEGORIES[b]||{order:99}).order)
  );
  const matOpts = sortedCats.map(cat => {
    const label = (MAT_CATEGORIES[cat] || { label: cat }).label;
    const opts = groups[cat].map(([k, m]) =>
      `<option value="mat:${k}" ${selected===`mat:${k}`?'selected':''}>${m.name}</option>`
    ).join('');
    return `<optgroup label="${label}">${opts}</optgroup>`;
  }).join('');
  const semiOpts = SEMI.length ? `<optgroup label="── Полуфабрикаты ──">${
    SEMI.map(s => `<option value="semi:${s.id}" ${selected===`semi:${s.id}`?'selected':''}>${s.name} (п/ф, ${s.yield}${s.unit})</option>`).join('')
  }</optgroup>` : '';
  return placeholderOpt + createOpt + matOpts + semiOpts;
}
function _ingPlaceholder(val) {
  if (!val) return '0';
  const [type, key] = val.split(':');
  if (type === 'semi') {
    const s = SEMI.find(x => x.id === parseInt(key));
    if (!s) return '0';
    return _semiDrinkFactor(s) === 1000 ? '0.000' : '0';
  }
  const m = MAT[key];
  if (!m) return '0';
  const u = (m.unit || '').toLowerCase();
  return (u.includes('кг') || u.includes('л')) ? '0.000' : '0';
}

function _ingStep(val) {
  if (!val) return '1';
  const [type, key] = val.split(':');
  if (type === 'semi') {
    const s = SEMI.find(x => x.id === parseInt(key));
    return (s && _semiDrinkFactor(s) === 1000) ? '0.001' : '1';
  }
  const m = MAT[key];
  if (!m) return '1';
  const u = (m.unit || '').toLowerCase();
  return (u.includes('кг') || u.includes('л')) ? '0.001' : '1';
}

function _onIngMatChange(selectEl) {
  const row = selectEl.closest('.modal-ing-row');
  if (!row) return;
  if (selectEl.value === '__create_mat__') {
    // Восстановить предыдущее значение
    selectEl.value = selectEl.dataset.prev || Object.keys(MAT).map(k=>'mat:'+k)[0] || '';
    // Открыть модалку создания ингредиента поверх модалки рецепта
    _pendingMatSelectEl = selectEl;
    _editMatKey = null;
    // Очистить поля модалки сырья
    document.getElementById('mm-modal-title').innerHTML = '<i data-lucide="plus" class="icon"></i> Новое сырьё';
    ['mm-name','mm-price','mm-size','mm-sup-name','mm-sup-phone','mm-sup-note'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
    document.getElementById('mm-unit').value = 'шт';
    document.getElementById('mm-category').value = 'other';
    document.getElementById('mm-sup-book').value = '';
    const wrap = document.getElementById('mm-sup-custom-wrap');
    if (wrap) wrap.removeAttribute('open');
    ['mm-kcal','mm-protein','mm-fat','mm-carbs'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
    openModal('modal-mat');
    return;
  }
  selectEl.dataset.prev = selectEl.value;
  selectEl.classList.remove('ing-select-empty');
  const amtInp = row.querySelector('.ing-inp-wrap input');
  const val = selectEl.value;
  amtInp.placeholder = _ingPlaceholder(val);
  amtInp.step = _ingStep(val);
}

function _calcIngRowCost(row) {
  if (!row) return null;
  const val  = row.querySelector('select').value || '';
  const inputs = row.querySelectorAll('input');
  const amtInp  = inputs[0];
  const lossInp = inputs[1];
  const amt  = parseFloat(amtInp ? amtInp.value : 0) || 0;
  const loss = (parseFloat(lossInp ? lossInp.value : 0) || 0) / 100;
  if (!val || !(amt > 0)) return null;
  let cost = 0;
  if (val.startsWith('semi:')) {
    const sid = parseInt(val.slice(5));
    const s = SEMI.find(x => x.id === sid);
    if (s) cost = calcSemiCostPerUnit(s) * amt * _semiDrinkFactor(s);
    if (loss > 0) cost = cost / (1 - loss);
  } else {
    const key = val.startsWith('mat:') ? val.slice(4) : val;
    const m = MAT[key];
    if (!m) return null;
    const factor = _semiUnitFactor(key);
    const pricePerUnit = (S.prices[key] || m.price) / m.size;
    cost = pricePerUnit * amt * factor;
    if (loss > 0) cost = cost / (1 - loss);
  }
  return cost;
}
function _updateIngRowCost(anyEl) {
  const row = anyEl.closest('.modal-ing-row');
  if (!row) return;
  const hint = row.querySelector('.ing-cost-hint');
  if (!hint) return;
  const cost = _calcIngRowCost(row);
  hint.textContent = (cost != null && cost > 0)
    ? (cost < 1 ? cost.toFixed(2) : Math.round(cost)) + ' ₽'
    : '';
}
function addIngRow(selected='', amt='', loss='') {
  // selected = 'mat:coffee' | 'semi:5' | '' (legacy: plain key → convert)
  if (selected && !selected.startsWith('mat:') && !selected.startsWith('semi:')) selected = 'mat:' + selected;
  const ph = _ingPlaceholder(selected || ('mat:' + Object.keys(MAT)[0]));
  const st = _ingStep(selected || ('mat:' + Object.keys(MAT)[0]));
  const row = document.createElement('div');
  row.className = 'modal-ing-row';
  row.innerHTML = `
    <select class="modal-select${!selected ? ' ing-select-empty' : ''}" onchange="_onIngMatChange(this);_updateIngRowCost(this)">${matOptions(selected)}</select>
    <button class="modal-ing-del" title="Удалить" onclick="this.closest('.modal-ing-row').remove()"><i data-lucide="trash-2" class="icon"></i></button>
    <div class="ing-inp-wrap" data-label="Кол-во"><input class="modal-inp" type="text" inputmode="decimal" placeholder="${ph}" value="${amt}" oninput="this.value=this.value.replace(',','.');_updateIngRowCost(this)"></div>
    <div class="ing-inp-wrap" data-label="Потери"><input class="modal-inp" type="number" min="0" max="99" step="1" inputmode="numeric" placeholder="%" value="${loss}" oninput="_updateIngRowCost(this)"></div>
    <span class="ing-cost-hint"></span>
  `;
  document.getElementById('md-ings').appendChild(row);
  // Сохранить начальное значение для восстановления при отмене создания ингредиента
  const selEl = row.querySelector('select');
  if (selEl) selEl.dataset.prev = selEl.value;
  if (window.lucide) lucide.createIcons({ nodes: [row] });
  // Показать цену сразу если редактируем существующий напиток
  if (amt) {
    const hint = row.querySelector('.ing-cost-hint');
    const cost = _calcIngRowCost(row);
    if (hint && cost != null && cost > 0)
      hint.textContent = (cost < 1 ? cost.toFixed(2) : Math.round(cost)) + ' ₽';
  }
}
function openAddDrink() {
  document.getElementById('modal-drink-title').innerHTML = '<i data-lucide="plus" class="icon"></i> Новый напиток';
  if (window.lucide) lucide.createIcons({ nodes: [document.getElementById('modal-drink-title')] });
  document.getElementById('md-process').value = '';
  document.getElementById('md-video').value    = '';
  document.getElementById('md-storage-temp').value = '';
  document.getElementById('md-storage-life').value = '';
  document.getElementById('md-appearance').value   = '';
  document.getElementById('md-taste').value        = '';
  document.getElementById('md-consistency').value  = '';
  const _prev = document.getElementById('md-img-preview');
  _prev.src = ''; _prev.style.display = 'none';
  document.getElementById('md-img-placeholder').style.display = '';
  document.getElementById('md-img-clear').style.display = 'none';
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
  document.getElementById('md-process').value = d.process || '';
  document.getElementById('md-video').value    = d.videoUrl || '';
  const _isCold = d.group === 'cold';
  const _defTemp = _isCold ? 'не выше +10°C' : 'не ниже 60°C';
  const _defLife = _isCold ? '30 минут с момента приготовления' : '15 минут с момента приготовления';
  document.getElementById('md-storage-temp').value = d.storage_temp || _defTemp;
  document.getElementById('md-storage-life').value = d.storage_life || _defLife;
  const _dq = DRINK_QUALITY[d.id];
  document.getElementById('md-appearance').value   = d.appearance  || (_dq && _dq.appearance)  || '';
  document.getElementById('md-taste').value        = d.taste       || (_dq && _dq.taste)       || '';
  document.getElementById('md-consistency').value  = d.consistency || (_dq && _dq.consistency) || '';
  // Изображение
  const preview = document.getElementById('md-img-preview');
  const placeholder = document.getElementById('md-img-placeholder');
  const clearBtn = document.getElementById('md-img-clear');
  if (d.image) {
    preview.src = d.image; preview.style.display = 'block';
    placeholder.style.display = 'none'; clearBtn.style.display = '';
  } else {
    preview.src = ''; preview.style.display = 'none';
    placeholder.style.display = ''; clearBtn.style.display = 'none';
  }
  document.getElementById('md-ings').innerHTML = '';
  d.recipe.forEach(r => {
    const sel = r.semi != null ? `semi:${r.semi}` : `mat:${r.mat}`;
    let displayAmt = r.amt;
    if (r.semi != null) {
      displayAmt = r.amt;
    } else if (r.mat) {
      displayAmt = parseFloat((r.amt / _semiUnitFactor(r.mat)).toPrecision(6));
    }
    const displayLoss = r.loss ? parseFloat((r.loss * 100).toPrecision(4)) : '';
    addIngRow(sel, displayAmt, displayLoss);
  });
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
    // базовый напиток: показываем «Сбросить» (недоступно пока не изменён, но модалка открылась из рецептур)
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
    const selEl  = row.querySelector('select');
    const inputs = row.querySelectorAll('input');
    const amt    = parseFloat(inputs[0].value);
    if (!selEl.value || !(amt > 0)) return;
    const l = parseFloat(inputs[1].value) / 100;
    const [type, key] = selEl.value.split(':');
    if (type === 'semi') {
      const s = SEMI.find(x => x.id === parseInt(key));
      const ing = { semi: parseInt(key), amt };
      if (l > 0 && l < 1) ing.loss = l;
      recipe.push(ing);
    } else {
      const factor = _semiUnitFactor(key);
      const ing = { mat: key, amt: amt * factor };
      if (l > 0 && l < 1) ing.loss = l;
      recipe.push(ing);
    }
  });
  if (recipe.length === 0) { alert('Добавьте хотя бы один ингредиент'); return; }
  const process  = document.getElementById('md-process').value.trim();
  const videoUrl = document.getElementById('md-video').value.trim();
  const storage_temp  = document.getElementById('md-storage-temp').value.trim();
  const storage_life  = document.getElementById('md-storage-life').value.trim();
  const appearance    = document.getElementById('md-appearance').value.trim();
  const taste         = document.getElementById('md-taste').value.trim();
  const consistency   = document.getElementById('md-consistency').value.trim();
  const imgEl    = document.getElementById('md-img-preview');
  const image    = (imgEl.style.display !== 'none' && imgEl.src) ? imgEl.src : '';
  if (editId !== '') {
    const id = parseInt(editId);
    const idx = DRINKS.findIndex(x=>x.id===id);
    if (idx >= 0) {
      const wasCustom = DRINKS[idx].custom || false;
      DRINKS[idx] = {...DRINKS[idx], name, group, vol, recipe, process, videoUrl, image,
        storage_temp, storage_life, appearance, taste, consistency,
        custom: wasCustom,
        modified: !wasCustom || undefined
      };
    }
    S.salePrices[id] = price;
  } else {
    const id = nextDrinkId++;
    DRINKS.push({ id, group, name, vol, recipe, process, videoUrl, image,
      storage_temp, storage_life, appearance, taste, consistency, price, custom:true });
    S.salePrices[id] = price;
    S.portions[id]   = 5;
  }
  _clearModalDirty('modal-drink');
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
function onDrinkImgChange(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  if (file.size > 5 * 1024 * 1024) { alert('Файл слишком большой. Максимум 5 МБ.'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    const preview = document.getElementById('md-img-preview');
    const placeholder = document.getElementById('md-img-placeholder');
    preview.src = e.target.result;
    preview.style.display = 'block';
    placeholder.style.display = 'none';
    document.getElementById('md-img-clear').style.display = '';
  };
  reader.readAsDataURL(file);
  input.value = '';
}
function clearDrinkImg() {
  const preview = document.getElementById('md-img-preview');
  preview.src = ''; preview.style.display = 'none';
  document.getElementById('md-img-placeholder').style.display = '';
  document.getElementById('md-img-clear').style.display = 'none';
}

// ── Изображение полуфабриката ───────────────────────────────────
function onSemiImgChange(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  if (file.size > 5 * 1024 * 1024) { alert('Файл слишком большой. Максимум 5 МБ.'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    const preview = document.getElementById('ms-img-preview');
    preview.src = e.target.result;
    preview.style.display = 'block';
    document.getElementById('ms-img-placeholder').style.display = 'none';
    document.getElementById('ms-img-clear').style.display = '';
  };
  reader.readAsDataURL(file);
  input.value = '';
}
function clearSemiImg() {
  const preview = document.getElementById('ms-img-preview');
  preview.src = ''; preview.style.display = 'none';
  document.getElementById('ms-img-placeholder').style.display = '';
  document.getElementById('ms-img-clear').style.display = 'none';
}
function mdDeleteAction() {
  const id = parseInt(document.getElementById('md-edit-id').value);
  const action = document.getElementById('md-delete-btn').dataset.action;
  _clearModalDirty('modal-drink');
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
function openEditMat(key) {
  const m = MAT[key];
  if (!m) return;
  _editMatKey = key;
  document.getElementById('mm-modal-title').innerHTML = '<i data-lucide="pencil" class="icon"></i> Редактировать сырьё';
  document.getElementById('mm-name').value     = m.name || '';
  document.getElementById('mm-unit').value     = m.unit || 'шт';
  document.getElementById('mm-category').value = m.category || 'other';
  document.getElementById('mm-price').value    = S.prices[key] ?? m.price ?? '';
  document.getElementById('mm-size').value     = m.size || '';
  const sup = (S.suppliers||{})[key];
  document.getElementById('mm-sup-book').value  = '';
  document.getElementById('mm-sup-name').value  = sup?.name  || '';
  document.getElementById('mm-sup-phone').value = sup?.phone || '';
  document.getElementById('mm-sup-note').value  = sup?.note  || '';
  // если есть данные поставщика — разорнуть блок
  const wrap = document.getElementById('mm-sup-custom-wrap');
  if (wrap) { if (sup?.name) wrap.setAttribute('open',''); else wrap.removeAttribute('open'); }
  const n = m.nutrition || {};
  ['kcal','protein','fat','carbs'].forEach(f => {
    const el = document.getElementById('mm-' + f);
    if (el) el.value = n[f] || '';
  });
  openModal('modal-mat');
  lucide.createIcons();
}

function saveMat() {
  const name  = document.getElementById('mm-name').value.trim();
  const unit  = document.getElementById('mm-unit').value || 'шт';
  const price = parseFloat(document.getElementById('mm-price').value) || 0;
  const size  = parseFloat(document.getElementById('mm-size').value);
  if (!name || !(size > 0)) { alert('Заполните название и объём'); return; }
  const key = _editMatKey || ('custom_' + (nextMatKey++));
  if (!_editMatKey) nextMatKey; // счётчик уже увеличенся
  const category = document.getElementById('mm-category').value || 'other';
  const kcal   = parseFloat(document.getElementById('mm-kcal').value)   || 0;
  const protein= parseFloat(document.getElementById('mm-protein').value)|| 0;
  const fat    = parseFloat(document.getElementById('mm-fat').value)    || 0;
  const carbs  = parseFloat(document.getElementById('mm-carbs').value)  || 0;
  const nutrition = (kcal || protein || fat || carbs) ? { kcal, protein, fat, carbs } : undefined;
  MAT[key] = { name, unit, price, size, custom:true, category, ...(nutrition ? { nutrition } : {}) };
  S.prices[key] = price;
  // поставщик
  const supName  = document.getElementById('mm-sup-name').value.trim();
  const supPhone = document.getElementById('mm-sup-phone').value.trim();
  const supNote  = document.getElementById('mm-sup-note').value.trim();
  if (supName || supPhone || supNote) {
    if (!S.suppliers) S.suppliers = {};
    S.suppliers[key] = { name: supName, phone: supPhone, note: supNote, site: '' };
  }
  _clearModalDirty('modal-mat');
  closeModal('modal-mat');
  // Если открыто из строки рецепта — вставить новый ингредиент в тот select
  if (_pendingMatSelectEl) {
    _pendingMatSelectEl.innerHTML = matOptions('mat:' + key);
    _pendingMatSelectEl.value = 'mat:' + key;
    _pendingMatSelectEl.dataset.prev = 'mat:' + key;
    const _pendingRow = _pendingMatSelectEl.closest('.modal-ing-row');
    if (_pendingRow) {
      const amtInp = _pendingRow.querySelector('input[type="number"]');
      if (amtInp) { amtInp.placeholder = _ingPlaceholder('mat:' + key); amtInp.step = _ingStep('mat:' + key); }
      _updateIngRowCost(_pendingMatSelectEl);
    }
    _pendingMatSelectEl = null;
  }
  if (_pendingSemiMatSelectEl) {
    _pendingSemiMatSelectEl.innerHTML = matOnlyOptions(key);
    _pendingSemiMatSelectEl.value = key;
    _pendingSemiMatSelectEl.dataset.prev = key;
    const _pendingSemiRow = _pendingSemiMatSelectEl.closest('.ing-row');
    if (_pendingSemiRow) {
      const amtInp = _pendingSemiRow.querySelector('.ing-amt');
      if (amtInp) { amtInp.placeholder = _semiIngPlaceholder(key); amtInp.step = _semiIngStep(key); }
      _updateSemiIngCost(_pendingSemiMatSelectEl);
    }
    _pendingSemiMatSelectEl = null;
  }
  _editMatKey = null;
  document.getElementById('mm-modal-title').innerHTML = '<i data-lucide="plus" class="icon"></i> Новая позиция сырья';
  document.getElementById('mm-name').value  = '';
  document.getElementById('mm-unit').value  = 'шт';
  document.getElementById('mm-price').value = '';
  document.getElementById('mm-size').value  = '';
  document.getElementById('mm-category').value = 'other';
  document.getElementById('mm-sup-name').value  = '';
  document.getElementById('mm-sup-phone').value = '';
  document.getElementById('mm-sup-note').value  = '';
  document.getElementById('mm-sup-book').value  = '';
  const wrap2 = document.getElementById('mm-sup-custom-wrap');
  if (wrap2) wrap2.removeAttribute('open');
  ['mm-kcal','mm-protein','mm-fat','mm-carbs'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  markDirtyDebounce();
  saveState();
}
function cancelMat(force = false) {
  if (!force && _isModalDirty('modal-mat')) {
    _showUnsavedWarning('modal-mat');
    return;
  }
  _pendingMatSelectEl = null;
  _pendingSemiMatSelectEl = null;
  _clearModalDirty('modal-mat');
  closeModal('modal-mat');
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
//  SEMI-FINISHED PRODUCTS CRUD
// ════════════════════════════════════════════════════════════════════
function matOnlyOptions(selected) {
  const createOpt = `<option value="__create_mat__" style="font-weight:700;color:var(--green)">＋ Создать ингредиент...</option>`;
  const groups = {};
  Object.entries(MAT).forEach(([k, m]) => {
    const cat = m.category || 'other';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push([k, m]);
  });
  const sortedCats = Object.keys(groups).sort((a, b) =>
    ((MAT_CATEGORIES[a]||{order:99}).order) - ((MAT_CATEGORIES[b]||{order:99}).order)
  );
  return createOpt + sortedCats.map(cat => {
    const label = (MAT_CATEGORIES[cat] || { label: cat }).label;
    const opts = groups[cat].map(([k, m]) =>
      `<option value="${k}"${k===selected?' selected':''}>${m.name} (${m.unit})</option>`
    ).join('');
    return `<optgroup label="${label}">${opts}</optgroup>`;
  }).join('');
}

function _semiIngPlaceholder(matKey) {
  const m = MAT[matKey];
  if (!m) return '0';
  const u = (m.unit || '').toLowerCase();
  return (u.includes('кг') || u.includes('л')) ? '0.000' : '0';
}

function _semiIngStep(matKey) {
  const m = MAT[matKey];
  if (!m) return '1';
  const u = (m.unit || '').toLowerCase();
  return (u.includes('кг') || u.includes('л')) ? '0.001' : '1';
}

function _updateSemiCostPreview() {
  const yieldV = parseFloat(document.getElementById('ms-yield').value) || 0;
  let totalRaw = 0;
  document.querySelectorAll('#ms-ings .ing-row').forEach(row => {
    const matKey = row.querySelector('.ing-mat').value;
    const amt    = parseFloat(row.querySelector('.ing-amt').value) || 0;
    const loss   = parseFloat(row.querySelector('.ing-loss').value) || 0;
    const m = MAT[matKey];
    if (!m || !(amt > 0)) return;
    const pricePerUnit = (S.prices[matKey] || m.price) / m.size;
    totalRaw += pricePerUnit * amt * _semiUnitFactor(matKey) * (1 + loss);
  });
  const unit = document.getElementById('ms-unit').value || 'ед.';
  const perUnit = (yieldV > 0 && totalRaw > 0) ? (totalRaw / yieldV) : null;
  const el = document.getElementById('ms-cost-preview');
  if (!el) return;
  if (totalRaw > 0) {
    el.style.display = 'flex';
    el.innerHTML = `<span style="color:var(--muted);font-size:12px">Себест. сырья:</span>
      <b style="color:var(--navy)">${Math.round(totalRaw)} ₽</b>
      ${perUnit ? `<span style="color:var(--muted);font-size:12px">·</span><b style="color:var(--green)">${perUnit < 1 ? perUnit.toFixed(2) : Math.round(perUnit)} ₽/${unit}</b>` : ''}`;
  } else {
    el.style.display = 'none';
  }
}

function addSemiIngRow(matKey='', amt='', loss='', yieldAmt='') {
  const wrap = document.getElementById('ms-ings');
  const firstKey = matKey || Object.keys(MAT)[0] || '';
  const row = document.createElement('div');
  row.className = 'ing-row';
  row.innerHTML = `
    <div class="ing-row-header">
      <select class="modal-select ing-mat" onchange="_onSemiMatChange(this);_updateSemiIngCost(this)">${matOnlyOptions(firstKey)}</select>
      <button class="btn btn-outline ing-del-btn" onclick="this.closest('.ing-row').remove();_updateSemiCostPreview()"><i data-lucide="trash-2" class="icon"></i></button>
    </div>
    <div class="ing-row-fields">
      <div class="ing-field-wrap">
        <span class="ing-field-label">Кол-во</span>
        <input class="modal-inp ing-amt" type="text" inputmode="decimal" value="${amt}" placeholder="${_semiIngPlaceholder(firstKey)}" oninput="this.value=this.value.replace(',','.');_updateSemiCostPreview();_updateSemiIngCost(this);_autoCalcSemiIngYield(this)">
      </div>
      <div class="ing-field-wrap">
        <span class="ing-field-label">Потери, %</span>
        <input class="modal-inp ing-loss" type="number" min="0" max="99" step="1" inputmode="numeric" value="${loss}" placeholder="0" oninput="_updateSemiCostPreview();_updateSemiIngCost(this);_autoCalcSemiIngYield(this)">
      </div>
      <div class="ing-field-wrap">
        <span class="ing-field-label">Выход</span>
        <input class="modal-inp ing-yield" type="text" inputmode="decimal" value="${yieldAmt}" placeholder="авто" title="Фактический выход после обработки">
      </div>
    </div>
    <span class="ing-cost-hint"></span>
  `;
  wrap.appendChild(row);
  if (window.lucide) lucide.createIcons({ nodes: [row] });
  _updateSemiCostPreview();
  if (amt) {
    const hint = row.querySelector('.ing-cost-hint');
    const cost = _calcSemiIngCost(row);
    if (hint && cost > 0) hint.textContent = (cost < 1 ? cost.toFixed(2) : Math.round(cost)) + '\u00a0₽';
  }
}

function _autoCalcSemiIngYield(anyEl) {
  const row = anyEl.closest('.ing-row');
  if (!row) return;
  const amtEl   = row.querySelector('.ing-amt');
  const lossEl  = row.querySelector('.ing-loss');
  const yieldEl = row.querySelector('.ing-yield');
  if (!amtEl || !lossEl || !yieldEl) return;
  const amt  = parseFloat(amtEl.value)  || 0;
  const loss = parseFloat(lossEl.value) || 0;
  if (amt > 0 && loss > 0) {
    const y = amt * (1 - loss / 100);
    yieldEl.value = parseFloat(y.toPrecision(4));
  } else if (loss === 0) {
    yieldEl.value = '';
  }
}
function _autoFillSemiYield() {
  const yieldInp = document.getElementById('ms-yield');
  if (!yieldInp) return;
  let total = 0;
  let hasAny = false;
  document.querySelectorAll('#ms-ings .ing-row').forEach(row => {
    const matKey  = (row.querySelector('.ing-mat') || {}).value || '';
    const amtVal  = parseFloat((row.querySelector('.ing-amt')  || {}).value) || 0;
    const yldVal  = parseFloat((row.querySelector('.ing-yield')|| {}).value);
    const factor  = _semiUnitFactor(matKey);
    // если есть выход ингредиента — берём его, иначе берём кол-во
    const contrib = isFinite(yldVal) ? yldVal * factor : amtVal * factor;
    if (amtVal > 0 || isFinite(yldVal)) { total += contrib; hasAny = true; }
  });
  if (hasAny && total > 0) yieldInp.value = Math.round(total);
}

function _calcSemiIngCost(row) {
  if (!row) return 0;
  const key  = (row.querySelector('.ing-mat') || {}).value || '';
  const amt  = parseFloat((row.querySelector('.ing-amt')  || {}).value) || 0;
  const loss = (parseFloat((row.querySelector('.ing-loss') || {}).value) || 0) / 100;
  const m = MAT[key];
  if (!m || !(amt > 0)) return 0;
  const factor = _semiUnitFactor(key);
  const pricePerUnit = (S.prices[key] || m.price) / m.size;
  let cost = pricePerUnit * amt * factor;
  if (loss > 0) cost = cost / (1 - loss);
  return cost;
}
function _updateSemiIngCost(anyEl) {
  const row = anyEl.closest('.ing-row');
  if (!row) return;
  const hint = row.querySelector('.ing-cost-hint');
  if (!hint) return;
  const cost = _calcSemiIngCost(row);
  hint.textContent = cost > 0 ? (cost < 1 ? cost.toFixed(2) : Math.round(cost)) + '\u00a0₽' : '';
}
function _onSemiMatChange(selectEl) {
  const row = selectEl.closest('.ing-row');
  if (!row) return;
  if (selectEl.value === '__create_mat__') {
    // Восстановить предыдущее значение
    selectEl.value = selectEl.dataset.prev || Object.keys(MAT)[0] || '';
    _pendingSemiMatSelectEl = selectEl;
    _editMatKey = null;
    // Открыть модалку создания сырья поверх модалки п/ф
    document.getElementById('mm-modal-title').innerHTML = '<i data-lucide="plus" class="icon"></i> Новое сырьё';
    ['mm-name','mm-price','mm-size','mm-sup-name','mm-sup-phone','mm-sup-note'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
    document.getElementById('mm-unit').value = 'шт';
    document.getElementById('mm-category').value = 'other';
    document.getElementById('mm-sup-book').value = '';
    const wrap = document.getElementById('mm-sup-custom-wrap');
    if (wrap) wrap.removeAttribute('open');
    ['mm-kcal','mm-protein','mm-fat','mm-carbs'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
    openModal('modal-mat');
    return;
  }
  selectEl.dataset.prev = selectEl.value;
  const amtInp = row.querySelector('.ing-amt');
  amtInp.placeholder = _semiIngPlaceholder(selectEl.value);
  amtInp.step = _semiIngStep(selectEl.value);
  _updateSemiCostPreview();
}

function openAddSemi() {
  document.getElementById('modal-semi-title').innerHTML = '<i data-lucide="layers" class="icon"></i> Новый полуфабрикат';
  document.getElementById('ms-name').value    = '';
  document.getElementById('ms-unit').value    = 'мл';
  document.getElementById('ms-yield').value   = '';
  document.getElementById('ms-process').value = '';
  document.getElementById('ms-storage-temp').value = '';
  document.getElementById('ms-storage-life').value = '';
  document.getElementById('ms-appearance').value   = '';
  document.getElementById('ms-taste').value        = '';
  document.getElementById('ms-consistency').value  = '';
  document.getElementById('ms-edit-id').value = '';
  document.getElementById('ms-delete-btn').style.display = 'none';
  // Сброс изображения
  const _mp = document.getElementById('ms-img-preview');
  _mp.src = ''; _mp.style.display = 'none';
  document.getElementById('ms-img-placeholder').style.display = '';
  document.getElementById('ms-img-clear').style.display = 'none';
  document.getElementById('ms-ings').innerHTML = '';
  addSemiIngRow();
  openModal('modal-semi');
  _updateSemiCostPreview();
  if (window.lucide) lucide.createIcons();
}

function openEditSemi(id) {
  const semi = SEMI.find(s => s.id === id);
  if (!semi) return;
  document.getElementById('modal-semi-title').innerHTML = '<i data-lucide="layers" class="icon"></i> Редактировать полуфабрикат';
  document.getElementById('ms-name').value    = semi.name;
  document.getElementById('ms-unit').value    = semi.unit;
  document.getElementById('ms-yield').value   = semi.yield;
  document.getElementById('ms-process').value = semi.process || '';
  document.getElementById('ms-storage-temp').value = semi.storage_temp || '';
  document.getElementById('ms-storage-life').value = semi.storage_life || '';
  document.getElementById('ms-appearance').value   = semi.appearance || '';
  document.getElementById('ms-taste').value        = semi.taste || '';
  document.getElementById('ms-consistency').value  = semi.consistency || '';
  document.getElementById('ms-edit-id').value = semi.id;
  document.getElementById('ms-delete-btn').style.display = '';
  // Изображение
  const _sp = document.getElementById('ms-img-preview');
  const _sph = document.getElementById('ms-img-placeholder');
  const _scb = document.getElementById('ms-img-clear');
  if (semi.image) {
    _sp.src = semi.image; _sp.style.display = 'block';
    _sph.style.display = 'none'; _scb.style.display = '';
  } else {
    _sp.src = ''; _sp.style.display = 'none';
    _sph.style.display = ''; _scb.style.display = 'none';
  }
  document.getElementById('ms-ings').innerHTML = '';
  (semi.recipe || []).forEach(r => addSemiIngRow(r.mat, r.amt, r.loss ? parseFloat((r.loss * 100).toPrecision(4)) : '', r.yieldAmt || ''));
  if (!(semi.recipe && semi.recipe.length)) addSemiIngRow();
  openModal('modal-semi');
  _updateSemiCostPreview();
  if (window.lucide) lucide.createIcons();
}

function saveSemi() {
  const name    = document.getElementById('ms-name').value.trim();
  const unit    = document.getElementById('ms-unit').value;
  const yieldV  = parseFloat(document.getElementById('ms-yield').value);
  const process = document.getElementById('ms-process').value.trim();
  const storage_temp  = document.getElementById('ms-storage-temp').value.trim();
  const storage_life  = document.getElementById('ms-storage-life').value.trim();
  const appearance    = document.getElementById('ms-appearance').value.trim();
  const taste         = document.getElementById('ms-taste').value.trim();
  const consistency   = document.getElementById('ms-consistency').value.trim();
  const editId  = document.getElementById('ms-edit-id').value;
  if (!name) { alert('Введите название'); return; }
  if (!(yieldV > 0)) { alert('Введите выход (> 0)'); return; }
  const imgEl = document.getElementById('ms-img-preview');
  const image = (imgEl && imgEl.style.display !== 'none' && imgEl.src) ? imgEl.src : '';

  const recipe = [];
  document.querySelectorAll('#ms-ings .ing-row').forEach(row => {
    const mat  = row.querySelector('.ing-mat').value;
    const amt  = parseFloat(row.querySelector('.ing-amt').value);
    const loss = (parseFloat(row.querySelector('.ing-loss').value) || 0) / 100;
    const yieldAmt = parseFloat(row.querySelector('.ing-yield').value);
    if (mat && amt > 0) {
      const r = { mat, amt };
      if (loss > 0 && loss < 1) r.loss = loss;
      if (isFinite(yieldAmt) && yieldAmt > 0) r.yieldAmt = yieldAmt;
      recipe.push(r);
    }
  });
  if (!recipe.length) { alert('Добавьте хотя бы один ингредиент'); return; }

  if (editId) {
    const idx = SEMI.findIndex(s => s.id === parseInt(editId));
    if (idx >= 0) SEMI[idx] = { id: parseInt(editId), name, unit, yield: yieldV, process, image, storage_temp, storage_life, appearance, taste, consistency, recipe };
  } else {
    SEMI.push({ id: nextSemiId++, name, unit, yield: yieldV, process, image, storage_temp, storage_life, appearance, taste, consistency, recipe });
  }
  _clearModalDirty('modal-semi');
  closeModal('modal-semi');
  markDirtyDebounce();
  saveState();
  renderCost();
}

function deleteSemi(idRaw) {
  const id = parseInt(idRaw);
  const usedInDrink = DRINKS.some(d => d.recipe.some(r => r.semi === id));
  if (usedInDrink) { alert('Полуфабрикат используется в рецептурах напитков — сначала удалите его из напитков'); return; }
  if (!confirm('Удалить полуфабрикат?')) return;
  SEMI = SEMI.filter(s => s.id !== id);
  _clearModalDirty('modal-semi');
  closeModal('modal-semi');
  markDirtyDebounce();
  saveState();
  renderCost();
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
      <div class="dash-chart-name" style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex-shrink:0;font-weight:600">${d.name}</div>
      <div style="flex:1;height:14px;background:#e5e7eb;border-radius:4px;overflow:hidden">
        <div style="width:${w}%;height:100%;background:${bc};border-radius:4px;transition:width .4s"></div>
      </div>
      <div style="width:60px;font-size:12px;font-weight:800;color:${vc};text-align:right">${Math.round(d.profit)}\u00a0₽</div>
    </div>`;
  }).join('');

  const rows = filtered.map(d => {
    const profCls = d.profit >= avgProfit ? 'num-pos' : '';
    const recHighlight = d.fc > S.targetFC + 0.10 ? 'style="color:#7a5800;font-weight:800"' : 'style="color:var(--navy);font-weight:700"';
    const actionBtn = d.custom
      ? `<button class="btn btn-outline" style="padding:3px 8px;font-size:11px;color:var(--red);border-color:#f4b8c4" onclick="event.stopPropagation();deleteDrink(${d.id})" title="Удалить напиток"><i data-lucide="trash-2" class="icon"></i></button>`
      : d.modified
        ? `<button class="btn btn-outline" style="padding:3px 8px;font-size:11px;color:var(--muted)" onclick="event.stopPropagation();resetDrink(${d.id})" title="Вернуть к исходному"><i data-lucide="rotate-ccw" class="icon"></i></button>`
        : '';
    return `<tr style="cursor:pointer" onmousedown="if(document.activeElement&&document.activeElement.tagName==='INPUT')window._suppressRowClick=true;" onclick="if(window._suppressRowClick){window._suppressRowClick=false;}else{openEditDrink(${d.id});}">
      <td class="fw7">${d.name}${(d.custom||d.modified)?'<i data-lucide="pencil" class="icon" style="margin-left:5px;color:var(--muted)"></i>':''}</td>
      <td class="ta-r mob-hide">${rub(d.cost)}</td>
      <td>${fcCombinedHtml(d.fc)}</td>
      <td class="ta-r" onclick="event.stopPropagation()"><span style="display:inline-flex;align-items:center;gap:4px"><input class="inp white dash-price-inp" type="number" inputmode="numeric" min="1" value="${d.price}" onchange="onSalePrice(${d.id},this.value)"><span style="font-size:12px;color:var(--muted)">₽</span></span></td>
      <td class="ta-r mob-hide" ${recHighlight}>${rub(d.rec)}${d.fc > S.targetFC + 0.10 ? ' <span title="FC% существенно выше целевого" style="font-size:12px">⚠️</span>' : ''}</td>
      <td class="ta-r ${profCls}">${rub(d.profit)}</td>
      <td class="ta-c">${abcBadge(d.abc, d.abcTip)}</td>
      <td onclick="event.stopPropagation()">${actionBtn}</td>
    </tr>`;
  }).join('');

  document.getElementById('tab-dashboard').innerHTML = `
    <div class="page-title">
      <span class="page-title-left"><i data-lucide="layout-dashboard" class="icon"></i> Обзор меню</span>
      <div class="dash-hdr-actions">
        <button class="btn btn-outline dash-intro-toggle" id="dash-intro-btn" onclick="toggleDashIntro()" title="Подсказка"><i data-lucide="info" class="icon"></i> <span class="dash-btn-txt">Подсказка</span></button>
        <button class="btn btn-outline" onclick="openDropCandidates()" title="Кандидаты на удаление"><i data-lucide="scissors" class="icon"></i> <span class="dash-btn-txt">Кандидаты</span></button>
        <button class="btn btn-outline" onclick="exportDashboard()" title="CSV"><i data-lucide="download" class="icon"></i> <span class="dash-btn-txt">CSV</span></button>
      </div>
    </div>
    <div class="tab-intro" id="dash-intro">
      <div class="tab-intro-icon"><i data-lucide="layout-dashboard" class="icon icon-lg"></i></div>
      <div>
        <div class="tab-intro-title">Добро пожаловать в MBS* Coffee Menu</div>
        <div class="tab-intro-text">
          Это CFO-инструмент владельца кофейни — считает <strong>себестоимость</strong> каждого напитка из рецептуры, показывает <strong>прибыль с каждой чашки</strong> и помогает построить <strong>финансовую модель</strong> всего заведения.<br>
          Вкладка «Обзор» — стартовая точка: рейтинг всех напитков по прибыльности, ABC-анализ меню и ключевые метрики.<br>
          <strong>FC%</strong> (фуд-кост) — доля себестоимости в цене. Чем ниже — тем выгоднее позиция для кофейни.<br>
          Цену продажи можно редактировать прямо в таблице — все расчёты пересчитаются мгновенно.
        </div>
        <div class="tab-intro-steps">
          <span class="tab-intro-step">🟢 FC ≤ 25% — отлично</span>
          <span class="tab-intro-step">🟡 26–30% — допустимо</span>
          <span class="tab-intro-step">🔴 > 30% — пересмотри цену</span>
          <span class="tab-intro-step">A — топ 20% прибыли · B — рабочие · C — кандидаты на пересмотр</span>
          <span class="tab-intro-step">Целевой FC% — задай норму, система покажет рекомендуемую цену</span>
          <span class="tab-intro-step">⚠️ рядом с ценой — она ниже рекомендованной для целевого FC%</span>
          <span class="tab-intro-step">Клик на заголовок таблицы — сортировка по любому столбцу</span>
        </div>
      </div>
    </div>
    <div class="kpi-grid">
      <div class="kpi-card accent"><div class="kpi-label">Напитков в меню</div><div class="kpi-value">${drinks.length}</div></div>
      <div class="kpi-card"><div class="kpi-label">Средний чек</div><div class="kpi-value">${rub(avgPrice)}</div></div>
      <div class="kpi-card"><div class="kpi-label">Прибыль / чашка</div><div class="kpi-value">${rub(avgProfit)}</div></div>
      <div class="kpi-card"><div class="kpi-label">Средний FC%</div><div class="kpi-value">${pct(avgFC)}</div></div>
      <div class="kpi-card kpi-card--editable kpi-card--span2" title="Нажмите для изменения">
        <div class="kpi-label">Целевой FC%</div>
        <div class="kpi-value kpi-value--input">
          <input type="number" id="kpi-target-fc" class="kpi-inp" min="5" max="60" step="1" inputmode="numeric"
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
    <div class="dash-search-row">
      <div class="search-wrap" style="margin-bottom:0;flex:1">
        <span class="search-icon"><i data-lucide="search" class="icon"></i></span>
        <input class="search-inp" id="dash-search" type="text" placeholder="Поиск по названию..."
          value="${searchQuery}" oninput="filterDashboard(this.value);_searchClear(this)">
        <button class="search-clear${searchQuery ? ' visible' : ''}" title="Очистить" onclick="filterDashboard('');var el=document.getElementById('dash-search');el.value='';_searchClear(el)">✕</button>
      </div>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr>
          ${thSort('name','Напиток','','Название позиции меню. Клик по строке — открыть карточку редактирования')}
          ${thSort('cost','Себест. ₽','ta-r mob-hide','Расчётная себестоимость одной порции по текущим ценам сырья. Пересчитывается автоматически при изменении цен поставщиков')}
          ${thSort('fc','FC%','ta-c','Food Cost % — доля себестоимости в цене продажи. 🟢 ≤25% отлично · 🟡 26–30% норма · 🔴 >30% пересмотрите цену или рецептуру')}
          ${thSort('price','Цена ₽','ta-r','Цена продажи для гостя. Редактируется прямо в таблице — изменения сохраняются немедленно')}
          ${thSort('rec','Рек. цена ₽','ta-r mob-hide','Минимальная цена для достижения целевого FC%. ⚠️ — ваша цена существенно ниже рекомендованной, позиция убыточна по FC')}
          ${thSort('profit','Прибыль ₽','ta-r','Прибыль с одной чашки = Цена − Себестоимость. Зелёный цвет — выше среднего по меню')}
          ${thSort('abc','ABC','ta-c','ABC-анализ по прибыли с чашки: A — топ 20% (продвигать), B — следующие 30% (рабочий ассортимент), C — нижние 50% (пересмотреть)')}
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

function _searchClear(inp) {
  const btn = inp.parentElement.querySelector('.search-clear');
  if (btn) btn.classList.toggle('visible', inp.value.length > 0);
}

function toggleDashIntro() {
  const el = document.getElementById('dash-intro');
  if (!el) return;
  el.classList.toggle('open');
  const btn = document.getElementById('dash-intro-btn');
  if (btn) btn.classList.toggle('active', el.classList.contains('open'));
}
function toggleRecipesIntro() {
  const el = document.getElementById('recipes-intro');
  if (!el) return;
  el.classList.toggle('open');
  const btn = document.getElementById('recipes-intro-btn');
  if (btn) btn.classList.toggle('active', el.classList.contains('open'));
}

function toggleSupIntro() {
  const el = document.getElementById('sup-intro');
  if (!el) return;
  el.classList.toggle('open');
  const btn = document.getElementById('sup-intro-btn');
  if (btn) btn.classList.toggle('active', el.classList.contains('open'));
}

function toggleSalesIntro() {
  const el = document.getElementById('sales-intro');
  if (!el) return;
  el.classList.toggle('open');
  const btn = document.getElementById('sales-intro-btn');
  if (btn) btn.classList.toggle('active', el.classList.contains('open'));
}

function toggleFinIntro() {
  const el = document.getElementById('fin-intro');
  if (!el) return;
  el.classList.toggle('open');
  const btn = document.getElementById('fin-intro-btn');
  if (btn) btn.classList.toggle('active', el.classList.contains('open'));
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
    const recHighlight = d.fc > S.targetFC + 0.10 ? 'style="color:#7a5800;font-weight:800"' : 'style="color:var(--navy);font-weight:700"';
    const actionBtn = d.custom
      ? `<button class="btn btn-outline" style="padding:3px 8px;font-size:11px;color:var(--red);border-color:#f4b8c4" onclick="event.stopPropagation();deleteDrink(${d.id})" title="Удалить напиток"><i data-lucide="trash-2" class="icon"></i></button>`
      : d.modified
        ? `<button class="btn btn-outline" style="padding:3px 8px;font-size:11px;color:var(--muted)" onclick="event.stopPropagation();resetDrink(${d.id})" title="Вернуть к исходному"><i data-lucide="rotate-ccw" class="icon"></i></button>`
        : '';
    return `<tr style="cursor:pointer" onmousedown="if(document.activeElement&&document.activeElement.tagName==='INPUT')window._suppressRowClick=true;" onclick="if(window._suppressRowClick){window._suppressRowClick=false;}else{openEditDrink(${d.id});}">
      <td class="fw7">${d.name}${(d.custom||d.modified)?'<i data-lucide="pencil" class="icon" style="margin-left:5px;color:var(--muted)"></i>':''}</td>
      <td class="ta-r mob-hide">${rub(d.cost)}</td>
      <td>${fcCombinedHtml(d.fc)}</td>
      <td class="ta-r" onclick="event.stopPropagation()"><span style="display:inline-flex;align-items:center;gap:4px"><input class="inp white dash-price-inp" type="number" inputmode="numeric" min="1" value="${d.price}" onchange="onSalePrice(${d.id},this.value)"><span style="font-size:12px;color:var(--muted)">₽</span></span></td>
      <td class="ta-r mob-hide" ${recHighlight}>${rub(d.rec)}${d.fc > S.targetFC + 0.10 ? ' <span title="FC% существенно выше целевого" style="font-size:12px">⚠️</span>' : ''}</td>
      <td class="ta-r ${profCls}">${rub(d.profit)}</td>
      <td class="ta-c">${abcBadge(d.abc, d.abcTip)}</td>
      <td onclick="event.stopPropagation()">${actionBtn}</td>
    </tr>`;
  }).join('');
  const tb = document.querySelector('#tab-dashboard tbody');
  if (tb) {
    tb.innerHTML = rows || `<tr><td colspan="8" style="text-align:center;padding:32px 16px;color:var(--muted);font-size:14px">🔍 Ничего не найдено — попробуйте изменить запрос</td></tr>`;
    if (window.lucide) lucide.createIcons({ nodes: [tb] });
  }
}

// ════════════════════════════════════════════════════════════════════
//  RENDER — COST CALCULATOR
// ════════════════════════════════════════════════════════════════════
function renderCost() {
  // ── Сырьё по категориям ──────────────────────────────────────────
  const matGroups = {};
  Object.entries(MAT).forEach(([key, m]) => {
    const cat = m.category || 'other';
    if (!matGroups[cat]) matGroups[cat] = [];
    matGroups[cat].push([key, m]);
  });
  const matSortedCats = Object.keys(matGroups).sort((a, b) =>
    ((MAT_CATEGORIES[a]||{order:99}).order) - ((MAT_CATEGORIES[b]||{order:99}).order)
  );
  // ── Строим секцию Поставщики ────────────────────────────────────
  const sups = S.suppliers || {};
  const book = S.supplierBook || [];
  const byName = {};
  Object.entries(sups).forEach(([key, v]) => {
    if (!v || (!v.name && !v.phone && !v.note)) return;
    const nm = v.name || '(без названия)';
    if (!byName[nm]) byName[nm] = { name: nm, phone: v.phone||'', note: v.note||'', site: v.site||'', mats: [], matKeys: [] };
    if (MAT[key]) byName[nm].mats.push(MAT[key].name);
    byName[nm].matKeys.push(key);
    if (!byName[nm].phone && v.phone) byName[nm].phone = v.phone;
    if (!byName[nm].note  && v.note)  byName[nm].note  = v.note;
    if (!byName[nm].site  && v.site)  byName[nm].site  = v.site;
  });
  book.forEach(b => {
    if (!byName[b.name]) {
      byName[b.name] = { name: b.name, phone: b.phone||'', note: b.note||'', site: b.site||'', mats: [], matKeys: [], bookId: b.id };
    } else {
      // дополняем из книги если в suppliers данные пустые
      if (!byName[b.name].note  && b.note)  byName[b.name].note  = b.note;
      if (!byName[b.name].phone && b.phone) byName[b.name].phone = b.phone;
      if (!byName[b.name].site  && b.site)  byName[b.name].site  = b.site;
      if (!byName[b.name].bookId) byName[b.name].bookId = b.id;
    }
  });
  const supGroups = Object.values(byName);
  const suppliersHtml = supGroups.length
    ? '<div class="mat-grid">' + supGroups.map(g => {
        const matTags = g.mats.map(name => '<span class="sup-mat-tag">' + name + '</span>').join('');
        const editFn = (g.matKeys && g.matKeys.length)
          ? "openSupplierModal('" + g.matKeys[0] + "')"
          : "openSupplierBookModal('" + (g.bookId||'') + "')";
        return '<div class="sup-card">'
          + '<div class="sup-card-header">'
          + '<div class="sup-card-info">'
          + '<span class="sup-card-name"><i data-lucide="building-2" class="icon"></i> ' + g.name + '</span>'
          + (g.phone ? '<span class="sup-card-phone">' + g.phone + '</span>' : '')
          + '</div>'
          + '<button class="btn btn-outline sup-edit-btn" onclick="' + editFn + '"><i data-lucide="pencil" class="icon"></i></button>'
          + '</div>'
          + (g.note ? '<div class="sup-card-note">' + g.note + '</div>' : '')
          + (g.site ? '<div class="sup-card-note"><a href="' + g.site + '" target="_blank" style="color:var(--muted);text-decoration:none;font-size:12px">🌐 ' + g.site.replace(/^https?:\/\//, '') + '</a></div>' : '')
          + (matTags ? '<div class="sup-card-mats">' + matTags + '</div>' : '')
          + '</div>';
      }).join('') + '</div>'
    : '<div style="color:var(--muted);font-size:13px;padding:16px 0">Поставщики ещё не добавлены. Нажмите <b>+ Поставщик</b> или значок 🚚 у любого сырья.</div>';

  // ── Строим секцию Ингредиенты ────────────────────────────────────
  const matCatTabsHtml = `
    <div class="mat-cat-tabs">
      <button class="mat-cat-tab${_matActiveCat==='all'?' active':''}" onclick="setMatCat('all')">Всё <span>${Object.keys(MAT).length}</span></button>
      ${matSortedCats.map(cat => {
        const lbl = (MAT_CATEGORIES[cat]||{label:cat}).label;
        return `<button class="mat-cat-tab${_matActiveCat===cat?' active':''}" onclick="setMatCat('${cat}')">${lbl} <span>${matGroups[cat].length}</span></button>`;
      }).join('')}
    </div>`;

  // ── Таблица ингредиентов ─────────────────────────────────────────
  const matUsageMap = _buildMatUsageMap();
  window._matUsageMap = matUsageMap;

  const matRowsHtml = matSortedCats.map(cat => {
    const catLabel  = (MAT_CATEGORIES[cat]||{label:cat}).label;
    const collapsed = !!_matCollapsed[cat];
    const catHidden = (_matActiveCat !== 'all' && _matActiveCat !== cat) ? 'display:none' : '';
    const rows = matGroups[cat].map(([key, m]) => {
      const sup      = (S.suppliers||{})[key];
      const supTitle = sup ? `${sup.name||''}${sup.phone?' · '+sup.phone:''}${sup.note?' · '+sup.note:''}` : 'Указать поставщика';
      const supClr   = sup ? 'var(--green)' : 'var(--muted)';
      const supCell  = sup
        ? `<button class="sup-name-btn" onclick="openSupplierInfo('${key}')" title="${(sup.phone||'')} ${(sup.note||'')}">${sup.name||'поставщик'}</button>`
        : `<button class="mat-del" style="font-size:11px;color:var(--muted)" onclick="openSupQuickDrop('${key}',this)" title="Добавить поставщика">+ добавить</button>`;
      const usedIn   = matUsageMap[key] || [];
      const usageBadge = usedIn.length
        ? `<button class="usage-badge" onclick="openMatUsage('mat','${key}')" title="Нажмите, чтобы увидеть рецепты">${usedIn.length}</button>`
        : `<span class="usage-badge usage-badge-zero">0</span>`;
      return `<tr style="${collapsed ? 'display:none' : ''}" class="mat-row${m.custom ? ' mat-row-custom' : ''}" data-cat="${cat}"${m.custom ? ` onclick="openEditMat('${key}')" title="Нажмите для редактирования" style="cursor:pointer"` : ''}>
        <td class="mat-td-name">${m.name}</td>
        <td class="mat-td-unit mob-hide">${m.unit}</td>
        <td class="mat-td-price">
          <input class="inp sm" type="number" min="1" style="width:72px" inputmode="numeric"
            id="mat-inp-${key}" value="${S.prices[key]}"
            onfocus="onMatPriceFocus('${key}')"
            oninput="onMatPriceInput('${key}',this.value)"
            onblur="onMatPriceCommit('${key}',this.value)"
            onclick="event.stopPropagation()"> <span style="font-size:12px;color:var(--muted)">₽</span>
        </td>
        <td class="mat-td-sup mob-hide">${supCell}</td>
        <td class="mat-td-usage">${usageBadge}</td>
        <td class="mat-td-actions">
          <button class="mat-del" onclick="event.stopPropagation();openSupQuickDrop('${key}',this)" title="${supTitle}" style="color:${supClr}"><i data-lucide="truck" class="icon"></i></button>
          <button class="mat-del" onclick="event.stopPropagation();openPriceHistory('${key}')" title="История цен"><i data-lucide="history" class="icon"></i></button>
          ${m.custom ? `<button class="mat-del" onclick="event.stopPropagation();deleteMat('${key}')" title="Удалить" style="color:var(--red)"><i data-lucide="trash-2" class="icon"></i></button>` : ''}
        </td>
      </tr>`;
    }).join('');
    return `<tr class="mat-cat-header" data-cat="${cat}" style="${catHidden}" onclick="toggleMatCat('${cat}')">
        <td colspan="6">
          <span id="mat-cat-icon-${cat}" class="mat-cat-chevron">${collapsed ? '▶' : '▼'}</span>
          ${catLabel}
          <span class="mat-cat-count">${matGroups[cat].length}</span>
        </td>
      </tr>
      <tbody id="mat-tbody-${cat}">${rows}</tbody>`;
  }).join('');

  const matCardsHtml = `<div class="mat-table-wrap">
    <table class="mat-table">
      <thead>
        <tr>
          <th style="width:30%">Название</th>
          <th class="mob-hide" style="width:9%">Ед. изм.</th>
          <th style="width:13%">Цена</th>
          <th class="mob-hide" style="width:20%">Поставщик</th>
          <th class="ta-c" style="width:8%" title="Кол-во рецептов, где используется">Рецепты</th>
          <th style="width:20%">Действия</th>
        </tr>
      </thead>
      ${matRowsHtml}
    </table>
  </div>`;

  // ── Полуфабрикаты ────────────────────────────────────────────────
  const semiUsageMap = _buildSemiUsageMap();
  window._semiUsageMap = semiUsageMap;

  const semiHtml = SEMI.length
    ? `<div class="mat-table-wrap">
        <table class="mat-table">
          <thead>
            <tr>
              <th style="width:33%">Название</th>
              <th class="mob-hide" style="width:12%">Выход</th>
              <th class="mob-hide" style="width:8%">Ед.</th>
              <th style="width:17%">Себестоимость/ед.</th>
              <th class="ta-c" style="width:8%" title="Кол-во рецептов, где используется">Рецепты</th>
              <th style="width:22%">Действия</th>
            </tr>
          </thead>
          <tr class="mat-cat-header" onclick="toggleSemiCat()">
            <td colspan="6">
              <span id="semi-cat-icon" class="mat-cat-chevron">${_semiCollapsed ? '▶' : '▼'}</span>
              Полуфабрикаты
              <span class="mat-cat-count">${SEMI.length}</span>
            </td>
          </tr>
          <tbody id="semi-tbody" style="${_semiCollapsed ? 'display:none' : ''}">
            ${SEMI.map(s => {
              const cost    = calcSemiCostPerUnit(s);
              const recipe  = s.recipe.map(r => {
                const mat = MAT[r.mat];
                return mat ? mat.name + ' ' + r.amt + (mat.unit.replace(/\d+ /,'')) : r.mat;
              }).join(', ');
              const usedIn  = semiUsageMap[String(s.id)] || [];
              const semiUsageBadge = usedIn.length
                ? `<button class="usage-badge" onclick="event.stopPropagation();openMatUsage('semi','${s.id}')" title="Нажмите, чтобы увидеть рецепты">${usedIn.length}</button>`
                : `<span class="usage-badge usage-badge-zero">0</span>`;
              return `<tr class="mat-row" title="Состав: ${recipe}" style="cursor:pointer" onclick="openEditSemi(${s.id})">
                <td class="mat-td-name">${s.name}</td>
                <td class="mat-td-unit mob-hide">${s.yield}</td>
                <td class="mat-td-unit mob-hide">${s.unit}</td>
                <td class="mat-td-price" style="font-weight:700;color:var(--green)">${rubSemi(cost, s.unit)}</td>
                <td class="mat-td-usage">${semiUsageBadge}</td>
                <td class="mat-td-actions">
                  <button class="mat-del" onclick="event.stopPropagation();deleteSemi(${s.id})" title="Удалить" style="color:var(--red)"><i data-lucide="trash-2" class="icon"></i></button>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`
    : `<div style="color:var(--muted);font-size:13px;padding:16px 0">Нет полуфабрикатов. Нажмите «+ Полуфабрикат», чтобы добавить (соусы, сиропы, основы).</div>`;

  const _costEl = document.getElementById('tab-cost');
  const _costScroll = _costEl ? _costEl.scrollTop : 0;
  _costEl.innerHTML = `
    <div class="page-title">
      <span class="page-title-left"><i data-lucide="truck" class="icon"></i> Поставщики</span>
      <button class="btn btn-outline sup-intro-toggle" id="sup-intro-btn" onclick="toggleSupIntro()" title="Подсказка"><i data-lucide="info" class="icon"></i> <span class="sup-btn-txt">Подсказка</span></button>
    </div>
    <div class="tab-intro" id="sup-intro">
      <div class="tab-intro-icon"><i data-lucide="truck" class="icon icon-lg"></i></div>
      <div>
        <div class="tab-intro-title">Поставщики, сырьё и полуфабрикаты</div>
        <div class="tab-intro-text">
          Здесь живёт база всего, из чего делаются напитки. Три секции:<br>
          <strong>Поставщики</strong> — справочник контрагентов. Привяжи каждого к сырью — контакт будет виден прямо в таблице ингредиентов.<br>
          <strong>Ингредиенты</strong> — цены на сырьё. Обновил цену после закупки — себестоимость всех рецептур пересчиталась мгновенно.<br>
          <strong>Полуфабрикаты</strong> — заготовки со своей рецептурой (сиропы, соусы, смеси). Создай один раз и используй как ингредиент в любом напитке.
        </div>
        <div class="tab-intro-steps">
          <span class="tab-intro-step">+ Поставщик — добавь контрагента в справочник</span>
          <span class="tab-intro-step">🚚 в строке ингредиента — привязать поставщика к сырью</span>
          <span class="tab-intro-step">🕐 рядом с ценой — история изменений цены</span>
          <span class="tab-intro-step">+ Полуфабрикат — создай заготовку и используй её в рецептурах</span>
        </div>
      </div>
    </div>

    <div class="cost-subtabs">
      <button class="cost-subtab" onclick="scrollCostTo('cost-section-sup')"><i data-lucide="building-2" class="icon"></i> Поставщики <span>${supGroups.length}</span></button>
      <button class="cost-subtab" onclick="scrollCostTo('cost-section-ing')"><i data-lucide="banknote" class="icon"></i> Ингредиенты <span>${Object.keys(MAT).length}</span></button>
      <button class="cost-subtab" onclick="scrollCostTo('cost-section-semi')"><i data-lucide="layers" class="icon"></i> Полуфабрикаты <span>${SEMI.length}</span></button>
    </div>

    <div id="cost-section-sup"></div>
    <div class="section-title" style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;cursor:pointer" onclick="toggleSupSection()">
      <span style="display:flex;align-items:center;gap:5px"><span class="mat-cat-chevron" id="cost-sup-icon">${_supCollapsed?'▶':'▼'}</span><i data-lucide="building-2" class="icon"></i> Поставщики <span style="background:var(--border);border-radius:20px;padding:1px 7px;font-size:11px;font-weight:700;margin-left:4px">${supGroups.length}</span></span>
      <div style="display:flex;gap:8px" onclick="event.stopPropagation()">
        <button class="btn btn-outline" onclick="exportSuppliersPDF()" title="Скачать список поставщиков (PDF)"><i data-lucide="file-text" class="icon"></i><span class="sup-btn-txt"> PDF</span></button>
        <button class="btn btn-outline" onclick="exportSuppliersXLSX()" title="Скачать список поставщиков (Excel)"><i data-lucide="file-spreadsheet" class="icon"></i><span class="sup-btn-txt"> Excel</span></button>
        <button class="btn btn-outline" onclick="openSuppliersList()"><i data-lucide="list" class="icon"></i><span class="sup-btn-txt"> Полный список</span></button>
        <button class="btn btn-green" onclick="openSupplierBookModal()"><i data-lucide="plus" class="icon"></i><span class="sup-btn-txt"> Поставщик</span></button>
      </div>
    </div>
    <div id="cost-sup-body" style="${_supCollapsed?'display:none':''}">
      ${suppliersHtml}
    </div>

    <div id="cost-section-ing"></div>
    <div class="section-title" style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-top:8px;cursor:pointer" onclick="toggleIngSection()">
      <span style="display:flex;align-items:center;gap:5px"><span class="mat-cat-chevron" id="cost-ing-icon">${_ingCollapsed?'▶':'▼'}</span><i data-lucide="banknote" class="icon"></i> Ингредиенты <span style="background:var(--border);border-radius:20px;padding:1px 7px;font-size:11px;font-weight:700;margin-left:4px">${Object.keys(MAT).length}</span></span>
      <div onclick="event.stopPropagation()" style="display:flex;gap:8px">
        <button class="btn btn-outline" onclick="exportMaterialsPDF()" title="Ингредиенты и п/ф в PDF"><i data-lucide="file-text" class="icon"></i><span class="sup-btn-txt"> PDF</span></button>
        <button class="btn btn-outline" onclick="exportMaterialsXLSX()" title="Ингредиенты и п/ф в Excel"><i data-lucide="file-spreadsheet" class="icon"></i><span class="sup-btn-txt"> Excel</span></button>
        <button class="btn btn-green" onclick="openModal('modal-mat')"><i data-lucide="plus" class="icon"></i><span class="sup-btn-txt"> Сырьё</span></button>
      </div>
    </div>
    <div id="cost-ing-body" style="${_ingCollapsed?'display:none':''}">
      ${matCatTabsHtml}
      ${matCardsHtml}
    </div>

    <div id="cost-section-semi"></div>
    <div class="section-title" style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-top:8px;cursor:pointer" onclick="toggleSemiSection()">
      <span style="display:flex;align-items:center;gap:5px"><span class="mat-cat-chevron" id="cost-semi-icon">${_semiCollapsed?'▶':'▼'}</span><i data-lucide="layers" class="icon"></i> Полуфабрикаты <span style="background:var(--border);border-radius:20px;padding:1px 7px;font-size:11px;font-weight:700;margin-left:4px">${SEMI.length}</span></span>
      <div style="display:flex;gap:8px" onclick="event.stopPropagation()">
        <button class="btn btn-outline" onclick="exportSemiTechCards()" title="Экспорт техкарт полуфабрикатов в PDF"><i data-lucide="file-text" class="icon"></i><span class="sup-btn-txt"> PDF техкарт</span></button>
        <button class="btn btn-green" onclick="openAddSemi()"><i data-lucide="plus" class="icon"></i><span class="sup-btn-txt"> Полуфабрикат</span></button>
      </div>
    </div>
    <div id="cost-semi-body" style="${_semiCollapsed?'display:none':''}">
      ${semiHtml}
    </div>
  `;
  if (window.lucide) lucide.createIcons();
  if (_costScroll) _costEl.scrollTop = _costScroll;
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
      <div class="sales-hdr-actions">
        <button class="btn btn-outline sales-intro-toggle" id="sales-intro-btn" onclick="toggleSalesIntro()" title="Подсказка"><i data-lucide="info" class="icon"></i> <span class="sales-btn-txt">Подсказка</span></button>
        <button class="btn btn-outline" onclick="exportSales()"><i data-lucide="download" class="icon"></i><span class="sales-btn-txt"> Скачать CSV</span></button>
      </div>
    </div>
    <div class="tab-intro" id="sales-intro">
      <div class="tab-intro-icon"><i data-lucide="shopping-cart" class="icon icon-lg"></i></div>
      <div>
        <div class="tab-intro-title">План продаж</div>
        <div class="tab-intro-text">
          Задай количество порций в день для каждого напитка — страница считает <strong>выручку, прибыль, food-cost и средний чек</strong> в реальном времени.<br>
          Используй <strong>пресет</strong> для быстрого старта — готовые шаблоны под разные типы дней.<br>
          Кнопки <strong>±10%</strong> масштабируют весь план сразу. Поле <strong>«Дней в месяце»</strong> — для учёта неполного месяца.<br>
          Все данные автоматически передаются в <strong>Финмодель</strong>.
        </div>
        <div class="tab-intro-steps">
          <span class="tab-intro-step">1. Выбери пресет или заполни порции вручную</span>
          <span class="tab-intro-step">2. Скорректируй ±10% или измени дни в месяце</span>
          <span class="tab-intro-step">3. Следи за KPI: food-cost, средний чек, прибыль/мес</span>
          <span class="tab-intro-step">4. Финмодель пересчитается автоматически</span>
        </div>
      </div>
    </div>
    ${(()=>{const fcClr=wFC>0.3?'var(--red)':wFC>0.25?'#b38600':'var(--green)';const fcBrd=wFC>0.3?'var(--red)':wFC>0.25?'#b38600':'var(--green)';return `
    <div class="sales-kpi-row1">
      <div class="sales-kpi-card sales-kpi-wide">
        <div class="sales-kpi-label">Выручка / мес</div>
        <div class="sales-kpi-val">${rub(totRevMon)}</div>
      </div>
      <div class="sales-kpi-card sales-kpi-wide sales-kpi-green">
        <div class="sales-kpi-label">Прибыль / мес</div>
        <div class="sales-kpi-val" style="color:var(--green)">${rub(totPrfMon)}</div>
      </div>
      <div class="sales-kpi-card sales-kpi-compact">
        <div class="sales-kpi-label">Чашек / день</div>
        <div class="sales-kpi-val">${int(totalPort)}</div>
      </div>
    </div>
    <div class="sales-kpi-row2">
      <div class="sales-kpi-card sales-kpi-compact" style="border-color:${fcBrd}">
        <div class="sales-kpi-label">Food-cost %</div>
        <div class="sales-kpi-val" style="color:${fcClr}">${pct(wFC)}</div>
      </div>
      <div class="sales-kpi-card sales-kpi-compact">
        <div class="sales-kpi-label">Средний чек</div>
        <div class="sales-kpi-val">${rub(avgChk)}</div>
      </div>
      <div class="sales-days-scale">
        <span class="sales-days-label">Дней в месяце:</span>
        <input class="inp sm" type="number" min="1" max="31" inputmode="numeric" value="${S.days}" onchange="onDays(this.value)">
        <button class="btn btn-outline sales-scale-btn red" onclick="scaleSalesPortions(0.90)">−10%</button>
        <button class="btn btn-outline sales-scale-btn green" onclick="scaleSalesPortions(1.10)">+10%</button>
      </div>
    </div>
    <div class="sales-controls-row">
      <div class="sales-preset-wrap">
        <div class="modal-label">Пресет</div>
        <select class="modal-select sales-preset-select" onchange="applySalesPreset(this.value)">  
          <option value="">— выбрать —</option>
          ${Object.entries(SALES_PRESETS).map(([k,p])=>`<option value="${k}"${S.activePreset===k?' selected':''}>${p.label}</option>`).join('')}
        </select>
      </div>
      <div class="search-wrap" style="margin-bottom:0;flex:1;min-width:140px">
        <span class="search-icon"><i data-lucide="search" class="icon"></i></span>
        <input class="search-inp" id="sales-search" type="text" placeholder="Поиск по названию..."
          value="${salesSearch}" oninput="filterSales(this.value);_searchClear(this)">
        <button class="search-clear${salesSearch ? ' visible' : ''}" title="Очистить" onclick="filterSales('');var el=document.getElementById('sales-search');el.value='';_searchClear(el)">✕</button>
      </div>
    </div>
    `})()}
    <div class="table-wrap" id="sales-table-wrap">
      <table>
        <thead><tr>
          ${thSalesSort('name','Напиток','','Название напитка')}
          ${thSalesSort('portions','Порций/день','ta-c','Среднее количество порций в день')}
          ${thSalesSort('revMon','Выручка/мес ₽','ta-r','Выручка за месяц = Цена × Порций × Дней')}
          ${thSalesSort('prfMon','Прибыль/мес ₽','ta-r','Прибыль/шт × Порций × Дней. Попадает в финмодель')}
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

  // Normalize fixedCosts: ensure id + category on all items
  S.fixedCosts.forEach((c, _i) => { if (!c.id) c.id = 1000 + _i; if (!c.category) c.category = 'other'; });
  const effCosts = getEffectiveCosts(totRevMon);
  // Окупаемость — вычислим через те же составляющие что и P&L
  // (переменные статьи из fixedCosts + только постоянные + ФОТ + налог)
  const _fcOnly    = effCosts.filter(c=>!c.isVariable).reduce((s,c)=>s+c.value,0);
  const _varExtra  = effCosts.filter(c=>c.isVariable).reduce((s,c)=>s+c.value,0);
  const _fotAmt    = effCosts.some(c=>/фот|зарплат|зп|оплата.?труда/i.test(c.name)) ? 0 : (typeof payrollTotal==='function'?payrollTotal():0);
  const _ebit      = (totRevMon - varCostsMon - _varExtra) - _fcOnly - _fotAmt;
  const _tax       = calcTax(totRevMon, varCostsMon + _varExtra, _fcOnly + _fotAmt);
  const baseNet    = _ebit - _tax;
  const investment = S.investment || 0;
  const paybackMon = investment > 0 && baseNet > 0 ? (investment / baseNet) : null;

  // Build grouped cost table
  const costTableHtml = (() => {
    let rows = '';
    FIXED_COSTS_CATS.forEach(cat => {
      const items = S.fixedCosts.map((c, idx) => ({ c, idx, ev: effCosts[idx] })).filter(({ c }) => (c.category || 'other') === cat.id);
      if (!items.length) return;
      const catTotal = items.reduce((s, { ev }) => s + ((ev && ev.value) || 0), 0);
      rows += `<tr class="fc-cat-hdr" onclick="toggleFcCat('${cat.id}')"><td colspan="3"><span class="fc-cat-chev" id="fc-chev-${cat.id}">▼</span> ${cat.label} <span class="fc-cat-cnt">${items.length}</span></td><td style="text-align:right"><button class="fc-cat-add" onclick="event.stopPropagation();addFixedCostInCat('${cat.id}')" title="Добавить в эту категорию">+</button> ${rub(catTotal)}</td></tr>`;
      items.forEach(({ c, idx, ev }) => {
        const isFot = !!(ev && ev._fromPayroll);
        const badge = isFot
          ? `<span class="fc-badge fc-fot">авто-ФОТ</span>`
          : c.isPercent
            ? `<span class="fc-badge fc-pct">${c.pct}% · ${c.pctShare ?? 100}% выр.</span>`
            : c.isVariable ? `<span class="fc-badge fc-var">перем.</span>` : `<span class="fc-badge fc-fix">фикс.</span>`;
        const valTxt = c.isPercent
          ? `<span class="fc-pct-amt">≈ ${rub((ev && ev.value) || 0)}</span>`
          : rub((ev && ev.value) || 0);
        const actionBtn = isFot
          ? `<button class="fc-edit-btn" onclick="event.stopPropagation();scrollToPayroll()" title="Перейти к калькулятору ФОТ"><i data-lucide="arrow-down" class="icon" style="width:13px;height:13px"></i></button>`
          : `<button class="fc-edit-btn" onclick="event.stopPropagation();openCostEditor(${idx})" title="Изменить"><i data-lucide="pencil" class="icon" style="width:13px;height:13px"></i></button>`;
        const clickHandler = isFot ? `onclick="scrollToPayroll()"` : `onclick="openCostEditor(${idx})"`;
        const fotHint = isFot ? ` <span style="font-size:11px;color:var(--muted)"> ← из калькулятора ФОТ</span>` : '';
        rows += `<tr class="fc-item${isFot?' fc-item-fot':''}" data-fc-cat="${cat.id}" ${clickHandler}><td class="fc-item-name">${c.name.replace(/</g,'&lt;').replace(/>/g,'&gt;')}${fotHint}</td><td>${badge}</td><td style="text-align:right">${valTxt}</td><td style="text-align:right">${actionBtn}</td></tr>`;
      });
    });
    return `<table class="fc-table"><colgroup><col style="width:44%"><col style="width:18%"><col style="width:26%"><col style="width:12%"></colgroup><thead><tr><th>Название</th><th>Тип</th><th style="text-align:right">₽ / мес</th><th></th></tr></thead><tbody>${rows}</tbody></table>`;
  })();

  const varFixed  = effCosts.filter(c=>c.isVariable).reduce((s,c)=>s+c.value,0);
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
      <div class="scenario-card sc-${sc.cls}${sc.cls==='base'?' sc-base-active':''}">
        ${sc.cls==='base' ? '<div class="sc-your-plan-badge">✦ Ваш план</div>' : ''}
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
  const fixedOnlyCosts    = effCosts.filter(c => !c.isVariable);
  const variableExtraCosts = effCosts.filter(c => c.isVariable);
  const fixedOnlyTotal    = fixedOnlyCosts.reduce((s,c) => s+c.value, 0);
  const variableExtraTotal = variableExtraCosts.reduce((s,c) => s+c.value, 0);
  // ФОТ из калькулятора (объявляем заранее, чтобы использовать в gross/ebit)
  const payrollTotVal2 = payrollTotal();
  const fotInFixed2 = effCosts.some(c => /фот|зарплат|зп|оплата.?труда/i.test(c.name));
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
    lbl: `· ${c.name}${c._fromPayroll ? ' <span style="font-size:10px;opacity:.6">(калькулятор ФОТ)</span>' : ''}`,
    val: -c.value,
    pct: totRevMon > 0 ? c.value / totRevMon : 0,
    sub: true,
    tip: c._fromPayroll ? 'Значение берётся автоматически из калькулятора ФОТ ниже' : undefined,
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
    <div class="page-title">
      <span class="page-title-left"><i data-lucide="banknote" class="icon"></i> Финансовая модель</span>
      <button class="btn btn-outline fin-intro-toggle" id="fin-intro-btn" onclick="toggleFinIntro()" title="Подсказка"><i data-lucide="info" class="icon"></i> <span class="fin-intro-btn-txt">Подсказка</span></button>
    </div>
    <div class="tab-intro" id="fin-intro">
      <div class="tab-intro-icon"><i data-lucide="banknote" class="icon icon-lg"></i></div>
      <div>
        <div class="tab-intro-title">Финансовая модель</div>
        <div class="tab-intro-text">
          Полный <strong>P&amp;L, ТБУ и три сценария</strong> на основе реального плана продаж из вкладки «Продажи».<br>
          Данные синхронизируются автоматически — изменил меню или порции, финмодель пересчиталась.<br>
          Введи стартовые вложения вверху страницы — появится срок окупаемости.
        </div>
        <div class="tab-intro-steps">
          <span class="tab-intro-step">1. Стартовые вложения → срок окупаемости</span>
          <span class="tab-intro-step">2. Расходы и ФОТ → P&amp;L и ТБУ</span>
          <span class="tab-intro-step">3. Моделирование: цена / гости / средний чек</span>
          <span class="tab-intro-step">4. Сезонность: пресеты БЦ, ЖК, лето → прогноз на 12 мес</span>
        </div>
      </div>
    </div>
    <div class="fin-quicknav">
      <button class="fin-qn-btn" onclick="document.getElementById('finblock-1').scrollIntoView({behavior:'smooth'})"><i data-lucide="database" class="icon"></i> Исходные данные</button>
      <button class="fin-qn-btn" onclick="document.getElementById('finblock-2').scrollIntoView({behavior:'smooth'})"><i data-lucide="trending-up" class="icon"></i> Результаты</button>
      <button class="fin-qn-btn" onclick="document.getElementById('finblock-3').scrollIntoView({behavior:'smooth'})"><i data-lucide="sliders" class="icon"></i> Моделирование</button>
      <button class="fin-qn-btn" onclick="document.getElementById('finblock-4').scrollIntoView({behavior:'smooth'})"><i data-lucide="calendar" class="icon"></i> Прогноз</button>
    </div>

    <!-- ─────────────────────────────────── СТАРТОВЫЕ ВЛОЖЕНИЯ (верх страницы) -->
    <div class="fin-invest-top">
      <div class="fin-invest-top-label" data-tip="Сумма денег, вложенных в запуск:&#10;оборудование, ремонт, первый депозит...&#10;Срок окупаемости = инвестиции ÷ чистая прибыль."><i data-lucide="landmark" class="icon"></i> Стартовые вложения, ₽</div>
      <div class="fin-invest-top-row">
        <input class="inp" type="number" min="0" step="50000" inputmode="numeric" style="width:160px;text-align:right"
          value="${investment}" onchange="onInvestment(this.value)" placeholder="0">
        <span style="font-size:12px;color:var(--muted)">₽</span>
        ${paybackMon !== null
          ? `<span class="fin-invest-top-payback"><i data-lucide="clock" class="icon"></i> Окупаемость: <strong style="color:var(--navy)">${paybackMon.toFixed(1)} мес.</strong></span>`
          : investment > 0 && baseNet <= 0
            ? `<span class="fin-invest-top-payback" style="color:var(--red)"><i data-lucide="alert-circle" class="icon"></i> Убыток — окупаемости нет</span>`
            : `<span class="fin-invest-top-payback" style="color:var(--muted)">Введите сумму — увидите срок окупаемости</span>`
        }
      </div>
    </div>

    <!-- ───────────────────────────────────────────── БЛОК 1: ИСХОДНЫЕ ДАННЫЕ -->
    <div class="finblock-hd finblock-hd-1" id="finblock-1">
      <span class="finblock-num">1</span>
      <i data-lucide="database" class="icon"></i> Исходные данные
    </div>

    <div class="section-title" style="display:flex;justify-content:space-between;align-items:center">
      <span><i data-lucide="pin" class="icon"></i> Постоянные расходы (₽/мес)</span>
      <button class="fin-hint-toggle" onclick="toggleFixedHint()"><i data-lucide="${S.fixedHintOpen?'chevron-up':'info'}" class="icon"></i> ${S.fixedHintOpen?'Скрыть':'Что вводить?'}</button>
    </div>
    ${S.fixedHintOpen ? `<div class="hint" style="margin-bottom:12px">
      <i data-lucide="info" class="icon"></i>
      Введите расходы, которые платите каждый месяц независимо от объёма продаж: аренда, коммуналка, интернет, амортизация.
      <br><br>
      <strong>Галочка «перем.»</strong> — отмечайте расходы, которые <em>растут вместе с трафиком</em>: расходники, комиссия агрегаторов и т.п.
      Такие статьи будут масштабироваться в <strong>сценариях</strong> (×0.5 / ×2.0) и на <strong>графике сезонности</strong> —
      в слабые месяцы они уменьшатся, в сильные вырастут. На базовый план и ТБУ галочка не влияет.
    </div>` : ''}
    <div class="fc-table-wrap">${costTableHtml}</div>
    <button class="btn btn-outline" style="margin:4px 0 16px;font-size:13px;display:inline-flex;align-items:center;gap:5px" onclick="addFixedCostInCat('other')">
      <i data-lucide="plus" class="icon"></i> Добавить статью
    </button>
    <div class="panel-dark" style="margin-bottom:20px">
      <div class="pd-label">ИТОГО постоянные расходы</div>
      <div class="pd-value">${rub(totalFixed)}</div>
    </div>

    <div class="fin-param-card" style="max-width:420px;margin-bottom:24px">
      <div class="fin-param-label" data-tip="УСН 6% — налог со всей выручки.&#10;УСН 15% — налог с (доходы − расходы).&#10;Выберите свой режим налогообложения."><i data-lucide="receipt" class="icon"></i> Режим налогообложения</div>
      <select class="modal-select" style="width:100%;font-size:13px" onchange="onTaxMode(this.value)">
        <option value="none"  ${taxMode==='none'  ?'selected':''}>Без налога</option>
        <option value="usn6"  ${taxMode==='usn6'  ?'selected':''}>УСН 6% — доходы</option>
        <option value="usn15" ${taxMode==='usn15' ?'selected':''}>УСН 15% — доходы − расходы</option>
      </select>
      ${taxMode === 'none' ? `
        <div class="tax-hint-box th-none">
          Налог не учитывается в расчётах P&amp;L.
        </div>` : taxMode === 'usn6' ? `
        <div class="tax-hint-box th-usn6">
          <strong>6% от всей выручки</strong> — независимо от расходов.<br>
          <span style="opacity:.8">Выгоден, если расходы &lt; 60% от выручки. Взносы ИП уменьшают налог до 50%.</span>
          <div class="tax-hint-amount">При текущей выручке: <strong>${rub(_tax)} / мес</strong></div>
        </div>` : `
        <div class="tax-hint-box th-usn15">
          <strong>15% от прибыли</strong> (выручка − все расходы).<br>
          <span style="opacity:.8">Выгоден при высоких расходах (&gt; 60% от выручки). Минимальный налог — 1% от выручки.</span>
          <div class="tax-hint-amount">При текущей прибыли: <strong>${rub(_tax)} / мес</strong></div>
        </div>`}
    </div>

    <div id="payroll-section" class="section-title" style="display:flex;align-items:center;justify-content:space-between"><span><i data-lucide="users" class="icon"></i> Калькулятор ФОТ <span style="font-size:12px;font-weight:500;color:var(--muted);margin-left:6px">фонд оплаты труда</span></span><button class="btn btn-outline" style="font-size:12px;padding:5px 12px" onclick="addPayrollPosition()"><i data-lucide="plus" class="icon"></i> Добавить должность</button></div>
    <div class="panel" style="padding:0;margin-bottom:8px;overflow:hidden">
      <div class="payroll-mobile-cards">
        ${(S.payrollPositions||[]).map(p => {
          const _mc = calcPositionCosts(p);
          const _mtype = p.empType || 'black';
          const _msel = ['white','grey','black'].map(t =>
            `<option value="${t}"${_mtype===t?' selected':''}>${EMP_TYPE_LABELS[t]}</option>`
          ).join('');
          return `<div class="pr-mob-card">
            <div class="pr-mob-row1">
              <input class="inp pr-mob-name-inp" type="text" value="${p.name}" oninput="onPayrollPos(${p.id},'name',this.value)" placeholder="Должность">
              <strong class="pr-mob-total">${rub(_mc.total)}</strong>
              <button class="mat-del" onclick="deletePayrollPosition(${p.id})" title="Удалить"><i data-lucide="trash-2" class="icon"></i></button>
            </div>
            <div class="pr-mob-row2">
              <div class="pr-mob-field">
                <span class="pr-mob-field-lbl">Ставка ₽/ч</span>
                <input class="inp pr-mob-inp" type="number" inputmode="numeric" value="${p.rate}" oninput="onPayrollPos(${p.id},'rate',this.value)" onchange="renderFinModel();if(window.lucide)lucide.createIcons()">
              </div>
              <div class="pr-mob-field">
                <span class="pr-mob-field-lbl">Часов/смену</span>
                <input class="inp pr-mob-inp" type="number" inputmode="numeric" value="${p.hours}" oninput="onPayrollPos(${p.id},'hours',this.value)" onchange="renderFinModel();if(window.lucide)lucide.createIcons()">
              </div>
              <div class="pr-mob-field">
                <span class="pr-mob-field-lbl">Смен/мес</span>
                <input class="inp pr-mob-inp" type="number" inputmode="numeric" value="${p.shifts}" oninput="onPayrollPos(${p.id},'shifts',this.value)" onchange="renderFinModel();if(window.lucide)lucide.createIcons()">
              </div>
              <div class="pr-mob-field">
                <span class="pr-mob-field-lbl">Количество</span>
                <input class="inp pr-mob-inp" type="number" inputmode="numeric" value="${p.count}" oninput="onPayrollPos(${p.id},'count',this.value)" onchange="renderFinModel();if(window.lucide)lucide.createIcons()">
              </div>
            </div>
            <div class="pr-mob-row3">
              <select class="payroll-emp-select pr-mob-scheme-sel" onchange="onPayrollPos(${p.id},'empType',this.value)" data-emptype="${_mtype}">${_msel}</select>
              ${_mc.taxes > 0 ? `<span class="pr-mob-tax-badge">+ ${rub(_mc.taxes)} взносы</span>` : '<span class="pr-mob-tax-badge pr-mob-tax-zero">без взносов</span>'}
            </div>
          </div>`;
        }).join('')}
      </div>
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
                <td><input class="inp payroll-inp" id="pr-rate-${p.id}" type="number" min="0" step="10" inputmode="numeric" value="${p.rate}" oninput="onPayrollPos(${p.id},'rate',this.value)" onchange="renderFinModel();if(window.lucide)lucide.createIcons()"></td>
                <td><input class="inp payroll-inp" id="pr-hours-${p.id}" type="number" min="0" max="24" step="1" inputmode="numeric" value="${p.hours}" oninput="onPayrollPos(${p.id},'hours',this.value)" onchange="renderFinModel();if(window.lucide)lucide.createIcons()"></td>
                <td><input class="inp payroll-inp" id="pr-shifts-${p.id}" type="number" min="0" step="1" inputmode="numeric" value="${p.shifts}" oninput="onPayrollPos(${p.id},'shifts',this.value)" onchange="renderFinModel();if(window.lucide)lucide.createIcons()"></td>
                <td><input class="inp payroll-inp" id="pr-count-${p.id}" type="number" min="1" step="1" inputmode="numeric" value="${p.count}" oninput="onPayrollPos(${p.id},'count',this.value)" onchange="renderFinModel();if(window.lucide)lucide.createIcons()"></td>
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
            <input class="inp" type="number" min="0" step="100" inputmode="numeric" value="${PS().mrot}" oninput="onPayrollSetting('mrot',this.value)" style="max-width:160px;text-align:right">
          </div>
          <div class="pts-rate-group">
            <label class="pts-rate-label">НДФЛ, %
              <span class="pts-rate-hint">Стандартная ставка — 13%. С 2025 г. при доходе от 2.4 млн — 15%.</span>
            </label>
            <input class="inp" type="number" min="0" max="50" step="0.1" inputmode="decimal" value="${PS().ndfl}" oninput="onPayrollSetting('ndfl',this.value)" style="max-width:120px;text-align:right">
          </div>
          <div class="pts-rate-group">
            <label class="pts-rate-label">Страховые взносы, %
              <span class="pts-rate-hint">Стандарт — 30%. Для МСП с зарплат свыше МРОТ — 15% (льготный тариф).</span>
            </label>
            <input class="inp" type="number" min="0" max="100" step="0.1" inputmode="decimal" value="${PS().ins}" oninput="onPayrollSetting('ins',this.value)" style="max-width:120px;text-align:right">
          </div>
        </div>
      </div>
      ` : ''}
    </div>

    <!-- ───────────────────────────────────────────── БЛОК 2: РЕЗУЛЬТАТЫ -->
    <div class="finblock-hd finblock-hd-2" id="finblock-2">
      <span class="finblock-num">2</span>
      <i data-lucide="trending-up" class="icon"></i> Результаты
    </div>

    ${warningsBanner}

    <div class="fin-kpi-row">
      <div class="fin-kpi-card">
        <div class="fin-kpi-label"><i data-lucide="trending-up" class="icon"></i> Выручка / мес</div>
        <div class="fin-kpi-val">${rub(totRevMon)}</div>
      </div>
      <div class="fin-kpi-card fin-kpi-costs">
        <div class="fin-kpi-label"><i data-lucide="minus-circle" class="icon"></i> Расходы / мес</div>
        <div class="fin-kpi-val">${rub(totRevMon - baseNet)}</div>
      </div>
      <div class="fin-kpi-card ${baseNet >= 0 ? 'fin-kpi-profit' : 'fin-kpi-loss'}">
        <div class="fin-kpi-label"><i data-lucide="${baseNet >= 0 ? 'check-circle' : 'alert-circle'}" class="icon"></i> Чистая прибыль</div>
        <div class="fin-kpi-val">${rub(baseNet)}</div>
      </div>
      <div class="fin-kpi-card">
        <div class="fin-kpi-label"><i data-lucide="percent" class="icon"></i> FC% (средний)</div>
        <div class="fin-kpi-val" style="color:${avgFC<=0.25?'var(--green)':avgFC<=0.30?'#b38600':'var(--red)'}">${pct(avgFC)}</div>
      </div>
    </div>

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
    <div class="finblock-hd finblock-hd-3" id="finblock-3">
      <span class="finblock-num">3</span>
      <i data-lucide="sliders" class="icon"></i> Моделирование
    </div>

    <div class="section-title" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
      <span><i data-lucide="sliders" class="icon"></i> Pricing wizard — «А что если?» <span style="font-size:12px;font-weight:500;color:var(--muted);margin-left:6px">смоделируйте изменение цен и трафика</span></span>
      <button class="btn btn-outline" style="padding:5px 12px;font-size:12px;flex-shrink:0" onclick="resetWhatIf3()"><i data-lucide="rotate-ccw" class="icon"></i> Сбросить</button>
    </div>
    <div class="panel whatif-panel" style="padding:20px;margin-bottom:24px">
      <div id="whatif-result" class="wif-cards"></div>
      <div class="wif-divider"></div>
      <div class="wif-sliders">
        <div class="wif-slider-card">
          <div class="wif-slider-top">
            <span class="wif-slider-label"><i data-lucide="tag" class="icon" style="color:var(--green)"></i> Цены продажи</span>
            <span class="wif-slider-val" id="wif-price-val">${(_wif.price>=0?'+':'')+_wif.price}%</span>
          </div>
          <input type="range" id="wif-price" min="-50" max="50" step="1" value="${_wif.price}" oninput="onWhatIf3('price',this.value)">
          <div class="whatif-marks"><span>−50%</span><span>0</span><span>+50%</span></div>
        </div>
        <div class="wif-slider-card">
          <div class="wif-slider-top">
            <span class="wif-slider-label"><i data-lucide="package" class="icon" style="color:#b38600"></i> Цены сырья</span>
            <span class="wif-slider-val" id="wif-cost-val">${(_wif.cost>=0?'+':'')+_wif.cost}%</span>
          </div>
          <input type="range" id="wif-cost" min="-50" max="50" step="1" value="${_wif.cost}" oninput="onWhatIf3('cost',this.value)">
          <div class="whatif-marks"><span>−50%</span><span>0</span><span>+50%</span></div>
        </div>
        <div class="wif-slider-card">
          <div class="wif-slider-top">
            <span class="wif-slider-label"><i data-lucide="users" class="icon" style="color:var(--red)"></i> Трафик / порции</span>
            <span class="wif-slider-val" id="wif-traffic-val">${(_wif.traffic>=0?'+':'')+_wif.traffic}%</span>
          </div>
          <input type="range" id="wif-traffic" min="-50" max="50" step="5" value="${_wif.traffic}" oninput="onWhatIf3('traffic',this.value)">
          <div class="whatif-marks"><span>−50%</span><span>0</span><span>+50%</span></div>
        </div>
      </div>
      <div class="hint" style="margin-top:12px"><i data-lucide="info" class="icon"></i> Двигайте слайдеры — сразу увидите как меняются маржа, ТБУ и прибыль</div>
    </div>

    <div class="section-title"><i data-lucide="trending-up" class="icon"></i> Сценарии относительно вашего базового плана</div>
    <div class="panel" style="margin-bottom:16px;font-size:13px;color:var(--muted)">
      Базовый план: <strong style="color:var(--navy)">${int(totalPort)} чашек/день · Выручка ${rub(totRevMon)}/мес</strong>
      → Чистая прибыль: <strong class="${baseNet>=0?'num-pos':'num-neg'}">${rub(baseNet)}</strong>
    </div>
    <div class="scenario-grid">${scenarioCards}</div>

    <!-- ───────────────────────────────────────────── БЛОК 4: ПРОГНОЗ НА ГОД -->
    <div class="finblock-hd finblock-hd-4" id="finblock-4">
      <span class="finblock-num">4</span>
      <i data-lucide="calendar" class="icon"></i> Прогноз на год
    </div>

    <div class="section-title"><i data-lucide="calendar" class="icon"></i> Сезонность <span style="font-size:12px;font-weight:500;color:var(--muted);margin-left:6px">прогноз прибыли по 12 месяцам</span></div>

    <!-- Пресеты -->
    <div class="season-presets">
      <button class="season-preset-btn" onclick="applySeasonPreset('flat')"><i data-lucide="minus" class="icon"></i> Равномерно</button>
      <button class="season-preset-btn" onclick="applySeasonPreset('summer')">&#9728; Лето +30%</button>
      <button class="season-preset-btn" onclick="applySeasonPreset('bc')">🏢 Кофейня в БЦ</button>
      <button class="season-preset-btn" onclick="applySeasonPreset('jk')">🏘️ Кофейня в ЖК</button>
    </div>

    <!-- Сетка 12 ячеек -->
    <div class="season-grid">
      ${['\u042fнв','\u0424ев','\u041cар','\u0410пр','\u041cай','\u0418юн','\u0418юл','\u0410вг','\u0421ен','\u041eкт','\u041dоя','\u0414ек'].map((m,i) => {
        const k = (S.seasonality||Array(12).fill(1))[i];
        const pct = Math.round(k*100);
        const cls = k > 1.05 ? 'season-cell-up' : k < 0.95 ? 'season-cell-down' : '';
        return `<button class="season-cell ${cls}" onclick="openSeasonDrawer(${i})">
          <span class="season-cell-mon">${m}</span>
          <span class="season-cell-pct" id="scell-${i}">${pct}%</span>
        </button>`;
      }).join('')}
    </div>

    <!-- Drawer -->
    <div class="season-drawer" id="season-drawer">
      <div class="season-drawer-header">
        <span class="season-drawer-title" id="season-drawer-title">Январь</span>
        <button class="season-drawer-close" onclick="closeSeasonDrawer()"><i data-lucide="x" class="icon"></i></button>
      </div>
      <div class="season-drawer-body">
        <div class="season-drawer-val" id="season-drawer-val">100%</div>
        <input type="range" id="season-drawer-range" class="season-drawer-range" min="30" max="200" step="5" value="100" oninput="onSeasonDrawerChange(this.value)">
        <div class="season-drawer-marks"><span>30%</span><span>100%</span><span>200%</span></div>
        <div class="season-drawer-hint">100% = базовый месяц &nbsp;·&nbsp; <span style="color:var(--green)">120%</span> = +20% &nbsp;·&nbsp; <span style="color:var(--red)">80%</span> = −20%</div>
      </div>
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

let _mvdId = null;
function openViewDrink(id) {
  const d = DRINKS.find(x => x.id === id);
  if (!d) return;
  _mvdId = id;
  const enriched = enrich();
  const abcMap = {}; const abcTipMap = {};
  withABC(enriched).forEach(x => { abcMap[x.id] = x.abc; abcTipMap[x.id] = x.abcTip; });
  const ings = d.recipe.map(ing => {
    if (ing.semi != null) {
      const s = SEMI.find(x => x.id === ing.semi);
      if (!s) return null;
      const factor = _semiDrinkFactor(s);
      const dispAmt = ing.amt; // хранится в кг/л — показываем как есть
      const su = (s.unit || '').toLowerCase();
      const sUnit = (factor === 1000) ? (su.startsWith('г') ? 'кг' : 'л') : s.unit;
      return { name: s.name + ' <span style="font-size:10px;background:#e8f5e9;color:var(--green);border-radius:4px;padding:1px 4px;font-weight:700">п/ф</span>', dispAmt, unit: sUnit, cost: calcIngCost(ing) };
    }
    if (!MAT[ing.mat]) return null;
    const factor = _semiUnitFactor(ing.mat);
    const dispAmt = parseFloat((ing.amt / factor).toPrecision(4));
    const unit = _matDisplayUnit(ing.mat);
    return { name: MAT[ing.mat].name, dispAmt, unit, cost: calcIngCost(ing) };
  }).filter(Boolean);
  const totalCost = ings.reduce((s,i) => s + i.cost, 0);
  const price = S.salePrices[d.id] || 0;
  const fc = price > 0 ? totalCost / price : 0;
  const fcClr = fc <= 0.25 ? 'var(--green)' : fc <= 0.30 ? '#b38600' : 'var(--red)';
  const nut = calcNutrition(d);
  const GROUP_ICONS = { hot:'coffee', tea:'leaf', cold:'snowflake', filter:'filter' };
  const _img = getDrinkImage(d);
  const imgHtml = _img
    ? `<div class="mvd-photo-wrap"><img src="${_img}" alt="${d.name}" class="mvd-photo" onerror="this.closest('.mvd-photo-wrap').style.display='none'"></div>`
    : '';
  const ingRows = ings.map(ing => {
    const share = totalCost > 0 ? (ing.cost / totalCost * 100).toFixed(0) : 0;
    return `<div class="recipe-ing">
      <span class="recipe-ing-name">${ing.name}</span>
      <span style="font-size:10px;color:var(--muted);flex-shrink:0">${ing.dispAmt} ${ing.unit}</span>
      <span class="recipe-ing-share">${share}%</span>
      <span class="recipe-ing-cost">${rub(ing.cost)}</span>
    </div>`;
  }).join('');
  const processHtml = d.process
    ? `<div class="mvd-section"><div class="mvd-section-title"><i data-lucide="chef-hat" class="icon"></i> Процесс приготовления</div><div class="mvd-process">${d.process.replace(/\n/g,'<br>')}</div></div>`
    : '';
  const videoHtml = d.videoUrl
    ? `<a class="recipe-card-video" href="${d.videoUrl}" target="_blank" rel="noopener" style="margin-top:4px;display:inline-flex"><i data-lucide="play-circle" class="icon"></i> Смотреть видео рецепт</a>`
    : '';
  document.getElementById('mvd-title').textContent = d.name;
  document.getElementById('mvd-content').innerHTML = `
    ${imgHtml}
    <div class="mvd-meta">
      <span class="mvd-meta-group">${GROUP_LABEL[d.group]||d.group}</span>
      <span class="mvd-meta-vol">${d.vol} мл</span>
      <span style="font-weight:700;color:${fcClr}">FC ${pct(fc)}</span>
      ${abcBadge(abcMap[id]||'C', abcTipMap[id]||'')}
    </div>
    <div class="mvd-section">
      <div class="mvd-section-title"><i data-lucide="package" class="icon"></i> Состав</div>
      ${ingRows}
      <div class="recipe-total"><span>Себестоимость</span><span>${rub(totalCost)}</span></div>
      <div class="recipe-total" style="font-weight:400;font-size:12px;color:var(--muted)"><span>Цена продажи</span><span>${rub(price)}</span></div>
      <div class="recipe-total" style="color:var(--navy)"><span>Прибыль</span><span>${rub(price - totalCost)}</span></div>
    </div>
    <div class="mvd-section">
      <div class="mvd-section-title"><i data-lucide="activity" class="icon"></i> КБЖУ на порцию</div>
      <div class="mvd-nutrition">
        <div class="mvd-nut-item"><span class="mvd-nut-val">${nut.kcal}</span><span class="mvd-nut-lbl">ккал</span></div>
        <div class="mvd-nut-item"><span class="mvd-nut-val">${nut.protein}</span><span class="mvd-nut-lbl">белки, г</span></div>
        <div class="mvd-nut-item"><span class="mvd-nut-val">${nut.fat}</span><span class="mvd-nut-lbl">жиры, г</span></div>
        <div class="mvd-nut-item"><span class="mvd-nut-val">${nut.carbs}</span><span class="mvd-nut-lbl">углеводы, г</span></div>
      </div>
    </div>
    ${processHtml}
    ${videoHtml}
  `;
  openModal('modal-drink-view');
  if (window.lucide) lucide.createIcons({ nodes: [document.getElementById('modal-drink-view')] });
  const hasSemi = d.recipe.some(r => r.semi != null);
  const semiBtn = document.getElementById('mvd-semi-pdf-btn');
  if (semiBtn) semiBtn.style.display = hasSemi ? '' : 'none';
}
function mvdOpenEdit() {
  closeModal('modal-drink-view');
  if (_mvdId !== null) openEditDrink(_mvdId);
}

function mvdToggleDownload(e) {
  e.stopPropagation();
  const menu = document.getElementById('mvd-download-menu');
  menu.classList.toggle('open');
  const close = () => { menu.classList.remove('open'); document.removeEventListener('click', close); };
  if (menu.classList.contains('open')) setTimeout(() => document.addEventListener('click', close), 0);
}

function _mvdGetData() {
  const d = DRINKS.find(x => x.id === _mvdId);
  if (!d) return null;
  const ings = d.recipe.filter(ing => MAT[ing.mat]).map(ing => ({
    name: MAT[ing.mat].name,
    amt:  ing.amt,
    unit: MAT[ing.mat].unit,
    cost: calcIngCost(ing),
    loss: ing.loss || 0
  }));
  const totalCost = ings.reduce((s, i) => s + i.cost, 0);
  const price     = S.salePrices[d.id] || 0;
  const profit    = price - totalCost;
  const fc        = price > 0 ? totalCost / price : 0;
  const nut       = calcNutrition(d);
  const GROUP_NAMES = { hot: 'Горячие кофейные', tea: 'Чай и матча', cold: 'Холодные напитки', filter: 'Фильтр-кофе' };
  return { d, ings, totalCost, price, profit, fc, nut, groupName: GROUP_NAMES[d.group] || d.group };
}

// ─── Общий CSS для всех техкарт ────────────────────────────────────
function _techCardCSS() {
  return `
  @import url('https://fonts.googleapis.com/css2?family=Mulish:wght@400;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Mulish', Arial, sans-serif; font-size: 9.5pt; color: #222; padding-top: 52px; }
  @page { size: A4; margin: 15mm 12mm; }
  .card { padding: 0 0 10px; }
  .pb { page-break-after: always; }
  .card-header-inner { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
  .approve { text-align: left; border: 1px solid #aaa; padding: 8px 12px; font-size: 9pt; min-width: 220px; }
  .drink-photo { width: 160px; height: 120px; object-fit: cover; border-radius: 4px; border: 1px solid #ccc; display: block; }
  h1 { text-align: center; font-size: 13pt; margin: 8px 0 2px; }
  .gost { text-align: center; font-size: 9pt; color: #555; margin-bottom: 12px; }
  h2 { font-size: 10pt; color: #417033; margin: 12px 0 5px; text-transform: uppercase; break-after: avoid; }
  .section { break-inside: avoid; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 9pt; }
  th { background: #417033; color: #fff; padding: 4px 6px; text-align: left; }
  td { padding: 3px 6px; border: 1px solid #ccc; }
  table.info td, table.qa td { border: 1px solid #bbb; }
  .lbl { font-weight: bold; background: #f0f5ee; width: 38%; }
  .r { text-align: right; } .c { text-align: center; } .b { font-weight: bold; }
  tr.total td { font-weight: bold; background: #f0f5ee; }
  .tech { line-height: 1.5; margin-bottom: 8px; }
  .sign { display: flex; justify-content: space-between; margin-top: 20px; font-size: 9pt; }
  .print-bar { position: fixed; top: 0; left: 0; right: 0; z-index: 999; background: #417033; color: #fff;
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 20px; gap: 12px; box-shadow: 0 2px 8px rgba(0,0,0,.25); font-family: 'Mulish', Arial, sans-serif; font-size: 13px; }
  .print-bar strong { font-size: 14px; }
  .print-bar button { background: #fff; color: #417033; border: none; border-radius: 6px; padding: 8px 20px; font-size: 13px; font-weight: 700; cursor: pointer; }
  .print-bar button:hover { background: #e7f2e3; }
  .mbs-footer { text-align: right; margin-top: 28px; padding-top: 6px;
    border-top: 1px solid #ddd; font-family: 'Mulish', Arial, sans-serif;
    font-size: 8pt; color: #888; }
  @media print { .print-bar { display: none; } body { padding-top: 0; }
    th, .lbl, tr.total td { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`;
}// ─── Генерация HTML одной карточки ──────────────────────────────────
function _buildTechCardBlock(d, org, cardNum, isLast) {
  // org может быть строкой (обратная совместимость) или объектом
  if (typeof org === 'string') org = { name: org, legalName: org, ceoTitle: 'Руководитель', ceoName: '', address: '' };
  const orgName = org.name || 'Кофейня';
  const today = new Date().toLocaleDateString('ru');
  const year  = new Date().getFullYear();
  const GROUP_NAMES = { hot:'Горячие кофейные', tea:'Чай и матча', cold:'Холодные напитки', filter:'Фильтр-кофе' };
  const isCold = d.group === 'cold';

  const _dq = DRINK_QUALITY[d.id] || {};
  const qaAppearance  = d.appearance  || _dq.appearance  || '';
  const qaTaste       = d.taste       || _dq.taste       || '';
  const qaConsistency = d.consistency || _dq.consistency || '';
  const qaColor       = _dq.color || '';
  const storageLife   = d.storage_life  || (isCold ? '30 минут с момента приготовления' : '15 минут с момента приготовления');
  const servingTemp   = d.storage_temp  || (isCold ? 'не выше +10°C' : 'не ниже 60°C');

  const recipeRows = d.recipe.map(r => {
    if (r.semi != null) {
      const s = SEMI.find(x => x.id === r.semi);
      if (!s) return '';
      const cost = calcIngCost(r);
      const brutto = r.loss ? (r.amt / (1 - (r.loss||0))).toFixed(1) : r.amt.toString();
      const loss = r.loss ? (r.loss * 100).toFixed(0) + '%' : '—';
      return `<tr><td>${s.name} <sup style="font-size:7pt;color:#2a7a2a">[п/ф]</sup></td><td class="c">${s.unit}</td><td class="r">${brutto}</td><td class="r">${r.amt}</td><td class="c">${loss}</td><td class="r b">${Math.round(cost)} ₽</td></tr>`;
    }
    if (!MAT[r.mat]) return '';
    const m      = MAT[r.mat];
    const loss   = r.loss ? (r.loss * 100).toFixed(0) + '%' : '—';
    const brutto = r.loss ? (r.amt / (1 - r.loss)).toFixed(1) : r.amt.toString();
    const cost   = calcIngCost(r);
    return `<tr><td>${m.name}</td><td class="c">${m.unit.replace(/^1\s*/,'')}</td><td class="r">${brutto}</td><td class="r">${r.amt}</td><td class="c">${loss}</td><td class="r b">${Math.round(cost)} ₽</td></tr>`;
  }).join('');
  const totalCost = d.recipe.reduce((s,r) => s + calcIngCost(r), 0);

  // Блок раскрытых полуфабрикатов
  const usedSemis = d.recipe.filter(r => r.semi != null).map(r => SEMI.find(s => s.id === r.semi)).filter(Boolean);
  // Стоимость ингредиента полуфабриката (с учётом _semiUnitFactor)
  const _semiIngCostPDF = r => {
    if (!MAT[r.mat]) return 0;
    let c = ((S.prices[r.mat] || MAT[r.mat].price) / MAT[r.mat].size) * r.amt * _semiUnitFactor(r.mat);
    if (r.loss) c = c / (1 - r.loss);
    return c;
  };
  const semiBlock = usedSemis.length ? `
  <h2>Используемые полуфабрикаты</h2>
  ${usedSemis.map(s => {
    const semiCostPer = calcSemiCostPerUnit(s);
    const rows = (s.recipe||[]).filter(r => MAT[r.mat]).map(r => {
      const m = MAT[r.mat];
      const loss = r.loss ? (r.loss*100).toFixed(0)+'%' : '—';
      const brutto = r.loss ? (r.amt/(1-r.loss)).toFixed(1) : r.amt.toString();
      const cost = _semiIngCostPDF(r);
      return `<tr><td>${m.name}</td><td class="c">${m.unit.replace(/^1\s*/,'')}</td><td class="r">${brutto}</td><td class="r">${r.amt}</td><td class="c">${loss}</td><td class="r b">${Math.round(cost)} ₽</td></tr>`;
    }).join('');
    const semiTotal = (s.recipe||[]).reduce((sum,r) => sum + _semiIngCostPDF(r), 0);
    return `<p style="font-weight:700;margin:8pt 0 3pt">${s.name} — выход ${s.yield} ${s.unit}, себест. ${Math.round(semiCostPer)} ₽/${s.unit}</p>
    <table>
      <thead><tr><th>Сырьё</th><th>Ед.</th><th>Брутто</th><th>Нетто</th><th>Потери</th><th>Стоимость</th></tr></thead>
      <tbody>${rows}
      <tr class="total"><td colspan="5">ИТОГО сырья</td><td class="r b">${Math.round(semiTotal)} ₽</td></tr>
      </tbody>
    </table>
    ${s.process ? `<p style="font-size:9pt;color:#555;margin-top:4pt">${s.process.replace(/\n/g,'<br>')}</p>` : ''}`;
  }).join('')}` : '';

  const techText = d.process
    ? d.process.replace(/\n/g,'<br>')
    : d.group === 'hot'
      ? 'В подготовленную чашку приготовить эспрессо (одинарный/двойной согласно рецептуре). Вспенить молоко/сливки до температуры 60–65°C. Соединить компоненты согласно технологии напитка. При необходимости добавить сиропы/добавки. Подавать немедленно при температуре 60–65°C.'
      : d.group === 'tea'
      ? 'Чай: заварить кипятком (95°C) согласно дозировке, настаивать 3–5 минут. Матча: венчиком взбить порошок матча с горячей водой (80°C) до однородной пены, добавить молоко температурой 60°C. Подавать при температуре 60–65°C.'
      : 'Все компоненты предварительно охладить до +4°C. В стакан со льдом (3–4 кубика) последовательно влить ингредиенты согласно рецептуре. Перемешать барной ложкой. Подавать немедленно при температуре +4…+8°C.';

  const qaBlock = (qaAppearance || qaTaste || qaConsistency || qaColor)
    ? `<table class="qa">
      ${qaAppearance  ? `<tr><td class="lbl">Внешний вид</td><td>${qaAppearance}</td></tr>` : ''}
      ${qaConsistency ? `<tr><td class="lbl">Консистенция</td><td>${qaConsistency}</td></tr>` : ''}
      ${qaColor       ? `<tr><td class="lbl">Цвет</td><td>${qaColor}</td></tr>` : ''}
      ${qaTaste       ? `<tr><td class="lbl">Вкус и запах</td><td>${qaTaste}</td></tr>` : ''}
    </table>`
    : '<p style="color:#999;font-size:9pt">Показатели не заполнены</p>';


  const nut = calcNutrition(d);

  return `<div class="card${isLast ? '' : ' pb'}">
  <div class="card-header-inner">
    <div class="org-block">
      ${org.legalName ? `<div style="font-weight:700;font-size:10pt">${org.legalName}</div>` : ''}
      ${orgName !== org.legalName ? `<div style="font-size:9pt;color:#555">${orgName}</div>` : ''}
      ${org.address ? `<div style="font-size:8.5pt;color:#666">${org.address}</div>` : ''}
    </div>
    <div class="approve">
      <div><b>УТВЕРЖДАЮ:</b></div>
      <div>${org.ceoTitle || 'Руководитель'} ${org.legalName || orgName}</div>
      <div style="margin-top:8px">${org.ceoName || '_______________________'}</div>
      <div style="margin-top:4px;color:#888">(${org.ceoName ? 'подпись' : 'Ф.И.О.'})</div>
      <div style="margin-top:6px">«__» ____________ ${year} г.</div>
    </div>
  </div>
  ${getDrinkImage(d) ? `<img src="${getDrinkImage(d)}" alt="${d.name}" class="drink-photo" style="display:block;margin:0 auto 8px;width:160px;height:120px;object-fit:cover;border-radius:4px;border:1px solid #ccc" onerror="this.style.display='none'">` : ''}
  <h1>ТЕХНОЛОГИЧЕСКАЯ КАРТА № ${cardNum}</h1>
  <p class="gost">(по ГОСТ Р 53105-2008)</p>
  <table class="info">
    <tr><td class="lbl">Наименование изделия</td><td>${d.name}</td></tr>
    <tr><td class="lbl">Группа</td><td>${GROUP_NAMES[d.group] || '—'}</td></tr>
    <tr><td class="lbl">Выход готового изделия</td><td>${d.vol} мл (1 порция)</td></tr>
    <tr><td class="lbl">Дата составления</td><td>${today}</td></tr>
    <tr><td class="lbl">Срок реализации</td><td>${storageLife}</td></tr>
    <tr><td class="lbl">Температура подачи</td><td>${servingTemp}</td></tr>
    <tr><td class="lbl">Условия хранения сырья</td><td>+2…+6 °C для молочных продуктов, сухие при +18 °C</td></tr>
  </table>

  <div class="section">
  <h2>1. Характеристика сырья</h2>
  <p style="font-size:9pt;line-height:1.5;margin-bottom:8px">Продовольственное сырьё, пищевые продукты и полуфабрикаты, используемые для приготовления блюда, должны соответствовать требованиям действующих нормативных документов, иметь сопроводительные документы, подтверждающие их качество и безопасность (ТР ТС 021/2011).</p>
  </div>

  <div class="section">
  <h2>2. Рецептура</h2>
  <table>
    <thead><tr><th>Сырьё / полуфабрикат</th><th>Ед.</th><th>Брутто</th><th>Нетто</th><th>Потери</th><th>Стоимость</th></tr></thead>
    <tbody>${recipeRows}
    <tr class="total"><td colspan="5">ИТОГО</td><td class="r b">${Math.round(totalCost)} ₽</td></tr>
    </tbody>
  </table>
  </div>

  <div class="section">
  <h2>3. Технология приготовления</h2>
  <p class="tech">${techText}</p>
  ${semiBlock}
  </div>

  <div class="section">
  <h2>4. Требования к оформлению и подаче</h2>
  <p style="font-size:9pt;line-height:1.5;margin-bottom:8px">Подают в чистой посуде объёмом ${d.vol} мл. Температура подачи: ${servingTemp}. Срок реализации: ${storageLife}. Напиток подаётся немедленно после приготовления.</p>
  </div>

  <div class="section">
  <h2>5. Показатели качества и безопасности</h2>
  ${qaBlock}
  <p style="font-size:8.5pt;color:#444;margin-top:6px;line-height:1.5">Микробиологические показатели блюда соответствуют требованиям ТР ТС 021/2011 «О безопасности пищевой продукции», Приложение 1, индекс 6.2.</p>
  </div>

  <div class="section">
  <h2>6. Пищевая ценность (1 порция, ${d.vol} мл)</h2>
  <table class="qa">
    <tr><td class="lbl">Белки, г</td><td class="lbl">Жиры, г</td><td class="lbl">Углеводы, г</td><td class="lbl">Энергетическая ценность, ккал</td></tr>
    <tr><td>${nut.protein.toFixed(1)}</td><td>${nut.fat.toFixed(1)}</td><td>${nut.carbs.toFixed(1)}</td><td>${nut.kcal.toFixed(0)}</td></tr>
  </table>
  </div>

  <div class="section">
  <div class="sign">
    <span>Технолог: ____________________</span>
    <span>Зав. производством: ____________________</span>
  </div>
  </div>
</div>`;
}

// ─── Универсальная печать через скрытый iframe (надёжно в Safari) ───
function _printViaIframe(html, filename) {
  // Удаляем старый iframe, если был
  const old = document.getElementById('mbs-print-iframe');
  if (old) old.remove();

  const iframe = document.createElement('iframe');
  iframe.id = 'mbs-print-iframe';
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  if (filename) iframe.setAttribute('name', filename); // подсказка имени для «Сохранить PDF»
  document.body.appendChild(iframe);

  const doIt = () => {
    try {
      const cw = iframe.contentWindow;
      cw.focus();
      cw.print();
    } catch(e) {
      alert('Не удалось открыть диалог печати: ' + e.message);
    }
    // Удаляем iframe позже — после закрытия диалога
    setTimeout(() => { iframe.remove(); }, 2000);
  };

  // Пишем HTML в iframe
  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  // Ждём загрузки картинок и шрифтов
  const imgs = doc.images ? Array.from(doc.images) : [];
  if (imgs.length === 0) {
    setTimeout(doIt, 250);
  } else {
    let loaded = 0;
    const done = () => { if (++loaded >= imgs.length) setTimeout(doIt, 200); };
    imgs.forEach(img => {
      if (img.complete) done();
      else { img.addEventListener('load', done); img.addEventListener('error', done); }
    });
    // Страховка — на случай зависших картинок
    setTimeout(() => { if (loaded < imgs.length) doIt(); }, 3000);
  }
}

// ─── Открыть окно с техкартами / запустить печать ───────────────────
// autoprint: число мс перед автопечатью; 0 — открыть превью без автопечати.
function _openTechCardsWindow(title, hint, pages, autoprint) {
  // CSS без .print-bar (печатаем напрямую через iframe)
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
<style>${_techCardCSS()}
body { padding-top: 0; }
</style></head><body>
${pages}
<div class="mbs-footer">Московская школа бариста &nbsp;·&nbsp; baristaschool.ru</div>
</body></html>`;
  _printViaIframe(html, title);
}

// ─── PDF одной техкарты (из карточки напитка) ───────────────────────
function mvdDownloadSemiPDF() {
  document.getElementById('mvd-download-menu').classList.remove('open');
  const d = DRINKS.find(x => x.id === _mvdId);
  if (!d) return;
  const usedSemis = d.recipe
    .filter(r => r.semi != null)
    .map(r => SEMI.find(s => s.id === r.semi))
    .filter(Boolean);
  if (!usedSemis.length) return;
  const org = getOrgInfo();
  const pages = usedSemis.map((s, idx) =>
    _buildSemiTechCardBlock(s, org, idx + 1, idx === usedSemis.length - 1)
  ).join('\n');
  _openTechCardsWindow(
    `Техкарты п/ф — ${d.name} (${org.name})`,
    `${usedSemis.length} карт · ${new Date().toLocaleDateString('ru')}`,
    pages,
    400
  );
}

function mvdDownloadPDF() {
  document.getElementById('mvd-download-menu').classList.remove('open');
  const data = _mvdGetData(); if (!data) return;
  const { d } = data;
  const org = getOrgInfo();
  const cardNum = DRINKS.findIndex(x => x.id === d.id) + 1;
  const page = _buildTechCardBlock(d, org, cardNum, true);
  _openTechCardsWindow(`Техкарта — ${d.name}`, '', page, 0);
}
async function mvdDownloadExcel() {
  document.getElementById('mvd-download-menu').classList.remove('open');
  if (!window.ExcelJS) { alert('Библиотека ExcelJS не загрузилась. Проверьте интернет.'); return; }
  const data = _mvdGetData(); if (!data) return;
  const { d, ings, totalCost, price, profit, fc, nut, groupName } = data;
  const today  = new Date().toLocaleDateString('ru');
  const year   = new Date().getFullYear();
  const isCold = d.group === 'cold';
  const cardNum = DRINKS.findIndex(x => x.id === d.id) + 1;
  const orgName = getOrgInfo().name;[d.id] || {};
  const q = {
    appearance:  d.appearance  || _dq2.appearance  || '',
    taste:       d.taste       || _dq2.taste       || '',
    consistency: d.consistency || _dq2.consistency || '',
    color:       _dq2.color    || ''
  };

  // брутто/нетто/потери из оригинального рецепта
  const recipeRows = d.recipe.filter(r => MAT[r.mat]).map(r => {
    const m      = MAT[r.mat];
    const loss   = r.loss ? +(r.loss * 100).toFixed(1) : null;
    const brutto = r.loss ? +(r.amt / (1 - r.loss)).toFixed(1) : r.amt;
    const cost   = calcIngCost(r);
    return { name: m.name, unit: m.unit.replace(/^1\s*/,''), brutto, netto: r.amt, loss, cost };
  });


  // ══════════════════════════════════════════════════════════════
  //   ГОСТ Р 53105-2008 — структура идентична PDF-техкарте
  // ══════════════════════════════════════════════════════════════

  // ── цвета (совпадают с PDF) ────────────────────────────────────
  const C_GREEN  = 'FF417033';   // заголовки секций
  const C_LGREEN = 'FFF0F5EE';   // фон .lbl ячеек
  const C_WHITE  = 'FFFFFFFF';
  const C_GREY   = 'FFF5F5F5';
  const C_BORDER = 'FFBBBBBB';

  // ── хелперы ───────────────────────────────────────────────────
  const F = (argb) => ({ type:'pattern', pattern:'solid', fgColor:{ argb } });
  const FONT = (bold=false, size=10, argb='FF222222') => ({ name:'Arial', size, bold, color:{ argb } });
  const BORDER = () => {
    const s = { style:'thin', color:{ argb: C_BORDER } };
    return { top:s, bottom:s, left:s, right:s };
  };
  const AL = (h='left', v='middle', wrap=false) => ({ horizontal:h, vertical:v, wrapText:wrap });

  // ── книга ─────────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook();
  wb.creator = 'MBS Coffee Menu';
  const ws = wb.addWorksheet('Техкарта', {
    pageSetup:{ paperSize:9, orientation:'portrait', fitToPage:true, fitToWidth:1, margins:{ left:0.47, right:0.47, top:0.59, bottom:0.59 } }
  });

  // 6 колонок: A-F
  ws.columns = [
    { key:'A', width:5  },   // №
    { key:'B', width:30 },   // название ингредиента / метка
    { key:'C', width:11 },   // брутто / значение
    { key:'D', width:11 },   // нетто
    { key:'E', width:10 },   // потери / ед.
    { key:'F', width:14 },   // стоимость
  ];

  let R = 1; // текущая строка

  // ── вспомогательные функции построения ────────────────────────
  const cell = (col, r) => ws.getCell(`${col}${r}`);
  const merge = (r1, c1, r2, c2) => ws.mergeCells(r1, c1, r2, c2);

  // Авто-высота строки по длине текста и ширине колонки (символов)
  function autoH(text, colWidthChars, minH = 18) {
    if (!text) return minH;
    const str = String(text);
    // приблизительно: 1 строка = 14px, символ ≈ 1 ед. ширины
    const lines = str.split('\n').reduce((acc, line) => {
      return acc + Math.ceil(line.length / colWidthChars);
    }, 0);
    return Math.max(minH, lines * 15);
  }

  function sectionHeader(label, row) {
    merge(row, 1, row, 6);
    const c = cell('A', row);
    c.value     = label.toUpperCase();
    c.font      = FONT(true, 10, C_WHITE);
    c.fill      = F(C_GREEN);
    c.alignment = AL('left');
    ws.getRow(row).height = 20;
  }

  function infoRow(label, value, row) {
    merge(row, 1, row, 2);
    merge(row, 3, row, 6);
    const lc = cell('A', row);
    lc.value     = label;
    lc.font      = FONT(true, 10);
    lc.fill      = F(C_LGREEN);
    lc.alignment = AL('left', 'middle', true);
    lc.border    = BORDER();
    const vc = cell('C', row);
    vc.value     = value;
    vc.font      = FONT(false, 10);
    vc.fill      = F(C_WHITE);
    vc.alignment = AL('left', 'middle', true);
    vc.border    = BORDER();
    // авто-высота: значение идёт в 4 колонки (C-F), суммарная ширина ~46
    ws.getRow(row).height = autoH(value, 46);
  }

  // ══ БЛОК 1: ШАПКА (фото слева + «Утверждаю» справа) ══════════

  const PHOTO_ROWS = 6; // строки 1-6 отведены под фото / утверждаю

  // «Утверждаю» — колонки D-F, строки 1-4
  merge(1, 4, 1, 6);
  const appr1 = cell('D', 1);
  appr1.value     = `Утверждаю: руководитель ${orgName}`;
  appr1.font      = FONT(true, 10);
  appr1.alignment = AL('left', 'middle', true);
  // высота первой строки под длину названия (ширина D-F ≈ 35 символов)
  ws.getRow(1).height = autoH(`Утверждаю: руководитель ${orgName}`, 33, 22);

  merge(2, 4, 2, 6);
  cell('D', 2).value = '_______________________';
  cell('D', 2).font  = FONT(false, 10, 'FF888888');
  ws.getRow(2).height = 18;

  merge(3, 4, 3, 6);
  cell('D', 3).value = `«__» ____________ ${year} г.`;
  cell('D', 3).font  = FONT(false, 10, 'FF888888');
  ws.getRow(3).height = 18;

  for (let r = 4; r <= PHOTO_ROWS; r++) ws.getRow(r).height = 18;

  // Фото — ячейки A1:C6
  if (d.image) {
    try {
      const raw  = d.image;
      const ext  = raw.startsWith('data:image/png') ? 'png' : 'jpeg';
      const b64  = raw.substring(raw.indexOf(',') + 1);
      const imgId = wb.addImage({ base64: b64, extension: ext });
      ws.addImage(imgId, { tl:{ col:0, row:0 }, br:{ col:2.9, row:PHOTO_ROWS }, editAs:'oneCell' });
    } catch(e) { console.warn('Фото:', e); }
  }

  R = PHOTO_ROWS + 1;

  // ══ БЛОК 2: ЗАГОЛОВОК ════════════════════════════════════════

  merge(R, 1, R, 6);
  const titleC = cell('A', R);
  titleC.value     = `ТЕХНОЛОГИЧЕСКАЯ КАРТА № ${cardNum}`;
  titleC.font      = FONT(true, 14, 'FF222222');
  titleC.alignment = AL('center');
  ws.getRow(R).height = 26;
  R++;

  merge(R, 1, R, 6);
  const gostC = cell('A', R);
  gostC.value     = '(по ГОСТ Р 53105-2008)';
  gostC.font      = FONT(false, 9, 'FF777777');
  gostC.alignment = AL('center');
  ws.getRow(R).height = 16;
  R++;
  R++; // пустая

  // ══ БЛОК 3: ОБЩАЯ ИНФОРМАЦИЯ ══════════════════════════════════

  sectionHeader('Общие сведения', R); R++;
  infoRow('Наименование изделия', d.name, R); R++;
  infoRow('Группа блюд',          groupName, R); R++;
  infoRow('Выход готового блюда', `${d.vol} мл (1 порция)`, R); R++;
  infoRow('Дата составления',     today, R); R++;
  infoRow('Срок реализации',      isCold ? '30 минут с момента приготовления' : '15 минут с момента приготовления', R); R++;
  infoRow('Условия хранения сырья', '+2…+6 °C для молочных продуктов, сухие при +18 °C', R); R++;
  R++; // пустая

  // ══ БЛОК 4: РЕЦЕПТУРА ══════════════════════════════════════════

  sectionHeader('Рецептура', R); R++;

  // заголовок таблицы
  const rHdrs = ['№', 'Сырьё / полуфабрикат', 'Брутто', 'Нетто', 'Потери', 'Стоим., ₽'];
  ['A','B','C','D','E','F'].forEach((col, i) => {
    const c = cell(col, R);
    c.value     = rHdrs[i];
    c.font      = FONT(true, 10, C_WHITE);
    c.fill      = F(C_GREEN);
    c.alignment = AL(i >= 2 ? 'center' : 'left');
    c.border    = BORDER();
  });
  ws.getRow(R).height = 20;
  R++;

  // строки ингредиентов
  recipeRows.forEach((r2, idx) => {
    const bg = idx % 2 === 0 ? C_WHITE : 'FFF7F9F7';
    const vals = [idx+1, r2.name, r2.brutto, r2.netto, r2.loss != null ? `${r2.loss}%` : '—', Math.round(r2.cost)];
    ['A','B','C','D','E','F'].forEach((col, i) => {
      const c = cell(col, R);
      c.value     = vals[i];
      c.font      = FONT(false, 10);
      c.fill      = F(bg);
      c.alignment = AL(i >= 2 ? 'center' : 'left');
      c.border    = BORDER();
    });
    ws.getRow(R).height = 18;
    R++;
  });

  // строка ИТОГО
  merge(R, 1, R, 5);
  const totL = cell('A', R);
  totL.value     = 'ИТОГО';
  totL.font      = FONT(true, 10);
  totL.fill      = F(C_LGREEN);
  totL.alignment = AL('right');
  totL.border    = BORDER();
  const totV = cell('F', R);
  totV.value     = Math.round(totalCost);
  totV.numFmt    = '#,##0" ₽"';
  totV.font      = FONT(true, 10);
  totV.fill      = F(C_LGREEN);
  totV.alignment = AL('center');
  totV.border    = BORDER();
  ws.getRow(R).height = 20;
  R++;
  R++; // пустая

  // ══ БЛОК 5: ЭКОНОМИКА ══════════════════════════════════════════

  const fcColor = fc > 0.3 ? 'FFCC0000' : fc > 0.25 ? 'FF8B6914' : 'FF2D6A4F';
  const ecoRows = [
    ['Себестоимость (ингредиенты)', Math.round(totalCost), false, C_WHITE],
    ['Цена продажи',                Math.round(price),     false, C_WHITE],
    [`FC% (food cost)`,             `${(fc*100).toFixed(1)}%`, false, C_WHITE, true],
    ['Прибыль с порции',            Math.round(profit),    true,  C_LGREEN],
  ];
  ecoRows.forEach(([label, val, bold, bg, isFC]) => {
    merge(R, 1, R, 5);
    const lc = cell('A', R);
    lc.value     = label;
    lc.font      = FONT(bold, 10);
    lc.fill      = F(bg);
    lc.alignment = AL('left');
    lc.border    = BORDER();
    const vc = cell('F', R);
    vc.value     = val;
    vc.font      = FONT(true, 10, isFC ? fcColor : (bold ? 'FF1B4332' : 'FF222222'));
    vc.fill      = F(bg);
    vc.alignment = AL('center');
    vc.border    = BORDER();
    if (!isFC) vc.numFmt = '#,##0" ₽"';
    ws.getRow(R).height = 20;
    R++;
  });
  R++; // пустая

  // ══ БЛОК 6: ТЕХНОЛОГИЯ ══════════════════════════════════════════

  const techText = d.process
    ? d.process
    : d.group === 'hot'
      ? 'В подготовленную чашку приготовить эспрессо (одинарный/двойной согласно рецептуре). Вспенить молоко/сливки до температуры 60–65°C. Соединить компоненты согласно технологии напитка. При необходимости добавить сиропы/добавки. Подавать немедленно при температуре 60–65°C.'
      : d.group === 'tea'
      ? 'Чай: заварить кипятком (95°C) согласно дозировке, настаивать 3–5 минут. Матча: венчиком взбить порошок матча с горячей водой (80°C) до однородной пены, добавить молоко температурой 60°C. Подавать при температуре 60–65°C.'
      : 'Все компоненты предварительно охладить до +4°C. В стакан со льдом (3–4 кубика) последовательно влить ингредиенты согласно рецептуре. Перемешать барной ложкой. Подавать немедленно при температуре +4…+8°C.';

  sectionHeader('Технология приготовления', R); R++;
  merge(R, 1, R, 6);
  const techC = cell('A', R);
  techC.value     = techText;
  techC.font      = FONT(false, 10);
  techC.fill      = F(C_WHITE);
  techC.alignment = AL('left', 'top', true);
  techC.border    = BORDER();
  // полная ширина 6 колонок ≈ 81 символ
  ws.getRow(R).height = autoH(techText, 78, 45);
  R++;
  R++; // пустая

  // ══ БЛОК 7: ПОКАЗАТЕЛИ КАЧЕСТВА ══════════════════════════════

  sectionHeader('Показатели качества и безопасности', R); R++;

  if (q) {
    const qaRows = [
      ['Внешний вид', q.appearance],
      ['Консистенция', q.consistency],
      ['Цвет', q.color],
      ['Вкус и запах', q.taste],
    ];
    qaRows.forEach(([lbl, val]) => {
      merge(R, 1, R, 2);
      merge(R, 3, R, 6);
      const lc = cell('A', R);
      lc.value     = lbl;
      lc.font      = FONT(true, 10);
      lc.fill      = F(C_LGREEN);
      lc.alignment = AL('left', 'middle', true);
      lc.border    = BORDER();
      const vc = cell('C', R);
      vc.value     = val;
      vc.font      = FONT(false, 10);
      vc.fill      = F(C_WHITE);
      vc.alignment = AL('left', 'middle', true);
      vc.border    = BORDER();
      // авто-высота: значение идёт в 4 колонки (C-F), ≈ 46 символов
      ws.getRow(R).height = autoH(val, 46);
      R++;
    });
  } else {
    merge(R, 1, R, 6);
    cell('A', R).value     = 'Показатели не заполнены';
    cell('A', R).font      = FONT(false, 9, 'FF999999');
    cell('A', R).alignment = AL('left');
    ws.getRow(R).height = 16;
    R++;
  }
  R++; // пустая

  // ══ БЛОК 8: ПИЩЕВАЯ ЦЕННОСТЬ ════════════════════════════════

  sectionHeader('Пищевая ценность на порцию', R); R++;

  const nutHdrs = ['Энерг. ценность', '', 'Белки', 'Жиры', 'Углеводы', ''];
  const nutVals = [`${nut.kcal} ккал`, '', `${nut.protein} г`, `${nut.fat} г`, `${nut.carbs} г`, ''];
  ['A','B','C','D','E','F'].forEach((col, i) => {
    const c = cell(col, R);
    c.value     = nutHdrs[i];
    c.font      = FONT(true, 10, C_WHITE);
    c.fill      = F(C_GREEN);
    c.alignment = AL('center');
    c.border    = BORDER();
  });
  ws.mergeCells(R, 1, R, 2);
  ws.getRow(R).height = 18;
  R++;

  ['A','B','C','D','E','F'].forEach((col, i) => {
    const c = cell(col, R);
    c.value     = nutVals[i];
    c.font      = FONT(true, 11);
    c.fill      = F(C_WHITE);
    c.alignment = AL('center');
    c.border    = BORDER();
  });
  ws.mergeCells(R, 1, R, 2);
  ws.getRow(R).height = 22;
  R++;
  R += 2; // пустые

  // ══ БЛОК 9: ПОДПИСИ ══════════════════════════════════════════

  merge(R, 1, R, 3);
  cell('A', R).value     = 'Технолог: ________________________';
  cell('A', R).font      = FONT(false, 9, 'FF888888');
  cell('A', R).alignment = AL('left');

  merge(R, 4, R, 6);
  cell('D', R).value     = 'Зав. производством: ________________________';
  cell('D', R).font      = FONT(false, 9, 'FF888888');
  cell('D', R).alignment = AL('right');
  ws.getRow(R).height = 20;

  // ── Футер авторства ───────────────────────────────────────────
  R += 2;
  merge(R, 1, R, 6);
  const footerC = cell('A', R);
  footerC.value     = 'Московская школа бариста  ·  baristaschool.ru';
  footerC.font      = { name:'Arial', size:8, color:{ argb:'FFBBBBBB' }, italic:true };
  footerC.alignment = AL('right');
  ws.getRow(R).height = 14;

  // ══ Сохранение ═══════════════════════════════════════════════

  const buffer = await wb.xlsx.writeBuffer();
  const blob   = new Blob([buffer], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement('a');
  a.href       = url;
  a.download   = `Техкарта — ${d.name}.xlsx`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

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
      .filter(ing => (ing.semi != null ? SEMI.find(x => x.id === ing.semi) : MAT[ing.mat]))
      .map(ing => {
        if (ing.semi != null) {
          const s = SEMI.find(x => x.id === ing.semi);
          const factor = _semiDrinkFactor(s);
          const dispAmt = ing.amt; // хранится в кг/л — показываем как есть
          const su = (s.unit || '').toLowerCase();
          const unit = (factor === 1000) ? (su.startsWith('г') ? 'кг' : 'л') : s.unit;
          return { name: s.name + ' <span style="font-size:9px;background:#e8f5e9;color:var(--green);border-radius:3px;padding:1px 3px;font-weight:700">п/ф</span>', dispAmt, unit, cost: calcIngCost(ing) };
        }
        const factor = _semiUnitFactor(ing.mat);
        const dispAmt = parseFloat((ing.amt / factor).toPrecision(4));
        const unit = _matDisplayUnit(ing.mat);
        return { name: MAT[ing.mat].name, dispAmt, unit, cost: calcIngCost(ing) };
      });
    const totalCost = ings.reduce((s,i) => s + i.cost, 0);
    const price = S.salePrices[d.id];
    const fc = price > 0 ? totalCost / price : 0;
    const ingRows = ings.map(ing => {
      const share = totalCost > 0 ? (ing.cost / totalCost * 100).toFixed(0) : 0;
      return `<div class="recipe-ing">
        <span class="recipe-ing-name">${ing.name}</span>
        <span style="font-size:10px;color:var(--muted);flex-shrink:0">${ing.dispAmt} ${ing.unit}</span>
        <span class="recipe-ing-share">${share}%</span>
        <span class="recipe-ing-cost">${rub(ing.cost)}</span>
      </div>`;
    }).join('');
    const fcClr  = fc <= 0.25 ? 'var(--green)' : fc <= 0.30 ? '#b38600' : 'var(--red)';
    const editBtn = '';
    const resetBtn = d.modified
      ? `<button class="btn btn-outline" style="padding:2px 8px;font-size:11px;color:var(--muted)" onclick="event.stopPropagation();resetDrink(${d.id})" title="Вернуть к исходному"><i data-lucide="rotate-ccw" class="icon"></i></button>`
      : '';
    const _img = getDrinkImage(d);
    const imgHtml = _img
      ? `<div class="recipe-card-img"><img src="${_img}" alt="${d.name}" onerror="this.closest('.recipe-card-img').style.display='none'"></div>`
      : '';
    const processHtml = d.process
      ? `<div class="recipe-card-process-wrap">
          <button class="recipe-card-process-toggle" onclick="event.stopPropagation();this.closest('.recipe-card-process-wrap').classList.toggle('open')">
            <i data-lucide="chevron-down" class="icon"></i> Процесс приготовления
          </button>
          <div class="recipe-card-process-body">${d.process.replace(/\n/g,'<br>')}</div>
        </div>`
      : '';
    const videoHtml = d.videoUrl
      ? `<a class="recipe-card-video" href="${d.videoUrl}" target="_blank" rel="noopener" onclick="event.stopPropagation()"><i data-lucide="play-circle" class="icon"></i> Смотреть видео рецепт</a>`
      : '';
    return `<div class="recipe-card" onclick="openViewDrink(${d.id})">
      ${imgHtml}
      <div class="recipe-card-title" style="margin-top:${d.image?'10px':'0'}">
        <span>${d.name}</span>
        <div style="display:flex;align-items:center;gap:6px">${abcBadge(abcMap[d.id]||'C', abcTipMap[d.id]||'')}${editBtn}${resetBtn}</div>
      </div>
      <div class="recipe-card-sub">
        <span>${d.vol} мл</span>
        <span>·</span>
        <span style="color:${fcClr};font-weight:700">FC ${pct(fc)}</span>
      </div>
      ${ingRows}
      <div class="recipe-total"><span>Себестоимость</span><span>${rub(totalCost)}</span></div>
      <div class="recipe-total" style="font-weight:400;font-size:12px;color:var(--muted)"><span>Цена продажи</span><span>${rub(price)}</span></div>
      <div class="recipe-total" style="color:var(--navy)"><span>Прибыль</span><span>${rub(price - totalCost)}</span></div>
      ${processHtml}
      ${videoHtml}
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
    { k:'filter',l:'<i data-lucide="droplets" class="icon"></i> Пуровер' },
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
      <div style="display:flex;gap:8px">
        <button class="btn btn-green" onclick="openAddDrink()"><i data-lucide="plus" class="icon"></i> Напиток</button>
        <button class="btn btn-outline" onclick="exportTechCards()" title="Экспорт техкарт по ГОСТ Р 53105 в PDF"><i data-lucide="file-text" class="icon"></i> PDF техкарт</button>
      </div>
    </div>
    <div class="tab-intro" id="recipes-intro">
      <div class="tab-intro-icon"><i data-lucide="clipboard-list" class="icon icon-lg"></i></div>
      <div>
        <div class="tab-intro-title">Рецептуры и структура себестоимости</div>
        <div class="tab-intro-text">
          Здесь хранятся рецептуры всех напитков: состав, граммовки ингредиентов и себестоимость каждой позиции.
          Карточка показывает, из чего складывается цена напитка и какую долю занимает каждый ингредиент.
          При изменении цен на сырьё во вкладке «Поставщики» карточки пересчитываются автоматически.
        </div>
        <div class="tab-intro-steps">
          <span class="tab-intro-step">📋 Клик на карточку — открыть полную техкарту с процессом приготовления</span>
          <span class="tab-intro-step">✏️ Иконка редактирования — изменить рецептуру или добавить новый напиток</span>
          <span class="tab-intro-step">🔍 Поиск и фильтры — быстро найти нужный напиток по группе или названию</span>
          <span class="tab-intro-step">📄 PDF техкарт — выгрузить технологические карты по ГОСТ Р 53105</span>
        </div>
      </div>
    </div>
    <div class="recipes-toolbar">
      <div class="recipes-toolbar-row recipes-toolbar-search">
        <div class="search-wrap" style="margin-bottom:0;flex:1">
          <span class="search-icon"><i data-lucide="search" class="icon"></i></span>
          <input class="search-inp" id="recipe-search" type="text" placeholder="Поиск по названию..."
            value="${recipeSearch}" oninput="filterRecipes(this.value);_searchClear(this)">
          <button class="search-clear${recipeSearch ? ' visible' : ''}" title="Очистить" onclick="filterRecipes('');var el=document.getElementById('recipe-search');el.value='';_searchClear(el)">✕</button>
        </div>
        <button class="btn btn-outline recipes-intro-toggle" id="recipes-intro-btn" onclick="toggleRecipesIntro()" title="Подсказка" style="flex-shrink:0"><i data-lucide="info" class="icon"></i></button>
      </div>
      <div class="recipes-toolbar-row recipes-toolbar-filters">
        <div class="recipe-filter-btns">${filterBtns}</div>
        <div class="recipes-toolbar-sort">
          <div class="recipe-sort-btns">${sortBtns}</div>
        </div>
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
  try {
    if      (tab==='dashboard') renderDashboard();
    else if (tab==='cost')      renderCost();
    else if (tab==='sales')     renderSales();
    else if (tab==='finmodel')  renderFinModel();
    else if (tab==='recipes')   renderRecipes();
    if (window.lucide) lucide.createIcons();
  } catch(e) {
    console.error('[renderTab ' + tab + ']', e);
  }
}

// Вызывается на каждый oninput — только пересчитывает, не логирует
const _matPriceBeforeEdit = {}; // key → цена до начала редактирования

function onMatPriceFocus(key) {
  // Запоминаем только при первом фокусе (не перезаписываем при ре-рендере)
  if (!Object.prototype.hasOwnProperty.call(_matPriceBeforeEdit, key)) {
    _matPriceBeforeEdit[key] = S.prices[key];
  }
}
function onMatPriceInput(key, v) {
  const n = parseFloat(v);
  if (!(n > 0)) return;
  S.prices[key] = n;
  // Не перерендериваем — пользователь ещё печатает, фокус не трогаем
}
// Вызывается на onblur — логирует изменение только если значение действительно изменилось
function onMatPriceCommit(key, v) {
  const n   = parseFloat(v);
  if (!(n > 0)) return;
  S.prices[key] = n;
  const old = _matPriceBeforeEdit[key];
  if (old !== undefined && old !== n) {
    if (!Array.isArray(S.priceLog)) S.priceLog = [];
    S.priceLog.push({ matKey: key, oldPrice: old, newPrice: n, date: new Date().toISOString() });
    if (S.priceLog.length > 500) S.priceLog = S.priceLog.slice(-500);
  }
  delete _matPriceBeforeEdit[key];
  markDirtyDebounce(); // полный пересчёт и сохранение — фокус уже ушёл с поля
}
// Устаревший alias для совместимости (на случай если где-то вызывается напрямую)
function onMatPrice(key, v) { onMatPriceInput(key, v); }
function onSalePrice(id, v)  { const n=parseFloat(v); if(n>0){ S.salePrices[id]=n; markDirtyDebounce(); } }
function _syncTargetFCInputs(val) {
  const v = Math.round(val * 100);
  ['kpi-target-fc','dash-target-fc'].forEach(id => {
    const el = document.getElementById(id);
    if (el && el !== document.activeElement) el.value = v;
  });
}
function onTargetFCSilent(v) { const n=parseFloat(v)/100; if(n>0&&n<1){ S.targetFC=n; _syncTargetFCInputs(n); } }
function onTargetFC(v)       { const n=parseFloat(v)/100; if(n>0&&n<1){ S.targetFC=n; _syncTargetFCInputs(n); markDirtyDebounce(); } }
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
  if (window.lucide) lucide.createIcons();
}

function scaleSalesPortions(factor) {
  Object.keys(S.portions).forEach(id => {
    S.portions[Number(id)] = Math.max(0, Math.round(S.portions[Number(id)] * factor));
  });
  dirty.finmodel = true;
  renderSales(); saveState();
  if (window.lucide) lucide.createIcons();
}
function onFixedCost(i, v)   { const n=parseFloat(v); if(n>=0){ S.fixedCosts[i].value=n; debounce(()=>{ renderFinModel(); saveState(); }); } }
function onFixedCostName(i, v) { if(v.trim()){ S.fixedCosts[i].name=v.trim(); saveState(); } }
function addFixedCost() { addFixedCostInCat('other'); }
function delFixedCost(i) { if(S.fixedCosts.length > 1) { S.fixedCosts.splice(i,1); renderFinModel(); saveState(); if(window.lucide) lucide.createIcons(); } }
function onTaxMode(v) { S.taxMode = v; renderFinModel(); saveState(); if(window.lucide) lucide.createIcons(); }
function onInvestment(v) { const n=parseFloat(v); if(n>=0){ S.investment=n; renderFinModel(); saveState(); if(window.lucide) lucide.createIcons(); } }

function scrollToPayroll() {
  const el = document.getElementById('payroll-section') || document.querySelector('.payroll-section, [data-section="payroll"]');
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const targetY = window.scrollY + rect.top - (window.innerHeight / 2) + (rect.height / 2);
  window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
}

function addFixedCostInCat(cat) {
  S.fixedCosts.push({ id: ++_nextCostId, name:'Новая статья', value:0, category: cat || 'other', isVariable:false });
  renderFinModel();
  saveState();
  const idx = S.fixedCosts.length - 1;
  setTimeout(() => { openCostEditor(idx); if(window.lucide) lucide.createIcons(); }, 80);
}

function toggleFcCat(cat) {
  const rows = document.querySelectorAll(`tr[data-fc-cat="${cat}"]`);
  const chev = document.getElementById(`fc-chev-${cat}`);
  const isHidden = rows.length > 0 && rows[0].style.display === 'none';
  rows.forEach(r => r.style.display = isHidden ? '' : 'none');
  if (chev) chev.textContent = isHidden ? '▼' : '▶';
}

let _fceIdx = -1;
function openCostEditor(idx) {
  _fceIdx = idx;
  const c = S.fixedCosts[idx];
  if (!c) return;
  let ov = document.getElementById('fc-editor-overlay');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'fc-editor-overlay';
    ov.className = 'fc-editor-overlay';
    ov.addEventListener('click', function(e) { if (e.target === ov) closeCostEditor(); });
    ov.innerHTML = `
      <div class="fc-editor-modal">
        <div class="fc-editor-hdr">
          <span class="fc-editor-title">Редактировать расход</span>
          <button class="fc-editor-close" onclick="closeCostEditor()">✕</button>
        </div>
        <div class="fc-editor-body">
          <label class="fc-editor-label">Название</label>
          <input id="fce-name" class="inp" type="text" style="width:100%;margin-bottom:12px">
          <label class="fc-editor-label">Категория</label>
          <select id="fce-category" class="modal-select" style="width:100%;margin-bottom:14px">
            ${FIXED_COSTS_CATS.map(ct => `<option value="${ct.id}">${ct.label}</option>`).join('')}
          </select>
          <label class="fc-editor-label">Способ расчёта</label>
          <div class="fce-type-row">
            <label class="fce-radio"><input type="radio" name="fce-valtype" value="fixed" id="fce-type-fixed" onchange="_fceTypeChange()"> Фиксированная сумма ₽</label>
            <label class="fce-radio"><input type="radio" name="fce-valtype" value="pct" id="fce-type-pct" onchange="_fceTypeChange()"> % от выручки</label>
          </div>
          <div id="fce-fixed-fields" style="margin-top:12px">
            <label class="fc-editor-label">Сумма, ₽/мес</label>
            <input id="fce-value" class="inp" type="number" min="0" step="500" inputmode="numeric" style="width:100%;margin-bottom:10px">
            <label class="fce-radio"><input type="checkbox" id="fce-variable"> Переменная — масштабируется в сценариях с объёмом продаж</label>
          </div>
          <div id="fce-pct-fields" style="display:none;margin-top:12px">
            <label class="fc-editor-label">% от выручки</label>
            <input id="fce-pct" class="inp" type="number" min="0" max="100" step="0.1" inputmode="decimal" style="width:100%;margin-bottom:10px" oninput="_fcePctHint()">
            <div style="margin-bottom:8px">
              <button type="button" id="fce-share-toggle" onclick="_fceShareToggle()" style="background:none;border:none;padding:0;cursor:pointer;font-size:12px;color:var(--muted);display:flex;align-items:center;gap:4px">
                <span id="fce-share-arrow" style="font-size:10px">▶</span>
                <span>Доля применимой выручки, %</span>
                <span title="Если расход применяется не ко всей выручке — укажите долю. Пример: эквайринг только на безналичные оплаты (90% от выручки)" style="cursor:help;opacity:.6">ⓘ</span>
                <span id="fce-share-cur" style="color:var(--navy);font-weight:700"></span>
              </button>
              <div id="fce-share-wrap" style="display:none;margin-top:6px">
                <input id="fce-pctShare" class="inp" type="number" min="1" max="100" step="5" inputmode="numeric" style="width:100%;margin-bottom:4px" oninput="_fcePctHint()">
                <div style="font-size:11px;color:var(--muted)">100 = вся выручка · меньше 100 = только часть (напр. 90 если 90% оплат по карте)</div>
              </div>
            </div>
            <div class="fce-pct-hint" id="fce-pct-hint"></div>
          </div>
        </div>
        <div class="fc-editor-footer">
          <button class="btn btn-sm fc-del-btn" onclick="deleteCostFromEditor()">Удалить</button>
          <button class="btn btn-sm" style="background:var(--green);color:#fff;border:none" onclick="saveCostEditor()">Сохранить</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
  }
  document.getElementById('fce-name').value = c.name || '';
  document.getElementById('fce-category').value = c.category || 'other';
  const isPct = !!c.isPercent;
  document.getElementById('fce-type-fixed').checked = !isPct;
  document.getElementById('fce-type-pct').checked = isPct;
  document.getElementById('fce-value').value = c.value || 0;
  document.getElementById('fce-variable').checked = !!c.isVariable;
  document.getElementById('fce-pct').value = c.pct || 2;
  // pctShare: дефолт 100 (= вся выручка); у эквайринга сохранено 90
  const shareVal = c.pctShare != null ? c.pctShare : 100;
  const shareEl  = document.getElementById('fce-pctShare');
  if (shareEl) shareEl.value = shareVal;
  // раскрыть поле сразу если значение нестандартное (< 100)
  const shareWrap  = document.getElementById('fce-share-wrap');
  const shareArrow = document.getElementById('fce-share-arrow');
  if (shareWrap && shareArrow) {
    const expanded = shareVal < 100;
    shareWrap.style.display = expanded ? '' : 'none';
    shareArrow.textContent  = expanded ? '▼' : '▶';
  }
  _fceTypeChange();
  _fcePctHint();
  ov.style.display = 'flex';
}

function closeCostEditor() {
  const ov = document.getElementById('fc-editor-overlay');
  if (ov) ov.style.display = 'none';
  _fceIdx = -1;
}

function _fceTypeChange() {
  const isPct = !!(document.getElementById('fce-type-pct') && document.getElementById('fce-type-pct').checked);
  const ff = document.getElementById('fce-fixed-fields');
  const pf = document.getElementById('fce-pct-fields');
  if (ff) ff.style.display = isPct ? 'none' : '';
  if (pf) pf.style.display = isPct ? '' : 'none';
}

function _fceShareToggle() {
  const wrap  = document.getElementById('fce-share-wrap');
  const arrow = document.getElementById('fce-share-arrow');
  if (!wrap) return;
  const open = wrap.style.display === 'none';
  wrap.style.display  = open ? '' : 'none';
  arrow.textContent   = open ? '▼' : '▶';
}
function _fceShareUpdate() {
  const shareEl = document.getElementById('fce-pctShare');
  const cur     = document.getElementById('fce-share-cur');
  const wrap    = document.getElementById('fce-share-wrap');
  const arrow   = document.getElementById('fce-share-arrow');
  if (!shareEl || !cur) return;
  const val = parseFloat(shareEl.value) || 100;
  const notFull = val < 100;
  cur.textContent   = notFull ? `(${val}%)` : '';
  if (notFull && wrap && wrap.style.display === 'none') {
    wrap.style.display = '';
    if (arrow) arrow.textContent = '▼';
  }
}
function _fcePctHint() {
  const hint = document.getElementById('fce-pct-hint');
  if (!hint) return;
  _fceShareUpdate();
  const pct   = parseFloat(document.getElementById('fce-pct').value) || 0;
  const shareEl = document.getElementById('fce-pctShare');
  const share = shareEl ? (parseFloat(shareEl.value) || 100) : 100;
  const { totRevMon } = salesMetrics(enrich());
  const computed = Math.round(totRevMon * share / 100 * pct / 100);
  hint.textContent = computed > 0 ? `≈ ${computed.toLocaleString('ru')} ₽ / мес при текущей выручке` : '';
}

function saveCostEditor() {
  if (_fceIdx < 0 || _fceIdx >= S.fixedCosts.length) return;
  const c = S.fixedCosts[_fceIdx];
  c.name = (document.getElementById('fce-name').value || '').trim() || c.name;
  c.category = document.getElementById('fce-category').value || 'other';
  const isPct = document.getElementById('fce-type-pct').checked;
  if (isPct) {
    c.isPercent  = true;
    c.pct        = parseFloat(document.getElementById('fce-pct').value) || 0;
    c.pctShare   = parseFloat(document.getElementById('fce-pctShare').value) || 100;
    c.value      = 0;
    c.isVariable = true;
  } else {
    c.isPercent  = false;
    c.pct        = 0;
    c.pctShare   = 100;
    c.value      = parseFloat(document.getElementById('fce-value').value) || 0;
    c.isVariable = document.getElementById('fce-variable').checked;
  }
  closeCostEditor();
  renderFinModel();
  saveState();
  if (window.lucide) lucide.createIcons();
}

function deleteCostFromEditor() {
  if (_fceIdx < 0 || S.fixedCosts.length <= 1) return;
  if (!confirm(`Удалить «${S.fixedCosts[_fceIdx].name}»?`)) return;
  S.fixedCosts.splice(_fceIdx, 1);
  closeCostEditor();
  renderFinModel();
  saveState();
  if (window.lucide) lucide.createIcons();
}

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
function toggleFixedHint() {
  S.fixedHintOpen = !S.fixedHintOpen;
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

function openSupplierInfo(key) {
  if (!MAT[key]) return;
  const s = (S.suppliers && S.suppliers[key]) || {};
  document.getElementById('si-mat-name').textContent = MAT[key].name;
  document.getElementById('si-name').textContent = s.name || '—';
  // телефон
  const phoneEl = document.getElementById('si-phone');
  const phoneWrap = document.getElementById('si-phone-wrap');
  if (s.phone) {
    phoneEl.textContent = s.phone;
    phoneEl.href = s.phone.includes('@') ? `mailto:${s.phone}` : `tel:${s.phone.replace(/\s/g,'')}`;
    phoneWrap.style.display = '';
  } else { phoneWrap.style.display = 'none'; }
  // сайт
  const siteEl = document.getElementById('si-site');
  const siteWrap = document.getElementById('si-site-wrap');
  if (s.site) {
    siteEl.textContent = s.site;
    siteEl.href = s.site;
    siteWrap.style.display = '';
  } else { siteWrap.style.display = 'none'; }
  // заметка
  const noteEl = document.getElementById('si-note');
  const noteWrap = document.getElementById('si-note-wrap');
  if (s.note) {
    noteEl.textContent = s.note;
    noteWrap.style.display = '';
  } else { noteWrap.style.display = 'none'; }
  // сохраняем ключ для редактирования
  document.getElementById('modal-supplier-info').dataset.matKey = key;
  openModal('modal-supplier-info');
  if (window.lucide) lucide.createIcons();
}
function siOpenEdit() {
  const key = document.getElementById('modal-supplier-info').dataset.matKey;
  closeModal('modal-supplier-info');
  openSupplierModal(key);
}

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
  _clearModalDirty('modal-supplier');
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
  _clearModalDirty('modal-supplier');
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
        ? `openSupplierBookModal('${g.bookId}', true)`
        : `editSupFromList('${g.matKeys[0]}')`;
      return `<div class="sup-card">
        <div class="sup-card-header">
          <div class="sup-card-info">
            <span class="sup-card-name"><i data-lucide="building-2" class="icon"></i> ${g.name}</span>
            ${g.phone ? `<span class="sup-card-phone">${g.phone}</span>` : ''}
          </div>
          <button class="btn btn-outline sup-edit-btn" onclick="${editAction}"><i data-lucide="pencil" class="icon"></i> Изменить</button>
        </div>
        ${g.note ? `<div class="sup-card-note">${g.note}</div>` : ''}
        ${g.site ? `<div class="sup-card-note"><a href="${g.site}" target="_blank" style="color:var(--muted);text-decoration:none">🌐 ${g.site}</a></div>` : ''}
        <div class="sup-card-mats">${matTags}${noMatBadge}</div>
      </div>`;
    }).join('');
  }
  document.getElementById('sup-list-body').innerHTML = body;
  if (window.lucide) lucide.createIcons();
}

// ── Справочник поставщиков (без привязки к сырью)
let _supBookFromList = false;
function openSupplierBookModal(id, fromList) {
  _supBookFromList = !!fromList;
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
function cancelSupplierBookModal(force = false) {
  if (!force && _isModalDirty('modal-supplier-book')) {
    _showUnsavedWarning('modal-supplier-book');
    return;
  }
  const fromList = _supBookFromList;
  _supBookFromList = false;
  _clearModalDirty('modal-supplier-book');
  closeModal('modal-supplier-book');
  if (fromList) openSuppliersList();
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
  const fromList = _supBookFromList;
  _supBookFromList = false;
  _clearModalDirty('modal-supplier-book');
  closeModal('modal-supplier-book');
  renderCost();
  if (fromList) openSuppliersList();
}
function deleteSupplierBook() {
  if (!_supBookEditId || !S.supplierBook) return;
  if (!confirm('Удалить поставщика из справочника?')) return;
  S.supplierBook = S.supplierBook.filter(b => String(b.id) !== String(_supBookEditId));
  saveState();
  const fromList = _supBookFromList;
  _supBookFromList = false;
  _clearModalDirty('modal-supplier-book');
  closeModal('modal-supplier-book');
  renderCost();
  if (fromList) openSuppliersList();
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
  const taxMode = S.taxMode || 'none';

  // Те же компоненты что и в P&L
  const { totRevMon: _wifRev } = salesMetrics(drinks);
  const _wifEff = getEffectiveCosts(_wifRev);
  const fotInFixed  = _wifEff.some(c => /фот|зарплат|зп|оплата.?труда/i.test(c.name));
  const fotAmount   = fotInFixed ? 0 : payrollTotal();
  const varExtra    = _wifEff.filter(c =>  c.isVariable).reduce((s,c)=>s+c.value, 0);
  const pureFixed   = _wifEff.filter(c => !c.isVariable).reduce((s,c)=>s+c.value, 0) + fotAmount;

  const calcTax = (rev, varC, fixed) =>
    taxMode==='usn6' ? rev*0.06 : taxMode==='usn15' ? Math.max(0,(rev-varC-fixed)*0.15) : 0;

  const mPrice   = 1 + _wif.price/100;
  const mCost    = 1 + _wif.cost/100;
  const mTraffic = 1 + _wif.traffic/100;

  // Базовые (идентично P&L)
  const baseRev  = drinks.reduce((s,d)=>s + d.price * S.portions[d.id], 0) * S.days;
  const baseVar  = drinks.reduce((s,d)=>s + d.cost  * S.portions[d.id], 0) * S.days;
  const baseVarE = varExtra; // переменные операц. расходы при базовом трафике
  const baseTot  = baseVar + baseVarE + pureFixed;
  const baseNet  = baseRev - baseVar - baseVarE - pureFixed - calcTax(baseRev, baseVar + baseVarE, pureFixed);
  const basePort = Object.values(S.portions).reduce((s,v)=>s+v,0);

  // С учётом коэффициентов
  const rev2   = baseRev * mPrice * mTraffic;
  const var2   = baseVar * mCost  * mTraffic;
  const varE2  = varExtra * mTraffic;           // переменные операц. расходы тоже масштабируются
  const net2   = rev2 - var2 - varE2 - pureFixed - calcTax(rev2, var2 + varE2, pureFixed);
  const port2  = basePort * mTraffic;
  const fc2    = rev2>0 ? var2/rev2 : 0;
  const bep2   = (1-fc2)>0 ? pureFixed/(1-fc2) : 0;
  const avgChk = port2>0 ? rev2/(port2*S.days) : 0;
  const cover  = bep2>0 ? rev2/bep2*100 : 100;

  const delta = net2 - baseNet;
  const dClr  = delta>0 ? 'var(--green)' : delta<0 ? 'var(--red)' : 'var(--muted)';
  const sign  = delta>0 ? '+' : '';
  const netClr = net2>=0 ? 'var(--navy)' : 'var(--red)';

  // Базовые показатели для дельт
  const baseFC   = baseRev>0 ? baseVar/baseRev : 0;
  const baseAvgChk = basePort>0 ? baseRev/(basePort*S.days) : 0;
  const dRevAbs  = rev2 - baseRev;
  const dAvgAbs  = avgChk - baseAvgChk;
  const dFCpp    = (fc2 - baseFC) * 100;  // в процентных пунктах

  const dRevClr  = dRevAbs>0 ? 'var(--green)' : dRevAbs<0 ? 'var(--red)' : 'var(--muted)';
  const dAvgClr  = dAvgAbs>0 ? 'var(--green)' : dAvgAbs<0 ? 'var(--red)' : 'var(--muted)';
  const dFCClr   = dFCpp<0  ? 'var(--green)' : dFCpp>0  ? 'var(--red)' : 'var(--muted)'; // FC↓ = хорошо
  const s = v => v>0?'+':'';

  const mkDelta = (val, label, invert=false) => {
    if (Math.abs(val) < 0.01) return `<span class="wif-delta wif-delta-zero">${label}</span>`;
    const pos = invert ? val < 0 : val > 0;
    const cls = pos ? 'wif-delta-pos' : 'wif-delta-neg';
    return `<span class="wif-delta ${cls}">${label}</span>`;
  };

  out.innerHTML = `
    <div class="wif-card">
      <div class="wif-card-label">Средний чек</div>
      <div class="wif-card-val">${rub(avgChk)}</div>
      ${mkDelta(dAvgAbs, `${s(dAvgAbs)}${rub(dAvgAbs)} к базе`)}
    </div>
    <div class="wif-card">
      <div class="wif-card-label">FC%</div>
      <div class="wif-card-val">${pct(fc2)}</div>
      ${mkDelta(dFCpp, `${s(dFCpp)}${dFCpp.toFixed(1)} pp к базе`, true)}
    </div>
    <div class="wif-card">
      <div class="wif-card-label">Выручка / мес</div>
      <div class="wif-card-val">${rub(rev2)}</div>
      ${mkDelta(dRevAbs, `${s(dRevAbs)}${rub(dRevAbs)} к базе`)}
    </div>
    <div class="wif-card">
      <div class="wif-card-label">Выручка ТБУ</div>
      <div class="wif-card-val">${rub(bep2)}</div>
      <span class="wif-delta wif-delta-zero">покрытие ${cover.toFixed(0)}%</span>
    </div>
    <div class="wif-card wif-card-accent">
      <div class="wif-card-label">Чистая прибыль / мес</div>
      <div class="wif-card-val" style="color:${netClr}">${rub(net2)}</div>
      ${mkDelta(delta, `${sign}${rub(delta)} к базе`)}
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
    const clr=pos?clrPos:clrNeg;
    // Для отрицательных баров — подпись выше нулевой линии
    const labelY=pos?bt-4:zero-4;
    const fv=v=>Math.abs(v)>=1e6?(v/1e6).toFixed(1)+'М':Math.abs(v)>=1e3?Math.round(v/1e3)+'к':Math.round(v);
    return `<rect x="${x-barW/2}" y="${bt}" width="${barW}" height="${h}" rx="2" fill="${clr}" opacity="${d.k===1?'0.82':'0.65'}"/>
    <text x="${x}" y="${PT+ch+12}" text-anchor="middle" font-size="9" font-family="${ff}" fill="${clrTxt}">${d.m}</text>
    <text x="${x}" y="${labelY}" text-anchor="middle" font-size="8" font-family="${ff}" font-weight="700" fill="${clr}">${fv(d.net)}₽</text>`;
  }).join('');
  const zeroLine=`<line x1="${PL}" y1="${zero}" x2="${PL+cw}" y2="${zero}" stroke="${clrAxis}" stroke-width="1.5"/>`;
  const axisY=`<line x1="${PL}" y1="${PT}" x2="${PL}" y2="${PT+ch}" stroke="${clrAxis}" stroke-width="1.5"/>`;

  // KPI под графиком
  const totalYear = data.reduce((s,d)=>s+d.net, 0);
  const bestMonth = data.reduce((a,b)=>a.net>b.net?a:b);
  const worstMonth = data.reduce((a,b)=>a.net<b.net?a:b);
  const fmRub = v => rub ? rub(v) : (Math.round(v).toLocaleString('ru-RU')+' ₽');
  const kpiClr = v => v >= 0 ? 'var(--green)' : 'var(--red)';
  const kpiHtml = `
    <div class="season-kpi">
      <div class="season-kpi-card">
        <div class="season-kpi-label">Итого за год</div>
        <div class="season-kpi-val" style="color:${kpiClr(totalYear)}">${fmRub(totalYear)}</div>
      </div>
      <div class="season-kpi-card">
        <div class="season-kpi-label">Лучший месяц</div>
        <div class="season-kpi-val" style="color:var(--green)">${fmRub(bestMonth.net)}</div>
        <div class="season-kpi-sub">${bestMonth.m}</div>
      </div>
      <div class="season-kpi-card">
        <div class="season-kpi-label">Худший месяц</div>
        <div class="season-kpi-val" style="color:${kpiClr(worstMonth.net)}">${fmRub(worstMonth.net)}</div>
        <div class="season-kpi-sub">${worstMonth.m}</div>
      </div>
    </div>`;

  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block;overflow:visible" xmlns="http://www.w3.org/2000/svg">
    ${gridSvg}${axisY}${zeroLine}${barsSvg}</svg>${kpiHtml}`;
}

// ════════════════════════════════════════════════════════════════════
//  SEASONALITY + FIXED-COST VARIABLE HANDLERS
// ════════════════════════════════════════════════════════════════════
function onSeasonalMonth(i, v) {
  if (!S.seasonality) S.seasonality = Array(12).fill(1);
  S.seasonality[i] = parseFloat(v);
  const lbl = document.getElementById('sm-val-'+i);
  if (lbl) lbl.textContent = Math.round(parseFloat(v)*100) + '%';
  // perерисовать только чарт
  const chartEl = document.getElementById('seasonal-chart');
  if (chartEl) {
    const drinks = enrich();
    const varCostsMon = drinks.reduce((s,d)=>s+d.cost*S.portions[d.id],0)*S.days;
    const totRevMon   = drinks.reduce((s,d)=>s+d.price*S.portions[d.id],0)*S.days;
    const totalFixed  = getEffectiveCosts(totRevMon).reduce((s,c)=>s+c.value,0);
    const taxMode = S.taxMode||'none';
    const calcTaxLocal = (rev,varC,fixed) => taxMode==='usn6'?rev*0.06:taxMode==='usn15'?Math.max(0,(rev-varC-fixed)*0.15):0;
    chartEl.innerHTML = buildSeasonalChart(totRevMon, varCostsMon, totalFixed, calcTaxLocal);
  }
  saveState();
}

let _seasonDrawerIdx = 0;
function openSeasonDrawer(i) {
  _seasonDrawerIdx = i;
  const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  const k = (S.seasonality||Array(12).fill(1))[i];
  const pct = Math.round(k*100);
  const drawer = document.getElementById('season-drawer');
  document.getElementById('season-drawer-title').textContent = MONTHS[i];
  document.getElementById('season-drawer-val').textContent = pct + '%';
  const range = document.getElementById('season-drawer-range');
  range.value = pct;
  _updateDrawerRangeColor(pct);
  drawer.classList.add('open');
}
function closeSeasonDrawer() {
  document.getElementById('season-drawer').classList.remove('open');
}
function onSeasonDrawerChange(v) {
  const pct = parseInt(v);
  const k = pct / 100;
  if (!S.seasonality) S.seasonality = Array(12).fill(1);
  S.seasonality[_seasonDrawerIdx] = k;
  document.getElementById('season-drawer-val').textContent = pct + '%';
  _updateDrawerRangeColor(pct);
  // Обновить ячейку в сетке
  const cell = document.getElementById('scell-' + _seasonDrawerIdx);
  const btn  = cell && cell.closest('.season-cell');
  if (cell) cell.textContent = pct + '%';
  if (btn) {
    btn.classList.remove('season-cell-up', 'season-cell-down');
    if (k > 1.05) btn.classList.add('season-cell-up');
    else if (k < 0.95) btn.classList.add('season-cell-down');
  }
  // Обновить чарт
  const chartEl = document.getElementById('seasonal-chart');
  if (chartEl) {
    const drinks = enrich();
    const varCostsMon = drinks.reduce((s,d)=>s+d.cost*S.portions[d.id],0)*S.days;
    const totRevMon   = drinks.reduce((s,d)=>s+d.price*S.portions[d.id],0)*S.days;
    const totalFixed  = getEffectiveCosts(totRevMon).reduce((s,c)=>s+c.value,0);
    const taxMode = S.taxMode||'none';
    const calcTaxLocal = (rev,varC,fixed) => taxMode==='usn6'?rev*0.06:taxMode==='usn15'?Math.max(0,(rev-varC-fixed)*0.15):0;
    chartEl.innerHTML = buildSeasonalChart(totRevMon, varCostsMon, totalFixed, calcTaxLocal);
  }
  saveState();
}
function _updateDrawerRangeColor(pct) {
  const range = document.getElementById('season-drawer-range');
  if (!range) return;
  const pos = (pct - 30) / (200 - 30) * 100;
  const clr = pct > 105 ? '#6abf69' : pct < 95 ? '#e53935' : '#888';
  range.style.background = `linear-gradient(to right, ${clr} ${pos}%, var(--border) ${pos}%)`;
}

function applySeasonPreset(preset) {
  const FLAT   = Array(12).fill(1);
  // Лето: апр-сен +30%, дек-фев слабый
  const SUMMER = [0.75, 0.75, 0.90, 1.10, 1.25, 1.35, 1.35, 1.25, 1.10, 0.95, 0.80, 0.75];
  // Кофейня в БЦ: пики фев-май и сен-ноя (деловые сезоны), летом -25% (отпуска), янв слабый (каникулы)
  const BC     = [0.80, 1.10, 1.15, 1.20, 1.15, 0.85, 0.70, 0.75, 1.15, 1.20, 1.15, 0.85];
  // Кофейня в ЖК: летом +20% (дети дома, жара), ноя-фев тихий (люди дома), авг пик
  const JK     = [0.80, 0.85, 0.90, 1.00, 1.10, 1.20, 1.25, 1.30, 1.10, 1.00, 0.85, 0.80];
  S.seasonality = preset === 'summer' ? SUMMER : preset === 'bc' ? BC : preset === 'jk' ? JK : FLAT;
  saveState();
  renderFinModel();
  if (window.lucide) lucide.createIcons();
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
function exportSemiTechCards() {
  if (!SEMI.length) { alert('Нет полуфабрикатов для печати.'); return; }
  const org = getOrgInfo();
  const pages = SEMI.map((s, idx) =>
    _buildSemiTechCardBlock(s, org, idx + 1, idx === SEMI.length - 1)
  ).join('\n');
  _openTechCardsWindow(
    `Техкарты полуфабрикатов — ${org.name}`,
    `${SEMI.length} карт · ${new Date().toLocaleDateString('ru')}`,
    pages,
    400
  );
}

function _buildSemiTechCardBlock(s, org, cardNum, isLast) {
  if (typeof org === 'string') org = { name: org, legalName: org, ceoTitle: 'Руководитель', ceoName: '', address: '' };
  const orgName = org.name || 'Кофейня';
  const today = new Date().toLocaleDateString('ru');
  const year  = new Date().getFullYear();
  const semiCostPer = calcSemiCostPerUnit(s);

  function _semiIngCost(r) {
    if (!MAT[r.mat]) return 0;
    let c = ((S.prices[r.mat] || MAT[r.mat].price) / MAT[r.mat].size) * r.amt * _semiUnitFactor(r.mat);
    if (r.loss) c = c / (1 - r.loss);
    return c;
  }

  const semiTotal = (s.recipe||[]).reduce((sum, r) => sum + _semiIngCost(r), 0);

  const recipeRows = (s.recipe||[]).map(r => {
    if (!MAT[r.mat]) return '';
    const m      = MAT[r.mat];
    const loss   = r.loss ? (r.loss * 100).toFixed(0) + '%' : '—';
    const brutto = r.loss ? (r.amt / (1 - r.loss)).toFixed(3) : r.amt.toString();
    const cost   = _semiIngCost(r);
    return `<tr><td>${m.name}</td><td class="c">${m.unit.replace(/^1\s*/,'')}</td><td class="r">${brutto}</td><td class="r">${r.amt}</td><td class="c">${loss}</td><td class="r">${r.yieldAmt||'—'}</td><td class="r b">${Math.round(cost)} ₽</td></tr>`;
  }).join('');

  const processBlock = s.process
    ? `<h2>Технология приготовления</h2><p class="tech">${s.process.replace(/\n/g,'<br>')}</p>`
    : '';

  const storageBlock = (s.storage_temp || s.storage_life) ? `
  <h2>Условия хранения и реализации</h2>
  <table class="info">
    ${s.storage_temp ? `<tr><td class="lbl">Температура хранения</td><td>${s.storage_temp}</td></tr>` : ''}
    ${s.storage_life ? `<tr><td class="lbl">Срок хранения</td><td>${s.storage_life}</td></tr>` : ''}
  </table>` : '';

  const organoBlock = (s.appearance || s.taste || s.consistency) ? `
  <h2>Органолептические показатели</h2>
  <table class="qa">
    ${s.appearance  ? `<tr><td class="lbl">Внешний вид</td><td>${s.appearance}</td></tr>` : ''}
    ${s.taste       ? `<tr><td class="lbl">Вкус и запах</td><td>${s.taste}</td></tr>` : ''}
    ${s.consistency ? `<tr><td class="lbl">Консистенция</td><td>${s.consistency}</td></tr>` : ''}
  </table>` : '';

  return `<div class="card${isLast ? '' : ' pb'}">
  <div class="card-header-inner">
    <div class="org-block">
      ${org.legalName ? `<div style="font-weight:700;font-size:10pt">${org.legalName}</div>` : ''}
      ${orgName !== org.legalName ? `<div style="font-size:9pt;color:#555">${orgName}</div>` : ''}
      ${org.address ? `<div style="font-size:8.5pt;color:#666">${org.address}</div>` : ''}
    </div>
    <div class="approve">
      <div><b>УТВЕРЖДАЮ:</b></div>
      <div>${org.ceoTitle || 'Руководитель'} ${org.legalName || orgName}</div>
      <div style="margin-top:8px">${org.ceoName || '_______________________'}</div>
      <div style="margin-top:4px;color:#888">(${org.ceoName ? 'подпись' : 'Ф.И.О.'})</div>
      <div style="margin-top:6px">«__» ____________ ${year} г.</div>
    </div>
  </div>
  ${s.image ? `<img src="${s.image}" alt="${s.name}" class="drink-photo" style="display:block;margin:0 auto 8px;width:160px;height:120px;object-fit:cover;border-radius:4px;border:1px solid #ccc" onerror="this.style.display='none'">` : ''}
  <h1>ТЕХНОЛОГИЧЕСКАЯ КАРТА ПОЛУФАБРИКАТА № ${cardNum}</h1>
  <p class="gost">(по ГОСТ Р 53105-2008)</p>
  <table class="info">
    <tr><td class="lbl">Наименование полуфабриката</td><td>${s.name}</td></tr>
    <tr><td class="lbl">Выход готового полуфабриката</td><td>${s.yield} ${s.unit}</td></tr>
    <tr><td class="lbl">Себестоимость единицы</td><td>${Math.round(semiCostPer)} ₽/${s.unit}</td></tr>
    <tr><td class="lbl">Дата составления</td><td>${today}</td></tr>
  </table>
  <h2>Рецептура</h2>
  <table>
    <thead><tr><th>Сырьё</th><th>Ед.</th><th>Брутто</th><th>Нетто</th><th>Потери</th><th>Выход</th><th>Стоимость</th></tr></thead>
    <tbody>${recipeRows}
    <tr class="total"><td colspan="6">ИТОГО сырья</td><td class="r b">${Math.round(semiTotal)} ₽</td></tr>
    </tbody>
  </table>
  ${processBlock}
  ${storageBlock}
  ${organoBlock}
  <div class="sign">
    <span>Технолог: ____________________</span>
    <span>Зав. производством: ____________________</span>
  </div>
</div>`;
}

function exportTechCards() {
  const org = getOrgInfo();
  const orgName = org.name;
  let list = DRINKS.slice();
  if (recipeGroup !== 'all') list = list.filter(d => d.group === recipeGroup);
  if (recipeSearch) list = list.filter(d => d.name.toLowerCase().includes(recipeSearch.toLowerCase()));
  if (!list.length) { alert('Нет напитков для печати с текущими фильтрами.'); return; }

  const pages = list.map((d, idx) => {
    const cardNum = DRINKS.findIndex(x => x.id === d.id) + 1;
    return _buildTechCardBlock(d, org, cardNum, idx === list.length - 1);
  }).join('\n');

  _openTechCardsWindow(
    `Технологические карты — ${orgName}`,
    `${list.length} карт · ${new Date().toLocaleDateString('ru')}`,
    pages,
    400
  );
}

// ════════════════════════════════════════════════════════════════════
//  TAB NAVIGATION
// ════════════════════════════════════════════════════════════════════
function switchTab(tab) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.mobile-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  activeTab = tab;
  const tabEl = document.getElementById('tab-' + activeTab);
  if (tabEl) tabEl.classList.add('active');
  if (dirty[activeTab]) { renderTab(activeTab); dirty[activeTab] = false; }
  try { localStorage.setItem('mbs_active_tab', tab); } catch(e) {}
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
try { renderLocSwitcherUI(); } catch(e) { console.error('[renderLocSwitcherUI]', e); }
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

// Рендерим только активную вкладку — остальные лениво по требованию
Object.keys(dirty).forEach(k => dirty[k] = true);
switchTab(activeTab);
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

// На мобильных: при тапе по любому input/textarea — курсор в конец
if ('ontouchstart' in window) {
  document.addEventListener('focus', e => {
    const el = e.target;
    if (!el.matches('input, textarea') || _kbNav) return;
    const val = el.value;
    const origType = el.type;
    // type="number" не поддерживает setSelectionRange на iOS — временно меняем на text
    if (origType === 'number') {
      el.type = 'text';
    }
    requestAnimationFrame(() => {
      try {
        const len = el.value.length;
        el.setSelectionRange(len, len);
      } catch(_) {}
      if (origType === 'number') {
        el.type = 'number';
        el.value = val;
      }
    });
  }, true);
}
