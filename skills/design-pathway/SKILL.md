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
{
  "type": "start",
  "title": "...",
  "prompt": "...",
  "tools": ["tool-config-id"],
  "variableKeys": ["customer_email"]
}
```

**prompt:**
```json
{
  "type": "prompt",
  "title": "...",
  "prompt": "...",
  "tools": ["tool-config-id"],
  "isGlobalNode": false,
  "globalNodeReason": "...",
  "knowledgeBaseId": "kb-id",
  "variableKeys": ["customer_email"]
}
```

**end:**
```json
{
  "type": "end",
  "title": "...",
  "prompt": "...",
  "tools": ["tool-config-id"],
  "variableKeys": ["customer_email"]
}
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

---

## Tools on Nodes

Nodes can reference project tools via the `tools` array. The values are **tool config IDs** — the same IDs returned by `list_tools` and `create_tool`.

### How It Works

1. Create tools using the `manage-tools` skill (`create_tool`)
2. Get tool IDs from `list_tools`
3. Add tool IDs to a node's `data.tools` array

```
Tool: update_node
Input: {
  "projectId": "<project-id>",
  "nodeId": "collect-info",
  "updates": {
    "data": { "tools": ["tool-id-from-list-tools", "another-tool-id"] }
  }
}
```

### Per-Node Tool Filtering (Smart/Balance Mode)

In **smart** and **balance** execution modes, only the tools assigned to the **current node** are available to the LLM. This means:

- A "lookup customer" tool on the `collect-info` node won't be available at the `greeting` node
- This keeps each conversation state focused and prevents the LLM from calling irrelevant tools
- If a node has no tools, only the path transition tool (for moving between nodes) is available

In **turbo** (monolithic) mode, **all tools** from all nodes are available at every step.

### Example: Node with Tools

```json
{
  "id": "collect-info",
  "type": "prompt",
  "position": { "x": 300, "y": 0 },
  "data": {
    "type": "prompt",
    "title": "Collect Customer Info",
    "prompt": "Ask the customer for their email, then use the lookup tool to find their account.",
    "tools": ["abc123-lookup-tool-id"]
  }
}
```

---

## Variable Extraction

Variable extraction lets nodes automatically extract structured data from the conversation (e.g., email, phone, name).

### How It Works

1. **Define variables globally** on the pathway's `variableConfigs` array
2. **Reference variables on nodes** via `variableKeys` — an array of variable `key` strings
3. During execution, the system extracts variable values from the conversation at each visited node

### Variable Config Schema

Variables are defined at the pathway level in `variableConfigs`:

```json
{
  "key": "customer_email",
  "type": "email",
  "description": "The customer's email address"
}
```

**Supported types:** `string`, `number`, `email`

- `string` — Free-form text
- `number` — Numeric value (coerced from text)
- `email` — Validated email format

### Step 1: Define Variables on the Agent

Variable definitions live in **agent config** (not pathway). Use `update_agent` to set them:

```
Tool: update_agent
Input: {
  "projectId": "<project-id>",
  "config": {
    "variableConfigs": [
      { "key": "customer_name", "type": "string", "description": "Customer's full name" },
      { "key": "customer_email", "type": "email", "description": "Customer's email address" },
      { "key": "order_amount", "type": "number", "description": "Total order amount in USD" }
    ]
  }
}
```

Use `get_agent` to check current variable configs before updating. To add a variable without overwriting existing ones, read the current `variableConfigs` first, append the new one, and send the full array.

### Step 2: Reference Variables on Nodes

Add variable keys to a node's `variableKeys` array. The system will attempt to extract those variables when the conversation reaches that node.

```json
{
  "id": "collect-info",
  "type": "prompt",
  "position": { "x": 300, "y": 0 },
  "data": {
    "type": "prompt",
    "title": "Collect Info",
    "prompt": "Ask the customer for their name and email.",
    "variableKeys": ["customer_name", "customer_email"]
  }
}
```

### Extraction Behavior by Execution Mode

- **Smart / Balance mode:** Variables are extracted incrementally — only configs from **visited nodes** are accumulated and extracted at each step
- **Turbo mode:** All variables from `variableConfigs` are extracted at every step regardless of current node

---

## Global Nodes

A **global node** is a `prompt` node marked with `isGlobalNode: true`. It becomes reachable from **any regular node** without needing an explicit edge.

### Use Cases

- **Escalation** — "Transfer to human agent" reachable from any state
- **FAQ / Help** — "Answer general questions" accessible at any point
- **Cancel / Abort** — "User wants to cancel" always available

### How It Works

1. Mark a prompt node as global:
   ```json
   {
     "id": "escalate",
     "type": "prompt",
     "position": { "x": 600, "y": 200 },
     "data": {
       "type": "prompt",
       "title": "Escalate to Human",
       "prompt": "Tell the user you're transferring them to a human agent.",
       "isGlobalNode": true,
       "globalNodeReason": "User can request human agent at any point"
     }
   }
   ```

2. The decision engine automatically adds this node as a transition option from all regular (non-global, non-end) nodes — no edges needed.

### Transition Rules

| From → To | Allowed? |
|-----------|----------|
| Regular node → Global node | Yes (auto-discovered, no edge needed) |
| Regular node → Regular node | Only via explicit edge |
| Global node → Global node | Only via explicit edge (not auto-discovered) |
| Global node → Regular node | Only via explicit edge |
| End node → Any node | No transitions |

### globalNodeReason

A human-readable explanation for **why** this node is global. It has no functional impact but documents the design intent. Example: `"User can request human agent at any point in the conversation"`.

---

## Knowledge Base on Nodes

Prompt nodes can reference a knowledge base via `knowledgeBaseId`. When set, the node uses RAG (Retrieval-Augmented Generation) to search the knowledge base for relevant context before generating a response.

```json
{
  "type": "prompt",
  "title": "Answer FAQ",
  "prompt": "Answer the user's question using the knowledge base.",
  "knowledgeBaseId": "kb-id-from-knowledgebase-api"
}
```

---

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

### Global Escalation Pattern

No edges needed to the global node — it's auto-discovered:

```
start → collect-info → process → end
                                      (escalate is reachable from any non-end node)
[global] escalate → end
```

## Validation Rules

- Pathway **must** have at least one `start` node
- Pathway **should** have at least one `end` node
- All non-terminal nodes should be reachable from start and able to reach an end node
- Node `id` must be unique within the pathway
- `variableKeys` must reference keys that exist in the agent's `variableConfigs` (set via `update_agent`)
- `tools` must reference valid tool config IDs from the project's tool list

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
- Use `isGlobalNode: true` for nodes that should be reachable from any state (e.g., escalation, help)
- Assign tools only to nodes that need them — per-node filtering keeps the LLM focused
- Define `variableKeys` on nodes where the user is expected to provide that information
- Use `list_tools` to get tool IDs before assigning them to nodes
