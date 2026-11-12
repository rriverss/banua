/**
 * Параметрическая модель бани с комнатой отдыха «Палома» 11,0 × 6,5 м
 * (тёплый блок 7 × 5 + Г-образная терраса 32 м²).
 *
 * Единственный источник геометрии: 3D-сцена, листы и ведомость материалов
 * считаются из этих данных. Размеры — по демо-проекту dokadom.com «Палома»
 * (план на отм. 0,000, разрезы 1–1 и 2–2, план свайного поля).
 *
 * Система координат: X — вдоль главного фасада (0…11), Z — в глубину (0…6,5),
 * Y — вверх, 0.000 = уровень чистого пола.
 * Тёплый блок: x 4…11, z 0…5. Терраса: полоса x 0…4 (z 0…6,5) и
 * фронтонная полоса x 4…8 (z 5…6,5). Угол x 8…11, z 5…6,5 — открытая площадка
 * под свесом кровли (дровник).
 */

const D2R = Math.PI / 180

export const project = {
  title: 'Баня «Палома»',
  subtitle: '11,0 × 6,5 м: тёплый блок 7 × 5 + Г-образная терраса 32 м²',
  version: '1.0',
  region: 'Московская область',
  climate: {
    snow: 'III район, расчётная снеговая нагрузка 180 кг/м² (СП 20.13330)',
    wind: 'I район, 23 кг/м²',
    temp: 'расчётная зимняя температура −25 °C',
    soil: 'суглинок/песок, глубина промерзания 1,4 м (уточнить геологией)',
  },
  style:
    'Баня с комнатой отдыха в духе «Паломы»: горизонтальная имитация бруса, односкатная кровля из металлочерепицы, панорамное остекление на террасу, винтовые сваи без цоколя',
  dims: {
    W: 11.0, // габарит по X (терраса 0…4 + блок 4…11)
    D: 6.5, // габарит по Z (блок 0…5 + фронтонная терраса 5…6,5)
    x0: 4.0, // начало тёплого блока по X
    L: 7.0, // ширина тёплого блока
    depth: 5.0, // глубина тёплого блока
    terX: 8.0, // фронтонная терраса тянется до x = 8
    terrace: 1.5, // глубина фронтонной террасы (z 5…6,5)
    wallT: 0.15, // наружная стена (стойка 40×150)
    partT: 0.15, // перегородка (40×150)
    wallH: 2.314, // верх стены у заднего фасада (z = 0) = низ потолка
    ceilingRise: 0.1723, // прирост высоты потолка на 1 м по Z (уклон 1:5,8)
    partH: 2.2, // минимальная высота перегородки у задней стены
    plinth: 0, // каменного цоколя нет: сваи + деревянная забирка
    pileTop: -0.455, // верх сваи (КМ, лист 2)
    girder: 0.15, // брус обвязки 150×150
    joist: 0.2, // балки пола 50×200
    deck: 0.105, // настил: доска 25 + шпунт 36 + мембрана
    groundY: -0.75,
    terraceY: 0.04, // верх террасной доски 28 мм
    pileLen: 2.4, // ствол 2,4 м: −0,455…−2,855
  },
  roof: {
    pitch: 9.8, // ° (уклон 1:5,8 — односкатная)
    slope: 0.1723,
    y0: 2.53, // верх стропил при z = 0
    overhang: 0.6, // свес по X
    z0: -0.05, // край кровли у заднего фасада
    z1: 6.5, // край кровли по линии террасы
    rafter: 0.2, // стропило 50×200
    batten: 0.025, // обрешётка 25×100
    counter: 0.04, // контробрешётка 40×40
    lining: 0.016, // подшив потолка
    material: 'Металлочерепица 0,45 мм, RAL 7021, шаг волны 350',
  },
  glassWall: {
    // панорамное окно 3100 × 2260 в южной стене КО (ОТ-1)
    w: 3.1,
    top: 2.26,
    mullions: 3, // 4 полотна
  },
  piles: {
    dia: 0.108,
    length: 2.4,
    xs: [0.075, 2.075, 4.075, 6.075, 8.075, 10.925],
    zs: [0.075, 2.555, 4.985],
    front: [0.075, 2.075, 4.075, 6.075, 7.925], // фронтонный ряд по террасе (z 6,485)
  },
  frames: {
    spacing: 0.6,
    board: 0.04, // стойка 40×150
    plate: 0.04,
  },
}

