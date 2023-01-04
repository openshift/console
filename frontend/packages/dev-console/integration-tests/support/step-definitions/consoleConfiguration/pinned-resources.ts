import { Then } from 'cypress-cucumber-preprocessor/steps';

Then(
  'user will see {string} and {string} pinned on the Developer Perspective navigation',
  (el1: string, el2: string) => {
    cy.get('[data-test="draggable-pinned-resource-item"]')
      .contains(el1)
      .should('be.visible');
    cy.get('[data-test="draggable-pinned-resource-item"]')
      .contains(el2)
      .should('be.visible');
  },
);
