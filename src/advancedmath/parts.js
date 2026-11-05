import { Container, Graphics, Rectangle, Sprite, Text } from 'pixi.js'
import { CARD, CHALK, CHALK_YELLOW, FONT, INK, INK_SOFT, LINE } from './assets.js'
import { fit } from '../scene/fit.js'

// The pieces the advanced math game is built from. All sizes are in design pixels.

// The classroom.
const WALL = 0xfdf1d8
const WALL_SYMBOL = 0xe9c98f
const BASEBOARD = 0xc99a6a
const FLOOR = 0xe2b98a
const FLOOR_SEAM = 0xd3a877
const BASEBOARD_HEIGHT = 12
const PLANK_PITCH = 34 // the gap between the floor's seams
const SWAG = 320 // how wide one loop of bunting is...
const SWAG_SAG = 20 // ...and how far it droops
const FLAG_PITCH = 46
const FLAG_SIZE = 30
const FLAGS = [0xf8b9c5, 0xa8d8ea, 0xfde08a, 0xb5dc9c]
// Faint maths signs on the wall: [sign, x as a fraction of the width, y as a fraction of the wall's
// height, size, tilt in radians].
const SYMBOLS = [
  ['+', 0.07, 0.3, 64, -0.2],
  ['×', 0.92, 0.22, 70, 0.25],
  ['÷', 0.12, 0.72, 58, 0.15],
  ['=', 0.88, 0.64, 60, -0.1],
  ['−', 0.5, 0.11, 56, 0],
  ['<', 0.05, 0.5, 50, 0.1],
  ['>', 0.95, 0.44, 50, -0.15],
]

// The chalkboard. The chalk area is everything inside the wooden frame.
export const BOARD_WIDTH = 608
export const BOARD_HEIGHT = 330
const BOARD_FRAME = 14
export const INNER_WIDTH = BOARD_WIDTH - BOARD_FRAME * 2
export const INNER_HEIGHT = BOARD_HEIGHT - BOARD_FRAME * 2
const BOARD_GREEN = 0x3f6b55
const BOARD_WOOD = 0xb07a4a
const BOARD_WOOD_DARK = 0x8a5a33
const TRAY_DEPTH = 12
// Faint smudges of old chalk: [x, y, width, height] as fractions of the chalk area.
const SMUDGES = [
  [0.2, 0.3, 0.3, 0.12],
  [0.7, 0.7, 0.35, 0.1],
  [0.55, 0.2, 0.2, 0.08],
]

// Buttons have a solid lip under them that they press down into, like the site's cards.
const KEY_LIP = 6
const KEY_RADIUS = 18

// The written-out (直式) sum, placed in the chalk area.
export const DIGIT_WIDTH = 60
const COLUMN_CENTRE = 230 // where the middle of the sum sits across the chalk area
const ROW_1 = 62
const ROW_2 = 134
const RULE_Y = 176
const FIELD_Y = 232 // the middle of the answer field
const FIELD_HEIGHT = 82
const FIELD_PAD = 12 // room in the field either side of the digits
const DIGIT_SIZE = 64
const TYPED_SIZE = 58
const MAX_TYPED = 4
const FIELD_LOOK = {
  typing: { fill: 0xfffdf6, edge: CHALK_YELLOW, ink: INK },
  wrong: { fill: 0xfdeceb, edge: 0xe46a6a, ink: 0xd04f4f },
  right: { fill: 0xe8f7e4, edge: 0x6cc07a, ink: 0x2f7a43 },
}

// The two fractions, placed in the chalk area.
const FRACTION_Y = 128
const FRACTION_X = [140, INNER_WIDTH - 140]
const FRACTION_SIZE = 64
const FRACTION_GAP = 44 // from the fraction bar to the middle of each number
const RING_RADIUS = 46
const BAR_Y = 236 // the top of the picture of each fraction...
const BAR_WIDTH = 210
const BAR_HEIGHT = 36

// Text in the game's font, centred on its position.
export function label(text, size, fill, style = {}) {
  const t = new Text({
    text,
    style: { fontFamily: FONT, fontWeight: '600', fontSize: size, fill, ...style },
    resolution: 3,
  })
  t.anchor.set(0.5)
  return t
}

