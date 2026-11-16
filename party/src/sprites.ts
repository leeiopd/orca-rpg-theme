// Pixel party members drawn by code: no image files. Each frame is a GRID x GRID array of
// colors (null = transparent). The panel blits it to a canvas; tools/preview-sprites.ts
// writes the same frames to a PNG sheet.
//
// Style: chibi (big head, about 2.5 heads tall), three-tone shading lit from the front
// right, near-black outline. Heads and hair are hand-placed pixel maps; the body is drawn
// from rectangles so poses can move the arms and legs.

export type ClassId = 'mage' | 'warrior' | 'ranger' | 'cleric' | 'rogue'
const ROBED: ClassId[] = ['mage', 'cleric']
export type Motion =
  | 'idle'
  | 'walk'
  | 'cast'
  | 'read'
  | 'rune'
  | 'fly'
  | 'summon'
  | 'help'
  | 'victory'
  | 'sleep'

export const GRID = 48
export const MOTIONS: Motion[] = [
  'idle',
  'walk',
  'cast',
  'read',
  'rune',
  'fly',
  'summon',
  'help',
  'victory',
  'sleep'
]
export const FRAMES: Record<Motion, number> = {
  idle: 2,
  walk: 4,
  cast: 4,
  read: 2,
  rune: 4,
  fly: 4,
  summon: 4,
  help: 2,
  victory: 4,
  sleep: 2
}

/**
 * One letter per color so heads can be drawn as text maps.
 * h/H/l hair (mid, dark, light), c/C/k headgear, t/T/u clothes, a/A accent, m/M/n metal,
 * w/W weapon, E iris.
 */
type Key = 'h' | 'H' | 'l' | 'c' | 'C' | 'k' | 't' | 'T' | 'u' | 'a' | 'A' | 'm' | 'M' | 'n' | 'w' | 'W' | 'E'
type Palette = Record<Key, string> & { effect: string; effectCore: string }

const SKIN = '#f6d3b8'
const SKIN_SHADE = '#e0a88c'
const BLUSH = '#f29a8e'
const EYE = '#000000'
const SHINE = '#ffffff'
const BOOTS = '#5a3a32'
const BOOTS_DARK = '#3a2424'
const OUTLINE = '#000000'
const SHADOW = '#05071a'
const GOLD = '#ffcf5a'
const WHITE = '#fff8ec'
const RING = '#c8a050'
const RING_DARK = '#4a3a2a'

/** Medallion colors per class: edge, middle, highlight. */
const ORB: Record<ClassId, [string, string, string]> = {
  mage: ['#1a3a8a', '#2a62c8', '#4a9af0'],
  warrior: ['#7a1a1a', '#b83228', '#e8603a'],
  ranger: ['#0a4a5a', '#167a8a', '#3ab0b8'],
  cleric: ['#8a6a1a', '#c89a2a', '#f0d070'],
  rogue: ['#4a2a7a', '#7a4ab0', '#a878e0']
}

const FIXED: Record<string, string> = {
  s: SKIN,
  S: SKIN_SHADE,
  b: BLUSH,
  e: EYE,
  x: SHINE,
  r: BOOTS,
  R: BOOTS_DARK,
  o: OUTLINE,
  g: GOLD
}

