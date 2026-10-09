import { Container, Sprite } from 'pixi.js'
import { FOODS, STALLS } from './assets.js'
import { shuffled } from '../lib/random.js'
import { playSfx } from '../lib/sfx.js'
import { createTweens, ease } from '../lib/tween.js'
import { createBubble } from '../scene/bubble.js'
import { createCustomer } from '../scene/customer.js'
import { createDish, wiggle } from '../scene/dish.js'
import { fit } from '../scene/fit.js'
import { createScenery } from '../scene/scenery.js'
import { fitToScreen } from '../scene/screen.js'

// In design pixels (see scene/screen.js).
const SAFE_WIDTH = 600
const SAFE_HEIGHT = 720
const COUNTER_DEPTH = 220

const CHOICES = 4
const PLATE_SPACING = 148
const STALL_SCALE = 1.5
const STAGE_HEIGHT = 96 // about the middle of a standing customer

// The thought bubble starts just above the customer's head.
const BUBBLE = {
  y: -196,
  centre: { x: 88, y: -112 },
  dots: [
    [0, 0, 8],
    [16, -28, 13],
  ],
  puffs: [
    [-50, -6, 48],
    [0, -30, 54],
    [50, -6, 48],
    [-28, 28, 46],
    [28, 28, 46],
    [0, 0, 56],
  ],
}

function createStall(texture) {
  const stall = new Sprite(texture)
  stall.anchor.set(0.5, 1)
  stall.scale.set(STALL_SCALE)
  return stall
}

