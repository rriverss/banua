import * as model from './project.js'
import { bom, bomCsv, stats } from './bom.js'
import { SHEETS } from './sheets/index.js'

export const id = 'margo-6x45'
export const title = 'Баня «Марго»'
export const size = '6,0 × 4,5 м + терраса 2,5 м'
export const tagline = 'Парная, мойка и комната отдыха со сводом; витраж 6 м в торце'
export const badge = 'баня'
export const order = 2

export const cameras = {
  general: { pos: [14.8, 8.2, 16.6], target: [3, 1.55, 2.6] },
  front: { pos: [3, 3.0, 16.8], target: [3, 2.2, 4.0] },
  back: { pos: [3, 3.4, -10.2], target: [3, 1.8, 1.5] },
  side: { pos: [16.8, 3.4, 3.2], target: [3, 1.8, 3.0] },
  top: { pos: [3.2, 18.5, 3.6], target: [3, 0, 3.6] },
  inside: { pos: [1.45, 1.62, 1.05], target: [2.6, 1.5, 6.0] },
  steam: { pos: [3.35, 1.6, 1.95], target: [5.1, 1.0, 0.7] },
  terrace: { pos: [8.6, 2.1, 9.2], target: [2.8, 1.3, 5.2] },
}

export const cameraNames = [
  ['general', 'Общий вид'],
  ['front', 'Главный фасад'],
  ['back', 'Задний фасад'],
  ['side', 'Боковой фасад'],
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
