import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { devNavigationMenu, switchPerspective } from '../../constants/global';
import { gettingStartedPO } from '../../pageObjects';
import { navigateTo, perspective, topologyPage } from '../../pages';

When('user sees first screen as {string}', (HeaderText: string) => {
  cy.get(gettingStartedPO.guidedTour.model).contains(HeaderText);
});

When('user clicks on Get started button', () => {
  cy.get(gettingStartedPO.guidedTour.primaryFooterItem).contains('Get started').click();
});

When('user sees the next screen appears as {string}', (HeaderText: string) => {
  cy.get(gettingStartedPO.guidedTour.popover).contains(HeaderText);
});

When('user clicks on the {string} button on the guided tour modal', (buttonText: string) => {
  cy.get(gettingStartedPO.guidedTour.model).find('button').contains(buttonText).click('center');
});

When('user clicks on the {string} button', (buttonText: string) => {
  cy.get(gettingStartedPO.guidedTour.popover).find('button').contains(buttonText).click('center');
});

When('user sees the final screen appears as {string}', (HeaderText: string) => {
  cy.get(gettingStartedPO.guidedTour.model).contains(HeaderText);
});

Then('user is in the topology view in the developer perspective', () => {
  topologyPage.verifyTopologyPage();
});

Given('user is in developer perspective', () => {
  perspective.switchTo(switchPerspective.Developer);
});

When(
  'user sees the button labels as {string} & {string} and "Close" button on top-right corner',
  (secondryLabel: string, primaryLabel: string) => {
    cy.get(gettingStartedPO.guidedTour.primaryFooterItem).contains(primaryLabel);
    cy.get(gettingStartedPO.guidedTour.secondaryFooterItem).contains(secondryLabel);
    cy.get(gettingStartedPO.guidedTour.closeButton).should('be.visible');
  },
);

When('user clicks on Close button', () => {
  cy.get(gettingStartedPO.guidedTour.closeButton).click();
});

When('user is in the Add page in developer perspective', () => {
  perspective.switchTo(switchPerspective.Developer);
  navigateTo(devNavigationMenu.Add);
});

When('user opens help menu on top right', () => {
  cy.byTestID('help-dropdown-toggle').should('be.visible').click();
});
When('user clicks on the {string} option', (menuOption: string) => {
  cy.get('[role="menu"]').contains(menuOption).click();
});

Then('user is taken to the first screen again', () => {
  cy.get(gettingStartedPO.guidedTour.model).contains('Welcome to the Developer Perspective!');
});
