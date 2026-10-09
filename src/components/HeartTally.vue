<script setup>
import { HEART, frameStyle } from '../shop/assets.js'

defineProps({
  count: { type: Number, required: true },
})

const heartStyle = frameStyle(HEART)
</script>

<template>
  <!-- Keyed on the count so the pop animation replays with every new heart. -->
  <div :key="count" class="heart-tally" :class="{ pop: count > 0 }">
    <span class="heart" :style="heartStyle" />
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
  background-repeat: no-repeat;
}

.count {
  color: #8a6a5a;
  font: 700 30px 'Arial Rounded MT Bold', Nunito, 'Trebuchet MS', sans-serif;
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
