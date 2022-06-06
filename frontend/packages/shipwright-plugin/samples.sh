#!/bin/bash

namespace="christoph"

echo
echo "Delete all in $namespace namespace"
echo

oc get -n "$namespace" buildruns.shipwright.io -o name | xargs oc delete -n "$namespace"
oc get -n "$namespace" builds.shipwright.io -o name | xargs oc delete -n "$namespace"
oc get -n "$namespace" buildstrategies.shipwright.io -o name | xargs oc delete -n "$namespace"

oc apply -n "$namespace" -f samples/1-buildstrategies.yaml
oc apply -n "$namespace" -f samples/2-builds.yaml
oc apply -n "$namespace" -f samples/3-buildruns.yaml
