import { Container, Graphics } from 'pixi.js'
import { ease } from '../lib/tween.js'

const OUTLINE = 0x9c7b6a

// A thought bubble. Its origin is its smallest dot, so it grows out of the customer's head.
// The shape is given as circles, [x, y, radius]: `dots` lead from the origin to the cloud, and
// `puffs` make up the cloud, measured from its `centre`. Whatever the customer is thinking of
// goes in `content`, which sits at that centre.
export function createBubble({ centre, dots, puffs }, ticker, { tween }) {
  const shapes = [...dots, ...puffs.map(([x, y, radius]) => [x + centre.x, y + centre.y, radius])]
  const cloud = new Graphics()
  for (const [x, y, radius] of shapes) cloud.circle(x, y, radius + 4)
  cloud.fill(OUTLINE)
  for (const [x, y, radius] of shapes) cloud.circle(x, y, radius)
  cloud.fill(0xffffff)

  const content = new Container()
  content.position.set(centre.x, centre.y)

  // `view` is for the game to place; `body` inside it does the popping and floating.
  const body = new Container()
  body.addChild(cloud, content)
  body.scale.set(0)
  const view = new Container()
  view.addChild(body)

  const show = () => tween(380, (p) => body.scale.set(p), ease.backOut)
  const hide = () => tween(200, (p) => body.scale.set(1 - p), ease.in)
  // A quick swell, to draw the eye back to what the customer wants.
  const pulse = () => tween(420, (p) => body.scale.set(1 + Math.sin(p * Math.PI) * 0.1), ease.linear)

  let time = 0
  ticker.add(() => {
    time += ticker.deltaMS / 1000
    body.y = Math.sin(time * 2) * 4
  })

  return { view, content, show, hide, pulse }
}
