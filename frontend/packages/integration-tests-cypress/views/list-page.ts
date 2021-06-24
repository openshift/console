import * as yamlEditor from './yaml-editor';

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
  createNamespacedResourceWithDefaultYAML: (resourceType: string, testName: string) => {
    cy.visit(`/k8s/ns/${testName}/${resourceType}`);
    listPage.clickCreateYAMLbutton();
    cy.byTestID('resource-sidebar').should('exist');
    yamlEditor.isLoaded();
    yamlEditor.clickSaveCreateButton();
  },
  filter: {
    byName: (name: string) => {
      cy.byTestID('name-filter-input')
        .clear()
        .type(name);
    },
    numberOfActiveFiltersShouldBe: (numFilters: number) => {
      cy.get("[class='pf-c-toolbar__item pf-m-chip-group']").should('have.length', numFilters);
    },
    clickSearchByDropdown: () => {
      cy.get('.pf-c-toolbar__content-section').within(() => {
        cy.byLegacyTestID('dropdown-button').click();
      });
    },
    clickFilterDropdown: () => {
      cy.byLegacyTestID('filter-dropdown-toggle').within(() => {
        cy.get('button').click();
      });
    },
    clearAllFilters: () => {
      cy.log('Clearing all filters');
      cy.get('.pf-c-toolbar__content').within(() => {
        cy.get('button')
          .last()
          .click();
      });
    },
    by: (rowFilter: string) => {
      cy.get('.pf-c-toolbar__content-section').within(() => {
        cy.byLegacyTestID('filter-dropdown-toggle')
          .find('button')
          .click();
        /* PF Filter dropdown menu items are:
           <li id="cluster">
             <a data-test-row-filter="cluster">
           Tried cy.get(`[data-test-row-filter="${rowFilter}"]`).click() which found the <a /> but said not clickable due to
           it's css having 'pointer-events: none'.  Tried ...click({force: true}) which did the click but page not reloaded with
           '?rowFilter=...'.
         */
        cy.get(`#${rowFilter}`).click(); // clicking on the <li /> works!
        cy.url().should('include', '?rowFilter');
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
    clickFirstLinkInFirstRow: () => {
      cy.get(`[data-test-rows="resource-row"]`)
        .first()
        .find('a')
        .first()
        .click({ force: true }); // after applying row filter, resource rows detached from DOM according to cypress, need to force the click
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
      cy.get(`a[data-test-id="${resourceName}"]`).click({ force: true }), // after applying row filter, resource rows detached from DOM according to cypress, need to force the click
    shouldNotExist: (resourceName: string) =>
      cy.get(`[data-test-id="${resourceName}"]`, { timeout: 90000 }).should('not.exist'),
  },
};

export namespace ListPageSelector {
  export const tableColumnHeaders = 'th .pf-c-table__text';
}
