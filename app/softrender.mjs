// Мини-растеризатор three.js-сцены: z-буфер + плоское затенение.
// Нужен только для проверки модели без браузера.
import fs from 'node:fs'
import { PNG } from 'pngjs'

const ctx = new Proxy({}, {
  get: (t, k) => {
    if (k === 'canvas') return { width: 256, height: 256 }
    if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => ({ addColorStop() {} })
    return () => undefined
  },
})
globalThis.document = { createElement: () => ({ width: 256, height: 256, getContext: () => ctx }) }

const THREE = await import('three')
const { buildBanya } = await import('./src/scene/build.js')
const { M } = await import('./src/scene/materials.js')

const palette = {
  frame: '#d9a568', frameDark: '#c08a48', osb: '#e3cb9f', insulation: '#f0c14b',
  siding: '#a5703f', sidingDark: '#34393d', gableWood: '#b07a45', lining: '#ecd3a9',
  liningLinden: '#f3dcb2', floor: '#c2996b', terrace: '#b98a58', tile: '#9aa2a7',
  roof: '#2e3338', roofEdge: '#23272b', metal: '#3a3f43', metalLight: '#9aa3a8',
  pile: '#8b8880', concrete: '#b9b6ae', stove: '#2c2c2f', stone: '#5b5f63',
  glass: '#a9cede', windowFrame: '#26292c', door: '#2f3438', water: '#7fb7c9',
  ground: '#6f8757', gravel: '#9c968a', fabric: '#b4523f',
}
for (const [k, v] of Object.entries(palette)) if (M[k]) M[k].color.set(v)

const W = Number(process.argv[2] || 1100)
const H = Number(process.argv[3] || 760)

const { root, layers } = buildBanya()
layers.insulation.visible = false
layers.labels.visible = false
for (const id of (process.env.HIDE || '').split(',').filter(Boolean)) layers[id].visible = false
for (const id of (process.env.ONLY || '').split(',').filter(Boolean)) for (const k of Object.keys(layers)) layers[k].visible = k === id

const scene = new THREE.Scene()
scene.add(root)
scene.updateMatrixWorld(true)

const tris = []
const visible = (o) => { let p = o; while (p) { if (!p.visible) return false; p = p.parent } return true }
const push = (mesh) => {
  if (!visible(mesh)) return
  let geo = mesh.geometry
  if (geo.index) geo = geo.toNonIndexed()
  const pos = geo.attributes.position
  const mw = mesh.matrixWorld
  const col = mesh.material.color ? mesh.material.color.clone() : new THREE.Color('#888')
  const transp = mesh.material.transparent && mesh.material.opacity < 0.95
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i += 3) {
    const p = []
    for (let k = 0; k < 3; k++) {
      v.fromBufferAttribute(pos, i + k).applyMatrix4(mw)
      p.push([v.x, v.y, v.z])
    }
    const n = new THREE.Vector3(
      (p[1][1] - p[0][1]) * (p[2][2] - p[0][2]) - (p[1][2] - p[0][2]) * (p[2][1] - p[0][1]),
      (p[1][2] - p[0][2]) * (p[2][0] - p[0][0]) - (p[1][0] - p[0][0]) * (p[2][2] - p[0][2]),
      (p[1][0] - p[0][0]) * (p[2][1] - p[0][1]) - (p[1][1] - p[0][1]) * (p[2][0] - p[0][0])
    )
    if (n.lengthSq() < 1e-12) continue
    n.normalize()
    tris.push({ p, n, col, transp })
  }
}
root.traverse((o) => { if (o.isMesh && o.visible) push(o) })
console.log('triangles', tris.length)

const views = {
  front: { pos: [3, 3.1, 18], target: [3, 1.9, 3.4], fov: 26 },
  corner: { pos: [12.5, 7.4, 14], target: [3, 1.7, 3.6], fov: 30 },
  cornerBack: { pos: [-9, 6.2, -8], target: [3, 2.0, 3.2], fov: 30 },
  inside: { pos: [1.5, 1.65, 3.6], target: [2.4, 2.6, 1.0], fov: 60 },
  side: { pos: [16, 3.2, 3.6], target: [3, 2.0, 3.6], fov: 26 },
}
const only = process.argv[4]
const cam = new THREE.PerspectiveCamera(30, W / H, 0.1, 200)

