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
  roofUnderY,
  roofArea,
} from './project.js'
import { M, LAYERS } from '../../scene/materials.js'

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
  if (wall.glass) return
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
      const fac = panel(w, h, 0.02, M.sidingDark, uvWall)
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
  if (wall.glass) return
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
  const x0 = 3.0
  const w = P.dims.L - x0
  // балки перекрытия над мойкой и парной (опирание: перегородка P1 — стена D)
  for (let i = 0; i <= 7; i++) {
    const z = 0.15 + (i * (P.dims.D - 0.3)) / 7
    layers.frame.add(box(w - 0.1, 0.195, B, M.frame, x0 + w / 2, y + 0.1, z))
  }
  // подшив потолка
  for (const r of rooms) {
    if (r.id === 'ter' || r.id === 'ko') continue
    const shape = new THREE.Shape(r.poly.map(([x, z]) => new THREE.Vector2(x, -z)))
    const geo = new THREE.ShapeGeometry(shape)
    geo.rotateX(-Math.PI / 2)
    const mat = M.liningLinden.clone()
    mat.side = THREE.DoubleSide
    const m = mesh(geo, mat)
    m.position.y = y
    layers.interior.add(m)
  }
  // утеплитель чердака
  const ins = panel(w - 0.2, 0.2, P.dims.D - 0.2, M.insulation, null)
  ins.position.set(x0 + w / 2, y + 0.3, P.dims.D / 2)
  layers.insulation.add(ins)

  // свод КО: подшив по стропилам от x=0 до x=3
  const pts = []
  const n = 10
  for (let i = 0; i <= n; i++) {
    const x = (P.dims.L / 2) * (i / n)
    pts.push([x, roofUnderY(x) - 0.02])
  }
  const poly = [...pts]
  for (let i = n; i >= 0; i--) poly.push([pts[i][0], pts[i][1] - 0.02])
  const ceilingSlope = (() => {
    const shape = new THREE.Shape([
      new THREE.Vector2(0, roofUnderY(0) - 0.02),
      new THREE.Vector2(3, roofUnderY(3) - 0.02),
      new THREE.Vector2(3, roofUnderY(3) - 0.16),
      new THREE.Vector2(0, roofUnderY(0) - 0.16),
    ])
    const geo = new THREE.ExtrudeGeometry(shape, { depth: P.dims.D - 0.05, bevelEnabled: false })
    const mat = M.liningLinden.clone()
    mat.side = THREE.DoubleSide
    const m = mesh(geo, mat)
    m.position.set(0, 0, 0.025)
    return m
  })()
  layers.interior.add(ceilingSlope)

  // стенка над перегородкой x=3 до кровли (разделяет свод КО и чердак мойки)
  const ridgeWallH = roofUnderY(3) - P.dims.partH
  layers.interior.add(box(0.1, ridgeWallH, P.dims.D - 0.05, M.lining, 3, P.dims.partH + ridgeWallH / 2, P.dims.D / 2))
  layers.frame.add(box(0.12, ridgeWallH, P.dims.D - 0.05, M.frame, 3, P.dims.partH + ridgeWallH / 2, P.dims.D / 2))
  layers.insulation.add(box(0.14, ridgeWallH - 0.04, P.dims.D - 0.1, M.insulation, 3, P.dims.partH + ridgeWallH / 2, P.dims.D / 2))

  // утеплитель по скату над КО
  const insShape = new THREE.Shape([
    new THREE.Vector2(0, roofUnderY(0) - 0.18),
    new THREE.Vector2(3, roofUnderY(3) - 0.18),
    new THREE.Vector2(3, roofUnderY(3) - 0.38),
    new THREE.Vector2(0, roofUnderY(0) - 0.38),
  ])
  const insGeo = new THREE.ExtrudeGeometry(insShape, { depth: P.dims.D - 0.1, bevelEnabled: false })
  const insKO = mesh(insGeo, M.insulation)
  insKO.position.z = 0.05
  layers.insulation.add(insKO)
}

// ---------------------------------------------------------------- фронтоны
/** плоская пластина из полигона в координатах XY, выдавленная по Z */
function shapePlate(points, depth, mat, z, holes = null) {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)))
  if (holes) for (const h of holes) shape.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, y))))
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false })
  const m = mesh(geo, mat)
  m.position.z = z
  return m
}

function gableTopProfile() {
  const pts = []
  const n = 12
  for (let i = 0; i <= n; i++) {
    const x = (P.dims.L * i) / n
    pts.push([x, Math.max(P.dims.wallH + 0.02, roofUnderY(x) - 0.02)])
  }
  return pts
}

