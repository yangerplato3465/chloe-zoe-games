// The math game's art, as "<atlas>/<frame name>" references (see lib/atlases.js). Everything
// this game shows comes from the math atlas, including the Start button and the heart counter.
import mathBgm from '../../Assets/mathbgm.mp3'

const math = (n) => `math/math-${n}.png`

// The atlases the Pixi scene draws from.
export const MATH_ATLASES = ['math']

// This game has a tune of its own.
export const MATH_BGM = mathBgm

export const MATH_CHARACTERS = [0, 1, 2, 3, 4].map(math)
export const HEART = math(18)

// The jewel boxes the answers are written on.
export const BOXES = [math(7), math(5), math(6)]

// What PixiGame draws over the canvas (see its skin prop). The banner art is 171 x 76; the
// inset is where its pink plate is.
export const MATH_SKIN = {
  startButton: math(15),
  startWidth: 170,
  tally: { frame: math(13), heart: HEART, height: 96, inset: '14% 13% 22% 29%' },
}

// Both numbers in a question are between these, so the answers run from 0 (as in 4 - 4) to
// 20 (10 + 10).
export const MIN_NUMBER = 1
export const MAX_NUMBER = 10
export const MAX_ANSWER = MAX_NUMBER * 2

export const PLUS = '+'
export const MINUS = '−'

// The thought bubble the question is written in, a little wider than the shop's (see
// scene/bubble.js for the shape). `y` is where it starts, just above the customer's head.
export const BUBBLE = {
  y: -196,
  centre: { x: 88, y: -112 },
  dots: [
    [0, 0, 8],
    [16, -28, 13],
  ],
  puffs: [
    [-66, -4, 46],
    [0, -30, 54],
    [66, -4, 46],
    [-36, 28, 44],
    [36, 28, 44],
    [0, 0, 56],
  ],
}
