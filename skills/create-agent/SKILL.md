---
name: create-agent
description: Create and configure a new Pathors AI agent from scratch
---

# Create Agent

Build a new Pathors AI voice/chat agent step by step.

## Workflow

### Step 1: Create Project

Use `create_project` to create a new project. This automatically creates a blank agent config and pathway.

```
Tool: create_project
Input: { "name": "My Agent" }
```

### Step 2: Configure Agent

Use `get_agent` to see the current config, then `update_agent` to set:

- **name** — Agent display name
- **language** — Primary language (`zh-TW`, `en`, `ja`, etc.)
- **provider** / **model** — LLM provider and model
- **systemPrompt** — The agent's persona and instructions
- **voice** — TTS voice configuration
- **firstMessage** — What the agent says when a session starts

```
Tool: update_agent
Input: {
  "projectId": "<project-id>",
  "config": {
    "name": "Customer Support Agent",
    "language": "zh-TW",
    "systemPrompt": "你是一位專業的客服人員...",
    "firstMessage": "您好，請問有什麼可以幫您的？"
  }
}
```

### Step 3: Design Pathway

Use `get_pathway` to see the blank template, then add nodes and edges:

1. **Add nodes** with `create_node` — each node is a conversation state
2. **Add edges** with `create_edge` — edges define transitions between states

See the `design-pathway` skill for pathway design patterns.

### Step 4: Add Tools

Use `list_tool_types` to see available tool types, then:

1. **Create tools** with `create_tool` — e.g., REST API, search, calendar
2. **Configure tools** with `update_tool` — set name, description, metadata

See the `manage-tools` skill for tool configuration details.

## Templates

### Simple Q&A Agent

A minimal agent that answers questions:
- 1 node: `greeting` (type: `conversation`)
- System prompt handles all logic
- No tools needed

### Multi-Step Agent

An agent with structured conversation flow:
- `greeting` → `collect-info` → `process` → `confirm` → `end`
- Each node has specific prompts and conditions
- Tools attached for data lookups

## Error Handling

- If `create_project` fails, check your API key permissions
- If `update_agent` fails with validation error, check the config schema using `get_agent` first
- Always verify changes with `get_agent` / `get_pathway` after updates
