import { Application } from 'pixi.js'
import { loadTextures } from './assets.js'
import { startGame } from './game.js'

async function main() {
  const app = new Application()
  await app.init({
    background: 0xd9f0f7,
    resizeTo: window,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio, 2),
    // Tweens run on the shared ticker, so the app renders from the same one.
    sharedTicker: true,
  })
  document.body.appendChild(app.canvas)

  startGame(app, await loadTextures())
}

main()
