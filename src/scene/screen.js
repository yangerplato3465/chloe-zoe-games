// Games are laid out in design pixels. This scales `world` so that at least
// safeWidth x safeHeight of them always fit on screen (wider or taller screens just show more),
// and calls arrange({ width, height, scale }) with the visible size now and on every resize.
export function fitToScreen(app, world, safeWidth, safeHeight, arrange) {
  function update() {
    const scale = Math.min(app.screen.width / safeWidth, app.screen.height / safeHeight)
    world.scale.set(scale)
    arrange({ width: app.screen.width / scale, height: app.screen.height / scale, scale })
  }

  app.renderer.on('resize', update)
  update()
}
