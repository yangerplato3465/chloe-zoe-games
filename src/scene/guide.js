import { wiggle } from './dish.js'
import { playSfx } from '../lib/sfx.js'

// Walks the player through a game one tap at a time. The game says which things it is waiting
// for; those pulse, and tapping one of them plays the press sound. Tapping anything else plays
// the wrong sound and gives it a gentle shake, with no other penalty.
//
// A thing is { view, home, rest }: what is shown, where it belongs (so a shake can put it back)
// and its usual scale. A thing with `muted` set ignores taps altogether.
export function createGuide(ticker, { tween }) {
  let waiting = null // { things, resolve } while the player is expected to tap one of some things
  let time = 0

  function tapped(thing) {
    if (!waiting || thing.muted) return
    // Not that one yet: a gentle shake, and whatever is next keeps pulsing.
    if (!waiting.things.includes(thing)) {
      playSfx('wrong')
      wiggle(thing.view, thing.home.x, tween)
      return
    }
    playSfx('press')
    for (const other of waiting.things) other.view.scale.set(other.rest)
    const { resolve } = waiting
    waiting = null
    resolve(thing)
  }

  // Makes a thing something the player can tap.
  function tappable(thing) {
    thing.view.eventMode = 'static'
    thing.view.cursor = 'pointer'
    thing.view.on('pointertap', (event) => {
      // A tap on a thing that sits inside another one is for the inner thing only.
      event.stopPropagation()
      tapped(thing)
    })
    return thing
  }

  // Resolves with whichever of these things the player taps. They pulse meanwhile, to show
  // what to tap next.
  const tapOne = (things) => new Promise((resolve) => (waiting = { things, resolve }))

  ticker.add(() => {
    time += ticker.deltaMS / 1000
    if (!waiting) return
    for (const thing of waiting.things) thing.view.scale.set(thing.rest * (1.03 + Math.sin(time * 5) * 0.03))
  })

  return { tappable, tapOne }
}
