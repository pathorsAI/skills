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

## Workflow

### View Current Pathway

```
Tool: get_pathway
Input: { "projectId": "<project-id>" }
```

### Add a Node

Each node needs: `id`, `type`, `position`, and `data` (with `prompt`, `label`, etc.)

```
Tool: create_node
Input: {
  "projectId": "<project-id>",
  "node": {
    "id": "greeting",
    "type": "conversation",
    "position": { "x": 0, "y": 0 },
    "data": {
      "label": "Greeting",
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
greeting → collect-info → process → confirm → end
```

Best for: forms, surveys, simple transactions

### Branching Flow

```
greeting → intent-detection
  ├─ "billing" → billing-flow → end
  ├─ "support" → support-flow → end
  └─ "other" → general-qa → end
```

Best for: IVR-style menus, multi-purpose agents

### Loop with Escalation

```
greeting → qa-loop ←──┐
  ├─ "answered" ──────┘
  ├─ "3 failures" → escalate → end
  └─ "bye" → end
```

Best for: knowledge-base agents, FAQ bots

## IMPORTANT: Sequential Operations Only

**Never call multiple pathway mutation tools in parallel.** Pathway data is stored as a single JSON document. Each mutation does read → modify → write. Parallel calls will cause the last write to overwrite all others.

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
- Always have an `end` or `transfer` node as a terminal state
- Use `get_pathway` after changes to verify the graph structure
