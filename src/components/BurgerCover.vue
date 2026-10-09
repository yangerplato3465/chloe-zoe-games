<script setup>
import AtlasSprite from './AtlasSprite.vue'
import CoverScene from './CoverScene.vue'
import { PARTS } from '../burger/assets.js'
import { CHARACTERS, findFrame, standing } from '../lib/atlases.js'

// A big burger on the counter, a customer eyeing it, and the ketchup standing by.
const BURGER = { x: 236, base: 282, parts: ['bottomBun', 'patty', 'cheese', 'lettuce', 'tomato', 'topBun'] }

// Stacks the parts the same way the game does (see burger/stack.js).
let risen = 0
const layers = BURGER.parts.map((name) => {
  const { icon, scale, squash, rise } = PARTS[name]
  const { w, h } = findFrame(icon)
  const width = w * scale
  const height = h * scale * squash
  const sprite = { frame: icon, width, height, x: BURGER.x - width / 2, y: BURGER.base - risen - height }
  risen += rise
  return { name, sprite }
})

const customer = standing(CHARACTERS[2], 92, 234, 104)
const ketchup = standing(PARTS.ketchup.icon, 348, 288, 92)
</script>

<template>
  <CoverScene awning="#f8d98a">
    <g class="customer"><AtlasSprite v-bind="customer" /></g>

    <template #counter>
      <ellipse :cx="BURGER.x" :cy="BURGER.base - 2" rx="70" ry="17" fill="#7a4f2e" opacity="0.2" />
      <ellipse :cx="BURGER.x" :cy="BURGER.base - 6" rx="68" ry="16" fill="#fffdf8" stroke="#ead9c6" stroke-width="2" />
      <g v-for="layer in layers" :key="layer.name" :class="{ lid: layer.name === 'topBun' }">
        <AtlasSprite v-bind="layer.sprite" />
      </g>
      <AtlasSprite v-bind="ketchup" />
    </template>
  </CoverScene>
</template>

<style scoped>
.customer {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: breathe 3s ease-in-out infinite;
}

/* The top bun hovers a little, as if about to be put on. */
.lid {
  animation: hover 2.6s ease-in-out infinite;
}

@keyframes breathe {
  50% {
    transform: scaleY(1.03);
  }
}

@keyframes hover {
  50% {
    transform: translateY(-5px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .customer,
  .lid {
    animation: none;
  }
}
</style>
