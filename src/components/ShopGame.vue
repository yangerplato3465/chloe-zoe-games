<script setup>
import { Application } from 'pixi.js'
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import HeartTally from './HeartTally.vue'
import { loadTextures } from '../shop/assets.js'
import { startGame } from '../shop/game.js'

const root = ref(null)
const canvas = ref(null)
const hearts = ref(0)
// Reported by the game, so the HUD drawn by Vue scales and sits with the Pixi scene.
const layout = reactive({ scale: 1, hudTop: 0 })

// The Pixi app is kept out of Vue's reactivity on purpose: it is not state to render.
let app = null
let unmounted = false

onMounted(async () => {
  const pixi = new Application()
  const [textures] = await Promise.all([
    loadTextures(),
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
  startGame(app, textures, {
    onServed: () => (hearts.value += 1),
    onLayout: (next) => Object.assign(layout, next),
  })
})

// Destroying the app also stops its ticker, which is what ends the game's animations.
onBeforeUnmount(() => {
  unmounted = true
  app?.destroy(false, { children: true })
})
</script>

<template>
  <div ref="root" class="shop-game">
    <canvas ref="canvas" />
    <div
      class="hud"
      :style="{ top: `${layout.hudTop * layout.scale}px`, transform: `scale(${layout.scale})` }"
    >
      <HeartTally :count="hearts" />
    </div>
  </div>
</template>

<style scoped>
.shop-game {
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

/* Laid out in the game's design pixels, then scaled to match the canvas. */
.hud {
  position: absolute;
  left: 0;
  transform-origin: top left;
  pointer-events: none;
}
</style>
