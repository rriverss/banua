import { sheet, txt, line, rect, poly, circle, dimH, dimV, axisMark, callout, INK, DIM, ACCENT } from './svg.js'
import { project as P, roofArea, gable } from '../model/project.js'
import { mm } from './plan.js'

const S = 62
const OX = 250
const OY = 175
const X = (x) => OX + x * S
const Y = (z) => OY + z * S

const R = P.roof
const L = P.dims.L
const D = P.dims.D
const TER = P.dims.terrace
const zF = R.zFront
const zB = R.zBack

/** стропило в плане: от конька до карниза */
function rafter(z) {
  return line(X(R.ridgeX), Y(z), X(R.eaveX), Y(z), { stroke: '#a9764a', w: 2 }) +
    line(X(R.ridgeX), Y(z), X(R.eaveRightX), Y(z), { stroke: '#a9764a', w: 2 })
}

export function roofSheet() {
  const b = []
  b.push(txt(OX, 58, 'СТРОПИЛЬНАЯ СИСТЕМА. ПЛАН', { size: 19, weight: 700, letter: 1.2 }))
  b.push(txt(OX, 82, `Двускатная кровля ${R.pitch}°, конёк вдоль дома, терраса под той же крышей`, { size: 11, fill: DIM }))

  // ---- контур кровли
  b.push(rect(X(R.eaveX), Y(zB), (L + 2 * R.overhang) * S, (zF - zB) * S, { fill: '#f4efe4', stroke: INK, sw: 1.6 }))

  // ---- контур дома и террасы (пунктир — под кровлей)
  b.push(rect(X(0), Y(0), L * S, D * S, { fill: 'none', stroke: '#8d887e', sw: 1.2, dash: '8 5' }))
  b.push(line(X(0), Y(D), X(L), Y(D), { stroke: '#8d887e', w: 1.2, dash: '8 5' }))
  b.push(rect(X(0), Y(D), L * S, TER * S, { fill: '#f7eddd', stroke: 'none', sw: 0 }))
  for (let x = 0.2; x < L - 0.1; x += 0.145) {
    b.push(line(X(x), Y(D), X(x), Y(D + TER), { stroke: '#e0cbac', w: 0.5 }))
  }

  b.push(line(X(0), Y(D), X(L), Y(D), { stroke: '#20242a', w: 1.6 }))
  b.push(txt(X(0.25), Y(D) - 6, 'витраж 6,0 м', { size: 7.5, fill: '#20242a' }))

  // ---- ограждение террасы
  b.push(line(X(0.14), Y(D + 0.2), X(0.14), Y(zF - 0.14), { stroke: '#8a6a44', w: 2 }))
  b.push(line(X(L - 0.14), Y(D + 0.2), X(L - 0.14), Y(zF - 0.14), { stroke: '#8a6a44', w: 2 }))
  b.push(line(X(0.14), Y(zF - 0.14), X(1.4), Y(zF - 0.14), { stroke: '#8a6a44', w: 2 }))
  b.push(line(X(4.6), Y(zF - 0.14), X(L - 0.14), Y(zF - 0.14), { stroke: '#8a6a44', w: 2 }))

  // ---- стропила
  for (let z = 0.25; z < zF - 0.2; z += P.frames.spacing) b.push(rafter(z))

  // ---- конёк
  b.push(line(X(R.ridgeX), Y(zB), X(R.ridgeX), Y(zF), { stroke: '#2f3438', w: 4.5 }))
  b.push(txt(X(R.ridgeX) + 6, Y(zB + 1.2), 'КОНЁК · прогон 45×245', { size: 8, fill: '#2f3438', weight: 600, rotate: 90, }))

  // ---- подстропильные балки и стойки над террасой
  for (const x of [0.08, L - 0.08]) {
    b.push(line(X(x), Y(D), X(x), Y(zF - 0.2), { stroke: '#8a6a44', w: 2.4 }))
    b.push(rect(X(x) - 4, Y(6.85) - 4, 8, 8, { fill: '#d9a568', stroke: '#8a6a44', sw: 0.8 }))
  }

  // ---- торцевые свесы и капельник
  for (const z of [zB, zF]) {
    b.push(line(X(R.eaveX), Y(z), X(R.eaveRightX), Y(z), { stroke: '#2f3438', w: 2.4 }))
  }

  // ---- ступени и вход
  for (let i = 0; i < 3; i++) {
    b.push(rect(X(L / 2 - 1.6), Y(D + TER + 0.1 + i * 0.34), 3.2 * S, 0.34 * S, { fill: i % 2 ? '#f1e2ca' : '#e9d7bb', stroke: '#a98f62', sw: 0.7 }))
  }

  // ---- дымоход
  b.push(circle(X(5.35), Y(0.5), 7, { fill: '#3a3f43', stroke: '#20242a' }))
  b.push(txt(X(5.35) - 12, Y(0.5) + 12, '⌀115', { size: 7.5, fill: DIM, anchor: 'end' }))

  // ---- оси
  for (const x of [0, 3, 6]) {
    b.push(line(X(x), Y(zB) - 26, X(x), Y(zF) + 26, { stroke: '#b9b2a5', w: 0.8, dash: '14 4 3 4' }))
    b.push(axisMark(X(x), Y(zB) - 48, String(x === 0 ? 1 : x === 3 ? 2 : 3)))
  }
  for (const [z, l] of [[0, 'А'], [4.5, 'В'], [7, 'Г']]) {
    b.push(line(X(R.eaveX) - 26, Y(z), X(R.eaveRightX) + 26, Y(z), { stroke: '#b9b2a5', w: 0.8, dash: '14 4 3 4' }))
    b.push(axisMark(X(R.eaveX) - 48, Y(z), l))
  }

  // ---- размеры
  b.push(dimH(X(R.eaveX), X(R.eaveRightX), Y(zF) + 52, mm(L + 2 * R.overhang)))
  b.push(dimH(X(0), X(L), Y(zF) + 86, mm(L)))
  b.push(dimV(Y(zB), Y(zF), X(R.eaveX) - 86, mm(zF - zB)))
  b.push(dimV(Y(0), Y(D), X(R.eaveRightX) + 42, mm(D)))
  b.push(dimV(Y(D), Y(D + TER), X(R.eaveRightX) + 42, mm(TER)))

  // стропила: 12 пар через 600 по Z
  b.push(txt(X(0.3), Y(D + 0.42), '12 пар стропил через 600 по Z', { size: 8, fill: DIM }))

  // ---- выноски
  b.push(callout(X(R.ridgeX + 0.4), Y(2.6), 4, X(R.ridgeX + 1.5), Y(1.5)))
  b.push(callout(X(L - 0.2), Y(6.55), 3, X(L - 0.05), Y(7.72)))

  // ---- спецификация
  const tx = 800
  b.push(txt(tx, 110, 'СПЕЦИФИКАЦИЯ КРОВЛИ', { size: 11, weight: 700, letter: 0.6 }))
  b.push(rect(tx, 122, 400, 22, { fill: '#f3ede1', stroke: '#cfc7b8', sw: 0.9 }))
  b.push(txt(tx + 8, 137, 'Наименование', { size: 8.5, weight: 700 }))
  b.push(txt(tx + 392, 137, 'Кол-во', { size: 8.5, weight: 700, anchor: 'end' }))
  const spec = [
    ['Стропило 45×195, L=3 750', '24 шт'],
    ['Коньковый прогон 45×245', '7,7 м'],
    ['Подстропильная балка 45×195', '2 × 2,9 м'],
    ['Стойка террасы 100×100', '2 шт'],
    ['Контробрешётка 50×50', '≈ 54 м'],
    ['Обрешётка 25×100, шаг 350', '≈ 168 м'],
    ['Гидроизоляция', '62 м²'],
    ['Кровля фальц RAL 7021', `${Math.round(roofArea.total)} м²`],
    ['Саморезы / кляммеры', '≈ 520 шт'],
  ]
  spec.forEach(([n, q], i) => {
    const y = 144 + i * 21
    b.push(rect(tx, y, 400, 21, { fill: i % 2 ? '#fbf9f4' : '#fff', stroke: '#e2dbcd', sw: 0.6 }))
    b.push(txt(tx + 8, y + 14, n, { size: 8.5 }))
    b.push(txt(tx + 392, y + 14, q, { size: 8.5, weight: 600, anchor: 'end' }))
  })

  b.push(txt(tx, 366, 'ПОКАЗАТЕЛИ', { size: 10, weight: 700, letter: 0.6 }))
  const rows = [
    ['Площадь кровли', `${roofArea.total.toFixed(1).replace('.', ',')} м²`],
    ['Уклон', `${R.pitch}°`],
    ['Высота конька', `+${R.ridgeY.toFixed(3).replace('.', ',')}`],
    ['Высота фронтона', `${gable.height.toFixed(2).replace('.', ',')} м`],
    ['Свес карниза / фронтона', '400 / 350 мм'],
  ]
  rows.forEach(([k, v], i) => {
    b.push(txt(tx, 388 + i * 17, k, { size: 8.5, fill: DIM }))
    b.push(txt(tx + 400, 388 + i * 17, v, { size: 8.5, weight: 600, anchor: 'end' }))
  })

  // ---- деталь стропила
  const dx = 800
  const dyTop = 520
  const kat = 140
  b.push(txt(dx, dyTop - 12, 'ДЕТАЛЬ СТРОПИЛА', { size: 11, weight: 700 }))
  b.push(
    poly(
      [
        [dx, dyTop + kat],
        [dx + kat, dyTop + kat],
        [dx + kat, dyTop],
      ],
      { fill: '#f6efe2', stroke: '#8a6a44', sw: 1.2 }
    )
  )
  b.push(txt(dx + kat / 2, dyTop + kat + 16, '3 400', { size: 8, anchor: 'middle', fill: DIM }))
  b.push(txt(dx + kat + 8, dyTop + kat / 2, '1 586', { size: 8, fill: DIM }))
  b.push(txt(dx + 26, dyTop + kat - 16, `${R.pitch}°`, { size: 9, fill: ACCENT, weight: 600 }))
  b.push(txt(dx, dyTop + kat + 34, 'стропило 45×195, контробрешётка 50, обрешётка 25×100', { size: 7.5, fill: DIM }))
  b.push(txt(dx, dyTop + kat + 46, 'свес 400, лобовая доска 25×150, капельник', { size: 7.5, fill: DIM }))

  return sheet({
    num: 6,
    title: 'Стропильная система',
    subtitle: `Уклон ${R.pitch}°, стропила 45×195 через 600, конёк вдоль дома`,
    scale: '1:50',
    body: b.join(''),
    note: 'Стропильные пары опираются на коньковый прогон и подстропильные балки; над террасой балки стоят на стойках 100×100. Перед монтажом уточните снеговой район.',
  })
}
