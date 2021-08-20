# Getting Started

- Guidelines related to Setup, Standards, Review process are present in [README.md](frontend/packages/dev-console/integration-tests/README.md)

## Directory Structure

Folder structure of cypress cucumber framework for Helm-plugin

```
frontend/packages/helm-plugin/integration-tests/
├── features
|   ├──  helm          <--- helm gherkin scenarios
|   |    └──actions-on-helm-release.feature
|   |    └──helm-compatibility.feature
|   |    └──helm-feature-flag.feature
|   |    └──helm-installation-view.feature
|   |    └──helm-navigation.feature
|   |    └──install-helm-chart.feature
|   |    └──topology-helm-release.feature
|   ├──  BestPractices.md   <--- Gherkin script standards
├── plugins                 <--- Plugins  provide a way to support and extend the behavior of cypress
|   |   └── index.ts
├── support                 <--- cypress cucumber support configurations
|   ├── commands            <--- add commands to Cypress 'cy.' global, other support configurations
|   |   └── index.ts
|   |   └── app.ts          <--- hooks are added in this file
|   ├── constants
|   |   |   └──static-text
|   |   |       └── helm-text.ts <--- enums required for helm scripts
|   ├── pages               <--- page functions
│   |   ├── helm        <--- helm related page functions
|   |   |   └──helm-details-page.ts
|   |   |   └──helm-page.ts
|   |   |   └──rollBack-helm-release-page.ts
|   |   |   └──upgrade-helm-release-page.ts
|   |   |   └──index.ts    <-- It consists of relative paths of the files
|   ├── step-definitions    <--- cucumber step implementations
│   |   ├── helm          <--- helm step definitions
|   |   |   └──actions-on-helm-release.ts
|   |   |   └──helm-compatibility.ts
|   |   |   └──helm-feature-flag.ts
|   |   |   └──helm-installation-view.ts
|   |   |   └──helm-navigation.ts
|   |   |   └──install-helm-chart.ts
|   |   |   └──topology-helm-release.ts
│   |   ├── common          <--- Re-usable step definitions
|   |       └──common.ts
├── cypress.json            <--- cypress configuration file
├── tsconfig.json           <--- typescript configuration file
├── reporter-config.json    <--- reporter configuration file
```

### Execution process

Feature file - "regression" suite - execution from Cypress Dashboard

1. Update the TAGS under env section in config file [Cypress.json file](frontend/packages/helm-plugin/integration-tests/cypress.json) as
   "env": { "TAGS": "@regression and not @manual and not @to-do" }
2. In command prompt, navigate to frontend folder
3. Execute command `yarn run test-cypress-helm` and select that particular file or run all files in cypress dashboard

Feature file - "regression" suite - execution from command line

1. Open the [frontend/package.json](../../../package.json) and update `test-cypress-helm-headless` as per requirement
2. In command line, navigate to frontend folder and execute the command `yarn run test-cypress-helm-headless`
3. All the regression scenarios get executed as per the configuration.
