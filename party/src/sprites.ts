// Pixel party members drawn by code: no image files. Each frame is a GRID x GRID array of
// colors (null = transparent). The panel blits it to a canvas; tools/preview-sprites.ts
// writes the same frames to a PNG sheet.

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

export const GRID = 32
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

type Palette = {
  cloth: string
  clothDark: string
  hair: string
  head: string
  headDark: string
  accent: string
  weapon: string
  weaponTip: string
  effect: string
  effectCore: string
}

const SKIN = '#f4c89a'
const EYE = '#1a1030'
const BOOTS = '#5a3a2a'
const OUTLINE = '#120c2a'
const SHADOW = '#04061a'
const GOLD = '#ffcf66'
const WHITE = '#fff8e6'

export const PALETTES: Record<ClassId, Palette> = {
  mage: {
    cloth: '#5b4ccf',
    clothDark: '#3b2f99',
    hair: '#d8dcf0',
    head: '#5b4ccf',
    headDark: '#3b2f99',
    accent: GOLD,
    weapon: '#8a5a3a',
    weaponTip: '#7fe8ff',
    effect: '#7fe8ff',
    effectCore: WHITE
  },
  warrior: {
    cloth: '#9aa6c8',
    clothDark: '#5f6a8f',
    hair: '#e09040',
    head: '#c8d2ea',
    headDark: '#7f8ab0',
    accent: '#d8484a',
    weapon: '#e8eefc',
    weaponTip: '#b8c4e0',
    effect: GOLD,
    effectCore: WHITE
  },
  ranger: {
    cloth: '#3f9a6a',
    clothDark: '#2a6a4a',
    hair: '#a0602a',
    head: '#2f7a55',
    headDark: '#1f5a3d',
    accent: '#c8a060',
    weapon: '#a0703a',
    weaponTip: '#e8e0c8',
    effect: '#b8f0a0',
    effectCore: WHITE
  },
  cleric: {
    cloth: '#e8e4f4',
    clothDark: '#a9a3cc',
    hair: '#f2d27a',
    head: '#f4f0fc',
    headDark: '#c4bee0',
    accent: GOLD,
    weapon: GOLD,
    weaponTip: '#fff4b0',
    effect: '#ffe39a',
    effectCore: WHITE
  },
  rogue: {
    cloth: '#4a4060',
    clothDark: '#2e2640',
    hair: '#3a2a2a',
    head: '#3a3250',
    headDark: '#241e36',
    accent: '#c83a4a',
    weapon: '#d8e0f0',
    weaponTip: '#8a90a8',
    effect: '#b08cff',
    effectCore: '#e8e0ff'
  }
}

type Arm = 'down' | 'up' | 'forward'
type Pose = { dy: number; step: number; arm: Arm; sit: boolean; eyesClosed: boolean }

class Canvas {
  body: (string | null)[] = new Array(GRID * GRID).fill(null)
  fx: (string | null)[] = new Array(GRID * GRID).fill(null)
  under: (string | null)[] = new Array(GRID * GRID).fill(null)

  p(x: number, y: number, c: string, layer: 'body' | 'fx' | 'under' = 'body'): void {
    if (x < 0 || y < 0 || x >= GRID || y >= GRID) return
    this[layer][y * GRID + x] = c
  }

  rect(x: number, y: number, w: number, h: number, c: string, layer: 'body' | 'fx' | 'under' = 'body'): void {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.p(x + i, y + j, c, layer)
  }

  /** Under layer, then the outlined body, then effects on top (effects glow, no outline). */
  flatten(): (string | null)[] {
    const out = [...this.under]
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        if (this.body[y * GRID + x]) continue
        const near = [
          [x + 1, y],
          [x - 1, y],
          [x, y + 1],
          [x, y - 1]
        ].some(([a, b]) => a >= 0 && b >= 0 && a < GRID && b < GRID && this.body[b * GRID + a])
        if (near) out[y * GRID + x] = OUTLINE
      }
    }
    for (let i = 0; i < out.length; i++) {
      if (this.body[i]) out[i] = this.body[i]
      if (this.fx[i]) out[i] = this.fx[i]
    }
    return out
  }
}

