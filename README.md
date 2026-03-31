# Pathors Skills

> Build your conversational AI agent in a minute.

MCP skills for building and managing [Pathors](https://pathors.com) AI call center and voice agents — directly from Claude Code, Cursor, and other AI coding assistants.

All skills are built on top of the **Pathors MCP server**, orchestrating MCP tools into guided workflows with best practices.

## Installation

```bash
npx skills add pathorsai/skills
```

## Authentication

The MCP server uses **OAuth** by default — when you first connect, it will redirect you through the authentication flow automatically. No manual setup needed.

Alternatively, you can use an API key by setting the environment variable:

```bash
export PATHORS_API_KEY="dk_your_key_here"
```

## Available Skills

| Skill | Description |
|-------|-------------|
| `design-agent` | Design a complete agent — project setup, global prompt, pathway architecture, and tools |
| `manage-tools` | Configure and manage tools available to agents |
| `debug-session` | Debug session issues, fix config, and create regression tests |

## MCP Server

This package includes a `.mcp.json` that connects to the Pathors MCP server at `https://api.pathors.com/mcp`.

## Links

- [Pathors](https://pathors.com)
- [Pathors Documentation](https://docs.pathors.com)
