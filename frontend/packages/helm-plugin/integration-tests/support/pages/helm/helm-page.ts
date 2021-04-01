import { helmPO } from '@console/dev-console/integration-tests/support/pageObjects';
import { messages } from '@console/dev-console/integration-tests/support/constants';

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
  selectFilterCheckbox: (checkbox: string, option: string) => {
    // eslint-disable-next-line promise/catch-or-return
    cy.get('body').then((body) => {
      if (body.find('checked').length) {
        cy.get(option).click();
      }
    });
  },
  selectAllHelmFilter: () => {
    helmPage.selectFilterCheckbox(helmPO.deployedCheckbox, '#deployed');
    helmPage.selectFilterCheckbox(helmPO.failedCheckbox, '#failed');
    helmPage.selectFilterCheckbox(helmPO.otherCheckbox, '#other');
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
      default: {
        throw new Error(`${filterName} filter is not available in filter drop down`);
      }
    }
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
