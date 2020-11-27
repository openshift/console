#!/bin/bash
# shellcheck shell=bash
#
# This file is an example of how you might set up your environment to
# run the console against an OpenShift cluster during development. To
# use it for running bridge, do login and run
# ./contrib/oc-get-user-settings.sh [username] [filename]
#
# You'll need a working oc, and you'll need yq installed and in your
# path for this script to work correctly. See:
# - https://github.com/openshift/oc
# - https://github.com/mikefarah/yq#install
#
# This script creates a file (see LOCAL_FILE) in your working directory
# with the data part of the ConfigMap which saves the user settings.

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

echo "Get ConfigMap \"$RESOURCE\" from namespace \"$NAMESPACE\" and save it to \"$LOCAL_FILE\""
echo

yaml=$(oc get -n "$NAMESPACE" configmaps "$RESOURCE" -o yaml)

# Extract apiVersion, kind and customization
(
    echo "$yaml" | yq r - apiVersion | yq p - apiVersion
    echo "$yaml" | yq r - kind | yq p - kind
    echo "$yaml" | yq r - data | yq p - data
) > "$LOCAL_FILE"

# Debug output
echo "$yaml" | yq r - data | yq p - "User settings"
