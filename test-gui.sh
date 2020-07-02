#!/usr/bin/env bash

set -exuo pipefail

cd frontend

yarn install
if [ "${BRIDGE_E2E_BROWSER_NAME-}" == 'firefox' ]; then
 yarn run webdriver-update
else
 if [ -n "${CHROME_VERSION-}" ]; then
  yarn run webdriver-update --versions.chrome="$CHROME_VERSION" --gecko=false
 else
  yarn run webdriver-update --gecko=false
 fi
fi

if [ $# -gt 0 ] && [ -n "$1" ]; then
  yarn run test-suite --suite "$1" --params.openshift true
else
  yarn run test-gui --params.openshift true
fi
