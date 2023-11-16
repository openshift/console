const option = '[role="option"]';

export const environment = {
  isLoaded: () => {
    cy.byTestID('pairs-list-name').should('exist');
    cy.byTestID('environment-save').should('be.enabled');
  },
  addVariable: (key: string, value: string) => {
    environment.isLoaded();
    cy.byTestID('pairs-list-name').clear();
    cy.byTestID('pairs-list-name').type(key);
    cy.byTestID('pairs-list-value').clear();
    cy.byTestID('pairs-list-value').type(value);
    cy.byTestID('environment-save').click();
  },
  addVariableFrom: (resourceName: string, resourcePrefix?: string, getExactResource?: boolean) => {
    environment.isLoaded();
    cy.get('.value-from button').click().byLegacyTestID('dropdown-text-filter').type(resourceName);
    if (getExactResource) {
      cy.get(option).find('.co-resource-item__resource-name').contains(resourceName).click();
    } else {
      cy.get(option).first().click();
    }
    if (resourcePrefix) {
      cy.byLegacyTestID('env-prefix').clear().type(resourcePrefix);
    }
    cy.byTestID('environment-save').click();
  },
  deleteVariable: () => {
    environment.isLoaded();
    cy.byTestID('delete-button').first().click();
    cy.byTestID('environment-save').click();
  },
  deleteFromVariable: () => {
    environment.isLoaded();
    cy.byLegacyTestID('pairs-list__delete-from-btn').click();
    cy.byTestID('environment-save').click();
  },
  validateKeyAndValue: (key: string, value: string, isPresent: boolean) => {
    if (isPresent) {
      cy.byTestID('pairs-list-name').should('have.value', key);
      cy.byTestID('pairs-list-value').should('have.value', value);
    } else {
      cy.byTestID('pairs-list-name').should('not.have.value', key);
      cy.byTestID('pairs-list-value').should('not.have.value', value);
    }
  },
  validateValueFrom: (valueFrom: string, prefix: string, isPresent: boolean) => {
    if (isPresent) {
      cy.get('.co-resource-item__resource-name').last().should('have.text', valueFrom);
      cy.byLegacyTestID('env-prefix').should('have.value', prefix);
    } else {
      cy.get('.co-resource-item__resource-name').last().should('have.text', 'container');
      cy.byLegacyTestID('env-prefix').should('have.value', '');
    }
  },
};
