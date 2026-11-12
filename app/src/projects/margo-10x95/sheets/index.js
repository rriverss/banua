import { setStamp } from '../../../schematics/svg.js'
import { planSheet } from './plan.js'
import { foundationSheet } from './foundation.js'
import { sectionSheet } from './section.js'
import { wallSheet } from './wall.js'
import { roofSheet } from './roof.js'
import { facadeSheet } from './facade.js'
import { nodesSheet } from './nodes.js'


const STAMP = 'БАРНХАУС «МАРГО» 10,0 × 9,5 + терраса'
/** Перед отрисовкой листа выставляем штамп своего проекта. */
const stamp = (fn) => () => {
  setStamp(STAMP)
  return fn()
}

export const SHEETS = [
  { id: 'plan', title: 'План 1-го этажа', note: 'Планировка, оси, проёмы, оборудование, экспликация', fn: stamp(planSheet) },
  { id: 'foundation', title: 'План фундамента', note: '31 винтовая свая, ростверк, каменный цоколь', fn: stamp(foundationSheet) },
  { id: 'section', title: 'Разрез 1–1', note: 'Отметки, свод, слои стены/пола/кровли', fn: stamp(sectionSheet) },
  { id: 'wall', title: 'Стена по оси А', note: 'Развёртка 8 000 × 2 900, шаг 600, пирог стены', fn: stamp(wallSheet) },
  { id: 'facade', title: 'Главный фасад', note: 'Витраж 8 м, дерево фронтона, терраса', fn: stamp(facadeSheet) },
  { id: 'roof', title: 'Стропильная система', note: 'План кровли 30°, стропила, прогоны, обрешётка', fn: stamp(roofSheet) },
  { id: 'nodes', title: 'Узлы 1–6', note: 'Свая, стена на перекрытии, карниз, конёк, проём, дымоход', fn: stamp(nodesSheet) },
]
