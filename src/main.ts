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
  marker: THREE.Mesh
  beacon: THREE.Mesh
}

type Obstacle = {
  center: THREE.Vector2
  radius: number
}

type DialoguePage = {
  title: string
  text: string
  chips?: readonly string[]
}

const portfolioSections = [
  {
    id: 'about',
    title: 'Lamp',
    subtitle: 'About Me',
    description:
      'I am Warren Dalawampu, a software engineer with backend, systems, and platform development experience across gaming, insurance, internal tools, and infrastructure-focused projects.',
    chips: ['Software Engineer', 'Backend Development', 'Systems Work'],
    cta: 'Based in Pasig City and open to building solid systems with product-minded teams.',
    color: 0xff8a3d,
    position: new THREE.Vector3(-5.2, 0, 1.5),
  },
  {
    id: 'projects',
    title: 'Desk',
    subtitle: 'Featured Projects',
    description:
      'Recent work includes online casino platform development, a localized LAN-based casino system built from Ubuntu upward, backend APIs, streaming servers, microservices, and internal tools for operations and admin workflows.',
    chips: ['Casino Platform', 'Microservices', 'Laravel', 'Node.js'],
    cta: 'Strong fit for backend-heavy products, platform work, and custom operational systems.',
    color: 0x5ec8ff,
    position: new THREE.Vector3(-5.4, 0, -5.2),
  },
  {
    id: 'skills',
    title: 'Shelf',
    subtitle: 'Skills',
    description:
      'My stack covers backend engineering, APIs, databases, infrastructure, containerized development, Linux systems, hardware integration, and frontend work when needed.',
    chips: ['PHP', 'Laravel', 'Node.js', 'MongoDB', 'Docker', 'Linux'],
    cta: 'Comfortable across application code, deployment flow, and low-level integration points.',
    color: 0x7dffb2,
    position: new THREE.Vector3(5.9, 0, -4.8),
  },
  {
    id: 'contact',
    title: 'Phone',
    subtitle: 'Contact',
    description:
      'You can reach me directly for backend development, systems engineering, platform work, or technical problem solving across product and infrastructure projects.',
    chips: ['warrdev08@gmail.com', '+63 956 164 5935', 'github.com/warr-dev'],
    cta: 'Reach out by email or GitHub if you want to talk about opportunities or collaboration.',
    color: 0xf6df63,
    position: new THREE.Vector3(2.4, 0, 6.3),
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
        <p class="hint-text" id="brief-text">Move through the room instead of scrolling a normal site.</p>
        <div class="onboarding-card" id="brief-card">
          <p class="onboarding-label" id="brief-card-label">Objective</p>
          <p id="brief-card-text">Find an interactive object to open a portfolio section.</p>
        </div>
        <p class="hint-footnote" id="brief-footnote">Each room object is part of the portfolio.</p>
        <button class="primary-button" id="start-button" type="button">Next</button>
      </div>

      <div class="crosshair-wrap">
        <div class="crosshair"></div>
        <div class="center-prompt" id="center-prompt">Walk to an interactive object</div>
      </div>

      <section class="dialogue-panel" id="dialogue-panel" aria-live="polite">
        <div class="dialogue-topbar">
          <p class="dialogue-channel">Portfolio Link</p>
          <p class="dialogue-progress" id="dialogue-progress">1 / 3</p>
        </div>
        <p class="dialogue-speaker" id="dialogue-speaker">Desk</p>
        <h2 class="dialogue-title" id="dialogue-title">Featured Projects</h2>
        <p class="dialogue-text" id="dialogue-text">Recent work includes product landing pages, 3D showcases, and custom interaction systems built for performance and personality.</p>
        <div class="dialogue-chips" id="dialogue-chips"></div>
        <div class="dialogue-actions">
          <button class="secondary-button" id="dialogue-close" type="button">Close</button>
          <button class="primary-button dialogue-next" id="dialogue-next" type="button">Next</button>
        </div>
      </section>

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
const dialoguePanelEl = document.querySelector<HTMLElement>('#dialogue-panel')!
const dialogueProgressEl = document.querySelector<HTMLElement>('#dialogue-progress')!
const dialogueSpeakerEl = document.querySelector<HTMLElement>('#dialogue-speaker')!
const dialogueTitleEl = document.querySelector<HTMLElement>('#dialogue-title')!
const dialogueTextEl = document.querySelector<HTMLElement>('#dialogue-text')!
const dialogueChipsEl = document.querySelector<HTMLElement>('#dialogue-chips')!
const dialogueCloseEl = document.querySelector<HTMLButtonElement>('#dialogue-close')!
const dialogueNextEl = document.querySelector<HTMLButtonElement>('#dialogue-next')!
const touchJoystickEl = document.querySelector<HTMLElement>('#touch-joystick')!
const touchJoystickKnobEl = document.querySelector<HTMLElement>('#touch-joystick-knob')!

const onboardingSteps = [
  {
    step: 'Brief 1 / 3',
    title: 'Welcome to the portfolio world.',
    text: 'Move through the map instead of scrolling a normal site.',
    cardLabel: 'Objective',
    cardText: 'Find an interactive object to open a portfolio section.',
    footnote: 'Each room object is part of the portfolio.',
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
    text: 'Objects in the room lead to projects, skills, contact, and more.',
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
const roomMinX = -8.4
const roomMaxX = 8.4
const roomMinZ = -7.4
const roomMaxZ = 7.4
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
let activeDialogueHotspot: Hotspot | null = null
let activeDialoguePages: DialoguePage[] = []
let activeDialogueIndex = 0
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

const floorMaterial = new THREE.MeshStandardMaterial({
  color: 0x1d2b38,
  roughness: 0.92,
  metalness: 0.04,
})

const wallMaterial = new THREE.MeshStandardMaterial({
  color: 0x223140,
  roughness: 0.88,
  metalness: 0.03,
})

const trimMaterial = new THREE.MeshStandardMaterial({
  color: 0x344a60,
  roughness: 0.6,
  metalness: 0.08,
})

const woodMaterial = new THREE.MeshStandardMaterial({
  color: 0x6e4d37,
  roughness: 0.82,
  metalness: 0.04,
})

const fabricMaterial = new THREE.MeshStandardMaterial({
  color: 0x405a78,
  roughness: 0.95,
  metalness: 0.02,
})

const accentPropMaterial = new THREE.MeshStandardMaterial({
  color: 0x8ecbff,
  roughness: 0.4,
  metalness: 0.15,
  emissive: 0x0d1d2e,
})

const roomFloor = new THREE.Mesh(new THREE.BoxGeometry(18.5, 0.4, 16.5), floorMaterial)
roomFloor.receiveShadow = true
roomFloor.position.set(0, -0.2, 0)
scene.add(roomFloor)

const rug = new THREE.Mesh(
  new THREE.BoxGeometry(7.2, 0.04, 4.6),
  new THREE.MeshStandardMaterial({
    color: 0x2f4563,
    roughness: 0.96,
    metalness: 0.02,
  }),
)
rug.receiveShadow = true
rug.position.set(0, 0.03, 0.2)
scene.add(rug)

const walls = [
  { size: [18.5, 4.2, 0.3], pos: [0, 2.1, -8.25] },
  { size: [18.5, 4.2, 0.3], pos: [0, 2.1, 8.25] },
  { size: [0.3, 4.2, 16.5], pos: [-9.25, 2.1, 0] },
  { size: [0.3, 4.2, 16.5], pos: [9.25, 2.1, 0] },
] as const

walls.forEach((wall) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...wall.size), wallMaterial)
  mesh.receiveShadow = true
  mesh.position.set(...wall.pos)
  scene.add(mesh)
})

const ceilingTrim = new THREE.Mesh(new THREE.BoxGeometry(17.8, 0.12, 15.8), trimMaterial)
ceilingTrim.position.set(0, 4.22, 0)
ceilingTrim.receiveShadow = true
scene.add(ceilingTrim)

const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.9, 0.08), trimMaterial)
windowFrame.position.set(0, 2.35, -8.07)
scene.add(windowFrame)

