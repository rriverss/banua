import * as THREE from 'three'
import {
  project as P,
  walls,
  rooms,
  openings,
  pilePositions,
  girders,
  wallStudPositions,
  gable,
  roofY,
  terraceRoofY,
  roofArea,
} from '../model/project.js'
import { M, LAYERS } from './materials.js'

const B = P.frames.board // толщина доски 45 мм
const D2R = Math.PI / 180

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

/** прямоугольники стены за вычетом проёмов */
function subtractRects(L, H, holes) {
  const xs = [...new Set([0, L, ...holes.flatMap((o) => [o.u0, o.u1])])]
    .filter((v) => v >= 0 && v <= L)
    .sort((a, b) => a - b)
  const ys = [...new Set([0, H, ...holes.flatMap((o) => [o.y0, o.y1])])]
    .filter((v) => v >= 0 && v <= H)
    .sort((a, b) => a - b)
  const out = []
  for (let i = 0; i < xs.length - 1; i++) {
    for (let j = 0; j < ys.length - 1; j++) {
      const cx = (xs[i] + xs[i + 1]) / 2
      const cy = (ys[j] + ys[j + 1]) / 2
      if (xs[i + 1] - xs[i] < 0.01 || ys[j + 1] - ys[j] < 0.01) continue
      if (holes.some((o) => cx > o.u0 && cx < o.u1 && cy > o.y0 && cy < o.y1)) continue
      out.push({ x0: xs[i], x1: xs[i + 1], y0: ys[j], y1: ys[j + 1] })
    }
  }
  return out
}

// ---------------------------------------------------------------- фундамент
function buildFoundation(layers) {
  const g = layers.foundation
  const { dia, length } = P.piles
  const { pileTop } = P.dims
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
    g.add(
      beam(
        V(gr.x0, pileTop + 0.075, gr.z0),
        V(gr.x1, pileTop + 0.075, gr.z1),
        0.15,
        0.15,
        M.frameDark
      )
    )
  }
}

// ------------------------------------------------------------------- полы
function buildFloors(layers) {
  const joistY = -P.dims.joist / 2
  const joistLen = P.dims.D - 0.2
  for (let i = 0; i < 11; i++) {
    const x = 0.15 + (i * (P.dims.L - 0.3)) / 10
    layers.frame.add(
      box(B, P.dims.joist, joistLen, M.frame, x, joistY, P.dims.D / 2)
    )
  }
  // террасные лаги
  for (let i = 0; i < 11; i++) {
    const x = 0.15 + (i * (P.dims.L - 0.3)) / 10
    layers.frame.add(
      box(B, P.dims.joist, P.dims.terrace - 0.1, M.frame, x, joistY, P.dims.D + P.dims.terrace / 2)
    )
  }
  // черновой настил ОСП
  const osbDeck = panel(P.dims.L, 0.018, P.dims.D, M.osb, [P.dims.L / 1.25, P.dims.D / 2.5])
  osbDeck.position.set(P.dims.L / 2, 0.009, P.dims.D / 2)
  layers.sheathing.add(osbDeck)
  // чистовые полы
  const floorMats = { ko: M.floor, par: M.tile, moy: M.tile }
  for (const r of rooms) {
    if (r.id === 'ter') continue
    const shape = new THREE.Shape(r.poly.map(([x, z]) => new THREE.Vector2(x, -z)))
    const geo = new THREE.ShapeGeometry(shape)
    geo.rotateX(-Math.PI / 2)
    const m = mesh(geo, floorMats[r.id])
    m.position.y = 0.02
    m.receiveShadow = true
    layers.interior.add(m)
  }
  // терраса
  const deck = panel(P.dims.L, 0.028, P.dims.terrace - 0.05, M.terrace, [P.dims.L, P.dims.terrace])
  deck.position.set(P.dims.L / 2, 0.005, P.dims.D + P.dims.terrace / 2)
  layers.terrace.add(deck)
  // ступени
  for (let i = 0; i < 3; i++) {
    const y = -0.02 - i * 0.16
    const step = box(1.3, 0.05, 0.32, M.terrace, 2.85, y, P.dims.D + P.dims.terrace + 0.12 + i * 0.3)
    layers.terrace.add(step)
  }
}

