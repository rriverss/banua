import { sheet, txt, line, rect, poly, path, circle, dimH, dimV, INK } from '../../../schematics/svg.js'
import { project as P, rooms, roofArea, pilePositions, ceilingY, roofY } from '../project.js'

const DIM = '#6d6a63'
const ACCENT = '#a9693a'

const S = 80
const OX = 188
const Y0 = 520 // 0,000
const X = (z) => OX + z * S
const Y = (y) => Y0 - y * S

const dm = P.dims
const R = P.roof
const yTile = (z) => roofY(z) + R.batten + R.counter + 0.012

const zBack = 0
const zFront = dm.depth
const zTer = dm.D

function callout(n, px, py, lx, ly) {
  return (
    circle(px, py, 9, { fill: '#fff', stroke: ACCENT, sw: 1.3 }) +
    txt(px, py + 3.4, String(n), { size: 9, anchor: 'middle', fill: ACCENT, weight: 700 }) +
    line(px, py, lx, ly, { stroke: ACCENT, w: 0.8 })
  )
}
const text_ = (x, y, t) => txt(x, y, t, { size: 8, fill: DIM })

export function sectionSheet() {
  const b = []

  // ---------- грунт
  b.push(line(X(-0.9), Y(dm.groundY), X(zTer + 0.9), Y(dm.groundY), { stroke: INK, w: 1.3 }))
  for (let z = -0.85; z < zTer + 0.9; z += 0.36) {
    b.push(line(X(z), Y(dm.groundY), X(z + 0.18), Y(dm.groundY - 0.16), { stroke: '#b9b2a5', w: 0.7 }))
  }

  // ---------- сваи, обвязка
  for (const z of [0.075, 2.555, 4.985, 6.485]) {
    b.push(rect(X(z) - 5, Y(dm.pileTop), 10, (dm.pileTop - (dm.pileTop - 2.4)) * S, { fill: '#9aa3a8', stroke: '#6f7a80', sw: 0.8 }))
    b.push(rect(X(z) - 9.5, Y(dm.pileTop), 19, 0.02 * S, { fill: '#c8ccd0', stroke: '#6f7a80', sw: 0.7 }))
    // лопасть
    b.push(path(`M ${X(z) - 4} ${Y(dm.pileTop - 2.15)} L ${X(z) - 16} ${Y(dm.pileTop - 2.3)} L ${X(z) - 4} ${Y(dm.pileTop - 2.35)}`, { stroke: '#6f7a80', sw: 1 }))
  }
  // обвязка 150×150 и балки пола
  b.push(rect(X(zBack) - 0.1 * S, Y(-0.305), (zTer + 0.2) * S, 0.15 * S, { fill: '#c7a06d', stroke: '#8a6035', sw: 0.9 }))
  for (let z = 0.2; z < zTer - 0.1; z += 0.35) {
    b.push(rect(X(z), Y(-0.105), 0.05 * S, 0.2 * S, { fill: '#e0b97f', stroke: '#a98f62', sw: 0.6 }))
  }
  // утеплитель пола
  b.push(rect(X(0.1), Y(-0.105), (zFront - 0.2) * S, 0.2 * S, { fill: 'url(#insul)', stroke: 'none' }))
  // настил: доска 25 + шпунт 36
  b.push(rect(X(0.05), Y(0), (zFront - 0.1) * S, 0.061 * S, { fill: '#e5d3b6', stroke: '#a98f62', sw: 0.8 }))
  b.push(rect(X(0.05), Y(0.061), (zFront - 0.1) * S, 0.044 * S, { fill: '#d8bb90', stroke: '#a98f62', sw: 0.8 }))

  // ---------- стены (разрез)
  const wallRect = (z0, top, fill = 'url(#insul)') => {
    b.push(rect(X(z0), Y(top), 0.15 * S, top * S, { fill, stroke: INK, sw: 1.2 }))
    // стойка внутри
    b.push(rect(X(z0 + 0.05), Y(top - 0.04), 0.04 * S, (top - 0.08) * S, { fill: '#dfb37c', stroke: '#a98f62', sw: 0.6 }))
    // отделка: снаружи имитация бруса, внутри вагонка
    b.push(rect(X(z0) - 2.5, Y(top), 2.5, top * S, { fill: '#c89a63', stroke: 'none' }))
    b.push(rect(X(z0 + 0.15) + 0.5, Y(top), 2, top * S, { fill: '#f0dcb8', stroke: 'none' }))
  }
  // задняя стена (ось Д) — глухая
  wallRect(-0.075, ceilingY(0) - 0.01)
  // фронтальная стена (ось Б) — с окном ОТ-1 0…2,26
  const zF = zFront - 0.075
  const topF = ceilingY(zFront) - 0.01
  b.push(rect(X(zF), Y(topF), 0.15 * S, topF * S, { fill: 'url(#insul)', stroke: INK, sw: 1.2 }))
  b.push(rect(X(zF + 0.05), Y(topF - 0.04), 0.04 * S, (topF - 2.3) * S, { fill: '#dfb37c', stroke: '#a98f62', sw: 0.6 }))
  b.push(rect(X(zF) - 2.5, Y(topF), 2.5, topF * S, { fill: '#c89a63', stroke: 'none' }))
  b.push(rect(X(zF + 0.15) + 0.5, Y(topF), 2, topF * S, { fill: '#f0dcb8', stroke: 'none' }))
  // окно ОТ-1 в разрезе
  b.push(rect(X(zF + 0.02), Y(2.26), 0.11 * S, 2.26 * S, { fill: '#dfeaf0', stroke: '#3d4348', sw: 1.2 }))
  b.push(line(X(zF + 0.02), Y(2.26), X(zF + 0.13), Y(2.26), { stroke: '#3d4348', w: 2 }))
  b.push(txt(X(zF + 0.3), Y(2.42), 'ОТ-1 3100×2260', { size: 8, fill: ACCENT, weight: 600 }))

  // ---------- перегородка парной (z = 2,545) — видна в разрезе
  b.push(rect(X(2.47), Y(2.4), 0.15 * S, 2.4 * S, { fill: '#efe4d2', stroke: '#8a7f6d', sw: 0.9, dash: '5 3' }))
  b.push(txt(X(2.54), Y(2.52), 'перегородка', { size: 7, anchor: 'middle', fill: DIM }))

  // ---------- кровля: пирог
  const roofPoly = (offset, thick, fill, stroke) => {
    const p = []
    for (let i = 0; i <= 12; i++) {
      const z = -0.05 + ((zTer + 0.05) * i) / 12
      p.push([X(z), Y(yTile(z) + offset)])
    }
    for (let i = 12; i >= 0; i--) {
      const z = -0.05 + ((zTer + 0.05) * i) / 12
      p.push([X(z), Y(yTile(z) + offset - thick)])
    }
    return poly(p, { fill, stroke, sw: 0.9 })
  }
  // подшив потолка (16) + стропила 200 + обрешётка 25 + контробрешётка 40 + металлочерепица
  b.push(roofPoly(0.005, 0.09, '#3a4045', '#22262a')) // покрытие
  b.push(roofPoly(-0.077, 0.065, '#e6cfa8', '#a98f62')) // обрешётка/контробрешётка
  b.push(roofPoly(-0.142, 0.2, 'url(#insul)', '#a98f62')) // стропила + утеплитель
  b.push(roofPoly(-0.342, 0.016, '#f0dcb8', '#a98f62')) // подшив вагонкой
  // стропильные ноги (линии по скату)
  for (const z of [0.6, 1.55, 3.45, 5.6, 6.2]) {
    b.push(line(X(z), Y(yTile(z) - 0.077), X(z), Y(yTile(z) - 0.142), { stroke: '#c9a06a', w: 0.8 }))
  }
  // LVL-прогоны 300×51
  for (const z of [1.55, 3.45]) {
    b.push(rect(X(z) - 0.03 * S, Y(ceilingY(z)), 0.06 * S, 0.3 * S, { fill: '#c9895a', stroke: '#8a6035', sw: 0.9 }))
  }

  // ---------- терраса
  b.push(rect(X(zFront), Y(dm.terraceY), (zTer - zFront + 0.08) * S, 0.028 * S, { fill: '#c79a68', stroke: '#8a6035', sw: 0.8 }))
  for (let z = zFront + 0.15; z < zTer; z += 0.35) {
    b.push(rect(X(z), Y(0.012), 0.05 * S, 0.2 * S, { fill: '#e0b97f', stroke: '#a98f62', sw: 0.6 }))
  }
  // стойка и балка под кровлей террасы
  b.push(rect(X(6.3), Y(yTile(6.4) - 0.077), 0.12 * S, (yTile(6.4) - 0.077 - dm.terraceY) * S, { fill: '#b8823f', stroke: '#7d5a2c', sw: 0.9 }))
  b.push(txt(X(6.42) + 8, Y(2.35), 'стойка 120×120', { size: 7.5, fill: DIM }))
  // ограждение
  b.push(line(X(zTer - 0.04), Y(dm.terraceY), X(zTer - 0.04), Y(dm.terraceY + 1.0), { stroke: '#8a6a44', w: 2 }))
  b.push(line(X(zTer - 0.04), Y(dm.terraceY + 1.0), X(zTer - 0.04), Y(dm.terraceY + 1.04), { stroke: '#8a6a44', w: 3 }))

  // ---------- подписи
  b.push(txt(X(2.1), Y(1.5), 'Комната отдыха', { size: 12, weight: 600 }))
  b.push(txt(X(2.1), Y(1.12), `${rooms.find((r) => r.id === 'ko').area.toFixed(1).replace('.', ',')} м² · потолок по скату 2,3…3,2 м`, { size: 8.5, fill: DIM }))
  b.push(txt(X(5.9), Y(0.62), 'Терраса', { size: 10, anchor: 'middle', weight: 600 }))
  b.push(txt(X(5.9), Y(0.32), '32,0 м²', { size: 8.5, anchor: 'middle', fill: DIM }))
  b.push(txt(X(0.35), Y(3.45), 'мансардного этажа нет: подшив по стропилам', { size: 7.5, fill: DIM }))

  // ---------- выноски
  b.push(callout(1, X(2.555), Y(-0.38), X(1.1), Y(-0.62)))
  b.push(callout(2, X(5.02), Y(2.4), X(4.6), Y(2.95)))
  b.push(callout(3, X(4.2), Y(yTile(4.2) - 0.22), X(3.5), Y(3.95)))
  b.push(callout(4, X(6.36), Y(0.75), X(5.55), Y(1.35)))
  b.push(callout(5, X(1.4), Y(0.02), X(1.4), Y(-0.75)))

  // ---------- отметки
  const lvl = (z, y, t) => {
    b.push(line(X(z) - 12, Y(y), X(z) + 12, Y(y), { stroke: ACCENT, w: 1 }))
    b.push(txt(X(z) + 16, Y(y) - 5, t, { size: 8.5, fill: ACCENT, weight: 600 }))
  }
  lvl(0.3, 0, '+0,000')
  lvl(5.9, dm.terraceY, '+0,040')
  lvl(0.3, dm.pileTop, '−0,455')
  lvl(0.3, dm.groundY, '−0,750')
  lvl(6.3, yTile(6.5), '+3,72')
  lvl(0.15, yTile(0), '+2,60')
  lvl(4.9, ceilingY(5), '+3,18')

  // ---------- оси
  for (const [z, l] of [
    [0, 'Д'],
    [1.27, 'Г'],
    [2.57, 'В'],
    [dm.depth, 'Б'],
    [dm.D, 'А'],
  ]) {
    b.push(line(X(z), Y(3.9), X(z), Y(-0.9), { stroke: '#c2bbae', w: 0.8, dash: '12 4 3 4' }))
    b.push(circle(X(z), Y(-1.62), 10, { fill: '#fff', stroke: INK, sw: 1 }))
    b.push(txt(X(z), Y(-1.62) + 4, l, { size: 10, anchor: 'middle', weight: 600 }))
  }

  // ---------- размеры
  b.push(dimH(X(0), X(zFront), Y(-1.05), '5 000'))
  b.push(dimH(X(zFront), X(zTer), Y(-1.05), '1 500'))
  b.push(dimH(X(0), X(zTer), Y(-1.35), '6 500'))
  b.push(dimV(Y(0), Y(ceilingY(0) - 0.01), X(-0.5), '2 300'))
  b.push(dimV(Y(0), Y(ceilingY(5) - 0.01), X(zTer + 0.62), '3 170'))
  b.push(dimV(Y(0), Y(yTile(6.5)), X(zTer + 1.0), '3 720'))

  // ---------- заголовок
  b.push(txt(OX - 14, 46, 'РАЗРЕЗ 1–1', { size: 19, weight: 700, letter: 1.2 }))
  b.push(txt(OX - 14, 68, 'По комнате отдыха (x = 6,0), поперёк ската: КО и терраса. Отметки — от чистого пола', { size: 10.5, fill: DIM }))

  // ---------- слои справа
  const lx = 884
  let ly = 108
  b.push(txt(lx, ly, 'СЛОИ КОНСТРУКЦИЙ', { size: 10.5, weight: 700, letter: 0.4 }))
  ly += 18
  const blocks = [
    ['СТЕНА (снаружи → внутрь)', ['имитация бруса 16', 'вентзазор 25 (брусок 25×50)', 'мембрана ветро-влагозащитная', 'стойка 40×150 + вата 150', 'пароизоляция', 'вагонка 16 (липа в мокрых)']],
    ['ПОЛ', ['шпунтованная доска 36', 'доска 25 (основание)', 'балки 50×200 + вата 200', 'ветрозащита', 'сетка оцинк. 2×2 от грызунов']],
    ['КРОВЛЯ (снизу вверх)', ['подшив вагонкой 16 по стропилам', 'стропило 50×200 + вата 200', 'контробрешётка 40×40', 'обрешётка 25×100, шаг 350', 'металлочерепица 0,45']],
    ['ТЕРРАСА', ['террасная доска 28', 'лаги 50×200', 'обвязка 150×150 по сваям']],
  ]
  for (const [title, rows] of blocks) {
    b.push(txt(lx, ly, title, { size: 8.6, weight: 700, fill: ACCENT }))
    ly += 13
    for (const r of rows) {
      b.push(text_(lx, ly, '• ' + r))
      ly += 11.5
    }
    ly += 6
  }

  ly += 4
  b.push(txt(lx, ly, 'ПОКАЗАТЕЛИ', { size: 10, weight: 700, letter: 0.4 }))
  ly += 15
  const stats = [
    ['Уклон кровли', `${R.pitch.toFixed(1).replace('.', ',')}° (1:5,8)`],
    ['Верх кровли у террасы', '+3,72'],
    ['Верх кровли у оси Д', '+2,60'],
    ['Потолок в КО', '2,30…3,18'],
    ['Кровля', `${roofArea.total.toFixed(1).replace('.', ',')} м²`],
    ['Сваи', `${pilePositions.length} шт. ⌀108×2400`],
    ['Площадь пола', `${rooms.reduce((s, r) => s + (r.id === 'ter' ? 0 : r.area), 0).toFixed(1).replace('.', ',')} м²`],
  ]
  for (const [k, v] of stats) {
    b.push(txt(lx, ly, k, { size: 8.2, fill: DIM }))
    b.push(txt(lx + 300, ly, v, { size: 8.4, weight: 600, anchor: 'end' }))
    ly += 13
  }

  return sheet({
    num: 3,
    title: 'Разрез 1–1',
    subtitle: 'Конструкция стены, пола, кровли и террасы',
    scale: '1:50',
    body: b.join('\n'),
    note: 'Кровля односкатная: высокий борт — к террасе (юг), низкий — к оси Д. Потолок подшит по стропилам, мансарды нет. Утеплитель кровли — 200 мм.',
  })
}
