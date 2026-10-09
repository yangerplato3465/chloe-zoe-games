<script setup>
import AtlasSprite from './AtlasSprite.vue'
import { UI } from '../lib/atlases.js'
import { HEART } from '../shop/assets.js'

defineProps({
  count: { type: Number, required: true },
})

// In the game's design pixels; the frame art is 121 x 93.
const FRAME_HEIGHT = 124
</script>

<template>
  <div class="heart-tally">
    <AtlasSprite class="frame" :frame="UI.frame" :height="FRAME_HEIGHT" />
    <!-- Keyed on the count so the pop animation replays with every new heart. -->
    <div :key="count" class="panel" :class="{ pop: count > 0 }">
      <AtlasSprite :frame="HEART" />
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

/* Sits over the cream board inside the twig frame, whose edges are these fractions in. */
.panel {
  position: absolute;
  inset: 16% 12.5% 18.5% 14%;
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
