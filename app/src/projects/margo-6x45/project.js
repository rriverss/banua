/**
 * Параметрическая модель бани «Марго» 6,0 × 4,5 м с террасой 2,5 м.
 * Единственный источник геометрии: 3D-сцена, схемы и ведомость материалов
 * считаются из этих данных, поэтому цифры всегда сходятся между собой.
 *
 * Система координат: X — вдоль главного фасада (0…6), Z — в глубину (0…7),
 * Y — вверх, 0.000 = уровень чистого пола.
 */

const D2R = Math.PI / 180

export const project = {
  title: 'Баня «Марго»',
  subtitle: '6,0 × 4,5 м + терраса 2,5 м',
  version: '1.0',
  region: 'Московская область',
  climate: {
    snow: 'III район, расчётная снеговая нагрузка 180 кг/м² (СП 20.13330)',
    wind: 'I район, 23 кг/м²',
    temp: 'расчётная зимняя температура −25 °C',
    soil: 'суглинок/песок, глубина промерзания 1,4 м (уточнить геологией)',
  },
  style: 'Барнхаус (Barnhouse), как «Марго»: остеклённый фронтон, тёмный фасад, терраса под крышей',
  dims: {
    // W/x0/depth — совместимость с общим вьюером (в этой модели блок занимает всё x0…W)
    W: 6.0,
    x0: 0,
    depth: 4.5,
    L: 6.0, // ширина по X (ширина фронтона)
    D: 4.5, // глубина основного блока по Z
    terrace: 2.5, // вынос террасы
    wallT: 0.2, // наружная стена по осям
    partT: 0.1, // перегородка
    wallH: 2.7, // верхняя обвязка стен
    partH: 2.5, // перегородки / потолок
    ceiling: 2.5,
    pileTop: -0.345, // верх сваи = низ обвязки
    girder: 0.15,
    joist: 0.195,
    floorDeck: 0.018,
    groundY: -0.55,
  },
  roof: {
    pitch: 25, // уклон как у «Марго» (≈25°)
    ridgeX: 3.0, // конёк вдоль Z по центру ширины
    overhang: 0.4, // карнизный свес по X
    eaveOverhang: 0.35, // свес по фронтону (Z)
    surfaceAtWall: 2.96, // верх кровли над стеной X=0
    // ridgeY считается ниже
  },
  glassWall: {
    // остеклённый фронтон по оси Z=4.5
    wall: 'B',
    frame: 0.06, // сечение стойки витража, м
    transom: 2.1, // высота нижней ленты остекления
    mullions: [0.15, 1.2, 2.4, 3.0, 4.5, 5.85],
  },
  piles: {
    dia: 0.108,
    length: 2.5,
    xs: [0.15, 1.55, 2.95, 4.35, 5.85],
    zs: [0.15, 2.25, 4.45, 6.85],
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
R0.ridgeY = R0.surfaceAtWall + (project.dims.L / 2) * tanMain
R0.eaveX = -R0.overhang
R0.eaveRightX = project.dims.L + R0.overhang
R0.zBack = -R0.eaveOverhang
R0.zFront = project.dims.D + project.dims.terrace + R0.eaveOverhang
R0.slopeRun = project.dims.L / 2 + R0.overhang
R0.slopeLen = R0.slopeRun / Math.cos(project.roof.pitch * D2R)
R0.slopeWidth = R0.zFront - R0.zBack
R0.ridgeLen = R0.zFront - R0.zBack

/** высота верха кровли для координаты x (конёк вдоль Z) */
export function roofY(x) {
  const { ridgeY, ridgeX, pitch } = project.roof
  return ridgeY - Math.abs(x - ridgeX) * Math.tan(pitch * D2R)
}

/** низ стропильной конструкции (по нижней грани стропила) для координаты x */
export function roofUnderY(x) {
  return roofY(x) - 0.36
}

// ----- окна и двери -----
export const openings = [
  // окна
  { id: 'ОК-1', kind: 'window', w: 0.5, h: 0.5, sill: 1.35, wall: 'A', u0: 4.55, title: 'окно парной', count: 1 },
  { id: 'ОК-4', kind: 'window', w: 1.2, h: 1.2, sill: 0.9, wall: 'C', u0: 2.85, title: 'окно комнаты отдыха', count: 1 },
  { id: 'ОК-5', kind: 'window', w: 0.7, h: 0.7, sill: 1.4, wall: 'D', u0: 3.3, title: 'окно мойки', count: 1 },
  // двери
  { id: 'ДВ-1', kind: 'door', w: 0.9, h: 2.0, sill: 0, wall: 'B', u0: 1.75, title: 'входная дверь в витраже', count: 1, swingSide: -1, swingFrom: 'u0' },
  { id: 'ДВ-2', kind: 'door', w: 0.7, h: 2.0, sill: 0, wall: 'P1', u0: 3.4, title: 'дверь КО → мойка', count: 1, swingSide: 1, swingFrom: 'u1' },
  { id: 'ДВ-3', kind: 'door', w: 0.6, h: 1.9, sill: 0, wall: 'P2', u0: 1.3, title: 'дверь мойка → парная (стекло)', count: 1, swingSide: 1, swingFrom: 'u0' },
]

function opening(u0, id) {
  const o = openings.find((x) => x.id === id)
  return { ...o, u0, u1: u0 + o.w, y0: o.sill, y1: o.sill + o.h }
}

// ----- стены -----
export const walls = [
  {
    id: 'A',
    name: 'Фасад задний (ось А)',
    kind: 'ext',
    a: { x: 0, z: 0 },
    b: { x: 6, z: 0 },
    thick: project.dims.wallT,
    height: project.dims.wallH,
    outSign: -1,
    openings: [opening(4.55, 'ОК-1')],
  },
  {
    id: 'B',
    name: 'Фронтон остеклённый, к террасе (ось В)',
    kind: 'ext',
    glass: true,
    a: { x: 0, z: 4.5 },
    b: { x: 6, z: 4.5 },
    thick: project.dims.wallT,
    height: project.dims.wallH,
    outSign: 1,
    openings: [opening(1.75, 'ДВ-1')],
  },
  {
    id: 'C',
    name: 'Фасад левый (ось 1)',
    kind: 'ext',
    a: { x: 0, z: 0 },
    b: { x: 0, z: 4.5 },
    thick: project.dims.wallT,
    height: project.dims.wallH,
    outSign: 1,
    openings: [opening(2.85, 'ОК-4')],
  },
  {
    id: 'D',
    name: 'Фасад правый (ось 3)',
    kind: 'ext',
    a: { x: 6, z: 0 },
    b: { x: 6, z: 4.5 },
    thick: project.dims.wallT,
    height: project.dims.wallH,
    outSign: -1,
    openings: [opening(3.3, 'ОК-5')],
  },
  {
    id: 'P1',
    name: 'Перегородка КО / мойка',
    kind: 'int',
    a: { x: 3, z: 0 },
    b: { x: 3, z: 4.45 },
    thick: project.dims.partT,
    height: project.dims.partH,
    openings: [opening(3.4, 'ДВ-2')],
  },
  {
    id: 'P2',
    name: 'Перегородка парная / мойка',
    kind: 'int',
    a: { x: 3, z: 2.2 },
    b: { x: 6, z: 2.2 },
    thick: project.dims.partT,
    height: project.dims.partH,
    openings: [opening(1.3, 'ДВ-3')],
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
const t = project.dims.wallT
const pt = project.dims.partT

export const rooms = [
  {
    id: 'ko',
    name: 'Комната отдыха',
    short: 'КО',
    area: (3 - t / 2 - t / 2) * (4.5 - t / 2 - t / 2 - 0.0),
    poly: [
      [t / 2, t / 2],
      [3 - pt / 2, t / 2],
      [3 - pt / 2, 4.5 - t / 2],
      [t / 2, 4.5 - t / 2],
    ],
    center: [1.5, 2.3],
    floor: 'Шпунтованная доска 35 мм (лиственница)',
    ceiling: 'Вагонка сосна 14×96, потолок 2,5 м',
  },
  {
    id: 'par',
    name: 'Парная',
    short: 'Парная',
    area: (6 - t / 2 - (3 + pt / 2)) * (2.2 - pt / 2 - t / 2),
    poly: [
      [3 + pt / 2, t / 2],
      [6 - t / 2, t / 2],
      [6 - t / 2, 2.2 - pt / 2],
      [3 + pt / 2, 2.2 - pt / 2],
    ],
    center: [4.5, 1.15],
    floor: 'Керамогранит 300×300, трап в мойку',
    ceiling: 'Вагонка липа, потолок 2,5 м',
  },
  {
    id: 'moy',
    name: 'Мойка',
    short: 'Мойка',
    area: (6 - t / 2 - (3 + pt / 2)) * (4.5 - t / 2 - (2.2 + pt / 2)),
    poly: [
      [3 + pt / 2, 2.2 + pt / 2],
      [6 - t / 2, 2.2 + pt / 2],
      [6 - t / 2, 4.5 - t / 2],
      [3 + pt / 2, 4.5 - t / 2],
    ],
    center: [4.5, 3.35],
    floor: 'Керамогранит 300×300 по гидроизоляции, трап',
    ceiling: 'Вагонка липа, потолок 2,5 м',
  },
  {
    id: 'ter',
    name: 'Терраса',
    short: 'Терраса',
    area: 6 * 2.5,
    poly: [
      [0, 4.5],
      [6, 4.5],
      [6, 7],
      [0, 7],
    ],
    center: [3, 5.75],
    floor: 'Террасная доска лиственница 28×140',
    ceiling: 'Открытые стропила, подшив вагонкой',
  },
]

/** площадь полигона (shoelace) — используем вместо ручных формул */
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

export const totalArea = rooms
  .filter((r) => r.id !== 'ter')
  .reduce((s, r) => s + r.area, 0)
export const terraceArea = rooms.find((r) => r.id === 'ter').area

// ----- фундамент -----
export const pilePositions = project.piles.zs.flatMap((z) =>
  project.piles.xs.map((x) => ({ x, z }))
)

/** линии обвязки (ростверка) */
export const girders = [
  ...project.piles.zs.map((z) => ({ x0: -0.075, z0: z, x1: 6.075, z1: z })),
  ...[project.piles.xs[0], 2.95, project.piles.xs[4]].map((x) => ({
    x0: x,
    z0: -0.075,
    x1: x,
    z1: 6.925,
  })),
]

// ----- геометрические помощники (общие для 3D и сметы) -----
export function wallStudPositions(wall, spacing = project.frames.spacing) {
  const positions = new Set([0, wall.length])
  for (let u = spacing; u < wall.length - 0.05; u += spacing) positions.add(round3(u))
  for (const o of wall.openings) {
    positions.add(round3(Math.max(0.05, o.u0 - 0.045)))
    positions.add(round3(o.u0))
    positions.add(round3(Math.min(wall.length - 0.05, o.u1)))
  }
  // стойки, попавшие внутрь проёма, не нужны
  return [...positions]
    .filter(
      (u) =>
        !wall.openings.some((o) => u > o.u0 + 0.01 && u < o.u1 - 0.01)
    )
    .sort((a, b) => a - b)
}

export function wallAreas(wall) {
  const gross = wall.length * wall.height
  const holes = wall.openings.reduce((s, o) => s + (o.u1 - o.u0) * (o.y1 - o.y0), 0)
  return { gross, holes, net: gross - holes }
}

export const gable = {
  height: project.roof.ridgeY - project.dims.wallH,
  count: 2,
  get area() {
    return ((project.dims.L * this.height) / 2) * this.count
  },
}

export const roofArea = {
  // единая двускатная кровля над домом и террасой: 2 ската × длина 7,7 м
  main: 2 * project.roof.slopeLen * project.roof.slopeWidth,
  get total() {
    return this.main
  },
}

/** остеклённый фронтон: площадь стекла и длина профиля */
export const glazing = (() => {
  const L = project.dims.L
  const H = project.dims.wallH
  const door = openings.find((o) => o.id === 'ДВ-1')
  const lower = L * H - door.w * door.h
  const upper = (L * gable.height) / 2
  const frame =
    (project.glassWall.mullions.length * H + 2 * L + 3 * project.glassWall.transom) * project.glassWall.frame
  return {
    area: +(lower + upper).toFixed(2),
    net: +(lower + upper - frame).toFixed(2),
    gableArea: +upper.toFixed(2),
  }
})()

export const axisLabels = {
  x: [
    { at: 0, label: '1' },
    { at: 3, label: '2' },
    { at: 6, label: '3' },
  ],
  z: [
    { at: 0, label: 'А' },
    { at: 2.2, label: 'Б' },
    { at: 4.5, label: 'В' },
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
