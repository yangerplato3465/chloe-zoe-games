<script setup>
import AtlasSprite from '../components/AtlasSprite.vue'
import GameCard from '../components/GameCard.vue'
import { games } from '../games.js'
import { CHARACTERS } from '../shop/assets.js'
</script>

<template>
  <main class="home">
    <header class="masthead">
      <div class="titles">
        <h1>Chloe <span class="amp">&amp;</span> Zoe Games</h1>
        <p>Pick a game to play.</p>
      </div>
      <!-- The characters sit along the rule under the title, purely as decoration. -->
      <div class="mascots" aria-hidden="true">
        <AtlasSprite
          v-for="(frame, i) in CHARACTERS"
          :key="frame"
          :frame="frame"
          :style="{ animationDelay: `${i * -0.7}s` }"
        />
      </div>
    </header>

    <ul class="games">
      <li v-for="game in games" :key="game.id">
        <GameCard :game="game" />
      </li>
    </ul>
  </main>
</template>

<style scoped>
.home {
  box-sizing: border-box;
  max-width: 1120px;
  min-height: 100dvh;
  margin: 0 auto;
  padding: clamp(28px, 6vw, 72px) max(clamp(20px, 5vw, 56px), env(safe-area-inset-right)) 72px
    max(clamp(20px, 5vw, 56px), env(safe-area-inset-left));
}

.masthead {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  column-gap: 32px;
  border-bottom: 3px solid var(--line);
}

.titles {
  padding-bottom: 20px;
}

h1 {
  margin: 0;
  font-size: clamp(2.1rem, 6vw, 3.5rem);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.01em;
}

.amp {
  color: var(--pink-deep);
}

.titles p {
  margin: 10px 0 0;
  color: var(--ink-soft);
  font-size: clamp(1.05rem, 2.2vw, 1.3rem);
  font-weight: 400;
}

.mascots {
  display: flex;
  align-items: flex-end;
  margin-left: auto;
}

.mascots svg {
  width: auto;
  height: clamp(50px, 9vw, 80px);
  margin-left: -4px;
  transform-origin: 50% 100%;
  animation: breathe 3.2s ease-in-out infinite;
}

.games {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
  gap: clamp(22px, 3vw, 32px);
  margin: clamp(28px, 5vw, 48px) 0 0;
  padding: 0;
  list-style: none;
}

@keyframes breathe {
  50% {
    transform: scaleY(1.035);
  }
}

@media (prefers-reduced-motion: reduce) {
  .mascots svg {
    animation: none;
  }
}
</style>
