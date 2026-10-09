import { Container, Graphics, Sprite } from 'pixi.js'
import { STALLS } from './assets.js'

export const COUNTER_HEIGHT = 220

const AWNING_HEIGHT = 46
const STRIPE_WIDTH = 64
const AWNING_BOTTOM = AWNING_HEIGHT + STRIPE_WIDTH / 2 // the tips of the scallops
const STALL_SCALE = 1.5

const SKY = 0xd9f0f7
const CLOUD = 0xffffff
const HILL_FAR = 0xd3ebc2
const HILL_NEAR = 0xc4e3b0
const GRASS = 0xb5dc9c
const PATH = 0xf6e7c8
const WOOD = 0xecc9a0
const WOOD_EDGE = 0xd3a877
const WOOD_SHINE = 0xf5dbb9
const WOOD_GRAIN = 0xe2bb8e
const AWNING_PINK = 0xf8b9c5
const AWNING_CREAM = 0xfff6ea

// [x as a fraction of the width, y as a fraction of the open sky below the awning, size]
const CLOUDS = [
  [0.16, 0.34, 1],
  [0.36, 0.1, 0.7],
  [0.8, 0.3, 1.15],
]

// [x as a fraction of the width, y below the counter's far edge, length]
const GRAIN = [
  [0.06, 52, 90],
  [0.3, 178, 130],
  [0.52, 40, 70],
  [0.7, 190, 100],
  [0.88, 60, 80],
]

function drawCloud(g, x, y, size) {
  g.circle(x, y, 24 * size)
    .circle(x + 32 * size, y - 14 * size, 30 * size)
    .circle(x + 66 * size, y, 24 * size)
    .roundRect(x - 24 * size, y, 114 * size, 24 * size, 12 * size)
    .fill(CLOUD)
}

function drawBackdrop(g, width, height, ground) {
  const horizon = ground - 90
  const skyTop = AWNING_BOTTOM + 40
  g.clear()
  g.rect(0, 0, width, height).fill(SKY)
  for (const [fx, fy, size] of CLOUDS) drawCloud(g, width * fx, skyTop + (horizon - skyTop) * fy, size)
  g.ellipse(width * 0.2, horizon + 30, width * 0.4, 110).fill(HILL_FAR)
  g.ellipse(width * 0.84, horizon + 40, width * 0.45, 140).fill(HILL_NEAR)
  g.rect(0, horizon, width, height - horizon).fill(GRASS)
  g.rect(0, ground - 30, width, 60).fill(PATH)
}

// The counter is seen from the shopkeeper's side, so it is all table top.
function drawCounter(g, width, height) {
  const top = height - COUNTER_HEIGHT
  g.clear()
  g.rect(0, top, width, COUNTER_HEIGHT).fill(WOOD)
  for (const [fx, dy, length] of GRAIN) g.roundRect(width * fx, top + dy, length, 5, 2.5).fill(WOOD_GRAIN)
  g.rect(0, top, width, 16).fill(WOOD_EDGE)
  g.rect(0, top + 16, width, 5).fill(WOOD_SHINE)
}

function drawAwning(g, width) {
  // An odd number of stripes, centred, so both ends of the awning match.
  const count = Math.ceil(width / STRIPE_WIDTH / 2) * 2 + 1
  const start = (width - count * STRIPE_WIDTH) / 2
  g.clear()
  for (let i = 0; i < count; i++) {
    const x = start + i * STRIPE_WIDTH
    g.rect(x, 0, STRIPE_WIDTH, AWNING_HEIGHT)
      .circle(x + STRIPE_WIDTH / 2, AWNING_HEIGHT, STRIPE_WIDTH / 2)
      .fill(i % 2 ? AWNING_CREAM : AWNING_PINK)
  }
}

function createStall(texture) {
  const stall = new Sprite(texture)
  stall.anchor.set(0.5, 1)
  stall.scale.set(STALL_SCALE)
  return stall
}

// Everything that is not part of the gameplay, split into layers so the game can slot
// customers behind the counter and under the awning.
export function createScenery(textures) {
  const backdrop = new Graphics()
  const bakery = createStall(textures[STALLS.bakery])
  const kitchen = createStall(textures[STALLS.kitchen])
  const back = new Container()
  back.addChild(backdrop, bakery, kitchen)
  const counter = new Graphics()
  const awning = new Graphics()

  function layout(width, height) {
    const ground = height - COUNTER_HEIGHT
    const stallOffset = Math.min(Math.max(width * 0.3, 200), 360)
    drawBackdrop(backdrop, width, height, ground)
    bakery.position.set(width / 2 - stallOffset, ground - 34)
    kitchen.position.set(width / 2 + stallOffset, ground - 34)
    drawCounter(counter, width, height)
    drawAwning(awning, width)

    // The clear width between the two stalls, where customers stand.
    return { stallGap: kitchen.x - kitchen.width / 2 - (bakery.x + bakery.width / 2) }
  }

  return { back, counter, awning, layout, awningBottom: AWNING_BOTTOM }
}
