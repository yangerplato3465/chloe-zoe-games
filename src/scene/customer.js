import { Container, Sprite } from 'pixi.js'
import { CHARACTERS, HEART } from '../lib/atlases.js'
import { shuffled } from '../lib/random.js'
import { ease } from '../lib/tween.js'

const SCALE = 2
const HEART_SCALE = 1.6
const WALK_SPEED = 0.3 // design pixels per millisecond
const STEP_LENGTH = 90

// The customer who visits a game: one of the characters, standing on view's origin. `body` is
// their picture, for a game that wants to do something to it.
// Needs the "characters" and "food" atlases (the heart is in the food atlas).
export function createCustomer(textures, ticker, { tween }) {
  const body = new Sprite()
  body.anchor.set(0.5, 1)
  body.scale.set(SCALE)
  const heart = new Sprite(textures[HEART])
  heart.anchor.set(0.5)
  heart.visible = false
  const view = new Container()
  view.addChild(body, heart)

  let queue = []
  let character = null

  // Brings in the next character and says which one it is. Everyone visits once before anyone
  // comes back, and nobody comes twice in a row.
  function next() {
    if (queue.length === 0) {
      queue = shuffled(CHARACTERS)
      if (queue[0] === character) queue.push(queue.shift())
    }
    character = queue.shift()
    body.texture = textures[character]
    heart.visible = false
    return character
  }

  // The customer hops along, since the characters are single pictures.
  function walk(from, to) {
    const distance = Math.abs(to - from)
    const steps = Math.max(1, Math.round(distance / STEP_LENGTH))
    view.x = from
    return tween(
      distance / WALK_SPEED,
      (p) => {
        const stride = p * steps * Math.PI
        view.x = from + (to - from) * p
        body.y = -Math.abs(Math.sin(stride)) * 12
        body.rotation = Math.sin(stride) * 0.07
      },
      ease.linear,
    )
  }

  // A heart pops up over the customer's head and they hop twice.
  function celebrate() {
    heart.visible = true
    return Promise.all([
      tween(
        420,
        (p) => {
          heart.scale.set(HEART_SCALE * p)
          heart.y = -214 - 24 * p
        },
        ease.backOut,
      ),
      tween(640, (p) => (body.y = -Math.abs(Math.sin(p * Math.PI * 2)) * 26), ease.linear),
    ])
  }

  // Gentle idle motion: the customer breathes.
  let time = 0
  ticker.add(() => {
    time += ticker.deltaMS / 1000
    body.scale.y = SCALE * (1 + Math.sin(time * 3) * 0.02)
  })

  return { view, body, next, walk, celebrate }
}
