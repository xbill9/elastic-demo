#!/usr/bin/env bash
# connect.sh: registers the Elastic Agent Builder MCP endpoint (streamable HTTP)
# with Claude Code and the Antigravity CLI (agy, the successor to Gemini CLI).
# Both registrations live outside the repo (Claude local scope, agy user config)
# because they carry the MCP API key.
# Needs KIBANA_URL and MCP_API_KEY in .env.
set -euo pipefail
cd "$(dirname "$0")"
set -a
# shellcheck source=/dev/null
source .env
set +a
: "${KIBANA_URL:?set KIBANA_URL in .env}" "${MCP_API_KEY:?create the MCP key first (see README)}"

ENDPOINT="${KIBANA_URL%/}/api/agent_builder/mcp"
AUTH="Authorization: ApiKey ${MCP_API_KEY}"

claude mcp remove elastic -s local >/dev/null 2>&1 || true
claude mcp add --transport http -s local elastic "$ENDPOINT" --header "$AUTH"
echo "Claude Code: registered 'elastic' -> $ENDPOINT"

AGY=$(command -v agy || command -v gemini)
"$AGY" mcp remove elastic >/dev/null 2>&1 || true
"$AGY" mcp add --header "$AUTH" elastic "$ENDPOINT"
echo "$(basename "$AGY"): registered 'elastic' -> $ENDPOINT"
