#!/usr/bin/env bash

set -e

pushd frontend
YARN="node $(awk '/yarnPath:/{print $2}' .yarnrc.yml)"
$YARN install --immutable
$YARN run build
popd
