import { Ticker } from 'pixi.js'

export const ease = {
  linear: (t) => t,
  in: (t) => t ** 3,
  out: (t) => 1 - (1 - t) ** 3,
  inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
  // Overshoots a little past 1 before settling, for a bouncy "pop".
  backOut: (t) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2,
}

// Calls onUpdate(progress) every frame for `ms` milliseconds, with progress eased from 0 to 1.
// Resolves when it finishes, so animations can be chained with await.
export function tween(ms, onUpdate, easing = ease.inOut) {
  return new Promise((resolve) => {
    let elapsed = 0
    const step = (ticker) => {
      elapsed += ticker.deltaMS
      const t = Math.min(elapsed / ms, 1)
      onUpdate(easing(t))
      if (t === 1) {
        Ticker.shared.remove(step)
        resolve()
      }
    }
    Ticker.shared.add(step)
  })
}

export const wait = (ms) => tween(ms, () => {})
