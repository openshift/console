import { messages } from '@console/dev-console/integration-tests/support/constants';
import { helmPO } from '@console/dev-console/integration-tests/support/pageObjects';

export const helmPage = {
  verifyMessage: () =>
    cy.get(helmPO.noHelmReleasesMessage).should('contain.text', messages.helm.noHelmReleasesFound),
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
  selectAllHelmFilter: () => {
    cy.get(helmPO.deployedCheckbox).check();
    cy.get(helmPO.failedCheckbox).check();
    cy.get(helmPO.otherCheckbox).check();
  },
  selectHelmFilter: (filterName: string) => {
    switch (filterName) {
      case 'Deployed': {
        cy.get(helmPO.deployedCheckbox).check();
        break;
      }
      case 'Failed': {
        cy.get(helmPO.failedCheckbox).check();
        break;
      }
      case 'Other': {
        cy.get(helmPO.otherCheckbox).check();
        break;
      }
      case 'All': {
        helmPage.selectAllHelmFilter();
        break;
      }
      default: {
        throw new Error(`${filterName} filter is not available in filter drop down`);
      }
    }
    helmPage.selectHelmFilterDropDown();
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
  verifyHelmChartsListed: () => {
    cy.get(helmPO.noHelmSearchMessage)
      .get(helmPO.table)
      .get('table')
      .its('length')
      .should('be.greaterThan', 0);
  },
  verifySearchMessage: (message: string) =>
    cy.get(helmPO.noHelmSearchMessage).should('contain.text', message),
  selectHelmFilterDropDown: () => {
    // eslint-disable-next-line promise/catch-or-return
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
        cy.get(helmPO.deployedCheckbox)
          .uncheck()
          .should('not.be.checked');
        break;
      }
      case 'Failed': {
        cy.get(helmPO.failedCheckbox)
          .uncheck()
          .should('not.be.checked');
        break;
      }
      case 'Other': {
        cy.get(helmPO.failedCheckbox)
          .uncheck()
          .should('not.be.checked');
        break;
      }
      case 'All': {
        cy.get(helmPO.deployedCheckbox)
          .uncheck()
          .should('not.be.checked');
        cy.get(helmPO.failedCheckbox)
          .uncheck()
          .should('not.be.checked');
        cy.get(helmPO.otherCheckbox)
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
        cy.get(helmPO.deployedCheckbox).should('be.checked');
        break;
      }
      case 'Failed': {
        cy.get(helmPO.failedCheckbox).should('be.checked');
        break;
      }
      case 'Other': {
        cy.get(helmPO.otherCheckbox).should('be.checked');
        break;
      }
      case 'All': {
        cy.get(helmPO.deployedCheckbox).should('be.checked');
        cy.get(helmPO.failedCheckbox).should('be.checked');
        cy.get(helmPO.otherCheckbox).should('be.checked');
        break;
      }
      default: {
        throw new Error(`${filterName} filter is not available in filter drop down`);
      }
    }
    helmPage.selectHelmFilterDropDown();
  },
  clearAllFilter: () => {
    // eslint-disable-next-line promise/catch-or-return
    cy.get(helmPO.filterToolBar).then((body) => {
      if (body.find(helmPO.clearAllFilter).length >= 0) {
        cy.get(helmPO.clearAllFilter)
          .eq(1)
          .click();
      }
    });
  },
};
