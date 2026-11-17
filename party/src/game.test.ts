import { assert, test } from 'orca/testing'
import { assignClasses, classFromTitle, detailForTool, handlesInTabOrder, sortByOrder, levelForXp, motionForState, motionForTool, xpForTool } from './game'
import { drawFrame, FRAMES, GRID, MOTIONS } from './sprites'

test('tools map to motions, MCP tools by their last segment', () => {
  assert.equal(motionForTool('Bash'), 'cast')
  assert.equal(motionForTool('Grep'), 'read')
  assert.equal(motionForTool('apply_patch'), 'rune')
  assert.equal(motionForTool('WebFetch'), 'fly')
  assert.equal(motionForTool('Agent'), 'summon')
  assert.equal(motionForTool('mcp__plugin_slack__read'), 'read')
  assert.equal(motionForTool('SomethingNew'), 'cast')
  assert.equal(xpForTool('Edit'), 3)
  assert.equal(xpForTool('Read'), 1)
})

test('levels need 10, 30, 60 total EXP', () => {
  assert.deepEqual(levelForXp(0), { level: 1, into: 0, need: 10 })
  assert.deepEqual(levelForXp(10), { level: 2, into: 0, need: 20 })
  assert.deepEqual(levelForXp(29), { level: 2, into: 19, need: 20 })
  assert.deepEqual(levelForXp(30), { level: 3, into: 0, need: 30 })
})

test('a party of the same agent still gets mixed classes, kept per terminal', () => {
  const six = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => ({ id, title: 'claude' }))
  const first = assignClasses(six, {})
  // The first five are all different; the same input gives the same classes.
  assert.equal(new Set(first.classes.slice(0, 5)).size, 5)
  assert.deepEqual(assignClasses(six, {}).classes, first.classes)
  // Reordered and with a new member: old members keep their class, the new one gets an unused one.
  const again = assignClasses([six[2], { id: 'g', title: null }, six[0], six[1]], first.saved)
  assert.deepEqual([again.classes[0], again.classes[2], again.classes[3]], [first.classes[2], first.classes[0], first.classes[1]])
  assert.ok(![first.classes[0], first.classes[1], first.classes[2]].includes(again.classes[1]))
})

test('the first member of a new party is not always the same class', () => {
  const firsts = new Set(Array.from({ length: 40 }, (_, i) => assignClasses([{ id: `term-${i}`, title: null }], {}).classes[0]))
  assert.equal(firsts.size, 5)
})

test('a class named in the tab title wins', () => {
  assert.equal(classFromTitle('Fern 마법사'), 'mage')
  assert.equal(classFromTitle('Stark the Warrior'), 'warrior')
  assert.equal(classFromTitle('궁수'), 'ranger')
  assert.equal(classFromTitle('힐러 세션'), 'cleric')
  assert.equal(classFromTitle('도적 길드'), 'rogue')
  assert.equal(classFromTitle('API 리뷰'), null)
  const r = assignClasses([{ id: 'a', title: '전사' }], { a: 'mage' })
  assert.deepEqual(r.classes, ['warrior'])
  assert.deepEqual(r.saved, { a: 'warrior' })
})

test('idle motions', () => {
  assert.equal(motionForState('done', 1_000), 'victory')
  assert.equal(motionForState('done', 60_000), 'sleep')
  assert.equal(motionForState('blocked', 0), 'help')
})

test('details are one short line', () => {
  assert.equal(detailForTool('Read', { file_path: '/a/b/c.ts' }), 'c.ts')
  assert.equal(detailForTool('WebFetch', { url: 'https://example.com/x' }), 'example.com')
  assert.equal(detailForTool('Bash', { command: 'echo  a\n  b' }), 'echo a b')
  assert.equal(detailForTool('Bash', { command: 'x'.repeat(80) }).length, 48)
  assert.equal(detailForTool('Bash', null), '')
})

test('every frame is a full grid of hex colors', () => {
  for (const cls of ['mage', 'warrior', 'ranger', 'cleric', 'rogue'] as const)
    for (const motion of MOTIONS)
      for (let f = 0; f < FRAMES[motion]; f++) {
        const px = drawFrame(cls, motion, f)
        assert.equal(px.length, GRID * GRID)
        assert.ok(px.every((c) => c === null || /^#[0-9a-f]{6}$/.test(c)))
        assert.ok(px.some((c) => c !== null))
      }
})

test('tab order follows the visual layout, not the terminal list', () => {
  const layouts = [
    {
      worktreeId: 'w1',
      root: {
        type: 'group',
        tabs: [
          { tabId: 'a', panes: { type: 'terminal', handle: 'term_a' } },
          { tabId: 'c', panes: { type: 'terminal', handle: 'term_c' } },
          {
            tabId: 'b',
            panes: { type: 'split', children: [{ type: 'terminal', handle: 'term_b1' }, { type: 'terminal', handle: 'term_b2' }] }
          }
        ]
      }
    }
  ]
  assert.deepEqual(handlesInTabOrder(layouts), ['term_a', 'term_c', 'term_b1', 'term_b2'])
  assert.deepEqual(handlesInTabOrder(null), [])
  const rows = [{ id: 'term_b2' }, { id: null }, { id: 'term_a' }, { id: 'term_x' }, { id: 'term_c' }]
  assert.deepEqual(
    sortByOrder(rows, (r) => r.id, handlesInTabOrder(layouts)).map((r) => r.id),
    ['term_a', 'term_c', 'term_b2', null, 'term_x']
  )
})
