---
name: quick-agent
description: Quickly read and update Pathors agent configuration with minimal token output. Use when modifying agent settings, prompts, or reviewing agent config.
allowed-tools: Bash(bash *)
---

# Quick Agent

Read and update agent configuration with type-safe operations and compact output.

## Prerequisites

Set `PATHORS_API_KEY` environment variable.

## Commands

### Get agent summary (compact)

Returns only essential fields — no raw prompt blob.

```bash
bash ${CLAUDE_SKILL_DIR}/scripts/agent.sh get <projectId>
```

Output: `{ name, type, status, executionMode, memoryEnabled, hasPrompt, promptLength, hasWebhook, hasEvaluation, variableCount }`

### Get full system prompt

Only use when you need to read/edit the prompt text.

```bash
bash ${CLAUDE_SKILL_DIR}/scripts/agent.sh get-prompt <projectId>
```

### Update agent config

Type-guarded — validates JSON and rejects unknown fields.

```bash
bash ${CLAUDE_SKILL_DIR}/scripts/agent.sh update <projectId> '{"name":"New Name","executionMode":"smart"}'
```

**Allowed fields:** `name`, `type`, `status`, `globalPrompt`, `executionMode`, `timezone`, `memoryEnabled`, `beforeStartConfig`, `postSessionWebhook`, `postEvaluationConfig`, `placeholderMessages`, `variableConfigs`

## Tips

- Use `get` first to see current state before updating
- Use `get-prompt` only when you need the full prompt text (it can be long)
- The `update` command validates your JSON before sending — typos in field names are caught early
