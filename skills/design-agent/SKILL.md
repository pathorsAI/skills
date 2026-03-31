---
name: design-agent
description: Design a Pathors agent — project setup, global prompt, pathway architecture, and tools
---

# Design Agent

Design a complete Pathors agent: project creation, prompt strategy, conversation flow, and tool configuration.

## Step 1: Create Project

```
Tool: create_project
Input: { "name": "My Agent" }
```

This creates a project with blank agent config and a default pathway (start + end nodes).

## Step 2: Write the Global Prompt

The **global prompt** is the most important part of your agent. It defines the agent's persona, rules, and behavior across ALL conversation states.

```
Tool: update_agent
Input: {
  "projectId": "<project-id>",
  "config": {
    "name": "Customer Support Agent",
    "globalPrompt": "...",
    "executionMode": "smart",
    "timezone": "Asia/Taipei"
  }
}
```

### Global Prompt Best Practices

**The global prompt should carry 80% of the agent's behavior.** Node prompts are supplements, not replacements.

Write the global prompt as if there were NO nodes — it should handle:

- **Persona and tone** — Who is the agent? How should it talk?
- **Core rules** — What can and can't the agent do? Transfer rules, escalation triggers, compliance rules
- **Language** — What language(s) should the agent use?
- **Error handling** — What to do when confused or uncertain?
- **Cross-cutting logic** — Brand name normalization, number formatting, pronunciation rules, etc.

**Why this matters:** Each node's prompt is **isolated** — when the agent enters a node, it only sees the global prompt + that node's prompt. It does NOT see other nodes' prompts. So anything important must be in the global prompt.

Bad — critical rules buried in a single node:
```
Global prompt: "你是客服人員"
Node "collect-info" prompt: "注意：不要透露內部價格，要先確認客戶身份..."
```
→ These rules disappear once the agent leaves this node.

Good — rules in global prompt, nodes handle specific tasks:
```
Global prompt: "你是客服人員。規則：1) 不透露內部價格 2) 先確認客戶身份..."
Node "collect-info" prompt: "詢問客戶的訂單編號和 email"
```

## Step 3: Design the Pathway

The pathway is a state machine. Each node is a conversation state, each edge is a transition.

### Think in Terms of a Main Trunk with Branches

A real-world agent typically has one **main flow** (the trunk) with **independent branches** that handle specific intents. The trunk is the happy path; branches handle detours.

**Example — Automotive Service Booking Agent:**

```
Main trunk:
  start (greet + identify caller)
    → vehicle mileage confirmation
    → service selection
    → shop type aggregation
    → drop-off / wait-on-site decision
    → appointment scheduling
    → confirmation

Branches from start (intent detection):
  ├─ "cancel/reschedule" → cancel handler → (reschedule loops back to mileage)
  ├─ "body shop / collision" → body shop info → transfer_call
  ├─ "windshield / glass" → windshield info → transfer_call
  ├─ "towing" → towing vendor → transfer_call
  ├─ "parts / accessories" → generic transfer → transfer_call
  └─ "vehicle status" → generic transfer → transfer_call

Branches from service selection:
  ├─ "warranty" → warranty info gathering → transfer_call
  ├─ "recall" → recall info gathering → transfer_call
  └─ "tire purchase" → tire info gathering → transfer_call

Global node (reachable from anywhere):
  [global] live agent request → transfer_call
```

Key patterns from this real example:
- **The trunk is linear** — 6-7 steps covering the main booking flow
- **Branches are self-contained** — each handles one intent, gathers info if needed, then transfers or loops back
- **Most branches don't end at an `end` node** — they use `transfer_call` or `end_call` tools within prompt nodes
- **Goto nodes** route back to the trunk after branch completion

### Architecture Principles

#### 1. Not Everything Ends at an End Node

`end` nodes are just one way to terminate a conversation. In practice, many flows end via **tools**:

- `transfer_call` — Hand off to a live agent or department
- `end_call` — Programmatically end the session

These tools can be called from any prompt node. A prompt node that triggers `transfer_call` doesn't need an edge to an `end` node — the call is already over.

Use `end` nodes for the natural conclusion of the main trunk (e.g., appointment confirmed, goodbye). Use tools for transfers and early terminations.

#### 2. Keep Flows Flat and Independent

Each branch from the trunk should be **self-contained**. Avoid crossing between branches or creating deeply nested sub-flows.

Bad — branches tangled together:
```
start → A → B → C
              ↕
         D → E → F
              ↕
         G → H
```

Good — flat branches, independent:
```
start (main trunk)
  ├─ "intent A" → handle-A → transfer_call
  ├─ "intent B" → handle-B → transfer_call
  └─ (default) → mileage → service → scheduling → confirmation
```

**Why:** Each branch should be understandable on its own. If you can't explain a branch in one sentence, it's too complex.

#### 3. Verify Reachability

For every node, ask: **Can a real user actually get here?**

