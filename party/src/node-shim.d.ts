// The two Node APIs src/worker.ts uses, declared here so type-checking needs no @types/node.
declare module 'node:child_process' {
  export function execFile(
    file: string,
    args: readonly string[],
    options: { timeout?: number; maxBuffer?: number },
    callback: (error: Error | null, stdout: string, stderr: string) => void
  ): unknown
}

declare const process: {
  readonly env: Record<string, string | undefined>
  readonly execPath: string
}
