# Dev Notes

Internal notes for working on this interactive portfolio project.

## Current Direction

The app is a `Three.js` interactive portfolio with:

- third-person movement
- room-based exploration
- object interaction
- game-style dialogue UI

The user prefers:

- iterative changes
- no build after every edit
- focused one-by-one improvements

## Main Files

- [src/main.ts](C:\projects\portfolio\src\main.ts)
  - scene setup
  - player controller
  - camera
  - collision
  - onboarding
  - dialogue
  - hotspot data
- [src/style.css](C:\projects\portfolio\src\style.css)
  - HUD styling
  - onboarding window
  - dialogue panel
  - touch UI

## Important Runtime Systems

### 1. Portfolio Content

`portfolioSections` is the main content source.

Each entry controls:

- station/object label
- section subtitle
- description
- chips
- CTA text
- world position

### 2. Dialogue

The dialogue flow currently uses:

- `buildDialoguePages(...)`
- `openDialogue(...)`
- `renderDialoguePage(...)`
- `advanceDialogue(...)`
- `closeDialogue(...)`

Current pattern:

1. overview
2. highlights
3. CTA

### 3. Movement / Camera

- camera-relative movement
- drag to orbit
- touch joystick for move
- second touch for camera look

### 4. Collision

Simple circular obstacle collision:

- room props push the player away
- room bounds are rectangular clamps

## Character / Animation

Assets:

- [public/char/Mannequin_F.glb](C:\projects\portfolio\public\char\Mannequin_F.glb)
- [public/char/UAL2_Standard.glb](C:\projects\portfolio\public\char\UAL2_Standard.glb)

Debug helpers in browser console:

```js
window.debugAnimations.list()
window.debugAnimations.play('Walk_Carry_Loop')
window.debugAnimations.pause()
window.debugAnimations.resume()
window.debugAnimations.stop()
```

## Known Cleanup Opportunities

- replace deprecated `THREE.Clock` usage later if needed
- replace deprecated shadow map setting later if needed
- split `src/main.ts` into modules once interaction flow stabilizes
- remove unused starter dependencies from `package.json`

## Working Style Notes

- default to editing without builds unless necessary
- keep UI game-like, not website-like
- avoid overly flashy interact markers
- preserve mobile friendliness
- prefer small, visible improvements over big rewrites
