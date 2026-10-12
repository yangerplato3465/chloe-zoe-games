<script setup>
import AtlasSprite from './AtlasSprite.vue'
import CoverScene from './CoverScene.vue'
import { FINISHED, PIPING_BAG } from '../cake/assets.js'
import { CHARACTERS, standing } from '../lib/atlases.js'

// A finished cake on the counter, a customer eyeing it, and the piping bag standing by.
const CAKE = { x: 232, base: 286 }

const customer = standing(CHARACTERS[3], 92, 234, 104)
const cake = standing(FINISHED, CAKE.x, CAKE.base, 128)
const bag = standing(PIPING_BAG, 344, 290, 88)
</script>

<template>
  <CoverScene awning="#f7c0a2">
    <g class="customer"><AtlasSprite v-bind="customer" /></g>

    <template #counter>
      <ellipse :cx="CAKE.x" :cy="CAKE.base - 6" rx="74" ry="17" fill="#7a4f2e" opacity="0.2" />
      <ellipse :cx="CAKE.x" :cy="CAKE.base - 10" rx="72" ry="16" fill="#fffdf8" stroke="#ead9c6" stroke-width="2" />
      <AtlasSprite v-bind="cake" />
      <g class="bag"><AtlasSprite v-bind="bag" /></g>
    </template>
  </CoverScene>
</template>

<style scoped>
.customer {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: breathe 3s ease-in-out infinite;
}

/* The piping bag hovers a little, as if about to add one more swirl. */
.bag {
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
  .bag {
    animation: none;
  }
}
</style>
