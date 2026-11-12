import { sheet, txt, line, rect, circle, poly, dimH, dimV, axisMark, callout, INK, DIM, ACCENT } from '../../../schematics/svg.js'
import { project as P, pilePositions, girders, terracePoly } from '../project.js'
import { mm } from './plan.js'

const S = 66
const OX = 150
const OY = 140
const X = (x) => OX + x * S
const Y = (z) => OY + z * S

const dm = P.dims

export function foundationSheet() {
  const b = []
  b.push(txt(OX, 44, 'ПЛАН СВАЙНОГО ПОЛЯ', { size: 19, weight: 700, letter: 1.2 }))
  b.push(
    txt(OX, 65, `${pilePositions.length} винтовых свай ⌀108×2400, верх −0,455; оголовки 200×200×6, обвязка 150×150`, {
      size: 10.5,
      fill: DIM,
    })
  )

  // ---- контуры
  b.push(
    poly(
      [
        [X(dm.x0), Y(0)],
        [X(dm.x0 + dm.L), Y(0)],
        [X(dm.x0 + dm.L), Y(dm.depth)],
        [X(dm.x0), Y(dm.depth)],
      ],
      { fill: '#fbf8f2', stroke: INK, sw: 1.2 }
    )
  )
  b.push(txt(X(7.6), Y(1.55), 'ТЁПЛЫЙ БЛОК', { size: 9, anchor: 'middle', fill: DIM, letter: 1.5 }))
  // терраса
  for (const p of [rooms4(), terracePoly]) {
    b.push(
      poly(
        p.map(([x, z]) => [X(x), Y(z)]),
        { fill: '#f5efe4', stroke: '#8b8579', sw: 1, dash: '6 4' }
      )
    )
  }
  b.push(txt(X(2.0), Y(3.5), 'ТЕРРАСА 32 м²', { size: 9, anchor: 'middle', fill: DIM, letter: 1 }))
  b.push(txt(X(9.5), Y(5.8), 'дровник', { size: 8, anchor: 'middle', fill: DIM }))

  // ---- ростверк
  for (const g of girders) {
    const w = 0.15 * S
    if (Math.abs(g.z0 - g.z1) < 1e-6) {
      b.push(rect(X(g.x0) - w / 2, Y(g.z0) - w / 2, (g.x1 - g.x0) * S + w, w, { fill: 'url(#wood)', stroke: '#8a6a44', sw: 0.8 }))
    } else {
      b.push(rect(X(g.x0) - w / 2, Y(g.z0) - w / 2, w, (g.z1 - g.z0) * S + w, { fill: 'url(#wood)', stroke: '#8a6a44', sw: 0.8 }))
    }
  }

  // ---- сваи
  for (const p of pilePositions) {
    b.push(circle(X(p.x), Y(p.z), 7.5, { fill: '#fff', stroke: INK, sw: 1.4 }))
    b.push(line(X(p.x) - 11, Y(p.z), X(p.x) + 11, Y(p.z), { stroke: INK, w: 0.9 }))
    b.push(line(X(p.x), Y(p.z) - 11, X(p.x), Y(p.z) + 11, { stroke: INK, w: 0.9 }))
    b.push(circle(X(p.x), Y(p.z), 2, { fill: ACCENT }))
  }

  // ---- оси
  for (const [x, l] of [
    [0, '1'],
    [dm.x0, '2'],
    [dm.terX, '3'],
    [9.5, '4'],
    [dm.W, '5'],
  ]) {
    b.push(line(X(x), Y(-0.55), X(x), Y(dm.D + 0.75), { stroke: '#c2bbae', w: 0.8, dash: '12 4 3 4' }))
    b.push(axisMark(X(x), Y(-0.85), l))
  }
  for (const [z, l] of [
    [0, 'Д'],
    [1.27, 'Г'],
    [2.57, 'В'],
    [dm.depth, 'Б'],
    [dm.D, 'А'],
  ]) {
    b.push(line(X(-0.7), Y(z), X(dm.W + 0.6), Y(z), { stroke: '#c2bbae', w: 0.8, dash: '12 4 3 4' }))
    b.push(axisMark(X(-1.05), Y(z), l))
  }

  // ---- размеры по сваям
  const xs = P.piles.xs
  for (let i = 0; i < xs.length - 1; i++) {
    b.push(dimH(X(xs[i]), X(xs[i + 1]), Y(dm.D) + 46, mm(xs[i + 1] - xs[i])))
  }
  b.push(dimH(X(xs[0]), X(xs[xs.length - 1]), Y(dm.D) + 80, mm(xs[xs.length - 1] - xs[0])))
  const zs = P.piles.zs
  for (let i = 0; i < zs.length - 1; i++) {
    b.push(dimV(Y(zs[i]), Y(zs[i + 1]), X(0) - 40, mm(zs[i + 1] - zs[i])))
  }
  b.push(dimV(Y(zs[0]), Y(6.485), X(dm.terX) - 34, mm(6.485 - zs[0])))
  b.push(dimV(Y(zs[0]), Y(zs[zs.length - 1]), X(0) - 76, mm(zs[zs.length - 1] - zs[0])))

  b.push(callout(X(4.075), Y(4.985), 1, X(3.3), Y(5.6)))

  // ---- спецификация
  const tx = 906
  let ty = 150
  b.push(txt(tx, ty, 'СПЕЦИФИКАЦИЯ', { size: 11.5, weight: 700 }))
  ty += 12
  const rows = [
    ['Свая винтовая СВ-1', '⌀108×2400', `${pilePositions.length} шт`],
    ['Оголовок', '200×200×6', `${pilePositions.length} шт`],
    ['Брус обвязки', '150×150, 6 м', '10 шт'],
    ['Анкеровка', 'М12 × 4 на сваю', `${pilePositions.length * 4} шт`],
    ['Песчано-гравийная подсыпка', 'под террасой', '0,9 м³'],
  ]
  b.push(rect(tx, ty, 296, 22, { fill: '#f1ece2', stroke: INK, sw: 1 }))
  b.push(txt(tx + 7, ty + 15, 'Наименование', { size: 8.6, weight: 700 }))
  b.push(txt(tx + 150, ty + 15, 'Сечение', { size: 8.6, weight: 700 }))
  b.push(txt(tx + 289, ty + 15, 'Кол-во', { size: 8.6, weight: 700, anchor: 'end' }))
  ty += 22
  for (const [n, s2, q] of rows) {
    b.push(rect(tx, ty, 296, 28, { fill: '#fff', stroke: '#cdc6ba', sw: 0.8 }))
    b.push(txt(tx + 7, ty + 12, n, { size: 8.4 }))
    b.push(txt(tx + 7, ty + 22, s2, { size: 7.4, fill: DIM }))
    b.push(txt(tx + 289, ty + 17, q, { size: 8.4, weight: 600, anchor: 'end' }))
    ty += 28
  }

  ty += 26
  b.push(txt(tx, ty, 'ОТМЕТКИ (КМ, лист 2)', { size: 10.5, weight: 700 }))
  ty += 18
  for (const [k, v] of [
    ['Верх сваи', '−0,455'],
    ['Низ сваи', '−2,855'],
    ['Верх обвязки', '−0,305'],
    ['Низ балок пола', '−0,305'],
    ['Чистый пол', '0,000'],
    ['Планировка', '−0,750'],
  ]) {
    b.push(txt(tx, ty, k, { size: 8.4, fill: DIM }))
    b.push(txt(tx + 289, ty, v, { size: 8.6, weight: 600, anchor: 'end' }))
    ty += 14
  }

  ty += 20
  b.push(txt(tx, ty, 'ПРИМЕЧАНИЯ', { size: 10.5, weight: 700 }))
  const notes = [
    'Сваю завинчивать до плотного грунта, но не менее 2,4 м;',
    'отказ — не более 30 мм за 10 ударов молотка.',
    'Верх свай — в одной плоскости, допуск ±10 мм,',
    'после монтажа заполнить стволы ЦПС и обрезать по нивелиру.',
    'Ростверк 150×150 — антисептированный, стыки вразбежку 1,5 м.',
    'Под террасой — сваи 2,555 / 4,985 / 6,485 по осям 1…3,',
    'свес настила за сваю — не более 0,4 м.',
    'Каменного цоколя нет: забирка из доски 20×140 по обвязке.',
  ]
  ty += 16
  for (const n of notes) {
    b.push(txt(tx, ty, n, { size: 8, fill: '#3d3a34' }))
    ty += 12.5
  }

  return sheet({
    num: 2,
    title: 'План свайного поля',
    subtitle: 'Винтовые сваи ⌀108×2400, обвязка 150×150, забирка',
    scale: '1:50',
    body: b.join('\n'),
    note: 'Перед завинчиванием выполнить пробное погружение и уточнить глубину плотных грунтов. Схема не заменяет геологию участка.',
  })
}

/** полигон западной полосы террасы */
function rooms4() {
  return [
    [0, 0],
    [dm.x0, 0],
    [dm.x0, dm.D],
    [0, dm.D],
  ]
}
