---
title: "Searching 488 dev.to Articles With Elastic Agent Builder, MCP, Claude Code and Antigravity CLI"
published: false
description: "A step by step guide to loading a dev.to back catalogue into Elastic Serverless with semantic_text, exposing it through the Agent Builder MCP endpoint on a read-only key, and asking the same four questions from Claude Code and Antigravity CLI."
tags: elasticsearch, mcp, ai, devtools
cover_image: https://raw.githubusercontent.com/xbill9/elastic-demo/main/article/cover.415eb5a0.jpg
---

This article provides a step by step guide to loading a writer's entire dev.to back catalogue into Elastic Serverless and searching it from two coding agents through the Elastic Agent Builder MCP endpoint. Claude Code and Antigravity CLI each get the same read-only key and the same four questions.

https://github.com/xbill9/elastic-demo

**An MCP endpoint in front of a search engine turns an agent into a query writer. The engine does the counting, so every number in an answer comes back exact for the filter the agent chose.**

---

#### What Is Elastic Agent Builder?

Agent Builder is the agent layer in Elastic's Kibana. It ships a set of tools over a search project: semantic and keyword search, ES|QL queries, index listing, document lookup and workflows.

The same tools are served over the Model Context Protocol at one URL per project, `<kibana>/api/agent_builder/mcp`. Any MCP client that can send an `Authorization` header can use them.

---

#### At This Point You Should Have…

- An Elastic Cloud account. The trial runs 14 days.
- Node 20 or later. The scripts use the built-in `fetch` and `--env-file`, with no npm packages.
- Claude Code and Antigravity CLI installed:

```text
$ claude --version; agy --version; node --version
2.1.317 (Claude Code)
1.4.12
v24.21.0
```

---

#### Step 1 — Fetch the Articles

`fetch-articles.mjs` pages through the public dev.to API for one username and writes one JSON line per article, with the full markdown body. It needs no key.

```text
$ node fetch-articles.mjs
{"user":"xbill","listed":488,"alreadyHad":0,"fetched":488,"inFile":488}
```

The 488 articles carry 427 distinct titles, because most posts go to two dev.to communities. They run from 2026-01-06 to 2026-11-02.

---

#### Step 2 — Create a Serverless Elasticsearch Project

In Elastic Cloud pick the **Elasticsearch** use case and a region. This project runs on GCP in us-central1.

The project page lists the Elasticsearch and Kibana endpoints. In Kibana, **Admin and settings → API keys** creates the admin key used for setup. The project reports itself as:

```json
{
  "name": "serverless",
  "version": {
    "number": "9.7.0",
    "build_flavor": "serverless"
  }
}
```

Copy the endpoints and the admin key into `.env` from `.env.example`.

---

#### Step 3 — Load the Index With semantic_text

`load.mjs` creates the `devto-articles` index and bulk-loads the file in batches of 20. The title and body are mapped as `text` for keyword search and copied into `semantic_text` fields for meaning-based search:

```js
title: { type: 'text', copy_to: 'title_semantic' },
title_semantic: { type: 'semantic_text' },
body: { type: 'text', copy_to: 'body_semantic' },
body_semantic: { type: 'semantic_text' },
```

No embedding code runs on the client. Elasticsearch chunks and embeds every document on ingest.

```text
$ node --env-file=.env load.mjs
created index devto-articles
{"index":"devto-articles","input":488,"bulkErrors":0,"indexed":488}
```

---

#### Step 4 — Check the Semantic Search

A `semantic_text` field with no `inference_id` takes the project's default model. The mapping shows which one Serverless picked:

```text
"inference_id": ".jina-embeddings-v5-text-small",
"model_settings": { "service": "elastic", "task_type": "text_embedding", "dimensions": 1024, "similarity": "cosine" }
```

A semantic query for "Gemma 4 on a Tesla T4" returns the three parts of that series first:

```text
took_ms 172
- Gemma 4 on a Tesla T4, Part 2: The Minimum GCE VM and a Script to Drive It
- Gemma 4 on a Tesla T4: QAT Weights Decode 1.79x Faster Than bf16
- Gemma 4 on a Tesla T4, Part 3: Int4 Embeddings Serve E2B in 2.86 GiB at 2.30x bf16
```

