export const pvc = {
  form: {
    open: () => {
      cy.clickNavLink(['Storage', 'PersistentVolumeClaims']);
      cy.byTestID('item-create').click();
      cy.byLegacyTestID('dropdown-menu')
        .contains('With Data upload form')
        .click();
    },
    fillImageName: (name: string) => {
      cy.get('#file-upload-filename')
        .type(name, { force: true })
        .should('have.value', name);
    },
    selectOS: (name: string) => {
      cy.get('#golden-os-switch').click();
      cy.get('#golden-os-select').select(name);
    },
    fillPVCName: (name: string) => {
      cy.get('#pvc-name')
        .clear()
        .type(name);
    },
    fillPVCSize: (size: string) => {
      cy.get('#request-size-input')
        .clear()
        .type(size);
    },
    selectSC: (name: string) => {
      cy.get('#upload-form-ds-sc-select').click();
      cy.get('.pf-c-select__menu-item')
        .contains(name)
        .click();
    },
    create: () => {
      cy.get('#save-changes').click();
    },
  },
};
