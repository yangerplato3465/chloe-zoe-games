<script setup>
import AtlasSprite from './AtlasSprite.vue'
import CoverScene from './CoverScene.vue'
import { CHARACTERS, standing } from '../lib/atlases.js'
import { FOOD, STALLS } from '../shop/assets.js'

// A miniature of the shop, drawn with the game's own art.
const BUBBLE = { x: 214, y: 136, scale: 0.46 }

const stalls = [standing(STALLS.bakery, 70, 226, 132), standing(STALLS.kitchen, 331, 226, 128)]
const customer = standing(CHARACTERS[0], 200, 234, 96)
const wanted = standing(FOOD.donut, 254.5, 99.5, 30)
const plates = [
  { x: 110, food: standing(FOOD.dango, 110, 288, 36) },
  { x: 200, food: standing(FOOD.donut, 200, 285, 28) },
  { x: 290, food: standing(FOOD.strawberryMilk, 290, 288, 36) },
]

// The same puffy thought bubble as in the game: [x, y, radius], measured from its smallest dot.
const bubblePuffs = [
  [0, 0, 8],
  [16, -28, 13],
  [38, -118, 48],
  [88, -142, 54],
  [138, -118, 48],
  [60, -84, 46],
  [116, -84, 46],
  [88, -112, 56],
]
</script>

<template>
  <CoverScene>
    <AtlasSprite v-for="stall in stalls" :key="stall.frame" v-bind="stall" />
    <g class="customer"><AtlasSprite v-bind="customer" /></g>

    <g class="bubble">
      <g :transform="`translate(${BUBBLE.x} ${BUBBLE.y}) scale(${BUBBLE.scale})`">
        <circle v-for="([x, y, r], i) in bubblePuffs" :key="`o${i}`" :cx="x" :cy="y" :r="r + 5" fill="#9c7b6a" />
        <circle v-for="([x, y, r], i) in bubblePuffs" :key="`f${i}`" :cx="x" :cy="y" :r="r" fill="#fff" />
      </g>
      <AtlasSprite v-bind="wanted" />
    </g>

    <template #counter>
      <g v-for="plate in plates" :key="plate.x">
        <ellipse :cx="plate.x" cy="275" rx="23" ry="22" fill="#7a4f2e" opacity="0.2" />
        <circle :cx="plate.x" cy="272" r="22" fill="#fffdf8" stroke="#ead9c6" stroke-width="1.6" />
        <AtlasSprite v-bind="plate.food" />
      </g>
    </template>
  </CoverScene>
</template>

<style scoped>
/* The same idle motion as in the game: the customer breathes and the bubble floats. */
.customer {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: breathe 3s ease-in-out infinite;
}

.bubble {
  animation: float 3.4s ease-in-out infinite;
}

@keyframes breathe {
  50% {
    transform: scaleY(1.03);
  }
}

@keyframes float {
  50% {
    transform: translateY(-2.5px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .customer,
  .bubble {
    animation: none;
  }
}
</style>
