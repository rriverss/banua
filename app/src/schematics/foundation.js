import { sheet, txt, line, rect, circle, poly, dimH, dimV, axisMark, callout, INK, DIM, ACCENT } from './svg.js'
import { project as P, pilePositions, girders } from '../model/project.js'
import { mm } from './plan.js'

const S = 74
const OX = 285
const OY = 205
const X = (x) => OX + x * S
const Y = (z) => OY + z * S

export function foundationSheet() {
  const b = []
  b.push(txt(OX, 60, 'ПЛАН ФУНДАМЕНТА. ВИНТОВЫЕ СВАИ', { size: 19, weight: 700, letter: 1.2 }))
  b.push(txt(OX, 84, '20 свай ⌀108×2500 с оголовками 200×200, ростверк из бруса 150×150', { size: 11, fill: DIM }))

  // контур здания
  b.push(rect(X(0), Y(0), 6 * S, 4.5 * S, { fill: '#fbf8f2', stroke: INK, sw: 1.2 }))
  b.push(rect(X(0), Y(4.5), 6 * S, 2.5 * S, { fill: '#f5efe4', stroke: '#8b8579', sw: 1, dash: '6 4' }))
  b.push(txt(X(3), Y(5.7), 'ТЕРРАСА', { size: 10, anchor: 'middle', fill: DIM, letter: 2 }))

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
  for (const a of [0, 3, 6]) {
    b.push(line(X(a), Y(-0.55), X(a), Y(7.5), { stroke: '#c2bbae', w: 0.8, dash: '12 4 3 4' }))
    b.push(axisMark(X(a), Y(-0.95), String(a === 0 ? 1 : a === 3 ? 2 : 3)))
  }
  for (const [z, l] of [[0, 'А'], [2.2, 'Б'], [4.5, 'В']]) {
    b.push(line(X(-0.55), Y(z), X(6.55), Y(z), { stroke: '#c2bbae', w: 0.8, dash: '12 4 3 4' }))
    b.push(axisMark(X(-1.95), Y(z), l))
  }

  // размеры по сваям
  const xs = P.piles.xs
  const zs = P.piles.zs
  for (let i = 0; i < xs.length - 1; i++) {
    b.push(dimH(X(xs[i]), X(xs[i + 1]), Y(6.85) + 40, mm(xs[i + 1] - xs[i])))
  }
  b.push(dimH(X(xs[0]), X(xs[xs.length - 1]), Y(6.85) + 76, mm(xs[xs.length - 1] - xs[0])))
  for (let i = 0; i < zs.length - 1; i++) {
    b.push(dimV(Y(zs[i]), Y(zs[i + 1]), X(0) - 40, mm(zs[i + 1] - zs[i])))
  }
  b.push(dimV(Y(zs[0]), Y(zs[zs.length - 1]), X(0) - 80, mm(zs[zs.length - 1] - zs[0])))

  b.push(dimH(X(0), X(6), Y(7.4) + 34, mm(6)))
  b.push(dimV(Y(0), Y(4.5), X(6) + 42, mm(4.5)))

  b.push(callout(X(5.85), Y(6.85), 1, X(6.45), Y(7.15)))

  // примечания
  const tx = 860
  let ty = 150
  b.push(txt(tx, ty, 'СПЕЦИФИКАЦИЯ', { size: 11.5, weight: 700 }))
  ty += 12
  const rows = [
    ['Свая винтовая ⌀108×2500', '20 шт'],
    ['Оголовок 200×200×6', '20 шт'],
    ['Брус обвязки 150×150', '8 шт × 6 м'],
    ['Анкеровка М12', '80 компл.'],
    ['Песчано-гравийная подсыпка', '0,4 м³'],
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
    'Терраса — по сваям 6,85 м, стойки 100×100 на оголовках.',
    'Уклон участка под баней — отвод воды от пятна застройки.',
  ]
  ty += 18
  for (const n of notes) {
    b.push(txt(tx, ty, n, { size: 9.2, fill: '#3d3a34' }))
    ty += 15
  }

  return sheet({
    title: 'План фундамента',
    subtitle: 'Винтовые сваи ⌀108×2500, ростверк 150×150',
    scale: '1:50',
    body: b.join('\n'),
    note: 'Перед завинчиванием выполнить пробное погружение и уточнить глубину плотных грунтов. Схема не заменяет геологию участка.',
  })
}
