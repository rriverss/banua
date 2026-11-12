import { sheet, txt, line, rect, poly, path, circle, dimH, dimV, INK } from '../../../schematics/svg.js'
import { project as P, rooms, gable, roofArea, pilePositions } from '../project.js'

const DIM = '#6d6a63'
const ACCENT = '#a9693a'

const S = 70
const OX = 92
const Y0 = 648 // чистый пол 0,000
const X = (x) => OX + x * S
const Y = (y) => Y0 - y * S

const dm = P.dims
const R = P.roof
const W = dm.W
const x0 = dm.x0
const x1 = x0 + dm.L

const eaveY = R.eaveY
const ridgeY = R.ridgeY
const ridgeX = R.ridgeX
const wallH = dm.wallH
const plinthTop = 0.05
const plinthBot = -0.45

function hatch(x1_, y1_, x2_, y2_, opts) {
  return rect(Math.min(x1_, x2_), Math.min(Y(y1_), Y(y2_)), Math.abs(x2_ - x1_), Math.abs(Y(y1_) - Y(y2_)), opts)
}

function callout(n, px, py, lx, ly) {
  return (
    circle(px, py, 9, { fill: '#fff', stroke: ACCENT, sw: 1.3 }) +
    txt(px, py + 3.4, String(n), { size: 9, anchor: 'middle', fill: ACCENT, weight: 700 }) +
    line(px, py, lx, ly, { stroke: ACCENT, w: 0.8 })
  )
}

