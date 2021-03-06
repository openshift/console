# Getting Started

- Guidelines related to Setup, Standards, Review process are present in [README.md](frontend/packages/dev-console/integration-tests/README.md)

## Directory Structure

Folder structure of cypress cucumber framework for knative-plugin

```
frontend/packages/knative-plugin/integration-tests/
├── features
|   ├──  knative          <--- knative gherkin scenarios
|   |    └──actions-on-event-source-side-bar.feature
|   |    └──actions-on-event-sources.feature
|   |    └──actions-on-knative-revision.feature
|   |    └──actions-on-knative-service.feature
|   |    └──create-event-sources.feature
|   |    └──create-knative-workload.feature
|   |    └──event-sources-installation-view.feature
|   |    └──event-sources-sink-to-URI.feature
|   |    └──event-sources.feature
|   |    └──eventing-broker-trigger.feature
|   |    └──eventing-broker.feature
|   |    └──eventing-camelk.feature
|   |    └──eventing-channel-subscription.feature
|   |    └──eventing-channel.feature
|   |    └──eventing-kafka-event-source.feature
|   |    └──eventing-kamletes.feature
|   |    └──eventing-page-admin.feature
|   |    └──eventing-kafka-event-source.feature
|   |    └──filters-serving-eventing-admin.feature
|   |    └──serverless-admin-empty-state.feature
|   |    └──serving-page-admin.feature
|   |    └──side-bar-of-knative-revision-and-service.feature
|   ├──  BestPractices.md   <--- Gherkin script standards
├── plugins                 <--- Plugins  provide a way to support and extend the behavior of cypress
|   |   └── index.ts
├── support                 <--- cypress cucumber support configurations
|   ├── commands            <--- add commands to Cypress 'cy.' global, other support configurations
|   |   └── index.ts
|   |   └── app.ts          <--- hooks are added in this file
|   ├── page-objects         <--- helper objects
|   |   └── 
|   ├── constants           <--- enums required for knative scripts
|   |   |   └──
|   |   |   └──static-text
|   |   |       └── knative-text.ts <--- enums required for knative scripts
|   ├── pages               <--- page functions
│   |   ├── functions        <--- knative related page functions
|   |   |   └──knativeSubscriptions.ts
|   |   └── app.ts          <--- Re-usable helper objects and page functions
|   ├── step-definitions    <--- cucumber step implementations
│   |   ├── knative          <--- Re-usable knative step definitions
|   |       └──actions-on-event-source-side-bar.ts
|   |       └──actions-on-event-sources.ts
|   |       └──actions-on-knative-revision.ts
|   |       └──actions-on-knative-service.ts
|   |       └──create-apcahe-camel.ts
|   |       └──create-event-sources.ts
|   |       └──side-bar-of-knative-revision-and-service.ts
├── testData                                 <--- Test data required for scripts and installation yaml files
|   ├── installknativeOperator.yaml    <--- knative installation yaml file
├── cypress.json            <--- cypress configuration file
├── tsconfig.json           <--- typescript configuration file
├── reporter-config.json    <--- reporter configuration file
```

### Execution process

Feature file - "regression" suite - execution from Cypress Dashboard

1. Update the TAGS under env section in config file [Cypress.json file](frontend/packages/knative-plugin/integration-tests/cypress.json) as
   "env": { "TAGS": "@regression and not @manual and not @to-do" }
2. In command prompt, navigate to [package.json](frontend/package.json)
3. Execute command `yarn run test-cypress-knative` and select that particular file or run all files in cypress dashboard

Feature file - "regression" suite - execution from command line

1. Navigate to [package.json](frontend/package.json) and update `test-cypress-knative-headless` as per requirement
2. In command line, navigate to frontend folder and execute the command `yarn run test-cypress-knative-headless`
3. All the regression scenarios get executed as per the configuration.
