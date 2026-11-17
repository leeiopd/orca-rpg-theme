// Party panel: one card per agent in the focused workspace. Each card's pixel member plays the
// motion for the agent's state, or for the tool call the worker just reported.
// Untrusted text (tab titles, commands) is only ever set through textContent.
import './protocol'
import {
  assignClasses,
  battleLine,
  CLASS_LABEL,
  CLASSES,
  levelForXp,
  motionForState,
  motionForTool,
  sortByOrder,
  STATE_LABEL,
  type AgentState
} from './game'
import { drawFrame, FRAMES, GRID, type ClassId, type Motion } from './sprites'

const SCALE = 2
const FRAME_MS = 220
const ACTION_MS = 4_000

type Member = {
  terminalId: string | null
  title: string
  agent: string
  cls: ClassId
  state: AgentState
  since: number
  action: { motion: Motion; until: number; line: string } | null
  log: string
  xp: number
  el: {
    root: HTMLElement
    canvas: HTMLCanvasElement
    name: HTMLElement
    job: HTMLElement
    status: HTMLElement
    level: HTMLElement
    bar: HTMLElement
    exp: HTMLElement
    log: HTMLElement
  }
  drawn: string
}

const STYLE = `
:root { color-scheme: dark; }
body { margin: 0; padding: 10px; font: 12px/1.45 system-ui, sans-serif;
  color: var(--orca-foreground); background: var(--orca-background); }
.head { display: flex; justify-content: space-between; align-items: baseline;
  padding: 6px 10px; margin-bottom: 10px; border: 2px solid var(--orca-primary);
  box-shadow: inset 0 0 0 2px var(--orca-background), inset 0 0 0 3px var(--orca-border);
  background: var(--orca-card); }
.head b { color: var(--orca-primary); letter-spacing: .08em; }
.head span { color: var(--orca-muted-foreground); }
.card { display: grid; grid-template-columns: ${GRID * SCALE}px 1fr; gap: 4px 10px;
  padding: 8px; margin-bottom: 8px; background: var(--orca-card);
  border: 2px solid var(--orca-border); }
.card.working { border-color: #8ab4ff; }
.card.blocked { border-color: #ff7f70; }
.card.done { border-color: var(--orca-primary); }
canvas { width: ${GRID * SCALE}px; height: ${GRID * SCALE}px; image-rendering: pixelated;
  background: radial-gradient(ellipse at 50% 85%, rgba(255,255,255,.06), transparent 60%); }
.info { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.row { display: flex; justify-content: space-between; gap: 6px; }
.name { font-weight: 600; color: var(--orca-card-foreground); overflow: hidden;
  text-overflow: ellipsis; white-space: nowrap; }
.lv { color: var(--orca-primary); font-weight: 700; white-space: nowrap; }
.job { color: var(--orca-muted-foreground); }
.job i { font-style: normal; color: #9ff0d8; }
.status { font-weight: 600; }
.working .status { color: #8ab4ff; }
.blocked .status { color: #ff7f70; }
.done .status { color: var(--orca-primary); }
.waiting .status { color: var(--orca-muted-foreground); }
.bar { height: 6px; background: var(--orca-muted); border: 1px solid var(--orca-border); }
.bar > div { height: 100%; background: linear-gradient(90deg, #ffcf66, #ffe39a); }
.exp { color: var(--orca-muted-foreground); font-size: 11px; }
.log { grid-column: 1 / -1; color: var(--orca-muted-foreground); font-family: ui-monospace, monospace;
  font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  border-top: 1px dashed var(--orca-border); padding-top: 4px; }
.log::before { content: '▶ '; color: var(--orca-primary); }
.empty { color: var(--orca-muted-foreground); padding: 16px 4px; text-align: center; }
`

const sprites = new Map<string, HTMLCanvasElement>()
function spriteCanvas(cls: ClassId, motion: Motion, frame: number): HTMLCanvasElement {
  const key = `${cls}/${motion}/${frame}`
  let c = sprites.get(key)
  if (c) return c
  c = document.createElement('canvas')
  c.width = GRID
  c.height = GRID
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(GRID, GRID)
  drawFrame(cls, motion, frame).forEach((color, i) => {
    if (!color) return
    img.data[i * 4] = parseInt(color.slice(1, 3), 16)
    img.data[i * 4 + 1] = parseInt(color.slice(3, 5), 16)
    img.data[i * 4 + 2] = parseInt(color.slice(5, 7), 16)
    img.data[i * 4 + 3] = 255
  })
  ctx.putImageData(img, 0, 0)
  sprites.set(key, c)
  return c
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag)
  if (cls) e.className = cls
  if (text !== undefined) e.textContent = text
  return e
}

