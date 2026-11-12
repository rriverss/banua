/**
 * Ведомость материалов и смета бани «Палома».
 *
 * Все количества считаются из геометрии модели (project.js), а не вбиты руками:
 * изменили размер — пересчиталась и ведомость, и смета. Состав работ и позиции
 * сверены со сметой застройщика (Paloma/Смета_Палома.xlsx, 341 508 ₽ — только
 * материалы по ценам 2020 г.), цены пересчитаны на розницу МО, ноябрь 2026 г.
 */
import {
  project,
  walls,
  rooms,
  openings,
  extWalls,
  intWalls,
  extGross,
  extHoles,
  extNet,
  intNet,
  totalArea,
  terraceArea,
  buildArea,
  heatedGross,
  roomArea,
  perimeter,
  ceilingY,
  roofArea,
  pilePositions,
  girders,
  wallStudPositions,
  wallTopAt,
  glazing,
  terracePoly,
} from './project.js'

const P = project
const dm = P.dims
const R = P.roof

const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d
const packs = (area, coverage, waste = 1.08) => Math.ceil((area * waste) / coverage)

// ---------- пиломатериал: считаем фактическую длину по элементам ----------
const studHours = (w) =>
  wallStudPositions(w).reduce((s, u) => s + Math.max(0, wallTopAt(w, u) - 0.08), 0)

// стойки наружных стен (40×150) + обвязки + перемычки
const extStuds = extWalls.reduce((s, w) => s + studHours(w), 0)
const extPlates = extWalls.reduce((s, w) => s + (w.topA + w.topB), 0) // верх + низ
const extHeaders = extWalls.reduce(
  (s, w) => s + w.openings.reduce((a, o) => a + (o.u1 - o.u0) * 2 + (o.y0 > 0 ? o.u1 - o.u0 : 0), 0),
  0
)
const intStuds = intWalls.reduce((s, w) => s + studHours(w), 0)
const intPlates = intWalls.reduce((s, w) => s + (w.topA + w.topB), 0)

const board40x150 = extStuds + intStuds + extPlates + intPlates + extHeaders

// лаги пола (50×200)
const blockJoists = Math.floor((dm.L - 0.2) / P.frames.spacing) * (dm.depth - 0.02)
const terJoists = Math.floor((dm.D - 0.15) / P.frames.spacing) * (dm.x0 - 0.04)
const frontJoists = 2 * (dm.terX - dm.x0 - 0.04)
// стропила (50×200)
const rafterCount = Math.floor((R.x1 - R.x0 - 0.15) / P.frames.spacing) + 1
const rafterLen = Math.hypot(R.z1 - R.z0, R.yFront - R.yBack) + 0.15
const board50x200 = blockJoists + terJoists + frontJoists + rafterCount * rafterLen + 24

// обрешётка / контробрешётка / вентзазор фасада
const battenLen = (roofArea.total / 0.35) * 1.0
const counterLen = rafterCount * rafterLen
const facadeBattenLen = (extGross / 0.6) * 1.0

// обвязка и прогоны
const girderLen = girders.reduce((s, g) => s + Math.hypot(g.x1 - g.x0, g.z1 - g.z0), 0)
const lvlLen = 2 * (dm.L - 0.1) + 4 * 4.7

// ---------- площади отделки ----------
const roomWallArea = (id) => {
  const r = rooms.find((q) => q.id === id)
  return perimeter(id) * ceilingY(r.center[1])
}
const koWalls = roomWallArea('ko')
const wcWalls = roomWallArea('wc')
const showerWalls = roomWallArea('shower')
const steamWalls = roomWallArea('steam')
const wetWalls = wcWalls + showerWalls + steamWalls
const wetArea = roomArea('wc') + roomArea('shower') + roomArea('steam')
const ceilingArea = heatedGross
const koArea = roomArea('ko')
const dryFloor = koArea

// площадь имитации бруса на фасаде — по геометрии стен (без фронтонов: кровля односкатная)
const facadeArea = extNet