// Builds the shop on a Pixi app. The scene sits empty until start() is called, then customers
// keep coming until the app is destroyed. The game only draws the scene; whoever owns it hears
// about it through the callbacks:
//   onServed()   a customer just got the food they wanted
//   onLayout({ scale, hudTop, stage })
//                the scene was (re)laid out. scale is screen pixels per design pixel; hudTop is
//                the design-pixel height of the awning that a HUD should clear; stage is the
//                design-pixel point at the middle of where a customer stands, with the clear
//                width between the stalls there.
export function createShop(app, textures, { onServed = () => {}, onLayout = () => {} } = {}) {
  const tweens = createTweens(app.ticker)
  const { tween, wait } = tweens
  const scenery = createScenery()
  const bakery = createStall(textures[STALLS.bakery])
  const kitchen = createStall(textures[STALLS.kitchen])
  scenery.back.addChild(bakery, kitchen)

  const customer = createCustomer(textures, app.ticker, tweens)
  const bubble = createBubble(BUBBLE, app.ticker, tweens)
  bubble.view.y = BUBBLE.y
  const thought = new Sprite()
  thought.anchor.set(0.5)
  bubble.content.addChild(thought)
  const plates = Array.from({ length: CHOICES }, () => Object.assign(createDish(), { frame: null }))

  // Customers stand behind the counter; the plates sit on top of it.
  const customerLayer = new Container()
  customerLayer.addChild(customer.view, bubble.view)
  const plateLayer = new Container()
  plateLayer.addChild(...plates.map((plate) => plate.view))
  const world = new Container()
  world.addChild(scenery.back, customerLayer, scenery.counter, plateLayer, scenery.awning)
  app.stage.addChild(world)

  let width = SAFE_WIDTH
  let wanted = null
  let onPick = null // set while the player is choosing
  for (const plate of plates) plate.view.on('pointertap', () => onPick?.(plate))

  function arrange(screen) {
    width = screen.width
    const ground = screen.height - COUNTER_DEPTH
    const stallOffset = Math.min(Math.max(width * 0.3, 200), 360)
    scenery.layout(width, screen.height, COUNTER_DEPTH)
    bakery.position.set(width / 2 - stallOffset, ground - 34)
    kitchen.position.set(width / 2 + stallOffset, ground - 34)
    customerLayer.position.set(width / 2, ground - 8)
    plateLayer.position.set(width / 2, screen.height - COUNTER_DEPTH / 2 + 8)

    const spacing = Math.min(PLATE_SPACING, (width - 24) / CHOICES)
    plates.forEach((plate, i) => {
      plate.home.x = (i - (CHOICES - 1) / 2) * spacing
      plate.view.x = plate.home.x
    })

    onLayout({
      scale: screen.scale,
      hudTop: scenery.awningBottom,
      stage: {
        x: customerLayer.x,
        y: customerLayer.y - STAGE_HEIGHT,
        // The clear width between the two stalls.
        width: kitchen.x - kitchen.width / 2 - (bakery.x + bakery.width / 2),
      },
    })
  }

  function setChoosing(choosing) {
    for (const plate of plates) {
      plate.view.eventMode = choosing ? 'static' : 'none'
      plate.view.scale.set(1)
    }
  }

  // Puts the wanted food and some others on the plates, in a random order.
  function stockPlates() {
    const others = shuffled(FOODS.filter((frame) => frame !== wanted)).slice(0, CHOICES - 1)
    const frames = shuffled([wanted, ...others])
    return Promise.all(
      plates.map(async (plate, i) => {
        const { food } = plate
        plate.frame = frames[i]
        food.texture = textures[frames[i]]
        fit(food, 100, 92)
        const full = food.scale.x
        food.scale.set(0)
        food.position.set(0, -4)
        food.alpha = 1
        await wait(i * 90)
        await tween(320, (p) => food.scale.set(full * p), ease.backOut)
      }),
    )
  }

  function think() {
    thought.texture = textures[wanted]
    fit(thought, 112, 96)
    return bubble.show()
  }

  // A wrong pick is no big deal: the plate wiggles and that food fades, so it is not picked again.
  function nope(plate) {
    playSfx('wrong')
    plate.view.eventMode = 'none'
    plate.view.scale.set(1)
    wiggle(plate.view, plate.home.x, tween)
    tween(400, (p) => (plate.food.alpha = 1 - 0.6 * p), ease.linear)
  }

  // Resolves with the plate once the player taps the food the customer is thinking of.
  function rightPick() {
    setChoosing(true)
    return new Promise((resolve) => {
      onPick = (plate) => {
        if (plate.frame !== wanted) return nope(plate)
        playSfx('press')
        onPick = null
        setChoosing(false)
        resolve(plate)
      }
    })
  }

  // Flies the food from its plate over to the customer while the other plates empty.
  async function deliver(plate) {
    const { food } = plate
    const full = food.scale.x
    const from = { x: food.x, y: food.y }
    const to = { x: -plate.view.x, y: customerLayer.y - 80 - plateLayer.y }
    const others = plates.filter((other) => other !== plate)
    await tween(450, (p) => {
      food.x = from.x + (to.x - from.x) * p
      food.y = from.y + (to.y - from.y) * p - Math.sin(p * Math.PI) * 60
      food.scale.set(full * (1 - 0.35 * p))
      for (const other of others) other.food.alpha = Math.min(other.food.alpha, 1 - p)
    })
    await tween(180, (p) => food.scale.set(full * 0.65 * (1 - p)), ease.in)
  }

  async function playRound() {
    const offstage = width / 2 + 120
    customer.next()
    wanted = shuffled(FOODS.filter((frame) => frame !== wanted))[0]

    // Customers cross the screen from right to left.
    await customer.walk(offstage, 0)
    await Promise.all([think(), stockPlates()])
    const plate = await rightPick()
    await deliver(plate)
    onServed()
    await Promise.all([bubble.hide(), customer.celebrate()])
    await wait(500)
    await customer.walk(0, -offstage)
    await wait(300)
  }

  fitToScreen(app, world, SAFE_WIDTH, SAFE_HEIGHT, arrange)
  setChoosing(false)

  let started = false

  async function start() {
    if (started) return
    started = true
    for (;;) await playRound()
  }

  return { start }
}
