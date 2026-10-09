<script setup>
import AtlasSprite from './AtlasSprite.vue'
import CoverScene from './CoverScene.vue'
import { CHARACTERS, standing } from '../lib/atlases.js'
import { RAMEN } from '../ramen/assets.js'

// A finished bowl steaming on the counter, a customer waiting for it, and the salt standing by.
const customer = standing(CHARACTERS[4], 96, 234, 100)
const bowl = standing(RAMEN.finished, 226, 290, 132)
const salt = standing(RAMEN.salt, 340, 288, 74)
const steam = [
  { x: 206, delay: 0 },
  { x: 232, delay: -1.1 },
  { x: 254, delay: -2 },
]
</script>

<template>
  <CoverScene awning="#a8dccf">
    <g class="customer"><AtlasSprite v-bind="customer" /></g>

    <template #counter>
      <ellipse cx="226" cy="287" rx="62" ry="9" fill="#7a4f2e" opacity="0.18" />
      <AtlasSprite v-bind="bowl" />
      <AtlasSprite v-bind="salt" />
      <circle
        v-for="puff in steam"
        :key="puff.x"
        class="steam"
        :cx="puff.x"
        cy="150"
        r="7"
        :style="{ animationDelay: `${puff.delay}s` }"
      />
    </template>
  </CoverScene>
</template>

<style scoped>
.customer {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: breathe 3s ease-in-out infinite;
}

/* Little puffs drift up off the bowl and fade. */
.steam {
  fill: #fff;
  opacity: 0;
  animation: rise 3.2s ease-out infinite;
}

@keyframes breathe {
  50% {
    transform: scaleY(1.03);
  }
}

@keyframes rise {
  0% {
    opacity: 0;
    transform: translateY(8px);
  }

  25% {
    opacity: 0.85;
  }

  100% {
    opacity: 0;
    transform: translateY(-26px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .customer,
  .steam {
    animation: none;
  }
}
</style>
