import { defineAsyncComponent } from 'vue'
import BurgerCover from './components/BurgerCover.vue'
import CountingCover from './components/CountingCover.vue'
import DoctorCover from './components/DoctorCover.vue'
import RamenCover from './components/RamenCover.vue'
import ShopCover from './components/ShopCover.vue'

// Every game on the main page, in the order shown. To add one, give it:
//   id          used in its address (#/play/<id>)
//   title       shown on its card and in the browser tab
//   blurb       one short line under the title
//   background  the colour behind the game while it loads
//   cover       a component that draws the picture on its card
//   component   the game itself, loaded only when someone picks it
export const games = [
  {
    id: 'shop',
    title: 'Cozy Shop',
    blurb: 'Serve the right snack.',
    background: '#d9f0f7',
    cover: ShopCover,
    component: defineAsyncComponent(() => import('./components/ShopGame.vue')),
  },
  {
    id: 'burger',
    title: 'Burger Stack',
    blurb: 'Build the burger they want.',
    background: '#d9f0f7',
    cover: BurgerCover,
    component: defineAsyncComponent(() => import('./components/BurgerGame.vue')),
  },
  {
    id: 'counting',
    title: 'How Many?',
    blurb: 'Count what you see.',
    background: '#d9f0f7',
    cover: CountingCover,
    component: defineAsyncComponent(() => import('./components/CountingGame.vue')),
  },
  {
    id: 'ramen',
    title: 'Ramen Kitchen',
    blurb: 'Chop, cook and serve.',
    background: '#d9f0f7',
    cover: RamenCover,
    component: defineAsyncComponent(() => import('./components/RamenGame.vue')),
  },
  {
    id: 'doctor',
    title: 'Little Doctor',
    blurb: 'Help everyone feel better.',
    background: '#d9f0f7',
    cover: DoctorCover,
    component: defineAsyncComponent(() => import('./components/DoctorGame.vue')),
  },
]

export const findGame = (id) => games.find((game) => game.id === id)
