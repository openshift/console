#!/usr/bin/env bash
set -exuo pipefail
cd frontend
yarn install

function generateReport {
  yarn run cypress-postreport
}
trap generateReport EXIT

yarn run test-cypress-headless