export const PALETTES: Record<ClassId, Palette> = {
  mage: {
    h: '#d4d8ea', H: '#9a9fc0', l: '#f4f6ff',
    c: '#5a3fb8', C: '#3a2780', k: '#7d63e0',
    t: '#4b3aa6', T: '#2f2470', u: '#6a58cf',
    a: GOLD, A: '#c88a2a',
    m: '#c8ccdc', M: '#8a8fa8', n: '#f0f2fa',
    w: '#8a5a3a', W: '#5a3824', E: '#38c8e8',
    effect: '#7fe8ff', effectCore: WHITE
  },
  warrior: {
    h: '#d8783a', H: '#a04e24', l: '#f4a060',
    c: '#c8d0e4', C: '#7c86a8', k: '#f2f5ff',
    t: '#3a5cb8', T: '#26387a', u: '#5a80e0',
    a: '#d8383a', A: '#8e2028',
    m: '#c8d0e4', M: '#7c86a8', n: '#f2f5ff',
    w: '#e8eefc', W: '#9aa4c4', E: '#3a6ad8',
    effect: GOLD, effectCore: WHITE
  },
  ranger: {
    h: '#8a5430', H: '#5a3420', l: '#b87a48',
    c: '#3e8a52', C: '#245a36', k: '#62b070',
    t: '#4e7a3a', T: '#324f26', u: '#709e52',
    a: '#c8a060', A: '#8a6a3a',
    m: '#a0703a', M: '#6a4824', n: '#d8a868',
    w: '#a0703a', W: '#6a4824', E: '#3a9a5a',
    effect: '#b8f0a0', effectCore: WHITE
  },
  cleric: {
    h: '#f2d27a', H: '#c8a048', l: '#fff0b0',
    c: '#f4f0fa', C: '#b8b0d4', k: '#ffffff',
    t: '#ece8f6', T: '#aaa2cc', u: '#ffffff',
    a: GOLD, A: '#c88a2a',
    m: GOLD, M: '#c88a2a', n: '#fff0b0',
    w: GOLD, W: '#c88a2a', E: '#d8962a',
    effect: '#ffe39a', effectCore: WHITE
  },
  rogue: {
    h: '#3a2a3a', H: '#22161f', l: '#5a4458',
    c: '#3e3656', C: '#262038', k: '#5a5078',
    t: '#4a4262', T: '#2c2640', u: '#655a84',
    a: '#c8323e', A: '#801c28',
    m: '#d8e0f0', M: '#8a90a8', n: '#ffffff',
    w: '#d8e0f0', W: '#8a90a8', E: '#d83a4a',
    effect: '#b08cff', effectCore: '#e8e0ff'
  }
}

// Head maps, 22 columns, drawn over the face at the head origin. '.' leaves the face (or
// nothing) showing. The face itself spans columns 5-16 and rows 8-17.
const FRONT: Record<ClassId, string[]> = {
  mage: [
    '.................CC...',
    '...............kcC....',
    '..............kccC....',
    '.............kcccC....',
    '............kccccC....',
    '...........kcccccCC...',
    '..........kccccccCC...',
    '.........kccccgcccC...',
    '........kccccgggccCC..',
    '.......kcccccgccccCC..',
    '......kcccccccccccCC..',
    '......AggggggggggggA..',
    'kkkkkcccccccccccccccCC',
    '.CCcccccccccccccccCCC.',
    '...lhhhhhhhhhhhhhhhH..',
    '...hlhhhhhlhhhhhhhhH..',
    '...hhhhhh.hhhh..hhhH..',
    '...hhhhh...hh....hhH..',
    '...hhhh...........hH..',
    '...hhh............hH..',
    '...hHh............h...',
    '...hHh................',
    '...hHH................'
  ],
  warrior: [
    '.......aaA............',
    '......aaaA............',
    '.....aaAA.............',
    '.....aA.nnnnmm........',
    '.....nnnmmmmmmMM......',
    '....nmmmmmmmmmmmMM....',
    '...nmmmmmmmmmmmmmM....',
    '...mmmmmmmmmmmmmmMM...',
    '..nmmmmmmmmmmmmmmmM...',
    '..mMMMMMMMMMMMMMMMMM..',
    '..mMhhhlhhhhhhhhhM....',
    '..mMhhhhh.hhh..hh.....',
    '..mMMh............M...',
    '..mMM.............M...',
    '..mMM.................',
    '...MM.................',
    '......................',
    '......................'
  ],
  ranger: [
    '......................',
    '......................',
    '..........kkkk........',
    '........kkcccccC......',
    '.......kcccccccccC....',
    '......kcccccccccccC...',
    '.....kcccccccccccccC..',
    '....kcccccccccccccccC.',
    '...kcccchhhhhhhhccccC.',
    '..kcccchlhhhhhhhhhcCC.',
    '..cccchhhhhlhhhhhhhCC.',
    '..ccchhhhh.hhhh..hhC..',
    '..cccHhhh...hh....hC..',
    '..cccHh...........C...',
    '..CccH............C...',
    '..CCc.................',
    '..CC..................',
    '......................'
  ],
  cleric: [
    '......................',
    '......................',
    '........kkkkkk........',
    '......kkcccccccC......',
    '.....kcccccccccccC....',
    '....kcccccccccccccC...',
    '...kcccgggggggggccC...',
    '...ccccgggggggggccCC..',
    '..kcccchhhhhhhhhhcCC..',
    '..ccccllhhhhlhhhhhCC..',
    '..cccchhhhh.hhhhhhhC..',
    '..ccchhhh....hh...hC..',
    '..ccchh...........cC..',
    '..ccch............cC..',
    '..cccc............cC..',
    '..Cccc............C...',
    '..CCcc................',
    '..CCCc................'
  ],
  rogue: [
    '......................',
    '......................',
    '..........kkk.........',
    '........kkcccC........',
    '.......kcccccccC......',
    '......kcccccccccC.....',
    '.....kcccccccccccC....',
    '....kcccccccccccccC...',
    '...kcccchhhhhhhhcccC..',
    '..kccchhlhhhhhhhhhcC..',
    '..ccchhhhhhlhhhhhhCC..',
    '..cchhhhh.hhhh..hhCC..',
    '..ccHhhh...hh....hC...',
    '..ccHh............C...',
    '..CcH.................',
    '..CC....aaaaaaaaaaa...',
    '..C....aaaaaaaaaaaaA..',
    '........aAaaaaaaaaA...',
    '.........AAAAAAAA.....'
  ]
}

