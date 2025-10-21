#!/usr/bin/env bash

set -e

# Disable Route Component: Hide route creation checkbox
export HIDE_ROUTE_CREATION=true

pushd frontend
yarn install
yarn run build
popd
