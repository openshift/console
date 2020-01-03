# Dev Console

## Tekton Pipelines Operator

_**Note:** For the time being the Pipeline Code is embeded in the dev-console package; this is expected to change at an unspecified date in the future and become its own package._

You'll need to install the `OpenShift Pipeline Operator` found in the Admin section Operator Hub. It is suggested for development (while we work on automation coverage) to use the `canary` build in order to manually detect issues as we use the various Pipeline features.

There is a helpful script to install a couple Pipelines found in the `yamls` folder.

Link to the [Script](./yamls/pipelines/install_pipeline_mocks.sh)


## Service Binding Operator

> This scenario illustrates binding an imported application to an in-cluster operated managed PostgreSQL Database.

https://github.com/redhat-developer/service-binding-operator/tree/master/examples/nodejs_postgresql
