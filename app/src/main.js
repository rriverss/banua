import './styles.css'
import { PROJECTS, projectFromUrl, rememberProject, buildAreaOf } from './projects/index.js'
import { createTabs } from './ui/tabs.js'
import { renderViewer } from './ui/viewerTab.js'

const active = projectFromUrl()
rememberProject(active.id)
const tabs = createTabs(active)

const money = (v) => `${Math.round(v / 1000).toLocaleString('ru-RU')} тыс. ₽`
const num = (v, d = 1) => v.toFixed(d).replace('.', ',')

/* ------------------------------------------------------------ выбор проекта */
function selectProject(id) {
  const url = new URL(window.location.href)
  if (id === active.id) {
    url.searchParams.delete('p')
  } else {
    url.searchParams.set('p', id)
  }
  rememberProject(id)
  window.location.href = url.toString()
}

function projectCards() {
  return PROJECTS.map((p) => {
    const s = p.summary
    const on = p.id === active.id
    return `
      <article class="pcard${on ? ' pcard-on' : ''}">
        <div class="pcard-head">
          <span class="pcard-badge">${p.badge}</span>
          <span class="pcard-size">${p.size}</span>
        </div>
        <h2>${p.title}</h2>
        <p class="pcard-tag">${p.tagline}</p>
        <div class="pcard-grid">
          <div><span>Тёплый контур</span><b>${num(s.heated)} м²</b></div>
          <div><span>Терраса</span><b>${num(s.terrace)} м²</b></div>
          <div><span>Кровля</span><b>${num(s.roof, 0)} м²</b></div>
          <div><span>Сваи</span><b>${s.piles} шт.</b></div>
          <div><span>Листов</span><b>${s.sheets}</b></div>
          <div><span>Смета</span><b>${money(s.budget)}</b></div>
        </div>
        <div class="pcard-foot">
          ${
            on
              ? '<span class="pcard-current">Открыт сейчас</span>'
              : `<button class="btn" data-open="${p.id}">Открыть проект</button>`
          }
        </div>
      </article>`
  }).join('')
}

function renderProjects(host) {
  const rows = [
    ['Габарит', (p) => p.size],
    ['Площадь тёплого контура', (p) => `${num(p.summary.heated)} м²`],
    ['Терраса', (p) => `${num(p.summary.terrace)} м²`],
    ['Площадь застройки', (p) => `${num(buildAreaOf(p))} м²`],
    ['Кровля', (p) => `${num(p.summary.roof, 0)} м², ${p.model.project.roof.pitch}°`],
    ['Свай', (p) => `${p.summary.piles} шт.`],
    ['Материалы', (p) => money(p.summary.materials)],
    ['Работы', (p) => money(p.summary.works)],
    ['Итого', (p) => money(p.summary.budget)],
    ['₽ за м² тёплого контура', (p) => `${Math.round(p.summary.budget / p.summary.heated).toLocaleString('ru-RU')} ₽`],
  ]
  host.innerHTML = `
    <div class="wrap">
      <div class="eyebrow">Каталог</div>
      <h1 class="h1">Два проекта — выберите свой</h1>
      <p class="lead">Оба варианта собраны по одной технологии (винтовые сваи, каркас 45×195, фальц)
      и посчитаны из своих моделей: 3D, семь листов, ведомость и смета у каждого свои.
      Переключение — в шапке, выбор запоминается.</p>

      <div class="pcards">${projectCards()}</div>

      <h2 class="h2" style="margin-top:38px">Сравнение по цифрам</h2>
      <table class="ptable">
        <thead>
          <tr><th>Показатель</th>${PROJECTS.map((p) => `<th${p.id === active.id ? ' class="is-on"' : ''}>${p.title}<br /><small>${p.size}</small></th>`).join('')}</tr>
        </thead>
        <tbody>
          ${rows
            .map(
              ([name, fn]) =>
                `<tr><td>${name}</td>${PROJECTS.map(
                  (p) => `<td${p.id === active.id ? ' class="is-on"' : ''}>${fn(p)}</td>`
                ).join('')}</tr>`
            )
            .join('')}
        </tbody>
      </table>
      <p class="small muted" style="margin-top:14px">Комнаты: ${PROJECTS.map(
        (p) => `<b>${p.size}</b> — ${p.model.rooms.map((r) => `${r.name} ${num(r.area)}`).join(', ')}`
      ).join('<br />')}</p>
    </div>`

  host.querySelectorAll('[data-open]').forEach((b) => {
    b.addEventListener('click', () => selectProject(b.dataset.open))
  })
}

/* ----------------------------------------------------------------- контент */
const ROUTES = {
  projects: { title: 'Проекты', render: renderProjects },
  '3d': { title: '3D-модель', render: (host) => renderViewer(host, active) },
  schemes: { title: 'Схемы', render: (host) => tabs.renderSchemes(host) },
  materials: { title: 'Материалы', render: (host) => tabs.renderMaterials(host) },
  budget: { title: 'Смета', render: (host) => tabs.renderBudget(host) },
  guide: { title: 'Технология', render: (host) => tabs.renderGuide(host) },
  album: { title: 'Альбом', render: (host) => tabs.renderAlbum(host) },
}

const app = document.getElementById('app')
let dispose = null

function currentRoute() {
  const h = window.location.hash.replace(/^#\/?/, '')
  return ROUTES[h] ? h : '3d'
}

function paintHeader() {
  const brand = document.querySelector('.brand-text')
  if (brand) {
    brand.innerHTML = `<b>${active.model.project.title.toUpperCase()}</b>
      <small>${active.size} · тёплых ${num(active.summary.heated)} м² · терраса ${num(active.summary.terrace)} м² · каркас</small>`
  }
  const sw = document.getElementById('project-switch')
  if (sw) {
    sw.innerHTML = PROJECTS.map(
      (p) =>
        `<button class="psw${p.id === active.id ? ' on' : ''}" data-project="${p.id}" title="${p.tagline}">${p.size.split(' + ')[0]}</button>`
    ).join('')
    sw.querySelectorAll('[data-project]').forEach((b) => {
      b.addEventListener('click', () => selectProject(b.dataset.project))
    })
  }
}

async function render() {
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
  document.title = `${ROUTES[route].title} · ${active.title} ${active.size}`
  paintHeader()
  try {
    const result = await ROUTES[route].render(app)
    if (typeof result === 'function') dispose = result
  } catch (e) {
    app.innerHTML = `<div class="wrap"><h1 class="h1">Не удалось открыть раздел</h1>
      <p class="muted">${e.message}</p><p class="small muted">${String(e.stack || '').split('\n')[1] || ''}</p></div>`
    console.error(e)
  }
  window.scrollTo({ top: 0 })
}

window.addEventListener('hashchange', render)
render()
