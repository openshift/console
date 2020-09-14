#!/usr/bin/env bash
set -exuo pipefail
cd frontend
yarn install

echo "LANG = $LANG"
locale

function generateReport {
  yarn run cypress-postreport
}
trap generateReport EXIT

if [ $# -gt 0 ] && [ -n "$1" ]; then
  yarn run test-cypress-headless --spec "$1"
else
  yarn run test-cypress-headless
fi
