# Pathors Skills

Agent skills for building and managing [Pathors](https://pathors.com) AI agents.

## Installation

```bash
npx skills add pathorstw/skills
```

## Prerequisites

Set your API key as an environment variable:

```bash
export PATHORS_API_KEY="dk_your_key_here"
```

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

Executable skills that call the REST API directly with type guards and compact output. These save tokens by returning only essential data instead of full API responses.

| Skill | Description |
|-------|-------------|
| `pathors-overview` | Quick project overview — list projects, full agent+pathway+tools summary |
| `quick-agent` | Read and update agent config with field validation |
| `quick-pathway` | Pathway CRUD with sequential safety and batch operations |
| `quick-session` | Session queries and stats with truncated transcripts |
| `quick-tools` | Tool management with type guards |

### Why Script Skills?

| | MCP Tools | Script Skills |
|---|---|---|
| Token usage | Full JSON responses | Compact, essential-only output |
| Type safety | AI interprets errors | Script validates before sending |
| Multi-step ops | AI manages sequencing | Script handles internally (e.g., `batch-setup`) |
| Error handling | AI parses error responses | Script provides clear error messages |

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
