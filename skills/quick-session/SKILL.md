---
name: quick-session
description: Query and analyze Pathors session history with compact output. Use when reviewing conversations, checking stats, or debugging agent behavior.
allowed-tools: Bash(bash *)
---

# Quick Session

Query session history and statistics with token-efficient output.

## Prerequisites

Set `PATHORS_API_KEY` environment variable.

## Commands

### List recent sessions

```bash
bash ${CLAUDE_SKILL_DIR}/scripts/session.sh list <projectId> [page] [pageSize]
```

Returns: `{ page, totalPages, total, sessions: [{id, start, end, provider, messages, marked, evaluation}] }`

### Session statistics

```bash
bash ${CLAUDE_SKILL_DIR}/scripts/session.sh stats <projectId> [startDate] [endDate]
```

Date format: `YYYY-MM-DD`

### Get session with truncated transcript

Messages are truncated to 200 chars. Use `get-full` for complete data.

```bash
bash ${CLAUDE_SKILL_DIR}/scripts/session.sh get <projectId> <sessionId>
```

### Get full session (all events)

```bash
bash ${CLAUDE_SKILL_DIR}/scripts/session.sh get-full <projectId> <sessionId>
```

### Search sessions

```bash
bash ${CLAUDE_SKILL_DIR}/scripts/session.sh search <projectId> "search query"
```

## Tips

- Use `list` + `stats` for a quick health check
- Use `get` (truncated) first, then `get-full` only if you need the raw events
- Use `search` to find specific conversations by keyword
