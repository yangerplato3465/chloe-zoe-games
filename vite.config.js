import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // Relative asset paths, so the built game also works from a sub-folder (e.g. GitHub Pages).
  base: './',
})
