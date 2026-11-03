---
name: rerun-demo
description: Re-run the four demo questions in Claude Code and/or Antigravity (agy) against the Elastic Agent Builder MCP endpoint, then regenerate article/evidence so the article's figures stay traceable. Use after changing the index, the key, the questions, or a client version.
disable-model-invocation: true
---

Re-run the demo and refresh the evidence. `$ARGUMENTS` is `claude`, `agy`, or empty for both.

1. Check the endpoint answers with the MCP key before spending client time:
   `set -a; source .env; set +a; curl -s -o /dev/null -w "%{http_code}\n" -X POST "$KIBANA_URL/api/agent_builder/mcp" -H "Authorization: ApiKey $MCP_API_KEY" -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`
   Anything but 200 means an expired key or trial (see CLAUDE.md for dates); stop and tell the user.
2. Run `./ask.sh $ARGUMENTS` in the background (agy takes 2 to 7 minutes per question). With no argument, run `./ask.sh claude` and `./ask.sh agy` as two background jobs.
3. When both finish, regenerate evidence:
   - `python3 summarize.py > article/evidence/summary.txt`
   - the Claude model, time, turns and cost lines into `article/evidence/claude-runs.txt` (from the `system/init` and `result` events of `results/claude-q<N>.jsonl`)
   - re-run the ES|QL `STATS` queries in `article/evidence/engine-counts.txt` against `$ES_URL/_query` with `ES_API_KEY` and overwrite the file in the same format
   - `claude --version; agy --version; node --version` into `article/evidence/versions.txt`
4. Report per client and question: seconds, MCP call count, error, and any filter that changed since the last run. Diff the new evidence against git and list every number in `article/devto-elastic-agent-builder-mcp.md` that no longer matches.
5. Run the pre-flight (`python3 ~/publishing-kit/skills/publishing/scripts/preflight.py article/devto-elastic-agent-builder-mcp.md`). Do not edit the article or publish unless the user asks.
