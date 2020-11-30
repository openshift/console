# Getting Started

## Directory Structure

Folder structure of cypress cucumber framework

```
frontend/packages/dev-console/integration-tests/
├── support                 <--- cypress cucumber support configurations
|   ├── commands            <--- add commands to Cypress 'cy.' global, other support configurations
|   |   └── index.ts
|   |   └── app.ts          <--- hooks are added in this file
|   ├── pageObjects         <--- helper objects
|   |   └── add-fow-po.ts   <--- helper objects related to add page - git, catalog, container
|   ├── constants           <--- enums required for dev-console scripts
│   |   └── add.ts
|   |   └── global.ts
|   ├── pages               <--- page functions
│   |   ├── add-flow        <--- Add flow related helper objects and page functions
|   |   |   └──add-page.ts
|   |   └── app.ts          <--- Re-usable helper objects and page functions
|   ├── step-definitions    <--- cucumber step implementations
│   |   ├── common          <--- Re-usable dev-console step definitions
|   |       └──common.ts
|   |       └──project-creation.ts
├── features
|   ├──  addFlow            <--- Add flow gherkin scenarios
|   |    └──create-from-git.feature
|   ├──  topology           <--- Topology gherkin scenarios
|   |    └──chart-area-visual.feature
|   ├──  pipelines          <--- Pipelines gherkin scenarios
|   |    └──create-from-builder-page.feature
|   ├──  knative            <--- Knative gherkin scenarios
|   |    └──create-event-sources.feature
|   ├──  helm               <--- Helm gherkin scenarios
|   |    └──helm-navigation.feature
|   ├──  BestPractices.md   <--- Gherkin script standards
├── fixtures                <--- Test data required for scripts
├── cypress.json            <--- cypress configuration file

```

## This file consists of guide lines to create automation scripts

## Scenario files

1. Only validations should be present
2. Don't use test data directly - It needs to be passed via data files (will use .ts files for now )

## View files

1. Page objects should be id, css selectors, buttontext etc.. [No XPath]- Already following

   - Each section should have one object as shown below (It helps to reduce the import list in scenarios)

     export const deleteDeployPopupObj = {
     form: element(by.css('form.modal-content')),
     checkbox: element(by.css('input[type="checkbox"]')),
     cancel: element(by.css('[data-test-id="modal-cancel-action"]')),
     delete: element(by.css('#confirm-action'))
     }

2. Use arrow functions which helps to reduce the lines of code and it has other benefits as well
3. Logics should be implemented within these files
4. Don't use hard coded values [like waitTime]

## TestData files

1. All test data should be maintained in these files
2. Comment the scenario file name, If data is relevant to specific scenario

## Utilities

1. If there is any functions which needs to be used in multiple files, include it in appFunctions file
2. If functions are generic, include it in elementInteractions file

## Generic standards

1. Don't use static sleep statements (browser.sleep)
2. Comments should be included wherever required
3. Don't inlcude console.log statements while raising PR
