import { Circle, Container, Graphics, Sprite } from 'pixi.js'
import { fit } from './fit.js'

// A takeaway box that works as a "serve" button. `picture` is the box itself, for a game that
// wants to bounce it, and `home` is where the box belongs, for whoever lays it out.
export function createBox(texture) {
  const shadow = new Graphics()
  const picture = new Sprite(texture)
  picture.anchor.set(0.5)
  const view = new Container()
  view.addChild(shadow, picture)
  view.cursor = 'pointer'
  view.on('pointerover', () => view.scale.set(1.06))
  view.on('pointerout', () => view.scale.set(1))

  // slot is the side of the square the box sits in.
  function resize(slot) {
    fit(picture, slot - 14, slot - 14)
    shadow.clear()
    shadow.ellipse(-slot * 0.05, slot * 0.36, slot * 0.34, slot * 0.08).fill({ color: 0x7a4f2e, alpha: 0.2 })
    view.hitArea = new Circle(0, 0, slot / 2)
  }

  return { view, picture, home: { x: 0, y: 0 }, resize }
}
