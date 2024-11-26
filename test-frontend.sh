#!/usr/bin/env bash

set -euo pipefail

# https://ci-operator-configresolver-ui-ci.apps.ci.l2s4.p1.openshiftapps.com/help#env
OPENSHIFT_CI=${OPENSHIFT_CI:=false}
ARTIFACT_DIR=${ARTIFACT_DIR:=/tmp/artifacts}

cd frontend

# Check for outdated yarn.lock file
if [[ -n "$(git status --porcelain -- yarn.lock)" ]]; then
  echo "Outdated yarn.lock file, commit changes to fix!"
  git --no-pager diff
  exit 1
fi

# Dynamic plugin SDK docs are generated as part of the build, check for changes
GIT_STATUS="$(git status --short --untracked-files -- packages/console-dynamic-plugin-sdk/docs)"
if [ -n "$GIT_STATUS" ]; then
  echo "dynamic plugin sdk docs are not up to date. Run 'yarn generate-plugin-sdk-docs' then commit changes."
  git --no-pager diff
  exit 1
fi

yarn i18n
GIT_STATUS="$(git status --short --untracked-files -- public/locales packages/**/locales)"
if [ -n "$GIT_STATUS" ]; then
  echo "i18n files are not up to date. Run 'yarn i18n' then commit changes."
  git --no-pager diff
  exit 1
fi

yarn run lint
if [ "$OPENSHIFT_CI" = true ]; then
  JEST_SUITE_NAME="OpenShift Console Unit Tests" JEST_JUNIT_OUTPUT_DIR="$ARTIFACT_DIR" yarn run test --ci --maxWorkers=2 --reporters=default --reporters=jest-junit
else
  yarn run test
fi
