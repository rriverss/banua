import { sheet, txt, line, rect, poly, circle, dimH, dimV, callout, INK, DIM, ACCENT } from '../../../schematics/svg.js'
import { project as P, roofY, roofUnderY, glazing, gable, openings } from '../project.js'
import { mm } from './plan.js'

const S = 84
const OX = 150
const BASE = 648
const X = (x) => OX + x * S
const Y = (y) => BASE - y * S

const R = P.roof
const L = P.dims.L
const H = P.dims.wallH
const eaveY = roofY(R.eaveX)
const under = (x) => roofUnderY(x)
const GW = P.glassWall
const door = openings.find((o) => o.id === 'ДВ-1')
const CX = 720

export function facadeSheet() {
  const b = []
  b.push(txt(60, 58, 'ГЛАВНЫЙ ФАСАД. ОСЬ В', { size: 19, weight: 700, letter: 1.2 }))
  b.push(txt(60, 82, 'Фронтон-витраж 6,0 м, терраса под кровлей. Барнхаус: графит + лиственница', { size: 11, fill: DIM }))

  // ---- терраса и ступени
  b.push(rect(X(0), Y(0), L * S, 0.12 * S, { fill: '#b98a58', stroke: '#8a6a44', sw: 1 }))
  for (let i = 0; i < 3; i++) {
    b.push(rect(X(1.4), Y(-0.16 - i * 0.17), 3.2 * S, 0.17 * S, { fill: i % 2 ? '#c79a67' : '#b98a58', stroke: '#8a6a44', sw: 0.9 }))
  }
  // стойки террасы
  for (const x of [0.1, L - 0.1]) {
    b.push(rect(X(x) - 4, Y(2.62), 8, 2.62 * S, { fill: '#3a3f43', stroke: '#20242a', sw: 0.9 }))
  }

  // ---- витраж: стекло
  b.push(rect(X(0.05), Y(H), (L - 0.1) * S, H * S, { fill: '#d3e6ec', stroke: 'none', sw: 0 }))
  b.push(
    poly(
      [
        [X(0.05), Y(under(0.05))],
        [X(3), Y(under(3))],
        [X(3), Y(H)],
        [X(0.05), Y(H)],
      ],
      { fill: '#cfdfe6', stroke: 'none', sw: 0 }
    )
  )
  // ---- деревянная часть фронтона (справа от оси 2)
  b.push(
    poly(
      [
        [X(3), Y(under(3))],
        [X(L - 0.05), Y(under(L - 0.05))],
        [X(L - 0.05), Y(H)],
        [X(3), Y(H)],
      ],
      { fill: '#b07a45', stroke: '#7d5227', sw: 1 }
    )
  )
  for (let x = 3.1; x < L - 0.06; x += 0.15) {
    const yTop = Math.min(under(x), under(3))
    if (Y(yTop) >= Y(H) - 1) continue
    b.push(line(X(x), Y(yTop), X(x), Y(H), { stroke: '#8d5c2c', w: 0.5, opacity: 0.55 }))
  }
  // ---- каркас витража
  b.push(line(X(0.05), Y(0), X(L - 0.05), Y(0), { stroke: '#20242a', w: 6 }))
  b.push(line(X(0.05), Y(H), X(L - 0.05), Y(H), { stroke: '#20242a', w: 5 }))
  b.push(line(X(0.05), Y(GW.transom), X(L - 0.05), Y(GW.transom), { stroke: '#20242a', w: 4 }))
  for (const x of GW.mullions) {
    const top = x <= 3.01 ? under(x) : H
    b.push(line(X(x), Y(0), X(x), Y(top), { stroke: '#20242a', w: 4.5 }))
  }
  b.push(line(X(0.05), Y(under(0.05)), X(3), Y(under(3)), { stroke: '#20242a', w: 4.5 }))
  // дверь
  b.push(rect(X(door.u0), Y(door.h), door.w * S, door.h * S, { fill: 'none', stroke: '#20242a', sw: 3.5 }))
  b.push(line(X(door.u0 + 0.08), Y(1.0), X(door.u0 + 0.08), Y(1.14), { stroke: '#9aa3a8', w: 5 }))

  // ---- кровля и свесы
  const roofBand = [
    [X(R.eaveX), Y(eaveY)],
    [X(R.ridgeX), Y(R.ridgeY)],
    [X(R.eaveRightX), Y(eaveY)],
    [X(R.eaveRightX), Y(eaveY - 0.17)],
    [X(R.ridgeX), Y(R.ridgeY - 0.17)],
    [X(R.eaveX), Y(eaveY - 0.17)],
  ]
  b.push(poly(roofBand, { fill: '#2b2f33', stroke: '#181b1e', sw: 1.2 }))
  b.push(line(X(R.eaveX), Y(eaveY - 0.17), X(R.ridgeX), Y(R.ridgeY - 0.17), { stroke: '#454c52', w: 1 }))

  // ---- размеры
  b.push(dimH(X(0), X(3), 730, mm(3)))
  b.push(dimH(X(3), X(L), 730, mm(3)))
  b.push(dimH(X(0), X(L), 762, mm(L)))
  b.push(dimV(Y(0), Y(H), 96, mm(H)))
  b.push(dimV(Y(0), Y(R.ridgeY), 62, mm(R.ridgeY)))

  // ---- выноски
  b.push(callout(X(4.4), Y(H + 0.4), 1, X(5.5), Y(3.42)))
  b.push(callout(X(1.0), Y(1.5), 2, X(0.45), Y(0.95)))
  b.push(callout(X(2.2), Y(R.ridgeY - 0.1), 3, X(1.05), Y(R.ridgeY + 0.34)))
  b.push(callout(X(5.2), Y(0.2), 4, X(5.55), Y(-0.66)))

  // ---- легенда
  b.push(txt(CX, 110, 'ОТДЕЛКА ФАСАДА', { size: 11, weight: 700, letter: 0.6 }))
  const legend = [
    ['1', 'Фронтон — лиственница, натур', '#b07a45'],
    ['2', 'Витраж — стеклопакет 2-кам., рама чёрная', '#cfdfe6'],
    ['3', 'Кровля — фальц RAL 7021, свес 400', '#2b2f33'],
    ['4', 'Терраса — доска лиственница 28×140', '#b98a58'],
    ['5', 'Стены — рейка RAL 7021 (графит)', '#34393d'],
  ]
  legend.forEach(([n, t, c], i) => {
    const y = 130 + i * 25
    b.push(rect(CX, y, 15, 15, { fill: c, stroke: '#b9b2a5', sw: 0.8 }))
    b.push(txt(CX + 7.5, y + 11, n, { size: 7.5, anchor: 'middle', fill: c === '#2b2f33' || c === '#34393d' ? '#fff' : INK, weight: 700 }))
    b.push(txt(CX + 24, y + 11.5, t, { size: 8.5, fill: '#3d3a34' }))
  })

  // ---- остекление
  b.push(txt(CX, 288, 'ОСТЕКЛЕНИЕ', { size: 11, weight: 700, letter: 0.6 }))
  const gl = [
    ['Площадь витража', '19,4 м² (чистое 17,3)'],
    ['Стеклопакет', '2-кам., закалка'],
    ['Профиль', 'алюминий, чёрный, 60 мм'],
    ['Трансома', '2 100 мм от пола'],
    ['Дверь в витраже', '1 900 × 2 000'],
    ['Фронтон', 'стекло слева, дерево справа'],
    ['Ориентир цены', '18 000 ₽/м² с монтажом'],
  ]
  gl.forEach(([k, v], i) => {
    const y = 310 + i * 17
    b.push(txt(CX, y, k, { size: 8.5, fill: DIM }))
    b.push(txt(CX + 490, y, v, { size: 8.5, weight: 600, anchor: 'end' }))
    const x0 = CX + k.length * 4.6 + 8
    const x1 = CX + 490 - v.length * 4.9 - 8
    if (x1 > x0 + 6) b.push(line(x0, y - 2.5, x1, y - 2.5, { stroke: '#ddd6c8', w: 0.7, dash: '1.5 3' }))
  })

  // ---- примечания
  b.push(txt(CX, 460, 'ПРИМЕЧАНИЯ', { size: 11, weight: 700, letter: 0.6 }))
  const notes = [
    'Стойка по оси 2 — несущая: держит конёк и стену П1.',
    'Стекло в парной не ставим; мойку можно матировать.',
    'Рама утоплена на 60 мм, откосы скрытые.',
    'Водосток подвесной, стояки у боковых стен.',
    'Витраж — после кровли и закрытия контура.',
  ]
  notes.forEach((t, i) => {
    b.push(circle(CX + 3, 478 + i * 20, 1.5, { fill: ACCENT, stroke: ACCENT }))
    b.push(txt(CX + 12, 481 + i * 20, t, { size: 8.5, fill: '#3d3a34' }))
  })

  // ---- узел примыкания витража к кровле
  const dx = CX
  const dy = 596
  b.push(txt(dx, dy, 'УЗЕЛ · ВИТРАЖ + КРОВЛЯ (1:25)', { size: 10, weight: 700 }))
  b.push(rect(dx, dy + 10, 490, 140, { fill: '#fbf9f4', stroke: '#cfc7b8', sw: 0.9 }))
  b.push(poly([[dx + 30, dy + 128], [dx + 30, dy + 60], [dx + 62, dy + 60], [dx + 62, dy + 128]], { fill: '#d3e6ec', stroke: '#20242a', sw: 1.2 }))
  b.push(line(dx + 62, dy + 64, dx + 300, dy + 26, { stroke: '#2b2f33', w: 10 }))
  b.push(line(dx + 62, dy + 74, dx + 300, dy + 36, { stroke: '#8a6a44', w: 4 }))
  b.push(rect(dx + 58, dy + 48, 12, 40, { fill: '#20242a', stroke: '#20242a' }))
  b.push(txt(dx + 90, dy + 40, 'фальц + обрешётка', { size: 7.5, fill: DIM }))
  b.push(txt(dx + 90, dy + 92, 'стойка витража 60×120', { size: 7.5, fill: DIM }))
  b.push(txt(dx + 90, dy + 108, 'герметик + ПСУЛ + пена', { size: 7.5, fill: DIM }))
  b.push(txt(dx + 30, dy + 142, 'Верхняя обвязка витража — по стойке оси 2, свес кровли 350.', { size: 7.5, fill: '#5d584e' }))

  return sheet({
    num: 5,
    title: 'Главный фасад',
    subtitle: `Витраж ${glazing.area.toFixed(1).replace('.', ',')} м², фронтон ${gable.height.toFixed(2).replace('.', ',')} м, уклон ${R.pitch}°`,
    scale: '1:50',
    body: b.join(''),
    note: 'RAL 7021 — стены и кровля, лиственница натур — фронтон и терраса. Стеклопакет 2-кам. с закалкой, рама чёрная.',
  })
}
