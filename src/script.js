import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'

/**
 * Base
 */
// Value
const INIT_PARTICLE_COUNT_OPT = 400
// Debug
const gui = new dat.GUI()
// Canvas
const canvas = document.querySelector('canvas.webgl')
// Scene
const scene = new THREE.Scene()

/**
 * GUI default options
 */
const effectController = {
  showDots: false,
  showLines: true,
  '2d': true,
  startAnimation: false,
  minDistance: 80,
  limitConnections: false,
  maxConnections: 20,
  particleCount: INIT_PARTICLE_COUNT_OPT,
  color: '#ffffff',
  enableZoom: false,
}

/**
 * Particles
 */
const particlesData = []
const maxParticleCount = 1000
const r = 800
const rHalf = r / 2

let particleCount = 0

let group
let positions, colors
let particlePositions

let pointsParticles, pointsMaterial
let points

let linesGeometry, linesMaterial
let lines

// Controls
let controls

// Gui
let is2d = effectController['2d']

// Others
let ready = false

// const helper = new THREE.BoxHelper(
//   new THREE.Mesh(new THREE.BoxGeometry(r, r, r))
// )
// helper.material.color.setHex(0x101010)
// helper.material.blending = THREE.AdditiveBlending
// helper.material.transparent = true
// group.add(helper)

const segments = maxParticleCount * maxParticleCount

positions = new Float32Array(segments * 3)
colors = new Float32Array(segments * 3)

const clearScene = () => {
  // Clear points
  pointsParticles.dispose()
  pointsMaterial.dispose()
  // Clear lines
  linesGeometry.dispose()
  linesMaterial.dispose()
  // Remove objects from group and scene
  group.remove(points)
  group.remove(lines)
  scene.remove(group)
}

const generateParticles = () => {
  if (group !== undefined) clearScene()

  group = new THREE.Group()
  scene.add(group)

  pointsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 3,
    blending: THREE.AdditiveBlending,
    transparent: true,
    sizeAttenuation: false,
  })

  pointsParticles = new THREE.BufferGeometry()
  particlePositions = new Float32Array(maxParticleCount * 3)

  for (let i = 0; i < maxParticleCount; i++) {
    const x = Math.random() * r - r / 2
    const y = Math.random() * r - r / 2
    const z = is2d ? 0 : Math.random() * r - r / 2

    particlePositions[i * 3] = x
    particlePositions[i * 3 + 1] = y
    particlePositions[i * 3 + 2] = z

    const zVect3 = is2d ? 0 : -1 + Math.random() * 2

    // add it to the geometry
    particlesData.push({
      velocity: new THREE.Vector3(
        -1 + Math.random() * 2,
        -1 + Math.random() * 2,
        zVect3
      ),
      numConnections: 0,
    })
  }

  pointsParticles.setDrawRange(0, particleCount)
  pointsParticles.setAttribute(
    'position',
    new THREE.BufferAttribute(particlePositions, 3).setUsage(
      THREE.DynamicDrawUsage
    )
  )

  // Create the particle system
  points = new THREE.Points(pointsParticles, pointsMaterial)
  points.visible = effectController.showDots
  group.add(points)

  linesGeometry = new THREE.BufferGeometry()

  linesGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage)
  )
  linesGeometry.setAttribute(
    'color',
    new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage)
  )

  linesGeometry.computeBoundingSphere()

  linesGeometry.setDrawRange(0, 0)

  linesMaterial = new THREE.LineBasicMaterial({
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    transparent: true,
  })

  lines = new THREE.LineSegments(linesGeometry, linesMaterial)
  group.add(lines)
}

generateParticles()

// Lights
const pointLight = new THREE.PointLight(0xffffff, 0.1)
pointLight.position.x = 0
pointLight.position.y = 0
pointLight.position.z = 1750
scene.add(pointLight)

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
}

// Hanldle particle count update
const updateParticleCount = (value) => {
  particleCount = parseInt(value)
  pointsParticles.setDrawRange(0, particleCount)
}

// Handle window resize
window.addEventListener('resize', () => {
  // update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

window.addEventListener('dblclick', () => {
  const fullscreenElement =
    document.fullscreenElement || document.webkitFullscreenElement

  if (!fullscreenElement) {
    if (canvas.requestFullscreen) {
      canvas.requestFullscreen()
    } else if (canvas.webkitRequestFullscreen) {
      canvas.webkitRequestFullscreen()
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen()
    }
  }
})

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(
  22, // 20
  sizes.width / sizes.height,
  1,
  4000
)
camera.position.z = 1450

/**
 * Controls
 */
controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.enableRotate = false
controls.enableZoom = effectController.enableZoom

/**
 * GUI
 */
gui.add(effectController, '2d').onChange((value) => {
  is2d = value
  generateParticles()
})
gui.add(effectController, 'showDots').onChange((value) => {
  points.visible = value
})
gui.add(effectController, 'showLines').onChange((value) => {
  lines.visible = value
})

gui.add(effectController, 'enableZoom').onChange((value) => {
  controls.enableZoom = value
})
gui.add(effectController, 'minDistance', 10, 300)
gui
  .add(effectController, 'particleCount', 0, maxParticleCount, 1)
  .onChange((value) => {
    updateParticleCount(value)
  })
gui.addColor(effectController, 'color').onChange(() => {
  lines.material.color.set(effectController.color)
  points.material.color.set(effectController.color)
})

// gui.add(effectController, 'maxConnections', 0, 30, 1)

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true,
})

renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const animateParticles = () => {
  let vertexpos = 0
  let colorpos = 0
  let numConnected = 0

  if (particleCount < INIT_PARTICLE_COUNT_OPT) {
    updateParticleCount(particleCount + 1)
  }

  for (let i = 0; i < particleCount; i++) {
    if (particlesData[i].numConnections) {
      particlesData[i].numConnections = 0
    }
  }

  for (let i = 0; i < particleCount; i++) {
    // get the particle
    const particleData = particlesData[i]

    particlePositions[i * 3] += particleData.velocity.x
    particlePositions[i * 3 + 1] += particleData.velocity.y
    particlePositions[i * 3 + 2] += particleData.velocity.z

    if (
      particlePositions[i * 3 + 1] < -rHalf ||
      particlePositions[i * 3 + 1] > rHalf
    )
      particleData.velocity.y = -particleData.velocity.y

    if (particlePositions[i * 3] < -rHalf || particlePositions[i * 3] > rHalf)
      particleData.velocity.x = -particleData.velocity.x

    if (
      particlePositions[i * 3 + 2] < -rHalf ||
      particlePositions[i * 3 + 2] > rHalf
    )
      particleData.velocity.z = -particleData.velocity.z

    if (
      effectController.limitConnections &&
      particleData.numConnections >= effectController.maxConnections
    )
      continue

    // Check collision
    for (let j = i + 1; j < particleCount; j++) {
      const particleDataB = particlesData[j]
      if (
        effectController.limitConnections &&
        particleDataB.numConnections >= effectController.maxConnections
      )
        continue

      const dx = particlePositions[i * 3] - particlePositions[j * 3]
      const dy = particlePositions[i * 3 + 1] - particlePositions[j * 3 + 1]
      const dz = particlePositions[i * 3 + 2] - particlePositions[j * 3 + 2]
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

      if (dist < effectController.minDistance) {
        particleData.numConnections++
        particleDataB.numConnections++

        const alpha = 1.08 - dist / effectController.minDistance

        positions[vertexpos++] = particlePositions[i * 3]
        positions[vertexpos++] = particlePositions[i * 3 + 1]
        positions[vertexpos++] = particlePositions[i * 3 + 2]

        positions[vertexpos++] = particlePositions[j * 3]
        positions[vertexpos++] = particlePositions[j * 3 + 1]
        positions[vertexpos++] = particlePositions[j * 3 + 2]

        colors[colorpos++] = alpha
        colors[colorpos++] = alpha
        colors[colorpos++] = alpha

        colors[colorpos++] = alpha
        colors[colorpos++] = alpha
        colors[colorpos++] = alpha

        numConnected++
      }
    }
  }

  lines.geometry.setDrawRange(0, numConnected * 2)
  lines.geometry.attributes.position.needsUpdate = true
  lines.geometry.attributes.color.needsUpdate = true

  points.geometry.attributes.position.needsUpdate = true
}

/**
 * Events
 */
let mouseY = 0
let mouseX = 0

const onPointerMove = (event) => {
  if (ready) {
    const windowHalfX = window.innerWidth / 2
    const windowHalfY = window.innerHeight / 2

    mouseX = event.clientX - windowHalfX
    mouseY = event.clientY - windowHalfY
  }
}

document.addEventListener('pointermove', onPointerMove)

const clock = new THREE.Clock()

const tick = () => {
  const elapsedTime = clock.getElapsedTime()
  // const delta = clock.getDelta()

  camera.position.x += (mouseX - camera.position.x) * 0.05
  camera.position.y += (-mouseY + 200 - camera.position.y) * 0.05

  camera.lookAt(scene.position)

  // group.rotation.x = Math.sin(elapsedTime * 0.5) * 2
  // group.rotation.z = Math.cos(elapsedTime * 0.5) * 2

  // group.rotation.x = elapsedTime * 0.5
  // if (animation) {
  //   points.rotation.z = Math.cos(elapsedTime * 0.5)
  //   points.rotation.x = Math.sin(elapsedTime * 0.5)
  // } else {
  //   points.rotation.z = 0
  //   points.rotation.x = 0
  // }
  // console.log(group)
  // if (particleCount === 350 && group.rotation.x === 0) {

  if (particleCount < INIT_PARTICLE_COUNT_OPT) {
    // group.rotation.x = elapsedTime
    // group.rotation.z = elapsedTime
    group.rotation.x = Math.cos(elapsedTime * 0.5)
    group.rotation.z = Math.cos(elapsedTime * 0.5)
    group.rotation.y = Math.sin(elapsedTime * 0.5)
  }

  if (particleCount === INIT_PARTICLE_COUNT_OPT) {
    ready = true
  }

  // if (animation) {
  //   lines.rotation.y = Math.sin(elapsedTime * 0.5)
  // } else {
  //   lines.rotation.y = 0
  // }

  animateParticles(elapsedTime)

  // Update controls
  controls.update()

  // Render
  renderer.render(scene, camera)

  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
}

tick()
