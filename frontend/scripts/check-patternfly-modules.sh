#!/bin/bash
set -euo pipefail

COL_RESET='\e[0m'
COL_RED='\e[0;31m'
COL_GREEN='\e[0;32m'
COL_YELLOW='\e[0;33m'

resolution_errors=false

# Ensure that only one version resolution exists for PatternFly packages in yarn.lock file.
# Having multiple version resolutions may lead to bugs and webpack build or performance issues.
#
# Note: this code relies on yarn.lock v1 format since `yarn why <query>` CLI does not support
# proper JSON output. We should revisit this code once we upgrade to a newer Yarn version.
check-resolution() {
  local PKG_NAME="${1:?Provide package name to check}"
  local RES_COUNT=$(grep -Pc "^\"${PKG_NAME}@" yarn.lock)

  if [[ $RES_COUNT -eq 0 ]]; then
    echo -e "${COL_RED}${PKG_NAME}${COL_RESET} has no version resolutions"
    resolution_errors=true
  elif [[ $RES_COUNT -ne 1 ]]; then
    echo -e "${COL_RED}${PKG_NAME}${COL_RESET} has multiple version resolutions"
    resolution_errors=true
  fi
}

# These packages will be checked for version resolutions.
# This list is explicit since we may want to skip checking certain packages.
#
# To see the current full list, run the following command:
#   sed -nr 's/^\"(@patternfly\/[^@]+).*$/\1/p' yarn.lock | sort -u
PKGS_TO_CHECK=$(echo \
  '@patternfly/quickstarts' \
  '@patternfly/react-catalog-view-extension' \
  '@patternfly/react-charts' \
  '@patternfly/react-component-groups' \
  '@patternfly/react-console' \
  '@patternfly/react-core' \
  '@patternfly/react-icons' \
  '@patternfly/react-log-viewer' \
  '@patternfly/react-styles' \
  '@patternfly/react-table' \
  '@patternfly/react-tokens' \
  '@patternfly/react-topology' \
  '@patternfly/react-user-feedback' \
  '@patternfly/react-virtualized-extension'
)

echo -e "Checking ${COL_YELLOW}yarn.lock${COL_RESET} file for PatternFly module resolutions"

for pkg in $PKGS_TO_CHECK; do
  check-resolution $pkg
done

if [[ "$resolution_errors" == "false" ]]; then
  echo -e "${COL_GREEN}No issues detected${COL_RESET}"
  exit 0
else
  echo -e "Run ${COL_YELLOW}yarn why <pkg-name>${COL_RESET} to inspect module resolution details"
  exit 1
fi
