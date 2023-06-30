#!/usr/bin/env bash

set -exuo pipefail

BASEDIR=$(dirname "$0")/..

function waitForAuthOperatorProgressing {
  output=''
  count=0
  sleepDuration=15
  maxRetries=40 # 10 minutes
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

# Add htpasswd IDP
# Skip wait for authentication operator to start Progressing when the Secret already exists.
# And ignore any kind of errors when the Secret doesn't exist.
htpasswd_secret_name=$(oc get --ignore-not-found secret -n openshift-config htpass-secret -o name 2> /dev/null)

if [ "$htpasswd_secret_name" == "" ]; then
  oc create -f "$BASEDIR/frontend/integration-tests/data/htpasswd-secret.yaml"
  oc patch oauths cluster --patch "$(cat "$BASEDIR/frontend/integration-tests/data/patch-htpasswd.yaml")" --type=merge
  set +x
  echo "waiting for authentication operator to start Progressing 'test' idp..."
  waitForAuthOperatorProgressing "True"
  echo "waiting for authentication operator to finish Progressing 'test' idp..."
  waitForAuthOperatorProgressing "False"
  set -x
fi
