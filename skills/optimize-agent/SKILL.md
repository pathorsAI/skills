---
name: optimize-agent
description: Review and optimize Pathors agent configuration for better performance
---

# Optimize Agent

Review your agent's configuration and apply best practices.

## Workflow

### Step 1: Audit Current Setup

Gather the full picture:

```
Tool: get_agent       → Review agent config
Tool: get_pathway     → Review conversation flow
Tool: list_tools      → Review available tools
```

### Step 2: Check Agent Config

**System Prompt Quality**
- Is the persona clearly defined?
- Are there explicit instructions for edge cases?
- Is the language consistent with the target audience?

**Model Selection**
- Use faster models (e.g., `gpt-4o-mini`) for simple Q&A
- Use stronger models (e.g., `gpt-4o`, `claude-sonnet-4-20250514`) for complex reasoning

**First Message**
- Keep it concise and welcoming
- Match the language setting

### Step 3: Check Pathway

**Node Coverage**
- Is there a greeting node?
- Are all user intents covered?
- Is there a fallback / escalation path?
- Are there terminal nodes (end / transfer)?

**Edge Conditions**
- Are conditions clear and mutually exclusive?
- Is there a default / catch-all edge from each decision point?
- Are conditions written in the agent's language?

**Flow Efficiency**
- Minimize unnecessary nodes — fewer states = faster conversations
- Avoid deep nesting — keep paths under 5 nodes when possible
- Remove orphaned nodes (no incoming edges)

### Step 4: Check Tools

**Tool Naming**
- Names should be action-oriented: "lookup_customer", not "customer_tool"
- Descriptions should explain WHEN to use the tool, not just WHAT it does

**Tool Count**
- Keep under 10 tools per agent — too many tools confuse the LLM
- Remove unused tools

### Step 5: Apply Changes

Use `update_agent`, `update_node`, `update_edge`, `update_tool` to apply improvements.

## Common Issues

| Issue | Symptom | Fix |
|-------|---------|-----|
| Agent ignores tools | Never calls available tools | Improve tool descriptions; add "use X tool when..." to system prompt |
| Agent loops | Keeps returning to same node | Check edge conditions for overlaps; add exit conditions |
| Slow responses | High latency | Switch to faster model; reduce system prompt length |
| Wrong language | Responds in wrong language | Set `language` in agent config; use target language in prompts |
| Hallucinations | Makes up information | Add "only use provided tools for factual answers" to system prompt |
