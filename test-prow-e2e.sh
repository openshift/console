#!/usr/bin/env bash

set -exuo pipefail
set -e

# PR_FILES_CHANGED store all Modified/Created files in Pull Request.
export PR_FILES_CHANGED=$(git --no-pager diff --name-only HEAD $(git merge-base HEAD master))

# transform_files function transform PR_FILES_CHANGED into a new array => FILES_CHANGED_ARRAY.
function transform_files() {
    for files in ${PR_FILES_CHANGED}
    do
        FILES_CHANGED_ARRAY+=($files)
    done
}

# check_pkg_types function check first if packages/{plugin} folder have modifications and
# in case of modification, respective {plugin} integration-tests should get executed on CI.
function check_pkg_types() {

}

function execute_scripts_on_cron_jobs() {

}

ARTIFACT_DIR=${ARTIFACT_DIR:=/tmp/artifacts}
SCREENSHOTS_DIR=frontend/gui_test_screenshots
INSTALLER_DIR=${INSTALLER_DIR:=${ARTIFACT_DIR}/installer}

function copyArtifacts {
  if [ -d "$ARTIFACT_DIR" ] && [ -d "$SCREENSHOTS_DIR" ]; then
    echo "Copying artifacts from $(pwd)..."
    cp -r "$SCREENSHOTS_DIR" "${ARTIFACT_DIR}/gui_test_screenshots"
  fi
}

function waitForAuthOperatorProgressing {
  output=''
  count=0
  sleepDuration=15
  maxRetries=40  #10 minutes
  action="started"
  if [ "$1" == "False" ]; then
    action="finished"
  fi

  until [ "$output" == "$1" ] || [ $count -gt $maxRetries ]; do
    output=$(oc get co/authentication -o 'jsonpath={.status.conditions[?(@.type=="Progressing")].status}')
    ((count=count+1))
    sleep $sleepDuration
  done

  secs=$((count*sleepDuration));
  printf -v durationStr '%dm:%ds' $((secs%3600/60)) $((secs%60))
  if [ "$output" == "$1" ]; then
    echo "authentication operator $action Progressing 'test' idp (duration: $durationStr)"
  else
    echo "authentication operator: maximum retries reached (duration: $durationStr)"
    exit 1
  fi
}

trap copyArtifacts EXIT

# don't log kubeadmin-password
set +x
BRIDGE_KUBEADMIN_PASSWORD="$(cat "${KUBEADMIN_PASSWORD_FILE:-${INSTALLER_DIR}/auth/kubeadmin-password}")"
export BRIDGE_KUBEADMIN_PASSWORD
set -x
BRIDGE_BASE_ADDRESS="$(oc get consoles.config.openshift.io cluster -o jsonpath='{.status.consoleURL}')"
export BRIDGE_BASE_ADDRESS

# Add htpasswd IDP
oc apply -f ./frontend/integration-tests/data/htpasswd-secret.yaml
oc patch oauths cluster --patch "$(cat ./frontend/integration-tests/data/patch-htpasswd.yaml)" --type=merge
set +x
echo "waiting for authentication operator to start Progressing 'test' idp..."
waitForAuthOperatorProgressing "True"
echo "waiting for authentication operator to finish Progressing 'test' idp..."
waitForAuthOperatorProgressing "False"
set -x

# "fake" dbus address to prevent errors
# https://github.com/SeleniumHQ/docker-selenium/issues/87
DBUS_SESSION_BUS_ADDRESS=/dev/null
export DBUS_SESSION_BUS_ADDRESS

SCENARIO="${1:-e2e}"

if [ "$SCENARIO" != "login" ] && [ "$SCENARIO" != "olmFull" ] && [ "$SCENARIO" != "ceph" ]; then
  CHROME_VERSION=$(google-chrome --version) ./test-protractor.sh "$SCENARIO"
fi

# Disable color codes in Cypress since they do not render well CI test logs.
# https://docs.cypress.io/guides/guides/continuous-integration.html#Colors
export NO_COLOR=1
if [ "$SCENARIO" == "e2e" ] || [ "$SCENARIO" == "release" ]; then
  ./test-cypress.sh -h true
elif [ "$SCENARIO" == "login" ]; then
  ./test-cypress.sh -p console -s 'tests/app/auth-multiuser-login.spec.ts' -h true
elif [ "$SCENARIO" == "olmFull" ]; then
  ./test-cypress.sh -p olm -h true
elif [ "$SCENARIO" == "ceph" ]; then
  ./test-cypress.sh -p ceph -h true
elif [ "$SCENARIO" == "kubevirt-gating" ]; then
  ./test-cypress.sh -p kubevirt -h true
elif [ "$SCENARIO" == "dev-console" ]; then
 ./test-cypress.sh -p dev-console -h true
elif [ "$SCENARIO" == "pipelines" ]; then
 ./test-cypress.sh -p pipelines -h true
elif [ "$SCENARIO" == "gitops" ]; then
 ./test-cypress.sh -p gitops -h true
 elif [ "$SCENARIO" == "knative" ]; then
 ./test-cypress.sh -p knative -h true
fi
