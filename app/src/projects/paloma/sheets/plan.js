import { sheet, txt, line, rect, poly, path, circle, dimH, dimV, axisMark, INK } from '../../../schematics/svg.js'
import {
  project as P,
  walls,
  rooms,
  openings,
  totalArea,
  terraceArea,
  buildArea,
  terracePoly,
  pilePositions,
} from '../project.js'

export const mm = (v) => String(Math.round(v * 1000)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

const S = 66
const OX = 132
const OY = 128
const X = (x) => OX + x * S
const Y = (z) => OY + z * S

const DIM = '#6d6a63'
const ACCENT = '#a9693a'

const dm = P.dims
const W = dm.W
const D = dm.D

/** точка стены в локальных координатах (u вдоль, n поперёк) */
function wp(w, u, n) {
  const x = w.a.x + w.dir.x * u + w.normal.x * n
  const z = w.a.z + w.dir.z * u + w.normal.z * n
  return [X(x), Y(z)]
}

function wallSegment(w, u0, u1, fill = '#efe4d3') {
  const t = w.thick / 2
  return poly([wp(w, u0, -t), wp(w, u1, -t), wp(w, u1, t), wp(w, u0, t)], { fill, stroke: INK, sw: 1.3 })
}

function openingSymbol(w, o) {
  const t = w.thick / 2
  let s = ''
  if (o.kind === 'window') {
    s += line(...wp(w, o.u0, -t), ...wp(w, o.u0, t), { stroke: INK, w: 1 })
    s += line(...wp(w, o.u1, -t), ...wp(w, o.u1, t), { stroke: INK, w: 1 })
    for (const n of [-t * 0.6, 0, t * 0.6]) {
      s += line(...wp(w, o.u0, n), ...wp(w, o.u1, n), { stroke: n === 0 ? INK : '#8b8579', w: n === 0 ? 1.1 : 0.9 })
    }
  } else {
    const side = o.swingSide || 1
    const hingeU = o.swingFrom === 'u1' ? o.u1 : o.u0
    const wdt = o.u1 - o.u0
    const dirU = o.swingFrom === 'u1' ? -1 : 1
    s += line(...wp(w, hingeU, 0), ...wp(w, hingeU, side * wdt), { stroke: INK, w: 1.2 })
    const pts = []
    for (let i = 0; i <= 12; i++) {
      const a = (i / 12) * (Math.PI / 2)
      const u = hingeU + dirU * wdt * Math.sin(a)
      const n = side * wdt * (1 - Math.cos(a))
      pts.push(wp(w, u, n))
    }
    s += path('M ' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L '), {
      stroke: '#8b8579',
      sw: 0.9,
      dash: '3 3',
    })
  }
  return s
}

function drawWalls() {
  let s = ''
  for (const w of walls) {
    const fill = w.kind === 'ext' ? '#dccbb0' : '#efe4d2'
    const sorted = [...w.openings].sort((a, b) => a.u0 - b.u0)
    let u = 0
    for (const o of sorted) {
      if (o.u0 > u) s += wallSegment(w, u, o.u0, fill)
      u = o.u1
    }
    if (u < w.length) s += wallSegment(w, u, w.length, fill)
    for (const o of sorted) s += symbolGlassFill(w, o) + openingSymbol(w, o)
  }
  return s
}

/** светлое заполнение проёма (стекло) */
function symbolGlassFill(w, o) {
  const t = w.thick / 2.2
  return poly([wp(w, o.u0, -t), wp(w, o.u1, -t), wp(w, o.u1, t), wp(w, o.u0, t)], {
    fill: '#dfeaf0',
    stroke: 'none',
    sw: 0,
  })
}

