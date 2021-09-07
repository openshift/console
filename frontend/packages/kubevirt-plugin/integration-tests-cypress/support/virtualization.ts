import { createYAMLButton, nameFilter, resourceTitle } from '../views/selector';
import { create, templateYAML, vmYAML } from '../views/selector-wizard';

declare global {
  namespace Cypress {
    interface Chainable<Subject> {
      visitVMsList(): Chainable<Element>;
      visitVMTemplatesList(): Chainable<Element>;
      filterByName(name: string): Chainable<Element>;
      createDefaultVM(): Chainable<Element>;
      createDefaultTemplate(): Chainable<Element>;
    }
  }
}

// any command added below, must be added to global Cypress interface above

Cypress.Commands.add('visitVMsList', () => {
  cy.clickNavLink(['Workloads', 'Virtualization']);
});

Cypress.Commands.add('visitVMTemplatesList', () => {
  cy.clickNavLink(['Workloads', 'Virtualization']);
  cy.byLegacyTestID('horizontal-link-Templates').click();
});

Cypress.Commands.add('filterByName', (name: string) => {
  cy.get(nameFilter)
    .clear()
    .type(name);
});

Cypress.Commands.add('createDefaultVM', () => {
  cy.clickNavLink(['Workloads', 'Virtualization']);
  cy.get(create).click();
  cy.get(vmYAML).click();
  cy.get(createYAMLButton).click();
  cy.get(resourceTitle).should('be.visible');
});

Cypress.Commands.add('createDefaultTemplate', () => {
  cy.clickNavLink(['Workloads', 'Virtualization']);
  cy.get(create).click();
  cy.get(templateYAML).click();
  cy.get(createYAMLButton).click();
  cy.get(resourceTitle).should('be.visible');
});
