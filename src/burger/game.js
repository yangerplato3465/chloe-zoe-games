import { Circle, Container, Graphics, Sprite } from 'pixi.js'
import { BOX, FILLINGS, PARTS } from './assets.js'
import { createStack } from './stack.js'
import { shuffled } from '../lib/random.js'
import { createTweens, ease } from '../lib/tween.js'
import { createBubble } from '../scene/bubble.js'
import { createCustomer } from '../scene/customer.js'
import { createDish, wiggle } from '../scene/dish.js'
import { fit } from '../scene/fit.js'
import { createScenery } from '../scene/scenery.js'
import { fitToScreen } from '../scene/screen.js'

// In design pixels (see scene/screen.js).
const SAFE_WIDTH = 600
const SAFE_HEIGHT = 800

const AWNING = [0xf8d98a, 0xfff6ea]
const PLATES = [...FILLINGS, 'topBun'] // the box takes the slot after these
const MAX_SLOT = 136
const MAX_ICON_SCALE = 1.5
const ONE_ROW_WIDTH = 856 // from this width up, all eight slots fit in a single row
const TRAY_STRIP = 88 // the strip of counter above the plates, where the burger is built
const CUSTOMER_OFFSET = 170 // the customer stands this far left of the middle...
const TRAY_OFFSET = 205 // ...and the burger is built this far right of it
const BUILD_SCALE = 1.2
const MAX_FILLINGS = 6
const BURGER_WIDTH = 113 // roughly, at full size
const OFFSTAGE = 110
const START_WIDTH = 308

// The thought bubble is a tall one beside the customer, filling the space between the awning
// and the counter, because the order inside it is shown with its layers spread apart.
// x and y are where its smallest dot goes, from the customer's feet.
const BUBBLE = {
  x: 82,
  y: -152,
  centre: { x: 124, y: -18 },
  dots: [
    [0, 0, 5.5],
    [21, -13, 9],
  ],
  puffs: [
    [0, -110, 48],
    [-40, -82, 46],
    [40, -82, 46],
    [-44, -28, 44],
    [44, -28, 44],
    [-44, 28, 44],
    [44, 28, 44],
    [-40, 82, 46],
    [40, 82, 46],
    [0, 110, 48],
    [0, -58, 62],
    [0, 0, 64],
    [0, 58, 62],
  ],
}
const ORDER_BOX = { width: 128, height: 262 } // the room inside the bubble
const ORDER_GAP = 5 // how far apart the layers of an order float

function createTray() {
  const tray = new Graphics()
  tray.ellipse(0, 7, 90, 26).fill({ color: 0x7a4f2e, alpha: 0.2 })
  tray.ellipse(0, 0, 88, 24).fill(0xfffdf8).stroke({ color: 0xead9c6, width: 4 })
  tray.ellipse(0, -1, 62, 15).stroke({ color: 0xf3e8da, width: 3 })
  return tray
}

// The takeaway box is the "serve" button.
function createBox(texture) {
  const shadow = new Graphics()
  const picture = new Sprite(texture)
  picture.anchor.set(0.5)
  const view = new Container()
  view.addChild(shadow, picture)
  view.cursor = 'pointer'
  view.on('pointerover', () => view.scale.set(1.06))
  view.on('pointerout', () => view.scale.set(1))

  function resize(slot) {
    fit(picture, slot - 14, slot - 14)
    shadow.clear()
    shadow.ellipse(-slot * 0.05, slot * 0.36, slot * 0.34, slot * 0.08).fill({ color: 0x7a4f2e, alpha: 0.2 })
    view.hitArea = new Circle(0, 0, slot / 2)
  }

  return { view, picture, home: { x: 0, y: 0 }, resize }
}

