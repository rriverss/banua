import { sheet, txt, line, rect, poly, circle, dimH, dimV, callout, INK, DIM, ACCENT } from './svg.js'
import { project as P, roofY, terraceRoofY } from '../model/project.js'
import { mm } from './plan.js'

const S = 90
const OX = 165
const OY = 715
const X = (z) => OX + z * S
const Y = (y) => OY - y * S

const wood = { fill: 'url(#wood)', stroke: '#7d5c38', sw: 0.8 }
const insul = { fill: 'url(#insul)', stroke: '#c9a35b', sw: 0.8 }

function level(x, y, text) {
  const yy = Y(y)
  return (
    line(x, yy, x - 34, yy, { stroke: ACCENT, w: 1 }) +
    poly(
      [
        [x, yy],
        [x - 7, yy - 4],
        [x - 7, yy + 4],
      ],
      { fill: ACCENT, stroke: ACCENT, sw: 0 }
    ) +
    txt(x - 42, yy + 3.5, text, { size: 9.5, fill: ACCENT, weight: 600, anchor: 'end' })
  )
}

export function sectionSheet() {
  const b = []
  b.push(txt(OX, 58, 'РАЗРЕЗ 1–1', { size: 19, weight: 700, letter: 1.2 }))
  b.push(txt(OX, 82, 'По парной, мойке и террасе. Отметки — от уровня чистого пола, размеры в мм', { size: 10.5, fill: DIM }))

  // грунт
  const gy = Y(P.dims.groundY)
  b.push(rect(40, gy, 940, 877 - 60 - gy, { fill: 'url(#soil)', stroke: 'none', opacity: 0.45 }))
  b.push(line(40, gy, 980, gy, { stroke: '#6b665c', w: 1.6 }))
  
  // сваи
  for (const z of P.piles.zs) {
    const x = X(z)
    const w = 0.108 * S
    b.push(rect(x - w / 2, Y(P.dims.pileTop), w, (P.dims.pileTop + 1.05) * S, { fill: 'url(#concrete)', stroke: '#7d7a72', sw: 1 }))
    b.push(poly([[x - w / 2, Y(-1.05)], [x + w / 2, Y(-1.05)], [x, Y(-1.2)]], { fill: 'url(#concrete)', stroke: '#7d7a72', sw: 1 }))
    b.push(rect(x - 0.1 * S, Y(-0.335), 0.2 * S, 0.012 * S, { fill: '#8d8a82', stroke: '#5f5c55', sw: 0.6 }))
  }

  // ростверк
  for (const z of P.piles.zs) {
    b.push(rect(X(z - 0.075), Y(-0.195), 0.15 * S, 0.16 * S, wood))
  }
  // лаги, настил
  b.push(rect(X(-0.1), Y(0), 4.7 * S, 0.195 * S, wood))
  b.push(rect(X(-0.1), Y(0.018), 4.7 * S, 0.018 * S, { fill: '#e3cb9f', stroke: '#a98f62', sw: 0.7 }))
  b.push(rect(X(4.6), Y(0), 2.4 * S, 0.195 * S, wood))
  b.push(rect(X(4.6), Y(0.028), 2.45 * S, 0.028 * S, { fill: '#b58359', stroke: '#7d5533', sw: 0.7 }))

  // наружная стена А
  b.push(rect(X(-0.1), Y(2.7), 0.2 * S, 2.7 * S, insul))
  b.push(rect(X(-0.12), Y(2.7), 0.02 * S, 2.7 * S, { fill: '#7f5a35' }))
  b.push(rect(X(0.1), Y(2.7), 0.016 * S, 2.7 * S, { fill: '#f3e0bd' }))
  // стена Б с окном мойки (1,4…2,1)
  for (const [y0, y1] of [[0, 1.4], [2.1, 2.7]]) {
    b.push(rect(X(4.4), Y(y1), 0.2 * S, (y1 - y0) * S, insul))
  }
  b.push(rect(X(4.38), Y(2.7), 0.02 * S, 2.7 * S, { fill: '#7f5a35' }))
  b.push(rect(X(4.6), Y(2.7), 0.016 * S, 2.7 * S, { fill: '#f3e0bd' }))
  // окно
  b.push(rect(X(4.4), Y(2.1), 0.2 * S, 0.7 * S, { fill: '#eef4f6', stroke: '#7d8a90', sw: 1 }))
  b.push(line(X(4.5), Y(1.4), X(4.5), Y(2.1), { stroke: '#7d8a90', w: 0.9 }))

  // перегородка
  b.push(rect(X(2.15), Y(2.5), 0.1 * S, 2.5 * S, insul))
  b.push(rect(X(2.13), Y(2.5), 0.016 * S, 2.5 * S, { fill: '#f0dcb8' }))
  b.push(rect(X(2.25), Y(2.5), 0.016 * S, 2.5 * S, { fill: '#f0dcb8' }))

  // потолок
  b.push(rect(X(0.1), Y(2.5), 4.3 * S, 0.016 * S, { fill: '#f0dcb8', stroke: '#b99a6a', sw: 0.5 }))
  b.push(rect(X(0.1), Y(2.695), 4.3 * S, 0.195 * S, wood))
  b.push(rect(X(0.1), Y(2.895), 4.3 * S, 0.2 * S, { ...insul, opacity: 0.95 }))

  // кровля
  const ridge = { z: P.roof.ridgeZ, y: P.roof.ridgeY }
  const eaves = [
    { z: P.roof.eaveZ, y: roofY(P.roof.eaveZ) },
    { z: P.roof.ridgeZ * 2 + P.roof.overhang, y: roofY(P.roof.ridgeZ * 2 + P.roof.overhang) },
  ]
  for (const e of eaves) {
    const dz = e.z - ridge.z
    const dy = e.y - ridge.y
    const len = Math.hypot(dz, dy)
    const nz = -dy / len
    const ny = dz / len
    const t = 0.195
    b.push(
      poly(
        [
          [ridge.z, ridge.y],
          [e.z, e.y],
          [e.z + nz * t, e.y + ny * t],
          [ridge.z + nz * t, ridge.y + ny * t],
        ].map(([z, y]) => [X(z), Y(y)]),
        wood
      )
    )
    b.push(
      poly(
        [
          [ridge.z + nz * 0.05, ridge.y + ny * 0.05],
          [e.z + nz * 0.05, e.y + ny * 0.05],
          [e.z + nz * 0.075, e.y + ny * 0.075],
          [ridge.z + nz * 0.075, ridge.y + ny * 0.075],
        ].map(([z, y]) => [X(z), Y(y)]),
        { fill: '#8b4038', stroke: '#5d2b26', sw: 0.8 }
      )
    )
  }
  b.push(circle(X(ridge.z), Y(ridge.y + 0.03), 5, { fill: '#5d2b26' }))

  // кровля террасы
  const t0 = { z: P.terraceRoof.z0, y: P.terraceRoof.y0 }
  const t1 = { z: P.terraceRoof.z1, y: terraceRoofY(P.terraceRoof.z1) }
  b.push(
    poly(
      [
        [t0.z, t0.y],
        [t1.z, t1.y],
        [t1.z, t1.y - 0.145],
        [t0.z, t0.y - 0.145],
      ].map(([z, y]) => [X(z), Y(y)]),
      wood
    )
  )
  b.push(
    poly(
      [
        [t0.z, t0.y + 0.01],
        [t1.z, t1.y + 0.01],
        [t1.z, t1.y + 0.035],
        [t0.z, t0.y + 0.035],
      ].map(([z, y]) => [X(z), Y(y)]),
      { fill: '#8b4038', stroke: '#5d2b26', sw: 0.8 }
    )
  )
  // стойка и ограждение террасы
  const postTop = terraceRoofY(6.85) - 0.145
  b.push(rect(X(6.8), Y(postTop), 0.1 * S, postTop * S, { fill: '#d9a568', stroke: '#8a6a44', sw: 0.8 }))
  b.push(rect(X(6.9), Y(1.02), 0.04 * S, 1.02 * S, { fill: 'none', stroke: '#8a6a44', sw: 0.8 }))

  // отметки
  b.push(level(X(-0.4), 0, '0,000'))
  b.push(level(X(-0.4), 2.5, '2,500'))
  b.push(level(X(-0.4), 4.26, '4,260'))
  b.push(level(X(-0.4), -0.345, '−0,345'))
  b.push(rect(X(0.02), Y(-0.62) - 6, 86, 14, { fill: '#fdfbf6', stroke: 'none', sw: 0, opacity: 0.92 }))
  b.push(txt(X(0.05), Y(-0.62) + 4, 'грунт −0,550', { size: 8, fill: DIM }))

  // подписи помещений
  b.push(txt(X(1.05), Y(1.55), 'ПАРНАЯ', { size: 9.5, anchor: 'middle', fill: DIM, letter: 1.5 }))
  b.push(txt(X(3.25), Y(1.55), 'МОЙКА', { size: 9.5, anchor: 'middle', fill: DIM, letter: 1.5 }))
  b.push(txt(X(5.75), Y(1.3), 'ТЕРРАСА', { size: 9.5, anchor: 'middle', fill: DIM, letter: 1.5 }))

  // размеры
  b.push(dimH(X(0), X(4.5), Y(4.95), mm(4.5)))
  b.push(dimH(X(4.5), X(7), Y(4.95), mm(2.5)))
  b.push(dimH(X(0), X(7), Y(5.35), mm(7)))

  // выноски узлов
  b.push(callout(X(-0.1), Y(0.4), 2, X(-0.95), Y(1.15)))
  b.push(callout(X(-0.5), Y(roofY(-0.5)), 3, X(-1.15), Y(3.55)))
  b.push(callout(X(2.25), Y(4.32), 4, X(1.55), Y(4.42)))
  b.push(callout(X(4.6), Y(2.95), 5, X(5.2), Y(3.55)))
  b.push(callout(X(6.85), Y(0.25), 1, X(6.45), Y(0.65)))

  // правая колонка
  const tx = 1000
  let ty = 118
  b.push(txt(tx, ty, 'СЛОИ КОНСТРУКЦИЙ', { size: 10.5, weight: 700 }))
  const block = (title, rows) => {
    ty += 20
    b.push(txt(tx, ty, title, { size: 9, weight: 700, fill: ACCENT, letter: 0.4 }))
    ty += 4
    for (const r of rows) {
      ty += 12.5
      b.push(txt(tx, ty, '· ' + r, { size: 8.2, fill: '#3d3a34' }))
    }
  }
  block('СТЕНА (изнутри → наружу)', [
    'вагонка 16',
    'вентзазор 30',
    'пароизоляция',
    'каркас 195 + вата',
    'ОСП-3 9',
    'ветрозащита',
    'вентзазор 30',
    'имитация бруса 20',
  ])
  block('ПОЛ', ['покрытие 18–35', 'ОСП-3 18', 'лага 195 + вата', 'ветрозащита', 'продув 100'])
  block('ПОТОЛОК', ['вагонка 16', 'пароизоляция', 'балка 195 + вата', 'вата 100 доп.'])
  block('КРОВЛЯ (снизу вверх)', ['стропило 195', 'контробрешётка 50', 'гидроизоляция', 'обрешётка 25×100', 'металлочерепица'])

  ty += 24
  b.push(txt(tx, ty, 'ПОКАЗАТЕЛИ', { size: 9, weight: 700, fill: ACCENT, letter: 0.4 }))
  ty += 14
  b.push(txt(tx, ty, 'Конёк +4,260 · потолок 2,500', { size: 8.2, fill: '#3d3a34' }))
  ty += 12
  b.push(txt(tx, ty, 'Уклон кровли 30°, терраса 15°', { size: 8.2, fill: '#3d3a34' }))
  ty += 12
  b.push(txt(tx, ty, 'Свесы 500 / фронтонные 300', { size: 8.2, fill: '#3d3a34' }))
  ty += 12
  b.push(txt(tx, ty, 'Окно мойки 700×700, h=1400', { size: 8.2, fill: '#3d3a34' }))

    return sheet({
    title: 'Разрез 1–1',
    subtitle: 'Конструкция стены, пола и кровли. Узлы 1–5 — см. лист «Узлы»',
    scale: '1:50',
    body: b.join('\n'),
    note: 'Сечение элементов принято для снегового района III (180 кг/м²). Уточнить у конструктора при изменении пролётов.',
  })
}
