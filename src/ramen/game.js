import { Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js'
import { RAMEN } from './assets.js'
import { createTweens, ease } from '../lib/tween.js'
import { createBubble } from '../scene/bubble.js'
import { createCustomer } from '../scene/customer.js'
import { createDish } from '../scene/dish.js'
import { fit } from '../scene/fit.js'
import { createGuide } from '../scene/guide.js'
import { createScenery } from '../scene/scenery.js'
import { fitToScreen } from '../scene/screen.js'

// In design pixels (see scene/screen.js).
const SAFE_WIDTH = 600
const SAFE_HEIGHT = 800

const AWNING = [0xa8dccf, 0xfff6ea]
const COUNTER_DEPTH = 380
const STATION_BASE = 258 // the work station stands this far below the counter's far edge...
const PLATE_ROW = 318 // ...and the row of plates is centred this far below it
const MAX_SLOT = 104
const CUSTOMER_OFFSET = 150 // the customer stands this far left of the middle
const OFFSTAGE = 110
const START_WIDTH = 308
const OUTLINE = 0x8b7265

const CHOPS = 3 // cuts it takes to chop something up
const CHOP_GAP = 5 // how far a cut opens
const COOK_MS = 3000 // how long the pot takes to cook what is in it
const PUFF_EVERY = 200 // milliseconds between puffs of steam while it does

// How big things are drawn at the work station, and where things go in them. Positions are
// measured from the middle of the station's bottom edge.
const ITEM_SCALE = 1.05 // the whole vegetable and corn on the board
const ITEM_BASE = -34
const STOVE_SCALE = 1.3
const POT_SCALE = 1.2
const POT_BASE = -109 // where the pot rests on the stove
const POT_MOUTH = { x: 0, y: -194 }
const FLAMES = { x: 0, y: -88 }
const BOWL_SCALE = 1.9
const BOWL_BASE = -8
const BOWL_MOUTH = { x: -1, y: -137, radiusX: 93, radiusY: 27 } // the opening, inside its rim
const FINISHED_SCALE = 1.45

// The plates along the front of the counter, left to right, and what starts on them. The
// vegetable and the corn only get to theirs once they are chopped.
const PLATES = ['veg', 'corn', 'noodles', 'pork', 'nori', 'salt']
const READY = { noodles: RAMEN.noodles, pork: RAMEN.pork, nori: RAMEN.nori, salt: RAMEN.salt }

// How each topping sits in the bowl, measured from the middle of its mouth, back to front.
const TOPPINGS = {
  nori: { frame: RAMEN.nori, x: -48, y: -56, scale: 1, rotation: -0.2 },
  noodles: { frame: RAMEN.noodles, x: 0, y: -16, scale: 1.4 },
  pork: { frame: RAMEN.pork, x: -36, y: -34, scale: 0.95 },
  corn: { frame: RAMEN.cornSlice, x: 46, y: -38, scale: 0.75 },
  veg: { frame: RAMEN.choppedVeg, x: 30, y: -2, scale: 0.8 },
}

// The thought bubble sits beside the customer's head. x and y are where its smallest dot goes,
// from the customer's feet.
const BUBBLE = {
  x: 80,
  y: -158,
  centre: { x: 118, y: -50 },
  dots: [
    [0, 0, 6],
    [20, -16, 10],
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

function createBoard() {
  const board = new Graphics()
  board.roundRect(-166, -198, 340, 196, 26).fill({ color: 0x7a4f2e, alpha: 0.18 })
  board.roundRect(-170, -206, 340, 196, 26).fill(0xf6e2c2).stroke({ color: 0xc79a6b, width: 5 })
  board.circle(-140, -180, 9).fill(0xe2bb8e)
  return board
}

// There is no knife in the art, so this one is drawn: the blade points left with its edge
// underneath, and the origin is where the blade meets the handle.
function createKnife() {
  const knife = new Graphics()
  knife.poly([0, -20, -92, -14, -118, 6, -60, 13, 0, 13]).fill(0xe9eff2).stroke({ color: OUTLINE, width: 3, join: 'round' })
  knife.moveTo(-10, -11).lineTo(-86, -7).stroke({ color: 0xffffff, width: 3, cap: 'round' })
  knife.roundRect(0, -17, 62, 27, 9).fill(0xb9835a).stroke({ color: OUTLINE, width: 3 })
  knife.circle(18, -3.5, 3).circle(42, -3.5, 3).fill(OUTLINE)
  return knife
}

function createFlames() {
  const flames = new Graphics()
  for (const [x, size] of [[-17, 0.8], [0, 1.1], [17, 0.8]]) {
    flames.ellipse(x, -10 * size, 7 * size, 12 * size).fill(0xf6a13c)
    flames.ellipse(x, -7 * size, 3.5 * size, 7 * size).fill(0xfde9a2)
  }
  return flames
}

// Something whole that can be chopped. It is drawn as strips of its picture put back together,
// so that each cut can open a gap between two of them. It stands on its view's origin.
function createChoppable(texture) {
  const { x, y, width, height } = texture.frame
  const edges = Array.from({ length: CHOPS + 2 }, (_, i) => Math.round((i * height) / (CHOPS + 1)))
  const strips = edges.slice(0, -1).map((top, i) => {
    const frame = new Rectangle(x, y + top, width, edges[i + 1] - top)
    const strip = new Sprite(new Texture({ source: texture.source, frame }))
    strip.anchor.set(0.5, 0)
    return strip
  })
  // A dashed line across it wherever a cut will go.
  const guides = edges.slice(1, -1).map((edge) => {
    const guide = new Graphics()
    for (let dash = -width / 2 + 8; dash < width / 2 - 14; dash += 16) guide.roundRect(dash, -2, 9, 4, 2)
    guide.fill({ color: 0xffffff, alpha: 0.95 }).stroke({ color: OUTLINE, width: 1.5, alpha: 0.6 })
    guide.y = edge - height
    return guide
  })

  const view = new Container()
  view.addChild(...strips, ...guides)
  view.hitArea = new Rectangle(-width / 2, -height, width, height)
  return { view, strips, guides, edges, width, height, cuts: 0 }
}

// Builds the ramen game on a Pixi app. The scene sits ready until start() is called, then
// customers keep coming until the app is destroyed. Every customer wants the same bowl, made
// the same way: chop the vegetable and the corn, cook them and then the noodles in the pot,
// and fill a bowl. The callbacks are the same as the shop's (see shop/game.js); here `stage`
// is the middle of the scene above the counter.
export function createRamenGame(app, textures, { onServed = () => {}, onLayout = () => {} } = {}) {
  const tweens = createTweens(app.ticker)
  const { tween, wait } = tweens
  const scenery = createScenery({ awning: AWNING })
  const customer = createCustomer(textures, app.ticker, tweens)
  const bubble = createBubble(BUBBLE, app.ticker, tweens)
  const dream = new Sprite(textures[RAMEN.finished])
  dream.anchor.set(0.5)
  fit(dream, 124, 104)
  bubble.content.addChild(dream)

  // The player is led through the steps one tap at a time (see scene/guide.js).
  const { tappable, tapOne } = createGuide(app.ticker, tweens)
  let time = 0

  // ---- The chopping board
  const knife = createKnife()
  const choppables = [
    { ...createChoppable(textures[RAMEN.cabbage]), x: -84, frame: RAMEN.choppedVeg, plate: 'veg' },
    { ...createChoppable(textures[RAMEN.corn]), x: 66, frame: RAMEN.cornSlice, plate: 'corn' },
  ].map((item) => {
    item.home = { x: item.x, y: ITEM_BASE }
    item.rest = ITEM_SCALE
    item.view.position.set(item.home.x, item.home.y)
    // What it turns into once it is chopped.
    item.result = new Sprite(textures[item.frame])
    item.result.anchor.set(0.5)
    item.result.position.set(item.x, ITEM_BASE - (item.height / 2) * ITEM_SCALE)
    return tappable(item)
  })
  const boardView = new Container()
  boardView.addChild(createBoard(), ...choppables.flatMap((item) => [item.view, item.result]), knife)

  // ---- The stove and the pot
  const stove = tappable({ view: new Sprite(textures[RAMEN.stove]), home: { x: 20, y: 0 }, rest: STOVE_SCALE })
  stove.view.anchor.set(0.5, 1)
  stove.view.position.set(stove.home.x, stove.home.y)
  stove.view.scale.set(stove.rest)
  const pot = new Sprite(textures[RAMEN.pot])
  pot.anchor.set(0.5, 0.98)
  pot.position.set(0, POT_BASE)
  pot.scale.set(POT_SCALE)
  const flames = createFlames()
  flames.position.set(FLAMES.x, FLAMES.y)
  const steam = new Container()
  const stoveView = new Container()
  stoveView.addChild(stove.view, pot, flames, steam)
  let lit = false
  let inPot = [] // { plate, frame } for everything cooking

  // ---- The bowl
  const bowlPicture = new Sprite(textures[RAMEN.bowl])
  bowlPicture.anchor.set(0.5, 1)
  bowlPicture.position.set(0, BOWL_BASE)
  bowlPicture.scale.set(BOWL_SCALE)
  // Toppings show above the front of the bowl's rim and are hidden below it, as if inside.
  const inside = new Graphics()
  inside.rect(BOWL_MOUTH.x - BOWL_MOUTH.radiusX, BOWL_MOUTH.y - 400, BOWL_MOUTH.radiusX * 2, 400)
  inside.ellipse(BOWL_MOUTH.x, BOWL_MOUTH.y, BOWL_MOUTH.radiusX, BOWL_MOUTH.radiusY)
  inside.fill(0xffffff)
  const filling = new Container()
  filling.mask = inside
  const toppings = {}
  for (const [key, { frame, x, y, scale, rotation = 0 }] of Object.entries(TOPPINGS)) {
    const topping = new Sprite(textures[frame])
    topping.anchor.set(0.5)
    topping.position.set(BOWL_MOUTH.x + x, BOWL_MOUTH.y + y)
    topping.scale.set(scale)
    topping.rotation = rotation
    toppings[key] = topping
    filling.addChild(topping)
  }
  const finished = new Sprite(textures[RAMEN.finished])
  finished.anchor.set(0.5, 1)
  finished.position.set(0, BOWL_BASE)
  finished.scale.set(FINISHED_SCALE)
  const bowl = tappable({ view: new Container(), home: { x: 0, y: 0 }, rest: 1 })
  bowl.view.addChild(bowlPicture, inside, filling, finished)

  // Only one of the three is out at a time.
  const station = new Container()
  station.addChild(boardView, stoveView, bowl.view)
  let out = boardView
  for (const view of [stoveView, bowl.view]) {
    view.visible = false
    view.scale.set(0)
  }

  // ---- The plates
  let foodBox = MAX_SLOT * 0.68
  const plates = Object.fromEntries(
    PLATES.map((key) => [key, tappable(Object.assign(createDish(), { key, holds: null, rest: 1 }))]),
  )
  const foodScale = (frame) => Math.min(foodBox / textures[frame].width, foodBox / textures[frame].height)
  // Where a picture sits (and how big) when it is on a plate.
  const plateSpot = (plate, frame) => ({ x: plate.home.x, y: plate.home.y, scale: foodScale(frame) })
  const stationSpot = ({ x, y }, scale) => ({ x: station.x + x, y: station.y + y, scale })

  function put(plate, frame) {
    plate.holds = frame
    plate.food.texture = textures[frame]
    plate.food.scale.set(foodScale(frame))
    plate.food.visible = true
    plate.food.alpha = 1
    plate.view.eventMode = 'static'
  }

  function take(plate) {
    const frame = plate.holds
    plate.holds = null
    plate.food.visible = false
    plate.view.eventMode = 'none'
    return frame
  }

  const customerLayer = new Container()
  customerLayer.addChild(customer.view, bubble.view)
  const plateLayer = new Container()
  plateLayer.addChild(...Object.values(plates).map((plate) => plate.view))
  const flights = new Container() // pictures on their way from one place to another
  const world = new Container()
  world.addChild(scenery.back, customerLayer, scenery.counter, station, plateLayer, flights, scenery.awning)
  app.stage.addChild(world)

  let width = SAFE_WIDTH
  let stand = { x: 0, y: 0 } // where the customer waits
  let standing = false

  function arrange(screen) {
    width = screen.width
    const middle = width / 2
    const counterTop = screen.height - COUNTER_DEPTH
    scenery.layout(width, screen.height, COUNTER_DEPTH)
    station.position.set(middle, counterTop + STATION_BASE)

    const slot = Math.min(MAX_SLOT, (width - 24) / PLATES.length)
    foodBox = slot * 0.68
    Object.values(plates).forEach((plate, i) => {
      plate.home = { x: middle + (i - (PLATES.length - 1) / 2) * slot, y: counterTop + PLATE_ROW }
      plate.view.position.set(plate.home.x, plate.home.y)
      plate.resize(slot / 2 - 7)
      if (plate.food.visible) plate.food.scale.set(foodScale(plate.holds ?? RAMEN.salt))
    })

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

  // Flies a picture across the scene in a little arc, from one place and size to another.
  function fly(frame, from, to, { lift = 80, ms = 420 } = {}) {
    const picture = new Sprite(textures[frame])
    picture.anchor.set(0.5)
    flights.addChild(picture)
    return tween(ms, (p) => {
      picture.position.set(from.x + (to.x - from.x) * p, from.y + (to.y - from.y) * p - Math.sin(p * Math.PI) * lift)
      picture.scale.set(from.scale + (to.scale - from.scale) * p)
    }).then(() => picture.destroy())
  }

  // Puts one of the board, the stove or the bowl out at the work station, in place of what was there.
  async function bringOut(view) {
    if (out === view) return
    const old = out
    out = view
    if (old.visible) await tween(160, (p) => old.scale.set(1 - p), ease.in)
    old.visible = false
    view.visible = true
    await tween(260, (p) => view.scale.set(p), ease.backOut)
  }

  // Everything back where a new bowl of ramen starts from.
  function setUp() {
    for (const item of choppables) {
      item.cuts = 0
      item.strips.forEach((strip, i) => (strip.y = item.edges[i] - item.height))
      for (const guide of item.guides) guide.visible = true
      item.view.visible = true
      item.view.alpha = 1
      item.view.scale.set(ITEM_SCALE)
      item.result.visible = false
    }
    // The knife waits upright along the board's right edge.
    knife.visible = true
    knife.position.set(152, -92)
    knife.rotation = Math.PI / 2

    for (const plate of Object.values(plates)) take(plate)
    for (const [key, frame] of Object.entries(READY)) put(plates[key], frame)

    lit = false
    flames.visible = false
    inPot = []
    for (const topping of Object.values(toppings)) topping.visible = false
    bowlPicture.visible = true
    finished.visible = false
  }

  // ---- 1. Chopping

  // One cut: the knife comes down on the next dashed line and the strips above it shift up.
  async function chop(item) {
    const cut = item.cuts
    item.cuts += 1
    item.guides[cut].visible = false
    const line = {
      x: item.x + (item.width / 2) * ITEM_SCALE + 14,
      y: ITEM_BASE + (item.edges[cut + 1] - item.height) * ITEM_SCALE - 11,
    }
    knife.visible = true
    knife.x = line.x
    await tween(110, (p) => {
      knife.y = line.y - 40 * (1 - p)
      knife.rotation = 0.3 * (1 - p)
    }, ease.in)
    const from = item.strips.map((strip) => strip.y)
    await tween(140, (p) => {
      item.strips.forEach((strip, i) => {
        if (i <= cut) strip.y = from[i] - CHOP_GAP * p
      })
    }, ease.out)
    await tween(120, (p) => {
      knife.y = line.y - 26 * p
      knife.rotation = 0.2 * p
    }, ease.out)
    if (item.cuts === CHOPS) await chopped(item)
  }

  // Fully chopped: the strips become the chopped picture, which goes to its plate.
  async function chopped(item) {
    knife.visible = false
    item.result.visible = true
    await Promise.all([
      tween(200, (p) => {
        item.view.alpha = 1 - p
        item.view.scale.set(ITEM_SCALE * (1 - 0.3 * p))
      }, ease.in),
      tween(300, (p) => item.result.scale.set(p), ease.backOut),
    ])
    item.view.visible = false
    await wait(150)
    item.result.visible = false
    const plate = plates[item.plate]
    await fly(item.frame, stationSpot(item.result, 1), plateSpot(plate, item.frame))
    put(plate, item.frame)
  }

  // ---- 2 and 3. Cooking

  function puff() {
    const cloud = new Graphics().circle(0, 0, 12).fill({ color: 0xffffff, alpha: 0.85 })
    const from = { x: POT_MOUTH.x + (Math.random() * 2 - 1) * 34, y: POT_MOUTH.y - 6 }
    cloud.position.set(from.x, from.y)
    steam.addChild(cloud)
    tween(760, (p) => {
      cloud.y = from.y - 56 * p
      cloud.alpha = 1 - p
      cloud.scale.set(0.6 + p)
    }, ease.out).then(() => cloud.destroy())
  }

  async function intoPot(plate) {
    const frame = take(plate)
    inPot.push({ plate, frame })
    await fly(frame, plateSpot(plate, frame), stationSpot(POT_MOUTH, 0.4), { lift: 120 })
    tween(220, (p) => (pot.y = POT_BASE + Math.sin(p * Math.PI) * 5), ease.linear)
  }

  async function outOfPot({ plate, frame }) {
    await fly(frame, stationSpot(POT_MOUTH, 0.4), plateSpot(plate, frame), { lift: 60 })
    put(plate, frame)
  }

  function light() {
    lit = true
    flames.visible = true
    return tween(240, (p) => flames.scale.set(p), ease.backOut)
  }

  // The pot cooks by itself: it rocks gently and steams until the time is up.
  function simmer() {
    let puffs = 0
    return tween(
      COOK_MS,
      (p) => {
        pot.rotation = Math.sin(p * Math.PI * 6) * 0.04
        for (; puffs < (p * COOK_MS) / PUFF_EVERY; puffs++) puff()
      },
      ease.linear,
    )
  }

  // Whatever is on these plates goes into the pot (in any order), the stove is lit if it is
  // not already, it cooks for a few seconds with nothing to do, and it comes back out to its plates.
  async function cook(keys) {
    let left = keys.map((key) => plates[key])
    while (left.length) {
      const plate = await tapOne(left)
      left = left.filter((other) => other !== plate)
      await intoPot(plate)
    }
    if (!lit) {
      await tapOne([stove])
      await light()
    }
    await simmer()
    await Promise.all(inPot.splice(0).map((cooked, i) => wait(i * 140).then(() => outOfPot(cooked))))
  }

  // ---- 4. The bowl

  // The shaker goes over to the bowl, tips up and shakes a few grains in, then goes back.
  async function sprinkle(plate) {
    const frame = take(plate)
    const shaker = new Sprite(textures[frame])
    shaker.anchor.set(0.5)
    flights.addChild(shaker)
    const from = plateSpot(plate, frame)
    const over = stationSpot({ x: BOWL_MOUTH.x + 66, y: BOWL_MOUTH.y - 118 }, 1)
    const move = (a, b, tip) => (p) => {
      shaker.position.set(a.x + (b.x - a.x) * p, a.y + (b.y - a.y) * p)
      shaker.scale.set(a.scale + (b.scale - a.scale) * p)
      shaker.rotation = tip(p)
    }
    await tween(380, move(from, over, (p) => -2.3 * p))
    for (let shake = 0; shake < 3; shake++) {
      for (let i = 0; i < 3; i++) {
        const grain = new Graphics().circle(0, 0, 3).fill(0xffffff).stroke({ color: 0xcfd8dc, width: 1 })
        const start = { x: over.x - 34 + (Math.random() * 2 - 1) * 12, y: over.y + 34 }
        flights.addChild(grain)
        tween(420, (p) => {
          grain.position.set(start.x - 10 * p, start.y + 70 * p)
          grain.alpha = 1 - p * p
        }, ease.in).then(() => grain.destroy())
      }
      await tween(170, (p) => (shaker.y = over.y + Math.sin(p * Math.PI) * 12), ease.linear)
    }
    await tween(380, move(over, from, (p) => -2.3 * (1 - p)))
    shaker.destroy()
    // Back on its plate, but used up: it is shown faded and cannot be tapped again.
    plate.food.visible = true
    plate.food.alpha = 0.45
  }

  async function intoBowl(plate) {
    if (plate.key === 'salt') return sprinkle(plate)
    const frame = take(plate)
    const topping = toppings[plate.key]
    const { scale } = TOPPINGS[plate.key]
    await fly(frame, plateSpot(plate, frame), stationSpot(topping, scale), { lift: 130 })
    topping.visible = true
    await tween(200, (p) => topping.scale.set(scale * (1 + Math.sin(p * Math.PI) * 0.12)), ease.linear)
  }

  // Everything is in: the bowl becomes the finished ramen.
  async function finish() {
    await wait(200)
    for (const topping of Object.values(toppings)) topping.visible = false
    bowlPicture.visible = false
    finished.visible = true
    await tween(300, (p) => bowl.view.scale.set(0.85 + 0.15 * p), ease.backOut)
  }

  async function serve() {
    bowl.view.visible = false
    bowl.view.scale.set(0)
    const from = stationSpot({ x: 0, y: BOWL_BASE - (finished.height / 2) }, FINISHED_SCALE)
    await fly(RAMEN.finished, from, { x: customer.view.x, y: customer.view.y - 80, scale: 0.6 }, { lift: 60, ms: 520 })
  }

  async function playRound() {
    setUp()
    customer.next()
    await Promise.all([bringOut(boardView), customer.walk(width + OFFSTAGE, stand.x)])
    standing = true
    await bubble.show()

    // 1. Chop the vegetable and the corn, in either order.
    for (let uncut = choppables; uncut.length; uncut = choppables.filter((item) => item.cuts < CHOPS)) {
      await chop(await tapOne(uncut))
    }
    // 2. Cook them in the pot, 3. then the noodles.
    await bringOut(stoveView)
    await cook(['veg', 'corn'])
    await cook(['noodles'])
    await tween(200, (p) => flames.scale.set(1 - p), ease.in)
    flames.visible = false
    // 4. Fill the bowl, in any order, and serve it.
    await bringOut(bowl.view)
    for (let left = Object.values(plates); left.length; ) {
      const plate = await tapOne(left)
      left = left.filter((other) => other !== plate)
      await intoBowl(plate)
    }
    await finish()
    await tapOne([bowl])
    await serve()

    onServed()
    await Promise.all([bubble.hide(), customer.celebrate()])
    await wait(500)
    standing = false
    await customer.walk(customer.view.x, -OFFSTAGE)
    await wait(300)
  }

  // Gentle idle motion: the flames flicker.
  app.ticker.add(() => {
    time += app.ticker.deltaMS / 1000
    if (flames.visible) flames.scale.y = flames.scale.x * (1 + Math.sin(time * 9) * 0.1)
  })

  setUp()
  fitToScreen(app, world, SAFE_WIDTH, SAFE_HEIGHT, arrange)

  let started = false

  async function start() {
    if (started) return
    started = true
    for (;;) await playRound()
  }

  return { start }
}
