import './style.css'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'

type ControlKey = 'up' | 'down' | 'left' | 'right'

declare global {
  interface Window {
    debugAnimations?: {
      list: () => string[]
      play: (clip: string | number, options?: { loop?: boolean; paused?: boolean; timeScale?: number }) => void
      pause: () => void
      resume: () => void
      stop: () => void
      current: () => string | null
    }
  }
}

type Hotspot = {
  id: string
  title: string
  subtitle: string
  description: string
  chips: readonly string[]
  cta: string
  color: number
  position: THREE.Vector3
  root: THREE.Group
  beacon: THREE.Mesh
}

type Obstacle = {
  center: THREE.Vector2
  radius: number
}

const portfolioSections = [
  {
    id: 'about',
    title: 'About Me',
    subtitle: 'Creative developer building playful web experiences',
    description:
      'I design and build immersive websites, interactive demos, and polished product experiences. This world is a portfolio you can walk through instead of scroll past.',
    chips: ['Frontend Systems', 'Creative Development', 'UI Motion'],
    cta: 'Available for freelance and portfolio collaborations.',
    color: 0xff8a3d,
    position: new THREE.Vector3(-8, 0, -6),
  },
  {
    id: 'projects',
    title: 'Featured Projects',
    subtitle: 'Selected work with storytelling and technical depth',
    description:
      'Recent work includes product landing pages, 3D showcases, and custom interaction systems built for performance and personality.',
    chips: ['Three.js', 'TypeScript', 'Responsive UI'],
    cta: 'Best fit for brands, startups, and personal portfolios that need presence.',
    color: 0x5ec8ff,
    position: new THREE.Vector3(9, 0, -4),
  },
  {
    id: 'skills',
    title: 'Skills',
    subtitle: 'Tools I use to shape memorable experiences',
    description:
      'My stack centers on modern frontend engineering with strong visual craft: Three.js, React, animation systems, component architecture, and sharp UI implementation.',
    chips: ['Three.js', 'React', 'Animation', 'Design Systems'],
    cta: 'I like work that blends engineering clarity with bold visuals.',
    color: 0x7dffb2,
    position: new THREE.Vector3(-5, 0, 8),
  },
  {
    id: 'contact',
    title: 'Contact',
    subtitle: 'Let\'s build something people remember',
    description:
      'If you want your portfolio, product, or campaign site to feel alive, this is the kind of interactive direction I can help create.',
    chips: ['Email Ready', 'Remote Friendly', 'Fast Iteration'],
    cta: 'Reach out to start a concept, redesign, or interactive prototype.',
    color: 0xf6df63,
    position: new THREE.Vector3(7, 0, 9),
  },
] as const

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('App root not found')
}

app.innerHTML = `
  <main class="game-shell">
    <section class="viewport-stage" id="viewport-stage">
      <canvas class="viewport-canvas" aria-label="3D third person portfolio experience" tabindex="0"></canvas>

      <div class="startup-hint visible" id="startup-hint">
        <div class="window-topbar">
          <p class="hint-label">Mission Briefing</p>
          <p class="window-status">Portfolio.exe</p>
        </div>
        <p class="brief-step" id="brief-step">Brief 1 / 3</p>
        <h1 id="brief-title">Welcome to an explorable portfolio world.</h1>
        <p class="hint-text" id="brief-text">Instead of scrolling a normal website, you can walk through this small 3D space and inspect glowing stations for projects, skills, contact, and more.</p>
        <div class="onboarding-card" id="brief-card">
          <p class="onboarding-label" id="brief-card-label">Objective</p>
          <p id="brief-card-text">Walk to a glowing station and inspect it to reveal part of the portfolio.</p>
        </div>
        <p class="hint-footnote" id="brief-footnote">This is a game-like portfolio, so the world itself is part of the presentation.</p>
        <button class="primary-button" id="start-button" type="button">Next</button>
      </div>

      <div class="crosshair-wrap">
        <div class="crosshair"></div>
        <div class="center-prompt" id="center-prompt">Walk to a glowing portfolio station</div>
      </div>

      <div class="touch-joystick" id="touch-joystick" aria-hidden="true">
        <div class="touch-joystick-knob" id="touch-joystick-knob"></div>
      </div>

      <button class="interact-fab" id="interact-button" type="button" aria-label="Interact">F</button>
    </section>
  </main>
`

