#!/usr/bin/env bash
# Print a BRIDGE_PLUGIN_PROXY value that routes
# /api/proxy/plugin/monitoring-console-plugin/perses/ to the Perses server,
# with the user's token (authorize) and the perses namespace CA
# (10-certificates.yaml) as the only trusted CA for that route. Other services
# in the current value are kept; an existing Perses entry is replaced. The CA
# certificate is public; no secret is printed.
#
#   current=$(kubectl -n <console-namespace> get deployment <console-deployment> \
#     -o jsonpath='{.spec.template.spec.containers[0].env[?(@.name=="BRIDGE_PLUGIN_PROXY")].value}')
#   kubectl -n <console-namespace> set env deployment/<console-deployment> \
#     BRIDGE_PLUGIN_PROXY="$(royal-road/deploy/perses/plugin-proxy.sh "$current")"
#
# Needs kubectl (pointing at the target cluster) and jq.
set -euo pipefail
ns=${PERSES_NAMESPACE:-perses}
current=${1:-}
[[ -n $current ]] || current='{"services":[]}'
ca=$(kubectl -n "$ns" get secret perses-ca -o jsonpath='{.data.ca\.crt}' | base64 -d)
if [[ $ca != *"BEGIN CERTIFICATE"* ]]; then
  echo "no CA in secret $ns/perses-ca; is 10-certificates.yaml applied and Ready?" >&2
  exit 1
fi
path=/api/proxy/plugin/monitoring-console-plugin/perses/
jq -c --arg ca "$ca" --arg ep "https://perses.$ns.svc:8080" --arg path "$path" '
  .services = ([.services[]? | select(.consoleAPIPath != $path)] + [{
    consoleAPIPath: $path,
    endpoint: $ep,
    caCertificate: $ca,
    authorize: true
  }])' <<<"$current"
