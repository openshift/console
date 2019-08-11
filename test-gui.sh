#!/usr/bin/env bash

set -exuo pipefail

cd frontend

if [ -v FORCE_CHRMOE_BRANCH_BASE ];
then
  BRANCH_BASE=${FORCE_CHRMOE_BRANCH_BASE}
  export CHROME_BINARY_PATH="${PWD}/__chrome_browser__/${BRANCH_BASE}/chrome-linux/chrome"

  # look for chrome binary
  if [ -x "${CHROME_BINARY_PATH}" ];
  then
    echo "chrmoe binary for branch ${BRANCH_BASE} already exists"
  else
    CHROME_DIR="${PWD}/__chrome_browser__"
    CHROME_DOWNLOAD_URL="https://www.googleapis.com/download/storage/v1/b/chromium-browser-snapshots"

    # download
    mkdir -p "${CHROME_DIR}/${BRANCH_BASE}"
    curl -G "${CHROME_DOWNLOAD_URL}/o/Linux_x64%2F${BRANCH_BASE}%2Fchrome-linux.zip" \
        -d "alt=media" \
        > "${CHROME_DIR}/chrome-linux-${BRANCH_BASE}.zip"
    unzip "${CHROME_DIR}/chrome-linux-${BRANCH_BASE}.zip" -d "${CHROME_DIR}/${BRANCH_BASE}"

    # check sha256sum
    if [ "$(sha256sum ${CHROME_DIR}/chrome-linux-${BRANCH_BASE}.zip | cut -f 1 -d ' ')" != "${FORCE_CHRMOE_BRANCH_SHA256SUM}" ];
    then
      rm -rf "${CHROME_DIR}/${BRANCH_BASE}"

      echo "ERROR: chrmoe binary sha256 missmatch"
      exit 1
    fi
  fi
fi

yarn install
yarn run webdriver-update

if [ $# -gt 0 ] && [ -n "$1" ];
then
  yarn run test-suite --suite "$1" --params.openshift true
else
  yarn run test-gui --params.openshift true
fi
