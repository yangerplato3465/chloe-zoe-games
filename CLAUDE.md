# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
npm run dev      # Vite dev server
npm run build    # production build into dist/
npm run preview  # serve the built dist/
```

There is no test runner, linter, formatter or type checker configured. Plain JavaScript (ES modules), no TypeScript.

## What this is

A static site of small tap-only games for young children. Vue 3 + vue-router draw the pages and everything that is DOM; PixiJS 8 draws each game's canvas. It must work on any static host from a sub-folder, which is why `vite.config.js` sets `base: './'` and the router uses hash history (`#/play/<id>`).

## Architecture

### Game registry

`src/games.js` is the single list of games. The home page, the router guard and the document title all read from it. Each entry has a `cover` (imported eagerly, shown on the home card) and a `component` (wrapped in `defineAsyncComponent`, so Pixi and the game code only load when a game is opened).

### The three layers of a game

Every game `<id>` is made of the same pieces:

1. `src/components/<Id>Game.vue`: a few lines that pass `atlases` and `create` to `PixiGame`.
2. `src/<id>/assets.js`: frame references and the `<ID>_ATLASES` list. `src/<id>/game.js`: `create<Id>(app, textures, { onServed, onLayout })`, which builds the scene and returns `{ start }`.
3. `src/components/<Id>Cover.vue`: an SVG miniature of the game built on `CoverScene` (400 x 300 viewBox) using the same atlas art.

`PixiGame.vue` is the host shared by all games. It owns the canvas and the Pixi `Application`, loads textures and the font, and draws the Start button and heart counter in the DOM over the canvas. It also owns music start/stop. Phases go `loading` -> `ready` (Start button showing) -> `playing`.

The contract between `PixiGame` and a game (documented in full at the top of `createShop` in `src/shop/game.js`):

- `onServed()`: a round was completed; the host adds a heart.
- `onLayout({ scale, hudTop, stage })`: called on every (re)layout. Values are in design pixels; the host uses them to position and scale its DOM overlays so they line up with the Pixi scene.
- `start()`: begins an endless `for (;;) await playRound()` loop. Games have no end state, no score other than hearts, and no fail state. A wrong tap only wiggles and plays the `wrong` sound.

Game code never touches Vue, and Pixi objects are deliberately kept out of Vue reactivity.

### Design pixels and layout

Games are laid out in design pixels. `fitToScreen` (`src/scene/screen.js`) scales the `world` container so a game's `SAFE_WIDTH x SAFE_HEIGHT` always fits, then calls the game's `arrange({ width, height, scale })` now and on every resize. Wider or taller screens show more of the scene rather than letterboxing, so `arrange` must position everything from the visible `width`/`height`, not from the safe size.

### Animation and teardown

`createTweens(app.ticker)` (`src/lib/tween.js`) gives `tween(ms, onUpdate, easing)` and `wait(ms)`, both returning promises so rounds are written as straight-line `await` sequences. There is no cancellation: when `PixiGame` unmounts it destroys the app and its ticker, pending tweens simply never resolve, and the round loop stops there. Don't use `setTimeout` or `requestAnimationFrame` in game code, or it will outlive the game.

### Atlases and frame references

Art lives in `Assets/` (capital A, outside `src/`) as TexturePacker JSON + PNG pairs, registered by name in `src/lib/atlases.js`. A frame is always referred to as `"<atlas>/<frame name>"` (e.g. `food/images-11.png`) because atlases reuse frame names. Frame names are meaningless numbers, so each game's `assets.js` maps them to named constants; add new art there rather than using raw frame strings in game code.

The same reference works in two renderers:

- Pixi: `loadTextures(atlasNames)` (`src/lib/textures.js`) returns one `{ ref: Texture }` map.
- DOM/SVG: `AtlasSprite.vue` crops the atlas image with an SVG `viewBox`; `standing()` computes props to rest a frame on a ground line.

`lib/atlases.js` must stay free of Pixi imports so the home page and covers don't pull in the engine.

### Shared scene parts (`src/scene/`)

Reusable Pixi building blocks every game composes: `scenery` (sky, counter, awning in layers, with a per-game awning colour), `customer` (the visiting character with walk/celebrate), `bubble` (thought bubble), `dish` (tappable plate, plus `wiggle`), `box` (the takeaway box used as a serve button), `guide` (step-by-step "tap this next" helper used by the multi-step games) and `fit`. Each is a `createX(...)` factory returning a plain object with a `view` to place. `createCustomer` needs both the `characters` and `food` atlases, since the heart frame is in `food`, unless a game passes its own `characters` and `heart` frames (as `math` does).

Covers mirror the game's look by hand: `CoverScene.vue` repeats the scenery colours and several covers repeat bubble shapes, so a visual change to the shared scenery usually needs a matching change there.

### Audio

`src/lib/sfx.js` (Web Audio, named effects `press` and `wrong`) and `src/lib/bgm.js` (one shared looping `<audio>`, mute state persisted in `localStorage`; a game can pass `PixiGame` its own tune through the `music` prop, as `math` does). Browsers only allow sound after a user gesture, so music starts from the Start button and effects are played from tap handlers.

## Adding a game

1. Add the atlas pair to `Assets/` and register it in `src/lib/atlases.js`.
2. Create `src/<id>/assets.js` and `src/<id>/game.js` following the `create(app, textures, callbacks)` contract.
3. Add `<Id>Game.vue` and `<Id>Cover.vue` in `src/components/`.
4. Add an entry to `src/games.js`.

## Conventions

- Code style: no semicolons, single quotes, 2-space indent, roughly 110-column lines.
- Comments are plain-language and explain why; tunable numbers are named constants at the top of the file with a note on their unit (usually design pixels).
- CSS animations and transitions get a `prefers-reduced-motion: reduce` override.
- Colours and shared CSS variables (`--line`, `--card`, `--ink`, `--pink-deep`, ...) are defined in `src/styles.css`.