/** терраса: настил, доски, ступени, ограждение, стойки */
function drawTerrace() {
  let s = ''
  const ter = rooms.find((r) => r.id === 'ter')
  for (const p of [ter.poly, terracePoly]) {
    s += poly(
      p.map(([x, z]) => [X(x), Y(z)]),
      { fill: '#f7eddd', stroke: 'none', sw: 0 }
    )
  }
  // доски настила: вдоль X в западной полосе, вдоль X и во фронтонной
  for (let z = 0.1; z < D - 0.02; z += 0.155) {
    s += line(X(0), Y(z), X(dm.x0), Y(z), { stroke: '#e3d0b2', w: 0.5 })
  }
  for (let z = dm.depth + 0.1; z < D - 0.02; z += 0.155) {
    s += line(X(dm.x0), Y(z), X(dm.terX), Y(z), { stroke: '#e3d0b2', w: 0.5 })
  }
  // ограждение (запад и фронт)
  s += line(X(0.03), Y(0.1), X(0.03), Y(D - 0.05), { stroke: '#8a6a44', w: 2.2 })
  s += line(X(0.03), Y(D - 0.05), X(4.4), Y(D - 0.05), { stroke: '#8a6a44', w: 2.2 })
  // стойки 120×120
  for (const [x, z] of [
    [0.06, 0.12],
    [0.06, 3.3],
    [0.06, 6.42],
    [3.94, 6.42],
    [7.94, 6.42],
  ]) {
    s += rect(X(x) - 4, Y(z) - 4, 8, 8, { fill: '#d9a568', stroke: '#8a6a44', sw: 0.8 })
  }
  // ступени
  for (let i = 0; i < 3; i++) {
    s += rect(X(5.35), Y(D + 0.02 + i * 0.34), 2.3 * S, 0.34 * S, {
      fill: i % 2 ? '#f1e2ca' : '#e9d7bb',
      stroke: '#a98f62',
      sw: 0.7,
    })
  }
  s += txt(X(7.6), Y(D + 1.1), 'вход, 3 ступени', { size: 8, anchor: 'middle', fill: ACCENT, weight: 600 })
  // площадка под свесом (дровник)
  s += rect(X(dm.terX), Y(dm.depth), (dm.W - dm.terX) * S, (dm.D - dm.depth) * S, {
    fill: '#efeae0',
    stroke: '#b3a893',
    sw: 0.7,
    dash: '3 3',
  })
  for (let x = dm.terX + 0.3; x < dm.W - 0.1; x += 0.45) {
    s += line(X(x), Y(dm.depth + 0.25), X(x), Y(dm.D - 0.25), { stroke: '#d9d0c1', w: 0.6 })
  }
  s += txt(X((dm.terX + dm.W) / 2), Y(dm.D - 0.35), 'дровник', { size: 7.5, anchor: 'middle', fill: DIM })
  s += txt(X(2.0), Y(3.6), '5', { size: 9, anchor: 'middle', fill: ACCENT, weight: 700 })
  s += txt(X(2.0), Y(3.9), 'Терраса', { size: 11, anchor: 'middle', weight: 600 })
  s += txt(X(2.0), Y(4.15), '32,0 м²', { size: 9, anchor: 'middle', fill: DIM })
  return s
}

