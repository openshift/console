# Getting Started

- Guidelines related to Setup, Standards, Review process are present in [README.md](frontend/packages/dev-console/integration-tests/README.md)

## Directory Structure

Folder structure of cypress cucumber framework for gitops-plugin

```
frontend/packages/gitops-plugin/integration-tests/
├── features
|   ├──  gitops          <--- gitOps gherkin scenarios
|   |    └──add-manifest-url.feature
|   |    └──linkArgoCD.feature
|   ├──  BestPractices.md   <--- Gherkin script standards
├── plugins                 <--- Plugins  provide a way to support and extend the behavior of cypress
|   |   └── index.ts
├── support                 <--- cypress cucumber support configurations
|   ├── commands            <--- add commands to Cypress 'cy.' global, other support configurations
|   |   └── index.ts
|   |   └── app.ts          <--- hooks are added in this file
|   ├── page-objects         <--- helper objects
|   |   └── environments-po.ts   <--- helper objects related to gitops etc...
|   ├── constants           <--- enums required for gitOps scripts
|   |   |   └──gitops.ts <--- environments page related text or messages or field names etc..
|   ├── pages               <--- page functions
|   |   |   environments-page.ts <--- environments page related text or messages or field names etc..
|   |   └── app.ts          <--- Re-usable helper objects and page functions
|   ├── step-definitions    <--- cucumber step implementations
│   |   ├── gitops          <--- Re-usable gitOps step definitions
|   |   |   └──common.ts
├── testData                                 <--- Test data required for scripts and installation yaml files
|   ├── install-gitops-operator.yaml    <--- GitOps installation yaml file
├── cypress.json            <--- cypress configuration file
├── tsconfig.json           <--- typescript configuration file
├── reporter-config.json    <--- reporter configuration file
```

### Execution process

Feature file - "regression" suite - execution from Cypress Dashboard

1. Update the TAGS under env section in config file [Cypress.json file](frontend/packages/gitops-plugin/integration-tests/cypress.json) as
   "env": { "TAGS": "@regression and not @manual and not @to-do" }
2. In command prompt, navigate to frontend folder
3. Execute command `yarn run test-cypress-gitops` and select that particular file or run all files in cypress dashboard

Feature file - "regression" suite - execution from command line

1. Open the [frontend/package.json](../../../package.json) and update `test-cypress-gitops-headless` as per requirement
2. In command line, navigate to frontend folder and execute the command `yarn run test-cypress-gitops-headless`
3. All the regression scenarios get executed as per the configuration
