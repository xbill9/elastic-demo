#!/usr/bin/env bash
# connect.sh: registers the Elastic Agent Builder MCP endpoint with Claude Code
# and Gemini CLI, through mcp-remote as in Elastic's client example.
# Needs KIBANA_URL and MCP_API_KEY in .env.
set -euo pipefail
cd "$(dirname "$0")"
set -a; source .env; set +a
: "${KIBANA_URL:?set KIBANA_URL in .env}" "${MCP_API_KEY:?run create-mcp-key.mjs first}"

ENDPOINT="${KIBANA_URL%/}/api/agent_builder/mcp"

claude mcp remove elastic -s project >/dev/null 2>&1 || true
claude mcp add elastic -s project -- npx -y mcp-remote "$ENDPOINT" --header "Authorization: ApiKey ${MCP_API_KEY}"
echo "Claude Code: registered 'elastic' -> $ENDPOINT"

gemini mcp remove elastic >/dev/null 2>&1 || true
gemini mcp add elastic npx -y mcp-remote "$ENDPOINT" --header "Authorization: ApiKey ${MCP_API_KEY}" \
  && echo "Gemini CLI: registered 'elastic'" \
  || echo "Gemini CLI: 'gemini mcp add' failed; add the same command to .gemini/settings.json by hand"
