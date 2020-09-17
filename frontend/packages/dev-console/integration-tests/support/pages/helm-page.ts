import { naviagteTo } from './app';
import { devNavigationMenu } from '../constants/global';
import { catalogPage } from './add-flow/catalog-page';
import { addPage } from './add-flow/add-page';
import { addOptions } from '../constants/add';

export const helmPageObj = {
  noHelmReleasesMessage: 'p.odc-helm-release__empty-list__title',
  search: '[data-test-id="item-filter"]',
  table: '[role="grid"]',
  resourcesTab: '[data-test-id="horizontal-link-Resources"]',
  revisionHistoryTab: '[data-test-id="horizontal-link-Revision History"]',
  releaseNotesTab: '[data-test-id="horizontal-link-Release Notes"]',
  details: {
    title: '[data-test-section-heading="Helm Release Details"]',
  },
  upgradeHelmRelease: {
    replicaCount: '#root_replicaCount',
    chartVersion: '#form-dropdown-chartVersion-field',
    upgrade: '[data-test-id="submit-button"]',
    cancel: '[data-test-id="reset-button"]',
  },
  rollBackHelmRelease: {
    revision1: '#form-radiobutton-revision-1-field',
    rollBack: '[data-test-id="submit-button"]',
    cancel: '[data-test-id="reset-button"]',
  },
  uninstallHelmRelease: {
    releaseName: '#form-input-resourceName-field',
  },
};

export const helmPage = {
  verifyMessage: () =>
    cy.get(helmPageObj.noHelmReleasesMessage).should('contain.text', 'No Helm Releases found'),
  verifyInstallHelmLink: () =>
    cy
      .get('a')
      .contains('Install a Helm Chart from the developer catalog')
      .should('be.visible'),
  search: (name: string) => {
    cy.get(helmPageObj.search).type(name);
    cy.get(helmPageObj.table).should('be.visible');
  },
  verifyHelmReleasesDisplayed: () => cy.get(helmPageObj.table).should('be.visible'),
  clickHelmReleaseName: (name: string) => cy.get(`a[title="${name}"]`).click(),
  createHelmRelease: (helmCardName: string) => {
    naviagteTo(devNavigationMenu.Add);
    addPage.selectCardFromOptions(addOptions.HelmChart);
    catalogPage.search(helmCardName);
    catalogPage.clickInstallHelmChartOnSidePane();
    catalogPage.clickOnInstallButton();
  },
};

export const helmDetailsPage = {
  verifyTitle: () =>
    cy.get(helmPageObj.details.title).should('contain.text', 'Helm Release Details'),
  verifyResourcesTab: () => cy.get(helmPageObj.resourcesTab).should('be.visible'),
  verifyReleaseNotesTab: () =>
    cy.byLegacyTestID('horizontal-link-Release Notes').should('be.visible'),
  verifyActionsDropdown: () => cy.byLegacyTestID('actions-menu-button').should('be.visible'),
  verifyRevisionHistoryTab: () => cy.get(helmPageObj.revisionHistoryTab).should('be.visible'),
  clickActionMenu: () => cy.byLegacyTestID('actions-menu-button').click(),
  verifyActionsInActionMenu: () => {
    cy.get('[data-test-id="action-items"] li').each(($el) => {
      expect($el.text()).toEqual('Upgrade');
      expect($el.text()).toEqual('Rollback');
      expect($el.text()).toEqual('Uninstall Helm Release');
    });
  },
  verifyFieldValue: (fieldName: string, fieldValue: string) => {
    cy.get('dl.co-m-pane__details dt')
      .contains(fieldName)
      .next('dd')
      .should('contain.text', fieldValue);
  },
  uninstallHelmRelease: () => {
    cy.byLegacyTestID('modal-title').should('contain.text', 'Uninstall Helm Release?');
    cy.get('#confirm-action').click();
  },
  enterReleaseNameInUninstallPopup: (releaseName: string = 'nodejs-ex-k') => {
    cy.byLegacyTestID('modal-title').should('contain.text', 'Uninstall Helm Release?');
    cy.get(helmPageObj.uninstallHelmRelease.releaseName).type(releaseName);
  },
};

export const upgradeHelmRelease = {
  verifyTitle: () =>
    cy
      .get('h1')
      .contains('Upgrade Helm Release')
      .should('be.visible'),
  updateReplicaCount: () =>
    cy
      .get(helmPageObj.upgradeHelmRelease.replicaCount)
      .clear()
      .type('2'),
  upgradeChartVersion: () => {
    cy.get(helmPageObj.upgradeHelmRelease.chartVersion).click();
    cy.byTestDropDownMenu('0.1.1').click();
    // Currently modal is not displaying while upgrading chart version
    // cy.byLegacyTestID('modal-title').should('contain.text', 'Change Chart Version?');
    // cy.get('#confirm-action').click();
  },
  clickOnUpgrade: () => {
    cy.get(helmPageObj.upgradeHelmRelease.upgrade).click();
  },
};

export const rollBackHelmRelease = {
  selectRevision: () => cy.get(helmPageObj.rollBackHelmRelease.revision1).check(),
  clickOnRollBack: () => cy.get(helmPageObj.rollBackHelmRelease.rollBack).click(),
};
