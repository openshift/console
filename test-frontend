#!/usr/bin/env bash

set -euo pipefail

cd frontend
yarn run lint
yarn run test

if git status --short | grep 'yarn.lock' > /dev/null; then
  printf "\n\nOUTDATED yarn.lock (COMMIT IT TO FIX!!!!!)\n"
  git diff
  exit 1
fi
