import { When, Then } from 'cypress-cucumber-preprocessor/steps';
import { monitoringPO } from '../../pageObjects';
import { monitoringPage } from '../../pages';

When('user selects {string} Query from Select Query dropdown', (queryName: string) => {
  monitoringPage.metrics.selectQuery(queryName);
});

When('user enters the custom query {string}', (query: string) => {
  monitoringPage.metrics.enterQuery(query);
});

When('user clicks on Show PromQL button', () => {
  cy.get(monitoringPO.metricsTab.showPromQL).click();
});

When('user clicks on Hide PromQL button', () => {
  cy.get(monitoringPO.metricsTab.hidePromQL).click();
});

Then('user is able to see Show PromQL button', () => {
  cy.get(monitoringPO.metricsTab.showPromQL).should('be.visible');
});

Then('user is able to see message {string}', (message: string) => {
  cy.get(monitoringPO.metricsTab.emptyQueryMessage).should('contain.text', message);
});

When('user selects {string} on Time range dropdown', (time: string) => {
  cy.get(monitoringPO.timeRange).click();
  cy.byButtonText(time).click();
});

When('user clicks on Reset Zoom button', () => {
  cy.get(monitoringPO.metricsTab.resetZoom).click();
});

Then('user will see the pods list', () => {
  cy.get(monitoringPO.metricsTab.podsList).should('be.visible');
});

Then('user will see the value of CPU used by each pod', () => {
  // TODO: implement step
});

Then('user will see the value of Memory used by each pod', () => {
  // TODO: implement step
});

Then('user will see the Filesystem Usage', () => {
  // TODO: implement step
});

Then('user will see the Received Bandwidth', () => {
  // TODO: implement step
});

Then('user will see the Transmitted Bandwidth', () => {
  // TODO: implement step
});

Then('user will see the Received Packets', () => {
  // TODO: implement step
});

Then('user will see namespace name {string}', (namespace: string) => {
  // TODO: implement step
  cy.log(namespace);
});

Then('user will see the Transmitted Packets', () => {});

Then('user will see the value of Filesystem used by each pod', () => {
  // TODO: implement step
});

Then('user will see the value of Received Bandwidth by each pod', () => {
  // TODO: implement step
});

Then('user will see the value of Transmitted Bandwidth by each pod', () => {
  // TODO: implement step
});

Then('user will see the value of Received Packets by each pod', () => {
  // TODO: implement step
});

Then('user will see the value of Transmitted Packets by each pod', () => {
  // TODO: implement step
});

Then('user will see the value of Received Packets Dropped by each pod', () => {
  // TODO: implement step
});

Then('user will see the value of Transmitted Packets Dropped by each pod', () => {
  // TODO: implement step
});

Then('user will see the output of the custom query', () => {
  monitoringPage.metrics.verifyGraph();
});

Then('user will see the value of given custom query by each pod', () => {
  // TODO: implement step
});

Then('user will see the query ran to see CPU Usage', () => {
  // TODO: implement step
});

Then('user will see Hide PromQL button', () => {
  // TODO: implement step
});

Then('user wont see the query', () => {
  // TODO: implement step
});

Then('user will see CPU Usage for past one hour', () => {
  // TODO: implement step
});

Then('user will see Time range changed to 30 minutes', () => {
  // TODO: implement step
});
