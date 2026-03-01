#!/usr/bin/env node

// Try to load nodemailer modules - supports both global and local installation
let nodemailer, Imap, simpleParser;
try {
  nodemailer = require("nodemailer");
  Imap = require("imap");
  simpleParser = require("mailparser").simpleParser;
} catch (e) {
  // Try global node modules path
  const globalPath = process.execPath.replace(/bin\/node$/, "lib/node_modules");
  try {
    nodemailer = require(path.join(globalPath, "nodemailer"));
    Imap = require(path.join(globalPath, "imap"));
    simpleParser = require(path.join(globalPath, "mailparser")).simpleParser;
  } catch (e2) {
    console.error("Error: Please install nodemailer, imap, and mailparser:");
    console.error("  npm install -g nodemailer imap mailparser");
    process.exit(1);
  }
}

const fs = require("fs");
const path = require("path");

// Load config from ~/.openclaw/credentials/email.json
const configPath = path.join(
  process.env.HOME || process.env.USERPROFILE,
  ".openclaw",
  "credentials",
  "email.json",
);

let config = {
  smtp: {
    host: "smtp.qq.com",
    port: 465,
    secure: true,
  },
  imap: {
    host: "imap.qq.com",
    port: 993,
    tls: true,
  },
  user: process.env.QQ_EMAIL || process.env.SMTP_USER,
  pass: process.env.QQ_EMAIL_AUTH || process.env.SMTP_PASS,
};

if (fs.existsSync(configPath)) {
  try {
    const fileConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    config = { ...config, ...fileConfig };
  } catch (e) {
    console.error("Error reading config:", e.message);
  }
}

const args = process.argv.slice(2);

function showHelp() {
  console.log(`
Email Skill for OpenClaw (Send + Receive)

Usage:
  # Send email
  email send --to <recipient> --subject "<subject>" --body "<body>"
  email send --to <recipient> --subject "<subject>" --body-file <file>

  # Receive emails
  email inbox                          # List recent emails
  email inbox --unread                 # List unread emails
  email read <message-id>             # Read specific email
  email read --latest                  # Read latest email

  # Test
  email test                           # Test SMTP connection

Configuration:
  - QQ_EMAIL: your QQ email address
  - QQ_EMAIL_AUTH: SMTP authorization code from QQ email settings
  Or create ~/.openclaw/credentials/email.json:
    {
      "user": "your-qq@qq.com",
      "pass": "your-auth-code"
    }

Examples:
  email send --to "target@example.com" --subject "Hello" --body "Test message"
  email inbox --unread
  email read --latest
`);
}

// ========== SEND EMAIL ==========
async function sendEmail(to, subject, body) {
  if (!config.user || !config.pass) {
    console.error("Error: SMTP credentials not configured.");
    console.error(
      "Set QQ_EMAIL and QQ_EMAIL_AUTH env vars, or create ~/.openclaw/credentials/email.json",
    );
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: config.user,
      to: to,
      subject: subject,
      text: body,
      html: body.replace(/\n/g, "<br>"),
    });
    console.log("Email sent:", info.messageId);
    console.log("To:", to);
    console.log("Subject:", subject);
  } catch (error) {
    console.error("Error sending email:", error.message);
    process.exit(1);
  }
}

