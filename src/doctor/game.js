import { Circle, Container, Graphics, Sprite } from 'pixi.js'
import { DOCTOR, PATIENTS } from './assets.js'
import { SICKNESSES, createSymptoms } from './symptoms.js'
import { createBruise, createStar, createTool } from './tools.js'
import { HEART } from '../lib/atlases.js'
import { shuffled } from '../lib/random.js'
import { createTweens, ease } from '../lib/tween.js'
import { createCustomer } from '../scene/customer.js'
import { createDish } from '../scene/dish.js'
import { createGuide } from '../scene/guide.js'
import { createScenery } from '../scene/scenery.js'
import { fitToScreen } from '../scene/screen.js'

// In design pixels (see scene/screen.js).
const SAFE_WIDTH = 600
const SAFE_HEIGHT = 800

const AWNING = [0xa9cdf2, 0xfff6ea]
const COUNTER_DEPTH = 190
const TRAY_ROW = 106 // the row of tools is centred this far below the counter's far edge
const MAX_SLOT = 112
const OFFSTAGE = 110
const START_WIDTH = 308
const PATIENT_SCALE = 2 // how big scene/customer.js draws the characters
const ZOOM = 1.6 // how close the view gets for putting plasters on
const MAX_BRUISES = 3
const PLASTER_SCALE = 0.25 // a plaster on a patient, in their picture's own pixels
const MAX_FIT = 1.2 // small pictures (the pills) are not blown up to fill a plate
const RING = 0x6fb0ea

// The tools on the tray, left to right, in the order they are used. `tilt` is how each lies on
// its plate, and `out` whether it is there from the start or only appears when it is needed.
const TOOLS = [
  { key: 'stethoscope', tilt: 0, out: true },
  { key: 'thermometer', tilt: 0.6, out: true },
  { key: 'plaster', tilt: -0.3, out: false },
  { key: 'syringe', tilt: 0.6, out: false },
  { key: 'medicine', tilt: 0, out: false },
]

// What the medicine can be: the bottle, which is poured, or a pill, which is swallowed.
const MEDICINES = [{ ...DOCTOR.bottle, pour: true }, ...DOCTOR.pills.map((frame) => ({ frame }))]

function createProp(texture, scale) {
  const prop = new Sprite(texture)
  prop.anchor.set(0.5, 1)
  prop.scale.set(scale)
  return prop
}

