import { Assets, Spritesheet } from 'pixi.js'
import { ATLASES } from './assets.js'

async function loadAtlas({ image, data }) {
  const sheet = new Spritesheet(await Assets.load(image), data)
  return sheet.parse()
}

let textures = null

// Resolves to one { frameName: Texture } map covering both atlases. Loaded once and shared.
export function loadTextures() {
  textures ??= Promise.all(ATLASES.map(loadAtlas)).then((maps) => Object.assign({}, ...maps))
  return textures
}