const style = el('style')
style.textContent = STYLE
document.head.append(style)
const header = el('div', 'head')
const title = el('b', undefined, 'PARTY')
const count = el('span')
header.append(title, count)
const list = el('div')
document.body.append(header, list)

let members: Member[] = []
let xpTable: Record<string, number> = {}
// v2: classes saved before the tie-break fix were mostly mage; start them over once.
const CLASS_KEY = 'classes.v2'
let savedClasses: Record<string, ClassId> = {}

function buildCard(m: Omit<Member, 'el' | 'drawn'>): Member {
  const root = el('div', 'card')
  const canvas = el('canvas')
  canvas.width = GRID * SCALE
  canvas.height = GRID * SCALE
  const info = el('div', 'info')
  const top = el('div', 'row')
  const name = el('span', 'name')
  const level = el('span', 'lv')
  top.append(name, level)
  const job = el('div', 'job')
  const status = el('div', 'status')
  const bar = el('div', 'bar')
  const fill = el('div')
  bar.append(fill)
  const exp = el('div', 'exp')
  info.append(top, job, status, bar, exp)
  const log = el('div', 'log')
  root.append(canvas, info, log)
  return { ...m, el: { root, canvas, name, job, status, level, bar: fill, exp, log }, drawn: '' }
}

function renderText(m: Member): void {
  m.el.root.className = `card ${m.state}`
  m.el.name.textContent = m.title
  m.el.name.title = m.title
  m.el.job.textContent = `${CLASS_LABEL[m.cls]} · `
  m.el.job.append(el('i', undefined, m.agent || 'agent'))
  m.el.status.textContent = STATE_LABEL[m.state]
  const lv = levelForXp(m.xp)
  m.el.level.textContent = `Lv ${lv.level}`
  m.el.bar.style.width = `${Math.round((lv.into / lv.need) * 100)}%`
  m.el.exp.textContent = `EXP ${lv.into} / ${lv.need}`
  m.el.log.textContent = m.log
}

function currentMotion(m: Member, now: number): Motion {
  if (m.action && now < m.action.until) return m.action.motion
  m.action = null
  return motionForState(m.state, now - m.since)
}

type AgentRow = {
  terminalId: string | null
  title: string | null
  agent: string | null
  state: AgentState
  stateStartedAt: number
}

async function tabOrder(): Promise<string[]> {
  try {
    return (await orca.plugin.request('party.order')).order
  } catch {
    return []
  }
}

/** Tabs can be dragged without any event, so check the order now and then. */
async function reorder(): Promise<void> {
  if (demo || members.length < 2) return
  const sorted = sortByOrder(members, (m) => m.terminalId, await tabOrder())
  if (sorted.every((m, i) => m === members[i])) return
  members = sorted
  list.replaceChildren(...members.map((m) => m.el.root))
}

/** Fixed sample members shown in demo mode (for screenshots); never mixed with real agents. */
const DEMO: { title: string; agent: string; cls: ClassId; state: AgentState; motion: Motion; detail: string; xp: number }[] = [
  { title: '결제 API 리팩터링', agent: 'claude', cls: 'mage', state: 'working', motion: 'cast', detail: 'npm test', xp: 64 },
  { title: '주문 화면 버그 수정', agent: 'codex', cls: 'warrior', state: 'working', motion: 'rune', detail: 'order-list.tsx', xp: 132 },
  { title: 'TODO 정리', agent: 'claude', cls: 'ranger', state: 'working', motion: 'read', detail: 'TODO', xp: 23 },
  { title: '배포 승인 대기', agent: 'claude', cls: 'cleric', state: 'blocked', motion: 'help', detail: '', xp: 41 },
  { title: '릴리스 노트 작성', agent: 'codex', cls: 'rogue', state: 'done', motion: 'victory', detail: '', xp: 198 }
]
let demo = false

