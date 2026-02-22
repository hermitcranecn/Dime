import type { AgentTool, AgentToolResult } from "@mariozechner/pi-agent-core";
import type { PluginLogger } from "../../src/plugins/types.js";

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface TavilySearchResponse {
  results: TavilyResult[];
}

// Minimal schema
const TavilySearchParameters = {
  type: "object" as const,
  properties: {
    query: { type: "string" as const },
  },
  required: ["query"],
  additionalProperties: true,
};

export function createTavilySearchTool(
  apiKey: string,
  logger: PluginLogger,
): AgentTool<typeof TavilySearchParameters, TavilySearchResponse> {
  return {
    name: "tavily_search",
    description: "Search the web using Tavily's search API",
    parameters: TavilySearchParameters,
    async execute(
      toolCallId: string,
      params: { query?: string; maxResults?: number },
      signal?: AbortSignal,
    ): Promise<AgentToolResult<TavilySearchResponse>> {
      const query = params.query;
      const maxResults = (params.maxResults as number) ?? 5;

      if (!query || query.trim().length === 0) {
        return {
          ok: false,
          error: "Query is required",
        };
      }

      try {
        const response = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            api_key: apiKey,
            max_results: maxResults,
            include_answer: true,
            include_raw_content: false,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          logger.error(`Tavily API error: ${response.status} ${errorText}`);
          return {
            ok: false,
            error: `Tavily API error: ${response.status} ${errorText}`,
          };
        }

        const data = (await response.json()) as TavilySearchResponse;

        return {
          ok: true,
          result: data,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Tavily search failed: ${errorMessage}`);
        return {
          ok: false,
          error: `Search failed: ${errorMessage}`,
        };
      }
    },
  };
}
