// The cake game's art, as "<atlas>/<frame name>" references (see lib/atlases.js).
const cake = (n) => `cake/cake-${n}.png`

// The atlases the Pixi scene draws from. The food atlas is only there for the heart, and the
// burger atlas for the takeaway box.
export const CAKE_ATLASES = ['characters', 'food', 'burger', 'cake']

export const BOX = 'burger/image-14.png'

// Only the cover uses these: a cake with everything on it, and a piping bag.
export const FINISHED = cake(38)
export const PIPING_BAG = cake(23)

// A cake is made one step at a time, in this order. A customer asks for between
// `fewest` and `most` things from a step (the very first customer, who goes easy, for `first`),
// and `most` is also all that the step lets the player put on the cake.
export const STEPS = [
  { name: 'sponge', fewest: 1, first: 1, most: 1 },
  { name: 'cream', fewest: 2, first: 2, most: 4 },
  { name: 'fruit', fewest: 1, first: 1, most: 3 },
  { name: 'decor', fewest: 1, first: 1, most: 3 },
]

// Everything a cake can be made of, in the order of the plates. `icon` is its picture, `step`
// the step it belongs to, and `tilt` how it lies on its plate.
export const PARTS = {
  frosted: { step: 'sponge', icon: cake(0) },
  plain: { step: 'sponge', icon: cake(1) },
  pinkCream: { step: 'cream', icon: cake(12) },
  yellowCream: { step: 'cream', icon: cake(13) },
  greenCream: { step: 'cream', icon: cake(14) },
  purpleCream: { step: 'cream', icon: cake(15) },
  strawberry: { step: 'fruit', icon: cake(8) },
  blueberries: { step: 'fruit', icon: cake(10) },
  orange: { step: 'fruit', icon: cake(16) },
  cherries: { step: 'fruit', icon: cake(17) },
  candle: { step: 'decor', icon: cake(5), tilt: 0.5 },
  bear: { step: 'decor', icon: cake(33) },
  cat: { step: 'decor', icon: cake(37) },
  penguin: { step: 'decor', icon: cake(34) },
}

export const partsFor = (step) => Object.keys(PARTS).filter((part) => PARTS[part].step === step)
