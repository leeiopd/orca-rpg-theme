// Rules shared by the worker and the panel: which motion a tool plays, how much EXP it gives,
// and how EXP turns into a level. Pure functions, tested in src/game.test.ts.
import type { ClassId, Motion } from './sprites'

export type AgentState = 'working' | 'blocked' | 'waiting' | 'done'

const TOOL_MOTIONS: [RegExp, Motion][] = [
  [/^(bash|powershell|shell|run|monitor|exec|exec_command|local_shell)$/i, 'cast'],
  [/^(read|grep|glob|search|list|ls|skill|lsp|notebookread|view)$/i, 'read'],
  [/^(edit|write|multiedit|update|create|apply_patch|notebookedit)$/i, 'rune'],
  [/^(websearch|webfetch|fetch|web_search|browser.*)$/i, 'fly'],
  [/^(agent|task|explore|plan|spawn_agent)$/i, 'summon']
]

/** The motion a finished tool call plays. MCP tools (`mcp__server__tool`) and unknown tools cast. */
export function motionForTool(tool: string): Motion {
  const name = tool.startsWith('mcp__') ? tool.split('__').pop() ?? tool : tool
  for (const [re, motion] of TOOL_MOTIONS) if (re.test(name)) return motion
  return 'cast'
}

/** EXP for one tool call: edits and subagents are worth more than reads. */
export function xpForTool(tool: string): number {
  const motion = motionForTool(tool)
  return motion === 'rune' || motion === 'summon' ? 3 : motion === 'cast' ? 2 : 1
}

/** Level n needs 10 * n * (n + 1) / 2 total EXP: 10, 30, 60, 100, ... */
export function levelForXp(xp: number): { level: number; into: number; need: number } {
  let level = 1
  let floor = 0
  while (xp >= floor + level * 10) {
    floor += level * 10
    level++
  }
  return { level, into: xp - floor, need: level * 10 }
}

/**
 * Terminal handles in the order Orca shows them: tab groups left to right, tabs in strip order,
 * panes in split order. Reads the `visualLayouts` of `orca terminal list --include-visual-layouts`
 * by walking it depth first, so any split shape keeps its order.
 */
export function handlesInTabOrder(layouts: unknown): string[] {
  const out: string[] = []
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) return node.forEach(walk)
    if (!node || typeof node !== 'object') return
    const o = node as Record<string, unknown>
    if (o.type === 'terminal' && typeof o.handle === 'string') {
      if (!out.includes(o.handle)) out.push(o.handle)
      return
    }
    Object.values(o).forEach(walk)
  }
  walk(layouts)
  return out
}

/** Sorts rows by their position in `order`; rows not in it keep their relative order at the end. */
export function sortByOrder<T>(rows: T[], idOf: (row: T) => string | null, order: string[]): T[] {
  const pos = new Map(order.map((id, i) => [id, i]))
  return rows
    .map((row, i) => ({ row, i, p: pos.get(idOf(row) ?? '') ?? Number.MAX_SAFE_INTEGER }))
    .sort((a, b) => a.p - b.p || a.i - b.i)
    .map((x) => x.row)
}

export const CLASSES: ClassId[] =['mage', 'warrior', 'ranger', 'cleric', 'rogue']

const CLASS_WORDS: [RegExp, ClassId][] = [
  [/mage|wizard|마법사/i, 'mage'],
  [/warrior|knight|전사|기사/i, 'warrior'],
  [/ranger|archer|레인저|궁수/i, 'ranger'],
  [/cleric|priest|healer|성직자|사제|힐러/i, 'cleric'],
  [/rogue|thief|assassin|도적|암살자/i, 'rogue']
]

/** A class named in the tab title ("Fern 마법사", "warrior"), if any. */
export function classFromTitle(title: string | null | undefined): ClassId | null {
  for (const [re, cls] of CLASS_WORDS) if (re.test(title ?? '')) return cls
  return null
}

/**
 * Gives each member a class: a class named in its tab title wins, then the class it was given
 * before (by terminal id), and a new member gets the class used least in the party so far.
 * Returns the classes in member order and the updated saved table.
 */
export function assignClasses(
  members: { id: string | null; title: string | null }[],
  saved: Record<string, ClassId>
): { classes: ClassId[]; saved: Record<string, ClassId> } {
  const next = { ...saved }
  const classes: (ClassId | null)[] = members.map((m) => classFromTitle(m.title) ?? (m.id ? next[m.id] ?? null : null))
  const used = (cls: ClassId) => classes.filter((c) => c === cls).length
  members.forEach((m, i) => {
    if (classes[i]) return
    const pick = [...CLASSES].sort((a, b) => used(a) - used(b))[0]
    classes[i] = pick
  })
  members.forEach((m, i) => {
    if (m.id) next[m.id] = classes[i] as ClassId
  })
  return { classes: classes as ClassId[], saved: next }
}

export const CLASS_LABEL: Record<ClassId, string> = {
  mage: 'Mage',
  warrior: 'Warrior',
  ranger: 'Ranger',
  cleric: 'Cleric',
  rogue: 'Rogue'
}

const VERB: Record<Motion, string> = {
  idle: 'stands by',
  walk: 'walks on',
  cast: 'casts a spell',
  read: 'reads the grimoire',
  rune: 'carves runes',
  fly: 'scouts the skies',
  summon: 'summons an ally',
  help: 'calls for help',
  victory: 'clears the quest',
  sleep: 'rests'
}

export function battleLine(cls: ClassId, motion: Motion, detail?: string): string {
  const who = CLASS_LABEL[cls]
  const line = `${who} ${VERB[motion]}!`
  return detail ? `${line} ${detail}` : line
}

/** A short, single-line hint from a tool's input: the command, file name, query or URL host. */
export function detailForTool(tool: string, input: unknown): string {
  if (!input || typeof input !== 'object') return ''
  const o = input as Record<string, unknown>
  const pick = (v: unknown) => (typeof v === 'string' ? v : '')
  let s =
    pick(o.command) ||
    pick(o.description) ||
    pick(o.pattern) ||
    pick(o.query) ||
    pick(o.file_path) ||
    pick(o.path) ||
    pick(o.url) ||
    pick(o.prompt)
  if (o.file_path || o.path) s = s.split('/').pop() ?? s
  if (o.url && !o.command) {
    try {
      s = new URL(s).host
    } catch {
      /* keep the raw text */
    }
  }
  s = s.replace(/\s+/g, ' ').trim()
  void tool
  return s.length > 48 ? `${s.slice(0, 47)}…` : s
}

/** What a card shows when no tool motion is playing. */
export function motionForState(state: AgentState, sinceMs: number): Motion {
  switch (state) {
    case 'working':
      return 'walk'
    case 'blocked':
      return 'help'
    case 'done':
      return sinceMs < 15_000 ? 'victory' : 'sleep'
    case 'waiting':
      return 'sleep'
  }
}

export const STATE_LABEL: Record<AgentState, string> = {
  working: 'Adventuring',
  blocked: 'Needs help',
  waiting: 'Resting',
  done: 'Quest complete'
}
