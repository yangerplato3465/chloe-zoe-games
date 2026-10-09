<script setup>
import PixiGame from './PixiGame.vue'
import { DOCTOR_ATLASES } from '../doctor/assets.js'
import { createDoctorGame } from '../doctor/game.js'
</script>

<template>
  <PixiGame :atlases="DOCTOR_ATLASES" :create="createDoctorGame" />
</template>
