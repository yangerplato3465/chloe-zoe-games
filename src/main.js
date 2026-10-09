import { createApp } from 'vue'
import '@fontsource-variable/fredoka'
import App from './App.vue'
import { router } from './router.js'
import './styles.css'

createApp(App).use(router).mount('#app')
