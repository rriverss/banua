/**
 * Параметрическая модель барнхауса «Марго» 10,0 × 9,5 м (тёплый блок 8 × 7 +
 * Г-образная терраса 2,5 м). Единственный источник геометрии: 3D-сцена, схемы
 * и ведомость материалов считаются из этих данных.
 *
 * Система координат: X — вдоль главного фасада (0…10), Z — в глубину (0…9,5),
 * Y — вверх, 0.000 = уровень чистого пола первого этажа.
 * Тёплый блок: x 2…10, z 0…7. Терраса: полоса z 7…9,5 и западная полоса x 0…2.
 */

const D2R = Math.PI / 180

export const project = {
  title: 'Барнхаус «Марго»',
  subtitle: '10,0 × 9,5 м, тёплый блок 8 × 7 м + терраса 30 м²',
  version: '2.0',
  region: 'Московская область',
  climate: {
    snow: 'III район, расчётная снеговая нагрузка 180 кг/м² (СП 20.13330)',
    wind: 'I район, 23 кг/м²',
    temp: 'расчётная зимняя температура −25 °C',
    soil: 'суглинок/песок, глубина промерзания 1,4 м (уточнить геологией)',
  },
  style: 'Барнхаус как «Марго»: деревянный фронтон со стеклом, графитовые боковые фасады, чёрный фальц, каменный цоколь',
  dims: {
    W: 10.0, // общий габарит по X (включая западную террасу 2 м)
    D: 9.5, // общий габарит по Z (включая террасу 2,5 м)
    x0: 2.0, // начало тёплого блока по X (западная терраса 0…2)
    L: 8.0, // ширина тёплого блока по X
    depth: 7.0, // глубина тёплого блока по Z
    terrace: 2.5, // глубина торцевой террасы (z 7…9,5)
    wallT: 0.2, // наружная стена
    partT: 0.1, // перегородка
    wallH: 2.9, // верхняя обвязка стен
    partH: 2.7, // перегородки
    ceiling: 2.7, // потолок над мокрым блоком и спальней
    plinth: 0.35, // каменный цоколь (видимая часть)
    pileTop: -0.5, // верх сваи = низ обвязки
    girder: 0.15,
    joist: 0.195,
    floorDeck: 0.018,
    groundY: -0.55,
  },
  roof: {
    pitch: 30, // уклон
    ridgeX: 6.0, // конёк вдоль Z по центру тёплого блока (x 2…10)
    overhang: 0.7, // карнизный свес по X
    eaveOverhang: 0.6, // свес по фронтонам (Z)
    eaveY: 2.62, // низ покрытия у карниза
  },
  glassWall: {
    // остекление южного фасада (ось В) — под свесом, фронтон выше — дерево
    wall: 'B',
    frame: 0.07,
    top: 2.55, // верх остекления (дальше — дерево фронтона)
    transom: 2.05, // верхняя лента
    mullions: [2.0, 3.3, 4.6, 5.9, 7.2, 8.5, 9.8],
  },
  plinth: {
    // каменный цоколь по периметру тёплого блока
    material: 'Камень-плитняк (песчаник) по ЦСП, шов 8–12 мм',
  },
  piles: {
    dia: 0.108,
    length: 2.5,
    xs: [2.15, 4.0, 5.9, 7.9, 9.85],
    zs: [0.15, 2.4, 4.6, 6.85, 9.35],
  },
  frames: {
    spacing: 0.6,
    board: 0.045,
    extDepth: 0.195,
    intDepth: 0.095,
    plate: 0.045,
  },
}

// ----- производные величины кровли -----
const tanMain = Math.tan(project.roof.pitch * D2R)
const R0 = project.roof
const dm = project.dims
R0.run = dm.L / 2 + R0.overhang // горизонтальный забег ската (4,7 м)
R0.ridgeY = R0.eaveY + R0.run * tanMain
R0.eaveX = dm.x0 - R0.overhang
R0.eaveRightX = dm.x0 + dm.L + R0.overhang
R0.zBack = -R0.eaveOverhang
R0.zFront = dm.D + R0.eaveOverhang
R0.slopeRun = R0.run
R0.slopeLen = R0.run / Math.cos(R0.pitch * D2R)
R0.slopeWidth = R0.zFront - R0.zBack
R0.ridgeLen = R0.slopeWidth