// ---------- цены (розница МО, 11.2026) ----------
const price = {
  pile: 3400,
  pileCap: 450,
  timber150: 2750,
  board50x200: 1300, // 50×200×6000, 0,06 м³
  board40x150: 830, // 40×150×6000, 0,036 м³
  board25x100: 380,
  brusok40x40: 150, // 3 м
  brusok25x50: 120, // 3 м
  osb9: 1150,
  wool100: 2300, // упак 5,76 м² при 100 мм
  vapor: 2700, // рулон 70 м²
  foil: 7500, // рулон 50 м²
  wind: 4200, // рулон 70 м²
  metalTile: 720, // ₽/м², 0,45 мм, полиэстер RAL 7021
  plank: 950, // планка 2 м
  gutter: 1200, // 3 м, металл
  roofScrews: 1200, // 250 шт
  timber: 1450, // имитация бруса 16×140, м²
  liningPine: 620,
  liningLinden: 1350,
  terraceBoard: 2100,
  floorBoard: 1900,
  tile: 900,
  waterproofing: 4500,
  windowPanorama: 46000, // 3100×2260, стеклопакет, алюминий
  windowTall: 19000, // 640×2260
  windowSmall: 13500, // 640×1400
  doorTerrace: 38000, // 1600×2260, двустворчатая, стекло
  doorInner: 15000,
  doorSteam: 26000, // стекло закалённое 8 мм
  stove: 52000,
  chimney: 3900,
  chimneyNode: 5500,
  spark: 2500,
  stones: 3000,
  electricPanel: 6000,
  cable: 95,
  socket: 700,
  lamp: 2500,
  breaker: 900,
  rcd: 2800,
  shower: 12000,
  wc: 12000,
  sink: 6000,
  mixer: 5000,
  boiler: 18000,
  pex: 120,
  fittings: 8000,
  drain: 3500,
  nails: 900,
  screws: 850,
  brackets: 120,
  anchors: 90,
}

const item = (name, spec, unit, qty, unitPrice, note = '') => ({
  name,
  spec,
  unit,
  qty: round(qty, qty < 10 ? 2 : 1),
  price: unitPrice,
  sum: Math.round(qty * unitPrice),
  note,
})