// ------------------------------------------------------------------ стены
function wallGroups(wall) {
  const groups = {}
  for (const id of ['frame', 'sheathing', 'facade', 'interior', 'insulation']) {
    const g = new THREE.Group()
    g.position.set(wall.a.x, 0, wall.a.z)
    g.rotation.y = -wall.angle
    groups[id] = g
  }
  return groups
}

function buildWall(wall, layers) {
  const L = wall.length
  const H = wall.height
  const T = wall.thick
  const out = wall.outSign || 1
  const G = wallGroups(wall)
  const g = G.frame

  g.add(box(L, B, T * 0.98, M.frame, L / 2, B / 2, 0))
  g.add(box(L, B, T * 0.98, M.frame, L / 2, H - B / 2, 0))

  // стойки
  for (const u of wallStudPositions(wall)) {
    g.add(box(B, H - 2 * B, T * 0.98, M.frame, u, H / 2, 0))
  }

  // проёмы: перемычки, подоконники, доборные стойки
  for (const o of wall.openings) {
    const w = o.u1 - o.u0
    const headerY = Math.min(o.y1 + 0.0975, H - B - 0.0975)
    g.add(box(w, 0.195, T * 0.98, M.frame, (o.u0 + o.u1) / 2, headerY, 0))
    if (o.y0 > 0) {
      g.add(box(w, B, T * 0.98, M.frame, (o.u0 + o.u1) / 2, o.y0 - B / 2, 0))
    }
    const top = headerY + 0.0975
    const crippleH = H - B - top
    if (crippleH > 0.15) {
      const n = Math.max(1, Math.round(w / 0.6))
      for (let i = 1; i <= n; i++) {
        g.add(box(B, crippleH, T * 0.98, M.frame, o.u0 + (w * i) / (n + 1), top + crippleH / 2, 0))
      }
    }
  }

  // заполнение проёмов: окна и двери
  for (const o of wall.openings) {
    const w = o.u1 - o.u0
    const h = o.y1 - o.y0
    const cx = (o.u0 + o.u1) / 2
    const cy = (o.y0 + o.y1) / 2
    const f = 0.05
    if (o.kind === 'window') {
      const glass = panel(w - 0.08, h - 0.08, 0.02, M.glass, null)
      glass.position.set(cx, cy, 0)
      G.facade.add(glass)
      // рама
      G.facade.add(box(w, f, 0.09, M.windowFrame, cx, o.y0 + f / 2, 0))
      G.facade.add(box(w, f, 0.09, M.windowFrame, cx, o.y1 - f / 2, 0))
      G.facade.add(box(f, h, 0.09, M.windowFrame, o.u0 + f / 2, cy, 0))
      G.facade.add(box(f, h, 0.09, M.windowFrame, o.u1 - f / 2, cy, 0))
      if (w > 0.8) G.facade.add(box(0.05, h, 0.08, M.windowFrame, cx, cy, 0))
    } else {
      const leaf = panel(w - 0.03, h - 0.03, 0.04, o.id === 'ДВ-3' ? M.glass : M.door, null)
      leaf.position.set(cx, cy, 0)
      G.facade.add(leaf)
      G.facade.add(box(w + 0.02, 0.06, 0.1, M.windowFrame, cx, o.y1 + 0.01, 0))
      G.facade.add(box(0.05, h, 0.1, M.windowFrame, o.u0 - 0.005, cy, 0))
      G.facade.add(box(0.05, h, 0.1, M.windowFrame, o.u1 + 0.005, cy, 0))
      if (o.id !== 'ДВ-3') G.facade.add(box(0.03, 0.18, 0.03, M.metalLight, o.u1 - 0.12, 1.0, 0.04))
    }
  }

  const rects = subtractRects(L, H, wall.openings)

  for (const r of rects) {
    const w = r.x1 - r.x0
    const h = r.y1 - r.y0
    const cx = (r.x0 + r.x1) / 2
    const cy = (r.y0 + r.y1) / 2
    const uvWall = [w, h]
    const uvInt = [w, h]

    if (wall.kind === 'ext') {
      const osb = panel(w, h, 0.009, M.osb, [w / 1.25, h / 2.5])
      osb.position.set(cx, cy, out * (T / 2 + 0.005))
      G.sheathing.add(osb)
      const fac = panel(w, h, 0.02, M.siding, uvWall)
      fac.position.set(cx, cy, out * (T / 2 + 0.03 + 0.011))
      G.facade.add(fac)
      const lin = panel(w, h, 0.016, M.lining, uvInt)
      lin.position.set(cx, cy, -out * (T / 2 + 0.009))
      G.interior.add(lin)
    } else {
      for (const s of [1, -1]) {
        const lin = panel(w, h, 0.016, M.lining, uvInt)
        lin.position.set(cx, cy, s * (T / 2 + 0.009))
        G.interior.add(lin)
      }
    }
  }

  for (const id of Object.keys(G)) layers[id].add(G[id])
}

