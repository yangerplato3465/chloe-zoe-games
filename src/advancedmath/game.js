import { Container, Sprite } from 'pixi.js'
import { BEAR, BUNNY, CARD, CAT, CHALK, CHALK_YELLOW, INK } from './assets.js'
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  CARD_WIDTH,
  INNER_WIDTH,
  KEY_GAP,
  PAD_HEIGHT,
  PAD_WIDTH,
  burst,
  createBoard,
  createCard,
  createClassroom,
  createColumnSum,
  createFractionPair,
  createKey,
  createKeypad,
  createMenuButton,
  label,
} from './parts.js'
import { addOrSubtract, compareFractions, multiplication } from './questions.js'
import { playSfx } from '../lib/sfx.js'
import { createTweens, ease } from '../lib/tween.js'
import { wiggle } from '../scene/dish.js'
import { fit } from '../scene/fit.js'
import { fitToScreen } from '../scene/screen.js'

// In design pixels (see scene/screen.js). The board sits above the number pad, which needs a
// tall screen; a wide one just shows more classroom either side.
const SAFE_WIDTH = 640
const SAFE_HEIGHT = 820

const TOP = 128 // room above the board for the heart counter and the 選單 button
const MARGIN = 12
const GAP = 16 // between the board and what is under it
const LOWER_HEIGHT = PAD_HEIGHT
const DESK_HEIGHT = BOARD_HEIGHT + GAP + LOWER_HEIGHT
const FLOOR_RISE = 60 // how far above the bottom of the desk the floor starts
const BUDDY_OUTSIDE = 200 // with this much room beside the board, the character stands there
const BUDDY_OUTSIDE_HEIGHT = 380
const BUDDY_BREATH = 0.015 // how much the character swells as it breathes, as a fraction
const BUDDY_HOP = 40
const CHOICE_WIDTH = 118
const CHOICE_HEIGHT = 112
const CARD_GAP = (BOARD_WIDTH - CARD_WIDTH * 3) / 2
const START_Y = BOARD_HEIGHT * 0.74 // where on the board the Start button waits
const START_ROOM = 240
const STAMP = { x: 482, y: 150 } // where praise is written on the board, in chalk coordinates
const FRACTION_STAMP = { x: INNER_WIDTH / 2, y: 30 }
const SHOW_FRACTION_BARS = 1300 // how long the fraction bars stay up after a right answer, in ms
const FADE = 200

const PRAISE = ['答對了！', '好棒！', '太厲害了！', '正確！', '好聰明！']
const CHOICES = ['>', '<', '=']

// The three kinds of question. `kind` says which part of the board and which controls they use.
const CATEGORIES = [
  { title: '乘法', subtitle: '二位數 × 一位數', colour: 0xa8d8ea, buddy: CAT, kind: 'column', make: multiplication },
  { title: '加減法', subtitle: '四位數加減', colour: 0xfde08a, buddy: BUNNY, kind: 'column', make: addOrSubtract },
  { title: '分數比大小', subtitle: '比一比 > < =', colour: 0xf8b9c5, buddy: BEAR, kind: 'fractions', make: compareFractions },
]

const pick = (list) => list[Math.floor(Math.random() * list.length)]

