#!/usr/bin/env bash

set -exuo pipefail

./prepare-prow-env.sh

pushd frontend

yarn run test-puppeteer-csp

popd
