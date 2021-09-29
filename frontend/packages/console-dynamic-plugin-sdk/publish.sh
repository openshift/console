#!/usr/bin/env bash

set -exuo pipefail

yarn build

for pkgDir in 'dist/core' 'dist/internal' 'dist/webpack'
do
  yarn publish "$pkgDir" --no-git-tag-version --new-version "$PKG_VERSION"
done
