import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import {
  devNavigationMenu,
  pageTitle,
  helmActions,
} from '@console/dev-console/integration-tests/support/constants';
import { helmPO } from '@console/dev-console/integration-tests/support/pageObjects';
import {
  topologyPage,
  topologySidePane,
  app,
  navigateTo,
  createHelmChartFromAddPage,
} from '@console/dev-console/integration-tests/support/pages';
import { detailsPage } from '../../../../../integration-tests-cypress/views/details-page';
import { upgradeHelmRelease, helmDetailsPage, rollBackHelmRelease, helmPage } from '../../pages';

Given('helm release {string} is present in topology page', (workloadName: string) => {
  createHelmChartFromAddPage(workloadName);
});

Given('user has installed helm release {string}', (helmReleaseName: string) => {
  createHelmChartFromAddPage(helmReleaseName);
});

When(
  'user right clicks on the helm release {string} to open the context menu',
  (helmReleaseName: string) => {
    topologyPage.rightClickOnGroup(helmReleaseName);
  },
);

Then(
  'user is able to see the context menu with actions Upgrade, Rollback and Uninstall Helm Release',
  () => {
    cy.get('ul[role="menu"]').should('be.visible');
    cy.get(helmPO.helmActions.upgrade).should('be.visible');
    cy.get(helmPO.helmActions.rollBack).should('be.visible');
    cy.get(helmPO.helmActions.deleteHelmRelease).should('be.visible');
  },
);

Then('user is able to see the context menu with actions Upgrade and Delete Helm Release', () => {
  cy.get('ul[role="menu"]').should('be.visible');
  cy.byTestActionID('Upgrade').should('be.visible');
  cy.byTestActionID('Delete Helm Release').should('be.visible');
});

Given('user is on the topology sidebar of the helm release {string}', (helmReleaseName: string) => {
  topologyPage.clickOnGroup(helmReleaseName);
  topologySidePane.verify();
});

When('user clicks on the Actions drop down menu', () => {
  topologySidePane.clickActionsDropDown();
});

Then(
  'user is able to see the actions dropdown menu with actions Upgrade, Rollback and Uninstall Helm Release',
  () => {
    topologySidePane.verifyActions(
      helmActions.upgrade,
      helmActions.rollback,
      helmActions.deleteHelmRelease,
    );
  },
);

Then(
  'user is able to see the actions dropdown menu with actions Upgrade and Uninstall Helm Release',
  () => {
    const actions = ['Upgrade', 'Uninstall Helm Release'];
    cy.byLegacyTestID('action-items')
      .children()
      .each(($ele) => {
        expect(actions).toContain($ele.text());
      });
  },
);

Given('user is on the Helm page with helm release {string}', (helmRelease: string) => {
  navigateTo(devNavigationMenu.Helm);
  helmPage.search(helmRelease);
});

Then('user will be redirected to Helm Releases page', () => {
  detailsPage.titleShouldContain(pageTitle.Helm);
});

When('user clicks on the Kebab menu', () => {
  helmPage.selectKebabMenu();
});

Then(
  'user is able to see kebab menu with actions Upgrade, Rollback and Delete Helm Release',
  () => {
    topologySidePane.verifyActions(
      helmActions.upgrade,
      helmActions.rollback,
      helmActions.deleteHelmRelease,
    );
  },
);

When('user clicks on the {string} action', (actionName: string) => {
  helmPage.selectHelmActionFromMenu(actionName);
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

When('user enters the release name {string}', (releaseName: string) => {
  helmDetailsPage.enterReleaseNameInUninstallPopup(releaseName);
});

When('user clicks on the Delete button', () => {
  helmDetailsPage.uninstallHelmRelease();
});

Then('user will be redirected to Topology page', () => {
  cy.reload();
  app.waitForDocumentLoad();
  topologyPage.verifyTopologyPage();
});
When('user clicks on the helm release {string}', (helmReleaseName: string) => {
  topologyPage.clickOnGroup(helmReleaseName);
});

Then('user will see the sidebar for the helm release', () => {
  topologySidePane.verify();
});

Then('user will see the Details, Resources, Release notes tabs', () => {
  topologyPage.verifyHelmReleaseSidePaneTabs();
});

Given('user is on the topology sidebar of the helm release {string}', (helmReleaseName: string) => {
  topologyPage.clickOnGroup(helmReleaseName);
  topologySidePane.verify();
});

Then('user will see the {string} action item', (actionItem: string) => {
  cy.byTestActionID(actionItem).should('be.visible');
});

Then('user is redirected to the {string} Details page for the helm release', (resource: string) => {
  cy.get(`[data-test-section-heading="${resource} details"] span`).should(
    'contain.text',
    `${resource} details`,
  );
});
