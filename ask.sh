#!/usr/bin/env bash
# ask.sh: asks every demo question in Claude Code and the Antigravity CLI (agy),
# each limited to the 'elastic' MCP server, and saves the full stream-json
# transcript (tool calls included) to results/<client>-q<N>.jsonl.
# Usage: ./ask.sh [claude|agy]   (default: both)
set -uo pipefail
cd "$(dirname "$0")"
mkdir -p results

PREAMBLE="Answer only from the 'elastic' MCP tools. My dev.to articles are in the Elasticsearch index devto-articles (fields: title, description, body, url, published_at, tags). Cite each article by title and url."
QUESTIONS=(
  "Which of my articles cover Gemma 4 on a Tesla T4, and what speed-ups did they report?"
  "List my articles about MCP on Cloud Run, newest first."
  "What have I written about A2A, and which posts link to a Google codelab?"
  "Which of my posts compare a CPU service against an NVIDIA L4?"
)
CLIENTS=("${1:-claude}" ); [ $# -eq 0 ] && CLIENTS=(claude agy)

for c in "${CLIENTS[@]}"; do
  for i in "${!QUESTIONS[@]}"; do
    n=$((i + 1)); out="results/$c-q$n.jsonl"; prompt="$PREAMBLE

${QUESTIONS[$i]}"
    case $c in
      claude) claude -p "$prompt" --output-format stream-json --verbose \
                --allowedTools "mcp__elastic__*" > "$out" 2> "results/$c-q$n.err" ;;
      agy)    agy -p "$prompt" --output-format stream-json \
                --mode auto --sandbox > "$out" 2> "results/$c-q$n.err" ;;
    esac
    echo "$c q$n exit $? -> $out"
  done
done
