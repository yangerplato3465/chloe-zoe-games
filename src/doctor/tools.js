import { Graphics, Sprite } from 'pixi.js'

// A tool the doctor uses: a picture from the doctor atlas, drawn around its own middle.
// `size` is how big the picture is from corner to corner, and `tip` is the point on it that
// touches the patient, measured from its middle.
export function createTool() {
  const view = new Sprite()
  view.anchor.set(0.5)
  const tool = { view, size: 1, tip: { x: 0, y: 0 }, become }

  // Makes the tool a particular picture. `tip` is given in pixels from the picture's top-left
  // corner; left out, the tool touches the patient with its middle.
  function become(texture, [x, y] = [texture.width / 2, texture.height / 2]) {
    view.texture = texture
    tool.size = Math.hypot(texture.width, texture.height)
    tool.tip = { x: x - texture.width / 2, y: y - texture.height / 2 }
  }

  return tool
}

// There are no pictures of what is wrong with a patient, so those are drawn in code.

// A sore purple patch.
export function createBruise() {
  const bruise = new Graphics()
  bruise.ellipse(0, 0, 7.5, 6).fill({ color: 0x8f7fc9, alpha: 0.62 })
  bruise.ellipse(-1, 0.5, 4.6, 3.6).fill({ color: 0x6f5fb5, alpha: 0.6 })
  bruise.ellipse(1.8, -1.6, 1.6, 1.1).fill({ color: 0xcfc6f2, alpha: 0.75 })
  return bruise
}

// A small yellow star, for dizziness and for sparkles.
export function createStar(radius = 5) {
  return new Graphics().star(0, 0, 5, radius, radius * 0.5).fill(0xfbd65c).stroke({ color: 0xd9a93a, width: 1 })
}
