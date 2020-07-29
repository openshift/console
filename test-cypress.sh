#!/usr/bin/env bash
set -exuo pipefail
cd frontend
yarn install
yarn run test-cypress-headless
