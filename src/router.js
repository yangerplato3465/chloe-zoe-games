import { createRouter, createWebHashHistory } from 'vue-router'
import { findGame } from './games.js'
import GamePage from './pages/GamePage.vue'
import HomePage from './pages/HomePage.vue'

const SITE_NAME = 'Chloe & Zoe Games'

// Hash addresses (#/play/shop) need no server setup, so the built site works on any static host.
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    {
      path: '/play/:id',
      name: 'play',
      component: GamePage,
      props: true,
      beforeEnter: (to) => (findGame(to.params.id) ? true : { name: 'home' }),
    },
    { path: '/:pathMatch(.*)*', redirect: { name: 'home' } },
  ],
})

router.afterEach((to) => {
  const game = findGame(to.params.id)
  document.title = game ? `${game.title} · ${SITE_NAME}` : SITE_NAME
})
