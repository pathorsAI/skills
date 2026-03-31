# Pathors Skills

> Build your conversational AI agent in a minute.

MCP skills and agent tools for building and managing [Pathors](https://pathors.com) AI call center and voice agents — directly from Claude Code, Cursor, and other AI coding assistants.

## Installation

```bash
npx skills add pathorsai/skills
```

## Prerequisites

Set your API key as an environment variable:

```bash
export PATHORS_API_KEY="dk_your_key_here"
```

## Available Skills

| Skill | Description |
|-------|-------------|
| `create-agent` | Create and configure a new Pathors AI agent from scratch |
| `design-pathway` | Design and manage conversation pathway flows |
| `manage-tools` | Configure and manage tools available to agents |
| `optimize-agent` | Review and optimize agent configuration |
| `debug-session` | Debug session issues, fix config, and create regression tests |

All skills are guide-style workflows that orchestrate MCP tools with best practices.

## MCP Server

This package includes a `.mcp.json` that connects to the Pathors MCP server at `https://api.pathors.com/mcp`.

You'll need a Pathors API key (`dk_` or `sk_`). Set it as `PATHORS_API_KEY` environment variable or update `.mcp.json` after installation.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PATHORS_API_KEY` | Yes | — | Your `dk_` or `sk_` API key |
| `PATHORS_API_URL` | No | `https://api.pathors.com` | API base URL (for self-hosted) |

## Links

- [Pathors](https://pathors.com)
- [Pathors Documentation](https://docs.pathors.com)
