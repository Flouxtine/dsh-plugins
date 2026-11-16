#!/usr/bin/env bash
# Restore the agent-runtimes bundle registration in the DSH profile.
# Run once from Terminal if the panel does not come back after a restart.
set -euo pipefail
python3 - <<'PY'
import json, os
p = os.path.expanduser('~/.dsh/profiles/desktop/package.json')
d = json.load(open(p))
bundles = d['dsh']['profile']['bundles']
if '@local/agent-runtimes' not in bundles:
    at = bundles.index('@local/agent-workflow-board') + 1 if '@local/agent-workflow-board' in bundles else len(bundles)
    bundles.insert(at, '@local/agent-runtimes')
deps = d.setdefault('dependencies', {})
deps.setdefault('@local/agent-runtimes',
    'link:/Users/zane/Downloads/deepseek harness/deepseekharness插件/agent-runtimes')
open(p, 'w').write(json.dumps(d, indent=2) + '\n')
print('restored bundles:', bundles)
PY
echo "Done. Restart DeepSeek Harness to load the bundle."
