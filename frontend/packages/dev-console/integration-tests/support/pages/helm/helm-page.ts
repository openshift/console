import { helmPO } from '../../pageObjects/helm-po';
import { messages } from '../../constants/staticText/helm-text';

export const helmPageObj = {
  upgradeHelmRelease: {
    chartVersion: '#form-dropdown-chartVersion-field',
    upgrade: '[data-test-id="submit-button"]',
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
    cy.get(helmPO.table).should('be.visible');
  },
  verifyHelmReleasesDisplayed: () => cy.get(helmPO.table).should('be.visible'),
  clickHelmReleaseName: (name: string) => cy.get(`a[title="${name}"]`).click(),
  selectHelmFilter: (filterName: string) => {
    cy.get(helmPO.filterDropdown).click();
    switch (filterName) {
      case 'Deployed': {
        cy.get('#deployed').click();
        break;
      }
      case 'Failed': {
        cy.get('#failed').click();
        break;
      }
      case 'Other': {
        cy.get('#other').click();
        break;
      }
      default: {
        throw new Error(`${filterName} filter is not available in filter drop down`);
      }
    }
    cy.byButtonText('Clear all filters').should('be.visible');
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

export const upgradeHelmRelease = {
  verifyTitle: () =>
    cy
      .get('h1')
      .contains('Upgrade Helm Release')
      .should('be.visible'),
  upgradeChartVersion: (yamlView: boolean = false) => {
    cy.get(helmPageObj.upgradeHelmRelease.chartVersion).click();
    cy.byLegacyTestID('dropdown-menu').then((listing) => {
      const count = Cypress.$(listing).length;
      const randNum = Math.floor(Math.random() * count);
      cy.byLegacyTestID('dropdown-menu')
        .eq(randNum)
        .click();
    });
    if (yamlView === true) {
      cy.alertTitleShouldContain('Change Chart Version?');
      cy.byTestID('confirm-action').click();
    }
  },
  clickOnUpgrade: () => {
    cy.get(helmPageObj.upgradeHelmRelease.upgrade).click();
    cy.get('.co-m-loader', { timeout: 40000 }).should('not.exist');
  },
};

export const helmDetailsPage = {
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
