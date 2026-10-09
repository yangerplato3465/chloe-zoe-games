<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { findGame } from '../games.js'
import { bgmMuted, toggleBgmMuted } from '../lib/bgm.js'
import { playSfx } from '../lib/sfx.js'

const props = defineProps({
  id: { type: String, required: true },
})

const game = computed(() => findGame(props.id))

function toggleMusic() {
  playSfx('press')
  toggleBgmMuted()
}
</script>

<template>
  <div class="game-page" :style="{ background: game.background }">
    <component :is="game.component" />

    <div class="controls">
      <button
        class="round-button mute-button"
        type="button"
        :aria-label="bgmMuted ? 'Turn the music on' : 'Turn the music off'"
        :aria-pressed="bgmMuted"
        @click="toggleMusic"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3.6 9.6v4.8h3.3l4.3 3.5V6.1L6.9 9.6H3.6Z" />
          <template v-if="bgmMuted">
            <path d="m15.4 9.6 4.8 4.8" />
            <path d="m20.2 9.6-4.8 4.8" />
          </template>
          <template v-else>
            <path d="M14.8 9.3a3.9 3.9 0 0 1 0 5.4" />
            <path d="M17.5 6.8a7.4 7.4 0 0 1 0 10.4" />
          </template>
        </svg>
      </button>

      <RouterLink
        class="round-button home-button"
        :to="{ name: 'home' }"
        aria-label="Back to all games"
        @click="playSfx('press')"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3.8 11.4 12 4.2l8.2 7.2" />
          <path d="M6.2 9.8v9.4h11.6V9.8" />
          <path d="M10.2 19.2v-4.8h3.6v4.8" />
        </svg>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
/* The game owns the whole screen; the page behind it never scrolls. */
.game-page {
  position: fixed;
  inset: 0;
}

.controls {
  position: absolute;
  top: max(12px, env(safe-area-inset-top));
  right: max(12px, env(safe-area-inset-right));
  display: flex;
  gap: 10px;
}

.round-button {
  display: grid;
  place-items: center;
  box-sizing: border-box;
  width: 48px;
  height: 48px;
  padding: 0;
  border: 3px solid var(--line);
  border-radius: 50%;
  background: var(--card);
  box-shadow: 0 4px 0 var(--line);
  cursor: pointer;
  transition:
    transform 0.12s ease,
    box-shadow 0.12s ease;
  -webkit-tap-highlight-color: transparent;
}

.round-button:active {
  transform: translateY(3px);
  box-shadow: 0 1px 0 var(--line);
}

.round-button:focus-visible {
  outline: 4px solid var(--pink-deep);
  outline-offset: 3px;
}

.round-button svg {
  width: 26px;
  height: 26px;
  fill: none;
  stroke: var(--ink);
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* A muted button looks switched off: its icon fades back. */
.mute-button[aria-pressed='true'] svg {
  stroke: var(--line);
}
</style>
