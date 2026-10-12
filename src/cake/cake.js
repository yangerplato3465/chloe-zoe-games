import { Container, Sprite } from 'pixi.js'
import { PARTS } from './assets.js'
import { fit } from '../scene/fit.js'

// What each step adds stands in a row of its own, listed here from the back of the cake to the
// front. `y` is where the row stands, measured from the sponge's bottom edge, `box` what each
// picture is shrunk to fit and `spacing` how far apart its things are. The top of a sponge is
// an oval about 78 up, with the sponge's face just below it, so the rows stand on the oval and
// leave the face clear. They overlap like a real pile of toppings: the tall decorations show
// over the cream, and the cream over the fruit.
const ROWS = {
  sponge: { y: 0, box: [104, 94], spacing: 0 },
  decor: { y: -88, box: [34, 64], spacing: 30 },
  cream: { y: -80, box: [36, 31], spacing: 23 },
  fruit: { y: -68, box: [32, 28], spacing: 28 },
}

// A cake, standing on view's origin. Each thing on it is a piece, { part, step, view }; its
// view rests at y = 0, so callers can animate it into place or away.
export function createCake(textures) {
  const view = new Container()
  const rows = Object.fromEntries(Object.keys(ROWS).map((step) => [step, { holder: new Container(), pieces: [] }]))
  view.addChild(...Object.values(rows).map((row) => row.holder))

  // The things in a row are spread evenly about the middle of the cake.
  function spread(step) {
    const { pieces } = rows[step]
    pieces.forEach((piece, i) => (piece.view.x = (i - (pieces.length - 1) / 2) * ROWS[step].spacing))
  }

  function add(part) {
    const { step, icon } = PARTS[part]
    const picture = new Sprite(textures[icon])
    picture.anchor.set(0.5, 1)
    fit(picture, ...ROWS[step].box)
    picture.scale.set(Math.min(picture.scale.x, 1))
    picture.y = ROWS[step].y
    const piece = { part, step, view: new Container() }
    piece.view.addChild(picture)
    rows[step].holder.addChild(piece.view)
    rows[step].pieces.push(piece)
    spread(step)
    return piece
  }

  // Takes a piece off the cake but leaves its view on screen, so it can be animated away.
  function remove(piece) {
    const { pieces } = rows[piece.step]
    pieces.splice(pieces.indexOf(piece), 1)
    spread(piece.step)
    return piece
  }

  function clear() {
    for (const row of Object.values(rows)) {
      for (const piece of row.pieces.splice(0)) piece.view.destroy({ children: true })
    }
  }

  // Makes the cake an order: the parts wanted from each step, { sponge: [...], cream: [...] }.
  function set(order) {
    clear()
    for (const parts of Object.values(order)) parts.forEach(add)
  }

  return { view, add, remove, clear, set, pieces: (step) => [...rows[step].pieces] }
}
