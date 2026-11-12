import { sheet, txt, line, rect, poly, circle, dimH, dimV, axisMark, callout, INK, DIM, ACCENT } from '../../../schematics/svg.js'
import { project as P, walls, wallStudPositions } from '../project.js'
import { mm } from './plan.js'

const S = 104
const OX = 240
const BASE = 530 // экранная координата y=0
const X = (u) => OX + u * S
const Y = (y) => BASE - y * S

const wall = walls.find((w) => w.id === 'A')

export function wallSheet() {
  const b = []
  b.push(txt(OX, 58, 'СТЕНА ПО ОСИ А. СХЕМА КАРКАСА', { size: 19, weight: 700, letter: 1.2 }))
  b.push(txt(OX, 82, 'Задняя стена 6 000 × 2 700, стойки 45×195 с шагом 600, проёмы по ведомости', { size: 11, fill: DIM }))

  // фон стены
  b.push(rect(X(0), Y(2.7), wall.length * S, 2.7 * S, { fill: '#fbf7ef', stroke: INK, sw: 1.2 }))

  // обвязки
  b.push(rect(X(0), Y(0.045), wall.length * S, 0.045 * S, { fill: '#d9a568', stroke: '#8a6a44', sw: 0.8 }))
  b.push(rect(X(0), Y(2.7), wall.length * S, 0.045 * S, { fill: '#d9a568', stroke: '#8a6a44', sw: 0.8 }))

  // стойки
  for (const u of wallStudPositions(wall)) {
    b.push(rect(X(u) - 0.0225 * S, Y(2.655), 0.045 * S, 2.61 * S, { fill: '#e6bd8c', stroke: '#8a6a44', sw: 0.7 }))
  }

  // проёмы
  for (const o of wall.openings) {
    const x = X(o.u0)
    const w = (o.u1 - o.u0) * S
    const yTop = Y(o.y1)
    const h = (o.y1 - o.y0) * S
    b.push(rect(x, yTop, w, h, { fill: '#ffffff', stroke: INK, sw: 1 }))
    if (o.kind === 'window') {
      b.push(rect(x + 4, yTop + 4, w - 8, h - 8, { fill: '#eef4f6', stroke: '#8b99a0', sw: 0.8 }))
      b.push(line(x + w / 2, yTop + 4, x + w / 2, yTop + h - 4, { stroke: '#8b99a0', w: 0.8 }))
    } else {
      b.push(rect(x + 3, yTop + 3, w - 6, h - 6, { fill: '#f4e6d4', stroke: '#a67a4a', sw: 0.8 }))
    }
    // перемычка 195
    b.push(rect(x, yTop - 0.195 * S, w, 0.195 * S, { fill: '#d9a568', stroke: '#8a6a44', sw: 0.8, dash: '4 2' }))
    if (o.kind === 'window') {
      b.push(rect(x, Y(o.y0), w, 0.045 * S, { fill: '#d9a568', stroke: '#8a6a44', sw: 0.8 }))
    }
    b.push(txt(x + w / 2, yTop - 0.195 * S - 6, o.id, { size: 9, anchor: 'middle', fill: ACCENT, weight: 600 }))
    // размеры проёма
    if (o.kind === 'window') {
      b.push(dimV(Y(o.y0), Y(o.y1), x - 16, mm(o.y1 - o.y0), { size: 9 }))
    }
  }

  // размерная цепочка: привязка проёмов (сумма = длина стены)
  const ychain = Y(0) + 34
  const edges = [...new Set([
    0,
    ...wall.openings.flatMap((o) => [o.u0, o.u1]),
    wall.length,
  ].map((v) => +v.toFixed(3)))].sort((a, b) => a - b)
  for (let i = 0; i < edges.length - 1; i++) {
    const g = edges[i + 1] - edges[i]
    if (g > 0.05) b.push(dimH(X(edges[i]), X(edges[i + 1]), ychain, mm(g), { size: 8.5 }))
  }
  b.push(dimH(X(0), X(wall.length), ychain + 34, mm(wall.length), { size: 10 }))
  b.push(dimV(Y(0), Y(2.7), X(-40), mm(2.7), { size: 10 }))

  // высота потолка / уровень
  b.push(line(X(0), Y(2.5), X(6), Y(2.5), { stroke: ACCENT, w: 0.9, dash: '6 4' }))
  b.push(txt(X(6) - 4, Y(2.5) - 5, 'потолок 2 500', { size: 8.5, anchor: 'end', fill: ACCENT }))

  // номера элементов
  const marks = [
    ['1', X(0.3), Y(0.02) + 12],
    ['2', X(0.3), Y(2.66) - 6],
    ['3', X(0.9), Y(1.2)],
    ['4', X(1.5), Y(2.24)],
  ]
  for (const [n, x, y] of marks) {
    b.push(circle(x, y, 9, { fill: '#fff', stroke: ACCENT, sw: 1.2 }))
    b.push(txt(x, y + 3.5, n, { size: 9, anchor: 'middle', fill: ACCENT, weight: 700 }))
  }

  // ---- пирог стены
  const py = 648
  b.push(txt(OX, py - 26, 'СЛОИ НАРУЖНОЙ СТЕНЫ (снаружи → внутрь), 1:10', { size: 11, weight: 700 }))
  const layers = [
    ['Рейка графит 20', 20, '#34393d'],
    ['Вентзазор 30', 30, '#ecebe6'],
    ['ОСП-3 9', 9, '#e3cb9f'],
    ['Каркас 195 + вата', 195, '#f0c14b'],
    ['Пароизоляция', 1, '#cfd8de'],
    ['Вентзазор 30', 30, '#ecebe6'],
    ['Вагонка 16', 16, '#f3e0bd'],
  ]
  const total = layers.reduce((s, l) => s + l[1], 0)
  const barW = 560
  let bx = OX + 10
  const scale = barW / (total + 18)
  layers.forEach(([name, t, color], i) => {
    const w = Math.max(4, t * scale)
    b.push(rect(bx, py, w, 74, { fill: color, stroke: '#4b4438', sw: 0.8 }))
    b.push(txt(bx + w / 2, py - 6, String(i + 1), { size: 9, anchor: 'middle', fill: ACCENT, weight: 700 }))
    bx += w
  })
  // размеры
  let dx = OX + 10
  for (const [, t] of layers) {
    const w = t * scale
    b.push(dimH(dx, dx + w, py + 90, String(t), { size: 8 }))
    dx += w
  }
  b.push(dimH(OX + 10, OX + 10 + barW, py + 114, `итого ${total} мм (с пароизоляцией)`, { size: 9 }))

  // легенда
  const lx = OX + 640
  let ly = py - 10
  layers.forEach(([name], i) => {
    const col = i < 4 ? 0 : 1
    const row = i < 4 ? i : i - 4
    b.push(txt(lx + col * 210, ly + row * 17, `${i + 1}. ${name}`, { size: 9, fill: '#3d3a34' }))
  })

  // спецификация элементов
  const tx = 905
  let ty = 130
  b.push(txt(tx, ty, 'ЭЛЕМЕНТЫ СТЕНЫ', { size: 10.5, weight: 700 }))
  ty += 8
  const rows = [
    ['1', 'Нижняя обвязка 45×195', '6,2 м'],
    ['2', 'Верхняя обвязка 45×195', '6,2 м'],
    ['3', 'Стойка 45×195', `${wallStudPositions(wall).length} шт`],
    ['4', 'Перемычка 45×195', '3 шт'],
    ['5', 'Подоконная стойка', '2 шт'],
    ['6', 'ОСП-3 9 мм', '16,2 м²'],
    ['7', 'Вата 195 + плёнки', '14,5 м²'],
  ]
  for (const [n, name, q] of rows) {
    b.push(rect(tx, ty, 300, 24, { fill: '#fff', stroke: '#cec7ba', sw: 0.8 }))
    b.push(txt(tx + 6, ty + 16, n, { size: 8.5, weight: 700, fill: ACCENT }))
    b.push(txt(tx + 20, ty + 16, name, { size: 9 }))
    b.push(txt(tx + 292, ty + 16, q, { size: 9, anchor: 'end', weight: 600 }))
    ty += 24
  }

  ty += 18
  b.push(txt(tx, ty, 'ПОРЯДОК СБОРКИ', { size: 10.5, weight: 700 }))
  ty += 16
  const steps = [
    'Раскладка обвязок по разметке,',
    'проверка диагоналей (±5 мм).',
    'Стойки с шагом 600, временные',
    'раскосы 25×100 через 3 м.',
    'Перемычки над проёмами +2 стойки.',
    'Обшивка ОСП с зазором 3 мм,',
    'крепление 4×50 по периметру 150,',
    'в поле 300. Вата 2 слоя вразбежку.',
  ]
  for (const s of steps) {
    b.push(txt(tx, ty, s, { size: 8.8, fill: '#3d3a34' }))
    ty += 13
  }

  return sheet({
    num: 4,
    title: 'Стена А. Схема каркаса и слои',
    subtitle: 'Стойки 45×195, шаг 600, обшивка ОСП-3 9 мм',
    scale: '1:50',
    body: b.join('\n'),
    note: 'Схема типового каркаса; остальные стены собираются аналогично по плану. Проёмы — по ведомости заполнения.',
  })
}
