#!/usr/bin/env bash

set -e

pushd frontend
yarn install --immutable
yarn run build
popd
