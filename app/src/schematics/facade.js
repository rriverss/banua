import { sheet, txt, line, rect, poly, path, circle, dimH, dimV, INK } from './svg.js'
import { project as P, openings, gable, glazing } from '../model/project.js'

const DIM = '#6d6a63'
const ACCENT = '#a9693a'

const S = 74
const OX = 118
const Y0 = 690 // уровень чистого пола / настила

const X = (x) => OX + x * S
const Y = (y) => Y0 - y * S

const W = P.dims.W
const x0 = P.dims.x0
const x1 = x0 + P.dims.L
const R = P.roof
const GW = P.glassWall
const eaveY = R.eaveY
const ridgeY = R.ridgeY
const ridgeX = R.ridgeX
const wallH = P.dims.wallH
const topGlaze = GW.top
const beamTop = wallH - 0.12

const door = openings.find((o) => o.id === 'ДВ-1')
const doorX0 = x0 + door.u0
const doorX1 = doorX0 + door.w

function callout(n, tx, ty, px, py, lx, ly) {
  return (
    circle(px, py, 9, { fill: '#fff', stroke: ACCENT, sw: 1.3 }) +
    txt(px, py + 3.4, String(n), { size: 9, anchor: 'middle', fill: ACCENT, weight: 700 }) +
    line(px, py, lx, ly, { stroke: ACCENT, w: 0.8 }) +
    line(lx, ly, tx, ty, { stroke: ACCENT, w: 0.8 }) +
    txt(tx - 4, ty + 3, '', { size: 8 })
  )
}

