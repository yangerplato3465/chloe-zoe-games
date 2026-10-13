<script setup>
import PixiGame from './PixiGame.vue'
import { MATH_ATLASES, MATH_BGM, MATH_SKIN } from '../math/assets.js'
import { createMathGame } from '../math/game.js'
</script>

<template>
  <PixiGame :atlases="MATH_ATLASES" :create="createMathGame" :skin="MATH_SKIN" :music="MATH_BGM" />
</template>
