import { sheet, txt, line, rect, poly, circle, INK, DIM, ACCENT } from '../../../schematics/svg.js'

const W = 380
const H = 310

function card(x, y, n, title, subtitle, draw) {
  return `
  <g>
    ${rect(x, y, W, H, { fill: '#fffdf9', stroke: '#cfc7b8', sw: 1 })}
    ${rect(x, y, W, 34, { fill: '#f3ede1', stroke: '#cfc7b8', sw: 1 })}
    ${circle(x + 20, y + 17, 11, { fill: ACCENT, stroke: ACCENT })}
    ${txt(x + 20, y + 21.5, String(n), { size: 11, anchor: 'middle', fill: '#fff', weight: 700 })}
    ${txt(x + 40, y + 15, title, { size: 10.5, weight: 700 })}
    ${txt(x + 40, y + 28, subtitle, { size: 8, fill: DIM })}
    ${draw(x, y)}
  </g>`
}

const lead = (x1, y1, x2, y2, text, anchor = 'start') => {
  const tw = text.length * 4.1 + 8
  const bx = anchor === 'start' ? x2 + 1 : x2 - tw - 1
  return (
    line(x1, y1, x2, y2, { stroke: '#8a8376', w: 0.8 }) +
    circle(x1, y1, 1.8, { fill: '#8a8376' }) +
    rect(bx, y2 - 8, tw, 12, { fill: '#fffdf9', stroke: 'none', sw: 0, opacity: 0.92 }) +
    txt(x2 + (anchor === 'start' ? 4 : -4), y2 + 3, text, { size: 8, fill: '#3d3a34', anchor })
  )
}

// --- узел 1: свая / обвязка / лага
const node1 = (ox, oy) =>
  '<g transform="translate(0,26)">' +
  [
    // грунт
    rect(ox + 20, oy + 210, 340, 70, { fill: 'url(#soil)', stroke: 'none', opacity: 0.6 }),
    line(ox + 20, oy + 210, ox + 360, oy + 210, { stroke: '#6b665c', w: 1.4 }),
    txt(ox + 26, oy + 224, 'грунт', { size: 7.5, fill: '#6b665c' }),
    // свая
    rect(ox + 168, oy + 78, 16, 132, { fill: 'url(#concrete)', stroke: '#6b665c', sw: 0.8 }),
    poly(
      [
        [ox + 168, oy + 210],
        [ox + 184, oy + 210],
        [ox + 176, oy + 228],
      ],
      { fill: 'url(#concrete)', stroke: '#6b665c', sw: 0.8 }
    ),
    // оголовок
    rect(ox + 152, oy + 70, 48, 8, { fill: '#9aa3a8', stroke: '#4d5357', sw: 0.8 }),
    // обвязка
    rect(ox + 120, oy + 44, 140, 26, { fill: '#d9a568', stroke: '#8a6a44', sw: 0.9 }),
    // лага
    rect(ox + 96, oy + 22, 190, 22, { fill: '#e6bd8c', stroke: '#8a6a44', sw: 0.9 }),
    // настил
    rect(ox + 96, oy + 14, 190, 8, { fill: '#e3cb9f', stroke: '#a98f62', sw: 0.8 }),
    // анкер
    line(ox + 176, oy + 44, ox + 176, oy + 78, { stroke: '#4d5357', w: 1.6, dash: '4 2' }),
    lead(ox + 178, oy + 150, ox + 268, oy + 150, 'свая ⌀108×2500', 'start'),
    lead(ox + 152, oy + 74, ox + 252, oy + 96, 'оголовок 200×200', 'start'),
    lead(ox + 258, oy + 58, ox + 276, oy + 64, 'обвязка 150×150', 'start'),
    lead(ox + 284, oy + 33, ox + 300, oy + 26, 'лага 45×195', 'start'),
    txt(ox + 26, oy + 240, 'продув ≥100 мм, анкеровка 4×М12', { size: 7.5, fill: DIM }),
  ].join('') + '</g>'

