import { setStamp } from '../../../schematics/svg.js'
import { planSheet } from './plan.js'
import { foundationSheet } from './foundation.js'
import { sectionSheet } from './section.js'
import { wallSheet } from './wall.js'
import { facadeSheet } from './facade.js'
import { roofSheet } from './roof.js'
import { nodesSheet } from './nodes.js'

const STAMP = 'БАНЯ «ПАЛОМА» 11,0 × 6,5 + терраса'
/** Перед отрисовкой листа выставляем штамп своего проекта. */
const stamp = (fn) => () => {
  setStamp(STAMP)
  return fn()
}

export const SHEETS = [
  { id: 'plan', title: 'План на отм. 0,000', note: 'Планировка, оси, проёмы, оборудование, экспликация', fn: stamp(planSheet) },
  { id: 'foundation', title: 'План свайного поля', note: '23 винтовые сваи ⌀108×2400, обвязка 150×150, забирка', fn: stamp(foundationSheet) },
  { id: 'section', title: 'Разрез 1–1', note: 'Отметки, односкатная кровля, слои стены/пола/кровли', fn: stamp(sectionSheet) },
  { id: 'wall', title: 'Стена по оси 2', note: 'Развёртка 5 000, шаг 600, дверь и окно в пол', fn: stamp(wallSheet) },
  { id: 'roof', title: 'План кровли', note: 'Скат 9,8°, прогоны, водосток, дымоход', fn: stamp(roofSheet) },
  { id: 'facade', title: 'Фасад 1–5', note: 'Панорама 3,1 м, терраса, односкатная кровля', fn: stamp(facadeSheet) },
  { id: 'nodes', title: 'Узлы', note: '6 узлов: свая, стена, карнизы, окно, дымоход', fn: stamp(nodesSheet) },
]
