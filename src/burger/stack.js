import { Container, Graphics, Sprite } from 'pixi.js'
import { PARTS } from './assets.js'

// [x, how far it hangs below the layer, half its width]
const KETCHUP_DRIPS = [
  [-30, 12, 8],
  [2, 18, 9],
  [30, 9, 7.5],
]

function createSlice(texture, { scale, squash }) {
  const slice = new Sprite(texture)
  slice.anchor.set(0.5, 1)
  slice.scale.set(scale, scale * squash)
  return slice
}

// Turns a slice upside down where it stands (or back): either way it rests on its origin, but
// flipped, it is the picture's top edge that does.
function flipSlice(slice, flipped) {
  slice.anchor.y = flipped ? 0 : 1
  slice.scale.y = Math.abs(slice.scale.y) * (flipped ? -1 : 1)
}

// Three slices in a row, the middle one a touch nearer, so pickles fill a layer like the rest
// and all three still show when something wide like lettuce sits on them.
function createPickles(texture, part) {
  const pickles = new Container()
  const slices = [-0.85, 0.85, 0].map((offset) => {
    const slice = createSlice(texture, part)
    slice.position.set(offset * slice.width, offset === 0 ? 0 : -4)
    return slice
  })
  pickles.addChild(...slices)
  return pickles
}

// A splash of sauce that drips over the layer underneath.
function createKetchup() {
  const sauce = new Graphics()
  const shape = (grow) => {
    sauce.ellipse(0, -15, 50 + grow, 14 + grow)
    for (const [x, hang, half] of KETCHUP_DRIPS) {
      sauce.roundRect(x - half - grow, -15, (half + grow) * 2, 15 + hang + grow, half + grow)
    }
  }
  shape(2.5)
  sauce.fill(0xa5392e)
  shape(0)
  sauce.fill(0xe2543e)
  sauce.ellipse(-16, -21, 13, 3.5).fill(0xf29a85)
  return sauce
}

// What a part looks like in a stack, standing on its own origin.
function createLayerView(textures, name) {
  const part = PARTS[name]
  if (name === 'ketchup') return createKetchup()
  if (name === 'pickle') return createPickles(textures[part.icon], part)
  return createSlice(textures[part.icon], part)
}

// A burger: parts stacked from the bottom up, standing on view's origin. A layer is
// { part, view, y }, where y is where its view rests, so callers can animate it into place.
//
// Normally each layer nestles into the one below, like a real burger, which hides part of it.
// Give a `gap` instead and the layers float that far apart, so every one can be seen whole;
// that is how an order is shown.
export function createStack(textures, { gap = null } = {}) {
  const view = new Container()
  const layers = []

  function push(part) {
    // Wrapped in a container so its bounds, squash and all, can be measured.
    const art = createLayerView(textures, part)
    const layerView = new Container()
    layerView.addChild(art)
    const bounds = layerView.getLocalBounds()
    const below = layers.at(-1)
    let y = 0
    if (below && gap === null) {
      y = below.y - PARTS[below.part].rise
      if (PARTS[below.part].flip) flipSlice(below.art, true)
    }
    // Its lowest point (ketchup drips hang below its origin) clears the top of the layer below.
    if (below && gap !== null) y = below.y + below.top - gap - bounds.maxY

    const layer = { part, art, view: layerView, y, top: bounds.minY }
    layerView.y = y
    layers.push(layer)
    view.addChild(layerView)
    return layer
  }

  // Takes the top layer off the pile but leaves its view on screen, so it can be animated away.
  function pop() {
    const layer = layers.pop()
    const top = layers.at(-1)
    if (top && PARTS[top.part].flip) flipSlice(top.art, false)
    return layer
  }

  function clear() {
    for (const layer of layers.splice(0)) layer.view.destroy({ children: true })
  }

  function set(parts) {
    clear()
    parts.forEach(push)
  }

  return { view, push, pop, clear, set, parts: () => layers.map((layer) => layer.part) }
}