// ========== READ INBOX ==========
async function getInbox(options = {}) {
  if (!config.user || !config.pass) {
    console.error("Error: IMAP credentials not configured.");
    process.exit(1);
  }

  const imap = new Imap({
    user: config.user,
    password: config.pass,
    host: config.imap.host,
    port: config.imap.port,
    tls: config.imap.tls,
  });

  return new Promise((resolve, reject) => {
    imap.once("ready", () => {
      imap.openBox("INBOX", false, (err, box) => {
        if (err) {
          imap.end();
          reject(err);
          return;
        }

        // Build search criteria
        let searchCriteria = ["ALL"];
        if (options.unread) {
          searchCriteria = ["UNSEEN"];
        }

        // Get sequence of recent emails
        const maxEmails = options.limit || 10;
        const startMsg = box.messages.total - maxEmails + 1;

        const fetch = imap.fetch(startMsg + ":*", {
          bodies: ["HEADER.FIELDS (FROM SUBJECT DATE MESSAGE-ID)", "TEXT"],
          struct: true,
        });

        const emails = [];

        fetch.on("message", (msg, seqno) => {
          const email = { seqno };

          msg.on("body", (stream, info) => {
            let buffer = "";
            stream.on("data", (chunk) => {
              buffer += chunk.toString("utf8");
            });
            stream.on("end", () => {
              if (info.which === "HEADER.FIELDS (FROM SUBJECT DATE MESSAGE-ID)") {
                // Parse headers
                const headers = buffer.split("\r\n").filter((line) => line);
                headers.forEach((line) => {
                  if (line.startsWith("From:")) email.from = line.replace("From:", "").trim();
                  if (line.startsWith("Subject:"))
                    email.subject = line.replace("Subject:", "").trim();
                  if (line.startsWith("Date:")) email.date = line.replace("Date:", "").trim();
                  if (line.startsWith("Message-ID:"))
                    email.messageId = line.replace("Message-ID:", "").trim();
                });
              } else if (info.which === "TEXT") {
                // Get plain text preview
                email.preview = buffer.substring(0, 200).replace(/\r?\n/g, " ");
              }
            });
          });

          msg.once("attributes", (attrs) => {
            email.uid = attrs.uid;
            email.flags = attrs.flags;
            email.seen = attrs.flags.includes("\\Seen");
          });

          msg.once("end", () => {
            emails.push(email);
          });
        });

        fetch.once("error", (err) => {
          imap.end();
          reject(err);
        });

        fetch.once("end", () => {
          // Reverse to show newest first
          emails.reverse();
          imap.end();
          resolve(emails);
        });
      });
    });

    imap.once("error", (err) => {
      reject(err);
    });

    imap.connect();
  });
}

// ========== READ SPECIFIC EMAIL ==========
async function readEmail(uidOrLatest) {
  if (!config.user || !config.pass) {
    console.error("Error: IMAP credentials not configured.");
    process.exit(1);
  }

  const imap = new Imap({
    user: config.user,
    password: config.pass,
    host: config.imap.host,
    port: config.imap.port,
    tls: config.imap.tls,
  });

  return new Promise((resolve, reject) => {
    imap.once("ready", () => {
      imap.openBox("INBOX", false, async (err, box) => {
        if (err) {
          imap.end();
          reject(err);
          return;
        }

        let fetchUid;
        if (uidOrLatest === "latest") {
          fetchUid = box.messages.total;
        } else {
          fetchUid = parseInt(uidOrLatest);
        }

        const fetch = imap.fetch(fetchUid, {
          bodies: [""],
          struct: true,
        });

        let emailContent = "";

        fetch.on("message", async (msg, seqno) => {
          msg.on("body", async (stream, info) => {
            const parsed = await simpleParser(stream);
            console.log("=".repeat(60));
            console.log("From:", parsed.from?.text || "Unknown");
            console.log("To:", parsed.to?.text || "Unknown");
            console.log("Subject:", parsed.subject || "(No Subject)");
            console.log("Date:", parsed.date || "Unknown");
            console.log("=".repeat(60));
            console.log("\n--- Content ---\n");
            console.log(parsed.text || parsed.html?.replace(/<[^>]*>/g, "") || "No content");
            console.log("\n--- End ---\n");

            // Mark as read
            imap.addFlags(seqno, "\\Seen", (err) => {
              if (!err) console.log("[Marked as read]");
            });
          });

          msg.once("end", () => {
            imap.end();
            resolve();
          });
        });

        fetch.once("error", (err) => {
          imap.end();
          reject(err);
        });
      });
    });

    imap.once("error", (err) => {
      reject(err);
    });

    imap.connect();
  });
}

