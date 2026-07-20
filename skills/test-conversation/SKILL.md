---
name: test-conversation
description: Interactively test a Pathors agent — drive a live conversation turn by turn and inspect node transitions, variable extraction, and tool calls
---

# Test Conversation

Take the user seat and talk to your agent directly. Unlike `run_test_suite` (batch, simulator-driven), interactive conversations let YOU drive each turn and inspect the agent's internal state after every reply — which node it landed on, which variables it extracted, which tools it called.

Use this to walk through every path after designing an agent, to reproduce a reported bug live, or to verify a config fix before writing a regression test.

## Important: Real Sessions, Real Billing

Interactive conversations behave like the **real API channel**, not like test runs:

- Agent tools **execute for real** (APIs are called, emails are sent, calendars are written)
- Post-session **webhooks deliver**
- Every `send_message` turn is **billed as one text request** against the project's credits
- Conversations are capped at **50 user turns** — end them and start fresh instead of looping

Be deliberate: don't point a test conversation at an agent whose tools have production side effects unless that's what you intend.

## Workflow

### Step 1: Start a Conversation

```
Tool: start_conversation
Input: { "projectId": "<project-id>" }
```

To simulate a real integration that seeds session context, pass `variables` — they are injected into the agent's prompt context exactly like a real integration would:

```
Tool: start_conversation
Input: {
  "projectId": "<project-id>",
  "variables": { "customer_name": "王小明", "vip": true }
}
```

Returns the initial state:

```json
{
  "sessionId": "…",
  "currentNodeId": "start",
  "extractedVariables": {},
  "isEnded": false,
  "messageCount": 0,
  "userTurnCount": 0
}
```

Keep the `sessionId` — every subsequent call needs it.

### Step 2: Drive the Conversation Turn by Turn

```
Tool: send_message
Input: {
  "projectId": "<project-id>",
  "sessionId": "<session-id>",
  "message": "Hi, I'd like to book a service appointment"
}
```

Each call runs a full agent turn (pathway/decision inference, tool calls, knowledge-base retrieval) and returns the reply **plus** the internal state, so you can assert on more than the reply text:

```json
{
  "reply": "…agent's reply…",
  "sessionId": "…",
  "currentNodeId": "service-selection",
  "extractedVariables": { "customer_name": "王小明" },
  "isEnded": false,
  "toolEvents": [
    { "type": "tool_call", "name": "lookup-customer", "args": { "phone": "…" } },
    { "type": "tool_result", "name": "lookup-customer", "content": "…" }
  ]
}
```

After each turn, check:

- **`currentNodeId`** — did the pathway transition to the node you expected?
- **`extractedVariables`** — did the agent capture the data you just gave it?
- **`toolEvents`** — did the expected tool fire, with the right args? Did its result come back cleanly?
- **`isEnded`** — did the agent close the conversation (expected at the end, a bug mid-flow)?

### Step 3: Inspect State Without Advancing (Optional)

To re-check state between turns without sending a message (no billing, read-only):

```
Tool: get_conversation_state
Input: { "projectId": "<project-id>", "sessionId": "<session-id>" }
```

Returns `sessionId`, `currentNodeId`, `extractedVariables`, `isEnded`, `messageCount`, and `userTurnCount`.

### Step 4: End the Conversation

Always finish with:

```
Tool: end_conversation
Input: { "projectId": "<project-id>", "sessionId": "<session-id>" }
```

This triggers the normal end-of-session pipeline (final variable extraction, post-session webhook, evaluation) and persists the session. It's idempotent — ending an already-ended conversation succeeds without re-running the pipeline (the response includes `alreadyEnded`).

Ended sessions appear in session history like any other session, so you can review them later with `get_session`.

## Common Testing Patterns

### Pattern 1: Walk Every Path

After designing a pathway (see the `design-agent` skill), verify each branch is actually reachable through natural conversation:

1. `get_agent` to see the pathway — list every branch from the trunk
2. For **each branch**, start a fresh conversation and speak like a real user with that intent (natural phrasing, not the edge condition verbatim)
3. Confirm `currentNodeId` lands on the branch's node
4. Walk the branch to its terminal (end node, `transfer_call`, or `end_call`)
5. `end_conversation`, then repeat for the next branch

If a branch is unreachable with natural language, its edge condition is too narrow — fix it (see `design-agent` architecture principles), then re-test.

### Pattern 2: Verify Variable Extraction

1. Start a conversation and volunteer the data mid-conversation the way a real user would ("my email is jane@example.com, oh wait, actually it's jane.doe@example.com")
2. After the turn, check `extractedVariables` contains the **corrected** value under the right key
3. Test the awkward cases: data given before it's asked for, corrections, multiple values in one message
4. After `end_conversation`, final extraction runs — use `get_session` to confirm the persisted variables

### Pattern 3: Verify Tool Call Triggering

1. Steer the conversation to the node that owns the tool
2. Say the thing that should trigger it — check `toolEvents` for a `tool_call` with the expected `name` and `args`
3. Check the matching `tool_result` content is what the agent's reply was actually grounded in
4. Also test the negative: in nodes that should NOT call the tool, confirm `toolEvents` stays empty

Remember tool calls execute for real — use test endpoints or safe inputs where side effects matter.

### Pattern 4: Reproduce, Fix, Re-verify

When debugging (see the `debug-session` skill):

1. Replay the failing user's messages turn by turn and watch where the state diverges from expectation — that's your failure point
2. Fix the config
3. Start a **fresh** conversation and replay the same messages — confirm the state now transitions correctly
4. Then lock it in with a regression test case (`create_test_case`)

## Interactive Testing vs Test Suites

| | Interactive conversation | Test suite |
|---|---|---|
| Driver | You, turn by turn | LLM simulator |
| Visibility | Full state after every turn | Pass/fail against acceptance criteria |
| Best for | Exploration, path walking, live debugging | Regression protection, CI-style checks |
| When | While designing or fixing | After — to keep it fixed |

Use interactive conversations to **find and verify**; use test suites to **keep it verified**. They complement each other — a good workflow ends interactive sessions by turning the scenario into a test case.

## Troubleshooting

- **"Conversation not found"** — wrong `sessionId` or wrong `projectId` for that session
- **"Not an interactive MCP conversation"** — the session was opened by a real channel (web/phone/LINE/…), not by `start_conversation`. Live customer sessions can never be driven by these tools; start your own
- **"This conversation has ended"** — the agent (or you) already closed it; start a new one
- **Turn limit reached** — 50 user turns max; end it and start a new conversation
- **Insufficient credits** — turns are billed; top up the project's credits
