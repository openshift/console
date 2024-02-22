import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { operators } from '../../constants';
import { devNavigationMenuPO, quickStartCard, quickStartSidebarPO } from '../../pageObjects';
import { app, verifyAndInstallOperator } from '../../pages';

Given('user has installed Web Terminal Operator', () => {
  verifyAndInstallOperator(operators.WebTerminalOperator);
});

Given('user has applied {string}', (yamlFileName: string) => {
  cy.exec(`oc apply -f testData/quick-start/${yamlFileName} -n ${Cypress.env('NAMESPACE')} `, {
    failOnNonZeroExit: false,
  }).then(function (result) {
    cy.log(result.stdout);
  });
});

Given('user is at Quick Starts catalog page', () => {
  cy.get(devNavigationMenuPO.add).click();
  cy.reload();
  cy.byTestID('item all-quick-starts').click();
});

When('user clicks on the {string} Quick Starts card', (tourName: string) => {
  cy.get(quickStartCard(tourName)).click();
});

When('user clicks on Step 1', () => {
  cy.get(quickStartSidebarPO.quickStartSidebarBody).find('h3').click();
});

When('user clicks on the Start button', () => {
  cy.get(quickStartSidebarPO.quickStartSidebar).byTestID('Start button').click();
});

When('user sees that {string} step has started', (stepName: string) => {
  cy.get(quickStartSidebarPO.quickStartSidebarBody).get('h3').contains(stepName);
  cy.byLegacyTestID('quick-start-task-subtitle').contains('1 of 1');
});

When('user hovers on the copy icon in the code snippet', () => {
  cy.get(quickStartSidebarPO.clipboardAction).first().trigger('mouseenter').invoke('focus');
});

Then('user can see {string} tooltip appears after click', (tooltip: string) => {
  cy.get(quickStartSidebarPO.clipboardAction)
    .first()
    .invoke('focus')
    .trigger('mouseenter')
    .wait(1000)
    .then(() => {
      cy.get(quickStartSidebarPO.tooltip).contains(tooltip);
    })
    .trigger('mouseleave');
});

Then('user can see {string} tooltip appears after hover', (tooltip: string) => {
  cy.get(quickStartSidebarPO.tooltip).contains(tooltip);
});

Then('user clicks on the copy icon in the code snippet', () => {
  cy.get(quickStartSidebarPO.clipboardAction).first().click();
});

Then('user clicks on the Restart button', () => {
  cy.get(quickStartSidebarPO.restartSideNoteAction).click();
});

Given('user has the {string} Quick Starts side panel open', (tour: string) => {
  cy.get(quickStartSidebarPO.quickStartSidebar).should('be.visible');
  cy.get(quickStartSidebarPO.quickStartSidebar).find('h2').contains(tour);
});

When('user has copied the code snippet', () => {
  cy.get(quickStartSidebarPO.clipboardAction).first().click();
});

When('user hovers on the play icon in the code snippet', () => {
  cy.reload();
  app.waitForDocumentLoad();
  cy.get(quickStartSidebarPO.executeAction).first().trigger('mouseenter').invoke('focus');
});

Then('user clicks on the play icon in the code snippet', () => {
  cy.get(quickStartSidebarPO.executeAction).first().click();
});

Then(
  'user can see {string} tooltip appears for executing the code in terminal',
  (tooltip: string) => {
    cy.get('[class="ocs-tooltip"]').contains(tooltip);
  },
);