function buildGables(layers) {
  const h = P.dims.wallH
  const top = gableTopProfile()
  // задний фронтон: дерево снаружи, каркас, утепление
  layers.facade.add(shapePlate([[0, h], ...top, [P.dims.L, h]], 0.02, M.gableWood, -0.13))
  layers.sheathing.add(shapePlate([[0, h], ...top, [P.dims.L, h]], 0.009, M.osb, -0.1))
  layers.insulation.add(shapePlate([[0.05, h + 0.02], ...top.map(([x, y]) => [x, y - 0.05]), [P.dims.L - 0.05, h + 0.02]], 0.16, M.insulation, -0.09))

  // стойки фронтона (z=0)
  for (let x = 0.15; x < P.dims.L - 0.02; x += 0.6) {
    const hgt = roofUnderY(x) - h - 0.08
    if (hgt < 0.12) continue
    layers.frame.add(box(0.045, hgt, 0.18, M.frame, x, h + hgt / 2, 0))
  }
  // обвязка по скату
  layers.frame.add(beam(V(0, roofUnderY(0) - 0.1, 0), V(3, roofUnderY(3) - 0.1, 0), 0.045, 0.18, M.frame))
  layers.frame.add(beam(V(6, roofUnderY(6) - 0.1, 0), V(3, roofUnderY(3) - 0.1, 0), 0.045, 0.18, M.frame))
}

// ------------------------------------------------------- фронтон-витраж (z=4.5)
function buildGlassWall(layers) {
  const z = P.dims.D
  const H = P.dims.wallH
  const GW = P.glassWall
  const fr = layers.facade
  const under = (x) => roofUnderY(x) - 0.02
  const doorRaw = openings.find((o) => o.id === 'ДВ-1')
  const door = { ...doorRaw, u1: doorRaw.u0 + doorRaw.w }

  // коробка витража
  fr.add(box(P.dims.L, 0.06, 0.14, M.windowFrame, P.dims.L / 2, 0.03, z))
  fr.add(box(P.dims.L, 0.06, 0.14, M.windowFrame, P.dims.L / 2, H - 0.03, z))
  fr.add(box(P.dims.L, 0.05, 0.1, M.windowFrame, P.dims.L / 2, GW.transom, z))

  // стойки
  for (const x of GW.mullions) {
    const top = x <= 3.001 ? under(x) : H
    fr.add(box(0.06, top - 0.02, 0.12, M.windowFrame, x, top / 2, z))
  }
  // наклонная обвязка по скату (левая половина)
  fr.add(beam(V(0, under(0), z), V(3, under(3), z), 0.06, 0.12, M.windowFrame))

  // стекло: нижняя лента (три полотна вокруг двери)
  const addGlass = (x0, x1, y0, y1) => {
    const w = x1 - x0
    const hh = y1 - y0
    if (w <= 0.03 || hh <= 0.03) return
    const m = panel(w, hh, 0.012, M.glass, null)
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, z - 0.006)
    fr.add(m)
  }
  addGlass(0.06, door.u0 + 0.02, 0.02, H - 0.02)
  addGlass(door.u1 - 0.02, P.dims.L - 0.06, 0.02, H - 0.02)
  addGlass(door.u0 + 0.02, door.u1 - 0.02, door.h + 0.03, H - 0.02)

  // стекло: фронтон (левая половина до конька)
  fr.add(shapePlate([[0.06, H - 0.02], [3, H - 0.02], [3, under(3)], [0.06, under(0.06)]], 0.012, M.glass, z - 0.006))

  // деревянная часть фронтона (над мойкой и парной) — снаружи
  fr.add(shapePlate([[3, H - 0.02], [P.dims.L - 0.06, H - 0.02], [P.dims.L - 0.06, under(P.dims.L - 0.06)], [3, under(3)]], 0.02, M.gableWood, z + 0.02))
  // каркас деревянной части
  for (let x = 3.3; x < P.dims.L - 0.1; x += 0.6) {
    const hgt = under(x) - H - 0.05
    if (hgt < 0.1) continue
    layers.frame.add(box(0.045, hgt, 0.16, M.frame, x, H + hgt / 2, z - 0.09))
  }

  // дверь
  fr.add(box(door.w, 0.06, 0.14, M.windowFrame, (door.u0 + door.u1) / 2, door.h, z))
  fr.add(box(door.w, 0.06, 0.14, M.windowFrame, (door.u0 + door.u1) / 2, 0.03, z))
  fr.add(box(0.05, door.h, 0.14, M.windowFrame, door.u0 + 0.02, door.h / 2, z))
  fr.add(box(0.05, door.h, 0.14, M.windowFrame, door.u1 - 0.02, door.h / 2, z))
  const leaf = panel(door.w - 0.08, door.h - 0.06, 0.03, M.glass, null)
  leaf.position.set((door.u0 + door.u1) / 2, door.h / 2, z)
  fr.add(leaf)
  fr.add(box(0.035, 0.5, 0.035, M.metalLight, door.u1 - 0.1, 1.05, z + 0.06))
}

