import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { tvly } from "@/lib/tavily";
import { trace } from "@/lib/trace";
import { emit } from "@/lib/emitter";

const COMPETITOR_DOMAINS = [
  "netlify.com", "blog.cloudflare.com", "railway.com",
  "lovable.dev", "github.blog"
];

export const searchCompetitorTool = createTool({
  id: "search-competitor",
  description: "Search competitor blogs for content Vercel hasn't covered",
  inputSchema: z.object({ query: z.string() }),
  outputSchema: z.object({ results: z.string() }),
  execute: async (inputData) => {
    trace("tool:searchCompetitor", { query: inputData.query });
    emit({ type: "tool_call", tool: "searchCompetitor", input: inputData.query });
    const result = await tvly.search(inputData.query, {
      includeDomains: COMPETITOR_DOMAINS,
      maxResults: 10
    });
    trace("tool:searchCompetitor:done", { hits: result.results.length });
    emit({ type: "tool_done", tool: "searchCompetitor", summary: `${result.results.length} results` });
    return {
      results: result.results
        .map(r => `${r.title}\n${r.url}\n${r.content}`)
        .join("\n\n---\n\n")
    };
  }
});