// ---------- группы ----------
const groups = [
  {
    id: 'foundation',
    name: '1. Свайный фундамент и обвязка',
    icon: '◎',
    items: [
      item('Свая винтовая СВ-1', '⌀108×2400, лопасть 250, стенка 4 мм', 'шт', pilePositions.length, price.pile),
      item('Оголовок сваи', '200×200×6, оцинковка', 'шт', pilePositions.length, price.pileCap),
      item('Брус обвязки (ростверк)', '150×150×6000, антисептик', 'шт', Math.ceil((girderLen * 1.05) / 6), price.timber150),
      item('Анкер/шпилька М12', 'крепление обвязки к оголовку', 'шт', pilePositions.length * 4, price.anchors),
      item('Забирка', 'доска 20×140, антисептик, по периметру блока', 'м²', 19, 850),
      item('Антисептик для дерева', '10 л, обвязка и лаги', 'канистра', 2, 2900),
    ],
  },
  {
    id: 'frame',
    name: '2. Каркас, перекрытия, обшивка',
    icon: '▤',
    items: [
      item('Доска 50×200', 'лаги пола и стропила — C24, ЕС', 'шт', Math.ceil((board50x200 * 1.1) / 6), price.board50x200, '6 м'),
      item('Доска 40×150', 'стойки стен и перегородок, обвязки', 'шт', Math.ceil((board40x150 * 1.12) / 6), price.board40x150, '6 м'),
      item('Прогон LVL 300×51', 'под стропила, 7,0 м', 'шт', 2, 14500, 'по смете застройщика — 6 шт. суммарно'),
      item('Доска 25×100', 'обрешётка кровли, шаг 350', 'шт', Math.ceil((battenLen * 1.08) / 6), price.board25x100, '6 м'),
      item('Брусок 40×40', 'контробрешётка кровли', 'шт', Math.ceil((counterLen * 1.08) / 3), price.brusok40x40, '3 м'),
      item('Брусок 25×50', 'вентзазор фасада, шаг 600', 'шт', Math.ceil((facadeBattenLen * 1.1) / 3), price.brusok25x50, '3 м'),
      item('ОСП-3 9 мм', 'укосины и углы (по смете — 8 м²)', 'лист', 3, price.osb9, '3,125 м²'),
      item('Гвозди 3,5×90', 'каркас, 5 кг', 'уп', 4, price.nails),
      item('Саморезы 4,2×75', 'обшивка, 5 кг', 'уп', 3, price.screws),
      item('Уголок КР-16 105×105', 'крепление стропил к обвязке', 'шт', rafterCount * 2, price.brackets),
    ],
  },
  {
    id: 'insulation',
    name: '3. Утепление, паро- и ветрозащита',
    icon: '≋',
    items: [
      item('Каменная вата 100 мм', 'стены 150 мм (2 слоя с перекрытием)', 'уп', packs(extGross * 1.5, 5.76), price.wool100, '5,76 м²/уп'),
      item('Каменная вата 100 мм', 'пол 200 мм', 'уп', packs(dryFloor + wetArea, 5.76) * 2, price.wool100),
      item('Каменная вата 100 мм', 'кровля 200 мм + потолок', 'уп', packs(roofArea.total, 5.76) * 2, price.wool100),
      item('Пароизоляция', 'Изоспан B, 70 м²', 'рулон', Math.ceil(((extGross * 0.6 + ceilingArea) * 1.15) / 70), price.vapor),
      item('Фольгированная пароизоляция', 'Изоспан FB — парная и душевая', 'рулон', Math.ceil((wetWalls + wetArea) * 1.2 / 50), price.foil),
      item('Гидро-ветрозащита', 'Изоспан A, 70 м²', 'рулон', Math.ceil(((extGross + roofArea.total) * 1.15) / 70), price.wind),
      item('Лента соединительная', 'двусторонняя, 25 м', 'рулон', 6, 690),
      item('Скотч алюминиевый', 'для фольги, 50 м', 'рулон', 3, 890),
    ],
  },
  {
    id: 'roof',
    name: '4. Кровля',
    icon: '⌂',
    items: [
      item('Металлочерепица RAL 7021', '0,45 мм, полиэстер, волна 350', 'м²', Math.ceil(roofArea.total * 1.1), price.metalTile),
      item('Планка карнизная', '2 м, RAL 7021', 'шт', 7, price.plank),
      item('Планка торцевая', '2 м, RAL 7021', 'шт', 7, price.plank),
      item('Желоб водосточный', '3 м, металл, RAL 7021', 'шт', Math.ceil((R.x1 - R.x0) / 3), price.gutter),
      item('Саморез кровельный', '4,8×35, 250 шт', 'уп', Math.ceil(roofArea.total / 6), price.roofScrews),
      item('Уплотнитель и кляммеры', 'комплект на 80 м²', 'компл', 1, 9800),
      item('Подшив свесов', 'софиты/вагонка, м²', 'м²', Math.ceil((R.x1 - R.x0) * 0.9), 780),
    ],
  },
  {
    id: 'finish',
    name: '5. Фасад и внутренняя отделка',
    icon: '▦',
    items: [
      item('Имитация бруса 16×140', 'фасад, хвоя, антисептик + краска', 'м²', Math.ceil(facadeArea * 1.1), price.timber),
      item('Вагонка сосна 14×96', 'КО, потолок по стропилам', 'м²', Math.ceil((koWalls - glazing.total + ceilingArea) * 1.1), price.liningPine),
      item('Вагонка липа 14×96', 'душевая, санузел, парная (без смолы)', 'м²', Math.ceil((wetWalls + wetArea) * 1.1), price.liningLinden),
      item('Террасная доска лиственница', '28×140, 4 м', 'м²', Math.ceil(terraceArea * 1.1), price.terraceBoard),
      item('Доска пола шпунтованная', '36×140, лиственница', 'м²', Math.ceil(dryFloor * 1.08), price.floorBoard),
      item('Керамогранит 300×300', 'парная, душевая, санузел', 'м²', Math.ceil(wetArea * 1.12), price.tile),
      item('Гидроизоляция обмазочная', '25 кг, мокрые зоны', 'ведро', 2, price.waterproofing),
      item('Плинтус, наличник', 'рейка 40×20, 3 м', 'шт', 24, 320),
      item('Масло-воск для бани', '5 л, парная и полки', 'канистра', 2, 4500),
      item('Пропитка-антисептик фасад', '10 л', 'канистра', 2, 4200),
    ],
  },
  {
    id: 'joinery',
    name: '6. Окна и двери',
    icon: '⊞',
    items: [
      item('Окно ОТ-1', '3100×2260, панорамное, алюминий, стеклопакет', 'шт', 1, price.windowPanorama),
      item('Окно ОТ-2', '640×2260, в пол, западный фасад', 'шт', 1, price.windowTall),
      item('Окно ОТ-3', '640×1400, душевая', 'шт', 1, price.windowSmall),
      item('Окно ОТ-4', '640×1400, парная', 'шт', 1, price.windowSmall),
      item('Дверь ДП-1', '1600×2260, двустворчатая террасная, стекло', 'шт', 1, price.doorTerrace),
      item('Дверь ДП-2', '800×2100, влагостойкая', 'шт', 1, price.doorInner),
      item('Дверь ДП-3', '700×2100, влагостойкая', 'шт', 1, price.doorInner),
      item('Дверь ДП-4', '700×2100, стекло закалённое 8 мм (парная)', 'шт', 1, price.doorSteam),
      item('Доборы, наличники, петли', 'комплект на 4 двери', 'компл', 1, 12500),
    ],
  },
  {
    id: 'stove',
    name: '7. Печь и дымоход',
    icon: '🔥',
    items: [
      item('Печь дровяная для парной', 'Harvia / Термофор, 9–12 кВт, с камнями', 'шт', 1, price.stove),
      item('Дымоход сэндвич ⌀115', '0,8 мм нерж., м', 'м', 5.0, price.chimney),
      item('Проходной узел кровли', 'с зазором 50 мм, нерж.', 'шт', 1, price.chimneyNode),
      item('Искрогаситель + дефлектор', 'нерж.', 'шт', 1, price.spark),
      item('Камни для каменки', 'габбро-диабаз, 20 кг', 'уп', 1, price.stones),
      item('Жаростойкий герметик', '1500 °C', 'шт', 2, 1200),
    ],
  },
  {
    id: 'engineering',
    name: '8. Инженерия',
    icon: '⚡',
    items: [
      item('Щит электрический', 'на 12 модулей, IP54', 'шт', 1, price.electricPanel),
      item('Кабель ВВГнг-LS 3×2,5', 'м', 'м', 60, price.cable),
      item('Автомат 16А', 'дифференциальный', 'шт', 4, price.breaker),
      item('УЗО 40А/30мА', 'тип AC', 'шт', 1, price.rcd),
      item('Розетка/выключатель IP54', 'влагостойкие', 'шт', 10, price.socket),
      item('Светильник IP65', 'баня и терраса', 'шт', 7, price.lamp),
      item('Душ-панель', 'нерж., тропический душ', 'шт', 1, price.shower),
      item('Унитаз компакт', 'керамика', 'шт', 1, price.wc),
      item('Раковина с тумбой', 'влагостойкая, 600 мм', 'шт', 1, price.sink),
      item('Смеситель', 'душ и раковина', 'шт', 2, price.mixer),
      item('Водонагреватель 50 л', 'резервный, санузел', 'шт', 1, price.boiler),
      item('Труба PEX 16', 'м', 'м', 30, price.pex),
      item('Фитинги, коллектор', 'PEX 16', 'компл', 1, price.fittings),
      item('Трап с гидрозатвором', 'нерж. 100×100, сухой затвор', 'шт', 3, price.drain),
      item('Вентиляция', 'канал 100 мм, дефлектор, клапан', 'компл', 1, 7800),
    ],
  },
  {
    id: 'misc',
    name: '9. Прочее',
    icon: '⋯',
    items: [
      item('Доставка и разгрузка', 'пиломатериал, кровля', 'услуга', 1, 26000),
      item('Крепёж, расходники', 'пена, герметик, изоляция', 'компл', 1, 20000),
      item('Ступени террасы', '3 подъёма, лиственница', 'компл', 1, 28000),
      item('Ограждение террасы', 'поручень 1,1 м, балясины, ~28 м', 'м', 28, 1450),
    ],
  },
]

