# Shipwright Plugin

Console extension for [Shipwright](https://shipwright.io/) Builds

Tested with version 0.9

## Installation

1. Install `Red Hat OpenShift Pipelines` from the OperatorHub (Red Hat catalog)
2. Install `Shipwright Operator` from the OperatorHub (operatorhubio-catalog)
3. On the installed operator details page, select `ShipwrightBuild` and create the default resource.

   This will enable the Shipwright controller and install the CRDs (`ClusterBuildStrategy`, `BuildStrategy`, `Build`, `BuildRun` etc.)

## Test builds

Notice:

1. The origin samples in the Shipwright git repository doesn't run with the default Service Account on OpenShift and needs some additional configurations.
2. Our samples are slightly modified and doesn't require this. We use namespaced scoped BuildStrategies so that they don't conflict.
3. We also uses our internal OpenShift image registry and provided some full demos.

To install the resources you need to create the namespace `build-examples` and apply the YAML files from the samples folder.
