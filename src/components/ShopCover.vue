<script setup>
import AtlasSprite from './AtlasSprite.vue'
import { CHARACTERS, FOOD, STALLS, findFrame } from '../shop/assets.js'

// The cover is a 400 x 300 miniature of the shop, drawn with the game's own art and colours.
const AWNING_STRIPE = 40
const BUBBLE = { x: 214, y: 136, scale: 0.46 }

// Positions a frame by the middle of its bottom edge, which is how things stand on the ground.
function standing(frame, centreX, bottom, height) {
  const { w, h } = findFrame(frame)
  return { frame, height, x: centreX - (height * w) / h / 2, y: bottom - height }
}

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
  <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="400" height="300" fill="#d9f0f7" />
    <g fill="#fff">
      <circle cx="52" cy="92" r="13" />
      <circle cx="70" cy="84" r="17" />
      <circle cx="89" cy="92" r="13" />
      <rect x="39" y="92" width="63" height="13" rx="6.5" />
      <circle cx="318" cy="70" r="11" />
      <circle cx="333" cy="63" r="14" />
      <circle cx="349" cy="70" r="11" />
      <rect x="307" y="70" width="53" height="11" rx="5.5" />
    </g>
    <ellipse cx="84" cy="204" rx="170" ry="52" fill="#d3ebc2" />
    <ellipse cx="336" cy="210" rx="190" ry="66" fill="#c4e3b0" />
    <rect y="186" width="400" height="114" fill="#b5dc9c" />
    <rect y="220" width="400" height="30" fill="#f6e7c8" />

    <AtlasSprite v-for="stall in stalls" :key="stall.frame" v-bind="stall" />
    <g class="customer"><AtlasSprite v-bind="customer" /></g>

    <g class="bubble">
      <g :transform="`translate(${BUBBLE.x} ${BUBBLE.y}) scale(${BUBBLE.scale})`">
        <circle v-for="([x, y, r], i) in bubblePuffs" :key="`o${i}`" :cx="x" :cy="y" :r="r + 5" fill="#9c7b6a" />
        <circle v-for="([x, y, r], i) in bubblePuffs" :key="`f${i}`" :cx="x" :cy="y" :r="r" fill="#fff" />
      </g>
      <AtlasSprite v-bind="wanted" />
    </g>

    <rect y="238" width="400" height="62" fill="#ecc9a0" />
    <rect y="238" width="400" height="6" fill="#d3a877" />
    <rect y="244" width="400" height="2.5" fill="#f5dbb9" />
    <g v-for="plate in plates" :key="plate.x">
      <ellipse :cx="plate.x" cy="275" rx="23" ry="22" fill="#7a4f2e" opacity="0.2" />
      <circle :cx="plate.x" cy="272" r="22" fill="#fffdf8" stroke="#ead9c6" stroke-width="1.6" />
      <AtlasSprite v-bind="plate.food" />
    </g>

    <g v-for="i in 11" :key="i" :fill="i % 2 ? '#f8b9c5' : '#fff6ea'">
      <rect :x="(i - 1) * AWNING_STRIPE - 20" width="40" height="20" />
      <circle :cx="(i - 1) * AWNING_STRIPE" cy="20" r="20" />
    </g>
  </svg>
</template>

<style scoped>
svg {
  display: block;
  width: 100%;
  height: 100%;
}

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
