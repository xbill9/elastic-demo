#!/usr/bin/env bash
# lint.sh: shellcheck for the bash scripts, ruff for the Python, node --check for the .mjs files.
set -uo pipefail
cd "$(dirname "$0")" || exit
status=0
shellcheck ./*.sh || status=1
ruff check ./*.py || status=1
for f in ./*.mjs; do node --check "$f" || status=1; done
[ $status -eq 0 ] && echo "lint: all clean"
exit $status
