import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { detachTerminalPage } from '@console/webterminal-plugin/integration-tests/support/step-definitions/pages/web-terminal/detachTerminal-page';
import { webTerminalPage } from '@console/webterminal-plugin/integration-tests/support/step-definitions/pages/web-terminal/webTerminal-page';

Given('user is on the pod details terminal tab for a running pod', () => {
  const ns = Cypress.expose('NAMESPACE') || 'aut-terminal-detach';
  cy.exec(`oc get pods -n ${ns} -o jsonpath='{.items[0].metadata.name}'`).then((result) => {
    const podName = result.stdout.replace(/'/g, '');
    cy.visit(`/k8s/ns/${ns}/pods/${podName}/terminal`);
    cy.get('.co-terminal', { timeout: 30000 }).should('be.visible');
  });
});

When('user clicks the Detach to Cloud Shell button', () => {
  detachTerminalPage.clickDetachButton();
});

Then('user will see the Cloud Shell drawer open', () => {
  detachTerminalPage.verifyDrawerOpen();
});

Then('user will see a detached session tab with the pod name', () => {
  detachTerminalPage.verifyDetachedTabs(1);
});

Given('user has a detached terminal session in the Cloud Shell drawer', () => {
  const ns = Cypress.expose('NAMESPACE') || 'aut-terminal-detach';
  cy.exec(`oc get pods -n ${ns} -o jsonpath='{.items[0].metadata.name}'`).then((result) => {
    const podName = result.stdout.replace(/'/g, '');
    cy.visit(`/k8s/ns/${ns}/pods/${podName}/terminal`);
    cy.get('.co-terminal', { timeout: 30000 }).should('be.visible');
    detachTerminalPage.clickDetachButton();
    detachTerminalPage.verifyDetachedTabs(1);
  });
});

When('user navigates to a different page', () => {
  cy.visit('/k8s/cluster/projects');
  cy.url().should('include', '/projects');
});

Then('user will still see the detached session tab in the Cloud Shell drawer', () => {
  detachTerminalPage.verifyDetachedTabs(1);
});

When('user clicks the close button on the detached session tab', () => {
  detachTerminalPage.closeDetachedTab(0);
});

Then('the detached session tab is removed from the drawer', () => {
  detachTerminalPage.verifyNoDetachedTabs();
});

Given('user has five detached terminal sessions in the Cloud Shell drawer', () => {
  const ns = Cypress.expose('NAMESPACE') || 'aut-terminal-detach';
  cy.exec(`oc get pods -n ${ns} -o jsonpath='{.items[*].metadata.name}'`).then((result) => {
    const pods = result.stdout.replace(/'/g, '').split(' ');
    const targetPod = pods[0];
    for (let i = 0; i < 5; i++) {
      cy.visit(`/k8s/ns/${ns}/pods/${targetPod}/terminal`);
      cy.get('.co-terminal', { timeout: 30000 }).should('be.visible');
      detachTerminalPage.clickDetachButton();
    }
    detachTerminalPage.verifyDetachedTabs(5);
  });
});

Then('the Detach to Cloud Shell button is disabled on the pod terminal', () => {
  detachTerminalPage.verifyDetachButtonDisabled();
});

When('user closes the Cloud Shell drawer', () => {
  webTerminalPage.closeCurrentTerminalSession();
});

Then('user will not see any detached session tabs', () => {
  detachTerminalPage.verifyNoDetachedTabs();
});