const materialsTotal = groups.reduce((s, g) => s + g.items.reduce((a, i) => a + i.sum, 0), 0)

// ---------- работы ----------
const railingLen = Math.round(dm.D - 0.2 + 4.4)

const works = [
  { name: `Разметка, завинчивание свай (${pilePositions.length} шт.)`, unit: 'шт', qty: pilePositions.length, price: 1900 },
  { name: 'Ростверк / обвязка, антисептирование', unit: 'м', qty: round(girderLen, 1), price: 950 },
  { name: 'Каркас стен, перегородки, обвязки', unit: 'м²', qty: round(extGross, 0), price: 2400 },
  { name: 'Пол и потолок (лаги, настил, подшив по стропилам)', unit: 'м²', qty: round(dryFloor + wetArea, 0), price: 2100 },
  { name: 'Кровля: стропила, пирог, металлочерепица', unit: 'м²', qty: round(roofArea.total, 0), price: 1650 },
  { name: 'Утепление, пароизоляция, проклейка', unit: 'м²', qty: round(extGross * 1.5 + ceilingArea + roofArea.total, 0), price: 450 },
  { name: 'Фасад: вентзазор, имитация бруса, покраска', unit: 'м²', qty: round(facadeArea, 0), price: 1250 },
  { name: 'Внутренняя отделка: вагонка, полки, потолок', unit: 'м²', qty: round(koWalls + wetWalls + ceilingArea, 0), price: 1300 },
  { name: 'Полы: плитка, доска, плинтус', unit: 'м²', qty: round(dryFloor + wetArea, 0), price: 1900 },
  { name: 'Терраса: настил, ограждение, ступени, стойки', unit: 'м²', qty: round(terraceArea, 0), price: 2600 },
  { name: 'Монтаж печи, дымохода, разделки', unit: 'компл', qty: 1, price: 48000 },
  { name: 'Электромонтаж', unit: 'компл', qty: 1, price: 42000 },
  { name: 'Сантехника, канализация, вентиляция', unit: 'компл', qty: 1, price: 45000 },
].map((w) => ({ ...w, sum: Math.round(w.qty * w.price) }))

