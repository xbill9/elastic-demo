#!/usr/bin/env node
/**
 * create-mcp-key.mjs: creates a narrow API key for the Agent Builder MCP
 * endpoint: read-only on the demo index plus the Agent Builder Kibana
 * privilege, plus monitor_inference and feature_actions.read, which
 * platform_core_search needs. Elasticsearch refuses this call when ES_API_KEY
 * is itself an API key (derived keys cannot carry privileges); create the key
 * in Kibana instead (see README), or authenticate as a user.
 *
 * Writes MCP_API_KEY to stdout; put it in .env.
 * Usage: node --env-file=.env create-mcp-key.mjs [--days 7]
 */
const { ES_URL, ES_API_KEY, INDEX = 'devto-articles' } = process.env;
if (!ES_URL || !ES_API_KEY) throw new Error('set ES_URL and ES_API_KEY in .env');
const i = process.argv.indexOf('--days');
const DAYS = i === -1 ? 7 : Number(process.argv[i + 1]);

const res = await fetch(`${ES_URL}/_security/api_key`, {
  method: 'POST',
  headers: { Authorization: `ApiKey ${ES_API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'elastic-demo-mcp',
    expiration: `${DAYS}d`,
    role_descriptors: {
      mcp_reader: {
        cluster: ['monitor_inference'],
        indices: [{ names: [INDEX], privileges: ['read', 'view_index_metadata'] }],
        applications: [{ application: 'kibana-.kibana', privileges: ['feature_agentBuilder.read', 'feature_actions.read'], resources: ['*'] }],
      },
    },
  }),
});
const json = await res.json();
if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(json)}`);
console.log(`MCP_API_KEY=${json.encoded}`);
console.error(`expires in ${DAYS} days; id ${json.id}`);
