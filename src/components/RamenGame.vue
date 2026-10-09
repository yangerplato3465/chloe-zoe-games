<script setup>
import PixiGame from './PixiGame.vue'
import { RAMEN_ATLASES } from '../ramen/assets.js'
import { createRamenGame } from '../ramen/game.js'
</script>

<template>
  <PixiGame :atlases="RAMEN_ATLASES" :create="createRamenGame" />
</template>
