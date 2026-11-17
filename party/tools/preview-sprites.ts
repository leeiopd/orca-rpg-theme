// Writes every class x motion x frame to one PNG sheet so the sprites can be checked without Orca.
// usage: node tools/preview-sprites.ts [out.png] [scale] [motion,motion...] [class,class...]   (Node 23.6+ runs .ts directly)
import { writeFileSync } from 'node:fs'
import { deflateSync, crc32 } from 'node:zlib'
import { drawFrame, FRAMES, GRID, MOTIONS as ALL_MOTIONS, type ClassId, type Motion } from '../src/sprites.ts'

const out = process.argv[2] ?? 'sprites-preview.png'
const scale = Number(process.argv[3] ?? 4)
const MOTIONS = process.argv[4] && process.argv[4] !== 'all' ? (process.argv[4].split(',') as Motion[]) : ALL_MOTIONS
const classes: ClassId[] = process.argv[5]
  ? (process.argv[5].split(',') as ClassId[])
  : ['mage', 'warrior', 'ranger', 'cleric', 'rogue']
const maxFrames = Math.max(...MOTIONS.map((m) => FRAMES[m]))
const cell = GRID + 4
const cols = maxFrames * classes.length
const W = cols * cell * scale
const H = MOTIONS.length * cell * scale
const BG = [0x0b, 0x0f, 0x2e]
const rgb = new Uint8Array(W * H * 3)
for (let i = 0; i < W * H; i++) rgb.set(BG, i * 3)

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16))

MOTIONS.forEach((motion, row) => {
  classes.forEach((cls, ci) => {
    for (let f = 0; f < FRAMES[motion]; f++) {
      const px = drawFrame(cls, motion, f)
      const ox = (ci * maxFrames + f) * cell + 2
      const oy = row * cell + 2
      for (let y = 0; y < GRID; y++)
        for (let x = 0; x < GRID; x++) {
          const c = px[y * GRID + x]
          if (!c) continue
          const v = hex(c)
          for (let sy = 0; sy < scale; sy++)
            for (let sx = 0; sx < scale; sx++) {
              const X = (ox + x) * scale + sx
              const Y = (oy + y) * scale + sy
              rgb.set(v, (Y * W + X) * 3)
            }
        }
    }
  })
})

const raw = Buffer.alloc((W * 3 + 1) * H)
for (let y = 0; y < H; y++) Buffer.from(rgb.subarray(y * W * 3, (y + 1) * W * 3)).copy(raw, y * (W * 3 + 1) + 1)
const chunk = (type: string, data: Buffer) => {
  const t = Buffer.from(type)
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])) >>> 0)
  return Buffer.concat([len, t, data, crc])
}
const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(W, 0)
ihdr.writeUInt32BE(H, 4)
ihdr.set([8, 2, 0, 0, 0], 8)
writeFileSync(
  out,
  Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0))
  ])
)
console.log(`wrote ${out} (${W}x${H})`)
