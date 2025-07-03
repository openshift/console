import { When, Then, And, Given } from 'cypress-cucumber-preprocessor/steps';
import {
  adminNavigationMenuPO,
  devNavigationMenuPO,
} from '@console/dev-console/integration-tests/support/pageObjects';
import {
  installWebterminalOperatorUsingCLI,
  projectNameSpace,
} from '@console/dev-console/integration-tests/support/pages';
import { webTerminalPage } from '@console/webterminal-plugin/integration-tests/support/step-definitions/pages/web-terminal/webTerminal-page';

Given('user with basic rights has installed Web Terminal operator', () => {
  installWebterminalOperatorUsingCLI();
});

When('user clicks on Open Terminal in new tab button on the terminal window', () => {
  webTerminalPage.verifyOpenInNewTabButton();
});
Then('user close current Web Terminal session', () => {
  webTerminalPage.closeCurrentTerminalSession();
});
Then('user will see the terminal window opened in new tab', () => {
  webTerminalPage.verifyOpenningInNewTabAttrButton();
});

And('user does nothing with displayed terminal window 1 minutes', () => {
  const terminalIdlingTimeout: number = Number(Cypress.env('TERMINAL_IDLING_TIMEOUT')) || 180000; // [workaround] changed to 180 seconds due to https://issues.redhat.com/browse/WTO-334
  cy.wait(terminalIdlingTimeout);
  webTerminalPage.verifyInnactivityMessage(terminalIdlingTimeout);
});

Then(
  'user will be informed that terminal is closed by inactivity and is proposed to restart it',
  () => {
    webTerminalPage.verifyRestartTerminalButton();
  },
);

Given('user has created or selected namespace {string}', (projectName: string) => {
  Cypress.env('NAMESPACE', projectName);
  cy.get(adminNavigationMenuPO.workloads.main).click();
  cy.get(devNavigationMenuPO.topology).click();
  projectNameSpace.selectOrCreateProject(`${projectName}`);
  // cy.get(devNavigationMenuPO.project).click();
});