type Arm = 'down' | 'up' | 'forward'
type Pose = { dy: number; step: number; arm: Arm; sit: boolean; eyesClosed: boolean }
type Layer = 'body' | 'fx' | 'under'

class Canvas {
  body: (string | null)[] = new Array(GRID * GRID).fill(null)
  fx: (string | null)[] = new Array(GRID * GRID).fill(null)
  under: (string | null)[] = new Array(GRID * GRID).fill(null)

  p(x: number, y: number, c: string, layer: Layer = 'body'): void {
    if (x < 0 || y < 0 || x >= GRID || y >= GRID) return
    this[layer][y * GRID + x] = c
  }

  rect(x: number, y: number, w: number, h: number, c: string, layer: Layer = 'body'): void {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.p(x + i, y + j, c, layer)
  }

  /** Draws a text map; each letter is looked up in the class palette, then FIXED. */
  map(rows: string[], x: number, y: number, pal: Palette, layer: Layer = 'body'): void {
    rows.forEach((row, j) =>
      [...row].forEach((ch, i) => {
        if (ch === '.') return
        const color = (pal as Record<string, string>)[ch] ?? FIXED[ch]
        if (color) this.p(x + i, y + j, color, layer)
      })
    )
  }

  /** Under layer, then the body with a dark outline, then effects on top (no outline). */
  flatten(): (string | null)[] {
    const out = [...this.under]
    const at = (x: number, y: number) =>
      x >= 0 && y >= 0 && x < GRID && y < GRID ? this.body[y * GRID + x] : null
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const c = at(x, y)
        if (c) out[y * GRID + x] = c
        else if (at(x + 1, y) || at(x - 1, y) || at(x, y + 1) || at(x, y - 1)) out[y * GRID + x] = OUTLINE
      }
    }
    for (let i = 0; i < out.length; i++) if (this.fx[i]) out[i] = this.fx[i]
    return out
  }
}

const HX = 5 // head origin; the character fills columns 5-27, effects use the right side
const HY = 10

function poseFor(motion: Motion, frame: number): Pose {
  const base: Pose = { dy: 0, step: 0, arm: 'down', sit: false, eyesClosed: false }
  switch (motion) {
    case 'idle':
      return { ...base, dy: frame % 2 }
    case 'walk':
      return { ...base, step: frame % 2 === 0 ? 1 : -1, dy: frame % 2 }
    case 'cast':
      return { ...base, arm: frame === 0 ? 'up' : 'forward' }
    case 'read':
      return { ...base, arm: 'forward' }
    case 'rune':
      return { ...base, arm: 'up', dy: frame === 3 ? -1 : 0 }
    case 'fly':
      return { ...base, dy: -3 + (frame % 2), arm: 'forward' }
    case 'summon':
      return { ...base, arm: 'up' }
    case 'help':
      return { ...base, arm: 'up', dy: frame % 2 }
    case 'victory':
      return { ...base, arm: 'up', dy: [0, -2, -3, -2][frame % 4] }
    case 'sleep':
      return { ...base, sit: true, eyesClosed: true, dy: 4 }
  }
}

