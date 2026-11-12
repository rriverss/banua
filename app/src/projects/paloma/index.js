import * as model from './project.js'
import { bom, bomCsv, stats } from './bom.js'
import { SHEETS } from './sheets/index.js'

export const id = 'paloma'
export const title = 'Баня «Палома»'
export const size = '11,0 × 6,5 м'
export const tagline = 'Комната отдыха, парная и душевая + Г-образная терраса 32 м² под односкатной кровлей'
export const badge = 'баня'
export const order = 2

export const cameras = {
  general: { pos: [24.0, 9.6, 22.0], target: [5.2, 1.8, 3.2] },
  front: { pos: [5.6, 4.6, 25.0], target: [5.6, 2.1, 4.2] },
  back: { pos: [5.6, 4.4, -15.0], target: [5.6, 1.7, 1.6] },
  side: { pos: [-14.5, 4.2, 3.4], target: [2.6, 1.7, 3.2] },
  top: { pos: [5.5, 21.0, 3.6], target: [5.5, 0, 3.3] },
  terrace: { pos: [-1.8, 2.3, 10.0], target: [3.6, 1.5, 4.4] },
  inside: { pos: [4.6, 1.75, 0.7], target: [7.6, 1.8, 4.3] },
  steam: { pos: [8.25, 1.6, 4.6], target: [10.5, 1.1, 3.1] },
}

export const cameraNames = [
  ['general', 'Общий вид'],
  ['front', 'Фасад к террасе'],
  ['back', 'Задний фасад'],
  ['side', 'Западный фасад'],
  ['top', 'Сверху'],
  ['terrace', 'Терраса'],
  ['inside', 'Комната отдыха'],
  ['steam', 'Парная'],
]

export const summary = {
  heated: model.totalArea,
  terrace: model.terraceArea,
  roof: model.roofArea.total,
  piles: model.pilePositions.length,
  budget: bom.total,
  materials: bom.materialsTotal,
  works: bom.worksTotal,
  rooms: model.rooms.filter((r) => r.id !== 'ter').length,
  sheets: SHEETS.length,
}

export { model, bom, bomCsv, stats, SHEETS }
