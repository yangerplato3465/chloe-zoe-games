import pressUrl from '../../Assets/press.ogg'
import wrongUrl from '../../Assets/wrong.ogg'

// The sound effects and how loud each plays. wrong.ogg is recorded several times louder than
// press.ogg, so it is turned down to sit beside it.
const SOUNDS = {
  press: { url: pressUrl, volume: 1 },
  wrong: { url: wrongUrl, volume: 0.5 },
}

const buffers = {} // name -> the decoded sound, once it is ready
let context = null
let loading = null

async function load(name) {
  const data = await (await fetch(SOUNDS[name].url)).arrayBuffer()
  // Decoded with an offline context, because a real one may not be started until the player
  // has tapped something, and the sounds should be ready before then.
  buffers[name] = await new OfflineAudioContext(1, 1, 44100).decodeAudioData(data)
}

// Fetches and decodes the effects ahead of time, so the first one plays without a delay.
// A sound this browser cannot decode is skipped; the game then plays without it.
export function preloadSfx() {
  loading ??= Promise.all(
    Object.keys(SOUNDS).map((name) =>
      load(name).catch((error) => console.warn(`The "${name}" sound could not be loaded:`, error)),
    ),
  )
  return loading
}

// Plays an effect by name. Browsers only let a page make sound after a tap or click, so this is
// meant to be called from one. Effects can overlap.
export function playSfx(name) {
  const buffer = buffers[name]
  if (!buffer) return

  context ??= new AudioContext()
  if (context.state === 'suspended') context.resume()
  const source = context.createBufferSource()
  const gain = context.createGain()
  source.buffer = buffer
  gain.gain.value = SOUNDS[name].volume
  source.connect(gain).connect(context.destination)
  source.start()
}
