import { Assets, Spritesheet } from 'pixi.js'
import { ATLASES } from './atlases.js'

const loading = {}

async function loadAtlas(atlas) {
  const { data, image } = ATLASES[atlas]
  const frames = await new Spritesheet(await Assets.load(image), data).parse()
  return Object.fromEntries(Object.entries(frames).map(([name, texture]) => [`${atlas}/${name}`, texture]))
}

// Resolves to one { "<atlas>/<frame name>": Texture } map covering the named atlases.
// Each atlas is loaded once and then shared.
export async function loadTextures(atlases) {
  const maps = await Promise.all(atlases.map((atlas) => (loading[atlas] ??= loadAtlas(atlas))))
  return Object.assign({}, ...maps)
}
