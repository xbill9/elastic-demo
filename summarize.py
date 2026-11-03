#!/usr/bin/env python3
"""summarize.py: reads results/<client>-q<N>.jsonl written by ask.sh and prints,
per client and question: wall time, MCP tool calls (with the query each one
sent), non-MCP tool calls, whether the run ended in an error, and the answer.
Usage: python3 summarize.py [--answers]
"""
import json, sys, glob, re, collections

show = '--answers' in sys.argv

def claude(path):
    calls, other, res = [], collections.Counter(), {}
    for l in open(path):
        try: d = json.loads(l)
        except ValueError: continue
        if d.get('type') == 'assistant':
            for c in d['message'].get('content', []):
                if c.get('type') == 'tool_use':
                    if c['name'].startswith('mcp__elastic__'):
                        calls.append((c['name'][len('mcp__elastic__'):], c['input']))
                    else:
                        other[c['name']] += 1
        if d.get('type') == 'result': res = d
    return dict(seconds=res.get('duration_ms', 0) / 1000, error=res.get('is_error'),
                calls=calls, other=other, answer=res.get('result', ''))

def agy(path):
    calls, other, final, seen = [], collections.Counter(), {}, set()
    for l in open(path):
        try: d = json.loads(l)
        except ValueError: continue
        if d.get('event') == 'result': final = d['result']
        su = d.get('step_update')
        if not su or su.get('step_type') != 'tool': continue
        key = su.get('step_index')
        if key in seen: continue  # one step emits several updates
        seen.add(key)
        params = (su.get('tool_info') or {}).get('parameters', {})
        if su.get('tool_name') == 'call_mcp_tool' and params.get('ServerName') == 'elastic':
            calls.append((params.get('ToolName'), params.get('Arguments', {})))
        else:
            other[su.get('tool_name')] += 1
    return dict(seconds=final.get('duration_seconds', 0),
                error=final.get('status') != 'SUCCESS' and (final.get('error') or final.get('status')),
                calls=calls, other=other, answer=final.get('response', ''))

for path in sorted(glob.glob('results/*-q*.jsonl')):
    client = path.split('/')[1].split('-q')[0]
    s = (claude if client == 'claude' else agy)(path)
    print(f"=== {path}  {s['seconds']:.0f}s  error={s['error']}  mcp_calls={len(s['calls'])}  other_tools={dict(s['other'])}")
    for name, inp in s['calls']:
        q = inp.get('query') or inp.get('nlQuery') or inp
        print(f"  {name}: {json.dumps(q)[:260]}")
    if show: print(s['answer'], '\n')
