import { helmPO } from '../../pageObjects/helm-po';
import { messages } from '../../constants/staticText/helm-text';

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
