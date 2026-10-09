// The ramen game's art, as "<atlas>/<frame name>" references (see lib/atlases.js).
const ramen = (n) => `ramen/ramen-${n}.png`

// The atlases the Pixi scene draws from. The food atlas is only there for the heart.
export const RAMEN_ATLASES = ['characters', 'food', 'ramen']

export const RAMEN = {
  pot: ramen(0),
  cabbage: ramen(1), // the vegetable, whole...
  corn: ramen(2),
  cornSlice: ramen(3),
  choppedVeg: ramen(4), // ...and chopped
  noodles: ramen(5),
  pork: ramen(6),
  nori: ramen(7),
  bowl: ramen(8),
  stove: ramen(9),
  salt: ramen(10),
  finished: ramen(11),
}
