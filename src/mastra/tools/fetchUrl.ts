import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { tvly } from "@/lib/tavily";
import { trace } from "@/lib/trace";
import { emit } from "@/lib/emitter";

export const fetchUrlTool = createTool({
  id: "fetch-url",
  description: "Fetch and extract content from a URL",
  inputSchema: z.object({ url: z.string().url() }),
  outputSchema: z.object({ content: z.string() }),
  execute: async (inputData) => {
    trace("tool:fetchUrl", { url: inputData.url });
    emit({ type: "tool_call", tool: "fetchUrl", input: inputData.url });
    const result = await tvly.extract([inputData.url]);
    const content = result.results[0]?.rawContent ?? "";
    trace("tool:fetchUrl:done", { chars: content.length });
    emit({ type: "tool_done", tool: "fetchUrl", summary: `${(content.length / 1000).toFixed(0)}k chars` });
    return { content };
  }
});
