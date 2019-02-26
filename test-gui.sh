#!/usr/bin/env bash

set -exuo pipefail

cd frontend
yarn install
yarn run webdriver-update

if [ $# -gt 0 ] && [ -n "$1" ];
then
  yarn run test-suite --suite "$1" --params.openshift true
else
  yarn run test-gui --params.openshift true
fi
