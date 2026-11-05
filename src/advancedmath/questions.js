// The questions, pitched at a Taiwanese third grader. Each maker returns a fresh question with a
// `key` that is the same for two identical questions, so the game can avoid repeating one.

export const TIMES = '×'
export const PLUS = '+'
export const MINUS = '−'

// How often a subtraction starts from a number with zeros inside it (like 5003 or 7040), the
// kind that makes you borrow across a zero.
const ZERO_CHANCE = 0.25
// How often the two fractions are the same, so "=" comes up as well.
const EQUAL_CHANCE = 0.15
// Of the rest, how often the fractions share a denominator; the others are unit fractions.
const SAME_DENOMINATOR_CHANCE = 0.55
const MAX_DENOMINATOR = 12

const between = (low, high) => low + Math.floor(Math.random() * (high - low + 1))
const pick = (list) => list[Math.floor(Math.random() * list.length)]

// 二位數乘一位數, like 36 × 7. Round tens (like 40 × 3) are left out as too easy.
// `columns` is how many digit columns the written-out sum needs, and so how long an answer
// can be typed.
export function multiplication() {
  let top = between(11, 99)
  while (top % 10 === 0) top = between(11, 99)
  const bottom = between(2, 9)
  return { key: `${top}${TIMES}${bottom}`, top, bottom, sign: TIMES, answer: top * bottom, columns: 3 }
}

// 四位數加法 that stays under 10000.
function addition() {
  const top = between(1000, 8999)
  const bottom = between(1000, 9999 - top)
  return { key: `${top}${PLUS}${bottom}`, top, bottom, sign: PLUS, answer: top + bottom, columns: 4 }
}

function minuend() {
  if (Math.random() >= ZERO_CHANCE) return between(2000, 9999)
  const thousands = between(2, 9) * 1000
  return pick([
    thousands,
    thousands + between(1, 9),
    thousands + between(1, 9) * 10,
    thousands + between(1, 9) * 10 + between(1, 9),
  ])
}

// 四位數減法 whose answer is never below zero.
function subtraction() {
  const top = minuend()
  const bottom = between(1000, top - 1)
  return { key: `${top}${MINUS}${bottom}`, top, bottom, sign: MINUS, answer: top - bottom, columns: 4 }
}

export const addOrSubtract = () => (Math.random() < 0.5 ? addition() : subtraction())

// Two different numbers from low to high.
function twoDifferent(low, high) {
  const a = between(low, high)
  let b = between(low, high)
  while (b === a) b = between(low, high)
  return [a, b]
}

// 分數比大小 the third-grade way: fractions with the same denominator, or unit fractions (one
// over something). `answer` is the sign that goes between them: '>', '<' or '='.
export function compareFractions() {
  let left
  let right
  const roll = Math.random()
  if (roll < EQUAL_CHANCE) {
    const d = between(2, MAX_DENOMINATOR)
    left = { n: between(1, d - 1), d }
    right = { ...left }
  } else if (roll < EQUAL_CHANCE + (1 - EQUAL_CHANCE) * SAME_DENOMINATOR_CHANCE) {
    const d = between(3, MAX_DENOMINATOR)
    const [a, b] = twoDifferent(1, d - 1)
    left = { n: a, d }
    right = { n: b, d }
  } else {
    const [a, b] = twoDifferent(2, MAX_DENOMINATOR)
    left = { n: 1, d: a }
    right = { n: 1, d: b }
  }

  // Compared without dividing, so there is no rounding to trip over.
  const difference = left.n * right.d - right.n * left.d
  const answer = difference > 0 ? '>' : difference < 0 ? '<' : '='
  return { key: `${left.n}/${left.d}?${right.n}/${right.d}`, left, right, answer }
}
