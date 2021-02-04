const getRow = (templateName: string, within: VoidFunction) =>
  cy
    .get(`[data-test-rows="resource-row"]`)
    .contains(templateName)
    .parents('tr')
    .within(within);

export const virtualization = {
  vms: {
    visit: () => cy.clickNavLink(['Workloads', 'Virtualization']),
    emptyState: {
      clickQuickStarts: () => cy.byTestID('vm-quickstart').click(),
      clickCreate: () => cy.byTestID('create-vm-empty').click(),
      clickTemplatesTab: () => cy.byTestID('vm-empty-templates').click(),
    },
  },
  templates: {
    visit: () => {
      cy.clickNavLink(['Workloads', 'Virtualization']);
      cy.byLegacyTestID('horizontal-link-Templates').click();
    },
    addSource: (templateName: string) =>
      getRow(templateName, () =>
        cy
          .byTestID('template-source')
          .find('button')
          .should('have.text', 'Add source')
          .click(),
      ),
    testSource: (templateName: string, sourceStatus: string, timeout = 600000) =>
      getRow(templateName, () =>
        cy.byTestID('template-source', { timeout }).should('have.text', sourceStatus),
      ),
    deleteSource: (templateName: string) => {
      getRow(templateName, () =>
        cy.byTestID('template-source').within(() => cy.get('button').click()),
      );
      cy.byTestID('delete-template-source').click();
      cy.byTestID('confirm-action').click();
    },
  },
};
