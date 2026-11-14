#!/usr/bin/env bash
# Unit-test console-recording-rules.yaml with promtool (Prometheus semantics;
# VictoriaMetrics' vmalert evaluates these expressions the same way).
# Needs: promtool and yq (mikefarah) on PATH.
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
yq '.spec' "$here/console-recording-rules.yaml" > "$tmp/rules.yaml"
cp "$here/console-recording-rules.test.yaml" "$tmp/"
promtool check rules "$tmp/rules.yaml"
promtool test rules "$tmp/console-recording-rules.test.yaml"
