#!/bin/bash
# shellcheck shell=bash
#
# This file is an example of how you might set up your environment to
# run the console against an OpenShift cluster during development. To
# use it for running bridge, do login and run
# ./contrib/oc-set-user-settings.sh [username] [filename]
#
# You'll need a working oc. See:
# - https://github.com/openshift/oc
#
# This script reads a file (see LOCAL_FILE) in your working directory
# and patches the ConfigMap for the current or defined username.

set -e

REQUEST_USERNAME=${1:-"~"}
LOCAL_FILE=${2:-"user-settings.yaml"}

NAMESPACE="openshift-console-user-settings"
RESOURCE="user-settings"

USER_NAME=$(oc get "users.user.openshift.io/$REQUEST_USERNAME" -o 'template={{.metadata.name}}')
USER_UID=$(oc get "users.user.openshift.io/$REQUEST_USERNAME" -o 'template={{.metadata.uid}}')

if ! which yq > /dev/null; then
    echo "yq cli not found, please checkout https://github.com/mikefarah/yq#install"
    exit 1
fi

if [ "$USER_UID" != "<no value>" ]; then
    RESOURCE="$RESOURCE-$USER_UID"
elif [ "$USER_NAME" = "kube:admin" ]; then
    RESOURCE="$RESOURCE-kubeadmin"
else
    echo "oc user need to be kube:admin or have a uid."
    exit 1
fi

echo "Update ConfigMap \"$RESOURCE\" in namespace \"$NAMESPACE\" with content of \"$LOCAL_FILE\""

yaml=$(cat "$LOCAL_FILE")

oc patch -n "$NAMESPACE" configmaps "$RESOURCE" --patch "$yaml"