export function facadeSheet() {
  const b = []

  // ---------- земля и цоколь
  b.push(line(X(-0.6), Y(-0.48), X(W + 0.8), Y(-0.48), { stroke: INK, w: 1.4 }))
  b.push(rect(X(x0), Y(0), (x1 - x0) * S, 0.48 * S, { fill: '#d9d4ca', stroke: '#a39c8f', sw: 0.8 }))
  for (let x = x0 + 0.1; x < x1; x += 0.32) {
    b.push(line(X(x), Y(-0.45), X(x), Y(0), { stroke: '#bcb5a8', w: 0.5 }))
  }

  // ---------- стена (тёмная рейка) под витражом и по краям
  b.push(rect(X(x0), Y(0.05), (x1 - x0) * S, 0.06 * S, { fill: '#2c3033' }))

  // ---------- витраж
  const gx0 = X(x0)
  const gx1 = X(x1)
  b.push(rect(gx0, Y(topGlaze), (x1 - x0) * S, (topGlaze - 0.05) * S, { fill: '#dce8ec', stroke: INK, sw: 1.2 }))
  // стеклопакеты: вертикальные стойки
  for (const m of GW.mullions) {
    b.push(rect(X(m) - 5, Y(topGlaze), 10, (topGlaze - 0.05) * S, { fill: '#23282b' }))
  }
  // трансома
  b.push(rect(gx0, Y(GW.transom) - 4, (x1 - x0) * S, 8, { fill: '#23282b' }))
  // дверь
  b.push(rect(X(doorX0), Y(door.h), door.w * S, door.h * S, { fill: '#cfdde2', stroke: '#23282b', sw: 1.6 }))
  b.push(rect(X(doorX0 + door.w / 2) - 3, Y(1.15), 6, 1.0 * S, { fill: '#8c9aa0' }))
  b.push(circle(X(doorX0 + door.w - 0.12), Y(1.05), 3.6, { fill: '#4d5357' }))
  // нижняя обвязка
  b.push(rect(gx0, Y(0.05), (x1 - x0) * S, 4, { fill: '#23282b' }))

  // ---------- верхняя балка и стеновая обвязка
  b.push(rect(X(x0), Y(beamTop), (x1 - x0) * S, 0.2 * S, { fill: '#c08a55', stroke: '#7d5533', sw: 0.9 }))
  b.push(rect(X(x0), Y(wallH), (x1 - x0) * S, 0.12 * S, { fill: '#8a5a30' }))

  // ---------- фронтон (лиственница)
  b.push(
    poly(
      [
        [X(x0), Y(wallH)],
        [X(x1), Y(wallH)],
        [X(ridgeX), Y(ridgeY - 0.05)],
      ],
      { fill: '#d9b183', stroke: '#a67c4a', sw: 1.1 }
    )
  )
  for (let i = 1; i < 26; i++) {
    const yy = wallH + (i * (ridgeY - wallH)) / 26
    const half = ((ridgeX - R.eaveX) * (ridgeY - yy)) / (ridgeY - eaveY)
    b.push(
      line(X(ridgeX - half), Y(yy), X(ridgeX + half), Y(yy), { stroke: '#c39a6b', w: 0.45 })
    )
  }

  // ---------- кровля: два ската, торцевые планки
  const t = 0.24
  const covL = [
    [R.eaveX, eaveY],
    [ridgeX, ridgeY],
    [ridgeX, ridgeY + 0.02],
    [R.eaveX, eaveY - t],
  ]
  const covR = [
    [ridgeX, ridgeY],
    [R.eaveRightX, eaveY],
    [R.eaveRightX, eaveY - t],
    [ridgeX, ridgeY + 0.02],
  ]
  b.push(poly(covL.map(([x, y]) => [X(x), Y(y)]), { fill: '#2b3034', stroke: '#1d2124', sw: 1 }))
  b.push(poly(covR.map(([x, y]) => [X(x), Y(y)]), { fill: '#2b3034', stroke: '#1d2124', sw: 1 }))
  // перфорированная лента под свесом
  for (const sx of [R.eaveX, R.eaveRightX]) {
    b.push(rect(X(sx) - 3, Y(eaveY - t), 6, 0.1 * S, { fill: '#4b5155' }))
  }
  // конёк
  b.push(rect(X(ridgeX) - 6, Y(ridgeY + 0.06), 12, 0.12 * S, { fill: '#1d2124' }))

  // ---------- стойки и настил террасы
  const zf = P.dims.depth
  b.push(rect(X(0), Y(0.02), W * S, 0.06 * S, { fill: '#b98452', stroke: '#7d5533', sw: 0.8 }))
  for (const px of [x0 + 0.25, x1 - 0.25]) {
    b.push(rect(X(px) - 6, Y(2.55), 12, 2.55 * S, { fill: '#6f4a28', stroke: '#4a3018', sw: 0.8 }))
  }
  // ступени во всю ширину
  for (let i = 0; i < 3; i++) {
    const h = 0.18 * (i + 1)
    b.push(rect(X(0), Y(-h + 0.18) + 0.05 * S * 0, W * S, 0.18 * S, { fill: i % 2 ? '#c79a68' : '#bd8e5b', stroke: '#8a6035', sw: 0.8 }))
    b.push(line(X(0), Y(-h), X(W), Y(-h), { stroke: '#8a6035', w: 0.8 }))
  }

  // ---------- размеры
  b.push(dimH(X(0), X(x0), Y(-0.84), '2 000'))
  b.push(dimH(X(x0), X(x1), Y(-0.84), '8 000'))
  b.push(dimH(X(0), X(x1), Y(-1.14), '10 000'))
  b.push(dimV(Y(0), Y(topGlaze), X(0) - 30, '2 550'))
  b.push(dimV(Y(topGlaze), Y(ridgeY), X(0) - 30, '2 780'))
  b.push(dimV(Y(0), Y(ridgeY), X(0) - 62, '5 333'))
  b.push(
    txt(X(ridgeX) + 8, Y((eaveY + ridgeY) / 2), `уклон ${R.pitch}°`, {
      size: 9,
      fill: ACCENT,
      weight: 600,
      rotate: -31,
    })
  )

  // ---------- выноски
  b.push(callout(1, X(4.2), Y(3.55), X(4.0), Y(3.6), X(4.6), Y(3.75)))
  b.push(callout(2, X(3.0), Y(1.35), X(2.55), Y(1.3), X(2.1), Y(1.9)))
  b.push(callout(3, X(9.4), Y(3.85), X(8.6), Y(4.1), X(8.2), Y(4.35)))
  b.push(callout(4, X(7.2), Y(-0.35), X(7.6), Y(-0.05), X(7.9), Y(-0.4)))

  // ---------- подписи
  b.push(txt(OX - 20, 46, 'ГЛАВНЫЙ ФАСАД. ОСЬ 6 (ВИТРАЖ)', { size: 19, weight: 700, letter: 1.2 }))
  b.push(
    txt(OX - 20, 68, 'Фронтон-витраж 8,0 м, терраса 2,5 м под кровлей: графит + лиственница', {
      size: 10.5,
      fill: DIM,
    })
  )

  // ---------- легенда справа
  const lx = 918
  let ly = 118
  b.push(txt(lx, ly, 'ОТДЕЛКА ФАСАДА', { size: 10.5, weight: 700, letter: 0.4 }))
  ly += 20
  const legend = [
    ['#d9b183', '1', 'Фронтон — планкен лиственницы, натур'],
    ['#dce8ec', '2', 'Витраж — стеклопакет 2-кам., рама чёрная'],
    ['#2b3034', '3', 'Кровля — фальц RAL 7021, свес 700'],
    ['#bd8e5b', '4', 'Терраса — доска лиственницы 28×140'],
    ['#2c3033', '5', 'Стены — рейка RAL 7021 (графит)'],
  ]
  for (const [c, n, text] of legend) {
    b.push(rect(lx, ly - 9, 13, 11, { fill: c, stroke: '#9c968a', sw: 0.7 }))
    b.push(txt(lx + 20, ly, `${n}. ${text}`, { size: 8.6 }))
    ly += 17
  }

  ly += 16
  b.push(txt(lx, ly, 'ВИТРАЖ', { size: 10, weight: 700, letter: 0.4 }))
  ly += 15
  const rows = [
    ['Габарит', `${(x1 - x0).toFixed(1).replace('.', ',')} × ${topGlaze.toFixed(2).replace('.', ',')} м`],
    ['Площадь', `${glazing.area.toFixed(1).replace('.', ',')} м² (чистое ${glazing.net.toFixed(1).replace('.', ',')})`],
    ['Заполнение', '2-камерный стеклопакет, закалка'],
    ['Рамы', 'алюминий, RAL 9005, 60 мм'],
    ['Стойки', `шаг ~1,3 м, ${GW.mullions.length} шт.`],
    ['Трансома', `${GW.transom.toFixed(2).replace('.', ',')} м от пола`],
    ['Дверь', `${Math.round(door.w * 1000)} × ${Math.round(door.h * 1000)} мм`],
    ['Фронтон', `h ${gable.height.toFixed(2).replace('.', ',')} м, ${(gable.area / 2).toFixed(2).replace('.', ',')} м²`],
  ]
  for (const [k, v] of rows) {
    b.push(txt(lx, ly, k, { size: 8.2, fill: DIM }))
    b.push(txt(lx + 92, ly, v, { size: 8.4, weight: 600 }))
    ly += 14
  }

  ly += 14
  b.push(txt(lx, ly, 'ПРИМЕЧАНИЯ', { size: 10, weight: 700, letter: 0.4 }))
  ly += 14
  const notes = [
    '• Витраж — самонесущий, по стойкам 60×120 мм.',
    '• Верхняя балка 200×200 — разгрузка фронтона.',
    '• Свес кровли 700 мм закрывает витраж от косого дождя.',
    '• Фронтон — планкен по контрбруску, вентзазор 30 мм.',
    '• Цоколь — плитняк, отступ 30 мм от рейки.',
    '• Все узлы — см. лист 7.',
  ]
  for (const n of notes) {
    b.push(txt(lx, ly, n, { size: 8.2, fill: DIM }))
    ly += 13
  }

  ly += 14
  b.push(rect(lx, ly - 10, 282, 62, { fill: '#f7f2e7', stroke: '#d8d0c0', sw: 0.8 }))
  b.push(txt(lx + 10, ly + 6, 'ПАРАМЕТРЫ', { size: 8.6, weight: 700 }))
  b.push(txt(lx + 10, ly + 22, `Кровля: ${(R.zFront - R.zBack).toFixed(1).replace('.', ',')} × ${(R.eaveRightX - R.eaveX).toFixed(1).replace('.', ',')} м, ${R.pitch}°`, { size: 8, fill: DIM }))
  b.push(txt(lx + 10, ly + 35, `Конёк: x = ${ridgeX.toFixed(2).replace('.', ',')} м, отм. +${ridgeY.toFixed(2).replace('.', ',')}`, { size: 8, fill: DIM }))
  b.push(txt(lx + 10, ly + 48, `Карниз: +${eaveY.toFixed(2).replace('.', ',')} м, вынос 700 мм`, { size: 8, fill: DIM }))

  return sheet({
    num: 6,
    title: 'Главный фасад',
    subtitle: 'Витраж, фронтон, терраса',
    scale: '1:50',
    body: b.join('\n'),
    note: 'RAL 7021 — стены и кровля, лиственница натур — фронтон и терраса. Стеклопакет 2-кам. с закалкой, рама чёрная.',
  })
}
