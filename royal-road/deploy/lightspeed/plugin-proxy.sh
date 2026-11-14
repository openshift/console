#!/usr/bin/env bash
# Print the BRIDGE_PLUGIN_PROXY value for the Lightspeed plugin: the bridge
# route /api/proxy/plugin/lightspeed-console-plugin/ols/ to OLS, with the
# user's token (authorize) and the namespace CA from 20-tls.yaml as the only
# trusted CA for that route. The CA certificate is public; no secret is printed.
#
#   royal-road/deploy/lightspeed/plugin-proxy.sh
#   kubectl -n <console-namespace> set env deployment/<console-deployment> \
#     BRIDGE_PLUGIN_PROXY="$(royal-road/deploy/lightspeed/plugin-proxy.sh)"
#
# Needs kubectl (pointing at the target cluster) and jq.
set -euo pipefail
ns=${LIGHTSPEED_NAMESPACE:-openshift-lightspeed}
ca=$(kubectl -n "$ns" get secret lightspeed-ca -o jsonpath='{.data.tls\.crt}' | base64 -d)
if [[ $ca != *"BEGIN CERTIFICATE"* ]]; then
  echo "no CA in secret $ns/lightspeed-ca; is 20-tls.yaml applied and Ready?" >&2
  exit 1
fi
jq -cn --arg ca "$ca" --arg ep "https://lightspeed-app-server.$ns.svc:8443" '{services: [{
  consoleAPIPath: "/api/proxy/plugin/lightspeed-console-plugin/ols/",
  endpoint: $ep,
  caCertificate: $ca,
  authorize: true
}]}'