const dm = project.dims
const R = project.roof

// ----- производные величины кровли (односкатная по Z, высокая сторона — к террасе)
export const roofY = (z) => R.y0 + R.slope * z
export const roofUnderY = (z) => roofY(z) - (R.rafter + R.batten + R.counter)
export const ceilingY = (z) => roofY(z) - (R.rafter + R.lining)

R.x0 = -R.overhang // кровля накрывает и террасу: свес 600 от оси 1
R.x1 = dm.W + R.overhang
R.yFront = roofY(R.z1)
R.yBack = roofY(R.z0)
R.angle = Math.atan(R.slope) / D2R
R.slopeLen = (R.z1 - R.z0) / Math.cos(R.angle * D2R)
R.width = R.x1 - R.x0

// ----- окна и двери (маркировка — по демо-проекту «Палома», лист 13)
export const openings = [
  {
    id: 'ОТ-1',
    kind: 'window',
    w: 3.1,
    h: 2.26,
    sill: 0,
    wall: 'B',
    u0: 0.15,
    title: 'панорамное окно комнаты отдыха на террасу',
    count: 1,
    glass: true,
  },
  {
    id: 'ОТ-2',
    kind: 'window',
    w: 0.64,
    h: 2.26,
    sill: 0,
    wall: 'C',
    u0: 3.66,
    title: 'узкое окно КО в пол, западный фасад',
    count: 1,
    glass: true,
  },
  {
    id: 'ОТ-3',
    kind: 'window',
    w: 0.64,
    h: 1.4,
    sill: 0.85,
    wall: 'D',
    u0: 3.41,
    title: 'окно душевой, восточный фасад',
    count: 1,
  },
  {
    id: 'ОТ-4',
    kind: 'window',
    w: 0.64,
    h: 1.4,
    sill: 0.85,
    wall: 'D',
    u0: 0.76,
    title: 'окно парной, восточный фасад',
    count: 1,
  },
  {
    id: 'ДП-1',
    kind: 'door',
    w: 1.6,
    h: 2.26,
    sill: 0,
    wall: 'C',
    u0: 0.76,
    title: 'двустворчатая террасная дверь из КО (стекло)',
    count: 1,
    glass: true,
    windows: 2,
  },
  {
    id: 'ДП-2',
    kind: 'door',
    w: 0.8,
    h: 2.1,
    sill: 0,
    wall: 'P1',
    u0: 1.35,
    title: 'дверь комната отдыха → душевая',
    count: 1,
    swingSide: 1,
    swingFrom: 'u1',
  },
  {
    id: 'ДП-3',
    kind: 'door',
    w: 0.7,
    h: 2.1,
    sill: 0,
    wall: 'P2',
    u0: 0.25,
    title: 'дверь душевая → санузел',
    count: 1,
    swingSide: 1,
    swingFrom: 'u0',
  },
  {
    id: 'ДП-4',
    kind: 'door',
    w: 0.7,
    h: 2.1,
    sill: 0,
    wall: 'P4',
    u0: 0.3,
    title: 'дверь душевая → парная (стекло)',
    count: 1,
    swingSide: -1,
    swingFrom: 'u0',
    glass: true,
  },
]

const op = (id) => {
  const o = openings.find((x) => x.id === id)
  return { ...o, u1: o.u0 + o.w, y0: o.sill, y1: o.sill + o.h }
}