// ----------------------------------------------------------------- кровля
/** скат: полоса между (xA,yA) и (xB,yB), протянутая по Z */
function slopeQuad(xA, yA, xB, yB, z0, z1, mat, uv = 0.6, flip = false) {
  const g = new THREE.BufferGeometry()
  const v = flip
    ? [xA, yA, z0, xB, yB, z1, xB, yB, z0, xA, yA, z0, xA, yA, z1, xB, yB, z1]
    : [xA, yA, z0, xB, yB, z0, xB, yB, z1, xA, yA, z0, xB, yB, z1, xA, yA, z1]
  const verts = new Float32Array(v)
  const len = Math.hypot(xB - xA, yB - yA)
  const w = z1 - z0
  const U = len / uv
  const Vv = w / uv
  const uvArr = new Float32Array([0, 0, U, 0, U, Vv, 0, 0, U, Vv, 0, Vv])
  g.setAttribute('position', new THREE.BufferAttribute(verts, 3))
  g.setAttribute('uv', new THREE.BufferAttribute(uvArr, 2))
  g.computeVertexNormals()
  return mesh(g, mat)
}

function buildRoof(layers) {
  const g = layers.roof
  const R = P.roof
  const z0 = R.zBack
  const z1 = R.zFront
  const step = P.frames.spacing
  const eaveY = roofY(R.eaveX)
  const ridgeY = R.ridgeY

  // стропильные пары каждые 600 по Z (до лобовой доски не доходят на 30 мм)
  const xEnd = (xEave) => xEave + (xEave < R.ridgeX ? 0.03 : -0.03)
  for (let z = 0.25; z < z1 - 0.2; z += step) {
    g.add(beam(V(R.ridgeX, roofY(R.ridgeX) - 0.24, z), V(xEnd(R.eaveX), roofY(R.eaveX) - 0.24, z), 0.045, 0.195, M.frame))
    g.add(beam(V(R.ridgeX, roofY(R.ridgeX) - 0.24, z), V(xEnd(R.eaveRightX), roofY(R.eaveRightX) - 0.24, z), 0.045, 0.195, M.frame))
  }
  // коньковый прогон
  g.add(beam(V(R.ridgeX, ridgeY - 0.3, z0), V(R.ridgeX, ridgeY - 0.3, z1), 0.045, 0.245, M.frameDark))

  // подстропильные балки над террасой + стойки
  for (const x of [0.08, P.dims.L - 0.08]) {
    const yb = roofY(x) - 0.31
    g.add(beam(V(x, yb, P.dims.D - 0.05), V(x, yb, z1 - 0.2), 0.045, 0.195, M.frameDark))
    const px = x < 1 ? 0.15 : P.dims.L - 0.15
    const top = yb - 0.1
    layers.terrace.add(box(0.1, top, 0.1, M.frameDark, px, top / 2, 6.85))
  }

  // контробрешётка по стропилам, обрешётка по скату
  const slopeLen = R.slopeLen
  const nb = Math.floor(slopeLen / 0.35)
  for (const s of [-1, 1]) {
    const xEave = s < 0 ? R.eaveX : R.eaveRightX
    for (let z = 0.25; z < z1 - 0.2; z += step) {
      const a = V(R.ridgeX, roofY(R.ridgeX) - 0.115, z)
      const b = V(xEave + (xEave < R.ridgeX ? 0.03 : -0.03), roofY(xEave) - 0.115, z)
      g.add(beam(a, b, 0.05, 0.05, M.frameDark))
    }
    for (let k = 1; k <= nb; k++) {
      const t = Math.min(0.965, (k * 0.35) / slopeLen)
      const x = R.ridgeX + (xEave - R.ridgeX) * t
      for (let zz = z0 + 0.1; zz < z1 - 0.11; zz += 1.1) {
        const zzb = Math.min(z1 - 0.1, zz + 1.1)
        g.add(box(0.1, 0.025, zzb - zz, M.frame, x, roofY(x) - 0.065, (zz + zzb) / 2))
      }
    }
  }

  // покрытие (нарезано по Z — ровнее тени и меньше «длинных» треугольников)
  const seg = 0.7
  for (let z = z0; z < z1 - 0.001; z += seg) {
    const zb = Math.min(z1, z + seg)
    g.add(slopeQuad(R.ridgeX, ridgeY, R.eaveX, eaveY, z, zb, M.roof, 0.55))
    g.add(slopeQuad(R.ridgeX, ridgeY, R.eaveRightX, eaveY, z, zb, M.roof, 0.55))
  }

  // подшив потолка террасы: по скату, ниже стропил — закрывает обрешётку снизу
  const tz0 = P.dims.D + 0.03
  const tz1 = z1 - 0.02
  for (let z = tz0; z < tz1 - 0.001; z += 0.7) {
    const zb = Math.min(tz1, z + 0.7)
    for (const [xa, xb] of [[R.eaveX + 0.02, R.ridgeX], [R.ridgeX, R.eaveRightX - 0.02]]) {
      g.add(slopeQuad(xa, roofY(xa) - 0.355, xb, roofY(xb) - 0.355, z, zb, M.lining, 0.55, true))
    }
  }

  // конёк
  const ridge = mesh(new THREE.CylinderGeometry(0.1, 0.1, z1 - z0, 14, 1, false, 0, Math.PI), M.roofEdge)
  ridge.rotation.x = Math.PI / 2
  ridge.position.set(R.ridgeX, ridgeY + 0.01, (z0 + z1) / 2)
  g.add(ridge)

  // торцевые планки по фронтонам
  for (const z of [z0, z1]) {
    g.add(beam(V(R.eaveX, eaveY + 0.02, z), V(R.ridgeX, ridgeY + 0.02, z), 0.02, 0.16, M.roofEdge))
    g.add(beam(V(R.ridgeX, ridgeY + 0.02, z), V(R.eaveRightX, eaveY + 0.02, z), 0.02, 0.16, M.roofEdge))
  }
  // капельник / лобовая по карнизам (глубокая — закрывает торцы стропил)
  for (const x of [R.eaveX, R.eaveRightX]) {
    g.add(box(0.035, 0.4, z1 - z0, M.roofEdge, x, eaveY - 0.19, (z0 + z1) / 2))
    g.add(box(0.06, 0.03, z1 - z0, M.roofEdge, x, eaveY - 0.385, (z0 + z1) / 2))
  }
}

