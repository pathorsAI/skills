---
name: manage-tools
description: Configure and manage tools available to Pathors agents
---

# Manage Tools

Add, configure, and manage tools that your Pathors agent can use during conversations.

## Workflow

### List Available Tool Types

```
Tool: list_tool_types
```

Common types: `restful`, `duckduckgo-search`, `google-calendar`, `google-sheet`, `mcp`, `smtp`, `agent`

### List Project Tools

```
Tool: list_tools
Input: { "projectId": "<project-id>" }
```

### Create a Tool

```
Tool: create_tool
Input: {
  "projectId": "<project-id>",
  "type": "restful",
  "metadata": {
    "url": "https://api.example.com/lookup",
    "method": "GET",
    "headers": { "Authorization": "Bearer xxx" }
  }
}
```

### Update a Tool

```
Tool: update_tool
Input: {
  "projectId": "<project-id>",
  "toolId": "<tool-id>",
  "name": "Customer Lookup",
  "description": "Look up customer information by email or phone number"
}
```

### Delete a Tool

```
Tool: delete_tool
Input: { "projectId": "<project-id>", "toolId": "<tool-id>" }
```

## Tool Types

### RESTful API (`restful`)

Connect to any REST API endpoint.

Metadata fields:
- `url` — Endpoint URL
- `method` — HTTP method (GET, POST, PUT, DELETE)
- `headers` — Request headers
- `body` — Request body template (for POST/PUT)

### DuckDuckGo Search (`duckduckgo-search`)

Web search capability. No special metadata needed.

### Google Calendar (`google-calendar`)

Read/write Google Calendar events. Requires OAuth setup.

### Google Sheet (`google-sheet`)

Read/write Google Sheets data. Requires OAuth setup.

### MCP (`mcp`)

Connect to external MCP servers as tools.

Metadata fields:
- `serverUrl` — MCP server URL
- `headers` — Auth headers for the MCP server

### SMTP (`smtp`)

Send emails from the agent.

Metadata fields:
- `host`, `port`, `secure` — SMTP server config
- `auth` — `{ user, pass }` credentials

### Agent (`agent`)

Delegate to another Pathors agent as a sub-agent.

## Tips

- Give tools clear, descriptive names — the LLM uses the name to decide when to call them
- Write detailed descriptions — include what the tool does and when to use it
- Test tools individually before connecting them to the agent
- Use `get_tool` to verify configuration after updates
