---
name: ocr
description: "Extract text from images using Tesseract OCR. Supports English and Chinese."
metadata:
  {
    "openclaw":
      {
        "emoji": "📝",
        "requires": { "bins": ["tesseract"] },
      },
  }
---

# OCR Skill

Extract text from images using Tesseract OCR.

## Usage

```bash
ocr /path/to/image.png
```

## Examples

Extract text from a screenshot:
```
ocr screenshot.png
```

Extract Chinese text:
```
ocr chinese_doc.jpg
```

## Supported Languages

- English (eng) - default
- Chinese Simplified (chi_sim)

## Installation

Tesseract OCR is already installed on the system.

To add more languages:
```bash
# Ubuntu/Debian
sudo apt install tesseract-ocr-{lang}
```
