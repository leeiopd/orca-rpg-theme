// Watches finished tool calls (observe-only hook: Orca never waits on it), adds EXP to the
// agent's terminal, and tells open Party panels so the member plays the tool's motion.
import type { OrcaWorkerApi } from 'orca/worker'
import { detailForTool, xpForTool } from './game'

const XP_KEY = 'xp'
const MAX_ENTRIES = 200

type XpTable = Record<string, number>

function asTable(value: unknown): XpTable {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const out: XpTable = {}
  for (const [k, v] of Object.entries(value)) if (typeof v === 'number') out[k] = v
  return out
}

export default function activate(orca: OrcaWorkerApi): void {
  // Storage writes run one at a time so two quick tool calls never lose EXP.
  let chain: Promise<unknown> = Promise.resolve()

  orca.panels.handle('party.xp', async () => ({ xp: asTable(await orca.storage.get(XP_KEY)) }))

  orca.hooks.on('agent.tool.after', (event) => {
    const key = event.terminalId ?? null
    const gain = xpForTool(event.tool)
    chain = chain.then(async () => {
      let xp = 0
      if (key) {
        const table = asTable(await orca.storage.get(XP_KEY))
        xp = (table[key] ?? 0) + gain
        table[key] = xp
        const keys = Object.keys(table)
        if (keys.length > MAX_ENTRIES) for (const k of keys.slice(0, keys.length - MAX_ENTRIES)) delete table[k]
        await orca.storage.set(XP_KEY, table)
      }
      orca.panels.post('party.action', {
        terminalId: key,
        agent: event.agent,
        tool: event.tool,
        detail: detailForTool(event.tool, event.input),
        xp
      })
    })
    // Observe only: return nothing so Orca carries on at once.
  })
}
