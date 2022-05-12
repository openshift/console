import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { nav } from '@console/cypress-integration-tests/views/nav';
import { switchPerspective } from '../../constants';
import { webTerminalPO } from '../../pageObjects/web-terminal-po';
import { perspective } from '../../pages';
import { addTerminals, closeTerminal } from '../../pages/functions/addTerminalTabs';
import { checkTerminalIcon } from '../../pages/functions/checkTerminalIcon';

Given('user has logged in as admin user', () => {
  perspective.switchTo(switchPerspective.Administrator);
  nav.sidenav.switcher.shouldHaveText(switchPerspective.Administrator);
});

Given('user can see terminal icon on masthead', () => {
  checkTerminalIcon();
  cy.get(webTerminalPO.webTerminalIcon).should('be.visible');
});

When('user clicks on the Web Terminal icon on the Masthead', () => {
  cy.get(webTerminalPO.webTerminalIcon).click();
});

When('user opens {int} additional web terminal tabs', (n: number) => {
  addTerminals(n);
});

When('user closed {string} web terminal tab', (n: string) => {
  closeTerminal(n);
});

Then('user is able see {int} web terminal tabs', (n: number) => {
  cy.get(webTerminalPO.tabsList).then(($el) => {
    expect($el.prop('children').length).toEqual(n + 1);
  });
});
