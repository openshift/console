#!/usr/bin/env bash

set -e

pushd frontend
# node-sass requires old version of node-gyp which is Py2-only
yarn config set python python2.7
yarn install
yarn run build
popd