/** утеплитель в полости стены */
function buildWallInsulation(wall, layers) {
  const rects = subtractRects(wall.length, wall.height, wall.openings)
  const G = wallGroups(wall).insulation
  for (const r of rects) {
    const w = r.x1 - r.x0
    const h = r.y1 - r.y0
    const m = panel(w, h, wall.thick * 0.78, M.insulation, null)
    m.position.set((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2, 0)
    G.add(m)
  }
  layers.insulation.add(G)
}

// ---------------------------------------------------------------- потолок
function buildCeiling(layers) {
  const y = P.dims.ceiling
  // балки
  for (let i = 0; i < 11; i++) {
    const x = 0.15 + (i * (P.dims.L - 0.3)) / 10
    layers.frame.add(box(B, 0.195, P.dims.D - 0.2, M.frame, x, y + 0.1, P.dims.D / 2))
  }
  // подшив потолка
  for (const r of rooms) {
    if (r.id === 'ter') continue
    const shape = new THREE.Shape(r.poly.map(([x, z]) => new THREE.Vector2(x, -z)))
    const geo = new THREE.ShapeGeometry(shape)
    geo.rotateX(-Math.PI / 2)
    const base = r.id === 'par' || r.id === 'moy' ? M.liningLinden : M.lining
    const mat = base.clone()
    mat.side = THREE.DoubleSide
    const m = mesh(geo, mat)
    m.position.y = y
    layers.interior.add(m)
  }
  // утеплитель потолка
  const ins = panel(P.dims.L - 0.2, 0.2, P.dims.D - 0.2, M.insulation, null)
  ins.position.set(P.dims.L / 2, y + 0.3, P.dims.D / 2)
  layers.insulation.add(ins)
}

// ---------------------------------------------------------------- фронтоны
function buildGables(layers) {
  const h = gable.height
  const W = P.dims.D
  const apex = P.roof.ridgeZ
  const shape = new THREE.Shape()
  shape.moveTo(0, 0)
  shape.lineTo(W, 0)
  shape.lineTo(apex, h)
  shape.closePath()
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.02, bevelEnabled: false })
  const osbGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.009, bevelEnabled: false })

  for (const [x, rot, off] of [
    [0, -Math.PI / 2, -0.01],
    [P.dims.L, -Math.PI / 2, 0.03],
  ]) {
    const fac = mesh(geo.clone(), M.siding)
    fac.rotation.y = rot
    fac.position.set(x + off, P.dims.wallH, 0)
    layers.facade.add(fac)

    const osb = mesh(osbGeo.clone(), M.osb)
    osb.rotation.y = rot
    osb.position.set(x + off + (x === 0 ? 0.021 : -0.0), P.dims.wallH, 0)
    layers.sheathing.add(osb)

    // стойки фронтона
    const g = new THREE.Group()
    g.position.set(x, P.dims.wallH, 0)
    for (let z = 0.3; z < W - 0.2; z += 0.6) {
      const top = h - (Math.abs(z - apex) / apex) * h
      if (top < 0.15) continue
      const st = box(B, top, 0.095, M.frame, 0, top / 2, z)
      g.add(st)
    }
    layers.frame.add(g)

    // утеплитель фронтона
    const insShape = new THREE.Shape()
    insShape.moveTo(0.1, 0.05)
    insShape.lineTo(W - 0.1, 0.05)
    insShape.lineTo(apex, h - 0.12)
    insShape.closePath()
    const insGeo = new THREE.ExtrudeGeometry(insShape, { depth: 0.18, bevelEnabled: false })
    const ins = mesh(insGeo, M.insulation)
    ins.rotation.y = rot
    ins.position.set(x + (x === 0 ? 0.03 : -0.21), P.dims.wallH, 0)
    layers.insulation.add(ins)
  }
}

