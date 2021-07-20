import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { quickStartCard, quickStartsPO } from '../../pageObjects';
import { quickStartsPage } from '../../pages';

When('user clicks on "View all quick starts" on Build with guided documentation card', () => {
  quickStartsPage.quickStartsCatalog();
});

Then('user can see Quick Starts catalog page', () => {
  cy.get(quickStartsPO.quickStartTitle).should('be.visible');
});

Then('user can see filter by keyword search bar', () => {
  cy.get(quickStartsPO.filterKeyword).should('be.visible');
});

Then('user can see Status filter dropdown', () => {
  cy.get(quickStartsPO.statusFilter).should('be.visible');
});

Given('user is at Quick Starts catalog page', () => {
  quickStartsPage.quickStartsCatalog();
});

When('user clicks on filter by keyword search bar', () => {
  cy.get(quickStartsPO.filterKeyword).click();
});

When('user enters {string}', (filterName: string) => {
  quickStartsPage.filterByKeyword(filterName);
});

Then('user can see {string} Quick Start', (quickStartDisplayName: string) => {
  quickStartsPage.cardPresent(quickStartCard(quickStartDisplayName));
});

Given('user is at Quick Starts catalog page', () => {
  quickStartsPage.quickStartsCatalog();
});

When('user clicks on Status filter menu', () => {
  quickStartsPage.status();
});

Then('user can see Complete, In progress and Not started categories', () => {
  cy.get(quickStartsPO.statusDropdown).contains('Complete');
  cy.get(quickStartsPO.statusDropdown).contains('In progress');
  cy.get(quickStartsPO.statusDropdown).contains('Not started');
});

Given('user is at Quick Starts catalog page', () => {
  quickStartsPage.quickStartsCatalog();
});

Given('user has completed {string} Quick Start', (quickStartDisplayName: string) => {
  quickStartsPage.executeQuickStart(quickStartCard(quickStartDisplayName));
});

When('user clicks on Status filter menu', () => {
  quickStartsPage.status();
});

When('user clicks on completed', () => {
  cy.get(quickStartsPO.statusComplete)
    .should('be.visible')
    .click();
});

Then('user can see {string} Quick Start is present', (quickStartDisplayName: string) => {
  cy.get(quickStartCard(quickStartDisplayName)).should('be.visible');
});

Given('user is at Quick Starts catalog page', () => {
  quickStartsPage.quickStartsCatalog();
});

When('user clicks on filter by keyword search bar', () => {
  cy.get(quickStartsPO.filterKeyword).click();
});

When('user enters {string}', (filterKeyword: string) => {
  quickStartsPage.filterByKeyword(filterKeyword);
});

Then('user can see "No results found" message', () => {
  cy.get(quickStartsPO.emptyState).should('be.visible');
  cy.get(quickStartsPO.emptyState).contains('No results found');
});

Then('user can see Clear all filters option', () => {
  cy.get(quickStartsPO.clearFilter).should('be.visible');
  cy.get(quickStartsPO.clearFilter).contains('Clear all filters');
});
