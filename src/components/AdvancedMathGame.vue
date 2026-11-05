<script setup>
import PixiGame from './PixiGame.vue'
import { ADVANCED_MATH_ATLASES } from '../advancedmath/assets.js'
import { createAdvancedMathGame } from '../advancedmath/game.js'
</script>

<template>
  <PixiGame :atlases="ADVANCED_MATH_ATLASES" :create="createAdvancedMathGame" />
</template>
