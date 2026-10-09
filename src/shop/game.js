import { Circle, Container, Graphics, Sprite } from 'pixi.js'
import { CHARACTERS, FOODS, HEART } from './assets.js'
import { COUNTER_HEIGHT, createScenery } from './scenery.js'
import { createTweens, ease } from '../lib/tween.js'

// The game is laid out in design pixels. At least SAFE_WIDTH x SAFE_HEIGHT of them always
// fit on screen; wider or taller screens just show more of the scene.
const SAFE_WIDTH = 600
const SAFE_HEIGHT = 720

const CHOICES = 4
const PLATE_SPACING = 148
const WALK_SPEED = 0.3 // design pixels per millisecond
const STEP_LENGTH = 90
const CUSTOMER_SCALE = 2
const HEART_SCALE = 1.6
const BUBBLE_Y = -196 // just above the customer's head
const STAGE_HEIGHT = 96 // about the middle of a standing customer
const OUTLINE = 0x9c7b6a

function shuffled(list) {
  const result = [...list]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// Scales a sprite so its texture fits inside a box, keeping its proportions.
function fit(sprite, maxWidth, maxHeight) {
  const { width, height } = sprite.texture
  sprite.scale.set(Math.min(maxWidth / width, maxHeight / height))
}

function createCustomer(textures) {
  const view = new Container()
  const body = new Sprite()
  body.anchor.set(0.5, 1)
  body.scale.set(CUSTOMER_SCALE)
  const heart = new Sprite(textures[HEART])
  heart.anchor.set(0.5)
  heart.visible = false
  view.addChild(body, heart)
  return { view, body, heart }
}

// A thought bubble whose origin is the smallest dot, so it grows out of the customer's head.
function createBubble() {
  const centre = { x: 88, y: -112 }
  const dots = [
    [0, 0, 8],
    [16, -28, 13],
  ]
  const puffs = [
    [-50, -6, 48],
    [0, -30, 54],
    [50, -6, 48],
    [-28, 28, 46],
    [28, 28, 46],
    [0, 0, 56],
  ].map(([x, y, radius]) => [x + centre.x, y + centre.y, radius])
  const shapes = [...dots, ...puffs]

  const cloud = new Graphics()
  for (const [x, y, radius] of shapes) cloud.circle(x, y, radius + 4)
  cloud.fill(OUTLINE)
  for (const [x, y, radius] of shapes) cloud.circle(x, y, radius)
  cloud.fill(0xffffff)

  const food = new Sprite()
  food.anchor.set(0.5)
  food.position.set(centre.x, centre.y)

  const view = new Container()
  view.addChild(cloud, food)
  view.scale.set(0)
  return { view, food }
}

function createPlate() {
  const dish = new Graphics()
  dish.ellipse(0, 9, 64, 60).fill({ color: 0x7a4f2e, alpha: 0.2 })
  dish.circle(0, 0, 62).fill(0xfffdf8).stroke({ color: 0xead9c6, width: 4 })
  dish.circle(0, 0, 45).stroke({ color: 0xf3e8da, width: 3 })

  const food = new Sprite()
  food.anchor.set(0.5)

  const view = new Container()
  view.addChild(dish, food)
  view.hitArea = new Circle(0, 0, 70)
  view.cursor = 'pointer'
  view.on('pointerover', () => view.scale.set(1.06))
  view.on('pointerout', () => view.scale.set(1))
  return { view, food, frame: null, homeX: 0 }
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
  const { tween, wait } = createTweens(app.ticker)
  const size = { width: SAFE_WIDTH, height: SAFE_HEIGHT }
  const scenery = createScenery(textures)
  const customer = createCustomer(textures)
  const bubble = createBubble()
  const plates = Array.from({ length: CHOICES }, createPlate)

  // Customers stand behind the counter; the plates sit on top of it.
  const customerLayer = new Container()
  customerLayer.addChild(customer.view, bubble.view)
  const plateLayer = new Container()
  plateLayer.addChild(...plates.map((plate) => plate.view))
  const world = new Container()
  world.addChild(scenery.back, customerLayer, scenery.counter, plateLayer, scenery.awning)
  app.stage.addChild(world)

  let wanted = null
  let lastCharacter = null
  let queue = []
  let onPick = null // set while the player is choosing
  for (const plate of plates) plate.view.on('pointertap', () => onPick?.(plate))

  function layout() {
    const scale = Math.min(app.screen.width / SAFE_WIDTH, app.screen.height / SAFE_HEIGHT)
    size.width = app.screen.width / scale
    size.height = app.screen.height / scale
    world.scale.set(scale)
    const { stallGap } = scenery.layout(size.width, size.height)
    customerLayer.position.set(size.width / 2, size.height - COUNTER_HEIGHT - 8)
    plateLayer.position.set(size.width / 2, size.height - COUNTER_HEIGHT / 2 + 8)

    const spacing = Math.min(PLATE_SPACING, (size.width - 24) / CHOICES)
    plates.forEach((plate, i) => {
      plate.homeX = (i - (CHOICES - 1) / 2) * spacing
      plate.view.x = plate.homeX
    })

    onLayout({
      scale,
      hudTop: scenery.awningBottom,
      stage: { x: customerLayer.x, y: customerLayer.y - STAGE_HEIGHT, width: stallGap },
    })
  }

  // Every character visits once before anyone comes back, and never twice in a row.
  function nextCharacter() {
    if (queue.length === 0) {
      queue = shuffled(CHARACTERS)
      if (queue[0] === lastCharacter) queue.push(queue.shift())
    }
    lastCharacter = queue.shift()
    return lastCharacter
  }

  function setChoosing(choosing) {
    for (const plate of plates) {
      plate.view.eventMode = choosing ? 'static' : 'none'
      plate.view.scale.set(1)
    }
  }

  // The customer hops along, since the characters are single pictures.
  function walk(from, to) {
    const distance = Math.abs(to - from)
    const steps = Math.max(1, Math.round(distance / STEP_LENGTH))
    customer.view.x = from
    return tween(
      distance / WALK_SPEED,
      (p) => {
        const stride = p * steps * Math.PI
        customer.view.x = from + (to - from) * p
        customer.body.y = -Math.abs(Math.sin(stride)) * 12
        customer.body.rotation = Math.sin(stride) * 0.07
      },
      ease.linear,
    )
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
    bubble.food.texture = textures[wanted]
    fit(bubble.food, 112, 96)
    return tween(380, (p) => bubble.view.scale.set(p), ease.backOut)
  }

  // A wrong pick is no big deal: the plate wiggles and that food fades, so it is not picked again.
  function nope(plate) {
    plate.view.eventMode = 'none'
    plate.view.scale.set(1)
    tween(
      400,
      (p) => {
        plate.view.x = plate.homeX + Math.sin(p * Math.PI * 6) * 9 * (1 - p)
        plate.food.alpha = 1 - 0.6 * p
      },
      ease.linear,
    )
  }

  // Resolves with the plate once the player taps the food the customer is thinking of.
  function rightPick() {
    setChoosing(true)
    return new Promise((resolve) => {
      onPick = (plate) => {
        if (plate.frame !== wanted) return nope(plate)
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

  function celebrate() {
    const { body, heart } = customer
    onServed()
    heart.visible = true
    return Promise.all([
      tween(200, (p) => bubble.view.scale.set(1 - p), ease.in),
      tween(420, (p) => {
        heart.scale.set(HEART_SCALE * p)
        heart.y = -214 - 24 * p
      }, ease.backOut),
      tween(640, (p) => (body.y = -Math.abs(Math.sin(p * Math.PI * 2)) * 26), ease.linear),
    ])
  }

  async function playRound() {
    const offstage = size.width / 2 + 120
    customer.body.texture = textures[nextCharacter()]
    customer.heart.visible = false
    wanted = shuffled(FOODS.filter((frame) => frame !== wanted))[0]

    // Customers cross the screen from right to left.
    await walk(offstage, 0)
    await Promise.all([think(), stockPlates()])
    const plate = await rightPick()
    await deliver(plate)
    await celebrate()
    await wait(500)
    await walk(0, -offstage)
    await wait(300)
  }

  // Gentle idle motion: the customer breathes and the bubble floats.
  let time = 0
  app.ticker.add((ticker) => {
    time += ticker.deltaMS / 1000
    customer.body.scale.y = CUSTOMER_SCALE * (1 + Math.sin(time * 3) * 0.02)
    bubble.view.y = BUBBLE_Y + Math.sin(time * 2) * 4
  })

  app.renderer.on('resize', layout)
  layout()
  setChoosing(false)

  let started = false

  async function start() {
    if (started) return
    started = true
    for (;;) await playRound()
  }

  return { start }
}
