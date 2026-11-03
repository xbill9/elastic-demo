# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running things

- No `package.json`, no dependencies. Node 20+ scripts run as `node --env-file=.env <script>.mjs`; shell scripts source `.env` themselves.
- `node fetch-articles.mjs` needs no credentials and skips articles already in `data/articles.jsonl`. `load.mjs --recreate` drops and rebuilds the index.
- `./lint.sh` runs shellcheck, ruff (your global rule set) and `node --check`; run it after editing scripts.
- `./ask.sh [claude|agy]` asks the four demo questions; transcripts land in `results/<client>-q<N>.jsonl`. `python3 summarize.py [--answers]` prints every MCP query each client sent. Antigravity takes 2 to 7 minutes per question, so run it in the background.

## Keys and the public repo

- The repo is public. `.env` holds two live keys (`ES_API_KEY` admin, `MCP_API_KEY` read-only). Never commit them or put them in a tracked file; a git pre-commit hook rejects staged files containing either value.
- The MCP key cannot be created with `ES_API_KEY` (Elasticsearch rejects derived keys with privileges). Create it in Kibana → API keys with the role descriptor in `README.md`. `platform_core_search` needs `monitor_inference` and `feature_actions.read` beyond `feature_agentBuilder.read`.
- To change a key's privileges, edit it in Kibana (Update API key): the encoded value stays the same, so `.env` and both client registrations keep working.
- Kibana's UI will not hand a new key's value to the browser tools; the user has to paste it.
- Expiry: trial and `elastic-demo-setup` on 2026-11-17, `elastic-demo-mcp` on 2026-11-10.

## Clients

- `gemini` on this machine is a wrapper for `agy` (Antigravity CLI). `agy mcp add` takes flags before the server name and has no scope flag.
- `connect.sh` registers `elastic` in Claude Code at **local** scope and in agy's user config, never `.mcp.json` or `.gemini/`, because the command carries the key.
- In `ask.sh`, agy runs with `--mode auto --sandbox`; `--dangerously-skip-permissions` is refused by auto mode.

## Article

- The dev.to article is `article/devto-elastic-agent-builder-mcp.md` (draft id 4970752). Every figure in it must trace to a file in `article/evidence/`; regenerate evidence with `/rerun-demo` after changing the index or the questions.
- Quote counts from ES|QL `STATS` in `article/evidence/engine-counts.txt`, not from a model's answer, and name the filter each count belongs to.
- Pre-flight and publish with the publishing kit: `python3 ~/publishing-kit/skills/publishing/scripts/preflight.py article/devto-elastic-agent-builder-mcp.md --live`, then `publish-devto.py --update 4970752 <file>`.
