#!/usr/bin/env bash

set -e

pushd dynamic-demo-plugin
yarn install
yarn run build
popd
