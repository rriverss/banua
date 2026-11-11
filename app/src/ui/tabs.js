import { marked } from 'marked'
import { bom, bomCsv, stats } from '../model/bom.js'
import { totalArea, terraceArea, roofArea, project, money, fmt } from '../model/project.js'
import { planSheet } from '../schematics/plan.js'
import { foundationSheet } from '../schematics/foundation.js'
import { sectionSheet } from '../schematics/section.js'
import { wallSheet } from '../schematics/wall.js'
import { roofSheet } from '../schematics/roof.js'
import { nodesSheet } from '../schematics/nodes.js'
import { facadeSheet } from '../schematics/facade.js'

const SHEETS = [
  { id: 'plan', title: 'План 1-го этажа', note: 'Планировка, оси, проёмы, оборудование, экспликация', fn: planSheet },
  { id: 'foundation', title: 'План фундамента', note: '20 винтовых свай, ростверк, примечания по монтажу', fn: foundationSheet },
  { id: 'section', title: 'Разрез 1–1', note: 'Отметки, слои стены/пола/кровли, свесы', fn: sectionSheet },
  { id: 'wall', title: 'Стена А: каркас', note: 'Развёртка 6×2,7, шаг 600, пирог стены', fn: wallSheet },
  { id: 'facade', title: 'Главный фасад', note: 'Витраж, раскладка фронтона, узлы остекления', fn: facadeSheet },
  { id: 'roof', title: 'Стропильная система', note: 'План стропил, деталь, спецификация кровли', fn: roofSheet },
  { id: 'nodes', title: 'Узлы 1–6', note: 'Свая, стена на перекрытии, карниз, конёк, проём, дымоход', fn: nodesSheet },
]

let cache = null
function getSheets() {
  if (cache) return cache
  cache = SHEETS.map((s) => {
    const svg = s.fn()
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    return { ...s, svg, url: URL.createObjectURL(blob) }
  })
  return cache
}

function modal(html) {
  const m = document.getElementById('modal')
  const body = document.getElementById('modal-body')
  body.innerHTML = html
  m.hidden = false
}
function closeModal() {
  document.getElementById('modal').hidden = true
  document.getElementById('modal-body').innerHTML = ''
}
document.addEventListener('click', (e) => {
  if (e.target.id === 'modal-close' || e.target.id === 'modal') closeModal()
})
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal()
})

// ------------------------------------------------------------------ СХЕМЫ
export function renderSchemes(host) {
  const sheets = getSheets()
  host.innerHTML = `
    <div class="wrap">
      <div class="eyebrow">Рабочие чертежи</div>
      <h1 class="h1">Схемы для строительства</h1>
      <p class="lead">Шесть листов, которых достаточно, чтобы собрать баню: план, свайное поле, разрез,
      схема каркаса стены, стропильная система и узлы. Все размеры выведены из 3D-модели — расхождений
      между «картинкой» и чертежом нет.</p>
      <div class="row" style="margin-bottom:18px">
        <span class="pill">М 1:50</span><span class="pill">Размеры в мм</span>
        <span class="pill">Каркас 45×195</span><span class="pill">Сваи ⌀108</span>
        <span class="pill">Кровля 30°</span>
        <button class="btn small" id="dl-all">Скачать все SVG</button>
      </div>
      <div class="scheme-grid">
        ${sheets
          .map(
            (s) => `
          <article class="scheme" data-id="${s.id}">
            <div class="thumb"><img src="${s.url}" alt="${s.title}" loading="lazy" /></div>
            <div class="cap">
              <div><b>${s.title}</b><small>${s.note}</small></div>
              <span class="go">Открыть →</span>
            </div>
          </article>`
          )
          .join('')}
      </div>
    </div>`

  host.querySelectorAll('.scheme').forEach((el) => {
    el.addEventListener('click', () => {
      const s = sheets.find((x) => x.id === el.dataset.id)
      modal(
        `<img src="${s.url}" alt="${s.title}" />
         <div class="modal-actions">
           <a class="btn" href="${s.url}" download="banua-${s.id}.svg">Скачать SVG</a>
           <button class="btn ghost" onclick="window.print()">Печать</button>
         </div>`
      )
    })
  })

  host.querySelector('#dl-all').addEventListener('click', () => {
    sheets.forEach((s, i) => {
      setTimeout(() => {
        const a = document.createElement('a')
        a.href = s.url
        a.download = `banua-0${i + 1}-${s.id}.svg`
        a.click()
      }, i * 250)
    })
  })
}

