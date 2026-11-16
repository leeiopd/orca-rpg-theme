// Watches finished tool calls (observe-only hook: Orca never waits on it), adds EXP to the
// agent's terminal, and tells open Party panels so the member plays the tool's motion.
import { execFile } from 'node:child_process'
import type { OrcaWorkerApi } from 'orca/worker'
import { detailForTool, handlesInTabOrder, xpForTool } from './game'

/** Orca's CLI next to the running app, else `orca` on PATH. */
function orcaCli(): string {
  if (process.env.ORCA_CLI_COMMAND) return process.env.ORCA_CLI_COMMAND
  const at = process.execPath.indexOf('.app/Contents/')
  return at >= 0 ? `${process.execPath.slice(0, at)}.app/Contents/Resources/bin/orca` : 'orca'
}

/** The plugin API has no tab order, so read it from the CLI's visual layouts (read only). */
export type ReadLayouts = () => Promise<unknown>
const readLayoutsFromCli: ReadLayouts = () =>
  new Promise((resolve) => {
    execFile(
      orcaCli(),
      ['terminal', 'list', '--include-visual-layouts', '--limit', '200', '--json'],
      { timeout: 5_000, maxBuffer: 8 * 1024 * 1024 },
      (err, stdout) => {
        if (err) return resolve(null)
        try {
          resolve(JSON.parse(stdout)?.result?.visualLayouts ?? null)
        } catch {
          resolve(null)
        }
      }
    )
  })

/** Tests replace this to avoid running the CLI. */
export const deps: { readLayouts: ReadLayouts } = { readLayouts: readLayoutsFromCli }

const XP_KEY = 'xp'
const DEMO_KEY = 'demo'
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

  // Demo party for screenshots: `orca plugin dev request . party.demo --data '{"on":true}'`.
  orca.panels.handle('party.demo', async ({ on }) => {
    await orca.storage.set(DEMO_KEY, on === true)
    orca.panels.post('party.demo', { on: on === true })
    return { on: on === true }
  })

  // One CLI run serves every panel request made within a second.
  let cached: { at: number; order: Promise<string[]> } | null = null
  orca.panels.handle('party.order', async () => {
    if (!cached || Date.now() - cached.at > 1_000) {
      cached = { at: Date.now(), order: deps.readLayouts().then(handlesInTabOrder) }
    }
    return { order: await cached.order }
  })

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
