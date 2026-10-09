<script setup>
import AtlasSprite from './AtlasSprite.vue'
import { HEART } from '../shop/assets.js'

defineProps({
  count: { type: Number, required: true },
})
</script>

<template>
  <!-- Keyed on the count so the pop animation replays with every new heart. -->
  <div :key="count" class="heart-tally" :class="{ pop: count > 0 }">
    <AtlasSprite class="heart" :frame="HEART" />
    <span class="count">{{ count }}</span>
  </div>
</template>

<style scoped>
.heart-tally {
  display: flex;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  width: 120px;
  height: 52px;
  margin: 16px 24px;
  padding: 0 10px;
  border-radius: 26px;
  background: rgb(255 255 255 / 85%);
}

.heart {
  flex: none;
}

.count {
  color: var(--ink-soft);
  font-size: 30px;
  font-weight: 600;
}

.pop {
  animation: pop 0.36s ease-out;
}

@keyframes pop {
  50% {
    transform: scale(1.18);
  }
}
</style>