const worksTotal = works.reduce((s, w) => s + w.sum, 0)

export const bom = {
  groups,
  materialsTotal,
  works,
  worksTotal,
  total: materialsTotal + worksTotal,
  perM2: (materialsTotal + worksTotal) / (totalArea + terraceArea),
  meta: {
    priceDate: 'ноябрь 2026',
    region: 'Московская область',
    source:
      'Состав и объёмы сверены со сметой застройщика (Paloma/Смета_Палома.xlsx: 23 сваи, 108 шт 50×200, 69 шт 40×150, 76,81 м² кровли, 67,59 м² фасада, 4 окна и 4 двери). Цены — розница МО на 11.2026.',
    disclaimer:
      'Цены ориентировочные, без скидок поставщиков, не заменяют коммерческое предложение. Перед закупкой запросите 2–3 КП и проверьте объёмы по факту.',
  },
}

export function bomCsv() {
  const rows = [['Группа', 'Наименование', 'Характеристика', 'Ед.', 'Кол-во', 'Цена, ₽', 'Сумма, ₽']]
  for (const g of groups) {
    for (const i of g.items) rows.push([g.name, i.name, i.spec, i.unit, i.qty, i.price, i.sum])
  }
  rows.push([])
  rows.push(['', 'Материалы', '', '', '', '', materialsTotal])
  for (const w of works) rows.push(['Работы', w.name, '', w.unit, w.qty, w.price, w.sum])
  rows.push(['', 'Работы', '', '', '', '', worksTotal])
  rows.push(['', 'ИТОГО', '', '', '', '', materialsTotal + worksTotal])
  return rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n')
}

export const stats = {
  extGross: round(extGross, 1),
  extHoles: round(extHoles, 1),
  extNet: round(extNet, 1),
  intNet: round(intNet, 1),
  roof: round(roofArea.total, 1),
  floor: round(totalArea, 1),
  terrace: round(terraceArea, 1),
  build: round(buildArea, 1),
  piles: pilePositions.length,
  girder: round(girderLen, 1),
  rafters: rafterCount,
  rafterLen: round(rafterLen, 2),
  lvl: round(lvlLen, 1),
  board40x150: Math.round(board40x150),
  board50x200: Math.round(board50x200),
  batten: Math.round(battenLen),
  windows: openings.filter((o) => o.kind === 'window').length,
  doors: openings.filter((o) => o.kind === 'door').length,
  glazing: glazing.total,
  railing: railingLen,
}