/** мебель и оборудование */
function furniture() {
  let s = ''
  const cab = { fill: '#f0e0c8', stroke: ACCENT, sw: 0.9 }
  const san = { fill: '#ffffff', stroke: '#7d8a90', sw: 0.9 }

  // ---- комната отдыха
  // диван у перегородки
  s += rect(X(6.35), Y(2.35), 0.95 * S, 2.1 * S, { fill: '#e9c9b8', stroke: '#a9693a', sw: 0.9 })
  s += txt(X(6.85), Y(3.4), 'диван', { size: 7, anchor: 'middle', fill: ACCENT, rotate: -90 })
  // обеденный стол и лавки
  s += rect(X(4.85), Y(2.75), 1.5 * S, 0.9 * S, { fill: '#f0e0c8', stroke: ACCENT, sw: 0.9 })
  s += rect(X(4.85), Y(2.4), 1.4 * S, 0.32 * S, { fill: '#f6ead6', stroke: '#b9a88c', sw: 0.7 })
  s += rect(X(4.85), Y(3.72), 1.4 * S, 0.32 * S, { fill: '#f6ead6', stroke: '#b9a88c', sw: 0.7 })
  s += txt(X(5.6), Y(3.28), 'стол 1500×900', { size: 7, anchor: 'middle', fill: ACCENT })
  // кухонный блок у задней стены
  s += rect(X(4.6), Y(0.15), 2.0 * S, 0.6 * S, { fill: '#efe3cd', stroke: ACCENT, sw: 0.9 })
  s += rect(X(4.95), Y(0.2), 0.42 * S, 0.4 * S, { fill: '#e6ebee', stroke: '#7d8a90', sw: 0.8 })
  s += rect(X(5.8), Y(0.2), 0.5 * S, 0.5 * S, { fill: '#c9ccce', stroke: '#4d5357', sw: 0.8 })
  s += txt(X(6.05), Y(0.85), 'кухня', { size: 7, anchor: 'middle', fill: ACCENT })
  s += rect(X(7.0), Y(0.15), 0.6 * S, 0.45 * S, { fill: '#dfe3e5', stroke: '#7d8a90', sw: 0.8 })
  s += txt(X(7.3), Y(0.5), 'х/к', { size: 6.5, anchor: 'middle', fill: DIM })
  // топчан у окна
  s += rect(X(4.3), Y(3.75), 0.7 * S, 1.0 * S, { fill: '#f3e3d0', stroke: ACCENT, sw: 0.9 })
  s += txt(X(4.65), Y(4.28), 'топчан', { size: 6, anchor: 'middle', fill: ACCENT, rotate: -90 })
  // телевизор на перегородке
  s += rect(X(7.5), Y(0.9), 0.09 * S, 1.1 * S, { fill: '#2c3033', stroke: INK, sw: 0.8 })

  // ---- санузел (x 8…9,4, z 0,15…1,12)
  s += rect(X(8.1), Y(0.3), 0.36 * S, 0.5 * S, { ...san, rx: 8 })
  s += rect(X(8.85), Y(0.2), 0.45 * S, 0.35 * S, { ...san, rx: 5 })
  s += rect(X(8.75), Y(0.75), 0.5 * S, 0.28 * S, { fill: '#dfe3e5', stroke: '#7d8a90', sw: 0.8 })
  s += txt(X(9.0), Y(0.92), 'бойлер', { size: 6, anchor: 'middle', fill: DIM })

  // ---- душевая (x 9,55…10,85 / ниша)
  s += rect(X(9.8), Y(0.2), 0.95 * S, 0.85 * S, { fill: '#eef2f4', stroke: '#7d8a90', sw: 0.9 })
  s += circle(X(10.3), Y(0.6), 3.5, { fill: '#7d8a90' })
  s += line(X(9.8), Y(1.08), X(10.75), Y(1.08), { stroke: '#7d8a90', w: 1.4 })
  s += txt(X(10.3), Y(1.35), 'душ', { size: 6.5, anchor: 'middle', fill: DIM })
  s += rect(X(8.1), Y(1.35), 0.42 * S, 1.15 * S, { fill: '#eed9b6', stroke: ACCENT, sw: 0.8 })
  s += txt(X(8.3), Y(1.95), 'полок', { size: 6, anchor: 'middle', fill: ACCENT, rotate: -90 })
  s += rect(X(8.75), Y(2.3), 0.45 * S, 0.09 * S, { fill: '#9aa3a8', stroke: '#6f7a80', sw: 0.7 })

  // ---- парная (x 8…10,85, z 2,62…4,85)
  s += rect(X(9.9), Y(2.75), 0.95 * S, 2.0 * S, { fill: '#eed9b6', stroke: ACCENT, sw: 0.8 })
  s += rect(X(9.35), Y(2.75), 0.5 * S, 2.0 * S, { fill: '#e6cda4', stroke: ACCENT, sw: 0.8 })
  s += txt(X(9.65), Y(3.7), 'полки', { size: 7, anchor: 'middle', fill: ACCENT, rotate: -90 })
  s += rect(X(8.12) - 11, Y(2.72) - 11, 22, 22, { fill: '#4a4a4a', stroke: INK, sw: 1 })
  s += txt(X(8.12), Y(2.72) + 4, 'П', { size: 9, anchor: 'middle', fill: '#fff', weight: 700 })
  s += rect(X(8.7), Y(4.5), 0.34 * S, 0.34 * S, { fill: '#e8dcc6', stroke: '#a98f62', sw: 0.7 })
  s += txt(X(8.85), Y(4.36), 'кадка', { size: 6, anchor: 'middle', fill: DIM })
  return s
}

