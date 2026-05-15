import { handleChatStream } from "@mastra/ai-sdk";
import { createUIMessageStreamResponse } from "ai";
import { mastra } from "@/mastra";
import { handleApiError } from "@/lib/apiError";

export async function POST(req: Request) {
  try {
    const { messages, topics } = await req.json();

    const messagesWithContext = topics?.length
      ? [
          {
            role: "system" as const,
            content: `Current ranked topic list:\n${JSON.stringify(topics, null, 2)}`
          },
          ...messages
        ]
      : messages;

    const stream = await handleChatStream({
      mastra,
      agentId: "editorial-agent",
      params: {
        messages: messagesWithContext
      },
      version: "v6"
    });

    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    return handleApiError(error);
  }
}