/** высота верха кровли для координаты x (конёк вдоль Z) */
export function roofY(x) {
  const { ridgeY, ridgeX, pitch } = project.roof
  return ridgeY - Math.abs(x - ridgeX) * Math.tan(pitch * D2R)
}

/** низ стропильной конструкции (по нижней грани стропила) */
export function roofUnderY(x) {
  return roofY(x) - 0.42
}

// ----- окна и двери -----
export const openings = [
  // окна
  { id: 'ОК-1', kind: 'window', w: 0.6, h: 0.6, sill: 1.55, wall: 'A', u0: 0.55, title: 'окно сауны', count: 1 },
  { id: 'ОК-2', kind: 'window', w: 1.2, h: 1.4, sill: 0.8, wall: 'A', u0: 6.2, title: 'окно спальни', count: 1 },
  { id: 'ОК-3', kind: 'window', w: 1.0, h: 1.6, sill: 0.9, wall: 'D', u0: 0.9, title: 'окно спальни, восточный фасад', count: 1 },
  { id: 'ОК-4', kind: 'window', w: 1.0, h: 1.0, sill: 1.05, wall: 'D', u0: 4.6, title: 'окно кухни', count: 1 },
  { id: 'ОК-5', kind: 'window', w: 1.4, h: 1.6, sill: 0.5, wall: 'C', u0: 3.5, title: 'окно гостиной на террасу', count: 1 },
  // двери
  { id: 'ДВ-1', kind: 'door', w: 1.0, h: 2.2, sill: 0, wall: 'B', u0: 2.6, title: 'входная дверь в витраже', count: 1, swingSide: 1, swingFrom: 'u0' },
  { id: 'ДВ-2', kind: 'door', w: 0.9, h: 2.1, sill: 0, wall: 'C', u0: 5.6, title: 'дверь гостиная → терраса', count: 1, swingSide: -1, swingFrom: 'u1' },
  { id: 'ДВ-3', kind: 'door', w: 0.8, h: 2.0, sill: 0, wall: 'P1a', u0: 0.6, title: 'дверь душевой', count: 1, swingSide: 1, swingFrom: 'u0' },
  { id: 'ДВ-4', kind: 'door', w: 0.7, h: 1.9, sill: 0, wall: 'P1a', u0: 2.2, title: 'дверь санузла', count: 1, swingSide: 1, swingFrom: 'u1' },
  { id: 'ДВ-5', kind: 'door', w: 0.9, h: 2.0, sill: 0, wall: 'P1a', u0: 3.9, title: 'дверь спальни', count: 1, swingSide: 1, swingFrom: 'u1' },
  { id: 'ДВ-6', kind: 'door', w: 0.7, h: 1.9, sill: 0, wall: 'P1b', u0: 1.4, title: 'дверь сауны (стекло)', count: 1, swingSide: 1, swingFrom: 'u0' },
  { id: 'ДВ-7', kind: 'door', w: 0.7, h: 1.9, sill: 0, wall: 'P5', u0: 0.5, title: 'дверь гардероба', count: 1, swingSide: 1, swingFrom: 'u0' },
]

function opening(u0, id) {
  const o = openings.find((x) => x.id === id)
  return { ...o, u0, u1: u0 + o.w, y0: o.sill, y1: o.sill + o.h }
}

const X0 = dm.x0
const X1 = dm.x0 + dm.L