// ----- стены
// A — задний фасад (ось Д, z = 0), B — фасад к террасе (ось Б, z = 5),
// C — западный (ось 2, x = 4), D — восточный (ось 5, x = 11)
export const walls = [
  {
    id: 'A',
    name: 'Задний фасад (ось Д)',
    kind: 'ext',
    a: { x: dm.x0, z: 0 },
    b: { x: dm.x0 + dm.L, z: 0 },
    thick: dm.wallT,
    outSign: -1,
    openings: [],
  },
  {
    id: 'B',
    name: 'Фасад к террасе (ось Б)',
    kind: 'ext',
    a: { x: dm.x0, z: dm.depth },
    b: { x: dm.x0 + dm.L, z: dm.depth },
    thick: dm.wallT,
    outSign: 1,
    openings: [op('ОТ-1')],
  },
  {
    id: 'C',
    name: 'Западный фасад (ось 2)',
    kind: 'ext',
    a: { x: dm.x0, z: 0 },
    b: { x: dm.x0, z: dm.depth },
    thick: dm.wallT,
    outSign: 1,
    openings: [op('ДП-1'), op('ОТ-2')],
  },
  {
    id: 'D',
    name: 'Восточный фасад (ось 5)',
    kind: 'ext',
    a: { x: dm.x0 + dm.L, z: dm.depth },
    b: { x: dm.x0 + dm.L, z: 0 },
    thick: dm.wallT,
    outSign: 1,
    openings: [op('ОТ-3'), op('ОТ-4')],
  },
  // ---- перегородки (все 150 мм, как на плане)
  {
    id: 'P1',
    name: 'Перегородка КО / мокрый блок',
    kind: 'int',
    a: { x: 7.85, z: 0.15 },
    b: { x: 7.85, z: 4.85 },
    thick: dm.partT,
    openings: [op('ДП-2')],
  },
  {
    id: 'P2',
    name: 'Перегородка санузел / душевая',
    kind: 'int',
    a: { x: 8.0, z: 1.195 },
    b: { x: 9.4, z: 1.195 },
    thick: dm.partT,
    openings: [op('ДП-3')],
  },
  {
    id: 'P3',
    name: 'Перегородка санузел / душевая (поперёк)',
    kind: 'int',
    a: { x: 9.475, z: 0.15 },
    b: { x: 9.475, z: 1.12 },
    thick: dm.partT,
    openings: [],
  },
  {
    id: 'P4',
    name: 'Перегородка душевая / парная',
    kind: 'int',
    a: { x: 8.0, z: 2.545 },
    b: { x: 10.85, z: 2.545 },
    thick: dm.partT,
    openings: [op('ДП-4')],
  },
]

for (const w of walls) {
  const dx = w.b.x - w.a.x
  const dz = w.b.z - w.a.z
  w.length = Math.hypot(dx, dz)
  w.angle = Math.atan2(dz, dx)
  w.dir = { x: dx / w.length, z: dz / w.length }
  w.normal = { x: -w.dir.z, z: w.dir.x }
  // высота верха стены: потолок в точке начала/конца (уклон только по Z)
  w.topA = ceilingY(w.a.z) - 0.01
  w.topB = ceilingY(w.b.z) - 0.01
  w.height = Math.max(w.topA, w.topB)
}

/** верх стены в локальной координате u (0…length) */
export function wallTopAt(w, u) {
  const t = u / w.length
  return w.topA + (w.topB - w.topA) * t
}

/** точка стены в мировых координатах */
export function wallPoint(w, u, n = 0) {
  return {
    x: w.a.x + w.dir.x * u + w.normal.x * n,
    z: w.a.z + w.dir.z * u + w.normal.z * n,
  }
}

// ----- помещения (чистые плоскости; перегородки вычтены)
const t = dm.wallT
const X0 = dm.x0
const X1 = dm.x0 + dm.L
const e = 0.005