// --- узел 2: стена на перекрытии
const node2 = (ox, oy) =>
  [
    // перекрытие
    rect(ox + 40, oy + 190, 300, 20, { fill: '#e6bd8c', stroke: '#8a6a44', sw: 0.9 }),
    txt(ox + 46, oy + 204, 'лага 45×195', { size: 7.5, fill: '#4a4438' }),
    rect(ox + 40, oy + 176, 300, 14, { fill: '#e3cb9f', stroke: '#a98f62', sw: 0.8 }),
    rect(ox + 40, oy + 168, 300, 8, { fill: '#b58359', stroke: '#7d5533', sw: 0.8 }),
    // стена
    rect(ox + 120, oy + 118, 20, 50, { fill: '#d9a568', stroke: '#8a6a44', sw: 0.9 }),
    rect(ox + 140, oy + 60, 160, 108, { fill: 'url(#insul)', stroke: '#c9a35b', sw: 0.8 }),
    rect(ox + 300, oy + 60, 10, 108, { fill: '#e3cb9f', stroke: '#a98f62', sw: 0.8 }),
    rect(ox + 310, oy + 60, 8, 108, { fill: '#ecebe6', stroke: '#b9b2a5', sw: 0.6 }),
    rect(ox + 318, oy + 60, 14, 108, { fill: '#b07c4a', stroke: '#7d5533', sw: 0.8 }),
    rect(ox + 126, oy + 60, 14, 108, { fill: '#cfd8de', stroke: '#9aa3a8', sw: 0.6 }),
    rect(ox + 110, oy + 60, 10, 108, { fill: '#f3e0bd', stroke: '#c9a35b', sw: 0.8 }),
    // обвязка
    rect(ox + 110, oy + 112, 32, 12, { fill: '#d9a568', stroke: '#8a6a44', sw: 0.8 }),
    // отлив
    poly(
      [
        [ox + 300, oy + 60],
        [ox + 336, oy + 48],
        [ox + 336, oy + 54],
        [ox + 300, oy + 66],
      ],
      { fill: '#9aa3a8', stroke: '#4d5357', sw: 0.7 }
    ),
    lead(ox + 130, oy + 84, ox + 26, oy + 62, 'вагонка 16', 'start'),
    lead(ox + 126, oy + 104, ox + 26, oy + 100, 'пароизоляция', 'start'),
    lead(ox + 200, oy + 100, ox + 200, oy + 40, 'каркас 195 + вата', 'start'),
    lead(ox + 322, oy + 90, ox + 286, oy + 128, 'имитация 20', 'start'),
    lead(ox + 306, oy + 172, ox + 340, oy + 190, 'ОСП-3 9', 'start'),
    txt(ox + 40, oy + 234, 'Нижняя обвязка 45×195, крепление к лагам 2×5×120', { size: 7.5, fill: DIM }),
  ].join('')

// --- узел 3: карниз
const node3 = (ox, oy) =>
  '<g transform="translate(0,16)">' +
  [
    // стена
    rect(ox + 30, oy + 90, 60, 170, { fill: 'url(#insul)', stroke: '#c9a35b', sw: 0.8 }),
    rect(ox + 24, oy + 90, 8, 170, { fill: '#f3e0bd', stroke: '#c9a35b', sw: 0.6 }),
    rect(ox + 88, oy + 90, 10, 170, { fill: '#b07c4a', stroke: '#7d5533', sw: 0.6 }),
    // стропило
    poly(
      [
        [ox + 90, oy + 96],
        [ox + 300, oy + 40],
        [ox + 300, oy + 60],
        [ox + 90, oy + 116],
      ],
      { fill: '#d9a568', stroke: '#8a6a44', sw: 0.9 }
    ),
    // контробрешётка + обрешётка + металл
    poly(
      [
        [ox + 92, oy + 84],
        [ox + 300, oy + 28],
        [ox + 300, oy + 36],
        [ox + 92, oy + 92],
      ],
      { fill: '#e6bd8c', stroke: '#8a6a44', sw: 0.7 }
    ),
    poly(
      [
        [ox + 92, oy + 78],
        [ox + 302, oy + 22],
        [ox + 302, oy + 26],
        [ox + 92, oy + 82],
      ],
      { fill: '#8b4038', stroke: '#5d2b26', sw: 0.8 }
    ),
    // капельник
    poly(
      [
        [ox + 296, oy + 22],
        [ox + 316, oy + 16],
        [ox + 316, oy + 34],
        [ox + 302, oy + 28],
      ],
      { fill: '#9aa3a8', stroke: '#4d5357', sw: 0.7 }
    ),
    // лобовая доска
    rect(ox + 296, oy + 60, 10, 90, { fill: '#d9a568', stroke: '#8a6a44', sw: 0.8 }),
    // софит
    rect(ox + 200, oy + 148, 106, 8, { fill: '#f3e0bd', stroke: '#c9a35b', sw: 0.7 }),
    // кронштейн вентзазора
    rect(ox + 96, oy + 100, 8, 60, { fill: '#d9a568', stroke: '#8a6a44', sw: 0.6 }),
    lead(ox + 200, oy + 44, ox + 210, oy + 18, 'фальц RAL 7021', 'start'),
    lead(ox + 150, oy + 100, ox + 120, oy + 140, 'контробрешётка 50×50', 'start'),
    lead(ox + 96, oy + 126, ox + 24, oy + 170, 'вентзазор 30', 'start'),
    lead(ox + 301, oy + 104, ox + 244, oy + 214, 'лобовая доска', 'start'),
    lead(ox + 240, oy + 152, ox + 260, oy + 182, 'софит с сеткой', 'start'),
    txt(ox + 30, oy + 276, 'Капельник + сетка от птиц, продув карниза не перекрывать.', { size: 7.5, fill: DIM }),
  ].join('') + '</g>'