// ----------------------------------------------------------------- кровля
function roofQuad(z0, y0, z1, y1, x0, x1, mat, uvScale = 0.35) {
  const g = new THREE.BufferGeometry()
  const verts = new Float32Array([
    x0, y0, z0,
    x1, y0, z0,
    x1, y1, z1,
    x0, y0, z0,
    x1, y1, z1,
    x0, y1, z1,
  ])
  const slope = Math.hypot(z1 - z0, y1 - y0)
  const len = x1 - x0
  const uv = new Float32Array([
    0, 0, len / uvScale, 0, len / uvScale, slope / uvScale,
    0, 0, len / uvScale, slope / uvScale, 0, slope / uvScale,
  ])
  g.setAttribute('position', new THREE.BufferAttribute(verts, 3))
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  g.computeVertexNormals()
  const m = mesh(g, mat)
  return m
}

function buildRoof(layers) {
  const g = layers.roof
  const R = P.roof
  const x0 = -R.gableOverhang
  const x1 = P.dims.L + R.gableOverhang
  const ridgeY = R.ridgeY
  const step = P.frames.spacing

  // стропила двух скатов
  for (let i = 0; i * step <= P.dims.L + 0.001; i++) {
    const x = Math.min(i * step, P.dims.L)
    for (const s of [-1, 1]) {
      const zEave = R.ridgeZ + s * (R.ridgeZ + R.overhang)
      const a = V(x, ridgeY - 0.12, R.ridgeZ)
      const b = V(x, roofY(zEave) - 0.12, zEave)
      g.add(beam(a, b, 0.045, 0.195, M.frame))
    }
  }
  // коньковый прогон
  g.add(beam(V(x0, ridgeY - 0.22, R.ridgeZ), V(x1, ridgeY - 0.22, R.ridgeZ), 0.05, 0.195, M.frameDark))

  // контробрешётка и обрешётка
  for (const s of [-1, 1]) {
    const zEave = R.ridgeZ + s * (R.ridgeZ + R.overhang)
    for (let i = 0; i * step <= P.dims.L + 0.001; i++) {
      const x = Math.min(i * step, P.dims.L)
      const a = V(x, ridgeY - 0.03, R.ridgeZ)
      const b = V(x, roofY(zEave) - 0.03, zEave)
      g.add(beam(a, b, 0.05, 0.05, M.frameDark))
    }
    const slopeLen = Math.hypot(R.ridgeZ - zEave, ridgeY - roofY(zEave))
    const n = Math.floor(slopeLen / 0.35)
    for (let k = 1; k <= n; k++) {
      const t = (k * 0.35) / slopeLen
      const z = R.ridgeZ + (zEave - R.ridgeZ) * t
      const y = ridgeY - 0.075 - (ridgeY - roofY(zEave)) * t
      g.add(box(x1 - x0, 0.025, 0.1, M.frame, (x0 + x1) / 2, y, z))
    }
  }

  // покрытие
  g.add(roofQuad(-R.overhang - 0.0, roofY(-R.overhang), R.ridgeZ, ridgeY, x0, x1, M.roof, 0.35))
  g.add(
    roofQuad(R.ridgeZ, ridgeY, R.ridgeZ + R.ridgeZ + R.overhang, roofY(R.ridgeZ + R.ridgeZ + R.overhang), x0, x1, M.roof, 0.35)
  )

  // конёк
  const ridge = mesh(new THREE.CylinderGeometry(0.09, 0.09, x1 - x0, 14, 1, false, 0, Math.PI), M.roofEdge)
  ridge.rotation.z = Math.PI / 2
  ridge.position.set((x0 + x1) / 2, ridgeY + 0.02, R.ridgeZ)
  g.add(ridge)

  // торцевые планки
  for (const x of [x0, x1]) {
    for (const s of [-1, 1]) {
      const zEave = R.ridgeZ + s * (R.ridgeZ + R.overhang)
      g.add(beam(V(x, ridgeY, R.ridgeZ), V(x, roofY(zEave), zEave), 0.02, 0.14, M.roofEdge))
    }
  }

  // ---- односкатная кровля террасы
  const T = P.terraceRoof
  const ty0 = T.y0
  const ty1 = terraceRoofY(T.z1)
  g.add(roofQuad(T.z0, ty0, T.z1, ty1, -T.overhangX, P.dims.L + T.overhangX, M.roof, 0.35))
  for (let i = 0; i * step <= P.dims.L + 0.001; i++) {
    const x = Math.min(i * step, P.dims.L)
    g.add(beam(V(x, ty0 - 0.1, T.z0), V(x, ty1 - 0.1, T.z1), 0.045, 0.145, M.frame))
  }
  for (let i = 0; i * step <= P.dims.L + 0.001; i++) {
    const x = Math.min(i * step, P.dims.L)
    g.add(beam(V(x, ty0 - 0.02, T.z0), V(x, ty1 - 0.02, T.z1), 0.05, 0.05, M.frameDark))
  }
  const slopeLen = Math.hypot(T.z1 - T.z0, ty0 - ty1)
  for (let k = 1; k * 0.35 < slopeLen; k++) {
    const t = (k * 0.35) / slopeLen
    const z = T.z0 + (T.z1 - T.z0) * t
    const y = ty0 - (ty0 - ty1) * t - 0.06
    g.add(box(P.dims.L + 2 * T.overhangX, 0.025, 0.1, M.frame, P.dims.L / 2, y, z))
  }

  // стойки террасы
  for (const x of [0.15, 2.95, 5.85]) {
    const top = terraceRoofY(6.85) - 0.12
    layers.terrace.add(box(0.1, top, 0.1, M.frameDark, x, top / 2, 6.85))
  }
  // ограждение террасы
  const railTop = 1.02
  const railSegs = [
    { a: [0.15, 0.15], b: [0.15, 6.85] },
    { a: [5.85, 6.85], b: [5.85, 0.15] },
    { a: [0.15, 6.85], b: [2.2, 6.85] },
    { a: [3.5, 6.85], b: [5.85, 6.85] },
  ]
  for (const s of railSegs) {
    const a = V(s.a[0], railTop, s.a[1])
    const b = V(s.b[0], railTop, s.b[1])
    layers.terrace.add(beam(a, b, 0.07, 0.09, M.frameDark))
    layers.terrace.add(beam(V(a.x, 0.14, a.z), V(b.x, 0.14, b.z), 0.05, 0.06, M.frameDark))
    const len = Math.hypot(b.x - a.x, b.z - a.z)
    const n = Math.max(2, Math.round(len / 0.14))
    for (let i = 1; i < n; i++) {
      const t = i / n
      const x = a.x + (b.x - a.x) * t
      const z = a.z + (b.z - a.z) * t
      layers.terrace.add(box(0.035, 0.82, 0.035, M.frame, x, 0.57, z))
    }
  }
}

