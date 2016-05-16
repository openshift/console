# This file is an example of how you might set up your environment to
# run the tectonic console during development. To use it for running
# bridge, do
#
# . contrib/environment.sh
# ./bin/bridge
#

# You'll need a working kubectl, and you'll need jq installed and in
# your path for this script to work correctly.

# The environment variables beginning with "BRIDGE_" act just like
# bridge command line arguments - in fact. to get more information
# about any of them, you can run ./bin/bridge --help

export BRIDGE_ENABLE_DEX_USER_MANAGEMENT=false
export BRIDGE_DISABLE_AUTH=true
export BRIDGE_HOST="http://127.0.0.1:9000"
export BRIDGE_INSECURE_SKIP_VERIFY_K8S_TLS=true

export BRIDGE_K8S_ENDPOINT=$(kubectl config view -o json | jq '{myctx: .["current-context"], ctxs: .contexts[], clusters: .clusters[]}' | jq 'select(.myctx == .ctxs.name)' | jq 'select(.ctxs.context.cluster ==  .clusters.name)' | jq '.clusters.cluster.server' -r)

# This is a workaround for a bug in bridge, that requires an explicit
# port for https rather than using the default.
export BRIDGE_K8S_ENDPOINT=$BRIDGE_K8S_ENDPOINT:443
export BRIDGE_K8S_BEARER_TOKEN=$(kubectl get secrets -o json | jq '.items[].data | select(has("token")) | .token' -r | base64 --decode)
