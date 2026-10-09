import burgerData from '../../Assets/burger.json'
import burgerImage from '../../Assets/burger.png'
import charactersData from '../../Assets/characters.json'
import charactersImage from '../../Assets/characters.png'
import countingData from '../../Assets/counting.json'
import countingImage from '../../Assets/counting.png'
import foodData from '../../Assets/food.json'
import foodImage from '../../Assets/food.png'
import uiData from '../../Assets/UI.json'
import uiImage from '../../Assets/UI.png'

// Every sprite atlas the site uses, by name. A frame is always referred to as
// "<atlas>/<frame name>" (for example "ui/image-5.png"), because different atlases reuse the
// same frame names. This file stays free of Pixi on purpose, so pages that only show a frame
// (the main page's covers, the HUD) do not have to load the game engine.
export const ATLASES = {
  burger: { data: burgerData, image: burgerImage },
  characters: { data: charactersData, image: charactersImage },
  counting: { data: countingData, image: countingImage },
  food: { data: foodData, image: foodImage },
  ui: { data: uiData, image: uiImage },
}

// Art that more than one game uses. The heart lives in the food atlas.
export const UI = { frame: 'ui/image-13.png', startButton: 'ui/image-5.png' }
export const CHARACTERS = [0, 1, 2, 3, 4].map((n) => `characters/image-${n}.png`)
export const HEART = 'food/images-21.png'

// Where a frame lives: its image, its rectangle inside that image, and the image's full size.
export function findFrame(ref) {
  const [atlas, name] = ref.split('/')
  const { data, image } = ATLASES[atlas]
  return { image, sheet: data.meta.size, ...data.frames[name].frame }
}

// For placing a frame in an <svg> scene: the AtlasSprite props that stand it with the middle of
// its bottom edge at (centreX, bottom), which is how things rest on the ground.
export function standing(frame, centreX, bottom, height) {
  const { w, h } = findFrame(frame)
  return { frame, height, x: centreX - (height * w) / h / 2, y: bottom - height }
}
