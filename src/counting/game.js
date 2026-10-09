import { Container, Graphics, Sprite, Text } from 'pixi.js'
import { MAX_COUNT, MIN_COUNT, THINGS } from './assets.js'
import { CHARACTERS } from '../lib/atlases.js'
import { shuffled } from '../lib/random.js'
import { playSfx } from '../lib/sfx.js'
import { createTweens, ease } from '../lib/tween.js'
import { createDish, wiggle } from '../scene/dish.js'
import { createScenery } from '../scene/scenery.js'
import { fitToScreen } from '../scene/screen.js'

// In design pixels (see scene/screen.js).
const SAFE_WIDTH = 600
const SAFE_HEIGHT = 800

const AWNING = [0xd6c4f2, 0xfff6ea]
const ANSWERS = Array.from({ length: MAX_COUNT - MIN_COUNT + 1 }, (_, i) => MIN_COUNT + i)
const MAX_SLOT = 110
const ONE_ROW_SLOT = 84 // the answers sit in a single row if each can be at least this wide
const WIDE = 900 // from this width up, the spectators are bigger and stand further out
const MAX_BOARD_WIDTH = 860
const BOARD_PADDING = 18
const MIN_CELLS = 16 // the board is split into at least this many cells, one thing to a cell
const THING_FILL = 0.62 // how much of its cell a thing takes up...
const MAX_THING_SIZE = 86 // ...up to this size
const START_WIDTH = 308
// The heart counter is drawn over the top-left corner of the scene (see HeartTally.vue);
// nothing to count goes underneath it.
const HUD = { width: 178, height: 138 }
const INK = 0x5a3f33
const OUTLINE = 0x9c7b6a

function createSpectator(texture) {
  const spectator = new Sprite(texture)
  spectator.anchor.set(0.5, 1)
  return spectator
}

function createAnswer(value) {
  const answer = Object.assign(createDish(), { value })
  answer.label = new Text({
    text: String(value),
    style: { fontFamily: 'Fredoka Variable', fontWeight: '600', fontSize: 40, fill: INK },
    resolution: 3,
  })
  answer.label.anchor.set(0.5)
  answer.view.addChild(answer.label)
  return answer
}

const overlap = (a, b) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height