// --------------------------------------------------------------- МАТЕРИАЛЫ
export function renderMaterials(host) {
  const { groups, materialsTotal } = bom
  host.innerHTML = `
    <div class="wrap">
      <div class="eyebrow">Ведомость материалов</div>
      <h1 class="h1">Материалы: ${fmt(groups.reduce((s, g) => s + g.items.length, 0))} позиций</h1>
      <p class="lead">Количества посчитаны по геометрии проекта с коэффициентами запаса. Цены — розница
      Московской области, ${bom.meta.priceDate}, без скидок. Итог по материалам: <b style="color:var(--gold)">${money(materialsTotal)}</b>.</p>

      <div class="statgrid">
        <div class="stat"><span>Пиломатериал</span><b>${stats.extWoodLen + stats.intWoodLen > 0 ? Math.round((stats.extWoodLen + stats.intWoodLen) * 0.045 * 0.195) : 0} м³</b><em>каркас, лаги, стропила</em></div>
        <div class="stat"><span>Утепление стен</span><b>${stats.insulWalls} м²</b><em>195 мм, 2 слоя</em></div>
        <div class="stat"><span>Кровля</span><b>${stats.roof} м²</b><em>фальц RAL 7021</em></div>
        <div class="stat accent"><span>Материалы</span><b>${money(materialsTotal)}</b><em>${fmt(Math.round(materialsTotal / totalArea))} ₽/м²</em></div>
      </div>

      <div class="row spread" style="margin-bottom:14px">
        <input type="search" id="q" placeholder="Поиск: доска, вата, окно…" />
        <div class="row">
          <span class="pill">Запас 8–12 %</span>
          <button class="btn small" id="csv">Скачать CSV</button>
        </div>
      </div>

      <div class="groups" id="groups">
        ${groups
          .map(
            (g) => `
          <details open data-g="${g.id}">
            <summary><span class="ico">${g.icon}</span>${g.name}
              <span class="cnt">${g.items.length} поз.</span>
              <span class="sum">${money(g.items.reduce((s, i) => s + i.sum, 0))}</span>
            </summary>
            <div class="body">
              <table>
                <thead><tr><th>Наименование</th><th>Ед.</th><th class="num">Кол-во</th><th class="num">Цена</th><th class="num">Сумма</th></tr></thead>
                <tbody>
                  ${g.items
                    .map(
                      (i) => `<tr data-search="${(i.name + ' ' + i.spec).toLowerCase()}">
                        <td>${i.name}<span class="spec">${i.spec}${i.note ? ' · ' + i.note : ''}</span></td>
                        <td>${i.unit}</td>
                        <td class="num">${fmt(i.qty, i.qty % 1 ? 1 : 0)}</td>
                        <td class="num">${fmt(i.price)}</td>
                        <td class="num"><b>${fmt(i.sum)}</b></td>
                      </tr>`
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          </details>`
          )
          .join('')}
      </div>

      <div class="note" style="margin-top:18px">
        <b>Как пользоваться.</b> Ведомость — для закупки и сравнения КП. Перед заказом пиломатериала
        попросите поставщика сделать раскрой по спецификации: это экономит 8–12 % доски. Утеплитель
        берите одной партией, плёнки — с запасом на проклейку 10–15 см.
      </div>
      <p class="small muted" style="margin-top:12px">${bom.meta.disclaimer}</p>
    </div>`

  const q = host.querySelector('#q')
  q.addEventListener('input', () => {
    const v = q.value.trim().toLowerCase()
    host.querySelectorAll('#groups details').forEach((d) => {
      let visible = 0
      d.querySelectorAll('tbody tr').forEach((tr) => {
        const hit = !v || tr.dataset.search.includes(v)
        tr.style.display = hit ? '' : 'none'
        if (hit) visible++
      })
      d.style.display = visible || !v ? '' : 'none'
      if (v) d.open = true
    })
  })

  host.querySelector('#csv').addEventListener('click', () => downloadText('banua-vedomost.csv', bomCsv()))
}

// ------------------------------------------------------------------ СМЕТА
export function renderBudget(host) {
  const groupSums = bom.groups.map((g) => ({ name: g.name, sum: g.items.reduce((s, i) => s + i.sum, 0) }))
  const max = Math.max(...groupSums.map((g) => g.sum))
  const total = bom.total
  host.innerHTML = `
    <div class="wrap">
      <div class="eyebrow">Бюджет</div>
      <h1 class="h1">Смета: ${money(total)}</h1>
      <p class="lead">Материалы + работы без инженерии участка (септик, ввод электричества, водопровод)
      и без отделки премиум-класса. Ниже — три сценария и структура затрат.</p>

      <div class="statgrid">
        <div class="stat"><span>Материалы</span><b>${money(bom.materialsTotal)}</b><em>${Math.round((bom.materialsTotal / total) * 100)} % бюджета</em></div>
        <div class="stat"><span>Работы</span><b>${money(bom.worksTotal)}</b><em>${Math.round((bom.worksTotal / total) * 100)} % бюджета</em></div>
        <div class="stat"><span>Итого</span><b>${money(total)}</b><em>${Math.round(total / totalArea)} ₽/м² тёплого контура</em></div>
        <div class="stat accent"><span>Срок</span><b>7–9 недель</b><em>одна бригада 3 чел.</em></div>
      </div>

      <div class="grid g3" style="margin-bottom:26px">
        <div class="card">
          <div class="eyebrow">Сценарий 1</div>
          <h3 style="margin:0 0 6px">Своими руками</h3>
          <div class="muted small">Материалы + аренда инструмента + доставка</div>
          <div style="font-size:26px;font-weight:600;color:var(--gold);margin:8px 0">${money(bom.materialsTotal + 60000)}</div>
          <div class="muted small">2–3 месяца, 2–3 человека. Экономия ${money(bom.worksTotal)}</div>
        </div>
        <div class="card" style="border-color:#6b5330">
          <div class="eyebrow">Сценарий 2 · рекомендуемый</div>
          <h3 style="margin:0 0 6px">Бригада + материалы</h3>
          <div class="muted small">Под ключ, без участка и благоустройства</div>
          <div style="font-size:26px;font-weight:600;color:var(--gold);margin:8px 0">${money(total)}</div>
          <div class="muted small">7–9 недель. 1 прораб + 3 человека</div>
        </div>
        <div class="card">
          <div class="eyebrow">Сценарий 3</div>
          <h3 style="margin:0 0 6px">С запасом 15 %</h3>
          <div class="muted small">Резерв на подорожание и «сюрпризы»</div>
          <div style="font-size:26px;font-weight:600;color:var(--gold);margin:8px 0">${money(total * 1.15)}</div>
          <div class="muted small">Рекомендую закладывать сразу</div>
        </div>
      </div>

      <div class="card" style="margin-bottom:26px">
        <div class="eyebrow">Структура затрат по разделам</div>
        <div class="bars" style="margin-top:14px">
          ${groupSums
            .map(
              (g) => `<div class="bar-row">
              <span>${g.name}</span>
              <div class="bar"><i style="width:${((g.sum / max) * 100).toFixed(1)}%"></i></div>
              <span class="val">${money(g.sum)}</span>
            </div>`
            )
            .join('')}
        </div>
      </div>

      <div class="card">
        <div class="spread row" style="margin-bottom:6px">
          <div>
            <div class="eyebrow" style="margin:0">Работы</div>
            <div class="muted small">Расценки — средние по МО, 2026, без материалов</div>
          </div>
          <b style="color:var(--gold)">${money(bom.worksTotal)}</b>
        </div>
        <table>
          <thead><tr><th>Работа</th><th>Ед.</th><th class="num">Объём</th><th class="num">Цена</th><th class="num">Сумма</th></tr></thead>
          <tbody>
            ${bom.works
              .map(
                (w) => `<tr><td>${w.name}</td><td>${w.unit}</td><td class="num">${fmt(w.qty)}</td><td class="num">${fmt(w.price)}</td><td class="num"><b>${fmt(w.sum)}</b></td></tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>

      <div class="note" style="margin-top:20px">
        <b>Что не входит.</b> Септик (120–180 тыс. ₽), ввод электричества 15 кВт (50–150 тыс. ₽),
        скважина/колодец (80–250 тыс. ₽), благоустройство и забор. Заложите на это ещё 250–450 тыс. ₽
        либо уточните, что уже есть на участке.
      </div>
    </div>`
}

// -------------------------------------------------------------- ТЕХНОЛОГИЯ
const DOCS = [
  { file: '01-overview.md', title: '1. Концепция и состав проекта' },
  { file: '02-materials.md', title: '2. Материалы и закупка' },
  { file: '03-technology.md', title: '3. Технология монтажа' },
  { file: '04-schedule-budget.md', title: '4. График, бюджет, риски' },
  { file: '05-safety-acceptance.md', title: '5. Пожарная безопасность и приёмка' },
  { file: '06-open-questions.md', title: '6. Что уточнить до начала' },
]

export function renderGuide(host) {
  host.innerHTML = `
    <div class="wrap">
      <div class="eyebrow">Технология и организация работ</div>
      <h1 class="h1">Как это строится</h1>
      <p class="lead">Пошаговая технология, требования к материалам, график, бюджет, пожарные требования
      и чек-листы приёмки. Документы открываются здесь же и лежат в репозитории в папке
      <code>app/public/docs</code> — их можно править под свою бригаду.</p>
      <div class="guide">
        <nav class="guide-nav" id="gnav">
          ${DOCS.map((d, i) => `<button data-doc="${d.file}" class="${i === 0 ? 'active' : ''}">${d.title}</button>`).join('')}
        </nav>
        <article class="doc" id="doc">Загрузка…</article>
      </div>
    </div>`

  const doc = host.querySelector('#doc')
  const load = async (file) => {
    doc.innerHTML = '<p class="muted">Загрузка…</p>'
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}docs/${file}`)
      const md = (await res.text()).replace(/^- \[ \] (.+)$/gm, '- ☐ $1')
      doc.innerHTML = await marked.parse(md)
      doc.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch (e) {
      doc.innerHTML = `<p>Не удалось загрузить документ: ${e.message}</p>`
    }
  }
  host.querySelector('#gnav').addEventListener('click', (e) => {
    const b = e.target.closest('[data-doc]')
    if (!b) return
    host.querySelectorAll('#gnav button').forEach((x) => x.classList.toggle('active', x === b))
    load(b.dataset.doc)
  })
  load(DOCS[0].file)
}

