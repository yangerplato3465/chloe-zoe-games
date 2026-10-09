import { ref } from 'vue'
import bgmUrl from '../../Assets/bgm.mp3'

const VOLUME = 0.5
const MUTED_KEY = 'bgm-muted'

// The mute choice is remembered between visits. Storage is not always available (private
// browsing, say); then the choice just lasts until the page is closed.
function recallMuted() {
  try {
    return localStorage.getItem(MUTED_KEY) === 'true'
  } catch {
    return false
  }
}

function rememberMuted(muted) {
  try {
    localStorage.setItem(MUTED_KEY, String(muted))
  } catch {
    // Nothing to do: the choice still holds for this visit.
  }
}

// Whether the music is muted, for a button to show.
export const bgmMuted = ref(recallMuted())

// One shared player for the background music. It is created the first time it is needed, so the
// file is only fetched once someone opens a game.
let audio = null
let playing = false // whether the music is meant to be playing right now

function player() {
  if (!audio) {
    audio = new Audio(bgmUrl)
    audio.loop = true
    audio.volume = VOLUME
    audio.muted = bgmMuted.value
  }
  return audio
}

function play() {
  // If the browser refuses or the file cannot be loaded, the game just carries on without music.
  audio.play().catch((error) => console.warn('The music could not start:', error))
}

// Starts fetching the music, so it is ready by the time a game starts.
export function preloadBgm() {
  player()
}

// Starts the music from the top; it loops until stopBgm(). Browsers only let a page make sound
// after a tap or click, which is why games call this from their Start button.
export function startBgm() {
  playing = true
  player().currentTime = 0
  play()
}

export function stopBgm() {
  playing = false
  audio?.pause()
}

// Muted music keeps its place in the track, so unmuting picks up where the tune has got to.
export function toggleBgmMuted() {
  bgmMuted.value = !bgmMuted.value
  if (audio) audio.muted = bgmMuted.value
  rememberMuted(bgmMuted.value)
}

// No music from a tab or app that is in the background.
document.addEventListener('visibilitychange', () => {
  if (!playing) return
  if (document.hidden) audio.pause()
  else play()
})