// Builds the burger game on a Pixi app. The scene sits empty until start() is called, then
// customers keep coming until the app is destroyed. Each one thinks of a burger; the player
// stacks the same one from the plates and taps the box to serve it. The callbacks are the same
// as the shop's (see shop/game.js); here `stage` is the middle of the scene above the counter.
export function createBurgerGame(app, textures, { onServed = () => {}, onLayout = () => {} } = {}) {
  const tweens = createTweens(app.ticker)
  const { tween, wait } = tweens
  const scenery = createScenery({ awning: AWNING })
  const customer = createCustomer(textures, app.ticker, tweens)
  const bubble = createBubble(BUBBLE, app.ticker, tweens)
  const order = createStack(textures, { gap: ORDER_GAP }) // the burger the customer is thinking of
  bubble.content.addChild(order.view)

  const tray = createTray()
  const burger = createStack(textures) // the burger being built
  burger.view.cursor = 'pointer'
  const box = createBox(textures[BOX])
  const dishes = PLATES.map((part) => {
    const dish = Object.assign(createDish(), { part })
    dish.food.texture = textures[PARTS[part].icon]
    return dish
  })

  // Customers stand behind the counter; everything else is on it or in front of it.
  const customerLayer = new Container()
  customerLayer.addChild(customer.view, bubble.view)
  const counterLayer = new Container()
  counterLayer.addChild(tray, ...dishes.map((dish) => dish.view), box.view)
  const world = new Container()
  world.addChild(scenery.back, customerLayer, scenery.counter, counterLayer, burger.view, scenery.awning)
  app.stage.addChild(world)

  let width = SAFE_WIDTH
  let stand = { x: 0, y: 0 } // where the customer waits
  let wanted = [] // the fillings the customer wants, from the bottom up
  let served = 0
  let standing = false
  let delivering = false
  let onAction = null // set while the player is building

  for (const dish of dishes) dish.view.on('pointertap', () => onAction?.('add', dish))
  burger.view.on('pointertap', () => onAction?.('undo'))
  box.view.on('pointertap', () => onAction?.('serve'))

  function arrange(screen) {
    width = screen.width
    const rows = width >= ONE_ROW_WIDTH ? 1 : 2
    const columns = (dishes.length + 1) / rows
    const slot = Math.min(MAX_SLOT, (width - 24) / columns)
    const counterDepth = TRAY_STRIP + rows * slot + 12
    const counterTop = screen.height - counterDepth
    const middle = width / 2
    scenery.layout(width, screen.height, counterDepth)

    ;[...dishes, box].forEach((item, i) => {
      item.home.x = middle + ((i % columns) - (columns - 1) / 2) * slot
      item.home.y = counterTop + TRAY_STRIP + slot / 2 + Math.floor(i / columns) * slot
    })
    for (const dish of dishes) {
      dish.view.position.set(dish.home.x, dish.home.y)
      dish.resize(slot / 2 - 8)
      fit(dish.food, slot * 0.66, slot * 0.66)
      // Small pictures (the pickle) stay small rather than being blown up until they blur.
      dish.food.scale.set(Math.min(dish.food.scale.x, MAX_ICON_SCALE))
    }
    box.resize(slot)
    tray.position.set(middle + TRAY_OFFSET, counterTop + 44)
    // Mid-delivery, the box and the burger are in the air; they come home with the next customer.
    if (!delivering) {
      box.view.position.set(box.home.x, box.home.y)
      burger.view.position.set(tray.x, tray.y + 4)
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

  function setBuilding(building) {
    for (const { view } of [...dishes, box, burger]) {
      view.eventMode = building ? 'static' : 'none'
      view.scale.set(view === burger.view ? BUILD_SCALE : 1)
    }
  }

  const topPart = () => burger.parts().at(-1)
  const fillingCount = () => burger.parts().filter((part) => FILLINGS.includes(part)).length

  // A new layer falls onto the pile and settles into it.
  function drop(layer) {
    return tween(
      300,
      (p) => {
        if (layer.gone) return
        layer.view.y = layer.y - 50 * (1 - p)
        layer.view.alpha = Math.min(1, p * 4)
      },
      ease.backOut,
    )
  }

  // A layer taken off the pile flips away.
  function toss(layer, delay = 0) {
    layer.gone = true
    const { view } = layer
    const from = { x: view.x, y: view.y }
    const side = Math.random() < 0.5 ? -1 : 1
    return wait(delay)
      .then(() =>
        tween(
          340,
          (p) => {
            view.position.set(from.x + side * 46 * p, from.y - 60 * p)
            view.rotation = side * 0.5 * p
            view.alpha = 1 - p
          },
          ease.out,
        ),
      )
      .then(() => view.destroy({ children: true }))
  }

  // Nothing goes on top of the top bun, and the pile only gets so tall.
  function add(dish) {
    const full = dish.part !== 'topBun' && fillingCount() >= MAX_FILLINGS
    if (topPart() === 'topBun' || full) return wiggle(dish.view, dish.home.x, tween)
    drop(burger.push(dish.part))
  }

  // Tapping the burger takes its top layer back off (but never the bottom bun).
  function undo() {
    if (burger.parts().length > 1) toss(burger.pop())
  }

  // How many layers above the bottom bun match the order so far, and whether that is all of it.
  function check() {
    const built = burger.parts().slice(1)
    const right = [...wanted, 'topBun']
    let matching = 0
    while (matching < built.length && built[matching] === right[matching]) matching++
    return { matching, done: matching === right.length }
  }

  // Not what the customer asked for is no big deal: the box wiggles, the bubble swells to show
  // the order again, and the layers that do not belong flip off, leaving the part that is right.
  function sendBack(matching) {
    wiggle(box.view, box.home.x, tween)
    bubble.pulse()
    for (let i = 0; burger.parts().length - 1 > matching; i++) toss(burger.pop(), i * 70)
  }

  // Resolves once the player serves a burger that matches the order.
  function rightBurger() {
    setBuilding(true)
    return new Promise((resolve) => {
      onAction = (action, dish) => {
        if (action === 'add') return add(dish)
        if (action === 'undo') return undo()
        const { matching, done } = check()
        if (!done) return sendBack(matching)
        onAction = null
        setBuilding(false)
        resolve()
      }
    })
  }

  // Shows the order in the bubble, shrunk to fit if it is a tall one.
  function think() {
    order.set(['bottomBun', ...wanted, 'topBun'])
    order.view.scale.set(1)
    const bounds = order.view.getLocalBounds()
    const size = Math.min(1, ORDER_BOX.width / bounds.width, ORDER_BOX.height / bounds.height)
    order.view.scale.set(size)
    order.view.position.set(-(bounds.x + bounds.width / 2) * size, -(bounds.y + bounds.height / 2) * size)
    return bubble.show()
  }

  // A fresh bottom bun on the tray, and the box back in its slot.
  function restock() {
    delivering = false
    burger.clear()
    burger.view.position.set(tray.x, tray.y + 4)
    burger.view.scale.set(BUILD_SCALE)
    drop(burger.push('bottomBun'))
    if (box.view.scale.x < 1) {
      box.view.position.set(box.home.x, box.home.y)
      tween(300, (p) => box.view.scale.set(p), ease.backOut)
    }
  }

  // The burger hops into the box, and the box goes over to the customer.
  async function deliver() {
    delivering = true
    const packed = (box.picture.width * 0.5) / BURGER_WIDTH
    // Where a burger sits inside the box, measured from the box's middle.
    const nest = { x: -box.picture.width * 0.07, y: box.picture.height * 0.3 }
    const from = { x: burger.view.x, y: burger.view.y }
    const to = { x: customer.view.x, y: customer.view.y - 80 }

    await tween(380, (p) => {
      burger.view.x = from.x + (box.home.x + nest.x - from.x) * p
      burger.view.y = from.y + (box.home.y + nest.y - from.y) * p - Math.sin(p * Math.PI) * 70
      burger.view.scale.set(BUILD_SCALE + (packed - BUILD_SCALE) * p)
    })
    await tween(520, (p) => {
      const size = 1 - 0.35 * p
      const x = box.home.x + (to.x - box.home.x) * p
      const y = box.home.y + (to.y - box.home.y) * p - Math.sin(p * Math.PI) * 70
      box.view.position.set(x, y)
      box.view.scale.set(size)
      burger.view.position.set(x + nest.x * size, y + nest.y * size)
      burger.view.scale.set(packed * size)
    })
    await tween(
      180,
      (p) => {
        box.view.scale.set(0.65 * (1 - p))
        burger.view.scale.set(packed * 0.65 * (1 - p))
      },
      ease.in,
    )
  }

  async function playRound() {
    customer.next()
    // The first customer goes easy; after that it is two to four fillings.
    wanted = shuffled(FILLINGS).slice(0, served === 0 ? 2 : 2 + Math.floor(Math.random() * 3))
    restock()

    // Customers cross the screen from right to left.
    await customer.walk(width + OFFSTAGE, stand.x)
    standing = true
    await think()
    await rightBurger()
    await deliver()
    served += 1
    onServed()
    await Promise.all([bubble.hide(), customer.celebrate()])
    await wait(500)
    standing = false
    await customer.walk(customer.view.x, -OFFSTAGE)
    await wait(300)
  }

  // Once the top bun is on, the box bounces to say "tap me".
  let time = 0
  app.ticker.add(() => {
    time += app.ticker.deltaMS / 1000
    const closed = onAction && topPart() === 'topBun'
    box.picture.y = closed ? -Math.abs(Math.sin(time * 5)) * 7 : 0
  })

  fitToScreen(app, world, SAFE_WIDTH, SAFE_HEIGHT, arrange)
  setBuilding(false)

  let started = false

  async function start() {
    if (started) return
    started = true
    for (;;) await playRound()
  }

  return { start }
}
