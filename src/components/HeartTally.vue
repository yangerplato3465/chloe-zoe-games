<script setup>
import AtlasSprite from './AtlasSprite.vue'
import { HEART, UI } from '../lib/atlases.js'

defineProps({
  count: { type: Number, required: true },
  // The art, for a game that brings its own: the frame, and the heart shown inside it.
  frame: { type: String, default: UI.frame },
  heart: { type: String, default: HEART },
  // The frame's height, in the game's design pixels; the shared frame art is 121 x 93.
  height: { type: Number, default: 124 },
  // Where the board inside the frame is, as CSS inset fractions (top right bottom left). The
  // default is the cream board inside the shared twig frame.
  inset: { type: String, default: '16% 12.5% 18.5% 14%' },
})
</script>

<template>
  <div class="heart-tally">
    <AtlasSprite class="frame" :frame="frame" :height="height" />
    <!-- Keyed on the count so the pop animation replays with every new heart. -->
    <div :key="count" class="panel" :class="{ pop: count > 0 }" :style="{ inset }">
      <AtlasSprite :frame="heart" />
      <span class="count">{{ count }}</span>
    </div>
  </div>
</template>

<style scoped>
.heart-tally {
  position: relative;
  width: fit-content;
  margin: 6px 12px;
}

.frame {
  display: block;
}

/* Sits over the board inside the frame (see the inset prop). */
.panel {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
}

.panel svg {
  flex: none;
}

.count {
  color: var(--ink-soft);
  font-size: 34px;
  font-weight: 600;
  line-height: 1;
}

.pop {
  animation: pop 0.36s ease-out;
}

@keyframes pop {
  50% {
    transform: scale(1.2);
  }
}

@media (prefers-reduced-motion: reduce) {
  .pop {
    animation: none;
  }
}
</style>
