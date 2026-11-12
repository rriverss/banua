import { sheet, txt, line, rect, circle, poly, dimH, dimV, axisMark, callout, INK, DIM, ACCENT } from '../../../schematics/svg.js'
import { project as P, pilePositions, girders } from '../project.js'
import { mm } from './plan.js'

const S = 60
const OX = 195
const OY = 136
const X = (x) => OX + x * S
const Y = (z) => OY + z * S

export function foundationSheet() {
  const b = []
  b.push(txt(OX, 40, 'ПЛАН ФУНДАМЕНТА. ВИНТОВЫЕ СВАИ', { size: 19, weight: 700, letter: 1.2 }))
  b.push(txt(OX, 62, `${pilePositions.length} свай ⌀108×2500 с оголовками 200×200, ростверк из бруса 150×150`, { size: 11, fill: DIM }))

  // контуры: тёплый блок + Г-образная терраса
  b.push(poly([[X(P.dims.x0), Y(0)], [X(P.dims.W), Y(0)], [X(P.dims.W), Y(P.dims.depth)], [X(P.dims.x0), Y(P.dims.depth)]], { fill: '#fbf8f2', stroke: INK, sw: 1.2 }))
  b.push(
    poly(
      [
        [X(0), Y(4.5)],
        [X(P.dims.x0), Y(4.5)],
        [X(P.dims.x0), Y(P.dims.depth)],
        [X(P.dims.W), Y(P.dims.depth)],
        [X(P.dims.W), Y(P.dims.D)],
        [X(0), Y(P.dims.D)],
      ],
      { fill: '#f5efe4', stroke: '#8b8579', sw: 1, dash: '6 4' }
    )
  )
  b.push(txt(X(5.6), Y(8.3), 'ТЕРРАСА', { size: 10, anchor: 'middle', fill: DIM, letter: 2 }))
  b.push(txt(X(6.0), Y(4.3), 'ТЁПЛЫЙ БЛОК', { size: 9, anchor: 'middle', fill: DIM, letter: 1.5 }))

  // ростверк
  for (const g of girders) {
    const w = 0.15 * S
    if (Math.abs(g.z0 - g.z1) < 1e-6) {
      b.push(rect(X(g.x0), Y(g.z0) - w / 2, (g.x1 - g.x0) * S, w, { fill: 'url(#wood)', stroke: '#8a6a44', sw: 0.8 }))
    } else {
      b.push(rect(X(g.x0) - w / 2, Y(g.z0), w, (g.z1 - g.z0) * S, { fill: 'url(#wood)', stroke: '#8a6a44', sw: 0.8 }))
    }
  }

  // сваи
  for (const p of pilePositions) {
    b.push(circle(X(p.x), Y(p.z), 7.5, { fill: '#fff', stroke: INK, sw: 1.4 }))
    b.push(line(X(p.x) - 10, Y(p.z), X(p.x) + 10, Y(p.z), { stroke: INK, w: 0.9 }))
    b.push(line(X(p.x), Y(p.z) - 10, X(p.x), Y(p.z) + 10, { stroke: INK, w: 0.9 }))
    b.push(circle(X(p.x), Y(p.z), 2, { fill: ACCENT }))
  }

  // оси
  const ax = [[0, '1'], [2, '2'], [4.5, '3'], [5.7, '4'], [7, '5'], [10, '6']]
  for (const [a, l] of ax) {
    b.push(line(X(a), Y(-0.4), X(a), Y(P.dims.D + 0.6), { stroke: '#c2bbae', w: 0.8, dash: '12 4 3 4' }))
    b.push(axisMark(X(a), Y(-0.7), l))
  }
  for (const [z, l] of [[0, 'А'], [2.65, 'Б'], [3.4, 'В'], [7, 'Г'], [9.5, 'Д']]) {
    b.push(line(X(-0.6), Y(z), X(10.6), Y(z), { stroke: '#c2bbae', w: 0.8, dash: '12 4 3 4' }))
    b.push(axisMark(X(-1.25), Y(z), l))
  }

  // размеры по сваям
  const xs = P.piles.xs
  const zs = P.piles.zs
  for (let i = 0; i < xs.length - 1; i++) {
    b.push(dimH(X(xs[i]), X(xs[i + 1]), Y(P.dims.D) + 44, mm(xs[i + 1] - xs[i])))
  }
  b.push(dimH(X(xs[0]), X(xs[xs.length - 1]), Y(P.dims.D) + 80, mm(xs[xs.length - 1] - xs[0])))
  for (let i = 0; i < zs.length - 1; i++) {
    b.push(dimV(Y(zs[i]), Y(zs[i + 1]), X(0) - 40, mm(zs[i + 1] - zs[i])))
  }
  b.push(dimV(Y(zs[0]), Y(zs[zs.length - 1]), X(0) - 80, mm(zs[zs.length - 1] - zs[0])))

  
  b.push(dimV(Y(0), Y(P.dims.D), X(10) + 40, mm(P.dims.D)))

  b.push(callout(X(9.85), Y(9.3), 1, X(10.4), Y(9.75)))

  // примечания
  const tx = 860
  let ty = 150
  b.push(txt(tx, ty, 'СПЕЦИФИКАЦИЯ', { size: 11.5, weight: 700 }))
  ty += 12
  const rows = [
    ['Свая винтовая ⌀108×2500', `${pilePositions.length} шт`],
    ['Оголовок 200×200×6', `${pilePositions.length} шт`],
    ['Брус обвязки 150×150', '14 шт × 6 м'],
    ['Анкеровка М12', `${pilePositions.length * 4} компл.`],
    ['Песчано-гравийная подсыпка', '0,8 м³'],
  ]
  b.push(rect(tx, ty, 340, 26, { fill: '#f1ece2', stroke: INK, sw: 1 }))
  b.push(txt(tx + 8, ty + 17, 'Наименование', { size: 9.5, weight: 700 }))
  b.push(txt(tx + 275, ty + 17, 'Кол-во', { size: 9.5, weight: 700 }))
  ty += 26
  for (const [n, q] of rows) {
    b.push(rect(tx, ty, 340, 26, { fill: '#fff', stroke: '#cdc6ba', sw: 0.8 }))
    b.push(txt(tx + 8, ty + 17, n, { size: 9.5 }))
    b.push(txt(tx + 275, ty + 17, q, { size: 9.5, weight: 600 }))
    ty += 26
  }

  ty += 26
  b.push(txt(tx, ty, 'ПРИМЕЧАНИЯ', { size: 11, weight: 700 }))
  const notes = [
    'Сваю завинчивать до плотного грунта, но не менее 2,5 м;',
    'отказ — не более 30 мм за 10 ударов молотка.',
    'Верх свай — в одной плоскости, допуск ±10 мм;',
    'после монтажа заполнить стволы ЦПС, обрезать по нивелиру.',
    'Ростверк 150×150 — антисептированный, анкеровка 4×М12',
    'к каждому оголовку, стыки — вразбежку на 1,5 м.',
    'Терраса — по сваям 4,6/7,0/9,3 м, стойки 120×120 на оголовках.',
    'Уклон участка под баней — отвод воды от пятна застройки.',
  ]
  ty += 18
  for (const n of notes) {
    b.push(txt(tx, ty, n, { size: 9.2, fill: '#3d3a34' }))
    ty += 15
  }

  return sheet({
    num: 2,
    title: 'План фундамента',
    subtitle: 'Винтовые сваи ⌀108×2500, ростверк 150×150',
    scale: '1:50',
    body: b.join('\n'),
    note: 'Перед завинчиванием выполнить пробное погружение и уточнить глубину плотных грунтов. Схема не заменяет геологию участка.',
  })
}
