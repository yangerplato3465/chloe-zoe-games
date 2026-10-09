// The shop's art, as "<atlas>/<frame name>" references (see lib/atlases.js).
const character = (n) => `characters/image-${n}.png`
const food = (n) => `food/images-${n}.png`

// The atlases the Pixi scene draws from.
export const SHOP_ATLASES = ['characters', 'food']

export const CHARACTERS = [0, 1, 2, 3, 4].map(character)

// The food atlas also carries the stalls and the heart. Its images-13, 14 and 15 are smaller
// copies of the cake, bread and taiyaki; they are left out so that two plates on the counter
// never look the same.
export const FOOD = {
  ramen: food(0),
  curry: food(1),
  tempura: food(2),
  dango: food(3),
  takoyaki: food(4),
  cake: food(5),
  bread: food(6),
  taiyaki: food(7),
  pancakes: food(10),
  donut: food(11),
  iceCream: food(12),
  octopus: food(16),
  bento: food(17),
  fries: food(18),
  bubbleTea: food(19),
  strawberryMilk: food(20),
}
export const FOODS = Object.values(FOOD)

export const STALLS = { bakery: food(8), kitchen: food(9) }
export const HEART = food(21)
