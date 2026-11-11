// SVG-листы → PNG для быстрого просмотра: node tools/preview-schemes.mjs [лист...]
import { readFileSync, writeFileSync } from 'node:fs'
import { Resvg } from '@resvg/resvg-js'

const names = process.argv.slice(2)
const list = names.length ? names : ['01-plan', '02-foundation', '03-section', '04-wall', '05-roof', '06-facade', '07-nodes']
for (const n of list) {
  const svg = readFileSync(new URL(`../public/schemes/${n}.svg`, import.meta.url), 'utf8')
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1240 }, font: { loadSystemFonts: true } }).render().asPng()
  writeFileSync(`/tmp/sheet_${n}.png`, png)
  console.log('✓', n)
}
