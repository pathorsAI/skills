---
name: quick-tools
description: Manage Pathors agent tools with type-safe CRUD operations. Use when adding, configuring, or reviewing tools attached to agents.
allowed-tools: Bash(bash *)
---

# Quick Tools

Manage agent tools with type guards and compact output.

## Prerequisites

Set `PATHORS_API_KEY` environment variable.

## Commands

### List tools

```bash
bash ${CLAUDE_SKILL_DIR}/scripts/tools.sh list <projectId>
```

Returns: `[{ id, type, name, description }]`

### Available tool types

```bash
bash ${CLAUDE_SKILL_DIR}/scripts/tools.sh types <projectId>
```

Common types: `restful`, `duckduckgo-search`, `google-calendar`, `google-sheet`, `mcp`, `smtp`, `agent`

### Get full tool config

```bash
bash ${CLAUDE_SKILL_DIR}/scripts/tools.sh get <projectId> <toolId>
```

### Create tool

```bash
bash ${CLAUDE_SKILL_DIR}/scripts/tools.sh create <projectId> '{"type":"restful","metadata":{"url":"https://...","method":"GET"}}'
```

Type guard: requires `type` field.

### Update tool

```bash
bash ${CLAUDE_SKILL_DIR}/scripts/tools.sh update <projectId> <toolId> '{"name":"Customer Lookup","description":"..."}'
```

Type guard: only allows `name`, `description`, `metadata`, `inputSchema`.

### Delete tool

```bash
bash ${CLAUDE_SKILL_DIR}/scripts/tools.sh delete <projectId> <toolId>
```
