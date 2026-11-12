import { sheet, txt, line, rect, poly, path, circle, dimH, dimV, axisMark, INK } from '../../../schematics/svg.js'
import { project as P, walls, ceilingY } from '../project.js'

const DIM = '#6d6a63'
const ACCENT = '#a9693a'

const S = 118
const OX = 126
const Y0 = 574 // 0,000

const X = (u) => OX + u * S
const Y = (y) => Y0 - y * S

const dm = P.dims

// западная стена (ось 2): от z=0 (Д) к z=5 (Б)
const wallC = walls.find((w) => w.id === 'C')
const L = wallC.length // 5,0
const topAt = (u) => ceilingY(wallC.a.z + u) - 0.01
const op1 = wallC.openings.find((o) => o.id === 'ДП-1') // 1600×2260, u0 0.76
const op2 = wallC.openings.find((o) => o.id === 'ОТ-2') // 640×2260, u0 3.66

export function wallSheet() {
  const b = []
  b.push(txt(OX - 14, 46, 'СТЕНА ПО ОСИ 2 (ЗАПАДНЫЙ ФАСАД)', { size: 19, weight: 700, letter: 1 }))
  b.push(
    txt(OX - 14, 68, 'Развёртка 5 000 мм: шаг стоек 600, верх стены по скату 2 300 → 3 170. Дверь и окно в пол', {
      size: 10.5,
      fill: DIM,
    })
  )

  // ---------- контур стены
  b.push(
    poly(
      [
        [X(0), Y(0)],
        [X(L), Y(0)],
        [X(L), Y(topAt(L))],
        [X(0), Y(topAt(0))],
      ],
      { fill: '#faf4e8', stroke: INK, sw: 1.4 }
    )
  )

  // ---------- стойки 40×150 (шаг ~600)
  const studs = []
  for (let u = 0.05; u < L - 0.02; u += 0.6) studs.push(u)
  studs.push(L - 0.05)
  for (const u of studs) {
    const top = topAt(u) - 0.04
    b.push(rect(X(u) - 3.5, Y(top), 7, (top - 0.04) * S, { fill: 'url(#insul)', stroke: '#c9a874', sw: 0.7 }))
  }
  // нижняя и верхняя обвязки
  b.push(rect(X(0), Y(0.04), L * S, 0.04 * S, { fill: '#d9a568', stroke: '#a98f62', sw: 0.7 }))
  b.push(
    poly(
      [
        [X(0), Y(topAt(0))],
        [X(L), Y(topAt(L))],
        [X(L), Y(topAt(L) - 0.04)],
        [X(0), Y(topAt(0) - 0.04)],
      ],
      { fill: '#d9a568', stroke: '#a98f62', sw: 0.7 }
    )
  )

  // ---------- проёмы
  for (const [o, label] of [
    [op1, 'ДП-1 1600×2260'],
    [op2, 'ОТ-2 640×2260'],
  ]) {
    b.push(rect(X(o.u0), Y(o.y1), o.w * S, o.h * S, { fill: '#dfeaf0', stroke: '#31363a', sw: 1.4 }))
    // створки
    const leaves = o.id === 'ДП-1' ? 2 : 1
    const lw = (o.w * S) / leaves
    for (let i = 0; i < leaves; i++) {
      b.push(rect(X(o.u0) + i * lw + 3, Y(o.y1) + 3, lw - 6, o.h * S - 6, { fill: 'none', stroke: '#5a6b72', sw: 0.9 }))
    }
    // перемычка над проёмом
    b.push(rect(X(o.u0), Y(o.y1 + 0.15), o.w * S, 0.15 * S, { fill: '#e6c8a0', stroke: '#a98f62', sw: 0.7 }))
    b.push(txt(X(o.u0 + o.w / 2), Y(o.y1) - 8, label, { size: 8.5, anchor: 'middle', fill: ACCENT, weight: 600 }))
  }

  // ---------- отметки
  for (const [u, y, t, side] of [
    [0, 0, '±0,000', 1],
    [0, topAt(0), `+${topAt(0).toFixed(2).replace('.', ',')}`, -1],
    [L, topAt(L), `+${topAt(L).toFixed(2).replace('.', ',')}`, -1],
  ]) {
    b.push(line(X(u) - 8, Y(y), X(u) + 8, Y(y), { stroke: ACCENT, w: 1 }))
    if (side > 0) b.push(txt(X(u) + 12, Y(y) - 5, t, { size: 8.5, fill: ACCENT, weight: 600 }))
    else b.push(txt(X(u) - 10, Y(y) - 7, t, { size: 8.5, fill: ACCENT, weight: 600, anchor: 'end' }))
  }

  // ---------- размеры по фасаду
  b.push(dimH(X(0), X(0.76), Y(-0.42), '760'))
  b.push(dimH(X(0.76), X(2.36), Y(-0.42), '1 600'))
  b.push(dimH(X(2.36), X(3.66), Y(-0.42), '1 300'))
  b.push(dimH(X(3.66), X(4.3), Y(-0.42), '640'))
  b.push(dimH(X(4.3), X(L), Y(-0.42), '700'))
  b.push(dimH(X(0), X(L), Y(-0.76), '5 000'))
  b.push(dimV(Y(0), Y(op1.y1), X(-0.32), '2 260'))
  b.push(dimV(Y(0), Y(topAt(0)), X(-0.62), '2 300'))
  b.push(dimV(Y(0), Y(topAt(L)), X(L + 0.5), '3 170'))

  // ---------- сечение стены (справа): слои в масштабе
  const sx = 744
  const sy = 150
  const k = 900 // px/м для слоёв (утрировано, с подписями)
  b.push(txt(sx, sy - 10, 'СЕЧЕНИЕ СТЕНЫ ПО ГОРИЗОНТАЛИ', { size: 10, weight: 700 }))
  b.push(txt(sx, sy + 2, 'толщины показаны условно', { size: 7.5, fill: DIM }))
  const layersBar = [
    { t: 0.016, fill: '#c89a63', label: 'имитация бруса 16' },
    { t: 0.025, fill: '#e8e2d6', label: 'вентзазор 25' },
    { t: 0.15, fill: 'url(#insul)', label: 'стойка 40×150 + вата 150' },
    { t: 0.016, fill: '#f0dcb8', label: 'вагонка 16' },
  ]
  const barW = 250
  const total = layersBar.reduce((a, l) => a + l.t, 0)
  let bx = sx
  const barY = sy + 16
  for (const l of layersBar) {
    const w = (l.t / total) * barW
    b.push(rect(bx, barY, w, 26, { fill: l.fill, stroke: INK, sw: 0.9 }))
    bx += w
  }
  b.push(txt(sx - 6, barY + 17, 'нар.', { size: 7.5, anchor: 'end', fill: DIM }))
  b.push(txt(bx + 6, barY + 17, 'внутр.', { size: 7.5, fill: DIM }))
  let ly2 = barY + 42
  for (const l of layersBar) {
    b.push(txt(sx, ly2, '• ' + l.label, { size: 8.2 }))
    ly2 += 12.5
  }
  b.push(txt(sx, ly2 + 4, 'снаружи мембрана ветро-влагозащитная', { size: 8.2, fill: DIM }))
  b.push(txt(sx, ly2 + 16, 'изнутри пароизоляция (в мокрых — фольга)', { size: 8.2, fill: DIM }))

  // ---------- каркас: шаг
  b.push(txt(OX - 14, 96, 'шаг стоек 600 мм, обвязка 40×150, углы — ОСП 9 мм на укосинах', { size: 8.5, fill: DIM }))

  // ---------- ведомость проёмов
  const tx = 906
  let ty = 330
  b.push(txt(tx, ty, 'ВЕДОМОСТЬ ПРОЁМОВ', { size: 10.5, weight: 700 }))
  ty += 12
  const rows = [
    ['ДП-1', 'дверь террасная', '1600×2260', '2 створки, стекло'],
    ['ОТ-2', 'окно в пол', '640×2260', 'стеклопакет'],
  ]
  b.push(rect(tx, ty, 300, 20, { fill: '#f1ece2', stroke: INK, sw: 1 }))
  b.push(txt(tx + 6, ty + 14, 'Марка', { size: 8.4, weight: 700 }))
  b.push(txt(tx + 62, ty + 14, 'Размер, мм', { size: 8.4, weight: 700 }))
  b.push(txt(tx + 170, ty + 14, 'Заполнение', { size: 8.4, weight: 700 }))
  ty += 20
  for (const [m, n, s2, f] of rows) {
    b.push(rect(tx, ty, 300, 34, { fill: '#fff', stroke: '#cdc6ba', sw: 0.8 }))
    b.push(txt(tx + 6, ty + 13, m, { size: 8.4, weight: 700, fill: ACCENT }))
    b.push(txt(tx + 6, ty + 26, n, { size: 7.4, fill: DIM }))
    b.push(txt(tx + 62, ty + 20, s2, { size: 8.4 }))
    b.push(txt(tx + 170, ty + 20, f, { size: 7.8, fill: DIM }))
    ty += 34
  }

  ty += 24
  b.push(txt(tx, ty, 'ПРИМЕЧАНИЯ', { size: 10.5, weight: 700 }))
  const notes = [
    'Верх стены повторяет уклон кровли: 2,30 м у оси Д,',
    '3,17 м у оси Б (перепад 1 120 на 5 000 мм).',
    'Стойки 40×150 с шагом 600, обвязки 40×150,',
    'перемычки над проёмами — 150 мм.',
    'Дверь ДП-1 — двустворчатая террасная, порог на',
    'уровне чистого пола 0,000 (+0,040 на террасе —',
    'перепад закрывается порогом 40 мм).',
    'Окно ОТ-2 — в пол, с усиленной нижней обвязкой.',
    'Все деревянные элементы — антисептирование.',
  ]
  ty += 16
  for (const n of notes) {
    b.push(txt(tx, ty, n, { size: 8, fill: '#3d3a34' }))
    ty += 12.5
  }

  return sheet({
    num: 4,
    title: 'Стена по оси 2',
    subtitle: 'Развёртка 5 000 мм, шаг 600, наклонный верх по скату',
    scale: '1:50',
    body: b.join('\n'),
    note: 'Развёртка западного фасада со стороны террасы. Аналогично решаются остальные стены: наружная обшивка — имитация бруса 16, изнутри — вагонка.',
  })
}
