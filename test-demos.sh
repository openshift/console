#!/usr/bin/env bash

set -euo pipefail

pushd dynamic-demo-plugin

# Check for outdated yarn.lock file
if [[ -n "$(git status --porcelain -- yarn.lock)" ]]; then
  echo "Outdated yarn.lock file, commit changes to fix!"
  git --no-pager diff
  exit 1
fi

popd
