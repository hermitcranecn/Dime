---
name: wechat-publish
description: "Publish articles to WeChat Official Account (微信公众号). Supports sending text, images, and articles."
metadata:
  {
    "openclaw":
      {
        "emoji": "📱",
        "requires": { "bins": ["curl", "jq"] },
      },
  }
---

# WeChat Publish Skill

Publish articles to WeChat Official Account (微信公众号).

## Configuration

Credentials are stored in config:
- AppID: wx0fb24a5d322abda2

## Usage

```bash
wechat text "Hello from OpenClaw!"
wechat image /path/to/image.png
wechat article "Title" "Content" "Author"
```

## Examples

Send a text message:
```
wechat text "Test message"
```

Publish an article:
```
wechat article "My Article Title" "Article content here..." "Author Name"
```

## Notes

- Requires WeChat Official Account (公众号)
- Need valid AppID and AppSecret
- Content will appear in the official account's draft box (草稿箱)
