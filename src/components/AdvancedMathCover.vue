<script setup>
import AtlasSprite from './AtlasSprite.vue'
import { standing } from '../lib/atlases.js'
import { BEAR, BUNNY, CAT } from '../advancedmath/assets.js'

// A miniature of the advanced math game: the classroom's chalkboard with a written-out sum and
// two fractions on it, and the three characters in front. It is not built on CoverScene because
// this game is set in a classroom rather than at the shop counter.
const FLAGS = ['#f8b9c5', '#a8d8ea', '#fde08a', '#b5dc9c']
const flags = Array.from({ length: 9 }, (_, i) => ({ x: 22 + i * 45, colour: FLAGS[i % FLAGS.length] }))
const buddies = [standing(CAT, 72, 294, 98), standing(BUNNY, 200, 296, 108), standing(BEAR, 328, 294, 96)]
</script>

<template>
  <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="400" height="300" fill="#fdf1d8" />
    <path d="M0 6 Q100 28 200 6 Q300 28 400 6" fill="none" stroke="#9c7b6a" stroke-width="1.5" />
    <polygon
      v-for="flag in flags"
      :key="flag.x"
      :points="`${flag.x - 10},12 ${flag.x + 10},12 ${flag.x},32`"
      :fill="flag.colour"
    />

    <rect y="246" width="400" height="54" fill="#e2b98a" />
    <rect y="246" width="400" height="6" fill="#c99a6a" />

    <!-- The chalkboard -->
    <rect x="66" y="42" width="268" height="150" rx="9" fill="#b07a4a" />
    <rect x="74" y="50" width="252" height="134" rx="4" fill="#3f6b55" />
    <rect x="60" y="189" width="280" height="7" rx="3" fill="#8a5a33" />

    <g class="chalk">
      <text x="162" y="78" class="end">36</text>
      <text x="162" y="106" class="end">7</text>
      <text x="114" y="106">×</text>
      <line x1="108" y1="120" x2="166" y2="120" stroke="#fdfbf2" stroke-width="2.5" stroke-linecap="round" />
      <rect x="112" y="128" width="54" height="28" rx="7" fill="#e8f7e4" stroke="#6cc07a" stroke-width="2.5" />
      <text class="answer end" x="162" y="143">252</text>

      <text x="238" y="102">2</text>
      <line x1="228" y1="117" x2="248" y2="117" stroke="#fdfbf2" stroke-width="2.5" />
      <text x="238" y="134">5</text>
      <circle cx="268" cy="117" r="13" fill="none" stroke="#fdfbf2" stroke-width="2" />
      <text class="sign" x="268" y="117">&lt;</text>
      <text x="298" y="102">3</text>
      <line x1="288" y1="117" x2="308" y2="117" stroke="#fdfbf2" stroke-width="2.5" />
      <text x="298" y="134">5</text>
    </g>

    <g v-for="(buddy, i) in buddies" :key="i" class="buddy" :style="{ animationDelay: `${i * -0.9}s` }">
      <AtlasSprite v-bind="buddy" />
    </g>
  </svg>
</template>

<style scoped>
svg {
  display: block;
  width: 100%;
  height: 100%;
}

text {
  font-size: 22px;
  font-weight: 600;
  text-anchor: middle;
  dominant-baseline: central;
}

.chalk text {
  fill: #fdfbf2;
}

.chalk .end {
  text-anchor: end;
}

.chalk .answer {
  fill: #2f7a43;
  font-size: 19px;
}

.chalk .sign {
  fill: #fde08a;
  font-size: 18px;
}

/* The same idle motion as in the game: the characters breathe. */
.buddy {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: breathe 3s ease-in-out infinite;
}

@keyframes breathe {
  50% {
    transform: scaleY(1.03);
  }
}

@media (prefers-reduced-motion: reduce) {
  .buddy {
    animation: none;
  }
}
</style>
