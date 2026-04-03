# Content Guide

How to update the portfolio text and object content.

## Main Content Source

Edit [src/main.ts](C:\projects\portfolio\src\main.ts).

The main content lives in:

```ts
const portfolioSections = [...]
```

Each object in that array controls one portfolio station/object.

## Fields

### `title`

This is the in-world object name shown in prompts and dialogue speaker text.

Examples:

- `Desk`
- `Shelf`
- `Lamp`
- `Phone`

### `subtitle`

This is the section heading shown in dialogue.

Examples:

- `Featured Projects`
- `Skills`
- `About Me`
- `Contact`

### `description`

Main paragraph for the first dialogue page.

Use this for:

- section summary
- short story
- intro copy

### `chips`

Short tags shown as dialogue chips.

Good examples:

- `Three.js`
- `Frontend Systems`
- `Animation`
- `Remote Friendly`

### `cta`

Final page call-to-action text.

Use this for:

- hiring message
- collaboration message
- contact invitation

### `position`

Controls where the object/station sits in the room.

Example:

```ts
position: new THREE.Vector3(-5.4, 0, -5.2)
```

## Recommended Writing Style

Keep each section:

- short
- easy to scan
- game-friendly in tone

Good rule:

- `description`: 1 to 3 sentences
- `chips`: 3 to 5 items
- `cta`: 1 sentence

## Example

```ts
{
  id: 'projects',
  title: 'Desk',
  subtitle: 'Featured Projects',
  description:
    'Recent work includes interactive landing pages, 3D showcases, and custom portfolio systems built for personality and performance.',
  chips: ['Three.js', 'TypeScript', 'UI Motion'],
  cta: 'Open to interactive web, portfolio, and product experience work.',
  color: 0x5ec8ff,
  position: new THREE.Vector3(-5.4, 0, -5.2),
}
```

## If You Want More Custom Dialogue

Right now, every section follows the same page pattern.

If you want custom multi-page dialogue per object, the next place to edit is:

- `buildDialoguePages(...)` in [src/main.ts](C:\projects\portfolio\src\main.ts)

That is where section data is converted into dialogue pages.
