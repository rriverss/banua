import { sheet, txt, line, rect, poly, circle, dimH, dimV, axisMark, INK } from '../../../schematics/svg.js'
import { project as P, roofArea, roofY, ceilingY } from '../project.js'

const DIM = '#6d6a63'
const ACCENT = '#a9693a'
const STEEL = '#7d848a'

const S = 62
const OX = 140
const OZ = 236 // ось Д (z = 0) вверху
const X = (x) => OX + x * S
const Z = (z) => OZ + z * S

const dm = P.dims
const R = P.roof

export function roofSheet() {
  const b = []
  b.push(txt(OX - 30, 46, 'ПЛАН КРОВЛИ', { size: 19, weight: 700, letter: 1.2 }))
  b.push(
    txt(OX - 30, 66, `Односкатная, уклон ${R.pitch.toFixed(1).replace('.', ',')}° (1:5,8). Стропила 50×200 шаг 600, обрешётка 25×100 шаг 350`, {
      size: 10,
      fill: DIM,
    })
  )

  // ---------- контур кровли (свесы 600 по бокам, 50 — по скату)
  const rx0 = R.x0
  const rx1 = R.x1
  const rz0 = R.z0
  const rz1 = R.z1
  b.push(rect(X(rx0), Z(rz0), (rx1 - rx0) * S, (rz1 - rz0) * S, { fill: '#e8dfdf', stroke: '#3a4045', sw: 1.4 }))

  // ---------- линии скатов (разбивка на «карты» 1,1 м по скату)
  for (let z = rz0 + 0.55; z < rz1 - 0.1; z += 0.55) {
    b.push(line(X(rx0), Z(z), X(rx1), Z(z), { stroke: STEEL, w: 0.5, dash: '4 4' }))
  }
  // торцевые свесы (фронтоны) — линии
  for (let x = rx0 + 1.0; x < rx1; x += 1.0) {
    b.push(line(X(x), Z(rz0), X(x), Z(rz1), { stroke: 'rgba(80,90,95,.18)', w: 0.4 }))
  }

  // ---------- стропила (видны по разбивке)
  const rafters = []
  for (let x = 0.06; x <= rx1 - rx0 - 0.06; x += 0.6) rafters.push(rx0 + x)
  for (const x of rafters) {
    b.push(line(X(x), Z(rz0), X(x), Z(rz1), { stroke: 'rgba(120,90,60,.35)', w: 1.1 }))
  }
  // прогоны LVL
  for (const z of [1.55, 3.45]) {
    b.push(rect(X(rx0), Z(z) - 2, (rx1 - rx0) * S, 4, { fill: 'rgba(160,90,40,.55)' }))
    b.push(txt(X(rx0) + 10, Z(z) - 6, 'прогон LVL 300×51', { size: 7.5, fill: ACCENT }))
  }

  // ---------- направление ската
  const ax = (rx0 + rx1) / 2
  b.push(line(X(ax + 1.6), Z(4.6), X(ax + 1.6), Z(1.4), { stroke: '#22262a', w: 1.6 }))
  b.push(
    poly(
      [
        [X(ax + 1.6), Z(1.5)],
        [X(ax + 1.6) - 9, Z(2.0)],
        [X(ax + 1.6) + 9, Z(2.0)],
      ],
      { fill: '#22262a', stroke: 'none' }
    )
  )
  b.push(txt(X(ax + 1.6) + 12, Z(3.4), `уклон ${R.pitch.toFixed(1).replace('.', ',')}°`, { size: 10, weight: 700 }))
  b.push(txt(X(ax + 1.6) + 12, Z(3.22), '1:5,8', { size: 9, fill: DIM }))

  // ---------- отметки по скату
  b.push(txt(X(rx0 + 0.5), Z(rz0) + 16, `+${(roofY(0) + 0.077).toFixed(2).replace('.', ',')}`, { size: 8.5, fill: ACCENT, weight: 600 }))
  b.push(txt(X(rx0 + 0.5), Z(rz1) - 8, `+${(roofY(dm.D) + 0.077).toFixed(2).replace('.', ',')}`, { size: 8.5, fill: ACCENT, weight: 600 }))

  // ---------- водосточная система
  b.push(line(X(rx0), Z(rz0) - 10, X(rx1), Z(rz0) - 10, { stroke: STEEL, w: 2.4 }))
  for (let x = rx0; x <= rx1; x += 0.5) {
    b.push(line(X(x), Z(rz0) - 10, X(x), Z(rz0) - 6, { stroke: STEEL, w: 1 }))
  }
  b.push(txt(X((rx0 + rx1) / 2), Z(rz0) - 18, 'желоб 125 — по низкой стороне (ось Д)', { size: 8, anchor: 'middle', fill: DIM }))
  for (const x of [0.12, 10.88]) {
    b.push(circle(X(x), Z(rz0) - 10, 5, { fill: STEEL, stroke: 'none' }))
    b.push(line(X(x), Z(rz0) - 12, X(x), Z(rz0) - 40, { stroke: STEEL, w: 2.4 }))
    b.push(txt(X(x) + 9, Z(rz0) - 34, 'труба 90', { size: 7.5, fill: DIM }))
  }

  // ---------- дымоход
  const cx = 8.35
  const cz = 2.95
  b.push(rect(X(cx), Z(cz), 0.26 * S, 0.36 * S, { fill: '#f2f0ea', stroke: '#3a4045', sw: 1.4 }))
  b.push(txt(X(cx + 0.43), Z(cz + 0.18), 'дымоход ⌀ 150, сталь', { size: 8, fill: ACCENT }))
  // снегозадержатели
  for (let x = rx0 + 0.5; x < rx1 - 0.3; x += 0.9) {
    b.push(line(X(x), Z(rz1 - 0.45), X(x + 0.5), Z(rz1 - 0.45), { stroke: STEEL, w: 1.6 }))
  }
  b.push(txt(X(rx1) - 12, Z(rz1 - 0.62), 'снегозадержатели', { size: 7.5, anchor: 'end', fill: DIM }))

  // ---------- оси
  for (const [x, l] of [
    [0, '1'],
    [4, '2'],
    [8, '3'],
    [9.5, '4'],
    [11, '5'],
  ]) {
    b.push(line(X(x), Z(rz0) - 60, X(x), Z(rz1) + 34, { stroke: '#c2bbae', w: 0.8, dash: '12 4 3 4' }))
    b.push(circle(X(x), Z(rz0) - 78, 10, { fill: '#fff', stroke: INK, sw: 1 }))
    b.push(txt(X(x), Z(rz0) - 74, l, { size: 10, anchor: 'middle', weight: 600 }))
  }
  for (const [z, l] of [
    [0, 'Д'],
    [1.27, 'Г'],
    [2.57, 'В'],
    [5, 'Б'],
    [6.5, 'А'],
  ]) {
    b.push(circle(X(rx0) - 24, Z(z), 10, { fill: '#fff', stroke: INK, sw: 1 }))
    b.push(txt(X(rx0) - 24, Z(z) + 4, l, { size: 10, anchor: 'middle', weight: 600 }))
  }

  // ---------- размеры
  b.push(dimH(X(rx0), X(rx1), Z(rz1) + 26, `${Math.round((rx1 - rx0) * 1000).toString().replace(/(\d)(\d{3})$/, '$1 $2')}`))
  b.push(dimH(X(0), X(4), Z(rz1) + 56, '4 000'))
  b.push(dimH(X(4), X(8), Z(rz1) + 56, '4 000'))
  b.push(dimH(X(8), X(9.5), Z(rz1) + 56, '1 500'))
  b.push(dimH(X(9.5), X(11), Z(rz1) + 56, '1 500'))
  b.push(dimV(Z(rz0), Z(rz1), X(rx1) + 28, '6 550'))

  // ---------- ведомость
  const tx = 918
  let ty = 128
  b.push(txt(tx, ty, 'ЭЛЕМЕНТЫ КРОВЛИ', { size: 10.5, weight: 700 }))
  ty += 14
  const rows = [
    ['Металлочерепица', `${roofArea.total.toFixed(1).replace('.', ',')} м²`, 'RAL 7021, 0,45'],
    ['Стропила 50×200', `${rafters.length} шт.`, 'L = 6 600'],
    ['Прогон LVL 300×51', '2 шт.', 'L = 12 200'],
    ['Обрешётка 25×100', '≈ 240 м', 'шаг 350'],
    ['Контробрешётка 40×40', '≈ 90 м', 'по стропилам'],
    ['Утеплитель кровли', `${(roofArea.total * 0.2).toFixed(1).replace('.', ',')} м³`, 'вата 200'],
    ['Подшив вагонкой', `${(roofArea.total * 0.85).toFixed(1).replace('.', ',')} м²`, '16 мм'],
    ['Желоб + трубы', '26 м + 2', '125 / 90'],
  ]
  for (const [n, q, note] of rows) {
    b.push(rect(tx, ty, 292, 26, { fill: '#fff', stroke: '#ded7c9', sw: 0.7 }))
    b.push(txt(tx + 7, ty + 11, n, { size: 8.2, weight: 600 }))
    b.push(txt(tx + 7, ty + 21, note, { size: 7.2, fill: DIM }))
    b.push(txt(tx + 285, ty + 16, q, { size: 8.4, weight: 600, anchor: 'end' }))
    ty += 26
  }

  ty += 20
  b.push(txt(tx, ty, 'УЗЛЫ И ПРИМЕЧАНИЯ', { size: 10.5, weight: 700 }))
  const notes = [
    'Стропила опираются на обвязку 150×150 по',
    'осям Д и Б, пролёт разбит прогонами LVL.',
    'Свесы: 600 по осям 1 и 5, 50 — по скату.',
    'Кровля вентилируемая: зазор 40 мм от',
    'контробрешётки, выход воздуха у карниза.',
    'Металлочерепица крепится в прогиб волны,',
    'саморезы с ЭПДМ-шайбой, шаг 350.',
    'Дымоход — сэндвич ⌀150, проход через кровлю',
    'с разделкой 260×360 и фартуком.',
    'Кровля террасы — продолжение общего ската,',
    'подшив вагонкой по стропилам.',
  ]
  ty += 16
  for (const n of notes) {
    b.push(txt(tx, ty, n, { size: 8, fill: '#3d3a34' }))
    ty += 12.5
  }

  return sheet({
    num: 5,
    title: 'План кровли',
    subtitle: 'Односкатная кровля: скат, прогоны, водосток, дымоход',
    scale: '1:50',
    body: b.join('\n'),
    note: 'Высокий борт — по оси А (над террасой), низкий — по оси Д. Площадь кровли с учётом свесов — см. показатели.',
  })
}
