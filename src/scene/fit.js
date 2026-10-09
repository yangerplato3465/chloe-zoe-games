// Scales a sprite so its texture fits inside a box, keeping its proportions.
export function fit(sprite, maxWidth, maxHeight) {
  const { width, height } = sprite.texture
  sprite.scale.set(Math.min(maxWidth / width, maxHeight / height))
}