export function sectionSheet() {
  const b = []
  const zCut = 5.4 // сечение по кухне-гостиной

  // ---------- грунт
  b.push(line(X(-0.9), Y(dm.groundY), X(W + 0.9), Y(dm.groundY), { stroke: INK, w: 1.3 }))
  for (let x = -0.8; x < W + 0.9; x += 0.34) {
    b.push(line(X(x), Y(dm.groundY), X(x + 0.18), Y(dm.groundY - 0.16), { stroke: '#b9b2a5', w: 0.7 }))
  }

  // ---------- сваи, ростверк, цоколь
  for (const p of pilePositions.filter((q) => q.z > 4 && q.z < 8)) {
    b.push(rect(X(p.x) - 4, Y(dm.pileTop), 8, (dm.pileTop - dm.groundY + 0.45) * S, { fill: '#9aa3a8', stroke: '#6f7a80', sw: 0.8 }))
    b.push(line(X(p.x) - 7, Y(dm.groundY - 0.45), X(p.x) + 7, Y(dm.groundY - 0.42), { stroke: '#6f7a80', w: 1 }))
  }
  b.push(rect(X(x0) - 6, Y(dm.pileTop), (dm.L + 0.3) * S, 0.15 * S, { fill: '#c7a06d', stroke: '#8a6035', sw: 0.9 }))
  // каменный цоколь
  for (const wx of [x0 - 0.06, x1 + 0.06]) {
    b.push(rect(X(wx) - 4, Y(plinthTop), 8, (plinthTop - plinthBot) * S, { fill: '#cfc9bd', stroke: '#8f887a', sw: 0.8 }))
  }

  // ---------- пол и потолок
  b.push(rect(X(x0), Y(0), dm.L * S, 0.32 * S, { fill: '#e5d3b6', stroke: '#a98f62', sw: 0.9 }))
  b.push(rect(X(x0), Y(0.02), dm.L * S, 5, { fill: '#c79a68' }))
  // плоский потолок над северным блоком — не в разрезе; здесь свод
  b.push(line(X(x0), Y(wallH), X(x1), Y(wallH), { stroke: '#8a6035', w: 1, dash: '6 4' }))

  // ---------- стены
  for (const wx of [x0 - dm.wallT / 2, x1 + dm.wallT / 2]) {
    b.push(rect(X(wx) - (dm.wallT / 2) * S, Y(wallH), dm.wallT * S, wallH * S, { fill: '#efe4d3', stroke: INK, sw: 1.2 }))
    b.push(rect(X(wx) - (dm.wallT / 2) * S, Y(wallH), 3, wallH * S, { fill: '#34393d' }))
  }

  // ---------- стропила и свод
  const rafterY = (x) => (x <= ridgeX ? ridgeY - (ridgeX - x) * Math.tan((R.pitch * Math.PI) / 180) : ridgeY - (x - ridgeX) * Math.tan((R.pitch * Math.PI) / 180))
  const drawPlane = (xa, xb, fill, under) => {
    const p = []
    for (let i = 0; i <= 24; i++) {
      const x = xa + ((xb - xa) * i) / 24
      p.push([X(x), Y(rafterY(x) - under)])
    }
    p.push([X(xb), Y(rafterY(xb) + 0.42)], [X(xa), Y(rafterY(xa) + 0.42)])
    return poly(p, { fill, stroke: '#8a6a44', sw: 0.9 })
  }
  // свод: подшив по стропилам от стен до конька
  b.push(drawPlane(x0, ridgeX, '#efdcbf', 0.06))
  b.push(drawPlane(ridgeX, x1, '#efdcbf', 0.06))
  // утеплитель в скате
  b.push(drawPlane(x0, ridgeX, '#f2e6cf', 0.3))
  b.push(drawPlane(ridgeX, x1, '#f2e6cf', 0.3))
  // карнизы и свесы
  for (const [ax, bx2] of [[R.eaveX, x0], [x1, R.eaveRightX]]) {
    const p = []
    p.push([X(ax), Y(rafterY(ax) + 0.3)], [X(bx2), Y(rafterY(bx2) + 0.3)], [X(bx2), Y(rafterY(bx2) - 0.1)], [X(ax), Y(rafterY(ax) - 0.1)])
    b.push(poly(p, { fill: '#dfc9a6', stroke: '#8a6a44', sw: 0.9 }))
  }
  // кровля
  b.push(
    poly(
      [
        [X(R.eaveX), Y(rafterY(R.eaveX) + 0.08)],
        [X(ridgeX), Y(ridgeY + 0.08)],
        [X(R.eaveRightX), Y(rafterY(R.eaveRightX) + 0.08)],
        [X(R.eaveRightX), Y(rafterY(R.eaveRightX) - 0.05)],
        [X(ridgeX), Y(ridgeY - 0.05)],
        [X(R.eaveX), Y(rafterY(R.eaveX) - 0.05)],
      ],
      { fill: '#2b3034', stroke: '#1d2124', sw: 1 }
    )
  )

  // ---------- терраса
  b.push(rect(X(0), Y(0), dm.x0 * S, 0.06 * S, { fill: '#c79a68', stroke: '#8a6035', sw: 0.9 }))
  b.push(rect(X(0), Y(0.06), dm.x0 * S, 0.24 * S, { fill: '#b98452', stroke: '#8a6035', sw: 0.7 }))
  b.push(txt(X(1.0), Y(0.62), 'настил лиственница 28', { size: 7.5, anchor: 'middle', fill: DIM }))
  b.push(rect(X(x0 + 0.25) - 5, Y(2.55), 10, 2.55 * S, { fill: '#6f4a28', stroke: '#4a3018', sw: 0.8 }))
  b.push(txt(X(x0 + 0.25) + 12, Y(1.4), 'стойка 120×120', { size: 7.5, fill: DIM }))

  // ---------- подписи помещений
  b.push(txt(X(5.4), Y(1.5), 'Кухня-гостиная', { size: 11, weight: 600 }))
  b.push(txt(X(5.4), Y(1.18), '28,7 м² · свод до конька 5,33', { size: 8.5, fill: DIM }))
  b.push(txt(X(5.4), Y(0.82), 'Терраса за витражом', { size: 8.5, fill: DIM }))

  // ---------- выноски
  b.push(callout(1, X(x0 - 0.1), Y(-0.2), X(x0) - 96, Y(-0.6)))
  b.push(callout(2, X(x0), Y(1.7), X(x0) - 72, Y(2.4)))
  b.push(callout(3, X(2.4), Y(rafterY(2.4) - 0.2), X(2.0) - 30, Y(rafterY(2.4) + 0.55)))
  b.push(callout(4, X(5.0), Y(rafterY(5.0) - 0.18), X(5.2), Y(rafterY(5.0) + 0.7)))
  b.push(callout(5, X(1.0), Y(0.0), X(0.55), Y(-0.55)))

  // ---------- размерные линии
  b.push(dimH(X(0), X(x0), Y(-0.78), '2 000'))
  b.push(dimH(X(x0), X(x1), Y(-0.78), '8 000'))
  b.push(dimH(X(0), X(x1), Y(-1.08), '10 000'))
  b.push(dimV(Y(0), Y(wallH), X(0) - 26, '2 900'))
  b.push(dimV(Y(wallH), Y(ridgeY), X(0) - 26, '2 433'))
  b.push(dimV(Y(0), Y(ridgeY), X(0) - 58, '5 333'))
  b.push(dimV(Y(plinthBot), Y(0), X(x1) + 24, '450'))
  b.push(
    txt(X(ridgeX) + 10, Y(ridgeY + 0.42), `+${ridgeY.toFixed(2).replace('.', ',')}`, { size: 8.5, fill: ACCENT, weight: 600 })
  )
  b.push(txt(X(1.94) - 6, Y(0) - 8, '−0,000', { size: 8.5, fill: ACCENT, weight: 600 }))
  b.push(txt(X(2.0) - 6, Y(dm.groundY) + 12, '−0,550', { size: 8.5, fill: ACCENT, weight: 600 }))

  // ---------- заголовок
  b.push(txt(OX - 14, 46, 'РАЗРЕЗ 1–1', { size: 19, weight: 700, letter: 1.2 }))
  b.push(txt(OX - 14, 68, 'Поперёк конька, по кухне-гостиной и террасе. Отметки — от чистого пола', { size: 10.5, fill: DIM }))

  // ---------- слои справа
  const lx = 880
  let ly = 112
  b.push(txt(lx, ly, 'СЛОИ КОНСТРУКЦИЙ', { size: 10.5, weight: 700, letter: 0.4 }))
  ly += 18
  const blocks = [
    ['СТЕНА (снаружи → внутрь)', ['рейка RAL 7021, вентзазор 30', 'ОСП-3 9 мм', 'каркас 195 + вата 195', 'пароизоляция', 'вагонка 16']],
    ['ПОЛ', ['покрытие 18–35', 'ОСП-3 18', 'лага 195 + вата 195', 'ветрозащита', 'продух 100']],
    ['КРОВЛЯ (снизу вверх)', ['вагонка 16 по стропилам', 'стропило 195 + вата 195', 'контробрешётка 50', 'обрешётка 25×100, шаг 350', 'фальц RAL 7021']],
    ['СВОД ГОСТИНОЙ', ['подшив вагонкой по стропилам', 'утепление 195 в скате', 'вентзазор 50 у конька', 'фальц по обрешётке']],
  ]
  for (const [title, rows] of blocks) {
    b.push(txt(lx, ly, title, { size: 8.6, weight: 700, fill: ACCENT }))
    ly += 13
    for (const r of rows) {
      b.push(text_(lx, ly, '• ' + r))
      ly += 12
    }
    ly += 6
  }

  ly += 6
  b.push(txt(lx, ly, 'ПОКАЗАТЕЛИ', { size: 10, weight: 700, letter: 0.4 }))
  ly += 15
  const stats = [
    ['Конёк', `+${ridgeY.toFixed(2).replace('.', ',')}`],
    ['Высота стены', `${wallH.toFixed(1).replace('.', ',')}`],
    ['Карниз', `+${eaveY.toFixed(2).replace('.', ',')}`],
    ['Уклон кровли', `${R.pitch}°`],
    ['Высота фронтона', `${gable.height.toFixed(2).replace('.', ',')} м`],
    ['Кровля', `${roofArea.total.toFixed(1).replace('.', ',')} м²`],
    ['Площадь пола', `${rooms.reduce((s, r) => s + (r.id === 'ter' ? 0 : r.area), 0).toFixed(1).replace('.', ',')} м²`],
  ]
  for (const [k, v] of stats) {
    b.push(txt(lx, ly, k, { size: 8.2, fill: DIM }))
    b.push(txt(lx + 132, ly, v, { size: 8.4, weight: 600 }))
    ly += 13
  }

  return sheet({
    num: 3,
    title: 'Разрез 1–1',
    subtitle: 'Конструкция стен, пола, свода и кровли',
    scale: '1:50',
    body: b.join('\n'),
    note: 'Свод над гостиной открыт до конька; над сауной, душевой и спальней — плоский потолок 2,70 м с холодным чердаком. Утеплитель кровли — 2 × 195 мм.',
  })
}

const text_ = (x, y, t) => txt(x, y, t, { size: 8, fill: DIM })
