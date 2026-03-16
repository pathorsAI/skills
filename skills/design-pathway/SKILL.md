---
name: design-pathway
description: Design and manage conversation pathway flows for Pathors agents
---

# Design Pathway

Design conversation pathways — the state machine that controls your agent's flow.

## Concepts

- **Node** — A conversation state (greeting, collect info, transfer, etc.)
- **Edge** — A transition between nodes, triggered by a condition
- **Pathway** — The full graph of nodes + edges

## Node Types

| Type | Required Fields | Description |
|------|----------------|-------------|
| `start` | `title`, `prompt` | Entry point of the pathway. At least one required. |
| `prompt` | `title`, `prompt` | A conversation state with LLM instructions. |
| `end` | `title`, `prompt` | Terminal state that ends the session. |
| `goto` | `title`, `referenceNodeId` | Jumps to another node (can be `null`). |

### Node Schema

Every node must have: `id`, `type`, `position`, and `data`.

```json
{
  "id": "greeting",
  "type": "start",
  "position": { "x": 0, "y": 0 },
  "data": {
    "type": "start",
    "title": "Greeting",
    "prompt": "Greet the user and ask how you can help."
  }
}
```

**IMPORTANT:** `data.type` must match the node's `type` field.

### Node Data by Type

**start:**
```json
{ "type": "start", "title": "...", "prompt": "...", "tools": ["tool-id"], "variableKeys": ["key"] }
```

**prompt:**
```json
{ "type": "prompt", "title": "...", "prompt": "...", "tools": ["tool-id"], "isGlobalNode": false, "globalNodeReason": "...", "knowledgeBaseId": "kb-id", "variableKeys": ["key"] }
```

**end:**
```json
{ "type": "end", "title": "...", "prompt": "...", "tools": ["tool-id"], "variableKeys": ["key"] }
```

**goto:**
```json
{ "type": "goto", "title": "...", "referenceNodeId": "target-node-id" }
```

Only `type`, `title`, and `prompt` (or `referenceNodeId` for goto) are required. Other fields are optional.

### Edge Schema

```json
{ "id": "edge-1", "source": "greeting", "target": "collect-info", "data": { "condition": "User wants to make a reservation" } }
```

## Workflow

### View Current Pathway

```
Tool: get_pathway
Input: { "projectId": "<project-id>" }
```

### Add a Node

```
Tool: create_node
Input: {
  "projectId": "<project-id>",
  "node": {
    "id": "greeting",
    "type": "start",
    "position": { "x": 0, "y": 0 },
    "data": {
      "type": "start",
      "title": "Greeting",
      "prompt": "Greet the user and ask how you can help."
    }
  }
}
```

### Connect Nodes with Edges

```
Tool: create_edge
Input: {
  "projectId": "<project-id>",
  "source": "greeting",
  "target": "collect-info",
  "condition": "User wants to make a reservation"
}
```

### Update a Node

Use partial updates to modify specific fields:

```
Tool: update_node
Input: {
  "projectId": "<project-id>",
  "nodeId": "greeting",
  "updates": {
    "data": { "prompt": "Updated greeting prompt" }
  }
}
```

### Delete a Node

Deleting a node also removes all connected edges:

```
Tool: delete_node
Input: { "projectId": "<project-id>", "nodeId": "old-node" }
```

## Common Patterns

### Linear Flow

```
start → collect-info → process → confirm → end
```

Best for: forms, surveys, simple transactions

### Branching Flow

```
start → intent-detection
  ├─ "billing" → billing-flow → end
  ├─ "support" → support-flow → end
  └─ "other" → general-qa → end
```

Best for: IVR-style menus, multi-purpose agents

### Loop with Escalation

```
start → qa-loop ←──┐
  ├─ "answered" ────┘
  ├─ "3 failures" → escalate → end
  └─ "bye" → end
```

Best for: knowledge-base agents, FAQ bots

### Using Goto Nodes

Goto nodes redirect flow to another node, useful for loops or shared logic:

```
start → collect-info → process → goto(collect-info)  // loops back
```

## Validation Rules

- Pathway **must** have at least one `start` node
- Pathway **should** have at least one `end` node
- All non-terminal nodes should be reachable from start and able to reach an end node
- Node `id` must be unique within the pathway

## IMPORTANT: Sequential Operations Only

**Never call multiple pathway mutation tools in parallel.** Pathway data is stored as a single JSON document. Each mutation does read -> modify -> write. Parallel calls will cause the last write to overwrite all others.

Bad (will lose data):
```
# DON'T DO THIS — parallel calls
create_node(greeting) + create_node(collect-info) + create_edge(greeting → collect-info)
```

Good (sequential):
```
create_node(greeting)       # wait for completion
create_node(collect-info)   # wait for completion
create_edge(greeting → collect-info)
```

If you need to set up many nodes and edges at once, use `update_pathway` to replace the entire pathway in a single call.

## Tips

- Keep node IDs descriptive and kebab-case: `collect-payment-info`
- Write conditions in natural language — the LLM interprets them
- Always have an `end` node as a terminal state
- Use `get_pathway` after changes to verify the graph structure
- Use `prompt` type for most conversation states; reserve `start` for entry points
- Use `isGlobalNode: true` on prompt nodes that should be reachable from any state