// ------------------------------------------------------------ терраса
function buildTerrace(layers) {
  const t = layers.terrace
  const D = P.dims.D
  const L = P.dims.L
  const zf = D + P.dims.terrace
  const RH = 1.02

  // лобовая доска настила по периметру
  t.add(box(L + 0.02, 0.2, 0.04, M.frameDark, L / 2, -0.1, zf - 0.02))
  for (const x of [0.01, L - 0.01]) t.add(box(0.04, 0.2, P.dims.terrace, M.frameDark, x, -0.1, (D + zf) / 2))

  // ограждение: стойки шаг ~0.9 + 4 горизонтальные ламели
  const rail = (x0, z0, x1, z1) => {
    const len = Math.hypot(x1 - x0, z1 - z0)
    const n = Math.max(2, Math.round(len / 0.9))
    for (let i = 0; i <= n; i++) {
      const k = i / n
      t.add(box(0.08, RH, 0.08, M.frameDark, x0 + (x1 - x0) * k, RH / 2, z0 + (z1 - z0) * k))
    }
    for (const y of [0.34, 0.58, 0.82, 1.0]) {
      if (Math.abs(x1 - x0) > 0.01) t.add(box(len, 0.07, 0.06, M.frameDark, (x0 + x1) / 2, y, z0))
      else t.add(box(0.06, 0.07, len, M.frameDark, x0, y, (z0 + z1) / 2))
    }
  }
  rail(0.14, D + 0.2, 0.14, zf - 0.14)
  rail(L - 0.14, D + 0.2, L - 0.14, zf - 0.14)
  rail(0.14, zf - 0.14, 1.4, zf - 0.14)          // фронт слева от входа
  rail(4.6, zf - 0.14, L - 0.14, zf - 0.14)       // фронт справа от входа

  // ступени: 3 проступи + подступенки + тетивы
  const sw = 3.2
  const sx = L / 2
  for (let i = 0; i < 3; i++) {
    const top = -0.17 * (i + 1)
    const zc = zf + 0.19 + i * 0.34
    t.add(box(sw, 0.05, 0.36, M.terrace, sx, top - 0.025, zc))
    t.add(box(sw, 0.17, 0.02, M.frameDark, sx, top + 0.085, zc - 0.18))
  }
  for (const x of [sx - sw / 2 + 0.03, sx + sw / 2 - 0.03]) {
    t.add(box(0.05, 0.34, 1.06, M.frameDark, x, -0.34, zf + 0.52))
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
  buildGlassWall(layers)
  buildRoof(layers)
  buildTerrace(layers)
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
