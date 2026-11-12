import { sheet, txt, line, rect, poly, circle, dimH, dimV, axisMark, INK } from '../../../schematics/svg.js'
import { project as P, roofY, ceilingY, roofArea, openings, glazing } from '../project.js'

const DIM = '#6d6a63'
const ACCENT = '#a9693a'

const S = 76
const OX = 108
const Y0 = 640 // чистый пол

const X = (x) => OX + x * S
const Y = (y) => Y0 - y * S

const dm = P.dims
const R = P.roof
const yTile = (z) => roofY(z) + R.batten + R.counter + 0.012

const x0 = dm.x0
const x1 = dm.x0 + dm.L
const win = openings.find((o) => o.id === 'ОТ-1')

export function facadeSheet() {
  const b = []
  b.push(txt(OX, 46, 'ФАСАД 1–5 (К ТЕРРАСЕ)', { size: 19, weight: 700, letter: 1.2 }))
  b.push(
    txt(OX, 66, 'Южный фасад: панорамное окно 3 100 × 2 260, терраса 32 м² под односкатной кровлей', {
      size: 10.5,
      fill: DIM,
    })
  )

  // ---------- земля
  b.push(line(X(-0.9), Y(dm.groundY), X(dm.W + 0.9), Y(dm.groundY), { stroke: INK, w: 1.3 }))
  for (let x = -0.85; x < dm.W + 0.9; x += 0.36) {
    b.push(line(X(x), Y(dm.groundY), X(x + 0.18), Y(dm.groundY - 0.12), { stroke: '#b9b2a5', w: 0.7 }))
  }

  // ---------- сваи
  for (const x of P.piles.xs.concat([7.925])) {
    b.push(rect(X(x) - 4, Y(dm.pileTop), 8, 0.455 * S, { fill: '#9aa3a8', stroke: '#6f7a80', sw: 0.8 }))
  }

  // ---------- настил террасы
  b.push(rect(X(0), Y(dm.terraceY), dm.terX * S, 0.16 * S, { fill: '#c79a68', stroke: '#8a6035', sw: 0.9 }))
  for (let x = 0.1; x < dm.terX; x += 0.145) {
    b.push(line(X(x), Y(dm.terraceY), X(x), Y(dm.terraceY - 0.16), { stroke: '#a97c48', w: 0.4 }))
  }
  // дровник (открытая площадка под свесом)
  b.push(rect(X(dm.terX), Y(dm.terraceY), (dm.W - dm.terX) * S, 0.07 * S, { fill: '#efeae0', stroke: '#b3a893', sw: 0.7, dash: '3 3' }))
  b.push(txt(X((dm.terX + dm.W) / 2), Y(0.55), 'дровник', { size: 7.5, anchor: 'middle', fill: DIM }))

  // ---------- стена тёплого блока (x 4…11)
  const wallTop = ceilingY(dm.depth) - 0.01
  b.push(rect(X(x0), Y(wallTop), (x1 - x0) * S, wallTop * S, { fill: '#c89a63', stroke: INK, sw: 1.2 }))
  for (let y = 0.14; y < wallTop; y += 0.14) {
    b.push(line(X(x0), Y(y), X(x1), Y(y), { stroke: 'rgba(90,58,30,.35)', w: 0.5 }))
  }
  // окно ОТ-1
  b.push(rect(X(x0 + win.u0), Y(win.h), win.w * S, win.h * S, { fill: '#dfeaf0', stroke: '#22262a', sw: 1.6 }))
  for (let i = 1; i < 4; i++) {
    const xx = X(x0 + win.u0 + (win.w * i) / 4)
    b.push(rect(xx - 3, Y(win.h), 6, win.h * S, { fill: '#22262a' }))
  }
  b.push(rect(X(x0 + win.u0), Y(win.h) + win.h * S - 6, win.w * S, 6, { fill: '#22262a' }))
  b.push(rect(X(x0 + win.u0), Y(win.h), win.w * S, 6, { fill: '#22262a' }))
  // отражение неба в стекле
  b.push(
    poly(
      [
        [X(x0 + win.u0) + 4, Y(win.h) + 4],
        [X(x0 + win.u0) + 60, Y(win.h) + 4],
        [X(x0 + win.u0) + 20, Y(win.h) + win.h * S - 6],
        [X(x0 + win.u0) + 4, Y(win.h) + win.h * S - 6],
      ],
      { fill: 'rgba(255,255,255,.22)', stroke: 'none' }
    )
  )
  b.push(txt(X(x0 + win.u0 + win.w / 2), Y(win.h + 0.2), 'ОТ-1  3100 × 2260', { size: 8.5, anchor: 'middle', fill: ACCENT, weight: 600 }))

  // ---------- стойки и балки террасы
  for (const x of [0.06, 3.94, 7.94]) {
    b.push(rect(X(x) - 4.5, Y(roofY(6.35) - 0.29), 9, (roofY(6.35) - 0.29 - dm.terraceY) * S, { fill: '#b8823f', stroke: '#7d5a2c', sw: 0.9 }))
  }
  // ограждение
  for (let x = 0.06; x < 4.4; x += 0.26) {
    b.push(rect(X(x) - 2, Y(dm.terraceY + 0.86), 4, 0.86 * S, { fill: '#a9693a', stroke: 'none' }))
  }
  b.push(rect(X(0), Y(dm.terraceY + 1.0), 4.4 * S, 0.07 * S, { fill: '#8a6035', stroke: '#6b4a26', sw: 0.8 }))

  // ---------- кровля (видимый высокий борт)
  const roofTop = yTile(dm.D)
  const roofBot = roofY(dm.D) - 0.29
  b.push(rect(X(R.x0), Y(roofTop), (R.x1 - R.x0) * S, (roofTop - roofBot) * S, { fill: '#31363a', stroke: '#1d2124', sw: 1 }))
  // подшив (вагонка) по низу кровли над террасой
  for (let x = R.x0; x < R.x1 - 0.01; x += 0.145) {
    b.push(line(X(x), Y(roofBot), X(x), Y(roofBot + 0.016), { stroke: 'rgba(210,170,120,.55)', w: 0.5 }))
  }
  b.push(rect(X(R.x0), Y(roofBot + 0.016), (R.x1 - R.x0) * S, 0.016 * S, { fill: '#f0dcb8', stroke: '#c9a874', sw: 0.6 }))
  // капельник по краю
  b.push(rect(X(R.x0) - 1, Y(roofTop + 0.02), (R.x1 - R.x0) * S + 2, 0.03 * S, { fill: '#22262a' }))
  b.push(txt(X(0.9), Y(roofTop) - 8, 'кровля: металлочерепица RAL 7021, уклон 9,8°', { size: 8, fill: DIM }))

  // ---------- ступени
  for (let i = 0; i < 3; i++) {
    const top = dm.terraceY - 0.18 * (i + 1)
    b.push(rect(X(5.35), Y(top), 2.3 * S, 0.05 * S, { fill: '#c79a68', stroke: '#8a6035', sw: 0.8 }))
    b.push(rect(X(5.35), Y(top), 2.3 * S, 0.18 * S, { fill: '#b98452', stroke: 'none' }))
  }

  // ---------- отметки
  for (const [x, y, t] of [
    [10.7, dm.groundY, '−0,750'],
    [10.7, 0, '±0,000'],
    [10.7, dm.terraceY, '+0,040'],
    [10.7, wallTop, `+${wallTop.toFixed(2).replace('.', ',')}`],
    [10.7, roofTop, `+${roofTop.toFixed(2).replace('.', ',')}`],
  ]) {
    b.push(line(X(x) - 8, Y(y), X(x) + 8, Y(y), { stroke: ACCENT, w: 1 }))
    b.push(txt(X(x) + 12, Y(y) - 4, t, { size: 8.5, fill: ACCENT, weight: 600 }))
  }

  // ---------- оси и размеры
  for (const [x, l] of [
    [0, '1'],
    [x0, '2'],
    [dm.terX, '3'],
    [9.5, '4'],
    [dm.W, '5'],
  ]) {
    b.push(line(X(x), Y(roofTop + 0.5), X(x), Y(-1.1), { stroke: '#c2bbae', w: 0.8, dash: '12 4 3 4' }))
    b.push(axisMark(X(x), Y(-1.35), l))
  }
  b.push(dimH(X(0), X(x0), Y(-0.95), '4 000'))
  b.push(dimH(X(x0), X(dm.terX), Y(-0.95), '4 000'))
  b.push(dimH(X(dm.terX), X(9.5), Y(-0.95), '1 500'))
  b.push(dimH(X(9.5), X(dm.W), Y(-0.95), '1 500'))
  b.push(dimH(X(0), X(dm.W), Y(-1.7), '11 000'))
  b.push(dimV(Y(0), Y(dm.terraceY), X(-0.55), '40'))
  b.push(dimV(Y(0), Y(wallTop), X(-0.55), '3 170'))
  b.push(dimV(Y(dm.groundY), Y(roofTop), X(dm.W + 1.5), '4 470'))

  // ---------- ведомость фасада
  const tx = 902
  let ty = 120
  b.push(txt(tx, ty, 'ВЕДОМОСТЬ ОТДЕЛКИ ФАСАДА', { size: 10.5, weight: 700 }))
  ty += 14
  const rows = [
    ['Имитация бруса 16×140', `${(P.dims.L * 2.9).toFixed(1).replace('.', ',')} м²`, 'наружная стена блока'],
    ['Кровля, металлочерепица', `${roofArea.total.toFixed(1).replace('.', ',')} м²`, 'RAL 7021, 0,45 мм'],
    ['Террасная доска 28', '32,0 м²', 'лиственница'],
    ['Подшив свеса', '≈ 6,3 м²', 'вагонка 16'],
    ['Ограждение террасы', '10,7 м', 'поручень h = 1,0 м'],
    ['Стойки 120×120', '3 шт.', 'под кровлю террасы'],
    ['Окна', `${glazing.windows.toFixed(1).replace('.', ',')} м²`, '4 шт. по ведомости'],
    ['Двери', '1 террасная', '1600 × 2260'],
  ]
  for (const [n, q, note] of rows) {
    b.push(rect(tx, ty, 300, 27, { fill: '#fff', stroke: '#ded7c9', sw: 0.7 }))
    b.push(txt(tx + 7, ty + 11, n, { size: 8.2, weight: 600 }))
    b.push(txt(tx + 7, ty + 21, note, { size: 7.2, fill: DIM }))
    b.push(txt(tx + 293, ty + 16, q, { size: 8.4, weight: 600, anchor: 'end' }))
    ty += 27
  }

  ty += 22
  b.push(txt(tx, ty, 'ПРИМЕЧАНИЯ', { size: 10.5, weight: 700 }))
  const notes = [
    'Окно ОТ-1 — панорамное, 4 полотна, алюминий,',
    'стеклопакет 2-камерный, порог на 0,000.',
    'Перепад пол–терраса 40 мм закрывается порогом.',
    'Фасад — горизонтальная имитация бруса по',
    'вентзазору 25 мм, крепление скрытое.',
    'Кровля односкатная: видимый борт 3,72 м,',
    'свес 600 по бокам, водосток — на оси Д.',
    'Ступени — 3 подъёма по 180 мм, лиственница.',
  ]
  ty += 16
  for (const n of notes) {
    b.push(txt(tx, ty, n, { size: 8, fill: '#3d3a34' }))
    ty += 12.5
  }

  return sheet({
    num: 6,
    title: 'Фасад 1–5',
    subtitle: 'Главный фасад к террасе: панорама 3,1 м, односкатная кровля',
    scale: '1:50',
    body: b.join('\n'),
    note: 'Высоты — от чистого пола. Фасад читается с террасы; остальные фасады решены так же: брус 16 мм, окна в тёмных рамах.',
  })
}
