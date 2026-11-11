import { writeFileSync, mkdirSync } from 'node:fs'
import { planSheet } from '../src/schematics/plan.js'
import { foundationSheet } from '../src/schematics/foundation.js'
import { sectionSheet } from '../src/schematics/section.js'
import { wallSheet } from '../src/schematics/wall.js'
import { roofSheet } from '../src/schematics/roof.js'
import { nodesSheet } from '../src/schematics/nodes.js'
import { facadeSheet } from '../src/schematics/facade.js'

const out = new URL('../public/schemes/', import.meta.url)
mkdirSync(out, { recursive: true })

const sheets = {
  '01-plan': planSheet,
  '02-foundation': foundationSheet,
  '03-section': sectionSheet,
  '04-wall': wallSheet,
  '05-roof': roofSheet,
  '06-facade': facadeSheet,
  '07-nodes': nodesSheet,
}

for (const [name, fn] of Object.entries(sheets)) {
  const svg = fn()
  writeFileSync(new URL(`${name}.svg`, out), svg, 'utf8')
  console.log('✓', name, (svg.length / 1024).toFixed(1) + ' КБ')
}
