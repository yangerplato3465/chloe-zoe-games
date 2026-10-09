// The burger game's art, as "<atlas>/<frame name>" references (see lib/atlases.js).
const burger = (n) => `burger/image-${n}.png`

// The atlases the Pixi scene draws from. The food atlas is only there for the heart.
export const BURGER_ATLASES = ['characters', 'food', 'burger']

export const BOX = burger(14)

// Everything that can go in a burger. `icon` is its picture, shown on its plate. In a stack,
// `scale` and `squash` shape that picture (the fillings are drawn from above, so squashing them
// lays them flat) and `rise` is how much higher the next layer sits. `flip` turns the picture
// upside down while another layer sits on it: the lettuce's stem is at the bottom of its picture,
// and flipped, the frilly edge is the one that peeks out from under the layer above.
//
// Two are special in a stack: pickles are laid out as three slices, and ketchup, whose icon is
// the bottle, is drawn as a splash of sauce.
export const PARTS = {
  bottomBun: { icon: burger(5), scale: 1, squash: 1, rise: 30 },
  patty: { icon: burger(1), scale: 1.05, squash: 1, rise: 30 },
  cheese: { icon: burger(2), scale: 1.08, squash: 0.55, rise: 9 },
  lettuce: { icon: burger(3), scale: 1.3, squash: 0.5, rise: 12, flip: true },
  tomato: { icon: burger(4), scale: 1.18, squash: 0.5, rise: 13 },
  pickle: { icon: burger(11), scale: 0.95, squash: 0.6, rise: 12 },
  ketchup: { icon: burger(6), rise: 7 },
  topBun: { icon: burger(0), scale: 1, squash: 1, rise: 40 },
}

// What a customer can ask for between the buns.
export const FILLINGS = ['patty', 'cheese', 'lettuce', 'tomato', 'pickle', 'ketchup']
