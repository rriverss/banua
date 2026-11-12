import * as THREE from 'three'
import {
  project as P,
  walls,
  rooms,
  openings,
  pilePositions,
  girders,
  wallStudPositions,
  wallTopAt,
  wallPoint,
  wallAreas,
  ceilingY,
  roofY,
  roofUnderY,
  roofArea,
  terracePoly,
} from './project.js'
import { M, LAYERS } from '../../scene/materials.js'

const B = P.frames.board // 40 мм — стойка каркаса
const dm = P.dims
const R = P.roof

// ------------------------------------------------------------------ helpers
function mesh(geo, mat) {
  const m = new THREE.Mesh(geo, mat)
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** коробка с масштабированием UV (для текстур досок) */
function panel(w, h, d, mat, uv) {
  const geo = new THREE.BoxGeometry(w, h, d)
  if (uv) {
    const a = geo.attributes.uv
    for (let i = 0; i < a.count; i++) a.setXY(i, a.getX(i) * uv[0], a.getY(i) * uv[1])
    a.needsUpdate = true
  }
  return mesh(geo, mat)
}

function box(w, h, d, mat, x, y, z) {
  const m = mesh(new THREE.BoxGeometry(w, h, d), mat)
  m.position.set(x, y, z)
  return m
}

const V = (x, y, z) => new THREE.Vector3(x, y, z)

/** брус между двумя точками: width — поперёк, height — по нормали */
function beam(a, b, width, height, mat) {
  const dir = new THREE.Vector3().subVectors(b, a)
  const len = dir.length()
  if (len < 1e-4) return null
  const zAxis = dir.clone().normalize()
  const up = V(0, 1, 0)
  let xAxis = new THREE.Vector3().crossVectors(up, zAxis)
  if (xAxis.lengthSq() < 1e-6) xAxis = V(1, 0, 0)
  xAxis.normalize()
  const yAxis = new THREE.Vector3().crossVectors(zAxis, xAxis).normalize()
  const g = new THREE.BoxGeometry(width, height, len)
  const m = mesh(g, mat)
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.setRotationFromMatrix(new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis))
  return m
}

/** плоская пластина из полигона в координатах (u, y), выдавленная по нормали стены */
function plate(points, depth, mat) {
  const shape = new THREE.Shape(points.map(([u, y]) => new THREE.Vector2(u, y)))
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false })
  return mesh(geo, mat)
}

/** локальная группа стены: X — вдоль стены, Z — по нормали наружу */
function wallGroup(wall) {
  const g = new THREE.Group()
  g.position.set(wall.a.x, 0, wall.a.z)
  g.rotation.y = -wall.angle
  return g
}

