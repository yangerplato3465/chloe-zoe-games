<script setup>
import PixiGame from './PixiGame.vue'
import { CAKE_ATLASES } from '../cake/assets.js'
import { createCakeGame } from '../cake/game.js'
</script>

<template>
  <PixiGame :atlases="CAKE_ATLASES" :create="createCakeGame" />
</template>
