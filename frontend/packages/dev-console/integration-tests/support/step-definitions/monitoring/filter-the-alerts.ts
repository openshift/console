import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { monitoringTabs } from '../../constants';
import { monitoringPage } from '../../pages';

Given('user is on the Alerts tab', () => {
  monitoringPage.selectTab(monitoringTabs.Alerts);
});

When('user clicks on the Filter dropdown', () => {
  monitoringPage.alerts.clickFilter();
});

Then(
  'user is able to see Firing, Pending, Silenced and Not Firing filters under Alert State type',
  () => {
    cy.get('ul section h1').should('contain.text', 'Alert State');
    cy.get('#firing').should('be.visible');
    cy.get('#pending').should('be.visible');
    cy.get('#silenced').should('be.visible');
    cy.get('#not-firing').should('be.visible');
  },
);

Then('user is able to see Critical, Warning, Info and None filters under Severity type', () => {
  cy.get('ul section h1').should('contain.text', 'Severity');
  cy.get('#critical').should('be.visible');
  cy.get('#warning').should('be.visible');
  cy.get('#info').should('be.visible');
  cy.get('#none').should('be.visible');
});

Then('user is able to see filters as unchecked', () => {
  cy.get('#firing-checkbox').should('not.be.checked');
  cy.get('#pending-checkbox').should('not.be.checked');
  cy.get('#silenced-checkbox').should('not.be.checked');
  cy.get('#not-firing-checkbox').should('not.be.checked');
  cy.get('#critical-checkbox').should('not.be.checked');
  cy.get('#warning-checkbox').should('not.be.checked');
  cy.get('#info-checkbox').should('not.be.checked');
  cy.get('#none-checkbox').should('not.be.checked');
});

When('user selects the {string} option under Alert State type', (alertStateType: string) => {
  cy.get(`#${alertStateType}-checkbox`).click();
});

When('user selects the {string} option under Severity type', (severityType: string) => {
  cy.get(`#${severityType}-checkbox`).click();
});

Then('user will see the only {string} alerts if there are any', (filterType: string) => {
  cy.log(filterType);
  // manual step
});

Then('user will not see the {string} alerts', (filterType: string) => {
  cy.log(filterType);
  // manual step
});
