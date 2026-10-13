<script setup>
import AtlasSprite from './AtlasSprite.vue'
import CoverScene from './CoverScene.vue'
import { standing } from '../lib/atlases.js'
import { BOXES, BUBBLE as SHAPE, MATH_CHARACTERS, PLUS } from '../math/assets.js'

// A miniature of the math game: a character thinking of a sum, and three of the answer boxes
// on the counter.
const BUBBLE = { x: 206, y: 136, scale: 0.46 }

const customer = standing(MATH_CHARACTERS[2], 200, 234, 96)
// The same thought bubble as in the game: [x, y, radius], measured from its smallest dot.
const bubblePuffs = [...SHAPE.dots, ...SHAPE.puffs.map(([x, y, r]) => [x + SHAPE.centre.x, y + SHAPE.centre.y, r])]
const question = {
  x: BUBBLE.x + SHAPE.centre.x * BUBBLE.scale,
  y: BUBBLE.y + SHAPE.centre.y * BUBBLE.scale,
  text: `3 ${PLUS} 4`,
}
const answers = [6, 7, 8].map((value, i) => ({
  value,
  x: 110 + i * 90,
  box: standing(BOXES[value % BOXES.length], 110 + i * 90, 294, 44),
}))
</script>

<template>
  <CoverScene awning="#f2b8dc">
    <g class="customer"><AtlasSprite v-bind="customer" /></g>

    <g class="bubble">
      <g :transform="`translate(${BUBBLE.x} ${BUBBLE.y}) scale(${BUBBLE.scale})`">
        <circle v-for="([x, y, r], i) in bubblePuffs" :key="`o${i}`" :cx="x" :cy="y" :r="r + 5" fill="#9c7b6a" />
        <circle v-for="([x, y, r], i) in bubblePuffs" :key="`f${i}`" :cx="x" :cy="y" :r="r" fill="#fff" />
      </g>
      <text class="question" :x="question.x" :y="question.y">{{ question.text }}</text>
    </g>

    <template #counter>
      <g v-for="answer in answers" :key="answer.value">
        <ellipse :cx="answer.x" cy="291" rx="15" ry="3.5" fill="#7a4f2e" opacity="0.2" />
        <AtlasSprite v-bind="answer.box" />
        <text class="number" :x="answer.x" y="270">{{ answer.value }}</text>
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

text {
  font-weight: 600;
  text-anchor: middle;
  dominant-baseline: central;
}

.question {
  fill: var(--ink);
  font-size: 25px;
}

.number {
  fill: #fff;
  stroke: #b0457c;
  stroke-width: 3.5;
  stroke-linejoin: round;
  paint-order: stroke;
  font-size: 20px;
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
