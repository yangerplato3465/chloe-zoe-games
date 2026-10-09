import { Circle, Container, Graphics, Sprite } from 'pixi.js'
import { ease } from '../lib/tween.js'

// A plate with something on it that can be tapped. `food` is the sprite on the plate, and
// `home` is where the plate belongs, for whoever lays it out.
export function createDish(radius = 62) {
  const plate = new Graphics()
  const food = new Sprite()
  food.anchor.set(0.5)

  const view = new Container()
  view.addChild(plate, food)
  view.cursor = 'pointer'
  view.on('pointerover', () => view.scale.set(1.06))
  view.on('pointerout', () => view.scale.set(1))

  const dish = { view, food, home: { x: 0, y: 0 }, radius, resize }

  function resize(newRadius) {
    dish.radius = newRadius
    plate.clear()
    plate.ellipse(0, newRadius * 0.15, newRadius * 1.03, newRadius * 0.97).fill({ color: 0x7a4f2e, alpha: 0.2 })
    plate.circle(0, 0, newRadius).fill(0xfffdf8).stroke({ color: 0xead9c6, width: 4 })
    plate.circle(0, 0, newRadius * 0.73).stroke({ color: 0xf3e8da, width: 3 })
    view.hitArea = new Circle(0, 0, newRadius + 8)
  }

  resize(radius)
  return dish
}

// A gentle "not that one": shakes something sideways around where it belongs.
export function wiggle(view, homeX, tween) {
  return tween(400, (p) => (view.x = homeX + Math.sin(p * Math.PI * 6) * 9 * (1 - p)), ease.linear)
}
