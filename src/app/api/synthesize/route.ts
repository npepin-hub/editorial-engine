import { NextResponse } from "next/server";
import { distillAgent } from "@/mastra/agents/distillAgent";
import { SynthesisOutputSchema } from "@/lib/types";
import { handleApiError } from "@/lib/apiError";
import { trace } from "@/lib/trace";

export async function POST(req: Request) {
  try {
    const { axisOutputs } = await req.json();
    trace("synthesize:start", { axisCount: axisOutputs.length });

    const { object: ranked } = await distillAgent.generate(
      `Rank and synthesize these content signals into a list of 5–7 topics.
Deduplicate overlapping signals. Set sustainedSignal to false for all topics.
Apply frontier bias — prefer topics that are new, underserved, or timely over safe familiar ground.

Axis outputs:
${JSON.stringify(axisOutputs)}`,
      { structuredOutput: { schema: SynthesisOutputSchema } }
    );

    trace("synthesize:done", { ranked: ranked.length });
    return NextResponse.json({ topics: ranked });
  } catch (error) {
    return handleApiError(error);
  }
}
