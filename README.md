# elastic-demo

Every dev.to article by xbill, indexed in Elasticsearch with semantic search, served to Claude Code and the Antigravity CLI (`agy`, the successor to Gemini CLI) through the Elastic Agent Builder MCP endpoint.

No dependencies: Node 20+ (`fetch`, `--env-file`). Both clients speak the endpoint's streamable HTTP directly.

## Steps

1. **Elastic Cloud trial.** Sign up at https://www.elastic.co/cloud/trial (14 days) and create a Serverless Elasticsearch project. Copy the Elasticsearch and Kibana endpoints, create an admin API key in Kibana (Admin and settings → API keys), and fill in `.env` from `.env.example`.
2. **Fetch the articles.** `node fetch-articles.mjs` writes `data/articles.jsonl` (no credentials needed).
3. **Load them.** `node --env-file=.env load.mjs` creates the `devto-articles` index and bulk-loads the file. `title` and `body` are copied into `semantic_text` fields; with no `inference_id`, Serverless embeds them with `.jina-embeddings-v5-text-small` (1024 dimensions). It prints input, error and indexed counts.
4. **Narrow MCP key.** Create it in Kibana (API keys → Create, "Control security privileges"), because Elasticsearch refuses to let an API key create a key with privileges. Role descriptor:
   ```json
   {"mcp_reader":{"cluster":["monitor_inference"],"indices":[{"names":["devto-articles"],"privileges":["read","view_index_metadata"]}],"applications":[{"application":"kibana-.kibana","privileges":["feature_agentBuilder.read","feature_actions.read"],"resources":["*"]}]}}
   ```
   `platform_core_search` needs `monitor_inference` and `feature_actions.read` in addition to `feature_agentBuilder.read`. Put the encoded key in `.env` as `MCP_API_KEY`.
5. **Connect the clients.** `./connect.sh` registers `elastic` with Claude Code (local scope) and `agy` (user config). Both stay outside the repo because they carry the key.
6. **Ask.** `./ask.sh` asks the demo questions in both clients and saves each transcript to `results/`.

`create-mcp-key.mjs` creates the same key through the API; it needs a user's credentials (not an API key) in the `Authorization` header.

## References

- Agent Builder MCP server: https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/mcp-server
- MCP server API keys: https://docs-v3-preview.elastic.dev/elastic/docs-builder/docs/3471/explore-analyze/ai-features/agent-builder/mcp-server-api-keys.md
- Elastic Cloud trial: https://www.elastic.co/cloud/trial
