<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { findGame } from '../games.js'

const props = defineProps({
  id: { type: String, required: true },
})

const game = computed(() => findGame(props.id))
</script>

<template>
  <div class="game-page" :style="{ background: game.background }">
    <component :is="game.component" />
    <RouterLink class="home-button" :to="{ name: 'home' }" aria-label="Back to all games">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3.8 11.4 12 4.2l8.2 7.2" />
        <path d="M6.2 9.8v9.4h11.6V9.8" />
        <path d="M10.2 19.2v-4.8h3.6v4.8" />
      </svg>
    </RouterLink>
  </div>
</template>

<style scoped>
/* The game owns the whole screen; the page behind it never scrolls. */
.game-page {
  position: fixed;
  inset: 0;
}

.home-button {
  position: absolute;
  top: max(12px, env(safe-area-inset-top));
  right: max(12px, env(safe-area-inset-right));
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border: 3px solid var(--line);
  border-radius: 50%;
  background: var(--card);
  box-shadow: 0 4px 0 var(--line);
  transition:
    transform 0.12s ease,
    box-shadow 0.12s ease;
  -webkit-tap-highlight-color: transparent;
}

.home-button:active {
  transform: translateY(3px);
  box-shadow: 0 1px 0 var(--line);
}

.home-button:focus-visible {
  outline: 4px solid var(--pink-deep);
  outline-offset: 3px;
}

.home-button svg {
  width: 26px;
  height: 26px;
  fill: none;
  stroke: var(--ink);
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
