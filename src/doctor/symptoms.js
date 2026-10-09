import { Container, Graphics } from 'pixi.js'
import { createStar } from './tools.js'

// What can be wrong with a patient, and the colour it turns them.
const TINTS = { fever: 0xffd2cb, chills: 0xd3e4ff, queasy: 0xdaf1c6 }
export const SICKNESSES = Object.keys(TINTS)

// Blends two colours; t goes from 0 (all a) to 1 (all b).
function mix(a, b, t) {
  const channel = (shift) => Math.round(((a >> shift) & 255) + (((b >> shift) & 255) - ((a >> shift) & 255)) * t)
  return (channel(16) << 16) | (channel(8) << 8) | channel(0)
}

// Shows what is wrong with a patient: they turn a sickly colour, and
//   fever   has them sweating,
//   chills  has them shivering,
//   queasy  has little bubbles coming up,
// and on top of any of those they may be dizzy, with stars going round their head.
// `body` is the patient's picture. `extras` is where the drops, bubbles and stars are drawn: it
// is expected to follow the picture, and works in the picture's own pixels measured from the
// middle of its bottom edge.
export function createSymptoms(body, extras, ticker, { tween }) {
  const drops = [-1, 1].map((side) => {
    const drop = new Graphics().circle(0, 0, 3).poly([-2.6, -1.4, 2.6, -1.4, 0, -7]).fill(0x8fd0f2)
    return { view: drop, side }
  })
  const bubbles = [0, 1, 2].map(() => new Graphics().circle(0, 0, 3).fill({ color: 0xbfe59f, alpha: 0.9 }).stroke({ color: 0x8fc46a, width: 1 }))
  const stars = [0, 1, 2].map(() => createStar(4.5))
  const layer = new Container()
  layer.addChild(...drops.map((drop) => drop.view), ...bubbles, ...stars)
  extras.addChild(layer)

  let sickness = null
  let dizzy = false
  let head = { x: 0, y: 0 } // the patient's mouth, which is as good as the middle of their face
  let top = 0 // the top of their picture
  let strength = 0 // fades from 1 to 0 as they get better
  let time = 0

  // Makes the patient ill. `mouth` is where their mouth is, in the picture's own pixels from its
  // top-left corner.
  function set({ sickness: kind, dizzy: spinning, mouth }) {
    sickness = kind
    dizzy = spinning
    head = { x: mouth[0] - body.texture.width / 2, y: mouth[1] - body.texture.height }
    top = -body.texture.height
    strength = 1
    body.tint = TINTS[sickness]
  }

  // The patient gets better: their colour comes back and everything else fades away.
  async function cure() {
    const from = TINTS[sickness]
    await tween(700, (p) => {
      strength = 1 - p
      body.tint = mix(from, 0xffffff, p)
    })
    sickness = null
    dizzy = false
  }

  ticker.add(() => {
    time += ticker.deltaMS / 1000
    layer.alpha = strength
    body.x = sickness === 'chills' ? Math.sin(time * 38) * 1.4 * strength : 0

    // Sweat runs down either side of the face.
    drops.forEach(({ view, side }, i) => {
      const fall = (time * 0.7 + i * 0.5) % 1
      view.visible = sickness === 'fever'
      view.position.set(head.x + side * 27, head.y - 20 + fall * 22)
      view.alpha = 1 - fall
    })
    // Bubbles drift up from the mouth.
    bubbles.forEach((bubble, i) => {
      const rise = (time * 0.5 + i / 3) % 1
      bubble.visible = sickness === 'queasy'
      bubble.position.set(head.x + 12 + Math.sin(rise * 6 + i) * 4, head.y - 4 - rise * 30)
      bubble.scale.set(0.6 + rise * 0.7)
      bubble.alpha = 1 - rise
    })
    // Stars go round above the head, passing in front and behind.
    stars.forEach((star, i) => {
      const turn = time * 2.6 + (i * Math.PI * 2) / 3
      star.visible = dizzy
      star.position.set(head.x + Math.cos(turn) * 24, top - 3 + Math.sin(turn) * 6)
      star.scale.set(0.85 + Math.sin(turn) * 0.2)
      star.rotation = time * 2
    })
  })

  return { set, cure }
}
