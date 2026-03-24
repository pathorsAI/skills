#!/usr/bin/env bash
# Pathors API helper — session operations
# Usage: session.sh <action> <projectId> [args...]
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
    [[ -z "${2:-}" ]] && { echo "Usage: session.sh list <projectId> [page] [pageSize]"; exit 1; }
    pid="$2"
    page="${3:-1}"
    size="${4:-10}"
    result=$(call GET "/projects/$pid/sessions?page=$page&pageSize=$size")
    echo "$result" | jq '{
      page: .pagination.page,
      totalPages: .pagination.totalPages,
      total: .pagination.total,
      sessions: [.data[] | {
        id: .sessionId,
        start: .startTime,
        end: .endTime,
        provider: .provider,
        messages: .messageCount,
        marked: .marked,
        evaluation: (.evaluation.result // null)
      }]
    }'
    ;;
  stats)
    [[ -z "${2:-}" ]] && { echo "Usage: session.sh stats <projectId> [startDate] [endDate]"; exit 1; }
    pid="$2"
    query=""
    [[ -n "${3:-}" ]] && query="?startDate=$3"
    [[ -n "${4:-}" ]] && query="${query:+$query&}${query:+endDate=$4}${query:-?endDate=$4}"
    call GET "/projects/$pid/sessions/stats${query}" | jq '.data'
    ;;
  get)
    [[ -z "${2:-}" || -z "${3:-}" ]] && { echo "Usage: session.sh get <projectId> <sessionId>"; exit 1; }
    result=$(call GET "/projects/$2/sessions/$3")
    echo "$result" | jq '{
      id: .data.sessionId,
      start: .data.startTime,
      end: .data.endTime,
      provider: .data.provider,
      messages: .data.messageCount,
      marked: .data.marked,
      evaluation: .data.evaluation,
      transcript: [.data.events[] | select(.type == "message.sent" or .type == "message.received") | {
        role: .data.message.role,
        content: (.data.message.content | if length > 200 then .[:200] + "..." else . end),
        time: .timestamp
      }]
    }'
    ;;
  get-full)
    [[ -z "${2:-}" || -z "${3:-}" ]] && { echo "Usage: session.sh get-full <projectId> <sessionId>"; exit 1; }
    call GET "/projects/$2/sessions/$3" | jq '.data'
    ;;
  search)
    [[ -z "${2:-}" || -z "${3:-}" ]] && { echo "Usage: session.sh search <projectId> <query>"; exit 1; }
    pid="$2"
    query="$3"
    result=$(call GET "/projects/$pid/sessions?search=$(printf '%s' "$query" | jq -sRr @uri)&pageSize=10")
    echo "$result" | jq '[.data[] | { id: .sessionId, start: .startTime, messages: .messageCount, marked: .marked }]'
    ;;
  *)
    echo "Usage: session.sh <action> <projectId> [args...]"
    echo "  list <id> [page] [size]        List sessions (compact)"
    echo "  stats <id> [start] [end]       Session statistics"
    echo "  get <id> <sessionId>           Session with truncated transcript"
    echo "  get-full <id> <sessionId>      Full session (all events)"
    echo "  search <id> <query>            Search sessions"
    exit 1
    ;;
esac
