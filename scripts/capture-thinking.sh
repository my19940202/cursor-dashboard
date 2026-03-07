#!/bin/bash

CORPUS_PATH="${THINKING_CORPUS_PATH:-$HOME/thinking-corpus.jsonl}"

json_input=$(cat)

text=$(echo "$json_input" | jq -r '.text // empty')
if [ -z "$text" ] || [ "${#text}" -lt 20 ]; then
  exit 0
fi

timestamp=$(date -u '+%Y-%m-%dT%H:%M:%S.000Z')
model=$(echo "$json_input" | jq -r '.model // "unknown"')
conversation_id=$(echo "$json_input" | jq -r '.conversation_id // ""')
generation_id=$(echo "$json_input" | jq -r '.generation_id // ""')
duration_ms=$(echo "$json_input" | jq -r '.duration_ms // 0')

jq -n -c \
  --arg text "$text" \
  --arg timestamp "$timestamp" \
  --arg model "$model" \
  --arg conversation_id "$conversation_id" \
  --arg generation_id "$generation_id" \
  --argjson duration_ms "${duration_ms:-0}" \
  '{
    text: $text,
    timestamp: $timestamp,
    model: $model,
    conversation_id: $conversation_id,
    generation_id: $generation_id,
    duration_ms: $duration_ms
  }' >> "$CORPUS_PATH"

exit 0
