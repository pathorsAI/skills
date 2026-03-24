#!/usr/bin/env bash
# Pathors API helper — tool operations
# Usage: tools.sh <action> <projectId> [args...]
set -euo pipefail

API_URL="${PATHORS_API_URL:-https://api.pathors.com}"
API_KEY="${PATHORS_API_KEY:-}"

if [[ -z "$API_KEY" ]]; then
  echo "ERROR: PATHORS_API_KEY is not set" >&2
  exit 1
fi

call() {
  local method="$1" path="$2"
  shift 2
  curl -sf -X "$method" "${API_URL}/v1${path}" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    "$@" 2>/dev/null
}

case "${1:-help}" in
  list)
    [[ -z "${2:-}" ]] && { echo "Usage: tools.sh list <projectId>"; exit 1; }
    call GET "/projects/$2/tools" | jq '[.data[] | { id, type, name, description }]'
    ;;
  types)
    [[ -z "${2:-}" ]] && { echo "Usage: tools.sh types <projectId>"; exit 1; }
    call GET "/projects/$2/tools/types" | jq '.data'
    ;;
  get)
    [[ -z "${2:-}" || -z "${3:-}" ]] && { echo "Usage: tools.sh get <projectId> <toolId>"; exit 1; }
    call GET "/projects/$2/tools/$3" | jq '.data'
    ;;
  create)
    [[ -z "${2:-}" || -z "${3:-}" ]] && { echo "Usage: tools.sh create <projectId> <json>"; exit 1; }
    body="$3"
    if ! echo "$body" | jq empty 2>/dev/null; then
      echo "ERROR: Invalid JSON" >&2; exit 1
    fi
    # Type guard: require type field
    tool_type=$(echo "$body" | jq -r '.type // empty')
    if [[ -z "$tool_type" ]]; then
      echo "ERROR: Tool must have 'type' field" >&2
      echo "Use 'tools.sh types <projectId>' to see available types" >&2
      exit 1
    fi
    result=$(call POST "/projects/$2/tools" -d "$body")
    echo "$result" | jq '{ ok: true, id: .data.id, type: .data.type, name: .data.name }'
    ;;
  update)
    [[ -z "${2:-}" || -z "${3:-}" || -z "${4:-}" ]] && { echo "Usage: tools.sh update <projectId> <toolId> <json>"; exit 1; }
    body="$4"
    if ! echo "$body" | jq empty 2>/dev/null; then
      echo "ERROR: Invalid JSON" >&2; exit 1
    fi
    # Type guard: only allow known fields
    allowed='["name","description","metadata","inputSchema"]'
    invalid=$(echo "$body" | jq -r --argjson allowed "$allowed" 'keys - $allowed | .[]')
    if [[ -n "$invalid" ]]; then
      echo "ERROR: Unknown fields: $invalid" >&2
      echo "Allowed: name, description, metadata, inputSchema" >&2
      exit 1
    fi
    result=$(call PUT "/projects/$2/tools/$3" -d "$body")
    echo "$result" | jq '{ ok: true, id: .data.id, name: .data.name }'
    ;;
  delete)
    [[ -z "${2:-}" || -z "${3:-}" ]] && { echo "Usage: tools.sh delete <projectId> <toolId>"; exit 1; }
    call DELETE "/projects/$2/tools/$3" | jq '{ ok: true, message }'
    ;;
  *)
    echo "Usage: tools.sh <action> <projectId> [args...]"
    echo "  list <id>                      List all tools (compact)"
    echo "  types <id>                     Available tool types"
    echo "  get <id> <toolId>              Full tool details"
    echo "  create <id> <json>             Create tool (type-guarded)"
    echo "  update <id> <toolId> <json>    Update tool (field-validated)"
    echo "  delete <id> <toolId>           Delete tool"
    exit 1
    ;;
esac