const X0 = 6 // left edge of the character box; the right side stays free for effects

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
      return { ...base, sit: true, eyesClosed: true, dy: 3 }
  }
}

function drawBody(c: Canvas, cls: ClassId, pose: Pose, motion: Motion, frame: number): void {
  const pal = PALETTES[cls]
  const y0 = pose.dy
  // Shadow on the ground, shrinking while airborne.
  const lift = Math.max(0, -pose.dy)
  c.rect(X0 + 1 + Math.floor(lift / 2), 29, 11 - lift, 1, SHADOW, 'under')

  // Cape behind the body (warrior) or hood tail (ranger), drawn first so the body covers it.
  if (cls === 'warrior') {
    const flutter = motion === 'fly' || motion === 'walk' ? frame % 2 : 0
    c.rect(X0 + 1 - flutter, y0 + 14, 3, 10, pal.accent)
  }
  if (cls === 'ranger') c.rect(X0 + 1, y0 + 9, 2, 6, pal.headDark)
  if (cls === 'mage') c.rect(X0 + 2, y0 + 8, 2, 8, pal.hair) // long hair behind
  if (cls === 'rogue') {
    // Scarf tail streaming behind.
    const flutter = motion === 'fly' || motion === 'walk' ? frame % 2 : 0
    c.rect(X0 + 1 - flutter, y0 + 12, 3, 2, pal.accent)
    c.rect(X0 - flutter, y0 + 14, 2, 2, pal.accent)
  }

  // Legs and boots.
  const robed = ROBED.includes(cls)
  if (pose.sit) {
    c.rect(X0 + 4, y0 + 22, 8, 3, robed ? pal.clothDark : BOOTS)
  } else if (robed) {
    // Robe down to the ankles, boots peeking out.
    c.rect(X0 + 3, y0 + 21, 7, 4, pal.cloth)
    c.rect(X0 + 2, y0 + 23, 9, 2, pal.clothDark)
    c.rect(X0 + 3 + Math.max(0, pose.step), y0 + 25, 2, 2, BOOTS)
    c.rect(X0 + 7 + Math.min(0, pose.step), y0 + 25, 2, 2, BOOTS)
  } else {
    c.rect(X0 + 3 + Math.max(0, pose.step), y0 + 21, 2, 4, pal.clothDark)
    c.rect(X0 + 7 + Math.min(0, pose.step), y0 + 21, 2, 4, pal.clothDark)
    c.rect(X0 + 3 + Math.max(0, pose.step), y0 + 25, 2, 2, BOOTS)
    c.rect(X0 + 7 + Math.min(0, pose.step), y0 + 25, 2, 2, BOOTS)
  }

  // Torso.
  c.rect(X0 + 3, y0 + 14, 7, 7, pal.cloth)
  c.rect(X0 + 3, y0 + 14, 1, 7, pal.clothDark)
  if (!robed) c.rect(X0 + 3, y0 + 19, 7, 1, cls === 'warrior' || cls === 'rogue' ? BOOTS : pal.accent)
  if (robed) c.rect(X0 + 6, y0 + 14, 1, 7, pal.accent)
  if (cls === 'cleric') {
    // Gold cross on the chest.
    c.rect(X0 + 5, y0 + 16, 3, 1, pal.accent)
    c.rect(X0 + 6, y0 + 15, 1, 3, pal.accent)
  }

  // Head.
  c.rect(X0 + 4, y0 + 8, 6, 6, SKIN)
  if (pose.eyesClosed) {
    c.rect(X0 + 7, y0 + 11, 2, 1, EYE)
  } else {
    c.p(X0 + 7, y0 + 10, EYE)
    c.p(X0 + 9, y0 + 10, EYE)
  }

  // Headgear.
  if (cls === 'mage') {
    c.rect(X0 + 1, y0 + 7, 11, 1, pal.head) // brim
    c.rect(X0 + 3, y0 + 6, 7, 1, pal.accent) // gold band
    c.rect(X0 + 4, y0 + 5, 5, 1, pal.head)
    c.rect(X0 + 5, y0 + 4, 4, 1, pal.head)
    c.rect(X0 + 6, y0 + 3, 3, 1, pal.head)
    c.rect(X0 + 7, y0 + 2, 2, 1, pal.headDark)
    c.p(X0 + 9, y0 + 1, pal.headDark)
    c.rect(X0 + 4, y0 + 8, 1, 3, pal.hair)
  } else if (cls === 'warrior') {
    c.rect(X0 + 3, y0 + 5, 8, 4, pal.head)
    c.rect(X0 + 3, y0 + 8, 1, 4, pal.headDark)
    c.rect(X0 + 7, y0 + 9, 3, 1, pal.headDark) // visor edge
    c.rect(X0 + 5, y0 + 3, 3, 2, pal.accent) // plume
    c.p(X0 + 4, y0 + 4, pal.accent)
  } else if (cls === 'cleric') {
    // White hood with a gold circlet, fair hair at the brow.
    c.rect(X0 + 3, y0 + 5, 8, 3, pal.head)
    c.rect(X0 + 3, y0 + 8, 1, 6, pal.head)
    c.rect(X0 + 4, y0 + 7, 6, 1, pal.accent)
    c.rect(X0 + 4, y0 + 4, 6, 1, pal.headDark)
    c.rect(X0 + 5, y0 + 8, 4, 1, pal.hair)
  } else if (cls === 'rogue') {
    // Dark hood and a red mask over the mouth.
    c.rect(X0 + 3, y0 + 5, 8, 3, pal.head)
    c.rect(X0 + 3, y0 + 8, 2, 6, pal.head)
    c.rect(X0 + 4, y0 + 4, 6, 1, pal.headDark)
    c.p(X0 + 10, y0 + 7, pal.headDark)
    c.rect(X0 + 5, y0 + 11, 5, 3, pal.accent)
  } else {
    c.rect(X0 + 3, y0 + 6, 8, 3, pal.head)
    c.rect(X0 + 3, y0 + 8, 2, 6, pal.head)
    c.rect(X0 + 4, y0 + 5, 6, 1, pal.headDark)
    c.p(X0 + 9, y0 + 8, pal.hair)
    c.p(X0 + 5, y0 + 9, pal.hair)
  }

  // Arm and weapon.
  const hand = { x: 0, y: 0 }
  if (pose.sit) {
    c.rect(X0 + 9, y0 + 18, 2, 2, pal.cloth)
    hand.x = X0 + 11
    hand.y = y0 + 19
  } else if (pose.arm === 'down') {
    c.rect(X0 + 9, y0 + 15, 2, 4, pal.cloth)
    hand.x = X0 + 10
    hand.y = y0 + 19
  } else if (pose.arm === 'up') {
    c.rect(X0 + 10, y0 + 11, 2, 4, pal.cloth)
    hand.x = X0 + 11
    hand.y = y0 + 10
  } else {
    c.rect(X0 + 10, y0 + 15, 3, 2, pal.cloth)
    hand.x = X0 + 13
    hand.y = y0 + 15
  }
  c.rect(hand.x, hand.y, 2, 2, SKIN)

  if (motion === 'read') return // both hands hold the book instead of a weapon
  if (cls === 'mage') {
    const top = pose.sit ? hand.y - 6 : hand.y - 8
    c.rect(hand.x + 2, top, 1, 14, pal.weapon)
    c.rect(hand.x + 1, top - 2, 3, 2, pal.weaponTip)
  } else if (cls === 'warrior') {
    if (pose.arm === 'up' && !pose.sit) {
      c.rect(hand.x + 1, hand.y - 8, 2, 8, pal.weapon)
      c.rect(hand.x, hand.y - 1, 4, 1, BOOTS)
    } else if (pose.arm === 'forward') {
      c.rect(hand.x + 2, hand.y, 8, 2, pal.weapon)
      c.rect(hand.x + 1, hand.y - 1, 1, 4, BOOTS)
    } else {
      c.rect(hand.x + 1, hand.y - 2, 2, 9, pal.weapon)
      c.rect(hand.x, hand.y, 4, 1, BOOTS)
    }
  } else if (cls === 'cleric') {
    // Gold holy staff topped with a cross.
    const top = pose.sit ? hand.y - 6 : hand.y - 8
    c.rect(hand.x + 2, top, 1, 14, pal.weapon)
    c.rect(hand.x + 1, top - 2, 3, 1, pal.weaponTip)
    c.rect(hand.x + 2, top - 3, 1, 3, pal.weaponTip)
  } else if (cls === 'rogue') {
    // Short dagger, point up when raised, forward when thrusting.
    if (pose.arm === 'forward') {
      c.rect(hand.x + 2, hand.y, 4, 1, pal.weapon)
      c.p(hand.x + 6, hand.y, pal.weaponTip)
    } else {
      c.rect(hand.x + 1, hand.y - 4, 1, 4, pal.weapon)
      c.p(hand.x + 1, hand.y - 5, pal.weaponTip)
    }
    c.rect(hand.x, hand.y + 1, 2, 1, BOOTS)
  } else {
    // Bow: an arc in front of the hand, string behind.
    const bx = hand.x + 2
    const by = pose.arm === 'up' ? hand.y - 5 : hand.y - 5
    c.rect(bx + 1, by, 1, 2, pal.weapon)
    c.rect(bx + 2, by + 2, 1, 7, pal.weapon)
    c.rect(bx + 1, by + 9, 1, 2, pal.weapon)
    c.rect(bx, by + 1, 1, 9, pal.weaponTip)
  }
}

