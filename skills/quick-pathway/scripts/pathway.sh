#!/usr/bin/env bash
# Pathors API helper — pathway operations (sequential safety enforced)
# Usage: pathway.sh <action> <projectId> [args...]
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
  get)
    [[ -z "${2:-}" ]] && { echo "Usage: pathway.sh get <projectId>"; exit 1; }
    result=$(call GET "/projects/$2/pathway")
    echo "$result" | jq '{
      nodeCount: (.data.nodes | length),
      edgeCount: (.data.edges | length),
      version: .data.version,
      nodes: [.data.nodes[] | { id, type: .data.type, title: (.data.title // .data.label // "untitled") }],
      edges: [.data.edges[] | { id, from: .source, to: .target, condition: .data.condition }]
    }'
    ;;
  get-node)
    [[ -z "${2:-}" || -z "${3:-}" ]] && { echo "Usage: pathway.sh get-node <projectId> <nodeId>"; exit 1; }
    call GET "/projects/$2/pathway/nodes/$3" | jq '.data'
    ;;
  add-node)
    [[ -z "${2:-}" || -z "${3:-}" ]] && { echo "Usage: pathway.sh add-node <projectId> <json>"; exit 1; }
    body="$3"
    if ! echo "$body" | jq empty 2>/dev/null; then
      echo "ERROR: Invalid JSON" >&2; exit 1
    fi
    # Type guard: require id and data.type
    node_id=$(echo "$body" | jq -r '.id // empty')
    node_type=$(echo "$body" | jq -r '.data.type // empty')
    if [[ -z "$node_id" ]]; then
      echo "ERROR: Node must have 'id'" >&2; exit 1
    fi
    if [[ -z "$node_type" ]]; then
      echo "ERROR: Node must have 'data.type' (start|prompt|end|goto)" >&2; exit 1
    fi
    result=$(call POST "/projects/$2/pathway/nodes" -d "$body")
    echo "$result" | jq '{ ok: true, id: .data.id, type: .data.data.type, title: (.data.data.title // "untitled") }'
    ;;
  add-edge)
    [[ -z "${2:-}" || -z "${3:-}" ]] && { echo "Usage: pathway.sh add-edge <projectId> <json>"; exit 1; }
    body="$3"
    if ! echo "$body" | jq empty 2>/dev/null; then
      echo "ERROR: Invalid JSON" >&2; exit 1
    fi
    source=$(echo "$body" | jq -r '.source // empty')
    target=$(echo "$body" | jq -r '.target // empty')
    if [[ -z "$source" || -z "$target" ]]; then
      echo "ERROR: Edge must have 'source' and 'target'" >&2; exit 1
    fi
    result=$(call POST "/projects/$2/pathway/edges" -d "$body")
    echo "$result" | jq '{ ok: true, id: .data.id, from: .data.source, to: .data.target }'
    ;;
  update-node)
    [[ -z "${2:-}" || -z "${3:-}" || -z "${4:-}" ]] && { echo "Usage: pathway.sh update-node <projectId> <nodeId> <json>"; exit 1; }
    body="$4"
    if ! echo "$body" | jq empty 2>/dev/null; then
      echo "ERROR: Invalid JSON" >&2; exit 1
    fi
    result=$(call PATCH "/projects/$2/pathway/nodes/$3" -d "$body")
    echo "$result" | jq '{ ok: true, id: .data.id, title: (.data.data.title // "updated") }'
    ;;
  delete-node)
    [[ -z "${2:-}" || -z "${3:-}" ]] && { echo "Usage: pathway.sh delete-node <projectId> <nodeId>"; exit 1; }
    call DELETE "/projects/$2/pathway/nodes/$3" | jq '{ ok: true, message, deletedEdges }'
    ;;
  delete-edge)
    [[ -z "${2:-}" || -z "${3:-}" ]] && { echo "Usage: pathway.sh delete-edge <projectId> <edgeId>"; exit 1; }
    call DELETE "/projects/$2/pathway/edges/$3" | jq '{ ok: true, message }'
    ;;
  replace)
    [[ -z "${2:-}" || -z "${3:-}" ]] && { echo "Usage: pathway.sh replace <projectId> <json>"; exit 1; }
    body="$3"
    if ! echo "$body" | jq empty 2>/dev/null; then
      echo "ERROR: Invalid JSON" >&2; exit 1
    fi
    # Type guard: require nodes array
    has_nodes=$(echo "$body" | jq 'has("nodes")')
    if [[ "$has_nodes" != "true" ]]; then
      echo "ERROR: Full pathway must have 'nodes' array" >&2; exit 1
    fi
    call PUT "/projects/$2/pathway" -d "$body" | jq '{ ok: true, message }'
    ;;
  version)
    [[ -z "${2:-}" ]] && { echo "Usage: pathway.sh version <projectId>"; exit 1; }
    call GET "/projects/$2/pathway/version" | jq '{ version: .data.version, createdAt: .data.createdAt, reason: .data.reason }'
    ;;
  versions)
    [[ -z "${2:-}" ]] && { echo "Usage: pathway.sh versions <projectId>"; exit 1; }
    call GET "/projects/$2/pathway/versions" | jq '[.data[] | { version, createdAt, reason }]'
    ;;
  rollback)
    [[ -z "${2:-}" || -z "${3:-}" ]] && { echo "Usage: pathway.sh rollback <projectId> <version>"; exit 1; }
    call POST "/projects/$2/pathway/rollback" -d "{\"targetVersion\":$3}" | jq '{ ok: true, version: .data.version }'
    ;;
  batch-setup)
    # Convenience: create multiple nodes + edges sequentially from a JSON file
    [[ -z "${2:-}" || -z "${3:-}" ]] && { echo "Usage: pathway.sh batch-setup <projectId> <json>"; exit 1; }
    body="$3"
    if ! echo "$body" | jq empty 2>/dev/null; then
      echo "ERROR: Invalid JSON" >&2; exit 1
    fi

    pid="$2"
    echo "Setting up pathway sequentially..."

    # Process nodes one by one
    node_count=$(echo "$body" | jq '.nodes | length')
    for i in $(seq 0 $((node_count - 1))); do
      node=$(echo "$body" | jq ".nodes[$i]")
      node_id=$(echo "$node" | jq -r '.id')
      result=$(call POST "/projects/$pid/pathway/nodes" -d "$node" 2>&1) || {
        echo "ERROR adding node $node_id: $result" >&2
        exit 1
      }
      echo "  + node: $node_id"
    done

    # Process edges one by one
    edge_count=$(echo "$body" | jq '.edges | length')
    for i in $(seq 0 $((edge_count - 1))); do
      edge=$(echo "$body" | jq ".edges[$i]")
      source=$(echo "$edge" | jq -r '.source')
      target=$(echo "$edge" | jq -r '.target')
      result=$(call POST "/projects/$pid/pathway/edges" -d "$edge" 2>&1) || {
        echo "ERROR adding edge $source→$target: $result" >&2
        exit 1
      }
      echo "  + edge: $source → $target"
    done

    echo "Done: $node_count nodes, $edge_count edges"
    ;;
  *)
    echo "Usage: pathway.sh <action> <projectId> [args...]"
    echo "  get <id>                          Compact pathway overview"
    echo "  get-node <id> <nodeId>            Full node details"
    echo "  add-node <id> <json>              Create node (type-guarded)"
    echo "  add-edge <id> <json>              Create edge (type-guarded)"
    echo "  update-node <id> <nodeId> <json>  Update node"
    echo "  delete-node <id> <nodeId>         Delete node + connected edges"
    echo "  delete-edge <id> <edgeId>         Delete edge"
    echo "  replace <id> <json>               Replace entire pathway"
    echo "  version <id>                      Current version info"
    echo "  versions <id>                     Version history"
    echo "  rollback <id> <version>           Rollback to version"
    echo "  batch-setup <id> <json>           Add nodes+edges sequentially (safe)"
    exit 1
    ;;
esac
