# Tavily Search Plugin

Search the web using Tavily's search API from your OpenClaw agents.

## Setup

1. Get a Tavily API key from https://tavily.com/
2. Configure the plugin in your OpenClaw config:

```json
{
  "plugins": {
    "tavily-search": {
      "apiKey": "your-api-key-here"
    }
  }
}
```

## Usage

The plugin provides a `tavily_search` tool that agents can use to search the web.

**Example:**

```
User: What's the latest news about AI?
Agent (uses tavily_search): [Returns search results]
```
