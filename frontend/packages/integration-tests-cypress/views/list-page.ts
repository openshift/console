export const listPage = {
  titleShouldHaveText: (title: string) =>
    cy.byLegacyTestID('resource-title').should('have.text', title),
  clickCreateYAMLdropdownButton: () => {
    cy.byTestID('item-create')
      .click()
      .get('body')
      .then(($body) => {
        if ($body.find(`[data-test-dropdown-menu="yaml"]`).length) {
          cy.get(`[data-test-dropdown-menu="yaml"]`).click();
        }
      });
  },
  clickCreateYAMLbutton: () => {
    cy.byTestID('item-create').click({ force: true });
  },
  filter: {
    byName: (name: string) => {
      cy.byLegacyTestID('item-filter').type(name);
    },
    numberOfActiveFiltersShouldBe: (numFilters: number) => {
      cy.get("[class='pf-c-toolbar__item pf-m-chip-group']").should('have.length', numFilters);
    },
    clickSearchByDropdown: () => {
      cy.get('.pf-c-toolbar__content-section').within(() => {
        cy.byLegacyTestID('dropdown-button').click();
      });
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
        .parents('tr')
        .within(() => {
          cy.get('[data-test-id="kebab-button"]').click();
        });
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

export namespace ListPageSelector {
  export const tableColumnHeaders = 'th .pf-c-table__text';
}
