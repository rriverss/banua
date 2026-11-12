import { sheet, txt, line, rect, poly, circle, INK } from '../../../schematics/svg.js'

const DIM = '#6d6a63'
const ACCENT = '#a9693a'
const WOOD = '#d9a568'
const WOOD2 = '#c7a06d'
const INSUL = 'url(#insul)'
const STEEL = '#9aa3a8'

const K = 175 // px на метр в узлах

function box(x, y, w, h, title, sub) {
  const b = []
  b.push(rect(x, y, w, h, { fill: '#fffdf9', stroke: '#d8d1c3', sw: 1 }))
  b.push(rect(x, y, w, 26, { fill: '#f1ece2', stroke: '#d8d1c3', sw: 1 }))
  b.push(txt(x + 9, y + 17, title, { size: 9.5, weight: 700 }))
  if (sub) b.push(txt(x + w - 9, y + 17, sub, { size: 8, fill: DIM, anchor: 'end' }))
  return b
}

// подпись с выноской: точка (px, py), текст в (tx, ty)
function note(b, px, py, tx, ty, text, anchor = 'start') {
  b.push(circle(px, py, 1.9, { fill: ACCENT }))
  b.push(line(px, py, tx + (anchor === 'end' ? -4 : 4), ty - 3, { stroke: ACCENT, w: 0.7 }))
  b.push(txt(tx, ty, text, { size: 7.6, fill: '#3d3a34', anchor }))
}