- Edge conditions should be **broad enough** to match natural speech, not exact phrases
- The path shouldn't require too many steps to reach

Bad — too specific:
```
"User says exactly 'I want to check my order'" → order-lookup
```

Good — matches natural variations:
```
"User wants to check, track, or ask about an order" → order-lookup
```

#### 4. Each Node = One Conversational Mission

A node should represent a task that needs **at least one round of conversation**. Don't create nodes that just route — use edge conditions instead.

Bad — router node with no conversation:
```
start → router (classify intent) → billing / support
```

Good — edge conditions on start:
```
start (greet + detect intent)
  ├─ "billing" → billing
  └─ "support" → support
```

#### 5. Node Prompts Are Supplements

Since each node only sees global prompt + its own prompt:
- **Don't repeat** the global prompt in node prompts
- **Do specify** the concrete task for this node
- **Keep node prompts focused** — describe what to do at this step, what data to collect, what tools to use

#### 6. Use Goto Nodes for Routing

When a branch needs to rejoin the trunk, or when flows need to loop, use **goto nodes** instead of tangled edges.

Common goto patterns:
- After a transfer branch completes → goto confirmation or end
- Reschedule intent → goto back to vehicle mileage step
- Retry loop → goto back to the question node

### Node Types

| Type | Purpose |
|------|---------|
| `start` | Entry point — at least one required |
| `prompt` | A conversation state with a specific mission |
| `end` | Terminal state that ends the session |
| `goto` | Redirect to another node (for loops, convergence, or post-branch routing) |

### Node Schema

```json
{
  "id": "service-selection",
  "type": "prompt",
  "position": { "x": 300, "y": 0 },
  "data": {
    "type": "prompt",
    "title": "Service Selection",
    "prompt": "Ask what service the customer needs. Map their request to available services from the API data.",
    "tools": ["lookup-tool-id"],
    "variableKeys": ["SelectedService"]
  }
}
```

### Edge Schema

```json
{
  "source": "start",
  "target": "service-selection",
  "condition": "Customer confirms their vehicle and mileage"
}
```

Write conditions in **natural language** in the agent's primary language. The LLM interprets them.

### Global Nodes

A prompt node with `isGlobalNode: true` is reachable from **any** non-end node without explicit edges. Use for cross-cutting concerns:

- **Live agent request** — "Transfer me to a human" available from any state
- **FAQ / Help** — General questions that can come up at any point
- **Cancel** — "I changed my mind" at any stage

### Common Patterns

**Main trunk with branches** — The most common real-world pattern. A linear main flow with independent branches for different intents:

```
start
  ├─ (branch intents) → handle → transfer_call or goto(trunk)
  └─ (main flow) → step1 → step2 → step3 → confirmation
```

**Loop with exit** — For iterative data collection or Q&A:

```
collect-info ↻ (missing data → ask again)
  └─ (all data collected) → next step
```

**Transfer branches** — Gather context, then hand off:

```
warranty-info → (collect vehicle + issue details) → transfer_call → goto(confirmation)
```

## Step 4: Add Tools

```
Tool: list_tool_types    → see available types
Tool: create_tool        → create a tool
Tool: update_tool        → configure name, description, metadata
```

Then assign tool IDs to nodes via `data.tools`. See the `manage-tools` skill for configuration details.

### Tool Assignment

In **smart** and **balance** execution modes, only tools assigned to the **current node** are available. This keeps each step focused.

- Assign tools only to nodes that need them
- Use `list_tools` to get IDs before assigning
- `transfer_call` and `end_call` tools can be used in any prompt node to end/transfer the session — they don't require routing to an `end` node

## Step 5: Configure Variables (Optional)

Variable extraction captures structured data from conversations.

1. Define variables on the agent:
```
Tool: update_agent
Input: {
  "projectId": "<project-id>",
  "config": {
    "variableConfigs": [
      { "key": "customer_email", "type": "email", "description": "Customer's email" }
    ]
  }
}
```

2. Reference variable keys on nodes via `data.variableKeys`.

## Checklist

Before deploying, verify:

- [ ] Global prompt covers persona, rules, language, error handling, and cross-cutting logic
- [ ] Each node has a clear conversational mission (not just routing)
- [ ] There is a clear main trunk flow
- [ ] Branches are self-contained and don't tangle with each other
- [ ] Every node is reachable by a real user through natural conversation
- [ ] Edge conditions are broad enough to catch real user language
- [ ] Transfer branches use `transfer_call` / `end_call` tools — they don't need `end` nodes
- [ ] Goto nodes are used to route back to the trunk after branches
- [ ] Global nodes cover cross-cutting concerns (live agent, cancel)
- [ ] Tools are assigned only to nodes that need them

## IMPORTANT: Sequential Operations Only

**Never call multiple pathway mutation tools in parallel.** Pathway is a single JSON document — parallel writes overwrite each other.

Use `update_pathway` to replace the entire pathway in one call for batch setup.
