// Runs src/worker.ts's activate(orca) over a mock host.
import { assert, mockHost, mountWorker, test } from 'orca/testing'
import * as main from './worker'

const settle = () => new Promise((r) => setTimeout(r, 20))

test('a finished tool call adds EXP and tells open panels, without changing the call', async () => {
  const host = mockHost({ storage: { xp: { t1: 5 } } })
  const worker = await mountWorker(main, { host })
  const event = {
    agent: 'claude',
    workspaceId: 'w1',
    terminalId: 't1',
    tool: 'Bash',
    input: { command: 'npm test' }
  }
  const decision = await worker.hooks.fire('agent.tool.after', event)
  assert.equal(decision.kind, 'continue')
  await settle()
  assert.deepEqual(worker.posts, [
    {
      event: 'party.action',
      payload: { terminalId: 't1', agent: 'claude', tool: 'Bash', detail: 'npm test', xp: 7 }
    }
  ])
  assert.deepEqual(host.data().storage, { xp: { t1: 7 } })
  assert.deepEqual(await worker.request('party.xp'), { xp: { t1: 7 } })
  assert.deepEqual(worker.refusals, [])
  await worker.deactivate()
})

test('quick tool calls in a row never lose EXP', async () => {
  const host = mockHost()
  const worker = await mountWorker(main, { host })
  const base = { agent: 'codex', workspaceId: null, terminalId: 't2', input: {} }
  await Promise.all([
    worker.hooks.fire('agent.tool.after', { ...base, tool: 'Read' }),
    worker.hooks.fire('agent.tool.after', { ...base, tool: 'Edit' }),
    worker.hooks.fire('agent.tool.after', { ...base, tool: 'Read' })
  ])
  await settle()
  assert.deepEqual(host.data().storage, { xp: { t2: 5 } })
  await worker.deactivate()
})

test('a call without a terminal still animates but stores nothing', async () => {
  const host = mockHost()
  const worker = await mountWorker(main, { host })
  await worker.hooks.fire('agent.tool.after', { agent: 'claude', workspaceId: null, tool: 'Grep', input: { pattern: 'TODO' } })
  await settle()
  assert.equal(worker.posts.length, 1)
  assert.deepEqual(host.data().storage, {})
  await worker.deactivate()
})
