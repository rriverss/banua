import { sheet, txt, line, rect, poly, path, circle, dimH, dimV, axisMark, callout, INK } from './svg.js'
import { project as P, walls, rooms, totalArea, openings, pilePositions } from '../model/project.js'

export const mm = (v) =>
  String(Math.round(v * 1000)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

const S = 76
const OX = 300
const OY = 185
const X = (x) => OX + x * S
const Y = (z) => OY + z * S

const DIM = '#6d6a63'
const ACCENT = '#a9693a'

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
    // дверной проём: полотно + дуга открывания
    const side = o.swingSide || 1
    const hingeU = o.swingFrom === 'u1' ? o.u1 : o.u0
    const wdt = o.u1 - o.u0
    const dirU = o.swingFrom === 'u1' ? -1 : 1
    // полотно в открытом положении (перпендикулярно стене)
    s += line(...wp(w, hingeU, 0), ...wp(w, hingeU, side * wdt), { stroke: INK, w: 1.2 })
    // дуга
    const pts = []
    for (let i = 0; i <= 12; i++) {
      const a = (i / 12) * (Math.PI / 2)
      const u = hingeU + dirU * wdt * Math.sin(a)
      const n = side * wdt * (1 - Math.cos(a))
      pts.push(wp(w, u, n))
    }
    s += path(
      'M ' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L '),
      { stroke: '#8b8579', sw: 0.9, dash: '3 3' }
    )
    s += line(...wp(w, o.u0, -t), ...wp(w, o.u0, t), { stroke: INK, w: 1 })
    s += line(...wp(w, o.u1, -t), ...wp(w, o.u1, t), { stroke: INK, w: 1 })
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

function furniture() {
  let s = ''
  // печь
  s += rect(X(5.35) - 22, Y(0.5) - 22, 44, 44, { fill: '#4a4a4a', stroke: INK, sw: 1 })
  s += txt(X(5.35), Y(0.5) + 4, 'П', { size: 11, anchor: 'middle', fill: '#fff', weight: 700 })
  // полки парной
  s += rect(X(3.15), Y(0.2), 0.55 * S, 1.9 * S, { fill: '#e8d3b3', stroke: ACCENT, sw: 0.9, dash: '4 3' })
  s += txt(X(3.45), Y(1.25), 'полки', { size: 9.5, anchor: 'middle', fill: ACCENT, rotate: -90 })
  // поддон душа
  s += rect(X(4.95), Y(3.45), 0.9 * S, 0.9 * S, { fill: '#eef2f4', stroke: '#7d8a90', sw: 0.9 })
  s += circle(X(5.4), Y(3.9), 4, { fill: '#7d8a90' })
  // унитаз
  s += rect(X(5.45), Y(2.45), 0.35 * S, 0.5 * S, { fill: '#fff', stroke: '#7d8a90', sw: 0.9, rx: 8 })
  // раковина
  s += rect(X(3.15), Y(2.35), 0.5 * S, 0.4 * S, { fill: '#fff', stroke: '#7d8a90', sw: 0.9, rx: 5 })
  // стол и лавки в КО
  s += rect(X(0.75), Y(2.95), 1.15 * S, 0.72 * S, { fill: '#f0e0c8', stroke: ACCENT, sw: 0.9 })
  s += rect(X(0.6), Y(2.55), 1.5 * S, 0.3 * S, { fill: '#f0e0c8', stroke: ACCENT, sw: 0.9 })
  s += rect(X(0.2), Y(3.05), 0.3 * S, 0.9 * S, { fill: '#f0e0c8', stroke: ACCENT, sw: 0.9 })
  s += txt(X(1.32), Y(3.34), 'стол', { size: 8, anchor: 'middle', fill: ACCENT })

  // настил террасы: лиственница 28×140, зазор 5 мм
  s += rect(X(0.1), Y(4.6), 5.8 * S, 2.3 * S, { fill: '#f7eddd', stroke: 'none', sw: 0 })
  for (let x = 0.2; x < 5.9; x += 0.145) {
    s += line(X(x), Y(4.6), X(x), Y(6.9), { stroke: '#e0cbac', w: 0.6 })
  }

  // ограждение террасы: стойки 100×100 + поручень
  const rail = (x1, z1, x2, z2) => {
    s += line(X(x1), Y(z1), X(x2), Y(z2), { stroke: '#8a6a44', w: 1.6 })
    const len = Math.hypot(x2 - x1, z2 - z1)
    const n = Math.max(1, Math.round(len / 0.9))
    for (let i = 0; i <= n; i++) {
      const t = i / n
      s += rect(X(x1 + (x2 - x1) * t) - 3, Y(z1 + (z2 - z1) * t) - 3, 6, 6, { fill: '#d9a568', stroke: '#8a6a44', sw: 0.7 })
    }
  }
  rail(0, 4.55, 0, 6.95)
  rail(6, 4.55, 6, 6.95)
  rail(0, 6.95, 2.2, 6.95)
  rail(3.5, 6.95, 6, 6.95)
  // ступени
  for (let i = 0; i < 3; i++) {
    s += rect(X(2.25), Y(6.95 + i * 0.17), 1.2 * S, 0.17 * S, { fill: i % 2 ? '#f1e2ca' : '#e9d7bb', stroke: '#a98f62', sw: 0.7 })
  }
  s += txt(X(3.55), Y(7.35), 'вход', { size: 8.5, fill: ACCENT, weight: 600 })
  return s
}

export function planSheet() {
  const body = []
  body.push(
    txt(OX, 58, 'ПЛАН 1-го ЭТАЖА', { size: 19, weight: 700, letter: 1.2 }) +
      txt(OX, 82, 'Совмещённый: планировка, оси, проёмы, оборудование', { size: 11, fill: DIM })
  )

  // сетка осей
  for (const a of [0, 3, 6]) {
    body.push(line(X(a), Y(-0.55), X(a), Y(7.55), { stroke: '#b9b2a5', w: 0.8, dash: '14 4 3 4' }))
    body.push(axisMark(X(a), Y(-0.95), String(a === 0 ? 1 : a === 3 ? 2 : 3)))
  }
  const zAxis = [
    [0, 'А'],
    [2.2, 'Б'],
    [4.5, 'В'],
  ]
  for (const [z, l] of zAxis) {
    body.push(line(X(-0.55), Y(z), X(6.55), Y(z), { stroke: '#b9b2a5', w: 0.8, dash: '14 4 3 4' }))
    body.push(axisMark(X(-1.95), Y(z), l))
  }

  body.push(drawWalls())
  body.push(furniture())

  // подписи помещений
  const labels = {
    ko: ['Комната отдыха', 1.45, 2.2],
    par: ['Парная', 4.35, 1.2],
    moy: ['Мойка', 4.3, 3.35],
    ter: ['Терраса', 3.0, 5.75],
  }
  for (const r of rooms) {
    const [name, lx, lz] = labels[r.id]
    body.push(txt(X(lx), Y(lz) - 4, name, { size: 12.5, weight: 600, anchor: 'middle' }))
    body.push(txt(X(lx), Y(lz) + 13, `${r.area.toFixed(1).replace('.', ',')} м²`, { size: 11, anchor: 'middle', fill: ACCENT }))
  }

  // размерные цепочки
  body.push(dimH(X(0), X(6), Y(7) + 46, mm(6)))
  body.push(dimV(Y(0), Y(2.2), X(0) - 40, mm(2.2)))
  body.push(dimV(Y(2.2), Y(4.5), X(0) - 40, mm(2.3)))
  body.push(dimV(Y(4.5), Y(7), X(0) - 40, mm(2.5)))
  body.push(dimV(Y(0), Y(4.5), X(0) - 82, mm(4.5)))
  body.push(dimV(Y(0), Y(7), X(0) - 122, mm(7)))
  body.push(dimV(Y(0), Y(4.5), X(6) + 44, mm(4.5)))

  // маркировка проёмов
  const mark = (id, x, z, dx = 0, dz = -18) => {
    body.push(txt(X(x) + dx, Y(z) + dz, id, { size: 9, fill: ACCENT, weight: 600 }))
  }
  mark('ОК-1', 4.8, 0.15)
  mark('ОК-2', 0.9, 4.62, 0, 14)
  mark('ДВ-1', 2.2, 4.2, 0, -26)
  mark('ОК-3', 4.8, 4.35)
  mark('ОК-4', 0.6, 3.35, 14)
  mark('ДВ-2', 3.15, 3.75, 14)
  mark('ДВ-3', 4.6, 2.1, 16, -6)
  mark('ОК-5', 5.45, 3.0, -8, -10)

  // таблица помещений
  const tx = 860
  let ty = 120
  body.push(txt(tx, ty, 'ЭКСПЛИКАЦИЯ ПОМЕЩЕНИЙ', { size: 11.5, weight: 700 }))
  ty += 10
  const rowH = 34
  const cols = [0, 210, 300]
  body.push(rect(tx, ty, 350, rowH, { fill: '#f1ece2', stroke: INK, sw: 1 }))
  body.push(txt(tx + 10, ty + 21, 'Помещение', { size: 10, weight: 700 }))
  body.push(txt(tx + 220, ty + 21, 'Площадь', { size: 10, weight: 700 }))
  body.push(txt(tx + 310, ty + 21, 'Пол', { size: 10, weight: 700 }))
  ty += rowH
  const floorShort = { ko: 'доска', par: 'плитка', moy: 'плитка', ter: 'листв.' }
  for (const r of rooms) {
    body.push(rect(tx, ty, 350, rowH, { fill: '#fff', stroke: '#c9c2b6', sw: 0.8 }))
    body.push(
      txt(tx + 10, ty + 15, r.name, { size: 10.5, weight: 500 }) +
        txt(tx + 10, ty + 28, r.id === 'ter' ? 'открытая, под кровлей' : 'отапливаемое', { size: 8.5, fill: DIM })
    )
    body.push(txt(tx + 220, ty + 21, r.area.toFixed(1).replace('.', ',') + ' м²', { size: 10.5 }))
    body.push(txt(tx + 310, ty + 21, floorShort[r.id], { size: 9, fill: DIM }))
    ty += rowH
  }
  body.push(rect(tx, ty, 350, rowH, { fill: '#f7f2e7', stroke: INK, sw: 1 }))
  body.push(txt(tx + 10, ty + 21, 'Итого тёплый контур', { size: 10.5, weight: 700 }))
  body.push(txt(tx + 220, ty + 21, totalArea.toFixed(1).replace('.', ',') + ' м²', { size: 10.5, weight: 700 }))

  // легенда
  ty += 60
  body.push(txt(tx, ty, 'ОБОЗНАЧЕНИЯ', { size: 10.5, weight: 700 }))
  ty += 18
  body.push(line(tx, ty, tx + 34, ty, { stroke: INK, w: 1.6 }) + txt(tx + 44, ty + 4, 'наружная стена 200 мм', { size: 9.5 }))
  ty += 18
  body.push(line(tx, ty, tx + 34, ty, { stroke: INK, w: 1 }) + txt(tx + 44, ty + 4, 'перегородка 100 мм', { size: 9.5 }))
  ty += 18
  body.push(rect(tx, ty - 5, 20, 10, { fill: '#eef2f4', stroke: '#7d8a90' }) + txt(tx + 44, ty + 4, 'окно (по ведомости)', { size: 9.5 }))
  ty += 18
  body.push(circle(tx + 10, ty - 2, 7, { fill: '#4a4a4a', stroke: INK }) + txt(tx + 44, ty + 4, 'печь 12 кВт, бак 60 л', { size: 9.5 }))
  ty += 22
  body.push(txt(tx, ty, 'Площадь застройки — 42,0 м²', { size: 10, weight: 600, fill: ACCENT }))
  ty += 16
  body.push(txt(tx, ty, 'Площадь тёплого контура — 24,2 м²', { size: 10, weight: 600, fill: ACCENT }))
  ty += 26
  body.push(txt(tx, ty, 'Размеры в мм. Привязка стен — по осям.', { size: 8.5, fill: DIM }))
  body.push(txt(tx, ty + 12, 'Отметка 0,000 = чистый пол 1-го этажа.', { size: 8.5, fill: DIM }))

  return sheet({
    title: 'План 1-го этажа',
    subtitle: 'Планировка, оси, проёмы, оборудование',
    scale: '1:50',
    body: body.join('\n'),
    note: 'Схема для производства работ. Перед началом — привязка к участку и проверка геологии.',
  })
}
