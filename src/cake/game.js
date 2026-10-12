import { Circle, Container, Graphics } from 'pixi.js'
import { BOX, PARTS, STEPS, partsFor } from './assets.js'
import { createCake } from './cake.js'
import { shuffled } from '../lib/random.js'
import { playSfx } from '../lib/sfx.js'
import { createTweens, ease } from '../lib/tween.js'
import { createBox } from '../scene/box.js'
import { createBubble } from '../scene/bubble.js'
import { createCustomer } from '../scene/customer.js'
import { createDish, wiggle } from '../scene/dish.js'
import { fit } from '../scene/fit.js'
import { createScenery } from '../scene/scenery.js'
import { fitToScreen } from '../scene/screen.js'

// In design pixels (see scene/screen.js).
const SAFE_WIDTH = 600
const SAFE_HEIGHT = 800

const AWNING = [0xf7c0a2, 0xfff6ea]
const MAX_SLOT = 124
const COLUMNS = 5 // the most slots a step fills: four plates and the button that ends it
const MAX_ICON_SCALE = 1.5
const TRAY_STRIP = 88 // the strip of counter above the plates, where the cake is made
const CUSTOMER_OFFSET = 190 // the customer stands this far left of the middle...
const TRAY_OFFSET = 208 // ...and the cake is made this far right of it
const BUILD_SCALE = 1.5
const CAKE_WIDTH = 103 // at full size
const OFFSTAGE = 110
const START_WIDTH = 308
const LAST = STEPS.length - 1

// The thought bubble is a tall one beside the customer, big enough for a cake with everything
// on it. x and y are where its smallest dot goes, from the customer's feet.
const BUBBLE = {
  x: 82,
  y: -152,
  centre: { x: 128, y: -58 },
  dots: [
    [0, 0, 5.5],
    [21, -13, 9],
  ],
  puffs: [
    [0, -103, 54],
    [-47, -74, 52],
    [47, -74, 52],
    [-54, -18, 52],
    [54, -18, 52],
    [-52, 40, 52],
    [52, 40, 52],
    [-40, 85, 49],
    [40, 85, 49],
    [0, 101, 49],
    [0, -45, 72],
    [0, 11, 74],
    [0, 63, 67],
  ],
}
const ORDER_BOX = { width: 158, height: 220 } // the room inside the bubble
const MAX_ORDER_SCALE = 1.45

function createTray() {
  const tray = new Graphics()
  tray.ellipse(0, 7, 90, 26).fill({ color: 0x7a4f2e, alpha: 0.2 })
  tray.ellipse(0, 0, 88, 24).fill(0xfffdf8).stroke({ color: 0xead9c6, width: 4 })
  tray.ellipse(0, -1, 62, 15).stroke({ color: 0xf3e8da, width: 3 })
  return tray
}

// The round arrow button that ends a step. It is shaped like the takeaway box (scene/box.js),
// which takes its place for the last step.
function createNextButton() {
  const shadow = new Graphics()
  const picture = new Graphics()
  const view = new Container()
  view.addChild(shadow, picture)
  view.cursor = 'pointer'
  view.on('pointerover', () => view.scale.set(1.06))
  view.on('pointerout', () => view.scale.set(1))

  // slot is the side of the square the button sits in.
  function resize(slot) {
    const r = slot * 0.34
    shadow.clear()
    shadow.ellipse(0, r * 0.2, r * 1.03, r * 0.97).fill({ color: 0x7a4f2e, alpha: 0.2 })
    picture.clear()
    picture.circle(0, 0, r).fill(0xa8dcab).stroke({ color: 0x6ea878, width: 4 })
    picture
      .moveTo(-r * 0.42, 0)
      .lineTo(r * 0.36, 0)
      .moveTo(r * 0.04, -r * 0.34)
      .lineTo(r * 0.4, 0)
      .lineTo(r * 0.04, r * 0.34)
      .stroke({ color: 0xffffff, width: r * 0.2, cap: 'round', join: 'round' })
    view.hitArea = new Circle(0, 0, slot / 2)
  }

  return { view, picture, home: { x: 0, y: 0 }, resize }
}

