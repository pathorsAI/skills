---
name: quick-pathway
description: Manage Pathors conversation pathways with sequential safety and compact output. Use when creating, editing, or reviewing pathway flows.
allowed-tools: Bash(bash *)
---

# Quick Pathway

Manage conversation pathways with built-in sequential safety and type guards.

## Prerequisites

Set `PATHORS_API_KEY` environment variable.

## IMPORTANT: Sequential Safety

Pathway mutations are **always sequential** — the script enforces one-at-a-time execution. Never call multiple pathway commands in parallel.

## Commands

### View pathway (compact)

```bash
bash ${CLAUDE_SKILL_DIR}/scripts/pathway.sh get <projectId>
```

Returns: `{ nodeCount, edgeCount, version, nodes: [{id, type, title}], edges: [{id, from, to, condition}] }`

### Add a node

```bash
bash ${CLAUDE_SKILL_DIR}/scripts/pathway.sh add-node <projectId> '{"id":"greeting","type":"input","data":{"type":"start","title":"Greeting","prompt":"..."},"position":{"x":0,"y":0}}'
```

Type guards: requires `id` and `data.type`.

### Add an edge

```bash
bash ${CLAUDE_SKILL_DIR}/scripts/pathway.sh add-edge <projectId> '{"source":"greeting","target":"collect-info","condition":"User wants help"}'
```

Type guards: requires `source` and `target`.

### Batch setup (safe sequential)

Create multiple nodes and edges in one command — executed sequentially internally:

```bash
bash ${CLAUDE_SKILL_DIR}/scripts/pathway.sh batch-setup <projectId> '{"nodes":[...],"edges":[...]}'
```

This is the **recommended way** to set up a pathway from scratch. It processes nodes first, then edges, one at a time.

### Other commands

```bash
pathway.sh get-node <projectId> <nodeId>              # Full node details
pathway.sh update-node <projectId> <nodeId> <json>     # Partial update
pathway.sh delete-node <projectId> <nodeId>             # Delete + cleanup edges
pathway.sh delete-edge <projectId> <edgeId>             # Delete edge
pathway.sh replace <projectId> <json>                   # Replace entire pathway
pathway.sh version <projectId>                          # Current version
pathway.sh versions <projectId>                         # Version history
pathway.sh rollback <projectId> <version>               # Rollback
```

## Tips

- Use `batch-setup` for initial pathway creation (safest)
- Use `replace` when you have the complete pathway and want to overwrite
- Use individual `add-node`/`add-edge` for incremental changes
- Always `get` after changes to verify the result
