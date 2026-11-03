# Next steps: Elastic Agent Builder demo

Context for picking this up in a new session from `~/elastic-demo`.

## Why this exists

Elastic recruiter Laura Butler asked on 2026-11-03 to book a 30-minute screen for **Senior Developer Advocate, New York** (Greenhouse job 8237783). The prep doc is `~/jobHunt-xbill/interview-prep/elastic.md`. Its main gap: no published Elasticsearch work (the dev.to posts with "Elastic" in the title are about AWS Elastic Beanstalk). This demo closes that gap: Claude Code and Gemini CLI searching all of xbill's dev.to articles through Elastic's Agent Builder MCP endpoint, then a dev.to write-up.

## Status

- [x] Project scaffold committed: `fetch-articles.mjs`, `load.mjs`, `create-mcp-key.mjs`, `connect.sh`, `.env.example`, `README.md`.
- [x] Article download started 2026-11-03 (`node fetch-articles.mjs`, log in `data-fetch.log`). It is resumable: rerun it if it stopped, then check the final line for `listed` vs `inFile`.
- [ ] **You:** sign up for the Elastic Cloud trial (https://www.elastic.co/cloud/trial, 14 days) and create a **Serverless Elasticsearch** project.
- [ ] **You:** copy the Elasticsearch URL, the Kibana URL, and an admin API key (Kibana → Stack Management → API keys) into `.env` (template: `.env.example`), or paste them to Claude.
- [ ] `node --env-file=.env load.mjs` — creates `devto-articles` and loads every article; check `bulkErrors` is 0 and `indexed` equals `input`.
- [ ] `node --env-file=.env create-mcp-key.mjs >> .env` — 7-day key, read on the index plus `feature_agentBuilder.read`.
- [ ] `./connect.sh` — registers `elastic` in Claude Code (project scope) and Gemini CLI.
- [ ] Run the demo questions (below) in both clients; record what each one returns.
- [ ] Write it up for dev.to (house style: `~/.claude/CLAUDE.md`, "Writing articles"; publishing skill).
- [ ] Mention the published demo in the Elastic recruiter call.

## Untested (verify on first run, fix in code, note in the commit message)

- `semantic_text` with no `inference_id` uses the project's default inference endpoint.
- The Kibana privilege name `feature_agentBuilder.read` on application `kibana-.kibana` (from Elastic's MCP API-key doc example).
- Which Agent Builder tools the MCP endpoint exposes, and whether the default tools can search a custom index.
- The `claude mcp add ... -- npx -y mcp-remote <endpoint> --header ...` and `gemini mcp add` command lines in `connect.sh`.

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
