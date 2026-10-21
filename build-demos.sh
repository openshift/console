#!/usr/bin/env bash

set -e

pushd dynamic-demo-plugin
yarn install --immutable
yarn run build
popd
