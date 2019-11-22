# Dev Console

## Tekton Pipelines Operator

> For the time being the Pipeline Code is embeded in the dev-console package; this is expected to change at an unspecified date in the future and become it's own package

You'll need to install the `OpenShift Pipeline Operator` found in the Admin section Operator Hub. It is suggested for development (while we work on automation coverage) to use the `canary` build in order to manually detect issues as we use the various Pipeline features.

There is a helpful script to install a couple Pipelines found in the `yamls` folder.

Link to the [Script](./yamls/pipelines/install_pipeline_mocks.sh)
