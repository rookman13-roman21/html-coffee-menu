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

// ════════════════════════════════════════════════════════════════════
//  LOCATIONS (multi-coffeeshop support)
// ════════════════════════════════════════════════════════════════════
const Loc = { list: [], activeId: null };
const LOC_INDEX_KEY  = 'mbs_locations';
const LOC_ACTIVE_KEY = 'mbs_active_loc';
const LOC_DATA_PREFIX= 'mbs_loc_';
const OLD_STATE_KEY  = 'mbs_coffee_s';

function locDataKey(id) { return LOC_DATA_PREFIX + id; }

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

// ════════════════════════════════════════════════════════════════════
//  PERSIST & THEME  (saveState / loadState / toggleTheme / toggleBurger удалены → src/)
// ════════════════════════════════════════════════════════════════════
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


// ─── Защита от потери данных при случайном закрытии модала ──────────
const _EDITABLE_MODALS = new Set([
  'modal-drink','modal-semi','modal-mat',
  'modal-supplier','modal-supplier-book','modal-loc'
]);
const _dirtyModalSet = new Set();


// Показывает кастомный мини-диалог поверх модала (по центру экрана)


// Делегированный слушатель: любое изменение в открытом модале → dirty
document.addEventListener('input',  e => { const m = e.target.closest('.modal-bg'); if (m) _markModalDirty(m.id); }, true);
document.addEventListener('change', e => { const m = e.target.closest('.modal-bg'); if (m) _markModalDirty(m.id); }, true);

// Клик по подложке (не по контенту модала) → safeClose
document.addEventListener('click', e => {
  if (!e.target.classList.contains('modal-bg')) return;
  safeCloseModal(e.target.id);
});

// Заполняем дропдаун книжки поставщиков в modal-mat


// Быстрая замена поставщика прямо из карточки сырья
let _supQuickKey = null;
let _supQuickEl  = null;


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


// ── Изображение полуфабриката ───────────────────────────────────


// ════════════════════════════════════════════════════════════════════
//  ADD MATERIAL MODAL
// ════════════════════════════════════════════════════════════════════


// ════════════════════════════════════════════════════════════════════
//  SEMI-FINISHED PRODUCTS CRUD
// ════════════════════════════════════════════════════════════════════


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
                  <button class="mat-del" onclick="event.stopPropagation();exportSingleSemiPDF(${s.id})" title="Скачать техкарту PDF"><i data-lucide="file-text" class="icon"></i></button>
                  <button class="mat-del" onclick="event.stopPropagation();exportSingleSemiXLSX(${s.id})" title="Скачать техкарту Excel"><i data-lucide="file-spreadsheet" class="icon"></i></button>
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

// ─── Общий CSS для всех техкарт ────────────────────────────────────

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

let _fceIdx = -1;

// ════════════════════════════════════════════════════════════════════
//  PAYROLL CALCULATOR
// ════════════════════════════════════════════════════════════════════
// Дефолтные значения налоговых ставок (используются при отсутствии настроек)
const PS_DEFAULTS = { mrot: 22440, ndfl: 13, ins: 30 };
// Возвращает текущие налоговые настройки (из S или дефолтные)

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


// ════════════════════════════════════════════════════════════════════
//  TECH CARDS PDF (по ГОСТ Р 53105 / СанПиН)
// ════════════════════════════════════════════════════════════════════


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
//  EXPOSE GLOBALS FOR ES MODULES (src/*)
//  Должно быть ДО INIT чтобы src/-функции (loadLocIndex и др.) читали
//  актуальные ссылки на объекты (Loc, S, MAT, SEMI...).
// ════════════════════════════════════════════════════════════════════
Object.assign(window, {
  // Справочники (статика)
  MAT, MAT_NUTRITION, MAT_CATEGORIES,
  DRINKS, DRINKS_ORIG, DRINK_QUALITY,
  SEMI, SALES_PRESETS,
  FIXED_COSTS_DEF, FIXED_COSTS_CATS,
  GROUP_LABEL, BASE_DRINK_IDS, BASE_MAT_KEYS,
  // Мутируемый стейт
  S, Loc,
  // Render-стейт вкладки Рецептуры
  recipeSort, recipeGroup, recipeSearch,
  // Служебные
  dirty, activeTab, searchQuery, sortState,
  nextDrinkId, nextSemiId, nextMatKey, _nextCostId,
  // const-переменные, нужные render-модулям
  _wif, EMP_TYPE_LABELS,
  // Ключи локаций
  LOC_INDEX_KEY, LOC_ACTIVE_KEY, LOC_DATA_PREFIX, OLD_STATE_KEY,
  // Хелперы локаций (нужны src/ui/locations.js)
  locDataKey, resetGlobalsToBase,
  // Шаблоны меню
  MENU_TEMPLATES,
});

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
// Синхронизируем примитивные счётчики — store.js мог обновить window.*
if ((window.nextDrinkId || 0) > nextDrinkId) nextDrinkId = window.nextDrinkId;
if ((window.nextSemiId  || 0) > nextSemiId)  nextSemiId  = window.nextSemiId;
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

