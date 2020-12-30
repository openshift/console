import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { catalogPage } from '../../pages/add-flow/catalog-page';
import { topologyPage } from '../../pages/topology/topology-page';
import { navigateTo } from '../../pages/app';
import { devNavigationMenu } from '../../constants/global';
import {
  upgradeHelmRelease,
  helmDetailsPage,
  rollBackHelmRelease,
  helmPage,
} from '../../pages/helm/helm-page';
import { topologySidePane } from '../../pages/topology/topology-side-pane-page';

Given('helm release {string} is present in topology page', (workloadName: string) => {
  catalogPage.createHelmChartFromAddPage(workloadName);
});

When(
  'user right clicks on the helm release {string} to open the context menu',
  (helmReleaseName: string) => {
    topologyPage.rightClickOnNode(helmReleaseName);
  },
);

Then(
  'user is able to see the context menu with actions Upgrade, Rollback and Uninstall Helm Release',
  () => {
    cy.get('ul[role="menu"]').should('be.visible');
    cy.byTestActionID('Upgrade').should('be.visible');
    cy.byTestActionID('Rollback').should('be.visible');
    cy.byTestActionID('Uninstall Helm Release').should('be.visible');
  },
);

Given('user is on the topology sidebar of the helm release {string}', (helmReleaseName: string) => {
  topologyPage.clickOnNode(helmReleaseName);
  topologySidePane.verify();
});

When('user clicks on the Actions drop down menu', () => {
  cy.byLegacyTestID('actions-menu-button').click();
});

Then(
  'user is able to see the actions dropdown menu with actions Upgrade, Rollback and Uninstall Helm Release',
  () => {
    cy.byTestActionID('Upgrade').should('be.visible');
    cy.byTestActionID('Rollback').should('be.visible');
    cy.byTestActionID('Uninstall Helm Release').should('be.visible');
  },
);

Given('user is on the Helm page with helm release {string}', (helmRelease: string) => {
  navigateTo(devNavigationMenu.Helm);
  helmPage.search(helmRelease);
});

When('user clicks on the Kebab menu', () => {
  helmPage.selectKebabMenu();
});

Then(
  'user is able to see kebab menu with actions Upgrade, Rollback and Uninstall Helm Release',
  () => {
    cy.byTestActionID('Upgrade').should('be.visible');
    cy.byTestActionID('Rollback').should('be.visible');
    cy.byTestActionID('Uninstall Helm Release').should('be.visible');
  },
);

When('user clicks on the {string} action', (actionName: string) => {
  cy.byTestActionID(actionName).click();
});

When('user upgrades the chart Version', () => {
  upgradeHelmRelease.upgradeChartVersion();
});

When('user clicks on the upgrade button', () => {
  upgradeHelmRelease.clickOnUpgrade();
});

Then('user will be redirected to Topology page with no workloads', () => {
  topologyPage.verifyTitle();
  topologyPage.verifyNoWorkLoadsText('No resources found');
});

When('user selects the version to Rollback', () => {
  rollBackHelmRelease.selectRevision();
});

When('user clicks on the rollback button', () => {
  rollBackHelmRelease.clickOnRollBack();
});

When('user enters the release name', () => {
  helmDetailsPage.enterReleaseNameInUninstallPopup();
});

When('user clicks on the Uninstall button', () => {
  helmDetailsPage.uninstallHelmRelease();
});

Then('user will be redirected to Topology page with no workloads', () => {
  topologyPage.verifyTitle();
  topologyPage.verifyNoWorkLoadsText('No resources found');
});

When('user clicks on the helm release {string}', (helmReleaseName: string) => {
  topologyPage.clickOnNode(helmReleaseName);
});

Then('user will see the sidebar for the helm release', () => {
  topologySidePane.verify();
});

Then('user will see the Details, Resources, Release notes tabs', () => {
  topologyPage.verifyHelmReleaseSidePaneTabs();
});

Given('user is on the topology sidebar of the helm release {string}', (helmReleaseName: string) => {
  cy.get('g.odc-base-node__label')
    .should('be.visible')
    .contains(helmReleaseName)
    .click({ force: true });
  topologySidePane.verify();
});

Then('user will see the {string} action item', (actionItem: string) => {
  cy.byTestActionID(actionItem).should('be.visible');
});

Then('user is redirected to the {string} Details page for the helm release', (resource: string) => {
  cy.get(`[data-test-section-heading="${resource} details"]`).should(
    'contain.text',
    `${resource} details`,
  );
});