// The wall, bunting and floor behind everything.
export function createClassroom() {
  const view = new Container()
  const paint = new Graphics()
  const symbols = SYMBOLS.map(([sign, , , size, tilt]) => {
    const t = label(sign, size, WALL_SYMBOL)
    t.rotation = tilt
    t.alpha = 0.55
    return t
  })
  view.addChild(paint, ...symbols)

  // floorTop is where the wall meets the floor.
  function layout(width, height, floorTop) {
    paint.clear()
    paint.rect(0, 0, width, floorTop).fill(WALL)

    // Each loop of bunting droops between two pins, and its flags hang from the string.
    const sag = (x) => 8 + SWAG_SAG * Math.sin((Math.PI * (x % SWAG)) / SWAG)
    for (let x = 0; x <= width; x += 8) {
      if (x === 0) paint.moveTo(x, sag(x))
      else paint.lineTo(x, sag(x))
    }
    paint.stroke({ color: LINE, width: 2 })
    for (let i = 0, x = FLAG_PITCH / 2; x < width; i++, x += FLAG_PITCH) {
      const y = sag(x)
      paint.poly([x - FLAG_SIZE / 2, y, x + FLAG_SIZE / 2, y, x, y + FLAG_SIZE]).fill(FLAGS[i % FLAGS.length])
    }

    paint.rect(0, floorTop, width, height - floorTop).fill(FLOOR)
    for (let y = floorTop + BASEBOARD_HEIGHT + PLANK_PITCH; y < height; y += PLANK_PITCH) {
      paint.rect(0, y, width, 2).fill(FLOOR_SEAM)
    }
    paint.rect(0, floorTop, width, BASEBOARD_HEIGHT).fill(BASEBOARD)

    symbols.forEach((t, i) => {
      const [, x, y] = SYMBOLS[i]
      t.position.set(x * width, 40 + y * (floorTop - 40))
    })
  }

  return { view, layout }
}

// The chalkboard. Things written on it go in `content`, whose origin is the top-left corner of
// the chalk.
export function createBoard() {
  const frame = new Graphics()
  frame.roundRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT, 16).fill(BOARD_WOOD)
  frame.roundRect(BOARD_FRAME, BOARD_FRAME, INNER_WIDTH, INNER_HEIGHT, 6).fill(BOARD_GREEN)
  for (const [x, y, w, h] of SMUDGES) {
    frame.ellipse(BOARD_FRAME + x * INNER_WIDTH, BOARD_FRAME + y * INNER_HEIGHT, (w * INNER_WIDTH) / 2, (h * INNER_HEIGHT) / 2)
    frame.fill({ color: CHALK, alpha: 0.05 })
  }
  // The chalk tray along the bottom, with a stick of chalk and an eraser on it.
  frame.roundRect(-10, BOARD_HEIGHT - 6, BOARD_WIDTH + 20, TRAY_DEPTH, 5).fill(BOARD_WOOD_DARK)
  frame.roundRect(BOARD_WIDTH - 150, BOARD_HEIGHT - 13, 44, 9, 4).fill(CHALK)
  frame.roundRect(BOARD_WIDTH - 90, BOARD_HEIGHT - 20, 58, 16, 4).fill(0x6f8fb3)
  frame.roundRect(BOARD_WIDTH - 90, BOARD_HEIGHT - 20, 58, 7, 3).fill(0xf6e7c8)

  const content = new Container()
  content.position.set(BOARD_FRAME, BOARD_FRAME)
  const view = new Container()
  view.addChild(frame, content)
  return { view, content }
}

// A chunky button. Put what it shows in `face`; `home` is where it belongs, for whoever lays it
// out (and for wiggle).
export function createKey(width, height, colour) {
  const lip = new Graphics().roundRect(-width / 2, -height / 2 + KEY_LIP, width, height, KEY_RADIUS).fill(LINE)
  const plate = new Graphics()
    .roundRect(-width / 2, -height / 2, width, height, KEY_RADIUS)
    .fill(colour)
    .stroke({ color: LINE, width: 3 })
  const face = new Container()
  face.addChild(plate)

  const view = new Container()
  view.addChild(lip, face)
  view.eventMode = 'static'
  view.cursor = 'pointer'
  view.hitArea = new Rectangle(-width / 2, -height / 2, width, height + KEY_LIP)
  const up = () => (face.y = 0)
  view.on('pointerdown', () => (face.y = KEY_LIP - 1))
  view.on('pointerup', up)
  view.on('pointerupoutside', up)
  view.on('pointerleave', up)

  return { view, face, home: { x: 0, y: 0 } }
}

// The number pad: 0 to 9, a rub-out key and 確定. Calls onKey({ type: 'digit', digit }),
// onKey({ type: 'back' }) or onKey({ type: 'enter' }) as soon as a key goes down. Its origin is
// its top-left corner.
export const KEY_WIDTH = 120
export const KEY_HEIGHT = 74
export const KEY_GAP = 10
export const PAD_WIDTH = KEY_WIDTH * 3 + KEY_GAP * 2
export const PAD_HEIGHT = (KEY_HEIGHT + KEY_GAP) * 4 - KEY_GAP + KEY_LIP

