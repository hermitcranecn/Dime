import type { OpenClawPluginApi } from "../../src/plugins/types.js";
import { createTavilySearchTool } from "./src/tavily-tool.js";

export default function register(api: OpenClawPluginApi) {
  const pluginCfg = (api.pluginConfig ?? {}) as Record<string, unknown>;
  const apiKey = pluginCfg.apiKey as string | undefined;
  if (!apiKey) {
    api.logger.warn("Tavily Search: no API key configured");
    return;
  }
  const tool = createTavilySearchTool(apiKey, api.logger);
  api.registerTool(tool);
}
