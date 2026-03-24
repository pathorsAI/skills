# Pathors Skills

Agent skills for building and managing [Pathors](https://pathors.com) AI agents.

## Installation

```bash
npx skills add pathorsai/skills
```

## Prerequisites

Set your API key as an environment variable:

```bash
export PATHORS_API_KEY="dk_your_key_here"
```

Script skills require `npx tsx` (installed as devDependency).

## Available Skills

### Documentation Skills

Guide-style skills that teach workflows via MCP tool references.

| Skill | Description |
|-------|-------------|
| `create-agent` | Create and configure a new Pathors AI agent from scratch |
| `design-pathway` | Design and manage conversation pathway flows |
| `manage-tools` | Configure and manage tools available to agents |
| `optimize-agent` | Review and optimize agent configuration |

### Script Skills

TypeScript skills that call the REST API directly with zod validation and structured output.

| Skill | Description |
|-------|-------------|
| `quick-agent` | Full agent config + project overview + partial updates |
| `quick-pathway` | Pathway CRUD with sequential safety and batch operations |
| `quick-session` | Session queries, stats, and compact transcript view |
| `quick-tools` | Tool management with field validation |

### Why Script Skills?

| | MCP Tools | Script Skills |
|---|---|---|
| Token usage | Full JSON responses | Only essential data when using compact mode |
| Type safety | AI interprets errors | Zod validates before sending |
| Multi-step ops | AI manages sequencing | Script handles internally (e.g., `batch-setup`) |
| Error handling | AI parses error responses | Structured error output |

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