export function nodesSheet() {
  const b = []
  b.push(txt(108, 46, 'УЗЛЫ', { size: 19, weight: 700, letter: 1.2 }))
  b.push(txt(108, 66, 'Свайное поле, стена на перекрытии, карнизы, окно в пол и проход дымохода', { size: 10.5, fill: DIM }))

  const W = 336
  const H = 312
  const cols = [96, 452, 808]
  const rows = [92, 420]

  // ================= 1. СВАЯ — ОБВЯЗКА — ПОЛ
  {
    const x = cols[0]
    const y = rows[0]
    b.push(...box(x, y, W, H, '1. Свая — обвязка — пол', '1:10'))
    const ox = x + 150
    const oy = y + 140 // верх обвязки
    // обвязка 150×150
    b.push(rect(ox - 0.075 * K, oy, 0.15 * K, 0.15 * K, { fill: WOOD2, stroke: '#8a6a44', sw: 1 }))
    // оголовок
    b.push(rect(ox - 0.1 * K, oy + 0.15 * K, 0.2 * K, 0.006 * K, { fill: STEEL, stroke: '#5f6b72', sw: 0.8 }))
    // свая
    b.push(rect(ox - 0.054 * K, oy + 0.156 * K, 0.108 * K, 0.42 * K, { fill: STEEL, stroke: '#5f6b72', sw: 0.9 }))
    // лага 50×200
    b.push(rect(ox - 0.025 * K, oy - 0.2 * K, 0.05 * K, 0.2 * K, { fill: WOOD, stroke: '#8a6a44', sw: 0.9 }))
    // утеплитель между лагами
    b.push(rect(ox + 0.03 * K, oy - 0.2 * K, 0.34 * K, 0.2 * K, { fill: INSUL, stroke: '#b9a98c', sw: 0.7 }))
    b.push(rect(ox + 0.03 * K, oy - 0.2 * K, 0.34 * K, 0.016 * K, { fill: '#e7e1d6', stroke: 'none' }))
    // настил 25 + 36
    b.push(rect(ox - 0.025 * K, oy - 0.261 * K, 0.4 * K, 0.036 * K, { fill: '#e5d3b6', stroke: '#8a6a44', sw: 0.8 }))
    b.push(rect(ox - 0.025 * K, oy - 0.225 * K, 0.4 * K, 0.025 * K, { fill: '#d8bb90', stroke: '#8a6a44', sw: 0.8 }))

    note(b, ox, oy + 0.30 * K, ox + 0.16 * K, oy + 0.36 * K, 'свая СВ-1 ⌀108×2500')
    note(b, ox - 0.1 * K, oy + 0.15 * K, ox - 0.24 * K, oy + 0.22 * K, 'оголовок 200×200×5', 'end')
    note(b, ox - 0.075 * K, oy + 0.06 * K, ox - 0.26 * K, oy - 0.02 * K, 'обвязка 150×150', 'end')
    note(b, ox - 0.025 * K, oy - 0.12 * K, ox - 0.26 * K, oy - 0.14 * K, 'лага 50×200', 'end')
    note(b, ox + 0.3 * K, oy - 0.1 * K, ox + 0.3 * K, oy - 0.2 * K, 'вата 200')
    note(b, ox + 0.15 * K, oy - 0.235 * K, ox + 0.22 * K, oy - 0.31 * K, 'настил 36+25')
    b.push(txt(x + 10, y + H - 12, 'Сетка 2×2 от грызунов по низу утеплителя', { size: 7.4, fill: DIM }))
  }

  // ================= 2. СТЕНА НА ПЕРЕКРЫТИИ
  {
    const x = cols[1]
    const y = rows[0]
    b.push(...box(x, y, W, H, '2. Стена на перекрытии', '1:10'))
    const ox = x + 120
    const oy = y + 190 // верх настила = 0,000
    // настил
    b.push(rect(ox - 0.06 * K, oy, 0.5 * K, 0.061 * K, { fill: '#e2cfae', stroke: '#8a6a44', sw: 0.9 }))
    // лага
    b.push(rect(ox - 0.06 * K, oy + 0.061 * K, 0.05 * K, 0.2 * K, { fill: WOOD, stroke: '#8a6a44', sw: 0.9 }))
    b.push(rect(ox + 0.35 * K, oy + 0.061 * K, 0.05 * K, 0.2 * K, { fill: WOOD, stroke: '#8a6a44', sw: 0.9 }))
    // нижняя обвязка
    b.push(rect(ox + 0.05 * K, oy - 0.04 * K, 0.15 * K, 0.04 * K, { fill: WOOD, stroke: '#8a6a44', sw: 0.9 }))
    // стойка
    b.push(rect(ox + 0.075 * K, oy - 0.04 * K - 0.34 * K, 0.1 * K, 0.34 * K, { fill: INSUL, stroke: '#8a6a44', sw: 0.9 }))
    // ОСП
    b.push(rect(ox + 0.05 * K, oy - 0.04 * K - 0.3 * K, 0.009 * K, 0.3 * K, { fill: '#d8c8a4', stroke: '#a98f62', sw: 0.7 }))
    // мембрана + зазор + имитация
    b.push(line(ox + 0.045 * K, oy - 0.36 * K, ox + 0.045 * K, oy - 0.02 * K, { stroke: '#7f8a90', w: 1.2, dash: '3 2' }))
    for (let i = 0; i < 5; i++) {
      b.push(rect(ox + 0.012 * K, oy - 0.34 * K + i * 0.06 * K, 0.03 * K, 0.05 * K, { fill: '#c89a63', stroke: '#8a6a44', sw: 0.6 }))
    }
    // вагонка изнутри
    b.push(rect(ox + 0.175 * K, oy - 0.36 * K, 0.016 * K, 0.32 * K, { fill: '#f0dcb8', stroke: '#a98f62', sw: 0.7 }))

    note(b, ox + 0.15 * K, oy - 0.22 * K, ox + 0.2 * K, oy - 0.3 * K, 'стойка 40×150 + вата 150')
    note(b, ox + 0.055 * K, oy - 0.15 * K, ox - 0.04 * K, oy - 0.18 * K, 'ОСП-3 9 мм', 'end')
    note(b, ox + 0.02 * K, oy - 0.05 * K, ox - 0.04 * K, oy - 0.04 * K, 'имитация бруса 16', 'end')
    note(b, ox + 0.05 * K, oy - 0.02 * K, ox + 0.16 * K, oy + 0.02 * K, 'обвязка 40×150')
    note(b, ox + 0.12 * K, oy + 0.15 * K, ox + 0.1 * K, oy + 0.24 * K, 'лага 50×200, шаг 600')
    b.push(txt(x + 10, y + H - 12, 'Углы — ОСП 9 на укосинах, пароизоляция изнутри', { size: 7.4, fill: DIM }))
  }

  // ================= 3. КАРНИЗ НИЗКОЙ СТОРОНЫ
  {
    const x = cols[2]
    const y = rows[0]
    b.push(...box(x, y, W, H, '3. Карниз, ось Д', '1:10'))
    const ox = x + 96
    const oy = y + 150 // верх стены
    // стена
    b.push(rect(ox, oy, 0.15 * K, 0.5 * K, { fill: INSUL, stroke: INK, sw: 1 }))
    b.push(rect(ox - 0.012 * K, oy + 0.02 * K, 0.012 * K, 0.46 * K, { fill: '#c89a63', stroke: '#8a6a44', sw: 0.7 }))
    // стропило (уклон вправо вверх — здесь низкая сторона, хвост влево)
    const rt = [[ox + 0.02 * K, oy - 0.2 * K], [ox + 0.5 * K, oy - 0.2 * K - 0.5 * K * 0.173]]
    b.push(
      poly(
        [
          [rt[0][0], rt[0][1]],
          [rt[1][0], rt[1][1]],
          [rt[1][0], rt[1][1] + 0.2 * K],
          [rt[0][0], rt[0][1] + 0.2 * K],
        ],
        { fill: '#f2e2c2', stroke: '#8a6a44', sw: 1 }
      )
    )
    // обрешётка + кровля
    b.push(
      poly(
        [
          [rt[0][0], rt[0][1] - 0.04 * K],
          [rt[1][0], rt[1][1] - 0.04 * K],
          [rt[1][0], rt[1][1] - 0.06 * K],
          [rt[0][0], rt[0][1] - 0.06 * K],
        ],
        { fill: WOOD, stroke: '#8a6a44', sw: 0.8 }
      )
    )
    b.push(
      poly(
        [
          [rt[0][0], rt[0][1] - 0.06 * K],
          [rt[1][0], rt[1][1] - 0.06 * K],
          [rt[1][0], rt[1][1] - 0.075 * K],
          [rt[0][0], rt[0][1] - 0.075 * K],
        ],
        { fill: '#31363a', stroke: '#1d2124', sw: 0.8 }
      )
    )
    // лобовая доска
    b.push(rect(rt[0][0] - 0.02 * K, rt[0][1] - 0.075 * K, 0.025 * K, 0.28 * K, { fill: '#b8823f', stroke: '#7d5a2c', sw: 0.8 }))
    // капельник
    b.push(path_line(rt[0][0] - 0.03 * K, rt[0][1] - 0.075 * K, rt[0][0] - 0.03 * K, rt[0][1] - 0.09 * K))
    // желоб
    b.push(path_half(rt[0][0] - 0.02 * K, rt[0][1] - 0.12 * K))
    // подшив
    b.push(rect(ox, oy - 0.235 * K, 0.24 * K, 0.016 * K, { fill: '#f0dcb8', stroke: '#a98f62', sw: 0.7 }))
    // вентзазор — стрелки
    for (const dx of [0.1, 0.2]) {
      b.push(line(ox + dx * K, oy - 0.19 * K, ox + dx * K + 14, oy - 0.19 * K, { stroke: '#5a8a9a', w: 1.2 }))
      b.push(
        poly(
          [
            [ox + dx * K + 14, oy - 0.19 * K],
            [ox + dx * K + 8, oy - 0.195 * K],
            [ox + dx * K + 8, oy - 0.185 * K],
          ],
          { fill: '#5a8a9a', stroke: 'none' }
        )
      )
    }
    note(b, rt[0][0] + 0.2 * K, rt[0][1] - 0.05 * K, ox + 0.26 * K, oy - 0.3 * K, 'кровля + обрешётка')
    note(b, rt[0][0] - 0.005 * K, rt[0][1] + 0.05 * K, ox - 0.02 * K, oy - 0.24 * K, 'лобовая 25', 'end')
    note(b, rt[0][0] - 0.02 * K, rt[0][1] - 0.12 * K, ox - 0.02 * K, oy - 0.34 * K, 'желоб 125', 'end')
    note(b, ox + 0.12 * K, oy - 0.235 * K, ox + 0.05 * K, oy + 0.06 * K, 'подшив вагонкой')
    note(b, ox + 0.06 * K, oy - 0.16 * K, ox - 0.02 * K, oy - 0.06 * K, 'вентзазор 40', 'end')
    b.push(txt(x + 10, y + H - 12, 'Свес 600, капельник, вентзазор кровли — 40 мм', { size: 7.4, fill: DIM }))
  }

  // ================= 4. ВЫСОКИЙ БОРТ
  {
    const x = cols[0]
    const y = rows[1]
    b.push(...box(x, y, W, H, '4. Высокий борт над террасой', '1:10'))
    const ox = x + 130
    const oy = y + 248
    // стойка 120×120
    b.push(rect(ox - 0.06 * K, oy - 0.9 * K, 0.12 * K, 0.9 * K, { fill: '#b8823f', stroke: '#7d5a2c', sw: 1 }))
    // балка
    b.push(rect(ox - 0.06 * K, oy - 0.9 * K - 0.15 * K, 0.12 * K, 0.15 * K, { fill: WOOD2, stroke: '#7d5a2c', sw: 1 }))
    // стропило вправо вниз
    b.push(
      poly(
        [
          [ox + 0.06 * K, oy - 1.05 * K],
          [ox + 0.42 * K, oy - 1.05 * K + 0.36 * K * 0.173],
          [ox + 0.42 * K, oy - 1.05 * K + 0.36 * K * 0.173 + 0.2 * K],
          [ox + 0.06 * K, oy - 1.05 * K + 0.2 * K],
        ],
        { fill: '#f2e2c2', stroke: '#8a6a44', sw: 1 }
      )
    )
    // кровля
    b.push(
      poly(
        [
          [ox + 0.06 * K, oy - 1.05 * K - 0.075 * K],
          [ox + 0.42 * K, oy - 1.05 * K + 0.36 * K * 0.173 - 0.075 * K],
          [ox + 0.42 * K, oy - 1.05 * K + 0.36 * K * 0.173 - 0.05 * K],
          [ox + 0.06 * K, oy - 1.05 * K - 0.05 * K],
        ],
        { fill: '#31363a', stroke: '#1d2124', sw: 0.8 }
      )
    )
    // подшив
    b.push(rect(ox + 0.02 * K, oy - 1.05 * K + 0.2 * K, 0.4 * K, 0.016 * K, { fill: '#f0dcb8', stroke: '#a98f62', sw: 0.7 }))
    // настил террасы
    b.push(rect(ox - 0.12 * K, oy, 0.6 * K, 0.028 * K, { fill: '#c79a68', stroke: '#7d5a2c', sw: 0.8 }))

    note(b, ox, oy - 0.5 * K, ox + 0.14 * K, oy - 0.44 * K, 'стойка 120×120')
    note(b, ox, oy - 0.96 * K, ox - 0.08 * K, oy - 0.98 * K, 'балка 100×150', 'end')
    note(b, ox + 0.16 * K, oy - 1.02 * K, ox + 0.2 * K, oy - 0.86 * K, 'стропило 50×200')
    note(b, ox + 0.34 * K, oy - 1.05 * K, ox + 0.32 * K, oy - 0.62 * K, 'капельник')
    note(b, ox + 0.14 * K, oy - 0.83 * K, ox + 0.06 * K, oy - 0.78 * K, 'подшив вагонкой')
    note(b, ox + 0.2 * K, oy + 0.01 * K, ox + 0.2 * K, oy + 0.1 * K, 'террасная доска 28')
    b.push(txt(x + 10, y + H - 12, 'Высокий борт — 3,72 м, свес 50 мм по скату', { size: 7.4, fill: DIM }))
  }

  // ================= 5. ОКНО В ПОЛ
  {
    const x = cols[1]
    const y = rows[1]
    b.push(...box(x, y, W, H, '5. Окно ОТ-1 — примыкание', '1:10'))
    const ox = x + 110
    const oy = y + 210 // пол
    // пол
    b.push(rect(ox - 0.1 * K, oy, 0.6 * K, 0.061 * K, { fill: '#e2cfae', stroke: '#8a6a44', sw: 0.9 }))
    // стойки
    b.push(rect(ox + 0.04 * K, oy - 0.9 * K, 0.04 * K, 0.9 * K, { fill: INSUL, stroke: '#8a6a44', sw: 0.8 }))
    b.push(rect(ox + 0.19 * K, oy - 0.9 * K, 0.04 * K, 0.9 * K, { fill: INSUL, stroke: '#8a6a44', sw: 0.8 }))
    // рама
    b.push(rect(ox + 0.08 * K, oy - 0.92 * K, 0.03 * K, 0.55 * K, { fill: '#3d4348', stroke: '#22262a', sw: 0.8 }))
    b.push(rect(ox + 0.16 * K, oy - 0.92 * K, 0.03 * K, 0.55 * K, { fill: '#3d4348', stroke: '#22262a', sw: 0.8 }))
    // стеклопакет
    b.push(rect(ox + 0.11 * K, oy - 0.9 * K, 0.05 * K, 0.5 * K, { fill: '#dfeaf0', stroke: '#5a6b72', sw: 0.7 }))
    b.push(line(ox + 0.135 * K, oy - 0.9 * K, ox + 0.135 * K, oy - 0.4 * K, { stroke: '#9fb6c0', w: 0.8 }))
    // подоконник-отлив
    b.push(rect(ox + 0.05 * K, oy - 0.92 * K, 0.18 * K, 0.012 * K, { fill: STEEL, stroke: '#5f6b72', sw: 0.7 }))
    b.push(rect(ox + 0.03 * K, oy - 0.94 * K, 0.03 * K, 0.02 * K, { fill: '#e7e1d6', stroke: '#a98f62', sw: 0.7 }))
    // наружная обшивка
    b.push(rect(ox + 0.01 * K, oy - 0.92 * K, 0.02 * K, 0.9 * K, { fill: '#c89a63', stroke: '#8a6a44', sw: 0.7 }))

    note(b, ox + 0.135 * K, oy - 0.7 * K, ox + 0.22 * K, oy - 0.7 * K, 'стеклопакет 2-кам.')
    note(b, ox + 0.11 * K, oy - 0.9 * K, ox - 0.04 * K, oy - 1.0 * K, 'рама алюм. 60 мм', 'end')
    note(b, ox + 0.1 * K, oy - 0.915 * K, ox - 0.04 * K, oy - 0.8 * K, 'отлив с уклоном 5°', 'end')
    note(b, ox + 0.06 * K, oy + 0.03 * K, ox - 0.04 * K, oy + 0.14 * K, 'пол: доска 36 + 25', 'end')
    note(b, ox + 0.21 * K, oy - 0.4 * K, ox + 0.22 * K, oy - 0.34 * K, 'усиленная стойка')
    b.push(txt(x + 10, y + H - 12, 'Проём 3 100 × 2 260, порог на 0,000, импост через 775 мм', { size: 7.4, fill: DIM }))
  }

  // ================= 6. ПРОХОД ДЫМОХОДА
  {
    const x = cols[2]
    const y = rows[1]
    b.push(...box(x, y, W, H, '6. Проход дымохода', '1:10'))
    const ox = x + 150
    const oy = y + 190
    // кровля (наклон вправо вниз)
    b.push(
      poly(
        [
          [ox - 0.5 * K, oy - 0.5 * K],
          [ox + 0.5 * K, oy - 0.5 * K + 0.5 * K * 0.173],
          [ox + 0.5 * K, oy - 0.5 * K + 0.5 * K * 0.173 + 0.29 * K],
          [ox - 0.5 * K, oy - 0.5 * K + 0.29 * K],
        ],
        { fill: '#f4ece0', stroke: '#8a6a44', sw: 0.9 }
      )
    )
    b.push(
      poly(
        [
          [ox - 0.5 * K, oy - 0.5 * K - 0.075 * K],
          [ox + 0.5 * K, oy - 0.5 * K + 0.5 * K * 0.173 - 0.075 * K],
          [ox + 0.5 * K, oy - 0.5 * K + 0.5 * K * 0.173],
          [ox - 0.5 * K, oy - 0.5 * K],
        ],
        { fill: '#31363a', stroke: '#1d2124', sw: 0.8 }
      )
    )
    // короб разделки
    b.push(rect(ox - 0.13 * K, oy - 0.5 * K - 0.2 * K, 0.26 * K, 0.42 * K, { fill: '#f7f4ee', stroke: '#7d848a', sw: 1 }))
    // труба
    b.push(rect(ox - 0.075 * K, oy - 0.62 * K, 0.15 * K, 0.62 * K, { fill: '#cfd6da', stroke: '#5f6b72', sw: 1 }))
    b.push(line(ox - 0.075 * K, oy - 0.5 * K, ox - 0.075 * K, oy - 0.62 * K, { stroke: '#5f6b72', w: 0.8 }))
    // фартук
    b.push(
      poly(
        [
          [ox - 0.18 * K, oy - 0.5 * K - 0.075 * K],
          [ox - 0.08 * K, oy - 0.62 * K],
          [ox + 0.08 * K, oy - 0.62 * K],
          [ox + 0.18 * K, oy - 0.5 * K + 0.18 * K * 0.173 - 0.075 * K],
        ],
        { fill: 'none', stroke: STEEL, sw: 1.2 }
      )
    )
    note(b, ox, oy - 0.68 * K, ox + 1, oy - 0.76 * K, 'труба-сэндвич ⌀150 / 200')
    note(b, ox + 0.12 * K, oy - 0.6 * K, ox + 0.18 * K, oy - 0.68 * K, 'короб 260×360')
    note(b, ox + 0.14 * K, oy - 0.45 * K, ox + 0.2 * K, oy - 0.4 * K, 'фартук + герметик')
    note(b, ox - 0.3 * K, oy - 0.44 * K, ox - 0.2 * K, oy - 0.3 * K, 'вата 200 с зазором 50', 'end')
    b.push(txt(x + 10, y + H - 12, 'Расстояние до сгораемых — 50 мм, разделка по КМ', { size: 7.4, fill: DIM }))
  }

  return sheet({
    num: 7,
    title: 'Узлы',
    subtitle: 'Шесть ключевых узлов каркаса, кровли и инженерных проходов',
    scale: '1:10',
    body: b.join('\n'),
    note: 'Узлы принципиальные: размеры уточняются по месту. Все деревянные элементы — антисептированные, крепёж — оцинкованный.',
  })
}

function path_line(x1, y1, x2, y2) {
  return line(x1, y1, x2, y2, { stroke: '#7d848a', w: 1.6 })
}
function path_half(x, y) {
  return (
    poly(
      [
        [x - 12, y],
        [x - 12, y + 4],
        [x + 12, y + 4],
        [x + 12, y],
      ],
      { fill: 'none', stroke: STEEL, sw: 1 }
    ) + poly([[x - 12, y], [x + 12, y], [x + 12, y + 10], [x - 12, y + 10]], { fill: 'none', stroke: STEEL, sw: 1.4 })
  )
}
