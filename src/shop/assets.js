import { Assets, Spritesheet } from 'pixi.js'
import charactersData from '../../Assets/characters.json'
import charactersImage from '../../Assets/characters.png'
import foodData from '../../Assets/food.json'
import foodImage from '../../Assets/food.png'

const ATLASES = [
  { data: charactersData, image: charactersImage },
  { data: foodData, image: foodImage },
]

// Frame names inside the two atlases. food.png also carries the stalls and the heart.
export const CHARACTERS = ['image-0.png', 'image-1.png', 'image-2.png', 'image-3.png', 'image-4.png']

// images-13, 14 and 15 are smaller copies of the cake, bread and taiyaki. They are left out
// so that two plates on the counter never look the same.
export const FOODS = Object.values({
  ramen: 'images-0.png',
  curry: 'images-1.png',
  tempura: 'images-2.png',
  dango: 'images-3.png',
  takoyaki: 'images-4.png',
  cake: 'images-5.png',
  bread: 'images-6.png',
  taiyaki: 'images-7.png',
  pancakes: 'images-10.png',
  donut: 'images-11.png',
  iceCream: 'images-12.png',
  octopus: 'images-16.png',
  bento: 'images-17.png',
  fries: 'images-18.png',
  bubbleTea: 'images-19.png',
  strawberryMilk: 'images-20.png',
})

export const STALLS = { bakery: 'images-8.png', kitchen: 'images-9.png' }
export const HEART = 'images-21.png'

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

// Inline CSS that shows a single atlas frame, for UI that Vue draws outside the canvas.
export function frameStyle(name) {
  const atlas = ATLASES.find(({ data }) => name in data.frames)
  const { x, y, w, h } = atlas.data.frames[name].frame
  return {
    width: `${w}px`,
    height: `${h}px`,
    backgroundImage: `url(${atlas.image})`,
    backgroundPosition: `-${x}px -${y}px`,
  }
}
