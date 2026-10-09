<script setup>
import PixiGame from './PixiGame.vue'
import { COUNTING_ATLASES } from '../counting/assets.js'
import { createCountingGame } from '../counting/game.js'
</script>

<template>
  <PixiGame :atlases="COUNTING_ATLASES" :create="createCountingGame" />
</template>
