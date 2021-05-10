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
    testProvider: (templateName: string, provider: string) =>
      getRow(templateName, () => cy.byTestID('template-provider').should('have.text', provider)),
    testSupport: (templateName: string, support?: string, parentSupport?: string) => {
      getRow(templateName, () => cy.byTestID('template-details').click());
      if (support) {
        cy.byTestID('template-support').should('exist');
        cy.byTestID('template-provider').should('include.text', support);
      } else {
        cy.byTestID('template-support').should('exist');
        cy.byTestID('template-provider').should('include.text', 'Community');
      }
      if (parentSupport) {
        cy.byTestID('template-support-parent').should('exist');
        cy.byTestID('template-support-parent').should('have.text', parentSupport);
      } else {
        cy.byTestID('template-support-parent').should('not.exist');
      }
    },
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
    customizeSource: (templateName: string) => {
      getRow(templateName, () =>
        cy.byTestID('template-source').within(() => cy.get('button').click()),
      );
      cy.byTestID('customize-template-source').click();
      cy.get('#confirm-action').click();
    },
    launchConsole: (templateName: string) => {
      getRow(templateName, () =>
        cy.byTestID('template-source').within(() => cy.get('button').click()),
      );
      cy.byTestID('launch-console').click();
    },
    clickCreate: (templateName: string) =>
      getRow(templateName, () => cy.byTestID('create-from-template').click()),
    filter: (templateName: string) => cy.byLegacyTestID('item-filter').type(templateName),
  },
};
