// Экспорт SVG-листов всех проектов в public/schemes/<id>/
// node tools/export-schemes.mjs [id]   (без аргумента — все проекты)
import { writeFileSync, mkdirSync } from 'node:fs'
import { PROJECTS } from '../src/projects/index.js'

const only = process.argv[2]
const NUM = ['01-plan', '02-foundation', '03-section', '04-wall', '05-roof', '06-facade', '07-nodes']

const list = PROJECTS.filter((p) => !only || p.id === only)
if (!list.length) {
  console.error(`Нет проекта «${only}». Есть: ${PROJECTS.map((p) => p.id).join(', ')}`)
  process.exit(1)
}

for (const P of list) {
  const out = new URL(`../public/schemes/${P.id}/`, import.meta.url)
  mkdirSync(out, { recursive: true })
  console.log(`\n${P.title} — ${P.size}`)
  P.SHEETS.forEach((sheet, i) => {
    const svg = sheet.fn()
    const name = NUM[i] || String(i + 1).padStart(2, '0')
    writeFileSync(new URL(`${name}.svg`, out), svg, 'utf8')
    console.log('  ✓', name, (svg.length / 1024).toFixed(1) + ' КБ')
  })
}
