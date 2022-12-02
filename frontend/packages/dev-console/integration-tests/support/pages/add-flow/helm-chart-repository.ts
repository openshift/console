import { createForm } from '..';
import { devNavigationMenuPO } from '../../pageObjects';

export const filterByName = (name: string) => {
  cy.get('#toggle-id').click();
  cy.byTestID('name-filter').click();
  cy.byLegacyTestID('item-filter').type(name);
  cy.byLegacyTestID('kebab-button').click();
};

export const helmChartRepository = {
  deleteChartRepository: (name: string, type: string) => {
    cy.log(`Deleting ${type} ${name}`);
    cy.get(devNavigationMenuPO.search).click();
    cy.get('[aria-label="Options menu"]').click();
    cy.get('[placeholder="Select Resource"]')
      .should('be.visible')
      .type(type);
    if (type === 'projecthelmchartrepository') {
      cy.get('[data-filter-text="PHCRProjectHelmChartRepository"]').click();
      filterByName(name);
      cy.byTestActionID('Delete ProjectHelmChartRepository').click();
    } else {
      cy.get('[data-filter-text="HCRHelmChartRepository"]').click();
      filterByName(name);
      cy.byTestActionID('Delete HelmChartRepository').click();
    }
    createForm.clickConfirm();
    cy.byTestID('empty-message').should('be.visible');
  },
};