const centerPromptEl = document.querySelector<HTMLElement>('#center-prompt')!
const canvas = document.querySelector<HTMLCanvasElement>('.viewport-canvas')!
const stageEl = document.querySelector<HTMLElement>('#viewport-stage')!
const interactButtonEl = document.querySelector<HTMLButtonElement>('#interact-button')!
const startButtonEl = document.querySelector<HTMLButtonElement>('#start-button')!
const startupHintEl = document.querySelector<HTMLElement>('#startup-hint')!
const briefStepEl = document.querySelector<HTMLElement>('#brief-step')!
const briefTitleEl = document.querySelector<HTMLElement>('#brief-title')!
const briefTextEl = document.querySelector<HTMLElement>('#brief-text')!
const briefCardLabelEl = document.querySelector<HTMLElement>('#brief-card-label')!
const briefCardTextEl = document.querySelector<HTMLElement>('#brief-card-text')!
const briefFootnoteEl = document.querySelector<HTMLElement>('#brief-footnote')!
const touchJoystickEl = document.querySelector<HTMLElement>('#touch-joystick')!
const touchJoystickKnobEl = document.querySelector<HTMLElement>('#touch-joystick-knob')!

const onboardingSteps = [
  {
    step: 'Brief 1 / 3',
    title: 'Welcome to the portfolio world.',
    text: 'Move through the map instead of scrolling a normal site.',
    cardLabel: 'Objective',
    cardText: 'Find a glowing station to open a portfolio section.',
    footnote: 'Each beacon is part of the portfolio.',
    button: 'Next',
  },
  {
    step: 'Brief 2 / 3',
    title: 'Learn the controls.',
    text: 'Desktop: WASD to move, drag to look.',
    cardLabel: 'Controls',
    cardText: 'Mobile: one touch moves, second touch rotates camera.',
    footnote: 'When F appears, you can interact.',
    button: 'Next',
  },
  {
    step: 'Brief 3 / 3',
    title: 'Ready to explore.',
    text: 'Stations lead to projects, skills, contact, and more.',
    cardLabel: 'Goal',
    cardText: 'Walk up, wait for F, then inspect.',
    footnote: 'Start exploring when ready.',
    button: 'Start Exploring',
  },
] as const
let onboardingStepIndex = 0

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(stageEl.clientWidth, stageEl.clientHeight, false)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.outputColorSpace = THREE.SRGBColorSpace

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x09111a)
scene.fog = new THREE.Fog(0x09111a, 18, 42)

const camera = new THREE.PerspectiveCamera(52, stageEl.clientWidth / stageEl.clientHeight, 0.1, 100)
camera.position.set(0, 6, 9)

const clock = new THREE.Clock()
const controls = new Set<ControlKey>()
const inputVector = new THREE.Vector3()
const moveVector = new THREE.Vector3()
const cameraGoal = new THREE.Vector3()
const lookGoal = new THREE.Vector3()
const playerVelocity = new THREE.Vector3()
const cameraForward = new THREE.Vector3()
const cameraRight = new THREE.Vector3()
const playerVisualOffset = new THREE.Vector3()
const facingVector = new THREE.Vector3()
const player2D = new THREE.Vector2()
const obstacleDelta = new THREE.Vector2()
const groundLimit = 12
const playerCollisionRadius = 0.48
const obstacles: Obstacle[] = []
let nearestHotspot: Hotspot | null = null
let promptTimeoutId: number | null = null
let cameraYaw = Math.PI
let cameraPitch = 0.5
let isDragging = false
let lastPointerX = 0
let lastPointerY = 0
let activeLookPointerId: number | null = null
let activeMovePointerId: number | null = null
let touchMoveX = 0
let touchMoveZ = 0
let joystickOriginX = 0
let joystickOriginY = 0
let playerMixer: THREE.AnimationMixer | null = null
let walkAction: THREE.AnimationAction | null = null
let activeAction: THREE.AnimationAction | null = null
let activeClipName: string | null = null
let playerModel: THREE.Object3D | null = null
let playerRigRoot: THREE.Object3D | null = null
let animationSource: THREE.Object3D | null = null
let animationRigRoot: THREE.Object3D | null = null
let animationClips: THREE.AnimationClip[] = []
let playerSkinnedMesh: THREE.SkinnedMesh | null = null
let animationSkinnedMesh: THREE.SkinnedMesh | null = null

const ambientLight = new THREE.HemisphereLight(0xc3e9ff, 0x1b2636, 1.4)
scene.add(ambientLight)

