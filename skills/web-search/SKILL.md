---
name: web-search
description: "Search the web using DuckDuckGo or other search engines. Use when: user wants to find information, research topics, look up current events, or find answers to questions. NOT for: local file searches, database queries, or when exact URLs are already known."
homepage: https://duckduckgo.com
metadata:
  {
    "openclaw":
      {
        "emoji": "🔍",
        "requires": { "bins": ["curl"] },
        "install":
          [
            {
              "id": "ddg-cli",
              "kind": "brew",
              "formula": "ddg",
              "bins": ["ddg"],
              "label": "Install ddg CLI (brew)",
            },
            {
              "id": "ddgr",
              "kind": "brew",
              "formula": "ddgr",
              "bins": ["ddgr"],
              "label": "Install ddgr CLI (brew)",
            },
          ],
      },
  }
---

# Web Search Skill

Search the web for information using DuckDuckGo.

## When to Use

✅ **USE this skill when:**

- User asks "what is...", "who is...", "how do..."
- Looking up current events or recent news
- Researching a topic
- Finding answers to factual questions
- Checking definitions, prices, or specifications

❌ **DON'T use this skill when:**

- User provides specific URLs → visit the URL directly
- Searching local files → use grep/find
- Database queries → use appropriate tools

## Methods

### Method 1: ddg CLI (Recommended)

```bash
# Simple search
ddg "search query"

# JSON output (structured data)
ddg "search query" --json

# Limit results
ddg "search query" -n 5

# Open in browser
ddg "search query" --open
```

### Method 2: curl (No API key required)

```bash
# HTML results
curl "https://html.duckduckgo.com/html/?q=search+query"

# JSON results (curl "lite)
https://lite.duckduckgo.com/lite/?q=search+query"

# Instant answers API
curl "https://api.duckduckgo.com/?q=search+query&format=json"
```

### Method 3: Text-based search

```bash
# Use ddgr (CLI for DuckDuckGo)
ddgr "search query"

# Use search CLI tools
search "query"
```

## Examples

**Quick answer lookup:**
```bash
curl -s "https://api.duckduckgo.com/?q=what+is+typescript&format=json" | jq '.Answer'
```

**Get search results:**
```bash
curl -s "https://html.duckduckgo.com/html/?q=python+async+await" | grep -o 'href="[^"]*"' | head -10
```

**Current events:**
```bash
ddg "latest AI news" -n 5
```

## Notes

- DuckDuckGo doesn't require an API key (free)
- Rate limit your requests
- Use `--json` flag with ddg for structured output
- The instant answers API (`api.duckduckgo.com`) returns featured snippets
