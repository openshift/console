import { navigateTo } from '..';
import { adminNavigationBar, devNavigationMenu } from '../../constants';
import { adminNavigationMenuPO } from '../../pageObjects';
import { navigateToAdminMenu } from '../app';

const dataTestIdPref: string = 'data-test-id';

export function performResourceSearching(resourceName: string) {
  cy.get('[aria-label="Type to filter"]').click();

  cy.get('input[placeholder="Resources"]').clear().type(resourceName);
  cy.get(`label[id$="${resourceName}"]`).click();
}

export const searchResource = {
  searchResourceByNameAsDev: (resourceName: string) => {
    navigateTo(devNavigationMenu.Search);
    performResourceSearching(resourceName);
  },

  searchResourceByNameAsAdmin: (resourceName: string) => {
    // check Home menu is expanded or not
    cy.get(`${adminNavigationMenuPO.home.main}`).then(($expanded) => {
      if ($expanded.attr('aria-expanded')?.toString() === 'false') {
        navigateToAdminMenu(adminNavigationBar.Home);
      }
    });
    cy.get(adminNavigationMenuPO.home.search).click();
    performResourceSearching(resourceName);
    cy.byLegacyTestID('close-icon').should('be.visible').click({ force: true });
  },

  verifyItemInSearchResults: (item: string) => {
    cy.byLegacyTestID(`${item}`).should('be.visible');
  },

  verifyItemInSearchResultsByPreffixName: (item: string) => {
    cy.get(`[${dataTestIdPref}^=${item}]`).should('be.visible');
  },

  selectSearchedItem: (searchedItem: string) => {
    cy.get(`[${dataTestIdPref}^=${searchedItem}]`).should('be.visible').click({ force: true });
  },
};
