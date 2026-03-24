---
name: quick-pathway
description: Manage Pathors conversation pathways with sequential safety and zod validation. Use when creating, editing, or reviewing pathway flows.
allowed-tools: Bash(npx tsx *)
---

# Quick Pathway

Manage conversation pathways with built-in sequential safety and zod validation.

## Prerequisites

Set `PATHORS_API_KEY` environment variable.

## IMPORTANT: Sequential Safety

Pathway mutations are **always sequential** — never call multiple pathway commands in parallel.

## Commands

### View pathway (compact)

```bash
npx tsx ${CLAUDE_SKILL_DIR}/scripts/pathway.ts get <projectId>
```

### Add a node (zod-validated)

```bash
npx tsx ${CLAUDE_SKILL_DIR}/scripts/pathway.ts add-node <projectId> '{"id":"greeting","data":{"type":"start","title":"Greeting","prompt":"..."}}'
```

### Add an edge (zod-validated)

```bash
npx tsx ${CLAUDE_SKILL_DIR}/scripts/pathway.ts add-edge <projectId> '{"source":"greeting","target":"collect-info","condition":"User wants help"}'
```

### Batch setup (safe sequential)

Create multiple nodes and edges in one command — executed sequentially internally:

```bash
npx tsx ${CLAUDE_SKILL_DIR}/scripts/pathway.ts batch-setup <projectId> '{"nodes":[...],"edges":[...]}'
```

### Other commands

```
pathway.ts get-node <id> <nodeId>              Full node details
pathway.ts update-node <id> <nodeId> <json>    Partial update
pathway.ts delete-node <id> <nodeId>           Delete + cleanup edges
pathway.ts delete-edge <id> <edgeId>           Delete edge
pathway.ts replace <id> <json>                 Replace entire pathway
pathway.ts version <id>                        Current version
pathway.ts versions <id>                       Version history
pathway.ts rollback <id> <version>             Rollback
```
