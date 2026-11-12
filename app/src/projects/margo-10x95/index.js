import * as model from './project.js'
import { bom, bomCsv, stats } from './bom.js'
import { SHEETS } from './sheets/index.js'

export const id = 'margo-10x95'
export const title = 'Барнхаус «Марго»'
export const size = '10,0 × 9,5 м'
export const tagline = 'Витраж во фронтоне 8 м, Г-образная терраса 30 м², сауна и спальня'
export const badge = 'барнхаус'
export const order = 1

export const cameras = {
  general: { pos: [21.5, 11.5, 22.0], target: [5.0, 2.4, 4.6] },
  front: { pos: [6.0, 4.4, 26.0], target: [6.0, 2.7, 8.0] },
  back: { pos: [6.0, 5.2, -14.0], target: [6.0, 2.6, 3.0] },
  side: { pos: [25.0, 5.4, 4.5], target: [5.0, 2.4, 4.5] },
  top: { pos: [5.5, 27.0, 5.2], target: [5.0, 0, 4.8] },
  inside: { pos: [4.2, 1.7, 4.4], target: [8.0, 2.0, 10.5] },
  steam: { pos: [3.9, 1.65, 2.2], target: [2.4, 1.0, 0.6] },
  terrace: { pos: [1.6, 2.0, 13.0], target: [6.0, 1.8, 7.6] },
}

export const cameraNames = [
  ['general', 'Общий вид'],
  ['front', 'Главный фасад'],
  ['back', 'Задний фасад'],
  ['side', 'Боковой фасад'],
  ['top', 'Сверху'],
  ['terrace', 'Терраса'],
  ['inside', 'Гостиная'],
  ['steam', 'Сауна'],
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
