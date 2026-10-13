import { Circle, Container, Graphics, Sprite, Text } from 'pixi.js'
import { BOXES, BUBBLE, HEART, MATH_CHARACTERS, MAX_ANSWER, MAX_NUMBER, MIN_NUMBER, MINUS, PLUS } from './assets.js'
import { playSfx } from '../lib/sfx.js'
import { createTweens, ease } from '../lib/tween.js'
import { createBubble } from '../scene/bubble.js'
import { createCustomer } from '../scene/customer.js'
import { wiggle } from '../scene/dish.js'
import { fit } from '../scene/fit.js'
import { createScenery } from '../scene/scenery.js'
import { fitToScreen } from '../scene/screen.js'

// In design pixels (see scene/screen.js).
const SAFE_WIDTH = 600
const SAFE_HEIGHT = 800

const AWNING = [0xf2b8dc, 0xfff6ea]
const ANSWERS = Array.from({ length: MAX_ANSWER + 1 }, (_, value) => value)
const MAX_ROWS = 3
const MIN_SLOT = 78 // the answers take as few rows as they can while each is at least this wide
const MAX_SLOT = 104
const ROW_PITCH = 0.9 // a row's height as a fraction of a slot: the boxes are wider than tall
const QUESTION_SIZE = 54 // the question's font size...
const QUESTION_WIDTH = 196 // ...unless it has to shrink to fit this much of the bubble
const STAGE_HEIGHT = 96 // about the middle of a standing customer
const START_ROOM = 300
const INK = 0x5a3f33
const NUMBER_OUTLINE = 0xb0457c

const between = (low, high) => low + Math.floor(Math.random() * (high - low + 1))

// A question whose numbers are both small and whose answer is never below zero.
function makeQuestion() {
  const a = between(MIN_NUMBER, MAX_NUMBER)
  const b = between(MIN_NUMBER, MAX_NUMBER)
  if (Math.random() < 0.5) return { text: `${a} ${PLUS} ${b}`, answer: a + b }
  const [big, small] = a >= b ? [a, b] : [b, a]
  return { text: `${big} ${MINUS} ${small}`, answer: big - small }
}

// A jewel box with a number on its lid, to tap as an answer. `home` is where it belongs.
function createAnswer(value, texture) {
  const shadow = new Graphics()
  const box = new Sprite(texture)
  box.anchor.set(0.5)
  const label = new Text({
    text: String(value),
    style: {
      fontFamily: 'Fredoka Variable',
      fontWeight: '600',
      fontSize: 40,
      fill: 0xffffff,
      stroke: { color: NUMBER_OUTLINE, width: 7, join: 'round' },
    },
    resolution: 3,
  })
  label.anchor.set(0.5)

  const view = new Container()
  view.addChild(shadow, box, label)
  view.cursor = 'pointer'
  view.on('pointerover', () => view.scale.set(1.06))
  view.on('pointerout', () => view.scale.set(1))

  // slot is the width the box has to itself.
  function resize(slot) {
    fit(box, slot - 8, slot * ROW_PITCH - 8)
    shadow.clear()
    shadow.ellipse(0, slot * 0.34, slot * 0.3, slot * 0.07).fill({ color: 0x7a4f2e, alpha: 0.2 })
    label.style.fontSize = slot * 0.42
    label.y = -slot * 0.05 // the lid is the upper part of the picture
    view.hitArea = new Circle(0, 0, slot / 2)
  }

  return { view, value, home: { x: 0, y: 0 }, resize }
}

