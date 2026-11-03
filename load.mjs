#!/usr/bin/env node
/**
 * load.mjs: creates the index and bulk-loads data/articles.jsonl.
 *
 * `body` and `title` are semantic_text, so Elasticsearch chunks and embeds
 * them with the project's default inference endpoint; no embedding code here.
 * Copies of both stay as plain text for keyword search.
 *
 * Env (.env): ES_URL, ES_API_KEY (an admin key for setup), INDEX.
 * Usage: node --env-file=.env load.mjs [--recreate]
 */
import { readFileSync } from 'node:fs';

const { ES_URL, ES_API_KEY, INDEX = 'devto-articles' } = process.env;
if (!ES_URL || !ES_API_KEY) throw new Error('set ES_URL and ES_API_KEY in .env');

const es = async (method, path, body, ndjson = false) => {
  const res = await fetch(`${ES_URL}${path}`, {
    method,
    headers: {
      Authorization: `ApiKey ${ES_API_KEY}`,
      'Content-Type': ndjson ? 'application/x-ndjson' : 'application/json',
    },
    body: body === undefined ? undefined : ndjson ? body : JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok && res.status !== 404) throw new Error(`${method} ${path} ${res.status} ${JSON.stringify(json).slice(0, 500)}`);
  return { status: res.status, json };
};

if (process.argv.includes('--recreate')) await es('DELETE', `/${INDEX}`);

const exists = (await es('HEAD', `/${INDEX}`)).status === 200;
if (!exists) {
  await es('PUT', `/${INDEX}`, {
    mappings: {
      properties: {
        title: { type: 'text', copy_to: 'title_semantic' },
        title_semantic: { type: 'semantic_text' },
        description: { type: 'text' },
        body: { type: 'text', copy_to: 'body_semantic' },
        body_semantic: { type: 'semantic_text' },
        url: { type: 'keyword' },
        published_at: { type: 'date' },
        tags: { type: 'keyword' },
        organization: { type: 'keyword' },
        reactions: { type: 'integer' },
        reading_time_minutes: { type: 'integer' },
      },
    },
  });
  console.log(`created index ${INDEX}`);
}

const docs = readFileSync('data/articles.jsonl', 'utf-8').trim().split('\n').map((l) => JSON.parse(l));
// Small batches: every document is embedded on ingest.
const BATCH = 20;
let errors = 0;
for (let i = 0; i < docs.length; i += BATCH) {
  const lines = docs.slice(i, i + BATCH).flatMap((d) => {
    const { id, ...src } = d;
    if (typeof src.tags === 'string') src.tags = src.tags.split(',').map((t) => t.trim()).filter(Boolean);
    return [JSON.stringify({ index: { _index: INDEX, _id: String(id) } }), JSON.stringify(src)];
  });
  const { json } = await es('POST', '/_bulk?refresh=false', lines.join('\n') + '\n', true);
  if (json.errors) {
    for (const it of json.items) if (it.index?.error) { errors++; if (errors <= 3) console.error(JSON.stringify(it.index.error).slice(0, 300)); }
  }
  console.log(`${Math.min(i + BATCH, docs.length)}/${docs.length}`);
}
await es('POST', `/${INDEX}/_refresh`);
const { json: count } = await es('GET', `/${INDEX}/_count`);
console.log(JSON.stringify({ index: INDEX, input: docs.length, bulkErrors: errors, indexed: count.count }));
