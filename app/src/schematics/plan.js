import { sheet, txt, line, rect, poly, path, circle, dimH, dimV, axisMark, callout, INK } from './svg.js'
import { project as P, walls, rooms, totalArea, terraceArea, buildArea, openings, pilePositions } from '../model/project.js'

export const mm = (v) =>
  String(Math.round(v * 1000)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

const S = 58
const OX = 150
const OY = 118
const X = (x) => OX + x * S
const Y = (z) => OY + z * S

const DIM = '#6d6a63'
const ACCENT = '#a9693a'

const W = P.dims.W
const D = P.dims.D
const depth = P.dims.depth
const terrace = P.dims.terrace

/** точка стены в локальных координатах (u вдоль, n поперёк) */
function wp(w, u, n) {
  const x = w.a.x + w.dir.x * u + w.normal.x * n
  const z = w.a.z + w.dir.z * u + w.normal.z * n
  return [X(x), Y(z)]
}

function wallSegment(w, u0, u1, fill = '#efe4d3') {
  const t = w.thick / 2
  return poly([wp(w, u0, -t), wp(w, u1, -t), wp(w, u1, t), wp(w, u0, t)], {
    fill,
    stroke: INK,
    sw: 1.3,
  })
}

function openingSymbol(w, o) {
  const t = w.thick / 2
  let s = ''
  if (o.kind === 'window') {
    s += line(...wp(w, o.u0, -t), ...wp(w, o.u0, t), { stroke: INK, w: 1 })
    s += line(...wp(w, o.u1, -t), ...wp(w, o.u1, t), { stroke: INK, w: 1 })
    for (const n of [-t * 0.55, 0, t * 0.55]) {
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
    const fill = w.kind === 'ext' ? '#efe4d3' : '#f4ece0'
    const sorted = [...w.openings].sort((a, b) => a.u0 - b.u0)
    let u = 0
    for (const o of sorted) {
      if (o.u0 > u) s += wallSegment(w, u, o.u0, fill)
      u = o.u1
    }
    if (u < w.length) s += wallSegment(w, u, w.length, fill)
    for (const o of sorted) s += openingSymbol(w, o)
  }
  return s
}

/** Г-образная терраса: настил, доски, ступени */
function drawTerrace() {
  let s = ''
  const ter = rooms.find((r) => r.id === 'ter')
  s += poly(
    ter.poly.map(([x, z]) => [X(x), Y(z)]),
    { fill: '#f7eddd', stroke: 'none', sw: 0 }
  )
  // доски настила
  for (let x = 0.15; x < W - 0.05; x += 0.145) {
    s += line(X(x), Y(depth), X(x), Y(D), { stroke: '#e3d0b2', w: 0.5 })
  }
  for (let z = 4.55; z < depth; z += 0.145) {
    s += line(X(0), Y(z), X(P.dims.x0), Y(z), { stroke: '#e3d0b2', w: 0.5 })
  }
  // ступени во всю ширину
  for (let i = 0; i < 3; i++) {
    s += rect(X(0), Y(D + 0.02 + i * 0.34), W * S, 0.34 * S, {
      fill: i % 2 ? '#f1e2ca' : '#e9d7bb',
      stroke: '#a98f62',
      sw: 0.7,
    })
  }
  s += txt(X(W / 2), Y(D + 1.38), 'вход, 3 ступени', { size: 8.5, anchor: 'middle', fill: ACCENT, weight: 600 })
  // стойки кровли
  for (const x of [P.dims.x0 + 0.25, P.dims.x0 + P.dims.L - 0.25]) {
    s += rect(X(x) - 4, Y(D - 0.3) - 4, 8, 8, { fill: '#d9a568', stroke: '#8a6a44', sw: 0.8 })
  }
  return s
}

/** мебель и оборудование */
function furniture() {
  let s = ''
  const cab = { fill: '#f0e0c8', stroke: ACCENT, sw: 0.9 }
  const san = { fill: '#ffffff', stroke: '#7d8a90', sw: 0.9 }

  // сауна: полки вдоль западной стены, печь в юго-восточном углу
  s += rect(X(2.15), Y(0.25), 0.55 * S, 2.1 * S, { fill: '#eed9b6', stroke: ACCENT, sw: 0.8 })
  s += rect(X(2.7), Y(0.25), 0.45 * S, 2.1 * S, { fill: '#e6cda4', stroke: ACCENT, sw: 0.8 })
  s += txt(X(2.95), Y(1.3), 'полки', { size: 7.5, anchor: 'middle', fill: ACCENT, rotate: -90 })
  s += rect(X(3.82) - 14, Y(0.42) - 14, 28, 28, { fill: '#4a4a4a', stroke: INK, sw: 1 })
  s += txt(X(3.82), Y(0.42) + 4, 'П', { size: 10, anchor: 'middle', fill: '#fff', weight: 700 })

  // душевая: поддон, экран, полотенцесушитель
  s += rect(X(4.6), Y(0.2), 0.75 * S, 0.9 * S, { fill: '#eef2f4', stroke: '#7d8a90', sw: 0.9 })
  s += circle(X(5.0), Y(0.65), 4, { fill: '#7d8a90' })
  s += line(X(4.6), Y(1.2), X(5.35), Y(1.2), { stroke: '#7d8a90', w: 1.4 })
  s += txt(X(4.75), Y(2.6), 'С', { size: 8, fill: '#7d8a90', weight: 600 })

  // санузел
  s += rect(X(6.15), Y(2.45), 0.36 * S, 0.55 * S, { ...san, rx: 8 })
  s += rect(X(5.75), Y(1.85), 0.4 * S, 0.35 * S, { ...san, rx: 5 })

  // гардероб: шкафы
  s += rect(X(5.78), Y(0.15), 1.15 * S, 0.5 * S, { fill: '#e8dcc6', stroke: '#a98f62', sw: 0.8 })
  s += txt(X(6.35), Y(0.82), 'шкафы', { size: 7, anchor: 'middle', fill: DIM })

  // спальня: кровать, тумбы, шкаф
  s += rect(X(7.9), Y(0.25), 1.7 * S, 2.05 * S, { fill: '#f3e3d0', stroke: ACCENT, sw: 1 })
  s += rect(X(7.9), Y(0.25), 1.7 * S, 0.35 * S, { fill: '#e7d2b6', stroke: ACCENT, sw: 0.8 })
  s += rect(X(7.5), Y(0.25), 0.4 * S, 0.4 * S, cab)
  s += rect(X(9.6), Y(0.25), 0.4 * S, 0.4 * S, cab)
  s += rect(X(9.2), Y(2.7), 0.65 * S, 0.62 * S, { fill: '#e8dcc6', stroke: '#a98f62', sw: 0.8 })
  s += txt(X(8.75), Y(1.3), 'кровать 1600×2000', { size: 7, anchor: 'middle', fill: ACCENT })

  // гостиная: кухня вдоль восточной стены
  s += rect(X(9.3), Y(3.55), 0.6 * S, 3.1 * S, { fill: '#efe3cd', stroke: ACCENT, sw: 0.9 })
  s += rect(X(9.4), Y(4.05), 0.4 * S, 0.5 * S, { fill: '#e6ebee', stroke: '#7d8a90', sw: 0.8 })
  s += rect(X(9.35), Y(5.35), 0.5 * S, 0.55 * S, { fill: '#c9ccce', stroke: '#4d5357', sw: 0.8 })
  s += circle(X(9.55), Y(5.5), 3.5, { fill: '#4d5357' })
  s += circle(X(9.55), Y(5.75), 3.5, { fill: '#4d5357' })
  s += txt(X(9.6), Y(3.85), 'кухня', { size: 7, anchor: 'middle', fill: ACCENT, rotate: -90 })
  s += rect(X(9.1), Y(6.35), 0.65 * S, 0.55 * S, { fill: '#dfe3e5', stroke: '#7d8a90', sw: 0.8 })
  s += txt(X(9.42), Y(6.62), 'х/к', { size: 6.5, anchor: 'middle', fill: DIM })

  // обеденный стол и стулья
  s += rect(X(6.75), Y(5.65), 1.7 * S, 0.9 * S, { fill: '#f0e0c8', stroke: ACCENT, sw: 0.9 })
  for (const [x, z] of [[7.0, 5.35], [8.2, 5.35], [7.0, 6.35], [8.2, 6.35]]) {
    s += rect(X(x) - 11, Y(z) - 9, 22, 18, { fill: '#f6ead6', stroke: '#b9a88c', sw: 0.7 })
  }
  s += txt(X(7.6), Y(6.15), 'стол 1700×900', { size: 7, anchor: 'middle', fill: ACCENT })

  // диван и кофейный стол
  s += rect(X(2.3), Y(4.0), 0.95 * S, 2.2 * S, { fill: '#e9c9b8', stroke: '#a9693a', sw: 0.9 })
  s += rect(X(2.3), Y(4.0), 0.95 * S, 0.18 * S, { fill: '#dfb8a4', stroke: '#a9693a', sw: 0.7 })
  s += rect(X(2.3), Y(6.02), 0.95 * S, 0.18 * S, { fill: '#dfb8a4', stroke: '#a9693a', sw: 0.7 })
  s += txt(X(2.78), Y(5.1), 'диван', { size: 7, anchor: 'middle', fill: ACCENT, rotate: -90 })
  s += rect(X(3.6), Y(4.85), 0.95 * S, 0.55 * S, { fill: '#f0e0c8', stroke: ACCENT, sw: 0.8 })
  s += txt(X(4.07), Y(5.15), 'стол', { size: 7, anchor: 'middle', fill: DIM })

  // стеллаж у перегородки
  s += rect(X(2.45), Y(3.55), 1.3 * S, 0.35 * S, { fill: '#e8dcc6', stroke: '#a98f62', sw: 0.8 })
  return s
}

const openX = (o) => (o.x0 !== undefined ? o.x0 : 2 + o.u0)

/** витраж южного фасада (не входит в массив walls) */
function drawGlazing() {
  const g = P.glassWall
  const z = P.dims.depth
  const d = openings.find((o) => o.id === 'ДВ-1')
  let s = ''
  s += line(X(P.dims.x0), Y(z) - 3, X(P.dims.x0 + P.dims.L), Y(z) - 3, { stroke: INK, w: 1.5 })
  s += line(X(P.dims.x0), Y(z) + 3, X(P.dims.x0 + P.dims.L), Y(z) + 3, { stroke: INK, w: 1.5 })
  for (const u of g.mullions) {
    s += line(X(u), Y(z) - 3.5, X(u), Y(z) + 3.5, { stroke: INK, w: 1.2 })
  }
  const du = openX(d)
  s += line(X(du), Y(z) + 3, X(du), Y(z) + 3 + d.w * S, { stroke: INK, w: 1.1 })
  const pts = []
  for (let i = 0; i <= 12; i++) {
    const a = (i / 12) * (Math.PI / 2)
    pts.push([X(du + d.w * Math.sin(a)), Y(z) + 3 + d.w * S * (1 - Math.cos(a))])
  }
  s += path('M ' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L '), { stroke: '#8b8579', sw: 0.9, dash: '3 3' })
  return s
}

export function planSheet() {
  const body = []
  body.push(txt(OX, 44, 'ПЛАН 1-го ЭТАЖА', { size: 19, weight: 700, letter: 1.2 }))
  body.push(txt(OX, 64, 'Барнхаус 10,0 × 9,5 м: тёплый блок 8 × 7 + Г-образная терраса 2,5 м', { size: 10.5, fill: DIM }))

  // ---- оси
  const xs = [
    [0, '1'],
    [2, '2'],
    [4.5, '3'],
    [5.7, '4'],
    [7, '5'],
    [10, '6'],
  ]
  for (const [x, l] of xs) {
    body.push(line(X(x), Y(-0.35), X(x), Y(D + 1.3), { stroke: '#b9b2a5', w: 0.8, dash: '14 4 3 4' }))
    body.push(axisMark(X(x), Y(-0.62), l))
  }
  const zs = [
    [0, 'А'],
    [2.65, 'Б'],
    [3.4, 'В'],
    [7, 'Г'],
    [9.5, 'Д'],
  ]
  for (const [z, l] of zs) {
    body.push(line(X(-1.0), Y(z), X(W + 0.4), Y(z), { stroke: '#b9b2a5', w: 0.8, dash: '14 4 3 4' }))
    body.push(axisMark(X(-1.55), Y(z), l))
  }

  body.push(drawTerrace())
  body.push(drawGlazing())
  body.push(drawWalls())
  body.push(furniture())

  // ---- подписи помещений
  for (const r of rooms) {
    const [cx, cz] = r.center
    const y = Y(cz)
    body.push(txt(X(cx), y - 5, r.no, { size: 9, anchor: 'middle', fill: ACCENT, weight: 700 }))
    body.push(txt(X(cx), y + 8, r.name, { size: r.id === 'ter' ? 13 : 10.5, anchor: 'middle', weight: 600 }))
    body.push(txt(X(cx), y + 21, `${r.area.toFixed(1).replace('.', ',')} м²`, { size: 9.5, anchor: 'middle', fill: DIM }))
  }

  // ---- размерные цепочки
  body.push(dimH(X(0), X(2), Y(D) + 112, mm(2)))
  body.push(dimH(X(2), X(4.5), Y(D) + 112, mm(2.5)))
  body.push(dimH(X(4.5), X(5.7), Y(D) + 112, mm(1.2)))
  body.push(dimH(X(5.7), X(7), Y(D) + 112, mm(1.3)))
  body.push(dimH(X(7), X(10), Y(D) + 112, mm(3)))
  body.push(dimH(X(0), X(10), Y(D) + 150, mm(10)))
  body.push(dimV(Y(0), Y(2.65), X(0) - 44, mm(2.65)))
  body.push(dimV(Y(2.65), Y(3.4), X(0) - 44, mm(0.75)))
  body.push(dimV(Y(3.4), Y(7), X(0) - 44, mm(3.6)))
  body.push(dimV(Y(7), Y(9.5), X(0) - 44, mm(2.5)))
  body.push(dimV(Y(0), Y(9.5), X(0) - 86, mm(9.5)))

  // ---- маркировка проёмов
  const mark = (id, x, z, dx = 0, dz = -14) => {
    body.push(txt(X(x) + dx, Y(z) + dz, id, { size: 8.5, fill: ACCENT, weight: 600 }))
  }
  mark('ОК-1', 2.62, 0.05, 0, -16)
  mark('ОК-2', 8.2, 0.05, 0, -16)
  mark('ОК-3', 10, 1.5, 16, -8)
  mark('ОК-4', 10, 5.3, 16, 0)
  mark('ОК-5', 2, 4.2, -34, 0)
  mark('ДВ-2', 2, 6.2, -32, 10)
  mark('ВИТРАЖ 8,0 м', 5.0, 7, 0, 22)
  mark('ДВ-1', 4.6, 7, -6, -14)

  // ---- экспликация (как в проекте «Марго»)
  const tx = 848
  let ty = 118
  body.push(txt(tx, ty, 'ЭКСПЛИКАЦИЯ ПОМЕЩЕНИЙ', { size: 11, weight: 700, letter: 0.4 }))
  ty += 12
  const rowH = 30
  body.push(rect(tx, ty, 374, 24, { fill: '#f1ece2', stroke: INK, sw: 1 }))
  body.push(txt(tx + 10, ty + 16, '№', { size: 9, weight: 700 }))
  body.push(txt(tx + 44, ty + 16, 'Наименование', { size: 9, weight: 700 }))
  body.push(txt(tx + 350, ty + 16, 'Площадь', { size: 9, weight: 700, anchor: 'end' }))
  ty += 24
  const floorShort = { sauna: 'плитка', shower: 'плитка', wc: 'плитка', wardrobe: 'доска', bed: 'доска', living: 'доска', ter: 'листв.' }
  for (const r of rooms) {
    body.push(rect(tx, ty, 374, rowH, { fill: '#fff', stroke: '#ded7c9', sw: 0.7 }))
    body.push(txt(tx + 10, ty + 19, r.no, { size: 9.5, fill: ACCENT, weight: 700 }))
    body.push(txt(tx + 44, ty + 14, r.name, { size: 9.5, weight: 600 }))
    body.push(txt(tx + 44, ty + 25, r.id === 'ter' ? 'открытая, под кровлей' : 'отапливаемое', { size: 7.5, fill: DIM }))
    body.push(txt(tx + 350, ty + 19, r.area.toFixed(1).replace('.', ',') + ' м²', { size: 9.5, anchor: 'end' }))
    ty += rowH
  }
  body.push(rect(tx, ty, 374, 26, { fill: '#f7f2e7', stroke: INK, sw: 1 }))
  body.push(txt(tx + 10, ty + 17, 'Тёплый контур', { size: 9.5, weight: 700 }))
  body.push(txt(tx + 350, ty + 17, totalArea.toFixed(1).replace('.', ',') + ' м²', { size: 9.5, weight: 700, anchor: 'end' }))
  body.push(txt(tx + 10, ty + 42, 'Всего с террасой', { size: 9, fill: DIM }))
  body.push(txt(tx + 350, ty + 42, (totalArea + terraceArea).toFixed(1).replace('.', ',') + ' м²', { size: 9, anchor: 'end', fill: DIM }))

  // ---- обозначения
  ty += 76
  body.push(txt(tx, ty, 'ОБОЗНАЧЕНИЯ', { size: 9.5, weight: 700 }))
  ty += 16
  body.push(line(tx, ty, tx + 30, ty, { stroke: INK, w: 1.7 }))
  body.push(txt(tx + 40, ty + 3, 'наружная стена 200 мм', { size: 8.5 }))
  ty += 15
  body.push(line(tx, ty, tx + 30, ty, { stroke: INK, w: 1 }))
  body.push(txt(tx + 40, ty + 3, 'перегородка 100 мм', { size: 8.5 }))
  ty += 15
  body.push(rect(tx, ty - 5, 18, 9, { fill: '#eef2f4', stroke: '#7d8a90' }))
  body.push(txt(tx + 40, ty + 3, 'окно (по ведомости)', { size: 8.5 }))
  ty += 15
  body.push(circle(tx + 9, ty - 1, 6, { fill: '#4a4a4a', stroke: INK }))
  body.push(txt(tx + 40, ty + 3, 'печь 12 кВт, камни 20 кг', { size: 8.5 }))
  ty += 22
  body.push(txt(tx, ty, `Площадь застройки — ${buildArea.toFixed(1).replace('.', ',')} м²`, { size: 9.5, weight: 600, fill: ACCENT }))
  ty += 15
  body.push(txt(tx, ty, `Тёплый контур — ${totalArea.toFixed(1).replace('.', ',')} м², терраса — ${terraceArea.toFixed(1).replace('.', ',')} м²`, { size: 9.5, weight: 600, fill: ACCENT }))
  ty += 24
  body.push(txt(tx, ty, 'Размеры в мм. Привязка стен — по осям.', { size: 8, fill: DIM }))
  body.push(txt(tx, ty + 12, 'Отметка 0,000 = чистый пол 1-го этажа.', { size: 8, fill: DIM }))
  body.push(txt(tx, ty + 24, 'Тёплый блок: x 2…10, z 0…7. Терраса: Г-образная, 30 м².', { size: 8, fill: DIM }))

  return sheet({
    num: 1,
    title: 'План 1-го этажа',
    subtitle: 'Планировка, оси, проёмы, оборудование',
    scale: '1:50',
    body: body.join('\n'),
    note: 'Схема для производства работ. Перед началом — привязка к участку и проверка геологии.',
  })
}

export { pilePositions }
