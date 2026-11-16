// The panel <-> worker contract, declared once: src/panel.ts and src/worker.ts both read it.
export {}

declare module 'orca' {
  interface PluginRequests {
    /** EXP per terminal the worker has stored. */
    'party.xp': { output: { xp: Record<string, number> } }
    /** Terminal handles in tab order across all workspaces; empty when Orca's CLI cannot answer. */
    'party.order': { output: { order: string[] } }
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
  }
}