const windowGlow = new THREE.Mesh(
  new THREE.PlaneGeometry(3, 1.5),
  new THREE.MeshBasicMaterial({
    color: 0x7dc6ff,
    transparent: true,
    opacity: 0.35,
  }),
)
windowGlow.position.set(0, 2.35, -8.01)
scene.add(windowGlow)

const door = new THREE.Mesh(new THREE.BoxGeometry(1.8, 3.2, 0.14), woodMaterial)
door.position.set(0, 1.6, 8.03)
door.receiveShadow = true
scene.add(door)

const desk = new THREE.Group()
desk.position.set(-5.5, 0, -4.9)
const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.14, 1.1), woodMaterial)
deskTop.position.y = 1.1
deskTop.castShadow = true
deskTop.receiveShadow = true
desk.add(deskTop)
;[
  [-0.95, 0.52, -0.42],
  [0.95, 0.52, -0.42],
  [-0.95, 0.52, 0.42],
  [0.95, 0.52, 0.42],
].forEach(([x, y, z]) => {
  const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.04, 0.12), trimMaterial)
  leg.position.set(x, y, z)
  leg.castShadow = true
  desk.add(leg)
})
const monitor = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.58, 0.08), accentPropMaterial)
monitor.position.set(0, 1.55, -0.18)
monitor.castShadow = true
desk.add(monitor)
scene.add(desk)
obstacles.push({ center: new THREE.Vector2(-5.5, -4.9), radius: 1.25 })

