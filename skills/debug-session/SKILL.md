---
name: debug-session
description: Debug a Pathors agent session — diagnose issues from session history, fix agent/pathway config, and create regression test cases
---

# Debug Session

Diagnose agent issues from real session data, fix root causes, and create test cases to prevent regressions.

## Prerequisites

You need a `sessionId`. The project is inferred from the session itself.

If you don't have a session ID, use `list_sessions` with a `projectId` to find problematic sessions.

## Workflow

### Step 1: Identify the Problem Session

If the user provides a session ID, fetch it directly:

```
Tool: get_session
Input: { "sessionId": "<id>" }
```

If no session ID, search recent sessions for failures:

```
Tool: list_sessions
Input: { "projectId": "<id>", "pageSize": 20 }
```

Look for sessions with: short duration, abrupt endings, repeated node visits, or user complaints.

### Step 2: Analyze the Session Timeline

Read through the session events in order. Identify:

- **Where** did the conversation go wrong? (which node / which turn)
- **What** happened? Categorize the issue:

| Category | Signals |
|----------|---------|
| Wrong routing | Agent went to unexpected node; edge condition mismatch |
| Hallucination | Agent made up info instead of using tools |
| Tool failure | Tool call returned error; agent didn't handle it |
| Prompt issue | Agent tone/language/behavior doesn't match intent |
| Loop | Agent revisited the same node 3+ times |
| Missing path | User intent had no matching edge; fell through |

- **Why** did it happen? Trace back to the root cause in config.

### Step 3: Gather Context

Fetch the agent config to understand the root cause. Use the `projectId` from the session data:

```
Tool: get_agent    → Check global prompt, execution mode
Tool: list_tools   → Check tool definitions if tool-related issue
```

### Step 4: Fix the Root Cause

Apply the minimal fix. Common fixes by category:

| Category | Typical Fix |
|----------|-------------|
| Wrong routing | Update edge conditions to be more specific / mutually exclusive |
| Hallucination | Add "only answer using tools" instruction to global prompt or node prompt |
| Tool failure | Fix tool description; add error handling instruction to node prompt |
| Prompt issue | Update global prompt or node prompt |
| Loop | Add exit conditions on edges |
| Missing path | Add new node + edges for the uncovered intent |

Use the appropriate mutation tools:

```
Tool: update_agent   → Fix global prompt, execution mode
Tool: update_node    → Fix node prompts
Tool: create_edge    → Add missing transitions
Tool: delete_edge    → Remove incorrect transitions
Tool: create_node    → Add new conversation states
Tool: update_tool    → Fix tool descriptions
```

**IMPORTANT:** Pathway mutations must be sequential (read-modify-write on single JSON doc). Never call multiple pathway mutation tools in parallel.

### Step 5: Create Regression Test Case

This is the critical step. After fixing the issue, create a test case that reproduces the original failure scenario so it can be caught automatically in the future.

```
Tool: create_test_case
Input: {
  "projectId": "<id>",
  "name": "Regression: <short description of the bug>",
  "systemPrompt": "<simulate the user behavior that triggered the bug>",
  "maxTurns": <enough turns to reach the failure point>,
  "acceptanceCriteria": [
    "<what the agent SHOULD do now>",
    "<what the agent should NOT do (the old buggy behavior)>"
  ]
}
```

Tips for writing good test cases:
- The `systemPrompt` is the **simulated user** — write it to replay the conversation that broke
- Set `maxTurns` to at least the turn count where the bug occurred + 2
- Write acceptance criteria in plain language — they are evaluated by an LLM
- Include both positive ("agent should X") and negative ("agent should not Y") criteria

### Step 6: Add to Test Suite and Verify

Connect the test case to a suite and run it:

```
Tool: list_test_suites   → Find existing regression suite, or create one
Tool: create_test_suite  → If no regression suite exists:
  Input: { "projectId": "<id>", "name": "Regression Tests", "testCaseIds": ["<new-test-id>"] }
Tool: run_test_suite     → Run the suite
Tool: get_test_results   → Check results (may need to wait and retry)
```

If the test fails after your fix, revisit Step 4.

## Quick Reference: When to Stop

- **Fix verified** — test suite passes with the new test case → done
- **Can't reproduce** — session shows issue but current config seems correct → the issue may have been fixed by a prior change; create the test case anyway as a guard
- **Systemic issue** — problem is in the platform, not agent config → report to user, skip test case creation
