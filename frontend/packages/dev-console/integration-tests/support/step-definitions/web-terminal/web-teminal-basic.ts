import { When, Then, And } from 'cypress-cucumber-preprocessor/steps';
import { webTerminalPage } from '../../pages/web-terminal/webTerminal-page';

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
  // override the defauld idling timeout form 15 minute to 1 minute
  cy.exec(`oc patch configmap devworkspace-controller -n openshift-operators --patch "
  data:
    devworkspace.idle_timeout: '1m'
  "`);
  const terminalIdlingTimeout: number = Number(Cypress.env('TERMINAL_IDLING_TIMEOUT')) || 60000;
  cy.wait(terminalIdlingTimeout);
  webTerminalPage.verifyInnactivityMessage(terminalIdlingTimeout);
});

Then(
  'user will be informed that terminal is closed by inactivity and is proposed to restart it',
  () => {
    webTerminalPage.verifyRestartTerminalButton();
  },
);
