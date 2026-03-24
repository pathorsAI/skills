#!/usr/bin/env bash
# Pathors API helper — agent operations
# Usage: agent.sh <action> <projectId> [json-body]
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
    [[ -z "${2:-}" ]] && { echo "Usage: agent.sh get <projectId>"; exit 1; }
    result=$(call GET "/projects/$2/agent")
    echo "$result" | jq '{
      name: .data.name,
      type: .data.type,
      status: .data.status,
      executionMode: .data.executionMode,
      memoryEnabled: .data.memoryEnabled,
      hasPrompt: (.data.globalPrompt != null and .data.globalPrompt != ""),
      promptLength: (.data.globalPrompt // "" | length),
      hasWebhook: (.data.postSessionWebhook != null),
      hasEvaluation: (.data.postEvaluationConfig != null),
      variableCount: (.data.variableConfigs // [] | length)
    }'
    ;;
  get-prompt)
    [[ -z "${2:-}" ]] && { echo "Usage: agent.sh get-prompt <projectId>"; exit 1; }
    call GET "/projects/$2/agent" | jq -r '.data.globalPrompt // "No prompt set"'
    ;;
  update)
    [[ -z "${2:-}" ]] && { echo "Usage: agent.sh update <projectId> <json-body>"; exit 1; }
    [[ -z "${3:-}" ]] && { echo "Usage: agent.sh update <projectId> '{\"name\":\"...\"}'" ; exit 1; }
    pid="$2"
    body="$3"

    # Type guard: validate JSON
    if ! echo "$body" | jq empty 2>/dev/null; then
      echo "ERROR: Invalid JSON body" >&2
      exit 1
    fi

    # Type guard: only allow known fields
    allowed='["name","type","status","globalPrompt","executionMode","timezone","memoryEnabled","beforeStartConfig","postSessionWebhook","postEvaluationConfig","placeholderMessages","variableConfigs"]'
    invalid=$(echo "$body" | jq -r --argjson allowed "$allowed" 'keys - $allowed | .[]')
    if [[ -n "$invalid" ]]; then
      echo "ERROR: Unknown fields: $invalid" >&2
      echo "Allowed: name, type, status, globalPrompt, executionMode, timezone, memoryEnabled, beforeStartConfig, postSessionWebhook, postEvaluationConfig, placeholderMessages, variableConfigs" >&2
      exit 1
    fi

    result=$(call PUT "/projects/$pid/agent" -d "$body")
    echo "$result" | jq '{
      ok: true,
      name: .data.name,
      status: .data.status,
      executionMode: .data.executionMode
    }'
    ;;
  *)
    echo "Usage: agent.sh <action> <projectId> [body]"
    echo "  get <id>               Compact agent summary"
    echo "  get-prompt <id>        Get full system prompt text"
    echo "  update <id> <json>     Update agent config (with type guards)"
    exit 1
    ;;
esac
