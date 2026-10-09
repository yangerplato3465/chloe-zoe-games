export const ease = {
  linear: (t) => t,
  in: (t) => t ** 3,
  out: (t) => 1 - (1 - t) ** 3,
  inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
  // Overshoots a little past 1 before settling, for a bouncy "pop".
  backOut: (t) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2,
}

// Tweens driven by one Pixi ticker. When that ticker is destroyed (with its app), any tween
// still running simply never finishes, which is how a game stops when its component unmounts.
export function createTweens(ticker) {
  // Calls onUpdate(progress) every frame for `ms` milliseconds, with progress eased from 0 to 1.
  // Resolves when it finishes, so animations can be chained with await.
  function tween(ms, onUpdate, easing = ease.inOut) {
    return new Promise((resolve) => {
      let elapsed = 0
      const step = () => {
        elapsed += ticker.deltaMS
        const t = Math.min(elapsed / ms, 1)
        onUpdate(easing(t))
        if (t === 1) {
          ticker.remove(step)
          resolve()
        }
      }
      ticker.add(step)
    })
  }

  const wait = (ms) => tween(ms, () => {})

  return { tween, wait }
}
