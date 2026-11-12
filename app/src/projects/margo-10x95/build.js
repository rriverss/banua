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
  const { x0, L, depth, terrace, joist, W } = P.dims
  const x1 = x0 + L
  const jy = -joist / 2
  const step = P.frames.spacing
  // лаги тёплого блока
  for (let z = 0.25; z < depth - 0.15; z += step)
    layers.frame.add(box(L - 0.02, joist, B, M.frame, x0 + L / 2, jy, z))
  // лаги торцевой террасы
  for (let x = 0.15; x < W - 0.05; x += step)
    layers.frame.add(box(B, joist, terrace - 0.05, M.frame, x, jy, depth + terrace / 2))
  // лаги западной полосы террасы
  for (let z = 4.6; z < depth - 0.1; z += step)
    layers.frame.add(box(x0 - 0.06, joist, B, M.frame, x0 / 2, jy, z))

  // черновой настил ОСП под тёплым блоком
  const osb = panel(L - 0.04, 0.018, depth - 0.04, M.osb, [(L - 0.04) / 1.25, (depth - 0.04) / 2.5])
  osb.position.set(x0 + L / 2, 0.009, depth / 2)
  layers.sheathing.add(osb)

  // чистовые полы по помещениям
  const floorMats = {
    sauna: M.tile,
    shower: M.tile,
    wc: M.tile,
    bed: M.floor,
    living: M.floor,
  }
  for (const r of rooms) {
    if (r.id === 'ter') continue
    const shape = new THREE.Shape(r.poly.map(([x, z]) => new THREE.Vector2(x, -z)))
    const geo = new THREE.ShapeGeometry(shape)
    geo.rotateX(-Math.PI / 2)
    const m = mesh(geo, floorMats[r.id] || M.floor)
    m.position.y = 0.02
    m.receiveShadow = true
    layers.interior.add(m)
  }

  // настил террасы — полигон Г-образной формы
  const ter = rooms.find((r) => r.id === 'ter')
  const tShape = new THREE.Shape(ter.poly.map(([x, z]) => new THREE.Vector2(x, -z)))
  const tGeo = new THREE.ShapeGeometry(tShape)
  tGeo.rotateX(-Math.PI / 2)
  const deck = mesh(tGeo, M.terrace)
  deck.position.y = 0.005
  deck.receiveShadow = true
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
  const { x0, L, depth, ceiling, partH, wallH } = P.dims
  const x1 = x0 + L
  const ridgeX = P.roof.ridgeX
  const zb = 3.4 // граница блока с плоским потолком (ось В)

  // балки потолка северного блока (сауна, душевая, санузел, спальня)
  for (let x = x0 + 0.3; x < x1 - 0.1; x += P.frames.spacing)
    layers.frame.add(box(B, 0.195, zb - 0.1, M.frame, x, ceiling + 0.1, zb / 2))
  const ceil = panel(L - 0.08, 0.02, zb - 0.1, M.lining, [L / 2, zb / 2])
  ceil.position.set(x0 + L / 2, ceiling, zb / 2)
  layers.interior.add(ceil)
  const insCeil = panel(L - 0.2, 0.25, zb - 0.2, M.insulation, null)
  insCeil.position.set(x0 + L / 2, ceiling + 0.33, zb / 2 - 0.05)
  layers.insulation.add(insCeil)

  // ---- свод гостиной: подшив по стропилам от стен до конька
  const z0 = zb + 0.06
  const z1 = depth - 0.06
  for (const [xa, xb] of [[x0 + 0.12, ridgeX], [ridgeX, x1 - 0.12]]) {
    for (let z = z0; z < z1 - 0.001; z += 1.1) {
      const zz = Math.min(z1, z + 1.1)
      layers.interior.add(
        slopeQuad(xa, roofUnderY(xa) - 0.03, xb, roofUnderY(xb) - 0.03, z, zz, M.lining, 0.9, true)
      )
    }
  }
  // утеплитель над сводом (2 слоя по 195)
  for (const [xa, xb] of [[x0 + 0.12, ridgeX], [ridgeX, x1 - 0.12]]) {
    for (let z = z0; z < z1 - 0.001; z += 1.1) {
      const zz = Math.min(z1, z + 1.1)
      layers.insulation.add(
        slopeQuad(xa, roofUnderY(xa) - 0.22, xb, roofUnderY(xb) - 0.22, z, zz, M.insulation, 0.9, true)
      )
    }
  }

  // ---- стенка от перегородок до кровли (граница тёплого объёма гостиной)
  const top = (x) => roofUnderY(x) - 0.04
  const n = 20
  const seg = (xa, xb, zc) => {
    const pts = [[xa, partH], [xb, partH]]
    for (let i = n; i >= 0; i--) {
      const x = xa + ((xb - xa) * i) / n
      pts.push([x, top(x)])
    }
    layers.interior.add(shapePlate(pts, 0.06, M.lining, zc - 0.03))
    layers.insulation.add(shapePlate(pts.map(([x, y]) => [x, Math.max(partH + 0.05, y - 0.12)]), 0.1, M.insulation, zc - 0.05))
  }
  seg(x0 + 0.12, 4.4, zb)
  seg(4.4, x1 - 0.12, zb)
  seg(x0 + 0.12, 4.4, 2.65)
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

