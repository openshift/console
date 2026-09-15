#!/usr/bin/env bash

set -euo pipefail

# https://ci-operator-configresolver-ui-ci.apps.ci.l2s4.p1.openshiftapps.com/help#env
OPENSHIFT_CI=${OPENSHIFT_CI:=false}
ARTIFACT_DIR=${ARTIFACT_DIR:=/tmp/artifacts}

run() {
    local id=$1 name=$2 message=$3 command=$4

    local start=$SECONDS
    local status=0
    bash -c "$command" || status=$?
    local elapsed=$(( SECONDS - start ))

    if [[ ${OPENSHIFT_CI:-false} == true ]]; then
        mkdir -p "$ARTIFACT_DIR"
        local failure_xml=""
        local failures=0

        if [[ $status -ne 0 ]]; then
            failure_xml="<failure>$message</failure>"
            failures=1
        fi

        cat > "$ARTIFACT_DIR/$id.junit.xml" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<testsuites><testsuite name="$id" tests="1" failures="$failures">
  <testcase classname="$id" name="$name" time="$elapsed">$failure_xml</testcase>
</testsuite></testsuites>
EOF
    fi

    if [[ $status -ne 0 ]]; then
        printf '%s\n' "FAILED $name: $message"
        exit 1
    fi
}

# Fails if any of the given paths have modified tracked files or new untracked files.
assert_no_changes() {
    git diff --exit-code -- "$@" &&
    ! git status --short --untracked-files -- "$@" | grep -q .
}
export -f assert_no_changes

pushd frontend

# Dynamic plugin SDK docs are generated as part of the build, check for changes
run \
  'sdk docs' \
  'dynamic plugin SDK docs should be up-to-date by running yarn generate-plugin-sdk-docs' \
  "Dynamic plugin sdk docs are not up to date. Run 'yarn generate-plugin-sdk-docs' then commit changes." \
  'yarn generate-plugin-sdk-docs && assert_no_changes packages/console-dynamic-plugin-sdk/docs'

run \
  'locale files' \
  'i18n locale files should be up-to-date by running yarn i18n' \
  "i18n files are not up to date. Run 'yarn i18n' then commit changes." \
  'yarn i18n && assert_no_changes public/locales packages/**/locales'

run \
  'duplicated deps' \
  'no duplicated dependencies should be present as reported by yarn dedupe' \
  "You have duplicate version resolutions of some packages in yarn.lock. Run 'yarn dedupe' on your machine, then commit the updated yarn.lock." \
  'yarn dedupe --strategy highest --check'

run \
  'knip' \
  'no dead code should be present as reported by yarn knip' \
  "Dead code detected! Run 'yarn knip' and fix all issues." \
  'yarn run knip'

run \
  'gherkin-lint' \
  'gherkin lint should pass as reported by yarn gherkin-lint' \
  "Gherkin lint errors detected!" \
  'yarn run gherkin-lint'

run \
  'eslint' \
  'the linter should pass without any errors as reported by yarn lint' \
  "ESLint errors detected!" \
  'yarn run lint'

if [ "$OPENSHIFT_CI" = true ]; then
  JEST_SUITE_NAME="OpenShift Console Unit Tests" JEST_JUNIT_OUTPUT_DIR="$ARTIFACT_DIR" yarn run test --ci --maxWorkers=2 --reporters=default --reporters=jest-junit
else
  yarn run test
fi

# check-cycles cleans the SDK dist/production build which is needed for some unit tests
run \
  'import cycles' \
  'there should be no import cycles in the codebase as reported by yarn check-cycles' \
  "Import cycle(s) detected! Run 'yarn check-cycles' on your machine for more information." \
  'yarn run check-cycles'
