---
name: pathors-overview
description: Get a quick overview of Pathors projects, agents, and their configurations. Use when starting work on a Pathors project or needing context.
allowed-tools: Bash(bash *)
---

# Pathors Overview

Get a quick snapshot of your Pathors projects and their current state.

## Prerequisites

Set `PATHORS_API_KEY` environment variable with your `dk_` or `sk_` key.

## Quick Start

### List all projects

```bash
bash ${CLAUDE_SKILL_DIR}/scripts/api.sh list-projects
```

### Full project summary

Get agent config, pathway structure, and tools in one call:

```bash
bash ${CLAUDE_SKILL_DIR}/scripts/api.sh summary $ARGUMENTS
```

This returns a compact view with:
- Agent name, type, status, model, memory setting
- Pathway node count, edge count, and node list
- Tool count and tool list

Use this as your starting point before making any changes.
