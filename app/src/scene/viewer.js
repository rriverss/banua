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
  sun.shadow.camera.top = 22
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
    general: { pos: [21.5, 11.5, 22.0], target: [5.0, 2.4, 4.6] },
    front: { pos: [6.0, 4.4, 26.0], target: [6.0, 2.7, 8.0] },
    back: { pos: [6.0, 5.2, -14.0], target: [6.0, 2.6, 3.0] },
    side: { pos: [25.0, 5.4, 4.5], target: [5.0, 2.4, 4.5] },
    top: { pos: [5.5, 27.0, 5.2], target: [5.0, 0, 4.8] },
    inside: { pos: [4.2, 1.7, 4.4], target: [8.0, 2.0, 10.5] },
    steam: { pos: [3.9, 1.65, 2.2], target: [2.4, 1.0, 0.6] },
    terrace: { pos: [1.6, 2.0, 13.0], target: [6.0, 1.8, 7.6] },
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
