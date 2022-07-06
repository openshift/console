#!/usr/bin/env bash

set -e

pushd frontend
# workaround fix for ESOCKETTIMEDOUT issue in CI when running `yarn install` per https://github.com/yarnpkg/yarn/issues/8242
yarn config set network-timeout 300000
yarn install --network-timeout 300000
yarn run build
popd