function gableProfile(xa, xb, y0) {
  const pts = []
  const n = 16
  for (let i = 0; i <= n; i++) {
    const x = xa + ((xb - xa) * i) / n
    pts.push([x, Math.max(y0 + 0.02, roofUnderY(x) - 0.02)])
  }
  return pts
}

function buildGables(layers) {
  const { x0, L, depth, wallH } = P.dims
  const x1 = x0 + L
  const top = gableProfile(x0, x1, wallH)
  const outline = [[x0, wallH], ...top, [x1, wallH]]

  // северный фронтон (z=0): дерево снаружи, ОСП, утеплитель
  layers.facade.add(shapePlate(outline, 0.02, M.gableWood, -0.135))
  layers.sheathing.add(shapePlate(outline, 0.009, M.osb, -0.11))
  layers.insulation.add(
    shapePlate(
      [[x0 + 0.06, wallH + 0.04], ...top.map(([x, y]) => [x, y - 0.06]), [x1 - 0.06, wallH + 0.04]],
      0.16,
      M.insulation,
      -0.1
    )
  )

  // каркас северного фронтона
  for (let x = x0 + 0.15; x < x1 - 0.05; x += P.frames.spacing) {
    const hgt = roofUnderY(x) - wallH - 0.06
    if (hgt < 0.12) continue
    layers.frame.add(box(0.045, hgt, 0.18, M.frame, x, wallH + hgt / 2, 0))
  }
  // обвязка по скатам
  layers.frame.add(beam(V(x0, roofUnderY(x0) - 0.1, 0), V(P.roof.ridgeX, roofUnderY(P.roof.ridgeX) - 0.1, 0), 0.045, 0.18, M.frame))
  layers.frame.add(beam(V(P.roof.ridgeX, roofUnderY(P.roof.ridgeX) - 0.1, 0), V(x1, roofUnderY(x1) - 0.1, 0), 0.045, 0.18, M.frame))
}

