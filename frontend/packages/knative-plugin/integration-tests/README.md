# Getting Started

- Guidelines related to Setup, Standards, Review process are present in [README.md](frontend/packages/dev-console/integration-tests/README.md)

## Directory Structure

Folder structure of cypress cucumber framework for knative-plugin, Please note, structure remains same, files might differ

```
frontend/packages/knative-plugin/integration-tests/
├── features
|   ├──  e2e               <--- Gherkin scenarios executing on CI
|   |    └──knative-ci.feature
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
|   ├──  eventing           <--- Eventing gherkin scenarios
|   |    └──eventing-page-admin.feature
|   |    └──eventing-kafka-event-source.feature
|   |    └──filters-serving-eventing-admin.feature
|   |    └──serverless-admin-empty-state.feature
|   |    └──serving-page-admin.feature
|   ├──  Serverless           <--- Serverless gherkin scenarios
|   |    └──actions-on-knative-revision.feature
|   |    └──actions-on-knative-service.feature
|   |    └──create-knative-workload.feature
|   |    └──side-bar-of-knative-revision-and-service.feature
|   ├──  BestPractices.md   <--- Gherkin script standards
├── plugins                 <--- Plugins  provide a way to support and extend the behavior of cypress
|   |   └── index.ts
├── support                 <--- cypress cucumber support configurations
|   ├── commands            <--- add commands to Cypress 'cy.' global, other support configurations
|   |   └── index.ts
|   |   └── app.ts          <--- hooks are added in this file
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
   "env": { "TAGS": "@knative and @regression and not (@manual or @to-do or @un-verified or @broken-test)" }
2. In command prompt, navigate to [package.json](frontend/package.json)
3. Execute command `./test-cypress.sh -p knative` and select that particular file or run all files in cypress dashboard

Feature file - "regression" suite - execution from command line

1. Navigate to [package.json](frontend/packages/knative-plugin/integration-tests/package.json) and update `test-cypress-headless` as per requirement
2. In command line, navigate to frontend folder and execute the command `./test-cypress.sh -p knative -h true`
3. All the regression scenarios get executed as per the configuration.

```
To Execute the scripts on Remote cluster, use below commands
    export NO_HEADLESS=true && export CHROME_VERSION=$(/usr/bin/google-chrome-stable --version)
    BRIDGE_KUBEADMIN_PASSWORD=<cluster_password>
    BRIDGE_BASE_ADDRESS=<cluster_url>
    export BRIDGE_KUBEADMIN_PASSWORD
    export BRIDGE_BASE_ADDRESS
    oc login -u kubeadmin -p $BRIDGE_KUBEADMIN_PASSWORD
    oc apply -f ./frontend/integration-tests/data/htpasswd-secret.yaml
    oc patch oauths cluster --patch "$(cat ./frontend/integration-tests/data/patch-htpasswd.yaml)" --type=merge
    ./test-cypress.sh -p knative -h true