function drawFace(c: Canvas, x: number, y: number, closed: boolean): void {
  const rows: [number, number, number][] = [
    [8, 7, 8],
    [9, 6, 10],
    [10, 5, 12],
    [11, 5, 12],
    [12, 5, 12],
    [13, 5, 12],
    [14, 5, 12],
    [15, 5, 12],
    [16, 6, 10],
    [17, 8, 6]
  ]
  for (const [r, from, w] of rows) c.rect(x + from, y + r, w, 1, SKIN)
  c.rect(x + 5, y + 10, 1, 6, SKIN_SHADE)
  c.rect(x + 6, y + 16, 2, 1, SKIN_SHADE)
  if (closed) {
    c.rect(x + 9, y + 13, 2, 1, EYE)
    c.rect(x + 13, y + 13, 2, 1, EYE)
  } else {
    // Small black eyes, two pixels tall.
    c.rect(x + 10, y + 12, 1, 3, EYE)
    c.rect(x + 14, y + 12, 1, 3, EYE)
    c.p(x + 10, y + 12, '#3a3040')
    c.p(x + 14, y + 12, '#3a3040')
  }
  c.p(x + 8, y + 15, BLUSH)
  c.p(x + 15, y + 15, BLUSH)
  c.p(x + 12, y + 16, SKIN_SHADE)
}

/** Hair, veils and capes that hang behind the body. */
function drawBack(c: Canvas, cls: ClassId, pal: Palette, y: number, flutter: number): void {
  if (cls === 'mage') {
    // Long silver hair down the back.
    c.rect(HX + 2, y + 13, 4, 12, pal.h)
    c.rect(HX + 2, y + 13, 1, 12, pal.H)
    c.rect(HX + 4, y + 14, 1, 10, pal.l)
    c.rect(HX + 3 - flutter, y + 25, 3, 2, pal.h)
    c.p(HX + 2 - flutter, y + 26, pal.H)
  } else if (cls === 'cleric') {
    // Veil falling to the waist.
    c.rect(HX + 2, y + 15, 5, 9, pal.c)
    c.rect(HX + 2, y + 15, 2, 9, pal.C)
    c.rect(HX + 3 - flutter, y + 24, 4, 2, pal.C)
  } else if (cls === 'warrior') {
    // Red cape.
    c.rect(HX + 3 - flutter, y + 18, 5, 10, pal.a)
    c.rect(HX + 3 - flutter, y + 18, 2, 10, pal.A)
    c.rect(HX + 2 - flutter, y + 27, 2, 2, pal.A)
  } else if (cls === 'ranger') {
    // Hood cloak and a quiver of fletched arrows.
    c.rect(HX + 3, y + 17, 4, 9, pal.C)
    c.rect(HX + 4, y + 17, 2, 8, pal.c)
    c.rect(HX + 4, y + 16, 3, 7, pal.m)
    c.rect(HX + 4, y + 16, 1, 7, pal.M)
    c.p(HX + 4, y + 14, WHITE)
    c.p(HX + 5, y + 13, '#d8484a')
    c.p(HX + 6, y + 14, WHITE)
    c.rect(HX + 4, y + 15, 3, 1, pal.n)
  } else if (cls === 'rogue') {
    // Scarf tails streaming behind.
    c.rect(HX + 2 - flutter, y + 18, 4, 2, pal.a)
    c.rect(HX + 1 - flutter * 2, y + 20, 3, 2, pal.A)
    c.p(HX - flutter * 2, y + 22, pal.A)
  }
}

