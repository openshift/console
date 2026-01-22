#!/usr/bin/env bash

# Script to initialize off-cluster authentication configuration for Bridge.
# This script only needs to be run once per cluster.
# It creates an OAuthClient resource with a generated secret and extracts the secret to a file.
# It also creates a secret with a long-lived API token for the console ServiceAccount.
# It then runs Bridge using the following script using the run-bridge.sh script.

set -eo pipefail

thisDir=$(dirname -- "${BASH_SOURCE[0]}")

echo "Initializing authentication off-cluster authentication. This script only needs to be run once per cluster."

oc process -f $thisDir/console-oauth-client.yaml | oc apply -f -
oc get oauthclient console-oauth-client -o jsonpath='{.secret}' > $thisDir/console-client-secret
oc apply -f $thisDir/secret.yaml
oc extract secret/off-cluster-token -n openshift-console --to $thisDir --confirm

echo "Authentication initialized. You can now run the bridge using the following script:"
echo "$thisDir/run-bridge.sh"

echo "Starting bridge..."
$thisDir/run-bridge.sh
