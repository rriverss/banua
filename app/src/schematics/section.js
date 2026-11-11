import { sheet, txt, line, rect, poly, path, circle, dimH, dimV, callout, INK, DIM, ACCENT } from './svg.js'
import { project as P, roofY, roofUnderY, gable } from '../model/project.js'
import { mm } from './plan.js'

const S = 92
const OX = 210
const OY = 715
const X = (x) => OX + x * S
const Y = (y) => OY - y * S

const T = P.dims.wallT
const L = P.dims.L

/** штриховка утеплителя в прямоугольнике */
function insul(x, y, w, h) {
  return rect(x, y, w, h, { fill: 'url(#insul)', stroke: '#c9a35b', sw: 0.7 })
}

/** стена в разрезе: ОСП + каркас с утеплителем + обшивка */
function wallCut(x, y0, y1, thick, inner = 1) {
  const s = []
  const t = thick
  s.push(rect(x, Y(y1), t * S, (y1 - y0) * S, { fill: 'url(#insul)', stroke: '#8a6a44', sw: 0.9 }))
  // ОСП снаружи
  s.push(rect(inner > 0 ? x : x + t * S - 2.4, Y(y1), 2.4, (y1 - y0) * S, { fill: '#d9b981', stroke: 'none', sw: 0 }))
  // обшивка внутри
  s.push(rect(inner > 0 ? x + t * S - 2 : x, Y(y1), 2, (y1 - y0) * S, { fill: '#b07c4a', stroke: 'none', sw: 0 }))
  return s.join('')
}