const L = new THREE.Vector3(0.45, 0.82, 0.35).normalize()
const L2 = new THREE.Vector3(-0.6, 0.4, -0.5).normalize()

for (const [name, v] of Object.entries(views)) {
  if (only && only !== name) continue
  cam.fov = v.fov
  cam.aspect = W / H
  cam.position.set(...v.pos)
  cam.lookAt(new THREE.Vector3(...v.target))
  cam.updateProjectionMatrix()
  cam.updateMatrixWorld()
  const vp = new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse)

  const color = new Float32Array(W * H * 3).fill(0)
  const depth = new Float32Array(W * H).fill(Infinity)
  // фон
  for (let i = 0; i < W * H; i++) { color[i * 3] = 0.93; color[i * 3 + 1] = 0.945; color[i * 3 + 2] = 0.96 }

  const proj = new THREE.Vector3()
  const order = tris.slice().sort((a, b) => 0)

  for (const t of order) {
    const sp = []
    let ok = true
    for (const [x, y, z] of t.p) {
      proj.set(x, y, z).applyMatrix4(vp)
      if (proj.z < -1 || proj.z > 1) { ok = false; break }
      sp.push([((proj.x + 1) / 2) * W, ((1 - proj.y) / 2) * H, proj.z])
    }
    if (!ok) continue
    const [a, b, c] = sp
    const minX = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0])))
    const maxX = Math.min(W - 1, Math.ceil(Math.max(a[0], b[0], c[0])))
    const minY = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1])))
    const maxY = Math.min(H - 1, Math.ceil(Math.max(a[1], b[1], c[1])))
    if (minX > maxX || minY > maxY) continue
    const area = (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])
    if (Math.abs(area) < 1e-9) continue

    const nd = Math.max(0, t.n.dot(L)) * 0.62 + Math.max(0, t.n.dot(L2)) * 0.2 + 0.34
    const r = Math.min(1, t.col.r * nd)
    const g = Math.min(1, t.col.g * nd)
    const bl = Math.min(1, t.col.b * nd)

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const px = x + 0.5
        const py = y + 0.5
        const w0 = ((b[0] - px) * (c[1] - py) - (c[0] - px) * (b[1] - py)) / area
        const w1 = ((c[0] - px) * (a[1] - py) - (a[0] - px) * (c[1] - py)) / area
        const w2 = 1 - w0 - w1
        if (w0 < -0.002 || w1 < -0.002 || w2 < -0.002) continue
        const zz = w0 * a[2] + w1 * b[2] + w2 * c[2]
        const idx = y * W + x
        if (t.transp) {
          if (zz > depth[idx]) continue
          color[idx * 3] = color[idx * 3] * 0.6 + r * 0.4
          color[idx * 3 + 1] = color[idx * 3 + 1] * 0.6 + g * 0.4
          color[idx * 3 + 2] = color[idx * 3 + 2] * 0.6 + bl * 0.4
          continue
        }
        if (zz >= depth[idx]) continue
        depth[idx] = zz
        color[idx * 3] = r
        color[idx * 3 + 1] = g
        color[idx * 3 + 2] = bl
      }
    }
  }

  const png = new PNG({ width: W, height: H })
  for (let i = 0; i < W * H; i++) {
    png.data[i * 4] = Math.round(color[i * 3] * 255)
    png.data[i * 4 + 1] = Math.round(color[i * 3 + 1] * 255)
    png.data[i * 4 + 2] = Math.round(color[i * 3 + 2] * 255)
    png.data[i * 4 + 3] = 255
  }
  fs.writeFileSync(`/tmp/s_${name}.png`, PNG.sync.write(png))
  console.log('ok', name)
}
