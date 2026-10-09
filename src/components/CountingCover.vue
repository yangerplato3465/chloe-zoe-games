<script setup>
import AtlasSprite from './AtlasSprite.vue'
import CoverScene from './CoverScene.vue'
import { THINGS } from '../counting/assets.js'
import { CHARACTERS, standing } from '../lib/atlases.js'

// A miniature of the counting game: stars strewn on the board, two characters peeking round
// it, and a few of the numbers on the counter.
const BOARD = { x: 84, y: 54, width: 232, height: 174 }

// [x, y, tilt in degrees] of each star, from the board's top-left corner.
const stars = [
  [38, 36, -14],
  [100, 28, 10],
  [176, 40, -6],
  [66, 88, 16],
  [136, 84, -18],
  [196, 104, 8],
  [44, 138, 6],
  [112, 140, -10],
].map(([x, y, tilt]) => ({ x: BOARD.x + x, y: BOARD.y + y, tilt, sprite: standing(THINGS.star, BOARD.x + x, BOARD.y + y + 17, 34) }))

const spectators = [standing(CHARACTERS[3], 70, 234, 96), standing(CHARACTERS[1], 332, 234, 96)]
const answers = [7, 8, 9].map((value, i) => ({ value, x: 110 + i * 90 }))
</script>

<template>
  <CoverScene awning="#d6c4f2">
    <g v-for="(spectator, i) in spectators" :key="spectator.frame" class="spectator" :style="{ animationDelay: `${i * -1.3}s` }">
      <AtlasSprite v-bind="spectator" />
    </g>
    <rect :x="BOARD.x + 2" :y="BOARD.y + 5" :width="BOARD.width" :height="BOARD.height" rx="14" fill="#7a4f2e" opacity="0.16" />
    <rect v-bind="BOARD" rx="14" fill="#fffaf3" stroke="#9c7b6a" stroke-width="3" />
    <g v-for="(star, i) in stars" :key="i" :transform="`rotate(${star.tilt} ${star.x} ${star.y})`">
      <AtlasSprite v-bind="star.sprite" />
    </g>

    <template #counter>
      <g v-for="answer in answers" :key="answer.value">
        <ellipse :cx="answer.x" cy="275" rx="23" ry="22" fill="#7a4f2e" opacity="0.2" />
        <circle :cx="answer.x" cy="272" r="22" fill="#fffdf8" stroke="#ead9c6" stroke-width="1.6" />
        <text :x="answer.x" y="273">{{ answer.value }}</text>
      </g>
    </template>
  </CoverScene>
</template>

<style scoped>
.spectator {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: breathe 3s ease-in-out infinite;
}

text {
  fill: var(--ink);
  font-size: 22px;
  font-weight: 600;
  text-anchor: middle;
  dominant-baseline: central;
}

@keyframes breathe {
  50% {
    transform: scaleY(1.03);
  }
}

@media (prefers-reduced-motion: reduce) {
  .spectator {
    animation: none;
  }
}
</style>
