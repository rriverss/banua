import './styles.css'
import { renderViewer } from './ui/viewerTab.js'
import { renderSchemes, renderMaterials, renderBudget, renderGuide, renderAlbum } from './ui/tabs.js'

const ROUTES = {
  '3d': { title: '3D-модель', render: renderViewer },
  schemes: { title: 'Схемы', render: renderSchemes },
  materials: { title: 'Материалы', render: renderMaterials },
  budget: { title: 'Смета', render: renderBudget },
  guide: { title: 'Технология', render: renderGuide },
  album: { title: 'Альбом', render: renderAlbum },
}

const app = document.getElementById('app')
let dispose = null

function currentRoute() {
  const h = window.location.hash.replace(/^#\/?/, '')
  return ROUTES[h] ? h : '3d'
}

function render() {
  const route = currentRoute()
  if (dispose) {
    try {
      dispose()
    } catch (e) {
      console.warn(e)
    }
    dispose = null
  }
  app.innerHTML = ''
  document.querySelectorAll('#tabs a').forEach((a) => {
    a.classList.toggle('active', a.dataset.route === route)
  })
  document.title = `${ROUTES[route].title} · Баня «Марго» — проект 6×4,5`
  const result = ROUTES[route].render(app)
  if (typeof result === 'function') dispose = result
  window.scrollTo({ top: 0 })
}

window.addEventListener('hashchange', render)
render()
