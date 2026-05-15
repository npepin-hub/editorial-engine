export const ALL_AXES = ["changelog", "community", "gap", "competitors"] as const;
export type Axis = typeof ALL_AXES[number];
export type AxisStatus = "idle" | "running" | "done" | "error";
export type AxisStatuses = Record<Axis, AxisStatus>;

export type AxisEvent =
  | { type: "tool_call"; tool: string; input: string }
  | { type: "tool_done"; tool: string; summary: string }
  | { type: "distilling" }
  | { type: "done"; topics: unknown[] }
  | { type: "error"; message: string };

const toolLabel: Record<string, string> = {
  fetchUrl: "fetch",
  searchCommunity: "search",
  searchCompetitor: "search",
};

function shortInput(input: string) {
  try {
    const u = new URL(input);
    return u.hostname + u.pathname.slice(0, 24);
  } catch {
    return input.length > 40 ? input.slice(0, 40) + "…" : input;
  }
}

interface LoadingStateProps {
  axisStatuses: AxisStatuses;
  axisEvents: Record<Axis, AxisEvent[]>;
  synthesizing: boolean;
  activeAxes?: Axis[];
}

export function LoadingState({ axisStatuses, axisEvents, synthesizing, activeAxes = [...ALL_AXES] }: LoadingStateProps) {
  return (
    <div className="space-y-4">
      {activeAxes.map(axis => {
        const status = axisStatuses[axis];
        const events = axisEvents[axis] ?? [];

        return (
          <div key={axis} className="space-y-1.5">
            {/* Axis header */}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 flex-shrink-0 flex items-center justify-center">
                {status === "running" && <div className="w-3 h-3 rounded-full border-2 border-zinc-200 border-t-zinc-500 animate-spin" />}
                {status === "done"    && <span className="text-green-600 text-xs">✓</span>}
                {status === "error"   && <span className="text-red-500 text-xs">✕</span>}
                {status === "idle"    && <div className="w-3 h-3 rounded-full border-2 border-zinc-200" />}
              </div>
              <span className={`text-xs font-mono capitalize ${
                status === "idle"    ? "text-zinc-400"
                : status === "running" ? "text-zinc-700"
                : status === "done"    ? "text-zinc-500"
                : "text-red-500"
              }`}>{axis}</span>
            </div>

            {/* Live event feed */}
            {events.length > 0 && (
              <div className="ml-5 space-y-1">
                {events.map((ev, i) => {
                  if (ev.type === "tool_call") return (
                    <div key={i} className="flex items-baseline gap-1.5 text-[11px]">
                      <span className="text-zinc-300 font-mono">→</span>
                      <span className="text-zinc-400 font-mono">{toolLabel[ev.tool] ?? ev.tool}</span>
                      <span className="text-zinc-500 truncate">{shortInput(ev.input)}</span>
                    </div>
                  );
                  if (ev.type === "tool_done") return (
                    <div key={i} className="flex items-baseline gap-1.5 text-[11px]">
                      <span className="text-zinc-300 font-mono w-3" />
                      <span className="text-zinc-400">{ev.summary}</span>
                    </div>
                  );
                  if (ev.type === "distilling") return (
                    <div key={i} className="flex items-baseline gap-1.5 text-[11px]">
                      <span className="text-zinc-300 font-mono">→</span>
                      <span className="text-zinc-400 italic">distilling…</span>
                    </div>
                  );
                  return null;
                })}
              </div>
            )}
          </div>
        );
      })}

      {synthesizing && (
        <div className="flex items-center gap-2 pt-1">
          <div className="w-3 h-3 rounded-full border-2 border-zinc-200 border-t-zinc-500 animate-spin flex-shrink-0" />
          <span className="text-xs font-mono text-zinc-500">Synthesizing…</span>
        </div>
      )}
    </div>
  );
}
