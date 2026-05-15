import { gapAgent } from "@/mastra/agents/gapAgent";
import { distillAgent } from "@/mastra/agents/distillAgent";
import { AxisOutputSchema } from "@/lib/types";
import { handleApiError } from "@/lib/apiError";
import { trace } from "@/lib/trace";
import { withEmitter, emit, onStepFinish } from "@/lib/emitter";

const encoder = new TextEncoder();

export async function POST(req: Request) {
  try {
    const { focusArea } = await req.json();
    trace("axis:gap:start", { focusArea: focusArea || "" });

    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: unknown) =>
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

        try {
          await withEmitter(send, async () => {
            const result = await gapAgent.generate(
              `Research Vercel's blog and docs for content gaps. Find underrepresented or missing topics.
${focusArea ? `Focus area: ${focusArea}` : ""}`,
              { maxSteps: 5, onStepFinish }
            );
            trace("axis:gap:agent:done", { chars: result.text.length });

            emit({ type: "distilling" });
            const { object: topics } = await distillAgent.generate(
              `Distill these research findings into content signals. Return an empty array if findings are sparse.\n\n${result.text}`,
              { structuredOutput: { schema: AxisOutputSchema } }
            );
            trace("axis:gap:distill:done", { topics: topics.length });

            emit({ type: "done", topics });
          });
        } catch (err) {
          send({ type: "error", message: String(err) });
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
