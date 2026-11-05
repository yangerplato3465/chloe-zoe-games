// The advanced math game's art, as "<atlas>/<frame name>" references (see lib/atlases.js).
// For now this is only the three characters; the classroom is drawn in code until the game has
// art of its own. The atlas was packed by hand from Assets/advencedmath/ch1-3.png, trimmed and
// scaled to 640 px tall (the originals are 2363 px square, too big to keep as three textures on
// a tablet). Repack it with TexturePacker once more art arrives, and update the frames here.
const frame = (name) => `advancedmath/${name}`

// The atlases the Pixi scene draws from.
export const ADVANCED_MATH_ATLASES = ['advancedmath']

export const BEAR = frame('ch1.png')
export const CAT = frame('ch2.png')
export const BUNNY = frame('ch3.png')

// Canvas text needs a Chinese font after Fredoka, which only has Latin letters and digits.
// Digits and signs come out in Fredoka like the rest of the site; the Chinese falls through to
// the first of these the device has.
export const FONT = ['Fredoka Variable', 'PingFang TC', 'Noto Sans TC', 'Microsoft JhengHei', 'sans-serif']

export const INK = 0x5a3f33
export const INK_SOFT = 0x7d5f50
export const LINE = 0x9c7b6a
export const CARD = 0xfffaf3
export const CHALK = 0xfdfbf2
export const CHALK_YELLOW = 0xfde08a
