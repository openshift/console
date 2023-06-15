import { When, Then, And, Given } from 'cypress-cucumber-preprocessor/steps';
import { webTerminalPage } from '@console/webterminal-plugin/integration-tests/support/step-definitions/pages/web-terminal/webTerminal-page';
import { verifyAndInstallWebTerminalOperator } from '../../../../../dev-console/integration-tests/support/pages/functions/installOperatorOnCluster';

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
  const terminalIdlingTimeout: number = Number(Cypress.env('TERMINAL_IDLING_TIMEOUT')) || 60000;
  webTerminalPage.typeTextAndEnter('wtoctl set timeout 45s')
  cy.wait(terminalIdlingTimeout);
  webTerminalPage.verifyInnactivityMessage(terminalIdlingTimeout);
});

Then(
  'user will be informed that terminal is closed by inactivity and is proposed to restart it',
  () => {
    webTerminalPage.verifyRestartTerminalButton();
  },
);
Given('user with basic rights has installed Web Terminal operator', () => {
  verifyAndInstallWebTerminalOperator();
});
