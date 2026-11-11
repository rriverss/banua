import { sheet, txt, line, rect, poly, circle, dimH, dimV, axisMark, callout, INK, DIM, ACCENT } from './svg.js'
import { project as P, roofArea } from '../model/project.js'
import { mm } from './plan.js'

const S = 64
const OX = 250
const OY = 205
const X = (x) => OX + x * S
const Y = (z) => OY + z * S

const R = P.roof
const TR = P.terraceRoof

export function roofSheet() {
  const b = []
  b.push(txt(OX, 58, 'СТРОПИЛЬНАЯ СИСТЕМА. ПЛАН', { size: 19, weight: 700, letter: 1.2 }))
  b.push(txt(OX, 82, 'Двускатная кровля 30° над блоком и односкатная 15° над террасой', { size: 10.5, fill: DIM }))

  // контуры
  b.push(
    rect(X(-R.gableOverhang), Y(-R.overhang), (6 + 2 * R.gableOverhang) * S, (4.5 + 2 * R.overhang) * S, {
      fill: '#f7f1e6',
      stroke: INK,
      sw: 1.1,
    })
  )
  b.push(
    rect(X(-TR.overhangX), Y(TR.z0), (6 + 2 * TR.overhangX) * S, (TR.z1 - TR.z0) * S, {
      fill: '#f3ede2',
      stroke: INK,
      sw: 1,
      dash: '6 3',
    })
  )

  // стропила
  for (let x = 0; x <= 6.001; x += 0.6) {
    for (const s of [-1, 1]) {
      const zEave = R.ridgeZ + s * (R.ridgeZ + R.overhang)
      b.push(line(X(x), Y(R.ridgeZ), X(x), Y(zEave), { stroke: '#a9764a', w: 2.2 }))
    }
    b.push(line(X(x), Y(TR.z0), X(x), Y(TR.z1), { stroke: '#a9764a', w: 1.6 }))
  }

  // конёк и карнизы
  b.push(line(X(-R.gableOverhang), Y(R.ridgeZ), X(6 + R.gableOverhang), Y(R.ridgeZ), { stroke: '#7d3a32', w: 4.5 }))
  b.push(txt(X(1.35), Y(R.ridgeZ) - 9, 'КОНЁК 6 600', { size: 8.5, anchor: 'middle', fill: '#7d3a32', weight: 600, letter: 1 }))
  b.push(line(X(-R.gableOverhang), Y(-R.overhang), X(6 + R.gableOverhang), Y(-R.overhang), { stroke: '#5d2b26', w: 1.8 }))
  b.push(line(X(-R.gableOverhang), Y(5.0), X(6 + R.gableOverhang), Y(5.0), { stroke: '#5d2b26', w: 1.8 }))
  b.push(line(X(-TR.overhangX), Y(TR.z1), X(6 + TR.overhangX), Y(TR.z1), { stroke: '#5d2b26', w: 1.8 }))

  // оси
  for (const a of [0, 3, 6]) {
    b.push(line(X(a), Y(-0.5), X(a), Y(7.45), { stroke: '#cfc8bb', w: 0.6, dash: '9 4' }))
    b.push(axisMark(X(a), Y(-0.95), String(a === 0 ? 1 : a === 3 ? 2 : 3)))
  }
  b.push(axisMark(X(-1.5), Y(0), 'А'))
  b.push(axisMark(X(-1.5), Y(2.25), 'Б'))
  b.push(axisMark(X(-1.5), Y(4.5), 'В'))

  // размеры
  for (let x = 0; x < 6; x += 0.6) {
    b.push(dimH(X(x), X(x + 0.6), Y(7.35) + 28, '600', { size: 7 }))
  }
  b.push(dimH(X(-R.gableOverhang), X(6 + R.gableOverhang), Y(7.35) + 56, '6 600'))
  b.push(dimV(Y(4.5), Y(TR.z1), X(-0.65) - 26, '2 850'))
  b.push(txt(X(1.0), Y(1.45), 'полската 2 750 · уклон 30°', { size: 8, fill: ACCENT }))
  b.push(txt(X(1.0), Y(6.55), 'полската 2 850 · уклон 15°', { size: 8, fill: ACCENT }))

  b.push(txt(X(3), Y(1.1), 'ОСНОВНОЙ СКАТ · 30°', { size: 10, anchor: 'middle', fill: DIM, letter: 1.5 }))
  b.push(txt(X(3), Y(6.15), 'ТЕРРАСА · 15°', { size: 9, anchor: 'middle', fill: DIM, letter: 1.2 }))
  b.push(txt(X(6.55), Y(-R.overhang) + 4, 'свес 500', { size: 8, fill: ACCENT }))
  b.push(txt(X(6.55), Y(5.0) + 4, 'свес 500', { size: 8, fill: ACCENT }))
  b.push(txt(X(6.55), Y(TR.z1) + 4, 'свес 350', { size: 8, fill: ACCENT }))

  b.push(callout(X(4.55), Y(2.25), 4, X(5.45), Y(1.35)))
  b.push(callout(X(6.3), Y(4.8), 3, X(6.95), Y(5.3)))

  // таблица
  const tx = 720
  let ty = 118
  b.push(txt(tx, ty, 'СПЕЦИФИКАЦИЯ КРОВЛИ', { size: 10.5, weight: 700 }))
  ty += 10
  const rows = [
    ['Стропило 45×195, L=3 175', '22 шт'],
    ['Стропило террасы 45×145, L=2 950', '11 шт'],
    ['Коньковый прогон 45×195', '6,6 м'],
    ['Контробрешётка 50×50', '≈ 90 м'],
    ['Обрешётка 25×100, шаг 350', '≈ 190 м'],
    ['Гидроизоляция', '62 м²'],
    ['Металлочерепица 0,45', '67 м²'],
    ['Конёк + торцевые планки', '6,6 + 12,8 м'],
    ['Саморезы кровельные', '≈ 400 шт'],
  ]
  b.push(rect(tx, ty, 420, 23, { fill: '#f1ece2', stroke: INK, sw: 1 }))
  b.push(txt(tx + 8, ty + 15.5, 'Наименование', { size: 8.5, weight: 700 }))
  b.push(txt(tx + 412, ty + 15.5, 'Кол-во', { size: 8.5, weight: 700, anchor: 'end' }))
  ty += 23
  for (const [n, q] of rows) {
    b.push(rect(tx, ty, 420, 23, { fill: '#fff', stroke: '#cec7ba', sw: 0.8 }))
    b.push(txt(tx + 8, ty + 15.5, n, { size: 8.5 }))
    b.push(txt(tx + 412, ty + 15.5, q, { size: 8.5, anchor: 'end', weight: 600 }))
    ty += 23
  }
  ty += 18
  b.push(txt(tx, ty, `Площадь кровли: ${roofArea.total.toFixed(1).replace('.', ',')} м²`, { size: 9.5, weight: 700, fill: ACCENT }))
  ty += 15
  for (const n of [
    'Снеговая нагрузка 180 кг/м² (III район).',
    'Шаг стропил 600 — под металлочерепицу.',
    'Свес 500 защищает фасад и террасу.',
    'Вентзазор 50 мм, выход на коньке.',
  ]) {
    b.push(txt(tx, ty, n, { size: 8.2, fill: '#3d3a34' }))
    ty += 12
  }

  // деталь стропила
  const dx = 760
  const dy = 720
  b.push(txt(tx, 540, 'ДЕТАЛЬ СТРОПИЛА', { size: 10.5, weight: 700 }))
  const baseY = dy
  const apexY = dy - 160
  b.push(
    poly(
      [
        [dx, baseY],
        [dx + 278, baseY],
        [dx + 278, apexY],
      ],
      { fill: 'none', stroke: '#a9764a', sw: 2 }
    )
  )
  b.push(txt(dx + 60, baseY - 6, '30°', { size: 10, weight: 700, fill: ACCENT }))
  b.push(txt(dx + 150, baseY + 16, 'полската 2 750', { size: 8, fill: DIM }))
  b.push(txt(dx + 288, baseY - 74, 'h = 1 299', { size: 8, fill: DIM }))
  b.push(txt(dx + 150, apexY + 20, 'L = 3 175', { size: 8.5, fill: ACCENT, weight: 600 }))
  b.push(txt(dx + 8, baseY + 30, 'стропило 45×195, шаг 600', { size: 8, fill: DIM }))
  b.push(txt(dx + 8, baseY + 42, 'свес 500, лобовая доска 25×150', { size: 8, fill: DIM }))

  return sheet({
    title: 'Стропильная система',
    subtitle: 'Уклон 30° / 15°, стропила 45×195, шаг 600',
    scale: '1:50',
    body: b.join('\n'),
    note: 'Схема под металлочерепицу. При замене на мягкую черепицу — сплошной настил ОСП-3 9 мм и подкладочный ковёр.',
  })
}
