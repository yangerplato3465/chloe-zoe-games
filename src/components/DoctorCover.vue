<script setup>
import AtlasSprite from './AtlasSprite.vue'
import CoverScene from './CoverScene.vue'
import { DOCTOR } from '../doctor/assets.js'
import { CHARACTERS, HEART, standing } from '../lib/atlases.js'

// A patient with a plaster on, saying thank you with a heart, between the first-aid kit and
// the chart, with some of the doctor's things on the counter.
const kit = standing(DOCTOR.kit, 78, 232, 74)
const chart = standing(DOCTOR.chart, 322, 232, 80)
const patient = standing(CHARACTERS[0], 200, 234, 112)
const plaster = standing(DOCTOR.plasters[0], 200, 144, 12)
const heart = standing(HEART, 262, 128, 26)

const stethoscope = standing(DOCTOR.stethoscope.frame, 96, 296, 58)
const syringe = standing(DOCTOR.syringe.frame, 250, 294, 52)
const bottle = standing(DOCTOR.bottle.frame, 300, 293, 50)
const pill = standing(DOCTOR.pills[1], 340, 292, 22)
</script>

<template>
  <CoverScene awning="#a9cdf2">
    <AtlasSprite v-bind="kit" />
    <AtlasSprite v-bind="chart" />
    <g class="patient">
      <AtlasSprite v-bind="patient" />
      <g transform="rotate(-16 200 138)"><AtlasSprite v-bind="plaster" /></g>
    </g>
    <g class="heart"><AtlasSprite v-bind="heart" /></g>

    <template #counter>
      <AtlasSprite v-bind="stethoscope" />
      <g transform="rotate(24 250 268)"><AtlasSprite v-bind="syringe" /></g>
      <AtlasSprite v-bind="bottle" />
      <AtlasSprite v-bind="pill" />
    </template>
  </CoverScene>
</template>

<style scoped>
.patient {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: breathe 3s ease-in-out infinite;
}

/* The thank-you heart bobs beside the patient. */
.heart {
  animation: bob 2.6s ease-in-out infinite;
}

@keyframes breathe {
  50% {
    transform: scaleY(1.03);
  }
}

@keyframes bob {
  50% {
    transform: translateY(-5px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .patient,
  .heart {
    animation: none;
  }
}
</style>