const sun = new THREE.DirectionalLight(0xffffff, 1.9)
sun.position.set(7, 16, 6)
sun.castShadow = true
sun.shadow.mapSize.set(1024, 1024)
sun.shadow.camera.left = -20
sun.shadow.camera.right = 20
sun.shadow.camera.top = 20
sun.shadow.camera.bottom = -20
scene.add(sun)

const accentLight = new THREE.PointLight(0x58d4ff, 20, 40)
accentLight.position.set(-10, 5, -8)
scene.add(accentLight)

const ground = new THREE.Mesh(
  new THREE.CylinderGeometry(14, 16, 2.4, 60),
  new THREE.MeshStandardMaterial({
    color: 0x111d2b,
    roughness: 0.85,
    metalness: 0.12,
    emissive: 0x0a111a,
  }),
)
ground.receiveShadow = true
ground.position.y = -1.2
scene.add(ground)

const grid = new THREE.GridHelper(28, 20, 0x2ba6c9, 0x143247)
grid.position.y = 0.03
;(grid.material as THREE.Material).transparent = true
;(grid.material as THREE.Material).opacity = 0.28
scene.add(grid)

const pathMaterial = new THREE.MeshStandardMaterial({
  color: 0x31455c,
  roughness: 0.6,
  metalness: 0.05,
})

const crossroads = [
  { x: 0, z: 0, width: 18, depth: 2.2 },
  { x: 0, z: 0, width: 2.2, depth: 18 },
  { x: 7.5, z: 7.5, width: 6, depth: 2 },
  { x: -6.5, z: -5.5, width: 5, depth: 2 },
]

crossroads.forEach((path) => {
  const slab = new THREE.Mesh(new THREE.BoxGeometry(path.width, 0.12, path.depth), pathMaterial)
  slab.receiveShadow = true
  slab.position.set(path.x, 0.06, path.z)
  scene.add(slab)
})

const player = new THREE.Group()
const playerVisual = new THREE.Group()
player.add(playerVisual)

const loadingBody = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.28, 0.9, 8, 12),
  new THREE.MeshStandardMaterial({
    color: 0x58d0c0,
    emissive: 0x103f42,
    emissiveIntensity: 0.45,
    roughness: 0.45,
    metalness: 0.12,
  }),
)
loadingBody.castShadow = true
loadingBody.position.y = 1.1
playerVisual.add(loadingBody)

const loadingHead = new THREE.Mesh(
  new THREE.SphereGeometry(0.22, 18, 18),
  new THREE.MeshStandardMaterial({
    color: 0xf2d1b0,
    roughness: 0.7,
    metalness: 0.02,
  }),
)
loadingHead.castShadow = true
loadingHead.position.set(0, 1.82, 0)
playerVisual.add(loadingHead)

const gltfLoader = new GLTFLoader()

function findRigRoot(root: THREE.Object3D) {
  return (
    root.getObjectByProperty('type', 'SkinnedMesh')?.parent ??
    root.getObjectByProperty('type', 'Bone') ??
    root
  )
}

function findSkinnedMesh(root: THREE.Object3D) {
  return root.getObjectByProperty('type', 'SkinnedMesh') as THREE.SkinnedMesh | null
}

function resolveClip(input: string | number) {
  if (typeof input === 'number') {
    return animationClips[input] ?? null
  }

  return (
    animationClips.find((clip) => clip.name === input) ??
    animationClips.find((clip) => clip.name.toLowerCase().includes(input.toLowerCase())) ??
    null
  )
}

function playRetargetedClip(
  clipInput: string | number,
  options: { loop?: boolean; paused?: boolean; timeScale?: number } = {},
) {
  if (!playerRigRoot || !animationRigRoot || !playerSkinnedMesh || !animationSkinnedMesh || animationClips.length === 0) {
    console.warn('Animation system is not ready yet.')
    return
  }

  const clip = resolveClip(clipInput)
  if (!clip) {
    console.warn('Clip not found:', clipInput)
    console.info('Available clips:', animationClips.map((entry) => entry.name))
    return
  }

  try {
    if (!playerMixer) {
      playerMixer = new THREE.AnimationMixer(playerModel)
    }

    if (activeAction) {
      activeAction.stop()
    }

    activeAction = playerMixer.clipAction(clip, playerModel)
    activeAction.reset()
    activeAction.setLoop(options.loop == false ? THREE.LoopOnce : THREE.LoopRepeat, Infinity)
    activeAction.clampWhenFinished = true
    activeAction.setEffectiveTimeScale(options.timeScale ?? 1)
    activeAction.play()
    activeAction.paused = options.paused ?? false
    activeClipName = clip.name

    console.info('Playing clip:', clip.name)
  } catch (error) {
    console.warn('Unable to play clip.', error)
  }
}

