# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**OpenClaw** is a multi-channel AI gateway with extensible messaging integrations. It connects to real messaging platforms (WhatsApp, Telegram, Slack, Discord, Signal, iMessage, etc.) and provides a unified control plane for AI agent interactions.

Runtime: Node.js >= 22.12.0, use pnpm as package manager.

## Common Commands

```bash
# Install dependencies
pnpm install

# Build the project (includes canvas bundling, plugin-sdk, TypeScript)
pnpm build

# Development with auto-reload
pnpm gateway:watch

# Run gateway in dev mode (skips channel initialization)
pnpm gateway:dev

# Run a single test file
vitest run path/to/test.test.ts

# Run unit tests (excludes gateway and extensions)
pnpm test:fast

# Run all tests
pnpm test

# Run e2e tests
pnpm test:e2e

# Lint and format check
pnpm check

# Format code
pnpm format

# Lint code only
pnpm lint

# UI dev/build
pnpm ui:dev
pnpm ui:build

# Build iOS app
pnpm ios:build

# Build Android app
pnpm android:assemble
```

## Architecture

### Core Components

- **Gateway** (`src/gateway/`): Main control plane - WebSocket/HTTP server handling sessions, channels, auth, and agent communication
- **Channels** (`src/channels/`): Built-in channel implementations with shared utilities in `src/channels/plugins/`
- **Agents** (`src/agents/`): Agent runtime using Agent Client Protocol (ACP)
- **CLI** (`src/cli/`): Command-line interface entry points
- **Plugins** (`src/plugins/`): Core plugin system and built-in plugins

### Extensions System

Extensions in `extensions/` provide additional channel integrations and features:
- **Messaging channels**: discord, slack, telegram, whatsapp, signal, matrix, msteams, etc.
- **Auth providers**: google-antigravity-auth, minimax-portal-auth, qwen-portal-auth
- **Features**: memory-core, memory-lancedb, llm-task, voice-call, open-prose

Extensions are standalone packages with their own package.json and follow a plugin interface.

### Channel Architecture

Channels are implemented as plugins that:
1. Extend `BaseChannel` from `@openclaw/plugin-sdk`
2. Implement message sending/receiving, typing indicators, read receipts
3. Register via the channel registry (`src/channels/registry.ts`)

Built-in channels live in `src/whatsapp/`, `src/telegram/`, `src/slack/`, `src/discord/`, etc.

### Testing Strategy

- **Unit tests**: `vitest.unit.config.ts` - fast tests in `src/**/*.test.ts` (excludes gateway and extensions)
- **E2E tests**: `vitest.e2e.config.ts` - integration tests in `src/gateway/**/*.e2e.test.ts`
- **Live tests**: `vitest.live.config.ts` - tests against real external services
- **Extension tests**: `vitest.extensions.config.ts` - tests for extension plugins

### Key Configuration

- **TypeScript**: `tsconfig.json` for main codebase, separate configs for plugin-sdk and extensions
- **Linting**: `.oxlintrc.json` with typescript, unicorn, and oxc plugins
- **Formatting**: oxfmt (configured in `.oxlintrc.json`)
- **Vitest**: Multiple config files for different test categories

### Protocol

The gateway communicates with agents via WebSocket using a protocol defined in `src/gateway/protocol/`. Swift models are generated in `apps/macos/Sources/OpenClawProtocol/`.