/** нарезка стены на вертикальные полосы между проёмами */
function wallSlices(wall) {
  const cuts = new Set([0, wall.length])
  for (const o of wall.openings) {
    cuts.add(clamp(o.u0, 0, wall.length))
    cuts.add(clamp(o.u1, 0, wall.length))
  }
  const xs = [...cuts].sort((a, b) => a - b)
  const out = []
  for (let i = 0; i < xs.length - 1; i++) {
    const a = xs[i]
    const b = xs[i + 1]
    if (b - a < 0.01) continue
    const mid = (a + b) / 2
    const holes = wall.openings
      .filter((o) => mid > o.u0 && mid < o.u1)
      .map((o) => [o.y0, o.y1])
      .sort((p, q) => p[0] - q[0])
    out.push({ a, b, holes })
  }
  return out
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

/** полосы «(a…b) × (yA…yB)» с учётом проёмов и наклонного верха */
function wallBands(wall) {
  const bands = []
  for (const s of wallSlices(wall)) {
    const topA = wallTopAt(wall, s.a)
    const topB = wallTopAt(wall, s.b)
    const topMin = Math.min(topA, topB)
    const ys = [0, topMin, ...s.holes.flat()]
    ys.sort((x, y) => x - y)
    const levels = [...new Set(ys.filter((y) => y >= -0.001 && y <= topMin + 0.001))]
    for (let i = 0; i < levels.length - 1; i++) {
      const yA = levels[i]
      const yB = levels[i + 1]
      if (yB - yA < 0.01) continue
      const mid = (yA + yB) / 2
      if (s.holes.some(([h0, h1]) => mid > h0 && mid < h1)) continue
      bands.push({ a: s.a, b: s.b, yA, yB, flat: true })
    }
    // верхняя трапеция от topMin до наклонного верха
    if (Math.abs(topA - topB) > 0.01) {
      bands.push({ a: s.a, b: s.b, yA: topMin, yB: null, topA, topB, flat: false })
    }
  }
  return bands
}

/** пластина полосы: (u, y) c обрезкой по наклонному верху */
function bandPlate(wall, band, depth, mat, offset) {
  const pts = [[band.a, band.yA], [band.b, band.yA]]
  if (band.flat) {
    pts.push([band.b, band.yB], [band.a, band.yB])
  } else {
    pts.push([band.b, band.topB], [band.a, band.topA])
  }
  const m = plate(pts, depth, mat)
  m.position.z = offset
  return m
}

// ---------------------------------------------------------------- фундамент
function buildFoundation(layers) {
  const g = layers.foundation
  const { dia, length, pileTop } = P.piles
  const pileGeo = new THREE.CylinderGeometry(dia / 2, dia / 2, length, 12)
  const capGeo = new THREE.BoxGeometry(0.2, 0.012, 0.2)
  for (const p of pilePositions) {
    const m = mesh(pileGeo, M.pile)
    m.position.set(p.x, pileTop - length / 2, p.z)
    g.add(m)
    const cap = mesh(capGeo, M.metalLight)
    cap.position.set(p.x, pileTop - 0.006, p.z)
    g.add(cap)
  }
  // ростверк 150×150
  for (const gr of girders) {
    g.add(beam(V(gr.x0, pileTop + 0.075, gr.z0), V(gr.x1, pileTop + 0.075, gr.z1), 0.15, 0.15, M.frameDark))
  }
  // забирка: доска 20×140 по периметру тёплого блока
  const y = (pileTop + 0.0) / 2
  const h = 0.455
  g.add(box(dm.L + 0.02, h, 0.02, M.frameDark, dm.x0 + dm.L / 2, y, -0.1))
  g.add(box(dm.L + 0.02, h, 0.02, M.frameDark, dm.x0 + dm.L / 2, y, dm.depth + 0.1))
  g.add(box(0.02, h, dm.depth + 0.2, M.frameDark, dm.x0 - 0.1, y, dm.depth / 2))
  g.add(box(0.02, h, dm.depth + 0.2, M.frameDark, dm.x0 + dm.L + 0.1, y, dm.depth / 2))
}

// ------------------------------------------------------------------- полы
function buildFloors(layers) {
  const { x0, L, depth, joist } = dm
  const x1 = x0 + L
  const jy = -joist / 2
  const step = P.frames.spacing

  // лаги тёплого блока — вдоль Z (пролёт 5 м)
  for (let x = x0 + 0.15; x < x1 - 0.05; x += step) {
    layers.frame.add(box(B, joist, depth - 0.02, M.frame, x, jy, depth / 2))
  }
  // лаги террасной полосы x 0…4 — вдоль X
  for (let z = 0.15; z < dm.D - 0.05; z += step) {
    layers.frame.add(box(x0 - 0.04, joist, B, M.frame, (x0 - 0.04) / 2, jy, z))
  }
  // лаги фронтонной полосы террасы x 4…8 (z 5…6,5)
  for (let z = depth + 0.2; z < dm.D - 0.05; z += step) {
    layers.frame.add(box(dm.terX - x0 - 0.04, joist, B, M.frame, (x0 + dm.terX) / 2, jy, z))
  }

  // черновой настил тёплого блока (доска 25 + шпунт 36 + мембрана)
  const sub = panel(L - 0.04, 0.1, depth - 0.04, M.floor, [(L - 0.04) / 1.2, (depth - 0.04) / 1.2])
  sub.position.set(x0 + L / 2, -0.05, depth / 2)
  layers.sheathing.add(sub)

  // чистовые полы по помещениям
  const floorMats = { ko: M.floor, wc: M.tile, shower: M.tile, steam: M.tile }
  for (const r of rooms) {
    if (r.id === 'ter') continue
    const shape = new THREE.Shape(r.poly.map(([x, z]) => new THREE.Vector2(x, -z)))
    const geo = new THREE.ShapeGeometry(shape)
    geo.rotateX(-Math.PI / 2)
    const m = mesh(geo, floorMats[r.id] || M.floor)
    m.position.y = 0.002
    m.receiveShadow = true
    layers.interior.add(m)
  }

  // настил террасы: Г-образный, доска 28 мм
  const deckY = dm.terraceY
  const ter = rooms.find((r) => r.id === 'ter')
  for (const poly of [ter.poly, terracePoly]) {
    const shape = new THREE.Shape(poly.map(([x, z]) => new THREE.Vector2(x, -z)))
    const geo = new THREE.ShapeGeometry(shape)
    geo.rotateX(-Math.PI / 2)
    const deck = mesh(geo, M.terrace)
    deck.position.y = deckY
    deck.receiveShadow = true
    layers.terrace.add(deck)
  }
  // лобовая доска настила
  layers.terrace.add(box(dm.terX + 0.02, 0.16, 0.03, M.frameDark, dm.terX / 2, deckY - 0.08, dm.D - 0.015))
  layers.terrace.add(box(0.03, 0.16, dm.D, M.frameDark, 0.015, deckY - 0.08, dm.D / 2))
  // опорная обвязка под настилом террасы
  layers.terrace.add(box(dm.terX, 0.1, 0.1, M.frameDark, dm.terX / 2, -0.1, dm.D - 0.05))
  layers.terrace.add(box(0.1, 0.1, dm.D - 0.1, M.frameDark, 0.05, -0.1, dm.D / 2))
  // площадка под свесом (дровник): гравийная отсыпка
  layers.terrace.add(box(dm.W - dm.terX - 0.1, 0.02, dm.D - dm.depth - 0.1, M.gravel, (dm.terX + dm.W) / 2, dm.groundY + 0.03, (dm.depth + dm.D) / 2))
}

// ------------------------------------------------------------------ стены
function buildWall(wall, layers) {
  const T = wall.thick
  const out = wall.outSign || 1
  const g = wallGroup(wall)
  const bands = wallBands(wall)

  // обвязки: нижняя и верхняя (по скату)
  g.add(box(wall.length, B, T * 0.98, M.frame, wall.length / 2, B / 2, 0))
  g.add(
    beam(
      V(0, wallTopAt(wall, 0) - B / 2, 0),
      V(wall.length, wallTopAt(wall, wall.length) - B / 2, 0),
      T * 0.98,
      B,
      M.frame
    )
  )

  // стойки 40×150
  for (const u of wallStudPositions(wall)) {
    const top = wallTopAt(wall, u) - 0.02
    const h = top - B
    if (h < 0.05) continue
    g.add(box(B, h, T * 0.98, M.frame, u, B + h / 2, 0))
  }

  // проёмы: перемычки и подоконные ригели
  for (const o of wall.openings) {
    const w = o.u1 - o.u0
    const cx = (o.u0 + o.u1) / 2
    const headerTop = Math.min(o.y1 + 0.16, wallTopAt(wall, cx) - 0.02)
    g.add(box(w, 0.15, T * 0.98, M.frame, cx, Math.max(o.y1 + 0.075, headerTop - 0.075), 0))
    if (o.y0 > 0) g.add(box(w, B, T * 0.98, M.frame, cx, o.y0 - B / 2, 0))
  }

  // ---- заполнение проёмов
  for (const o of wall.openings) {
    const w = o.u1 - o.u0
    const h = o.y1 - o.y0
    const cx = (o.u0 + o.u1) / 2
    const cy = (o.y0 + o.y1) / 2
    const f = 0.06
    if (o.kind === 'window') {
      const glass = panel(w - 0.08, h - 0.08, 0.02, M.glass, null)
      glass.position.set(cx, cy, 0)
      g.add(glass)
      g.add(box(w, f, 0.1, M.windowFrame, cx, o.y0 + f / 2, 0))
      g.add(box(w, f, 0.1, M.windowFrame, cx, o.y1 - f / 2, 0))
      g.add(box(f, h, 0.1, M.windowFrame, o.u0 + f / 2, cy, 0))
      g.add(box(f, h, 0.1, M.windowFrame, o.u1 - f / 2, cy, 0))
      const n = Math.max(0, Math.round(w / 1.0) - 1)
      for (let i = 1; i <= n; i++) g.add(box(0.05, h, 0.09, M.windowFrame, o.u0 + (w * i) / (n + 1), cy, 0))
    } else {
      const leaves = o.windows || 1
      for (let i = 0; i < leaves; i++) {
        const lw = (w - 0.04) / leaves
        const leaf = panel(lw - 0.02, h - 0.05, 0.04, o.glass ? M.glass : M.door, null)
        leaf.position.set(o.u0 + 0.02 + lw * (i + 0.5), cy, 0)
        g.add(leaf)
        g.add(box(lw, 0.05, 0.07, M.windowFrame, o.u0 + 0.02 + lw * (i + 0.5), o.y1 - 0.025, 0))
      }
      g.add(box(w + 0.02, 0.06, 0.11, M.windowFrame, cx, o.y1 + 0.01, 0))
      g.add(box(0.06, h, 0.11, M.windowFrame, o.u0 - 0.01, cy, 0))
      g.add(box(0.06, h, 0.11, M.windowFrame, o.u1 + 0.01, cy, 0))
      g.add(box(0.03, 0.22, 0.03, M.metalLight, o.u1 - 0.1, 1.0, 0.05))
    }
  }

  // ---- обшивка: снаружи имитация бруса 16, изнутри вагонка 16
  for (const band of bands) {
    if (wall.kind === 'int') {
      g.add(bandPlate(wall, band, 0.016, M.lining, T / 2 + 0.008))
      g.add(bandPlate(wall, band, 0.016, M.lining, -(T / 2 + 0.024)))
    } else {
      g.add(bandPlate(wall, band, 0.016, M.timber, out > 0 ? T / 2 + 0.025 : -(T / 2 + 0.041)))
      g.add(bandPlate(wall, band, 0.016, M.lining, out > 0 ? -(T / 2 + 0.024) : T / 2 + 0.008))
    }
  }

  layers.frame.add(g)
}

function buildWallInsulation(layers) {
  // утеплитель стен: пластина в габарите стены (в отдельном слое)
  for (const wall of walls) {
    const g = wallGroup(wall)
    if (!wall.kind || wall.kind !== 'ext') continue
    for (const band of wallBands(wall)) {
      const insPts = [[band.a, band.yA], [band.b, band.yA]]
      if (band.flat) insPts.push([band.b, band.yB], [band.a, band.yB])
      else insPts.push([band.b, band.topB - 0.06], [band.a, band.topA - 0.06])
      const ins = plate(insPts, wall.thick * 0.8, M.insulation)
      ins.position.z = -wall.thick * 0.4
      g.add(ins)
    }
    layers.insulation.add(g)
  }
}

// ---------------------------------------------------------- потолок по скату
function buildCeiling(layers) {
  const xa = dm.x0
  const xb = dm.x0 + dm.L
  const za = 0
  const zb = dm.depth
  const segX = 0.8
  for (let x = xa; x < xb - 0.001; x += segX) {
    const xx = Math.min(xb, x + segX)
    const g = new THREE.BufferGeometry()
    const y0 = ceilingY(za) - 0.006
    const y1 = ceilingY(zb) - 0.006
    const verts = new Float32Array([x, y0, za, xx, y0, za, xx, y1, zb, x, y0, za, xx, y1, zb, x, y1, zb])
    const uv = new Float32Array([0, 0, xx - x, 0, xx - x, zb - za, 0, 0, xx - x, zb - za, 0, zb - za])
    g.setAttribute('position', new THREE.BufferAttribute(verts, 3))
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
    g.computeVertexNormals()
    const m = mesh(g, M.lining)
    layers.interior.add(m)
  }
  // утеплитель над подшивом (в слое утеплителя)
  const ins = new THREE.Mesh(
    new THREE.BoxGeometry(xb - xa - 0.05, 0.2, zb - za - 0.05),
    M.insulation
  )
  ins.position.set((xa + xb) / 2, ceilingY((za + zb) / 2) + 0.12, (za + zb) / 2)
  ins.rotation.x = -Math.atan(R.slope)
  layers.insulation.add(ins)
}

// ------------------------------------------------------------------ кровля
/** плоскость кровли: полоса по X, наклон по Z */
function roofPlane(xa, xb, za, zb, yAt, mat, uvScale = 1) {
  const g = new THREE.BufferGeometry()
  const verts = new Float32Array([
    xa, yAt(za), za,
    xb, yAt(za), za,
    xb, yAt(zb), zb,
    xa, yAt(za), za,
    xb, yAt(zb), zb,
    xa, yAt(zb), zb,
  ])
  const dx = xb - xa
  const dz = zb - za
  const uv = new Float32Array([0, 0, dx * uvScale, 0, dx * uvScale, dz * uvScale, 0, 0, dx * uvScale, dz * uvScale, 0, dz * uvScale])
  g.setAttribute('position', new THREE.BufferAttribute(verts, 3))
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  g.computeVertexNormals()
  const m = mesh(g, mat)
  m.material.side = THREE.DoubleSide
  return m
}

function buildRoof(layers) {
  const g = layers.roof
  const step = P.frames.spacing
  const yTop = (z) => roofY(z)
  const yTile = (z) => roofY(z) + R.batten + R.counter + 0.012 // 12 мм — зазор под волной
  const xa = R.x0
  const xb = R.x1
  const za = R.z0
  const zb = R.z1

  // стропила 50×200 вдоль Z с шагом 600
  for (let x = xa + 0.1; x < xb - 0.05; x += step) {
    g.add(
      beam(
        V(x, yTop(za) - R.rafter / 2, za + 0.03),
        V(x, yTop(zb) - R.rafter / 2, zb - 0.03),
        0.05,
        R.rafter,
        M.frame
      )
    )
  }
  // коньковая (верхняя) и карнизная (нижняя) обвязки под стропила
  g.add(box(xb - xa, 0.15, 0.05, M.frameDark, (xa + xb) / 2, yTop(zb) - 0.28, zb - 0.08))
  g.add(box(xb - xa, 0.15, 0.05, M.frameDark, (xa + xb) / 2, yTop(za) - 0.28, za + 0.08))

  // контробрешётка 40×40 по скату
  for (let x = xa + 0.1; x < xb - 0.05; x += step) {
    g.add(beam(V(x, yTop(za) + R.counter / 2, za + 0.03), V(x, yTop(zb) + R.counter / 2, zb - 0.03), 0.04, 0.04, M.frameDark))
  }
  // обрешётка 25×100 поперёк, шаг 350
  const slopeLen = Math.hypot(zb - za, yTop(zb) - yTop(za))
  const nb = Math.max(1, Math.floor(slopeLen / 0.35))
  for (let k = 0; k <= nb; k++) {
    const t = k / nb
    const z = za + (zb - za) * t
    g.add(box(xb - xa, R.batten, 0.1, M.frame, (xa + xb) / 2, roofY(z) + R.counter + R.batten / 2, z))
  }

  // ветрозащитная мембрана под обрешёткой (закрывает пирог от просветов)
  for (let x = xa; x < xb - 0.001; x += 1.2) {
    const xx = Math.min(xb, x + 1.2)
    g.add(roofPlane(x, xx, za, zb, (z) => roofY(z) - 0.008, M.metal, 1))
  }

  // покрытие — металлочерепица, полосами по X
  for (let x = xa; x < xb - 0.001; x += 1.0) {
    const xx = Math.min(xb, x + 1.0)
    g.add(roofPlane(x, xx, za, zb, yTile, M.metalTile, 1))
  }

  // лобовые планки: низ (задний фасад) и верх (линия террасы)
  g.add(box(xb - xa, 0.16, 0.04, M.roofEdge, (xa + xb) / 2, yTile(za) - 0.08, za - 0.02))
  g.add(box(xb - xa, 0.2, 0.04, M.roofEdge, (xa + xb) / 2, yTile(zb) - 0.1, zb + 0.02))
  // торцевые планки по свесам X
  for (const x of [xa, xb]) {
    g.add(beam(V(x, yTile(za), za), V(x, yTile(zb), zb), 0.03, 0.14, M.roofEdge))
  }
  // водосточный желоб на низкой стороне (задний фасад)
  const gutter = mesh(new THREE.CylinderGeometry(0.07, 0.07, xb - xa, 10, 1, false, 0, Math.PI), M.roofEdge)
  gutter.rotation.z = Math.PI / 2
  gutter.position.set((xa + xb) / 2, yTile(za) - 0.14, za - 0.1)
  g.add(gutter)

  // прогоны LVL 300×51 под стропилами (в КО — открытые)
  for (const z of [1.55, 3.45]) {
    const y = ceilingY(z) - 0.15
    g.add(beam(V(dm.x0 + 0.05, y, z), V(dm.x0 + dm.L - 0.05, y, z), 0.051, 0.3, M.frameDark))
  }
}

// ----------------------------------------------------------------- терраса
function buildTerrace(layers) {
  const t = layers.terrace
  const deckY = dm.terraceY
  const post = 0.12

  // стойки 120×120 по краю кровли
  const posts = [
    [0.06, 0.12],
    [0.06, 3.3],
    [0.06, dm.D - 0.08],
    [3.94, dm.D - 0.08],
    [7.94, dm.D - 0.08],
  ]
  for (const [x, z] of posts) {
    const h = roofUnderY(z) - deckY - 0.16
    t.add(box(post, h, post, M.frameDark, x, deckY + h / 2, z))
  }
  // балки по стойкам под кровлей: по западному краю и по фронтону
  t.add(
    beam(
      V(0.06, roofUnderY(0.12) - 0.08, 0.12),
      V(0.06, roofUnderY(dm.D - 0.08) - 0.08, dm.D - 0.08),
      0.12,
      0.15,
      M.frameDark
    )
  )
  t.add(
    beam(
      V(0.06, roofUnderY(dm.D - 0.08) - 0.08, dm.D - 0.08),
      V(7.94, roofUnderY(dm.D - 0.08) - 0.08, dm.D - 0.08),
      0.12,
      0.15,
      M.frameDark
    )
  )

  // ограждение: западный край (x=0) и фронт (z=6,5, x 0…4,4)
  const railY = deckY + 1.0
  for (const seg of [
    { x0: 0.02, z0: 0.15, x1: 0.02, z1: dm.D - 0.05 },
    { x0: 0.02, z0: dm.D - 0.06, x1: 4.4, z1: dm.D - 0.06 },
  ]) {
    const len = Math.hypot(seg.x1 - seg.x0, seg.z1 - seg.z0)
    const n = Math.max(1, Math.round(len / 0.26))
    for (let i = 0; i <= n; i++) {
      const t2 = i / n
      const x = seg.x0 + (seg.x1 - seg.x0) * t2
      const z = seg.z0 + (seg.z1 - seg.z0) * t2
      t.add(box(0.045, 0.86, 0.045, M.frameDark, x, deckY + 0.43, z))
    }
    // поручень и обвязка
    t.add(beam(V(seg.x0, railY, seg.z0), V(seg.x1, railY, seg.z1), 0.08, 0.04, M.frameDark))
    t.add(beam(V(seg.x0, deckY + 0.12, seg.z0), V(seg.x1, deckY + 0.12, seg.z1), 0.06, 0.04, M.frameDark))
  }

  // ступени: 3 подъёма по 0,18 на фронте террасы
  const stepW = 2.3
  const cx = (dm.x0 + 2.3) / 2 + 0.5
  for (let i = 0; i < 3; i++) {
    const top = deckY - 0.18 * (i + 1)
    const zc = dm.D + 0.19 + i * 0.34
    t.add(box(stepW, 0.05, 0.36, M.terrace, cx, top - 0.025, zc))
    t.add(box(stepW, 0.18, 0.02, M.frameDark, cx, top + 0.09, zc - 0.18))
  }
  // стойки ступеней
  for (const x of [cx - stepW / 2 + 0.1, cx + stepW / 2 - 0.1]) {
    t.add(box(0.08, 0.75, 0.08, M.frameDark, x, dm.groundY / 2, dm.D + 0.4))
  }
}

// ------------------------------------------------------------- печь и мебель
function buildFixtures(layers) {
  const g = layers.fixtures
  const W = (w, h, d, m, x, y, z) => g.add(box(w, h, d, m, x, y, z))

  // ---------------- парная (x 8…10,85, z 2,62…4,85)
  // двухъярусные полки вдоль восточной стены
  W(0.55, 0.05, 2.1, M.liningLinden, 10.5, 0.55, 3.75)
  W(0.5, 0.05, 2.1, M.liningLinden, 10.0, 1.0, 3.75)
  for (const [x, z] of [[10.5, 2.85], [10.5, 4.7], [10.0, 2.85], [10.0, 4.7]]) {
    W(0.05, x > 10.2 ? 0.55 : 1.0, 0.05, M.frame, x, x > 10.2 ? 0.28 : 0.5, z)
  }
  W(0.03, 0.4, 1.9, M.liningLinden, 10.75, 1.2, 3.75)
  // печь в северо-западном углу парной
  W(0.5, 1.0, 0.5, M.stove, 8.35, 0.5, 2.95)
  W(0.46, 0.14, 0.46, M.stone, 8.35, 1.07, 2.95)
  W(0.3, 0.26, 0.02, M.metalLight, 8.12, 0.45, 2.95)
  const chim = mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.0, 12), M.metal)
  chim.position.set(8.35, 1.14 + 1.5, 2.95)
  g.add(chim)
  W(0.26, 0.12, 0.26, M.metal, 8.35, ceilingY(2.95) + 0.1, 2.95)
  // защита стены у печи
  W(0.02, 1.0, 1.0, M.stone, 8.08, 1.05, 2.95)
  // ковш, кадка
  W(0.34, 0.3, 0.34, M.liningLinden, 9.2, 0.15, 4.6)

  // ---------------- душевая (x 9,55…10,85 + ниша, z 0,15…2,47)
  W(1.0, 0.03, 0.9, M.tile, 10.25, 0.02, 0.62)
  W(0.02, 2.0, 0.9, M.glass, 9.75, 1.0, 0.62)
  const sh = mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.1, 8), M.metalLight)
  sh.position.set(10.6, 1.8, 0.6)
  g.add(sh)
  W(0.26, 0.02, 0.26, M.metalLight, 10.55, 2.25, 0.6)
  W(0.05, 1.0, 0.05, M.metalLight, 8.2, 0.5, 2.0)
  W(0.45, 0.04, 1.2, M.liningLinden, 8.35, 0.42, 1.85) // полок душевой
  W(0.02, 0.8, 0.6, M.metalLight, 8.9, 1.4, 2.42) // полотенцесушитель

  // ---------------- санузел (x 8…9,4, z 0,15…1,12)
  W(0.36, 0.4, 0.55, M.water, 8.4, 0.2, 0.5)
  W(0.38, 0.36, 0.16, M.water, 8.4, 0.56, 0.72)
  W(0.42, 0.14, 0.36, M.water, 9.15, 0.85, 0.35)
  W(0.06, 0.85, 0.06, M.metalLight, 9.15, 0.42, 0.35)
  W(0.4, 0.7, 0.02, M.metalLight, 9.15, 1.7, 0.17)
  W(0.5, 0.55, 0.3, M.metalLight, 8.85, 1.6, 0.95) // бойлер 50 л

  // ---------------- комната отдыха (x 4,15…7,85, z 0,15…4,85)
  // диван у перегородки
  W(0.9, 0.42, 2.1, M.fabric, 7.3, 0.21, 3.4)
  W(0.2, 0.45, 2.1, M.fabric, 7.72, 0.62, 3.4)
  W(0.9, 0.45, 0.2, M.fabric, 7.3, 0.62, 2.3)
  W(0.9, 0.45, 0.2, M.fabric, 7.3, 0.62, 4.5)
  // обеденный стол и лавки
  W(1.5, 0.07, 0.9, M.liningLinden, 5.6, 0.74, 3.2)
  for (const x of [5.0, 6.2]) {
    W(0.09, 0.72, 0.09, M.frameDark, x, 0.36, 2.85)
    W(0.09, 0.72, 0.09, M.frameDark, x, 0.36, 3.55)
  }
  W(1.4, 0.06, 0.35, M.liningLinden, 5.6, 0.45, 2.35)
  W(1.4, 0.06, 0.35, M.liningLinden, 5.6, 0.45, 4.05)
  for (const x of [5.05, 6.15]) {
    W(0.08, 0.44, 0.08, M.frameDark, x, 0.22, 2.35)
    W(0.08, 0.44, 0.08, M.frameDark, x, 0.22, 4.05)
  }
  // кухонный блок у задней стены
  W(2.0, 0.06, 0.6, M.liningLinden, 5.6, 0.9, 0.45)
  W(1.95, 0.85, 0.55, M.frameDark, 5.6, 0.45, 0.42)
  W(0.45, 0.25, 0.4, M.metalLight, 5.0, 0.98, 0.45)
  W(0.55, 0.03, 0.55, M.stone, 6.0, 0.93, 0.45)
  W(0.6, 1.8, 0.6, M.metalLight, 7.55, 0.9, 0.5) // холодильник
  W(0.45, 0.7, 0.35, M.liningLinden, 4.5, 1.5, 0.4) // шкафчик
  // самовар на столе
  W(0.22, 0.3, 0.22, M.metalLight, 6.0, 0.92, 3.2)
  // топчан у окна
  W(0.7, 0.35, 1.9, M.liningLinden, 4.6, 0.18, 3.6)
  W(0.65, 0.12, 1.85, M.fabric, 4.6, 0.4, 3.6)
}

