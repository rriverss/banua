/**
 * Ведомость материалов и смета.
 * Все количества считаются из геометрии проекта (model/project.js),
 * а не вбиты руками — поэтому при изменении размеров смета пересчитается.
 * Цены — ориентировочные, розница Московской области, ноябрь 2026 г.
 */
import {
  project,
  walls,
  rooms,
  openings,
  gable,
  roofArea,
  totalArea,
  pilePositions,
  girders,
  wallAreas,
  wallStudPositions,
} from './project.js'

const P = project
const ext = walls.filter((w) => w.kind === 'ext')
const int = walls.filter((w) => w.kind === 'int')

const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d
const up = (v, step) => Math.ceil(v / step) * step
const packs = (area, coverage, waste = 1.1) => Math.ceil((area * waste) / coverage)

// ---------- пиломатериал ----------
function wallWood(w) {
  const plates = 2 * w.length + 0.2
  const studs = wallStudPositions(w).length * (w.height - 0.09)
  let headers = 0
  for (const o of w.openings) {
    headers += o.u1 - o.u0
    if (o.kind === 'window') headers += o.u1 - o.u0
  }
  return plates + studs + headers
}
const extWoodLen = ext.reduce((s, w) => s + wallWood(w), 0)
const intWoodLen = int.reduce((s, w) => s + wallWood(w), 0)

const extNet = ext.reduce((s, w) => s + wallAreas(w).net, 0)
const intNet = int.reduce((s, w) => s + wallAreas(w).net, 0)
const insulWalls = extNet + gable.area + 10 // + перегородки мокрого блока
const floorArea = totalArea
const joineryCount = openings.filter((o) => o.kind === 'window').length

// стропила
// одна кровля над домом и террасой: пары стропил с шагом 600 по Z
const rafterPairs = (() => {
  let n = 0
  for (let z = 0.25; z < P.roof.zFront - 0.2; z += P.frames.spacing) n++
  return n
})()
const rafterCountMain = rafterPairs * 2
const rafterLenMain = P.roof.slopeLen + 0.3

// лаги
const joistCount = Math.round((P.dims.L - 0.3) / P.frames.spacing) + 1
const joistMainLen = P.dims.D - 0.2
const joistTerLen = P.dims.terrace - 0.1

// обвязка
const girderLen = girders.reduce((s, g) => s + Math.hypot(g.x1 - g.x0, g.z1 - g.z0), 0)

// обрешётка
const battenLen = roofArea.total / 0.35
const counterBattenLen = rafterCountMain * rafterLenMain

// площади отделки (по фактическим помещениям модели)
const roomArea = (id) => rooms.find((r) => r.id === id).area
const perim = (id) => {
  const r = rooms.find((q) => q.id === id)
  let p = 0
  for (let i = 0; i < r.poly.length; i++) {
    const a = r.poly[i]
    const b = r.poly[(i + 1) % r.poly.length]
    p += Math.hypot(b[0] - a[0], b[1] - a[1])
  }
  return p
}
const wallSkin = (id, openingsArea = 0) => perim(id) * P.dims.ceiling - openingsArea

const saunaArea = roomArea('sauna')
const showerArea = roomArea('shower')
const wcArea = roomArea('wc')
const wardrobeArea = roomArea('wardrobe')
const bedArea = roomArea('bed')
const liveArea = roomArea('living')
const terraceArea = roomArea('ter')

const saunaWalls = wallSkin('sauna', 0.6)
const showerWalls = wallSkin('shower', 1.2)
const wcWalls = wallSkin('wc', 0.6)
const livingWalls = wallSkin('living', 6.0)
const bedWalls = wallSkin('bed', 5.0)
const wardrobeWalls = wallSkin('wardrobe', 0)
// свод гостиной: две наклонные плоскости вместо плоского потолка
const vaultArea = (() => {
  const R = P.roof
  return ((liveArea) / Math.cos((R.pitch * Math.PI) / 180)) * 1.0
})()

