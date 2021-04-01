# Getting Started

- Guidelines related to Setup, Standards, Review process are present in [README.md](frontend/packages/dev-console/integration-tests/README.md)

## Directory Structure

Folder structure of cypress cucumber framework for Pipelines-plugin

```
frontend/packages/pipelines-plugin/integration-tests/
├── features
|   ├──  pipelines          <--- Pipelines gherkin scenarios
|   |    └──create-from-add-options.feature
|   |    └──create-from-builder-page.feature
|   |    └──pipelines-actions.feature
|   |    └──pipelines-runs.feature
|   |    └──pipelines-secrets.feature
|   |    └──pipelines-triggers.feature
|   |    └──pipelines-workspaces.feature
|   |    └──pipeline-metrics.feature
|   |    └──pipeline-task-runs-display.feature
|   ├──  BestPractices.md   <--- Gherkin script standards
├── plugins                 <--- Plugins  provide a way to support and extend the behavior of cypress
|   |   └── index.ts
├── support                 <--- cypress cucumber support configurations
|   ├── commands            <--- add commands to Cypress 'cy.' global, other support configurations
|   |   └── index.ts
|   |   └── app.ts          <--- hooks are added in this file
|   ├── page-objects         <--- helper objects
|   |   └── pipelines-po.ts   <--- helper objects related to pipelines builder, pipelines run details, pipelines etc...
|   ├── constants           <--- enums required for pipelines scripts
|   |   |   └──pipelines.ts <--- pipelines page related text or messages or field names etc..
|   |   |   └──static-text
|   |   |       └── pipelines-text.ts <--- enums required for pipelines scripts
|   ├── pages               <--- page functions
│   |   ├── pipelines        <--- pipelines related page functions
|   |   |   └──pipelinesBuilder-page.ts
|   |   |   └──pipelinesDetails-page.ts
|   |   |   └──pipelinesRun-details-page.ts
|   |   |   └──pipelines-page.ts
|   |   └── app.ts          <--- Re-usable helper objects and page functions
|   ├── step-definitions    <--- cucumber step implementations
│   |   ├── pipelines          <--- Re-usable pipelines step definitions
|   |       └──create-from-add-options.ts
|   |       └──create-from-builder-page.ts
|   |       └──pipelines-actions.ts
|   |       └──pipelines-runs.ts
|   |       └──pipelines-triggers.ts
|   |       └──pipelines-workspaces.ts
|   |       └──pipelines-secrets.ts
├── testData                                 <--- Test data required for scripts and installation yaml files
|   ├── installPipelinesOperator.yaml    <--- Pipelines installation yaml file
|   ├── pipelines-workspaces             <--- Pipelines workspaces related test data folder
|   |   └──pipeline-configMap.yaml
|   |   └──pipeline-persistentVolumeClaim.yaml
|   |   └──pipeline-secret.yaml
|   |   └──pipeline-task-fetchSecureData.yaml
|   |   └──pipeline-with-workspaces-secrets.yaml
├── cypress.json            <--- cypress configuration file
├── tsconfig.json           <--- typescript configuration file
├── reporter-config.json    <--- reporter configuration file
```

### Execution process

Feature file - "regression" suite - execution from Cypress Dashboard

1. Update the TAGS under env section in config file [Cypress.json file](frontend/packages/pipelines-plugin/integration-tests/cypress.json) as
   "env": { "TAGS": "@regression and not @manual and not @to-do" }
2. In command prompt, navigate to frontend folder
3. Execute command `yarn run test-cypress-pipelines` and select that particular file or run all files in cypress dashboard

Feature file - "regression" suite - execution from command line

1. Open the [frontend/package.json](../../../package.json) and update `test-cypress-pipelines-headless` as per requirement
2. In command line, navigate to frontend folder and execute the command `yarn run test-cypress-pipelines-headless`
3. All the regression scenarios get executed as per the configuration.

Note: User navigates to Developer perspective on every scenario
