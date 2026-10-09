<script setup>
defineProps({
  // The colour of the awning's stripes; the stripes in between are always cream.
  awning: { type: String, default: '#f8b9c5' },
})

const AWNING_STRIPE = 40
</script>

<template>
  <!-- A 400 x 300 miniature of the setting the games share, in the same colours. The default
       slot is drawn behind the counter (which starts at y = 238) and the "counter" slot on it. -->
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

    <slot />

    <rect y="238" width="400" height="62" fill="#ecc9a0" />
    <rect y="238" width="400" height="6" fill="#d3a877" />
    <rect y="244" width="400" height="2.5" fill="#f5dbb9" />

    <slot name="counter" />

    <g v-for="i in 11" :key="i" :fill="i % 2 ? awning : '#fff6ea'">
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
</style>