// ----- стены -----
// A — северный фасад (z=0), B — южный остеклённый к террасе (z=7),
// C — западный (x=2), D — восточный (x=10)
export const walls = [
  {
    id: 'A',
    name: 'Северный фасад (ось А)',
    kind: 'ext',
    a: { x: X0, z: 0 },
    b: { x: X1, z: 0 },
    thick: dm.wallT,
    height: dm.wallH,
    outSign: -1,
    openings: [opening(0.55, 'ОК-1'), opening(5.3, 'ОК-2')],
  },
  {
    id: 'B',
    name: 'Южный фасад, витраж к террасе (ось В)',
    kind: 'ext',
    glass: true,
    a: { x: X0, z: dm.depth },
    b: { x: X1, z: dm.depth },
    thick: dm.wallT,
    height: dm.wallH,
    outSign: 1,
    openings: [opening(2.6, 'ДВ-1')],
  },
  {
    id: 'C',
    name: 'Западный фасад (ось 1)',
    kind: 'ext',
    a: { x: X0, z: 0 },
    b: { x: X0, z: dm.depth },
    thick: dm.wallT,
    height: dm.wallH,
    outSign: 1,
    openings: [opening(3.5, 'ОК-5'), opening(5.6, 'ДВ-2')],
  },
  {
    id: 'D',
    name: 'Восточный фасад (ось 4)',
    kind: 'ext',
    a: { x: X1, z: 0 },
    b: { x: X1, z: dm.depth },
    thick: dm.wallT,
    height: dm.wallH,
    outSign: -1,
    openings: [opening(0.9, 'ОК-3'), opening(4.6, 'ОК-4')],
  },
  // ---- перегородки северного блока (z 0…3,4): сауна, душевая, санузел, гардероб, спальня
  {
    id: 'P1a',
    name: 'Перегородка мокрый блок / гостиная',
    kind: 'int',
    a: { x: 4.5, z: 3.4 },
    b: { x: X1 - 0.1, z: 3.4 },
    thick: dm.partT,
    height: dm.partH,
    openings: [opening(0.6, 'ДВ-3'), opening(2.2, 'ДВ-4'), opening(3.9, 'ДВ-5')],
  },
  {
    id: 'P1b',
    name: 'Перегородка сауна / гостиная',
    kind: 'int',
    a: { x: X0 + 0.1, z: 2.65 },
    b: { x: 4.5, z: 2.65 },
    thick: dm.partT,
    height: dm.partH,
    openings: [opening(1.4, 'ДВ-6')],
  },
  {
    id: 'P2',
    name: 'Перегородка сауна / душевая',
    kind: 'int',
    a: { x: 4.5, z: 0 },
    b: { x: 4.5, z: 3.4 },
    thick: dm.partT,
    height: dm.partH,
    openings: [],
  },
  {
    id: 'P3',
    name: 'Перегородка душевая / гардероб и санузел',
    kind: 'int',
    a: { x: 5.7, z: 0 },
    b: { x: 5.7, z: 3.4 },
    thick: dm.partT,
    height: dm.partH,
    openings: [],
  },
  {
    id: 'P4',
    name: 'Перегородка гардероб / санузел',
    kind: 'int',
    a: { x: 5.7, z: 1.75 },
    b: { x: 7.0, z: 1.75 },
    thick: dm.partT,
    height: dm.partH,
    openings: [],
  },
  {
    id: 'P5',
    name: 'Перегородка гардероб / спальня',
    kind: 'int',
    a: { x: 7.0, z: 0 },
    b: { x: 7.0, z: 3.4 },
    thick: dm.partT,
    height: dm.partH,
    openings: [opening(0.5, 'ДВ-7')],
  },
]

for (const w of walls) {
  const dx = w.b.x - w.a.x
  const dz = w.b.z - w.a.z
  w.length = Math.hypot(dx, dz)
  w.angle = Math.atan2(dz, dx)
  w.dir = { x: dx / w.length, z: dz / w.length }
  w.normal = { x: -w.dir.z, z: w.dir.x }
}

// ----- помещения -----
const t = dm.wallT
const pt = dm.partT
const e = 0.005 // зазор «чистой» плоскости