export function sectionSheet() {
  const b = []
  const ridgeY = P.roof.ridgeY
  const eaveL = P.roof.eaveX
  const eaveR = P.roof.eaveRightX
  const eaveY = roofY(eaveL)
  const under = (x) => roofUnderY(x)

  b.push(txt(OX, 58, 'РАЗРЕЗ 1–1', { size: 19, weight: 700, letter: 1.2 }))
  b.push(txt(OX, 82, 'Поперёк конька, по мойке и комнате отдыха. Отметки — от уровня чистого пола', { size: 10.5, fill: DIM }))

  // ---- грунт
  const gy = Y(P.dims.groundY)
  b.push(rect(40, gy, 940, 877 - 60 - gy, { fill: 'url(#soil)', stroke: 'none', opacity: 0.45 }))
  b.push(line(40, gy, 980, gy, { stroke: '#6d6a63', w: 1.4 }))
  b.push(rect(X(0.05), gy + 8, 86, 14, { fill: '#fdfbf6', stroke: 'none', sw: 0, opacity: 0.92 }))
  b.push(txt(X(0.08), gy + 18, 'грунт −0,550', { size: 8, fill: DIM }))

  // ---- сваи (за плоскостью разреза, пунктир)
  for (const x of [0.15, 2.95, 5.85]) {
    b.push(rect(X(x) - 5, Y(P.dims.pileTop), 10, 0.71 * S, { fill: '#e9e6df', stroke: '#7d7a72', sw: 0.9, dash: '5 3' }))
  }

  // ---- обвязка и пол
  b.push(rect(X(-0.075), Y(P.dims.pileTop), 6.15 * S, P.dims.girder * S, { fill: '#d9a568', stroke: '#8a6a44', sw: 0.9 }))
  b.push(rect(X(0), Y(0), L * S, 0.195 * S, { fill: 'url(#insul)', stroke: '#8a6a44', sw: 0.9 }))
  b.push(rect(X(0) - 4, Y(0.03), L * S + 8, 0.03 * S, { fill: '#c9a373', stroke: '#8a6a44', sw: 0.8 }))

  // ---- стены
  b.push(wallCut(X(0), 0, P.dims.wallH, T, 1))
  b.push(rect(X(0), Y(P.dims.wallH), T * S, P.dims.wallH * S, { fill: 'none', stroke: INK, sw: 1.1 }))
  b.push(wallCut(X(L - T), 0, P.dims.wallH, T, -1))
  b.push(rect(X(L - T), Y(P.dims.wallH), T * S, P.dims.wallH * S, { fill: 'none', stroke: INK, sw: 1.1 }))

  // ---- перегородка x=3 с надстройкой до кровли
  const pt = P.dims.partT
  const ceiling = P.dims.ceiling
  b.push(rect(X(3 - pt / 2), Y(ceiling), pt * S, ceiling * S, { fill: 'url(#insul)', stroke: '#8a6a44', sw: 0.9 }))
  b.push(rect(X(3 - pt / 2), Y(under(3)), pt * S, (under(3) - ceiling) * S, { fill: 'url(#insul)', stroke: '#8a6a44', sw: 0.9 }))
  b.push(txt(X(3.4), Y(1.1), 'П1', { size: 8, fill: DIM }))

  // ---- потолок мойки
  b.push(rect(X(3 + pt / 2), Y(ceiling), (L - T - 3 - pt / 2) * S, 0.195 * S, { fill: '#e6bd8c', stroke: '#8a6a44', sw: 0.8 }))
  b.push(insul(X(3 + pt / 2), Y(ceiling + 0.4), (L - T - 3 - pt / 2) * S, 0.2 * S))

  // ---- свод КО (подшив по стропилам)
  b.push(
    poly(
      [
        [X(0.02), Y(under(0.02))],
        [X(3 - pt / 2), Y(under(3 - pt / 2))],
        [X(3 - pt / 2), Y(under(3 - pt / 2) - 0.14)],
        [X(0.02), Y(under(0.02) - 0.14)],
      ],
      { fill: '#f3dcb2', stroke: '#b08a52', sw: 0.8 }
    )
  )

  b.push(txt(X(4.55), Y(3.3), 'холодный чердак, продух 50 мм', { size: 8, fill: DIM }))
  b.push(txt(X(1.0), Y(3.55), 'свод КО открыт до конька', { size: 8, fill: DIM }))

  // ---- кровля
  const roofPoly = [
    [X(eaveL), Y(eaveY)],
    [X(P.roof.ridgeX), Y(ridgeY)],
    [X(eaveR), Y(eaveY)],
    [X(eaveR), Y(eaveY - 0.14)],
    [X(P.roof.ridgeX), Y(ridgeY - 0.14)],
    [X(eaveL), Y(eaveY - 0.14)],
  ]
  b.push(poly(roofPoly, { fill: '#2f3438', stroke: '#20242a', sw: 1 }))
  // стропило в разрезе
  for (const s of [-1, 1]) {
    const xa = P.roof.ridgeX
    const xb = s < 0 ? eaveL + 0.1 : eaveR - 0.1
    b.push(
      poly(
        [
          [X(xa), Y(ridgeY - 0.16)],
          [X(xb), Y(roofY(xb) - 0.16)],
          [X(xb), Y(roofY(xb) - 0.355)],
          [X(xa), Y(ridgeY - 0.355)],
        ],
        { fill: '#d9a568', stroke: '#8a6a44', sw: 0.9 }
      )
    )
  }
  // утеплитель по скату над КО и над мойкой
  b.push(
    poly(
      [
        [X(0.02), Y(under(0.02) - 0.16)],
        [X(3 - 0.2), Y(under(3 - 0.2) - 0.16)],
        [X(3 - 0.2), Y(under(3 - 0.2) - 0.34)],
        [X(0.02), Y(under(0.02) - 0.34)],
      ],
      { fill: 'url(#insul)', stroke: '#c9a35b', sw: 0.6 }
    )
  )
  // конёк
  b.push(circle(X(P.roof.ridgeX), Y(ridgeY + 0.02), 3, { fill: '#20242a', stroke: '#20242a' }))

  // ---- вертикальные стойки витража за разрезом (пунктир)
  for (const x of P.glassWall.mullions) {
    b.push(line(X(x), Y(0), X(x), Y(under(x) - 0.02), { stroke: '#b3ada2', w: 1, dash: '6 5', opacity: 0.8 }))
  }

  // ---- отметки
  const level = (y, text, x = X(-0.55), color = ACCENT) => {
    const yy = Y(y)
    return (
      poly([[x, yy], [x + 26, yy - 4], [x + 26, yy + 4]], { fill: color, stroke: 'none' }) +
      line(x + 26, yy, x + 74, yy, { stroke: color, w: 1.2 }) +
      txt(x - 6, yy + 3.5, text, { size: 9.5, fill: color, weight: 600, anchor: 'end' })
    )
  }
  b.push(level(0, '0,000'))
  b.push(level(2.5, '2,500'))
  b.push(level(ridgeY, '4,360'))
  b.push(level(-0.345, '−0,345'))

  // ---- размеры
  b.push(dimH(X(0), X(3), Y(ridgeY) - 46, mm(3)))
  b.push(dimH(X(3), X(L), Y(ridgeY) - 46, mm(3)))
  b.push(dimH(X(0), X(L), Y(ridgeY) - 82, mm(6)))
  b.push(dimV(Y(0), Y(2.7), X(L) + 44, mm(2.7)))
  b.push(dimV(Y(2.7), Y(ridgeY), X(L) + 44, mm(ridgeY - 2.7)))
  b.push(dimV(Y(0), Y(ridgeY), X(L) + 86, mm(ridgeY)))

  // ---- выноски
  b.push(callout(X(0.15), Y(-0.28), 1, X(1.05), Y(-0.62)))
  b.push(callout(X(0.1), Y(1.5), 2, X(-0.75), Y(1.0)))
  b.push(callout(X(1.4), Y(under(1.4) - 0.2), 3, X(0.35), Y(3.35)))
  b.push(callout(X(3), Y(ridgeY - 0.16), 4, X(2.05), Y(ridgeY + 0.36)))
  b.push(callout(X(4.4), Y(ceiling + 0.2), 5, X(4.95), Y(2.02)))

  // ---- правая колонка
  const cx = 1000
  b.push(txt(cx, 120, 'СЛОИ КОНСТРУКЦИЙ', { size: 11, weight: 700, letter: 0.6 }))
  const block = (title, items, y) => {
    let s = txt(cx, y, title, { size: 9.5, weight: 700, fill: ACCENT })
    items.forEach((it, i) => {
      s += circle(cx + 3, y + 15 + i * 15, 1.4, { fill: DIM, stroke: DIM })
      s += txt(cx + 11, y + 18 + i * 15, it, { size: 8.5, fill: '#3d3a34' })
    })
    return s
  }
  b.push(block('СТЕНА (снаружи → внутрь)', ['рейка графит RAL 7021', 'вентзазор 30', 'ОСП-3 9', 'каркас 195 + вата', 'пароизоляция', 'вагонка 16'], 148))
  b.push(block('ПОЛ', ['покрытие 18–35', 'ОСП-3 18', 'лага 195 + вата', 'ветрозащита', 'продув 100'], 290))
  b.push(block('ПОТОЛОК МОЙКИ / ПАРНОЙ', ['вагонка 16', 'пароизоляция', 'балка 195 + вата', 'вата 100 доп.'], 400))
  b.push(block('КРОВЛЯ (снизу вверх)', ['стропило 195', 'контробрешётка 50', 'гидроизоляция', 'обрешётка 25×100', 'фальц / металл RAL 7021'], 510))

  b.push(txt(cx, 660, 'ПОКАЗАТЕЛИ', { size: 10, weight: 700, letter: 0.6 }))
  const rows = [
    ['Конёк', `+${P.roof.ridgeY.toFixed(3).replace('.', ',')}`],
    ['Высота стены', '2,700'],
    ['Свод КО', 'до конька'],
    ['Потолок мойки', '2,500'],
    ['Уклон кровли', `${P.roof.pitch}°`],
    ['Высота фронтона', `${gable.height.toFixed(2).replace('.', ',')} м`],
  ]
  rows.forEach(([k, v], i) => {
    b.push(txt(cx, 680 + i * 15, k, { size: 8.5, fill: DIM }))
    b.push(txt(cx + 132, 680 + i * 15, v, { size: 8.5, weight: 600 }))
  })

  return sheet({
    num: 3,
    title: 'Разрез 1–1',
    subtitle: 'Конструкция стены, пола, свода и кровли. Узлы 1–5 — см. лист «Узлы»',
    scale: '1:50',
    body: b.join(''),
    note: 'Свод над комнатой отдыха открыт до конька; над мойкой и парной — плоский потолок 2,5 м с холодным чердаком. Утеплитель кровли — 2×195 мм.',
  })
}