function drawBody(c: Canvas, cls: ClassId, pose: Pose, motion: Motion, frame: number): void {
  const pal = PALETTES[cls]
  const y = HY + pose.dy
  const robed = ROBED.includes(cls)
  const flutter = motion === 'fly' || motion === 'walk' ? frame % 2 : 0

  drawMedallion(c, cls)
  // Shadow on the ground, shrinking while airborne.
  const lift = Math.max(0, -pose.dy)
  c.rect(HX + 5 + lift, HY + 29, 13 - lift * 2, 1, SHADOW, 'under')
  c.rect(HX + 7 + lift, HY + 30, 9 - lift * 2, 1, SHADOW, 'under')

  drawBack(c, cls, pal, y, flutter)

  // Legs and boots: a short chibi body, about one head tall.
  if (pose.sit) {
    c.rect(HX + 6, y + 23, 12, 3, robed ? pal.t : pal.T)
    c.rect(HX + 6, y + 25, 12, 1, robed ? pal.T : BOOTS_DARK)
    c.rect(HX + 15, y + 23, 3, 3, BOOTS)
  } else {
    const back = HX + 7 + Math.max(0, pose.step)
    const front = HX + 12 + Math.min(0, pose.step)
    if (!robed) {
      c.rect(back, y + 24, 3, 2, pal.T)
      c.rect(front, y + 24, 3, 2, pal.t)
    }
    c.rect(back, y + 26, 3, 3, BOOTS)
    c.rect(front, y + 26, 4, 3, BOOTS)
    c.rect(back, y + 28, 3, 1, BOOTS_DARK)
    c.rect(front, y + 28, 4, 1, BOOTS_DARK)
  }

  // Torso: back side in shade, front side lit.
  if (robed && !pose.sit) {
    c.rect(HX + 6, y + 18, 11, 5, pal.t)
    c.rect(HX + 5, y + 22, 13, 5, pal.t)
    c.rect(HX + 5, y + 22, 2, 5, pal.T)
    c.rect(HX + 6, y + 18, 2, 4, pal.T)
    c.rect(HX + 15, y + 19, 1, 7, pal.u)
    c.rect(HX + 5, y + 26, 13, 1, pal.a) // hem trim
    c.rect(HX + 11, y + 18, 1, 8, pal.a) // front seam
  } else {
    c.rect(HX + 6, y + 18, 11, 6, pal.t)
    c.rect(HX + 6, y + 18, 2, 6, pal.T)
    c.rect(HX + 15, y + 19, 1, 3, pal.u)
    c.rect(HX + 6, y + 22, 11, 1, cls === 'ranger' ? pal.a : BOOTS) // belt
    c.p(HX + 12, y + 22, GOLD) // buckle
  }
  // Collar under the chin.
  c.rect(HX + 8, y + 18, 7, 1, robed ? pal.u : pal.T)

  // Class marks on the body.
  if (cls === 'cleric') {
    c.rect(HX + 10, y + 20, 3, 1, GOLD)
    c.rect(HX + 11, y + 19, 1, 4, GOLD)
  } else if (cls === 'warrior') {
    // Breastplate and a big shoulder pauldron.
    c.rect(HX + 9, y + 19, 7, 3, pal.m)
    c.rect(HX + 9, y + 19, 2, 3, pal.M)
    c.rect(HX + 14, y + 19, 1, 2, pal.n)
    c.rect(HX + 4, y + 17, 6, 4, pal.m)
    c.rect(HX + 4, y + 20, 6, 1, pal.M)
    c.rect(HX + 5, y + 17, 3, 1, pal.n)
  } else if (cls === 'ranger') {
    c.rect(HX + 13, y + 18, 1, 4, pal.a) // quiver strap
  } else if (cls === 'rogue') {
    c.rect(HX + 14, y + 22, 2, 2, pal.a) // belt pouch
    c.rect(HX + 8, y + 20, 1, 3, pal.m) // sheathed knife
  }

  // Head on top of the body.
  drawFace(c, HX, y, pose.eyesClosed)
  c.map(FRONT[cls], HX, y - (cls === 'mage' ? 5 : 0), pal)

  // Arm and weapon.
  const hand = { x: 0, y: 0 }
  if (pose.sit) {
    c.rect(HX + 14, y + 20, 3, 3, pal.t)
    hand.x = HX + 16
    hand.y = y + 21
  } else if (pose.arm === 'down') {
    c.rect(HX + 15, y + 19, 3, 3, pal.t)
    c.rect(HX + 15, y + 19, 1, 3, pal.T)
    hand.x = HX + 16
    hand.y = y + 21
  } else if (pose.arm === 'up') {
    c.rect(HX + 16, y + 19, 3, 2, pal.t)
    c.rect(HX + 18, y + 13, 3, 7, pal.t)
    c.rect(HX + 18, y + 13, 1, 7, pal.T)
    hand.x = HX + 18
    hand.y = y + 10
  } else {
    c.rect(HX + 15, y + 19, 6, 3, pal.t)
    c.rect(HX + 15, y + 21, 6, 1, pal.T)
    hand.x = HX + 21
    hand.y = y + 19
  }
  c.rect(hand.x, hand.y, 3, 3, SKIN)
  c.rect(hand.x, hand.y + 2, 3, 1, SKIN_SHADE)

  if (motion === 'read') return // both hands hold the book instead of a weapon
  drawWeapon(c, cls, pal, pose, hand)
}