// ------------------------------------------------------- фронтон-витраж (z=4.5)
function buildGlassWall(layers) {
  const z = P.dims.depth
  const { x0, L, wallH } = P.dims
  const x1 = x0 + L
  const GW = P.glassWall
  const top = GW.top // 2,55 — выше деревянный фронтон
  const fr = layers.facade
  const beamH = wallH - top

  const doorRaw = openings.find((o) => o.id === 'ДВ-1')
  const d0 = x0 + doorRaw.u0
  const d1 = d0 + doorRaw.w
  const doorH = doorRaw.h

  // верхняя обвязка (деревянная балка над остеклением) и нижняя
  fr.add(box(L, beamH, 0.2, M.gableWood, x0 + L / 2, top + beamH / 2, z))
  fr.add(box(L, 0.07, 0.16, M.windowFrame, x0 + L / 2, 0.035, z))
  // стойки
  for (const x of GW.mullions) {
    if (x > x1 - 0.01) continue
    fr.add(box(0.07, top, 0.14, M.windowFrame, x, top / 2, z))
  }
  // трансома
  fr.add(box(L - 0.02, 0.06, 0.12, M.windowFrame, x0 + L / 2, GW.transom, z))

  // стекло — полотна между стойками (и над дверью)
  const addGlass = (xa, xb, ya, yb) => {
    const w = xb - xa
    const hh = yb - ya
    if (w <= 0.05 || hh <= 0.05) return
    const m = panel(w - 0.02, hh - 0.02, 0.012, M.glass, null)
    m.position.set((xa + xb) / 2, (ya + yb) / 2, z - 0.008)
    fr.add(m)
  }
  const edges = [...GW.mullions.filter((x) => x < x1 - 0.01)]
  for (let i = 0; i < edges.length; i++) {
    const xa = edges[i]
    const xb = i + 1 < edges.length ? edges[i + 1] : x1
    if (xb - xa < 0.2) continue
    if (d0 >= xa - 0.01 && d1 <= xb + 0.01) {
      addGlass(xa, d0, 0.07, top)
      addGlass(d1, xb, 0.07, top)
      addGlass(d0, d1, doorH, top)
    } else {
      addGlass(xa, xb, 0.07, top)
    }
  }

  // дверь
  fr.add(box(d1 - d0, 0.06, 0.14, M.windowFrame, (d0 + d1) / 2, doorH, z))
  fr.add(box(0.05, doorH, 0.14, M.windowFrame, d0 + 0.02, doorH / 2, z))
  fr.add(box(0.05, doorH, 0.14, M.windowFrame, d1 - 0.02, doorH / 2, z))
  const leaf = panel(d1 - d0 - 0.1, doorH - 0.08, 0.03, M.glass, null)
  leaf.position.set((d0 + d1) / 2, doorH / 2, z)
  fr.add(leaf)
  fr.add(box(0.035, 0.55, 0.035, M.metalLight, d1 - 0.14, 1.05, z + 0.07))

  // южный фронтон над витражом — дерево (обе стороны скатов)
  const gTop = gableProfile(x0, x1, top)
  fr.add(shapePlate([[x0, top], ...gTop, [x1, top]], 0.02, M.gableWood, z + 0.11))
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
  const { x0, L, depth, terrace, W, plinth } = P.dims
  const t = layers.terrace
  const zf = depth + terrace

  // ступени во всю ширину террасы (3 подъёма по 0,18)
  for (let i = 0; i < 3; i++) {
    const top = -0.18 * (i + 1)
    const zc = zf + 0.19 + i * 0.34
    t.add(box(W, 0.05, 0.36, M.terrace, W / 2, top - 0.025, zc))
    t.add(box(W, 0.18, 0.02, M.frameDark, W / 2, top + 0.09, zc - 0.18))
  }
  // лобовая доска настила
  t.add(box(W + 0.02, 0.2, 0.04, M.frameDark, W / 2, -0.1, zf - 0.02))
  t.add(box(0.04, 0.2, terrace + 0.5, M.frameDark, 0.01, -0.1, depth + terrace / 2 - 0.25))

  // стойки по краю кровли над террасой
  for (const x of [x0 + 0.25, x0 + L - 0.25]) {
    const hgt = roofUnderY(x) - 0.36
    t.add(box(0.15, hgt, 0.15, M.frameDark, x, hgt / 2, zf - 0.18))
  }
}

/** каменный цоколь по периметру тёплого блока */
function buildPlinth(layers) {
  const { x0, L, depth, plinth, wallT } = P.dims
  const x1 = x0 + L
  const h = plinth + 0.15
  const y = -0.45 + h / 2
  const o = wallT / 2 + 0.03
  const g = layers.foundation
  g.add(box(L + 0.14, h, 0.06, M.plinth, x0 + L / 2, y, depth + o))
  g.add(box(L + 0.14, h, 0.06, M.plinth, x0 + L / 2, y, -o))
  g.add(box(0.06, h, depth + 0.12, M.plinth, x0 - o, y, depth / 2))
  g.add(box(0.06, h, depth + 0.12, M.plinth, x1 + o, y, depth / 2))
}

