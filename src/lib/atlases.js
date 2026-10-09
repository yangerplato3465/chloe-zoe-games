import charactersData from '../../Assets/characters.json'
import charactersImage from '../../Assets/characters.png'
import foodData from '../../Assets/food.json'
import foodImage from '../../Assets/food.png'
import uiData from '../../Assets/UI.json'
import uiImage from '../../Assets/UI.png'

// Every sprite atlas the site uses, by name. A frame is always referred to as
// "<atlas>/<frame name>" (for example "ui/image-5.png"), because different atlases reuse the
// same frame names. This file stays free of Pixi on purpose, so pages that only show a frame
// (the main page's covers, the HUD) do not have to load the game engine.
export const ATLASES = {
  characters: { data: charactersData, image: charactersImage },
  food: { data: foodData, image: foodImage },
  ui: { data: uiData, image: uiImage },
}

// The shared UI art.
export const UI = { frame: 'ui/image-13.png', startButton: 'ui/image-5.png' }

// Where a frame lives: its image, its rectangle inside that image, and the image's full size.
export function findFrame(ref) {
  const [atlas, name] = ref.split('/')
  const { data, image } = ATLASES[atlas]
  return { image, sheet: data.meta.size, ...data.frames[name].frame }
}
