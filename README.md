# elastic-demo

Every dev.to article by xbill, indexed in Elasticsearch with semantic search, served to Claude Code and Gemini CLI through the Elastic Agent Builder MCP endpoint.

No dependencies: Node 20+ (`fetch`, `--env-file`) and `npx` for `mcp-remote`.

## Steps

1. **Elastic Cloud trial.** Sign up at https://www.elastic.co/cloud/trial (14 days) and create a Serverless Elasticsearch project. Copy the Elasticsearch and Kibana endpoints, create an admin API key, and fill in `.env` from `.env.example`.
2. **Fetch the articles.** `node fetch-articles.mjs` writes `data/articles.jsonl` (no credentials needed).
3. **Load them.** `node --env-file=.env load.mjs` creates the `devto-articles` index (`title` and `body` copied into `semantic_text` fields, embedded on ingest by the project's default inference endpoint) and bulk-loads the file. It prints input, error and indexed counts.
4. **Narrow MCP key.** `node --env-file=.env create-mcp-key.mjs >> .env` creates a 7-day key: read on the index plus `feature_agentBuilder.read` in Kibana.
5. **Connect the clients.** `./connect.sh` registers `elastic` with Claude Code (project scope) and Gemini CLI.
6. **Ask.** In `claude` or `gemini` from this folder, for example:
   - "Which of my articles cover Gemma 4 on a Tesla T4, and what speed-ups did they report?"
   - "List my articles about MCP on Cloud Run, newest first."
   - "What have I written about A2A, and which posts link to a Google codelab?"

## Untested

Everything that touches Elastic Cloud has not been run yet: the default inference endpoint behind `semantic_text`, the API key privilege name, the Agent Builder tool set exposed over MCP, and the `claude mcp add` / `gemini mcp add` command lines.

## References

- Agent Builder MCP server: https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/mcp-server
- MCP server API keys: https://docs-v3-preview.elastic.dev/elastic/docs-builder/docs/3471/explore-analyze/ai-features/agent-builder/mcp-server-api-keys.md
- Elastic Cloud trial: https://www.elastic.co/cloud/trial