const chair = new THREE.Group()
chair.position.set(-4.4, 0, -3.8)
const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 0.8), fabricMaterial)
chairSeat.position.y = 0.62
chairSeat.castShadow = true
chair.add(chairSeat)
const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.12), fabricMaterial)
chairBack.position.set(0, 1.08, -0.34)
chairBack.castShadow = true
chair.add(chairBack)
scene.add(chair)
obstacles.push({ center: new THREE.Vector2(-4.4, -3.8), radius: 0.55 })

const bed = new THREE.Group()
bed.position.set(-5.8, 0, 2.6)
const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.5, 3.6), woodMaterial)
bedFrame.position.y = 0.25
bedFrame.castShadow = true
bedFrame.receiveShadow = true
bed.add(bedFrame)
const mattress = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.36, 3.25), fabricMaterial)
mattress.position.y = 0.68
mattress.castShadow = true
bed.add(mattress)
const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.2, 0.52), new THREE.MeshStandardMaterial({
  color: 0xe7edf5,
  roughness: 0.98,
  metalness: 0.01,
}))
pillow.position.set(0, 0.96, -1.02)
bed.add(pillow)
scene.add(bed)
obstacles.push({ center: new THREE.Vector2(-5.8, 2.6), radius: 1.45 })

const lampTable = new THREE.Group()
lampTable.position.set(-5.1, 0, 1.55)
const sideTable = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.72, 0.72), woodMaterial)
sideTable.position.y = 0.36
sideTable.castShadow = true
sideTable.receiveShadow = true
lampTable.add(sideTable)
const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.7), trimMaterial)
lampStem.position.y = 0.9
lampTable.add(lampStem)
const lampShade = new THREE.Mesh(
  new THREE.CylinderGeometry(0.18, 0.32, 0.38, 12),
  new THREE.MeshStandardMaterial({
    color: 0xffd89f,
    emissive: 0xffb56b,
    emissiveIntensity: 0.35,
    roughness: 0.7,
    metalness: 0.02,
  }),
)
lampShade.position.y = 1.28
lampTable.add(lampShade)
scene.add(lampTable)
obstacles.push({ center: new THREE.Vector2(-5.1, 1.55), radius: 0.62 })

const shelf = new THREE.Group()
shelf.position.set(6.2, 0, -5.1)
const shelfBody = new THREE.Mesh(new THREE.BoxGeometry(1.35, 2.7, 0.52), woodMaterial)
shelfBody.position.y = 1.35
shelfBody.castShadow = true
shelfBody.receiveShadow = true
shelf.add(shelfBody)
;[-0.8, 0, 0.8].forEach((yOffset) => {
  const level = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.08, 0.5), trimMaterial)
  level.position.y = 1.35 + yOffset
  shelf.add(level)
})
scene.add(shelf)
obstacles.push({ center: new THREE.Vector2(6.2, -5.1), radius: 0.9 })