/** Card-portrait medallion behind the character, in the class's element color. */
function drawMedallion(c: Canvas, cls: ClassId): void {
  const [outer, mid, inner] = ORB[cls]
  const cx = HX + 12
  const cy = HY + 13
  for (let yy = cy - 17; yy <= cy + 17; yy++)
    for (let xx = cx - 17; xx <= cx + 17; xx++) {
      const d = Math.hypot(xx - cx + 0.5, yy - cy + 0.5)
      // Light comes from the upper left of the disc.
      const g = Math.hypot(xx - cx + 6, yy - cy + 6)
      let col: string | null = null
      if (d <= 17 && d > 15.6) col = RING_DARK
      else if (d <= 15.6 && d > 14.4) col = RING
      else if (d <= 14.4) col = g < 9 ? inner : g < 17 ? mid : outer
      if (col) c.p(xx, yy, col, 'under')
    }
}

function drawWeapon(c: Canvas, cls: ClassId, pal: Palette, pose: Pose, hand: { x: number; y: number }): void {
  const sx = hand.x + 1
  if (cls === 'mage' || cls === 'cleric') {
    const len = pose.sit ? 16 : 21
    const top = hand.y - (pose.sit ? 8 : 12)
    c.rect(sx, top, 1, len, pal.w)
    c.rect(sx + 1, top, 1, len, pal.W)
    if (cls === 'mage') {
      // Crystal orb in a forked head.
      c.rect(sx - 1, top - 2, 1, 3, pal.w)
      c.rect(sx + 2, top - 2, 1, 3, pal.W)
      c.rect(sx - 1, top - 6, 4, 4, pal.E)
      c.rect(sx - 1, top - 6, 1, 4, '#1f8aa8')
      c.p(sx + 1, top - 5, SHINE)
    } else {
      // Gold cross atop the staff.
      c.rect(sx - 2, top - 4, 6, 2, pal.m)
      c.rect(sx, top - 8, 2, 8, pal.m)
      c.rect(sx, top - 8, 1, 8, pal.n)
      c.rect(sx + 1, top - 4, 3, 1, pal.M)
    }
  } else if (cls === 'warrior') {
    if (pose.arm === 'up' && !pose.sit) {
      c.rect(sx - 1, hand.y - 12, 3, 12, pal.w)
      c.rect(sx + 1, hand.y - 12, 1, 12, pal.W)
      c.p(sx, hand.y - 13, pal.w)
      c.rect(sx - 3, hand.y - 1, 7, 1, GOLD)
    } else if (pose.arm === 'forward') {
      c.rect(hand.x + 3, hand.y, 13, 3, pal.w)
      c.rect(hand.x + 3, hand.y + 2, 13, 1, pal.W)
      c.p(hand.x + 16, hand.y + 1, pal.w)
      c.rect(hand.x + 2, hand.y - 2, 1, 7, GOLD)
    } else {
      c.rect(sx - 1, hand.y - 4, 3, 12, pal.w)
      c.rect(sx + 1, hand.y - 4, 1, 12, pal.W)
      c.rect(sx - 3, hand.y - 1, 7, 1, GOLD)
    }
  } else if (cls === 'rogue') {
    if (pose.arm === 'forward') {
      c.rect(hand.x + 3, hand.y + 1, 6, 1, pal.w)
      c.rect(hand.x + 3, hand.y + 2, 5, 1, pal.W)
      c.rect(hand.x + 2, hand.y, 1, 3, BOOTS)
    } else {
      c.rect(sx, hand.y - 6, 1, 6, pal.w)
      c.rect(sx + 1, hand.y - 5, 1, 5, pal.W)
      c.rect(sx - 1, hand.y, 3, 1, BOOTS)
    }
  } else {
    // Longbow: limbs curving away from the grip, string behind.
    const bx = hand.x + 3
    const by = hand.y - 11
    c.rect(bx, by, 1, 2, pal.w)
    c.rect(bx + 1, by + 2, 1, 3, pal.w)
    c.rect(bx + 2, by + 5, 1, 9, pal.w)
    c.rect(bx + 1, by + 14, 1, 3, pal.w)
    c.rect(bx, by + 17, 1, 2, pal.w)
    c.rect(bx + 3, by + 6, 1, 7, pal.W)
    c.rect(bx - 1, by + 1, 1, 17, '#e8e0c8')
  }
}

