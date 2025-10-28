import * as yamlEditor from './yaml-editor';

export const listPage = {
  titleShouldHaveText: (title: string) =>
    cy.get('[data-test="page-heading"] h1').contains(title).should('exist'),
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
  isCreateButtonVisible: () => {
    cy.byTestID('item-create').should('be.visible');
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
      cy.byTestID('name-filter-input').clear().type(name);
    },
    clickSearchByDropdown: () => {
      cy.byTestID('filter-toolbar').within(() => {
        cy.byTestID('console-select-menu-toggle').click();
      });
    },
    clickFilterDropdown: () => {
      cy.byLegacyTestID('filter-dropdown-toggle').within(() => {
        cy.get('button').click();
      });
    },
    by: (rowFilter: string) => {
      cy.byTestID('filter-toolbar').within(() => {
        cy.byLegacyTestID('filter-dropdown-toggle')
          .find('button')
          .as('filterDropdownToggleButton')
          .click();
      });
      /* PF Filter dropdown menu items are:
           <li data-test-row-filter="cluster">
             <label id="cluster">
         */
      cy.get(`#${rowFilter}`).click();
      cy.url().should('include', '?rowFilter');
      cy.get('@filterDropdownToggleButton').click();
    },
  },
  dvFilter: {
    byName: (name: string) => {
      cy.get('[data-ouia-component-id="DataViewFilters"]').within(() =>
        cy.get('.pf-v6-c-menu-toggle').first().click(),
      );
      cy.get('.pf-v6-c-menu__list-item').contains('Name').click();
      cy.get('[aria-label="Name filter"]').clear().type(name);
    },
    by: (checkboxLabel: string) => {
      cy.get('[data-ouia-component-id="DataViewCheckboxFilter"]').click();
      cy.get(
        `[data-ouia-component-id="DataViewCheckboxFilter-filter-item-${checkboxLabel}"]`,
      ).click();
      cy.url().should('include', `=${checkboxLabel}`);
      cy.get('[data-ouia-component-id="DataViewCheckboxFilter"]').click();
    },
  },
  rows: {
    getFirstElementName: () => cy.get('[data-test-rows="resource-row"] a').first(),
    shouldBeLoaded: () => {
      cy.get('[data-test-rows="resource-row"]').should('be.visible');
    },
    countShouldBe: (count: number) => {
      cy.get('[data-test-rows="resource-row"]').should('have.length', count);
    },
    countShouldBeWithin: (min: number, max: number) => {
      cy.get('[data-test-rows="resource-row"]').should('have.length.within', min, max);
    },
    clickFirstLinkInFirstRow: () => {
      cy.get('[data-test-rows="resource-row"]').first().find('a').first().click({ force: true }); // after applying row filter, resource rows detached from DOM according to cypress, need to force the click
    },
    clickKebabAction: (resourceName: string, actionName: string) => {
      cy.get('[data-test-rows="resource-row"]')
        .contains(resourceName)
        .parents('tr')
        .within(() => {
          cy.get('[data-test-id="kebab-button"]').click();
        });
      cy.byTestActionID(actionName).click();
    },
    clickStatusButton: (resourceName: string) => {
      cy.get('[data-test-rows="resource-row"]')
        .contains(resourceName)
        .parents('tr')
        .within(() => {
          cy.byTestID('popover-status-button').click();
        });
    },
    hasLabel: (resourceName: string, label: string) => {
      cy.get('[data-test-rows="resource-row"]')
        .contains(resourceName)
        .byTestID('label-list')
        .contains(label);
    },
    shouldExist: (resourceName: string) =>
      cy.get('[data-test-rows="resource-row"]').contains(resourceName),
    clickRowByName: (resourceName: string) =>
      cy.get(`a[data-test-id="${resourceName}"]`).click({ force: true }), // after applying row filter, resource rows detached from DOM according to cypress, need to force the click
    shouldNotExist: (resourceName: string) =>
      cy.get(`[data-test-id="${resourceName}"]`, { timeout: 90000 }).should('not.exist'),
  },
  dvRows: {
    getFirstElementName: () => cy.get('[data-test^="data-view-cell-"]').first().find('a'),
    shouldBeLoaded: () => {
      cy.get('[data-test="data-view-table"]').should('be.visible');
    },
    countShouldBe: (count: number) => {
      cy.get('[data-test^="data-view-cell-"]').should('have.length', count);
    },
    countShouldBeWithin: (min: number, max: number) => {
      cy.get('[data-test^="data-view-cell-"]').should('have.length.within', min, max);
    },
    clickFirstLinkInFirstRow: () => {
      cy.get('[data-test^="data-view-cell-"]').first().find('a').first().click({ force: true }); // after applying row filter, resource rows detached from DOM according to cypress, need to force the click
    },
    clickKebabAction: (resourceName: string, actionName: string) => {
      cy.get(`[data-test="data-view-cell-${resourceName}-name"]`)
        .contains(resourceName)
        .parents('tr')
        .within(() => {
          cy.get('[data-test-id="kebab-button"]').click();
        });
      cy.byTestActionID(actionName).click();
    },
    clickStatusButton: (resourceName: string) => {
      cy.get(`[data-test="data-view-cell-${resourceName}-name"]`)
        .contains(resourceName)
        .parents('tr')
        .within(() => {
          cy.byTestID('popover-status-button').click();
        });
    },
    shouldExist: (resourceName: string, cellName: string = 'name') => {
      cy.get(`[data-test="data-view-cell-${resourceName}-${cellName}"]`).should('exist');
    },
    shouldNotExist: (resourceName: string) => {
      cy.get(`[data-test="data-view-cell-${resourceName}-name"]`).should('not.exist');
    },
    clickRowByName: (resourceName: string) =>
      cy.get(`[data-test="data-view-cell-${resourceName}-name"]`).find('a').click({ force: true }), // after applying row filter, resource rows detached from DOM according to cypress, need to force the click
  },
};

export namespace ListPageSelector {
  export const tableColumnHeaders = '.co-m-list th';
}
