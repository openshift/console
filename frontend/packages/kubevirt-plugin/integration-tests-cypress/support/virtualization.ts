import { createYAMLButton, loadingBox, nameFilter, resourceTitle } from '../views/selector';
import { createTemplate, createVM, templateYAML, vmYAML } from '../views/selector-wizard';

declare global {
  namespace Cypress {
    interface Chainable<Subject> {
      loaded(): Chainable<Element>;
      visitVMsList(): Chainable<Element>;
      visitVMTemplatesList(): Chainable<Element>;
      filterByName(name: string): Chainable<Element>;
      createDefaultVM(): Chainable<Element>;
      createDefaultTemplate(): Chainable<Element>;
    }
  }
}

// any command added below, must be added to global Cypress interface above
//
Cypress.Commands.add('loaded', () => {
  cy.get(loadingBox).should('be.visible');
});

Cypress.Commands.add('visitVMsList', () => {
  cy.clickNavLink(['Virtualization', 'Virtual Machines']);
});

Cypress.Commands.add('visitVMTemplatesList', () => {
  cy.clickNavLink(['Virtualization', 'Templates']);
});

Cypress.Commands.add('filterByName', (name: string) => {
  cy.get(nameFilter)
    .clear()
    .type(name);
});

Cypress.Commands.add('createDefaultVM', () => {
  cy.clickNavLink(['Virtualization', 'Virtual Machines']);
  cy.get(createVM).click();
  cy.get(vmYAML).click();
  cy.get(createYAMLButton).click();
  cy.get(resourceTitle).should('be.visible');
});

Cypress.Commands.add('createDefaultTemplate', () => {
  cy.clickNavLink(['Virtualization', 'Templates']);
  cy.get(createTemplate).click();
  cy.get(templateYAML).click();
  cy.get(createYAMLButton).click();
  cy.get(resourceTitle).should('be.visible');
});