export const rooms = [
  {
    id: 'sauna',
    name: 'Сауна',
    short: 'Сауна',
    no: '1.5',
    poly: [
      [X0 + t / 2, t / 2],
      [4.5 - pt / 2, t / 2],
      [4.5 - pt / 2, 2.65 - pt / 2],
      [X0 + t / 2, 2.65 - pt / 2],
    ],
    center: [3.25, 1.35],
    floor: 'Керамогранит 300×300, трап',
    ceiling: 'Вагонка липа, потолок 2,7 м',
  },
  {
    id: 'shower',
    name: 'Душевая',
    short: 'Душевая',
    no: '1.4',
    poly: [
      [4.5 + pt / 2, t / 2],
      [5.7 - pt / 2, t / 2],
      [5.7 - pt / 2, 3.4 - pt / 2],
      [4.5 + pt / 2, 3.4 - pt / 2],
    ],
    center: [5.1, 1.0],
    floor: 'Керамогранит 300×300 по гидроизоляции',
    ceiling: 'Вагонка липа, потолок 2,7 м',
  },
  {
    id: 'wardrobe',
    name: 'Гардероб',
    short: 'Гардероб',
    no: '1.6',
    poly: [
      [5.7 + pt / 2, t / 2],
      [7.0 - pt / 2, t / 2],
      [7.0 - pt / 2, 1.75 - pt / 2],
      [5.7 + pt / 2, 1.75 - pt / 2],
    ],
    center: [6.35, 0.9],
    floor: 'Шпунтованная доска',
    ceiling: 'Потолок 2,7 м',
  },
  {
    id: 'wc',
    name: 'Санузел',
    short: 'С/у',
    no: '1.7',
    poly: [
      [5.7 + pt / 2, 1.75 + pt / 2],
      [7.0 - pt / 2, 1.75 + pt / 2],
      [7.0 - pt / 2, 3.4 - pt / 2],
      [5.7 + pt / 2, 3.4 - pt / 2],
    ],
    center: [6.35, 2.6],
    floor: 'Керамогранит, трап',
    ceiling: 'Потолок 2,7 м',
  },
  {
    id: 'bed',
    name: 'Спальня',
    short: 'Спальня',
    no: '1.3',
    poly: [
      [7.0 + pt / 2, t / 2],
      [X1 - t / 2, t / 2],
      [X1 - t / 2, 3.4 - pt / 2],
      [7.0 + pt / 2, 3.4 - pt / 2],
    ],
    center: [8.45, 1.7],
    floor: 'Шпунтованная доска, лиственница',
    ceiling: 'Потолок 2,7 м, вагонка',
  },
  {
    id: 'living',
    name: 'Кухня-гостиная',
    short: 'ГОСТ',
    no: '1.2',
    poly: [
      [X0 + t / 2, 2.65 + pt / 2],
      [4.5 - pt / 2, 2.65 + pt / 2],
      [4.5 - pt / 2, 3.4 + pt / 2],
      [X1 - t / 2, 3.4 + pt / 2],
      [X1 - t / 2, dm.depth - t / 2],
      [X0 + t / 2, dm.depth - t / 2],
    ],
    center: [6.0, 5.3],
    floor: 'Шпунтованная доска, лиственница',
    ceiling: 'Свод по стропилам до конька, вагонка',
  },
  {
    id: 'ter',
    name: 'Терраса',
    short: 'Терраса',
    no: '1.1',
    poly: [
      [0, 4.5],
      [X0, 4.5],
      [X0, dm.depth],
      [dm.W, dm.depth],
      [dm.W, dm.D],
      [0, dm.D],
    ],
    center: [5.6, 8.3],
    floor: 'Террасная доска лиственница 28×140',
    ceiling: 'Открытые стропила, подшив вагонкой',
  },
]

/** площадь полигона (shoelace) */
function polyArea(poly) {
  let s = 0
  for (let i = 0; i < poly.length; i++) {
    const [x1, z1] = poly[i]
    const [x2, z2] = poly[(i + 1) % poly.length]
    s += x1 * z2 - x2 * z1
  }
  return Math.abs(s) / 2
}
for (const r of rooms) r.area = polyArea(r.poly)

export const totalArea = rooms.filter((r) => r.id !== 'ter').reduce((s, r) => s + r.area, 0)
export const terraceArea = rooms.find((r) => r.id === 'ter').area
export const buildArea = dm.W * dm.D

