import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { tvly } from "@/lib/tavily";
import { trace } from "@/lib/trace";
import { emit } from "@/lib/emitter";

export const searchCommunityTool = createTool({
  id: "search-community",
  description: "Search Reddit and Hacker News for developer discussions",
  inputSchema: z.object({ query: z.string() }),
  outputSchema: z.object({ results: z.string() }),
  execute: async (inputData) => {
    trace("tool:searchCommunity", { query: inputData.query });
    emit({ type: "tool_call", tool: "searchCommunity", input: inputData.query });
    const result = await tvly.search(inputData.query, {
      includeDomains: ["reddit.com", "news.ycombinator.com"],
      maxResults: 10
    });
    trace("tool:searchCommunity:done", { hits: result.results.length });
    emit({ type: "tool_done", tool: "searchCommunity", summary: `${result.results.length} results` });
    return {
      results: result.results
        .map(r => `${r.title}\n${r.url}\n${r.content}`)
        .join("\n\n---\n\n")
    };
  }
});
