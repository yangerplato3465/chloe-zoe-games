<script setup>
import { RouterLink } from 'vue-router'

defineProps({
  game: { type: Object, required: true },
})
</script>

<template>
  <RouterLink class="game-card" :to="{ name: 'play', params: { id: game.id } }">
    <div class="cover">
      <component :is="game.cover" />
    </div>
    <div class="label">
      <div>
        <h2>{{ game.title }}</h2>
        <p>{{ game.blurb }}</p>
      </div>
      <span class="play" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M9 6.2v11.6a1 1 0 0 0 1.52.86l9.4-5.8a1 1 0 0 0 0-1.72l-9.4-5.8A1 1 0 0 0 9 6.2Z" />
        </svg>
      </span>
    </div>
  </RouterLink>
</template>

<style scoped>
/* A chunky, pressable tile: the solid "lip" underneath squashes when it is pushed. */
.game-card {
  display: block;
  overflow: hidden;
  border: 3px solid var(--line);
  border-radius: 28px;
  background: var(--card);
  box-shadow: 0 8px 0 var(--line);
  color: inherit;
  text-decoration: none;
  transition:
    transform 0.14s ease,
    box-shadow 0.14s ease;
  -webkit-tap-highlight-color: transparent;
}

@media (hover: hover) {
  .game-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 0 var(--line);
  }

  .game-card:hover .play {
    transform: scale(1.08);
  }
}

.game-card:active {
  transform: translateY(6px);
  box-shadow: 0 2px 0 var(--line);
}

.game-card:focus-visible {
  outline: 4px solid var(--pink-deep);
  outline-offset: 5px;
}

.cover {
  aspect-ratio: 4 / 3;
  border-bottom: 3px solid var(--line);
  background: var(--sky);
}

.label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 16px 20px;
}

h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.15;
}

p {
  margin: 3px 0 0;
  color: var(--ink-soft);
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.3;
}

.play {
  display: grid;
  flex: none;
  place-items: center;
  width: 52px;
  height: 52px;
  border: 3px solid var(--line);
  border-radius: 50%;
  background: var(--pink);
  transition: transform 0.14s ease;
}

.play svg {
  width: 32px;
  height: 32px;
  /* The triangle's weight sits left of its box, so nudge it to look centred in the circle. */
  margin-left: 2px;
  fill: var(--card);
  stroke: var(--ink);
  stroke-width: 1.8;
  stroke-linejoin: round;
}

@media (prefers-reduced-motion: reduce) {
  .game-card,
  .play {
    transition: none;
  }
}
</style>
