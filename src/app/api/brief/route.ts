import { NextResponse } from "next/server";
import { distillAgent } from "@/mastra/agents/distillAgent";
import { BriefSchema, type RankedTopic } from "@/lib/types";
import { handleApiError } from "@/lib/apiError";

export async function POST(req: Request) {
  try {
    const { topic }: { topic: RankedTopic } = await req.json();

    const { object: brief } = await distillAgent.generate(
      `Generate a full content brief for this blog topic.\n\nTopic:\n${JSON.stringify(topic)}`,
      { structuredOutput: { schema: BriefSchema } }
    );

    return NextResponse.json({ brief });
  } catch (error) {
    return handleApiError(error);
  }
}