// Builds the advanced math game on a Pixi app: a classroom with a chalkboard. After Start the
// player picks one of three kinds of question, then answers them one after another, typing the
// answer to a sum on the number pad (or a keyboard) or picking >, < or = for two fractions.
// 選單 goes back to the choice. Nothing is ever lost: a wrong answer just shakes. The
// callbacks are the same as the shop's (see shop/game.js).
export function createAdvancedMathGame(app, textures, { onServed = () => {}, onLayout = () => {} } = {}) {
  const { tween, wait } = createTweens(app.ticker)

  const classroom = createClassroom()
  const board = createBoard()
  const title = new Container()
  const heading = label('數學小學堂', 64, CHALK)
  heading.y = 70
  const prompt = label('三年級數學練習', 30, CHALK_YELLOW)
  prompt.y = 134
  title.addChild(heading, prompt)
  title.x = INNER_WIDTH / 2
  const column = createColumnSum()
  const fractions = createFractionPair()
  const stamp = label('', 40, CHALK_YELLOW)
  stamp.rotation = -0.12
  stamp.visible = false
  const sparkles = new Container()
  board.content.addChild(title, column.view, fractions.view, stamp, sparkles)

  const keypad = createKeypad(tapKey)
  const choices = CHOICES.map((sign) => {
    const key = createKey(CHOICE_WIDTH, CHOICE_HEIGHT, CARD)
    key.face.addChild(label(sign, 64, INK))
    key.sign = sign
    key.view.on('pointerdown', () => send({ type: 'choice', sign }))
    return key
  })
  const choiceRow = new Container()
  choiceRow.addChild(...choices.map((choice) => choice.view))
  const cards = CATEGORIES.map((category) => {
    const card = createCard(category, textures[category.buddy])
    card.view.on('pointertap', () => {
      playSfx('press')
      send({ type: 'category', category })
    })
    return card
  })
  const cardRow = new Container()
  cardRow.addChild(...cards.map((card) => card.view))
  const menuButton = createMenuButton()
  menuButton.view.on('pointertap', () => {
    playSfx('press')
    send({ type: 'menu' })
  })

  // The character is a sprite inside a container: the sprite is sized to fit its space, and the
  // container breathes and hops.
  const buddySprite = new Sprite()
  buddySprite.anchor.set(0.5, 1)
  const buddy = new Container()
  buddy.addChild(buddySprite)
  const buddyHome = { x: 0, y: 0, width: 0, height: 0 }

  const world = new Container()
  world.addChild(classroom.view, buddy, board.view, keypad.view, choiceRow, cardRow, menuButton.view)
  app.stage.addChild(world)

  // Which things are on screen for each part of the game.
  const SCREENS = {
    menu: [title, cardRow],
    column: [column.view, keypad.view, buddy, menuButton.view],
    fractions: [fractions.view, choiceRow, buddy, menuButton.view],
  }
  const everything = [...new Set(Object.values(SCREENS).flat())]

  function arrange(screen) {
    const { width, height } = screen
    const room = height - TOP - MARGIN
    const top = TOP + Math.max(0, (room - DESK_HEIGHT) / 2)
    const left = (width - BOARD_WIDTH) / 2
    const lowerTop = top + BOARD_HEIGHT + GAP
    const lowerMiddle = lowerTop + LOWER_HEIGHT / 2
    const bottom = lowerTop + LOWER_HEIGHT
    classroom.layout(width, height, bottom - FLOOR_RISE)
    board.view.position.set(left, top)

    // On a wide screen the character stands beside the board and the controls sit in the
    // middle under it. Otherwise the controls move right to make room for it under the board.
    const outside = left >= BUDDY_OUTSIDE
    const controlsLeft = outside ? (width - PAD_WIDTH) / 2 : left + BOARD_WIDTH - PAD_WIDTH
    keypad.view.position.set(controlsLeft, lowerTop)
    choices.forEach((choice, i) => {
      choice.home.x = controlsLeft + CHOICE_WIDTH / 2 + i * (PAD_WIDTH - CHOICE_WIDTH) / 2
      choice.home.y = lowerMiddle
      choice.view.position.set(choice.home.x, choice.home.y)
    })
    cards.forEach((card, i) => card.view.position.set(left + CARD_WIDTH / 2 + i * (CARD_WIDTH + CARD_GAP), lowerMiddle))

    if (outside) {
      Object.assign(buddyHome, { x: left / 2, y: bottom, width: left - 40, height: BUDDY_OUTSIDE_HEIGHT })
    } else {
      const space = controlsLeft - KEY_GAP - left
      Object.assign(buddyHome, { x: left + space / 2, y: bottom, width: space - 8, height: LOWER_HEIGHT - 16 })
    }
    placeBuddy()
    menuButton.view.position.set(width / 2, TOP / 2)

    onLayout({
      scale: screen.scale,
      hudTop: 0,
      stage: { x: width / 2, y: top + START_Y, width: START_ROOM },
    })
  }

  function placeBuddy() {
    buddy.position.set(buddyHome.x, buddyHome.y)
    if (buddySprite.texture.width > 1) fit(buddySprite, buddyHome.width, buddyHome.height)
  }

  // The character breathes all the time it is on screen.
  let clock = 0
  app.ticker.add(() => {
    clock += app.ticker.deltaMS
    buddy.scale.y = 1 + Math.sin(clock / 600) * BUDDY_BREATH
  })

  // Fades from whatever is showing to the named screen. Changes queue up rather than overlap,
  // and callers need not wait: the game listens for taps while the fade runs, and a quick tap
  // must not be lost to it.
  let screenChange = Promise.resolve()
  function showScreen(name) {
    screenChange = screenChange.then(() => fadeTo(name))
    return screenChange
  }

  async function fadeTo(name) {
    const wanted = SCREENS[name]
    const leaving = everything.filter((thing) => thing.visible && !wanted.includes(thing))
    const coming = wanted.filter((thing) => !thing.visible)
    await tween(FADE, (p) => leaving.forEach((thing) => (thing.alpha = 1 - p)), ease.linear)
    leaving.forEach((thing) => (thing.visible = false))
    coming.forEach((thing) => {
      thing.visible = true
      thing.alpha = 0
    })
    await tween(FADE, (p) => coming.forEach((thing) => (thing.alpha = p)), ease.linear)
  }

  // Events: { type: 'digit', digit }, 'back', 'enter', { type: 'choice', sign }, 'menu' and
  // { type: 'category', category }. The game takes one at a time with nextEvent(); anything that
  // arrives while it is busy animating is dropped, except 選單, which is remembered.
  let waiting = null
  let wantMenu = false

  function send(event) {
    if (event.type === 'menu') wantMenu = true
    const resolve = waiting
    waiting = null
    resolve?.(event)
  }

  const nextEvent = () => new Promise((resolve) => (waiting = resolve))

  // Typing clicks, but only when the game is listening. 確定 and the signs make their sound
  // once it is known whether they were right.
  function tapKey(event) {
    if (waiting && (event.type === 'digit' || event.type === 'back')) playSfx('press')
    send(event)
  }

  // A keyboard works too, for anyone playing on a computer.
  const KEYS = { Backspace: { type: 'back' }, Enter: { type: 'enter' } }
  function onKeyDown(event) {
    if (event.ctrlKey || event.metaKey || event.altKey) return
    let message = KEYS[event.key]
    if (/^[0-9]$/.test(event.key)) message = { type: 'digit', digit: event.key }
    if (CHOICES.includes(event.key)) message = { type: 'choice', sign: event.key }
    if (!message) return
    // Without this, Enter would also press whichever page button has focus.
    event.preventDefault()
    tapKey(message)
  }
  window.addEventListener('keydown', onKeyDown)
  // The window outlives the game, so the listener goes when PixiGame destroys the scene.
  world.once('destroyed', () => window.removeEventListener('keydown', onKeyDown))

  // Praise on the board, a puff of stars, a hop from the character and a heart.
  async function celebrate(at) {
    playSfx('press')
    stamp.text = pick(PRAISE)
    stamp.position.set(at.x, at.y)
    stamp.visible = true
    onServed()
    await Promise.all([
      tween(320, (p) => stamp.scale.set(p), ease.backOut),
      burst(sparkles, at.x, at.y, tween),
      tween(560, (p) => (buddy.y = buddyHome.y - Math.sin(p * Math.PI) * BUDDY_HOP), ease.linear),
    ])
    await wait(600)
  }

  async function hideStamp(body) {
    await tween(FADE, (p) => (stamp.alpha = body.alpha = 1 - p), ease.linear)
    stamp.visible = false
    stamp.alpha = 1
  }

  // A sum, answered by typing into the field and pressing 確定.
  async function columnRound(question) {
    let typed = ''
    column.show(question)
    tween(FADE, (p) => (column.body.alpha = p), ease.linear)

    for (;;) {
      const event = await nextEvent()
      if (event.type === 'menu') return
      if (event.type === 'digit' && typed.length < question.columns) {
        typed = (typed === '0' ? '' : typed) + event.digit
        column.setTyped(typed)
      } else if (event.type === 'back') {
        typed = typed.slice(0, -1)
        column.setTyped(typed)
      } else if (event.type === 'enter' && typed === '') {
        await wiggle(column.field, 0, tween)
      } else if (event.type === 'enter' && Number(typed) !== question.answer) {
        // A wrong answer shows red and shakes, then clears for another go.
        playSfx('wrong')
        column.setTyped(typed, 'wrong')
        await wiggle(column.field, 0, tween)
        await wait(250)
        typed = ''
        column.setTyped(typed)
      } else if (event.type === 'enter') {
        break
      }
    }

    column.setTyped(typed, 'right')
    await celebrate(STAMP)
    await hideStamp(column.body)
  }

  // Two fractions, answered by tapping >, < or =. A wrong sign shakes and fades so it is not
  // picked again.
  async function fractionRound(question) {
    fractions.show(question)
    for (const choice of choices) {
      choice.wrong = false
      choice.view.alpha = 1
      choice.view.eventMode = 'static'
    }
    tween(FADE, (p) => (fractions.body.alpha = p), ease.linear)

    for (;;) {
      const event = await nextEvent()
      if (event.type === 'menu') return
      if (event.type !== 'choice') continue
      const choice = choices.find((c) => c.sign === event.sign)
      if (choice.wrong) continue
      if (event.sign === question.answer) break
      playSfx('wrong')
      choice.wrong = true
      choice.view.eventMode = 'none'
      wiggle(choice.view, choice.home.x, tween)
      tween(400, (p) => (choice.view.alpha = 1 - 0.6 * p), ease.linear)
    }

    const bars = fractions.reveal()
    bars.alpha = 0
    tween(400, (p) => (bars.alpha = p), ease.linear)
    await celebrate(FRACTION_STAMP)
    await wait(SHOW_FRACTION_BARS)
    await hideStamp(fractions.body)
  }

  async function chooseCategory() {
    prompt.text = '選一個題目吧！'
    const shown = showScreen('menu')
    for (;;) {
      const event = await nextEvent()
      if (event.type !== 'category') continue
      await shown
      return event.category
    }
  }

  // Questions of one kind, never the same one twice in a row, until 選單.
  async function playCategory(category) {
    wantMenu = false
    buddySprite.texture = textures[category.buddy]
    placeBuddy()
    column.body.alpha = 0
    fractions.body.alpha = 0
    showScreen(category.kind)
    let last = ''
    while (!wantMenu) {
      let question = category.make()
      while (question.key === last) question = category.make()
      last = question.key
      if (category.kind === 'column') await columnRound(question)
      else await fractionRound(question)
    }
  }

  // Before Start the board shows the title over the menu, with nothing to tap yet.
  for (const thing of everything) thing.visible = SCREENS.menu.includes(thing)
  fitToScreen(app, world, SAFE_WIDTH, SAFE_HEIGHT, arrange)

  let started = false

  async function start() {
    if (started) return
    started = true
    for (;;) await playCategory(await chooseCategory())
  }

  return { start }
}