const dresser = new THREE.Group()
dresser.position.set(6, 0, 2.6)
const dresserBody = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 0.72), woodMaterial)
dresserBody.position.y = 0.7
dresserBody.castShadow = true
dresserBody.receiveShadow = true
dresser.add(dresserBody)
scene.add(dresser)
obstacles.push({ center: new THREE.Vector2(6, 2.6), radius: 0.92 })

const plantPot = new THREE.Mesh(
  new THREE.CylinderGeometry(0.24, 0.28, 0.42, 12),
  new THREE.MeshStandardMaterial({
    color: 0x77513b,
    roughness: 0.88,
    metalness: 0.02,
  }),
)
plantPot.position.set(1.9, 0.21, -6.6)
plantPot.castShadow = true
scene.add(plantPot)

const plantLeaves = new THREE.Mesh(
  new THREE.ConeGeometry(0.48, 1.1, 8),
  new THREE.MeshStandardMaterial({
    color: 0x5ca46b,
    roughness: 0.9,
    metalness: 0.01,
  }),
)
plantLeaves.position.set(1.9, 0.95, -6.6)
plantLeaves.castShadow = true
scene.add(plantLeaves)
obstacles.push({ center: new THREE.Vector2(1.9, -6.6), radius: 0.5 })

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

player.position.set(0, 0, 4.8)
scene.add(player)

const hotspots: Hotspot[] = portfolioSections.map((section) => {
  const root = new THREE.Group()
  root.position.copy(section.position)

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.52, 0.62, 0.2, 18),
    new THREE.MeshStandardMaterial({
      color: 0x152231,
      roughness: 0.82,
      metalness: 0.1,
      emissive: 0x0b121b,
    }),
  )
  base.castShadow = true
  base.position.y = 0.1
  root.add(base)

  const marker = new THREE.Mesh(
    new THREE.TorusGeometry(0.74, 0.08, 12, 32),
    new THREE.MeshStandardMaterial({
      color: section.color,
      emissive: section.color,
      emissiveIntensity: 0.28,
      roughness: 0.22,
      metalness: 0.08,
      transparent: true,
      opacity: 0.46,
      side: THREE.DoubleSide,
    }),
  )
  marker.rotation.x = Math.PI / 2
  marker.position.y = 1.05
  root.add(marker)

  const beacon = new THREE.Mesh(
    new THREE.RingGeometry(0.22, 0.36, 24),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: section.color,
      emissiveIntensity: 0.34,
      roughness: 0.28,
      metalness: 0.18,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
    }),
  )
  beacon.castShadow = true
  beacon.rotation.x = Math.PI / 2
  beacon.position.y = 1.72
  root.add(beacon)

  const glow = new THREE.PointLight(section.color, 1.6, 3)
  glow.position.y = 1.3
  root.add(glow)

  scene.add(root)

  obstacles.push({
    center: new THREE.Vector2(section.position.x, section.position.z),
    radius: 0.8,
  })

  return {
    ...section,
    root,
    marker,
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
      centerPromptEl.textContent = 'Walk to an interactive object'
      centerPromptEl.classList.remove('active')
      promptTimeoutId = null
    }, 1800)
  }
}