// Builds the counting game on a Pixi app. The scene sits empty until start() is called. Then a
// random number of stars, coins or diamonds is scattered on the board, and the player taps how
// many there are, over and over until the app is destroyed. The callbacks are the same as the
// shop's (see shop/game.js); here `stage` is the middle of the board.
export function createCountingGame(app, textures, { onServed = () => {}, onLayout = () => {} } = {}) {
  const { tween, wait } = createTweens(app.ticker)
  const scenery = createScenery({ awning: AWNING })
  const board = new Graphics()
  const answers = ANSWERS.map(createAnswer)
  const things = Array.from({ length: MAX_COUNT }, () => {
    const sprite = new Sprite()
    sprite.anchor.set(0.5)
    sprite.visible = false
    return { sprite, size: 1 }
  })
  // Two of the characters watch from behind the board, one on each side.
  const spectators = shuffled(CHARACTERS)
    .slice(0, 2)
    .map((frame) => createSpectator(textures[frame]))

  const thingLayer = new Container()
  thingLayer.addChild(...things.map((thing) => thing.sprite))
  const answerLayer = new Container()
  answerLayer.addChild(...answers.map((answer) => answer.view))
  const world = new Container()
  world.addChild(scenery.back, ...spectators, board, thingLayer, scenery.counter, answerLayer, scenery.awning)
  app.stage.addChild(world)

  let grid = { columns: 1, rows: 1, cells: [], area: { x: 0, y: 0, width: 0, height: 0 } }
  let count = 0 // how many things are on the board
  let spectatorScale = 1
  let ground = 0 // where the spectators stand
  let hop = 0 // how high off it they are, when they jump for a right answer
  let onAnswer = null // set while the player is choosing
  for (const answer of answers) answer.view.on('pointertap', () => onAnswer?.(answer))

  // Splits the board into roughly square cells, leaving out any the heart counter covers, with
  // enough left for the biggest number.
  function divide(area, blocked) {
    for (let target = MIN_CELLS; ; target++) {
      const columns = Math.max(1, Math.round(Math.sqrt((target * area.width) / area.height)))
      const rows = Math.ceil(target / columns)
      const size = { width: area.width / columns, height: area.height / rows }
      const cells = []
      for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
          const cell = { x: area.x + column * size.width, y: area.y + row * size.height, ...size }
          if (!overlap(cell, blocked)) cells.push(cell)
        }
      }
      if (cells.length >= MAX_COUNT) return { columns, rows, cells, area }
    }
  }

  // Scatters the things on the board: each gets a cell of its own and sits somewhere inside it,
  // a little tilted, so they look strewn about but never overlap.
  function scatter() {
    const cells = shuffled(grid.cells)
    things.slice(0, count).forEach((thing, i) => {
      const cell = cells[i]
      const size = Math.min(MAX_THING_SIZE, Math.min(cell.width, cell.height) * THING_FILL)
      const drift = () => (Math.random() * 2 - 1) * 0.8
      thing.size = size / Math.max(thing.sprite.texture.width, thing.sprite.texture.height)
      thing.sprite.position.set(
        cell.x + cell.width / 2 + (drift() * (cell.width - size)) / 2,
        cell.y + cell.height / 2 + (drift() * (cell.height - size)) / 2,
      )
      thing.sprite.rotation = (Math.random() * 2 - 1) * 0.3
      thing.sprite.scale.set(thing.size)
    })
  }

  function arrange(screen) {
    const { width, height } = screen
    const middle = width / 2
    const rows = (width - 24) / answers.length >= ONE_ROW_SLOT ? 1 : 2
    const columns = Math.ceil(answers.length / rows)
    const slot = Math.min(MAX_SLOT, (width - 24) / columns)
    const counterDepth = rows * slot + 34
    const counterTop = height - counterDepth
    scenery.layout(width, height, counterDepth)

    // Each row of answers is centred, so a shorter last row sits in the middle.
    answers.forEach((answer, i) => {
      const row = Math.floor(i / columns)
      const inRow = Math.min(columns, answers.length - row * columns)
      answer.home.x = middle + ((i % columns) - (inRow - 1) / 2) * slot
      answer.home.y = counterTop + 28 + slot / 2 + row * slot
      answer.view.position.set(answer.home.x, answer.home.y)
      answer.resize(slot / 2 - 7)
      answer.label.style.fontSize = slot * 0.44
    })

    const wide = width >= WIDE
    const top = scenery.awningBottom + 18
    const boardWidth = Math.min(width - (wide ? 300 : 192), MAX_BOARD_WIDTH)
    // The board stands on the far edge of the counter.
    const frame = { x: middle - boardWidth / 2, y: top, width: boardWidth, height: counterTop - 6 - top }
    board.clear()
    board.roundRect(frame.x + 4, frame.y + 10, frame.width, frame.height, 30).fill({ color: 0x7a4f2e, alpha: 0.16 })
    board.roundRect(frame.x, frame.y, frame.width, frame.height, 30).fill(0xfffaf3).stroke({ color: OUTLINE, width: 5 })

    // The spectators stand behind the counter, half hidden by the board's edges.
    spectatorScale = wide ? 2 : 1.6
    ground = counterTop - 8
    const peek = wide ? 40 : 20
    spectators[0].x = frame.x - peek
    spectators[1].x = frame.x + frame.width + peek

    const area = {
      x: frame.x + BOARD_PADDING,
      y: frame.y + BOARD_PADDING,
      width: frame.width - BOARD_PADDING * 2,
      height: frame.height - BOARD_PADDING * 2,
    }
    grid = divide(area, { x: 0, y: scenery.awningBottom, ...HUD })
    // A different screen shape means different cells, so the things are strewn afresh.
    scatter()

    onLayout({
      scale: screen.scale,
      hudTop: scenery.awningBottom,
      stage: { x: middle, y: frame.y + frame.height / 2, width: Math.min(START_WIDTH, frame.width - 40) },
    })
  }

  function setAnswering(answering) {
    for (const answer of answers) {
      answer.view.eventMode = answering ? 'static' : 'none'
      answer.view.scale.set(1)
      if (answering) answer.label.alpha = 1
    }
  }

  // Puts a new number of one kind of thing on the board; they pop in one after another.
  function deal() {
    const kind = shuffled(Object.values(THINGS))[0]
    count = shuffled(ANSWERS.filter((value) => value !== count))[0]
    things.forEach((thing, i) => {
      thing.sprite.texture = textures[kind]
      thing.sprite.visible = i < count
    })
    scatter()
    return Promise.all(
      things.slice(0, count).map(async (thing, i) => {
        thing.sprite.scale.set(0)
        await wait(i * 45)
        await tween(280, (p) => thing.sprite.scale.set(thing.size * p), ease.backOut)
      }),
    )
  }

  // A wrong number is no big deal: its plate wiggles and the number fades, so it is not picked again.
  function nope(answer) {
    playSfx('wrong')
    answer.view.eventMode = 'none'
    answer.view.scale.set(1)
    wiggle(answer.view, answer.home.x, tween)
    tween(400, (p) => (answer.label.alpha = 1 - 0.65 * p), ease.linear)
  }

  // Resolves with the plate once the player taps the right number.
  function rightAnswer() {
    setAnswering(true)
    return new Promise((resolve) => {
      onAnswer = (answer) => {
        if (answer.value !== count) return nope(answer)
        playSfx('press')
        onAnswer = null
        setAnswering(false)
        resolve(answer)
      }
    })
  }

  // The right plate swells, the things jump for joy and the spectators hop.
  function celebrate(answer) {
    const shown = things.slice(0, count)
    return Promise.all([
      tween(520, (p) => answer.view.scale.set(1 + Math.sin(p * Math.PI) * 0.22), ease.linear),
      tween(
        520,
        (p) => {
          for (const { sprite, size } of shown) sprite.scale.set(size * (1 + Math.sin(p * Math.PI) * 0.25))
        },
        ease.linear,
      ),
      tween(640, (p) => (hop = Math.abs(Math.sin(p * Math.PI * 2)) * 26), ease.linear),
    ])
  }

  function clear() {
    const shown = things.slice(0, count)
    return tween(
      240,
      (p) => {
        for (const { sprite, size } of shown) sprite.scale.set(size * (1 - p))
      },
      ease.in,
    )
  }

  async function playRound() {
    await deal()
    const answer = await rightAnswer()
    onServed()
    await celebrate(answer)
    await wait(350)
    await clear()
    await wait(200)
  }

  // Gentle idle motion: the spectators breathe, each in their own time.
  let time = 0
  app.ticker.add(() => {
    time += app.ticker.deltaMS / 1000
    spectators.forEach((spectator, i) => {
      spectator.scale.set(spectatorScale, spectatorScale * (1 + Math.sin(time * 3 + i * 1.7) * 0.02))
      spectator.y = ground - hop
    })
  })

  fitToScreen(app, world, SAFE_WIDTH, SAFE_HEIGHT, arrange)
  setAnswering(false)

  let started = false

  async function start() {
    if (started) return
    started = true
    for (;;) await playRound()
  }

  return { start }
}
