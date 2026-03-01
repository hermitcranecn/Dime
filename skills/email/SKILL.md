---
name: email
description: "Send and receive emails via SMTP/IMAP. Use when: user wants to send email notifications, reports, or check/receive emails. Supports QQ mail and other email providers."
metadata: { "openclaw": { "emoji": "📧", "requires": { "bins": ["node"] } } }
---

# Email Skill

Send and receive emails via SMTP and IMAP.

## Installation

```bash
# Install required npm packages globally
npm install -g nodemailer imap mailparser
```

Or locally in the skill directory:

```bash
cd skills/email
npm install nodemailer imap mailparser
```

Send and receive emails via SMTP and IMAP.

## Configuration

**Option 1: Environment Variables**

```bash
export QQ_EMAIL="your-qq@qq.com"
export QQ_EMAIL_AUTH="your-smtp-auth-code"
```

**Option 2: Config File**

Create `~/.openclaw/credentials/email.json`:

```json
{
  "user": "your-qq@qq.com",
  "pass": "your-smtp-auth-code"
}
```

**Getting QQ Email SMTP Auth Code:**

1. Login to QQ email (https://mail.qq.com)
2. Settings → Account → POP3/SMTP service → Enable
3. Get the authorization code (授权码)

## Usage

### Send Email

```bash
# Send email with body
email send --to "recipient@example.com" --subject "Hello" --body "Message content"

# Send email with body from file
email send --to "recipient@example.com" --subject "Report" --body-file ~/report.txt
```

### Receive Email

```bash
# List recent emails
email inbox

# List unread emails
email inbox --unread

# Read latest email
email read --latest

# Read specific email (by sequence number)
email read 1
```

### Test

```bash
# Test SMTP and IMAP connection
email test

# Show help
email --help
```

## Examples

**Send a simple email:**

```bash
email send --to "target@qq.com" --subject "AI Report" --body "Here is your daily AI summary..."
```

**Send content from file:**

```bash
email send --to "myself@qq.com" --subject "Weekly Report" --body-file ~/weekly-report.md
```

**Check inbox:**

```bash
email inbox --unread
```

**Read latest email:**

```bash
email read --latest
```

## Notes

- Default SMTP server: smtp.qq.com:465
- Default IMAP server: imap.qq.com:993
- For other email providers, edit the config to specify custom smtp/imap hosts
- HTML content is automatically generated from plain text when sending
