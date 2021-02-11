import { helmPO } from '../../pageObjects/helm-po';
import { messages } from '../../constants/staticText/helm-text';

export const helmPageObj = {
  noHelmReleasesMessage: 'h3',
  search: '[data-test-id="item-filter"]',
  table: '[role="grid"]',
  helmReleaseName: 'tr td:nth-child(1)',
  resourcesTab: '[data-test-id="horizontal-link-Resources"]',
  revisionHistoryTab: '[data-test-id="horizontal-link-Revision history"]',
  releaseNotesTab: '[data-test-id="horizontal-link-Release Notes"]',
  filterDropdown: 'button[data-test-id="filter-dropdown-toggle"]',
  details: {
    title: '[data-test-section-heading="Helm Release details"]',
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
  verifyHelmChartsListed: () => {
    cy.get('.loading-box.loading-box__loaded')
      .get(`[role=grid]`)
      .get('table')
      .its('length')
      .should('be.greaterThan', 0);
  },
  verifySearchMessage: (message: string) =>
    cy.get(helmPO.noHelmSearchMessage).should('contain.text', message),
  verifyMessage: () =>
    cy.get(helmPO.noHelmReleasesMessage).should('contain.text', messages.noHelmReleasesFound),
  verifyInstallHelmLink: () =>
    cy
      .get('a')
      .contains('Install a Helm Chart from the developer catalog')
      .should('be.visible'),
  search: (name: string) => {
    cy.get(helmPO.search)
      .clear()
      .type(name);
  },
  verifyHelmReleasesDisplayed: () => cy.get(helmPO.table).should('be.visible'),
  clickHelmReleaseName: (name: string) => cy.get(`a[title="${name}"]`).click(),
  selectHelmFilterDropDown: () => {
    cy.get(helmPO.filterToolBar).then((body) => {
      if (body.find(helmPO.filterDropdownDialog).length <= 0) {
        cy.get(helmPO.filterDropdown).click();
      }
    });
  },

  getItemFromReleaseTable: (header: string) => {
    cy.get(helmPO.table)
      .find(`[data-index="0"]`)
      .should('be.visible')
      .find(`[role=gridcell]`)
      .should('contain.text', header);
  },
  verifyHelmFilterUnSelected: (filterName: string) => {
    helmPage.selectHelmFilterDropDown();
    switch (filterName) {
      case 'Deployed': {
        cy.get('#deployed-checkbox')
          .uncheck()
          .should('not.be.checked');
        break;
      }
      case 'Failed': {
        cy.get('#failed-checkbox')
          .uncheck()
          .should('not.be.checked');
        break;
      }
      case 'Other': {
        cy.get('#other-checkbox')
          .uncheck()
          .should('not.be.checked');
        break;
      }
      case 'all': {
        cy.get('#deployed-checkbox')
          .uncheck()
          .should('not.be.checked');
        cy.get('#failed-checkbox')
          .uncheck()
          .should('not.be.checked');
        cy.get('#other-checkbox')
          .uncheck()
          .should('not.be.checked');
        break;
      }
      default: {
        throw new Error(`${filterName} filter is not available in filter drop down`);
      }
    }
  },
  verifyHelmFilterSelected: (filterName: string) => {
    helmPage.selectHelmFilterDropDown();
    switch (filterName) {
      case 'Deployed': {
        cy.get('#deployed-checkbox').should('be.checked');
        break;
      }
      case 'Failed': {
        cy.get('#failed-checkbox').should('be.checked');
        break;
      }
      case 'Other': {
        cy.get('#other-checkbox').should('be.checked');
        break;
      }
      case 'all': {
        cy.get('#deployed-checkbox').should('be.checked');
        cy.get('#failed-checkbox').should('be.checked');
        cy.get('#other-checkbox').should('be.checked');
        break;
      }
      default: {
        throw new Error(`${filterName} filter is not available in filter drop down`);
      }
    }
    helmPage.clearAllFilter();
  },
  clearAllFilter: () => {
    cy.get(helmPO.filterToolBar).then((body) => {
      if (body.find(helmPO.clearAllFilter).length >= 0) {
        cy.get(helmPO.clearAllFilter)
          .eq(1)
          .click();
      }
    });
  },
  selectHelmFilter: (filterName: string) => {
    switch (filterName) {
      case 'Deployed': {
        helmPage.selectFilterCheckbox(helmPO.deployedCheckbox, '#deployed');
        break;
      }
      case 'Failed': {
        helmPage.selectFilterCheckbox(helmPO.failedCheckbox, '#failed');
        break;
      }
      case 'Other': {
        helmPage.selectFilterCheckbox(helmPO.otherCheckbox, '#other');
        break;
      }
      case 'all': {
        helmPage.selectAllHelmFilter();
        break;
      }
      default: {
        throw new Error(`${filterName} filter is not available in filter drop down`);
      }
    }
  },
  selectFilterCheckbox: (checkbox: string, option: string) => {
    helmPage.selectHelmFilterDropDown();
    cy.get(checkbox).then((body) => {
      if (body.find('checked').length <= 0) {
        cy.get(option).click();
      }
    });
  },
  selectAllHelmFilter: () => {
    helmPage.selectFilterCheckbox(helmPO.deployedCheckbox, '#deployed');
    helmPage.selectFilterCheckbox(helmPO.failedCheckbox, '#failed');
    helmPage.selectFilterCheckbox(helmPO.otherCheckbox, '#other');
  },

  verifyStatusInHelmReleasesTable: (helmReleaseName: string = 'Nodejs Ex K v0.2.1') => {
    cy.get(helmPO.table).should('exist');
    cy.get('tr td:nth-child(1)').each(($el, index) => {
      const text = $el.text();
      if (text.includes(helmReleaseName)) {
        cy.get('tbody tr')
          .eq(index)
          .find('td:nth-child(4) button')
          .click();
      }
    });
  },
  selectKebabMenu: () => {
    cy.get(helmPO.table).should('exist');
    cy.byLegacyTestID('kebab-button').click();
  },
};

export const helmDetailsPage = {
  verifyTitle: () =>
    cy.get(helmPageObj.details.title).should('contain.text', 'Helm Release details'),
  verifyResourcesTab: () => cy.get(helmPageObj.resourcesTab).should('be.visible'),
  verifyReleaseNotesTab: () =>
    cy.byLegacyTestID('horizontal-link-Release notes').should('be.visible'),
  verifyActionsDropdown: () => cy.byLegacyTestID('actions-menu-button').should('be.visible'),
  verifyRevisionHistoryTab: () => cy.get(helmPageObj.revisionHistoryTab).should('be.visible'),
  clickActionMenu: () => cy.byLegacyTestID('actions-menu-button').click(),
  verifyActionsInActionMenu: () => {
    cy.byLegacyTestID('action-items')
      .find('li')
      .each(($el) => {
        expect(['Upgrade', 'Rollback', 'Uninstall Helm Release']).toContain($el.text());
      });
  },
  verifyFieldValue: (fieldName: string, fieldValue: string) => {
    cy.get('dl.co-m-pane__details dt')
      .contains(fieldName)
      .next('dd')
      .should('contain.text', fieldValue);
  },
  uninstallHelmRelease: () => {
    cy.alertTitleShouldContain('Uninstall Helm Release?');
    cy.byTestID('confirm-action')
      .should('be.enabled')
      .click();
  },
  enterReleaseNameInUninstallPopup: (releaseName: string = 'nodejs-ex-k') => {
    cy.alertTitleShouldContain('Uninstall Helm Release?');
    cy.get('form strong').should('have.text', releaseName);
    cy.get(helmPageObj.uninstallHelmRelease.releaseName).type(releaseName);
  },
};

export const rollBackHelmRelease = {
  selectRevision: () => cy.get(helmPageObj.rollBackHelmRelease.revision1).check(),
  clickOnRollBack: () => cy.get(helmPageObj.rollBackHelmRelease.rollBack).click(),
};
