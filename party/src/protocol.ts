// The panel <-> worker contract, declared once: src/panel.ts and src/worker.ts both read it.
export {}

declare module 'orca' {
  interface PluginRequests {
    /** EXP per terminal the worker has stored. */
    'party.xp': { output: { xp: Record<string, number> } }
    /** Terminal handles in tab order across all workspaces; empty when Orca's CLI cannot answer. */
    'party.order': { output: { order: string[] } }
    /** Turns the demo party (fixed sample members, for screenshots) on or off. */
    'party.demo': { input: { on: boolean }; output: { on: boolean } }
  }
  interface PluginPanelEvents {
    /** Posted after an agent finishes a tool call. */
    'party.action': {
      terminalId: string | null
      agent: string
      tool: string
      detail: string
      xp: number
    }
    /** The demo party was turned on or off. */
    'party.demo': { on: boolean }
  }
}
