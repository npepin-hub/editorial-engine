import { AsyncLocalStorage } from "async_hooks";

export type AxisEvent =
  | { type: "tool_call"; tool: string; input: string }
  | { type: "tool_done"; tool: string; summary: string }
  | { type: "distilling" }
  | { type: "done"; topics: unknown[] }
  | { type: "error"; message: string };

type EmitFn = (event: AxisEvent) => void;

const storage = new AsyncLocalStorage<EmitFn>();

export function withEmitter<T>(fn: EmitFn, cb: () => Promise<T>): Promise<T> {
  return storage.run(fn, cb);
}

export function emit(event: AxisEvent): void {
  storage.getStore()?.(event);
}

// Pass this as `onStepFinish` to agent.generate() to stream tool activity.
// Mastra's LLMStepResult wraps calls/results in chunks with a `.payload` field.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function onStepFinish(step: any) {
  for (const tc of step.toolCalls ?? []) {
    const p = tc.payload ?? tc;
    const toolName: string = p.toolName ?? tc.toolName ?? "tool";
    const args = p.args ?? tc.args;
    const input = typeof args === "string" ? args : JSON.stringify(args ?? "");
    emit({ type: "tool_call", tool: toolName, input });
  }
  for (const tr of step.toolResults ?? []) {
    const p = tr.payload ?? tr;
    const toolName: string = p.toolName ?? tr.toolName ?? "tool";
    const raw = p.result ?? tr.result;
    const text = typeof raw === "string" ? raw : JSON.stringify(raw);
    const summary = text.length > 80 ? text.slice(0, 80) + "…" : text;
    emit({ type: "tool_done", tool: toolName, summary });
  }
}
