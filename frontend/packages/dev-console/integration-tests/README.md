# Getting Started

- [Cypress Cucumber Hand book](https://docs.google.com/document/d/1hL_k5r6CVxbY5va6RPPCJfndQjLwSdt6SUKj-kWLqig/edit#)

## Setup

### Include Extensions

- "alexkrechik.cucumberautocomplete",
- "dylanmoerland.cypress-cucumber-steps"
- "streetsidesoftware.code-spell-checker"

Add below content in settings.json under .vscode folder

```json
{
  "cucumberautocomplete.steps": [
    "./frontend/packages/dev-console/integration-tests/support/step-definitions/*/*.ts",
    "./frontend/packages/dev-console/integration-tests/support/step-definitions/*.ts"
  ],
  "cucumberautocomplete.strictGherkinCompletion": true,
  "editor.quickSuggestions": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

## Directory Structure

Folder structure of cypress cucumber framework

```
frontend/packages/dev-console/integration-tests/
├── features
|   ├──  addFlow            <--- Add flow gherkin scenarios
|   |    └──create-from-git.feature
|   ├──  topology           <--- Topology gherkin scenarios
|   |    └──chart-area-visual.feature
|   ├──  knative            <--- Knative gherkin scenarios
|   |    └──create-event-sources.feature
|   ├──  helm               <--- Helm gherkin scenarios
|   |    └──helm-navigation.feature
|   ├──  BestPractices.md   <--- Gherkin script standards
├── plugins                 <--- Plugins  provide a way to support and extend the behavior of cypress
|   |   └── index.ts
├── support                 <--- cypress cucumber support configurations
|   ├── commands            <--- add commands to Cypress 'cy.' global, other support configurations
|   |   └── index.ts
|   |   └── app.ts          <--- hooks are added in this file
|   ├── constants           <--- enums required for dev-console scripts
|   |   |   └──static-text
|   |   |       └── add-fow-text.ts <--- enums required for dev-console scripts
│   |   └── add.ts
|   |   └── global.ts
|   ├── pageObjects         <--- Object Repository [Going forward will publish it as npm module]
│   |   ├── add-flow-po.ts  <--- Add flow related page objects
|   |   └── helm-po.ts      <--- Helm related page objects
|   ├── pages               <--- page functions
│   |   ├── add-flow        <--- Add flow related helper objects and page functions
|   |   |   └──add-page.ts
|   |   └── app.ts          <--- Re-usable helper objects and page functions
|   ├── step-definitions    <--- cucumber step implementations
│   |   ├── addFlow          <--- Re-usable dev-console step definitions
|   |       create-from-catalog.ts
|   |       └──project-creation.ts
│   |   ├── common          <--- Re-usable dev-console step definitions
|   |       └──common.ts
|   |       └──project-creation.ts
├── testData                <--- Test data required for scripts
├── cypress.json            <--- cypress configuration file
```

## This file consists of guide lines to create automation scripts

## Designing Gherkin scripts

### Feature files

1. Below practices helpful to design the gherkin scripts
   [Best Practices for writing gherkin scripts](frontend/packages/dev-console/integration-tests/features/BestPractices.md)
2. Use the same repo for writing gherkin scripts, so that installed plugins gives you the intellisense to select the existing steps which helps to improve re-usability.
3. To maintain gherkin standards, linter is used [configuration file](frontend/.gherkin-lintrc) is available
4. Execute the `yarn run gherkin-lint` command for every pr related to feature file, this helps in maintaining consistency
5. Always comment the steps if not useful [Don't delete them]

## Scenario files

### Generate Step Definition files

1. Only validations should be present
2. Don't use test data directly - It needs to be passed via data files (will use .ts files for now )
3. Navigate to the "login.feature" file
4. Select the command "Generate Steps from feature file" (By pressing "Ctrl+Shift+P" keys, commands will appear in vs code),
5. "login" folder is generated with "login.ts" step definition file
6. Add the comments wherever required
7. Avoid hard coded sleep statements like `cy.wait()`

## View files

### pages

1. Page objects should be id, css selectors, buttontext etc.. [No XPath]- Already following
1. Use arrow functions which helps to reduce the lines of code and it has other benefits as well
1. Logics should be implemented within this files
1. Don't use hard coded values like `waitTime`

### page objects

1. Page objects should be id, css selectors etc.. [No XPath]- Already following

   - Each section should have one object as shown below (It helps to reduce the import list in scenarios)

```ts
export const deleteDeployPopupObj = {
   form: element(by.css('form.modal-content')),
   checkbox: element(by.css('input[type="checkbox"]')),
   cancel: element(by.css('[data-test-id="modal-cancel-action"]')),
   delete: element(by.css('#confirm-action'))
}
```

2. Use arrow functions which helps to reduce the lines of code and it has other benefits as well
3. Logics should be implemented within these files
4. Don't use hard coded values [like waitTime]

### TestData files

1. All test data should be maintained in frontend/testData
2. file should end with "-data.ts"
3. Comment the scenario file name, If data is relevant to specific scenario

## Review Process

### Feature files Review

- Epic related feature files needs to reviewed in 3 phases

1. Review by QE team for standardization & Functional check [Peer Review]
2. Review by Dev team [Preferably Feature owner]
3. Assign to QE Lead for review

- To update the feature files not related to epics

1. Review by QE team for standardization & Functional check [Peer Review]
2. Assign to QE Lead for review

### Code Review Process

- Github adds a reviewer automatically for the PR

1. Review by QE team for standardization [Peer Review]
2. Review by Dev team [Optional]
3. Assign to QE Lead for review

### What needs to be reviewed as part of Code Review

#### Step Definitions

1. If step definition is already available as part of other gherkin scripts, It should be moved to the appropriate file under step-definitions -> common folder
2. No duplicates
3. No console.log statements
4. If functionality is not implemented, It should contain a comment like "// TODO: implement step"
5. Avoid locators

#### Pages

1. function names should be appropriate
2. No Duplicate function names
3. Add the appropriate comments, wherever applicable
4. Number of lines in Function should be less than 10
5. Number of lines in page should be less than 100
6. Avoid page objects as much as possible [To reduce duplication]
7. Code Readability
8. file name should end with -page.ts

#### Page Objects

1. Maintain Hierarchy
2. Variable names should be meaningful
3. file name should end with `-po.ts`

#### Constants

1. Drop down text, tiles etc.. related text maintained in appropriate file
2. It should start with caps

- Under Static text folder

1. error messages, warning or successful text are maintained
2. use camel case for naming
3. file name should end with `-text.ts`

## Scripts Execution

To execute the scripts, always update config file [Cypress.json file](frontend/packages/dev-console/integration-tests/cypress.json) as per the requirement

### Execute single file :

If you need to execute "regression" tagged scripts present in single feature file then follow below process

## TestData files

1. Build the environment in your local as per the README.md present in console
2. Update the TAGS under env section in config file [Cypress.json file](frontend/packages/dev-console/integration-tests/cypress.json) as
   "env": {
   "TAGS": "@regression and not @manual"
   },
3. In command prompt, navigate to frontend folder and execute the command "yarn test-cypress-devconsole"
4. Select the feature file and regression scripts get executed

5. All test data should be maintained in these files
6. Comment the scenario file name, If data is relevant to specific scenario

### Execute multiple file :

## Utilities

If you need to execute "regression" tagged scripts present in single feature file then follow below process

1. If there is any functions which needs to be used in multiple files, include it in appFunctions file
2. If functions are generic, include it in elementInteractions file
3. Build the environment in your local as per the README.md present in console
4. Update the TAGS under env section in config file [Cypress.json file](frontend/packages/dev-console/integration-tests/cypress.json) as
   "env": {
   "TAGS": "@regression and not @manual"
   },
5. Navigate to [package.json](frontend/package.json) and update command "test-cypress-devconsole-headless" as per requirement
6. In command prompt, navigate to frontend folder and execute the command "yarn test-cypress-devconsole-headless"
7. All the regression scenarios get executed [Note: currently implementation is not done]

## Generic standards

## References

1. Don't use static sleep statements (browser.sleep)
2. Comments should be included wherever required
3. Don't include console.log statements while raising PR
4. .gherkin-lintrc configuration file present in frontend folder is used to set Gherkin standards
5. Execute the "yarn run gherkin-lint" command for every QE pr
   [Cypress Cucumber Handbook](https://docs.google.com/document/d/1hL_k5r6CVxbY5va6RPPCJfndQjLwSdt6SUKj-kWLqig/edit#)
   [Cypress Cucumber Implementation](https://docs.google.com/presentation/d/1GyF3WWDnmNVsEn_zIPO3ZyLjSjV3B5RVEdlauiZonP8/edit#slide=id.p1)
