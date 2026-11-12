import * as THREE from 'three'

const std = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.02, ...opts })

/** процедурная текстура 1×1 м: паттерн задаётся в world-масштабе */
function canvasTex(draw, size = 256) {
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const ctx = c.getContext('2d')
  draw(ctx, size)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

const tex = {
  siding: canvasTex((ctx, s) => {
    const boards = 7
    const w = s / boards
    ctx.fillStyle = '#a5703f'
    ctx.fillRect(0, 0, s, s)
    for (let i = 0; i < boards; i++) {
      const shade = 0.86 + ((i * 37) % 17) / 100
      ctx.fillStyle = `rgba(${Math.round(150 * shade)}, ${Math.round(100 * shade)}, ${Math.round(58 * shade)}, 1)`
      ctx.fillRect(i * w + 1, 0, w - 2, s)
      ctx.fillStyle = 'rgba(70, 42, 22, .55)'
      ctx.fillRect(i * w, 0, 2, s)
      ctx.fillStyle = 'rgba(255, 232, 200, .10)'
      ctx.fillRect(i * w + 2, 0, 2, s)
    }
  }),
  sidingDark: canvasTex((ctx, s) => {
    const boards = 9
    const w = s / boards
    ctx.fillStyle = '#2f3437'
    ctx.fillRect(0, 0, s, s)
    for (let i = 0; i < boards; i++) {
      const shade = 0.88 + ((i * 53) % 19) / 90
      const v = Math.round(46 * shade)
      ctx.fillStyle = `rgb(${v}, ${v + 3}, ${v + 5})`
      ctx.fillRect(i * w + 1, 0, w - 2, s)
      ctx.fillStyle = 'rgba(0,0,0,.55)'
      ctx.fillRect(i * w, 0, 2, s)
      ctx.fillStyle = 'rgba(255,255,255,.05)'
      ctx.fillRect(i * w + 2, 0, 1.5, s)
    }
  }),
  larch: canvasTex((ctx, s) => {
    const boards = 8
    const w = s / boards
    ctx.fillStyle = '#d9b183'
    ctx.fillRect(0, 0, s, s)
    for (let i = 0; i < boards; i++) {
      const shade = 0.92 + ((i * 41) % 13) / 100
      ctx.fillStyle = `rgba(${Math.round(222 * shade)}, ${Math.round(182 * shade)}, ${Math.round(137 * shade)}, 1)`
      ctx.fillRect(i * w + 1, 0, w - 2, s)
      ctx.fillStyle = 'rgba(150, 112, 70, .35)'
      ctx.fillRect(i * w, 0, 1.5, s)
      ctx.fillStyle = 'rgba(255, 245, 225, .22)'
      ctx.fillRect(i * w + 2, 0, 1.5, s)
    }
  }),
  lining: canvasTex((ctx, s) => {
    const boards = 10
    const h = s / boards
    ctx.fillStyle = '#ecd3a9'
    ctx.fillRect(0, 0, s, s)
    for (let i = 0; i < boards; i++) {
      const shade = 0.93 + ((i * 53) % 9) / 100
      ctx.fillStyle = `rgba(${Math.round(232 * shade)}, ${Math.round(206 * shade)}, ${Math.round(164 * shade)}, 1)`
      ctx.fillRect(0, i * h + 1, s, h - 2)
      ctx.fillStyle = 'rgba(140, 108, 70, .45)'
      ctx.fillRect(0, i * h, s, 1.5)
      ctx.fillStyle = 'rgba(255, 246, 226, .35)'
      ctx.fillRect(0, i * h + 2, s, 1)
    }
  }),
  floor: canvasTex((ctx, s) => {
    const planks = 3
    const h = s / planks
    ctx.fillStyle = '#a2683c'
    ctx.fillRect(0, 0, s, s)
    for (let i = 0; i < planks; i++) {
      const shade = 0.88 + ((i * 41) % 13) / 100
      ctx.fillStyle = `rgba(${Math.round(164 * shade)}, ${Math.round(106 * shade)}, ${Math.round(62 * shade)}, 1)`
      ctx.fillRect(0, i * h + 2, s, h - 3)
      ctx.fillStyle = 'rgba(58, 34, 18, .5)'
      ctx.fillRect(0, i * h, s, 2)
      for (let g = 0; g < 6; g++) {
        ctx.strokeStyle = `rgba(90, 52, 26, ${0.06 + (g % 3) * 0.03})`
        ctx.beginPath()
        const y = i * h + 8 + ((g * 13) % (h - 12))
        ctx.moveTo(0, y)
        ctx.bezierCurveTo(s * 0.3, y + 4, s * 0.6, y - 5, s, y + 2)
        ctx.stroke()
      }
    }
  }),
  terrace: canvasTex((ctx, s) => {
    const boards = 6
    const w = s / boards
    ctx.fillStyle = '#8f6244'
    ctx.fillRect(0, 0, s, s)
    for (let i = 0; i < boards; i++) {
      const shade = 0.9 + ((i * 29) % 15) / 100
      ctx.fillStyle = `rgba(${Math.round(146 * shade)}, ${Math.round(100 * shade)}, ${Math.round(70 * shade)}, 1)`
      ctx.fillRect(i * w + 2, 0, w - 4, s)
      ctx.fillStyle = 'rgba(40, 24, 14, .75)'
      ctx.fillRect(i * w, 0, 2, s)
    }
  }),
  plinth: canvasTex((ctx, s) => {
    ctx.fillStyle = '#8d8a83'
    ctx.fillRect(0, 0, s, s)
    const rows = 5
    const h = s / rows
    for (let r = 0; r < rows; r++) {
      let x = r % 2 ? -s / 6 : 0
      while (x < s) {
        const w = s / 4 + ((r * 7 + x) % 13)
        const g = 130 + ((x + r * 31) % 40)
        ctx.fillStyle = `rgb(${g}, ${g - 4}, ${g - 12})`
        ctx.fillRect(x + 2, r * h + 2, w - 4, h - 4)
        x += w
      }
    }
  }),
  // горизонтальная имитация бруса (фасад бани «Палома»)
  timber: canvasTex((ctx, s) => {
    const boards = 6
    const h = s / boards
    ctx.fillStyle = '#b08050'
    ctx.fillRect(0, 0, s, s)
    for (let i = 0; i < boards; i++) {
      const k = 0.9 + ((i * 29) % 17) / 100
      ctx.fillStyle = `rgb(${Math.round(176 * k)}, ${Math.round(128 * k)}, ${Math.round(82 * k)})`
      ctx.fillRect(0, i * h + 1.5, s, h - 3)
      ctx.fillStyle = 'rgba(58, 34, 18, .55)'
      ctx.fillRect(0, i * h, s, 2)
      ctx.fillStyle = 'rgba(255, 240, 214, .16)'
      ctx.fillRect(0, i * h + 2, s, 1)
      // продольные волокна
      for (let j = 0; j < 3; j++) {
        ctx.fillStyle = `rgba(120, 82, 46, ${0.05 + (j % 2) * 0.05})`
        ctx.fillRect(0, i * h + 4 + j * 5, s, 0.8)
      }
    }
  }),
  // металлочерепица: волна 350 мм, тёмный графит
  metalTile: canvasTex((ctx, s) => {
    const ribs = 3
    const w = s / ribs
    ctx.fillStyle = '#33383c'
    ctx.fillRect(0, 0, s, s)
    for (let i = 0; i < ribs; i++) {
      const g = ctx.createLinearGradient(i * w, 0, (i + 1) * w, 0)
      g.addColorStop(0, '#2a2f33')
      g.addColorStop(0.3, '#474e54')
      g.addColorStop(0.5, '#3d4348')
      g.addColorStop(0.72, '#31363a')
      g.addColorStop(1, '#282c30')
      ctx.fillStyle = g
      ctx.fillRect(i * w, 0, w, s)
      ctx.fillStyle = 'rgba(200, 216, 230, .07)'
      ctx.fillRect(i * w + w * 0.3, 0, 2, s)
    }
  }),
  roof: canvasTex((ctx, s) => {
    const ribs = 4
    const w = s / ribs
    ctx.fillStyle = '#2b2f33'
    ctx.fillRect(0, 0, s, s)
    for (let i = 0; i < ribs; i++) {
      const g = ctx.createLinearGradient(i * w, 0, (i + 1) * w, 0)
      g.addColorStop(0, '#22262a')
      g.addColorStop(0.42, '#3b4146')
      g.addColorStop(0.62, '#343a3f')
      g.addColorStop(1, '#212529')
      ctx.fillStyle = g
      ctx.fillRect(i * w, 0, w, s)
      // фальцевый шов
      ctx.fillStyle = 'rgba(12,14,16,.85)'
      ctx.fillRect(i * w, 0, 2.5, s)
      ctx.fillStyle = 'rgba(220,235,245,.10)'
      ctx.fillRect(i * w + 2.5, 0, 1.5, s)
    }
  }),
}

export const M = {
  frame: std('#d9a568', { roughness: 0.8 }),
  frameDark: std('#b8823f', { roughness: 0.85 }),
  osb: std('#e3cb9f', { roughness: 0.95 }),
  insulation: std('#f0c14b', { roughness: 1 }),
  siding: std('#ffffff', { roughness: 0.8, map: tex.siding }),
  lining: std('#ffffff', { roughness: 0.82, map: tex.lining }),
  liningLinden: std('#fff0d2', { roughness: 0.82, map: tex.lining }),
  floor: std('#ffffff', { roughness: 0.72, map: tex.floor }),
  terrace: std('#ffffff', { roughness: 0.82, map: tex.terrace }),
  tile: std('#98a0a5', { roughness: 0.32 }),
  roof: std('#ffffff', { roughness: 0.38, metalness: 0.45, map: tex.roof, side: THREE.DoubleSide }),
  roofEdge: std('#23272b', { roughness: 0.42, metalness: 0.45 }),
  plinth: std('#ffffff', { roughness: 0.9, map: tex.plinth }),
  sidingDark: std('#ffffff', { roughness: 0.75, map: tex.sidingDark }),
  timber: std('#ffffff', { roughness: 0.8, map: tex.timber }),
  metalTile: std('#ffffff', { roughness: 0.42, metalness: 0.4, map: tex.metalTile, side: THREE.DoubleSide }),
  gableWood: std('#ffffff', { roughness: 0.78, map: tex.larch }),
  metal: std('#3a3f43', { roughness: 0.45, metalness: 0.6 }),
  metalLight: std('#9aa3a8', { roughness: 0.35, metalness: 0.7 }),
  pile: std('#8b8880', { roughness: 0.6, metalness: 0.4 }),
  concrete: std('#b9b6ae', { roughness: 0.95 }),
  stove: std('#2c2c2f', { roughness: 0.5, metalness: 0.5 }),
  stone: std('#5b5f63', { roughness: 1 }),
  glass: new THREE.MeshPhysicalMaterial({
    color: '#bcd8e2',
    roughness: 0.05,
    metalness: 0,
    transmission: 0.85,
    transparent: true,
    opacity: 0.45,
    thickness: 0.02,
    side: THREE.DoubleSide,
  }),
  windowFrame: std('#26292c', { roughness: 0.55, metalness: 0.25 }),
  door: std('#33383c', { roughness: 0.6, metalness: 0.2 }),
  water: std('#7fb7c9', { roughness: 0.2, transparent: true, opacity: 0.85 }),
  ground: std('#6f8757', { roughness: 1 }),
  gravel: std('#9c968a', { roughness: 1 }),
  fabric: std('#b4523f', { roughness: 0.9 }),
}

export const LAYERS = [
  { id: 'foundation', name: 'Фундамент', hint: '29 винтовых свай ⌀108, ростверк 150×150, каменный цоколь' },
  { id: 'frame', name: 'Каркас', hint: 'доска 45×195, шаг 600' },
  { id: 'sheathing', name: 'Обшивка ОСП', hint: 'ОСП-3 9 мм стены / 18 мм пол' },
  { id: 'insulation', name: 'Утеплитель', hint: 'каменная вата 195 мм' },
  { id: 'facade', name: 'Фасад', hint: 'рейка RAL 7021 по бокам, дерево на фронтонах' },
  { id: 'interior', name: 'Отделка', hint: 'вагонка сосна / липа' },
  { id: 'roof', name: 'Кровля', hint: 'фальц RAL 7021, 30°, свес 700' },
  { id: 'terrace', name: 'Терраса', hint: 'лиственница, ограждение' },
  { id: 'fixtures', name: 'Печь и мебель', hint: 'печь 12 кВт, полки, сантехника' },
  { id: 'labels', name: 'Подписи', hint: 'названия и площади помещений' },
]
