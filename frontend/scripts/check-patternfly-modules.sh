#!/bin/bash
set -euo pipefail

COL_RESET='\033[0m'
COL_RED='\033[31m'
COL_GREEN='\033[32m'
COL_YELLOW='\033[33m'

resolution_errors=false

# https://docs.ci.openshift.org/docs/architecture/step-registry/#step-execution-environment
OPENSHIFT_CI=${OPENSHIFT_CI:=false}

# Ensure that only one major version resolution exists for the given package in yarn.lock file.
# Having multiple version resolutions may lead to bugs and webpack build or performance issues.
check-resolution() {
  local PKG_NAME="${1:?Provide package name to check}"
  local PKG_MAJOR_VERSION="${2:?Provide package major version}"

  # https://stackoverflow.com/a/29613573
  local PKG_NAME_ESCAPED=$(sed 's/[^^]/[&]/g; s/\^/\\^/g' <<< "${PKG_NAME}")

  local RES_COUNT=$(
    yarn why "${PKG_NAME}" --json 2>/dev/null \
      | grep -o '=> Found \\".*\\"' \
      | sed -n "s/^.*${PKG_NAME_ESCAPED}@\(.*\)[\]\"/\1/p" \
      | grep "^${PKG_MAJOR_VERSION}\." \
      | uniq \
      | wc -l
  )

  local MSG_PKG_ERROR="${COL_RED}${PKG_NAME}${COL_RESET}"
  local MSG_PKG_SUCCESS="${COL_GREEN}${PKG_NAME}${COL_RESET}"
  local MSG_VERSION="${COL_YELLOW}${PKG_MAJOR_VERSION}.x${COL_RESET}"

  if [[ $RES_COUNT -eq 0 ]]; then
    echo -e "${MSG_PKG_ERROR} has no ${MSG_VERSION} resolutions"
    resolution_errors=true
  elif [[ $RES_COUNT -ne 1 ]]; then
    echo -e "${MSG_PKG_ERROR} has multiple ${MSG_VERSION} resolutions"
    resolution_errors=true
  else
    echo -e "${MSG_PKG_SUCCESS} has one ${MSG_VERSION} resolution"
  fi
}

# List of packages to check, formatted as '{package_name}:{major_version}'
PKGS_TO_CHECK=(
  '@patternfly/patternfly:6'
  '@patternfly/quickstarts:6'
  '@patternfly/react-catalog-view-extension:6'
  '@patternfly/react-charts:8'
  '@patternfly/react-component-groups:6'
  '@patternfly/react-console:6'
  '@patternfly/react-core:6'
  '@patternfly/react-icons:6'
  '@patternfly/react-log-viewer:6'
  '@patternfly/react-styles:6'
  '@patternfly/react-table:6'
  '@patternfly/react-tokens:6'
  '@patternfly/react-topology:6'
  '@patternfly/react-user-feedback:6'
  '@patternfly/react-virtualized-extension:6'
)

echo -e "Checking ${COL_YELLOW}yarn.lock${COL_RESET} file for PatternFly module resolutions"

if [[ "$OPENSHIFT_CI" == "true" ]]; then
  # disable parallel execution in CI to reduce CPU usage
  for pkg in "${PKGS_TO_CHECK[@]}"; do
    check-resolution "${pkg%%:*}" "${pkg#*:}"
  done
else
  for pkg in "${PKGS_TO_CHECK[@]}"; do
    check-resolution "${pkg%%:*}" "${pkg#*:}" &
  done

  wait
fi

if [[ "$resolution_errors" == "false" ]]; then
  echo -e "${COL_GREEN}No issues detected${COL_RESET}"
  exit 0
else
  echo -e "Run ${COL_YELLOW}yarn why <pkg-name>${COL_RESET} to inspect module resolution details"
  exit 1
fi
