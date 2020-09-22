import { detailsPage } from '../views/details-page';
import { listPage } from '../views/list-page';
import { modal } from '../views/modal';

declare global {
  namespace Cypress {
    interface Chainable<Subject> {
      createProject(name: string): Chainable<Element>;
      deleteProject(name: string): Chainable<Element>;
    }
  }
}

// any command added below, must be added to global Cypress interface above

// This will add to 'createProject(...)' to cy
// ex: cy.createProject(name)
Cypress.Commands.add('createProject', (name: string) => {
  cy.log(`create project`);
  cy.visit(`/k8s/cluster/projects`);
  listPage.clickCreateYAMLbutton();
  modal.shouldBeOpened();
  cy.byTestID('input-name').type(name);
  modal.submit();
  modal.shouldBeClosed();
  // TODO, switch to 'listPage.titleShouldHaveText(name)', when we switch to new test id
  cy.byLegacyTestID('resource-title').should('have.text', name);
});

Cypress.Commands.add('deleteProject', (name: string) => {
  cy.log(`delete project`);
  cy.visit(`/k8s/cluster/projects/${name}`);
  detailsPage.clickPageActionFromDropdown('Delete Project');
  modal.shouldBeOpened();
  modal.submitShouldBeDisabled();
  cy.byTestID('project-name-input').type(name);
  modal.submitShouldBeEnabled();
  modal.submit();
  modal.shouldBeClosed();
  listPage.titleShouldHaveText('Projects');
});
