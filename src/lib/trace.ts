const enabled = process.env.TRACE_ENABLED === "true";

export function trace(label: string, data?: Record<string, unknown>) {
  if (!enabled) return;
  const ts = new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
  const parts = [`[${ts}] ${label}`];
  if (data) {
    parts.push(
      Object.entries(data)
        .map(([k, v]) => `${k}=${typeof v === "string" ? `"${v}"` : JSON.stringify(v)}`)
        .join(" ")
    );
  }
  console.log(parts.join(" | "));
}
