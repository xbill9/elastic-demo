#!/usr/bin/env node
/**
 * fetch-articles.mjs: downloads every dev.to article by a user, with full
 * markdown, to data/articles.jsonl. No credentials needed.
 *
 * Resumable: articles already in the file are skipped, so a rerun after a
 * rate-limit failure picks up where it stopped.
 *
 * Usage: node fetch-articles.mjs [--user xbill]
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';

const i = process.argv.indexOf('--user');
const USER = i === -1 ? 'xbill' : process.argv[i + 1];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url);
    if (res.ok) return res.json();
    if (res.status === 429 && attempt < 10) {
      const wait = Number(res.headers.get('retry-after')) * 1000 || 5000 * attempt;
      await sleep(wait);
      continue;
    }
    throw new Error(`${res.status} ${url}`);
  }
}

const list = [];
for (let page = 1; ; page++) {
  const batch = await getJson(`https://dev.to/api/articles?username=${USER}&per_page=1000&page=${page}`);
  if (!batch.length) break;
  list.push(...batch);
}

mkdirSync('data', { recursive: true });
const FILE = 'data/articles.jsonl';
const have = new Set(existsSync(FILE)
  ? readFileSync(FILE, 'utf-8').split('\n').filter(Boolean).map((l) => JSON.parse(l).id)
  : []);
const todo = list.filter((a) => !have.has(a.id));
let fetched = 0;
for (const [n, a] of todo.entries()) {
  const full = await getJson(`https://dev.to/api/articles/${a.id}`);
  appendFileSync(FILE, JSON.stringify({
    id: full.id,
    title: full.title,
    description: full.description,
    url: full.url,
    published_at: full.published_at,
    tags: full.tags || full.tag_list,
    organization: full.organization?.name ?? null,
    reactions: full.public_reactions_count,
    reading_time_minutes: full.reading_time_minutes,
    body: full.body_markdown,
  }) + '\n');
  fetched++;
  if ((n + 1) % 50 === 0) console.log(`${n + 1}/${todo.length}`);
  await sleep(1000);
}

const total = readFileSync(FILE, 'utf-8').split('\n').filter(Boolean).length;
console.log(JSON.stringify({ user: USER, listed: list.length, alreadyHad: have.size, fetched, inFile: total }));
