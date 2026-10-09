<script setup>
import { computed } from 'vue'
import { findFrame } from '../lib/atlases.js'

const props = defineProps({
  // "<atlas>/<frame name>", for example "ui/image-5.png".
  frame: { type: String, required: true },
  // Drawn height; the width follows the frame's proportions. Defaults to the frame's own size.
  height: { type: Number, default: null },
  // Position, for a sprite placed inside a larger <svg> scene.
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
})

const sprite = computed(() => {
  const { image, sheet, x, y, w, h } = findFrame(props.frame)
  const height = props.height ?? h
  return { image, sheet, viewBox: `${x} ${y} ${w} ${h}`, width: (height * w) / h, height }
})
</script>

<template>
  <!-- An <svg> whose viewBox is the frame's rectangle, so only that part of the atlas shows. -->
  <svg
    :x="x"
    :y="y"
    :width="sprite.width"
    :height="sprite.height"
    :viewBox="sprite.viewBox"
    aria-hidden="true"
  >
    <image :href="sprite.image" :width="sprite.sheet.w" :height="sprite.sheet.h" />
  </svg>
</template>
