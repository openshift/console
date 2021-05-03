import { ProvisionSource } from '../enums/provisionSource';

export const wizard = {
  template: {
    open: () => {
      cy.byLegacyTestID('details-actions').click();
      cy.byLegacyTestID('template-wizard').click();
    },
    createTemplate: (
      name: string,
      provider: string,
      supported: boolean,
      baseOS = 'Red Hat Enterprise Linux 7.0 or higher',
    ) => {
      cy.get('#vm-name').type(name);
      cy.get('#template-provider').type(provider);
      if (supported) {
        cy.get('#template-supported').click();
        cy.get('button')
          .contains('Support by template provider')
          .click();
      }
      cy.get('#operating-system-dropdown').click();
      cy.get('button')
        .contains(baseOS)
        .click({ force: true });
      cy.get('#image-source-type-dropdown').click();
      cy.get('.pf-c-select__menu')
        .contains(ProvisionSource.REGISTRY.getDescription())
        .click();
      cy.get('input[id="provision-source-container"]').type(ProvisionSource.REGISTRY.getSource());
      cy.get('#create-vm-wizard-reviewandcreate-btn').click();
      cy.get('#create-vm-wizard-submit-btn').click();
      cy.byTestID('success-list').click();
    },
  },
};
