#!/usr/bin/env bash
# Pathors API helper — overview operations
# Usage: api.sh <action> [args...]
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
  list-projects)
    call GET /projects | jq -r '.data[] | "- \(.id): \(.name)"'
    ;;
  get-project)
    [[ -z "${2:-}" ]] && { echo "Usage: api.sh get-project <projectId>"; exit 1; }
    result=$(call GET "/projects/$2")
    echo "$result" | jq -r '"Project: \(.data.name) (\(.data.id))\nCreated: \(.data.createdAt)"'
    ;;
  summary)
    [[ -z "${2:-}" ]] && { echo "Usage: api.sh summary <projectId>"; exit 1; }
    pid="$2"
    agent=$(call GET "/projects/$pid/agent")
    pathway=$(call GET "/projects/$pid/pathway")
    tools=$(call GET "/projects/$pid/tools")

    echo "=== Agent ==="
    echo "$agent" | jq -r '.data | "Name: \(.name)\nType: \(.type)\nStatus: \(.status)\nModel: \(.executionMode // "default")\nMemory: \(.memoryEnabled)"'
    echo ""
    echo "=== Pathway ==="
    node_count=$(echo "$pathway" | jq '.data.nodes | length')
    edge_count=$(echo "$pathway" | jq '.data.edges | length')
    echo "Nodes: $node_count | Edges: $edge_count"
    echo "$pathway" | jq -r '.data.nodes[] | "  [\(.data.type)] \(.id): \(.data.title // .data.label // "untitled")"'
    echo ""
    echo "=== Tools ($( echo "$tools" | jq '.data | length')) ==="
    echo "$tools" | jq -r '.data[] | "  [\(.type)] \(.name // .id): \(.description // "no description")"'
    ;;
  *)
    echo "Usage: api.sh <action>"
    echo "  list-projects          List all projects"
    echo "  get-project <id>       Get project details"
    echo "  summary <id>           Full project summary (agent + pathway + tools)"
    exit 1
    ;;
esac