// ------------------------------------------------------------- печь, мебель
function buildFixtures(layers) {
  const g = layers.fixtures
  const W = (w, h, d, m, x, y, z) => g.add(box(w, h, d, m, x, y, z))

  // ---------------- сауна (x 2,1…4,35, z 0,1…2,6)
  // двухъярусные полки вдоль западной стены
  W(0.58, 0.05, 2.2, M.liningLinden, 2.45, 0.55, 1.3)
  W(0.5, 0.05, 2.2, M.liningLinden, 2.98, 0.98, 1.3)
  W(0.05, 0.55, 0.05, M.frame, 2.2, 0.28, 0.3)
  W(0.05, 0.55, 0.05, M.frame, 2.2, 0.28, 2.3)
  W(0.05, 0.98, 0.05, M.frame, 2.72, 0.49, 0.3)
  W(0.05, 0.98, 0.05, M.frame, 2.72, 0.49, 2.3)
  // спинка и подголовник
  W(0.03, 0.35, 2.1, M.liningLinden, 2.18, 1.15, 1.3)
  // печь в юго-восточном углу
  W(0.45, 0.9, 0.45, M.stove, 4.05, 0.45, 0.42)
  W(0.42, 0.14, 0.42, M.stone, 4.05, 0.97, 0.42)
  W(0.3, 0.26, 0.02, M.metalLight, 3.82, 0.45, 0.42)
  // дымоход сквозь кровлю
  const chim1 = mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.4, 12), M.metal)
  chim1.position.set(4.05, 1.04 + 1.7, 0.42)
  g.add(chim1)
  W(0.24, 0.12, 0.24, M.metal, 4.05, 4.05, 0.42)
  W(0.26, 0.26, 0.02, M.metalLight, 4.05, 4.3, 0.42)

  // ---------------- душевая (x 4,45…6,0, z 0,1…2,15)
  W(1.1, 0.03, 0.95, M.tile, 5.2, 0.02, 0.6)
  W(0.02, 2.0, 1.0, M.glass, 4.6, 1.0, 1.1)
  const sh = mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.1, 8), M.metalLight)
  sh.position.set(5.55, 1.75, 0.5)
  g.add(sh)
  W(0.24, 0.02, 0.24, M.metalLight, 5.55, 2.3, 0.55)
  W(0.05, 0.9, 0.05, M.metalLight, 5.85, 0.45, 0.9)
  W(0.4, 0.04, 1.3, M.liningLinden, 5.6, 0.42, 1.7)

  // ---------------- санузел (x 4,45…6,0, z 2,25…3,35)
  W(0.36, 0.4, 0.55, M.water, 5.6, 0.2, 2.95)
  W(0.38, 0.36, 0.16, M.water, 5.6, 0.56, 2.7)
  W(0.5, 0.14, 0.38, M.water, 4.75, 0.85, 3.15)
  W(0.06, 0.85, 0.06, M.metalLight, 4.75, 0.42, 3.15)
  W(0.5, 0.7, 0.02, M.metalLight, 4.75, 1.75, 3.33)

  // ---------------- спальня (x 6,1…9,9, z 0,1…3,35)
  W(1.7, 0.28, 2.1, M.fabric, 8.1, 0.4, 1.25)       // кровать
  W(1.72, 0.09, 1.55, M.liningLinden, 8.1, 0.62, 1.5) // одеяло
  W(0.55, 0.9, 0.1, M.frameDark, 8.1, 0.5, 0.16)     // изголовье
  W(0.45, 0.45, 0.45, M.frameDark, 7.05, 0.22, 0.35) // тумба
  W(0.45, 0.45, 0.45, M.frameDark, 9.15, 0.22, 0.35)
  W(1.7, 2.25, 0.62, M.frameDark, 9.5, 1.12, 2.8)    // шкаф
  W(0.5, 0.42, 0.5, M.fabric, 6.6, 0.21, 2.9)

  // ---------------- кухня-гостиная (x 2,1…9,9, z 3,45…6,9)
  // кухня вдоль восточной стены
  W(0.62, 0.06, 3.1, M.liningLinden, 9.55, 0.9, 5.1)  // столешница
  W(0.58, 0.85, 3.0, M.frameDark, 9.58, 0.44, 5.1)    // корпус
  W(0.05, 0.28, 0.55, M.metalLight, 9.53, 0.98, 4.4)  // мойка
  W(0.55, 0.03, 0.6, M.stove, 9.55, 0.92, 5.7)        // варочная
  W(0.62, 0.7, 1.4, M.liningLinden, 9.55, 1.85, 4.4)  // верхние шкафы
  W(0.65, 1.85, 0.68, M.metalLight, 9.5, 0.93, 6.55)  // холодильник
  // обеденный стол и стулья
  W(1.8, 0.06, 0.95, M.liningPine || M.lining, 7.0, 0.75, 5.9)
  for (const [x, z] of [[6.3, 5.35], [7.7, 5.35], [6.3, 6.45], [7.7, 6.45]]) {
    W(0.44, 0.45, 0.44, M.frame, x, 0.22, z)
    W(0.44, 0.5, 0.05, M.frame, x, 0.68, z + (z < 5.9 ? -0.2 : 0.2))
  }
  // диван у западной стены
  W(0.95, 0.42, 2.3, M.fabric, 2.75, 0.21, 5.2)
  W(0.22, 0.45, 2.3, M.fabric, 2.35, 0.62, 5.2)
  W(0.95, 0.45, 0.22, M.fabric, 2.75, 0.6, 4.0)
  W(0.95, 0.45, 0.22, M.fabric, 2.75, 0.6, 6.4)
  W(1.0, 0.36, 0.6, M.frameDark, 4.1, 0.36, 5.2)  // кофейный стол
  W(0.35, 0.05, 0.35, M.liningLinden, 4.1, 0.62, 5.2)
  // стеллаж у перегородки
  W(1.4, 1.8, 0.35, M.frameDark, 3.0, 0.9, 3.7)

  // ---------------- второй стояк (вентканал кухни)
  const chim2 = mesh(new THREE.CylinderGeometry(0.09, 0.09, 3.2, 12), M.metal)
  chim2.position.set(8.9, 1.6, 5.6)
  g.add(chim2)
  W(0.3, 0.1, 0.3, M.metal, 8.9, 3.3, 5.6)
}

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
  buildPlinth(layers)
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