window.debugAnimations = {
  list: () => animationClips.map((clip) => clip.name),
  play: (clip, options) => playRetargetedClip(clip, options),
  pause: () => {
    if (activeAction) {
      activeAction.paused = true
    }
  },
  resume: () => {
    if (activeAction) {
      activeAction.paused = false
    }
  },
  stop: () => {
    if (activeAction) {
      activeAction.stop()
      activeAction = null
      activeClipName = null
    }
  },
  current: () => activeClipName,
}


function setupWalkAnimation() {
  if (
    !playerModel ||
    !playerRigRoot ||
    !animationSource ||
    !animationRigRoot ||
    !playerSkinnedMesh ||
    !animationSkinnedMesh ||
    animationClips.length === 0
  ) {
    return
  }

  const walkClip =
    animationClips.find((clip) => clip.name === 'Walk_Carry_Loop') ??
    animationClips.find((clip) => clip.name === 'Zombie_Walk_Fwd_Loop') ??
    animationClips.find((clip) => /walk/i.test(clip.name)) ??
    animationClips.find((clip) => /jog|run/i.test(clip.name)) ??
    animationClips[0]

  try {
    playerMixer = new THREE.AnimationMixer(playerModel)
    walkAction = playerMixer.clipAction(walkClip, playerModel)
    walkAction.reset()
    walkAction.play()
    walkAction.paused = true
    console.info('Loaded walk animation:', walkClip.name)
    console.info('Player rig root:', playerRigRoot.name || playerRigRoot.type)
    console.info('Animation rig root:', animationRigRoot.name || animationRigRoot.type)
    console.info('Player skinned mesh:', playerSkinnedMesh?.name || playerSkinnedMesh?.type)
    console.info('Animation skinned mesh:', animationSkinnedMesh?.name || animationSkinnedMesh?.type)
    console.info('Direct clip binding enabled for matching rigs.')
  } catch (error) {
    console.warn('Unable to retarget walk animation.', error)
  }
}

gltfLoader.load('/char/Mannequin_F.glb', (gltf) => {
  playerVisual.clear()

  const mannequin = gltf.scene
  mannequin.scale.setScalar(1.28)
  mannequin.position.set(0, 0, 0)
  mannequin.rotation.y = 0

  mannequin.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true
      child.receiveShadow = true
    }
  })

  playerModel = mannequin
  playerRigRoot = findRigRoot(mannequin)
  playerSkinnedMesh = findSkinnedMesh(mannequin)
  playerVisual.add(mannequin)
  setupWalkAnimation()
})

gltfLoader.load('/char/UAL2_Standard.glb', (gltf) => {
  animationSource = gltf.scene
  animationRigRoot = findRigRoot(gltf.scene)
  animationSkinnedMesh = findSkinnedMesh(gltf.scene)
  animationClips = gltf.animations
  console.info(
    'Available animation clips:',
    animationClips.map((clip) => clip.name),
  )
  setupWalkAnimation()
})

player.position.set(0, 0, 3)
scene.add(player)

function createRock(x: number, z: number, scale: number) {
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(scale, 0),
    new THREE.MeshStandardMaterial({
      color: 0x243648,
      roughness: 0.9,
      metalness: 0.04,
    }),
  )
  rock.castShadow = true
  rock.receiveShadow = true
  rock.position.set(x, scale * 0.8 - 0.1, z)
  rock.rotation.set(scale, scale * 0.6, scale * 0.3)
  scene.add(rock)
  obstacles.push({
    center: new THREE.Vector2(x, z),
    radius: scale * 0.95 + 0.18,
  })
}

createRock(-10, 2, 0.7)
createRock(-11, -4, 0.5)
createRock(11, 1, 0.85)
createRock(10, -8, 0.55)
createRock(3, 11, 0.6)
createRock(-6, 11, 0.7)

