import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { buildBanya } from './build.js'
import { project as P } from '../model/project.js'

export function createViewer(container) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#cfdbe4')
  scene.fog = new THREE.Fog('#cfdbe4', 32, 70)

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 250)
  camera.position.set(11.8, 6.2, 13.4)

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0
  renderer.localClippingEnabled = true
  container.appendChild(renderer.domElement)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.target.set(3, 1.5, 2.9)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.maxPolarAngle = Math.PI * 0.495
  controls.minDistance = 1.5
  controls.maxDistance = 45

  // ---- свет
  const hemi = new THREE.HemisphereLight('#eaf2ff', '#5c5545', 1.15)
  scene.add(hemi)

  const sun = new THREE.DirectionalLight('#fff1d6', 2.4)
  sun.position.set(12, 16, 9)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.camera.left = -14
  sun.shadow.camera.right = 14
  sun.shadow.camera.top = 14
  sun.shadow.camera.bottom = -14
  sun.shadow.camera.near = 1
  sun.shadow.camera.far = 60
  sun.shadow.bias = -0.0006
  sun.shadow.normalBias = 0.03
  scene.add(sun)

  const fill = new THREE.DirectionalLight('#cfe2ff', 0.55)
  fill.position.set(-10, 8, -8)
  scene.add(fill)

  // ---- земля
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ color: '#728c5b', roughness: 1 }))
  ground.rotation.x = -Math.PI / 2
  ground.position.y = P.dims.groundY
  ground.receiveShadow = true
  scene.add(ground)

  const gravel = new THREE.Mesh(
    new THREE.PlaneGeometry(9.5, 9.5),
    new THREE.MeshStandardMaterial({ color: '#9d9483', roughness: 1 })
  )
  gravel.rotation.x = -Math.PI / 2
  gravel.position.set(3, P.dims.groundY + 0.01, 3.4)
  gravel.receiveShadow = true
  scene.add(gravel)

  // ---- модель
  const { root, layers } = buildBanya()
  scene.add(root)

  // ---- камеры
  const presets = {
    general: { pos: [11.8, 6.2, 13.4], target: [3, 1.9, 3.2] },
    front: { pos: [3, 3.0, 16.8], target: [3, 2.2, 4.0] },
    back: { pos: [3, 3.4, -10.2], target: [3, 1.8, 1.5] },
    side: { pos: [16.8, 3.4, 3.2], target: [3, 1.8, 3.0] },
    top: { pos: [3.2, 18.5, 3.6], target: [3, 0, 3.6] },
    inside: { pos: [1.45, 1.62, 1.05], target: [2.6, 1.5, 6.0] },
    steam: { pos: [3.35, 1.6, 1.95], target: [5.1, 1.0, 0.7] },
    terrace: { pos: [8.6, 2.1, 9.2], target: [2.8, 1.3, 5.2] },
  }
  let anim = null
  function flyTo(key) {
    const p = presets[key] || presets.general
    anim = {
      t: 0,
      fromPos: camera.position.clone(),
      toPos: new THREE.Vector3(...p.pos),
      fromTarget: controls.target.clone(),
      toTarget: new THREE.Vector3(...p.target),
    }
  }

  function setLayer(id, visible) {
    if (layers[id]) layers[id].visible = visible
  }
  function getLayer(id) {
    return layers[id] ? layers[id].visible : false
  }

  const clips = {
    off: [],
    z: [new THREE.Plane(new THREE.Vector3(0, 0, -1), 4.58)],
    x: [new THREE.Plane(new THREE.Vector3(-1, 0, 0), 3.02)],
  }
  function setClip(mode) {
    renderer.clippingPlanes = clips[mode] || []
  }

  function resize() {
    const w = container.clientWidth
    const h = container.clientHeight
    if (!w || !h) return
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h, false)
  }
  const ro = new ResizeObserver(resize)
  ro.observe(container)
  resize()

  let raf = 0
  const clock = new THREE.Clock()
  function loop() {
    raf = requestAnimationFrame(loop)
    const dt = Math.min(clock.getDelta(), 0.05)
    if (anim) {
      anim.t = Math.min(1, anim.t + dt * 1.8)
      const e = 1 - Math.pow(1 - anim.t, 3)
      camera.position.lerpVectors(anim.fromPos, anim.toPos, e)
      controls.target.lerpVectors(anim.fromTarget, anim.toTarget, e)
      if (anim.t >= 1) anim = null
    }
    controls.update()
    renderer.render(scene, camera)
  }
  loop()

  return {
    setLayer,
    getLayer,
    setClip,
    flyTo,
    layers,
    scene,
    camera,
    renderer,
    resize,
    dispose() {
      cancelAnimationFrame(raf)
      ro.disconnect()
      renderer.dispose()
      container.innerHTML = ''
    },
  }
}
