import { sheet, txt, line, rect, poly, path, circle, dimH, dimV, axisMark, callout, INK, DIM, ACCENT } from './svg.js'
import { project as P, roofArea, gable, pilePositions } from '../model/project.js'
import { mm } from './plan.js'

const S = 52
const OX = 136
const OY = 150
const X = (x) => OX + x * S
const Y = (z) => OY + z * S

const R = P.roof
const dm = P.dims

export function roofSheet() {
  const b = []
  const pairs = []
  for (let z = 0.25; z < R.zFront - 0.2; z += P.frames.spacing) pairs.push(z)

  b.push(txt(OX, 40, 'СТРОПИЛЬНАЯ СИСТЕМА. ПЛАН', { size: 19, weight: 700, letter: 1.2 }))
  b.push(
    txt(OX, 62, `Двускатная кровля ${R.pitch}°, конёк вдоль дома, терраса под той же кровлей`, {
      size: 10.5,
      fill: DIM,
    })
  )

  // ---- контур кровли
  b.push(
    rect(X(R.eaveX), Y(R.zBack), (R.eaveRightX - R.eaveX) * S, (R.zFront - R.zBack) * S, {
      fill: '#fbf7ef',
      stroke: INK,
      sw: 1.3,
    })
  )
  // тёплый блок и терраса
  b.push(rect(X(dm.x0), Y(0), dm.L * S, dm.depth * S, { fill: '#f4ece0', stroke: '#b9b2a5', sw: 0.8, dash: '5 3' }))
  b.push(
    poly(
      [
        [X(0), Y(4.5)],
        [X(dm.x0), Y(4.5)],
        [X(dm.x0), Y(dm.depth)],
        [X(dm.W), Y(dm.depth)],
        [X(dm.W), Y(dm.D)],
        [X(0), Y(dm.D)],
      ],
      { fill: '#f7eddd', stroke: '#b9b2a5', sw: 0.8, dash: '5 3' }
    )
  )

  // ---- стропильные пары
  for (const z of pairs) {
    b.push(line(X(R.eaveX), Y(z), X(R.eaveRightX), Y(z), { stroke: '#c08a55', w: 1.4 }))
    // консоль стропила за стену
    b.push(line(X(R.eaveX), Y(z) - 3, X(dm.x0), Y(z) - 3, { stroke: '#8a6035', w: 0.8 }))
    b.push(line(X(dm.W), Y(z) - 3, X(R.eaveRightX), Y(z) - 3, { stroke: '#8a6035', w: 0.8 }))
  }
  // ---- конёк и прогоны
  b.push(line(X(R.ridgeX), Y(R.zBack), X(R.ridgeX), Y(R.zFront), { stroke: '#3d3a34', w: 4 }))
  b.push(txt(X(R.ridgeX) - 8, Y(R.zBack + 1.4), 'КОНЁК +5,345', { size: 8, fill: '#3d3a34', weight: 700, rotate: -90 }))
  for (const x of [dm.x0 + 0.1, dm.W - 0.1]) {
    b.push(line(X(x), Y(0), X(x), Y(dm.depth), { stroke: '#3d3a34', w: 2.4 }))
  }
  // ---- обрешётка (фрагмент)
  for (let z = R.zBack + 0.3; z < R.zFront; z += 0.35) {
    b.push(line(X(R.eaveX) + 4, Y(z), X(R.ridgeX) - 4, Y(z), { stroke: '#e0cbac', w: 0.5 }))
    b.push(line(X(R.ridgeX) + 4, Y(z), X(R.eaveRightX) - 4, Y(z), { stroke: '#e0cbac', w: 0.5 }))
  }
  // ---- карнизные свесы
  for (const [x, ax] of [[R.eaveX, R.eaveX], [R.eaveRightX, R.eaveRightX]]) {
    b.push(line(X(x), Y(R.zBack), X(x), Y(R.zFront), { stroke: '#8a6035', w: 2 }))
  }
  b.push(line(X(R.eaveX), Y(R.zBack), X(R.eaveRightX), Y(R.zBack), { stroke: '#8a6035', w: 2 }))
  b.push(line(X(R.eaveX), Y(R.zFront), X(R.eaveRightX), Y(R.zFront), { stroke: '#8a6035', w: 2 }))

  // ---- дымоход
  b.push(circle(X(4.05), Y(0.42), 9, { fill: '#4a4a4a', stroke: INK, sw: 1 }))
  b.push(txt(X(4.05) + 13, Y(0.42) + 3, '⌀115', { size: 7.5, fill: DIM }))
  b.push(circle(X(8.9), Y(5.6), 6, { fill: '#7b8288', stroke: INK, sw: 0.9 }))

  // ---- оси
  for (const [x, l] of [[dm.x0, '2'], [4.5, '3'], [R.ridgeX, '4'], [7, '5'], [dm.W, '6']]) {
    b.push(line(X(x), Y(-0.72), X(x), Y(dm.D + 0.2), { stroke: '#c2bbae', w: 0.8, dash: '12 4 3 4' }))
    b.push(axisMark(X(x), Y(-0.92), l))
  }
  for (const [z, l] of [[0, 'А'], [dm.depth, 'Г'], [dm.D, 'Д']]) {
    b.push(line(X(-0.85), Y(z), X(dm.W + 0.35), Y(z), { stroke: '#c2bbae', w: 0.8, dash: '12 4 3 4' }))
    b.push(axisMark(X(-1.15), Y(z), l))
  }

  // ---- размеры
  b.push(dimH(X(R.eaveX), X(dm.x0), Y(dm.D) + 40, mm(dm.x0 - R.eaveX), { size: 8 }))
  b.push(dimH(X(dm.x0), X(dm.W), Y(dm.D) + 40, mm(dm.L), { size: 8 }))
  b.push(dimH(X(dm.W), X(R.eaveRightX), Y(dm.D) + 40, mm(R.eaveRightX - dm.W), { size: 8 }))
  b.push(dimH(X(R.eaveX), X(R.eaveRightX), Y(dm.D) + 74, mm(R.eaveRightX - R.eaveX), { size: 9.5 }))
  b.push(dimV(Y(R.zBack), Y(0), X(R.eaveX) - 34, mm(-R.zBack), { size: 8 }))
  b.push(dimV(Y(0), Y(dm.D), X(R.eaveX) - 34, mm(dm.D), { size: 8 }))
  b.push(dimV(Y(dm.D), Y(R.zFront), X(R.eaveX) - 34, mm(R.zFront - dm.D), { size: 8 }))
  b.push(dimV(Y(R.zBack), Y(R.zFront), X(R.eaveX) - 68, mm(R.zFront - R.zBack), { size: 9.5 }))

  // ---- выноски
  b.push(callout(X(3.0), Y(5.0), 1, X(2.2), Y(6.4)))
  b.push(callout(X(5.0), Y(2.0), 2, X(5.9), Y(1.4)))
  b.push(callout(X(9.0), Y(8.0), 3, X(9.9), Y(9.0)))

  // ---- правая колонка
  const tx = 700
  let ty = 108
  b.push(txt(tx, ty, 'СПЕЦИФИКАЦИЯ КРОВЛИ', { size: 10.5, weight: 700, letter: 0.4 }))
  ty += 12
  b.push(rect(tx, ty, 500, 24, { fill: '#f1ece2', stroke: INK, sw: 1 }))
  b.push(txt(tx + 8, ty + 16, 'Наименование', { size: 9, weight: 700 }))
  b.push(txt(tx + 492, ty + 16, 'Кол-во', { size: 9, weight: 700, anchor: 'end' }))
  ty += 24
  const rows = [
    ['Стропило 45×195', `L = ${R.slopeLen.toFixed(2).replace('.', ',')} м`, `${pairs.length * 2} шт`],
    ['Коньковый прогон 45×245', `L = ${(R.zFront - R.zBack).toFixed(1).replace('.', ',')} м`, '1 шт'],
    ['Подстропильная балка 45×195', 'по осям 2 и 6', '2 шт'],
    ['Стойка 120×120', 'под коньком, шаг 2,4 м', `${Math.ceil((R.zFront - R.zBack) / 2.4) + 1} шт`],
    ['Контробрешётка 50×50', 'по стропилам', `${Math.round(pairs.length * 2 * R.slopeLen)} м`],
    ['Обрешётка 25×100', 'шаг 350', `${Math.round(roofArea.total / 0.35)} м`],
    ['Гидроизоляция', 'Изоспан АМ, 2 слоя', `${Math.ceil(roofArea.total * 1.15)} м²`],
    ['Фальц RAL 7021', '0,5 мм, полиэстер', `${Math.ceil(roofArea.total * 1.12)} м²`],
    ['Саморезы / кляммеры', 'фальцевое крепление', `${Math.round(roofArea.total * 12)} шт`],
  ]
  for (const [n, spec, q] of rows) {
    b.push(rect(tx, ty, 500, 26, { fill: '#fff', stroke: '#ded7c9', sw: 0.7 }))
    b.push(txt(tx + 8, ty + 12, n, { size: 9, weight: 500 }))
    b.push(txt(tx + 8, ty + 22, spec, { size: 7.5, fill: DIM }))
    b.push(txt(tx + 492, ty + 17, q, { size: 9, anchor: 'end', weight: 600 }))
    ty += 26
  }

  ty += 22
  b.push(txt(tx, ty, 'ПОКАЗАТЕЛИ', { size: 10, weight: 700, letter: 0.4 }))
  ty += 16
  const stats = [
    ['Площадь кровли', `${roofArea.total.toFixed(1).replace('.', ',')} м²`],
    ['Уклон', `${R.pitch}°`],
    ['Стропило', `${R.slopeLen.toFixed(2).replace('.', ',')} м, шаг ${mm(P.frames.spacing)}`],
    ['Высота конька', `+${R.ridgeY.toFixed(3).replace('.', ',')}`],
    ['Высота фронтона', `${gable.height.toFixed(2).replace('.', ',')} м`],
    ['Свес карниза / торца', `${mm(R.eaveOverhang)} / ${mm(R.overhang)}`],
    ['Площадь фронтонов', `${gable.area.toFixed(1).replace('.', ',')} м²`],
  ]
  for (const [k, v] of stats) {
    b.push(txt(tx, ty, k, { size: 8.6, fill: DIM }))
    b.push(txt(tx + 180, ty, v, { size: 8.8, weight: 600 }))
    ty += 15
  }

  // ---- деталь стропила
  b.push(txt(tx, 526, 'ДЕТАЛЬ СТРОПИЛА, 1:50', { size: 10, weight: 700, letter: 0.4 }))
  const dx0 = tx + 26
  const dy0 = 692
  const k = 60
  const pict = (x, y) => [dx0 + x * k, dy0 - y * k]
  const tan = Math.tan((R.pitch * Math.PI) / 180)
  const rise = R.slopeRun * tan
  // стропило
  b.push(line(...pict(0, 0), ...pict(R.slopeRun, rise), { stroke: '#c08a55', w: 5 }))
  b.push(line(...pict(0, -0.195), ...pict(R.slopeRun, rise - 0.195), { stroke: '#8a6035', w: 1 }))
  // нижняя обвязка и стойка
  b.push(line(...pict(-0.3, -0.42), ...pict(R.slopeRun + 0.1, -0.42), { stroke: '#3d3a34', w: 2 }))
  b.push(line(...pict(0, -0.42), ...pict(0, 0), { stroke: '#3d3a34', w: 2 }))
  // угол
  b.push(path(`M ${pict(R.slopeRun - 0.7, rise - 0.7 * tan)[0]} ${pict(R.slopeRun - 0.7, rise - 0.7 * tan)[1]} A 42 42 0 0 0 ${pict(R.slopeRun - 0.7, rise - 0.7 * tan - 0.42)[0]} ${pict(R.slopeRun - 0.7, rise - 0.7 * tan - 0.42)[1]}`, { stroke: ACCENT, sw: 0.9 }))
  b.push(txt(...pict(2.2, rise + 0.18), 'стропило 45×195', { size: 8, fill: ACCENT, weight: 600 }))
  b.push(txt(...pict(0.15, -0.68), `пролёт ${R.slopeRun.toFixed(2).replace('.', ',')} м`, { size: 7.5, fill: DIM }))
  b.push(txt(...pict(R.slopeRun - 1.9, 0.42), `уклон ${R.pitch}°`, { size: 8.5, fill: ACCENT, weight: 600 }))
  b.push(txt(tx, 740, `стропило L = ${R.slopeLen.toFixed(2).replace('.', ',')} м, шаг ${mm(P.frames.spacing)}`, { size: 8, fill: DIM }))
  b.push(txt(tx, 753, 'коньковый прогон 45×245, подстропильные балки по осям 2 и 6', { size: 8, fill: DIM }))

  return sheet({
    num: 5,
    title: 'Стропильная система',
    subtitle: 'План кровли, стропила, прогоны, обрешётка',
    scale: '1:50',
    body: b.join('\n'),
    note: `Стропильные пары с шагом ${mm(P.frames.spacing)} опираются на коньковый прогон и подстропильные балки. Кровля — фальц RAL 7021 по обрешётке 25×100 с шагом 350.`,
  })
}