// Builds the doctor game on a Pixi app. The scene sits ready until start() is called, then
// patients keep coming until the app is destroyed. Each has a random sickness and some bruises,
// and each is treated the same way: stethoscope, thermometer, a plaster on every bruise, an
// injection, then medicine. A tool is picked by tapping it and used by tapping the patient.
// The callbacks are the same as the shop's (see shop/game.js); here `stage` is the middle of
// the scene above the counter.
export function createDoctorGame(app, textures, { onServed = () => {}, onLayout = () => {} } = {}) {
  const tweens = createTweens(app.ticker)
  const { tween, wait } = tweens
  const { tappable, tapOne } = createGuide(app.ticker, tweens)
  const scenery = createScenery({ awning: AWNING })
  const customer = createCustomer(textures, app.ticker, tweens)
  // A first-aid kit and a chart stand either side of where the patient will be.
  const kit = createProp(textures[DOCTOR.kit], 1.4)
  const chart = createProp(textures[DOCTOR.chart], 1.3)

  // Bruises, plasters and symptoms are drawn in `marks`, which follows the patient's picture
  // and works in the picture's own pixels, measured from the middle of its bottom edge.
  const spots = new Container() // the bruises and plasters
  const extras = new Container()
  const marks = new Container()
  marks.addChild(spots, extras)
  customer.view.addChildAt(marks, 1)
  const symptoms = createSymptoms(customer.body, extras, app.ticker, tweens)

  const stand = { x: 0, y: 0 } // where the patient stands
  const patient = tappable({ view: customer.view, home: stand, rest: 1 })

  const plates = Object.fromEntries(
    TOOLS.map(({ key, tilt, out }) => {
      const plate = tappable(Object.assign(createDish(), { tool: createTool(), tilt, out, rest: 1, ring: new Graphics() }))
      plate.food.visible = false
      plate.ring.visible = false
      plate.view.addChild(plate.ring, plate.tool.view)
      return [key, plate]
    }),
  )
  // What a tool is: one of the entries in DOCTOR, or just a frame.
  const dress = (plate, { frame, tip }) => plate.tool.become(textures[frame], tip)
  dress(plates.stethoscope, DOCTOR.stethoscope)
  dress(plates.thermometer, DOCTOR.thermometer)
  dress(plates.syringe, DOCTOR.syringe)
  // The plaster and the medicine are different for each patient; these are just to start with.
  dress(plates.plaster, { frame: DOCTOR.plasters[0] })
  dress(plates.medicine, MEDICINES[0])

  // The view of the patient can zoom in; the counter and the tools stay as they are.
  const camera = new Container()
  camera.addChild(scenery.back, kit, chart, customer.view)
  const tray = new Container()
  tray.addChild(...Object.values(plates).map((plate) => plate.view))
  const flights = new Container() // tools in use, and anything else in the air
  const world = new Container()
  world.addChild(camera, scenery.counter, tray, flights, scenery.awning)
  app.stage.addChild(world)

  let width = SAFE_WIDTH
  let standing = false
  let info = null // the current patient's entry in PATIENTS
  let bruises = []
  let plasters = [] // the designs still to come, one for each bruise
  let medicine = MEDICINES[0]

  // How big a tool is drawn on its plate.
  const fitted = (plate) => Math.min(MAX_FIT, (plate.radius * 1.8) / plate.tool.size)

  // Lays a tool on its plate.
  function settle(plate) {
    const { view } = plate.tool
    plate.view.addChild(view)
    view.position.set(0, 0)
    view.rotation = plate.tilt
    view.scale.set(fitted(plate))
  }

  function arrange(screen) {
    width = screen.width
    const middle = width / 2
    const counterTop = screen.height - COUNTER_DEPTH
    scenery.layout(width, screen.height, COUNTER_DEPTH)

    const slot = Math.min(MAX_SLOT, (width - 24) / TOOLS.length)
    Object.values(plates).forEach((plate, i) => {
      plate.home = { x: middle + (i - (TOOLS.length - 1) / 2) * slot, y: counterTop + TRAY_ROW }
      plate.view.position.set(plate.home.x, plate.home.y)
      plate.resize(slot / 2 - 7)
      plate.ring.clear().circle(0, 0, plate.radius + 6).stroke({ color: RING, width: 5 })
      if (plate.tool.view.parent === plate.view) settle(plate)
    })

    stand.x = middle
    stand.y = counterTop - 8
    customer.view.y = stand.y
    if (standing) customer.view.x = stand.x
    const propOffset = Math.min(Math.max(width * 0.3, 205), 340)
    kit.position.set(middle - propOffset, counterTop - 30)
    chart.position.set(middle + propOffset, counterTop - 30)
    // The view zooms in and out around the patient's feet.
    camera.pivot.set(stand.x, stand.y)
    camera.position.set(stand.x, stand.y)

    onLayout({
      scale: screen.scale,
      hudTop: scenery.awningBottom,
      stage: { x: middle, y: counterTop - 130, width: START_WIDTH },
    })
  }

  // A point on the patient's picture, given in pixels from its top-left corner, as `marks` sees it.
  function local([x, y]) {
    const { width: w, height: h } = customer.body.texture
    return { x: x - w / 2, y: y - h }
  }

  // Where something in `marks` is in the scene, zoomed in or not.
  function inScene({ x, y }) {
    const size = PATIENT_SCALE * camera.scale.x
    return { x: stand.x + x * size, y: stand.y + y * size }
  }

  const onPatient = (point) => inScene(local(point))

  // Moves something through the air in a little arc, to a place, size and tilt.
  function glide(view, to, { ms = 420, arc = 50 } = {}) {
    const from = { x: view.x, y: view.y, scale: view.scale.x, rotation: view.rotation }
    return tween(ms, (p) => {
      view.position.set(from.x + (to.x - from.x) * p, from.y + (to.y - from.y) * p - Math.sin(p * Math.PI) * arc)
      view.scale.set(from.scale + (to.scale - from.scale) * p)
      view.rotation = from.rotation + (to.rotation - from.rotation) * p
    })
  }

  // Where a tool has to be for its tip to touch a point, at a given size and tilt.
  function tipAt(tool, point, scale, rotation = 0) {
    const cos = Math.cos(rotation)
    const sin = Math.sin(rotation)
    const { x, y } = tool.tip
    return { x: point.x - (x * cos - y * sin) * scale, y: point.y - (x * sin + y * cos) * scale, scale, rotation }
  }

  // A burst of little stars.
  function sparkle(point, count = 6) {
    for (let i = 0; i < count; i++) {
      const star = createStar(6)
      const angle = ((i + Math.random()) / count) * Math.PI * 2
      const reach = 40 + Math.random() * 30
      flights.addChild(star)
      tween(
        600,
        (p) => {
          star.position.set(point.x + Math.cos(angle) * reach * p, point.y + Math.sin(angle) * reach * p)
          star.alpha = 1 - p * p
          star.scale.set(0.6 + p)
          star.rotation = p * 3
        },
        ease.out,
      ).then(() => star.destroy())
    }
  }

  // The patient gives a little start.
  const flinch = (ms = 280) =>
    tween(
      ms,
      (p) => customer.view.scale.set(1 + Math.sin(p * Math.PI) * 0.05, 1 - Math.sin(p * Math.PI) * 0.05),
      ease.linear,
    ).then(() => customer.view.scale.set(1))

  // ---- The tools

  // A tool that was not out yet pops onto its plate.
  async function bringOut(plate) {
    const { view } = plate.tool
    view.scale.set(0)
    view.visible = true
    plate.muted = false
    await tween(300, (p) => view.scale.set(fitted(plate) * p), ease.backOut)
  }

  // The player picks a tool by tapping it. A ring shows it is picked until it has been used.
  async function pick(plate) {
    await tapOne([plate])
    plate.ring.visible = true
  }

  // Takes a picked tool off its plate, so that it can move about the scene.
  function lift(plate) {
    const { view } = plate.tool
    flights.addChild(view)
    view.position.set(plate.home.x, plate.home.y)
    return plate.tool
  }

  // A tool that has been used stays on its plate, faded, and cannot be picked again.
  function done(plate) {
    plate.ring.visible = false
    plate.tool.view.alpha = 0.4
    plate.muted = true
  }

  async function putAway(plate) {
    await glide(plate.tool.view, { ...plate.home, scale: fitted(plate), rotation: plate.tilt })
    settle(plate)
    done(plate)
  }

  // Everything back where a visit starts from.
  function setUp() {
    for (const child of spots.removeChildren()) child.destroy()
    bruises = []
    for (const plate of Object.values(plates)) {
      settle(plate)
      plate.tool.view.visible = plate.out
      plate.tool.view.alpha = 1
      plate.ring.visible = false
      plate.muted = !plate.out
    }
  }

  // A new patient, with something wrong with them and a few bruises.
  function admit() {
    info = PATIENTS[customer.next()]
    symptoms.set({ sickness: shuffled(SICKNESSES)[0], dizzy: Math.random() < 0.5, mouth: info.mouth })
    const count = 1 + Math.floor(Math.random() * MAX_BRUISES)
    bruises = shuffled(info.bruises)
      .slice(0, count)
      .map((spot) => {
        const view = createBruise()
        const home = local(spot)
        view.position.set(home.x, home.y)
        view.hitArea = new Circle(0, 0, 12)
        spots.addChild(view)
        const bruise = tappable({ view, home, rest: 1 })
        view.eventMode = 'none' // not until it is time for plasters
        return bruise
      })

    // This patient's plasters and medicine.
    plasters = shuffled(DOCTOR.plasters)
    dress(plates.plaster, { frame: plasters[0] })
    medicine = shuffled(MEDICINES)[0]
    dress(plates.medicine, medicine)
    settle(plates.plaster)
    settle(plates.medicine)
  }

  // ---- The visit, step by step

  // The stethoscope goes on the patient's chest, and a heart beats beside it.
  async function listen() {
    const plate = plates.stethoscope
    await pick(plate)
    await tapOne([patient])
    const tool = lift(plate)
    const chest = onPatient(info.chest)
    // Leaning over a little keeps its tubes clear of the patient's face.
    await glide(tool.view, tipAt(tool, chest, 0.8, -0.6))
    const heart = new Sprite(textures[HEART])
    heart.anchor.set(0.5)
    heart.position.set(stand.x + customer.body.texture.width + 34, chest.y - 40)
    flights.addChild(heart)
    await tween(160, (p) => heart.scale.set(p), ease.backOut)
    for (let beat = 0; beat < 3; beat++) {
      await tween(420, (p) => heart.scale.set(1 + Math.sin(p * Math.PI) * 0.4), ease.linear)
    }
    heart.destroy()
    await putAway(plate)
  }

  // The thermometer goes in the patient's mouth for a moment.
  async function takeTemperature() {
    const plate = plates.thermometer
    await pick(plate)
    await tapOne([patient])
    const tool = lift(plate)
    const held = tipAt(tool, onPatient(info.mouth), 0.75, 1.8)
    await glide(tool.view, held)
    await wait(1000)
    // A sparkle at its far end says it is done.
    sparkle({ x: held.x * 2 - onPatient(info.mouth).x, y: held.y * 2 - onPatient(info.mouth).y }, 4)
    await wait(350)
    await putAway(plate)
  }

  const zoomTo = (to, from = camera.scale.x) => tween(520, (p) => camera.scale.set(from + (to - from) * p))

  // A plaster flies from the tray onto a bruise and stays there.
  async function stick(bruise) {
    const plate = plates.plaster
    const plaster = new Sprite(plate.tool.view.texture)
    plaster.anchor.set(0.5)
    plaster.position.set(plate.home.x, plate.home.y)
    plaster.scale.set(fitted(plate))
    plaster.rotation = plate.tilt
    flights.addChild(plaster)
    // The tray shows the next design, if there is another bruise to come.
    plasters.shift()
    dress(plate, { frame: plasters[0] })
    settle(plate)

    const tilt = (Math.random() * 2 - 1) * 0.6
    const size = PLASTER_SCALE * PATIENT_SCALE * camera.scale.x
    await glide(plaster, { ...inScene(bruise.home), scale: size, rotation: tilt }, { arc: 70 })
    // From here on it is part of the patient.
    spots.addChild(plaster)
    plaster.position.set(bruise.home.x, bruise.home.y)
    plaster.scale.set(PLASTER_SCALE)
    bruise.view.visible = false
    await tween(180, (p) => plaster.scale.set(PLASTER_SCALE * (1 + Math.sin(p * Math.PI) * 0.25)), ease.linear)
  }

  // The view zooms in on the patient, and every bruise gets a plaster.
  async function patchUp() {
    const plate = plates.plaster
    await zoomTo(ZOOM)
    await bringOut(plate)
    await pick(plate)
    patient.muted = true // a tap that just misses a bruise is not a mistake
    for (const bruise of bruises) bruise.view.eventMode = 'static'
    for (let sore = bruises; sore.length; ) {
      const bruise = await tapOne(sore)
      sore = sore.filter((other) => other !== bruise)
      await stick(bruise)
    }
    patient.muted = false
    done(plate)
    await zoomTo(1)
  }

  // The needle goes in the patient's arm from the side, and they give a little start.
  async function inject() {
    const plate = plates.syringe
    await bringOut(plate)
    await pick(plate)
    await tapOne([patient])
    const tool = lift(plate)
    const arm = onPatient(info.arm)
    // The needle is at the top of the picture, so a quarter turn points it at the patient.
    const ready = tipAt(tool, { x: arm.x + 18, y: arm.y }, 0.8, -Math.PI / 2)
    await glide(tool.view, ready)
    await Promise.all([tween(140, (p) => (tool.view.x = ready.x - 18 * p), ease.out), flinch()])
    await wait(450)
    await tween(140, (p) => (tool.view.x = ready.x - 18 * (1 - p)), ease.in)
    sparkle(arm, 4)
    await putAway(plate)
  }

  // The bottle tips up over the patient and a few drops go in their mouth.
  async function pour(plate, tool, mouth) {
    const spout = { x: mouth.x + 30, y: mouth.y - 46 }
    await glide(tool.view, tipAt(tool, spout, 0.9, -2.2))
    for (let i = 0; i < 3; i++) {
      const drop = new Graphics().circle(0, 0, 5).fill(0xf58aa2).stroke({ color: 0xd9647f, width: 1.5 })
      flights.addChild(drop)
      tween(
        320,
        (p) => {
          drop.position.set(spout.x + (mouth.x - spout.x) * p, spout.y + (mouth.y - spout.y) * p * p)
          drop.scale.set(1 - 0.5 * p)
        },
        ease.linear,
      ).then(() => drop.destroy())
      await wait(190)
    }
    await wait(260)
    await putAway(plate)
  }

  // A pill pops into the patient's mouth and is gone.
  async function swallow(plate, tool, mouth) {
    await glide(tool.view, { ...mouth, scale: 1, rotation: 0 }, { arc: 90 })
    await Promise.all([tween(220, (p) => tool.view.scale.set(1 - p), ease.in), flinch(320)])
    settle(plate)
    tool.view.visible = false
    done(plate)
  }

  async function medicate() {
    const plate = plates.medicine
    await bringOut(plate)
    await pick(plate)
    await tapOne([patient])
    const give = medicine.pour ? pour : swallow
    await give(plate, lift(plate), onPatient(info.mouth))
  }

  async function playRound() {
    setUp()
    admit()
    // Patients come in from the right.
    await customer.walk(width + OFFSTAGE, stand.x)
    standing = true

    await listen()
    await takeTemperature()
    await patchUp()
    await inject()
    await medicate()

    // All better: their colour comes back, and they say thank you with a heart.
    sparkle(inScene({ x: 0, y: -customer.body.texture.height / 2 }), 8)
    await symptoms.cure()
    onServed()
    await customer.celebrate()
    await wait(500)
    standing = false
    await customer.walk(customer.view.x, -OFFSTAGE)
    await wait(300)
  }

  // The marks stay on the patient's picture as it hops, breathes and shivers.
  app.ticker.add(() => {
    marks.position.copyFrom(customer.body.position)
    marks.scale.copyFrom(customer.body.scale)
    marks.rotation = customer.body.rotation
  })

  fitToScreen(app, world, SAFE_WIDTH, SAFE_HEIGHT, arrange)
  setUp()

  let started = false

  async function start() {
    if (started) return
    started = true
    for (;;) await playRound()
  }

  return { start }
}