const hotspots: Hotspot[] = portfolioSections.map((section) => {
  const root = new THREE.Group()
  root.position.copy(section.position)

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 1.45, 0.55, 6),
    new THREE.MeshStandardMaterial({
      color: 0x182435,
      roughness: 0.75,
      metalness: 0.1,
      emissive: 0x0b121b,
    }),
  )
  base.castShadow = true
  base.receiveShadow = true
  base.position.y = 0.28
  root.add(base)

  const pillar = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 2.4, 0.9),
    new THREE.MeshStandardMaterial({
      color: section.color,
      emissive: section.color,
      emissiveIntensity: 0.45,
      roughness: 0.35,
      metalness: 0.3,
    }),
  )
  pillar.castShadow = true
  pillar.position.y = 1.6
  root.add(pillar)

  const beacon = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.5, 0),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: section.color,
      emissiveIntensity: 1.2,
      roughness: 0.15,
      metalness: 0.25,
    }),
  )
  beacon.castShadow = true
  beacon.position.y = 3.05
  root.add(beacon)

  const glow = new THREE.PointLight(section.color, 8, 8)
  glow.position.y = 3.1
  root.add(glow)

  scene.add(root)

  obstacles.push({
    center: new THREE.Vector2(section.position.x, section.position.z),
    radius: 1.15,
  })

  return {
    ...section,
    root,
    beacon,
  }
})

function resize() {
  const width = stageEl.clientWidth
  const height = stageEl.clientHeight
  renderer.setSize(width, height, false)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}

function setControl(control: ControlKey, active: boolean) {
  if (active) {
    controls.add(control)
  } else {
    controls.delete(control)
  }
}

function flashPrompt(text: string, active = false) {
  if (promptTimeoutId !== null) {
    window.clearTimeout(promptTimeoutId)
    promptTimeoutId = null
  }

  centerPromptEl.textContent = text
  centerPromptEl.classList.toggle('active', active)

  if (active) {
    promptTimeoutId = window.setTimeout(() => {
      centerPromptEl.textContent = 'Walk to a glowing station'
      centerPromptEl.classList.remove('active')
      promptTimeoutId = null
    }, 1800)
  }
}

function interactWithNearest() {
  if (!nearestHotspot) {
    return
  }

  const distance = nearestHotspot.position.distanceTo(player.position)
  if (distance > 2.4) {
    return
  }

  flashPrompt(`${nearestHotspot.title} discovered`, true)
}

function dismissStartupHint() {
  startupHintEl.classList.remove('visible')
  canvas.focus()
}

function renderOnboardingStep() {
  const step = onboardingSteps[onboardingStepIndex]
  briefStepEl.textContent = step.step
  briefTitleEl.textContent = step.title
  briefTextEl.textContent = step.text
  briefCardLabelEl.textContent = step.cardLabel
  briefCardTextEl.textContent = step.cardText
  briefFootnoteEl.textContent = step.footnote
  startButtonEl.textContent = step.button
}

function advanceOnboarding() {
  if (onboardingStepIndex < onboardingSteps.length - 1) {
    onboardingStepIndex += 1
    renderOnboardingStep()
    return
  }

  dismissStartupHint()
}

function rotateCamera(deltaX: number, deltaY: number) {
  cameraYaw += deltaX * 0.008
  cameraPitch = THREE.MathUtils.clamp(cameraPitch + deltaY * 0.006, 0.2, 1.05)
}

function resolveCollisions() {
  for (const obstacle of obstacles) {
    player2D.set(player.position.x, player.position.z)
    obstacleDelta.set(player2D.x - obstacle.center.x, player2D.y - obstacle.center.y)
    const distance = obstacleDelta.length()
    const minDistance = playerCollisionRadius + obstacle.radius

    if (distance === 0) {
      player.position.x += minDistance
      continue
    }

    if (distance < minDistance) {
      obstacleDelta.setLength(minDistance)
      player.position.x = obstacle.center.x + obstacleDelta.x
      player.position.z = obstacle.center.y + obstacleDelta.y
    }
  }
}

function updateTouchJoystick(pointerX: number, pointerY: number) {
  const deltaX = pointerX - joystickOriginX
  const deltaY = pointerY - joystickOriginY
  const maxRadius = 54
  const distance = Math.hypot(deltaX, deltaY)
  const clampRatio = distance > maxRadius ? maxRadius / distance : 1
  const knobX = deltaX * clampRatio
  const knobY = deltaY * clampRatio

  touchJoystickKnobEl.style.transform = `translate(${knobX}px, ${knobY}px)`
  touchMoveX = knobX / maxRadius
  touchMoveZ = knobY / maxRadius
}