export function createKeypad(onKey) {
  const view = new Container()
  const rows = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['back', '0', 'enter'],
  ]
  rows.forEach((row, r) =>
    row.forEach((name, c) => {
      const colour = name === 'back' ? 0xf8b9c5 : name === 'enter' ? 0xb5e3a8 : CARD
      const key = createKey(KEY_WIDTH, KEY_HEIGHT, colour)
      if (name === 'back') key.face.addChild(backIcon())
      else if (name === 'enter') key.face.addChild(label('確定', 32, INK))
      else key.face.addChild(label(name, 44, INK))
      key.view.position.set(KEY_WIDTH / 2 + c * (KEY_WIDTH + KEY_GAP), KEY_HEIGHT / 2 + r * (KEY_HEIGHT + KEY_GAP))
      const event = name === 'back' || name === 'enter' ? { type: name } : { type: 'digit', digit: name }
      key.view.on('pointerdown', () => onKey(event))
      view.addChild(key.view)
    }),
  )
  return { view }
}

// A rub-out key's arrow with a cross in it, drawn because not every font has ⌫.
function backIcon() {
  const icon = new Graphics()
  icon.poly([-26, 0, -12, -17, 24, -17, 24, 17, -12, 17]).stroke({ color: INK, width: 4, join: 'round' })
  icon.moveTo(-2, -8).lineTo(14, 8).moveTo(14, -8).lineTo(-2, 8).stroke({ color: INK, width: 4, cap: 'round' })
  return icon
}

// Writes a number's digits right-aligned in columns, ending at `right`, using the given texts.
function placeDigits(texts, text, right, y) {
  texts.forEach((t, i) => {
    const digit = text[text.length - 1 - i]
    t.visible = digit !== undefined
    if (!t.visible) return
    t.text = digit
    t.position.set(right - (i + 0.5) * DIGIT_WIDTH, y)
  })
}

// A sum written out in columns (直式), with an answer field under the line that shows what has
// been typed. Fade `body` between questions; wiggle `field` for a wrong answer.
export function createColumnSum() {
  const top = Array.from({ length: MAX_TYPED }, () => label('', DIGIT_SIZE, CHALK))
  const bottom = Array.from({ length: MAX_TYPED }, () => label('', DIGIT_SIZE, CHALK))
  const sign = label('', DIGIT_SIZE, CHALK)
  const rule = new Graphics()
  const box = new Graphics()
  const hint = label('?', 52, 0xd9cdb8)
  const typed = Array.from({ length: MAX_TYPED }, () => label('', TYPED_SIZE, INK))
  const field = new Container()
  field.addChild(box, hint, ...typed)

  const body = new Container()
  body.addChild(...top, ...bottom, sign, rule, field)
  const view = new Container()
  view.addChild(body)

  let right = 0
  let columns = 0

  function show(question) {
    columns = question.columns
    const gridWidth = (columns + 1) * DIGIT_WIDTH // one more column on the left for the sign
    right = COLUMN_CENTRE + gridWidth / 2
    placeDigits(top, String(question.top), right, ROW_1)
    placeDigits(bottom, String(question.bottom), right, ROW_2)
    sign.text = question.sign
    sign.position.set(right - gridWidth + DIGIT_WIDTH / 2, ROW_2)
    rule.clear()
    rule.moveTo(right - gridWidth, RULE_Y).lineTo(right + 8, RULE_Y).stroke({ color: CHALK, width: 5, cap: 'round' })
    hint.position.set(right - (columns * DIGIT_WIDTH) / 2, FIELD_Y)
    setTyped('')
  }

  // look is 'typing', 'wrong' or 'right'.
  function setTyped(text, look = 'typing') {
    const { fill, edge, ink } = FIELD_LOOK[look]
    placeDigits(typed, text, right, FIELD_Y)
    for (const t of typed) t.style.fill = ink
    hint.visible = text === ''
    const width = columns * DIGIT_WIDTH + FIELD_PAD * 2
    box.clear()
    box.roundRect(right + FIELD_PAD - width, FIELD_Y - FIELD_HEIGHT / 2, width, FIELD_HEIGHT, 18)
    box.fill(fill).stroke({ color: edge, width: 5 })
  }

  return { view, body, field, show, setTyped }
}

