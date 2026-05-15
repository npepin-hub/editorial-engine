import { NextResponse } from "next/server";

function extractStatusCode(error: unknown): number {
  if (!error || typeof error !== "object") return 500;
  const e = error as Record<string, unknown>;
  // Direct statusCode (AI_APICallError thrown directly)
  if (typeof e.statusCode === "number") return e.statusCode;
  // Mastra wraps it: { error: AI_APICallError, runId, provider, ... }
  if (e.error && typeof e.error === "object") {
    const inner = e.error as Record<string, unknown>;
    if (typeof inner.statusCode === "number") return inner.statusCode;
  }
  // cause chain
  if (e.cause && typeof e.cause === "object") {
    const cause = e.cause as Record<string, unknown>;
    if (typeof cause.statusCode === "number") return cause.statusCode;
  }
  return 500;
}

export function handleApiError(error: unknown): NextResponse {
  const statusCode = extractStatusCode(error);

  let userMessage = "An unexpected error occurred. Please try again.";
  if (statusCode === 429) {
    userMessage = "Rate limit reached. Please wait a moment and try again.";
  } else if (statusCode === 400) {
    userMessage = "Invalid request sent to the AI gateway. Check model configuration.";
  } else if (statusCode >= 500) {
    userMessage = "The AI gateway returned a server error. Please try again.";
  }

  const msg = (error as Record<string, unknown>)?.message ?? String(error);
  console.error(`[API error ${statusCode}]`, msg);

  return NextResponse.json(
    { error: userMessage, statusCode },
    { status: statusCode === 429 ? 429 : statusCode >= 500 ? 502 : 400 }
  );
}
