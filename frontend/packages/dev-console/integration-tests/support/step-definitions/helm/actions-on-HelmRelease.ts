import { When, Then } from 'cypress-cucumber-preprocessor/steps';
import { upgradeHelmRelease, helmDetailsPage, rollBackHelmRelease, helmPage } from '../../pages/helm_page';
import { topologyPage } from '../../pages/topology_page';

When('user right clicks on the Helm Release {string} to open the context menu', (nodeName: string) => {
  // cy.byNodeName(nodeName).trigger('contextmenu');
  cy.pause();
  cy.get('g.odc-base-node__label').should('be.visible').contains(nodeName).trigger('contextmenu');
});

When('user clicks on the {string} action', (actionName: string) => {
  cy.byTestActionID(actionName).click();
});

When('user upgrades the chart Version', () => {
  upgradeHelmRelease.upgradeChartVersion();
});

When('user clicks on the upgrade button', () => {
  upgradeHelmRelease.clickOnUpgrade();
});

Then('the helm release should get upgradaed', () => {
  helmDetailsPage.verifyTitle();
  helmDetailsPage.verifyFieldValue('Chart Version', '0.1.1');
});

Then('user gets redirected to topology page', () => {
  topologyPage.verifyTopologyPage();
});

When('user selects the version to Rollback', () => {
  rollBackHelmRelease.selectRevision();
});

When('user clicks on the rollback button', () => {
  rollBackHelmRelease.clickOnRollBack();
});

Then('the helm release rollbacks to the version', () => {
  helmDetailsPage.verifyFieldValue('Revision', '2');
});

When('user enters the release name', () => {
  helmDetailsPage.enterReleaseNameInUninstallPopup();
});

When('user clicks on the Uninstall button', () => {
  helmDetailsPage.uninstallHelmRelease();
});

Then('Helm release gets uninstalled', () => {
  helmPage.verifyMessage();
});
