import { createViewer } from '../scene/viewer.js'
import { LAYERS } from '../scene/materials.js'
import { stats, bom } from '../model/bom.js'
import { totalArea, terraceArea, roofArea, project } from '../model/project.js'

const CAMERAS = [
  ['general', 'Общий вид'],
  ['front', 'Главный фасад'],
  ['back', 'Задний фасад'],
  ['side', 'Боковой фасад'],
  ['top', 'Сверху'],
  ['terrace', 'Терраса'],
  ['inside', 'Гостиная'],
  ['steam', 'Сауна'],
]

export function renderViewer(host) {
  host.innerHTML = `
    <section class="viewer-shell">
      <div id="canvas-host"></div>

      <aside class="vpanel vpanel-left">
        <div class="vpanel-title"><span>Слои модели</span><span class="vbadge">10</span></div>
        <div id="layers"></div>
        <div class="vsep"></div>
        <div class="vpanel-title"><span>Разрез</span></div>
        <div class="chips" id="clips">
          <button class="chip active" data-clip="off">Нет</button>
          <button class="chip" data-clip="z">По Z</button>
          <button class="chip" data-clip="x">По X</button>
        </div>
        <div class="vsep"></div>
        <div class="vpanel-title"><span>Камера</span></div>
        <div class="chips" id="cams">
          ${CAMERAS.map(
            ([k, n], i) => `<button class="chip${i === 0 ? ' active' : ''}" data-cam="${k}">${n}</button>`
          ).join('')}
        </div>
      </aside>

      <div class="viewer-tag">
        <b>${project.title} · ${project.subtitle}</b>
        <span>Каркас 45×195, шаг 600 · утепление 195 мм<br />Винтовые сваи 20 шт. · кровля 30°</span>
      </div>

      <div class="vpanel vpanel-bottom">
        <span class="vbadge"><b style="color:var(--gold)">${stats.piles}</b> свай</span>
        <span class="vbadge"><b style="color:var(--gold)">${totalArea.toFixed(1).replace('.', ',')}</b> м² тёплый контур</span>
        <span class="vbadge"><b style="color:var(--gold)">${terraceArea.toFixed(0)}</b> м² терраса</span>
        <span class="vbadge"><b style="color:var(--gold)">${roofArea.total.toFixed(0)}</b> м² кровля</span>
        <span class="vbadge"><b style="color:var(--gold)">${Math.round(bom.materialsTotal / 1000)}</b> тыс. ₽ материалы</span>
        <span class="vhint">ЛКМ — вращать · колесо — зум · ПКМ — сдвиг</span>
      </div>
    </section>
  `

  const canvasHost = host.querySelector('#canvas-host')
  const viewer = createViewer(canvasHost)

  const layersBox = host.querySelector('#layers')
  layersBox.innerHTML = LAYERS.map(
    (l) => `
    <label class="layer">
      <input type="checkbox" data-layer="${l.id}" ${l.id === 'insulation' ? '' : 'checked'} />
      <span>${l.name}<small>${l.hint}</small></span>
    </label>`
  ).join('')

  layersBox.addEventListener('change', (e) => {
    const id = e.target.dataset.layer
    if (!id) return
    viewer.setLayer(id, e.target.checked)
  })

  host.querySelector('#clips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-clip]')
    if (!b) return
    host.querySelectorAll('#clips .chip').forEach((c) => c.classList.toggle('active', c === b))
    host.querySelectorAll('#layers input').forEach((i) => {})
    viewer.setClip(b.dataset.clip)
    // в разрезе логично скрыть фасад и кровлю, чтобы видеть конструкцию
    if (b.dataset.clip !== 'off') {
      viewer.setLayer('facade', false)
      viewer.setLayer('insulation', true)
      host.querySelector('[data-layer="facade"]').checked = false
      host.querySelector('[data-layer="insulation"]').checked = true
    }
  })

  host.querySelector('#cams').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cam]')
    if (!b) return
    host.querySelectorAll('#cams .chip').forEach((c) => c.classList.toggle('active', c === b))
    viewer.flyTo(b.dataset.cam)
  })

  window.addEventListener('resize', viewer.resize)

  return () => {
    window.removeEventListener('resize', viewer.resize)
    viewer.dispose()
  }
}