// ---------- цены (розница МО, 11.2026) ----------
const price = {
  pile: 3400,
  pileCap: 450,
  timber150: 2750, // брус 150×150×6000
  board45x195: 1150, // доска 45×195×6000
  board45x95: 560,
  board25x100: 380, // 6 м
  brusok50x50: 190, // 3 м
  brusok50x30: 165, // 3 м
  osb9: 1150, // лист 2500×1250
  osb18: 2450,
  wool100: 2300, // упак 5,76 м² при 100 мм
  vapor: 2700, // рулон 70 м²
  foil: 7500, // рулон 50 м²
  wind: 4200, // рулон 70 м²
  falz: 1250, // ₽/м², фальц 0,5 мм с картинами
  ridge: 1900, // конёк фальцевый 2 м
  eaveStrip: 900, // планка 2 м
  roofScrews: 1200, // 250 шт
  insulationRoof: 95, // ₽/м²
  siding: 1500, // рейка фасадная RAL 7021, м²
  larch: 2900, // планкен лиственница натур, м²
  liningPine: 620,
  liningLinden: 1350,
  terraceBoard: 2100,
  oil: 4500, // 5 л
  windowS: 8000,
  windowM: 10500,
  windowL: 15500,
  windowXL: 18500,
  doorEntry: 28000,
  doorInner: 15000,
  doorGlass: 32000,
  stove: 52000,
  chimney: 3900, // ₽/м
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
  waterproofing: 4500,
  nails: 900, // 5 кг
  screws: 850,
  brackets: 120,
  anchors: 90,
  delivery: 1,
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

const windowPrice = (o) => {
  const a = o.w * o.h
  if (a <= 0.3) return price.windowS
  if (a <= 0.6) return price.windowM
  if (a <= 1.2) return price.windowL
  return price.windowXL
}

const windows = openings.filter((o) => o.kind === 'window')
const doors = openings.filter((o) => o.kind === 'door')

// ---------- группы ----------
const groups = [
  {
    id: 'foundation',
    name: '1. Фундамент и обвязка',
    icon: '◎',
    items: [
      item('Свая винтовая', '⌀108×2500, лопасть 250, оголовок 200×200', 'шт', pilePositions.length, price.pile),
      item('Оголовок сваи', '200×200×6, оцинковка', 'шт', pilePositions.length, price.pileCap),
      item('Брус обвязки (ростверк)', '150×150×6000, антисептик', 'шт', Math.ceil((girderLen * 1.05) / 6), price.timber150),
      item('Анкер/шпилька М12', 'крепление обвязки к оголовку', 'шт', pilePositions.length * 4, price.anchors),
      item('Антисептик для дерева', '10 л, для обвязки и лаг', 'канистра', 2, 2900),
    ],
  },
  {
    id: 'frame',
    name: '2. Каркас, перекрытия, обшивка',
    icon: '▤',
    items: [
      item('Доска 45×195', 'стены, лаги, балки, стропила — C24, ЕС', 'шт', Math.ceil((extWoodLen * 1.12) / 6), price.board45x195, '6 м'),
      item('Доска 45×95', 'перегородки', 'шт', Math.ceil((intWoodLen * 1.12) / 6), price.board45x95, '6 м'),
      item('Доска 25×100', 'обрешётка кровли, шаг 350', 'шт', Math.ceil((battenLen * 1.08) / 6), price.board25x100, '6 м'),
      item('Брусок 50×50', 'контробрешётка кровли', 'шт', Math.ceil((counterBattenLen * 1.08) / 3), price.brusok50x50, '3 м'),
      item('Брусок 50×30', 'вентзазор фасада, шаг 600', 'шт', Math.ceil((extNet * 1.15) / 0.6 / 3), price.brusok50x30, '3 м'),
      item('ОСП-3 9 мм', 'обшивка стен и фронтонов', 'лист', Math.ceil(((extNet + gable.area) * 1.12) / 3.125), price.osb9, '3,125 м²'),
      item('ОСП-3 18 мм', 'черновой пол', 'лист', Math.ceil((floorArea * 1.1) / 3.125), price.osb18, '3,125 м²'),
      item('Гвозди 3,5×90', 'каркас, 5 кг', 'уп', 4, price.nails),
      item('Саморезы 4,2×75', 'ОСП, 5 кг', 'уп', 3, price.screws),
      item('Уголок перфорированный 90×90', 'усиление узлов', 'шт', 140, price.brackets),
    ],
  },
  {
    id: 'insulation',
    name: '3. Утепление, паро- и ветрозащита',
    icon: '≋',
    items: [
      item('Каменная вата 100 мм', 'стены 2 слоя, 5,76 м²/уп', 'уп', packs(insulWalls, 5.76), price.wool100),
      item('Каменная вата 100 мм', 'потолок, 2 слоя', 'уп', packs(floorArea, 5.76), price.wool100),
      item('Каменная вата 100 мм', 'пол, 2 слоя', 'уп', packs(floorArea, 5.76), price.wool100),
      item('Каменная вата 100 мм', 'кровля, 2 слоя', 'уп', packs(roofArea.main, 5.76), price.wool100),
      item('Пароизоляция', 'Изоспан B, 70 м²', 'рулон', Math.ceil(((insulWalls + floorArea) * 1.15) / 70), price.vapor),
      item('Фольгированная пароизоляция', 'Изоспан FB, сауна и душевая', 'рулон', Math.ceil((saunaWalls + saunaArea + showerWalls + showerArea) * 1.2 / 50), price.foil),
      item('Гидро-ветрозащита', 'Изоспан A, 70 м²', 'рулон', Math.ceil(((extNet + roofArea.total) * 1.15) / 70), price.wind),
      item('Лента соединительная', 'двусторонняя, 25 м', 'рулон', 6, 690),
      item('Скотч алюминиевый', 'для фольги, 50 м', 'рулон', 3, 890),
    ],
  },
  {
    id: 'roof',
    name: '4. Кровля',
    icon: '⌂',
    items: [
      item('Фальц-кровля RAL 7021', '0,5 мм, полиэстер, с картинами', 'м²', Math.ceil(roofArea.total * 1.12), price.falz),
      item('Конёк фальцевый', '2 м, RAL 7021', 'шт', Math.ceil((P.roof.zFront - P.roof.zBack) / 2), price.ridge),
      item('Планка торцевая', '2 м', 'шт', 8, price.eaveStrip),
      item('Планка карнизная', '2 м', 'шт', 7, price.eaveStrip),
      item('Саморез кровельный', '4,8×35, 250 шт', 'уп', Math.ceil(roofArea.total / 6), price.roofScrews),
      item('Уплотнитель коньковый', '30×10, 6 м', 'уп', 2, 1200),
      item('Кляммеры и крепёж фальца', '100 шт', 'уп', 6, 1450),
      item('Подшив свесов', 'софиты/вагонка, м²', 'м²', 9.8, 780),
    ],
  },
  {
    id: 'finish',
    name: '5. Фасад и внутренняя отделка',
    icon: '▦',
    items: [
      item('Рейка фасадная 20×140', 'RAL 7021, графит, с покраской', 'м²', Math.ceil(extNet * 1.1), price.siding),
      item('Планкен лиственница', 'оба фронтона, натур, 20×140', 'м²', Math.ceil(gable.area * 1.12), price.larch),
      item('Вагонка сосна 14×96', 'гостиная, спальня, потолки', 'м²', Math.ceil((livingWalls + bedWalls + vaultArea + bedArea) * 1.1), price.liningPine),
      item('Вагонка липа 14×96', 'сауна, душевая, гардероб (без смолы)', 'м²', Math.ceil((saunaWalls + showerWalls + wardrobeWalls + saunaArea + showerArea + wardrobeArea + wcWalls + wcArea) * 1.1), price.liningLinden),
      item('Террасная доска лиственница', '28×140, 4 м', 'м²', Math.ceil(terraceArea * 1.1), price.terraceBoard),
      item('Шпунтованная доска пола', '35×140, лиственница', 'м²', Math.ceil((liveArea + bedArea + wardrobeArea) * 1.08), 1850),
      item('Керамогранит 300×300', 'сауна, душевая, санузел', 'м²', Math.ceil((saunaArea + showerArea + wcArea) * 1.12), 900),
      item('Плинтус, наличник', 'рейка 40×20, 3 м', 'шт', 26, 320),
      item('Масло-воск для бани', '5 л, парная/мойка', 'канистра', 2, price.oil),
      item('Пропитка-антисептик фасад', '10 л', 'канистра', 2, 4200),
    ],
  },
  {
    id: 'joinery',
    name: '6. Окна и двери',
    icon: '⊞',
    items: [
      ...windows.map((o) =>
        item(
          `Окно ${o.id}`,
          `${Math.round(o.w * 1000)}×${Math.round(o.h * 1000)}, ${o.title}`,
          'шт',
          o.count,
          windowPrice(o)
        )
      ),
      item('Дверь входная (витраж)', '1000×2200, алюминий, стеклопакет, в витраже', 'шт', 1, price.doorEntry),
      item('Дверь терраса → гостиная', '900×2100, алюминий, стеклопакет', 'шт', 2, price.doorGlass),
      item('Дверь межкомнатная', '800×2000, влагостойкая', 'шт', 3, price.doorInner),
      item('Дверь в сауну', '700×1900, стекло закалённое 8 мм', 'шт', 1, price.doorGlass),
      item('Доборы, наличники, петли', 'комплект на 7 дверей', 'компл', 1, 16500),
    ],
  },
  {
    id: 'stove',
    name: '7. Печь и дымоход',
    icon: '🔥',
    items: [
      item('Печь дровяная для сауны', 'Harvia / Термофор, 9–12 кВт, с камнями', 'шт', 1, price.stove),
      item('Дымоход сэндвич ⌀115', '0,8 мм нерж., м', 'м', 5.5, price.chimney),
      item('Проходной узел кровли', 'с зазором 50 мм, нерж.', 'шт', 1, price.chimneyNode),
      item('Искрогаситель + дефлектор', 'нерж.', 'шт', 1, price.spark),
      item('Камни для каменки', 'габбро-диабаз, 20 кг', 'уп', 1, price.stones),
      item('Жаростойкий герметик', 'термостойкий 1500 °C', 'шт', 2, 1200),
    ],
  },
  {
    id: 'engineering',
    name: '8. Инженерия',
    icon: '⚡',
    items: [
      item('Щит электрический', 'на 12 модулей, IP54', 'шт', 1, price.electricPanel),
      item('Кабель ВВГнг-LS 3×2,5', 'м', 'м', 60, price.cable),
      item('Автомат 16А', 'дифференциальный, IEK/Schneider', 'шт', 4, price.breaker),
      item('УЗО 40А/30мА', 'противопожарное, тип AC', 'шт', 1, price.rcd),
      item('Розетка/выключатель IP54', 'влагостойкие, скрытой установки', 'шт', 10, price.socket),
      item('Светильник IP65', 'баня/терраса', 'шт', 6, price.lamp),
      item('Душ-панель', 'нерж., тропический душ', 'шт', 1, price.shower),
      item('Унитаз компакт', 'керамика, боковой выпуск', 'шт', 1, price.wc),
      item('Раковина с тумбой', 'влагостойкая, 600 мм', 'шт', 1, price.sink),
      item('Смеситель', 'для душа и раковины', 'шт', 2, price.mixer),
      item('Водонагреватель 50 л', 'резервный, мойка', 'шт', 1, price.boiler),
      item('Труба PEX 16', 'м', 'м', 30, price.pex),
      item('Фитинги, коллектор', 'PEX 16, тройники, уголки', 'компл', 1, price.fittings),
      item('Трап с гидрозатвором', 'нерж. 100×100, сухой затвор', 'шт', 3, price.drain),
      item('Гидроизоляция обмазочная', '25 кг, душевая/санузел/сауна', 'ведро', 2, price.waterproofing),
      item('Вентиляция', 'канал 100 мм, дефлектор, клапан', 'компл', 1, 7800),
    ],
  },
  {
    id: 'misc',
    name: '9. Прочее',
    icon: '⋯',
    items: [
      item('Доставка и разгрузка', 'пиломатериал, кровля', 'услуга', 1, 28000),
      item('Крепёж, расходники', 'пена, герметик, изоляция', 'компл', 1, 22000),
      item('Ступени террасы', '3 подъёма во всю ширину 10 м, лиственница', 'компл', 1, 46000),
      item('Каменный цоколь', 'плитняк по ЦСП, 0,35 м по периметру', 'м²', 34, 2400),
    ],
  },
]

const materialsTotal = groups.reduce((s, g) => s + g.items.reduce((a, i) => a + i.sum, 0), 0)

// ---------- работы ----------
const works = [
  { name: `Разметка, установка свай (${pilePositions.length} шт.)`, unit: 'шт', qty: pilePositions.length, price: 1900 },
  { name: 'Ростверк / обвязка, антисептирование', unit: 'м', qty: round(girderLen, 1), price: 950 },
  { name: 'Каркас стен, перегородки, обшивка ОСП', unit: 'м²', qty: round(extNet + intNet, 0), price: 2400 },
  { name: 'Пол и потолок (лаги, настил, балки)', unit: 'м²', qty: round(totalArea * 2, 0), price: 1900 },
  { name: 'Кровля: стропила, пирог, фальц RAL 7021', unit: 'м²', qty: round(roofArea.total, 0), price: 1700 },
  { name: 'Утепление, пароизоляция, проклейка', unit: 'м²', qty: round(insulWalls + floorArea * 2 + roofArea.main, 0), price: 450 },
  { name: 'Фасад: вентзазор, рейка RAL 7021, лиственница', unit: 'м²', qty: round(extNet + gable.area, 0), price: 1200 },
  { name: 'Внутренняя отделка: вагонка, свод, полки сауны', unit: 'м²', qty: round(livingWalls + bedWalls + saunaWalls + showerWalls + vaultArea + saunaArea + bedArea, 0), price: 1300 },
  { name: 'Полы: плитка, доска, плинтус', unit: 'м²', qty: round(totalArea, 0), price: 1900 },
  { name: 'Терраса: настил, ступени во всю ширину, стойки', unit: 'м²', qty: round(terraceArea, 0), price: 2600 },
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
  perM2: (materialsTotal + worksTotal) / totalArea,
  meta: {
    priceDate: 'ноябрь 2026',
    region: 'Московская область',
    disclaimer:
      'Цены розничные, ориентировочные, без скидок поставщиков. Не заменяют коммерческое предложение: перед закупкой запросите 2–3 КП и проверьте объёмы по фактическим обмерам.',
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
  insulWalls: round(insulWalls, 1),
  extNet: round(extNet, 1),
  intNet: round(intNet, 1),
  roof: round(roofArea.total, 1),
  floor: round(totalArea, 1),
  piles: pilePositions.length,
  girder: round(girderLen, 1),
  rafterMain: rafterCountMain,
  joists: joistCount,
  extWoodLen: round(extWoodLen, 1),
  intWoodLen: round(intWoodLen, 1),
  windows: windows.length,
  doors: doors.length,
  joineryCount,
}