---

#### Step 5 — Make a Read-Only Key for MCP

The agents get their own key, scoped to reading one index. Create it in Kibana under **API keys → Create API key**, turn on **Control security privileges**, set an expiry, and paste this role descriptor:

```json
{"mcp_reader":{"cluster":["monitor_inference"],"indices":[{"names":["devto-articles"],"privileges":["read","view_index_metadata"]}],"applications":[{"application":"kibana-.kibana","privileges":["feature_agentBuilder.read","feature_actions.read"],"resources":["*"]}]}}
```

`feature_agentBuilder.read` opens the MCP endpoint. The search tool also reads the project's inference endpoints and connectors, so it needs `monitor_inference` and `feature_actions.read`. Without them `platform_core_search` returns:

```text
action [cluster:monitor/xpack/inference/get] is unauthorized for API key id [...],
this action is granted by the cluster privileges [monitor_inference,manage_inference,monitor,manage,all]
```

A write with this key fails:

```text
action [indices:data/write/index] is unauthorized for API key id [...] on indices [devto-articles]
HTTP 403
```

---

#### 🔎 Tip: Make the Agent Key From Kibana

Elasticsearch refuses to let an API key create another key that carries privileges:

```text
$ node --env-file=.env create-mcp-key.mjs
Error: 400 ... "creating derived api keys requires an explicit role descriptor that is empty (has no privileges)"
```

A key made from a signed-in Kibana session, or through the API with a user's own credentials, takes the role descriptor.

---

#### Step 6 — List the MCP Tools

With the agent key, `tools/list` on the endpoint returns 22 tools. Four of them cover this index:

```text
platform_core_search             natural-language search, semantic and keyword
platform_core_execute_esql       run an ES|QL query
platform_core_get_document_by_id fetch one article
platform_core_list_indices       list what the key can see
```

The rest cover workflows, ES|QL generation, index mappings and Elastic's product documentation.

---

#### Step 7 — Connect Claude Code and Antigravity CLI

Both clients speak the endpoint's streamable HTTP directly, with the key in a header. `connect.sh` registers both:

```bash
ENDPOINT="${KIBANA_URL%/}/api/agent_builder/mcp"
AUTH="Authorization: ApiKey ${MCP_API_KEY}"

claude mcp add --transport http -s local elastic "$ENDPOINT" --header "$AUTH"
agy mcp add --header "$AUTH" elastic "$ENDPOINT"
```

Claude Code's local scope and Antigravity's user config both live outside the repository, which keeps the key out of a public commit.

```text
$ claude mcp list | grep elastic
elastic: https://my-elasticsearch-project-fa0ae6.kb.us-central1.gcp.elastic.cloud/api/agent_builder/mcp (HTTP) - ✔ Connected
$ agy mcp list | grep elastic
elastic                             http   enabled  https://my-elasticsearch-project-fa0ae6.kb.us-central1.gcp.elastic.cloud/api/agent_builder/mcp
```

---

#### Step 8 — Ask the Same Four Questions

`ask.sh` sends each question to each client in print mode with the same preamble: answer only from the `elastic` tools, the index is `devto-articles`, cite title and URL. Every transcript is saved with its tool calls, and `summarize.py` prints the query each call sent.

1. Which of my articles cover Gemma 4 on a Tesla T4, and what speed-ups did they report?
2. List my articles about MCP on Cloud Run, newest first.
3. What have I written about A2A, and which posts link to a Google codelab?
4. Which of my posts compare a CPU service against an NVIDIA L4?

Both clients reached for ES|QL almost every time. Claude Code made 15 MCP calls across the four questions, all `platform_core_execute_esql`. Antigravity made 48, of which 3 were `platform_core_search`.

A typical Claude Code call for question 2:

```sql
FROM devto-articles
| WHERE TO_LOWER(title) LIKE "*mcp*" AND TO_LOWER(title) LIKE "*cloud run*"
| STATS n = COUNT(*), newest = MAX(published_at), oldest = MIN(published_at)
```

The count comes from `STATS`, computed by the engine. The agent quotes it.