// ========== TEST CONNECTION ==========
async function testConnection() {
  if (!config.user || !config.pass) {
    console.error("Error: SMTP credentials not configured.");
    console.error(
      "Set QQ_EMAIL and QQ_EMAIL_AUTH env vars, or create ~/.openclaw/credentials/email.json",
    );
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  try {
    await transporter.verify();
    console.log("✓ SMTP connection successful!");
    console.log("  Email:", config.user);
  } catch (error) {
    console.error("✗ SMTP connection failed:", error.message);
    process.exit(1);
  }

  // Also test IMAP
  console.log("  Testing IMAP...");
  const imap = new Imap({
    user: config.user,
    password: config.pass,
    host: config.imap.host,
    port: config.imap.port,
    tls: config.imap.tls,
  });

  return new Promise((resolve) => {
    imap.once("ready", () => {
      console.log("✓ IMAP connection successful!");
      imap.end();
      resolve();
    });

    imap.once("error", (err) => {
      console.log("✗ IMAP connection failed:", err.message);
      resolve();
    });

    imap.connect();
  });
}

// ========== PARSE ARGUMENTS ==========
let to, subject, body, bodyFile;
let cmd = args[0];

for (let i = 1; i < args.length; i++) {
  if (args[i] === "--to" && args[i + 1]) to = args[++i];
  if (args[i] === "--subject" && args[i + 1]) subject = args[++i];
  if (args[i] === "--body" && args[i + 1]) body = args[++i];
  if (args[i] === "--body-file" && args[i + 1]) bodyFile = args[++i];
  if (args[i] === "--help" || args[i] === "-h") showHelp();
  if (args[i] === "--unread") cmd = "inbox --unread";
  if (args[i] === "--latest") cmd = "read --latest";
  if (args[i] === "--limit" && args[i + 1]) cmd = `inbox --limit ${args[++i]}`;
}

// ========== ROUTE COMMAND ==========
if (!cmd || cmd === "--help" || cmd === "-h") {
  showHelp();
} else if (cmd === "test") {
  testConnection();
} else if (cmd === "send") {
  if (!to || !subject || (!body && !bodyFile)) {
    console.error("Error: Missing required arguments.");
    console.error('Usage: email send --to <recipient> --subject "<subject>" --body "<body>"');
    process.exit(1);
  }
  if (bodyFile) {
    try {
      body = fs.readFileSync(bodyFile, "utf-8");
    } catch (e) {
      console.error("Error reading body file:", e.message);
      process.exit(1);
    }
  }
  sendEmail(to, subject, body);
} else if (cmd === "inbox") {
  const options = { unread: args.includes("--unread"), limit: 10 };
  if (args.includes("--limit")) {
    const idx = args.indexOf("--limit");
    options.limit = parseInt(args[idx + 1]) || 10;
  }
  getInbox(options)
    .then((emails) => {
      console.log(`\n=== Inbox (${emails.length} emails) ===\n`);
      emails.forEach((email, idx) => {
        const marker = email.seen ? " " : "●";
        const subject = email.subject || "(No Subject)";
        const from = email.from || "Unknown";
        console.log(
          `${marker} #${idx + 1} | ${from.substring(0, 30)} | ${subject.substring(0, 40)}`,
        );
      });
      console.log('\nUse "email read --latest" to read the latest email');
      console.log('Use "email read <seqno>" to read a specific email');
    })
    .catch((err) => {
      console.error("Error reading inbox:", err.message);
      process.exit(1);
    });
} else if (cmd === "read") {
  let target = "latest";
  if (args[1] && args[1] !== "--latest") {
    target = args[1];
  }
  readEmail(target).catch((err) => {
    console.error("Error reading email:", err.message);
    process.exit(1);
  });
} else {
  showHelp();
}