// --- узел 4: конёк
const node4 = (ox, oy) =>
  '<g transform="translate(0,14)">' +
  [
    // стропила
    poly(
      [
        [ox + 180, oy + 62],
        [ox + 60, oy + 140],
        [ox + 52, oy + 126],
        [ox + 180, oy + 42],
      ],
      { fill: '#d9a568', stroke: '#8a6a44', sw: 0.9 }
    ),
    poly(
      [
        [ox + 180, oy + 62],
        [ox + 300, oy + 140],
        [ox + 308, oy + 126],
        [ox + 180, oy + 42],
      ],
      { fill: '#d9a568', stroke: '#8a6a44', sw: 0.9 }
    ),
    // прогон
    rect(ox + 165, oy + 42, 30, 56, { fill: '#c9955c', stroke: '#8a6a44', sw: 0.8 }),
    // контробрешётка
    poly(
      [
        [ox + 70, oy + 116],
        [ox + 180, oy + 40],
        [ox + 180, oy + 30],
        [ox + 62, oy + 110],
      ],
      { fill: '#e6bd8c', stroke: '#8a6a44', sw: 0.7 }
    ),
    poly(
      [
        [ox + 290, oy + 116],
        [ox + 180, oy + 40],
        [ox + 180, oy + 30],
        [ox + 298, oy + 110],
      ],
      { fill: '#e6bd8c', stroke: '#8a6a44', sw: 0.7 }
    ),
    // металл
    poly(
      [
        [ox + 58, oy + 104],
        [ox + 178, oy + 26],
        [ox + 302, oy + 104],
        [ox + 302, oy + 112],
        [ox + 178, oy + 34],
        [ox + 58, oy + 112],
      ],
      { fill: '#8b4038', stroke: '#5d2b26', sw: 0.8 }
    ),
    // конёк
    circle(ox + 180, oy + 26, 12, { fill: '#5d2b26', stroke: '#3f1d1a', sw: 0.8 }),
    // уплотнитель
    rect(ox + 160, oy + 36, 40, 6, { fill: '#c94a3f', stroke: '#8a2a22', sw: 0.6 }),
    lead(ox + 190, oy + 24, ox + 262, oy + 58, 'конёк + уплотнитель', 'start'),
    lead(ox + 186, oy + 74, ox + 258, oy + 140, 'прогон 45×195', 'start'),
    lead(ox + 120, oy + 70, ox + 42, oy + 128, 'контробрешётка 50', 'start'),
    txt(ox + 40, oy + 200, 'Зазор для вентиляции 50 мм; стык секций конька — на уплотнителе.', { size: 7.5, fill: DIM }),
  ].join('') + '</g>'

// --- узел 5: оконный проём
const node5 = (ox, oy) =>
  [
    // стойки и перемычка
    rect(ox + 60, oy + 80, 18, 170, { fill: '#e6bd8c', stroke: '#8a6a44', sw: 0.8 }),
    rect(ox + 300, oy + 80, 18, 170, { fill: '#e6bd8c', stroke: '#8a6a44', sw: 0.8 }),
    rect(ox + 60, oy + 80, 258, 20, { fill: '#d9a568', stroke: '#8a6a44', sw: 0.9 }),
    rect(ox + 60, oy + 232, 258, 18, { fill: '#d9a568', stroke: '#8a6a44', sw: 0.9 }),
    // окно
    rect(ox + 86, oy + 108, 208, 118, { fill: '#eef4f6', stroke: '#7d8a90', sw: 1 }),
    line(ox + 190, oy + 108, ox + 190, oy + 226, { stroke: '#7d8a90', w: 1.4 }),
    // пена / ПСУЛ
    rect(ox + 78, oy + 100, 8, 132, { fill: '#f6e2b3', stroke: '#c9a35b', sw: 0.6 }),
    rect(ox + 294, oy + 100, 8, 132, { fill: '#f6e2b3', stroke: '#c9a35b', sw: 0.6 }),
    // отлив
    poly(
      [
        [ox + 78, oy + 238],
        [ox + 310, oy + 238],
        [ox + 322, oy + 252],
        [ox + 66, oy + 252],
      ],
      { fill: '#9aa3a8', stroke: '#4d5357', sw: 0.8 }
    ),
    // подоконник
    rect(ox + 86, oy + 226, 208, 8, { fill: '#f0e6d6', stroke: '#b9a88c', sw: 0.7 }),
    lead(ox + 80, oy + 116, ox + 62, oy + 62, 'ПСУЛ + пена', 'start'),
    lead(ox + 190, oy + 90, ox + 220, oy + 66, 'перемычка 195', 'start'),
    lead(ox + 150, oy + 160, ox + 150, oy + 196, 'стеклопакет 2-кам.', 'start'),
    lead(ox + 190, oy + 250, ox + 230, oy + 268, 'отлив с уклоном 5°', 'start'),
    txt(ox + 40, oy + 288, 'Проём = блок + 20 мм по бокам/сверху, +50 мм снизу (подставочный профиль).', { size: 7.5, fill: DIM }),
  ].join('')

