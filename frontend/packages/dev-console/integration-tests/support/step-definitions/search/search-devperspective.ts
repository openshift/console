import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { devNavigationMenu } from '../../constants';
import { navigateTo } from '../../pages';
import { performResourceSearching, searchResource } from '../../pages/search-resources/search-page';

Given('user is at Search page', () => {
  navigateTo(devNavigationMenu.Search);
});

When('user searches and selects for {string}', (resourceName: string) => {
  performResourceSearching(resourceName);
});

When('user navigates to Search page', () => {
  navigateTo(devNavigationMenu.Search);
});

When('user clicks on Resources filter', () => {
  cy.get('[aria-label="Options menu"]').should('be.visible').click();
});

When('user can see {string} in Recently used', (recourceName: string) => {
  cy.get('[aria-labelledby="Recently-used"]')
    .find(`[data-filter-text="AR${recourceName}"]`)
    .should('be.visible');
});

When(
  'user searches for {string}, {string}, {string}, {string}, and {string}',
  (el1, el2, el3, el4, el5: string) => {
    const sample = [el1, el2, el3, el4, el5];
    for (let i = 0; i < 5; i++) {
      searchResource.searchResourceByNameAsDev(sample[i]);
      navigateTo(devNavigationMenu.Topology);
    }
  },
);

Then(
  'user can see {string}, {string}, {string}, {string}, and {string} in Recently used',
  (el1, el2, el3, el4, el5: string) => {
    cy.get('[aria-labelledby="Recently-used"]').each(($resource) => {
      cy.wrap($resource)
        .find('label')
        .should('contains.text', el1)
        .and('contains.text', el2)
        .and('contains.text', el3)
        .and('contains.text', el4)
        .and('contains.text', el5);
    });
  },
);

When('user clicks on clear history', () => {
  cy.byLegacyTestID('close-icon').should('be.visible').click({ force: true });
});

Then('user can not see Recently used', () => {
  cy.get('[aria-labelledby="Recently-used"]').should('not.exist');
});