// ------------------------------------------------------------- печь, мебель
function buildFixtures(layers) {
  const g = layers.fixtures

  // печь в парной
  const sx = 5.35
  const sz = 0.5
  g.add(box(0.45, 0.78, 0.45, M.stove, sx, 0.39, sz))
  g.add(box(0.42, 0.12, 0.42, M.stone, sx, 0.84, sz))
  const chimney = mesh(new THREE.CylinderGeometry(0.058, 0.058, 3.6, 12), M.metal)
  chimney.position.set(sx, 0.95 + 1.8, sz)
  g.add(chimney)
  g.add(box(0.24, 0.12, 0.24, M.metal, sx, 4.62, sz))
  // дверца топки
  g.add(box(0.28, 0.2, 0.02, M.metalLight, sx - 0.235, 0.36, sz))

  // полки парной (2 уровня) вдоль перегородки
  g.add(box(0.55, 0.05, 1.9, M.liningLinden, 3.4, 0.55, 1.1))
  g.add(box(0.45, 0.05, 1.9, M.liningLinden, 3.75, 1.0, 1.1))
  for (const z of [0.25, 1.95]) {
    g.add(box(0.05, 0.5, 0.05, M.frame, 3.55, 0.3, z))
    g.add(box(0.05, 0.95, 0.05, M.frame, 3.9, 0.5, z))
  }
  // подголовник
  g.add(box(0.3, 0.08, 0.4, M.fabric, 3.42, 0.62, 0.55))

  // мойка: поддон, душ, скамья
  g.add(box(0.9, 0.02, 0.9, M.tile, 5.35, 0.03, 3.85))
  const shower = mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.1, 8), M.metalLight)
  shower.position.set(5.35, 1.7, 3.45)
  g.add(shower)
  g.add(box(0.22, 0.02, 0.22, M.metalLight, 5.35, 2.25, 3.55))
  g.add(box(0.4, 0.05, 1.2, M.liningLinden, 3.25, 0.45, 3.5))
  // унитаз
  g.add(box(0.36, 0.4, 0.55, M.water, 5.6, 0.2, 2.65))
  g.add(box(0.38, 0.35, 0.16, M.water, 5.6, 0.55, 2.4))
  // раковина
  g.add(box(0.5, 0.14, 0.4, M.water, 3.35, 0.85, 2.55))
  g.add(box(0.06, 0.75, 0.06, M.metalLight, 3.35, 0.42, 2.55))
  // бойлер
  const boiler = mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.7, 14), M.metalLight)
  boiler.position.set(3.3, 1.85, 4.1)
  g.add(boiler)

  // комната отдыха: стол и лавки
  g.add(box(1.15, 0.06, 0.75, M.floor, 1.35, 0.76, 3.35))
  for (const [x, z] of [
    [0.85, 3.05],
    [1.85, 3.05],
    [0.85, 3.65],
    [1.85, 3.65],
  ])
    g.add(box(0.06, 0.73, 0.06, M.frameDark, x, 0.37, z))
  g.add(box(1.5, 0.05, 0.35, M.floor, 1.35, 0.45, 4.05))
  g.add(box(0.35, 0.05, 1.2, M.floor, 2.6, 0.45, 3.35))
  // дровница у печи в КО
  g.add(box(0.5, 0.35, 0.3, M.frameDark, 2.7, 0.18, 0.4))
  // светильники
  for (const [x, z] of [
    [1.5, 2.2],
    [4.5, 3.3],
    [4.5, 1.1],
    [3, 5.7],
  ]) {
    const lamp = mesh(new THREE.SphereGeometry(0.07, 10, 8), M.metalLight)
    lamp.position.set(x, 2.35, z)
    g.add(lamp)
  }
}

// ------------------------------------------------------------------ подписи
function makeLabel(text, sub) {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 256
  const ctx = c.getContext('2d')
  ctx.fillStyle = 'rgba(22, 26, 24, 0.82)'
  const r = 28
  ctx.beginPath()
  ctx.roundRect(4, 4, 504, 248, r)
  ctx.fill()
  ctx.strokeStyle = 'rgba(214, 168, 106, 0.85)'
  ctx.lineWidth = 4
  ctx.stroke()
  ctx.fillStyle = '#f4e7d3'
  ctx.font = '700 64px "Inter", system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(text, 256, 110)
  ctx.fillStyle = '#d6a86a'
  ctx.font = '500 46px "Inter", system-ui, sans-serif'
  ctx.fillText(sub, 256, 186)
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
    sp.position.set(r.center[0], r.id === 'ter' ? 1.5 : 1.85, r.center[1])
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
  for (const w of walls) buildWallInsulation(w, layers)
  buildCeiling(layers)
  buildGables(layers)
  buildRoof(layers)
  buildFixtures(layers)
  buildLabels(layers)

  // по умолчанию утеплитель скрыт
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