function startTouchJoystick(pointerX: number, pointerY: number, pointerId: number) {
  activeMovePointerId = pointerId
  joystickOriginX = pointerX
  joystickOriginY = pointerY
  touchMoveX = 0
  touchMoveZ = 0
  touchJoystickEl.style.left = `${pointerX}px`
  touchJoystickEl.style.top = `${pointerY}px`
  touchJoystickEl.classList.add('visible')
  touchJoystickKnobEl.style.transform = 'translate(0px, 0px)'
}

function stopTouchJoystick() {
  activeMovePointerId = null
  touchMoveX = 0
  touchMoveZ = 0
  touchJoystickEl.classList.remove('visible')
  touchJoystickKnobEl.style.transform = 'translate(0px, 0px)'
}

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase()

  if (key === 'w' || key === 'arrowup') setControl('up', true)
  if (key === 's' || key === 'arrowdown') setControl('down', true)
  if (key === 'a' || key === 'arrowleft') setControl('left', true)
  if (key === 'd' || key === 'arrowright') setControl('right', true)
  if (key === 'e') interactWithNearest()
  if ((key === 'enter' || key === ' ') && startupHintEl.classList.contains('visible')) advanceOnboarding()
})

window.addEventListener('keyup', (event) => {
  const key = event.key.toLowerCase()

  if (key === 'w' || key === 'arrowup') setControl('up', false)
  if (key === 's' || key === 'arrowdown') setControl('down', false)
  if (key === 'a' || key === 'arrowleft') setControl('left', false)
  if (key === 'd' || key === 'arrowright') setControl('right', false)
})

interactButtonEl.addEventListener('click', interactWithNearest)
startButtonEl.addEventListener('click', advanceOnboarding)
stageEl.addEventListener('pointerdown', (event) => {
  const target = event.target as HTMLElement | null
  if (target?.closest('.interact-fab') || target?.closest('.startup-hint')) {
    return
  }

  if (event.pointerType === 'touch') {
    if (activeMovePointerId === null) {
      startTouchJoystick(event.clientX, event.clientY, event.pointerId)
    } else if (activeLookPointerId === null) {
      isDragging = true
      activeLookPointerId = event.pointerId
      lastPointerX = event.clientX
      lastPointerY = event.clientY
    } else {
      return
    }

    stageEl.setPointerCapture(event.pointerId)
    return
  }

  isDragging = true
  activeLookPointerId = event.pointerId
  lastPointerX = event.clientX
  lastPointerY = event.clientY
  stageEl.setPointerCapture(event.pointerId)
})
window.addEventListener('pointermove', (event) => {
  if (activeMovePointerId === event.pointerId) {
    updateTouchJoystick(event.clientX, event.clientY)
    return
  }

  if (!isDragging || activeLookPointerId !== event.pointerId) {
    return
  }

  rotateCamera(event.clientX - lastPointerX, event.clientY - lastPointerY)
  lastPointerX = event.clientX
  lastPointerY = event.clientY
})
window.addEventListener('pointerup', (event) => {
  if (activeMovePointerId === event.pointerId) {
    if (stageEl.hasPointerCapture(event.pointerId)) {
      stageEl.releasePointerCapture(event.pointerId)
    }

    stopTouchJoystick()
    return
  }

  if (activeLookPointerId !== event.pointerId) {
    return
  }

  if (stageEl.hasPointerCapture(event.pointerId)) {
    stageEl.releasePointerCapture(event.pointerId)
  }

  isDragging = false
  activeLookPointerId = null
})
window.addEventListener('pointercancel', (event) => {
  if (activeMovePointerId === event.pointerId) {
    if (stageEl.hasPointerCapture(event.pointerId)) {
      stageEl.releasePointerCapture(event.pointerId)
    }

    stopTouchJoystick()
    return
  }

  if (activeLookPointerId !== event.pointerId) {
    return
  }

  if (stageEl.hasPointerCapture(event.pointerId)) {
    stageEl.releasePointerCapture(event.pointerId)
  }

  isDragging = false
  activeLookPointerId = null
})
window.addEventListener('resize', resize)

resize()
renderOnboardingStep()

