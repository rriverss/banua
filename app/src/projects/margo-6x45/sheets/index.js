import { setStamp } from '../../../schematics/svg.js'
import { planSheet } from './plan.js'
import { foundationSheet } from './foundation.js'
import { sectionSheet } from './section.js'
import { wallSheet } from './wall.js'
import { roofSheet } from './roof.js'
import { facadeSheet } from './facade.js'
import { nodesSheet } from './nodes.js'


const STAMP = 'БАНЯ «МАРГО» 6,0 × 4,5 + терраса 2,5'
/** Перед отрисовкой листа выставляем штамп своего проекта. */
const stamp = (fn) => () => {
  setStamp(STAMP)
  return fn()
}

export const SHEETS = [
  { id: 'plan', title: 'План 1-го этажа', note: 'Планировка, оси, проёмы, оборудование, экспликация', fn: stamp(planSheet) },
  { id: 'foundation', title: 'План фундамента', note: '20 винтовых свай, ростверк, примечания по монтажу', fn: stamp(foundationSheet) },
  { id: 'section', title: 'Разрез 1–1', note: 'Отметки, слои стены/пола/кровли, свесы', fn: stamp(sectionSheet) },
  { id: 'wall', title: 'Стена по оси А', note: 'Развёртка 6 000 × 2 700, шаг 600, пирог стены', fn: stamp(wallSheet) },
  { id: 'facade', title: 'Главный фасад', note: 'Витраж 6 м, раскладка фронтона, узлы остекления', fn: stamp(facadeSheet) },
  { id: 'roof', title: 'Стропильная система', note: 'План стропил 25°, деталь, спецификация кровли', fn: stamp(roofSheet) },
  { id: 'nodes', title: 'Узлы 1–6', note: 'Свая, стена на перекрытии, карниз, конёк, проём, дымоход', fn: stamp(nodesSheet) },
]