const RUNE = ['..g.g..', '.ggggg.', 'g..g..g', 'gg.g.gg', 'g..g..g', '.ggggg.', '..g.g..']

function drawEffects(c: Canvas, cls: ClassId, motion: Motion, frame: number, dy: number): void {
  const pal = PALETTES[cls]
  switch (motion) {
    case 'cast': {
      if (cls === 'warrior') {
        // Slash arc sweeping down in front.
        const arcs = [
          [[22, 6], [23, 7], [24, 8]],
          [[23, 8], [24, 10], [25, 12], [25, 14]],
          [[24, 14], [24, 16], [23, 18], [22, 19]],
          []
        ][frame]
        for (const [x, y] of arcs) {
          c.rect(x, y, 2, 2, pal.effect, 'fx')
          c.p(x - 1, y, pal.effectCore, 'fx')
        }
      } else if (cls === 'cleric') {
        // Holy light: a growing cross of light in front.
        if (frame === 0) return
        const r = frame + 1
        const cx = 24
        const cy = 10
        c.rect(cx - r, cy, r * 2 + 1, 1, pal.effect, 'fx')
        c.rect(cx, cy - r, 1, r * 2 + 1, pal.effect, 'fx')
        c.rect(cx - 1, cy - 1, 3, 3, pal.effectCore, 'fx')
        if (frame === 3) for (const [x, y] of [[20, 6], [28, 6], [20, 14], [28, 14]]) c.p(x, y, pal.effect, 'fx')
      } else if (cls === 'rogue') {
        // Thrown daggers with a shadow trail.
        if (frame === 0) return
        for (const off of [0, 4]) {
          const x = 18 + frame * 4 - off
          const y = 14 + off / 2
          c.rect(x, y, 3, 1, pal.weapon, 'fx')
          c.p(x + 3, y, pal.effectCore, 'fx')
          c.rect(x - 3, y, 3, 1, pal.effect, 'fx')
        }
      } else {
        const x = 19 + frame * 3
        const y = cls === 'mage' ? 9 : 16
        if (frame === 0) return
        c.rect(x, y, 3, 2, pal.effectCore, 'fx')
        c.rect(x - 3, y, 3, 2, pal.effect, 'fx')
        c.p(x - 5, y + (frame % 2), pal.effect, 'fx')
      }
      return
    }
    case 'read': {
      // Open book held in front; the page flips every other frame.
      const bx = X0 + 12
      const by = dy + 13
      c.rect(bx, by, 7, 5, BOOTS)
      c.rect(bx + 1, by + 1, 2, 3, WHITE)
      c.rect(bx + 4, by + 1, 2, 3, WHITE)
      c.rect(bx + 1 + (frame ? 3 : 0), by + 2, 2, 1, '#b8b0d8')
      if (frame) c.p(bx + 3, by - 2, GOLD, 'fx')
      return
    }
    case 'rune': {
      const shown = Math.ceil(((frame + 1) / 4) * RUNE.length * RUNE[0].length)
      let n = 0
      RUNE.forEach((row, j) =>
        [...row].forEach((ch, i) => {
          if (ch === 'g' && n++ < shown) c.p(21 + i, 3 + j, GOLD, 'fx')
        })
      )
      return
    }
    case 'fly': {
      for (let i = 0; i < 3; i++) {
        const x = 3 + ((i * 5 + frame * 2) % 12)
        c.rect(x, 27 + (i % 2), 3, 1, '#a8c8ff', 'fx')
      }
      return
    }
    case 'summon': {
      const ring = frame % 2 ? GOLD : '#c49bff'
      for (let i = 0; i < 18; i += 2) c.p(X0 - 2 + i, 28, ring, 'under')
      c.p(X0 - 3, 27, ring, 'under')
      c.p(X0 + 16, 27, ring, 'under')
      // A small familiar rises next to the caster.
      const fy = 24 - frame * 3
      c.rect(24, fy, 4, 4, WHITE, 'fx')
      c.rect(24, fy + 4, 1, 1, WHITE, 'fx')
      c.rect(27, fy + 4, 1, 1, WHITE, 'fx')
      c.p(25, fy + 1, EYE, 'fx')
      c.p(27, fy + 1, EYE, 'fx')
      return
    }
    case 'help': {
      // Speech bubble with a blinking "!".
      c.rect(19, 1, 6, 8, WHITE, 'fx')
      c.p(18, 9, WHITE, 'fx')
      c.rect(21, 2, 2, 4, frame ? '#ff6b5e' : '#ff9a3a', 'fx')
      c.rect(21, 7, 2, 1, frame ? '#ff6b5e' : '#ff9a3a', 'fx')
      return
    }
    case 'victory': {
      const spots = [
        [20, 4],
        [26, 9],
        [3, 6],
        [24, 16]
      ]
      spots.forEach(([x, y], i) => {
        if ((i + frame) % 2 === 0) {
          c.p(x, y, GOLD, 'fx')
          c.p(x - 1, y, GOLD, 'fx')
          c.p(x + 1, y, GOLD, 'fx')
          c.p(x, y - 1, GOLD, 'fx')
          c.p(x, y + 1, GOLD, 'fx')
        }
      })
      return
    }
    case 'sleep': {
      const z = (x: number, y: number) => {
        c.rect(x, y, 3, 1, '#c8d0ff', 'fx')
        c.p(x + 1, y + 1, '#c8d0ff', 'fx')
        c.rect(x, y + 2, 3, 1, '#c8d0ff', 'fx')
      }
      z(20, 10 - frame * 2)
      if (frame) z(24, 4)
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