function showDemo(): void {
  members = DEMO.map((d, i) =>
    buildCard({
      terminalId: `demo-${i}`,
      title: d.title,
      agent: d.agent,
      cls: d.cls,
      state: d.state,
      since: Date.now(),
      action: { motion: d.motion, until: Number.POSITIVE_INFINITY, line: '' },
      log: battleLine(d.cls, d.motion, d.detail || undefined),
      xp: d.xp
    })
  )
  list.replaceChildren(...members.map((m) => m.el.root))
  count.textContent = `${members.length} members · demo`
  members.forEach(renderText)
}

async function refresh(): Promise<void> {
  if (demo) return showDemo()
  let agents: AgentRow[] = []
  try {
    agents = ((await orca.host.call('agents.list')) as { agents: AgentRow[] }).agents
  } catch {
    agents = []
  }
  agents = sortByOrder(agents, (a) => a.terminalId, await tabOrder())
  const old = new Map(members.map((m) => [m.terminalId, m]))
  const assigned = assignClasses(
    agents.map((a) => ({ id: a.terminalId, title: a.title })),
    savedClasses
  )
  savedClasses = assigned.saved
  void orca.storage.set(CLASS_KEY, savedClasses).catch(() => undefined)
  members = agents.map((a, i) => {
    const prev = old.get(a.terminalId)
    const cls = assigned.classes[i]
    if (prev && prev.cls !== cls) {
      // The class changed (renamed tab): redraw and drop text that names the old class.
      prev.drawn = ''
      prev.action = null
      prev.log = ''
    }
    const base = {
      terminalId: a.terminalId,
      title: a.title || `Member ${i + 1}`,
      agent: a.agent ?? '',
      cls,
      state: a.state,
      since: a.stateStartedAt || Date.now(),
      action: prev?.action ?? null,
      log: prev?.log || battleLine(cls, motionForState(a.state, Date.now() - (a.stateStartedAt || Date.now()))),
      xp: (a.terminalId && xpTable[a.terminalId]) || 0
    }
    if (prev) {
      Object.assign(prev, base)
      return prev
    }
    return buildCard(base)
  })
  list.replaceChildren(...members.map((m) => m.el.root))
  if (!members.length) list.append(el('div', 'empty', 'No adventurers in this workspace yet.'))
  count.textContent = `${members.length} member${members.length === 1 ? '' : 's'}`
  members.forEach(renderText)
}

function tick(now: number): void {
  const t = Date.now()
  for (const m of members) {
    const motion = currentMotion(m, t)
    const frame = Math.floor(now / FRAME_MS) % FRAMES[motion]
    const key = `${m.cls}/${motion}/${frame}`
    if (key === m.drawn) continue
    m.drawn = key
    const ctx = m.el.canvas.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, m.el.canvas.width, m.el.canvas.height)
    ctx.drawImage(spriteCanvas(m.cls, motion, frame), 0, 0, GRID * SCALE, GRID * SCALE)
  }
  requestAnimationFrame(tick)
}

orca.on('agent.status.changed', (p) => {
  if (demo) return
  const m = members.find((x) => p.terminalId && x.terminalId === p.terminalId)
  if (!m) return void refresh()
  m.state = p.state
  m.since = p.receivedAt || Date.now()
  if (p.title) m.title = p.title
  if (!m.action) m.log = battleLine(m.cls, motionForState(m.state, 0))
  renderText(m)
})
orca.on('workspace.changed', () => void refresh())

orca.plugin.on('party.demo', (p) => {
  demo = p.on
  members = []
  void refresh()
})

orca.plugin.on('party.action', (p) => {
  if (p.terminalId) xpTable[p.terminalId] = p.xp
  if (demo) return
  const m = members.find((x) => p.terminalId && x.terminalId === p.terminalId)
  if (!m) return
  const motion = motionForTool(p.tool)
  const line = battleLine(m.cls, motion, p.detail)
  m.action = { motion, until: Date.now() + ACTION_MS, line }
  m.log = line
  m.xp = p.xp
  renderText(m)
})

async function start(): Promise<void> {
  try {
    xpTable = (await orca.plugin.request('party.xp')).xp
  } catch {
    xpTable = {}
  }
  try {
    const stored = await orca.storage.get(CLASS_KEY)
    if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
      for (const [k, v] of Object.entries(stored))
        if (CLASSES.includes(v as ClassId)) savedClasses[k] = v as ClassId
    }
  } catch {
    savedClasses = {}
  }
  try {
    demo = (await orca.storage.get('demo')) === true
  } catch {
    demo = false
  }
  await refresh()
  setInterval(() => void reorder(), 5_000)
}
void start()
requestAnimationFrame(tick)