// ----- фундамент: сетка свай под тёплым блоком и террасой -----
export const terracePiles = [
  { x: 0.15, z: 4.6 },
  { x: 0.15, z: 7.0 },
  { x: 0.15, z: 9.3 },
  { x: 5.0, z: 9.3 },
  { x: 9.85, z: 9.3 },
  { x: 9.85, z: 7.3 },
]
export const pilePositions = [
  ...project.piles.zs.flatMap((z) => project.piles.xs.map((x) => ({ x, z }))),
  ...terracePiles,
]

/** линии обвязки (ростверка) */
export const girders = [
  ...project.piles.zs.map((z) => ({ x0: X0 - 0.075, z0: z, x1: X1 + 0.075, z1: z })),
  ...[project.piles.xs[0], 5.95, project.piles.xs[4]].map((x) => ({
    x0: x,
    z0: -0.075,
    x1: x,
    z1: dm.depth + 0.075,
  })),
  { x0: 0.075, z0: dm.depth, x1: dm.W - 0.075, z1: dm.depth },
  { x0: 0.075, z0: 4.5, x1: X0, z1: 4.5 },
  { x0: 0.075, z0: 4.5, x1: 0.075, z1: dm.depth },
  { x0: 9.925, z0: dm.depth, x1: 9.925, z1: dm.D },
]

// ----- геометрические помощники -----
export function wallStudPositions(wall, spacing = project.frames.spacing) {
  const positions = new Set([0, wall.length])
  for (let u = spacing; u < wall.length - 0.05; u += spacing) positions.add(round3(u))
  for (const o of wall.openings) {
    positions.add(round3(Math.max(0.05, o.u0 - 0.045)))
    positions.add(round3(o.u0))
    positions.add(round3(Math.min(wall.length - 0.05, o.u1)))
  }
  return [...positions]
    .filter((u) => !wall.openings.some((o) => u > o.u0 + 0.01 && u < o.u1 - 0.01))
    .sort((a, b) => a - b)
}

export function wallAreas(wall) {
  const gross = wall.length * wall.height
  const holes = wall.openings.reduce((s, o) => s + (o.u1 - o.u0) * (o.y1 - o.y0), 0)
  return { gross, holes, net: gross - holes }
}

/**
 * Фронтон — фигура между верхом стены (wallH) и скатом кровли, по всей ширине
 * габарита. Считаем отдельно для южного (z=7) и северного (z=0) торцов.
 */
export const gable = {
  // площадь фигуры = площадь треугольника кровли минус «срез» над террасой и свесами
  get height() {
    return project.roof.ridgeY - project.dims.wallH
  },
  get area() {
    // фронтон по ширине блока: треугольник 8 × 2,43 / 2 на каждом торце
    return (project.dims.L * this.height) / 2
  },
  count: 2,
  get total() {
    return this.area * this.count
  },
}

export const roofArea = {
  // одна двускатная кровля над всем габаритом 10 × 9,5 + свесы
  main: 2 * project.roof.slopeLen * project.roof.slopeWidth,
  get total() {
    return this.main
  },
}

/** остекление южного фасада: площадь стекла и длины профилей */
export const glazing = (() => {
  const GW = project.glassWall
  const L = project.dims.L
  const door = openings.find((o) => o.id === 'ДВ-1')
  const area = L * GW.top - door.w * door.h
  const frame =
    GW.mullions.length * GW.top * GW.frame + 3 * L * GW.frame + 2 * GW.transom * GW.frame
  return {
    area: +area.toFixed(2),
    net: +(area - frame).toFixed(2),
    height: GW.top,
    width: L,
  }
})()

export const axisLabels = {
  x: [
    { at: 0, label: '1' },
    { at: 2, label: '2' },
    { at: 4.5, label: '3' },
    { at: 5.75, label: '4' },
    { at: 7.0, label: '5' },
    { at: 10, label: '6' },
  ],
  z: [
    { at: 0, label: 'А' },
    { at: 2.2, label: 'Б' },
    { at: 3.4, label: 'В' },
    { at: 7, label: 'Г' },
    { at: 9.5, label: 'Д' },
  ],
}

export function round3(v) {
  return Math.round(v * 1000) / 1000
}

export function fmt(n, digits = 0) {
  return n.toLocaleString('ru-RU', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function money(n) {
  return fmt(Math.round(n)) + ' ₽'
}