// Builds the cake game on a Pixi app. The scene sits empty until start() is called, then
// customers keep coming until the app is destroyed. Each one thinks of a cake, and the player
// makes the same one a step at a time: the sponge, then the cream, the fruit and at last the
// candles and little figures. Only the plates for the step in hand are out. Tapping a plate
// puts one of that thing on the cake, tapping the cake takes the last one back off, and the
// arrow moves on to the next step; after the last step, the box serves the cake.
// The callbacks are the same as the shop's (see shop/game.js); here `stage` is the middle of
// the scene above the counter.
export function createCakeGame(app, textures, { onServed = () => {}, onLayout = () => {} } = {}) {
  const tweens = createTweens(app.ticker)
  const { tween, wait } = tweens
  const scenery = createScenery({ awning: AWNING })
  const customer = createCustomer(textures, app.ticker, tweens)
  const bubble = createBubble(BUBBLE, app.ticker, tweens)
  const order = createCake(textures) // the cake the customer is thinking of
  bubble.content.addChild(order.view)

  const tray = createTray()
  const cake = createCake(textures) // the cake being made
  cake.view.cursor = 'pointer'
  const next = createNextButton()
  const box = createBox(textures[BOX])
  // The plates of each step, in the order of the steps.
  const plates = STEPS.map(({ name }) =>
    partsFor(name).map((part) => {
      const dish = Object.assign(createDish(), { part })
      dish.food.texture = textures[PARTS[part].icon]
      dish.food.rotation = PARTS[part].tilt ?? 0
      return dish
    }),
  )
  const dishes = plates.flat()

  // Customers stand behind the counter; everything else is on it or in front of it.
  const customerLayer = new Container()
  customerLayer.addChild(customer.view, bubble.view)
  const counterLayer = new Container()
  counterLayer.addChild(tray, ...dishes.map((dish) => dish.view), next.view, box.view)
  const world = new Container()
  world.addChild(scenery.back, customerLayer, scenery.counter, counterLayer, cake.view, scenery.awning)
  app.stage.addChild(world)

  let width = SAFE_WIDTH
  let stand = { x: 0, y: 0 } // where the customer waits
  let wanted = {} // the cake the customer wants: the parts from each step, by the step's name
  let step = 0 // which of STEPS the player is on
  let served = 0
  let standing = false
  let delivering = false
  let onAction = null // set while the player is making the cake

  for (const dish of dishes) dish.view.on('pointertap', () => onAction?.('add', dish))
  cake.view.on('pointertap', () => onAction?.('undo'))
  next.view.on('pointertap', () => onAction?.('next'))
  box.view.on('pointertap', () => onAction?.('next'))

  // The button that ends the step in hand.
  const button = () => (step === LAST ? box : next)
  // Where that button goes: the slot after a row's last plate.
  const rowEnd = (row) => row.at(-1).home.x + (row[1].home.x - row[0].home.x)

  function arrange(screen) {
    width = screen.width
    const slot = Math.min(MAX_SLOT, (width - 24) / COLUMNS)
    const counterDepth = TRAY_STRIP + slot + 12
    const counterTop = screen.height - counterDepth
    const middle = width / 2
    scenery.layout(width, screen.height, counterDepth)

    // Each step's plates make a row of their own, with room for the button at its end.
    const place = (item, row, i) => {
      item.home.x = middle + (i - row.length / 2) * slot
      item.home.y = counterTop + TRAY_STRIP + slot / 2
    }
    for (const row of plates) row.forEach((dish, i) => place(dish, row, i))
    place(box, plates[LAST], plates[LAST].length)
    next.home.x = rowEnd(plates[step])
    next.home.y = box.home.y
    for (const dish of dishes) {
      dish.view.position.set(dish.home.x, dish.home.y)
      dish.resize(slot / 2 - 6)
      fit(dish.food, slot * 0.62, slot * 0.62)
      // Small pictures stay small rather than being blown up until they blur.
      dish.food.scale.set(Math.min(dish.food.scale.x, MAX_ICON_SCALE))
    }
    next.resize(slot)
    next.view.position.set(next.home.x, next.home.y)
    box.resize(slot)
    tray.position.set(middle + TRAY_OFFSET, counterTop + 44)
    // Mid-delivery, the box and the cake are in the air; they come home with the next customer.
    if (!delivering) {
      box.view.position.set(box.home.x, box.home.y)
      cake.view.position.set(tray.x, tray.y + 6)
    }

    stand = { x: middle - CUSTOMER_OFFSET, y: counterTop - 8 }
    customer.view.y = stand.y
    if (standing) customer.view.x = stand.x
    bubble.view.position.set(stand.x + BUBBLE.x, stand.y + BUBBLE.y)

    onLayout({
      scale: screen.scale,
      hudTop: scenery.awningBottom,
      stage: { x: middle, y: counterTop - 130, width: START_WIDTH },
    })
  }

  function setMaking(making) {
    for (const { view } of [...dishes, next, box, cake]) view.eventMode = making ? 'static' : 'none'
  }

  // Brings out the plates and the button of a step and puts every other step's away.
  function setOut(index) {
    step = index
    plates.forEach((row, i) => row.forEach((dish) => (dish.view.visible = i === step)))
    next.view.visible = step !== LAST
    box.view.visible = step === LAST
    // The arrow sits at the end of whichever row is out.
    const row = plates[step]
    next.home.x = rowEnd(row)
    next.view.position.set(next.home.x, next.home.y)
    ;[...row, button()].forEach(({ view }, i) => {
      view.scale.set(0)
      wait(i * 50).then(() => tween(260, (p) => view.scale.set(p), ease.backOut))
    })
  }

  // A new piece falls onto the cake and settles.
  function drop(piece) {
    return tween(
      300,
      (p) => {
        if (piece.gone) return
        piece.view.y = -50 * (1 - p)
        piece.view.alpha = Math.min(1, p * 4)
      },
      ease.backOut,
    )
  }

  // A piece taken off the cake flips away.
  function toss(piece, delay = 0) {
    piece.gone = true
    const { view } = piece
    const side = Math.random() < 0.5 ? -1 : 1
    return wait(delay)
      .then(() => {
        const from = { x: view.x, y: view.y }
        return tween(
          340,
          (p) => {
            view.position.set(from.x + side * 46 * p, from.y - 60 * p)
            view.rotation = side * 0.5 * p
            view.alpha = 1 - p
          },
          ease.out,
        )
      })
      .then(() => view.destroy({ children: true }))
  }

  const made = () => cake.pieces(STEPS[step].name)

  // The pieces from the step in hand that the customer did not ask for.
  function extras() {
    const left = [...wanted[STEPS[step].name]]
    return made().filter((piece) => {
      const i = left.indexOf(piece.part)
      if (i === -1) return true
      left.splice(i, 1)
      return false
    })
  }

  const stepDone = () => made().length === wanted[STEPS[step].name].length && extras().length === 0

  function add(dish) {
    const { name, most } = STEPS[step]
    // There is only ever one sponge, so another one takes its place.
    if (name === 'sponge') made().forEach((piece) => toss(cake.remove(piece)))
    // The cake only holds so much.
    else if (made().length >= most) {
      playSfx('wrong')
      return wiggle(dish.view, dish.home.x, tween)
    }
    playSfx('press')
    drop(cake.add(dish.part))
  }

  // Tapping the cake takes back the last thing this step put on it.
  function undo() {
    const piece = made().at(-1)
    if (!piece) return
    playSfx('press')
    toss(cake.remove(piece))
  }

  // Not what the customer asked for is no big deal: the button wiggles, the bubble swells to
  // show the order again, and whatever does not belong flips off, leaving the part that is right.
  function sendBack() {
    playSfx('wrong')
    wiggle(button().view, button().home.x, tween)
    bubble.pulse()
    extras().forEach((piece, i) => toss(cake.remove(piece), i * 70))
  }

  // Resolves once the player has made the cake in the order, step by step, and served it.
  function rightCake() {
    setMaking(true)
    setOut(0)
    return new Promise((resolve) => {
      onAction = (action, dish) => {
        if (action === 'add') return add(dish)
        if (action === 'undo') return undo()
        if (!stepDone()) return sendBack()
        playSfx('press')
        if (step < LAST) return setOut(step + 1)
        onAction = null
        setMaking(false)
        resolve()
      }
    })
  }

  // Some things from every step, listed in the order of the plates so that like sits with like.
  // The first customer goes easy. Nobody asks for the same cake as the customer before.
  function dream() {
    for (;;) {
      const cakeWanted = {}
      for (const { name, fewest, first, most } of STEPS) {
        const count = served === 0 ? first : fewest + Math.floor(Math.random() * (most - fewest + 1))
        const parts = partsFor(name)
        const picks = Array.from({ length: count }, () => shuffled(parts)[0])
        cakeWanted[name] = picks.sort((a, b) => parts.indexOf(a) - parts.indexOf(b))
      }
      if (JSON.stringify(cakeWanted) !== JSON.stringify(wanted)) return cakeWanted
    }
  }

  // Shows the order in the bubble, shrunk to fit if it is a tall one.
  function think() {
    order.set(wanted)
    order.view.scale.set(1)
    const bounds = order.view.getLocalBounds()
    const size = Math.min(MAX_ORDER_SCALE, ORDER_BOX.width / bounds.width, ORDER_BOX.height / bounds.height)
    order.view.scale.set(size)
    order.view.position.set(-(bounds.x + bounds.width / 2) * size, -(bounds.y + bounds.height / 2) * size)
    return bubble.show()
  }

  // An empty tray and an empty counter, until the customer has said what they want.
  function restock() {
    delivering = false
    cake.clear()
    cake.view.position.set(tray.x, tray.y + 6)
    cake.view.scale.set(BUILD_SCALE)
    box.view.position.set(box.home.x, box.home.y)
    for (const { view } of [...dishes, next, box]) view.visible = false
  }

  // The cake hops into the box, and the box goes over to the customer.
  async function deliver() {
    delivering = true
    const packed = (box.picture.width * 0.5) / CAKE_WIDTH
    // Where a cake sits inside the box, measured from the box's middle.
    const nest = { x: -box.picture.width * 0.07, y: box.picture.height * 0.3 }
    const from = { x: cake.view.x, y: cake.view.y }
    const to = { x: customer.view.x, y: customer.view.y - 80 }

    await tween(420, (p) => {
      cake.view.x = from.x + (box.home.x + nest.x - from.x) * p
      cake.view.y = from.y + (box.home.y + nest.y - from.y) * p - Math.sin(p * Math.PI) * 70
      cake.view.scale.set(BUILD_SCALE + (packed - BUILD_SCALE) * p)
    })
    await tween(520, (p) => {
      const size = 1 - 0.35 * p
      const x = box.home.x + (to.x - box.home.x) * p
      const y = box.home.y + (to.y - box.home.y) * p - Math.sin(p * Math.PI) * 70
      box.view.position.set(x, y)
      box.view.scale.set(size)
      cake.view.position.set(x + nest.x * size, y + nest.y * size)
      cake.view.scale.set(packed * size)
    })
    await tween(
      180,
      (p) => {
        box.view.scale.set(0.65 * (1 - p))
        cake.view.scale.set(packed * 0.65 * (1 - p))
      },
      ease.in,
    )
  }

  async function playRound() {
    customer.next()
    wanted = dream()
    restock()

    // Customers cross the screen from right to left.
    await customer.walk(width + OFFSTAGE, stand.x)
    standing = true
    await think()
    await rightCake()
    for (const { view } of dishes) view.visible = false
    await deliver()
    served += 1
    onServed()
    await Promise.all([bubble.hide(), customer.celebrate()])
    await wait(500)
    standing = false
    await customer.walk(customer.view.x, -OFFSTAGE)
    await wait(300)
  }

  // Once a step is as the customer wants it, its button bounces to say "tap me".
  let time = 0
  app.ticker.add(() => {
    time += app.ticker.deltaMS / 1000
    next.picture.y = box.picture.y = 0
    if (onAction && stepDone()) button().picture.y = -Math.abs(Math.sin(time * 5)) * 7
  })

  fitToScreen(app, world, SAFE_WIDTH, SAFE_HEIGHT, arrange)
  setMaking(false)
  restock()

  let started = false

  async function start() {
    if (started) return
    started = true
    for (;;) await playRound()
  }

  return { start }
}