function buildDialoguePages(hotspot: Hotspot): DialoguePage[] {
  if (hotspot.id === 'about') {
    return [
      {
        title: hotspot.subtitle,
        text: 'I am Warren Dalawampu, a software engineer focused on backend systems, platforms, integrations, and reliable delivery across complex technical environments.',
        chips: ['Pasig City', 'Software Engineer', 'Backend + Systems'],
      },
      {
        title: 'Career Path',
        text: 'My recent roles include Senior Backend Developer at NTT Limited Philippines Branch, Configuration Analyst at EClaro Philippines, PHP Developer at 1 Bit Software Development Corp., and Junior Backend Developer at MVSoftech.',
      },
      {
        title: 'Education',
        text: 'I earned a BS in Information Technology from Mindoro State University and also pursued a Master of Science in Information Technology at Batangas State University.',
      },
    ]
  }

  if (hotspot.id === 'projects') {
    return [
      {
        title: hotspot.subtitle,
        text: 'Recent work includes building an online casino gaming platform and developing a localized casino system from scratch under a LAN server setup.',
        chips: ['Gaming Platform', 'LAN System', 'Platform Engineering'],
      },
      {
        title: 'System Work',
        text: 'I have built RESTful APIs, streaming servers, microservices, admin tooling, notification bots, and internal operational systems using Laravel, Node.js, MongoDB, MySQL, and related backend tooling.',
      },
      {
        title: 'Low-Level + Integration',
        text: 'I also worked on C++ hardware drivers for casino terminals, exposed device functionality through WebSocket services, and integrated payment providers such as Xendit and UnionBank.',
      },
    ]
  }

  if (hotspot.id === 'skills') {
    return [
      {
        title: hotspot.subtitle,
        text: 'My technical stack spans PHP, Laravel, Node.js, C#, Python, REST APIs, microservices, TDD, MongoDB, MySQL, Redis or Memcached, RabbitMQ, and Protobuf.',
        chips: ['Laravel', 'Node.js', 'MongoDB', 'MySQL'],
      },
      {
        title: 'Infrastructure',
        text: 'I regularly work with Docker, Linux, virtual machines, reverse proxies, self-hosted GitLab, CI/CD pipelines, GitHub Actions, Nginx, Apache, WireGuard, and on-prem services.',
      },
      {
        title: 'Extra Depth',
        text: 'Beyond application code, I have experience with hardware troubleshooting, network-related work, proprietary device libraries, driver development, and operational tooling.',
      },
    ]
  }

  if (hotspot.id === 'contact') {
    return [
      {
        title: hotspot.subtitle,
        text: 'If you need help with backend engineering, systems integration, infrastructure-aware application work, or platform development, I am open to discussing opportunities.',
        chips: ['warrdev08@gmail.com', '+63 956 164 5935'],
      },
      {
        title: 'Where To Reach Me',
        text: 'Email is the fastest way to reach me, and my code history and public work can also be viewed through GitHub.',
        chips: ['github.com/warr-dev'],
      },
      {
        title: 'Next Move',
        text: 'Reach out if you want to discuss a role, a backend-heavy project, or a technical system that needs solid implementation.',
      },
    ]
  }

  return [
    {
      title: hotspot.subtitle,
      text: hotspot.description,
      chips: hotspot.chips,
    },
    {
      title: 'Highlights',
      text: hotspot.chips.join(' • '),
    },
    {
      title: 'Next Move',
      text: hotspot.cta,
    },
  ]
}

function renderDialoguePage() {
  const page = activeDialoguePages[activeDialogueIndex]
  if (!activeDialogueHotspot || !page) {
    return
  }

  dialogueSpeakerEl.textContent = activeDialogueHotspot.title
  dialogueTitleEl.textContent = page.title
  dialogueTextEl.textContent = page.text
  dialogueProgressEl.textContent = `${activeDialogueIndex + 1} / ${activeDialoguePages.length}`
  dialogueNextEl.textContent = activeDialogueIndex === activeDialoguePages.length - 1 ? 'Close' : 'Next'

  dialogueChipsEl.innerHTML = ''
  for (const chip of page.chips ?? []) {
    const chipEl = document.createElement('span')
    chipEl.className = 'dialogue-chip'
    chipEl.textContent = chip
    dialogueChipsEl.append(chipEl)
  }
}

function closeDialogue() {
  activeDialogueHotspot = null
  activeDialoguePages = []
  activeDialogueIndex = 0
  dialoguePanelEl.classList.remove('visible')
  controls.clear()
  touchMoveX = 0
  touchMoveZ = 0
  canvas.focus()
}

function advanceDialogue() {
  if (!activeDialogueHotspot) {
    return
  }

  if (activeDialogueIndex < activeDialoguePages.length - 1) {
    activeDialogueIndex += 1
    renderDialoguePage()
    return
  }

  closeDialogue()
}

