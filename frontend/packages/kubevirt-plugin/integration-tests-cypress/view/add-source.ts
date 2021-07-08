import { TEST_PROVIDER } from '../const';
import { ProvisionSource } from '../enums/provisionSource';

export const provisionSourceInputs = {
  [ProvisionSource.URL.getValue()]: 'input[id="provision-source-url"]',
  [ProvisionSource.REGISTRY.getValue()]: 'input[id="provision-source-container"]',
};

type DiskSourceOpts = {
  pvcName: string;
  pvcNamespace: string;
};

export const addSource = {
  addBootSource: (provisionSource: ProvisionSource, opts?: DiskSourceOpts, provider?: string) => {
    cy.get('#image-source-type-dropdown').click();
    cy.get('.pf-c-select__menu')
      .contains(provisionSource.getDescription())
      .click();
    const sourceInput = provisionSourceInputs[provisionSource.getValue()];
    if (sourceInput) {
      cy.get(sourceInput).type(provisionSource.getSource());
    }
    if (provisionSource === ProvisionSource.CLONE_PVC) {
      const { pvcName, pvcNamespace } = opts as DiskSourceOpts;
      cy.get('button[id="pvc-ns-dropdown"]').click();
      cy.get(`a[id="${pvcNamespace}-Project-link"]`).click();
      cy.get('button[id="pvc-name-dropdown"]').click();
      cy.get(`a[id="${pvcName}-PersistentVolumeClaim-link"]`).click();
    }
    if (provisionSource === ProvisionSource.UPLOAD) {
      cy.dropFile(Cypress.env('UPLOAD_IMG'), 'cirros', '.pf-c-file-upload');
    }
    if (provisionSource !== ProvisionSource.CLONE_PVC) {
      cy.get('#request-size-input')
        .clear()
        .type('5');
    }
    cy.get('#form-ds-provider-input').type(provider || TEST_PROVIDER);
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
    cy.get('#confirm-action').should('not.be.disabled');
    cy.get('#confirm-action').click();
  },
};
