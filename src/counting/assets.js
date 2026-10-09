// The counting game's art, as "<atlas>/<frame name>" references (see lib/atlases.js).
const counting = (n) => `counting/image-${n}.png`

// The atlases the Pixi scene draws from.
export const COUNTING_ATLASES = ['characters', 'counting']

// The things there can be a number of.
export const THINGS = { star: counting(7), coin: counting(9), diamond: counting(10) }

// Every answer on offer: there are always between this many things and this many.
export const MIN_COUNT = 5
export const MAX_COUNT = 15