// One fraction, numerator over denominator, centred on its bar.
function createFraction() {
  const top = label('', FRACTION_SIZE, CHALK)
  const bottom = label('', FRACTION_SIZE, CHALK)
  top.y = -FRACTION_GAP
  bottom.y = FRACTION_GAP
  const bar = new Graphics()
  const view = new Container()
  view.addChild(bar, top, bottom)

  function set({ n, d }) {
    top.text = String(n)
    bottom.text = String(d)
    const width = Math.max(top.width, bottom.width) + 24
    bar.clear().roundRect(-width / 2, -3, width, 6, 3).fill(CHALK)
  }

  return { view, set }
}

// A bar cut into d equal parts with n of them coloured in.
function drawFractionBar(g, { n, d }, centreX) {
  const part = BAR_WIDTH / d
  const left = centreX - BAR_WIDTH / 2
  for (let i = 0; i < d; i++) {
    g.rect(left + i * part, BAR_Y, part, BAR_HEIGHT)
    g.fill(i < n ? { color: CHALK_YELLOW } : { color: CHALK, alpha: 0.06 })
    g.stroke({ color: CHALK, width: 3 })
  }
}

// Two fractions with a ring between them for the sign. reveal() writes the sign in the ring and
// draws each fraction as a bar, so the answer can be seen as well as worked out.
export function createFractionPair() {
  const left = createFraction()
  const right = createFraction()
  left.view.position.set(FRACTION_X[0], FRACTION_Y)
  right.view.position.set(FRACTION_X[1], FRACTION_Y)
  const ring = new Graphics()
  ring.circle(0, 0, RING_RADIUS).fill({ color: CHALK, alpha: 0.08 }).stroke({ color: CHALK, width: 4 })
  ring.position.set(INNER_WIDTH / 2, FRACTION_Y)
  const sign = label('?', 56, CHALK)
  sign.position.copyFrom(ring.position)
  const bars = new Graphics()

  const body = new Container()
  body.addChild(left.view, right.view, ring, sign, bars)
  const view = new Container()
  view.addChild(body)

  let current = null

  function show(question) {
    current = question
    left.set(question.left)
    right.set(question.right)
    sign.text = '?'
    sign.style.fill = CHALK
    bars.clear()
  }

  function reveal() {
    sign.text = current.answer
    sign.style.fill = CHALK_YELLOW
    bars.clear()
    drawFractionBar(bars, current.left, FRACTION_X[0])
    drawFractionBar(bars, current.right, FRACTION_X[1])
    return bars
  }

  return { view, body, show, reveal }
}

// A big card on the menu: the character on a coloured panel, with the category's name under it.
export const CARD_WIDTH = 188
export const CARD_HEIGHT = 312
const CARD_PANEL_HEIGHT = 186

export function createCard({ title, subtitle, colour }, texture) {
  const key = createKey(CARD_WIDTH, CARD_HEIGHT, CARD)
  const top = -CARD_HEIGHT / 2
  const panel = new Graphics().roundRect(-CARD_WIDTH / 2 + 10, top + 10, CARD_WIDTH - 20, CARD_PANEL_HEIGHT, 12).fill(colour)
  const buddy = new Sprite(texture)
  buddy.anchor.set(0.5, 1)
  fit(buddy, CARD_WIDTH - 40, CARD_PANEL_HEIGHT - 18)
  buddy.y = top + 10 + CARD_PANEL_HEIGHT - 4
  const name = label(title, 32, INK)
  name.y = top + CARD_PANEL_HEIGHT + 48
  const note = label(subtitle, 21, INK_SOFT, { fontWeight: '500' })
  note.y = top + CARD_PANEL_HEIGHT + 90
  key.face.addChild(panel, buddy, name, note)
  return key
}

// A pill with a back arrow and 選單 on it.
export function createMenuButton() {
  const key = createKey(144, 54, CARD)
  const arrow = new Graphics().poly([-46, 0, -32, -11, -32, 11]).fill(INK)
  const text = label('選單', 26, INK)
  text.x = 10
  key.face.addChild(arrow, text)
  return key
}

// A few stars that fly out from a point and fade, for a right answer.
export function burst(parent, x, y, tween) {
  const stars = Array.from({ length: 8 }, (_, i) => {
    const star = new Graphics().star(0, 0, 5, 12, 6).fill(i % 2 ? CHALK_YELLOW : 0xf8b9c5)
    star.position.set(x, y)
    parent.addChild(star)
    return { star, angle: (i / 8) * Math.PI * 2 + 0.3 }
  })
  return tween(700, (p) => {
    for (const { star, angle } of stars) {
      star.position.set(x + Math.cos(angle) * 110 * p, y + Math.sin(angle) * 80 * p)
      star.rotation = p * 2
      star.alpha = 1 - p * p
    }
  }).then(() => stars.forEach(({ star }) => star.destroy()))
}
