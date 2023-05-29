import { When, Then } from 'cypress-cucumber-preprocessor/steps';
import {
  devWorkspaceStatuses,
  switchPerspective,
} from '@console/dev-console/integration-tests/support/constants';
import {
  projectNameSpace,
  perspective,
} from '@console/dev-console/integration-tests/support/pages';
import { devWorkspacePage } from '@console/dev-console/integration-tests/support/pages/devworspace/devworkspacePage';
import { searchResource } from '@console/dev-console/integration-tests/support/pages/search-resources/search-page';
import { initTerminalPage } from '@console/webterminal-plugin/integration-tests/support/step-definitions/pages/web-terminal/initTerminal-page';

When('user selects Create Project from Project drop down menu', () => {
  initTerminalPage.clickOnProjectDropDawn();
  initTerminalPage.selectCreateProjectButton();
});

When('user enters project name {string}', (projectName: string) => {
  initTerminalPage.typeProjectName(projectName);
});

When('user clicks on Start button', () => {
  initTerminalPage.clickStartButton();
});
Then(
  'user will see the terminal instance for developer namespace {string}',
  (nameSpace: string) => {
    projectNameSpace.selectProject(nameSpace);
    perspective.switchTo(switchPerspective.Administrator);
    searchResource.searchResourceByNameAsAdmin('DevWorkspace');
    searchResource.selectSearchedItem('terminal');
    devWorkspacePage.verifyDevWsResourceStatus(devWorkspaceStatuses.running);
    cy.exec(`oc delete namespace ${nameSpace}`, { failOnNonZeroExit: true });
  },
);

When('user selects {string} from Project drop down menu', (projectName: string) => {
  initTerminalPage.clickOnProjectDropDawn();
  initTerminalPage.selectProject(projectName);
  initTerminalPage.clickStartButton();
});