export const rooms = [
  {
    id: 'ko',
    name: 'Комната отдыха',
    short: 'КО',
    no: '1',
    poly: [
      [X0 + t + e, t + e],
      [7.85 - e, t + e],
      [7.85 - e, dm.depth - t - e],
      [X0 + t + e, dm.depth - t - e],
    ],
    center: [5.85, 2.4],
    floor: 'Шпунтованная доска 36 мм, лиственница',
    ceiling: 'Подшив вагонкой по стропилам, 2,3…3,2 м',
  },
  {
    id: 'wc',
    name: 'Санузел',
    short: 'С/у',
    no: '2',
    poly: [
      [8.0 + e, t + e],
      [9.4 - e, t + e],
      [9.4 - e, 1.12 - e],
      [8.0 + e, 1.12 - e],
    ],
    center: [8.7, 0.62],
    floor: 'Керамогранит 300×300, трап',
    ceiling: 'Подшив вагонкой, 2,32 м',
  },
  {
    id: 'shower',
    name: 'Душевая',
    short: 'Душевая',
    no: '3',
    poly: [
      [9.55 + e, t + e],
      [X1 - t - e, t + e],
      [X1 - t - e, 2.47 - e],
      [8.0 + e, 2.47 - e],
      [8.0 + e, 1.27 - e],
      [9.55 + e, 1.27 - e],
    ],
    center: [9.6, 1.85],
    floor: 'Керамогранит 300×300 по гидроизоляции, трап',
    ceiling: 'Подшив вагонкой липа, 2,4 м',
  },
  {
    id: 'steam',
    name: 'Парная',
    short: 'Парная',
    no: '4',
    poly: [
      [8.0 + e, 2.62 + e],
      [X1 - t - e, 2.62 + e],
      [X1 - t - e, dm.depth - t - e],
      [8.0 + e, dm.depth - t - e],
    ],
    center: [9.4, 3.75],
    floor: 'Керамогранит 300×300, трап',
    ceiling: 'Вагонка липа по каркасу, 2,6 м',
  },
  {
    id: 'ter',
    name: 'Терраса',
    short: 'Терраса',
    no: '5',
    poly: [
      [0, 0],
      [X0, 0],
      [X0, dm.terX],
      [X0, dm.terX],
      [X0, dm.terX],
      [dm.terX, dm.depth],
      [dm.terX, dm.D],
      [0, dm.D],
    ],
    center: [2.0, 3.4],
    floor: 'Террасная доска лиственница 28×140',
    ceiling: 'Открытые стропила, подшив вагонкой',
  },
]

// Г-образная терраса: две полосы, без самопересечений
rooms.find((r) => r.id === 'ter').poly = [
  [0, 0],
  [X0, 0],
  [X0, dm.D],
  [0, dm.D],
]
// фронтонная полоса террасы — отдельным полигоном (площадь считается по двум)
const terFront = [
  [X0, dm.depth],
  [dm.terX, dm.depth],
  [dm.terX, dm.D],
  [X0, dm.D],
]

function polyArea(poly) {
  let s = 0
  for (let i = 0; i < poly.length; i++) {
    const [x1, z1] = poly[i]
    const [x2, z2] = poly[(i + 1) % poly.length]
    s += x1 * z2 - x2 * z1
  }
  return Math.abs(s) / 2
}
for (const r of rooms) {
  r.area = r.id === 'ter' ? polyArea(r.poly) + polyArea(terFront) : polyArea(r.poly)
}
export const terracePoly = terFront

export const totalArea = rooms.filter((r) => r.id !== 'ter').reduce((s, r) => s + r.area, 0)
export const terraceArea = rooms.find((r) => r.id === 'ter').area
export const heatedGross = dm.L * dm.depth
/** площадь застройки: тёплый блок + терраса (как 67,00 м² в демо-проекте) */
export const buildArea = heatedGross + terraceArea
export const roomArea = (id) => rooms.find((r) => r.id === id).area
export const perimeter = (id) => {
  const r = rooms.find((q) => q.id === id)
  let p = 0
  for (let i = 0; i < r.poly.length; i++) {
    const a = r.poly[i]
    const b = r.poly[(i + 1) % r.poly.length]
    p += Math.hypot(b[0] - a[0], b[1] - a[1])
  }
  return p
}
/** поверхность стен помещения до потолка (без пола и потолка) */
export const wallSkin = (id, holes = 0) => perimeter(id) * ceilingY(0.5 * dm.depth) - holes

