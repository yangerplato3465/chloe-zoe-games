<script setup>
import PixiGame from './PixiGame.vue'
import { SHOP_ATLASES } from '../shop/assets.js'
import { createShop } from '../shop/game.js'
</script>

<template>
  <PixiGame :atlases="SHOP_ATLASES" :create="createShop" />
</template>
