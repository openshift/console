import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { topologyPage, topologySidePane } from '../../pages/topology_page';
import { catalogPage } from '../../pages/add_page';

Given('helm release {string} is present in topology page', (workloadName: string) => {
  cy.get('body div').then(($el) => {
    if($el.find('h2.co-hint-block__title h4').length === 0) {
      catalogPage.createHelmChartFromAddPage(workloadName);
    }
  });
  // topologyPage.searchHelmRelease(workloadName);
});

Given('user is on the sidebar for the helm release', () => {
  cy.get('[data-type="helm-release"] [data-kind="node"]').click();
  topologySidePane.verify();
});

When('user right clicks on the helm release', () => {
  cy.get('[data-type="helm-release"] [data-kind="node"]').trigger('contextmenu');
});

Then('user sees the context menu with actions', () => {
  cy.byTestActionID('Upgrade').should('be.visible');
  cy.byTestActionID('Rollback').should('be.visible');
  cy.byTestActionID('Uninstall Helm Release').should('be.visible');
});

When('user clicks on the helm release', () => {
  cy.get('[data-type="helm-release"] [data-kind="node"]').click();
});

Then('user sees the sidebar for the helm release', () => {
  topologySidePane.verify();
});

Then('user sees the Details, Resources, Release Notes tabs', () => {
  topologyPage.verifyHelmReleaseSidePaneTabs();
});

When('user clicks on the Actions drop down menu', () => {
  cy.byLegacyTestID('actions-menu-button').click();
});

Then('user sees the {string} action item', (actionItem: string) => {
  cy.byTestActionID(actionItem).should('be.visible');
});

When('user switches to the Resources tab', () => {
  // TODO: implement step
});

When('user clicks on the link for the deployment config of helm release', () => {
  // TODO: implement step
});

When('user clicks on the link for the build config of helm release', () => {
  // TODO: implement step
});

When('user clicks on the link for the services of helm release', () => {
  // TODO: implement step
});

When('user clicks on the link for the image stream of helm release', () => {
  // TODO: implement step
});

When('user clicks on the link for the routes of helm release', () => {
  // TODO: implement step
});

Then('user is redirected to Topology page', () => {
  // TODO: implement step
});

Then('user is redirected to the Deployment Config Details page for the helm release', () => {
  // TODO: implement step
});

Then('user is redirected to the Build Config Details page for the helm release', () => {
  // TODO: implement step
});

Then('user is redirected to the Service Details page for the helm release', () => {
  // TODO: implement step
});

Then('user is redirected to the Image Stream Details page for the helm release', () => {
  // TODO: implement step
});

Then('user is redirected to the Route Details page for the helm release', () => {
  // TODO: implement step
});
