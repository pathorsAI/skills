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
    "globalPrompt": "你是...",
    "executionMode": "smart",
    "timezone": "Asia/Taipei"
  }
}
```

### Global Prompt Best Practices

**The global prompt should carry 80% of the agent's behavior.** Node prompts are supplements, not replacements.

Write the global prompt as if there were NO nodes — it should handle:

- **Persona and tone** — Who is the agent? How should it talk?
- **Core rules** — What can and can't the agent do?
- **Language** — What language(s) should the agent use?
- **Error handling** — What to do when confused or uncertain?

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

The pathway is a state machine that controls the conversation flow. Each node is a conversation state, each edge is a transition.

### Architecture Principles

#### 1. Keep Flows Flat and Independent

Each major flow should be a **self-contained branch** from the start node. Avoid deeply nested paths or excessive back-and-forth between flows.

Bad — deeply nested, tangled:
```
start → A → B → C → D → E → F → end
              ↕       ↕
              G → H → I
```

Good — flat branches, independent flows:
```
start
  ├─ "billing" → billing-inquiry → end
  ├─ "support" → check-status → resolve → end
  └─ "booking" → collect-info → confirm → end
```

**Why:** Deep nesting means more transitions, more chances for the agent to get lost, and harder debugging. Each flow should be understandable on its own.

#### 2. Verify Reachability

For every node, ask: **Can a real user actually get here?**

Check that:
- Edge conditions from the previous node actually match what users would say
- The path to this node doesn't require the user to pass through too many steps
- There aren't dead-end nodes with no outgoing edges (unless they're `end` nodes)

Common mistake — a node exists but the edge condition is too specific:
```
start → "User says exactly 'I want to check my order'" → order-lookup
```
→ Most users won't say this exact phrase. Use broader conditions:
```
start → "User wants to check, track, or ask about an order" → order-lookup
```

#### 3. Minimize Transitions

Every transition is a decision point where the agent can make a wrong choice. Fewer transitions = more reliable agent.

**Rule of thumb:** If a flow needs more than 4 steps (nodes), question whether some steps can be merged.

Bad — over-engineered:
```
start → ask-name → ask-email → ask-phone → confirm-info → process → confirm-result → end
```

Good — consolidated:
```
start → collect-info → process-and-confirm → end
```

The node prompt for `collect-info` can handle asking for name, email, and phone in one conversation state.

#### 4. Each Node = One Conversational Mission

A node should represent a task that needs **at least one round of conversation**. Don't create nodes that just route — use edge conditions instead.

Bad — router node with no conversation:
```
start → router (classify intent, no talking) → billing / support
```

Good — edge conditions on start:
```
start (greet + ask intent)
  ├─ "wants billing help" → billing
  └─ "needs support" → support
```

#### 5. Node Prompts Are Supplements

Since each node only sees global prompt + its own prompt:
- **Don't repeat** the global prompt in node prompts
- **Do specify** the specific task for this node
- **Keep node prompts short** — 1-3 sentences describing what to do at this step

```
Node "collect-info" prompt: "Ask the customer for their order number. Once you have it, use the lookup tool to find the order."
```

That's it. The global prompt already defines persona, language, and rules.

### Node Types

| Type | Purpose |
|------|---------|
| `start` | Entry point — at least one required |
| `prompt` | A conversation state |
| `end` | Terminal state that ends the session |
| `goto` | Redirect to another node (for loops or convergence) |

### Node Schema

```json
{
  "id": "collect-info",
  "type": "prompt",
  "position": { "x": 300, "y": 0 },
  "data": {
    "type": "prompt",
    "title": "Collect Info",
    "prompt": "Ask the customer for their order number.",
    "tools": ["tool-config-id"],
    "variableKeys": ["order_number"]
  }
}
```

`data.type` must match the node's `type`. Only `type`, `title`, and `prompt` (or `referenceNodeId` for goto) are required.

### Edge Schema

```json
{
  "source": "start-1",
  "target": "collect-info",
  "condition": "User wants to check order status"
}
```

Write conditions in **natural language** — the LLM interprets them. Write them in the agent's primary language.

### Global Nodes

A prompt node with `isGlobalNode: true` is reachable from **any** non-end node without explicit edges. Use for:

- **Escalation** — "Transfer to human" available at any point
- **FAQ** — Answer general questions from anywhere
- **Cancel** — User wants to stop

```json
{
  "id": "escalate",
  "type": "prompt",
  "data": {
    "type": "prompt",
    "title": "Escalate",
    "prompt": "Tell the user you're transferring them to a human agent.",
    "isGlobalNode": true,
    "globalNodeReason": "User can request human agent at any point"
  }
}
```

### Common Patterns

**Linear Flow** — forms, surveys, simple transactions:
```
start → collect-info → process → confirm → end
```

**Branching Flow** — multi-purpose agents:
```
start → billing / support / general-qa → end
```

**Loop with Escalation** — FAQ bots:
```
start → qa-loop ↻ (keep answering) → escalate or end
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

- [ ] Global prompt covers persona, rules, language, and error handling
- [ ] Each node has a clear conversational purpose (not just routing)
- [ ] Every node is reachable by a real user through natural conversation
- [ ] Edge conditions are broad enough to catch real user language
- [ ] No flow exceeds 4-5 nodes deep
- [ ] Flows are independent — not tangled together
- [ ] End nodes exist for all terminal paths
- [ ] Global nodes cover cross-cutting concerns (escalation, cancel)
- [ ] Tools are assigned only to nodes that need them

## IMPORTANT: Sequential Operations Only

**Never call multiple pathway mutation tools in parallel.** Pathway is a single JSON document — parallel writes overwrite each other.

Use `update_pathway` to replace the entire pathway in one call for batch setup.