// --- узел 6: проход дымохода
const node6 = (ox, oy) =>
  [
    // кровля
    poly(
      [
        [ox + 30, oy + 150],
        [ox + 340, oy + 210],
        [ox + 340, oy + 226],
        [ox + 30, oy + 166],
      ],
      { fill: '#8b4038', stroke: '#5d2b26', sw: 0.8 }
    ),
    poly(
      [
        [ox + 30, oy + 166],
        [ox + 340, oy + 226],
        [ox + 340, oy + 244],
        [ox + 30, oy + 184],
      ],
      { fill: '#e6bd8c', stroke: '#8a6a44', sw: 0.7 }
    ),
    // труба
    rect(ox + 170, oy + 34, 30, 130, { fill: '#b9c0c4', stroke: '#4d5357', sw: 1 }),
    rect(ox + 163, oy + 26, 44, 12, { fill: '#4d5357' }),
    rect(ox + 176, oy + 60, 18, 100, { fill: '#8b9599', stroke: 'none' }),
    // разделка
    poly(
      [
        [ox + 140, oy + 124],
        [ox + 230, oy + 140],
        [ox + 230, oy + 150],
        [ox + 140, oy + 134],
      ],
      { fill: '#9aa3a8', stroke: '#4d5357', sw: 0.8 }
    ),
    // зазор
    line(ox + 200, oy + 120, ox + 216, oy + 148, { stroke: ACCENT, w: 1, dash: '3 2' }),
    lead(ox + 185, oy + 80, ox + 240, oy + 66, 'сэндвич ⌀115', 'start'),
    lead(ox + 185, oy + 138, ox + 260, oy + 132, 'разделка + зазор 50', 'start'),
    lead(ox + 100, oy + 168, ox + 70, oy + 200, 'обрешётка', 'start'),
    txt(ox + 40, oy + 270, 'Проход через кровлю — только заводским узлом; выше кровли 500 мм.', { size: 7.5, fill: DIM }),
  ].join('')

export function nodesSheet() {
  const body = []
  body.push(txt(36, 52, 'УЗЛЫ КОНСТРУКЦИЙ', { size: 19, weight: 700, letter: 1.2 }))
  body.push(txt(36, 76, 'Шесть узлов, которые определяют долговечность дома: фундамент, стена, карниз, конёк, проём, дымоход', { size: 10.5, fill: DIM }))

  const positions = [
    [36, 94],
    [434, 94],
    [832, 94],
    [36, 430],
    [434, 430],
    [832, 430],
  ]
  const cards = [
    [1, 'Свая → обвязка → лага', 'низ, анкеровка, продув', node1],
    [2, 'Стена на перекрытии', 'обвязка, плёнки, отлив', node2],
    [3, 'Карнизный узел', 'вентзазор, капельник, софит', node3],
    [4, 'Конёк', 'прогон, уплотнитель, вентиляция', node4],
    [5, 'Оконный проём', 'ПСУЛ, пена, откос, отлив', node5],
    [6, 'Проход дымохода', 'разделка, зазор 50 мм', node6],
  ]
  cards.forEach(([n, title, sub, draw], i) => {
    body.push(card(positions[i][0], positions[i][1], n, title, sub, draw))
  })

  return sheet({
    num: 7,
    title: 'Узлы 1–6',
    subtitle: 'Для монтажа и контроля качества. Не заменяют рабочую документацию',
    scale: 'б/м',
    body: body.join('\n'),
    note: 'Узлы принципиальные. При привязке к конкретным материалам уточнить требования производителей (плёнки, крепёж, дымоход).',
  })
}
