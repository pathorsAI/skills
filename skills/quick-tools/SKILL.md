---
name: quick-tools
description: Manage Pathors agent tools with zod-validated CRUD operations. Use when adding, configuring, or reviewing tools attached to agents.
allowed-tools: Bash(npx tsx *)
---

# Quick Tools

Manage agent tools with zod validation.

## Prerequisites

Set `PATHORS_API_KEY` environment variable.

## Commands

### List tools

```bash
npx tsx ${CLAUDE_SKILL_DIR}/scripts/tools.ts list <projectId>
```

### Available tool types

```bash
npx tsx ${CLAUDE_SKILL_DIR}/scripts/tools.ts types <projectId>
```

### Get full tool config

```bash
npx tsx ${CLAUDE_SKILL_DIR}/scripts/tools.ts get <projectId> <toolId>
```

### Create tool (zod-validated)

```bash
npx tsx ${CLAUDE_SKILL_DIR}/scripts/tools.ts create <projectId> '{"type":"restful","metadata":{"url":"https://...","method":"GET"}}'
```

### Update tool (field-validated)

Only allows: `name`, `description`, `metadata`, `inputSchema`.

```bash
npx tsx ${CLAUDE_SKILL_DIR}/scripts/tools.ts update <projectId> <toolId> '{"name":"Customer Lookup","description":"..."}'
```

### Delete tool

```bash
npx tsx ${CLAUDE_SKILL_DIR}/scripts/tools.ts delete <projectId> <toolId>
```