// ----- фундамент: 23 винтовые сваи ⌀108×2400
export const pilePositions = [
  ...project.piles.zs.flatMap((z) => project.piles.xs.map((x) => ({ x, z }))), // 18
  ...project.piles.front.map((x) => ({ x, z: 6.485 })), // 5
]

/** линии обвязки (ростверк 150×150 по сваям) */
export const girders = [
  { x0: 0.0, z0: 0.075, x1: dm.W, z1: 0.075 },
  { x0: 0.0, z0: 2.555, x1: dm.W, z1: 2.555 },
  { x0: 0.0, z0: 4.985, x1: dm.W, z1: 4.985 },
  { x0: 0.0, z0: 6.485, x1: dm.terX, z1: 6.485 },
  { x0: 0.0, z0: 0.075, x1: 0.0, z1: 6.485 },
  { x0: dm.x0, z0: 0.075, x1: dm.x0, z1: 4.985 },
  { x0: dm.terX, z0: 4.985, x1: dm.terX, z1: 6.485 },
  { x0: dm.W, z0: 0.075, x1: dm.W, z1: 4.985 },
]

// ----- геометрические помощники
export function wallStudPositions(wall, spacing = project.frames.spacing) {
  const positions = new Set([0.02, wall.length - 0.02])
  for (let u = spacing; u < wall.length - 0.05; u += spacing) positions.add(round3(u))
  for (const o of wall.openings) {
    positions.add(round3(Math.max(0.03, o.u0 - 0.045)))
    positions.add(round3(o.u0))
    positions.add(round3(Math.min(wall.length - 0.03, o.u1)))
  }
  return [...positions]
    .filter((u) => u >= 0 && u <= wall.length)
    .filter((u) => !wall.openings.some((o) => u > o.u0 + 0.02 && u < o.u1 - 0.02))
    .sort((a, b) => a - b)
}

export function wallAreas(w) {
  // площадь стены с наклонным верхом (трапеция)
  const gross = ((w.topA + w.topB) / 2) * w.length
  const holes = w.openings.reduce((s, o) => s + (o.u1 - o.u0) * (o.y1 - o.y0), 0)
  return { gross, holes, net: gross - holes }
}

export const extWalls = walls.filter((w) => w.kind === 'ext')
export const intWalls = walls.filter((w) => w.kind === 'int')
export const extGross = extWalls.reduce((s, w) => s + wallAreas(w).gross, 0)
export const extHoles = extWalls.reduce((s, w) => s + wallAreas(w).holes, 0)
export const extNet = extGross - extHoles
export const intNet = intWalls.reduce((s, w) => s + wallAreas(w).net, 0)

/** площадь кровли (односкатная, 12,2 × 6,55 по скату) */
export const roofArea = {
  main: R.width * R.slopeLen,
  get total() {
    return this.main
  },
}

/** площадь потолка по стропилам (тёплый контур) */
export const ceilingArea = heatedGross

/** остекление: панорама ОТ-1 + узкое окно + две двери со стеклом */
export const glazing = (() => {
  const win = openings.filter((o) => o.kind === 'window').reduce((s, o) => s + o.w * o.h, 0)
  const doors = openings.filter((o) => o.kind === 'door' && o.glass).reduce((s, o) => s + o.w * o.h, 0)
  return { windows: +win.toFixed(2), doors: +doors.toFixed(2), total: +(win + doors).toFixed(2) }
})()

export const axisLabels = {
  x: [
    { at: 0, label: '1' },
    { at: 4.0, label: '2' },
    { at: 8.0, label: '3' },
    { at: 9.5, label: '4' },
    { at: 11.0, label: '5' },
  ],
  z: [
    { at: 0, label: 'Д' },
    { at: 1.27, label: 'Г' },
    { at: 2.57, label: 'В' },
    { at: 5.0, label: 'Б' },
    { at: 6.5, label: 'А' },
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
