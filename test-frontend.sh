#!/usr/bin/env bash

set -euo pipefail

# https://ci-operator-configresolver-ui-ci.apps.ci.l2s4.p1.openshiftapps.com/help#env
OPENSHIFT_CI=${OPENSHIFT_CI:=false}
ARTIFACT_DIR=${ARTIFACT_DIR:=/tmp/artifacts}

cd frontend
yarn run lint
if [ "$OPENSHIFT_CI" = true ]; then
    JEST_SUITE_NAME="OpenShift Console Unit Tests" JEST_JUNIT_OUTPUT_DIR="$ARTIFACT_DIR" yarn run test --ci --reporters=default --reporters=jest-junit
else
    yarn run test
fi

if git status --short | grep 'yarn.lock' > /dev/null; then
  printf "\n\nOUTDATED yarn.lock (COMMIT IT TO FIX!!!!!)\n"
  git diff
  exit 1
fi

yarn i18n
GIT_STATUS="$( git status --short --untracked-files -- ./locales )"
if [ -n "$GIT_STATUS" ]; then
  echo "i18n files are not up to date. Commit them to fix."
  git diff
  exit 1
fi