// Builds the math game on a Pixi app. The scene sits empty until start() is called. Then
// characters keep walking in, each thinking of a sum or a take-away, and the player taps the
// box with the answer, with all the time in the world, until the app is destroyed. The
// callbacks are the same as the shop's (see shop/game.js).
export function createMathGame(app, textures, { onServed = () => {}, onLayout = () => {} } = {}) {
  const tweens = createTweens(app.ticker)
  const { tween, wait } = tweens
  const scenery = createScenery({ awning: AWNING })
  const customer = createCustomer(textures, app.ticker, tweens, { characters: MATH_CHARACTERS, heart: HEART })
  const bubble = createBubble(BUBBLE, app.ticker, tweens)
  bubble.view.y = BUBBLE.y
  const question = new Text({
    text: '',
    style: { fontFamily: 'Fredoka Variable', fontWeight: '600', fontSize: QUESTION_SIZE, fill: INK },
    resolution: 3,
  })
  question.anchor.set(0.5)
  bubble.content.addChild(question)
  const answers = ANSWERS.map((value) => createAnswer(value, textures[BOXES[value % BOXES.length]]))

  // Customers stand behind the counter; the answers sit on top of it.
  const customerLayer = new Container()
  customerLayer.addChild(customer.view, bubble.view)
  const answerLayer = new Container()
  answerLayer.addChild(...answers.map((answer) => answer.view))
  const world = new Container()
  world.addChild(scenery.back, customerLayer, scenery.counter, answerLayer, scenery.awning)
  app.stage.addChild(world)

  let width = SAFE_WIDTH
  let current = { text: '', answer: -1 }
  let onAnswer = null // set while the player is choosing
  for (const answer of answers) answer.view.on('pointertap', () => onAnswer?.(answer))

  function arrange(screen) {
    width = screen.width
    const middle = width / 2
    const room = width - 24
    let rows = 1
    while (rows < MAX_ROWS && room / Math.ceil(answers.length / rows) < MIN_SLOT) rows++
    const columns = Math.ceil(answers.length / rows)
    const slot = Math.min(MAX_SLOT, room / columns)
    const rowHeight = slot * ROW_PITCH
    const counterDepth = rows * rowHeight + 46
    const counterTop = screen.height - counterDepth
    scenery.layout(width, screen.height, counterDepth)
    customerLayer.position.set(middle, counterTop - 8)

    // Each row of answers is centred, so a shorter last row sits in the middle.
    answers.forEach((answer, i) => {
      const row = Math.floor(i / columns)
      const inRow = Math.min(columns, answers.length - row * columns)
      answer.home.x = middle + ((i % columns) - (inRow - 1) / 2) * slot
      answer.home.y = counterTop + 30 + rowHeight / 2 + row * rowHeight
      answer.view.position.set(answer.home.x, answer.home.y)
      answer.resize(slot)
    })

    onLayout({
      scale: screen.scale,
      hudTop: scenery.awningBottom,
      stage: { x: middle, y: customerLayer.y - STAGE_HEIGHT, width: Math.min(START_ROOM, width) },
    })
  }

  function setAnswering(answering) {
    for (const answer of answers) {
      answer.view.eventMode = answering ? 'static' : 'none'
      answer.view.scale.set(1)
      if (answering) answer.view.alpha = 1
    }
  }

  // Writes in the bubble, smaller if it would not fit otherwise.
  function write(text) {
    question.text = text
    question.scale.set(1)
    question.scale.set(Math.min(1, QUESTION_WIDTH / question.width))
  }

  // A wrong answer is no big deal: its box wiggles and fades, so it is not picked again, and the
  // bubble swells to say "look again".
  function nope(answer) {
    playSfx('wrong')
    answer.view.eventMode = 'none'
    answer.view.scale.set(1)
    wiggle(answer.view, answer.home.x, tween)
    tween(400, (p) => (answer.view.alpha = 1 - 0.6 * p), ease.linear)
    bubble.pulse()
  }

  // Resolves with the box once the player taps the right answer.
  function rightAnswer() {
    setAnswering(true)
    return new Promise((resolve) => {
      onAnswer = (answer) => {
        if (answer.value !== current.answer) return nope(answer)
        playSfx('press')
        onAnswer = null
        setAnswering(false)
        resolve(answer)
      }
    })
  }

  // The right box swells while the bubble spells out the whole sum.
  function reveal(answer) {
    write(`${current.text} = ${current.answer}`)
    return Promise.all([
      bubble.pulse(),
      tween(520, (p) => answer.view.scale.set(1 + Math.sin(p * Math.PI) * 0.22), ease.linear),
    ])
  }

  async function playRound() {
    const offstage = width / 2 + 120
    customer.next()
    // Never the same question twice in a row.
    let next = makeQuestion()
    while (next.text === current.text) next = makeQuestion()
    current = next
    write(current.text)

    // Customers cross the screen from right to left.
    await customer.walk(offstage, 0)
    await bubble.show()
    const answer = await rightAnswer()
    await reveal(answer)
    onServed()
    await wait(450)
    await Promise.all([bubble.hide(), customer.celebrate()])
    await wait(500)
    await customer.walk(0, -offstage)
    await wait(300)
  }

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