function animate() {
  requestAnimationFrame(animate)

  const delta = Math.min(clock.getDelta(), 0.033)
  const elapsed = clock.elapsedTime

  inputVector.set(
    Number(controls.has('right')) - Number(controls.has('left')) + touchMoveX,
    0,
    Number(controls.has('down')) - Number(controls.has('up')) + touchMoveZ,
  )

  const isMoving = inputVector.lengthSq() > 0

  if (isMoving) {
    inputVector.normalize()

    cameraForward.set(Math.sin(cameraYaw), 0, Math.cos(cameraYaw)).normalize()
    cameraRight.set(cameraForward.z, 0, -cameraForward.x).normalize()
    moveVector
      .copy(cameraRight)
      .multiplyScalar(-inputVector.x)
      .addScaledVector(cameraForward, -inputVector.z)
      .normalize()
      .multiplyScalar(6.2 * delta)
    playerVelocity.lerp(moveVector, 0.22)
    player.position.add(playerVelocity)

    facingVector.copy(moveVector)
    if (inputVector.z > 0 && Math.abs(inputVector.x) < 0.35) {
      facingVector.multiplyScalar(-1)
    }
    player.rotation.y = Math.atan2(facingVector.x, facingVector.z)

    if (walkAction) {
      if (activeAction && activeAction !== walkAction) {
        activeAction.stop()
        activeAction = null
        activeClipName = null
      }
      walkAction.paused = false
      walkAction.enabled = true
      walkAction.setEffectiveWeight(1)
      walkAction.setEffectiveTimeScale(Math.max(0.85, Math.min(1.25, playerVelocity.length() * 16)))
      playerVisualOffset.set(0, 0, 0)
      playerVisual.position.lerp(playerVisualOffset, 0.2)
    } else {
      const stride = Math.sin(elapsed * 12)
      playerVisualOffset.set(0, Math.abs(stride) * 0.08, 0)
      playerVisual.position.lerp(playerVisualOffset, 0.35)
    }
  } else {
    playerVelocity.lerp(new THREE.Vector3(0, 0, 0), 0.16)
    player.position.add(playerVelocity)

    if (walkAction) {
      walkAction.paused = true
      playerVisualOffset.set(0, 0, 0)
      playerVisual.position.lerp(playerVisualOffset, 0.2)
    } else {
      const idle = Math.sin(elapsed * 3)
      playerVisualOffset.set(0, idle * 0.03, 0)
      playerVisual.position.lerp(playerVisualOffset, 0.2)
    }
  }

  if (playerMixer) {
    playerMixer.update(delta)
  }

  const radialDistance = Math.hypot(player.position.x, player.position.z)
  if (radialDistance > groundLimit) {
    const ratio = groundLimit / radialDistance
    player.position.x *= ratio
    player.position.z *= ratio
  }

  resolveCollisions()

  hotspots.forEach((hotspot, index) => {
    hotspot.beacon.rotation.y += delta * (1.2 + index * 0.12)
    hotspot.beacon.position.y = 3.05 + Math.sin(elapsed * 2 + index) * 0.18
    hotspot.root.rotation.y = Math.sin(elapsed * 0.5 + index) * 0.08
  })

  let currentNearest: Hotspot | null = null
  let nearestDistance = Number.POSITIVE_INFINITY

  hotspots.forEach((hotspot) => {
    const distance = hotspot.position.distanceTo(player.position)
    if (distance < nearestDistance) {
      nearestDistance = distance
      currentNearest = hotspot
    }
  })

  nearestHotspot = currentNearest

  if (promptTimeoutId === null) {
    const nearbyHotspot = currentNearest as Hotspot | null

    if (nearbyHotspot !== null && nearestDistance <= 2.4) {
      centerPromptEl.textContent = `Press E to inspect ${nearbyHotspot.title}`
      centerPromptEl.classList.add('active')
      interactButtonEl.classList.add('visible')
    } else {
      centerPromptEl.textContent = 'Walk to a glowing station'
      centerPromptEl.classList.remove('active')
      interactButtonEl.classList.remove('visible')
    }
  }

  cameraGoal.set(
    player.position.x - Math.sin(cameraYaw) * Math.cos(cameraPitch) * 5.2,
    player.position.y + 2.2 + Math.sin(cameraPitch) * 4.2,
    player.position.z - Math.cos(cameraYaw) * Math.cos(cameraPitch) * 5.2,
  )
  lookGoal.set(player.position.x, player.position.y + 1.45, player.position.z)

  camera.position.lerp(cameraGoal, 0.08)
  camera.lookAt(lookGoal)

  renderer.render(scene, camera)
}

animate()
