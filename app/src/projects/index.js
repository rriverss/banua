import * as p10 from './margo-10x95/index.js'
import * as p6 from './margo-6x45/index.js'

/** Все проекты в порядке показа. Каждый — самостоятельная модель + смета + листы. */
export const PROJECTS = [p10, p6].sort((a, b) => a.order - b.order)
export const DEFAULT_ID = PROJECTS[0].id

export function getProject(id) {
  return PROJECTS.find((p) => p.id === id) || PROJECTS[0]
}

export function projectFromUrl() {
  const q = new URLSearchParams(window.location.search).get('p')
  const saved = window.localStorage.getItem('banua.project')
  return getProject(q || saved || DEFAULT_ID)
}

export function rememberProject(id) {
  try {
    window.localStorage.setItem('banua.project', id)
  } catch (e) {
    /* приватный режим — просто игнорируем */
  }
}

/** 3D-сборка грузится лениво: списку проектов three.js не нужен. */
const SCENES = {
  'margo-10x95': () => import('./margo-10x95/scene.js'),
  'margo-6x45': () => import('./margo-6x45/scene.js'),
}

export async function loadScene(id) {
  const loader = SCENES[id] || SCENES[DEFAULT_ID]
  return loader()
}

/** Площадь застройки: в новых моделях — buildArea, в старых считаем по габариту. */
export function buildAreaOf(p) {
  const d = p.model.project.dims
  return p.model.buildArea || (d.W ?? d.L) * (d.D ?? d.depth)
}
