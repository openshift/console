export const listPage = {
  titleShouldHaveText: (title: string) =>
    cy.byLegacyTestID('resource-title').should('have.text', title),
  projectDropdownShouldExist: () => cy.byLegacyTestID('namespace-bar-dropdown').should('exist'),
  projectDropdownShouldContain: (name: string) =>
    cy.byLegacyTestID('namespace-bar-dropdown').contains(name),
  projectDropdownShouldNotExist: () =>
    cy.byLegacyTestID('namespace-bar-dropdown').should('not.exist'),
  clickCreateYAMLdropdownButton: () => {
    return cy
      .byLegacyTestID('dropdown-button')
      .click()
      .get('body')
      .then(($body) => {
        if ($body.find(`[data-test-dropdown-menu="yaml"]`).length) {
          cy.get(`[data-test-dropdown-menu="yaml"]`).click();
        }
      });
  },
  clickCreateYAMLbutton: () => {
    return cy.byTestID('yaml-create').click();
  },
  filter: {
    byName: (name: string) => {
      cy.byLegacyTestID('item-filter').type(name);
    },
  },
  rows: {
    shouldBeLoaded: () => {
      cy.get(`[data-test-rows="resource-row"`).should('be.visible');
    },
    countShouldBe: (count: number) => {
      cy.get(`[data-test-rows="resource-row"`).should('have.length', count);
    },
    clickKebabAction: (resourceName: string, actionName: string) => {
      cy.get(`[data-test-rows="resource-row"]`)
        .contains(resourceName)
        .byLegacyTestID('kebab-button')
        .click();
      cy.byTestActionID(actionName).click();
    },
    hasLabel: (resourceName: string, label: string) => {
      cy.get(`[data-test-rows="resource-row"]`)
        .contains(resourceName)
        .byTestID('label-list')
        .contains(label);
    },
    shouldExist: (resourceName: string) =>
      cy.get(`[data-test-rows="resource-row"]`).contains(resourceName),
    clickRowByName: (resourceName: string) =>
      cy
        .get(`[data-test-rows="resource-row"]`)
        .contains(resourceName)
        .click(),
    shouldNotExist: (resourceName: string) =>
      cy.get(`[data-test-id="${resourceName}"]`, { timeout: 90000 }).should('not.be.visible'),
  },
};