// ----------------------------------------------------------------- АЛЬБОМ
export function renderAlbum(host) {
  const sheets = getSheets()
  host.innerHTML = `
    <div class="wrap">
      <div class="album-toolbar">
        <div>
          <div class="eyebrow">Печатный альбом</div>
          <h1 class="h1" style="margin:0">Альбом проекта</h1>
        </div>
        <div class="row">
          <button class="btn" onclick="window.print()">Печать / PDF (A4)</button>
        </div>
      </div>

      <div class="album">
        <section class="album-page album-cover">
          <div class="stamp">ПРОЕКТ<br/>2026</div>
          <div class="eyebrow" style="color:#a98247">Индивидуальный проект</div>
          <h1>Баня «Марго»</h1>
          <h2>10,0 × 9,5 м · барнхаус · витраж во фронтоне · Г-образная терраса · винтовые сваи</h2>
          <p style="max-width:640px;color:#4a453c">
            Тёплый контур ${totalArea.toFixed(1).replace('.', ',')} м²: кухня-гостиная, спальня, сауна, душевая, санузел, гардероб.
            Терраса ${terraceArea.toFixed(0)} м². Кровля ${roofArea.total.toFixed(0)} м², уклон ${project.roof.pitch}°.
            Расчётный регион — Московская область.
          </p>
          <div class="meta">
            <div><span>Площадь тёплого контура</span><b>${totalArea.toFixed(1).replace('.', ',')} м²</b></div>
            <div><span>Площадь застройки</span><b>95,0 м²</b></div>
            <div><span>Фундамент</span><b>31 свая</b></div>
            <div><span>Смета</span><b>${(bom.total / 1e6).toFixed(2).replace('.', ',')} млн ₽</b></div>
          </div>
          <div class="meta" style="margin-top:18px">
            <div><span>Состав альбома</span><b>7 листов</b></div>
            <div><span>Каркас</span><b>45×195, шаг 600</b></div>
            <div><span>Утепление</span><b>195 мм</b></div>
            <div><span>Версия</span><b>1.0 · 11.2026</b></div>
          </div>
        </section>

        ${sheets
          .map(
            (s) => `<section class="album-page"><img src="${s.url}" alt="${s.title}" /></section>`
          )
          .join('')}

        <section class="album-page" style="padding:40px;color:#1b1916;background:#fdfcf9">
          <h2 style="margin:0 0 4px;font-size:22px">Ведомость материалов (сводная)</h2>
          <p style="color:#6b6559;font-size:12px;margin:0 0 18px">Ориентировочные цены, МО, ноябрь 2026. Полная ведомость — в разделе «Материалы».</p>
          <table style="font-size:11px">
            <thead><tr><th>Раздел</th><th style="text-align:right">Сумма, ₽</th></tr></thead>
            <tbody>
              ${bom.groups
                .map(
                  (g) =>
                    `<tr><td>${g.name}</td><td style="text-align:right">${fmt(g.items.reduce((s, i) => s + i.sum, 0))}</td></tr>`
                )
                .join('')}
              <tr><td><b>Материалы</b></td><td style="text-align:right"><b>${fmt(bom.materialsTotal)}</b></td></tr>
              <tr><td><b>Работы</b></td><td style="text-align:right"><b>${fmt(bom.worksTotal)}</b></td></tr>
              <tr><td><b>ИТОГО</b></td><td style="text-align:right"><b>${fmt(bom.total)}</b></td></tr>
            </tbody>
          </table>
          <div style="margin-top:26px;font-size:11px;color:#6b6559">
            <b>Примечание.</b> Альбом содержит принципиальные схемы для производства работ и не заменяет
            рабочую документацию, подписанную проектировщиком. Перед строительством уточнить геологию,
            снеговой/ветровой район и требования местных органов.
          </div>
        </section>
      </div>
    </div>`
}

// ---------------------------------------------------------------- утилиты
function downloadText(name, text) {
  const blob = new Blob(['\ufeff' + text], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}