export function planSheet() {
  const body = []
  body.push(txt(OX, 46, 'ПЛАН НА ОТМЕТКЕ 0,000', { size: 19, weight: 700, letter: 1.2 }))
  body.push(
    txt(OX, 66, 'Баня 11,0 × 6,5 м: тёплый блок 7 × 5 + Г-образная терраса 32 м². Размеры в мм', {
      size: 10.5,
      fill: DIM,
    })
  )

  // ---- оси
  for (const [x, l] of [
    [0, '1'],
    [dm.x0, '2'],
    [dm.terX, '3'],
    [9.5, '4'],
    [W, '5'],
  ]) {
    body.push(line(X(x), Y(-0.5), X(x), Y(D + 1.7), { stroke: '#b9b2a5', w: 0.8, dash: '14 4 3 4' }))
    body.push(axisMark(X(x), Y(-0.78), l))
  }
  for (const [z, l] of [
    [0, 'Д'],
    [1.27, 'Г'],
    [2.57, 'В'],
    [dm.depth, 'Б'],
    [D, 'А'],
  ]) {
    body.push(line(X(-0.9), Y(z), X(W + 0.5), Y(z), { stroke: '#b9b2a5', w: 0.8, dash: '14 4 3 4' }))
    body.push(axisMark(X(-1.35), Y(z), l))
  }

  // ---- проекция кровли (свес 600)
  body.push(
    rect(X(P.roof.x0), Y(P.roof.z0), (P.roof.x1 - P.roof.x0) * S, (P.roof.z1 - P.roof.z0) * S, {
      fill: 'none',
      stroke: '#b9a98f',
      sw: 0.9,
      dash: '10 4 2 4',
    })
  )
  body.push(drawTerrace())
  body.push(drawWalls())
  body.push(furniture())

  // ---- подписи помещений
  for (const r of rooms) {
    if (r.id === 'ter') continue
    const [cx, cz] = r.id === 'wc' ? [8.62, 0.5] : r.center
    const y = Y(cz)
    body.push(txt(X(cx), y - 6, r.no, { size: 9, anchor: 'middle', fill: ACCENT, weight: 700 }))
    body.push(txt(X(cx), y + 7, r.name, { size: 10, anchor: 'middle', weight: 600 }))
    body.push(txt(X(cx), y + 20, `${r.area.toFixed(1).replace('.', ',')} м²`, { size: 9, anchor: 'middle', fill: DIM }))
  }

  // ---- размерные цепочки
  const yd = Y(D) + 96
  body.push(dimH(X(0), X(dm.x0), yd, mm(dm.x0)))
  body.push(dimH(X(dm.x0), X(dm.terX), yd, mm(dm.terX - dm.x0)))
  body.push(dimH(X(dm.terX), X(9.5), yd, mm(1.5)))
  body.push(dimH(X(9.5), X(W), yd, mm(1.5)))
  body.push(dimH(X(0), X(W), yd + 34, mm(W)))
  const xd = X(0) - 42
  body.push(dimV(Y(0), Y(1.27), xd, mm(1.27)))
  body.push(dimV(Y(1.27), Y(2.57), xd, mm(1.3)))
  body.push(dimV(Y(2.57), Y(dm.depth), xd, mm(2.43)))
  body.push(dimV(Y(dm.depth), Y(D), xd, mm(1.5)))
  body.push(dimV(Y(0), Y(D), xd - 32, mm(D)))
  // внутренние размеры
  body.push(dimH(X(4.15), X(7.85), Y(0) - 26, '3 700'))
  body.push(dimH(X(8.0), X(10.85), Y(0) - 26, '2 850'))
  body.push(dimV(Y(0.15), Y(4.85), X(4.15) + 14, '4 700'))

  // ---- маркировка проёмов
  const mark = (id, x, z, dx = 0, dz = 0) =>
    body.push(txt(X(x) + dx, Y(z) + dz, id, { size: 8.5, fill: ACCENT, weight: 600 }))
  mark('ОТ-1 3100×2260', 5.7, dm.depth + 0.16, 0, 14)
  mark('ОТ-2', 3.88, 3.98, -30, 2)
  mark('ДП-1 1600×2260', 3.85, 1.6, -62, 0)
  mark('ОТ-3', 11.02, 1.25, 10, -6)
  mark('ОТ-4', 11.02, 3.9, 10, -6)
  mark('ДП-2', 7.92, 1.9, -30, 0)
  mark('ДП-3', 9.3, 1.16, 4, -9)
  mark('ДП-4', 8.6, 2.55, 0, 22)

  // ---- экспликация
  const tx = 902
  let ty = 128
  body.push(txt(tx, ty, 'ЭКСПЛИКАЦИЯ ПОМЕЩЕНИЙ', { size: 11, weight: 700, letter: 0.4 }))
  ty += 12
  const rowH = 26
  body.push(rect(tx, ty, 300, 22, { fill: '#f1ece2', stroke: INK, sw: 1 }))
  body.push(txt(tx + 8, ty + 15, '№', { size: 9, weight: 700 }))
  body.push(txt(tx + 38, ty + 15, 'Наименование', { size: 9, weight: 700 }))
  body.push(txt(tx + 292, ty + 15, 'Площадь', { size: 9, weight: 700, anchor: 'end' }))
  ty += 22
  for (const r of rooms) {
    body.push(rect(tx, ty, 300, rowH, { fill: '#fff', stroke: '#ded7c9', sw: 0.7 }))
    body.push(txt(tx + 8, ty + 17, r.no, { size: 9.5, fill: ACCENT, weight: 700 }))
    body.push(txt(tx + 38, ty + 12, r.name, { size: 9.5, weight: 600 }))
    body.push(txt(tx + 38, ty + 22, r.id === 'ter' ? 'открытая, под кровлей' : 'отапливаемое', { size: 7.2, fill: DIM }))
    body.push(txt(tx + 292, ty + 17, r.area.toFixed(1).replace('.', ',') + ' м²', { size: 9.5, anchor: 'end' }))
    ty += rowH
  }
  body.push(rect(tx, ty, 300, 24, { fill: '#f7f2e7', stroke: INK, sw: 1 }))
  body.push(txt(tx + 8, ty + 16, 'Тёплый контур', { size: 9.5, weight: 700 }))
  body.push(txt(tx + 292, ty + 16, totalArea.toFixed(1).replace('.', ',') + ' м²', { size: 9.5, weight: 700, anchor: 'end' }))
  ty += 24
  body.push(rect(tx, ty, 300, 24, { fill: '#f7f2e7', stroke: INK, sw: 1 }))
  body.push(txt(tx + 8, ty + 16, 'Всего с террасой', { size: 9.5, weight: 700 }))
  body.push(txt(tx + 292, ty + 16, (totalArea + terraceArea).toFixed(1).replace('.', ',') + ' м²', { size: 9.5, weight: 700, anchor: 'end' }))

  // ---- ТЭП
  ty += 42
  body.push(txt(tx, ty, 'ТЕХНИКО-ЭКОНОМИЧЕСКИЕ ПОКАЗАТЕЛИ', { size: 10, weight: 700, letter: 0.3 }))
  ty += 16
  const tep = [
    ['Площадь застройки', `${buildArea.toFixed(1).replace('.', ',')} м²`],
    ['Тёплый блок (наружный обмер)', `${(dm.L * dm.depth).toFixed(1).replace('.', ',')} м²`],
    ['Терраса', `${terraceArea.toFixed(1).replace('.', ',')} м²`],
    ['Габарит', '11,0 × 6,5 м'],
    ['Высота потолка', '2,3…3,2 м (по скату)'],
    ['Кровля', `${P.roof.pitch.toFixed(1).replace('.', ',')}° (1:5,8), односкатная`],
    ['Сваи', `${pilePositions.length} шт. ⌀108×2400`],
  ]
  for (const [k, v] of tep) {
    body.push(txt(tx, ty, k, { size: 8.6, fill: DIM }))
    body.push(txt(tx + 292, ty, v, { size: 8.8, weight: 600, anchor: 'end' }))
    ty += 14
  }

  // ---- обозначения
  ty += 12
  body.push(txt(tx, ty, 'ОБОЗНАЧЕНИЯ', { size: 9.5, weight: 700 }))
  ty += 16
  body.push(line(tx, ty, tx + 26, ty, { stroke: INK, w: 1.9 }))
  body.push(txt(tx + 34, ty + 3, 'наружная стена 150 мм (стойка 40×150)', { size: 8.2 }))
  ty += 14
  body.push(line(tx, ty, tx + 26, ty, { stroke: INK, w: 1.2 }))
  body.push(txt(tx + 34, ty + 3, 'перегородка 150 мм', { size: 8.2 }))
  ty += 14
  body.push(rect(tx, ty - 5, 16, 8, { fill: '#dfeaf0', stroke: '#7d8a90' }))
  body.push(txt(tx + 34, ty + 3, 'окно / витраж (по ведомости)', { size: 8.2 }))
  ty += 14
  body.push(circle(tx + 8, ty - 1, 6, { fill: '#4a4a4a', stroke: INK }))
  body.push(txt(tx + 34, ty + 3, 'печь 12 кВт, камни 20 кг', { size: 8.2 }))
  ty += 20
  body.push(txt(tx, ty, 'Отметка 0,000 = чистый пол. Верх свай −0,455.', { size: 8, fill: DIM }))
  body.push(txt(tx, ty + 12, 'Тёплый блок: x 4…11, z 0…5. Терраса: Г-образная.', { size: 8, fill: DIM }))

  return sheet({
    num: 1,
    title: 'План на отм. 0,000',
    subtitle: 'Планировка, оси, проёмы, оборудование, экспликация',
    scale: '1:50',
    body: body.join('\n'),
    note: 'Схема для производства работ. Перед началом — привязка к участку и проверка геологии.',
  })
}

export { openings }