function makeLabel(text, sub) {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 256
  const ctx = c.getContext('2d')
  ctx.fillStyle = 'rgba(22, 26, 24, 0.82)'
  ctx.beginPath()
  ctx.roundRect(4, 4, 504, 248, 28)
  ctx.fill()
  ctx.strokeStyle = 'rgba(214, 168, 106, 0.85)'
  ctx.lineWidth = 4
  ctx.stroke()
  ctx.fillStyle = '#f4e7d3'
  ctx.font = '700 60px "Inter", system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(text, 256, 108)
  ctx.fillStyle = '#d6a86a'
  ctx.font = '500 44px "Inter", system-ui, sans-serif'
  ctx.fillText(sub, 256, 182)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  const mat = new THREE.SpriteMaterial({ map: tex, depthTest: true, depthWrite: false, transparent: true })
  const sp = new THREE.Sprite(mat)
  sp.scale.set(1.5, 0.75, 1)
  return sp
}

function buildLabels(layers) {
  for (const r of rooms) {
    const sp = makeLabel(r.name, r.area.toFixed(1).replace('.', ',') + ' м²')
    sp.position.set(r.center[0], r.id === 'ter' ? 1.6 : 1.7, r.center[1])
    layers.labels.add(sp)
  }
}

// ------------------------------------------------------------------- сборка
export function buildBanya() {
  const root = new THREE.Group()
  const layers = {}
  for (const l of LAYERS) {
    const g = new THREE.Group()
    g.name = l.id
    layers[l.id] = g
    root.add(g)
  }

  buildFoundation(layers)
  buildFloors(layers)
  for (const w of walls) buildWall(w, layers)
  buildWallInsulation(layers)
  buildCeiling(layers)
  buildRoof(layers)
  buildTerrace(layers)
  buildFixtures(layers)
  buildLabels(layers)

  layers.insulation.visible = false

  root.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true
      o.receiveShadow = true
    }
  })
  return { root, layers }
}

export { openings, roofArea }
