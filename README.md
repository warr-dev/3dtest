# Interactive Portfolio

A game-style portfolio built with `Vite`, `TypeScript`, and `Three.js`.

Instead of a traditional scrolling page, this project presents portfolio content as a small 3D world. The visitor moves a third-person character around the scene, walks up to interactive objects, and opens portfolio sections through a game-like dialogue window.

## Current Experience

- Third-person character controller
- Mouse drag camera on desktop
- Touch joystick + second-touch camera look on mobile
- Bedroom-style portfolio room
- Interactive portfolio objects:
  - `Desk` -> projects
  - `Shelf` -> skills
  - `Lamp` -> about
  - `Phone` -> contact
- Welcome/onboarding sequence
- In-game dialogue panel for section content
- Basic collision and room boundaries

## Tech Stack

- `Vite`
- `TypeScript`
- `Three.js`
- `GLTFLoader`

## Run Locally

Install dependencies if needed:

```powershell
npm install
```

Start local dev:

```powershell
npm run dev
```

Start dev on your local network:

```powershell
npm run dev:network
```

Production build:

```powershell
npm run build
```

Preview build:

```powershell
npm run preview
```

## Controls

### Desktop

- `WASD` or Arrow Keys: move
- Mouse drag: rotate camera
- `F`: interact with nearby object
- `Enter` / `Space`: advance onboarding or dialogue
- `Esc`: close dialogue

### Mobile

- First touch: movement joystick
- Second touch: camera look
- `F` button: interact when available
- Dialogue buttons: progress or close content

## Project Structure

- [src/main.ts](C:\projects\portfolio\src\main.ts)
  - main scene setup
  - controls
  - camera logic
  - interaction system
  - dialogue flow
  - room geometry
- [src/style.css](C:\projects\portfolio\src\style.css)
  - HUD styles
  - onboarding window
  - dialogue panel
  - mobile controls
- [public/char/Mannequin_F.glb](C:\projects\portfolio\public\char\Mannequin_F.glb)
  - player character model
- [public/char/UAL2_Standard.glb](C:\projects\portfolio\public\char\UAL2_Standard.glb)
  - animation source library
- [vite.network.config.ts](C:\projects\portfolio\vite.network.config.ts)
  - separate Vite cache for network dev serving

## Scene Layout

The current world is a stylized bedroom/studio layout:

- `Desk` station on the left-back side
- `Shelf` station on the right-back side
- `Lamp` station on the left-mid side
- `Phone` station near the front/door side

The room uses:

- rectangular movement bounds
- simple furniture meshes
- obstacle collision for major props

## Dialogue System

When the player interacts with an object:

1. the nearest valid hotspot is detected
2. a dialogue panel opens
3. content is shown as paged portfolio dialogue
4. the player can go `Next` or `Close`

Each section currently uses a shared 3-page structure:

1. overview
2. highlights
3. call-to-action

This logic is defined in [src/main.ts](C:\projects\portfolio\src\main.ts) through:

- `buildDialoguePages(...)`
- `openDialogue(...)`
- `advanceDialogue(...)`
- `closeDialogue(...)`

## Animation Notes

The character model and animation pack are loaded from `.glb` files in `public/char`.

Debug helpers are exposed in the browser console:

```js
window.debugAnimations.list()
window.debugAnimations.play('Walk_Carry_Loop')
window.debugAnimations.pause()
window.debugAnimations.resume()
window.debugAnimations.stop()
window.debugAnimations.current()
```

## Customizing Portfolio Content

Update `portfolioSections` in [src/main.ts](C:\projects\portfolio\src\main.ts) to change:

- object label
- section title
- description
- chips/tags
- call-to-action text
- scene position

This is the main content source for the current portfolio stations.

## Good Next Steps

If you want to keep developing this project, good next upgrades are:

1. replace simple room meshes with a real room model
2. create custom dialogue pages per section
3. add portraits, icons, or typewriter effects to dialogue
4. improve camera collision with walls
5. add more polished animations for idle and interaction
6. swap placeholder props with more detailed 3D assets

## Notes

- The project is currently developed incrementally in dev mode.
- Some older dependencies remain in `package.json` from the starter template, but the current scene logic is plain `Three.js` in [src/main.ts](C:\projects\portfolio\src\main.ts).
