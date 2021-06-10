import { ProvisionSource } from '../enums/provisionSource';

export const wizard = {
  vm: {
    open: () => {
      cy.byLegacyTestID('item-create').click();
      cy.byLegacyTestID('vm-wizard').click();
    },
    processSelectTemplate: (name: string) => {
      cy.get('.catalog-tile-pf-title')
        .contains(name)
        .should('exist')
        .click();
      cy.byLegacyTestID('wizard-next').click();
      cy.get('body').then(($body) => {
        if ($body.find('[data-test-id="modal-title"]').length) {
          cy.get('[data-test="confirm-action"]').click();
        }
      });
    },
    processBootSource: (
      source: ProvisionSource,
      cdrom: boolean,
      size: string,
      pvcName: string,
      pvcNS: string,
    ) => {
      cy.get('#image-source-type-dropdown').click();
      cy.get('.pf-c-select__menu')
        .contains(source.getDescription())
        .click();
      switch (source) {
        case ProvisionSource.URL: {
          cy.get('input[id="provision-source-url"]').type(source.getSource());
          cy.get('#request-size-input')
            .clear()
            .type(size);
          break;
        }
        case ProvisionSource.CLONE_PVC: {
          cy.get('button[id="pvc-ns-dropdown"]').click();
          cy.get(`a[id="${pvcNS}-Project-link"]`).click();
          cy.get('button[id="pvc-name-dropdown"]').click();
          cy.get(`a[id="${pvcName}-PersistentVolumeClaim-link"]`).click();
          break;
        }
        case ProvisionSource.REGISTRY: {
          cy.get('input[id="provision-source-container"]').type(source.getSource());
          cy.get('#request-size-input')
            .clear()
            .type(size);
          break;
        }
        default: {
          break;
        }
      }
      if (cdrom) {
        cy.get('#cdrom').click();
      }
      if (Cypress.env('STORAGE_CLASS')) {
        cy.byTestID('advanced-section').within(() =>
          cy
            .get('button')
            .contains('Advanced')
            .click(),
        );
        cy.get('#form-ds-sc-select').click();
        cy.get('.pf-c-select__menu')
          .contains(Cypress.env('STORAGE_CLASS'))
          .click();
      }
      cy.byLegacyTestID('wizard-next').click();
    },
    processReview: (
      namespace: string,
      name: string,
      flavor: string,
      ssh: boolean,
      start: boolean,
    ) => {
      cy.get('#project-dropdown').click();
      cy.get(`a[id="${namespace}-Project-link"]`).click();
      cy.get('#vm-name')
        .clear()
        .type(name);
      if (flavor !== undefined) {
        cy.get('#vm-flavor-select').click();
        cy.get('button')
          .contains(flavor)
          .click();
      }
      if (!ssh) {
        cy.get('input[id="ssh-service-checkbox"]').click();
      }
      if (!start) {
        cy.get('input[id="start-vm"]').click();
      }
      cy.byLegacyTestID('wizard-next').click();
      cy.byTestID('success-list').click();
    },
  },
  template: {
    open: () => {
      cy.byLegacyTestID('item-create').click();
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
