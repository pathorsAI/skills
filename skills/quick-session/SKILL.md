---
name: quick-session
description: Query and analyze Pathors session history. Use when reviewing conversations, checking stats, or debugging agent behavior.
allowed-tools: Bash(npx tsx *)
---

# Quick Session

Query session history and statistics.

## Prerequisites

Set `PATHORS_API_KEY` environment variable.

## Commands

### List sessions

```bash
npx tsx ${CLAUDE_SKILL_DIR}/scripts/session.ts list <projectId> [page] [pageSize]
```

### Session statistics

```bash
npx tsx ${CLAUDE_SKILL_DIR}/scripts/session.ts stats <projectId> [startDate] [endDate]
```

### Get full session

```bash
npx tsx ${CLAUDE_SKILL_DIR}/scripts/session.ts get <projectId> <sessionId>
```

### Get compact session (truncated transcript)

Messages truncated to 200 chars — use `get` for full data.

```bash
npx tsx ${CLAUDE_SKILL_DIR}/scripts/session.ts get-compact <projectId> <sessionId>
```

### Search sessions

```bash
npx tsx ${CLAUDE_SKILL_DIR}/scripts/session.ts search <projectId> "search query"
```
