---
name: quick-agent
description: Read and update Pathors agent configuration with zod validation. Use when modifying agent settings, prompts, or reviewing agent config.
allowed-tools: Bash(npx tsx *)
---

# Quick Agent

Read and update agent configuration with zod-validated operations.

## Prerequisites

Set `PATHORS_API_KEY` environment variable.

## Commands

### Get full agent config

Returns the complete agent configuration.

```bash
npx tsx ${CLAUDE_SKILL_DIR}/scripts/agent.ts get <projectId>
```

### Get project overview (agent + pathway + tools)

One call to get the full picture — agent config, pathway structure, and tools list.

```bash
npx tsx ${CLAUDE_SKILL_DIR}/scripts/agent.ts overview <projectId>
```

### Get system prompt only

Use when you only need to read/edit the prompt text.

```bash
npx tsx ${CLAUDE_SKILL_DIR}/scripts/agent.ts get-prompt <projectId>
```

### Update agent config (partial)

Send only the fields you want to change — other fields stay untouched.
Validated with zod before sending.

```bash
npx tsx ${CLAUDE_SKILL_DIR}/scripts/agent.ts update <projectId> '{"name":"New Name","executionMode":"smart"}'
```

**Allowed fields:** `name`, `type`, `status`, `globalPrompt`, `executionMode`, `timezone`, `memoryEnabled`, `beforeStartConfig`, `postSessionWebhook`, `postEvaluationConfig`, `placeholderMessages`, `variableConfigs`

## Tips

- Use `get` to see full config, `overview` for full project context
- Use `get-prompt` only when you need the prompt text (can be long)
- `update` accepts partial data — only send what you want to change
