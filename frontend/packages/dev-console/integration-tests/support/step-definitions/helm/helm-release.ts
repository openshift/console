import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { catalogPage } from '../../pages/add-flow/catalog-page';
import { topologyPage, topologySidePane } from '../../pages/topology/topology-page';
import { navigateTo } from '../../pages/app';
import { devNavigationMenu } from '../../constants/global';
import {
  upgradeHelmRelease,
  helmDetailsPage,
  rollBackHelmRelease,
  helmPage,
} from '../../pages/helm/helm-page';

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

When('user selects the version to Rollback', () => {
  rollBackHelmRelease.selectRevision();
});

When('user clicks on the rollback button', () => {
  rollBackHelmRelease.clickOnRollBack();
  cy.get('.co-m-loader', { timeout: 40000 }).should('not.exist');
});

When('user enters the release name', () => {
  helmDetailsPage.enterReleaseNameInUninstallPopup();
});

When('user clicks on the Uninstall button', () => {
  helmDetailsPage.uninstallHelmRelease();
});

Then('user will be redirected to Topology page with no workloads', () => {
  cy.document()
    .its('readyState')
    .should('eq', 'complete');
  topologyPage.verifyTitle();
  topologyPage.verifyNoWorkLoadsText('No resources found');
});
