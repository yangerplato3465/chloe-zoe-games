<script setup>
import { Application } from 'pixi.js'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import AtlasSprite from './AtlasSprite.vue'
import HeartTally from './HeartTally.vue'
import { UI, findFrame } from '../lib/atlases.js'
import { preloadBgm, startBgm, stopBgm } from '../lib/bgm.js'
import { playSfx, preloadSfx } from '../lib/sfx.js'
import { loadTextures } from '../lib/textures.js'

// Hosts a Pixi game: owns the canvas and the Pixi app, and draws what every game shares over
// it, the Start button and the heart counter. It also plays the music, from Start until the
// player leaves.
const props = defineProps({
  // The names of the atlases the game draws from (see lib/atlases.js).
  atlases: { type: Array, required: true },
  // create(app, textures, { onServed, onLayout }) builds the scene and returns { start }.
  // shop/game.js describes the callbacks.
  create: { type: Function, required: true },
  // For a game that brings its own art for what is drawn over the canvas:
  //   startButton, startWidth   the Start button's frame and its widest size, in design pixels
  //   tally                     HeartTally's frame, heart, height and inset
  // Anything left out is the shared art.
  skin: { type: Object, default: () => ({}) },
  // The address of a tune of the game's own, to play instead of the shared one.
  music: { type: String, default: undefined },
})

// In the game's design pixels.
const START_MAX_WIDTH = 300
const START_MARGIN = 4

const root = ref(null)
const canvas = ref(null)
const hearts = ref(0)
// 'loading' until the scene is drawn, 'ready' while the Start button waits, then 'playing'.
const phase = ref('loading')
// Reported by the game, so what Vue draws over the canvas scales and sits with the Pixi scene.
const layout = reactive({ scale: 1, hudTop: 0, stage: { x: 0, y: 0, width: START_MAX_WIDTH } })

const startButton = computed(() => props.skin.startButton ?? UI.startButton)

// The Start button is as big as the game has room for, up to its maximum.
const startHeight = computed(() => {
  const { w, h } = findFrame(startButton.value)
  const widest = props.skin.startWidth ?? START_MAX_WIDTH
  return (Math.min(widest, layout.stage.width - START_MARGIN * 2) * h) / w
})

// Pixi objects are kept out of Vue's reactivity on purpose: they are not state to render.
let app = null
let game = null
let unmounted = false

onMounted(async () => {
  preloadBgm(props.music)
  preloadSfx()
  const pixi = new Application()
  const [textures] = await Promise.all([
    loadTextures(props.atlases),
    // Text drawn on the canvas needs the site's font loaded first, or it comes out in a fallback.
    document.fonts.load('600 16px "Fredoka Variable"'),
    pixi.init({
      canvas: canvas.value,
      resizeTo: root.value,
      background: 0xd9f0f7,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio, 2),
    }),
  ])
  if (unmounted) return pixi.destroy()

  app = pixi
  game = props.create(app, textures, {
    onServed: () => (hearts.value += 1),
    onLayout: (next) => Object.assign(layout, next),
  })
  phase.value = 'ready'
})

function start() {
  phase.value = 'playing'
  playSfx('press')
  startBgm(props.music)
  game.start()
}

// Destroying the app also stops its ticker, which is what ends the game's animations.
onBeforeUnmount(() => {
  unmounted = true
  stopBgm()
  app?.destroy(false, { children: true })
})
</script>

<template>
  <div ref="root" class="pixi-game">
    <canvas ref="canvas" />

    <div
      class="hud"
      :style="{ top: `${layout.hudTop * layout.scale}px`, transform: `scale(${layout.scale})` }"
    >
      <Transition name="pop">
        <HeartTally v-if="phase === 'playing'" v-bind="skin.tally" :count="hearts" />
      </Transition>
    </div>

    <!-- The Start button waits wherever the game says its stage is. -->
    <div
      class="stage"
      :style="{
        left: `${layout.stage.x * layout.scale}px`,
        top: `${layout.stage.y * layout.scale}px`,
        transform: `translate(-50%, -50%) scale(${layout.scale})`,
      }"
    >
      <Transition name="pop">
        <button v-if="phase === 'ready'" class="start" type="button" aria-label="Start" @click="start">
          <AtlasSprite :frame="startButton" :height="startHeight" />
        </button>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.pixi-game {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}

canvas {
  display: block;
  touch-action: none;
}

/* Both overlays are laid out in the game's design pixels, then scaled to match the canvas. */
.hud {
  position: absolute;
  left: 0;
  transform-origin: top left;
  pointer-events: none;
}

.stage {
  position: absolute;
}

.start {
  display: block;
  padding: 0;
  border: 0;
  border-radius: 36px;
  background: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.start svg {
  display: block;
  animation: beckon 1.6s ease-in-out infinite;
}

.start:active svg {
  transform: scale(0.94);
  animation: none;
}

.start:focus-visible {
  outline: 4px solid var(--pink-deep);
  outline-offset: 6px;
}

@keyframes beckon {
  50% {
    transform: scale(1.07);
  }
}

.pop-enter-active,
.pop-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

@media (prefers-reduced-motion: reduce) {
  .start svg {
    animation: none;
  }

  .pop-enter-active,
  .pop-leave-active {
    transition: none;
  }
}
</style>