function openDialogue(hotspot: Hotspot) {
  activeDialogueHotspot = hotspot
  activeDialoguePages = buildDialoguePages(hotspot)
  activeDialogueIndex = 0
  controls.clear()
  touchMoveX = 0
  touchMoveZ = 0
  stopTouchJoystick()
  renderDialoguePage()
  dialoguePanelEl.classList.add('visible')
}

function interactWithNearest() {
  if (!nearestHotspot) {
    return
  }

  const distance = nearestHotspot.position.distanceTo(player.position)
  if (distance > 2.4) {
    return
  }

  openDialogue(nearestHotspot)
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

  if (dialoguePanelEl.classList.contains('visible')) {
    if (key === 'escape') closeDialogue()
    if (key === 'enter' || key === ' ') advanceDialogue()
    return
  }

  if (key === 'w' || key === 'arrowup') setControl('up', true)
  if (key === 's' || key === 'arrowdown') setControl('down', true)
  if (key === 'a' || key === 'arrowleft') setControl('left', true)
  if (key === 'd' || key === 'arrowright') setControl('right', true)
  if (key === 'f') interactWithNearest()
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
dialogueCloseEl.addEventListener('click', closeDialogue)
dialogueNextEl.addEventListener('click', advanceDialogue)
stageEl.addEventListener('pointerdown', (event) => {
  const target = event.target as HTMLElement | null
  if (target?.closest('.interact-fab') || target?.closest('.startup-hint') || target?.closest('.dialogue-panel')) {
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

  player.position.x = THREE.MathUtils.clamp(player.position.x, roomMinX, roomMaxX)
  player.position.z = THREE.MathUtils.clamp(player.position.z, roomMinZ, roomMaxZ)

  resolveCollisions()

  hotspots.forEach((hotspot, index) => {
    const orbitAngle = elapsed * (0.9 + index * 0.08)
    hotspot.marker.position.x = Math.cos(orbitAngle) * 0.18
    hotspot.marker.position.z = Math.sin(orbitAngle) * 0.18
    hotspot.marker.position.y = 1.05 + Math.sin(elapsed * 1.4 + index) * 0.06
    hotspot.marker.rotation.z += delta * (0.6 + index * 0.03)
    hotspot.beacon.rotation.z += delta * (0.5 + index * 0.04)
    hotspot.beacon.position.y = 1.72 + Math.sin(elapsed * 1.6 + index) * 0.05
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
    if (dialoguePanelEl.classList.contains('visible')) {
      centerPromptEl.textContent = 'Press Enter to continue dialogue'
      centerPromptEl.classList.add('active')
      interactButtonEl.classList.remove('visible')
    } else {
    const nearbyHotspot = currentNearest as Hotspot | null

      if (nearbyHotspot !== null && nearestDistance <= 2.4) {
        centerPromptEl.textContent = `Press F to inspect ${nearbyHotspot.title}`
        centerPromptEl.classList.add('active')
        interactButtonEl.classList.add('visible')
      } else {
        centerPromptEl.textContent = 'Walk to an interactive object'
        centerPromptEl.classList.remove('active')
        interactButtonEl.classList.remove('visible')
      }
    }
  }

  cameraGoal.set(
    player.position.x - Math.sin(cameraYaw) * Math.cos(cameraPitch) * 5.2,
    player.position.y + 2.2 + Math.sin(cameraPitch) * 4.2,
    player.position.z - Math.cos(cameraYaw) * Math.cos(cameraPitch) * 5.2,
  )
  cameraGoal.x = THREE.MathUtils.clamp(cameraGoal.x, roomMinX + 0.7, roomMaxX - 0.7)
  cameraGoal.z = THREE.MathUtils.clamp(cameraGoal.z, roomMinZ + 0.7, roomMaxZ - 0.7)
  cameraGoal.y = THREE.MathUtils.clamp(cameraGoal.y, 1.6, 3.7)
  lookGoal.set(player.position.x, player.position.y + 1.45, player.position.z)

  camera.position.lerp(cameraGoal, 0.08)
  camera.lookAt(lookGoal)

  renderer.render(scene, camera)
}

animate()