const RUNE = [
  '...g...g...',
  '..ggggggg..',
  '.g...g...g.',
  'g...ggg...g',
  'gg.g.g.g.gg',
  'g...ggg...g',
  '.g...g...g.',
  '..ggggggg..',
  '...g...g...'
]

function drawEffects(c: Canvas, cls: ClassId, motion: Motion, frame: number, dy: number): void {
  const pal = PALETTES[cls]
  switch (motion) {
    case 'cast': {
      if (frame === 0) return
      if (cls === 'warrior') {
        // Slash arc sweeping down in front of the blade.
        const arcs = [
          [],
          [[32, HY + 2], [34, HY + 4], [36, HY + 7], [37, HY + 10]],
          [[37, HY + 10], [37, HY + 14], [36, HY + 18], [34, HY + 21]],
          [[34, HY + 21], [32, HY + 23]]
        ][frame]
        for (const [x, y] of arcs) {
          c.rect(x, y, 3, 3, pal.effect, 'fx')
          c.p(x - 1, y + 1, pal.effectCore, 'fx')
        }
      } else if (cls === 'cleric') {
        // Holy light: a cross of light that grows.
        const r = frame * 2 + 1
        const cx = 37
        const cy = HY + 10
        c.rect(cx - r, cy, r * 2 + 1, 1, pal.effect, 'fx')
        c.rect(cx, cy - r, 1, r * 2 + 1, pal.effect, 'fx')
        c.rect(cx - 1, cy - 1, 3, 3, pal.effectCore, 'fx')
        if (frame === 3) for (const [x, y] of [[31, HY + 4], [43, HY + 4], [31, HY + 16], [43, HY + 16]]) c.p(x, y, pal.effect, 'fx')
      } else if (cls === 'rogue') {
        // Thrown daggers with a shadow trail.
        for (const off of [0, 6]) {
          const x = 26 + frame * 5 - off
          const y = HY + 20 + off / 2
          c.rect(x, y, 4, 1, pal.m, 'fx')
          c.p(x + 4, y, pal.effectCore, 'fx')
          c.rect(x - 4, y, 4, 1, pal.effect, 'fx')
        }
      } else {
        // Bolt (mage) or arrow (ranger) flying right.
        const x = 26 + frame * 5
        const y = cls === 'mage' ? HY + 6 : HY + 19
        c.rect(x, y, 4, 3, pal.effectCore, 'fx')
        c.rect(x - 4, y, 4, 3, pal.effect, 'fx')
        c.p(x - 6, y + (frame % 2) * 2, pal.effect, 'fx')
        c.p(x - 8, y + 1, pal.effect, 'fx')
      }
      return
    }
    case 'read': {
      // Open book held in front; the page flips every other frame.
      const bx = HX + 19
      const by = dy + HY + 18
      c.rect(bx, by, 10, 7, '#7a3a2a')
      c.rect(bx + 1, by + 1, 4, 5, WHITE)
      c.rect(bx + 5, by + 1, 4, 5, '#ece4d4')
      c.rect(bx + 2 + (frame ? 4 : 0), by + 2, 2, 1, '#9a92c0')
      c.rect(bx + 2 + (frame ? 4 : 0), by + 4, 2, 1, '#9a92c0')
      if (frame) c.p(bx + 5, by - 3, GOLD, 'fx')
      return
    }
    case 'rune': {
      const shown = Math.ceil(((frame + 1) / 4) * RUNE.length * RUNE[0].length)
      let n = 0
      RUNE.forEach((row, j) =>
        [...row].forEach((ch, i) => {
          if (ch === 'g' && n++ < shown) c.p(33 + i, 3 + j, GOLD, 'fx')
        })
      )
      return
    }
    case 'fly': {
      for (let i = 0; i < 3; i++) {
        const x = 4 + ((i * 7 + frame * 3) % 18)
        c.rect(x, HY + 30 + (i % 2) * 2, 4, 1, '#a8c8ff', 'fx')
      }
      return
    }
    case 'summon': {
      const ring = frame % 2 ? GOLD : '#c49bff'
      for (let i = 0; i < 24; i += 2) c.p(HX + i, HY + 30, ring, 'under')
      c.p(HX - 1, HY + 29, ring, 'under')
      c.p(HX + 24, HY + 29, ring, 'under')
      // A small ghost familiar rises next to the caster.
      const fy = HY + 22 - frame * 4
      c.rect(35, fy, 6, 6, WHITE, 'fx')
      c.rect(36, fy - 1, 4, 1, WHITE, 'fx')
      c.p(35, fy + 6, WHITE, 'fx')
      c.p(37, fy + 6, WHITE, 'fx')
      c.p(40, fy + 6, WHITE, 'fx')
      c.p(37, fy + 2, EYE, 'fx')
      c.p(39, fy + 2, EYE, 'fx')
      return
    }
    case 'help': {
      // Speech bubble with a blinking "!".
      c.rect(30, 1, 9, 11, WHITE, 'fx')
      c.rect(29, 2, 11, 9, WHITE, 'fx')
      c.rect(29, 12, 2, 1, WHITE, 'fx')
      const mark = frame ? '#ff6b5e' : '#ff9a3a'
      c.rect(33, 3, 3, 5, mark, 'fx')
      c.rect(33, 9, 3, 2, mark, 'fx')
      return
    }
    case 'victory': {
      const spots = [
        [33, 4],
        [41, 12],
        [3, 8],
        [38, 24]
      ]
      spots.forEach(([x, y], i) => {
        if ((i + frame) % 2 === 0) {
          c.rect(x - 2, y, 5, 1, GOLD, 'fx')
          c.rect(x, y - 2, 1, 5, GOLD, 'fx')
          c.p(x, y, WHITE, 'fx')
        }
      })
      return
    }
    case 'sleep': {
      const z = (x: number, y: number) => {
        c.rect(x, y, 4, 1, '#c8d0ff', 'fx')
        c.p(x + 2, y + 1, '#c8d0ff', 'fx')
        c.p(x + 1, y + 2, '#c8d0ff', 'fx')
        c.rect(x, y + 3, 4, 1, '#c8d0ff', 'fx')
      }
      z(30, 14 - frame * 2)
      if (frame) z(36, 6)
      return
    }
    default:
      return
  }
}

/** One frame of one class doing one motion, as GRID * GRID colors (null = transparent). */
export function drawFrame(cls: ClassId, motion: Motion, frame: number): (string | null)[] {
  const f = frame % FRAMES[motion]
  const pose = poseFor(motion, f)
  const c = new Canvas()
  drawBody(c, cls, pose, motion, f)
  drawEffects(c, cls, motion, f, pose.dy)
  return c.flatten()
}