---

#### Step 9 — Read the Filter, Then the Number

Question 4 has a narrow answer and both clients returned the same two EmbeddingGemma 2 posts. Questions 2 and 3 are broader, and each client wrote a different filter. Running each filter in ES|QL gives the engine's count for it:

```text
title has "mcp" and "cloud run"                       45
body matches "MCP" and the phrase "Cloud Run"        162
title has "A2A" or "Agent2Agent"                      45   of which 30 link codelabs.developers.google.com
"A2A" in title, description, body or tags             63
body links codelabs.developers.google.com             91   69 distinct titles
```

Claude Code answered question 2 with the 45 title matches. Antigravity searched title, description and tags, widened to the body, and listed 54 posts. Each number is right for its own filter, so the useful review step is reading the `WHERE` clause the agent sent.

---

#### 🔎 Tip: Keep the Arithmetic in the Engine

Ask for counts, minimums and maximums in the query with `STATS`, and the agent repeats an exact number. The transcripts show both clients doing this unprompted for question 3, with `COUNT(*)`, `COUNT(CASE(...))` and `COUNT_DISTINCT` over the A2A and codelab filters.

The remaining risk is the predicate. A filter that is too narrow still returns an exact count with a citation, so the saved transcripts are the record worth keeping.

---

#### Compare and Contrast

| | Claude Code | Antigravity CLI |
| :--- | :--- | :--- |
| Time per question | 🥇 23 to 90 s | 138 to 410 s |
| MCP calls, four questions | 🥇 15 | 48 |
| Tools used | ES\|QL only | ES\|QL, plus `platform_core_search` 3 times |
| Q2 filter | title only, 45 posts | title, description, tags, then body; 54 listed |
| Q3 scope | 45 A2A titles, 30 with a codelab | 63 posts with A2A anywhere, plus codelab slugs |
| Q4 | the two EmbeddingGemma 2 posts | the same two posts |
| Stayed inside the MCP tools | ran Bash 3 times on question 1 to parse a large result | 🥇 yes |

Claude Code used `claude-opus-5-5` at $0.35 to $0.63 per question. Antigravity's transcript does not name its model, so its cost is not shown.

---

#### So, Which One?

For a quick, exact answer to a well-scoped question, Claude Code finished every question in under 90 seconds with three to five queries.

For a wide sweep, Antigravity wrote more queries and covered more ground: on question 3 it extracted the codelab slug from every link with `GROK` and counted posts per codelab.

Either way the index, the key and the tools are the same, so the choice can be made per question.

---

#### Summary

The goal of this article was to search a full dev.to back catalogue from two coding agents through Elastic Agent Builder. The key to the solution was a `semantic_text` index on Elastic Serverless and a read-only key on the Agent Builder MCP endpoint. The results were:

- 🟢 488 articles loaded with 0 bulk errors, embedded on ingest by `.jina-embeddings-v5-text-small` with no client code
- 🟢 One read-only key served both clients; writes return 403
- 🟢 Both clients answered all four questions, and both chose ES|QL with engine-computed counts
- ❌ An API key cannot create the agent key; it comes from Kibana or a user login
- ⚠️ `platform_core_search` needs `monitor_inference` and `feature_actions.read` on the key, on top of `feature_agentBuilder.read`
- ⚠️ Counts differ between clients wherever their filters differ, so read the query before the number

Scope: one Serverless project on GCP us-central1, one run of each question in each client on 2026-11-03, default model settings in both clients. Antigravity's first question ended with "The stream was interrupted" after returning an answer. Times and call counts are from one run each, so they show the shape of each client's approach and carry no run-to-run spread.

The strategy for using MCP for searching a writing archive with Elastic Agent Builder was validated with an incremental step by step approach.

#### References

- [elastic-demo repository](https://github.com/xbill9/elastic-demo)
- [Transcripts and evidence](https://github.com/xbill9/elastic-demo/tree/main/article/evidence)
- [Agent Builder MCP server](https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/mcp-server)
- [semantic_text field type](https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/semantic-text)
- [Elastic Cloud trial](https://www.elastic.co/cloud/trial)
