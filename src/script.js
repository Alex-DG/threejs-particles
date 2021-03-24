import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'

/**
 * Base
 */
// Debug
const gui = new dat.GUI()
// Canvas
const canvas = document.querySelector('canvas.webgl')
// Scene
const scene = new THREE.Scene()

/**
 * Particles
 */
const is2d = true
const particlesData = []
const maxParticleCount = 1000
const r = 800
const rHalf = r / 2

const effectController = {
  showDots: true,
  showLines: true,
  startAnimation: false,
  minDistance: 150,
  limitConnections: false,
  maxConnections: 20,
  particleCount: 200,
}

let particleCount = 200
let group
let positions, colors
let particles
let pointCloud
let particlePositions
let linesMesh
let animation = false

group = new THREE.Group()
scene.add(group)

const helper = new THREE.BoxHelper(
  new THREE.Mesh(new THREE.BoxGeometry(r, r, r))
)
helper.material.color.setHex(0x101010)
helper.material.blending = THREE.AdditiveBlending
helper.material.transparent = true
group.add(helper)

const segments = maxParticleCount * maxParticleCount

positions = new Float32Array(segments * 3)
colors = new Float32Array(segments * 3)

const pMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 3,
  blending: THREE.AdditiveBlending,
  transparent: true,
  sizeAttenuation: false,
})

particles = new THREE.BufferGeometry()
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

particles.setDrawRange(0, particleCount)
particles.setAttribute(
  'position',
  new THREE.BufferAttribute(particlePositions, 3).setUsage(
    THREE.DynamicDrawUsage
  )
)

// create the particle system
pointCloud = new THREE.Points(particles, pMaterial)
group.add(pointCloud)

const geometry = new THREE.BufferGeometry()

geometry.setAttribute(
  'position',
  new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage)
)
geometry.setAttribute(
  'color',
  new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage)
)

geometry.computeBoundingSphere()

geometry.setDrawRange(0, 0)

const material = new THREE.LineBasicMaterial({
  vertexColors: true,
  blending: THREE.AdditiveBlending,
  transparent: true,
})

linesMesh = new THREE.LineSegments(geometry, material)
group.add(linesMesh)

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
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

// Handle double click (not workign for safari)
// window.addEventListener('dblclick', () => {
//   if (!document.fullscreenElement) {
//     canvas.requestFullscreen()
//   } else {
//     document.exitFullscreen()
//   }
// })
// make it work with safari
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
  45,
  sizes.width / sizes.height,
  0.1,
  4000
)
camera.position.z = 1750

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

// GUI
gui.add(effectController, 'showDots').onChange((value) => {
  pointCloud.visible = value
})
gui.add(effectController, 'showLines').onChange((value) => {
  linesMesh.visible = value
})
gui.add(effectController, 'startAnimation').onChange((value) => {
  animation = value
})
gui.add(effectController, 'minDistance', 10, 300)
gui.add(effectController, 'maxConnections', 0, 30, 1)
gui
  .add(effectController, 'particleCount', 0, maxParticleCount, 1)
  .onChange((value) => {
    particleCount = parseInt(value)
    particles.setDrawRange(0, particleCount)
  })

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
})

renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const animate = () => {
  let vertexpos = 0
  let colorpos = 0
  let numConnected = 0

  for (let i = 0; i < particleCount; i++) particlesData[i].numConnections = 0

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

        const alpha = 1.0 - dist / effectController.minDistance

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

  linesMesh.geometry.setDrawRange(0, numConnected * 2)
  linesMesh.geometry.attributes.position.needsUpdate = true
  linesMesh.geometry.attributes.color.needsUpdate = true

  pointCloud.geometry.attributes.position.needsUpdate = true
}

const clock = new THREE.Clock()

const tick = () => {
  const elapsedTime = clock.getElapsedTime()

  // group.rotation.y = elapsedTime * 0.2
  if (animation) {
    pointCloud.rotation.z = Math.cos(elapsedTime * 0.5)
    pointCloud.rotation.x = Math.sin(elapsedTime * 0.5)
  }

  animate()

  // Update controls
  controls.update()

  // Render
  renderer.render(scene, camera)

  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
}

tick()
