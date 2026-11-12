// SVG-листы → PNG для быстрого просмотра
// node tools/preview-schemes.mjs [--project=id] [лист...]
import { readFileSync, writeFileSync } from 'node:fs'
import { Resvg } from '@resvg/resvg-js'
import { PROJECTS, DEFAULT_ID } from '../src/projects/index.js'

const args = process.argv.slice(2)
const projectArg = args.find((a) => a.startsWith('--project='))
const project = PROJECTS.find((p) => p.id === (projectArg ? projectArg.split('=')[1] : DEFAULT_ID)) || PROJECTS[0]
const names = args.filter((a) => !a.startsWith('--'))
const prefix = project.id === DEFAULT_ID ? '' : `${project.id}_`
const list = names.length
  ? names
  : ['01-plan', '02-foundation', '03-section', '04-wall', '05-roof', '06-facade', '07-nodes']

for (const n of list) {
  const svg = readFileSync(new URL(`../public/schemes/${project.id}/${n}.svg`, import.meta.url), 'utf8')
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1240 }, font: { loadSystemFonts: true } }).render().asPng()
  writeFileSync(`/tmp/sheet_${prefix}${n}.png`, png)
  console.log('✓', project.id, n)
}
