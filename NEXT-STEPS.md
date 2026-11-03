# Next steps: Elastic Agent Builder demo

Context for picking this up in a new session from `~/elastic-demo`.

## Why this exists

Elastic recruiter Laura Butler asked on 2026-11-03 to book a 30-minute screen for **Senior Developer Advocate, New York** (Greenhouse job 8237783). The prep doc is `~/jobHunt-xbill/interview-prep/elastic.md`. Its main gap: no published Elasticsearch work (the dev.to posts with "Elastic" in the title are about AWS Elastic Beanstalk). This demo closes that gap: Claude Code and Gemini CLI searching all of xbill's dev.to articles through Elastic's Agent Builder MCP endpoint, then a dev.to write-up.

## Status

- [x] Project scaffold committed.
- [x] Articles downloaded 2026-11-03: 488 in `data/articles.jsonl` (published 2026-01-06 to 2026-11-02). Rerun `node fetch-articles.mjs` to add newer posts.
- [x] Elastic Cloud trial (14 days from 2026-11-03), Serverless Elasticsearch project "My Elasticsearch project", GCP us-central1. Endpoints in `.env`.
- [x] Admin key `elastic-demo-setup` (expires 2026-11-17).
- [x] `load.mjs`: `{"input":488,"bulkErrors":0,"indexed":488}`. `semantic_text` defaulted to `.jina-embeddings-v5-text-small` (1024 dims).
- [x] MCP key `elastic-demo-mcp` (expires 2026-11-10), made in Kibana UI. Role descriptor in README. Writes to the index return 403.
- [x] `./connect.sh`: `elastic` connected in Claude Code (local scope) and agy.
- [x] `./ask.sh` ran all four questions in both clients; transcripts in `results/`, digest via `python3 summarize.py [--answers]`.
- [x] dev.to draft 4970752 created 2026-11-03 (unpublished, org gde): `article/devto-elastic-agent-builder-mcp.md`. Publish with `publish-devto.py --publish 4970752`.
- [ ] Mention the published demo in the Elastic recruiter call.

## Findings from the run (verified 2026-11-03)

- The MCP endpoint lists 22 tools. Both clients used `platform_core_execute_esql` for nearly everything; `platform_core_search` alone needs `monitor_inference` and `feature_actions.read` on the key.
- An API key cannot create a key with privileges (`creating derived api keys requires an explicit role descriptor that is empty`), so the narrow key comes from Kibana or a user login.
- `gemini` on this machine is a wrapper around `agy` (Antigravity CLI). `agy` accepts HTTP MCP servers with `--header`, no `mcp-remote` needed.
- Wall time per question: Claude Code 23–90 s, agy 138–410 s. agy q1 ended with "The stream was interrupted" but still returned an answer.
- Claude Code q1 used Bash three times to parse a large ES|QL result locally, despite the "only the elastic tools" preamble.
- Q4 (CPU vs L4): both found the same two EmbeddingGemma 2 posts. Q2/Q3 lists differ because each client chose a different filter (Claude: title match only, 45 posts for q2; agy: title, description, tags, then body, 54 posts). Check the filter, not just the count.

## Demo questions

- "Which of my articles cover Gemma 4 on a Tesla T4, and what speed-ups did they report?"
- "List my articles about MCP on Cloud Run, newest first."
- "What have I written about A2A, and which posts link to a Google codelab?"
- "Which of my posts compare a CPU service against an NVIDIA L4?"

## Rules carried over

- Commit straight to `main` and push; this repo is **public** (`xbill9/elastic-demo`). Never commit `.env` or any key.
- Every figure in the write-up comes from a command run in the session; mark anything else unverified.

## References

- Agent Builder MCP server: https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/mcp-server
- MCP server API keys: https://docs-v3-preview.elastic.dev/elastic/docs-builder/docs/3471/explore-analyze/ai-features/agent-builder/mcp-server-api-keys.md
- Agent Builder GA (2026-01-22): https://www.businesswire.com/news/home/20260122544127/en/Elastic-Announces-General-Availability-of-Agent-Builder-with-Expanded-Capabilities
- Elastic Cloud trial: https://www.elastic.co/cloud/trial
