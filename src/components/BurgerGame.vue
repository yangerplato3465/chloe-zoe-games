<script setup>
import PixiGame from './PixiGame.vue'
import { BURGER_ATLASES } from '../burger/assets.js'
import { createBurgerGame } from '../burger/game.js'
</script>

<template>
  <PixiGame :atlases="BURGER_ATLASES" :create="createBurgerGame" />
</template>
