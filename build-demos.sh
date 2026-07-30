#!/usr/bin/env bash

set -e

pushd dynamic-demo-plugin
YARN="node $(awk '/yarnPath:/{print $2}' .yarnrc.yml)"
$YARN install --immutable
$YARN run build
popd
